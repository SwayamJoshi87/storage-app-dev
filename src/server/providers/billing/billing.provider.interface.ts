export interface CheckoutSessionResult {
  url: string
}

export interface PortalSessionResult {
  url: string
}

export interface IBillingProvider {
  createCheckoutSession(params: {
    customerId?: string
    priceId: string
    userId: string
    userEmail: string
    plan: string
    successUrl: string
    cancelUrl: string
  }): Promise<CheckoutSessionResult>

  createPortalSession(params: {
    customerId: string
    returnUrl: string
  }): Promise<PortalSessionResult>

  constructWebhookEvent(payload: string, signature: string): unknown
}
