'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { MoreHorizontalIcon, FolderIcon, Pencil, Trash2 } from 'lucide-react'
import type { Vault } from '@/db/schema/vaults'

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

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
    } finally {
      setRenaming(false)
    }
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
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
        <CardHeader className="border-b-0">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-md bg-blue-500/10 p-2 text-blue-400">
              <FolderIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-zinc-100">{vault.name}</CardTitle>
              {vault.description && (
                <CardDescription className="mt-0.5 truncate">{vault.description}</CardDescription>
              )}
            </div>
          </div>
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" size="icon-sm" className="text-zinc-500 hover:text-zinc-300" />
              }>
                <MoreHorizontalIcon />
                <span className="sr-only">Vault options</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => { setNewName(vault.name); setRenameOpen(true) }}>
                  <Pencil />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </CardHeader>
        <CardFooter className="border-t-0 bg-transparent pt-0 px-4 pb-4 flex items-center justify-between">
          <span className="text-xs text-zinc-600">{formatDate(vault.createdAt)}</span>
          <Button render={<Link href={`/dashboard/vaults/${vault.id}`} />} size="xs" variant="outline" className="border-zinc-700 text-zinc-300 hover:text-zinc-100">
            Open
          </Button>
        </CardFooter>
      </Card>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Vault</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRename} className="space-y-3">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              maxLength={100}
              autoFocus
              required
            />
            <DialogFooter>
              <Button type="submit" disabled={renaming || !newName.trim()}>
                {renaming ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{vault.name}&rdquo;?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400">
            This will permanently delete the vault and all its files. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? 'Deleting…' : 'Delete Vault'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
