import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { userRepo } from '@/server/container'
import { GDriveImportClient } from './google-drive-import-client'

export default async function GoogleImportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await userRepo.findById(userId)
  const isConnected = !!(user?.googleAccessToken && user?.googleRefreshToken)
  const params = await searchParams

  return (
    <GDriveImportClient
      isConnected={isConnected}
      oauthError={params.error}
    />
  )
}
