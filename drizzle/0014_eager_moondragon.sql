CREATE TABLE "turnover_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"comment" text NOT NULL,
	"comment_date" date NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_by_name" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "status" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "status" SET DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "asset_id" integer;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "life_cycle_status" varchar(50);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "bia_tier" varchar(50);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "application_owner_name" varchar(100);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "application_owner_email" varchar(255);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "application_owner_band" varchar(10);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "application_manager_name" varchar(100);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "application_manager_email" varchar(255);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "application_manager_band" varchar(10);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "application_owner_leader1_name" varchar(100);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "application_owner_leader1_email" varchar(255);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "application_owner_leader1_band" varchar(10);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "application_owner_leader2_name" varchar(100);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "application_owner_leader2_email" varchar(255);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "application_owner_leader2_band" varchar(10);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "owner_svp_name" varchar(100);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "owner_svp_email" varchar(255);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "owner_svp_band" varchar(10);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "business_owner_name" varchar(100);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "business_owner_email" varchar(255);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "business_owner_band" varchar(10);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "business_owner_leader1_name" varchar(100);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "business_owner_leader1_email" varchar(255);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "business_owner_leader1_band" varchar(10);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "production_support_owner_name" varchar(100);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "production_support_owner_email" varchar(255);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "production_support_owner_band" varchar(10);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "production_support_owner_leader1_name" varchar(100);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "production_support_owner_leader1_email" varchar(255);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "production_support_owner_leader1_band" varchar(10);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "pmo_name" varchar(100);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "pmo_email" varchar(255);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "pmo_band" varchar(10);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "unit_cio_name" varchar(100);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "unit_cio_email" varchar(255);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "unit_cio_band" varchar(10);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "last_central_api_sync" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "central_api_sync_status" varchar(50) DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "turnover_comments" ADD CONSTRAINT "turnover_comments_entry_id_turnover_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."turnover_entries"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "turnover_comments_entry_id_idx" ON "turnover_comments" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "turnover_comments_date_idx" ON "turnover_comments" USING btree ("comment_date");--> statement-breakpoint
CREATE INDEX "turnover_comments_created_by_idx" ON "turnover_comments" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "turnover_comments_unique_entry_date_user_idx" ON "turnover_comments" USING btree ("entry_id","comment_date","created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_asset_id_idx" ON "applications" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "applications_life_cycle_status_idx" ON "applications" USING btree ("life_cycle_status");--> statement-breakpoint
CREATE INDEX "applications_bia_tier_idx" ON "applications" USING btree ("bia_tier");--> statement-breakpoint
CREATE INDEX "applications_lifecycle_bia_idx" ON "applications" USING btree ("life_cycle_status","bia_tier");--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_asset_id_unique" UNIQUE("asset_id");--> statement-breakpoint
DROP TYPE "public"."application_status";