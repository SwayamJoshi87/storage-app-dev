# Archivault — Claude Code Context

## Product
Cold storage SaaS for massive files. Users upload files into vaults; files land in AWS S3 Glacier Deep Archive (cold tier) or S3 Standard-IA (hot tier). Fixed monthly pricing tiers — no surprise bills. MVP targets consumers migrating from Google Drive / OneDrive.

## Tech Stack
| Layer | Choice |
|-------|--------|
| UI + API (initial) | Next.js 15 App Router |
| UI components | shadcn/ui + Tailwind v4 |
| Auth | Clerk |
| ORM | Drizzle ORM |
| Database | Neon Postgres (serverless) |
| Storage | AWS S3 + S3 Glacier Deep Archive (AWS SDK v3) |
| Background jobs | Upstash QStash |
| Future hot storage | Backblaze B2 (behind provider interface) |

## Architecture Principle — Modular Server Layer
The server code is **framework-agnostic**. Next.js route handlers are a thin transport adapter only. Business logic lives in `src/server/` with no imports from `next/*`.

This means the entire `src/server/` directory can be extracted into a standalone Express, Fastify, NestJS, or Java Spring server without rewriting business logic.

```
Next.js Route Handler  →  Service  →  Repository  →  Drizzle / DB
                                  ↘  Provider   →  AWS SDK / Upstash
```

## Folder Structure

```
src/
  app/                          # Next.js App Router — pages and route handlers only
    (auth)/                     # Clerk sign-in/sign-up pages
    (dashboard)/                # Authenticated app pages
    api/                        # Route handlers — call services, return JSON, nothing else
      vaults/
      files/
      retrievals/
      webhooks/                 # QStash + Clerk webhooks

  server/                       # Framework-agnostic server code (portable)
    services/                   # Business logic — no HTTP, no Next.js imports
      vault.service.ts
      file.service.ts
      retrieval.service.ts
    repositories/               # Data access interfaces + Drizzle implementations
      interfaces/
        vault.repository.interface.ts
        file.repository.interface.ts
      drizzle/
        vault.repository.ts
        file.repository.ts
    providers/                  # External integrations behind interfaces
      storage/
        storage.provider.interface.ts
        s3-glacier.provider.ts  # Current implementation
      queue/
        queue.provider.interface.ts
        upstash.provider.ts     # Current implementation
    types/
      index.ts                  # Shared domain types (StorageTier, RetrievalStatus, etc.)

  db/
    schema/                     # Drizzle table definitions (one file per domain)
      users.ts
      vaults.ts
      files.ts
      retrievals.ts
    migrations/                 # Auto-generated SQL migration files — commit these
    client.ts                   # Neon + Drizzle client singleton
    index.ts                    # Re-exports schema for convenience

  components/                   # shadcn/ui components + custom composites
    ui/                         # shadcn primitives (do not edit manually)

  lib/
    utils.ts                    # shadcn cn() utility
```

## OpenAPI Spec

The API is documented in [`openapi.yaml`](./openapi.yaml) at the project root (OpenAPI 3.1.0).

**Rule: update `openapi.yaml` whenever you change the API.**
This means any time you:
- Add, rename, or delete a route handler
- Change a request body shape (add/remove/rename fields)
- Change a response shape
- Add a new query parameter or path parameter
- Change an enum value (StorageTier, FileStatus, RetrievalStatus, etc.)

Update the relevant path, schema, or component in `openapi.yaml` in the same commit as the code change. Never let the spec drift from the implementation.

## Key Conventions

### Adding a new feature
1. Add table columns to `src/db/schema/*.ts`
2. Run `npm run db:generate` — creates a migration file in `src/db/migrations/`
3. Run `npm run db:migrate` — applies migration to Neon
4. Add/update repository interface in `src/server/repositories/interfaces/`
5. Add/update Drizzle implementation in `src/server/repositories/drizzle/`
6. Write business logic in `src/server/services/`
7. Wire into a route handler in `src/app/api/` — keep it thin (validate, call service, return)
8. Update `openapi.yaml` to reflect any new or changed routes, request/response shapes, or enums

### Route handlers must stay thin
```ts
// CORRECT — route handler only handles HTTP concerns
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  const body = await req.json()
  const vault = await vaultService.createVault(userId, body.name)
  return NextResponse.json(vault, { status: 201 })
}

// WRONG — business logic in route handler
export async function POST(req: NextRequest) {
  // don't put db queries, S3 calls, or logic here
}
```

### Storage is always accessed via the provider interface
Never import the AWS SDK directly in services. Always use `IStorageProvider`.
This is what allows switching to Backblaze B2 later without touching services.

### DB migrations
- Schema changes → `npm run db:generate` → commit the generated SQL file
- Never edit generated migration files manually
- `npm run db:studio` opens Drizzle Studio for local inspection

## Storage Architecture
- One shared S3 bucket, prefix-isolated per user: `users/{userId}/vaults/{vaultId}/{fileId}`
- Object tags: `userId`, `vaultId`, `plan` — used for cost attribution via S3 Inventory
- Users never receive direct AWS credentials — all access via pre-signed URLs (15min expiry for uploads, 1hr for downloads)
- Cold tier = S3 Glacier Deep Archive (retrieval: 12–48hr)
- Hot tier = S3 Standard-IA (retrieval: instant)

## Pricing Tiers (Consumer)
| Plan | Cold Storage | Hot Storage | Retrievals/mo | Price |
|------|-------------|-------------|--------------|-------|
| Free | 25 GB | — | 1 | $0 |
| Starter | 500 GB | — | 3 | $4/mo |
| Personal | 2 TB | 50 GB | 5 | $10/mo |
| Creator | 10 TB | 200 GB | 15 | $30/mo |
| Power | 50 TB | 500 GB | 40 | $100/mo |

## MVP Phases
- **MVP 1** — Auth, create vaults, upload to Glacier, file list
- **MVP 2** — File retrieval (restore request → background job → email → download)
- **MVP 3** — Stripe subscriptions, plan limits
- **MVP 4** — Google Drive migration
- **MVP 5** — OneDrive migration
- **Future** — Compliance vaults (S3 Object Lock), file compression, Backblaze B2 hot tier, enterprise

## Optional / Aspirational Docs
Documented for future reference only — not part of any active sprint:
- [`docs/optional-mvp-2-imports-encryption.md`](./docs/optional-mvp-2-imports-encryption.md) — multi-cloud imports, client-side AES-256-GCM encryption, family plan
- [`docs/optional-mvp-4-scale.md`](./docs/optional-mvp-4-scale.md) — desktop sync, SOC 2, HIPAA, multi-region, reseller/white-label, B2/R2 backends

Do **not** implement anything from these docs without explicit discussion.

## Environment Variables
See `.env.example` for the full list. Never commit `.env.local`.

## Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run db:generate  # Generate Drizzle migration from schema changes
npm run db:migrate   # Apply migrations to Neon DB
npm run db:studio    # Open Drizzle Studio
```
