CREATE TYPE "public"."application_status" AS ENUM('active', 'inactive', 'pending', 'deprecated', 'maintenance');--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT "applications_team_id_teams_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."application_status";--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "status" SET DATA TYPE "public"."application_status" USING "status"::"public"."application_status";--> statement-breakpoint
ALTER TABLE "team_registration_requests" ALTER COLUMN "contact_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "team_registration_requests" ALTER COLUMN "contact_email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "contact_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "contact_email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "team_registration_requests" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "team_registration_requests" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "created_by" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "updated_by" varchar(255);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "applications_team_id_idx" ON "applications" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "applications" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_car_id_idx" ON "applications" USING btree ("car_id");--> statement-breakpoint
CREATE INDEX "applications_tier_idx" ON "applications" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "applications_team_status_idx" ON "applications" USING btree ("team_id","status");--> statement-breakpoint
CREATE INDEX "applications_team_status_created_idx" ON "applications" USING btree ("team_id","status","created_at");--> statement-breakpoint
CREATE INDEX "team_reg_status_idx" ON "team_registration_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "team_reg_requested_by_idx" ON "team_registration_requests" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "team_reg_requested_at_idx" ON "team_registration_requests" USING btree ("requested_at");--> statement-breakpoint
CREATE INDEX "team_reg_status_requested_at_idx" ON "team_registration_requests" USING btree ("status","requested_at");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_team_name_idx" ON "teams" USING btree ("team_name");--> statement-breakpoint
CREATE INDEX "teams_contact_email_idx" ON "teams" USING btree ("contact_email");--> statement-breakpoint
CREATE INDEX "teams_is_active_idx" ON "teams" USING btree ("is_active");