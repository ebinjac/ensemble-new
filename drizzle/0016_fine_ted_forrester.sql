ALTER TABLE "applications" DROP CONSTRAINT "applications_car_id_unique";--> statement-breakpoint
DROP INDEX "applications_car_id_idx";--> statement-breakpoint
DROP INDEX "applications_bia_tier_idx";--> statement-breakpoint
DROP INDEX "applications_lifecycle_bia_idx";--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "asset_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "vp_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "vp_email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "director_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "director_email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "tier" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "car_id";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "bia_tier";