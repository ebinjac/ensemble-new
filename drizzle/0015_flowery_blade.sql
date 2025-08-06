ALTER TABLE "applications" ALTER COLUMN "tier" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "escalation_email" varchar(255);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "contact_email" varchar(255);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "team_email" varchar(255);