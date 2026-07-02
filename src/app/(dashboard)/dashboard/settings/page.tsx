import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Check } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StorageUsageBar } from '@/components/storage-usage-bar'
import { UpgradeButton, ManageBillingButton } from '@/components/billing-actions'
import { userRepo, fileService } from '@/server/container'
import { cn } from '@/lib/utils'
import { SectionLabel } from '@/components/section-label'
import type { Plan } from '@/server/services/billing.service'
import { PLANS, type PlanId } from '@/lib/plans'

type PlanRow = typeof PLANS[number]

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div>{value}</div>
    </div>
  )
}

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const [clerkUser, dbUser, storage] = await Promise.all([
    currentUser(),
    userRepo.findById(userId),
    fileService.getStorageUsage(userId),
  ])

  const currentPlan = (dbUser?.plan ?? 'free') as Plan
  const hasSubscription = !!dbUser?.stripeSubscriptionId

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-base font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Account and plan information</p>
      </div>

      {/* Account info */}
      <div className="space-y-3">
        <SectionLabel>Account</SectionLabel>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <InfoRow
            label="Email"
            value={
              <span className="text-sm text-foreground">
                {clerkUser?.primaryEmailAddress?.emailAddress ?? '—'}
              </span>
            }
          />
          <Separator />
          <InfoRow
            label="Member since"
            value={
              <span className="text-sm text-foreground">
                {clerkUser?.createdAt
                  ? new Date(clerkUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : '—'}
              </span>
            }
          />
          <Separator />
          <InfoRow
            label="Plan"
            value={
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 text-xs font-medium text-blue-400 capitalize">
                  {currentPlan}
                </span>
                <ManageBillingButton hasSubscription={hasSubscription} />
              </div>
            }
          />
        </div>
      </div>

      {/* Storage usage */}
      <div className="space-y-3">
        <SectionLabel>Storage Usage</SectionLabel>
        <StorageUsageBar
          plan={currentPlan as PlanId}
          coldUsedBytes={storage.coldBytes}
          hotUsedBytes={storage.hotBytes}
        />
      </div>

      {/* Plans table */}
      <div className="space-y-3">
        <SectionLabel>Plans</SectionLabel>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-xs">Plan</TableHead>
                <TableHead className="text-xs">Archive</TableHead>
                <TableHead className="text-xs">Instant</TableHead>
                <TableHead className="text-xs">Restores/mo</TableHead>
                <TableHead className="text-xs text-right">Price</TableHead>
                <TableHead className="text-xs" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {PLANS.map((plan: PlanRow) => {
                const active = plan.id === currentPlan
                return (
                  <TableRow
                    key={plan.id}
                    className={cn('border-border', active ? 'bg-blue-400/5 hover:bg-blue-400/5' : 'hover:bg-muted/30')}
                  >
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {active && <Check size={11} className="text-blue-400 shrink-0" />}
                        <span className={cn('text-sm', active ? 'font-semibold text-blue-400' : 'text-foreground')}>
                          {plan.label}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground tabular-nums">{plan.archive}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground tabular-nums">{plan.instant}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground tabular-nums">{plan.restores}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs text-foreground tabular-nums">{plan.price}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {plan.id !== 'free' && (
                        <UpgradeButton
                          plan={plan.id as Exclude<Plan, 'free'>}
                          label={plan.label}
                          currentPlan={currentPlan}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Separator />

      {/* Danger zone */}
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-widest text-red-400/60">Danger Zone</p>
        <div className="flex items-center justify-between rounded-lg border border-red-900/30 bg-red-950/20 dark:bg-red-950/10 p-4">
          <div>
            <p className="text-sm font-medium text-foreground">Delete Account</p>
            <p className="text-xs text-muted-foreground mt-0.5">Permanently delete your account and all data.</p>
          </div>
          <button
            disabled
            className="inline-flex items-center rounded-md border border-red-800/40 bg-red-900/20 px-3 py-1.5 text-xs font-medium text-red-400/60 cursor-not-allowed"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}
