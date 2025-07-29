// app/actions/link-manager.ts
'use server'

import { db } from '@/db';
import { links, linkCategories, linkAccessLog } from '@/db/schema/link-manager';
import { applications } from '@/db/schema/teams';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { and, eq, or, ilike, sql, desc, asc, inArray, isNull, gte, lte, count } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Fixed Types for the actions
export type CreateLinkData = {
  title: string;
  url: string;
  description?: string;
  applicationIds: string[];
  category?: 'documentation' | 'tool' | 'resource' | 'dashboard' | 'repository' | 'service' | 'other';
  tags?: string[];
  isPinned?: boolean;
  isPublic?: boolean;
};

export type UpdateLinkData = Partial<CreateLinkData>;

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

// ✅ Fixed LinkWithApplications interface to match database schema exactly
export interface LinkWithApplications {
  id: string;
  teamId: string;
  title: string;
  url: string;
  description: string | null;
  applicationIds: string[] | null; // ✅ Fixed: matches schema (can be null)
  isCommon: boolean | null;
  category: 'documentation' | 'tool' | 'resource' | 'dashboard' | 'repository' | 'service' | 'other' | null;
  tags: string[] | null;
  status: 'active' | 'inactive' | 'archived' | 'broken' | null;
  isPublic: boolean | null;
  isPinned: boolean | null;
  accessCount: number | null;
  lastAccessedAt: Date | null;
  lastValidatedAt: Date | null; // ✅ Added missing field
  createdBy: string;
  createdAt: Date;
  updatedBy: string | null; // ✅ Added missing field
  updatedAt: Date | null;
  applications: Array<{
    id: string;
    applicationName: string;
    tla: string;
    status: string;
  }>;
}

// =============================================================================
// CRUD Operations
// =============================================================================

