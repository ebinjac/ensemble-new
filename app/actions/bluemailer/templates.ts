'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { 
  emailTemplates, 
  emailTemplateComponents, 
  templateApplicationTags,
  templateUsageHistory, 
} from '@/db/schema/bluemailer';
import { applications } from '@/db/schema/teams';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { 
  NewEmailTemplate, 
  NewEmailTemplateComponent,
  EmailTemplate,
  TemplateStatus,
  TemplateVisibility,
  TemplateCategory 
} from '@/db/schema/bluemailer';

export interface CreateTemplateData {
  name: string;
  description?: string;
  category: TemplateCategory;
  visibility: TemplateVisibility;
  canvasSettings: any;
  components: any[];
  applicationIds?: string[];
}

export async function createTemplate(
  teamId: string, 
  data: CreateTemplateData
): Promise<{ success: boolean; templateId?: string; error?: string }> {
  try {
    const { user } = await requireTeamAccess(teamId);

    // Create the template
    const [template] = await db.insert(emailTemplates).values({
      name: data.name,
      description: data.description,
      category: data.category,
      teamId: teamId,
      canvasSettings: data.canvasSettings,
      status: 'draft',
      visibility: data.visibility,
      createdBy: user.user.email,
      updatedBy: user.user.email,
    }).returning();

    // Add components if provided
    if (data.components && data.components.length > 0) {
      const componentInserts = data.components.map((comp, index) => ({
        templateId: template.id,
        componentId: comp.id,
        type: comp.type,
        componentData: comp,
        sortOrder: index,
      }));

      await db.insert(emailTemplateComponents).values(componentInserts);
    }

    // Tag to applications if provided
    if (data.applicationIds && data.applicationIds.length > 0) {
      const tagInserts = data.applicationIds.map((appId, index) => ({
        templateId: template.id,
        applicationId: appId,
        isPrimary: index === 0,
        createdBy: user.user.email,
      }));

      await db.insert(templateApplicationTags).values(tagInserts);
    }

    // Log usage
    await db.insert(templateUsageHistory).values({
      templateId: template.id,
      usedBy: user.user.email,
      teamId: teamId,
      action: 'created',
    });

    revalidatePath(`/tools/teams/${teamId}/bluemailer`);
    return { success: true, templateId: template.id };

  } catch (error) {
    console.error('Create template error:', error);
    return { success: false, error: 'Failed to create template' };
  }
}

export async function updateTemplate(
  teamId: string,
  templateId: string,
  data: Partial<CreateTemplateData>
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

    // Update template
    await db
      .update(emailTemplates)
      .set({
        ...data,
        updatedBy: user.user.email,
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.id, templateId));

    // Update components if provided
    if (data.components) {
      // Delete existing components
      await db
        .delete(emailTemplateComponents)
        .where(eq(emailTemplateComponents.templateId, templateId));

      // Insert new components
      if (data.components.length > 0) {
        const componentInserts = data.components.map((comp, index) => ({
          templateId: templateId,
          componentId: comp.id,
          type: comp.type,
          componentData: comp,
          sortOrder: index,
        }));

        await db.insert(emailTemplateComponents).values(componentInserts);
      }
    }

    // Update application tags if provided
    if (data.applicationIds !== undefined) {
      // Delete existing tags
      await db
        .delete(templateApplicationTags)
        .where(eq(templateApplicationTags.templateId, templateId));

      // Insert new tags
      if (data.applicationIds.length > 0) {
        const tagInserts = data.applicationIds.map((appId, index) => ({
          templateId: templateId,
          applicationId: appId,
          isPrimary: index === 0,
          createdBy: user.user.email,
        }));

        await db.insert(templateApplicationTags).values(tagInserts);
      }
    }

    // Log usage
    await db.insert(templateUsageHistory).values({
      templateId: templateId,
      usedBy: user.user.email,
      teamId: teamId,
      action: 'updated',
    });

    revalidatePath(`/tools/teams/${teamId}/bluemailer`);
    revalidatePath(`/tools/teams/${teamId}/bluemailer/${templateId}`);
    return { success: true };

  } catch (error) {
    console.error('Update template error:', error);
    return { success: false, error: 'Failed to update template' };
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

    // Delete template (cascading will handle components and tags)
    await db
      .delete(emailTemplates)
      .where(eq(emailTemplates.id, templateId));

    // Log usage
    await db.insert(templateUsageHistory).values({
      templateId: templateId,
      usedBy: user.user.email,
      teamId: teamId,
      action: 'deleted',
    });

    revalidatePath(`/tools/teams/${teamId}/bluemailer`);
    return { success: true };

  } catch (error) {
    console.error('Delete template error:', error);
    return { success: false, error: 'Failed to delete template' };
  }
}

