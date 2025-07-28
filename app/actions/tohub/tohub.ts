// app/tools/teams/[teamId]/tohub/actions/turnover-actions.ts
'use server'

import { db } from '@/db'                             // drizzle db instance
import {
  subApplications,
  turnoverSessions,
  turnoverEntries,
  turnoverSnapshots,
  entryAttachments,
  sectionType,
  entryStatus,
  flagType,
  turnoverComments,
} from '@/db/schema/tohub'
import { eq, and, inArray, sql, asc, desc } from 'drizzle-orm'
import { applications } from '@/db/schema/teams'; 
import {
  requireAuth,
  requireTeamAccess,
} from '@/app/(auth)/lib/auth'

/* ------------------------------------------------------------------ */
/*  SUB-APPLICATIONS                                                  */
/* ------------------------------------------------------------------ */

export async function getApplicationsWithSubApps(teamId: string) {
  // 1) get the team’s applications
  const apps = await db
    .select({
      id: applications.id,
      applicationName: applications.applicationName,
    })
    .from(applications)
    .where(eq(applications.teamId, teamId))
    .orderBy(asc(applications.applicationName));

  // 2) for each application fetch its sub-apps in one round-trip
  const appIds = apps.map(a => a.id);
  const subApps = await db
    .select({
      id: subApplications.id,
      applicationId: subApplications.applicationId,
      name: subApplications.name,
    })
    .from(subApplications)
    .where(
      and(
        inArray(subApplications.applicationId, appIds),
        eq(subApplications.isActive, true),
      ),
    )
    .orderBy(asc(subApplications.displayOrder), asc(subApplications.name));

  // 3) stitch them together
  const byApp: Record<string, typeof subApps> = {};
  for (const sa of subApps) {
    (byApp[sa.applicationId] ??= []).push(sa);
  }

  return apps.map(app => ({
    ...app,
    subApplications: byApp[app.id] ?? [],
  }));
}

export async function listSubApps(applicationId: string) {
  // anyone with team access may view
  return db
    .select()
    .from(subApplications)
    .where(and(eq(subApplications.applicationId, applicationId), eq(subApplications.isActive, true)))
    .orderBy(subApplications.displayOrder, subApplications.name)
}

export async function createSubApp(
  teamId: string,
  applicationId: string,
  data: { name: string; description?: string },
) {
  const { user, role } = await requireTeamAccess(teamId, {admin: true})
  if (role !== 'admin') throw new Error('Admin rights required')

  const [row] = await db
    .insert(subApplications)
    .values({
      applicationId,
      name: data.name.trim(),
      description: data.description,
      createdBy: user.user.email,
    })
    .returning()
  return row
}

export async function deactivateSubApp(teamId: string, subAppId: string) {
  const { user, role } = await requireTeamAccess(teamId, {admin: true})
  if (role !== 'admin') throw new Error('Admin rights required')

  await db
    .update(subApplications)
    .set({
      isActive: false,
      updatedBy: user.user.email,
      updatedAt: new Date(),
    })
    .where(eq(subApplications.id, subAppId))
}

/* ------------------------------------------------------------------ */
/*  TURNOVER SESSIONS                                                 */
/* ------------------------------------------------------------------ */

export async function getOrCreateCurrentSession(
  teamId: string,
  applicationId: string,
  data: { handoverFrom: string; handoverTo: string },
) {
  const { user } = await requireTeamAccess(teamId, {admin: false})

  // If a “current” session already exists, return it
  const [existing] = await db
    .select()
    .from(turnoverSessions)
    .where(
      and(
        eq(turnoverSessions.teamId, teamId),
        eq(turnoverSessions.applicationId, applicationId),
        eq(turnoverSessions.isCurrent, true),
      ),
    )
    .limit(1)

  if (existing) return existing

  // Otherwise create a new one for today
  const [row] = await db
    .insert(turnoverSessions)
    .values({
      teamId,
      applicationId,
      handoverFrom: data.handoverFrom,
      handoverTo: data.handoverTo,
      sessionDate: new Date(), // today
      createdBy: user.user.email,
      updatedBy: user.user.email,
    })
    .returning()
  return row
}

export async function updateSessionHandover(
  sessionId: string,
  data: { handoverFrom?: string; handoverTo?: string },
) {
  const { user } = await requireAuth()

  await db
    .update(turnoverSessions)
    .set({
      ...(data.handoverFrom && { handoverFrom: data.handoverFrom }),
      ...(data.handoverTo && { handoverTo: data.handoverTo }),
      updatedBy: user.email,
      updatedAt: new Date(),
    })
    .where(eq(turnoverSessions.id, sessionId))
}

