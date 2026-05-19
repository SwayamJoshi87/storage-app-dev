'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { LayoutDashboardIcon, ArchiveRestoreIcon, SettingsIcon, SnowflakeIcon, MenuIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Vaults', icon: LayoutDashboardIcon },
  { href: '/dashboard/retrievals', label: 'Retrievals', icon: ArchiveRestoreIcon },
  { href: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
]

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ElementType; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-zinc-800 text-zinc-100'
          : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </Link>
  )
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-zinc-100">
          <SnowflakeIcon className="size-5 text-blue-400" />
          <span className="font-semibold tracking-tight">Archivault</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 lg:hidden">
            <XIcon className="size-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-0.5 px-2 py-2">
        {NAV_LINKS.map(link => (
          <NavLink
            key={link.href}
            href={link.href}
            label={link.label}
            icon={link.icon}
            active={
              link.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(link.href)
            }
          />
        ))}
      </nav>
    </div>
  )
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-full min-h-screen bg-zinc-950">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-zinc-800 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-56 border-r border-zinc-800 bg-zinc-950">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 px-4">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-zinc-500 hover:text-zinc-300 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
          </Button>
          <div className="flex-1" />
          <UserButton />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
