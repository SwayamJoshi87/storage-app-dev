import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { vaultService } from '@/server/container'
import { VaultCard } from '@/components/vault-card'
import { CreateVaultDialog } from '@/components/create-vault-dialog'
import { StorageUsageBar } from '@/components/storage-usage-bar'
import { EmptyState } from '@/components/empty-state'
import { FolderOpenIcon } from 'lucide-react'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const vaults = await vaultService.listVaults(userId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">My Vaults</h1>
        <CreateVaultDialog />
      </div>

      <StorageUsageBar plan="free" coldUsedBytes={0} hotUsedBytes={0} />

      {vaults.length === 0 ? (
        <EmptyState
          icon={<FolderOpenIcon className="size-10" />}
          title="No vaults yet"
          description="Create a vault to start archiving your files to cold storage."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vaults.map(vault => (
            <VaultCard key={vault.id} vault={vault} />
          ))}
        </div>
      )}
    </div>
  )
}
