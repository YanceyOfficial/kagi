'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateTwoFactor } from '@/lib/hooks/use-2fa'
import type { CreateTwoFactorTokenInput } from '@/types'
import { useForm } from '@tanstack/react-form'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

interface Create2faDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function Create2faDialog({ open, onOpenChange }: Create2faDialogProps) {
  const createMutation = useCreateTwoFactor()
  const [rawTokens, setRawTokens] = useState('')

  const form = useForm({
    defaultValues: {
      service: '',
      label: ''
    },
    onSubmit: async ({ value }) => {
      // Parse tokens: split by newline, space, or comma; filter empties
      const tokens = rawTokens
        .split(/[\n\r,\s]+/)
        .map((t) => t.trim())
        .filter(Boolean)

      if (tokens.length === 0) return

      const data: CreateTwoFactorTokenInput = {
        service: value.service,
        label: value.label || undefined,
        tokens
      }

      await createMutation.mutateAsync(data)
      onOpenChange(false)
      form.reset()
      setRawTokens('')
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg font-mono">
        <DialogHeader>
          <DialogTitle>Add 2FA Recovery Tokens</DialogTitle>
          <DialogDescription className="text-xs">
            Tokens will be encrypted before storage. Paste them one per line or
            comma-separated.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="space-y-4 pt-2"
        >
          <form.Field
            name="service"
            validators={{
              onChange: ({ value }) =>
                !value.trim() ? 'Service name is required' : undefined
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <Label className="text-xs">Service Name *</Label>
                <Input
                  placeholder="e.g. GitHub, Google, Discord"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="font-mono text-sm"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-xs">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="label">
            {(field) => (
              <div className="space-y-1">
                <Label className="text-xs">Label (optional)</Label>
                <Input
                  placeholder="e.g. Work Account, Personal"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            )}
          </form.Field>

          <div className="space-y-1">
            <Label className="text-xs">Recovery Tokens *</Label>
            <Textarea
              placeholder={`One token per line:\nABCD-1234-EFGH\nIJKL-5678-MNOP\n...`}
              value={rawTokens}
              onChange={(e) => setRawTokens(e.target.value)}
              className="h-40 resize-none font-mono text-xs"
            />
            <p className="text-muted-foreground text-xs">
              {rawTokens.split(/[\n\r,\s]+/).filter(Boolean).length} token(s)
              detected
            </p>
          </div>

          <div className="border-border flex justify-end gap-2 border-t pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
              className="font-mono text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="font-mono text-sm"
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 size-3.5 animate-spin" />
              )}
              Save Tokens
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
