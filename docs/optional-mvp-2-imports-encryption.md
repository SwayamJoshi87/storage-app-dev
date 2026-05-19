# Optional MVP 2 — Imports & Encryption

> **Status:** Not planned. Document only — aspirational features for consideration after core product is stable.
> **Prerequisite:** MVP 1 shipped and stable with at least 20 paying users.
> **Rough timeline if pursued:** 8–10 weeks after MVP 1.

---

## Goal

Users can import data from major cloud providers and optionally encrypt their vaults with zero-knowledge client-side encryption.

---

## Scope

| In scope | Out of scope |
|----------|-------------|
| Google Drive import connector | Native iCloud API (does not exist) |
| OneDrive import connector | Desktop sync agent |
| Dropbox import connector | Mobile apps |
| Google Photos import | SOC 2 audit |
| iCloud zip-upload (manual flow) | Vault sharing (moved to Optional MVP 3) |
| Client-side AES-256-GCM encryption | Key escrow / enterprise KMS |
| Encrypted file index (search) | HIPAA BAA |
| Family plan + vault sharing | |
| Email-to-vault ingest | |

---

## Architecture Additions

```
MVP 1 stack, plus:

SQS Queue (import-jobs)
  └── Fargate Workers (import-worker container)
        ├── Google Drive API (OAuth2)
        ├── Microsoft Graph API (OAuth2)
        ├── Dropbox API (OAuth2)
        └── Google Photos Library API (OAuth2)

Browser
  └── WebCrypto API
        ├── Argon2id (key derivation — argon2-browser)
        ├── AES-256-GCM (file encryption/decryption)
        └── Encrypted search index (client-side)

New DB tables:
  import_jobs
  oauth_tokens (encrypted at rest)
  family_members
```

---

## Steps

### Step 1 — Fargate Worker Scaffold

