'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { LayoutDashboard, ArchiveRestore, Settings, Snowflake, Menu } from 'lucide-react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

const DRAWER_WIDTH = 220

const NAV_LINKS = [
  { href: '/dashboard',             label: 'Vaults',      icon: LayoutDashboard },
  { href: '/dashboard/retrievals',  label: 'Retrievals',  icon: ArchiveRestore  },
  { href: '/dashboard/settings',    label: 'Settings',    icon: Settings        },
]

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Snowflake size={18} color="#60a5fa" />
        <Typography
          component={Link}
          href="/dashboard"
          variant="body1"
          sx={{ fontWeight: 600, color: '#f4f4f5', textDecoration: 'none', letterSpacing: '-0.01em' }}
        >
          Archivault
        </Typography>
      </Box>

      <Divider sx={{ borderColor: '#27272a' }} />

      <List sx={{ flex: 1, px: 1, py: 1 }} disablePadding>
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
          return (
            <ListItem key={href} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                component={Link}
                href={href}
                selected={active}
                sx={{
                  borderRadius: 1.5,
                  py: 1,
                  px: 1.5,
                  '&.Mui-selected': { bgcolor: '#27272a', color: '#f4f4f5' },
                  '&.Mui-selected:hover': { bgcolor: '#3f3f46' },
                  '&:hover': { bgcolor: 'rgba(39,39,42,0.5)' },
                  color: active ? '#f4f4f5' : '#71717a',
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                  <Icon size={16} />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  slotProps={{ primary: { sx: { fontSize: '0.875rem', fontWeight: active ? 500 : 400 } } }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
    </Box>
  )
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const drawerContent = <SidebarContent pathname={pathname} />

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Desktop permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', lg: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            bgcolor: 'background.default',
            borderRight: '1px solid #27272a',
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Mobile temporary drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            bgcolor: 'background.default',
            borderRight: '1px solid #27272a',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main area */}
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {/* Topbar */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            bgcolor: 'background.default',
            borderBottom: '1px solid #27272a',
            color: 'text.primary',
          }}
        >
          <Toolbar sx={{ minHeight: '56px !important', px: 2, gap: 1 }}>
            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{ display: { lg: 'none' }, color: 'text.secondary' }}
              size="small"
            >
              <Menu size={18} />
            </IconButton>
            <Box sx={{ flex: 1 }} />
            <UserButton />
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box component="main" sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
