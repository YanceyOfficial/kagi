'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useRevealTwoFactor } from '@/lib/hooks/use-2fa'
import type { TwoFactorToken } from '@/types'
import { Copy, Loader2, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { sileo } from 'sileo'

interface UseCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: TwoFactorToken
}

export function UseCodeDialog({
  open,
  onOpenChange,
  token
}: UseCodeDialogProps) {
  const [revealedCode, setRevealedCode] = useState<string | null>(null)
  const revealMutation = useRevealTwoFactor()

  function handleClose() {
    onOpenChange(false)
    // Reset after animation settles
    setTimeout(() => setRevealedCode(null), 200)
  }

  async function handleUseCode() {
    const data = await revealMutation.mutateAsync(token.id)
    setRevealedCode(data.token)
  }

  function handleCopy() {
    if (!revealedCode) return
    navigator.clipboard.writeText(revealedCode)
    sileo.success({ title: 'Code copied to clipboard' })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm font-mono">
        {revealedCode === null ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-mono text-base">
                <ShieldAlert className="size-4 shrink-0 text-amber-400" />
                Use a recovery code?
              </DialogTitle>
              <DialogDescription className="font-mono text-xs">
                A code from{' '}
                <span className="text-foreground font-semibold">
                  {token.service}
                </span>{' '}
                will be permanently removed from your vault. This cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="font-mono text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUseCode}
                disabled={revealMutation.isPending}
                className="font-mono text-xs"
              >
                {revealMutation.isPending ? (
                  <Loader2 className="mr-1.5 size-3 animate-spin" />
                ) : null}
                Yes, use a code
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-mono text-base">
                Recovery code — {token.service}
              </DialogTitle>
              <DialogDescription className="font-mono text-xs">
                Copy this code now. It has been removed from your vault and
                cannot be retrieved again.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted/30 border-primary/20 flex items-center justify-between rounded border px-4 py-3">
              <span className="text-primary font-mono text-lg font-bold tracking-widest select-all">
                {revealedCode}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 size-7 shrink-0"
                onClick={handleCopy}
              >
                <Copy className="size-3.5" />
              </Button>
            </div>

            <DialogFooter>
              <Button
                size="sm"
                onClick={handleClose}
                className="w-full font-mono text-xs"
              >
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
