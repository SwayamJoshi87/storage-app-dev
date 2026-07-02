'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UploadCloud, X, Check, Loader2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { cn, formatBytes } from '@/lib/utils'

interface UploadItem {
  file: File
  status: 'queued' | 'uploading' | 'confirming' | 'done' | 'error'
  progress: number
  error?: string
}

function statusColor(status: UploadItem['status']) {
  if (status === 'error') return '[&>div]:bg-red-400'
  if (status === 'done') return '[&>div]:bg-emerald-400'
  return '[&>div]:bg-blue-400'
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

      const confirmRes = await fetch(`/api/files/${fileRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm_upload' }),
      })
      if (!confirmRes.ok) throw new Error('Failed to confirm upload')

      updateItem(index, { status: 'done', progress: 100 })
    } catch (err) {
      updateItem(index, { status: 'error', error: err instanceof Error ? err.message : 'Upload failed' })
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  async function processFiles(files: FileList | File[]) {
    const fileArray = Array.from(files)
    const startIndex = items.length
    setItems(prev => [...prev, ...fileArray.map(f => ({ file: f, status: 'queued' as const, progress: 0 }))])
    await Promise.all(fileArray.map((file, i) => uploadFile(file, startIndex + i)))
    router.refresh()
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files)
  }

  const allDone = items.length > 0 && items.every(it => it.status === 'done' || it.status === 'error')

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        className={cn(
          'flex flex-col items-center justify-center gap-2 py-10 rounded-lg border-2 border-dashed cursor-pointer transition-all',
          dragging
            ? 'border-blue-400 bg-blue-400/5'
            : 'border-border hover:border-muted-foreground/40 hover:bg-muted/20',
        )}
      >
        <UploadCloud size={28} className={cn('transition-colors', dragging ? 'text-blue-400' : 'text-muted-foreground')} />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Drag files here or{' '}
            <span className="text-primary underline underline-offset-2">browse</span>
          </p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Stored in deep archive</p>
        </div>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={e => e.target.files && processFiles(e.target.files)} />
      </div>

      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
        >
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground truncate">{item.file.name}</span>
              <span className="text-xs text-muted-foreground font-mono tabular-nums shrink-0">
                {formatBytes(item.file.size)}
              </span>
            </div>
            <Progress value={item.progress} className={cn('h-1', statusColor(item.status))} />
            {item.error && <p className="text-xs text-red-400">{item.error}</p>}
          </div>
          <div className="shrink-0">
            {item.status === 'done' && <Check size={14} className="text-emerald-400" />}
            {item.status === 'error' && <X size={14} className="text-red-400" />}
            {(item.status === 'uploading' || item.status === 'confirming') && (
              <Loader2 size={14} className="text-blue-400 animate-spin" />
            )}
          </div>
        </div>
      ))}

      {allDone && (
        <Button variant="ghost" size="sm" onClick={() => setItems([])} className="text-muted-foreground text-xs h-7">
          Clear
        </Button>
      )}
    </div>
  )
}
