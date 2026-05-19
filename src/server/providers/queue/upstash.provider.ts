import { Client } from '@upstash/qstash'
import type { IQueueProvider } from './queue.provider.interface'

const qstash = new Client({ token: process.env.QSTASH_TOKEN! })

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!

export class UpstashQueueProvider implements IQueueProvider {
  async enqueue<T>(endpoint: string, payload: T, delaySeconds = 0): Promise<string> {
    const res = await qstash.publishJSON({
      url: `${BASE_URL}${endpoint}`,
      body: payload,
      delay: delaySeconds,
    })
    return res.messageId
  }

  async scheduleRecurring<T>(endpoint: string, payload: T, cron: string): Promise<string> {
    const res = await qstash.schedules.create({
      destination: `${BASE_URL}${endpoint}`,
      cron,
      body: JSON.stringify(payload),
    })
    return res.scheduleId
  }

  async cancel(jobId: string): Promise<void> {
    await qstash.messages.delete(jobId)
  }
}
