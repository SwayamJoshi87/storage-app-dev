'use client'

import { ProgressTrack, ProgressIndicator } from '@/components/ui/progress'
import { Progress } from '@base-ui/react/progress'

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
    <Progress.Root value={pct} className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Progress.Label className="text-xs text-zinc-400">{label}</Progress.Label>
        <span className="text-xs tabular-nums text-zinc-500">
          {formatBytes(usedBytes)} / {formatBytes(limitBytes)}
        </span>
      </div>
      <ProgressTrack className="bg-zinc-800">
        <ProgressIndicator className={color} />
      </ProgressTrack>
    </Progress.Root>
  )
}

interface StorageUsageBarProps {
  plan?: keyof typeof PLAN_LIMITS
  coldUsedBytes?: number
  hotUsedBytes?: number
}

export function StorageUsageBar({
  plan = 'free',
  coldUsedBytes = 0,
  hotUsedBytes = 0,
}: StorageUsageBarProps) {
  const limits = PLAN_LIMITS[plan]

  return (
    <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Storage Usage</span>
        <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs capitalize text-zinc-400">{plan}</span>
      </div>
      <UsageRow
        label="Cold Storage"
        usedBytes={coldUsedBytes}
        limitBytes={limits.coldBytes}
        color="bg-blue-500"
      />
      {limits.hotBytes > 0 && (
        <UsageRow
          label="Hot Storage"
          usedBytes={hotUsedBytes}
          limitBytes={limits.hotBytes}
          color="bg-amber-500"
        />
      )}
    </div>
  )
}
