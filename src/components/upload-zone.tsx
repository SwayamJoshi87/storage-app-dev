'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UploadCloud, X, Check, Loader } from 'lucide-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

interface UploadItem {
  file: File
  status: 'queued' | 'uploading' | 'confirming' | 'done' | 'error'
  progress: number
  error?: string
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function progressColor(status: UploadItem['status']) {
  if (status === 'error') return '#f87171'
  if (status === 'done') return '#34d399'
  return '#60a5fa'
}

export function UploadZone({ vaultId }: { vaultId: string }) {
  const router = useRouter()
  const [dragging, setDragging] = useState(false)
  const [items, setItems] = useState<UploadItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  function updateItem(index: number, patch: Partial<UploadItem>) {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, ...patch } : it))
  }

  async function uploadFile(file: File, index: number) {
    updateItem(index, { status: 'uploading', progress: 0 })
    try {
      const initRes = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vaultId, name: file.name, mimeType: file.type || 'application/octet-stream', sizeBytes: file.size, tier: 'cold' }),
      })
      if (!initRes.ok) throw new Error((await initRes.json()).error ?? 'Failed to initiate upload')
      const { file: fileRecord, uploadTarget } = await initRes.json()

      updateItem(index, { progress: 30 })

      const uploadRes = await fetch(uploadTarget.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      })
      if (!uploadRes.ok) {
        const body = await uploadRes.text().catch(() => '')
        const code = body.match(/<Code>(.*?)<\/Code>/)?.[1] ?? uploadRes.status
        throw new Error(`S3 upload failed: ${code}`)
      }

      updateItem(index, { status: 'confirming', progress: 80 })

      const confirmRes = await fetch(`/api/files/${fileRecord.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'confirm_upload' }) })
      if (!confirmRes.ok) throw new Error('Failed to confirm upload')

      updateItem(index, { status: 'done', progress: 100 })
    } catch (err) {
      updateItem(index, { status: 'error', error: err instanceof Error ? err.message : 'Upload failed' })
    }
  }

  async function processFiles(files: FileList | File[]) {
    const fileArray = Array.from(files)
    const startIndex = items.length
    setItems(prev => [...prev, ...fileArray.map(f => ({ file: f, status: 'queued' as const, progress: 0 }))])
    for (let i = 0; i < fileArray.length; i++) await uploadFile(fileArray[i], startIndex + i)
    router.refresh()
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files)
  }, [items])

  const allDone = items.length > 0 && items.every(it => it.status === 'done' || it.status === 'error')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Drop zone */}
      <Box
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        sx={{
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          py: 5,
          border: `2px dashed ${dragging ? '#60a5fa' : '#3f3f46'}`,
          borderRadius: 2,
          bgcolor: dragging ? 'rgba(96,165,250,0.04)' : 'transparent',
          transition: 'border-color 0.15s, background-color 0.15s',
          '&:hover': { borderColor: '#52525b', bgcolor: 'rgba(39,39,42,0.4)' },
        }}
      >
        <UploadCloud size={32} color="#52525b" />
        <Typography variant="body2" color="text.secondary">
          Drag files here or <Box component="span" sx={{ color: '#60a5fa', textDecoration: 'underline' }}>browse</Box>
        </Typography>
        <Typography variant="caption" color="#3f3f46">Files are stored in S3 Glacier Deep Archive</Typography>
        <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={e => e.target.files && processFiles(e.target.files)} />
      </Box>

      {/* Upload list */}
      {items.map((item, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, border: '1px solid #27272a', borderRadius: 1.5, px: 1.5, py: 1, bgcolor: 'background.paper' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{item.file.name}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <LinearProgress
                variant="determinate"
                value={item.progress}
                sx={{ flex: 1, '& .MuiLinearProgress-bar': { bgcolor: progressColor(item.status) } }}
              />
              <Typography variant="caption" sx={{ color: '#52525b', minWidth: 48, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {formatBytes(item.file.size)}
              </Typography>
            </Box>
            {item.error && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.25 }}>{item.error}</Typography>}
          </Box>
          <Box sx={{ flexShrink: 0, color: progressColor(item.status) }}>
            {item.status === 'done' && <Check size={16} />}
            {item.status === 'error' && <X size={16} />}
            {(item.status === 'uploading' || item.status === 'confirming') && (
              <Box sx={{ animation: 'spin 1s linear infinite', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }}>
                <Loader size={16} />
              </Box>
            )}
          </Box>
        </Box>
      ))}

      {allDone && (
        <Button variant="text" size="small" onClick={() => setItems([])} sx={{ alignSelf: 'flex-start', color: '#52525b', fontSize: '0.75rem' }}>
          Clear
        </Button>
      )}
    </Box>
  )
}
