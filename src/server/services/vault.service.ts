import { createId } from '@paralleldrive/cuid2'
import type { IVaultRepository } from '../repositories/interfaces/vault.repository.interface'
import type { Vault } from '@/db/schema/vaults'

export class VaultService {
  constructor(private vaultRepo: IVaultRepository) {}

  async createVault(userId: string, name: string, description?: string): Promise<Vault> {
    return this.vaultRepo.create({
      id: createId(),
      userId,
      name: name.trim(),
      description: description?.trim() ?? null,
    })
  }

  async listVaults(userId: string): Promise<Vault[]> {
    return this.vaultRepo.findByUserId(userId)
  }

  async getVault(userId: string, vaultId: string): Promise<Vault> {
    const vault = await this.vaultRepo.findById(vaultId)
    if (!vault || vault.userId !== userId) {
      throw new Error('Vault not found')
    }
    return vault
  }

  async renameVault(userId: string, vaultId: string, name: string): Promise<Vault> {
    await this.getVault(userId, vaultId) // ownership check
    return this.vaultRepo.update(vaultId, { name: name.trim() })
  }

  async deleteVault(userId: string, vaultId: string): Promise<void> {
    await this.getVault(userId, vaultId) // ownership check
    await this.vaultRepo.delete(vaultId)
  }
}
