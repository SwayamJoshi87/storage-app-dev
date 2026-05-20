import Stripe from 'stripe'
import type { IBillingProvider, CheckoutSessionResult, PortalSessionResult } from './billing.provider.interface'

export class StripeProvider implements IBillingProvider {
  private get stripe(): Stripe {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
    return new Stripe(key)
  }

  async createCheckoutSession(params: {
    customerId?: string
    priceId: string
    userId: string
    userEmail: string
    plan: string
    successUrl: string
    cancelUrl: string
  }): Promise<CheckoutSessionResult> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: params.customerId,
      customer_email: params.customerId ? undefined : params.userEmail,
      line_items: [{ price: params.priceId, quantity: 1 }],
      subscription_data: {
        metadata: { userId: params.userId, plan: params.plan },
      },
      metadata: { userId: params.userId, plan: params.plan },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    })
    return { url: session.url! }
  }

  async createPortalSession(params: {
    customerId: string
    returnUrl: string
  }): Promise<PortalSessionResult> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    })
    return { url: session.url }
  }

  constructWebhookEvent(payload: string, signature: string): unknown {
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not set')
    return this.stripe.webhooks.constructEvent(payload, signature, secret)
  }
}
