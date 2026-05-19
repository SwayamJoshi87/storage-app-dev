import type { Vault, NewVault } from '@/db/schema/vaults'

export interface IVaultRepository {
  findById(id: string): Promise<Vault | null>
  findByUserId(userId: string): Promise<Vault[]>
  create(vault: NewVault): Promise<Vault>
  update(id: string, data: Partial<Vault>): Promise<Vault>
  delete(id: string): Promise<void>
}
