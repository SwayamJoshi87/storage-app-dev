import { NextRequest, NextResponse } from 'next/server'
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'
import { importService } from '@/server/container'

async function handler(req: NextRequest) {
  const body = await req.json() as { fileId?: string; googleDriveFileId?: string; userId?: string }
  const { fileId, googleDriveFileId, userId } = body

  if (!fileId || !googleDriveFileId || !userId) {
    return NextResponse.json({ error: 'Missing fileId, googleDriveFileId, or userId' }, { status: 400 })
  }

  try {
    await importService.processImportJob(fileId, googleDriveFileId, userId)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Import job failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const POST = verifySignatureAppRouter(handler)
