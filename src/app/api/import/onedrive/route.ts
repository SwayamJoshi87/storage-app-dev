import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { onedriveImportService } from '@/server/container'
import type { OneDriveItem } from '@/server/providers/onedrive/onedrive.provider.interface'

// GET /api/import/onedrive?itemId=... — list OneDrive files in a folder
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const itemId = req.nextUrl.searchParams.get('itemId') ?? undefined

  try {
    const items = await onedriveImportService.listItems(userId, itemId)
    return NextResponse.json(items)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list OneDrive files'
    const status = message.includes('not connected') ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

// POST /api/import/onedrive — enqueue selected items for import
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { vaultId?: string; items?: OneDriveItem[] }

  if (!body.vaultId || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'Missing vaultId or items' }, { status: 400 })
  }

  try {
    const queued = await onedriveImportService.enqueueImport(userId, body.vaultId, body.items)
    return NextResponse.json({ queued }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Import failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
