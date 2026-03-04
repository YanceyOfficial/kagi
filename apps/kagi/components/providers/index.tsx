'use client'

import { Toaster } from 'sileo'
import { QueryProvider } from './query-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      {children}
      <Toaster position="top-right" />
    </QueryProvider>
  )
}
