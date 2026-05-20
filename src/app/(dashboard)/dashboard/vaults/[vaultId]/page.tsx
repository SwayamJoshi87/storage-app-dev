import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, FileIcon } from 'lucide-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { vaultService, fileService } from '@/server/container'
import { UploadZone } from '@/components/upload-zone'
import { FileTable } from '@/components/file-table'
import { EmptyState } from '@/components/empty-state'

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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Button
          component={Link}
          href="/dashboard"
          variant="text"
          size="small"
          startIcon={<ChevronLeft size={16} />}
          sx={{ color: '#71717a', minWidth: 0, px: 0.5, '&:hover': { color: '#d4d4d8', bgcolor: 'transparent' } }}
        >
          Back
        </Button>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>{vault.name}</Typography>
      </Box>

      {vault.description && (
        <Typography variant="body2" color="text.secondary">{vault.description}</Typography>
      )}

      <Box>
        <Typography variant="caption" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a', display: 'block', mb: 1.5 }}>
          Upload Files
        </Typography>
        <UploadZone vaultId={vaultId} />
      </Box>

      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a' }}>
            Files
          </Typography>
          {activeFiles.length > 0 && (
            <Typography variant="caption" sx={{ color: '#3f3f46' }}>({activeFiles.length})</Typography>
          )}
        </Box>
        {activeFiles.length === 0 ? (
          <EmptyState
            icon={<FileIcon size={32} />}
            title="No files yet"
            description="Upload files above to archive them in cold storage."
          />
        ) : (
          <FileTable files={activeFiles} />
        )}
      </Box>
    </Box>
  )
}
