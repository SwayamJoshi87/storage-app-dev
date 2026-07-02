'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MoreHorizontal, Folder, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { formatDate } from '@/lib/utils'
import type { Vault } from '@/db/schema/vaults'

export function VaultCard({ vault }: { vault: Vault }) {
  const router = useRouter()
  const [renameOpen, setRenameOpen] = useState(false)
  const [newName, setNewName] = useState(vault.name)
  const [renaming, setRenaming] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || newName.trim() === vault.name) { setRenameOpen(false); return }
    setRenaming(true)
    try {
      const res = await fetch(`/api/vaults/${vault.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setRenameOpen(false)
      router.refresh()
      toast.success('Vault renamed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to rename')
    } finally { setRenaming(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/vaults/${vault.id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) throw new Error((await res.json()).error)
      setDeleteOpen(false)
      router.refresh()
      toast.success('Vault deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally { setDeleting(false) }
  }

  return (
    <>
      <Card className="flex flex-col h-full group hover:border-zinc-600 dark:hover:border-zinc-600 transition-all hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/40">
        <CardContent className="flex-1 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-2 rounded-lg bg-blue-400/10 text-blue-400 shrink-0 ring-1 ring-blue-400/20">
              <Folder size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{vault.name}</p>
              {vault.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{vault.description}</p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                  />
                }
              >
                <MoreHorizontal size={13} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem
                  onClick={() => { setNewName(vault.name); setRenameOpen(true) }}
                  className="cursor-pointer"
                >
                  <Pencil size={12} className="mr-2" /> Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  variant="destructive"
                  className="cursor-pointer"
                >
                  <Trash2 size={12} className="mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>

        <Separator />

        <CardFooter className="px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground tabular-nums">{formatDate(vault.createdAt)}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-3 cursor-pointer"
            render={<Link href={`/dashboard/vaults/${vault.id}`} />}
          >
            Open
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={renameOpen} onOpenChange={open => { if (!renaming) setRenameOpen(open) }}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleRename}>
            <DialogHeader>
              <DialogTitle>Rename Vault</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                maxLength={100}
                autoFocus
                required
                className="text-sm"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" size="sm" onClick={() => setRenameOpen(false)} disabled={renaming}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={renaming || !newName.trim()}>
                {renaming ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={open => { if (!deleting) setDeleteOpen(open) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete &quot;{vault.name}&quot;?</DialogTitle>
            <DialogDescription>
              This will permanently delete the vault and all its files. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete Vault'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
