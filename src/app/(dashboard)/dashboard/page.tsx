import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { FolderOpen } from 'lucide-react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { vaultService, fileService, userRepo } from '@/server/container'
import { VaultCard } from '@/components/vault-card'
import { CreateVaultDialog } from '@/components/create-vault-dialog'
import { StorageUsageBar } from '@/components/storage-usage-bar'
import { EmptyState } from '@/components/empty-state'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const [vaults, usage, user] = await Promise.all([
    vaultService.listVaults(userId),
    fileService.getStorageUsage(userId),
    userRepo.findById(userId),
  ])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>My Vaults</Typography>
        <CreateVaultDialog />
      </Box>

      <StorageUsageBar
        plan={(user?.plan ?? 'free') as 'free' | 'starter' | 'personal' | 'creator' | 'power'}
        coldUsedBytes={usage.coldBytes}
        hotUsedBytes={usage.hotBytes}
      />

      {vaults.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={40} />}
          title="No vaults yet"
          description="Create a vault to start archiving your files to cold storage."
        />
      ) : (
        <Grid container spacing={2}>
          {vaults.map(vault => (
            <Grid key={vault.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <VaultCard vault={vault} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
