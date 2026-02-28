'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useRevealEntry } from '@/lib/hooks/use-entries'
import { cn } from '@/lib/utils'
import type { KeyEntryWithCategory, RevealedKeyValue } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import {
  Copy,
  Download,
  Eye,
  EyeOff,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const ENV_COLORS: Record<string, string> = {
  production: 'border-emerald-700/50 bg-emerald-950/30 text-emerald-400',
  staging: 'border-amber-700/50 bg-amber-950/30 text-amber-400',
  development: 'border-blue-700/50 bg-blue-950/30 text-blue-400',
  local: 'border-zinc-700/50 bg-zinc-950/30 text-zinc-400'
}

interface EntryCardProps {
  entry: KeyEntryWithCategory
  onEdit: (entry: KeyEntryWithCategory) => void
  onDelete: (entry: KeyEntryWithCategory) => void
}

export function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const [revealed, setRevealed] = useState<RevealedKeyValue | null>(null)
  const revealMutation = useRevealEntry()

  async function handleReveal() {
    if (revealed) {
      setRevealed(null)
      return
    }
    const data = await revealMutation.mutateAsync(entry.id)
    setRevealed(data)
  }

  function handleCopy() {
    if (!revealed) return
    let text: string
    if (typeof revealed.value === 'string') {
      text = revealed.value
    } else {
      text = Object.entries(revealed.value)
        .map(([k, v]) => `${k}="${v}"`)
        .join('\n')
    }
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  function handleDownload() {
    if (!revealed) return
    let content: string
    let filename = entry.fileName ?? 'key'

    if (typeof revealed.value === 'string') {
      content = revealed.value
    } else {
      content = Object.entries(revealed.value)
        .map(([k, v]) => `${k}="${v}"`)
        .join('\n')
      filename = `${entry.projectName}.env`
    }

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const now = new Date()
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const isExpired = entry.expiresAt ? new Date(entry.expiresAt) < now : false
  const isExpiringSoon =
    !isExpired &&
    entry.expiresAt != null &&
    new Date(entry.expiresAt) < thirtyDays

  return (
    <Card
      className={cn(
        'border-border bg-card/60 group backdrop-blur transition-all duration-200',
        isExpired && 'border-destructive/40',
        !isExpired && 'hover:border-primary/30'
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 font-mono text-sm font-semibold">
              {entry.projectName}
              {isExpired && (
                <Badge variant="destructive" className="h-4 font-mono text-xs">
                  Expired
                </Badge>
              )}
              {isExpiringSoon && !isExpired && (
                <Badge
                  variant="outline"
                  className="h-4 border-amber-700/50 font-mono text-xs text-amber-400"
                >
                  Expiring
                </Badge>
              )}
            </CardTitle>
            {entry.description && (
              <CardDescription className="mt-0.5 line-clamp-1 font-mono text-xs">
                {entry.description}
              </CardDescription>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={handleReveal}
              disabled={revealMutation.isPending}
              title={revealed ? 'Hide key' : 'Reveal key'}
            >
              {revealMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : revealed ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7">
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="font-mono">
                {revealed && (
                  <>
                    <DropdownMenuItem onClick={handleCopy}>
                      <Copy className="mr-2 size-3.5" />
                      Copy value
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownload}>
                      <Download className="mr-2 size-3.5" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => onEdit(entry)}>
                  <Pencil className="mr-2 size-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(entry)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              'h-5 font-mono text-xs',
              ENV_COLORS[entry.environment] ?? ''
            )}
          >
            {entry.environment}
          </Badge>
          {entry.fileName && (
            <Badge
              variant="outline"
              className="border-muted text-muted-foreground h-5 font-mono text-xs"
            >
              {entry.fileName}
            </Badge>
          )}
          <span className="text-muted-foreground ml-auto font-mono text-xs">
            {formatDistanceToNow(new Date(entry.createdAt), {
              addSuffix: true
            })}
          </span>
        </div>

        {/* Revealed value display */}
        {revealed && (
          <div className="border-border bg-background/50 terminal-bg mt-2 rounded-md border p-3">
            {typeof revealed.value === 'string' ? (
              <div className="space-y-1">
                {revealed.envVarName && (
                  <p className="text-muted-foreground font-mono text-xs">
                    {revealed.envVarName}=
                  </p>
                )}
                <p className="text-primary font-mono text-xs break-all select-all">
                  {revealed.value}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {Object.entries(revealed.value).map(([key, val]) => (
                  <div key={key} className="flex gap-2">
                    <span className="text-muted-foreground shrink-0 font-mono text-xs">
                      {key}=
                    </span>
                    <span className="text-primary font-mono text-xs break-all select-all">
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {entry.notes && (
          <p className="text-muted-foreground border-border mt-2 border-t pt-2 font-mono text-xs">
            {entry.notes}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
