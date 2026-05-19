import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SnowflakeIcon, ShieldCheckIcon, DollarSignIcon, ArchiveIcon, CheckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PLANS = [
  { label: 'Free',     price: '$0',      cold: '25 GB',  hot: '—',       retrievals: 1  },
  { label: 'Starter',  price: '$4/mo',   cold: '500 GB', hot: '—',       retrievals: 3  },
  { label: 'Personal', price: '$10/mo',  cold: '2 TB',   hot: '50 GB',   retrievals: 5  },
  { label: 'Creator',  price: '$30/mo',  cold: '10 TB',  hot: '200 GB',  retrievals: 15 },
  { label: 'Power',    price: '$100/mo', cold: '50 TB',  hot: '500 GB',  retrievals: 40 },
]

const FEATURES = [
  {
    icon: ArchiveIcon,
    title: 'Glacier Deep Archive',
    description: 'Files land in AWS S3 Glacier Deep Archive — the cheapest durable storage on the planet. 99.999999999% durability.',
  },
  {
    icon: DollarSignIcon,
    title: 'Fixed Monthly Pricing',
    description: 'One flat fee per month. No per-GB egress charges, no surprise bills. Know exactly what you pay.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Simple Retrieval',
    description: 'Request a restore and get notified when your files are ready to download. Bulk restores in 12–48 hours.',
  },
]

export default async function LandingPage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Navbar */}
      <nav className="border-b border-zinc-800/50 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <SnowflakeIcon className="size-5 text-blue-400" />
            <span className="font-semibold tracking-tight">Archivault</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button render={<Link href="/sign-in" />} variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100">
              Sign In
            </Button>
            <Button render={<Link href="/sign-up" />} size="sm">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1 text-xs text-blue-400">
            <SnowflakeIcon className="size-3" />
            Powered by AWS S3 Glacier Deep Archive
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
            Cheap cold storage<br />for massive files.
          </h1>
          <p className="mt-4 text-lg text-zinc-400">
            No AWS bill anxiety. Fixed monthly pricing. Archive terabytes of data
            without watching a cost dashboard.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button render={<Link href="/sign-up" />} size="lg" className="w-full sm:w-auto">
              Start for free
            </Button>
            <Button render={<Link href="#pricing" />} variant="outline" size="lg" className="w-full border-zinc-700 text-zinc-300 hover:text-zinc-100 sm:w-auto">
              See pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {FEATURES.map(feature => (
              <div
                key={feature.title}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-6"
              >
                <div className="mb-4 inline-flex rounded-lg bg-blue-500/10 p-2.5 text-blue-400">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="font-semibold text-zinc-100">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-50">Simple pricing</h2>
            <p className="mt-2 text-zinc-400">Pay once a month. No per-GB surprises.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PLANS.map((plan, i) => (
              <div
                key={plan.label}
                className={`rounded-xl border p-5 flex flex-col ${
                  i === 2
                    ? 'border-blue-500/40 bg-blue-500/5'
                    : 'border-zinc-800 bg-zinc-900'
                }`}
              >
                {i === 2 && (
                  <div className="mb-3 text-xs font-medium text-blue-400">Most popular</div>
                )}
                <div className="font-semibold text-zinc-100">{plan.label}</div>
                <div className="mt-1 text-2xl font-bold tabular-nums text-zinc-50">{plan.price}</div>
                <div className="mt-4 space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <CheckIcon className="size-3.5 text-emerald-400 shrink-0" />
                    {plan.cold} cold storage
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <CheckIcon className="size-3.5 text-emerald-400 shrink-0" />
                    {plan.hot} hot storage
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <CheckIcon className="size-3.5 text-emerald-400 shrink-0" />
                    {plan.retrievals} retrieval{plan.retrievals !== 1 ? 's' : ''}/mo
                  </div>
                </div>
                <Button
                  render={<Link href="/sign-up" />}
                  size="sm"
                  variant={i === 2 ? 'default' : 'outline'}
                  className={`mt-5 w-full ${i !== 2 ? 'border-zinc-700 text-zinc-300 hover:text-zinc-100' : ''}`}
                >
                  Get started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 px-6 py-8 text-center text-xs text-zinc-600">
        <div className="flex items-center justify-center gap-2">
          <SnowflakeIcon className="size-3 text-blue-500/50" />
          <span>Archivault — Cold Storage for Massive Files</span>
        </div>
      </footer>
    </div>
  )
}
