import { EnvsPageClient } from '@/components/envs/envs-page-client'
import { SiteHeader } from '@/components/layout/site-header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Env Manager' }

export default function EnvsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SiteHeader title="Env Manager" />
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <EnvsPageClient />
      </div>
    </div>
  )
}
