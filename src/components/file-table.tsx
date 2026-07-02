'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArchiveRestore, Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TierBadge } from '@/components/tier-badge'
import { FileStatusBadge } from '@/components/status-badge'
import { formatBytes, formatDate } from '@/lib/utils'
import type { File } from '@/db/schema/files'

export function FileTable({ files }: { files: File[] }) {
  const router = useRouter()
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [deleteFile, setDeleteFile] = useState<File | null>(null)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function handleRequestRestore() {
    if (!restoreFile) return
    setRestoreLoading(true)
    try {
      const res = await fetch('/api/retrievals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: restoreFile.id, tier: 'bulk' }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setRestoreFile(null)
      router.refresh()
      toast.success('Restore request submitted. Check Restores for status.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to request restore')
    } finally {
      setRestoreLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteFile) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/files/${deleteFile.id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) throw new Error((await res.json()).error)
      setDeleteFile(null)
      router.refresh()
      toast.success('File deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (files.length === 0) return null

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Size</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Uploaded</TableHead>
              <TableHead className="text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map(file => (
              <TableRow key={file.id} className="border-border hover:bg-muted/30">
                <TableCell className="max-w-[200px]">
                  <span className="text-sm font-medium text-foreground truncate block">{file.name}</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground tabular-nums font-mono">
                    {formatBytes(file.sizeBytes)}
                  </span>
                </TableCell>
                <TableCell><TierBadge tier={file.tier} /></TableCell>
                <TableCell><FileStatusBadge status={file.status} /></TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">{formatDate(file.createdAt)}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {file.status === 'active' && file.tier === 'cold' && (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary cursor-pointer"
                              onClick={() => setRestoreFile(file)}
                            />
                          }
                        >
                          <ArchiveRestore size={14} />
                        </TooltipTrigger>
                        <TooltipContent>Request Restore</TooltipContent>
                      </Tooltip>
                    )}
                    {file.status === 'ready' && (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary cursor-pointer"
                              onClick={() => router.push('/dashboard/retrievals')}
                            />
                          }
                        >
                          <Download size={14} />
                        </TooltipTrigger>
                        <TooltipContent>Download in Restores</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer"
                            onClick={() => setDeleteFile(file)}
                          />
                        }
                      >
                        <Trash2 size={14} />
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!restoreFile} onOpenChange={open => { if (!restoreLoading && !open) setRestoreFile(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Request Restore</DialogTitle>
            <DialogDescription>
              Restoring &quot;{restoreFile?.name}&quot; from archive typically takes 12–48 hours.
              This counts against your monthly restore quota.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setRestoreFile(null)} disabled={restoreLoading}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleRequestRestore} disabled={restoreLoading}>
              {restoreLoading ? 'Requesting…' : 'Request Restore'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteFile} onOpenChange={open => { if (!deleteLoading && !open) setDeleteFile(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete &quot;{deleteFile?.name}&quot;?</DialogTitle>
            <DialogDescription>
              This permanently deletes the file from storage. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDeleteFile(null)} disabled={deleteLoading}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting…' : 'Delete File'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
