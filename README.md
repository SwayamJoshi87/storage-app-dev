# Archivault

Cold storage SaaS for massive files. Upload terabytes into AWS S3 Glacier Deep Archive at a flat monthly rate — no per-GB egress surprises.

## Features

- **Vaults** — organize files into named collections
- **Glacier upload** — files land in S3 Glacier Deep Archive (cold) or S3 Standard-IA (hot)
- **Restore jobs** — request a restore, get an email when the file is ready to download (12–48 hr for bulk)
- **Fixed pricing** — Free → Starter ($4) → Personal ($10) → Creator ($30) → Power ($100)

## Tech stack

| Layer | Choice |
|---|---|
| UI + API | Next.js 15 App Router |
| Components | shadcn/ui + Tailwind v4 |
| Auth | Clerk |
| ORM | Drizzle ORM |
| Database | Neon Postgres |
| Storage | AWS S3 + Glacier Deep Archive |
| Background jobs | Upstash QStash |
| Email | Resend |

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/SwayamJoshi87/storage-app-dev.git
cd storage-app-dev
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in the values in `.env.local`. You need accounts for:

- [Neon](https://neon.tech) — serverless Postgres
- [Clerk](https://clerk.com) — auth
- [AWS](https://aws.amazon.com) — S3 bucket with Glacier Deep Archive enabled
- [Upstash](https://upstash.com) — QStash for background jobs
- [Resend](https://resend.com) — transactional email

### 3. Database setup

```bash
npm run db:migrate
```

### 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate a Drizzle migration from schema changes |
| `npm run db:migrate` | Apply pending migrations to Neon |
| `npm run db:studio` | Open Drizzle Studio (local DB browser) |

## AWS IAM permissions required

The IAM user behind `AWS_ACCESS_KEY_ID` needs these S3 actions on your bucket:

```
s3:PutObject
s3:GetObject
s3:DeleteObject
s3:RestoreObject
s3:HeadObject
```

## Architecture

```
Next.js Route Handler  ->  Service  ->  Repository  ->  Drizzle / Neon
                                    \>  Provider   ->  AWS SDK / Upstash / Resend
```

Business logic lives entirely in `src/server/` with no imports from `next/*`, making it portable to any Node.js server.

## Upload flow

```
Client                      Server                   AWS S3
  |-- POST /api/files ---------> |                       |
  |<- { file, uploadTarget } ----| 				          |
  |-- PUT uploadTarget.uploadUrl ----------------------> |
  |   (direct to S3, no auth header needed)             |
  |<- 200 OK ------------------------------------------------|
  |-- PATCH /api/files/{id} ----> |                      |
  |   { action: confirm_upload }  |                      |
  |<- { file: { status: active }} |                      |
```

## Retrieval flow

```
Client            Server              QStash          AWS Glacier
  |-- POST /api/retrievals --> |                           |
  |                            |-- initiateRestore ------> |
  |                            |-- enqueue poll (30 min) -> |
  |<- { retrieval } -----------|                           |
  |                            |<-- POST /api/webhooks/retrieval-poll
  |                            |-- getRetrievalStatus ---> |
  |                            |   if ready:               |
  |                            |     send email to user    |
  |                            |     mark retrieval ready  |
  |                            |   if restoring:           |
  |                            |     re-enqueue (30 min)-> |
```

## Pricing tiers

| Plan | Cold storage | Hot storage | Retrievals/mo | Price |
|---|---|---|---|---|
| Free | 25 GB | -- | 1 | $0 |
| Starter | 500 GB | -- | 3 | $4/mo |
| Personal | 2 TB | 50 GB | 5 | $10/mo |
| Creator | 10 TB | 200 GB | 15 | $30/mo |
| Power | 50 TB | 500 GB | 40 | $100/mo |

## MVP roadmap

- [x] MVP 1 -- Auth, vaults, upload to Glacier, file list
- [x] MVP 2 -- File retrieval: restore request -> QStash background job -> email -> download
- [x] MVP 3 -- Stripe subscriptions, plan limits
- [x] MVP 4 -- Google Drive migration
- [x] MVP 5 -- OneDrive migration
