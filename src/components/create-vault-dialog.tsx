'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'

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
    <>
      <Button
        variant="contained"
        size="small"
        startIcon={<Plus size={14} />}
        onClick={() => setOpen(true)}
        disableElevation
      >
        New Vault
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontSize: '1rem', fontWeight: 600 }}>Create Vault</DialogTitle>
          <DialogContent sx={{ pt: '8px !important' }}>
            <DialogContentText variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              A vault is a container for related files stored in cold storage.
            </DialogContentText>
            <TextField
              label="Name"
              placeholder="e.g. Family Photos 2024"
              value={name}
              onChange={e => setName(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 100 } }}
              required
              autoFocus
              fullWidth
              size="small"
              sx={{ mb: 2 }}
            />
            <TextField
              label="Description"
              placeholder="Optional"
              value={description}
              onChange={e => setDescription(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 500 } }}
              fullWidth
              size="small"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} variant="text" size="small" color="inherit" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" size="small" disabled={loading || !name.trim()} disableElevation>
              {loading ? 'Creating…' : 'Create Vault'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  )
}
