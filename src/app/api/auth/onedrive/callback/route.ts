import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { userRepo } from '@/server/container'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.redirect(new URL('/sign-in', req.url))

  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) return NextResponse.redirect(new URL('/dashboard/import/onedrive?error=oauth_denied', req.url))

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

  if (!tokenRes.ok) return NextResponse.redirect(new URL('/dashboard/import/onedrive?error=token_exchange_failed', req.url))

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

  return NextResponse.redirect(new URL('/dashboard/import/onedrive', req.url))
}
