import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

interface SiteHeaderProps {
  title?: string
  children?: React.ReactNode
}

export function SiteHeader({ title, children }: SiteHeaderProps) {
  return (
    <header className="border-border flex h-12 shrink-0 items-center gap-2 border-b px-4 font-mono">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />
      {title && (
        <span className="text-foreground text-sm font-medium">{title}</span>
      )}
      {children}
    </header>
  )
}
