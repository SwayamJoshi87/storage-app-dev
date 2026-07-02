import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { FolderOpen } from 'lucide-react'
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">My Vaults</h1>
        <CreateVaultDialog />
      </div>

      <StorageUsageBar
        plan={(user?.plan ?? 'free') as 'free' | 'starter' | 'personal' | 'creator' | 'power'}
        coldUsedBytes={usage.coldBytes}
        hotUsedBytes={usage.hotBytes}
      />

      {vaults.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={20} />}
          title="No vaults yet"
          description="Create a vault to start archiving your files."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {vaults.map(vault => (
            <VaultCard key={vault.id} vault={vault} />
          ))}
        </div>
      )}
    </div>
  )
}
