CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_name" varchar(100) NOT NULL,
	"user_group" varchar(100) NOT NULL,
	"admin_group" varchar(100) NOT NULL,
	"contact_name" varchar(100),
	"contact_email" varchar(255),
	CONSTRAINT "teams_team_name_unique" UNIQUE("team_name")
);
