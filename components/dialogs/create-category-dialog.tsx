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
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory
} from '@/lib/hooks/use-categories'
import { cn } from '@/lib/utils'
import type { CreateKeyCategoryInput, KeyCategory, KeyType } from '@/types'
import { useForm } from '@tanstack/react-form'
import { Check, Loader2, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'

// ─── Service Name Combobox ────────────────────────────────────────────────────

interface ServiceNameComboboxProps {
  value: string
  onChange: (value: string) => void
  // Names that already have a category (used for deduplication hints)
  existingNames: string[]
  // When editing, exclude the current entry's own name from conflict checks
  excludeName?: string
  error?: string
}

function ServiceNameCombobox({
  value,
  onChange,
  existingNames,
  excludeName,
  error
}: ServiceNameComboboxProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const trimmed = value.trim()

  // Names to show in dropdown: filter by current input, excluding own name
  const suggestions = existingNames.filter(
    (n) => n !== excludeName && n.toLowerCase().includes(trimmed.toLowerCase())
  )

  // True when the typed value exactly matches an existing name (conflict)
  const isConflict =
    trimmed.length > 0 &&
    existingNames
      .filter((n) => n !== excludeName)
      .some((n) => n.toLowerCase() === trimmed.toLowerCase())

  // True when the typed value is new (show "Create" option)
  const isNew =
    trimmed.length > 0 &&
    !existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())

  // Close dropdown on click outside
  useEffect(() => {
    if (!open) return
    function handleMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  function select(name: string) {
    onChange(name)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        placeholder="e.g. OpenAI, AWS S3, GitHub"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
        className={cn(
          'font-mono text-sm',
          isConflict && 'border-destructive focus-visible:ring-destructive'
        )}
        autoComplete="off"
      />

      {/* Dropdown */}
      {open && (suggestions.length > 0 || isNew) && (
        <div className="bg-popover border-border absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-md border shadow-md">
          {suggestions.length > 0 && (
            <div className="border-border border-b px-2 py-1">
              <p className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
                Existing services
              </p>
            </div>
          )}
          <div className="max-h-40 overflow-y-auto">
            {suggestions.map((name) => (
              <button
                key={name}
                type="button"
                onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                onClick={() => select(name)}
                className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-sm"
              >
                <Check
                  className={cn(
                    'size-3 shrink-0',
                    name.toLowerCase() === trimmed.toLowerCase()
                      ? 'opacity-100'
                      : 'opacity-0'
                  )}
                />
                {name}
                <span className="text-muted-foreground ml-auto text-xs">
                  existing
                </span>
              </button>
            ))}

            {/* Create new option */}
            {isNew && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(trimmed)}
                className="text-primary hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-sm"
              >
                <Plus className="size-3 shrink-0" />
                Create &ldquo;{trimmed}&rdquo;
              </button>
            )}
          </div>
        </div>
      )}

      {/* Validation messages */}
      {isConflict && !error && (
        <p className="text-destructive mt-1 text-xs">
          A category named &ldquo;{trimmed}&rdquo; already exists. Select it
          above or choose a different name.
        </p>
      )}
      {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
    </div>
  )
}

// ─── Google Favicon helpers ───────────────────────────────────────────────────

function buildFaviconUrl(input: string): string {
  const url = input.startsWith('http') ? input : `https://${input}`
  return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(url)}&size=128`
}

// When editing, extract the original domain from a stored Google favicon URL
function extractDomain(stored: string): string {
  try {
    const target = new URL(stored).searchParams.get('url')
    if (target) return new URL(target).hostname
  } catch {}
  return stored
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
    'Multiple related env vars (e.g. AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)',
  ssh: 'An SSH private key file (.pem, id_rsa, etc.)',
  json: 'A JSON credential file (e.g. Google service account)'
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
          {/* Service Name — searchable combobox with uniqueness check */}
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
                <ServiceNameCombobox
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                  existingNames={existingNames}
                  excludeName={editTarget?.name}
                  error={
                    field.state.meta.errors.length > 0
                      ? String(field.state.meta.errors[0])
                      : undefined
                  }
                />
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
                    {(['simple', 'group', 'ssh', 'json'] as KeyType[]).map(
                      (t) => (
                        <SelectItem key={t} value={t} className="text-xs">
                          <span className="font-medium">{t}</span> —{' '}
                          <span className="text-muted-foreground">
                            {KEY_TYPE_DESCRIPTIONS[t]}
                          </span>
                        </SelectItem>
                      )
                    )}
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
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="font-mono text-sm uppercase"
                      />
                      <p className="text-muted-foreground text-xs">
                        The environment variable name for .env file generation
                      </p>
                    </div>
                  )}
                </form.Field>
              ) : keyType === 'group' ? (
                <form.Field name="fieldDefinitions">
                  {(field) => (
                    <div className="space-y-2">
                      <Label className="text-xs">Field Definitions</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add field name, e.g. AWS_REGION"
                          value={newField}
                          onChange={(e) => setNewField(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              const t = newField.trim().toUpperCase()
                              if (t && !field.state.value.includes(t)) {
                                field.handleChange([...field.state.value, t])
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
                            const t = newField.trim().toUpperCase()
                            if (t && !field.state.value.includes(t)) {
                              field.handleChange([...field.state.value, t])
                              setNewField('')
                            }
                          }}
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                      {field.state.value.length > 0 && (
                        <div className="border-border bg-muted/30 flex flex-wrap gap-1.5 rounded border p-2">
                          {field.state.value.map((f) => (
                            <span
                              key={f}
                              className="bg-secondary inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-xs"
                            >
                              {f}
                              <button
                                type="button"
                                onClick={() =>
                                  field.handleChange(
                                    field.state.value.filter((x) => x !== f)
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
                  )}
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
