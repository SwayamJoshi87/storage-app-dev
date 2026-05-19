'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RetrievalStatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { DownloadIcon, ArchiveRestoreIcon } from 'lucide-react'

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
  const created = new Date(createdAt)
  const ready = new Date(created.getTime() + 48 * 60 * 60 * 1000)
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">Retrievals</h1>
        <span className="text-xs text-zinc-600">Refreshes every 30s</span>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-zinc-600">Loading…</div>
      ) : retrievals.length === 0 ? (
        <EmptyState
          icon={<ArchiveRestoreIcon className="size-8" />}
          title="No active retrievals"
          description="Restore requests from cold-tier files will appear here."
        />
      ) : (
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-500">File ID</TableHead>
                <TableHead className="text-zinc-500">Tier</TableHead>
                <TableHead className="text-zinc-500">Status</TableHead>
                <TableHead className="text-zinc-500">Requested</TableHead>
                <TableHead className="text-zinc-500">Est. Ready</TableHead>
                <TableHead className="text-zinc-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {retrievals.map(r => (
                <TableRow key={r.id} className="border-zinc-800 hover:bg-zinc-900/50">
                  <TableCell className="font-mono text-xs text-zinc-400">{r.fileId.slice(0, 12)}…</TableCell>
                  <TableCell className="text-zinc-400 capitalize">{r.tier}</TableCell>
                  <TableCell><RetrievalStatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-zinc-500">{formatDate(r.createdAt)}</TableCell>
                  <TableCell className="text-zinc-500">
                    {r.status === 'ready' ? '—' : estimateReady(r.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === 'ready' && r.downloadUrl && (
                      <Button
                        render={<a href={r.downloadUrl} target="_blank" rel="noopener noreferrer" />}
                        variant="outline"
                        size="xs"
                        className="border-zinc-700 text-zinc-300 hover:text-zinc-100"
                      >
                        <DownloadIcon className="size-3" />
                        Download
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
