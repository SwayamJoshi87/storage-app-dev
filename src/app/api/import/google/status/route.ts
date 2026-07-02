import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { importService } from '@/server/container'

// GET /api/import/google/status — poll Google Drive import jobs for the authenticated user
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const files = await importService.getImportStatus(userId)
  return NextResponse.json(files)
}
