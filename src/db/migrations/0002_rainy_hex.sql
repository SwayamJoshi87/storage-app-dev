ALTER TABLE "files" ADD COLUMN "onedrive_drive_item_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onedrive_access_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onedrive_refresh_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onedrive_token_expiry" timestamp;