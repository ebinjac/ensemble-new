CREATE TYPE "public"."email_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('draft', 'queued', 'sending', 'sent', 'failed', 'bounced');--> statement-breakpoint
CREATE TABLE "email_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"config_name" varchar(100) NOT NULL,
	"smtp_host" varchar(255) NOT NULL,
	"smtp_port" integer DEFAULT 587 NOT NULL,
	"smtp_secure" boolean DEFAULT false NOT NULL,
	"smtp_auth" boolean DEFAULT true NOT NULL,
	"smtp_username" varchar(255),
	"smtp_password" varchar(255),
	"default_from_name" varchar(255),
	"default_from_email" varchar(255) NOT NULL,
	"default_reply_to" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_history_id" uuid NOT NULL,
	"email_address" varchar(255) NOT NULL,
	"recipient_type" varchar(10) NOT NULL,
	"recipient_name" varchar(255),
	"status" "email_status" DEFAULT 'sent' NOT NULL,
	"delivered_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"clicked_at" timestamp with time zone,
	"bounced_at" timestamp with time zone,
	"bounce_reason" text,
	"personalization_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_send_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid,
	"email_config_id" uuid,
	"team_id" uuid NOT NULL,
	"message_id" varchar(255),
	"subject" varchar(500) NOT NULL,
	"from_name" varchar(255),
	"from_email" varchar(255) NOT NULL,
	"reply_to" varchar(255),
	"to_emails" jsonb NOT NULL,
	"cc_emails" jsonb,
	"bcc_emails" jsonb,
	"html_content" text NOT NULL,
	"text_content" text,
	"status" "email_status" DEFAULT 'draft' NOT NULL,
	"priority" "email_priority" DEFAULT 'normal' NOT NULL,
	"track_opens" boolean DEFAULT false NOT NULL,
	"track_clicks" boolean DEFAULT false NOT NULL,
	"open_count" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"send_attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"error_message" text,
	"smtp_response" text,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"sent_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_email_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"email_config_id" uuid,
	"default_subject" varchar(500),
	"default_from_name" varchar(255),
	"default_from_email" varchar(255),
	"default_reply_to" varchar(255),
	"default_to_emails" text,
	"default_cc_emails" text,
	"default_bcc_emails" text,
	"track_opens" boolean DEFAULT false NOT NULL,
	"track_clicks" boolean DEFAULT false NOT NULL,
	"priority" "email_priority" DEFAULT 'normal' NOT NULL,
	"enable_personalization" boolean DEFAULT false NOT NULL,
	"personalization_variables" jsonb,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_configurations" ADD CONSTRAINT "email_configurations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "email_recipients" ADD CONSTRAINT "email_recipients_email_history_id_email_send_history_id_fk" FOREIGN KEY ("email_history_id") REFERENCES "public"."email_send_history"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_send_history" ADD CONSTRAINT "email_send_history_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_send_history" ADD CONSTRAINT "email_send_history_email_config_id_email_configurations_id_fk" FOREIGN KEY ("email_config_id") REFERENCES "public"."email_configurations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_send_history" ADD CONSTRAINT "email_send_history_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_email_settings" ADD CONSTRAINT "template_email_settings_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "template_email_settings" ADD CONSTRAINT "template_email_settings_email_config_id_email_configurations_id_fk" FOREIGN KEY ("email_config_id") REFERENCES "public"."email_configurations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_configs_team_id_idx" ON "email_configurations" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "email_configs_is_active_idx" ON "email_configurations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "email_configs_is_default_idx" ON "email_configurations" USING btree ("team_id","is_default");--> statement-breakpoint
CREATE UNIQUE INDEX "email_configs_team_name_idx" ON "email_configurations" USING btree ("team_id","config_name");--> statement-breakpoint
CREATE INDEX "email_recipients_history_idx" ON "email_recipients" USING btree ("email_history_id");--> statement-breakpoint
CREATE INDEX "email_recipients_email_idx" ON "email_recipients" USING btree ("email_address");--> statement-breakpoint
CREATE INDEX "email_recipients_status_idx" ON "email_recipients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_recipients_type_idx" ON "email_recipients" USING btree ("recipient_type");--> statement-breakpoint
CREATE INDEX "email_send_history_template_idx" ON "email_send_history" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "email_send_history_team_idx" ON "email_send_history" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "email_send_history_status_idx" ON "email_send_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_send_history_sent_at_idx" ON "email_send_history" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "email_send_history_message_id_idx" ON "email_send_history" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "email_send_history_scheduled_at_idx" ON "email_send_history" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "email_send_history_team_status_idx" ON "email_send_history" USING btree ("team_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "template_email_settings_template_idx" ON "template_email_settings" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "template_email_settings_config_idx" ON "template_email_settings" USING btree ("email_config_id");