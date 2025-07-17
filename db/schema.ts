// db/schema/teams.ts

import { pgTable, uuid, varchar, text, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";

// Define approval status enum
export const approvalStatus = pgEnum('approval_status', ['pending', 'approved', 'rejected']);

// Teams table
export const teams = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamName: varchar("team_name", { length: 100 }).notNull().unique(),
  userGroup: varchar("user_group", { length: 100 }).notNull(),
  adminGroup: varchar("admin_group", { length: 100 }).notNull(),
  contactName: varchar("contact_name", { length: 100 }),
  contactEmail: varchar("contact_email", { length: 255 }),
});

// Team registration requests table
export const teamRegistrationRequests = pgTable("team_registration_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamName: varchar("team_name", { length: 100 }).notNull(),
  userGroup: varchar("user_group", { length: 100 }).notNull(),
  adminGroup: varchar("admin_group", { length: 100 }).notNull(),
  contactName: varchar("contact_name", { length: 100 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  
  // Approval specific fields
  status: approvalStatus("status").notNull().default('pending'),
  requestedBy: varchar("requested_by", { length: 255 }).notNull(),
  requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
  reviewedBy: varchar("reviewed_by", { length: 255 }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  comments: text("comments"),
});

// Applications table
export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Team reference
  teamId: uuid("team_id").notNull().references(() => teams.id),
  
  // Application details
  carId: varchar("car_id", { length: 50 }).notNull().unique(),
  applicationName: varchar("application_name", { length: 255 }).notNull(),
  tla: varchar("tla", { length: 10 }).notNull(), // Three Letter Acronym
  
  // Leadership information
  vpName: varchar("vp_name", { length: 100 }).notNull(),
  vpEmail: varchar("vp_email", { length: 255 }).notNull(),
  directorName: varchar("director_name", { length: 100 }).notNull(),
  directorEmail: varchar("director_email", { length: 255 }).notNull(),
  
  // Application metadata
  tier: integer("tier").notNull(),
  snowGroup: varchar("snow_group", { length: 255 }), // Optional ServiceNow group
  slackChannel: varchar("slack_channel", { length: 100 }), // Optional Slack channel
  
  // Additional metadata
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default('active'),
  
  // Audit fields
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: varchar("updated_by", { length: 255 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
