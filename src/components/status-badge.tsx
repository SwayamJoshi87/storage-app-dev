import { cn, badgeBase } from '@/lib/utils'

type FileStatus = 'pending_upload' | 'importing' | 'active' | 'restoring' | 'ready' | 'failed' | 'deleted'
type RetrievalStatus = 'pending' | 'restoring' | 'ready' | 'expired' | 'failed'

const FILE_STATUS_CLASSES: Record<FileStatus, string> = {
  pending_upload: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  importing:      'bg-blue-400/10 text-blue-400 border-blue-400/20',
  active:         'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  restoring:      'bg-amber-400/10 text-amber-400 border-amber-400/20',
  ready:          'bg-blue-400/10 text-blue-400 border-blue-400/20',
  failed:         'bg-red-400/10 text-red-400 border-red-400/20',
  deleted:        'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
}

const RETRIEVAL_STATUS_CLASSES: Record<RetrievalStatus, string> = {
  pending:   'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  restoring: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  ready:     'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  expired:   'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
  failed:    'bg-red-400/10 text-red-400 border-red-400/20',
}

export function FileStatusBadge({ status }: { status: FileStatus }) {
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return <span className={cn(badgeBase, FILE_STATUS_CLASSES[status])}>{label}</span>
}

export function RetrievalStatusBadge({ status }: { status: RetrievalStatus }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return <span className={cn(badgeBase, RETRIEVAL_STATUS_CLASSES[status])}>{label}</span>
}
