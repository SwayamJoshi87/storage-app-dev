import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, FileIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { vaultService, fileService } from '@/server/container'
import { UploadZone } from '@/components/upload-zone'
import { FileTable } from '@/components/file-table'
import { EmptyState } from '@/components/empty-state'
import { SectionLabel } from '@/components/section-label'

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
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground -ml-2" render={<Link href="/dashboard" />}>
          <ChevronLeft size={15} />
          Back
        </Button>
        <span className="text-muted-foreground/40">/</span>
        <h1 className="text-base font-semibold truncate">{vault.name}</h1>
      </div>

      {vault.description && (
        <p className="text-sm text-muted-foreground">{vault.description}</p>
      )}

      <div className="space-y-2">
        <SectionLabel>Upload Files</SectionLabel>
        <UploadZone vaultId={vaultId} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <SectionLabel>Files</SectionLabel>
          {activeFiles.length > 0 && (
            <span className="text-xs text-muted-foreground/50">({activeFiles.length})</span>
          )}
        </div>
        {activeFiles.length === 0 ? (
          <EmptyState
            icon={<FileIcon size={18} />}
            title="No files yet"
            description="Upload files above to start archiving."
          />
        ) : (
          <FileTable files={activeFiles} />
        )}
      </div>
    </div>
  )
}
