'use client'

import { DeleteConfirmDialog } from '@/components/dialogs/delete-confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeleteTwoFactor, useTwoFactorTokens } from '@/lib/hooks/use-2fa'
import type { TwoFactorToken } from '@/types'
import { Plus, Search, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Create2faDialog } from './create-2fa-dialog'
import { TwoFaCard } from './two-fa-card'

export function TwoFaPageClient() {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TwoFactorToken | undefined>()

  const { data: tokens, isLoading } = useTwoFactorTokens(search || undefined)
  const deleteMutation = useDeleteTwoFactor()

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
            <ShieldCheck className="text-primary size-6" />
            2FA Recovery Tokens
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            Securely store and access your two-factor authentication backup
            codes
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="glow-green shrink-0 font-mono"
        >
          <Plus className="mr-2 size-4" />
          Add Tokens
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
        <Input
          placeholder="Search services..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 font-mono text-sm"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-lg" />
          ))}
        </div>
      ) : !tokens || tokens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 font-mono text-6xl select-none">🛡️</div>
          <p className="font-mono text-sm font-medium">
            {search
              ? 'No results match your search'
              : 'No 2FA tokens stored yet'}
          </p>
          {!search && (
            <Button
              className="mt-4 font-mono"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-2 size-4" />
              Add Recovery Tokens
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tokens.map((token) => (
            <TwoFaCard
              key={token.id}
              token={token}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <Create2faDialog open={createOpen} onOpenChange={setCreateOpen} />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Delete 2FA Token Set"
        description={`Delete all recovery tokens for "${deleteTarget?.service}"? This cannot be undone.`}
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
