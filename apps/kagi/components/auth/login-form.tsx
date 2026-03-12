'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AuthProviders } from '@/lib/auth'
import { signIn } from '@/lib/auth/client'
import { KeyRound, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { sileo } from 'sileo'

interface LoginFormProps {
  providers: AuthProviders
}

export function LoginForm({ providers }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const noProviders = !providers.emailPassword && !providers.keycloak

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading('email')
    await signIn.email(
      { email, password, callbackURL: '/' },
      {
        onError: (ctx) => {
          sileo.error({ title: ctx.error.message ?? 'Invalid credentials' })
          setLoading(null)
        }
      }
    )
  }

  async function handleKeycloakLogin() {
    setLoading('keycloak')
    try {
      await signIn.oauth2(
        { providerId: 'keycloak' },
        {
          onError: (ctx) => {
            sileo.error({ title: ctx.error.message ?? 'Authentication failed' })
            setLoading(null)
          }
        }
      )
    } catch {
      sileo.error({ title: 'Failed to initiate login' })
      setLoading(null)
    }
  }

  return (
    <Card className="border-border bg-card/80 backdrop-blur">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="flex items-center justify-center gap-2 font-mono text-xl">
          <KeyRound className="text-primary size-5" />
          Access Vault
        </CardTitle>
        <CardDescription className="font-mono text-xs">
          Sign in to manage your secrets
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {noProviders && (
          <p className="text-destructive text-center font-mono text-xs">
            No auth providers configured. Set at least one in your .env file.
          </p>
        )}

        {/* Email / password */}
        {providers.emailPassword && (
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div className="space-y-1">
              <Label className="font-mono text-xs">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="font-mono text-sm"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="font-mono text-xs">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="font-mono text-sm"
                autoComplete="current-password"
                required
              />
            </div>
            <Button
              type="submit"
              className="glow-green w-full font-mono"
              disabled={loading !== null || !email || !password}
            >
              {loading === 'email' ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 size-4" />
              )}
              {loading === 'email' ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        )}

        {/* Divider */}
        {providers.emailPassword && providers.keycloak && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="border-border w-full border-t" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card text-muted-foreground px-2 font-mono text-xs">
                or continue with
              </span>
            </div>
          </div>
        )}

        {/* Keycloak */}
        {providers.keycloak && (
          <Button
            variant="outline"
            className="w-full font-mono"
            onClick={handleKeycloakLogin}
            disabled={loading !== null}
          >
            {loading === 'keycloak' ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <KeyRound className="mr-2 size-4" />
            )}
            {loading === 'keycloak' ? 'Redirecting...' : 'Sign in with Keycloak'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