/* ------------------------------------------------------------------ */
/*  SUB-APP SELECTION FOR A SESSION                                   */
/* ------------------------------------------------------------------ */

export async function updateSelectedSubApps(
  sessionId: string,
  selected: string[],
) {
  const { user } = await requireAuth()

  await db
    .update(turnoverSessions)
    .set({
      selectedSubApps: selected,
      updatedBy: user.email,
      updatedAt: new Date(),
    })
    .where(eq(turnoverSessions.id, sessionId))
}

/* ------------------------------------------------------------------ */
/*  TURNOVER ENTRIES (RFC / INC / ALERTS / MIM / EMAIL_SLACK / FYI)   */
/* ------------------------------------------------------------------ */

export async function addEntry(
  sessionId: string,
  input: {
    subApplicationId?: string | null
    section: typeof sectionType.$type
    title?: string
    description?: string
    comments?: string
    status?: typeof entryStatus.$type
    sectionData?: unknown
    isImportant?: boolean
  },
) {
  const { user } = await requireAuth()
  const [row] = await db
    .insert(turnoverEntries)
    .values({
      sessionId,
      subApplicationId: input.subApplicationId || null,
      sectionType: input.section,
      title: input.title,
      description: input.description,
      comments: input.comments,
      status: input.status ?? 'open',
      sectionData: input.sectionData ?? {},
      isImportant: input.isImportant ?? false,
      createdBy: user.email,
      updatedBy: user.email,
    })
    .returning()
  return row
}

export async function updateEntry(
  entryId: string,
  patch: Partial<{
    title: string;
    description: string;
    comments: string;
    status: typeof entryStatus.$type;
    sectionData: unknown;
    isImportant: boolean;
  }>
) {
  const { user } = await requireAuth();

  const [updatedEntry] = await db
    .update(turnoverEntries)
    .set({
      ...patch,
      updatedBy: user.email,
      updatedAt: new Date(),
    })
    .where(eq(turnoverEntries.id, entryId))
    .returning();

  return updatedEntry;
}

export async function deleteEntry(entryId: string) {
  const { user } = await requireAuth()
  // Hard delete is acceptable here; if you prefer soft-delete add an `isActive` column
  await db
    .delete(turnoverEntries)
    .where(eq(turnoverEntries.id, entryId))
    .execute()
}

/* ------------------------------------------------------------------ */
/*  FLAGGING / UNFLAGGING                                             */
/* ------------------------------------------------------------------ */

export async function flagEntry(
  entryId: string,
  data: { flag: typeof flagType.$type; reason?: string },
) {
  const { user } = await requireAuth()

  await db
    .update(turnoverEntries)
    .set({
      isFlagged: true,
      flagType: data.flag,
      flagReason: data.reason,
      flaggedAt: new Date(),
      flaggedBy: user.email,
      updatedBy: user.email,
      updatedAt: new Date(),
    })
    .where(eq(turnoverEntries.id, entryId))
}

export async function clearFlag(entryId: string) {
  const { user } = await requireAuth()

  await db
    .update(turnoverEntries)
    .set({
      isFlagged: false,
      flagType: null,
      flagReason: null,
      flaggedAt: null,
      flaggedBy: null,
      updatedBy: user.email,
      updatedAt: new Date(),
    })
    .where(eq(turnoverEntries.id, entryId))
}

/* ------------------------------------------------------------------ */
/*  ATTACHMENTS (MIM / SLACK / LINKS)                                 */
/* ------------------------------------------------------------------ */

export async function addAttachment(
  entryId: string,
  attachment: {
    type: string // 'link' | 'mim' | 'slack' | 'email'
    title?: string
    url: string
    description?: string
  },
) {
  const { user } = await requireAuth()
  const [row] = await db
    .insert(entryAttachments)
    .values({
      entryId,
      attachmentType: attachment.type,
      title: attachment.title,
      url: attachment.url,
      description: attachment.description,
      createdBy: user.email,
    })
    .returning()
  return row
}

export async function deleteAttachment(attachmentId: string) {
  await db.delete(entryAttachments).where(eq(entryAttachments.id, attachmentId))
}

/* ------------------------------------------------------------------ */
/*  DAILY SNAPSHOT (called by cron or Edge Scheduler)                 */
/* ------------------------------------------------------------------ */

