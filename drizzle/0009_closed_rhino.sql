CREATE TYPE "public"."link_category" AS ENUM('documentation', 'tool', 'resource', 'dashboard', 'repository', 'service', 'other');--> statement-breakpoint
CREATE TYPE "public"."link_status" AS ENUM('active', 'inactive', 'archived', 'broken');--> statement-breakpoint
CREATE TABLE "link_access_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"accessed_by" varchar(255) NOT NULL,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text,
	"ip_address" varchar(45),
	"referrer" text
);
--> statement-breakpoint
CREATE TABLE "link_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(7),
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"application_ids" uuid[] DEFAULT '{}'::uuid[],
	"is_common" boolean GENERATED ALWAYS AS (array_length(application_ids, 1) > 1) STORED,
	"category" "link_category" DEFAULT 'other',
	"tags" varchar(100)[] DEFAULT '{}'::varchar[],
	"status" "link_status" DEFAULT 'active' NOT NULL,
	"is_public" boolean DEFAULT false,
	"is_pinned" boolean DEFAULT false,
	"access_count" integer DEFAULT 0,
	"last_accessed_at" timestamp with time zone,
	"last_validated_at" timestamp with time zone,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "link_access_log" ADD CONSTRAINT "link_access_log_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "link_access_log" ADD CONSTRAINT "link_access_log_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "link_categories" ADD CONSTRAINT "link_categories_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "link_access_log_link_id_idx" ON "link_access_log" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX "link_access_log_team_id_idx" ON "link_access_log" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "link_access_log_accessed_at_idx" ON "link_access_log" USING btree ("accessed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "link_access_log_accessed_by_idx" ON "link_access_log" USING btree ("accessed_by");--> statement-breakpoint
CREATE INDEX "link_access_log_link_date_idx" ON "link_access_log" USING btree ("link_id","accessed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "link_access_log_team_date_idx" ON "link_access_log" USING btree ("team_id","accessed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "link_categories_team_id_idx" ON "link_categories" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "link_categories_name_team_idx" ON "link_categories" USING btree ("team_id","name");--> statement-breakpoint
CREATE INDEX "link_categories_sort_order_idx" ON "link_categories" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "links_team_id_idx" ON "links" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "links_status_idx" ON "links" USING btree ("status");--> statement-breakpoint
CREATE INDEX "links_category_idx" ON "links" USING btree ("category");--> statement-breakpoint
CREATE INDEX "links_is_common_idx" ON "links" USING btree ("is_common");--> statement-breakpoint
CREATE INDEX "links_is_pinned_idx" ON "links" USING btree ("is_pinned");--> statement-breakpoint
CREATE INDEX "links_application_ids_idx" ON "links" USING gin ("application_ids");--> statement-breakpoint
CREATE INDEX "links_tags_idx" ON "links" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "links_team_status_idx" ON "links" USING btree ("team_id","status");--> statement-breakpoint
CREATE INDEX "links_team_category_idx" ON "links" USING btree ("team_id","category");--> statement-breakpoint
CREATE INDEX "links_team_created_idx" ON "links" USING btree ("team_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "links_search_idx" ON "links" USING gin (to_tsvector('english', title || ' ' || COALESCE(description, '')));