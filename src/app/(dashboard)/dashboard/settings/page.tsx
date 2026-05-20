import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { userRepo } from '@/server/container'
import { fileService } from '@/server/container'
import { StorageUsageBar } from '@/components/storage-usage-bar'
import { UpgradeButton, ManageBillingButton } from '@/components/billing-actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckIcon } from 'lucide-react'

const PLANS = [
  { id: 'free',     label: 'Free',     price: '$0',      cold: '25 GB',   hot: '—',       retrievals: 1  },
  { id: 'starter',  label: 'Starter',  price: '$4/mo',   cold: '500 GB',  hot: '—',       retrievals: 3  },
  { id: 'personal', label: 'Personal', price: '$10/mo',  cold: '2 TB',    hot: '50 GB',   retrievals: 5  },
  { id: 'creator',  label: 'Creator',  price: '$30/mo',  cold: '10 TB',   hot: '200 GB',  retrievals: 15 },
  { id: 'power',    label: 'Power',    price: '$100/mo', cold: '50 TB',   hot: '500 GB',  retrievals: 40 },
] as const

type Plan = typeof PLANS[number]['id']

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const [clerkUser, dbUser, storage] = await Promise.all([
    currentUser(),
    userRepo.findById(userId),
    fileService.getStorageUsage(userId),
  ])

  const currentPlan: Plan = (dbUser?.plan as Plan) ?? 'free'
  const hasSubscription = !!dbUser?.stripeSubscriptionId

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Account and plan information</p>
      </div>

      {/* Account info */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Account</h2>
        <div className="rounded-lg border border-zinc-800 divide-y divide-zinc-800">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-400">Email</span>
            <span className="text-sm text-zinc-300">
              {clerkUser?.primaryEmailAddress?.emailAddress ?? '—'}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-400">Member since</span>
            <span className="text-sm text-zinc-300">
              {clerkUser?.createdAt
                ? new Date(clerkUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-400">Plan</span>
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 capitalize">
                {currentPlan}
              </Badge>
              <ManageBillingButton hasSubscription={hasSubscription} />
            </div>
          </div>
        </div>
      </section>

      {/* Storage usage */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Storage Usage</h2>
        <StorageUsageBar
          plan={currentPlan}
          coldUsedBytes={storage.coldBytes}
          hotUsedBytes={storage.hotBytes}
        />
      </section>

      {/* Plan comparison */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Plans</h2>
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-2.5 text-left text-xs text-zinc-500 font-medium">Plan</th>
                <th className="px-4 py-2.5 text-left text-xs text-zinc-500 font-medium">Cold</th>
                <th className="px-4 py-2.5 text-left text-xs text-zinc-500 font-medium">Hot</th>
                <th className="px-4 py-2.5 text-left text-xs text-zinc-500 font-medium">Retrievals/mo</th>
                <th className="px-4 py-2.5 text-right text-xs text-zinc-500 font-medium">Price</th>
                <th className="px-4 py-2.5 text-right text-xs text-zinc-500 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {PLANS.map(plan => (
                <tr
                  key={plan.id}
                  className={plan.id === currentPlan ? 'bg-blue-500/5' : 'hover:bg-zinc-900/50'}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {plan.id === currentPlan && <CheckIcon className="size-3.5 text-blue-400" />}
                      <span className={plan.id === currentPlan ? 'text-blue-400 font-medium' : 'text-zinc-300'}>
                        {plan.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-400">{plan.cold}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-400">{plan.hot}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-400">{plan.retrievals}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-300">{plan.price}</td>
                  <td className="px-4 py-3 text-right">
                    {plan.id !== 'free' && (
                      <UpgradeButton
                        plan={plan.id}
                        label={plan.label}
                        currentPlan={currentPlan}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Separator className="bg-zinc-800" />

      {/* Danger zone */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-red-500/70">Danger Zone</h2>
        <div className="rounded-lg border border-red-900/40 bg-red-950/10 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-300">Delete Account</p>
            <p className="text-xs text-zinc-500 mt-0.5">Permanently delete your account and all data.</p>
          </div>
          <Button variant="destructive" size="sm" disabled>
            Delete Account
          </Button>
        </div>
      </section>
    </div>
  )
}
