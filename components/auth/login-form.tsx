'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { signIn } from '@/lib/auth/client'
import { KeyRound, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function LoginForm() {
  const [loading, setLoading] = useState(false)

  async function handleKeycloakLogin() {
    setLoading(true)
    try {
      await signIn.oauth2(
        { providerId: 'keycloak' },
        {
          onError: (ctx) => {
            toast.error(ctx.error.message ?? 'Authentication failed')
            setLoading(false)
          }
        }
      )
    } catch {
      toast.error('Failed to initiate login')
      setLoading(false)
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
          Sign in with your organisation account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          className="glow-green w-full font-mono"
          onClick={handleKeycloakLogin}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <KeyRound className="mr-2 size-4" />
          )}
          {loading ? 'Redirecting...' : 'Sign in with Keycloak'}
        </Button>
        <p className="text-muted-foreground mt-4 text-center font-mono text-xs">
          Authentication is handled by your organisation&apos;s Keycloak SSO
        </p>
      </CardContent>
    </Card>
  )
}
