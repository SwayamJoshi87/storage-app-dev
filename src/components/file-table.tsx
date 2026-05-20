'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArchiveRestore, Download, Trash2 } from 'lucide-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { TierBadge } from '@/components/tier-badge'
import { FileStatusBadge } from '@/components/status-badge'
import type { File } from '@/db/schema/files'

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function FileTable({ files }: { files: File[] }) {
  const router = useRouter()
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [deleteFile, setDeleteFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleRequestRestore() {
    if (!restoreFile) return
    setLoading(true)
    try {
      const res = await fetch('/api/retrievals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileId: restoreFile.id, tier: 'bulk' }) })
      if (!res.ok) throw new Error((await res.json()).error)
      setRestoreFile(null)
      router.refresh()
      toast.success('Restore request submitted. Check Retrievals for status.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to request restore')
    } finally { setLoading(false) }
  }

  async function handleDelete() {
    if (!deleteFile) return
    setLoading(true)
    try {
      const res = await fetch(`/api/files/${deleteFile.id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) throw new Error((await res.json()).error)
      setDeleteFile(null)
      router.refresh()
      toast.success('File deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally { setLoading(false) }
  }

  if (files.length === 0) return null

  return (
    <>
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #27272a', borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Tier</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files.map(file => (
              <TableRow key={file.id}>
                <TableCell sx={{ maxWidth: 200 }}>
                  <Typography variant="body2" color="text.primary" noWrap sx={{ fontWeight: 500 }}>{file.name}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatBytes(file.sizeBytes)}
                  </Typography>
                </TableCell>
                <TableCell><TierBadge tier={file.tier} /></TableCell>
                <TableCell><FileStatusBadge status={file.status} /></TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">{formatDate(file.createdAt)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.25 }}>
                    {file.status === 'active' && file.tier === 'cold' && (
                      <Tooltip title="Request Restore">
                        <IconButton size="small" onClick={() => setRestoreFile(file)} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                          <ArchiveRestore size={15} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {file.status === 'ready' && (
                      <Tooltip title="Download (see Retrievals)">
                        <IconButton size="small" onClick={() => toast.info('Download link available in Retrievals')} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                          <Download size={15} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => setDeleteFile(file)} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                        <Trash2 size={15} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!restoreFile} onClose={() => setRestoreFile(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 600 }}>Request Restore</DialogTitle>
        <DialogContent>
          <DialogContentText variant="body2">
            Restoring &quot;{restoreFile?.name}&quot; from Glacier Deep Archive takes 12–48 hours (bulk tier).
            This counts against your monthly retrieval quota.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRestoreFile(null)} variant="text" size="small" color="inherit">Cancel</Button>
          <Button onClick={handleRequestRestore} variant="contained" size="small" disabled={loading} disableElevation>
            {loading ? 'Requesting…' : 'Request Restore'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteFile} onClose={() => setDeleteFile(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 600 }}>Delete &quot;{deleteFile?.name}&quot;?</DialogTitle>
        <DialogContent>
          <DialogContentText variant="body2">
            This permanently deletes the file from storage. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteFile(null)} variant="text" size="small" color="inherit">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" size="small" disabled={loading} disableElevation>
            {loading ? 'Deleting…' : 'Delete File'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