export async function createLink(
  teamId: string,
  linkData: {
    title: string;
    url: string;
    description?: string;
    applicationIds?: string[];
    category?: string;
    tags?: string[];
    status?: string;
    isPinned?: boolean;
    isPublic?: boolean;
  }
): Promise<{
  success: boolean;
  linkId?: string;
  error?: string;
}> {
  try {
    const { user } = await requireTeamAccess(teamId, { admin: false });
    const userEmail = user.user.email;

    // ✅ REMOVED: Duplicate URL check - allowing duplicate URLs now
    // No longer checking if URL already exists

    // Validate application IDs if provided
    let validApplicationIds: string[] = [];
    if (linkData.applicationIds && linkData.applicationIds.length > 0) {
      const validApps = await db
        .select({ id: applications.id })
        .from(applications)
        .where(
          and(
            eq(applications.teamId, teamId),
            inArray(applications.id, linkData.applicationIds),
            eq(applications.status, 'active')
          )
        );
      
      validApplicationIds = validApps.map(app => app.id);
    }

    // Create the link
    const [newLink] = await db
      .insert(links)
      .values({
        teamId,
        title: linkData.title.trim(),
        url: linkData.url.trim(),
        description: linkData.description?.trim() || null,
        applicationIds: validApplicationIds,
        category: (linkData.category as any) || 'other',
        tags: linkData.tags || [],
        status: (linkData.status as any) || 'active',
        isPinned: linkData.isPinned || false,
        isPublic: linkData.isPublic !== undefined ? linkData.isPublic : true,
        createdBy: userEmail,
        updatedBy: userEmail,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: links.id });

    revalidatePath(`/tools/teams/${teamId}/link-manager`);

    return { 
      success: true, 
      linkId: newLink.id 
    };
  } catch (error) {
    console.error('Error creating link:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create link'
    };
  }
}
export async function updateLink(
  teamId: string,
  linkId: string,
  linkData: {
    title: string;
    url: string;
    description?: string;
    applicationIds?: string[];
    category?: string;
    tags?: string[];
    status?: string;
    isPinned?: boolean;
    isPublic?: boolean;
  }
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { user, role } = await requireTeamAccess(teamId, { admin: false });
    const userEmail = user.user.email;

    // Check if link exists and get current data
    const existingLink = await db
      .select({
        id: links.id,
        createdBy: links.createdBy,
      })
      .from(links)
      .where(
        and(
          eq(links.id, linkId),
          eq(links.teamId, teamId)
        )
      )
      .limit(1);

    if (existingLink.length === 0) {
      return { success: false, error: 'Link not found' };
    }

    // Permission check: Only admins or the creator can edit
    if (role !== 'admin' && existingLink[0].createdBy !== userEmail) {
      return { 
        success: false, 
        error: 'You can only edit links you created' 
      };
    }

    // ✅ REMOVED: Duplicate URL check - allowing duplicate URLs now
    // No longer checking if another link with the same URL exists

    // Validate application IDs if provided
    let validApplicationIds: string[] = [];
    if (linkData.applicationIds && linkData.applicationIds.length > 0) {
      const validApps = await db
        .select({ id: applications.id })
        .from(applications)
        .where(
          and(
            eq(applications.teamId, teamId),
            inArray(applications.id, linkData.applicationIds),
            eq(applications.status, 'active')
          )
        );
      
      validApplicationIds = validApps.map(app => app.id);
    }

    // Update the link
    await db
      .update(links)
      .set({
        title: linkData.title.trim(),
        url: linkData.url.trim(),
        description: linkData.description?.trim() || null,
        applicationIds: validApplicationIds,
        category: (linkData.category as any) || 'other',
        tags: linkData.tags || [],
        status: (linkData.status as any) || 'active',
        isPinned: linkData.isPinned || false,
        isPublic: linkData.isPublic !== undefined ? linkData.isPublic : true,
        updatedBy: userEmail,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(links.id, linkId),
          eq(links.teamId, teamId)
        )
      );

    revalidatePath(`/tools/teams/${teamId}/link-manager`);

    return { success: true };
  } catch (error) {
    console.error('Error updating link:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update link'
    };
  }
}
export async function deleteLink(
  teamId: string,
  linkId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { user, role } = await requireTeamAccess(teamId, { admin: false });
    const userEmail = user.user.email;
    
    // Verify the link exists and belongs to the team
    const existingLink = await db
      .select({
        id: links.id,
        createdBy: links.createdBy,
        title: links.title
      })
      .from(links)
      .where(
        and(
          eq(links.id, linkId),
          eq(links.teamId, teamId)
        )
      )
      .limit(1);

    if (existingLink.length === 0) {
      return { success: false, error: 'Link not found' };
    }

    // ✅ Permission check: Only admins or the creator can delete
    if (role !== 'admin' && existingLink[0].createdBy !== userEmail) {
      return { 
        success: false, 
        error: 'You can only delete links you created' 
      };
    }

    // Delete the link
    await db
      .delete(links)
      .where(
        and(
          eq(links.id, linkId),
          eq(links.teamId, teamId)
        )
      );

    revalidatePath(`/tools/teams/${teamId}/link-manager`);

    return { success: true };

  } catch (error) {
    console.error('Error deleting link:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete link'
    };
  }
}

