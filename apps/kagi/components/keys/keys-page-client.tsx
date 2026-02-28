'use client'

import { CreateCategoryDialog } from '@/components/dialogs/create-category-dialog'
import { DeleteConfirmDialog } from '@/components/dialogs/delete-confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategories, useDeleteCategory } from '@/lib/hooks/use-categories'
import type { KeyCategory } from '@/types'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { CategoryCard } from './category-card'

export function KeysPageClient() {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<KeyCategory | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<KeyCategory | undefined>()

  const { data: categories, isLoading } = useCategories(search || undefined)
  const deleteMutation = useDeleteCategory()

  function handleEdit(category: KeyCategory) {
    setEditTarget(category)
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
          <h1 className="font-mono text-2xl font-bold">Key Categories</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            Manage your key services and their entries
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="glow-green shrink-0 font-mono"
        >
          <Plus className="mr-2 size-4" />
          New Category
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
        <Input
          placeholder="Search categories..."
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
      ) : !categories || categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 font-mono text-6xl select-none">🔑</div>
          <p className="font-mono text-sm font-medium">
            {search
              ? 'No categories match your search'
              : 'No key categories yet'}
          </p>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            {!search && 'Create your first category to get started'}
          </p>
          {!search && (
            <Button
              className="mt-4 font-mono"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-2 size-4" />
              Create Category
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <CreateCategoryDialog
        open={createOpen}
        onOpenChange={handleCloseDialog}
        editTarget={editTarget}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? All key entries under this category will also be deleted. This cannot be undone.`}
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
