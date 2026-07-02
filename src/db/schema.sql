-- =============================================================================
-- Archivault — Full Database Schema
-- =============================================================================
-- Plain SQL alternative to Drizzle migrations.
-- Run this on a fresh database to bring it to the current schema state.
-- IMPORTANT: Keep this file in sync with src/db/schema/ whenever
--            the Drizzle schema changes. See CLAUDE.md for the rule.
-- =============================================================================

-- ── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE "plan" AS ENUM (
  'free',
  'starter',
  'personal',
  'creator',
  'power'
);

CREATE TYPE "storage_tier" AS ENUM (
  'hot',
  'cold'
);

CREATE TYPE "file_status" AS ENUM (
  'pending_upload',
  'importing',
  'active',
  'restoring',
  'ready',
  'failed',
  'deleted'
);

CREATE TYPE "retrieval_tier" AS ENUM (
  'bulk',
  'standard'
);

CREATE TYPE "retrieval_status" AS ENUM (
  'pending',
  'restoring',
  'ready',
  'expired',
  'failed'
);

-- ── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE "users" (
  "id"                          text        PRIMARY KEY,          -- Clerk user ID
  "email"                       text        NOT NULL UNIQUE,
  "plan"                        "plan"      NOT NULL DEFAULT 'free',
  "stripe_customer_id"          text,
  "stripe_subscription_id"      text,
  "cold_storage_used_bytes"     integer     NOT NULL DEFAULT 0,
  "hot_storage_used_bytes"      integer     NOT NULL DEFAULT 0,
  "retrievals_used_this_month"  integer     NOT NULL DEFAULT 0,
  "retrievals_reset_at"         timestamp   NOT NULL DEFAULT now(),
  "google_access_token"          text,
  "google_refresh_token"         text,
  "google_token_expiry"          timestamp,
  "onedrive_access_token"        text,
  "onedrive_refresh_token"       text,
  "onedrive_token_expiry"        timestamp,
  "created_at"                   timestamp   NOT NULL DEFAULT now(),
  "updated_at"                  timestamp   NOT NULL DEFAULT now()
);

CREATE TABLE "vaults" (
  "id"          text      PRIMARY KEY,   -- cuid
  "user_id"     text      NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name"        text      NOT NULL,
  "description" text,
  "is_archived" boolean   NOT NULL DEFAULT false,
  "created_at"  timestamp NOT NULL DEFAULT now(),
  "updated_at"  timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "files" (
  "id"               text           PRIMARY KEY,   -- cuid
  "user_id"          text           NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "vault_id"         text           NOT NULL REFERENCES "vaults"("id") ON DELETE CASCADE,
  "name"             text           NOT NULL,
  "mime_type"        text           NOT NULL,
  "size_bytes"       bigint         NOT NULL,
  "storage_key"      text           NOT NULL,       -- S3 object key
  "tier"             "storage_tier" NOT NULL DEFAULT 'cold',
  "status"           "file_status"  NOT NULL DEFAULT 'pending_upload',
  "checksum_sha256"  text,
  "google_drive_file_id"    text,
  "onedrive_drive_item_id"  text,
  "created_at"              timestamp      NOT NULL DEFAULT now(),
  "updated_at"       timestamp      NOT NULL DEFAULT now()
);

CREATE TABLE "retrievals" (
  "id"                  text               PRIMARY KEY,   -- cuid
  "user_id"             text               NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "file_id"             text               NOT NULL REFERENCES "files"("id") ON DELETE CASCADE,
  "glacier_job_id"      text,
  "tier"                "retrieval_tier"   NOT NULL DEFAULT 'bulk',
  "status"              "retrieval_status" NOT NULL DEFAULT 'pending',
  "download_url"        text,
  "download_expires_at" timestamp,
  "notified_at"         timestamp,
  "created_at"          timestamp          NOT NULL DEFAULT now(),
  "updated_at"          timestamp          NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
-- Add indexes here as query patterns emerge.

CREATE INDEX IF NOT EXISTS "vaults_user_id_idx"    ON "vaults"("user_id");
CREATE INDEX IF NOT EXISTS "files_user_id_idx"     ON "files"("user_id");
CREATE INDEX IF NOT EXISTS "files_vault_id_idx"    ON "files"("vault_id");
CREATE INDEX IF NOT EXISTS "files_status_idx"      ON "files"("status");
CREATE INDEX IF NOT EXISTS "retrievals_user_id_idx" ON "retrievals"("user_id");
CREATE INDEX IF NOT EXISTS "retrievals_file_id_idx" ON "retrievals"("file_id");
CREATE INDEX IF NOT EXISTS "retrievals_status_idx"  ON "retrievals"("status");