export async function createDailySnapshot(sessionId: string) {
  const { user } = await requireAuth()

  // fetch session + entries
  const [session] = await db
    .select()
    .from(turnoverSessions)
    .where(eq(turnoverSessions.id, sessionId))
  if (!session) throw new Error('Session not found')

  const entries = await db
    .select()
    .from(turnoverEntries)
    .where(eq(turnoverEntries.sessionId, sessionId))

  await db.insert(turnoverSnapshots).values({
    sessionId,
    snapshotDate: new Date(),
    sessionData: session,
    entriesData: entries,
    totalEntries: entries.length,
    flaggedEntries: entries.filter(e => e.isFlagged).length,
    completedEntries: entries.filter(e => e.status === 'resolved' || e.status === 'closed').length,
    createdBy: user.email,
  })
}

/* ------------------------------------------------------------------ */
/*  HOUSEKEEPING: AUTO-FLAG STALE ITEMS (run via background job)      */
/* ------------------------------------------------------------------ */

export async function autoFlagStaleEntries() {
  const cutoff24 = sql`NOW() - INTERVAL '24 hours'`
  const cutoff72 = sql`NOW() - INTERVAL '72 hours'`

  // 1. Needs-update flags (>24 h since last update)
  await db
    .update(turnoverEntries)
    .set({
      isFlagged: true,
      flagType: 'needs_update',
    })
    .where(
      and(
        eq(turnoverEntries.isFlagged, false),
        sql`${turnoverEntries.updatedAt} < ${cutoff24}`,
      ),
    )

  // 2. Long-pending flags (>72 h open/pending)
  await db
    .update(turnoverEntries)
    .set({
      isFlagged: true,
      flagType: 'long_pending',
    })
    .where(
      and(
        inArray(turnoverEntries.status, ['open', 'pending']),
        sql`${turnoverEntries.createdAt} < ${cutoff72}`,
      ),
    )
}

export async function fetchSectionEntries(sessionId: string, section: typeof sectionType.$type) {
  const { user } = await requireAuth()
  
  return db
    .select()
    .from(turnoverEntries)
    .where(
      and(
        eq(turnoverEntries.sessionId, sessionId),
        eq(turnoverEntries.sectionType, section)
      )
    )
    .orderBy(turnoverEntries.createdAt)
}

export async function updateSubApplication(
  teamId: string,
  subAppId: string,
  data: { name: string; description?: string; displayOrder?: number }
) {
  const { user, role } = await requireTeamAccess(teamId, {admin: true});
  if (role !== 'admin') throw new Error('Admin rights required');

  const [updatedSubApp] = await db
    .update(subApplications)
    .set({
      name: data.name.trim(),
      description: data.description,
      displayOrder: data.displayOrder || 0,
      updatedBy: user.user.email,
      updatedAt: new Date(),
    })
    .where(eq(subApplications.id, subAppId))
    .returning();

  return updatedSubApp;
}

export async function deleteSubApplication(teamId: string, subAppId: string) {
  const { user, role } = await requireTeamAccess(teamId, {admin: true});
  if (role !== 'admin') throw new Error('Admin rights required');

  // Check if sub-application is in use
  const entriesUsingSubApp = await db
    .select({ count: sql<number>`count(*)` })
    .from(turnoverEntries)
    .where(eq(turnoverEntries.subApplicationId, subAppId));

  if (entriesUsingSubApp[0]?.count > 0) {
    // Soft delete - just deactivate
    await db
      .update(subApplications)
      .set({
        isActive: false,
        updatedBy: user.user.email,
        updatedAt: new Date(),
      })
      .where(eq(subApplications.id, subAppId));
    
    return { deleted: false, deactivated: true };
  } else {
    // Hard delete if no entries use it
    await db
      .delete(subApplications)
      .where(eq(subApplications.id, subAppId));
    
    return { deleted: true, deactivated: false };
  }
}

export async function reorderSubApplications(
  teamId: string,
  applicationId: string,
  subAppIds: string[]
) {
  const { user, role } = await requireTeamAccess(teamId, {admin: true});
  if (role !== 'admin') throw new Error('Admin rights required');

  // Update display order for each sub-application
  const updates = subAppIds.map((subAppId, index) =>
    db
      .update(subApplications)
      .set({
        displayOrder: index,
        updatedBy: user.user.email,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(subApplications.id, subAppId),
          eq(subApplications.applicationId, applicationId)
        )
      )
  );

  await Promise.all(updates);
}

