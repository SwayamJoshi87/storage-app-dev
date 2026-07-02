import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { userRepo } from '@/server/container'
import { OneDriveImportClient } from './onedrive-import-client'

export default async function OneDriveImportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await userRepo.findById(userId)
  const isConnected = !!(user?.onedriveAccessToken && user?.onedriveRefreshToken)
  const params = await searchParams

  return (
    <OneDriveImportClient
      isConnected={isConnected}
      oauthError={params.error}
    />
  )
}
