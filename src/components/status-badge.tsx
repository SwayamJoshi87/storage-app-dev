import Chip from '@mui/material/Chip'

type FileStatus = 'pending_upload' | 'active' | 'restoring' | 'ready' | 'deleted'
type RetrievalStatus = 'pending' | 'restoring' | 'ready' | 'expired' | 'failed'

type ChipSx = { bgcolor: string; color: string; border: string }

const FILE_STATUS_SX: Record<FileStatus, ChipSx> = {
  pending_upload: { bgcolor: 'rgba(113,113,122,0.15)', color: '#a1a1aa', border: '1px solid rgba(113,113,122,0.25)' },
  active:         { bgcolor: 'rgba(52,211,153,0.1)',   color: '#34d399', border: '1px solid rgba(52,211,153,0.2)'  },
  restoring:      { bgcolor: 'rgba(251,191,36,0.1)',   color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)'  },
  ready:          { bgcolor: 'rgba(96,165,250,0.1)',   color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)'  },
  deleted:        { bgcolor: 'rgba(248,113,113,0.1)',  color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' },
}

const RETRIEVAL_STATUS_SX: Record<RetrievalStatus, ChipSx> = {
  pending:   { bgcolor: 'rgba(113,113,122,0.15)', color: '#a1a1aa', border: '1px solid rgba(113,113,122,0.25)' },
  restoring: { bgcolor: 'rgba(251,191,36,0.1)',   color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)'  },
  ready:     { bgcolor: 'rgba(52,211,153,0.1)',   color: '#34d399', border: '1px solid rgba(52,211,153,0.2)'  },
  expired:   { bgcolor: 'rgba(113,113,122,0.15)', color: '#71717a', border: '1px solid rgba(113,113,122,0.2)' },
  failed:    { bgcolor: 'rgba(248,113,113,0.1)',  color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' },
}

const CHIP_BASE = { fontSize: '0.7rem', height: 22 }

export function FileStatusBadge({ status }: { status: FileStatus }) {
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return <Chip label={label} size="small" sx={{ ...CHIP_BASE, ...FILE_STATUS_SX[status] }} />
}

export function RetrievalStatusBadge({ status }: { status: RetrievalStatus }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return <Chip label={label} size="small" sx={{ ...CHIP_BASE, ...RETRIEVAL_STATUS_SX[status] }} />
}
