import { Progress } from '@/components/ui/progress'
import { cn, formatBytes } from '@/lib/utils'
import { PLAN_LIMITS, type PlanId } from '@/lib/plans'

interface UsageRowProps {
  label: string
  usedBytes: number
  limitBytes: number
  colorClass: string
}

function UsageRow({ label, usedBytes, limitBytes, colorClass }: UsageRowProps) {
  const pct = limitBytes > 0 ? Math.min(100, (usedBytes / limitBytes) * 100) : 0
  const isWarning = pct >= 80
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn('tabular-nums font-mono', isWarning ? 'text-amber-400' : 'text-muted-foreground')}>
          {formatBytes(usedBytes)} / {formatBytes(limitBytes)}
          {isWarning && <span className="ml-1.5 text-amber-400">({Math.round(pct)}%)</span>}
        </span>
      </div>
      <Progress
        value={pct}
        className={cn('h-1.5', isWarning ? '[&>div]:bg-amber-400' : colorClass)}
      />
    </div>
  )
}

interface StorageUsageBarProps {
  plan?: PlanId
  coldUsedBytes?: number
  hotUsedBytes?: number
}

export function StorageUsageBar({ plan = 'free', coldUsedBytes = 0, hotUsedBytes = 0 }: StorageUsageBarProps) {
  const limits = PLAN_LIMITS[plan]
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Storage Usage
        </span>
        <span className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground capitalize bg-muted/40">
          {plan}
        </span>
      </div>
      <UsageRow
        label="Archive"
        usedBytes={coldUsedBytes}
        limitBytes={limits.coldBytes}
        colorClass="[&>div]:bg-blue-400"
      />
      {limits.hotBytes > 0 && (
        <UsageRow
          label="Instant Access"
          usedBytes={hotUsedBytes}
          limitBytes={limits.hotBytes}
          colorClass="[&>div]:bg-amber-400"
        />
      )}
    </div>
  )
}
