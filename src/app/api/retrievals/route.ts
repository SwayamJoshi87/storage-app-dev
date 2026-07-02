import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { retrievalService } from '@/server/container'
import { DrizzleUserRepository } from '@/server/repositories/drizzle/user.repository'
import type { RetrievalTier } from '@/server/types'

const userRepo = new DrizzleUserRepository()

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const retrievals = await retrievalService.listRetrievals(userId)
  return NextResponse.json(retrievals)
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fileId, tier = 'bulk' } = await req.json()
  if (!fileId) return NextResponse.json({ error: 'fileId is required' }, { status: 400 })

  const user = await userRepo.findById(userId)
  const userPlan = user?.plan ?? 'free'

  try {
    const retrieval = await retrievalService.requestRetrieval(
      userId,
      fileId,
      tier as RetrievalTier,
      userPlan,
    )
    return NextResponse.json(retrieval, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Request failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
