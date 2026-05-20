import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

const PLAN_LIMITS = {
  free:     { coldBytes: 25  * 1024 ** 3, hotBytes: 0 },
  starter:  { coldBytes: 500 * 1024 ** 3, hotBytes: 0 },
  personal: { coldBytes: 2   * 1024 ** 4, hotBytes: 50  * 1024 ** 3 },
  creator:  { coldBytes: 10  * 1024 ** 4, hotBytes: 200 * 1024 ** 3 },
  power:    { coldBytes: 50  * 1024 ** 4, hotBytes: 500 * 1024 ** 3 },
} as const

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

interface UsageRowProps {
  label: string
  usedBytes: number
  limitBytes: number
  color: string
}

function UsageRow({ label, usedBytes, limitBytes, color }: UsageRowProps) {
  const pct = limitBytes > 0 ? Math.min(100, (usedBytes / limitBytes) * 100) : 0
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="caption" color="#52525b" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatBytes(usedBytes)} / {formatBytes(limitBytes)}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{ '& .MuiLinearProgress-bar': { bgcolor: color } }}
      />
    </Box>
  )
}

interface StorageUsageBarProps {
  plan?: keyof typeof PLAN_LIMITS
  coldUsedBytes?: number
  hotUsedBytes?: number
}

export function StorageUsageBar({ plan = 'free', coldUsedBytes = 0, hotUsedBytes = 0 }: StorageUsageBarProps) {
  const limits = PLAN_LIMITS[plan]
  return (
    <Box sx={{ border: '1px solid #27272a', borderRadius: 2, bgcolor: 'background.paper', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a' }}>
          Storage Usage
        </Typography>
        <Chip label={plan} size="small" sx={{ bgcolor: '#27272a', color: '#a1a1aa', fontSize: '0.7rem', height: 20, textTransform: 'capitalize' }} />
      </Box>
      <UsageRow label="Cold Storage" usedBytes={coldUsedBytes} limitBytes={limits.coldBytes} color="#60a5fa" />
      {limits.hotBytes > 0 && (
        <UsageRow label="Hot Storage" usedBytes={hotUsedBytes} limitBytes={limits.hotBytes} color="#fbbf24" />
      )}
    </Box>
  )
}
