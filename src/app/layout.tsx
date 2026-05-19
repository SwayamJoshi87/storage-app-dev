import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Archivault — Cold Storage for Massive Files',
  description: 'Cheap cold storage for massive files. No AWS bill anxiety. Fixed monthly pricing.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${GeistSans.variable} ${GeistMono.variable} dark h-full antialiased`}
      >
        <body className="min-h-full bg-zinc-950 text-zinc-100">
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