export async function duplicateTemplate(
  teamId: string,
  templateId: string,
  newName?: string
): Promise<{ success: boolean; newTemplateId?: string; error?: string }> {
  try {
    const { user } = await requireTeamAccess(teamId);

    // Get original template with components
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

    const components = await db
      .select()
      .from(emailTemplateComponents)
      .where(eq(emailTemplateComponents.templateId, templateId))
      .orderBy(emailTemplateComponents.sortOrder);

    // Create duplicate
    const [newTemplate] = await db.insert(emailTemplates).values({
      name: newName || `${originalTemplate.name} (Copy)`,
      description: originalTemplate.description,
      category: originalTemplate.category,
      teamId: teamId,
      canvasSettings: originalTemplate.canvasSettings,
      status: 'draft',
      visibility: originalTemplate.visibility,
      createdBy: user.user.email,
      updatedBy: user.user.email,
    }).returning();

    // Duplicate components
    if (components.length > 0) {
      const componentInserts = components.map(comp => ({
        templateId: newTemplate.id,
        componentId: comp.componentId,
        type: comp.type,
        componentData: comp.componentData,
        sortOrder: comp.sortOrder,
        parentComponentId: comp.parentComponentId,
      }));

      await db.insert(emailTemplateComponents).values(componentInserts);
    }

    // Log usage
    await db.insert(templateUsageHistory).values({
      templateId: newTemplate.id,
      usedBy: user.user.email,
      teamId: teamId,
      action: 'duplicated',
    });

    revalidatePath(`/tools/teams/${teamId}/bluemailer`);
    return { success: true, newTemplateId: newTemplate.id };

  } catch (error) {
    console.error('Duplicate template error:', error);
    return { success: false, error: 'Failed to duplicate template' };
  }
}

export async function getTeamTemplates(teamId: string) {
  try {
    const { user } = await requireTeamAccess(teamId);

    const templates = await db
      .select({
        id: emailTemplates.id,
        name: emailTemplates.name,
        description: emailTemplates.description,
        category: emailTemplates.category,
        status: emailTemplates.status,
        visibility: emailTemplates.visibility,
        thumbnailUrl: emailTemplates.thumbnailUrl,
        usageCount: emailTemplates.usageCount,
        lastUsedAt: emailTemplates.lastUsedAt,
        createdAt: emailTemplates.createdAt,
        updatedAt: emailTemplates.updatedAt,
        createdBy: emailTemplates.createdBy,
      })
      .from(emailTemplates)
      .where(eq(emailTemplates.teamId, teamId))
      .orderBy(desc(emailTemplates.updatedAt));

    return templates;

  } catch (error) {
    console.error('Get team templates error:', error);
    throw new Error('Failed to fetch templates');
  }
}

export async function getTemplate(teamId: string, templateId: string) {
  try {
    const { user } = await requireTeamAccess(teamId);

    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.id, templateId),
        eq(emailTemplates.teamId, teamId)
      ));

    if (!template) {
      return null;
    }

    const components = await db
      .select()
      .from(emailTemplateComponents)
      .where(eq(emailTemplateComponents.templateId, templateId))
      .orderBy(emailTemplateComponents.sortOrder);

    const applicationTags = await db
      .select({
        applicationId: templateApplicationTags.applicationId,
        isPrimary: templateApplicationTags.isPrimary,
        applicationName: applications.applicationName,
      })
      .from(templateApplicationTags)
      .leftJoin(applications, eq(templateApplicationTags.applicationId, applications.id))
      .where(eq(templateApplicationTags.templateId, templateId));

    return {
      ...template,
      components: components.map(c => c.componentData),
      applicationTags,
    };

  } catch (error) {
    console.error('Get template error:', error);
    throw new Error('Failed to fetch template');
  }
}

export async function updateTemplateStatus(
  teamId: string,
  templateId: string,
  status: TemplateStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await requireTeamAccess(teamId);

    await db
      .update(emailTemplates)
      .set({
        status,
        updatedBy: user.user.email,
        updatedAt: new Date(),
      })
      .where(and(
        eq(emailTemplates.id, templateId),
        eq(emailTemplates.teamId, teamId)
      ));

    // Log usage
    await db.insert(templateUsageHistory).values({
      templateId: templateId,
      usedBy: user.user.email,
      teamId: teamId,
      action: `status_${status}`,
    });

    revalidatePath(`/tools/teams/${teamId}/bluemailer`);
    return { success: true };

  } catch (error) {
    console.error('Update template status error:', error);
    return { success: false, error: 'Failed to update template status' };
  }
}
