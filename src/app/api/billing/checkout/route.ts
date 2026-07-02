import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { billingService, userRepo } from '@/server/container'
import type { Plan } from '@/server/services/billing.service'

const PAID_PLANS: Exclude<Plan, 'free'>[] = ['starter', 'personal', 'creator', 'power']

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json()
  if (!plan || !PAID_PLANS.includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  try {
    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress
    if (!email) return NextResponse.json({ error: 'No email on account' }, { status: 400 })

    // Ensure the user row exists in the DB so the webhook can find and update it
    await userRepo.upsert({ id: userId, email })

    const url = await billingService.createCheckoutSession(userId, email, plan)
    return NextResponse.json({ url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
