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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateEntry,
  useUpdateEntry,
  useUploadFile
} from '@/lib/hooks/use-entries'
import { cn } from '@/lib/utils'
import type {
  CreateKeyEntryInput,
  Environment,
  KeyCategory,
  KeyEntryWithCategory
} from '@/types'
import { useForm } from '@tanstack/react-form'
import { Loader2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

const ENVIRONMENTS: Environment[] = [
  'production',
  'staging',
  'development',
  'local'
]

interface CreateEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: KeyCategory
  editTarget?: KeyEntryWithCategory
}

export function CreateEntryDialog({
  open,
  onOpenChange,
  category,
  editTarget
}: CreateEntryDialogProps) {
  const createMutation = useCreateEntry()
  const updateMutation = useUpdateEntry()
  const uploadMutation = useUploadFile()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [groupValues, setGroupValues] = useState<Record<string, string>>(
    editTarget
      ? {}
      : (category.fieldDefinitions?.reduce(
          (acc, f) => ({ ...acc, [f]: '' }),
          {}
        ) ?? {})
  )

  const isEditing = !!editTarget
  const isFile = category.keyType === 'ssh' || category.keyType === 'json'
  const isGroup = category.keyType === 'group'
  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm({
    defaultValues: {
      projectName: editTarget?.projectName ?? '',
      description: editTarget?.description ?? '',
      environment: (editTarget?.environment ?? 'production') as Environment,
      value: '',
      fileName: editTarget?.fileName ?? '',
      notes: editTarget?.notes ?? '',
      expiresAt: editTarget?.expiresAt
        ? new Date(editTarget.expiresAt).toISOString().split('T')[0]
        : ''
    },
    onSubmit: async ({ value }) => {
      let submitValue: string | Record<string, string>

      if (isGroup) {
        submitValue = groupValues
      } else {
        submitValue = value.value
      }

      const data: CreateKeyEntryInput = {
        categoryId: category.id,
        projectName: value.projectName,
        description: value.description || undefined,
        environment: value.environment,
        value: submitValue,
        fileName: value.fileName || undefined,
        notes: value.notes || undefined,
        expiresAt: value.expiresAt
          ? new Date(value.expiresAt).toISOString()
          : undefined
      }

      if (isEditing && editTarget) {
        await updateMutation.mutateAsync({ id: editTarget.id, ...data })
      } else {
        await createMutation.mutateAsync(data)
      }
      onOpenChange(false)
    }
  })

  async function handleFileDrop(file: File) {
    const result = await uploadMutation.mutateAsync(file)
    form.setFieldValue('value', result.content)
    form.setFieldValue('fileName', result.fileName)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(true)
  }

  function handleDragLeave() {
    setDragActive(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileDrop(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto font-mono">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Key Entry' : `New Entry — ${category.name}`}
          </DialogTitle>
          <DialogDescription className="text-xs">
            The key value will be encrypted before storage.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="space-y-4 pt-2"
        >
          {/* Project name */}
          <form.Field
            name="projectName"
            validators={{
              onChange: ({ value }) =>
                !value.trim() ? 'Project name is required' : undefined
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <Label className="text-xs">Project Name *</Label>
                <Input
                  placeholder="e.g. Blog, Main App, Personal"
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

          {/* Environment */}
          <form.Field name="environment">
            {(field) => (
              <div className="space-y-1">
                <Label className="text-xs">Environment</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v as Environment)}
                >
                  <SelectTrigger className="font-mono text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="font-mono">
                    {ENVIRONMENTS.map((env) => (
                      <SelectItem key={env} value={env} className="text-xs">
                        {env}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          {/* Key value — varies by type */}
          {isGroup ? (
            <div className="space-y-2">
              <Label className="text-xs">Key Values *</Label>
              <div className="border-border bg-muted/20 space-y-2 rounded border p-3">
                {(category.fieldDefinitions ?? []).map((field) => (
                  <div
                    key={field}
                    className="grid grid-cols-5 items-center gap-2"
                  >
                    <Label className="text-muted-foreground col-span-2 truncate text-xs">
                      {field}
                    </Label>
                    <Input
                      className="col-span-3 font-mono text-xs"
                      type="password"
                      placeholder="value"
                      value={groupValues[field] ?? ''}
                      onChange={(e) =>
                        setGroupValues((prev) => ({
                          ...prev,
                          [field]: e.target.value
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : isFile ? (
            <div className="space-y-1">
              <Label className="text-xs">
                {category.keyType === 'ssh'
                  ? 'SSH Private Key File'
                  : 'JSON Credential File'}
              </Label>
              <div
                className={cn(
                  'cursor-pointer rounded border-2 border-dashed p-6 text-center transition-colors',
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={
                    category.keyType === 'json' ? '.json,application/json' : '*'
                  }
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFileDrop(f)
                  }}
                />
                {uploadMutation.isPending ? (
                  <Loader2 className="text-primary mx-auto size-8 animate-spin" />
                ) : (
                  <>
                    <Upload className="text-muted-foreground mx-auto size-8" />
                    <p className="text-muted-foreground mt-2 text-xs">
                      Drag & drop or click to upload
                    </p>
                  </>
                )}
              </div>
              <form.Subscribe selector={(s) => s.values.fileName}>
                {(fileName) =>
                  fileName ? (
                    <p className="text-primary font-mono text-xs">
                      ✓ {fileName} loaded
                    </p>
                  ) : null
                }
              </form.Subscribe>
              {/* Also allow pasting raw content */}
              <form.Field name="value">
                {(field) => (
                  <Textarea
                    placeholder="Or paste the file content directly..."
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="mt-2 h-24 resize-none font-mono text-xs"
                  />
                )}
              </form.Field>
            </div>
          ) : (
            <form.Field
              name="value"
              validators={{
                onChange: ({ value }) =>
                  !isEditing && !value.trim()
                    ? 'Key value is required'
                    : undefined
              }}
            >
              {(field) => (
                <div className="space-y-1">
                  <Label className="text-xs">
                    Key Value{' '}
                    {category.envVarName && `(${category.envVarName})`}
                    {!isEditing && ' *'}
                  </Label>
                  <Textarea
                    placeholder={
                      isEditing
                        ? 'Leave blank to keep current value'
                        : 'Paste the secret value here...'
                    }
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="h-20 resize-none font-mono text-xs"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-xs">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          )}

          {/* Description */}
          <form.Field name="description">
            {(field) => (
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Input
                  placeholder="Optional description..."
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            )}
          </form.Field>

          {/* Notes + Expiry row */}
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="notes">
              {(field) => (
                <div className="space-y-1">
                  <Label className="text-xs">Notes</Label>
                  <Textarea
                    placeholder="Any notes..."
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="h-16 resize-none font-mono text-xs"
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="expiresAt">
              {(field) => (
                <div className="space-y-1">
                  <Label className="text-xs">Expires On</Label>
                  <Input
                    type="date"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              )}
            </form.Field>
          </div>

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
              {isEditing ? 'Save Changes' : 'Save Key'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
