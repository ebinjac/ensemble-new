'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { emailTemplates, emailTemplateComponents } from '@/db/schema/bluemailer';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { eq, and, or, sql, desc, asc, like } from 'drizzle-orm';

export interface TemplateFilters {
  category?: string;
  search?: string;
  sort?: string;
}

export async function getTeamTemplates(
  teamId: string,
  filters?: TemplateFilters
) {
  try {
    await requireTeamAccess(teamId);

    let query = db
      .select({
        id: emailTemplates.id,
        name: emailTemplates.name,
        description: emailTemplates.description,
        category: emailTemplates.category,
        thumbnailUrl: emailTemplates.thumbnailUrl,
        usageCount: emailTemplates.usageCount,
        isFavorite: emailTemplates.isFavorite,
        createdAt: emailTemplates.createdAt,
        updatedAt: emailTemplates.updatedAt,
        createdBy: emailTemplates.createdBy,
        componentCount: sql<number>`(
          SELECT COUNT(*) FROM ${emailTemplateComponents} 
          WHERE ${emailTemplateComponents.templateId} = ${emailTemplates.id}
        )`.as('componentCount'),
      })
      .from(emailTemplates)
      .where(eq(emailTemplates.teamId, teamId));

    // Apply filters
    if (filters?.category && filters.category !== 'all') {
      query = query.where(
        and(
          eq(emailTemplates.teamId, teamId),
          eq(emailTemplates.category, filters.category)
        )
      );
    }

    if (filters?.search) {
      query = query.where(
        and(
          eq(emailTemplates.teamId, teamId),
          or(
            like(emailTemplates.name, `%${filters.search}%`),
            like(emailTemplates.description, `%${filters.search}%`)
          )
        )
      );
    }

    // Apply sorting
    switch (filters?.sort) {
      case 'name':
        query = query.orderBy(asc(emailTemplates.name));
        break;
      case 'name-desc':
        query = query.orderBy(desc(emailTemplates.name));
        break;
      case 'usage':
        query = query.orderBy(desc(emailTemplates.usageCount));
        break;
      case 'created':
        query = query.orderBy(desc(emailTemplates.createdAt));
        break;
      case 'recent':
      default:
        query = query.orderBy(desc(emailTemplates.updatedAt));
        break;
    }

    const templates = await query;
    return templates;

  } catch (error) {
    console.error('Get team templates error:', error);
    throw new Error('Failed to fetch templates');
  }
}

export async function deleteTemplate(
  teamId: string,
  templateId: string
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

    // Delete template (components will be deleted due to cascade)
    await db
      .delete(emailTemplates)
      .where(eq(emailTemplates.id, templateId));

    revalidatePath(`/tools/teams/${teamId}/bluemailer/templates`);
    return { success: true };

  } catch (error) {
    console.error('Delete template error:', error);
    return { success: false, error: 'Failed to delete template' };
  }
}

export async function duplicateTemplate(
  teamId: string,
  templateId: string
): Promise<{ success: boolean; templateId?: string; error?: string }> {
  try {
    const { user } = await requireTeamAccess(teamId);

    // Get original template
    const [originalTemplate] = await db
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.id, templateId),
        eq(emailTemplates.teamId, teamId)
      ));

    if (!originalTemplate) {
      return { success: false, error: 'Template not found' };
    }

    // Get original components
    const components = await db
      .select()
      .from(emailTemplateComponents)
      .where(eq(emailTemplateComponents.templateId, templateId))
      .orderBy(emailTemplateComponents.sortOrder);

    // Create duplicate template
    const [newTemplate] = await db
      .insert(emailTemplates)
      .values({
        teamId: teamId,
        name: `${originalTemplate.name} (Copy)`,
        description: originalTemplate.description,
        category: originalTemplate.category,
        canvasSettings: originalTemplate.canvasSettings,
        thumbnailUrl: originalTemplate.thumbnailUrl,
        createdBy: user.user.email,
        updatedBy: user.user.email,
      })
      .returning();

    // Duplicate components
    if (components.length > 0) {
      const componentInserts = components.map(component => ({
        templateId: newTemplate.id,
        componentId: component.componentId,
        type: component.type,
        componentData: component.componentData,
        sortOrder: component.sortOrder,
        parentComponentId: component.parentComponentId,
      }));

      await db.insert(emailTemplateComponents).values(componentInserts);
    }

    revalidatePath(`/tools/teams/${teamId}/bluemailer/templates`);
    return { success: true, templateId: newTemplate.id };

  } catch (error) {
    console.error('Duplicate template error:', error);
    return { success: false, error: 'Failed to duplicate template' };
  }
}

export async function toggleTemplateFavorite(
  teamId: string,
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await requireTeamAccess(teamId);

    // Get current template
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

    // Toggle favorite status
    await db
      .update(emailTemplates)
      .set({
        isFavorite: !template.isFavorite,
        updatedBy: user.user.email,
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.id, templateId));

    revalidatePath(`/tools/teams/${teamId}/bluemailer/templates`);
    return { success: true };

  } catch (error) {
    console.error('Toggle favorite error:', error);
    return { success: false, error: 'Failed to update favorite status' };
  }
}
