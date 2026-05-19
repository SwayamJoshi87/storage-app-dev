export interface IQueueProvider {
  /** Enqueue a job to be processed by the given endpoint */
  enqueue<T>(endpoint: string, payload: T, delaySeconds?: number): Promise<string>

  /** Enqueue a job to run on a recurring cron schedule */
  scheduleRecurring<T>(endpoint: string, payload: T, cronExpression: string): Promise<string>

  /** Cancel a previously scheduled job by its ID */
  cancel(jobId: string): Promise<void>
}
