import { KeysPageClient } from '@/components/keys/keys-page-client'
import { SiteHeader } from '@/components/layout/site-header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Keys' }

export default function KeysPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SiteHeader title="Keys" />
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <KeysPageClient />
      </div>
    </div>
  )
}
