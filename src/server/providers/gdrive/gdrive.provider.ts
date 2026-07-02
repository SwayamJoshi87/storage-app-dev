import type { DriveItem, IGDriveProvider } from './gdrive.provider.interface'

const FOLDER_MIME = 'application/vnd.google-apps.folder'

export class GDriveProvider implements IGDriveProvider {
  private get clientId() { return process.env.GOOGLE_CLIENT_ID ?? '' }
  private get clientSecret() { return process.env.GOOGLE_CLIENT_SECRET ?? '' }

  async listItems(accessToken: string, folderId = 'root'): Promise<DriveItem[]> {
    const q = `'${folderId}' in parents and trashed = false`
    const fields = 'files(id,name,mimeType,size,modifiedTime)'
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&pageSize=100&orderBy=folder,name`

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Drive API error ${res.status}: ${text}`)
    }

    const data = await res.json() as { files: Array<{ id: string; name: string; mimeType: string; size?: string; modifiedTime: string }> }
    return (data.files ?? []).map(f => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      sizeBytes: f.mimeType === FOLDER_MIME ? 0 : parseInt(f.size ?? '0', 10),
      isFolder: f.mimeType === FOLDER_MIME,
      modifiedAt: f.modifiedTime,
    }))
  }

  async getFileStream(accessToken: string, fileId: string): Promise<import('stream').Readable> {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Drive download error ${res.status}: ${text}`)
    }
    if (!res.body) throw new Error('No response body from Google Drive')

    const { Readable } = await import('stream')
    return Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0])
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date }> {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Token refresh failed ${res.status}: ${text}`)
    }
    const data = await res.json() as { access_token: string; expires_in: number }
    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    }
  }
}
