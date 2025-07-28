// db/schema/link-manager.ts

import { pgTable, uuid, varchar, text, timestamp, boolean, integer, index, uniqueIndex, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { teams } from "./teams";
import { applications } from "./teams"; // Assuming applications are in teams.ts

// Link status enum for lifecycle management
export const linkStatus = pgEnum('link_status', [
  'active',
  'inactive', 
  'archived',
  'broken'
]);

// Link category enum for classification
export const linkCategory = pgEnum('link_category', [
  'documentation',
  'tool',
  'resource',
  'dashboard',
  'repository',
  'service',
  'other'
]);

// Main links table with comprehensive metadata
export const links = pgTable("links", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Team reference with cascade rules
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  // Link details with validation
  title: varchar("title", { length: 255 }).notNull(),
  url: text("url").notNull(),
  description: text("description"),
  
  // Application categorization
  applicationIds: uuid("application_ids").array().default(sql`'{}'::uuid[]`),
  
  // Auto-computed common flag (generated column)
  isCommon: boolean("is_common")
    .generatedAlwaysAs(sql`array_length(application_ids, 1) > 1`),
  
  // Classification and metadata
  category: linkCategory("category").default('other'),
  tags: varchar("tags", { length: 100 }).array().default(sql`'{}'::varchar[]`),
  
  // Link management
  status: linkStatus("status").notNull().default('active'),
  isPublic: boolean("is_public").default(false),
  isPinned: boolean("is_pinned").default(false),
  
  // Usage analytics
  accessCount: integer("access_count").default(0),
  lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
  lastValidatedAt: timestamp("last_validated_at", { withTimezone: true }),
  
  // Audit fields following your pattern
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: varchar("updated_by", { length: 255 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => ({
  // Primary indexes for performance
  teamIdIdx: index('links_team_id_idx').on(table.teamId),
  statusIdx: index('links_status_idx').on(table.status),
  categoryIdx: index('links_category_idx').on(table.category),
  isCommonIdx: index('links_is_common_idx').on(table.isCommon),
  isPinnedIdx: index('links_is_pinned_idx').on(table.isPinned),
  
  // Array indexes for application filtering
  applicationIdsIdx: index('links_application_ids_idx').using('gin', table.applicationIds),
  tagsIdx: index('links_tags_idx').using('gin', table.tags),
  
  // Composite indexes for common queries
  teamStatusIdx: index('links_team_status_idx').on(table.teamId, table.status),
  teamCategoryIdx: index('links_team_category_idx').on(table.teamId, table.category),
  teamCreatedIdx: index('links_team_created_idx').on(table.teamId, table.createdAt.desc()),
  
  // Full-text search index
  titleDescSearchIdx: index('links_search_idx').using('gin', 
    sql`to_tsvector('english', title || ' ' || COALESCE(description, ''))`
  ),
  
  // Constraints following your pattern
  urlValidation: sql`url ~* '^https?://.+'`,
  titleLength: sql`length(trim(title)) > 0`,
  applicationOrCommon: sql`array_length(application_ids, 1) > 0 OR is_common = true`,
}));


// Custom categories for teams
export const linkCategories = pgTable("link_categories", {
    id: uuid("id").defaultRandom().primaryKey(),
    
    // Team reference
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    
    // Category details
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 7 }), // Hex color code
    icon: varchar("icon", { length: 50 }), // Icon identifier
    
    // Ordering and status
    sortOrder: integer("sort_order").default(0),
    isActive: boolean("is_active").default(true),
    
    // Audit fields
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedBy: varchar("updated_by", { length: 255 }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  }, (table) => ({
    // Indexes
    teamIdIdx: index('link_categories_team_id_idx').on(table.teamId),
    nameTeamIdx: uniqueIndex('link_categories_name_team_idx').on(table.teamId, table.name),
    sortOrderIdx: index('link_categories_sort_order_idx').on(table.sortOrder),
    
    // Constraints
    colorFormat: sql`color IS NULL OR color ~* '^#[0-9A-Fa-f]{6}$'`,
    nameLength: sql`length(trim(name)) > 0`,
  }));
  

  // Track link access for analytics
export const linkAccessLog = pgTable("link_access_log", {
    id: uuid("id").defaultRandom().primaryKey(),
    
    // References
    linkId: uuid("link_id")
      .notNull()
      .references(() => links.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    
    // Access details
    accessedBy: varchar("accessed_by", { length: 255 }).notNull(),
    accessedAt: timestamp("accessed_at", { withTimezone: true }).defaultNow().notNull(),
    
    // Context information
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }), // Support IPv6
    referrer: text("referrer"),
  }, (table) => ({
    // Indexes for analytics queries
    linkIdIdx: index('link_access_log_link_id_idx').on(table.linkId),
    teamIdIdx: index('link_access_log_team_id_idx').on(table.teamId),
    accessedAtIdx: index('link_access_log_accessed_at_idx').on(table.accessedAt.desc()),
    accessedByIdx: index('link_access_log_accessed_by_idx').on(table.accessedBy),
    
    // Composite indexes for common analytics queries
    linkDateIdx: index('link_access_log_link_date_idx').on(table.linkId, table.accessedAt.desc()),
    teamDateIdx: index('link_access_log_team_date_idx').on(table.teamId, table.accessedAt.desc()),
  }));
  

  