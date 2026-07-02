'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
      <TooltipProvider delay={300}>
        {children}
        <Toaster richColors position="bottom-right" />
      </TooltipProvider>
    </NextThemesProvider>
  )
}
