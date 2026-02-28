'use client'

import { CreateEnvProjectDialog } from '@/components/dialogs/create-env-project-dialog'
import { DeleteConfirmDialog } from '@/components/dialogs/delete-confirm-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDeleteEnvProject, useEnvProject } from '@/lib/hooks/use-envs'
import { ENV_FILE_TYPES, type EnvFile, type EnvFileType, type EnvProject } from '@/types'
import { ArrowLeft, FolderDot, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { EnvFileTab } from './env-file-tab'

const FILE_TYPE_LABELS: Record<EnvFileType, string> = {
  env: '.env',
  'env.local': '.env.local',
  'env.production': '.env.production',
  'env.development': '.env.development'
}

export function EnvProjectDetailClient() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: project, isLoading } = useEnvProject(id)
  const deleteMutation = useDeleteEnvProject()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function handleConfirmDelete() {
    await deleteMutation.mutateAsync(id)
    router.push('/envs')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="font-mono text-sm">Project not found</p>
        <Link
          href="/envs"
          className="text-primary mt-2 font-mono text-sm hover:underline"
        >
          Back to Env Manager
        </Link>
      </div>
    )
  }

  function getFileForType(fileType: EnvFileType): EnvFile | undefined {
    return project?.files.find((f) => f.fileType === fileType)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Link
            href="/envs"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-mono text-xs transition-colors"
          >
            <ArrowLeft className="size-3" />
            Env Manager
          </Link>
          <h1 className="flex items-center gap-2 font-mono text-2xl font-bold">
            <FolderDot className="text-primary size-5" />
            {project.name}
          </h1>
          {project.description && (
            <p className="text-muted-foreground font-mono text-sm">
              {project.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="font-mono text-xs"
          >
            <Pencil className="mr-1.5 size-3" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="text-destructive hover:text-destructive font-mono text-xs"
          >
            <Trash2 className="mr-1.5 size-3" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="env">
        <TabsList className="font-mono">
          {ENV_FILE_TYPES.map((fileType) => (
            <TabsTrigger key={fileType} value={fileType} className="text-xs">
              {FILE_TYPE_LABELS[fileType]}
            </TabsTrigger>
          ))}
        </TabsList>

        {ENV_FILE_TYPES.map((fileType) => (
          <TabsContent key={fileType} value={fileType} className="mt-4">
            <EnvFileTab
              projectId={id}
              fileType={fileType}
              existingFile={getFileForType(fileType)}
            />
          </TabsContent>
        ))}
      </Tabs>

      <CreateEnvProjectDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editTarget={project as EnvProject}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Project"
        description={`Are you sure you want to delete "${project.name}"? All env files will be permanently deleted. This cannot be undone.`}
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
