'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ALL_SCOPES,
  SCOPE_DESCRIPTIONS,
  type AccessKeyScope
} from '@/lib/access-key'
import { signOut } from '@/lib/auth/client'
import {
  useAccessKeys,
  useCreateAccessKey,
  useRevokeAccessKey
} from '@/lib/hooks/use-access-keys'
import type { AccessKey, CreateAccessKeyResponse } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import {
  Check,
  Copy,
  Download,
  KeyRound,
  Loader2,
  Lock,
  Plus,
  ShieldCheck,
  Terminal,
  Trash2,
  User
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface SettingsClientProps {
  user: {
    name: string
    email: string
    image: string | null
    createdAt: Date | string
  }
  stats: {
    categories: number
    entries: number
    twoFaSets: number
  }
}

export function SettingsClient({ user, stats }: SettingsClientProps) {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const memberSince = formatDistanceToNow(new Date(user.createdAt), {
    addSuffix: true
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Profile */}
      <Card className="border-border bg-card/60 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="text-primary size-4" />
            <CardTitle className="font-mono text-sm">Profile</CardTitle>
          </div>
          <CardDescription className="font-mono text-xs">
            Identity managed via Keycloak SSO
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="size-14 rounded-lg">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className="bg-primary/15 text-primary rounded-lg font-mono text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-mono text-sm font-semibold">{user.name}</p>
              <p className="text-muted-foreground font-mono text-xs">
                {user.email}
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <Badge variant="secondary" className="font-mono text-[10px]">
                  Keycloak SSO
                </Badge>
                <span className="text-muted-foreground font-mono text-[10px]">
                  joined {memberSince}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-border bg-card/60 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lock className="text-primary size-4" />
            <CardTitle className="font-mono text-sm">Security</CardTitle>
          </div>
          <CardDescription className="font-mono text-xs">
            Encryption and data protection details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="border-border bg-muted/30 divide-border divide-y rounded-md border font-mono text-xs">
            <SecurityRow
              label="Encryption algorithm"
              value="AES-256-GCM"
              highlight
            />
            <SecurityRow
              label="Key derivation"
              value="Environment variable (KAGI_ENCRYPTION_KEY)"
            />
            <SecurityRow
              label="Ciphertext format"
              value="iv : authTag : ciphertext  (base64)"
            />
            <SecurityRow
              label="Values at rest"
              value="Always encrypted — never stored plaintext"
            />
            <SecurityRow
              label="Values in transit"
              value="Never returned by list/detail APIs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vault Summary + Export */}
      <Card className="border-border bg-card/60 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="text-primary size-4" />
            <CardTitle className="font-mono text-sm">Vault</CardTitle>
          </div>
          <CardDescription className="font-mono text-xs">
            Export a metadata snapshot — secret values are never included
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Categories" value={stats.categories} />
            <StatTile label="Entries" value={stats.entries} />
            <StatTile label="2FA Sets" value={stats.twoFaSets} />
          </div>
          <ExportButton />
        </CardContent>
      </Card>

      {/* API Keys */}
      <ApiKeysCard />

      {/* Danger Zone */}
      <DangerZone stats={stats} />
    </div>
  )
}

function SecurityRow({
  label,
  value,
  highlight
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={highlight ? 'text-primary font-semibold' : 'text-foreground'}
      >
        {value}
      </span>
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-border bg-muted/20 rounded-md border p-3 text-center">
      <p className="text-primary font-mono text-2xl font-bold tabular-nums">
        {value}
      </p>
      <p className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
        {label}
      </p>
    </div>
  )
}

function ExportButton() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch('/api/export')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const match = disposition.match(/filename="([^"]+)"/)
      a.download = match?.[1] ?? 'kagi-export.json'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Export downloaded')
    } catch {
      toast.error('Export failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      className="w-full font-mono text-sm"
      onClick={handleExport}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 size-3.5 animate-spin" />
      ) : (
        <Download className="mr-2 size-3.5" />
      )}
      Export Vault Metadata (JSON)
    </Button>
  )
}

