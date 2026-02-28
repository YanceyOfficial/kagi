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
import { useRevealTwoFactor } from '@/lib/hooks/use-2fa'
import { cn } from '@/lib/utils'
import type { RevealedTwoFactorTokens, TwoFactorToken } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import {
  CheckSquare,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  MoreHorizontal,
  Trash2
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface TwoFaCardProps {
  token: TwoFactorToken
  onDelete: (token: TwoFactorToken) => void
}

export function TwoFaCard({ token, onDelete }: TwoFaCardProps) {
  const [revealed, setRevealed] = useState<RevealedTwoFactorTokens | null>(null)
  const [usedTokens, setUsedTokens] = useState<Set<number>>(new Set())
  const revealMutation = useRevealTwoFactor()

  async function handleReveal() {
    if (revealed) {
      setRevealed(null)
      return
    }
    const data = await revealMutation.mutateAsync(token.id)
    setRevealed(data)
  }

  function handleCopyAll() {
    if (!revealed) return
    navigator.clipboard.writeText(revealed.tokens.join('\n'))
    toast.success('All tokens copied to clipboard')
  }

  function handleCopyToken(t: string) {
    navigator.clipboard.writeText(t)
    toast.success('Token copied')
  }

  const remainingCount = token.totalCount - token.usedCount

  return (
    <Card className="group border-border bg-card/60 hover:border-primary/30 backdrop-blur transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="font-mono text-sm font-semibold">
              {token.service}
            </CardTitle>
            {token.label && (
              <CardDescription className="mt-0.5 font-mono text-xs">
                {token.label}
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
                    <DropdownMenuItem onClick={handleCopyAll}>
                      <Copy className="mr-2 size-3.5" />
                      Copy all tokens
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => onDelete(token)}
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

      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              'h-5 font-mono text-xs',
              remainingCount === 0
                ? 'border-destructive/50 text-destructive'
                : remainingCount <= 3
                  ? 'border-amber-700/50 text-amber-400'
                  : 'border-emerald-700/50 text-emerald-400'
            )}
          >
            {remainingCount} / {token.totalCount} remaining
          </Badge>
          <span className="text-muted-foreground ml-auto font-mono text-xs">
            {formatDistanceToNow(new Date(token.createdAt), {
              addSuffix: true
            })}
          </span>
        </div>

        {/* Revealed tokens list */}
        {revealed && (
          <div className="border-border bg-background/50 terminal-bg rounded border p-3">
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {revealed.tokens.map((t, i) => (
                <div
                  key={i}
                  className={cn(
                    'group/token flex items-center gap-2 rounded px-2 py-1',
                    usedTokens.has(i) && 'opacity-40'
                  )}
                >
                  <span
                    className={cn(
                      'font-mono text-xs select-all',
                      usedTokens.has(i)
                        ? 'text-muted-foreground line-through'
                        : 'text-primary'
                    )}
                  >
                    {t}
                  </span>
                  <div className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover/token:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-5 shrink-0"
                      onClick={() => handleCopyToken(t)}
                      title="Copy token"
                    >
                      <Copy className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-5 shrink-0"
                      onClick={() =>
                        setUsedTokens((prev) => {
                          const next = new Set(prev)
                          if (next.has(i)) next.delete(i)
                          else next.add(i)
                          return next
                        })
                      }
                      title={usedTokens.has(i) ? 'Mark unused' : 'Mark used'}
                    >
                      <CheckSquare className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
