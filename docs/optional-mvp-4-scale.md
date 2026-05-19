# Optional MVP 4 — Scale

> **Status:** Not planned. Document only — aspirational enterprise and scale features for consideration after strong product-market fit.
> **Prerequisite:** MVP 3 complete, ~500+ paying users, stable MRR growth.
> **Rough timeline if pursued:** 6–12 months post-MVP 3.

---

## Goal

Enterprise-readiness, compliance certifications, multi-region storage, reseller infrastructure, and multi-cloud backend arbitrage.

---

## Scope

| In scope | Out of scope (unless funded) |
|----------|------------------------------|
| Desktop sync agent (macOS + Windows) | Blockchain notarisation |
| SOC 2 Type II audit | Full enterprise SIEM integration |
| HIPAA BAA + legal hold | Satellite / offline storage |
| Multi-region storage (EU, APAC) | On-premises deployment |
| Reseller / white-label program | |
| B2 and R2 backend implementations | |
| Advanced admin + bulk operations | |
| SLA dashboard + uptime page | |

---

## Steps

### Step 1 — Desktop Sync Agent (macOS)

- [ ] Tech stack: Electron + React (reuse web components) or Tauri (smaller binary)
- [ ] System tray icon: sync status, quick vault switch
- [ ] Folder watcher (`chokidar`): detect new/modified files, upload to vault
- [ ] Selective sync: choose which vaults sync to which local folders
- [ ] Bandwidth throttling: configurable upload speed cap
- [ ] macOS iCloud Drive: access `~/Library/Mobile Documents/` (no Apple API needed for local files)
- [ ] Conflict resolution: remote wins / local wins / keep both
- [ ] Background daemon with auto-start on login
- [ ] Delta sync: track file hash, skip re-upload if unchanged
- [ ] Distribute via macOS notarised `.dmg` (Apple Developer ID required)

---

### Step 2 — Desktop Sync Agent (Windows)

- [ ] Same Electron/Tauri codebase, Windows-specific additions
- [ ] OneDrive local folder access without API (`C:\Users\{user}\OneDrive`)
- [ ] Code-sign with EV certificate for Windows Defender SmartScreen (~$300/yr)
- [ ] Distribute via `.exe` installer (NSIS or WiX) + optional Microsoft Store

---

### Step 3 — SOC 2 Type II Audit

- [ ] Engage compliance platform: Vanta (~$15,000/yr) or Drata
- [ ] Gap assessment against SOC 2 Trust Service Criteria (Security, Availability)
- [ ] Remediation: MFA for all admin access, CloudTrail + CloudWatch alerting, vulnerability scanning, incident response plan, employee training, vendor risk assessments, change management process
- [ ] External pen test by accredited firm (~$10,000 one-time)
- [ ] 6-month observation period for evidence collection
- [ ] Final audit by accredited CPA firm (~$15,000–25,000)
- [ ] Publish SOC 2 report on trust page (NDA gated)

---

### Step 4 — HIPAA BAA + Legal Hold

- [ ] Sign Business Associate Agreement with AWS (free, self-service)
- [ ] Review Clerk, Neon, Resend for HIPAA eligibility
- [ ] Technical controls: audit logs retained 6 years, 15-min session timeout, access logging for PHI vaults
- [ ] Legal hold: `vaults.legal_hold` flag — cannot delete, cannot change tier; MFA required to set/lift
- [ ] Export audit log as signed PDF for court/regulatory submission
- [ ] Offer HIPAA BAA to Business plan customers ($99/mo minimum)

---

### Step 5 — Multi-Region Storage

- [ ] `vaults.region: 'us-east-1' | 'eu-west-1' | 'ap-southeast-1'` column
- [ ] S3 buckets in each region (same key structure)
- [ ] Storage factory: instantiate S3 client with per-vault region
- [ ] `POST /api/vaults` accepts `region` param; default from user IP geolocation
- [ ] GDPR: EU-region vaults stay in `eu-west-1`; no cross-region replication unless user opts in
- [ ] Pricing: EU/APAC vaults carry 10–15% premium

---

### Step 6 — Alternative Storage Backends

