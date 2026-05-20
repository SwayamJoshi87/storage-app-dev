'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MoreHorizontal, Folder, Pencil, Trash2 } from 'lucide-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { Vault } from '@/db/schema/vaults'

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function VaultCard({ vault }: { vault: Vault }) {
  const router = useRouter()
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
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
      <Card elevation={0} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <CardContent sx={{ flex: 1, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Box sx={{ mt: 0.25, p: 1, borderRadius: 1.5, bgcolor: 'rgba(96,165,250,0.1)', color: '#60a5fa', flexShrink: 0 }}>
              <Folder size={16} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" noWrap color="text.primary" sx={{ fontWeight: 600 }}>
                {vault.name}
              </Typography>
              {vault.description && (
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: 0.25 }}>
                  {vault.description}
                </Typography>
              )}
            </Box>
            <IconButton size="small" onClick={e => setMenuAnchor(e.currentTarget)} sx={{ color: 'text.secondary', flexShrink: 0 }}>
              <MoreHorizontal size={16} />
            </IconButton>
          </Box>
        </CardContent>

        <Divider sx={{ borderColor: '#27272a' }} />

        <CardActions sx={{ px: 2, py: 1.25, justifyContent: 'space-between' }}>
          <Typography variant="caption" color="#52525b">{formatDate(vault.createdAt)}</Typography>
          <Button
            component={Link}
            href={`/dashboard/vaults/${vault.id}`}
            size="small"
            variant="outlined"
            sx={{ borderColor: '#3f3f46', color: '#d4d4d8', '&:hover': { borderColor: '#71717a' }, py: 0.25, px: 1.5, fontSize: '0.75rem' }}
          >
            Open
          </Button>
        </CardActions>
      </Card>

      {/* Kebab menu */}
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}
        slotProps={{ paper: { sx: { bgcolor: '#1c1c1f', border: '1px solid #27272a', minWidth: 140 } } }}>
        <MenuItem onClick={() => { setNewName(vault.name); setRenameOpen(true); setMenuAnchor(null) }} dense>
          <ListItemIcon sx={{ color: 'text.secondary', minWidth: 28 }}><Pencil size={14} /></ListItemIcon>
          <Typography variant="body2">Rename</Typography>
        </MenuItem>
        <Divider sx={{ borderColor: '#27272a', my: 0.5 }} />
        <MenuItem onClick={() => { setDeleteOpen(true); setMenuAnchor(null) }} dense sx={{ color: '#f87171' }}>
          <ListItemIcon sx={{ color: '#f87171', minWidth: 28 }}><Trash2 size={14} /></ListItemIcon>
          <Typography variant="body2" color="inherit">Delete</Typography>
        </MenuItem>
      </Menu>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleRename}>
          <DialogTitle sx={{ fontSize: '1rem', fontWeight: 600 }}>Rename Vault</DialogTitle>
          <DialogContent sx={{ pt: '8px !important' }}>
            <TextField value={newName} onChange={e => setNewName(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 100 } }} autoFocus required fullWidth size="small" />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setRenameOpen(false)} variant="text" size="small" color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" size="small" disabled={renaming || !newName.trim()} disableElevation>
              {renaming ? 'Saving…' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 600 }}>Delete &quot;{vault.name}&quot;?</DialogTitle>
        <DialogContent>
          <DialogContentText variant="body2">
            This will permanently delete the vault and all its files. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} variant="text" size="small" color="inherit">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" size="small" disabled={deleting} disableElevation>
            {deleting ? 'Deleting…' : 'Delete Vault'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
