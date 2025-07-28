// db/schema/teams.ts

import { pgTable, uuid, varchar, text, timestamp, pgEnum, integer, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Define enums
export const approvalStatus = pgEnum('approval_status', ['pending', 'approved', 'rejected']);
export const applicationStatus = pgEnum('application_status', [
  'active',
  'inactive',
  'pending',
  'deprecated',
  'maintenance'
]);

// Teams table with enhanced audit fields and constraints
export const teams = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamName: varchar("team_name", { length: 100 }).notNull().unique(),
  userGroup: varchar("user_group", { length: 100 }).notNull(),
  adminGroup: varchar("admin_group", { length: 100 }).notNull(),
  contactName: varchar("contact_name", { length: 100 }).notNull(), // Made required
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  
  // Audit fields
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: varchar("updated_by", { length: 255 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => ({
  // Indexes for teams table
  teamNameIdx: uniqueIndex('teams_team_name_idx').on(table.teamName),
  contactEmailIdx: index('teams_contact_email_idx').on(table.contactEmail),
  isActiveIdx: index('teams_is_active_idx').on(table.isActive),
  // Checks
  emailCheck: sql`contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`,
}));

// Team registration requests table with enhanced tracking
export const teamRegistrationRequests = pgTable("team_registration_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamName: varchar("team_name", { length: 100 }).notNull(),
  userGroup: varchar("user_group", { length: 100 }).notNull(),
  adminGroup: varchar("admin_group", { length: 100 }).notNull(),
  contactName: varchar("contact_name", { length: 100 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  
  // Approval specific fields
  status: approvalStatus("status").notNull().default('pending'),
  requestedBy: varchar("requested_by", { length: 255 }).notNull(),
  requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
  reviewedBy: varchar("reviewed_by", { length: 255 }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  comments: text("comments"),

  // Audit fields
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => ({
  // Indexes for registration requests
  statusIdx: index('team_reg_status_idx').on(table.status),
  requestedByIdx: index('team_reg_requested_by_idx').on(table.requestedBy),
  requestedAtIdx: index('team_reg_requested_at_idx').on(table.requestedAt),
  // Composite index for status-based queries
  statusRequestedAtIdx: index('team_reg_status_requested_at_idx').on(table.status, table.requestedAt),
  // Checks
  emailCheck: sql`contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`,
}));

// Applications table with enhanced validation and relationships
export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Team reference with cascade rules
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  
  // Application details with validation
  carId: varchar("car_id", { length: 50 }).notNull().unique(),
  applicationName: varchar("application_name", { length: 255 }).notNull(),
  tla: varchar("tla", { length: 10 }).notNull(), // Three Letter Acronym
  
  // Leadership information with email validation
  vpName: varchar("vp_name", { length: 100 }).notNull(),
  vpEmail: varchar("vp_email", { length: 255 }).notNull(),
  directorName: varchar("director_name", { length: 100 }).notNull(),
  directorEmail: varchar("director_email", { length: 255 }).notNull(),
  
  // Application metadata with constraints
  tier: integer("tier").notNull(),
  snowGroup: varchar("snow_group", { length: 255 }),
  slackChannel: varchar("slack_channel", { length: 100 }),
  
  // Additional metadata
  description: text("description"),
  status: applicationStatus("status").notNull().default('active'),
  
  // Audit fields
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: varchar("updated_by", { length: 255 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => ({
  // Indexes for applications
  teamIdIdx: index('applications_team_id_idx').on(table.teamId),
  statusIdx: index('applications_status_idx').on(table.status),
  carIdIdx: uniqueIndex('applications_car_id_idx').on(table.carId),
  tierIdx: index('applications_tier_idx').on(table.tier),
  
  // Composite indexes for common queries
  teamStatusIdx: index('applications_team_status_idx').on(table.teamId, table.status),
  teamStatusCreatedIdx: index('applications_team_status_created_idx')
    .on(table.teamId, table.status, table.createdAt),
  
  // Checks
  tierCheck: sql`tier >= 0 AND tier <= 5`,
  vpEmailCheck: sql`vp_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`,
  directorEmailCheck: sql`director_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`,
  slackChannelCheck: sql`slack_channel LIKE '#%' OR slack_channel IS NULL`,
}));
