// db/schema/teams.ts

import { pgTable, uuid, varchar, text, timestamp, pgEnum, integer, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Define enums (keeping only the one we need)
export const approvalStatus = pgEnum('approval_status', ['pending', 'approved', 'rejected']);

// Teams table (unchanged)
export const teams = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamName: varchar("team_name", { length: 100 }).notNull().unique(),
  userGroup: varchar("user_group", { length: 100 }).notNull(),
  adminGroup: varchar("admin_group", { length: 100 }).notNull(),
  contactName: varchar("contact_name", { length: 100 }).notNull(),
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

// Team registration requests table (unchanged)
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

// Applications table - keeping tla column name but with 12 character limit
export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Team reference with cascade rules
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  
  // Application details - CAR ID is the Asset ID
  assetId: integer("asset_id").notNull().unique(), // This is also the CAR ID
  applicationName: varchar("application_name", { length: 255 }).notNull(),
  tla: varchar("tla", { length: 12 }).notNull(), // Kept as tla but increased to 12 chars for UI flexibility
  
  // Central API fields - auto-populated
  lifeCycleStatus: varchar("life_cycle_status", { length: 50 }),
  tier: varchar("tier", { length: 50 }), // Auto-populated from BIA tier
  
  // Leadership information - auto-populated from Central API
  vpName: varchar("vp_name", { length: 100 }), // From productionSupportOwnerLeader1
  vpEmail: varchar("vp_email", { length: 255 }), // From productionSupportOwnerLeader1
  directorName: varchar("director_name", { length: 100 }), // From productionSupportOwner
  directorEmail: varchar("director_email", { length: 255 }), // From productionSupportOwner
  
  // Additional contact emails - user entered
  escalationEmail: varchar("escalation_email", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  teamEmail: varchar("team_email", { length: 255 }),
  
  // Ownership information from central API (all auto-populated)
  applicationOwnerName: varchar("application_owner_name", { length: 100 }),
  applicationOwnerEmail: varchar("application_owner_email", { length: 255 }),
  applicationOwnerBand: varchar("application_owner_band", { length: 10 }),
  
  applicationManagerName: varchar("application_manager_name", { length: 100 }),
  applicationManagerEmail: varchar("application_manager_email", { length: 255 }),
  applicationManagerBand: varchar("application_manager_band", { length: 10 }),
  
  applicationOwnerLeader1Name: varchar("application_owner_leader1_name", { length: 100 }),
  applicationOwnerLeader1Email: varchar("application_owner_leader1_email", { length: 255 }),
  applicationOwnerLeader1Band: varchar("application_owner_leader1_band", { length: 10 }),
  
  applicationOwnerLeader2Name: varchar("application_owner_leader2_name", { length: 100 }),
  applicationOwnerLeader2Email: varchar("application_owner_leader2_email", { length: 255 }),
  applicationOwnerLeader2Band: varchar("application_owner_leader2_band", { length: 10 }),
  
  ownerSvpName: varchar("owner_svp_name", { length: 100 }),
  ownerSvpEmail: varchar("owner_svp_email", { length: 255 }),
  ownerSvpBand: varchar("owner_svp_band", { length: 10 }),
  
  businessOwnerName: varchar("business_owner_name", { length: 100 }),
  businessOwnerEmail: varchar("business_owner_email", { length: 255 }),
  businessOwnerBand: varchar("business_owner_band", { length: 10 }),
  
  businessOwnerLeader1Name: varchar("business_owner_leader1_name", { length: 100 }),
  businessOwnerLeader1Email: varchar("business_owner_leader1_email", { length: 255 }),
  businessOwnerLeader1Band: varchar("business_owner_leader1_band", { length: 10 }),
  
  productionSupportOwnerName: varchar("production_support_owner_name", { length: 100 }),
  productionSupportOwnerEmail: varchar("production_support_owner_email", { length: 255 }),
  productionSupportOwnerBand: varchar("production_support_owner_band", { length: 10 }),
  
  productionSupportOwnerLeader1Name: varchar("production_support_owner_leader1_name", { length: 100 }),
  productionSupportOwnerLeader1Email: varchar("production_support_owner_leader1_email", { length: 255 }),
  productionSupportOwnerLeader1Band: varchar("production_support_owner_leader1_band", { length: 10 }),
  
  pmoName: varchar("pmo_name", { length: 100 }),
  pmoEmail: varchar("pmo_email", { length: 255 }),
  pmoBand: varchar("pmo_band", { length: 10 }),
  
  unitCioName: varchar("unit_cio_name", { length: 100 }),
  unitCioEmail: varchar("unit_cio_email", { length: 255 }),
  unitCioBand: varchar("unit_cio_band", { length: 10 }),
  
  // Application metadata
  snowGroup: varchar("snow_group", { length: 255 }),
  slackChannel: varchar("slack_channel", { length: 100 }),
  
  // Additional metadata
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default('active'),
  
  // Central API sync tracking
  lastCentralApiSync: timestamp("last_central_api_sync", { withTimezone: true }),
  centralApiSyncStatus: varchar("central_api_sync_status", { length: 50 }).default('pending'),
  
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
  assetIdIdx: uniqueIndex('applications_asset_id_idx').on(table.assetId), // Asset ID is unique
  tlaIdx: index('applications_tla_idx').on(table.tla), // Index for tla field
  tierIdx: index('applications_tier_idx').on(table.tier),
  lifeCycleStatusIdx: index('applications_life_cycle_status_idx').on(table.lifeCycleStatus),
  
  // Composite indexes for common queries
  teamStatusIdx: index('applications_team_status_idx').on(table.teamId, table.status),
  teamStatusCreatedIdx: index('applications_team_status_created_idx')
    .on(table.teamId, table.status, table.createdAt),
  
  // Checks
  vpEmailCheck: sql`vp_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR vp_email IS NULL`,
  directorEmailCheck: sql`director_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR director_email IS NULL`,
  slackChannelCheck: sql`slack_channel LIKE '#%' OR slack_channel IS NULL`,
  
  // Email validation for new contact email fields
  escalationEmailCheck: sql`escalation_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR escalation_email IS NULL`,
  contactEmailCheck: sql`contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR contact_email IS NULL`,
  teamEmailCheck: sql`team_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR team_email IS NULL`,
  
  // Email validation for central API owner fields
  applicationOwnerEmailCheck: sql`application_owner_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR application_owner_email IS NULL`,
  applicationManagerEmailCheck: sql`application_manager_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR application_manager_email IS NULL`,
  businessOwnerEmailCheck: sql`business_owner_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR business_owner_email IS NULL`,
  productionSupportOwnerEmailCheck: sql`production_support_owner_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR production_support_owner_email IS NULL`,
}));
