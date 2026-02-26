import { CategoryEntriesClient } from '@/components/keys/category-entries-client'
import { SiteHeader } from '@/components/layout/site-header'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Category Entries' }

type Props = { params: Promise<{ categoryId: string }> }

export default async function CategoryPage({ params }: Props) {
  const { categoryId } = await params

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SiteHeader>
        <Breadcrumb>
          <BreadcrumbList className="font-mono text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink href="/keys">Keys</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Entries</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </SiteHeader>
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <CategoryEntriesClient categoryId={categoryId} />
      </div>
    </div>
  )
}
