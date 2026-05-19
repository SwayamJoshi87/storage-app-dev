import { Client } from '@upstash/qstash'
import type { IQueueProvider } from './queue.provider.interface'

export class UpstashQueueProvider implements IQueueProvider {
  private qstash = new Client({ token: process.env.QSTASH_TOKEN ?? '' })
  private baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  async enqueue<T>(endpoint: string, payload: T, delaySeconds = 0): Promise<string> {
    const res = await this.qstash.publishJSON({
      url: `${this.baseUrl}${endpoint}`,
      body: payload,
      delay: delaySeconds,
    })
    return res.messageId
  }

  async scheduleRecurring<T>(endpoint: string, payload: T, cron: string): Promise<string> {
    const res = await this.qstash.schedules.create({
      destination: `${this.baseUrl}${endpoint}`,
      cron,
      body: JSON.stringify(payload),
    })
    return res.scheduleId
  }

  async cancel(jobId: string): Promise<void> {
    await this.qstash.messages.delete(jobId)
  }
}