// ── API Keys ──────────────────────────────────────────────────────────────────

function ApiKeysCard() {
  const { data: keys = [], isLoading } = useAccessKeys()
  const [createOpen, setCreateOpen] = useState(false)
  const [createdKey, setCreatedKey] = useState<CreateAccessKeyResponse | null>(
    null
  )

  return (
    <>
      <Card className="border-border bg-card/60 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="text-primary size-4" />
              <CardTitle className="font-mono text-sm">API Keys</CardTitle>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 font-mono text-xs"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-3" />
              New Key
            </Button>
          </div>
          <CardDescription className="font-mono text-xs">
            Programmatic access via{' '}
            <code className="bg-muted rounded px-1">
              Authorization: Bearer kagi_…
            </code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="text-muted-foreground size-4 animate-spin" />
            </div>
          ) : keys.length === 0 ? (
            <p className="text-muted-foreground py-2 text-center font-mono text-xs">
              No API keys yet
            </p>
          ) : (
            <div className="divide-border divide-y">
              {keys.map((k) => (
                <AccessKeyRow key={k.id} accessKey={k} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateKeyDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(k) => {
          setCreateOpen(false)
          setCreatedKey(k)
        }}
      />

      {createdKey && (
        <NewKeyRevealDialog
          accessKey={createdKey}
          onClose={() => setCreatedKey(null)}
        />
      )}
    </>
  )
}

function AccessKeyRow({ accessKey: k }: { accessKey: AccessKey }) {
  const revoke = useRevokeAccessKey()

  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <div className="min-w-0 space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold">{k.name}</span>
          <code className="text-muted-foreground bg-muted rounded px-1 font-mono text-[10px]">
            {k.keyPrefix}…
          </code>
        </div>
        <div className="flex flex-wrap gap-1">
          {k.scopes.map((s) => (
            <Badge
              key={s}
              variant="secondary"
              className="font-mono text-[9px] leading-none"
            >
              {s}
            </Badge>
          ))}
        </div>
        <p className="text-muted-foreground font-mono text-[10px]">
          {k.lastUsedAt
            ? `Last used ${formatDistanceToNow(new Date(k.lastUsedAt), { addSuffix: true })}`
            : 'Never used'}
          {k.expiresAt &&
            ` · Expires ${formatDistanceToNow(new Date(k.expiresAt), { addSuffix: true })}`}
        </p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="text-muted-foreground hover:text-destructive h-7 w-7 shrink-0"
        onClick={() => revoke.mutate(k.id)}
        disabled={revoke.isPending}
      >
        {revoke.isPending ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <Trash2 className="size-3" />
        )}
      </Button>
    </div>
  )
}

