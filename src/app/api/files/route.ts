import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { fileService } from '@/server/container'
import type { StorageTier } from '@/server/types'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { vaultId, name, mimeType, sizeBytes, tier = 'cold' } = await req.json()
  if (!vaultId || !name || !mimeType || !sizeBytes) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // TODO: read plan from DB user record once Stripe is wired up
  const userPlan = 'free'

  try {
    const result = await fileService.initiateUpload(
      userId,
      vaultId,
      name,
      mimeType,
      sizeBytes,
      tier as StorageTier,
      userPlan,
    )
    return NextResponse.json(result, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
