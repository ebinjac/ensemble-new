// db/schema/types.ts - Link Manager types

import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { links, linkCategories, linkAccessLog } from '@/db/schema/link-manager';

// Base types
export type Link = InferSelectModel<typeof links>;
export type NewLink = InferInsertModel<typeof links>;
export type LinkCategory = InferSelectModel<typeof linkCategories>;
export type NewLinkCategory = InferInsertModel<typeof linkCategories>;
export type LinkAccess = InferSelectModel<typeof linkAccessLog>;

// Extended types with relationships
export type LinkWithApplications = Link & {
  applications: Array<{
    id: string;
    applicationName: string;
    tla: string;
    status: string;
  }>;
};

export type LinkWithStats = Link & {
  recentAccesses: number;
  uniqueUsers: number;
  lastAccess?: Date;
};

// Filter and query types
export type LinkFilters = {
  applicationIds?: string[];
  category?: string;
  status?: 'active' | 'inactive' | 'archived' | 'broken';
  isCommon?: boolean;
  isPinned?: boolean;
  tags?: string[];
  search?: string;
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type LinkSortOptions = 
  | 'title-asc' 
  | 'title-desc'
  | 'created-asc' 
  | 'created-desc'
  | 'accessed-asc' 
  | 'accessed-desc'
  | 'popularity';
