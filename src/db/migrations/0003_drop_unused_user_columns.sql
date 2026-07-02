ALTER TABLE "users" DROP COLUMN IF EXISTS "cold_storage_used_bytes";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "hot_storage_used_bytes";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "retrievals_used_this_month";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "retrievals_reset_at";
