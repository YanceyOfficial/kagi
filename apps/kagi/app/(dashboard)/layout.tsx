import { AppSidebar } from '@/components/layout/app-sidebar'
import { Providers } from '@/components/providers'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const sessionData = await auth.api.getSession({ headers: await headers() })
  const user = sessionData?.user ?? null

  return (
    <Providers>
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 64)',
            '--header-height': 'calc(var(--spacing) * 12)'
          } as React.CSSProperties
        }
      >
        <AppSidebar user={user} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </Providers>
  )
}
