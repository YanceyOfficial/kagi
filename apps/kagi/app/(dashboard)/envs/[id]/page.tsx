import { EnvProjectDetailClient } from '@/components/envs/env-project-detail-client'
import { SiteHeader } from '@/components/layout/site-header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Env Project' }

export default function EnvProjectPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SiteHeader title="Env Project" />
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <EnvProjectDetailClient />
      </div>
    </div>
  )
}
