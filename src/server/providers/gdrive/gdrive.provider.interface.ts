export interface DriveItem {
  id: string
  name: string
  mimeType: string
  sizeBytes: number
  isFolder: boolean
  modifiedAt: string
}

export interface IGDriveProvider {
  listItems(accessToken: string, folderId?: string): Promise<DriveItem[]>
  getFileStream(accessToken: string, fileId: string): Promise<import('stream').Readable>
  refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date }>
}