function CreateKeyDialog({
  open,
  onOpenChange,
  onCreated
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: (k: CreateAccessKeyResponse) => void
}) {
  const create = useCreateAccessKey()
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<AccessKeyScope[]>([])
  const [expiresAt, setExpiresAt] = useState('')

  function toggleScope(scope: AccessKeyScope) {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
  }

  async function handleSubmit() {
    if (!name.trim() || scopes.length === 0) return
    const result = await create.mutateAsync({
      name: name.trim(),
      scopes,
      expiresAt: expiresAt || undefined
    })
    setName('')
    setScopes([])
    setExpiresAt('')
    onCreated(result)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">New API Key</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Grant only the scopes you need. The key will be shown once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label className="font-mono text-xs">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CI/CD Pipeline"
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-mono text-xs">Scopes</Label>
            <div className="border-border max-h-52 space-y-1.5 overflow-y-auto rounded-md border p-3">
              {ALL_SCOPES.map((scope) => (
                <div key={scope} className="flex items-start gap-2">
                  <Checkbox
                    id={scope}
                    checked={scopes.includes(scope)}
                    onCheckedChange={() => toggleScope(scope)}
                    className="mt-0.5"
                  />
                  <div>
                    <label
                      htmlFor={scope}
                      className="cursor-pointer font-mono text-xs font-medium"
                    >
                      {scope}
                    </label>
                    <p className="text-muted-foreground font-mono text-[10px]">
                      {SCOPE_DESCRIPTIONS[scope]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-mono text-xs">
              Expires at{' '}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="font-mono text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || scopes.length === 0 || create.isPending}
            className="font-mono text-sm"
          >
            {create.isPending && (
              <Loader2 className="mr-2 size-3.5 animate-spin" />
            )}
            Create Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function NewKeyRevealDialog({
  accessKey,
  onClose
}: {
  accessKey: CreateAccessKeyResponse
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(accessKey.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">
            Save your API key
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            This key is shown{' '}
            <span className="text-destructive font-semibold">once</span> and
            cannot be retrieved again. Copy it now.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="border-primary/30 bg-primary/5 flex items-center gap-2 rounded-md border p-3">
            <code className="text-primary min-w-0 flex-1 break-all font-mono text-xs">
              {accessKey.key}
            </code>
            <Button
              size="icon"
              variant="ghost"
              className="text-primary h-7 w-7 shrink-0"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </Button>
          </div>

          <div className="text-muted-foreground space-y-1 font-mono text-[10px]">
            <p>
              <span className="text-foreground font-semibold">Scopes: </span>
              {accessKey.scopes.join(', ')}
            </p>
            {accessKey.expiresAt && (
              <p>
                <span className="text-foreground font-semibold">Expires: </span>
                {new Date(accessKey.expiresAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full font-mono text-sm">
            I&apos;ve saved the key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Danger Zone ───────────────────────────────────────────────────────────────

function DangerZone({ stats }: { stats: SettingsClientProps['stats'] }) {
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const total = stats.categories + stats.entries + stats.twoFaSets
  const confirmed = confirmText === 'DELETE'

  async function handleDelete() {
    if (!confirmed) return
    setLoading(true)
    try {
      const res = await fetch('/api/account/data', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('All vault data deleted')
      await signOut({
        fetchOptions: { onSuccess: () => window.location.assign('/login') }
      })
    } catch {
      toast.error('Failed to delete data')
      setLoading(false)
    }
  }

  return (
    <Card className="border-destructive/40 bg-card/60 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Trash2 className="text-destructive size-4" />
          <CardTitle className="text-destructive font-mono text-sm">
            Danger Zone
          </CardTitle>
        </div>
        <CardDescription className="font-mono text-xs">
          Permanently delete all your vault data. This cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="border-destructive/20 bg-destructive/5 rounded-md border p-3 font-mono text-xs">
          <div className="flex items-start gap-2">
            <ShieldCheck className="text-destructive mt-0.5 size-3.5 shrink-0" />
            <p className="text-muted-foreground">
              This will permanently delete{' '}
              <span className="text-foreground font-semibold">
                {stats.categories}{' '}
                {stats.categories === 1 ? 'category' : 'categories'}
              </span>
              ,{' '}
              <span className="text-foreground font-semibold">
                {stats.entries} {stats.entries === 1 ? 'entry' : 'entries'}
              </span>
              , and{' '}
              <span className="text-foreground font-semibold">
                {stats.twoFaSets} 2FA {stats.twoFaSets === 1 ? 'set' : 'sets'}
              </span>{' '}
              ({total} records total). Your account remains active.
            </p>
          </div>
        </div>

        {total > 0 && (
          <div className="space-y-2">
            <p className="text-muted-foreground font-mono text-xs">
              Type <span className="text-foreground font-semibold">DELETE</span>{' '}
              to confirm
            </p>
            <div className="flex gap-2">
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="font-mono text-sm"
              />
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!confirmed || loading}
                className="shrink-0 font-mono text-sm"
              >
                {loading && <Loader2 className="mr-2 size-3.5 animate-spin" />}
                Delete All
              </Button>
            </div>
          </div>
        )}

        {total === 0 && (
          <p className="text-muted-foreground font-mono text-xs">
            Your vault is already empty.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
