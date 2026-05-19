import { DrizzleUserRepository } from './repositories/drizzle/user.repository'
import { DrizzleVaultRepository } from './repositories/drizzle/vault.repository'
import { DrizzleFileRepository } from './repositories/drizzle/file.repository'
import { DrizzleRetrievalRepository } from './repositories/drizzle/retrieval.repository'
import { S3GlacierProvider } from './providers/storage/s3-glacier.provider'
import { UpstashQueueProvider } from './providers/queue/upstash.provider'
import { ResendEmailProvider } from './providers/email/resend.provider'
import { VaultService } from './services/vault.service'
import { FileService } from './services/file.service'
import { RetrievalService } from './services/retrieval.service'

// Singletons — safe in serverless since modules are cached per instance
const userRepo = new DrizzleUserRepository()
const vaultRepo = new DrizzleVaultRepository()
const fileRepo = new DrizzleFileRepository()
const retrievalRepo = new DrizzleRetrievalRepository()
const storageProvider = new S3GlacierProvider()
const queueProvider = new UpstashQueueProvider()
const emailProvider = new ResendEmailProvider()

export const vaultService = new VaultService(vaultRepo)
export const fileService = new FileService(fileRepo, vaultRepo, storageProvider)
export const retrievalService = new RetrievalService(
  retrievalRepo,
  fileRepo,
  userRepo,
  storageProvider,
  queueProvider,
  emailProvider,
)
