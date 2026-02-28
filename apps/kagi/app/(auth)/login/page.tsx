import { LoginForm } from '@/components/auth/login-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sign In' }

export default function LoginPage() {
  return (
    <div className="bg-background terminal-bg flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md px-4">
        {/* ASCII art header */}
        <div className="mb-8 text-center">
          <pre className="text-primary inline-block text-left font-mono text-xs leading-tight select-none">
            {`  _  __    _    ____ ___
 | |/ /   / \\  / ___|_ _|
 | ' /   / _ \\| |  _ | |
 | . \\  / ___ \\ |_| || |
 |_|\\_\\/_/   \\_\\____|___|`}
          </pre>
          <p className="text-muted-foreground mt-3 font-mono text-sm">
            鍵 &mdash; Secret Key Manager
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
