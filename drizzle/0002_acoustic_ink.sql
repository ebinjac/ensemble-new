CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"car_id" varchar(50) NOT NULL,
	"application_name" varchar(255) NOT NULL,
	"tla" varchar(10) NOT NULL,
	"vp_name" varchar(100) NOT NULL,
	"vp_email" varchar(255) NOT NULL,
	"director_name" varchar(100) NOT NULL,
	"director_email" varchar(255) NOT NULL,
	"tier" integer NOT NULL,
	"snow_group" varchar(255),
	"slack_channel" varchar(100),
	"description" text,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_car_id_unique" UNIQUE("car_id")
);
--> statement-breakpoint
ALTER TABLE "team_registration_requests" ALTER COLUMN "requested_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "team_registration_requests" ALTER COLUMN "requested_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "team_registration_requests" ALTER COLUMN "reviewed_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;