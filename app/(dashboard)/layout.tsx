import { AppSidebar } from '@/components/layout/app-sidebar'
import { Providers } from '@/components/providers'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
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
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </Providers>
  )
}
