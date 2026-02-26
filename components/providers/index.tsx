'use client'

import { Toaster } from '@/components/ui/sonner'
import { QueryProvider } from './query-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      {children}
      <Toaster
        theme="dark"
        toastOptions={{
          classNames: {
            toast:
              'font-mono text-sm border-border bg-card text-card-foreground'
          }
        }}
      />
    </QueryProvider>
  )
}
