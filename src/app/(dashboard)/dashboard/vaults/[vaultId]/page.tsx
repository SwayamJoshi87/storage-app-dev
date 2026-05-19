import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { vaultService } from '@/server/container'
import { fileService } from '@/server/container'
import { UploadZone } from '@/components/upload-zone'
import { FileTable } from '@/components/file-table'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { ChevronLeftIcon, FileIcon } from 'lucide-react'

interface PageProps {
  params: Promise<{ vaultId: string }>
}

export default async function VaultPage({ params }: PageProps) {
  const { vaultId } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  let vault
  try {
    vault = await vaultService.getVault(userId, vaultId)
  } catch {
    notFound()
  }

  const files = await fileService.listFiles(userId, vaultId)
  const activeFiles = files.filter(f => f.status !== 'deleted')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button render={<Link href="/dashboard" />} variant="ghost" size="icon-sm" className="text-zinc-500 hover:text-zinc-300">
          <ChevronLeftIcon />
        </Button>
        <h1 className="text-xl font-semibold text-zinc-100">{vault.name}</h1>
      </div>

      {vault.description && (
        <p className="text-sm text-zinc-500">{vault.description}</p>
      )}

      <div>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Upload Files</h2>
        <UploadZone vaultId={vaultId} />
      </div>

      <div>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Files {activeFiles.length > 0 && <span className="ml-1 text-zinc-600">({activeFiles.length})</span>}
        </h2>
        {activeFiles.length === 0 ? (
          <EmptyState
            icon={<FileIcon className="size-8" />}
            title="No files yet"
            description="Upload files above to archive them in cold storage."
          />
        ) : (
          <FileTable files={activeFiles} />
        )}
      </div>
    </div>
  )
}
