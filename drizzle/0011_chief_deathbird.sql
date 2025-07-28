CREATE TYPE "public"."entry_status" AS ENUM('open', 'in_progress', 'resolved', 'closed', 'pending', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."flag_type" AS ENUM('manual', 'needs_update', 'long_pending', 'important', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."section_type" AS ENUM('handover', 'rfc', 'inc', 'alerts', 'mim', 'email_slack', 'fyi');--> statement-breakpoint
CREATE TABLE "entry_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"attachment_type" varchar(50) NOT NULL,
	"title" varchar(255),
	"url" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sub_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "turnover_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"sub_application_id" uuid,
	"section_type" "section_type" NOT NULL,
	"title" varchar(255),
	"description" text,
	"comments" text,
	"status" "entry_status" DEFAULT 'open',
	"section_data" jsonb DEFAULT '{}'::jsonb,
	"is_important" boolean DEFAULT false,
	"is_flagged" boolean DEFAULT false,
	"flag_type" "flag_type",
	"flag_reason" varchar(255),
	"flagged_at" timestamp with time zone,
	"flagged_by" varchar(255),
	"display_order" integer DEFAULT 0,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "turnover_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"handover_from" varchar(255) NOT NULL,
	"handover_to" varchar(255) NOT NULL,
	"session_date" date NOT NULL,
	"selected_sub_apps" uuid[] DEFAULT ARRAY[]::uuid[],
	"is_current" boolean DEFAULT true,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp with time zone,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "turnover_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"snapshot_date" date NOT NULL,
	"snapshot_type" varchar(50) DEFAULT 'daily',
	"session_data" jsonb NOT NULL,
	"entries_data" jsonb NOT NULL,
	"total_entries" integer DEFAULT 0,
	"flagged_entries" integer DEFAULT 0,
	"completed_entries" integer DEFAULT 0,
	"created_by" varchar(255) DEFAULT 'system',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entry_attachments" ADD CONSTRAINT "entry_attachments_entry_id_turnover_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."turnover_entries"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sub_applications" ADD CONSTRAINT "sub_applications_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "turnover_entries" ADD CONSTRAINT "turnover_entries_session_id_turnover_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."turnover_sessions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "turnover_entries" ADD CONSTRAINT "turnover_entries_sub_application_id_sub_applications_id_fk" FOREIGN KEY ("sub_application_id") REFERENCES "public"."sub_applications"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "turnover_sessions" ADD CONSTRAINT "turnover_sessions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "turnover_sessions" ADD CONSTRAINT "turnover_sessions_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "turnover_snapshots" ADD CONSTRAINT "turnover_snapshots_session_id_turnover_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."turnover_sessions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "entry_attachments_entry_id_idx" ON "entry_attachments" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "entry_attachments_type_idx" ON "entry_attachments" USING btree ("attachment_type");--> statement-breakpoint
CREATE INDEX "entry_attachments_is_active_idx" ON "entry_attachments" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sub_apps_application_id_idx" ON "sub_applications" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "sub_apps_is_active_idx" ON "sub_applications" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sub_apps_display_order_idx" ON "sub_applications" USING btree ("display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "sub_apps_name_per_app_idx" ON "sub_applications" USING btree ("application_id","name");--> statement-breakpoint
CREATE INDEX "turnover_entries_session_id_idx" ON "turnover_entries" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "turnover_entries_sub_app_id_idx" ON "turnover_entries" USING btree ("sub_application_id");--> statement-breakpoint
CREATE INDEX "turnover_entries_section_type_idx" ON "turnover_entries" USING btree ("section_type");--> statement-breakpoint
CREATE INDEX "turnover_entries_status_idx" ON "turnover_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "turnover_entries_is_flagged_idx" ON "turnover_entries" USING btree ("is_flagged");--> statement-breakpoint
CREATE INDEX "turnover_entries_is_important_idx" ON "turnover_entries" USING btree ("is_important");--> statement-breakpoint
CREATE INDEX "turnover_entries_created_at_idx" ON "turnover_entries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "turnover_entries_updated_at_idx" ON "turnover_entries" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "turnover_entries_session_section_idx" ON "turnover_entries" USING btree ("session_id","section_type");--> statement-breakpoint
CREATE INDEX "turnover_entries_session_sub_app_idx" ON "turnover_entries" USING btree ("session_id","sub_application_id");--> statement-breakpoint
CREATE INDEX "turnover_entries_flagged_idx" ON "turnover_entries" USING btree ("is_flagged","flag_type","updated_at");--> statement-breakpoint
CREATE INDEX "turnover_entries_stale_idx" ON "turnover_entries" USING btree (updated_at) WHERE updated_at < NOW() - INTERVAL '24 hours';--> statement-breakpoint
CREATE INDEX "turnover_entries_long_pending_idx" ON "turnover_entries" USING btree (created_at) WHERE created_at < NOW() - INTERVAL '72 hours' AND status IN ('open', 'pending');--> statement-breakpoint
CREATE INDEX "turnover_sessions_team_id_idx" ON "turnover_sessions" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "turnover_sessions_application_id_idx" ON "turnover_sessions" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "turnover_sessions_session_date_idx" ON "turnover_sessions" USING btree ("session_date");--> statement-breakpoint
CREATE INDEX "turnover_sessions_is_current_idx" ON "turnover_sessions" USING btree ("is_current");--> statement-breakpoint
CREATE INDEX "turnover_sessions_team_app_current_idx" ON "turnover_sessions" USING btree ("team_id","application_id","is_current");--> statement-breakpoint
CREATE INDEX "turnover_sessions_team_date_idx" ON "turnover_sessions" USING btree ("team_id","session_date");--> statement-breakpoint
CREATE UNIQUE INDEX "turnover_sessions_unique_current_idx" ON "turnover_sessions" USING btree ("team_id","application_id","is_current") WHERE is_current = true;--> statement-breakpoint
CREATE INDEX "turnover_snapshots_session_id_idx" ON "turnover_snapshots" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "turnover_snapshots_snapshot_date_idx" ON "turnover_snapshots" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX "turnover_snapshots_snapshot_type_idx" ON "turnover_snapshots" USING btree ("snapshot_type");--> statement-breakpoint
CREATE UNIQUE INDEX "turnover_snapshots_unique_daily_idx" ON "turnover_snapshots" USING btree ("session_id","snapshot_date","snapshot_type");