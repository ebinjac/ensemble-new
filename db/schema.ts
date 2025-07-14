// db/schema/teams.ts

import { pgTable, uuid, varchar, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

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
