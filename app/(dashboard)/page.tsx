import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { SiteHeader } from '@/components/layout/site-header'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SiteHeader title="Overview" />
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <DashboardClient />
      </div>
    </div>
  )
}
