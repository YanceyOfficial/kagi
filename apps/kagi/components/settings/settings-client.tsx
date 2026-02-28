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
import { Input } from '@/components/ui/input'
import { signOut } from '@/lib/auth/client'
import { formatDistanceToNow } from 'date-fns'
import {
  Download,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
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
