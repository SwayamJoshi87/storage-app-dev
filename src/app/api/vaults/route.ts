import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { vaultService } from '@/server/container'
import { DrizzleUserRepository } from '@/server/repositories/drizzle/user.repository'

const userRepo = new DrizzleUserRepository()

async function ensureUser(userId: string): Promise<void> {
  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses[0]?.emailAddress
  if (email) await userRepo.upsert({ id: userId, email })
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vaults = await vaultService.listVaults(userId)
  return NextResponse.json(vaults)
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  try {
    await ensureUser(userId)
    const vault = await vaultService.createVault(userId, name, description)
    return NextResponse.json(vault, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create vault'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
