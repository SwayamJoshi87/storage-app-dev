import type { IBillingProvider } from '../providers/billing/billing.provider.interface'
import type { IUserRepository } from '../repositories/interfaces/user.repository.interface'
import type { User } from '@/db/schema/users'

export type Plan = 'free' | 'starter' | 'personal' | 'creator' | 'power'

const PRICE_IDS: Record<Exclude<Plan, 'free'>, string | undefined> = {
  starter:  process.env.STRIPE_PRICE_ID_STARTER,
  personal: process.env.STRIPE_PRICE_ID_PERSONAL,
  creator:  process.env.STRIPE_PRICE_ID_CREATOR,
  power:    process.env.STRIPE_PRICE_ID_POWER,
}

// Reverse map: priceId → plan name, built lazily at first use
function buildPriceToPlanMap(): Record<string, Plan> {
  const map: Record<string, Plan> = {}
  for (const [plan, priceId] of Object.entries(PRICE_IDS)) {
    if (priceId) map[priceId] = plan as Plan
  }
  return map
}

export class BillingService {
  constructor(
    private billing: IBillingProvider,
    private userRepo: IUserRepository,
  ) {}

  /** Returns the Stripe checkout URL. Redirects user directly to Stripe. */
  async createCheckoutSession(userId: string, userEmail: string, plan: Exclude<Plan, 'free'>): Promise<string> {
    const priceId = PRICE_IDS[plan]
    if (!priceId) throw new Error(`No Stripe price configured for plan: ${plan}`)

    const user = await this.userRepo.findById(userId)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const result = await this.billing.createCheckoutSession({
      customerId: user?.stripeCustomerId ?? undefined,
      priceId,
      userId,
      userEmail,
      plan,
      successUrl: `${appUrl}/dashboard/settings?billing=success`,
      cancelUrl: `${appUrl}/dashboard/settings`,
    })
    return result.url
  }

  /** Returns the Stripe billing portal URL for subscription management. */
  async createPortalSession(userId: string): Promise<string> {
    const user = await this.userRepo.findById(userId)
    if (!user?.stripeCustomerId) throw new Error('No billing account found')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const result = await this.billing.createPortalSession({
      customerId: user.stripeCustomerId,
      returnUrl: `${appUrl}/dashboard/settings`,
    })
    return result.url
  }

  /**
   * Called by the Stripe webhook when a subscription is created or updated.
   * Syncs the plan and Stripe IDs to the user record.
   */
  async handleSubscriptionUpsert(
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    priceId: string,
    userId?: string,
  ): Promise<void> {
    const priceToPlan = buildPriceToPlanMap()
    const plan = priceToPlan[priceId]
    if (!plan) {
      // Unrecognised price — log and skip rather than crashing the webhook
      console.warn(`[billing] unknown priceId=${priceId}, skipping plan sync`)
      return
    }

    // Resolve the user: prefer explicit userId from checkout metadata, fall back to customer lookup
    let user: User | null = null
    if (userId) {
      user = await this.userRepo.findById(userId)
    }
    if (!user) {
      user = await this.userRepo.findByStripeCustomerId(stripeCustomerId)
    }
    if (!user) {
      console.warn(`[billing] no user found for customerId=${stripeCustomerId}`)
      return
    }

    await this.userRepo.update(user.id, { plan, stripeCustomerId, stripeSubscriptionId })
  }

  /**
   * Called by the Stripe webhook when a subscription is deleted.
   * Downgrades the user to the free plan.
   */
  async handleSubscriptionDeleted(stripeCustomerId: string): Promise<void> {
    const user = await this.userRepo.findByStripeCustomerId(stripeCustomerId)
    if (!user) return
    await this.userRepo.update(user.id, { plan: 'free', stripeSubscriptionId: null })
  }

  constructWebhookEvent(payload: string, signature: string): unknown {
    return this.billing.constructWebhookEvent(payload, signature)
  }
}
