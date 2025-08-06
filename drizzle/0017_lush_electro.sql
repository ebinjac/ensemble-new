ALTER TABLE "applications" ADD COLUMN "short_identifier" varchar(12) NOT NULL;--> statement-breakpoint
CREATE INDEX "applications_short_identifier_idx" ON "applications" USING btree ("short_identifier");--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "tla";