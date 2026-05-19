import { Badge } from '@/components/ui/badge'
import type { StorageTier } from '@/server/types'

export function TierBadge({ tier }: { tier: StorageTier }) {
  if (tier === 'cold') {
    return (
      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
        cold
      </Badge>
    )
  }
  return (
    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
      hot
    </Badge>
  )
}
