import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { onedriveImportService } from '@/server/container'

// GET /api/import/onedrive/status — poll OneDrive import jobs for the authenticated user
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const files = await onedriveImportService.getImportStatus(userId)
  return NextResponse.json(files)
}