export async function getLinks(
  teamId: string,
  filters: LinkFilters & {
    isPrivate?: boolean;      // Filter for private links only
    isTeamPublic?: boolean;   // Filter for team public links only
  } = {},
  sortBy: LinkSortOptions = 'created-desc',
  page = 1,
  limit = 20
): Promise<{
  links: LinkWithApplications[];
  totalCount: number;
  totalPages: number;
}> {
  try {
    const { user, role } = await requireTeamAccess(teamId, { admin: false });
    const userEmail = user.user.email;

    const whereConditions = [eq(links.teamId, teamId)];

    // Handle new filter types
    if (filters.isPrivate) {
      // Show only user's private links
      whereConditions.push(
        and(
          eq(links.isPublic, false),
          eq(links.createdBy, userEmail)
        )!
      );
    } else if (filters.isTeamPublic) {
      // Show only public links (excluding user's private links)
      whereConditions.push(eq(links.isPublic, true));
    } else {
      // Default visibility filtering: Show public links + user's own private links + all links for admins
      if (role !== 'admin') {
        whereConditions.push(
          or(
            eq(links.isPublic, true),           // Public links
            eq(links.createdBy, userEmail)     // User's own links (including private)
          )!
        );
      }
      // Admins can see all links, so no additional visibility filter needed
    }

    // Status filter (default to active unless specifically looking for archived/broken)
    if (filters.status) {
      whereConditions.push(eq(links.status, filters.status));
    } else {
      whereConditions.push(eq(links.status, 'active'));
    }

    // Application filter with proper UUID array handling
    if (filters.applicationIds && filters.applicationIds.length > 0) {
      whereConditions.push(
        sql`${links.applicationIds} && ${sql.raw(`'{${filters.applicationIds.join(',')}}'::uuid[]`)}`
      );
    }

    // Category filter
    if (filters.category) {
      whereConditions.push(eq(links.category, filters.category as typeof links.category['_']['data']));
    }

    // Pinned filter
    if (filters.isPinned !== undefined) {
      whereConditions.push(eq(links.isPinned, filters.isPinned));
    }

    // Tags filter with proper text array handling
    if (filters.tags && filters.tags.length > 0) {
      whereConditions.push(
        sql`${links.tags} && ${sql.raw(`ARRAY[${filters.tags.map(tag => `'${tag.replace(/'/g, "''")}'`).join(',')}]::text[]`)}`
      );
    }

    // Enhanced search filter
    if (filters.search && filters.search.trim()) {
      const searchTerm = `%${filters.search.trim()}%`;
      whereConditions.push(
        or(
          ilike(links.title, searchTerm),
          ilike(sql`COALESCE(${links.description}, '')`, searchTerm),
          sql`EXISTS (
            SELECT 1 FROM unnest(${links.tags}) as tag 
            WHERE tag ILIKE ${searchTerm}
          )`
        )!
      );
    }

    // Created by filter
    if (filters.createdBy && filters.createdBy.trim()) {
      whereConditions.push(ilike(links.createdBy, `%${filters.createdBy.trim()}%`));
    }

    // Date range filters
    // 
    

    // Build sort order
    let orderBy;
    switch (sortBy) {
      case 'title-asc':
        orderBy = [asc(links.title)];
        break;
      case 'title-desc':
        orderBy = [desc(links.title)];
        break;
      case 'created-asc':
        orderBy = [asc(links.createdAt)];
        break;
      case 'created-desc':
        orderBy = [desc(links.createdAt)];
        break;
      case 'accessed-asc':
        orderBy = [asc(links.lastAccessedAt)];
        break;
      case 'accessed-desc':
        orderBy = [desc(links.lastAccessedAt)];
        break;
      case 'popularity':
        orderBy = [desc(links.accessCount), desc(links.createdAt)];
        break;
      default:
        orderBy = [desc(links.createdAt)];
    }

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(links)
      .where(and(...whereConditions));

    const totalCount = countResult.count;

    // Get links with all required fields
    const linksWithApps = await db
      .select({
        id: links.id,
        teamId: links.teamId,
        title: links.title,
        url: links.url,
        description: links.description,
        applicationIds: links.applicationIds,
        isCommon: links.isCommon,
        category: links.category,
        tags: links.tags,
        status: links.status,
        isPinned: links.isPinned,
        isPublic: links.isPublic,
        accessCount: links.accessCount,
        lastAccessedAt: links.lastAccessedAt,
        lastValidatedAt: links.lastValidatedAt,
        createdBy: links.createdBy,
        createdAt: links.createdAt,
        updatedBy: links.updatedBy,
        updatedAt: links.updatedAt,
      })
      .from(links)
      .where(and(...whereConditions))
      .orderBy(...orderBy)
      .limit(limit)
      .offset((page - 1) * limit);

    // Get applications for all links
    const allAppIds = [...new Set(
      linksWithApps
        .filter(link => link.applicationIds !== null)
        .flatMap(link => link.applicationIds!)
    )];
    
    const applicationsData = allAppIds.length > 0 ? await db
      .select({
        id: applications.id,
        applicationName: applications.applicationName,
        tla: applications.tla,
        status: applications.status,
      })
      .from(applications)
      .where(inArray(applications.id, allAppIds))
    : [];

    // Map applications to links
    const linksWithApplications: LinkWithApplications[] = linksWithApps.map(link => ({
      ...link,
      applications: applicationsData.filter(app => 
        link.applicationIds !== null && link.applicationIds.includes(app.id)
      ),
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return {
      links: linksWithApplications,
      totalCount,
      totalPages,
    };

  } catch (error) {
    console.error('Error fetching links:', error);
    throw new Error('Failed to fetch links');
  }
}
export async function getExistingTags(teamId: string): Promise<string[]> {
  try {
    await requireTeamAccess(teamId, { admin: false });

    const tagsResult = await db
      .select({
        tags: links.tags,
      })
      .from(links)
      .where(
        and(
          eq(links.teamId, teamId),
          eq(links.status, 'active'),
          sql`${links.tags} IS NOT NULL AND array_length(${links.tags}, 1) > 0`
        )
      );

    // Flatten and deduplicate tags
    const allTags = tagsResult
      .flatMap(row => row.tags || [])
      .filter((tag, index, arr) => arr.indexOf(tag) === index)
      .sort();

    return allTags;
  } catch (error) {
    console.error('Error fetching existing tags:', error);
    return [];
  }
}

// ✅ NEW: Get existing creators for filter dropdown
export async function getExistingCreators(teamId: string): Promise<string[]> {
  try {
    await requireTeamAccess(teamId, { admin: false });

    const creatorsResult = await db
      .select({
        createdBy: links.createdBy,
      })
      .from(links)
      .where(
        and(
          eq(links.teamId, teamId),
          eq(links.status, 'active')
        )
      )
      .groupBy(links.createdBy)
      .orderBy(asc(links.createdBy));

    return creatorsResult.map(row => row.createdBy);
  } catch (error) {
    console.error('Error fetching existing creators:', error);
    return [];
  }
}


export async function getLinkById(
  teamId: string,
  linkId: string
): Promise<LinkWithApplications | null> {
  try {
    await requireTeamAccess(teamId, { admin: false });

    const [link] = await db
      .select()
      .from(links)
      .where(
        and(
          eq(links.id, linkId),
          eq(links.teamId, teamId)
        )
      )
      .limit(1);

    if (!link) return null;

    // ✅ Fixed: Handle null applicationIds properly
    const applicationsData = (link.applicationIds && link.applicationIds.length > 0) ? await db
      .select({
        id: applications.id,
        applicationName: applications.applicationName,
        tla: applications.tla,
        status: applications.status,
      })
      .from(applications)
      .where(inArray(applications.id, link.applicationIds))
    : [];

    // ✅ Fixed: Return properly typed object
    return {
      ...link,
      applicationIds: link.applicationIds || [], // ✅ Handle null case
      applications: applicationsData,
    };

  } catch (error) {
    console.error('Error fetching link:', error);
    throw new Error('Failed to fetch link');
  }
}

// =============================================================================
// Application-Specific Operations
// =============================================================================

export async function getLinksByApplication(
  teamId: string,
  applicationId: string,
  page = 1,
  limit = 20
): Promise<ReturnType<typeof getLinks>> {
  return getLinks(
    teamId,
    { applicationIds: [applicationId] },
    'created-desc',
    page,
    limit
  );
}

export async function getCommonLinks(
  teamId: string,
  page = 1,
  limit = 20
): Promise<ReturnType<typeof getLinks>> {
  return getLinks(
    teamId,
    { isCommon: true },
    'created-desc',
    page,
    limit
  );
}

export async function moveLinksToApplication(
  teamId: string,
  linkIds: string[],
  applicationIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, role } = await requireTeamAccess(teamId, { admin: false });

    if (role !== 'admin') {
      return { success: false, error: 'Admin access required for bulk operations' };
    }

    if (applicationIds.length > 0) {
      const validApps = await db
        .select({ id: applications.id })
        .from(applications)
        .where(
          and(
            eq(applications.teamId, teamId),
            inArray(applications.id, applicationIds),
            eq(applications.status, 'active')
          )
        );

      if (validApps.length !== applicationIds.length) {
        return { success: false, error: 'One or more applications are invalid or inactive' };
      }
    }

    await db
      .update(links)
      .set({
        applicationIds,
        updatedBy: user.user.email,
        updatedAt: new Date(),
      })
      .where(
        and(
          inArray(links.id, linkIds),
          eq(links.teamId, teamId)
        )
      );

    revalidatePath(`/tools/teams/${teamId}/link-manager`);
    return { success: true };

  } catch (error) {
    console.error('Error moving links:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to move links' 
    };
  }
}

// =============================================================================
// Analytics and Usage Tracking
// =============================================================================

export async function recordLinkAccess(
  teamId: string,
  linkId: string,
  userAgent?: string,
  ipAddress?: string,
  referrer?: string
): Promise<{ success: boolean; redirectUrl?: string; error?: string }> {
  try {
    const { user } = await requireTeamAccess(teamId, { admin: false });

    const [link] = await db
      .select({ 
        id: links.id, 
        url: links.url, 
        status: links.status,
        accessCount: links.accessCount 
      })
      .from(links)
      .where(
        and(
          eq(links.id, linkId),
          eq(links.teamId, teamId)
        )
      )
      .limit(1);

    if (!link) {
      return { success: false, error: 'Link not found' };
    }

    if (link.status !== 'active') {
      return { success: false, error: 'Link is not active' };
    }

    await db.insert(linkAccessLog).values({
      linkId,
      teamId,
      accessedBy: user.user.email,
      userAgent: userAgent?.substring(0, 500),
      ipAddress,
      referrer: referrer?.substring(0, 500),
    });

    await db
      .update(links)
      .set({
        accessCount: (link.accessCount || 0) + 1,
        lastAccessedAt: new Date(),
      })
      .where(eq(links.id, linkId));

    return { success: true, redirectUrl: link.url };

  } catch (error) {
    console.error('Error recording link access:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to record access' 
    };
  }
}

export async function getLinkAnalytics(
  teamId: string,
  days = 30
): Promise<{
  totalLinks: number;
  totalAccesses: number;
  uniqueUsers: number;
  popularLinks: Array<{
    id: string;
    title: string;
    url: string;
    accessCount: number;
    uniqueUsers: number;
  }>;
  recentActivity: Array<{
    linkId: string;
    title: string;
    accessedBy: string;
    accessedAt: Date;
  }>;
}> {
  try {
    await requireTeamAccess(teamId, { admin: false });

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const [totalStats] = await db
      .select({
        totalLinks: count(),
        totalAccesses: sql<number>`coalesce(sum(${links.accessCount}), 0)`,
      })
      .from(links)
      .where(
        and(
          eq(links.teamId, teamId),
          eq(links.status, 'active')
        )
      );

    const [uniqueUsersResult] = await db
      .select({
        uniqueUsers: sql<number>`count(distinct ${linkAccessLog.accessedBy})`,
      })
      .from(linkAccessLog)
      .where(
        and(
          eq(linkAccessLog.teamId, teamId),
          gte(linkAccessLog.accessedAt, dateFrom)
        )
      );

    const popularLinks = await db
      .select({
        id: links.id,
        title: links.title,
        url: links.url,
        accessCount: links.accessCount,
        uniqueUsers: sql<number>`count(distinct ${linkAccessLog.accessedBy})`,
      })
      .from(links)
      .leftJoin(linkAccessLog, 
        and(
          eq(links.id, linkAccessLog.linkId),
          gte(linkAccessLog.accessedAt, dateFrom)
        )
      )
      .where(
        and(
          eq(links.teamId, teamId),
          eq(links.status, 'active')
        )
      )
      .groupBy(links.id, links.title, links.url, links.accessCount)
      .orderBy(desc(links.accessCount))
      .limit(10);

    // ✅ Fixed: Handle null title in recent activity
    const recentActivityRaw = await db
      .select({
        linkId: linkAccessLog.linkId,
        title: links.title,
        accessedBy: linkAccessLog.accessedBy,
        accessedAt: linkAccessLog.accessedAt,
      })
      .from(linkAccessLog)
      .leftJoin(links, eq(linkAccessLog.linkId, links.id))
      .where(
        and(
          eq(linkAccessLog.teamId, teamId),
          gte(linkAccessLog.accessedAt, dateFrom)
        )
      )
      .orderBy(desc(linkAccessLog.accessedAt))
      .limit(20);

    // ✅ Fixed: Filter out null titles and ensure proper typing
    const recentActivity = recentActivityRaw
      .filter(activity => activity.title !== null)
      .map(activity => ({
        linkId: activity.linkId,
        title: activity.title!,
        accessedBy: activity.accessedBy,
        accessedAt: activity.accessedAt,
      }));

    return {
      totalLinks: totalStats.totalLinks,
      totalAccesses: Number(totalStats.totalAccesses),
      uniqueUsers: uniqueUsersResult.uniqueUsers,
      popularLinks: popularLinks.map(link => ({
        ...link,
        accessCount: link.accessCount || 0,
      })),
      recentActivity,
    };

  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw new Error('Failed to fetch analytics');
  }
}

export async function getTeamApplications(
  teamId: string
): Promise<Array<{
  id: string;
  applicationName: string;
  tla: string;
  status: string;
}>> {
  try {
    await requireTeamAccess(teamId, { admin: false }  );

    const apps = await db
      .select({
        id: applications.id,
        applicationName: applications.applicationName,
        tla: applications.tla,
        status: applications.status,
      })
      .from(applications)
      .where(eq(applications.teamId, teamId));
    
    return apps;
  } catch (error) {
    console.error('Error fetching team applications:', error);
    throw new Error('Failed to fetch team applications');
  }
}


export async function bulkDeleteLinks(
  teamId: string,
  linkIds: string[]
): Promise<{
  success: boolean;
  deletedCount?: number;
  error?: string;
}> {
  try {
    const { user, role } = await requireTeamAccess(teamId, { admin: false });
    const userEmail = user.user.email;
    
    if (!linkIds || linkIds.length === 0) {
      return { success: false, error: 'No links provided for deletion' };
    }

    // Verify all links belong to the team and get current data
    const linksToDelete = await db
      .select({
        id: links.id,
        title: links.title,
        createdBy: links.createdBy
      })
      .from(links)
      .where(
        and(
          eq(links.teamId, teamId),
          inArray(links.id, linkIds)
        )
      );

    if (linksToDelete.length === 0) {
      return { success: false, error: 'No valid links found for deletion' };
    }

    // ✅ Permission check: Only admins can delete any links, users can only delete their own
    if (role !== 'admin') {
      const unauthorizedLinks = linksToDelete.filter(link => link.createdBy !== userEmail);
      if (unauthorizedLinks.length > 0) {
        return { 
          success: false, 
          error: `You can only delete links you created. ${unauthorizedLinks.length} link(s) belong to other users.` 
        };
      }
    }

    // Perform the deletion
    await db
      .delete(links)
      .where(
        and(
          eq(links.teamId, teamId),
          inArray(links.id, linkIds)
        )
      );

    revalidatePath(`/tools/teams/${teamId}/link-manager`);

    return {
      success: true,
      deletedCount: linksToDelete.length
    };

  } catch (error) {
    console.error('Error in bulk delete:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete links'
    };
  }
}

export async function toggleLinkPin(
  teamId: string,
  linkId: string,
  isPinned: boolean
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { user, role } = await requireTeamAccess(teamId, { admin: false });
    const userEmail = user.user.email;
    
    // Verify the link exists and belongs to the team
    const existingLink = await db
      .select({
        id: links.id,
        createdBy: links.createdBy,
        isPinned: links.isPinned
      })
      .from(links)
      .where(
        and(
          eq(links.id, linkId),
          eq(links.teamId, teamId)
        )
      )
      .limit(1);

    if (existingLink.length === 0) {
      return { success: false, error: 'Link not found' };
    }

    // ✅ Permission check: Only admins or the creator can pin/unpin
    if (role !== 'admin' && existingLink[0].createdBy !== userEmail) {
      return { 
        success: false, 
        error: 'You can only pin/unpin links you created' 
      };
    }

    // Update the pin status
    await db
      .update(links)
      .set({
        isPinned,
        updatedBy: userEmail,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(links.id, linkId),
          eq(links.teamId, teamId)
        )
      );

    revalidatePath(`/tools/teams/${teamId}/link-manager`);

    return { success: true };

  } catch (error) {
    console.error('Error toggling link pin:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update pin status'
    };
  }
}


