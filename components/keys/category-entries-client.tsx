'use client'

import { CreateEntryDialog } from '@/components/dialogs/create-entry-dialog'
import { DeleteConfirmDialog } from '@/components/dialogs/delete-confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategories } from '@/lib/hooks/use-categories'
import { useDeleteEntry, useEntries } from '@/lib/hooks/use-entries'
import type { Environment, KeyEntryWithCategory } from '@/types'
import { Filter, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { CategoryIcon } from './category-icon'
import { EntryCard } from './entry-card'
import { KeyTypeBadge } from './key-type-badge'

interface CategoryEntriesClientProps {
  categoryId: string
}

const ALL_ENVS = 'all'

export function CategoryEntriesClient({
  categoryId
}: CategoryEntriesClientProps) {
  const [search, setSearch] = useState('')
  const [envFilter, setEnvFilter] = useState<string>(ALL_ENVS)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<
    KeyEntryWithCategory | undefined
  >()
  const [deleteTarget, setDeleteTarget] = useState<
    KeyEntryWithCategory | undefined
  >()

  const { data: categories } = useCategories()
  const category = categories?.find((c) => c.id === categoryId)

  const { data: entries, isLoading } = useEntries(
    categoryId,
    search || undefined
  )
  const deleteMutation = useDeleteEntry()

  const filteredEntries =
    envFilter === ALL_ENVS
      ? entries
      : entries?.filter((e) => e.environment === envFilter)

  function handleEdit(entry: KeyEntryWithCategory) {
    setEditTarget(entry)
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

  if (!category) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <CategoryIcon category={category} size="lg" />
          <div>
            <h1 className="font-mono text-2xl font-bold">{category.name}</h1>
            <div className="mt-1 flex items-center gap-2">
              <KeyTypeBadge type={category.keyType} />
              {category.entryCount !== undefined && (
                <Badge variant="secondary" className="font-mono text-xs">
                  {category.entryCount} entries
                </Badge>
              )}
            </div>
            {category.description && (
              <p className="text-muted-foreground mt-1 font-mono text-xs">
                {category.description}
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="glow-green shrink-0 font-mono"
        >
          <Plus className="mr-2 size-4" />
          Add Entry
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
          <Input
            placeholder="Search entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 font-mono text-sm"
          />
        </div>
        <Select value={envFilter} onValueChange={setEnvFilter}>
          <SelectTrigger className="font-mono text-sm">
            <Filter className="mr-2 size-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="font-mono">
            <SelectItem value={ALL_ENVS}>All environments</SelectItem>
            {(
              ['production', 'staging', 'development', 'local'] as Environment[]
            ).map((env) => (
              <SelectItem key={env} value={env}>
                {env}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Entries grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-lg" />
          ))}
        </div>
      ) : !filteredEntries || filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 font-mono text-5xl select-none">📭</div>
          <p className="font-mono text-sm font-medium">
            {search || envFilter !== ALL_ENVS
              ? 'No entries match your filters'
              : 'No entries yet'}
          </p>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            {!search && envFilter === ALL_ENVS && 'Add your first key entry'}
          </p>
          {!search && envFilter === ALL_ENVS && (
            <Button
              className="mt-4 font-mono"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-2 size-4" />
              Add Entry
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {createOpen && (
        <CreateEntryDialog
          open={createOpen}
          onOpenChange={handleCloseDialog}
          category={category}
          editTarget={editTarget}
        />
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Delete Entry"
        description={`Delete "${deleteTarget?.projectName}" entry? This cannot be undone and the key value will be permanently lost.`}
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
