import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { vaultService } from '@/server/container'

type Params = { params: Promise<{ vaultId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { vaultId } = await params
  try {
    const vault = await vaultService.getVault(userId, vaultId)
    return NextResponse.json(vault)
  } catch {
    return NextResponse.json({ error: 'Vault not found' }, { status: 404 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { vaultId } = await params
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  try {
    const vault = await vaultService.renameVault(userId, vaultId, name)
    return NextResponse.json(vault)
  } catch {
    return NextResponse.json({ error: 'Vault not found' }, { status: 404 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { vaultId } = await params
  try {
    await vaultService.deleteVault(userId, vaultId)
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Vault not found' }, { status: 404 })
  }
}
