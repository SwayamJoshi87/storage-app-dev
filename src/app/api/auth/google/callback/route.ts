import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { userRepo } from '@/server/container'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.redirect(new URL('/sign-in', req.url))

  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) return NextResponse.redirect(new URL('/dashboard/import/google?error=oauth_denied', req.url))

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? '',
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) return NextResponse.redirect(new URL('/dashboard/import/google?error=token_exchange_failed', req.url))

  const data = await tokenRes.json() as {
    access_token: string
    refresh_token: string
    expires_in: number
  }

  await userRepo.updateGoogleTokens(userId, {
    googleAccessToken: data.access_token,
    googleRefreshToken: data.refresh_token,
    googleTokenExpiry: new Date(Date.now() + data.expires_in * 1000),
  })

  return NextResponse.redirect(new URL('/dashboard/import/google', req.url))
}
