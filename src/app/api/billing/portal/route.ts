import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { billingService } from '@/server/container'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const url = await billingService.createPortalSession(userId)
    return NextResponse.json({ url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create portal session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
