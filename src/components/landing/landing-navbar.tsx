'use client'

import Link from 'next/link'
import { Snowflake, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function LandingNavbar() {
  const { theme, setTheme } = useTheme()

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Snowflake size={15} className="text-blue-400" />
          <span className="text-sm font-semibold tracking-tight">Archivault</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label="Toggle theme"
          >
            <Sun size={14} className="dark:hidden" />
            <Moon size={14} className="hidden dark:block" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer text-muted-foreground"
            render={<Link href="/sign-in" />}
          >
            Sign in
          </Button>
          <Button
            size="sm"
            className="cursor-pointer"
            render={<Link href="/sign-up" />}
          >
            Get started
          </Button>
        </div>
      </div>
    </nav>
  )
}
