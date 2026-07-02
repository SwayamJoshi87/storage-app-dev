'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CreateVaultDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  function handleClose() {
    if (loading) return
    setOpen(false)
    setName('')
    setDescription('')
  }

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
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to create vault')
      handleClose()
      router.refresh()
      toast.success('Vault created')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create vault')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={open => { if (!loading) setOpen(open) }}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5 cursor-pointer" />}>
        <Plus size={14} />
        New Vault
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Vault</DialogTitle>
            <DialogDescription>
              A vault is a container for related files you want to archive.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="vault-name" className="text-xs">Name</Label>
              <Input
                id="vault-name"
                placeholder="e.g. Family Photos 2024"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={100}
                autoFocus
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vault-desc" className="text-xs">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                id="vault-desc"
                placeholder="What's in this vault?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading || !name.trim()}>
              {loading ? 'Creating…' : 'Create Vault'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
