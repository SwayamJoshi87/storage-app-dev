import { NextRequest, NextResponse } from 'next/server'
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'
import { onedriveImportService } from '@/server/container'

async function handler(req: NextRequest) {
  const body = await req.json() as { fileId?: string; onedriveItemId?: string; userId?: string }
  const { fileId, onedriveItemId, userId } = body

  if (!fileId || !onedriveItemId || !userId) {
    return NextResponse.json({ error: 'Missing fileId, onedriveItemId, or userId' }, { status: 400 })
  }

  try {
    await onedriveImportService.processImportJob(fileId, onedriveItemId, userId)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Import job failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const POST = verifySignatureAppRouter(handler)
