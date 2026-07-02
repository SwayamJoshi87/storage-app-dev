import type { OneDriveItem, IOneDriveProvider } from './onedrive.provider.interface'

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'
const SELECT = '$select=id,name,file,folder,size,lastModifiedDateTime'

interface GraphItem {
  id: string
  name: string
  file?: { mimeType: string }
  folder?: { childCount: number }
  size?: number
  lastModifiedDateTime: string
}

export class OneDriveProvider implements IOneDriveProvider {
  private get clientId() { return process.env.ONEDRIVE_CLIENT_ID ?? '' }
  private get clientSecret() { return process.env.ONEDRIVE_CLIENT_SECRET ?? '' }

  async listItems(accessToken: string, itemId?: string): Promise<OneDriveItem[]> {
    const path = itemId
      ? `${GRAPH_BASE}/me/drive/items/${itemId}/children`
      : `${GRAPH_BASE}/me/drive/root/children`

    const res = await fetch(`${path}?${SELECT}&$orderby=folder desc,name asc&$top=200`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Microsoft Graph error ${res.status}: ${text}`)
    }

    const data = await res.json() as { value: GraphItem[] }
    return (data.value ?? []).map(item => ({
      id: item.id,
      name: item.name,
      mimeType: item.file?.mimeType ?? 'application/vnd.microsoft.folder',
      sizeBytes: item.size ?? 0,
      isFolder: !!item.folder,
      modifiedAt: item.lastModifiedDateTime,
    }))
  }

  async getFileStream(accessToken: string, itemId: string): Promise<import('stream').Readable> {
    // /content redirects (302) to a pre-authenticated Azure Blob URL.
    // fetch follows the redirect; the Authorization header is stripped on the
    // cross-origin redirect by the runtime, which is correct — the redirect
    // target uses a SAS token embedded in the URL for auth.
    const res = await fetch(`${GRAPH_BASE}/me/drive/items/${itemId}/content`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`OneDrive download error ${res.status}: ${text}`)
    }
    if (!res.body) throw new Error('No response body from OneDrive')

    const { Readable } = await import('stream')
    return Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0])
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date }> {
    const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'Files.Read offline_access',
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`OneDrive token refresh failed ${res.status}: ${text}`)
    }
    const data = await res.json() as { access_token: string; expires_in: number }
    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    }
  }
}
