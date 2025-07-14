-- Create enum type for approval status
DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create teams table
CREATE TABLE IF NOT EXISTS "teams" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "team_name" varchar(100) NOT NULL UNIQUE,
    "user_group" varchar(100) NOT NULL,
    "admin_group" varchar(100) NOT NULL,
    "contact_name" varchar(100),
    "contact_email" varchar(255)
);

-- Create team registration requests table
CREATE TABLE IF NOT EXISTS "team_registration_requests" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "team_name" varchar(100) NOT NULL,
    "user_group" varchar(100) NOT NULL,
    "admin_group" varchar(100) NOT NULL,
    "contact_name" varchar(100),
    "contact_email" varchar(255),
    "status" approval_status NOT NULL DEFAULT 'pending',
    "requested_by" varchar(255) NOT NULL,
    "requested_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" varchar(255),
    "reviewed_at" timestamptz,
    "comments" text
); 