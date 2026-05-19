import { Badge } from '@/components/ui/badge'

type FileStatus = 'pending_upload' | 'active' | 'restoring' | 'ready' | 'deleted'
type RetrievalStatus = 'pending' | 'restoring' | 'ready' | 'expired' | 'failed'

const FILE_STATUS_STYLES: Record<FileStatus, string> = {
  pending_upload: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  restoring: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ready: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  deleted: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const RETRIEVAL_STATUS_STYLES: Record<RetrievalStatus, string> = {
  pending: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  restoring: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ready: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  expired: 'bg-red-500/10 text-red-400 border-red-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export function FileStatusBadge({ status }: { status: FileStatus }) {
  const label = status.replace('_', ' ')
  return <Badge className={FILE_STATUS_STYLES[status]}>{label}</Badge>
}

export function RetrievalStatusBadge({ status }: { status: RetrievalStatus }) {
  return <Badge className={RETRIEVAL_STATUS_STYLES[status]}>{status}</Badge>
}
