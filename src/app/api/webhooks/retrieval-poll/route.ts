import { NextRequest, NextResponse } from 'next/server'
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'
import { retrievalService } from '@/server/container'

async function handler(req: NextRequest) {
  const { retrievalId } = await req.json()
  if (!retrievalId) return NextResponse.json({ error: 'Missing retrievalId' }, { status: 400 })

  try {
    await retrievalService.pollRetrievalStatus(retrievalId)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Poll failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const POST = verifySignatureAppRouter(handler)
