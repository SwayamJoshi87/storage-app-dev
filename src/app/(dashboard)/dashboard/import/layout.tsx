'use client'

import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import { ThemeProvider, createTheme } from '@mui/material/styles'

const theme = createTheme({
  cssVariables: true,
  colorSchemes: { dark: true },
})

export default function ImportLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme} defaultMode="dark">
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  )
}