- [ ] `BackblazeB2Backend` using AWS SDK against B2's S3-compatible endpoint ($6.95/TB, free egress via Cloudflare)
- [ ] `CloudflareR2Backend` ($15/TB, zero egress fees) for high-egress hot-tier users
- [ ] Backend routing table: Frozen → S3 Glacier or B2; Hot → R2 for high-download users
- [ ] Cost arbitrage cron: monthly comparison, flag if switching saves >20%

---

### Step 7 — Reseller / White-Label Program

- [ ] `organizations` table: `id, name, subdomain, logo_url, custom_domain, plan_markup_percent, owner_user_id`
- [ ] `organization_members` table: `id, org_id, user_id, role (owner|admin|member)`
- [ ] Custom subdomain: `vaults.client.com` (CNAME); logo + brand colours via CSS variables at runtime
- [ ] Reseller billing: wholesale rate + markup; reseller sets own end-user pricing
- [ ] Reseller dashboard: member list, storage usage per member, monthly invoice
- [ ] Self-serve onboarding via `/reseller/apply` (manual approval initially)

---

### Step 8 — Advanced Admin & Bulk Operations

- [ ] `PATCH /api/files/bulk-tier` — move up to 10,000 files between tiers (background job)
- [ ] `DELETE /api/files/bulk` — bulk soft-delete with confirmation showing total size
- [ ] `GET /api/vaults/:id/export.csv` — file list with size, tier, dates, cost
- [ ] Vault duplication: copy all files for archiving project snapshots
- [ ] Advanced search: filter by tier, size range, date range, content type, tag
- [ ] Keyboard shortcuts: Shift+click multi-select, `Del` to delete, `T` to change tier
- [ ] Bulk import from CSV: upload a CSV of S3 keys to register existing files (migration tool)

---

### Step 9 — SLA Dashboard + Status Page

- [ ] Public status page at `status.yourdomain.com` (Instatus or self-hosted)
- [ ] Synthetic monitoring (Checkly or CloudWatch Synthetics): API health every 5min, full smoke test every 15min
- [ ] SLA targets: API availability 99.9%, retrieval initiation <60s, notification delivery <5min after restore
- [ ] Automatic Stripe credit if SLA breached
- [ ] Uptime badge on marketing site and pricing page

---

### Step 10 — Performance & Cost Optimisation

- [ ] Lambda provisioned concurrency for hot API paths (vault list, file list)
- [ ] Neon read replicas for analytics queries
- [ ] S3 Intelligent-Tiering for users who don't explicitly pick a tier
- [ ] S3 Batch Operations for bulk HeadObject health checks
- [ ] CDN caching for presigned URL metadata (1-min cache to reduce Lambda invocations)
- [ ] Stripe metering: batch meter events hourly instead of per-event
- [ ] DynamoDB for import job checkpoints (cheaper + faster than Postgres for high-write short-lived state)

---

## Definition of Done

- [ ] Desktop agent ships on macOS with >100 active installs
- [ ] SOC 2 Type II report issued by accredited auditor
- [ ] At least 1 paying HIPAA customer on BAA agreement
- [ ] EU-region vaults available with documented data residency guarantee
- [ ] First reseller (agency or law firm) live on white-label subdomain
- [ ] P99 API latency < 200ms for vault list + file list endpoints

---

## Estimated Additional Monthly Cost (at 1,000 users / 500TB stored)

| Item | Monthly |
|------|---------|
| AWS S3 Deep Archive (400TB) | ~$400 |
| AWS S3 Standard (100TB) | ~$2,400 |
| Lambda + API Gateway (1M req/day) | ~$150 |
| Fargate import workers (peak) | ~$200 |
| Neon Postgres (Scale tier) | ~$70 |
| Clerk (Pro, ~2k MAU) | ~$65 |
| Vanta (SOC 2 compliance) | ~$1,250 |
| Sentry, PostHog, Resend (Pro tiers) | ~$200 |
| Cloudflare (Pro + Workers) | ~$20 |
| **Total infra** | **~$4,755/mo** |
| **Revenue at $8 avg ARPU × 1,000** | **$8,000/mo** |
| **Gross margin** | **~40%** |

> Margin expands as free users convert to paid and Frozen-tier storage dominates (costs $0.001/GB vs $0.024/GB Standard).
