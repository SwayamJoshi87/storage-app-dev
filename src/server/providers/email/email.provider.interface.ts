export interface IEmailProvider {
  sendRetrievalReady(params: {
    to: string
    fileName: string
    downloadUrl: string
    expiresAt: Date
  }): Promise<void>
}