- [ ] Write `workers/import-worker/` Dockerfile (Node 20 slim)
- [ ] Define SQS queue `import-jobs` (standard, not FIFO — order doesn't matter)
- [ ] Worker entry point: poll SQS, deserialise job, dispatch to provider handler, ack on completion
- [ ] Checkpoint progress to Postgres `import_jobs` every 50MB transferred
- [ ] Graceful shutdown handler: SIGTERM → complete current chunk → ack partial, re-queue remaining
- [ ] Push image to ECR, deploy as Fargate task triggered by SQS Lambda trigger
- [ ] `import_jobs` table:
  ```
  id, user_id, vault_id, provider (google_drive|onedrive|dropbox|google_photos|zip),
  status (queued|running|paused|completed|failed),
  oauth_token_ref, source_path, total_bytes, transferred_bytes,
  error_message, checkpoint_cursor, created_at, completed_at
  ```

---

### Step 2 — Google Drive Connector

- [ ] Register Google Cloud OAuth app (Drive API scope: `drive.readonly`)
- [ ] `GET /api/imports/google-drive/auth` — redirect to Google OAuth consent
- [ ] `GET /api/imports/google-drive/callback` — exchange code for tokens, store encrypted in `oauth_tokens`
- [ ] `GET /api/imports/google-drive/browse?folderId=` — list files/folders (for picker UI)
- [ ] `POST /api/imports` — create `import_job`, push to SQS
- [ ] Fargate worker `GoogleDriveHandler`:
  - Paginate Drive file list (100 files/page)
  - Download each file via `drive.files.get?alt=media` with streaming
  - Pipe directly to S3 multipart upload (no temp disk)
  - Handle token refresh mid-import (tokens expire after 1hr)
  - Checkpoint: store `pageToken` + last processed `fileId`
- [ ] Import UI — Google Drive card: connect, folder picker, destination vault + tier selector, progress bar

---

### Step 3 — OneDrive Connector

- [ ] Register Azure AD app (Microsoft Graph scope: `Files.Read`)
- [ ] OAuth flow: `GET /api/imports/onedrive/auth` + `callback`
- [ ] Store encrypted refresh token in `oauth_tokens`
- [ ] Fargate worker `OneDriveHandler`:
  - Graph API: `GET /me/drive/items/{id}/children` for listing
  - `GET /me/drive/items/{id}/content` for download (returns redirect to CDN URL — follow it)
  - Multipart S3 upload, checkpoint by item ID
  - Handle Graph throttle responses (429 + Retry-After header)

---

### Step 4 — Dropbox Connector

- [ ] Register Dropbox app (`files.content.read` scope)
- [ ] OAuth flow + token storage
- [ ] Fargate worker `DropboxHandler`:
  - `POST /2/files/list_folder` + `list_folder/continue` for listing
  - `POST /2/files/download` for file bytes
  - Handle Dropbox API rate limits (exponential backoff)

---

### Step 5 — Google Photos Connector

- [ ] Separate OAuth scope: `photoslibrary.readonly` (different from Drive)
- [ ] Fargate worker `GooglePhotosHandler`:
  - `mediaItems.list` pagination
  - Download via `baseUrl + "=d"` param
  - Preserve EXIF metadata in S3 user metadata headers
  - Organise into vault folders by Google Photos album

---

### Step 6 — iCloud Import (Manual Zip Flow)

Apple has no third-party iCloud API. Best achievable is a guided manual flow.

- [ ] Guided wizard: link to Apple's Data and Privacy page → user downloads export zip → upload here
- [ ] `POST /api/imports/zip` — accept multipart zip upload, push to SQS
- [ ] Fargate worker `ZipHandler`:
  - Stream-extract zip using `unzipper` (no full extraction to disk)
  - Upload each extracted file to S3 under target vault
  - Handle Apple's export structure (iCloud Drive, Photos, Mail attachments)

---

### Step 7 — Import Management UI

- [ ] Provider connection status cards (connected / not connected)
- [ ] Active imports list with real-time progress (poll `GET /api/imports` every 5s)
- [ ] Completed / failed imports history (last 30 days)
- [ ] Retry button for failed imports; Cancel button for running imports
- [ ] `GET /api/imports` — list user's import jobs
- [ ] `DELETE /api/imports/:id` — cancel + dequeue

---

### Step 8 — Client-Side Encryption

Zero-knowledge: server only ever stores ciphertext. User holds the key.

- [ ] Install `argon2-browser` (WASM Argon2id implementation)
- [ ] Write `src/lib/encryption.ts`:
  ```ts
  deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey>
    // Argon2id: memory=64MB, iterations=3, parallelism=1 → 256-bit AES-GCM key

  encryptStream(stream: ReadableStream, key: CryptoKey): ReadableStream
  decryptStream(stream: ReadableStream, key: CryptoKey): ReadableStream

  encryptString(plaintext: string, key: CryptoKey): Promise<string> // base64url
  decryptString(ciphertext: string, key: CryptoKey): Promise<string>
  ```
- [ ] Key storage: derived key in memory only; salt stored server-side in `vaults.encryption_salt`
- [ ] Vault encryption setup flow: toggle on vault create, prompt for password, warn about no recovery
- [ ] Encrypt before S3 upload; decrypt after S3 download — transparent to the rest of the app
- [ ] Lock icon on encrypted vaults; session unlock via encryption password

---

### Step 9 — Encrypted Search Index

- [ ] Client-side: extract bigrams from filename+tags, HMAC-SHA256 each bigram with a derived search key
- [ ] Store encrypted bigrams in `files.search_tokens` (text array)
- [ ] `GET /api/vaults/:id/search?tokens[]=` — match HMAC tokens server-side, return file IDs
- [ ] Client decrypts filenames for display

---

### Step 10 — Family Plan + Vault Sharing

- [ ] `family_members` table: `id, owner_user_id, member_user_id, storage_quota_bytes, created_at`
- [ ] `vault_shares` table: `id, vault_id, shared_with_user_id, permission (read|write), created_at`
- [ ] Invite flow via email (Resend); pending member record
- [ ] Family plan enforcement: total storage across all members capped at plan limit (5TB)
- [ ] Shared vaults appear in sidebar for recipient with permission badge

---

### Step 11 — Email-to-Vault Ingest

- [ ] Each user gets a unique ingest address: `vault-{uuid}@ingest.yourdomain.com`
- [ ] Route via Resend Inbound or SES → Lambda; parse MIME, extract attachments, upload to vault
- [ ] Confirmation email: "2 files added to your Tax Records vault"
- [ ] `vaults.ingest_email_token` column; `GET /api/vaults/:id/ingest-address` returns address

---

### Step 12 — Testing & Hardening

- [ ] Integration tests for each connector using provider sandbox/test accounts
- [ ] Large file test (>1GB) through Fargate — no memory issues, multipart works
- [ ] Encryption round-trip: upload encrypted → download + decrypt → byte-for-byte match
- [ ] OAuth token expiry mid-import → worker refreshes and resumes
- [ ] DLQ for failed SQS jobs — alert on DLQ depth > 0

---

## Definition of Done

- [ ] User can connect Google Drive and import 1GB+ folder into a vault
- [ ] User can enable encryption on a vault, upload a file, and download + decrypt it
- [ ] Encrypted vault search returns correct results
- [ ] Family plan with 2 sub-accounts, shared vault visible to both

---

## Estimated Additional Monthly Cost

| Item | Cost |
|------|------|
| Fargate (import workers, ~4hr/day active) | ~$30–60 |
| SQS (import job queue) | < $1 |
| Google/MS/Dropbox API reads | $0 |
| argon2-browser (client-side WASM) | $0 |
| **Additional monthly** | **~$30–60** |
