ALTER TYPE "public"."file_status" ADD VALUE 'importing' BEFORE 'active';--> statement-breakpoint
ALTER TYPE "public"."file_status" ADD VALUE 'failed' BEFORE 'deleted';--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "google_drive_file_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_access_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_refresh_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_token_expiry" timestamp;