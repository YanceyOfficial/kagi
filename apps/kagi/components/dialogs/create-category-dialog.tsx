'use client'

import { IconTypePicker } from '@/components/keys/simple-icon-picker'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { buildFaviconUrl, extractDomain } from '@/lib/favicon'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory
} from '@/lib/hooks/use-categories'
import { cn } from '@/lib/utils'
import type { CreateKeyCategoryInput, KeyCategory, KeyType } from '@/types'
import { useForm } from '@tanstack/react-form'
import { Loader2, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'

// Converts a service name to a valid UPPER_SNAKE_CASE env var name.
// e.g. "Github OAuth" → "GITHUB_OAUTH", "AWS S3 Bucket" → "AWS_S3_BUCKET"
function toEnvVarName(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

type FormValues = {
  name: string
  description: string
  iconSlug: string
  iconUrl: string
  keyType: KeyType
  envVarName: string
  fieldDefinitions: string[]
}

const KEY_TYPE_DESCRIPTIONS: Record<KeyType, string> = {
  simple: 'A single environment variable value (e.g. OPENAI_API_KEY)',
  group:
    'Multiple related env vars (e.g. AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)'
}

interface CreateCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTarget?: KeyCategory
}

export function CreateCategoryDialog({
  open,
  onOpenChange,
  editTarget
}: CreateCategoryDialogProps) {
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const isEditing = !!editTarget

  const { data: allCategories = [] } = useCategories()
  const existingNames = allCategories.map((c) => c.name)

  const [newField, setNewField] = useState('')
  // Tracks whether the user has manually typed in envVarName.
  // While false, the field is auto-derived from the service name.
  const userEditedEnvVar = useRef(false)

  const form = useForm({
    defaultValues: {
      name: editTarget?.name ?? '',
      description: editTarget?.description ?? '',
      iconSlug: editTarget?.iconSlug ?? '',
      iconUrl: editTarget?.iconUrl ? extractDomain(editTarget.iconUrl) : '',
      keyType: (editTarget?.keyType ?? 'simple') as KeyType,
      envVarName: editTarget?.envVarName ?? '',
      fieldDefinitions: editTarget?.fieldDefinitions ?? ([] as string[])
    } satisfies FormValues,
    onSubmit: async ({ value }) => {
      const cleaned: CreateKeyCategoryInput = {
        name: value.name,
        description: value.description || undefined,
        iconSlug: value.iconSlug || null,
        iconUrl: value.iconUrl ? buildFaviconUrl(value.iconUrl) : undefined,
        keyType: value.keyType,
        envVarName:
          value.keyType === 'simple'
            ? value.envVarName || undefined
            : undefined,
        fieldDefinitions:
          value.keyType === 'group' && value.fieldDefinitions?.length
            ? value.fieldDefinitions
            : undefined
      }

      if (isEditing && editTarget) {
        await updateMutation.mutateAsync({ id: editTarget.id, ...cleaned })
      } else {
        await createMutation.mutateAsync(cleaned)
      }
      onOpenChange(false)
      form.reset()
    }
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  // Reset form every time the dialog opens so stale state never leaks between sessions
  useEffect(() => {
    if (!open) return
    form.reset({
      name: editTarget?.name ?? '',
      description: editTarget?.description ?? '',
      iconSlug: editTarget?.iconSlug ?? '',
      iconUrl: editTarget?.iconUrl ? extractDomain(editTarget.iconUrl) : '',
      keyType: (editTarget?.keyType ?? 'simple') as KeyType,
      envVarName: editTarget?.envVarName ?? '',
      fieldDefinitions: editTarget?.fieldDefinitions ?? []
    })
    setNewField('')
    userEditedEnvVar.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-mono sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Category' : 'New Key Category'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEditing
              ? 'Update the category details below.'
              : 'Define the type and metadata for this key service.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="max-h-[70vh] space-y-4 overflow-y-auto px-1 pt-2"
        >
          {/* Service Name */}
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) => {
                const r = z.string().min(1).max(255).safeParse(value.trim())
                if (!r.success) return r.error.issues[0].message

                const conflict = existingNames
                  .filter((n) => n !== editTarget?.name)
                  .some((n) => n.toLowerCase() === value.trim().toLowerCase())
                if (conflict)
                  return `"${value.trim()}" already exists as a category`
                return undefined
              }
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs">
                  Service Name *
                </Label>
                <Input
                  placeholder="e.g. OpenAI, AWS S3, GitHub"
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value)
                    if (!userEditedEnvVar.current) {
                      form.setFieldValue(
                        'envVarName',
                        toEnvVarName(e.target.value)
                      )
                    }
                  }}
                  className={cn(
                    'font-mono text-sm',
                    field.state.meta.errors.length > 0 &&
                      'border-destructive focus-visible:ring-destructive'
                  )}
                  autoComplete="off"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-xs">
                    {String(field.state.meta.errors[0])}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Key Type */}
          <form.Field name="keyType">
            {(field) => (
              <div className="space-y-1">
                <Label className="text-xs">Key Type *</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v as KeyType)}
                >
                  <SelectTrigger className="font-mono text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="font-mono">
                    {(['simple', 'group'] as KeyType[]).map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">
                        <span className="font-medium">{t}</span> —{' '}
                        <span className="text-muted-foreground">
                          {KEY_TYPE_DESCRIPTIONS[t]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          {/* Conditional: env var name for simple type */}
          <form.Subscribe selector={(s) => s.values.keyType}>
            {(keyType) =>
              keyType === 'simple' ? (
                <form.Field name="envVarName">
                  {(field) => (
                    <div className="space-y-1">
                      <Label className="text-xs">Env Variable Name</Label>
                      <Input
                        placeholder="e.g. OPENAI_API_KEY"
                        value={field.state.value}
                        onChange={(e) => {
                          userEditedEnvVar.current = true
                          field.handleChange(e.target.value.toUpperCase())
                        }}
                        className="font-mono text-sm"
                      />
                      <p className="text-muted-foreground text-xs">
                        The environment variable name for .env file generation
                      </p>
                    </div>
                  )}
                </form.Field>
              ) : keyType === 'group' ? (
                <form.Field name="fieldDefinitions">
                  {(field) => {
                    // Guard against non-array state during type transitions
                    const defs = Array.isArray(field.state.value)
                      ? field.state.value
                      : []
                    return (
                      <div className="space-y-2">
                        <Label className="text-xs">Field Definitions</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add field name, e.g. AWS_REGION"
                            value={newField}
                            onChange={(e) =>
                              setNewField(e.target.value.toUpperCase())
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                const t = newField.trim()
                                if (t && !defs.includes(t)) {
                                  field.handleChange([...defs, t])
                                  setNewField('')
                                }
                              }
                            }}
                            className="font-mono text-sm"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const t = newField.trim()
                              if (t && !defs.includes(t)) {
                                field.handleChange([...defs, t])
                                setNewField('')
                              }
                            }}
                          >
                            <Plus className="size-4" />
                          </Button>
                        </div>
                        {defs.length > 0 && (
                          <div className="border-border bg-muted/30 flex flex-wrap gap-1.5 rounded border p-2">
                            {defs.map((f) => (
                              <span
                                key={f}
                                className="bg-secondary inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-xs"
                              >
                                {f}
                                <button
                                  type="button"
                                  onClick={() =>
                                    field.handleChange(
                                      defs.filter((x) => x !== f)
                                    )
                                  }
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <X className="size-2.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  }}
                </form.Field>
              ) : null
            }
          </form.Subscribe>

          {/* Description */}
          <form.Field name="description">
            {(field) => (
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Textarea
                  placeholder="Optional description..."
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="h-16 resize-none font-mono text-sm"
                />
              </div>
            )}
          </form.Field>

          {/* Brand Icon */}
          <form.Field name="iconSlug">
            {(field) => (
              <div className="space-y-1">
                <Label className="text-xs">Brand Icon</Label>
                <IconTypePicker
                  value={field.state.value}
                  onChange={(slug) => field.handleChange(slug)}
                />
              </div>
            )}
          </form.Field>

          {/* Logo domain → auto favicon */}
          <form.Field name="iconUrl">
            {(field) => (
              <div className="space-y-1">
                <Label className="text-xs">Service Website (optional)</Label>
                <Input
                  placeholder="e.g. openai.com"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-muted-foreground text-xs">
                  Enter a domain and we&apos;ll fetch the logo via Google&apos;s
                  favicon service. Useful when Brand Icon has no match.
                </p>
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
              {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
