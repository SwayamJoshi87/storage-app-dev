import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { fileService } from '@/server/container'

type Params = { params: Promise<{ fileId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fileId } = await params
  const { action } = await req.json()

  if (action === 'confirm_upload') {
    try {
      const file = await fileService.confirmUpload(userId, fileId)
      return NextResponse.json(file)
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fileId } = await params
  try {
    await fileService.deleteFile(userId, fileId)
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
