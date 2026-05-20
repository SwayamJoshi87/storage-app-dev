import Chip from '@mui/material/Chip'
import type { StorageTier } from '@/server/types'

export function TierBadge({ tier }: { tier: StorageTier }) {
  return (
    <Chip
      label={tier}
      size="small"
      sx={
        tier === 'cold'
          ? { bgcolor: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)', fontSize: '0.7rem', height: 22, textTransform: 'capitalize' }
          : { bgcolor: 'rgba(251,191,36,0.1)',  color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)',  fontSize: '0.7rem', height: 22, textTransform: 'capitalize' }
      }
    />
  )
}
