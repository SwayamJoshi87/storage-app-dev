import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { CloudUpload } from 'lucide-react'
import { userRepo } from '@/server/container'

function ImportCard({
  title,
  description,
  isConnected,
  connectHref,
  browseHref,
  accentColor,
  logo,
}: {
  title: string
  description: string
  isConnected: boolean
  connectHref: string
  browseHref: string
  accentColor: string
  logo: React.ReactNode
}) {
  return (
    <Paper
      elevation={0}
      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {logo}
        <Typography variant="body1" sx={{ fontWeight: 600 }}>{title}</Typography>
        {isConnected && (
          <Box
            component="span"
            sx={{ ml: 'auto', fontSize: '0.7rem', bgcolor: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, px: 1, py: 0.25, fontWeight: 500 }}
          >
            Connected
          </Box>
        )}
      </Box>

      <Typography variant="body2" color="text.secondary">{description}</Typography>

      <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
        {isConnected ? (
          <>
            <Button
              variant="contained"
              href={browseHref}
              disableElevation
              size="small"
              sx={{ bgcolor: accentColor, '&:hover': { filter: 'brightness(0.9)' }, textTransform: 'none' }}
            >
              Browse &amp; Import
            </Button>
            <Button
              variant="outlined"
              href={connectHref}
              size="small"
              color="inherit"
              sx={{ textTransform: 'none' }}
            >
              Reconnect
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            href={connectHref}
            disableElevation
            size="small"
            sx={{ bgcolor: accentColor, '&:hover': { filter: 'brightness(0.9)' }, textTransform: 'none' }}
          >
            Connect {title}
          </Button>
        )}
      </Box>
    </Paper>
  )
}

function GDriveLogo() {
  return (
    <Box sx={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 87.3 78" width="22" height="22">
        <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
        <path d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0-1.2 4.5h27.5z" fill="#00ac47" />
        <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.6z" fill="#ea4335" />
        <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
        <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
        <path d="M73.4 26.5l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
      </svg>
    </Box>
  )
}

function OneDriveLogo() {
  return (
    <Box sx={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 32 32" width="22" height="22">
        <path d="M19.5 17.1L13.1 10C14.3 8.1 16.4 7 18.7 7c3.6 0 6.5 2.6 7 6l.3 1.2 1.2.1c2.3.3 4 2.2 4 4.7 0 .2 0 .4-.1.6L19.5 17.1z" fill="#0364b8" />
        <path d="M13.6 11.2L7.9 14.9 7 15.5c-1.8 1-3 2.9-3 5.1 0 3.3 2.7 6 6 6h18.2c2.6 0 4.8-2.1 4.8-4.8 0-2.4-1.8-4.5-4.2-4.7l-.3-1.2C27.9 12 24.6 9 20.6 9c-2.8 0-5.2 1.3-7 3.2z" fill="#0078d4" />
        <path d="M25 20.2c0 .1 0 .2-.1.4H12.7c-2.3 0-4.2-1.9-4.2-4.2 0-1.9 1.3-3.6 3.1-4.1L13 12l.5-.3C14.9 10.6 16.7 10 18.6 10c3.9 0 7.1 3.1 7.2 7l.2 1.4c1.5.4 2.6 1.7 2.6 3.3 0 .1 0 .2-.1.5l-.1 1h-3.3l-.2-3z" fill="#28a8e0" />
      </svg>
    </Box>
  )
}

export default async function ImportHubPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await userRepo.findById(userId)
  const gdriveConnected = !!(user?.googleAccessToken && user?.googleRefreshToken)
  const onedriveConnected = !!(user?.onedriveAccessToken && user?.onedriveRefreshToken)

  return (
    <Box sx={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Import</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Migrate your files from cloud storage directly into cold archival storage.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'rgba(96,165,250,0.04)' }}>
        <CloudUpload size={16} color="#60a5fa" />
        <Typography variant="body2" color="text.secondary">
          Files are streamed directly from your cloud account into your archive — nothing touches your local machine.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        <ImportCard
          title="Google Drive"
          description="Browse and import files from Google Drive. Requires read-only access."
          isConnected={gdriveConnected}
          connectHref="/api/auth/google"
          browseHref="/dashboard/import/google"
          accentColor="#1a73e8"
          logo={<GDriveLogo />}
        />
        <ImportCard
          title="OneDrive"
          description="Browse and import files from Microsoft OneDrive. Requires read-only access."
          isConnected={onedriveConnected}
          connectHref="/api/auth/onedrive"
          browseHref="/dashboard/import/onedrive"
          accentColor="#0078d4"
          logo={<OneDriveLogo />}
        />
      </Box>
    </Box>
  )
}
