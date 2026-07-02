'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ArchiveRestore, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RetrievalStatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { Skeleton } from '@/components/ui/skeleton'

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
  const [refreshing, setRefreshing] = useState(false)

  async function fetchRetrievals(showRefreshing = false) {
    if (showRefreshing) setRefreshing(true)
    try {
      const res = await fetch('/api/retrievals')
      if (!res.ok) throw new Error('Failed to fetch')
      setRetrievals(await res.json())
    } catch {
      toast.error('Failed to load retrievals')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchRetrievals()
    const interval = setInterval(() => fetchRetrievals(), 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">Restores</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Auto-refreshes every 30s</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => fetchRetrievals(true)}
            disabled={refreshing}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      ) : retrievals.length === 0 ? (
        <EmptyState
          icon={<ArchiveRestore size={20} />}
          title="No active restores"
          description="File restore requests will appear here once submitted."
        />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-xs">File ID</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Requested</TableHead>
                <TableHead className="text-xs">Available by</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {retrievals.map(r => (
                <TableRow key={r.id} className="border-border hover:bg-muted/30">
                  <TableCell>
                    <code className="text-xs text-muted-foreground font-mono">
                      {r.fileId.slice(0, 8)}…
                    </code>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{r.tier === 'cold' ? 'Archive' : 'Instant'}</span>
                  </TableCell>
                  <TableCell><RetrievalStatusBadge status={r.status} /></TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {r.status === 'ready' || r.status === 'expired' ? '—' : estimateReady(r.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === 'ready' && r.downloadUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-3 gap-1.5 cursor-pointer"
                        render={<a href={r.downloadUrl ?? undefined} target="_blank" rel="noopener noreferrer" />}
                      >
                        <Download size={11} />
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
