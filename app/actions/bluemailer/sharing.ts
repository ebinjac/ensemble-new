'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { 
  templateSharing, 
  emailTemplates, 
} from '@/db/schema/bluemailer';
import { teams } from '@/db/schema/teams';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { eq, and, ne } from 'drizzle-orm';

export async function shareTemplate(
  teamId: string,
  templateId: string,
  targetTeamId: string,
  canEdit: boolean = false,
  canDuplicate: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await requireTeamAccess(teamId);

    // Verify template ownership
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.id, templateId),
        eq(emailTemplates.teamId, teamId)
      ));

    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    // Check if already shared
    const [existingShare] = await db
      .select()
      .from(templateSharing)
      .where(and(
        eq(templateSharing.templateId, templateId),
        eq(templateSharing.sharedWithTeamId, targetTeamId)
      ));

    if (existingShare) {
      // Update existing share
      await db
        .update(templateSharing)
        .set({
          canEdit,
          canDuplicate,
          sharedBy: user.user.email,
          sharedAt: new Date(),
        })
        .where(eq(templateSharing.id, existingShare.id));
    } else {
      // Create new share
      await db.insert(templateSharing).values({
        templateId,
        sharedWithTeamId: targetTeamId,
        canEdit,
        canDuplicate,
        sharedBy: user.user.email,
      });
    }

    revalidatePath(`/tools/teams/${teamId}/bluemailer`);
    return { success: true };

  } catch (error) {
    console.error('Share template error:', error);
    return { success: false, error: 'Failed to share template' };
  }
}

export async function getAvailableTeams(currentTeamId: string) {
  try {
    const { user } = await requireTeamAccess(currentTeamId);

    // Get all teams the user has access to (excluding current team)
    const userTeams = user.teams
      .filter(team => team.teamId !== currentTeamId)
      .map(team => ({
        id: team.teamId,
        name: team.teamName,
      }));

    return userTeams;

  } catch (error) {
    console.error('Get available teams error:', error);
    throw new Error('Failed to fetch available teams');
  }
}

export async function getSharedTemplates(teamId: string) {
  try {
    const { user } = await requireTeamAccess(teamId);

    const sharedTemplates = await db
      .select({
        id: emailTemplates.id,
        name: emailTemplates.name,
        description: emailTemplates.description,
        category: emailTemplates.category,
        status: emailTemplates.status,
        thumbnailUrl: emailTemplates.thumbnailUrl,
        usageCount: emailTemplates.usageCount,
        createdAt: emailTemplates.createdAt,
        ownerTeamName: teams.teamName,
        canEdit: templateSharing.canEdit,
        canDuplicate: templateSharing.canDuplicate,
        sharedBy: templateSharing.sharedBy,
        sharedAt: templateSharing.sharedAt,
      })
      .from(templateSharing)
      .innerJoin(emailTemplates, eq(templateSharing.templateId, emailTemplates.id))
      .innerJoin(teams, eq(emailTemplates.teamId, teams.id))
      .where(eq(templateSharing.sharedWithTeamId, teamId))
      .orderBy(templateSharing.sharedAt);

    return sharedTemplates;

  } catch (error) {
    console.error('Get shared templates error:', error);
    throw new Error('Failed to fetch shared templates');
  }
}
