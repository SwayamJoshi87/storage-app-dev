import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export async function GET() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const params = new URLSearchParams({
    client_id: process.env.ONEDRIVE_CLIENT_ID ?? '',
    redirect_uri: process.env.ONEDRIVE_REDIRECT_URI ?? '',
    response_type: 'code',
    scope: 'Files.Read offline_access',
    response_mode: 'query',
  })

  redirect(`https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`)
}
