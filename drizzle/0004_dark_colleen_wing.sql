CREATE TYPE "public"."component_type" AS ENUM('text', 'heading', 'image', 'button', 'divider', 'spacer', 'list', 'container', 'column');--> statement-breakpoint
CREATE TYPE "public"."template_category" AS ENUM('newsletter', 'promotional', 'transactional', 'onboarding', 'notification', 'announcement', 'custom');--> statement-breakpoint
CREATE TYPE "public"."template_status" AS ENUM('draft', 'active', 'archived', 'deprecated');--> statement-breakpoint
CREATE TYPE "public"."template_visibility" AS ENUM('private', 'team', 'public', 'shared');--> statement-breakpoint
CREATE TABLE "email_template_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"component_id" varchar(100) NOT NULL,
	"type" "component_type" NOT NULL,
	"component_data" jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"parent_component_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" "template_category" DEFAULT 'custom' NOT NULL,
	"team_id" uuid NOT NULL,
	"canvas_settings" jsonb NOT NULL,
	"status" "template_status" DEFAULT 'draft' NOT NULL,
	"visibility" "template_visibility" DEFAULT 'private' NOT NULL,
	"thumbnail_url" varchar(500),
	"usage_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"parent_template_id" uuid,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_application_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_library" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" "template_category" NOT NULL,
	"canvas_settings" jsonb NOT NULL,
	"thumbnail_url" varchar(500) NOT NULL,
	"preview_url" varchar(500),
	"usage_count" integer DEFAULT 0 NOT NULL,
	"rating" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_by" varchar(255) DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_library_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"library_template_id" uuid NOT NULL,
	"component_id" varchar(100) NOT NULL,
	"type" "component_type" NOT NULL,
	"component_data" jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"parent_component_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_sharing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"shared_with_team_id" uuid NOT NULL,
	"can_edit" boolean DEFAULT false NOT NULL,
	"can_duplicate" boolean DEFAULT true NOT NULL,
	"shared_by" varchar(255) NOT NULL,
	"shared_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_usage_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid,
	"library_template_id" uuid,
	"used_by" varchar(255) NOT NULL,
	"team_id" uuid,
	"application_id" uuid,
	"action" varchar(50) NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_template_components" ADD CONSTRAINT "email_template_components_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_parent_template_id_email_templates_id_fk" FOREIGN KEY ("parent_template_id") REFERENCES "public"."email_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_application_tags" ADD CONSTRAINT "template_application_tags_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "template_application_tags" ADD CONSTRAINT "template_application_tags_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "template_library_components" ADD CONSTRAINT "template_library_components_library_template_id_template_library_id_fk" FOREIGN KEY ("library_template_id") REFERENCES "public"."template_library"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "template_sharing" ADD CONSTRAINT "template_sharing_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "template_sharing" ADD CONSTRAINT "template_sharing_shared_with_team_id_teams_id_fk" FOREIGN KEY ("shared_with_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "template_usage_history" ADD CONSTRAINT "template_usage_history_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_usage_history" ADD CONSTRAINT "template_usage_history_library_template_id_template_library_id_fk" FOREIGN KEY ("library_template_id") REFERENCES "public"."template_library"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_usage_history" ADD CONSTRAINT "template_usage_history_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_usage_history" ADD CONSTRAINT "template_usage_history_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_template_components_template_id_idx" ON "email_template_components" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "email_template_components_sort_order_idx" ON "email_template_components" USING btree ("template_id","sort_order");--> statement-breakpoint
CREATE INDEX "email_template_components_type_idx" ON "email_template_components" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "email_template_components_template_component_idx" ON "email_template_components" USING btree ("template_id","component_id");--> statement-breakpoint
CREATE INDEX "email_templates_team_id_idx" ON "email_templates" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "email_templates_status_idx" ON "email_templates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_templates_visibility_idx" ON "email_templates" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "email_templates_category_idx" ON "email_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "email_templates_created_at_idx" ON "email_templates" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_templates_usage_count_idx" ON "email_templates" USING btree ("usage_count");--> statement-breakpoint
CREATE INDEX "email_templates_team_status_idx" ON "email_templates" USING btree ("team_id","status");--> statement-breakpoint
CREATE INDEX "email_templates_visibility_status_idx" ON "email_templates" USING btree ("visibility","status");--> statement-breakpoint
CREATE INDEX "email_templates_category_visibility_idx" ON "email_templates" USING btree ("category","visibility");--> statement-breakpoint
CREATE UNIQUE INDEX "email_templates_team_name_idx" ON "email_templates" USING btree ("team_id","name");--> statement-breakpoint
CREATE INDEX "template_app_tags_template_id_idx" ON "template_application_tags" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "template_app_tags_application_id_idx" ON "template_application_tags" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "template_app_tags_is_primary_idx" ON "template_application_tags" USING btree ("application_id","is_primary");--> statement-breakpoint
CREATE UNIQUE INDEX "template_app_tags_template_app_idx" ON "template_application_tags" USING btree ("template_id","application_id");--> statement-breakpoint
CREATE INDEX "template_library_category_idx" ON "template_library" USING btree ("category");--> statement-breakpoint
CREATE INDEX "template_library_is_active_idx" ON "template_library" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "template_library_is_featured_idx" ON "template_library" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "template_library_usage_count_idx" ON "template_library" USING btree ("usage_count");--> statement-breakpoint
CREATE INDEX "template_library_rating_idx" ON "template_library" USING btree ("rating");--> statement-breakpoint
CREATE UNIQUE INDEX "template_library_name_idx" ON "template_library" USING btree ("name");--> statement-breakpoint
CREATE INDEX "template_library_components_template_id_idx" ON "template_library_components" USING btree ("library_template_id");--> statement-breakpoint
CREATE INDEX "template_library_components_sort_order_idx" ON "template_library_components" USING btree ("library_template_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "template_library_components_template_component_idx" ON "template_library_components" USING btree ("library_template_id","component_id");--> statement-breakpoint
CREATE INDEX "template_sharing_template_id_idx" ON "template_sharing" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "template_sharing_shared_with_team_idx" ON "template_sharing" USING btree ("shared_with_team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "template_sharing_template_team_idx" ON "template_sharing" USING btree ("template_id","shared_with_team_id");--> statement-breakpoint
CREATE INDEX "template_usage_template_id_idx" ON "template_usage_history" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "template_usage_library_template_id_idx" ON "template_usage_history" USING btree ("library_template_id");--> statement-breakpoint
CREATE INDEX "template_usage_team_id_idx" ON "template_usage_history" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "template_usage_used_at_idx" ON "template_usage_history" USING btree ("used_at");--> statement-breakpoint
CREATE INDEX "template_usage_action_idx" ON "template_usage_history" USING btree ("action");--> statement-breakpoint
CREATE INDEX "template_usage_team_used_at_idx" ON "template_usage_history" USING btree ("team_id","used_at");--> statement-breakpoint
CREATE INDEX "template_usage_action_used_at_idx" ON "template_usage_history" USING btree ("action","used_at");