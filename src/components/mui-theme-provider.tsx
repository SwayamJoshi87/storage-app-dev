'use client'

import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#09090b', // zinc-950
      paper: '#18181b',   // zinc-900
    },
    primary: {
      main: '#60a5fa',    // blue-400
      contrastText: '#09090b',
    },
    success: { main: '#34d399' },  // emerald-400
    warning: { main: '#fbbf24' },  // amber-400
    error: { main: '#f87171' },
    divider: '#27272a',            // zinc-800
    text: {
      primary: '#f4f4f5',   // zinc-100
      secondary: '#71717a', // zinc-500
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #27272a',
          '&:hover': { borderColor: '#3f3f46' },
          transition: 'border-color 0.15s',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            color: '#71717a',
            fontSize: '0.75rem',
            fontWeight: 500,
            borderBottomColor: '#27272a',
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            '&:hover': { backgroundColor: 'rgba(39,39,42,0.5)' },
          },
          '& .MuiTableCell-root': { borderBottomColor: '#27272a' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 999, backgroundColor: '#27272a' },
        bar: { borderRadius: 999 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          border: '1px solid #27272a',
          backgroundImage: 'none',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: '#27272a' },
      },
    },
  },
})

export function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
