'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTheme } from '@mui/material/styles'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { Folder, FileText, ChevronRight, CloudUpload } from 'lucide-react'
import { formatBytes } from '@/lib/utils'
import type { OneDriveItem } from '@/server/providers/onedrive/onedrive.provider.interface'
import type { File as DbFile } from '@/db/schema/files'

interface Vault { id: string; name: string }
interface BreadcrumbEntry { id: string; name: string }

const ACCENT = '#0078d4'
const ACCENT_HOVER = '#106ebe'

function ImportStatusChip({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    importing: { label: 'Importing', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
    active:    { label: 'Done',      color: '#34d399', bg: 'rgba(52,211,153,0.1)'  },
    failed:    { label: 'Failed',    color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  }
  const c = config[status] ?? { label: status, color: '#71717a', bg: 'rgba(113,113,122,0.1)' }
  return (
    <Chip label={c.label} size="small" sx={{ color: c.color, bgcolor: c.bg, border: `1px solid ${c.color}33`, fontSize: '0.7rem', height: 22 }} />
  )
}

export function OneDriveImportClient({ isConnected, oauthError }: { isConnected: boolean; oauthError?: string }) {
  const muiTheme = useTheme()
  const [items, setItems] = useState<OneDriveItem[]>([])
  const [loading, setLoading] = useState(false)
  const [folderStack, setFolderStack] = useState<BreadcrumbEntry[]>([{ id: 'root', name: 'My Files' }])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [vaults, setVaults] = useState<Vault[]>([])
  const [vaultId, setVaultId] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [importJobs, setImportJobs] = useState<DbFile[]>([])
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadItems = useCallback(async (itemId: string) => {
    setLoading(true)
    setSelected(new Set())
    try {
      const params = itemId === 'root' ? '' : `?itemId=${encodeURIComponent(itemId)}`
      const res = await fetch(`/api/import/onedrive${params}`)
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Failed to load files')
      }
      setItems(await res.json() as OneDriveItem[])
    } catch { setItems([]) } finally { setLoading(false) }
  }, [])

  const loadVaults = useCallback(async () => {
    const res = await fetch('/api/vaults')
    if (res.ok) setVaults(await res.json() as Vault[])
  }, [])

  const loadImportJobs = useCallback(async () => {
    const res = await fetch('/api/import/onedrive/status')
    if (res.ok) setImportJobs(await res.json() as DbFile[])
  }, [])

  useEffect(() => {
    if (!isConnected) return
    loadItems('root')
    loadVaults()
    loadImportJobs()
  }, [isConnected, loadItems, loadVaults, loadImportJobs])

  useEffect(() => {
    if (!isConnected) return
    pollRef.current = setInterval(loadImportJobs, 10_000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [isConnected, loadImportJobs])

  const navigateInto = (item: OneDriveItem) => {
    setFolderStack(prev => [...prev, { id: item.id, name: item.name }])
    loadItems(item.id)
  }

  const navigateTo = (index: number) => {
    const entry = folderStack[index]
    setFolderStack(prev => prev.slice(0, index + 1))
    loadItems(entry.id)
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const toggleAll = () => {
    const ids = items.filter(i => !i.isFolder).map(i => i.id)
    setSelected(ids.every(id => selected.has(id)) ? new Set() : new Set(ids))
  }

  const handleImport = async () => {
    if (!vaultId || selected.size === 0) return
    setImporting(true)
    setImportError('')
    try {
      const selectedItems = items.filter(i => selected.has(i.id))
      const res = await fetch('/api/import/onedrive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vaultId, items: selectedItems }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Import failed')
      }
      setSelected(new Set())
      await loadImportJobs()
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
    } finally { setImporting(false) }
  }

  const selectableCount = items.filter(i => !i.isFolder).length
  const allSelected = selectableCount > 0 && items.filter(i => !i.isFolder).every(i => selected.has(i.id))

  if (!isConnected) {
    return (
      <Box sx={{ maxWidth: 560 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Import from OneDrive</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Connect your Microsoft OneDrive to browse and import files directly into your archive.
        </Typography>

        {oauthError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {oauthError === 'oauth_denied'
              ? 'OneDrive access was denied. Please try again and allow the requested permission.'
              : 'Something went wrong connecting to OneDrive. Please try again.'}
          </Alert>
        )}

        <Paper elevation={0} sx={{ mt: 3, p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: `${ACCENT}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CloudUpload size={24} color={ACCENT} />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>Connect OneDrive</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Read-only access. We will never modify your OneDrive files.
            </Typography>
          </Box>
          <Button variant="contained" href="/api/auth/onedrive" disableElevation
            sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: ACCENT_HOVER }, textTransform: 'none' }}>
            Connect OneDrive
          </Button>
        </Paper>
      </Box>
    )
  }

  const activeImports = importJobs.filter(f => f.status === 'importing')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Import from OneDrive</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Select files and choose a vault to import them into your archive.
          </Typography>
        </Box>
        <Button variant="outlined" size="small" href="/api/auth/onedrive" color="inherit"
          sx={{ textTransform: 'none', '&:hover': { borderColor: ACCENT, color: ACCENT } }}>
          Reconnect OneDrive
        </Button>
      </Box>

      {activeImports.length > 0 && (
        <Alert severity="info" icon={false} sx={{ bgcolor: `${ACCENT}1a`, border: `1px solid ${ACCENT}4d`, color: ACCENT }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CircularProgress size={14} sx={{ color: ACCENT }} />
            <Typography variant="body2" sx={{ color: ACCENT }}>
              {activeImports.length} file{activeImports.length > 1 ? 's' : ''} importing…
            </Typography>
          </Box>
        </Alert>
      )}

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        {/* Breadcrumb + toolbar */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderBottomColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Breadcrumbs separator={<ChevronRight size={14} color={muiTheme.palette.text.secondary} />} sx={{ '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' } }}>
            {folderStack.map((entry, i) => {
              const isLast = i === folderStack.length - 1
              return (
                <Typography
                  key={entry.id}
                  variant="body2"
                  onClick={isLast ? undefined : () => navigateTo(i)}
                  sx={{ cursor: isLast ? 'default' : 'pointer', color: isLast ? 'text.primary' : 'text.secondary', fontWeight: isLast ? 500 : 400, '&:hover': isLast ? {} : { color: ACCENT }, whiteSpace: 'nowrap' }}
                >
                  {entry.name}
                </Typography>
              )
            })}
          </Breadcrumbs>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Target vault</InputLabel>
              <Select
                value={vaultId}
                label="Target vault"
                onChange={e => setVaultId(e.target.value)}
              >
                {vaults.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              size="small"
              disabled={selected.size === 0 || !vaultId || importing}
              onClick={handleImport}
              disableElevation
              sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: ACCENT_HOVER }, textTransform: 'none', whiteSpace: 'nowrap' }}
            >
              {importing ? 'Queuing…' : `Import${selected.size > 0 ? ` (${selected.size})` : ''}`}
            </Button>
          </Box>
        </Box>

        {importError && (
          <Alert severity="error" sx={{ m: 2, mt: 1 }}>{importError}</Alert>
        )}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ pl: 2 }}>
                  <Checkbox
                    size="small"
                    checked={allSelected}
                    indeterminate={selected.size > 0 && !allSelected}
                    onChange={toggleAll}
                    disabled={selectableCount === 0}
                    color="primary"
                  />
                </TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Size</TableCell>
                <TableCell align="right">Modified</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={24} sx={{ color: ACCENT }} />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">This folder is empty.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                items.map(item => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{ cursor: item.isFolder ? 'pointer' : 'default' }}
                    onClick={item.isFolder ? () => navigateInto(item) : undefined}
                  >
                    <TableCell padding="checkbox" sx={{ pl: 2 }} onClick={e => e.stopPropagation()}>
                      {!item.isFolder && (
                        <Checkbox size="small" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} color="primary" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {item.isFolder ? <Folder size={15} color="#f59e0b" /> : <FileText size={15} color={muiTheme.palette.text.secondary} />}
                        <Typography variant="body2" color="text.primary">{item.name}</Typography>
                        {item.isFolder && <ChevronRight size={13} color={muiTheme.palette.text.secondary} />}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        {item.isFolder ? 'folder' : item.mimeType.split('/').pop()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatBytes(item.sizeBytes, '—')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.modifiedAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {importJobs.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recent Imports
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ cursor: 'pointer', '&:hover': { color: 'text.primary' } }} onClick={loadImportJobs}>
              Refresh
            </Typography>
          </Box>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            {importJobs.slice(0, 20).map((file, idx) => (
              <Box key={file.id}>
                {idx > 0 && <Divider />}
                <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" color="text.primary" noWrap>{file.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatBytes(file.sizeBytes, '—')} · {new Date(file.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  {file.status === 'importing' ? (
                    <Box sx={{ width: 120 }}>
                      <LinearProgress sx={{ height: 4, borderRadius: 2, bgcolor: `${ACCENT}26`, '& .MuiLinearProgress-bar': { bgcolor: ACCENT, borderRadius: 2 } }} />
                    </Box>
                  ) : (
                    <ImportStatusChip status={file.status} />
                  )}
                </Box>
              </Box>
            ))}
          </Paper>
        </Box>
      )}
    </Box>
  )
}
