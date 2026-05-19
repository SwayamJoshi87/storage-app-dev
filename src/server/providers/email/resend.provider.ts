import { Resend } from 'resend'
import type { IEmailProvider } from './email.provider.interface'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'Archivault <noreply@archivault.app>'

export class ResendEmailProvider implements IEmailProvider {
  async sendRetrievalReady(params: {
    to: string
    fileName: string
    downloadUrl: string
    expiresAt: Date
  }): Promise<void> {
    const expiryStr = params.expiresAt.toUTCString()
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `Your file "${params.fileName}" is ready to download`,
      html: `
        <p>Hi,</p>
        <p>Your Glacier restore for <strong>${params.fileName}</strong> has completed.</p>
        <p>
          <a href="${params.downloadUrl}" style="background:#3b82f6;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
            Download now
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px;">This link expires at ${expiryStr}.</p>
        <p style="color:#6b7280;font-size:13px;">— The Archivault Team</p>
      `,
    })
  }
}
