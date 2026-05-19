'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UploadCloudIcon, XIcon, CheckIcon, LoaderIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadItem {
  file: File
  status: 'queued' | 'uploading' | 'confirming' | 'done' | 'error'
  progress: number
  error?: string
}

interface UploadZoneProps {
  vaultId: string
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function UploadZone({ vaultId }: UploadZoneProps) {
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
      // Step 1: initiate upload
      const initRes = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vaultId,
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          tier: 'cold',
        }),
      })
      if (!initRes.ok) {
        const { error } = await initRes.json()
        throw new Error(error ?? 'Failed to initiate upload')
      }
      const { file: fileRecord, uploadTarget } = await initRes.json()

      updateItem(index, { progress: 30 })

      // Step 2: PUT directly to S3 — no auth header
      const s3Res = await fetch(uploadTarget.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      })
      if (!s3Res.ok) throw new Error('S3 upload failed')

      updateItem(index, { status: 'confirming', progress: 80 })

      // Step 3: confirm upload
      const confirmRes = await fetch(`/api/files/${fileRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm_upload' }),
      })
      if (!confirmRes.ok) throw new Error('Failed to confirm upload')

      updateItem(index, { status: 'done', progress: 100 })
    } catch (err) {
      updateItem(index, { status: 'error', error: err instanceof Error ? err.message : 'Upload failed' })
    }
  }

  async function processFiles(files: FileList | File[]) {
    const fileArray = Array.from(files)
    const startIndex = items.length
    const newItems: UploadItem[] = fileArray.map(f => ({
      file: f,
      status: 'queued',
      progress: 0,
    }))
    setItems(prev => [...prev, ...newItems])

    for (let i = 0; i < fileArray.length; i++) {
      await uploadFile(fileArray[i], startIndex + i)
    }
    router.refresh()
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }, [items])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  const allDone = items.length > 0 && items.every(it => it.status === 'done' || it.status === 'error')

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors',
          dragging
            ? 'border-blue-500 bg-blue-500/5'
            : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-900/50'
        )}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <UploadCloudIcon className="size-8 text-zinc-500" />
        <p className="text-sm text-zinc-400">
          Drag files here or <span className="text-blue-400 underline">browse</span>
        </p>
        <p className="text-xs text-zinc-600">Files are stored in S3 Glacier Deep Archive</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={e => e.target.files && processFiles(e.target.files)}
        />
      </div>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-zinc-300">{item.file.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        item.status === 'error' ? 'bg-red-500' : item.status === 'done' ? 'bg-emerald-500' : 'bg-blue-500'
                      )}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-xs tabular-nums text-zinc-600">
                    {formatBytes(item.file.size)}
                  </span>
                </div>
                {item.error && <p className="mt-0.5 text-xs text-red-400">{item.error}</p>}
              </div>
              <div className="shrink-0">
                {item.status === 'done' && <CheckIcon className="size-4 text-emerald-400" />}
                {item.status === 'error' && <XIcon className="size-4 text-red-400" />}
                {(item.status === 'uploading' || item.status === 'confirming') && (
                  <LoaderIcon className="size-4 animate-spin text-blue-400" />
                )}
              </div>
            </div>
          ))}
          {allDone && (
            <button
              className="text-xs text-zinc-600 hover:text-zinc-400"
              onClick={() => setItems([])}
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}
