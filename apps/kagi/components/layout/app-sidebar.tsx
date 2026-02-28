'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator
} from '@/components/ui/sidebar'
import { signOut, useSession } from '@/lib/auth/client'
import { cn } from '@/lib/utils'
import {
  Bot,
  ChevronDown,
  FolderDot,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  User
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    title: 'Overview',
    href: '/',
    icon: LayoutDashboard
  },
  {
    title: 'Keys',
    href: '/keys',
    icon: KeyRound
  },
  {
    title: '2FA Recovery',
    href: '/2fa',
    icon: ShieldCheck
  },
  {
    title: 'AI Extract',
    href: '/ai-extract',
    icon: Bot
  },
  {
    title: 'Env Manager',
    href: '/envs',
    icon: FolderDot
  }
]

const secondaryItems = [
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings
  }
]

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  function isActive(href: string) {
    if (href === '/') return pathname === href
    return pathname.startsWith(href)
  }

  async function handleSignOut() {
    await signOut({
      fetchOptions: { onSuccess: () => window.location.assign('/login') }
    })
  }

  const userInitials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??'

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md font-mono text-sm font-bold">
                  鍵
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-mono font-semibold tracking-tight">
                    Kagi
                  </span>
                  <span className="text-muted-foreground font-mono text-xs">
                    Secret Key Manager
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-xs tracking-wider uppercase">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon
                        className={cn(
                          'size-4',
                          isActive(item.href) && 'text-primary'
                        )}
                      />
                      <span className="font-mono">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-xs tracking-wider uppercase">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span className="font-mono">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="font-mono">
                  <Avatar className="size-7 rounded-md">
                    <AvatarImage src={session?.user?.image ?? undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary rounded-md font-mono text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left leading-none">
                    <span className="truncate text-sm font-semibold">
                      {session?.user?.name ?? 'User'}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      {session?.user?.email ?? ''}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto size-3 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-56 font-mono"
              >
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <User className="mr-2 size-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
