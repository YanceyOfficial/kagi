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
import {
  useCreateEnvProject,
  useUpdateEnvProject
} from '@/lib/hooks/use-envs'
import type { EnvProject } from '@/types'
import { useForm } from '@tanstack/react-form'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { z } from 'zod'

interface CreateEnvProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTarget?: EnvProject
}

export function CreateEnvProjectDialog({
  open,
  onOpenChange,
  editTarget
}: CreateEnvProjectDialogProps) {
  const createMutation = useCreateEnvProject()
  const updateMutation = useUpdateEnvProject()
  const isEditing = !!editTarget

  const form = useForm({
    defaultValues: {
      name: editTarget?.name ?? '',
      description: editTarget?.description ?? ''
    },
    onSubmit: async ({ value }) => {
      if (isEditing && editTarget) {
        await updateMutation.mutateAsync({
          id: editTarget.id,
          name: value.name,
          description: value.description || undefined
        })
      } else {
        await createMutation.mutateAsync({
          name: value.name,
          description: value.description || undefined
        })
      }
      onOpenChange(false)
      form.reset()
    }
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (!open) return
    form.reset({
      name: editTarget?.name ?? '',
      description: editTarget?.description ?? ''
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-mono sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Project' : 'New Env Project'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEditing
              ? 'Update the project details below.'
              : 'Create a new project to store your .env files.'}
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
            name="name"
            validators={{
              onChange: ({ value }) => {
                const r = z.string().min(1).max(255).safeParse(value.trim())
                if (!r.success) return r.error.issues[0].message
                return undefined
              }
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <Label htmlFor="project-name" className="text-xs">
                  Project Name *
                </Label>
                <Input
                  id="project-name"
                  placeholder="e.g. My Next.js App"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="font-mono text-sm"
                  autoFocus
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-xs">
                    {String(field.state.meta.errors[0])}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="description">
            {(field) => (
              <div className="space-y-1">
                <Label htmlFor="project-description" className="text-xs">
                  Description
                </Label>
                <Textarea
                  id="project-description"
                  placeholder="Optional description..."
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="h-20 resize-none font-mono text-sm"
                />
              </div>
            )}
          </form.Field>

          <div className="border-border flex justify-end gap-2 border-t pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="font-mono text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="font-mono text-sm"
            >
              {isPending && (
                <Loader2 className="mr-2 size-3.5 animate-spin" />
              )}
              {isEditing ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