export async function getApplicationsWithSubAppsForAdmin(teamId: string) {
  const { user, role } = await requireTeamAccess(teamId, {admin: true});
  if (role !== 'admin') throw new Error('Admin rights required');

  // Get applications with all sub-apps (including inactive)
  const apps = await db
    .select({
      id: applications.id,
      applicationName: applications.applicationName,
      description: applications.description,
    })
    .from(applications)
    .where(eq(applications.teamId, teamId))
    .orderBy(asc(applications.applicationName));

  // Get all sub-applications (including inactive for admin view)
  const allSubApps = await db
    .select()
    .from(subApplications)
    .where(inArray(subApplications.applicationId, apps.map(a => a.id)))
    .orderBy(asc(subApplications.displayOrder), asc(subApplications.name));

  // Group sub-apps by application
  const subAppsByApp: Record<string, typeof allSubApps> = {};
  for (const subApp of allSubApps) {
    (subAppsByApp[subApp.applicationId] ??= []).push(subApp);
  }

  return apps.map(app => ({
    ...app,
    subApplications: subAppsByApp[app.id] ?? [],
  }));
}

export async function fetchTurnoverSession(teamId: string, applicationId: string) {
  const { user } = await requireAuth();
  
  // Get or create current session
  let [session] = await db
    .select()
    .from(turnoverSessions)
    .where(
      and(
        eq(turnoverSessions.teamId, teamId),
        eq(turnoverSessions.applicationId, applicationId),
        eq(turnoverSessions.isCurrent, true)
      )
    )
    .limit(1);

  if (!session) {
    // Create new session if none exists
    [session] = await db
      .insert(turnoverSessions)
      .values({
        teamId,
        applicationId,
        handoverFrom: user.email || 'Unknown',
        handoverTo: 'TBD',
        sessionDate: new Date().toISOString().split('T')[0],
        isCurrent: true,
        createdBy: user.email || 'system',
        updatedBy: user.email || 'system',
      })
      .returning();
  }

  return session;
}

export async function fetchSubApplications(teamId: string, applicationId: string) {
  const { user } = await requireAuth();
  
  const subApps = await db
    .select()
    .from(subApplications)
    .where(
      and(
        eq(subApplications.applicationId, applicationId),
        eq(subApplications.isActive, true)
      )
    )
    .orderBy(asc(subApplications.displayOrder), asc(subApplications.name));

  return subApps;
}

export async function fetchApplicationsForTeam(teamId: string) {
  const { user } = await requireAuth();
  
  const apps = await db
    .select()
    .from(applications)
    .where(eq(applications.teamId, teamId))
    .orderBy(asc(applications.applicationName));

  return apps;
}

export async function fetchCurrentSession(teamId: string, applicationId: string) {
  const { user } = await requireAuth();
  
  // Get or create current session
  let [session] = await db
    .select()
    .from(turnoverSessions)
    .where(
      and(
        eq(turnoverSessions.teamId, teamId),
        eq(turnoverSessions.applicationId, applicationId),
        eq(turnoverSessions.isCurrent, true)
      )
    )
    .limit(1);

  if (!session) {
    // Create new session if none exists
    [session] = await db
      .insert(turnoverSessions)
      .values({
        teamId,
        applicationId,
        handoverFrom: user.email || 'Unknown',
        handoverTo: 'TBD',
        sessionDate: new Date().toISOString().split('T')[0],
        isCurrent: true,
        createdBy: user.email || 'system',
        updatedBy: user.email || 'system',
      })
      .returning();
  }

  return session;
}

export async function fetchSubApplicationsByTeam(teamId: string, applicationId: string) {
  const { user } = await requireAuth();
  
  const subApps = await db
    .select()
    .from(subApplications)
    .where(
      and(
        eq(subApplications.applicationId, applicationId),
        eq(subApplications.isActive, true)
      )
    )
    .orderBy(asc(subApplications.displayOrder), asc(subApplications.name));

  return subApps;
}

export async function fetchEntryCounts(teamId: string, applicationId: string) {
  const { user } = await requireAuth();
  
  try {
    // Get current session
    const [session] = await db
      .select()
      .from(turnoverSessions)
      .where(
        and(
          eq(turnoverSessions.teamId, teamId),
          eq(turnoverSessions.applicationId, applicationId),
          eq(turnoverSessions.isCurrent, true)
        )
      )
      .limit(1);

    if (!session) {
      return {};
    }

    // Count entries by section
    const counts = await db
      .select({
        section: turnoverEntries.sectionType,
        count: sql<number>`count(*)`,
      })
      .from(turnoverEntries)
      .where(eq(turnoverEntries.sessionId, session.id))
      .groupBy(turnoverEntries.sectionType);

    // Convert to object format
    const countsObj: Record<string, number> = {};
    counts.forEach(({ section, count }) => {
      countsObj[section] = count;
    });

    return countsObj;
  } catch (error) {
    console.error('Error fetching entry counts:', error);
    return {};
  }
}

