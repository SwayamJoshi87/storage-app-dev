'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { useTheme } from 'next-themes'
import { LayoutDashboard, ArchiveRestore, Settings, Snowflake, Menu, FolderInput, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/dashboard',            label: 'Vaults',     icon: LayoutDashboard },
  { href: '/dashboard/retrievals', label: 'Restores',   icon: ArchiveRestore  },
  { href: '/dashboard/import',     label: 'Import',     icon: FolderInput     },
  { href: '/dashboard/settings',   label: 'Settings',   icon: Settings        },
]

function NavItem({ href, label, icon: Icon, pathname }: {
  href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; pathname: string
}) {
  const active = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors relative',
        active
          ? 'bg-zinc-800/60 text-foreground font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-0.5 before:rounded-full before:bg-blue-400'
          : 'text-muted-foreground hover:bg-zinc-800/30 hover:text-foreground dark:hover:bg-white/5',
      )}
    >
      <Icon size={15} className="shrink-0" />
      {label}
    </Link>
  )
}

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="px-4 py-3.5 flex items-center gap-2 shrink-0">
        <Snowflake size={15} className="text-blue-400 shrink-0" />
        <Link
          href="/dashboard"
          className="text-sm font-semibold tracking-tight text-foreground hover:text-foreground"
        >
          Archivault
        </Link>
      </div>
      <div className="h-px bg-border mx-3" />
      <nav className="flex-1 p-2 space-y-0.5 mt-1">
        {NAV_LINKS.map(link => (
          <NavItem key={link.href} {...link} pathname={pathname} />
        ))}
      </nav>
    </div>
  )
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[220px] shrink-0 flex-col border-r border-border">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Topbar */}
        <header className="flex items-center h-14 px-4 border-b border-border shrink-0 gap-2">
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden h-8 w-8 text-muted-foreground" />}>
              <Menu size={16} />
            </SheetTrigger>
            <SheetContent side="left" className="w-[220px] p-0">
              <SidebarContent pathname={pathname} />
            </SheetContent>
          </Sheet>

          <div className="flex-1" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label="Toggle theme"
          >
            <Sun size={15} className="dark:hidden" />
            <Moon size={15} className="hidden dark:block" />
          </Button>
          <UserButton />
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
