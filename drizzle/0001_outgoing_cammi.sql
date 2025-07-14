CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "team_registration_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_name" varchar(100) NOT NULL,
	"user_group" varchar(100) NOT NULL,
	"admin_group" varchar(100) NOT NULL,
	"contact_name" varchar(100),
	"contact_email" varchar(255),
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"requested_by" varchar(255) NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_by" varchar(255),
	"reviewed_at" timestamp,
	"comments" text
);
