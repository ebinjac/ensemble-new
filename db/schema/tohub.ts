// db/schema/turnover.ts

import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  timestamp, 
  boolean, 
  date,
  jsonb,
  pgEnum,
  integer,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { teams, applications } from "./teams"; // Adjust path as needed

// Turnover-specific enums
export const sectionType = pgEnum('section_type', [
  'handover',
  'rfc', 
  'inc', 
  'alerts', 
  'mim', 
  'email_slack', 
  'fyi'
]);

// ✅ FIXED: Comprehensive status enum that includes all possible status values
export const entryStatus = pgEnum('entry_status', [
  // Generic statuses
  'open',
  'closed',
  'pending',
  'resolved',
  'cancelled',
  
  // RFC-specific statuses
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'implemented',
  
  // INC-specific statuses
  'new',
  'assigned',
  'in_progress',
  
  // Alert-specific statuses
  'active',
  'acknowledged',
  'investigating',
  'false_positive'
]);

export const flagType = pgEnum('flag_type', [
  'manual',
  'needs_update', // > 24 hours without update
  'long_pending', // > 72 hours old
  'important',
  'urgent'
]);

// Sub-applications table - checkboxes under each application
export const subApplications = pgTable("sub_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Parent application reference
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  // Sub-application details
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  displayOrder: integer("display_order").default(0),
  
  // Status and metadata
  isActive: boolean("is_active").default(true),
  
  // Audit fields
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: varchar("updated_by", { length: 255 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => ({
  // Working indexes
  applicationIdIdx: index('sub_apps_application_id_idx').on(table.applicationId),
  isActiveIdx: index('sub_apps_is_active_idx').on(table.isActive),
  displayOrderIdx: index('sub_apps_display_order_idx').on(table.displayOrder),
  
  // Unique constraint for name within application
  uniqueNamePerApp: uniqueIndex('sub_apps_name_per_app_idx')
    .on(table.applicationId, table.name),
}));

// Main turnover sessions table
export const turnoverSessions = pgTable("turnover_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // References
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  
  // Handover details
  handoverFrom: varchar("handover_from", { length: 255 }).notNull(),
  handoverTo: varchar("handover_to", { length: 255 }).notNull(),
  sessionDate: date("session_date").notNull(),
  
  // Selected sub-applications (array of UUIDs)
  selectedSubApps: uuid("selected_sub_apps").array().default(sql`ARRAY[]::uuid[]`),
  
  // Session status
  isCurrent: boolean("is_current").default(true),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  
  // Audit fields
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: varchar("updated_by", { length: 255 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Working indexes
  teamIdIdx: index('turnover_sessions_team_id_idx').on(table.teamId),
  applicationIdIdx: index('turnover_sessions_application_id_idx').on(table.applicationId),
  sessionDateIdx: index('turnover_sessions_session_date_idx').on(table.sessionDate),
  isCurrentIdx: index('turnover_sessions_is_current_idx').on(table.isCurrent),
  
  // Composite indexes for common queries
  teamAppCurrentIdx: index('turnover_sessions_team_app_current_idx')
    .on(table.teamId, table.applicationId, table.isCurrent),
  teamDateIdx: index('turnover_sessions_team_date_idx')
    .on(table.teamId, table.sessionDate),
    
  // Fixed unique constraint for one current session per team/app
  uniqueCurrentSession: uniqueIndex('turnover_sessions_unique_current_idx')
    .on(table.teamId, table.applicationId)
    .where(sql`${table.isCurrent} = true`),
}));

// Turnover entries - for all sections (RFC, INC, Alerts, etc.)
export const turnoverEntries = pgTable("turnover_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // References
  sessionId: uuid("session_id")
    .notNull()
    .references(() => turnoverSessions.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  subApplicationId: uuid("sub_application_id")
    .references(() => subApplications.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  
  // Entry classification
  sectionType: sectionType("section_type").notNull(),
  
  // Common fields across all sections
  title: varchar("title", { length: 255 }),
  description: text("description"),
  comments: text("comments"),
  status: entryStatus("status").default('open'), // ✅ Now supports all status values
  
  // Section-specific data stored as JSONB
  // This allows flexibility for different section requirements
  sectionData: jsonb("section_data").default(sql`'{}'::jsonb`),
  
  // Flagging system
  isImportant: boolean("is_important").default(false),
  isFlagged: boolean("is_flagged").default(false),
  flagType: flagType("flag_type"),
  flagReason: varchar("flag_reason", { length: 255 }),
  flaggedAt: timestamp("flagged_at", { withTimezone: true }),
  flaggedBy: varchar("flagged_by", { length: 255 }),
  
  // Entry ordering within section
  displayOrder: integer("display_order").default(0),
  
  // Audit fields
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: varchar("updated_by", { length: 255 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Working indexes
  sessionIdIdx: index('turnover_entries_session_id_idx').on(table.sessionId),
  subApplicationIdIdx: index('turnover_entries_sub_app_id_idx').on(table.subApplicationId),
  sectionTypeIdx: index('turnover_entries_section_type_idx').on(table.sectionType),
  statusIdx: index('turnover_entries_status_idx').on(table.status),
  isFlaggedIdx: index('turnover_entries_is_flagged_idx').on(table.isFlagged),
  isImportantIdx: index('turnover_entries_is_important_idx').on(table.isImportant),
  createdAtIdx: index('turnover_entries_created_at_idx').on(table.createdAt),
  updatedAtIdx: index('turnover_entries_updated_at_idx').on(table.updatedAt),
  
  // Composite indexes for common queries
  sessionSectionIdx: index('turnover_entries_session_section_idx')
    .on(table.sessionId, table.sectionType),
  sessionSubAppIdx: index('turnover_entries_session_sub_app_idx')
    .on(table.sessionId, table.subApplicationId),
  flaggedEntriesIdx: index('turnover_entries_flagged_idx')
    .on(table.isFlagged, table.flagType, table.updatedAt),
    
  // Updated status-based indexes for queries
  openEntriesIdx: index('turnover_entries_open_idx')
    .on(table.status, table.createdAt)
    .where(sql`${table.status} IN ('open', 'pending', 'new', 'draft', 'active')`),
}));

// Daily snapshots for historical tracking
export const turnoverSnapshots = pgTable("turnover_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // References
  sessionId: uuid("session_id")
    .notNull()
    .references(() => turnoverSessions.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  // Snapshot metadata
  snapshotDate: date("snapshot_date").notNull(),
  snapshotType: varchar("snapshot_type", { length: 50 }).default('daily'),
  
  // Complete snapshot of session and entries
  sessionData: jsonb("session_data").notNull(),
  entriesData: jsonb("entries_data").notNull(),
  
  // Snapshot statistics
  totalEntries: integer("total_entries").default(0),
  flaggedEntries: integer("flagged_entries").default(0),
  completedEntries: integer("completed_entries").default(0),
  
  // Audit fields
  createdBy: varchar("created_by", { length: 255 }).default('system'),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Working indexes
  sessionIdIdx: index('turnover_snapshots_session_id_idx').on(table.sessionId),
  snapshotDateIdx: index('turnover_snapshots_snapshot_date_idx').on(table.snapshotDate),
  snapshotTypeIdx: index('turnover_snapshots_snapshot_type_idx').on(table.snapshotType),
  
  // Unique constraint for one daily snapshot per session per date
  uniqueDailySnapshot: uniqueIndex('turnover_snapshots_unique_daily_idx')
    .on(table.sessionId, table.snapshotDate, table.snapshotType),
}));

// Entry attachments/links table (for MIM links, Slack links, etc.)
export const entryAttachments = pgTable("entry_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Reference to entry
  entryId: uuid("entry_id")
    .notNull()
    .references(() => turnoverEntries.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  // Attachment details
  attachmentType: varchar("attachment_type", { length: 50 }).notNull(), // 'link', 'mim', 'slack', 'email'
  title: varchar("title", { length: 255 }),
  url: text("url").notNull(),
  description: text("description"),
  
  // Metadata
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  
  // Audit fields
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: varchar("updated_by", { length: 255 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => ({
  // Working indexes
  entryIdIdx: index('entry_attachments_entry_id_idx').on(table.entryId),
  attachmentTypeIdx: index('entry_attachments_type_idx').on(table.attachmentType),
  isActiveIdx: index('entry_attachments_is_active_idx').on(table.isActive),
}));

export const turnoverComments = pgTable("turnover_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Reference to the main entry
  entryId: uuid("entry_id")
    .notNull()
    .references(() => turnoverEntries.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  // Comment content
  comment: text("comment").notNull(),
  commentDate: date("comment_date").notNull(), // Date of the comment (YYYY-MM-DD)
  
  // User attribution
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdByName: varchar("created_by_name", { length: 255 }), // Store display name
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => ({
  // Indexes
  entryIdIdx: index('turnover_comments_entry_id_idx').on(table.entryId),
  commentDateIdx: index('turnover_comments_date_idx').on(table.commentDate),
  createdByIdx: index('turnover_comments_created_by_idx').on(table.createdBy),
  
  // Unique constraint: one comment per entry per date per user
  uniqueEntryDateUser: uniqueIndex('turnover_comments_unique_entry_date_user_idx')
    .on(table.entryId, table.commentDate, table.createdBy),
}));