# Archivault

Cold storage for massive files — cheap, simple, and reliable. Built on AWS S3 Glacier Deep Archive with a consumer-friendly fixed-price model.

## What it does
- Upload files into named **vaults** — they land in Glacier Deep Archive at ~$1/TB/month
- **Hot tier** for files you need occasionally (S3 Standard-IA)
- Request retrieval — restored files ready in 12–48 hours, notified by email
- Fixed monthly plans — no AWS bill anxiety
- Migrate files directly from Google Drive / OneDrive (MVP 4+)

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **UI**: shadcn/ui + Tailwind v4
- **Auth**: Clerk
- **Database**: Neon Postgres + Drizzle ORM
- **Storage**: AWS S3 + Glacier Deep Archive
- **Background jobs**: Upstash QStash

## Project Structure
```
src/
  app/              # Next.js pages and API route handlers (thin layer)
  server/           # Framework-agnostic business logic
    services/       # Core business logic
    repositories/   # Data access (interfaces + Drizzle implementations)
    providers/      # External services (storage, queue) behind interfaces
    types/          # Shared domain types
  db/
    schema/         # Drizzle table definitions
    migrations/     # Versioned SQL migration files (committed to git)
    client.ts       # DB connection singleton
  components/       # UI components
  lib/              # Shared utilities
```

See [CLAUDE.md](./CLAUDE.md) for full architecture details and conventions.

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env.local
```
Fill in all values — see comments in `.env.example`.

### 3. Run DB migrations
```bash
npm run db:migrate
```

### 4. Start dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Commands
```bash
npm run db:generate   # Generate migration after schema changes
npm run db:migrate    # Apply pending migrations to Neon
npm run db:studio     # Open Drizzle Studio (local DB browser)
```

## Adding a Feature
1. Update `src/db/schema/` → run `db:generate` → run `db:migrate`
2. Add/update repository interface in `src/server/repositories/interfaces/`
3. Implement in `src/server/repositories/drizzle/`
4. Write business logic in `src/server/services/`
5. Add thin route handler in `src/app/api/`

## Plans
| Plan | Cold Storage | Price |
|------|-------------|-------|
| Free | 25 GB | $0 |
| Starter | 500 GB | $4/mo |
| Personal | 2 TB | $10/mo |
| Creator | 10 TB | $30/mo |
| Power | 50 TB | $100/mo |

## Roadmap
- [x] MVP 1 — Vaults, upload, file list
- [ ] MVP 2 — Retrieval (restore + download)
- [ ] MVP 3 — Stripe subscriptions
- [ ] MVP 4 — Google Drive migration
- [ ] MVP 5 — OneDrive migration
- [ ] Future — Compliance vaults, file compression, Backblaze B2

## Optional / Future Aspirational Docs
These are documented for reference only — not planned or committed:
- [docs/optional-mvp-2-imports-encryption.md](./docs/optional-mvp-2-imports-encryption.md) — multi-cloud imports (Drive, OneDrive, Dropbox, Photos), client-side AES-256-GCM encryption, family plan
- [docs/optional-mvp-4-scale.md](./docs/optional-mvp-4-scale.md) — desktop sync agent, SOC 2, HIPAA BAA, multi-region, reseller/white-label, B2/R2 backends
