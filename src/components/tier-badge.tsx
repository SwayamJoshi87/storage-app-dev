import { cn, badgeBase } from '@/lib/utils'
import type { StorageTier } from '@/server/types'

export function TierBadge({ tier }: { tier: StorageTier }) {
  return (
    <span
      className={cn(
        badgeBase,
        tier === 'cold'
          ? 'bg-blue-400/10 text-blue-400 border-blue-400/20'
          : 'bg-amber-400/10 text-amber-400 border-amber-400/20',
      )}
    >
      {tier === 'cold' ? 'Archive' : 'Instant'}
    </span>
  )
}
