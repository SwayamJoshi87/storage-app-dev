'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { TierBadge } from '@/components/tier-badge'
import { FileStatusBadge } from '@/components/status-badge'
import { DownloadIcon, ArchiveRestoreIcon, Trash2Icon } from 'lucide-react'
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

interface FileTableProps {
  files: File[]
}

export function FileTable({ files }: FileTableProps) {
  const router = useRouter()
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [deleteFile, setDeleteFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleRequestRestore() {
    if (!restoreFile) return
    setLoading(true)
    try {
      const res = await fetch('/api/retrievals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: restoreFile.id, tier: 'bulk' }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setRestoreFile(null)
      router.refresh()
      toast.success('Restore request submitted. Check Retrievals for status.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to request restore')
    } finally {
      setLoading(false)
    }
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
    } finally {
      setLoading(false)
    }
  }

  if (files.length === 0) return null

  return (
    <>
      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-500">Name</TableHead>
              <TableHead className="text-zinc-500 tabular-nums">Size</TableHead>
              <TableHead className="text-zinc-500">Tier</TableHead>
              <TableHead className="text-zinc-500">Status</TableHead>
              <TableHead className="text-zinc-500">Uploaded</TableHead>
              <TableHead className="text-zinc-500 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map(file => (
              <TableRow key={file.id} className="border-zinc-800 hover:bg-zinc-900/50">
                <TableCell className="font-medium text-zinc-200 max-w-xs truncate">{file.name}</TableCell>
                <TableCell className="tabular-nums text-zinc-400">{formatBytes(file.sizeBytes)}</TableCell>
                <TableCell><TierBadge tier={file.tier} /></TableCell>
                <TableCell><FileStatusBadge status={file.status} /></TableCell>
                <TableCell className="text-zinc-500">{formatDate(file.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {file.status === 'active' && file.tier === 'cold' && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-zinc-500 hover:text-zinc-200"
                        onClick={() => setRestoreFile(file)}
                        title="Request Restore"
                      >
                        <ArchiveRestoreIcon />
                      </Button>
                    )}
                    {file.status === 'ready' && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-zinc-500 hover:text-zinc-200"
                        title="Download"
                        onClick={() => toast.info('Download link available in Retrievals')}
                      >
                        <DownloadIcon />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-zinc-500 hover:text-red-400"
                      onClick={() => setDeleteFile(file)}
                      title="Delete"
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Restore confirm dialog */}
      <Dialog open={!!restoreFile} onOpenChange={open => !open && setRestoreFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Restore</DialogTitle>
            <DialogDescription>
              Restoring &ldquo;{restoreFile?.name}&rdquo; from Glacier Deep Archive takes 12–48 hours (bulk tier).
              This counts against your monthly retrieval quota.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button disabled={loading} onClick={handleRequestRestore}>
              {loading ? 'Requesting…' : 'Request Restore'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteFile} onOpenChange={open => !open && setDeleteFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{deleteFile?.name}&rdquo;?</DialogTitle>
            <DialogDescription>
              This permanently deletes the file from storage. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" disabled={loading} onClick={handleDelete}>
              {loading ? 'Deleting…' : 'Delete File'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
