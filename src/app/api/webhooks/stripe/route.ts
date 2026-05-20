import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { billingService } from '@/server/container'

// Stripe requires the raw body string for signature verification — do not parse JSON
export async function POST(req: NextRequest) {
  const payload = await req.text()
  const signature = req.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = billingService.constructWebhookEvent(payload, signature) as Stripe.Event
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string
        const plan = session.metadata?.plan
        const userId = session.metadata?.userId
        const priceId = await resolvePriceIdFromSubscription(subscriptionId)
        if (priceId) {
          await billingService.handleSubscriptionUpsert(customerId, subscriptionId, priceId, userId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const priceId = sub.items.data[0]?.price.id
        const userId = sub.metadata?.userId
        if (priceId) {
          await billingService.handleSubscriptionUpsert(customerId, sub.id, priceId, userId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await billingService.handleSubscriptionDeleted(sub.customer as string)
        break
      }

      default:
        // Unhandled event types — ignore silently
        break
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook handler error'
    console.error('[stripe webhook]', message, event.type)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

/**
 * Resolves the price ID from a subscription ID.
 * Used when the checkout.session.completed event fires — the session itself
 * doesn't include line item price IDs, so we look at the subscription.
 */
async function resolvePriceIdFromSubscription(subscriptionId: string): Promise<string | null> {
  // We import Stripe lazily here to avoid module-level failures when key is missing
  const Stripe = (await import('stripe')).default
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  const stripe = new Stripe(key)
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  return sub.items.data[0]?.price.id ?? null
}
