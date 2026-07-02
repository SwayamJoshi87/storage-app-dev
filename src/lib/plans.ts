export type PlanId = 'free' | 'starter' | 'personal' | 'creator' | 'power'

export interface PlanLimit {
  coldBytes: number
  hotBytes: number
  retrievalsPerMonth: number
}

export interface PlanMeta {
  id: PlanId
  label: string
  price: string
  archive: string
  instant: string
  restores: number
}

export const PLAN_LIMITS: Record<PlanId, PlanLimit> = {
  free:     { coldBytes: 25  * 1024 ** 3, hotBytes: 0,                 retrievalsPerMonth: 1  },
  starter:  { coldBytes: 500 * 1024 ** 3, hotBytes: 0,                 retrievalsPerMonth: 3  },
  personal: { coldBytes: 2   * 1024 ** 4, hotBytes: 50  * 1024 ** 3,   retrievalsPerMonth: 5  },
  creator:  { coldBytes: 10  * 1024 ** 4, hotBytes: 200 * 1024 ** 3,   retrievalsPerMonth: 15 },
  power:    { coldBytes: 50  * 1024 ** 4, hotBytes: 500 * 1024 ** 3,   retrievalsPerMonth: 40 },
}

export const RETRIEVAL_LIMITS: Record<PlanId, number> = {
  free: 1, starter: 3, personal: 5, creator: 15, power: 40,
}

export const PLANS: PlanMeta[] = [
  { id: 'free',     label: 'Free',     price: '$0',      archive: '25 GB',  instant: '—',       restores: 1  },
  { id: 'starter',  label: 'Starter',  price: '$4/mo',   archive: '500 GB', instant: '—',       restores: 3  },
  { id: 'personal', label: 'Personal', price: '$10/mo',  archive: '2 TB',   instant: '50 GB',   restores: 5  },
  { id: 'creator',  label: 'Creator',  price: '$30/mo',  archive: '10 TB',  instant: '200 GB',  restores: 15 },
  { id: 'power',    label: 'Power',    price: '$100/mo', archive: '50 TB',  instant: '500 GB',  restores: 40 },
]
