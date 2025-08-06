DROP INDEX "applications_short_identifier_idx";--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "tla" varchar(12) NOT NULL;--> statement-breakpoint
CREATE INDEX "applications_tla_idx" ON "applications" USING btree ("tla");--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "short_identifier";