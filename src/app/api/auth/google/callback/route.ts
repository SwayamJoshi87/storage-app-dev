import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { userRepo } from '@/server/container'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) redirect('/dashboard/import/google?error=oauth_denied')

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

  if (!tokenRes.ok) redirect('/dashboard/import/google?error=token_exchange_failed')

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

  redirect('/dashboard/import/google')
}
