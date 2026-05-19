'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusIcon } from 'lucide-react'

export function CreateVaultDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/vaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? 'Failed to create vault')
      }
      setOpen(false)
      setName('')
      setDescription('')
      router.refresh()
      toast.success('Vault created')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create vault')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <PlusIcon />
        New Vault
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Vault</DialogTitle>
          <DialogDescription>
            A vault is a container for related files stored in cold storage.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400" htmlFor="vault-name">
              Name <span className="text-red-400">*</span>
            </label>
            <Input
              id="vault-name"
              placeholder="e.g. Family Photos 2024"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400" htmlFor="vault-desc">
              Description
            </label>
            <Input
              id="vault-desc"
              placeholder="Optional"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Creating…' : 'Create Vault'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
