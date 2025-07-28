CREATE TYPE "public"."library_visibility" AS ENUM('private', 'team', 'public');--> statement-breakpoint
ALTER TABLE "template_library" ADD COLUMN "team_id" uuid;--> statement-breakpoint
ALTER TABLE "template_library" ADD COLUMN "visibility" "library_visibility" DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "template_library" ADD COLUMN "original_template_id" uuid;--> statement-breakpoint
ALTER TABLE "template_library" ADD COLUMN "is_component" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "template_library" ADD COLUMN "updated_by" varchar(255);--> statement-breakpoint
ALTER TABLE "template_usage_history" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "template_library" ADD CONSTRAINT "template_library_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "template_library" ADD CONSTRAINT "template_library_original_template_id_email_templates_id_fk" FOREIGN KEY ("original_template_id") REFERENCES "public"."email_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "template_library_team_id_idx" ON "template_library" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "template_library_visibility_idx" ON "template_library" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "template_library_team_visibility_idx" ON "template_library" USING btree ("team_id","visibility");--> statement-breakpoint
CREATE INDEX "template_library_is_component_idx" ON "template_library" USING btree ("is_component");--> statement-breakpoint
CREATE INDEX "template_library_original_template_idx" ON "template_library" USING btree ("original_template_id");