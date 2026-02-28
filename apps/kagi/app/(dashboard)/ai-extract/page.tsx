import { AiExtractClient } from '@/components/ai/ai-extract-client'
import { SiteHeader } from '@/components/layout/site-header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'AI Key Extractor' }

export default function AiExtractPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SiteHeader title="AI Key Extractor" />
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <AiExtractClient />
      </div>
    </div>
  )
}
