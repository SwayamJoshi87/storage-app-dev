export interface OneDriveItem {
  id: string
  name: string
  mimeType: string
  sizeBytes: number
  isFolder: boolean
  modifiedAt: string
}

export interface IOneDriveProvider {
  listItems(accessToken: string, itemId?: string): Promise<OneDriveItem[]>
  getFileStream(accessToken: string, itemId: string): Promise<import('stream').Readable>
  refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date }>
}
