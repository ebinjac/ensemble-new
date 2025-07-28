ALTER TABLE "turnover_entries" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "turnover_entries" ALTER COLUMN "status" SET DEFAULT 'open'::text;--> statement-breakpoint
DROP TYPE "public"."entry_status";--> statement-breakpoint
CREATE TYPE "public"."entry_status" AS ENUM('open', 'closed', 'pending', 'resolved', 'cancelled', 'draft', 'submitted', 'under_review', 'approved', 'rejected', 'implemented', 'new', 'assigned', 'in_progress', 'active', 'acknowledged', 'investigating', 'false_positive');--> statement-breakpoint
ALTER TABLE "turnover_entries" ALTER COLUMN "status" SET DEFAULT 'open'::"public"."entry_status";--> statement-breakpoint
ALTER TABLE "turnover_entries" ALTER COLUMN "status" SET DATA TYPE "public"."entry_status" USING "status"::"public"."entry_status";--> statement-breakpoint
DROP INDEX "turnover_entries_open_idx";--> statement-breakpoint
CREATE INDEX "turnover_entries_open_idx" ON "turnover_entries" USING btree ("status","created_at") WHERE "turnover_entries"."status" IN ('open', 'pending', 'new', 'draft', 'active');