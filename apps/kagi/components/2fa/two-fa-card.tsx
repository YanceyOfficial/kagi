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
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { TwoFactorToken } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { KeyRound, MoreHorizontal, ShieldOff, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { UseCodeDialog } from './use-code-dialog'

interface TwoFaCardProps {
  token: TwoFactorToken
  onDelete: (token: TwoFactorToken) => void
}

export function TwoFaCard({ token, onDelete }: TwoFaCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const remaining = token.totalCount - token.usedCount
  const isDepleted = remaining === 0

  return (
    <>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7">
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="font-mono">
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
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                'h-5 font-mono text-xs',
                isDepleted
                  ? 'border-destructive/50 text-destructive'
                  : remaining <= 3
                    ? 'border-amber-700/50 text-amber-400'
                    : 'border-emerald-700/50 text-emerald-400'
              )}
            >
              {isDepleted
                ? 'Depleted'
                : `${remaining} / ${token.totalCount} remaining`}
            </Badge>
            <span className="text-muted-foreground ml-auto font-mono text-xs">
              {formatDistanceToNow(new Date(token.createdAt), {
                addSuffix: true
              })}
            </span>
          </div>

          {isDepleted ? (
            <div className="border-destructive/30 flex items-center gap-2 rounded border border-dashed px-3 py-2">
              <ShieldOff className="text-destructive/60 size-3.5 shrink-0" />
              <p className="text-muted-foreground font-mono text-xs">
                All codes have been used
              </p>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full font-mono text-xs"
              onClick={() => setDialogOpen(true)}
            >
              <KeyRound className="mr-1.5 size-3" />
              Use a code
            </Button>
          )}
        </CardContent>
      </Card>

      <UseCodeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        token={token}
      />
    </>
  )
}