export async function getLinkCounts(
  teamId: string
): Promise<{
  all: number;
  pinned: number;
  private: number;
  team: number;
  archived: number;
  broken: number;
  [key: string]: number; // For application-specific counts like 'app-{id}'
}> {
  try {
    const { user, role } = await requireTeamAccess(teamId, { admin: false });
    const userEmail = user.user.email;

    // Base visibility condition for non-admin users
    const getVisibilityCondition = () => {
      if (role === 'admin') {
        return undefined; // Admins can see all links
      }
      return or(
        eq(links.isPublic, true),           // Public links
        eq(links.createdBy, userEmail)     // User's own links
      )!;
    };

    const baseConditions = [eq(links.teamId, teamId)];
    const visibilityCondition = getVisibilityCondition();
    if (visibilityCondition) {
      baseConditions.push(visibilityCondition);
    }

    // ✅ Count all active links (visible to user)
    const [allCount] = await db
      .select({ count: count() })
      .from(links)
      .where(and(
        ...baseConditions,
        eq(links.status, 'active')
      ));

    // ✅ Count pinned links
    const [pinnedCount] = await db
      .select({ count: count() })
      .from(links)
      .where(and(
        ...baseConditions,
        eq(links.status, 'active'),
        eq(links.isPinned, true)
      ));

    // ✅ Count private links (user's own private links)
    const [privateCount] = await db
      .select({ count: count() })
      .from(links)
      .where(and(
        eq(links.teamId, teamId),
        eq(links.status, 'active'),
        eq(links.isPublic, false),
        eq(links.createdBy, userEmail)
      ));

    // ✅ Count team links (public links only)
    const [teamCount] = await db
      .select({ count: count() })
      .from(links)
      .where(and(
        eq(links.teamId, teamId),
        eq(links.status, 'active'),
        eq(links.isPublic, true)
      ));

    // ✅ Count archived links
    const [archivedCount] = await db
      .select({ count: count() })
      .from(links)
      .where(and(
        ...baseConditions,
        eq(links.status, 'archived')
      ));

    // ✅ Count broken links
    const [brokenCount] = await db
      .select({ count: count() })
      .from(links)
      .where(and(
        ...baseConditions,
        eq(links.status, 'broken')
      ));

    // ✅ Get application-specific counts
    const applicationCounts: Record<string, number> = {};
    
    // Get all applications for this team
    const teamApplications = await db
      .select({ id: applications.id })
      .from(applications)
      .where(
        and(
          eq(applications.teamId, teamId),
          eq(applications.status, 'active')
        )
      );

    // Count links for each application
    for (const app of teamApplications) {
      const conditions = [...baseConditions, eq(links.status, 'active')];
      conditions.push(
        sql`${links.applicationIds} && ${sql.raw(`'{${app.id}}'::uuid[]`)}`
      );

      const [appCount] = await db
        .select({ count: count() })
        .from(links)
        .where(and(...conditions));

      applicationCounts[`app-${app.id}`] = appCount.count;
    }

    return {
      all: allCount.count,
      pinned: pinnedCount.count,
      private: privateCount.count,
      team: teamCount.count,
      archived: archivedCount.count,
      broken: brokenCount.count,
      ...applicationCounts
    };

  } catch (error) {
    console.error('Error getting link counts:', error);
    // Return zero counts on error
    return {
      all: 0,
      pinned: 0,
      private: 0,
      team: 0,
      archived: 0,
      broken: 0
    };
  }
}