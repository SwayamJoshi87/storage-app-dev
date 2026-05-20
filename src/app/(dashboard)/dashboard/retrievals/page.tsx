'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ArchiveRestore, Download } from 'lucide-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { RetrievalStatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'

interface Retrieval {
  id: string
  fileId: string
  tier: string
  status: 'pending' | 'restoring' | 'ready' | 'expired' | 'failed'
  downloadUrl?: string | null
  downloadExpiresAt?: string | null
  createdAt: string
  updatedAt: string
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function estimateReady(createdAt: string) {
  const ready = new Date(new Date(createdAt).getTime() + 48 * 60 * 60 * 1000)
  return ready.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function RetrievalsPage() {
  const [retrievals, setRetrievals] = useState<Retrieval[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchRetrievals() {
    try {
      const res = await fetch('/api/retrievals')
      if (!res.ok) throw new Error('Failed to fetch')
      setRetrievals(await res.json())
    } catch {
      toast.error('Failed to load retrievals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRetrievals()
    const interval = setInterval(fetchRetrievals, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Retrievals</Typography>
        <Typography variant="caption" sx={{ color: '#3f3f46' }}>Refreshes every 30s</Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={24} sx={{ color: '#3f3f46' }} />
        </Box>
      ) : retrievals.length === 0 ? (
        <EmptyState
          icon={<ArchiveRestore size={32} />}
          title="No active retrievals"
          description="Restore requests from cold-tier files will appear here."
        />
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #27272a', borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>File ID</TableCell>
                <TableCell>Tier</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested</TableCell>
                <TableCell>Est. Ready</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {retrievals.map(r => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {r.fileId.slice(0, 12)}…
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                      {r.tier}
                    </Typography>
                  </TableCell>
                  <TableCell><RetrievalStatusBadge status={r.status} /></TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{formatDate(r.createdAt)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {r.status === 'ready' ? '—' : estimateReady(r.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {r.status === 'ready' && r.downloadUrl && (
                      <Button
                        component="a"
                        href={r.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        size="small"
                        startIcon={<Download size={13} />}
                        sx={{ borderColor: '#3f3f46', color: '#d4d4d8', '&:hover': { borderColor: '#71717a' }, py: 0.25, fontSize: '0.75rem' }}
                      >
                        Download
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
