---
name: mvp-progress
description: Current MVP phase completion status for Archivault
metadata:
  type: project
---

MVP 1 (auth, vaults, upload to Glacier, file list) — complete.
MVP 2 (file retrieval, Upstash QStash polling, Resend email, download URL) — complete.
MVP 3 (Stripe subscriptions, plan limits) — complete as of 2026-05-19.
MVP 4 (Google Drive migration) — complete.
MVP 5 (OneDrive migration) — complete.

**Why:** Building a cold storage SaaS with fixed-price tiers; Stripe handles subscriptions.
**How to apply:** Next sprint is polish, cleanup, tests, and auth migration away from Clerk.

## MVP 3 files added
- `src/server/providers/billing/billing.provider.interface.ts`
- `src/server/providers/billing/stripe.provider.ts`
- `src/server/services/billing.service.ts`
- `src/app/api/billing/checkout/route.ts`
- `src/app/api/billing/portal/route.ts`
- `src/app/api/webhooks/stripe/route.ts`
- `src/components/billing-actions.tsx`

## MVP 3 env vars required
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
STRIPE_PRICE_ID_STARTER, STRIPE_PRICE_ID_PERSONAL, STRIPE_PRICE_ID_CREATOR, STRIPE_PRICE_ID_POWER
