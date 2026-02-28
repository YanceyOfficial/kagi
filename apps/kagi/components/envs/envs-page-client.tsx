'use client'

import { CreateEnvProjectDialog } from '@/components/dialogs/create-env-project-dialog'
import { DeleteConfirmDialog } from '@/components/dialogs/delete-confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeleteEnvProject, useEnvProjects } from '@/lib/hooks/use-envs'
import type { EnvProject } from '@/types'
import { FolderDot, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { EnvProjectCard } from './env-project-card'

export function EnvsPageClient() {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<EnvProject | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<EnvProject | undefined>()

  const { data: projects, isLoading } = useEnvProjects(search || undefined)
  const deleteMutation = useDeleteEnvProject()

  function handleEdit(project: EnvProject) {
    setEditTarget(project)
    setCreateOpen(true)
  }

  function handleCloseDialog(open: boolean) {
    setCreateOpen(open)
    if (!open) setEditTarget(undefined)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await deleteMutation.mutateAsync(deleteTarget.id)
    setDeleteTarget(undefined)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-mono text-2xl font-bold">
            <FolderDot className="text-primary size-6" />
            Env Manager
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            Store and manage encrypted .env files per project
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="glow-green shrink-0 font-mono"
        >
          <Plus className="mr-2 size-4" />
          New Project
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 font-mono text-sm"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : !projects || projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 font-mono text-6xl select-none">📁</div>
          <p className="font-mono text-sm font-medium">
            {search ? 'No projects match your search' : 'No env projects yet'}
          </p>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            {!search && 'Create your first project to start storing .env files'}
          </p>
          {!search && (
            <Button
              className="mt-4 font-mono"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-2 size-4" />
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <EnvProjectCard
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <CreateEnvProjectDialog
        open={createOpen}
        onOpenChange={handleCloseDialog}
        editTarget={editTarget}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Delete Project"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? All env files in this project will also be deleted. This cannot be undone.`}
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
