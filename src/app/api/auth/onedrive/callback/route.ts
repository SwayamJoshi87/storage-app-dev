import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { userRepo } from '@/server/container'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) redirect('/dashboard/import/onedrive?error=oauth_denied')

  const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.ONEDRIVE_CLIENT_ID ?? '',
      client_secret: process.env.ONEDRIVE_CLIENT_SECRET ?? '',
      redirect_uri: process.env.ONEDRIVE_REDIRECT_URI ?? '',
      grant_type: 'authorization_code',
      scope: 'Files.Read offline_access',
    }),
  })

  if (!tokenRes.ok) redirect('/dashboard/import/onedrive?error=token_exchange_failed')

  const data = await tokenRes.json() as {
    access_token: string
    refresh_token: string
    expires_in: number
  }

  await userRepo.updateOnedriveTokens(userId, {
    onedriveAccessToken: data.access_token,
    onedriveRefreshToken: data.refresh_token,
    onedriveTokenExpiry: new Date(Date.now() + data.expires_in * 1000),
  })

  redirect('/dashboard/import/onedrive')
}
