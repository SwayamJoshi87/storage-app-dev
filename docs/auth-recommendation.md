# Auth recommendation: replace Clerk

## Why move away from Clerk?

- **Cost at scale:** Clerk charges per monthly active user (MAU). For a storage SaaS with low-margin, fixed-price tiers, auth can become a meaningful cost center.
- **Vendor lock-in:** User identities live in Clerk. Migrating later is harder than doing it now.
- **You already own the database:** The app uses Neon Postgres + Drizzle. Storing users/sessions in your own DB is straightforward and keeps all data in one place.
- **Clerk-specific APIs leak everywhere:** route handlers, server components, and providers all import `@clerk/nextjs`. Replacing it with a self-hosted solution makes the architecture more portable.

## Recommended replacement: Better Auth

**[Better Auth](https://www.better-auth.com/)** is the best fit for this project.

### Why Better Auth over the alternatives?

| Option | Pros | Cons |
|--------|------|------|
| **Better Auth** | Own DB, modern API, works with Next.js App Router, supports OAuth + magic links + passkeys, type-safe, minimal lock-in | Newer project; community smaller than Auth.js |
| **Auth.js (NextAuth v5)** | Very popular, lots of examples | Beta for v5; API churn; session handling can be awkward with App Router |
| **Lucia v3** | Lightweight | Recently restructured/deprecated in its old form; more manual wiring |
| **Supabase Auth** | Great if using Supabase | Ties you to Supabase; overkill when you already use Neon |
| **Custom JWT/sessions** | Full control | Easy to get wrong (security, token refresh, CSRF, OAuth) |
| **Auth0 / Firebase Auth** | Enterprise features | Same lock-in/cost problem as Clerk |

### What Better Auth gives Archivault

- **Email/password auth** out of the box.
- **OAuth providers** (Google, Microsoft, GitHub, etc.) with a few lines of config.
- **Sessions stored in Postgres** via Drizzle adapter.
- **Organization/team support** if you ever need multi-user vaults.
- **Rate limiting and brute-force protection** hooks.
- **No per-user cost.**

## High-level migration plan

### 1. Install and configure

```bash
npm install better-auth
```

Create `src/lib/auth.ts`:

```ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/db/client'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
    },
    microsoft: {
      clientId: process.env.ONEDRIVE_CLIENT_ID!,
      clientSecret: process.env.ONEDRIVE_CLIENT_SECRET!,
      redirectURI: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/microsoft`,
    },
  },
})
```

### 2. Expose the auth API route

Create `src/app/api/auth/[...all]/route.ts`:

```ts
import { auth } from '@/lib/auth'

export const { GET, POST } = auth.handler
```

### 3. Replace Clerk helpers

| Clerk usage | Better Auth replacement |
|-------------|------------------------|
| `import { auth } from '@clerk/nextjs/server'` then `await auth()` | `import { auth } from '@/lib/auth'` then `await auth.api.getSession({ headers: req.headers })` or use the client `useSession` hook |
| `<ClerkProvider>` | `<AuthProvider>` from Better Auth client |
| `<SignIn />` / `<SignUp />` | Build your own pages or use the pre-built `SignIn` / `SignUp` components |
| `currentUser()` | `auth.api.getSession(...)` + your user repository |
| `auth.protect()` in `proxy.ts` | Check for session in middleware/proxy and redirect to `/sign-in` |

### 4. Update the `users` table

Better Auth needs its own session/verification tables. You can either:

- Let Better Auth manage a separate set of tables (recommended — keeps auth schema isolated).
- Map its schema onto the existing `users` table.

The existing `users.id` column is already a text PK, which aligns with Better Auth's default user ID format.

### 5. Update environment variables

Remove:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
```

Add:

```bash
BETTER_AUTH_SECRET=           # random 32-byte secret
BETTER_AUTH_URL=http://localhost:3000
```

Google/Microsoft OAuth env vars can stay; only the redirect URIs change.

### 6. Update sign-in / sign-up pages

Replace `(auth)/sign-in/[[...sign-in]]/page.tsx` and `(auth)/sign-up/[[...sign-up]]/page.tsx` with simple forms that call Better Auth's client methods:

```ts
import { authClient } from '@/lib/auth-client'

// sign in
await authClient.signIn.email({ email, password })

// sign up
await authClient.signUp.email({ email, password, name })

// OAuth
await authClient.signIn.social({ provider: 'google' })
```

### 7. Replace `proxy.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const PUBLIC = new Set(['/', '/sign-in', '/sign-up'])
const PUBLIC_PREFIXES = ['/api/auth/', '/api/webhooks/']

export default async function proxy(req: NextRequest) {
  const isPublic =
    PUBLIC.has(req.nextUrl.pathname) ||
    PUBLIC_PREFIXES.some(p => req.nextUrl.pathname.startsWith(p))

  if (isPublic) return NextResponse.next()

  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}
```

### 8. Update route handlers

Replace Clerk's `auth()` with session lookup:

```ts
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  // ... rest of handler
}
```

## Suggested rollout order

1. Add Better Auth alongside Clerk (dual-write user records if needed).
2. Build new sign-in/sign-up pages under `/auth/sign-in` and `/auth/sign-up`.
3. Migrate one dashboard route at a time from Clerk to Better Auth session checks.
4. Update `proxy.ts` to use Better Auth.
5. Remove Clerk env vars, package, and components.
6. Run smoke tests for sign-in, OAuth, checkout, and imports.

## Estimated effort

- **Core auth swap:** 1–2 days for a single developer familiar with the codebase.
- **OAuth reconnections:** Google Drive and OneDrive imports need their OAuth redirect URIs updated; the token storage logic in `users` stays the same.
- **Testing:** Add at least one happy-path test for sign-in and one for a protected API route.
