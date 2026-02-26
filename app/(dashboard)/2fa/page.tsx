import { TwoFaPageClient } from '@/components/2fa/two-fa-page-client'
import { SiteHeader } from '@/components/layout/site-header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '2FA Recovery' }

export default function TwoFaPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SiteHeader title="2FA Recovery Tokens" />
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <TwoFaPageClient />
      </div>
    </div>
  )
}
