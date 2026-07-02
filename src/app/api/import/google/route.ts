import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { importService } from '@/server/container'
import type { DriveItem } from '@/server/providers/gdrive/gdrive.provider.interface'

// GET /api/import/google?folderId=... — list Drive files in a folder
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const folderId = req.nextUrl.searchParams.get('folderId') ?? undefined

  try {
    const items = await importService.listDriveItems(userId, folderId)
    return NextResponse.json(items)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list Drive files'
    const status = message.includes('not connected') ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

// POST /api/import/google — enqueue selected files for import
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { vaultId?: string; files?: DriveItem[] }

  if (!body.vaultId || !Array.isArray(body.files) || body.files.length === 0) {
    return NextResponse.json({ error: 'Missing vaultId or files' }, { status: 400 })
  }

  try {
    const queued = await importService.enqueueImport(userId, body.vaultId, body.files)
    return NextResponse.json({ queued }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Import failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
