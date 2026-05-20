import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { ClerkProvider } from '@clerk/nextjs'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import { MuiThemeProvider } from '@/components/mui-theme-provider'
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
        className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
      >
        <body style={{ minHeight: '100%', backgroundColor: '#09090b', color: '#f4f4f5', margin: 0 }}>
          <AppRouterCacheProvider>
            <MuiThemeProvider>
              {children}
            </MuiThemeProvider>
          </AppRouterCacheProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
