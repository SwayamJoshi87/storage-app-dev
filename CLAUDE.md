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

## Plain SQL Schema

A Drizzle-independent schema is maintained at [`src/db/schema.sql`](./src/db/schema.sql).

**Rule: update `src/db/schema.sql` whenever the Drizzle schema changes.**
This means any time you:
- Add, rename, or drop a table or column
- Add, rename, or drop an enum or enum value
- Add or remove an index or constraint

Make the equivalent change in `schema.sql` in the same commit as the Drizzle schema change.
To apply it to a fresh database: `psql $DATABASE_URL -f src/db/schema.sql`

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
8. Update `src/db/schema.sql` to mirror the Drizzle schema change (plain SQL, no Drizzle dependency)
9. Update `openapi.yaml` to reflect any new or changed routes, request/response shapes, or enums

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

## Frontend — Pages & Components

> Reference files before writing any UI:
> - **API contracts** → [`openapi.yaml`](./openapi.yaml) — every endpoint, request shape, and response shape
> - **Data types** → [`src/server/types/index.ts`](./src/server/types/index.ts) — `StorageTier`, `FileStatus`, `RetrievalStatus`, etc.
> - **DB columns** → [`src/db/schema.sql`](./src/db/schema.sql) — exact field names and nullability
> - **Pricing limits** → the Pricing Tiers table in this file

### Design Direction
Dark, minimal, professional. Think "arctic cold storage" — not a flashy SaaS, a serious tool.
- Background: near-black (`zinc-950` / `zinc-900`)
- Accents: cold blue (`blue-400`) for actions, `emerald-400` for success/active, `amber-400` for warnings
- Typography: clean, monospaced numbers for sizes/bytes
- No decorative animations — subtle fade/slide transitions only
- All shadcn/ui primitives live in `src/components/ui/` — use them, don't recreate them
- Custom composite components go in `src/components/` (not inside `ui/`)

### Route Map

```
src/app/
  page.tsx                          # / — Landing page (public)
  (auth)/
    sign-in/[[...sign-in]]/page.tsx # Clerk sign-in
    sign-up/[[...sign-up]]/page.tsx # Clerk sign-up
  (dashboard)/
    layout.tsx                      # Shared dashboard shell (sidebar + topbar)
    dashboard/
      page.tsx                      # /dashboard — Vault grid + storage usage
    vaults/
      [vaultId]/
        page.tsx                    # /dashboard/vaults/[vaultId] — File list + upload
    retrievals/
      page.tsx                      # /dashboard/retrievals — Active restore jobs
    settings/
      page.tsx                      # /dashboard/settings — Plan info, account
```

### Page Specs

#### `/` — Landing
- Hero: product name, one-line value prop ("Cheap cold storage for massive files. No AWS bill anxiety.")
- Three-column feature cards: Cold Storage, Fixed Pricing, Simple Retrieval
- Pricing table (pull values from the Pricing Tiers section above)
- CTA buttons → `/sign-up`
- Navbar with logo + Sign In link

#### `/dashboard` — Vault Grid
- Page header: "My Vaults" + "New Vault" button (opens `CreateVaultDialog`)
- `StorageUsageBar` component: shows cold used / cold limit and hot used / hot limit for the user's plan
- Vault grid: `VaultCard` per vault — name, file count, created date, "Open" link, kebab menu (rename, delete)
- Empty state when no vaults: illustration + "Create your first vault" CTA
- `CreateVaultDialog`: modal with name field + optional description, calls `POST /api/vaults`

#### `/dashboard/vaults/[vaultId]` — File List
- Back link to `/dashboard`
- Vault name as page heading + kebab menu (rename, delete vault)
- `UploadZone`: drag-and-drop area. On drop:
  1. `POST /api/files` with `{ vaultId, name, mimeType, sizeBytes, tier: 'cold' }`
  2. PUT file bytes directly to `uploadTarget.uploadUrl` (pre-signed S3 URL, no auth header)
  3. `PATCH /api/files/{fileId}` with `{ action: 'confirm_upload' }`
  4. Refresh file list
- File table columns: Name, Size, Tier (`TierBadge`), Status (`StatusBadge`), Uploaded, Actions
- Actions per file: Request Restore (if status=`active` and tier=`cold`), Download (if status=`ready`), Delete
- "Request Restore" calls `POST /api/retrievals` with `{ fileId, tier: 'bulk' }` — show confirmation dialog first (warns 12–48 hr wait, counts against monthly quota)
- Empty state when vault has no files

#### `/dashboard/retrievals` — Restore Jobs
- Table of active/recent retrieval jobs: File name, Vault, Tier, Status (`StatusBadge`), Requested, Ready at (estimate), Download link
- Poll `GET /api/retrievals` every 30 seconds — update status badges live
- When status = `ready`: show a "Download" button that opens `downloadUrl` in a new tab
- Empty state when no retrievals

#### `/dashboard/settings` — Account
- Current plan badge + storage usage breakdown (cold used, hot used, retrievals this month)
- Plan upgrade table (same as landing pricing table, current plan highlighted)
- Account info: email (read-only, from Clerk), member since date
- Danger zone: Delete Account (guarded by confirmation dialog) — stub for now

### Shared Components to Build

| Component | Location | Purpose |
|-----------|----------|---------|
| `VaultCard` | `src/components/vault-card.tsx` | Vault grid tile — name, metadata, actions menu |
| `FileTable` | `src/components/file-table.tsx` | Sortable file list with action buttons |
| `UploadZone` | `src/components/upload-zone.tsx` | Drag-and-drop + click-to-browse, shows per-file progress |
| `StorageUsageBar` | `src/components/storage-usage-bar.tsx` | Dual bar (cold + hot) with plan limit labels |
| `TierBadge` | `src/components/tier-badge.tsx` | `cold` = blue pill, `hot` = amber pill |
| `StatusBadge` | `src/components/status-badge.tsx` | Colour-coded pill for `FileStatus` / `RetrievalStatus` |
| `CreateVaultDialog` | `src/components/create-vault-dialog.tsx` | shadcn Dialog wrapping vault creation form |
| `DashboardShell` | `src/components/dashboard-shell.tsx` | Sidebar nav + topbar + main content slot |
| `EmptyState` | `src/components/empty-state.tsx` | Reusable empty state with icon, title, description, CTA |

### API Calling Convention
Use plain `fetch` in Server Components where data can be fetched server-side.
Use `fetch` in client components for mutations and polling. No extra data-fetching library for MVP.

```ts
// Example: fetch vaults in a Server Component
const res = await fetch('/api/vaults', {
  headers: { Cookie: cookies().toString() }, // forwards Clerk session
})
const vaults = await res.json()
```

For mutations in Client Components, call fetch directly and update local state on success. Do not use optimistic updates in MVP — keep it simple.

### Upload Flow (critical — must be exact)
```
Client                          Server                    AWS S3
  │── POST /api/files ─────────────▶│                         │
  │◀─ { file, uploadTarget } ───────│                         │
  │── PUT uploadTarget.uploadUrl ───────────────────────────▶│
  │   (direct to S3, no auth header)                         │
  │◀─ 200 OK ──────────────────────────────────────────────│
  │── PATCH /api/files/{id} ────────▶│                         │
  │   { action: 'confirm_upload' }  │                         │
  │◀─ { file: { status: 'active' }} │                         │
```
The PUT to S3 is a raw `fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })`.
Do NOT send the Clerk auth header to the S3 URL — it will break the pre-signed request.

### shadcn Components Needed
Install these before building pages:
```bash
npx shadcn@latest add dialog sheet table badge progress toast card separator skeleton avatar dropdown-menu
```

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
