'use server';

import { db } from '@/db';
import { templateLibrary, templateLibraryComponents } from '@/db/schema/bluemailer';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { eq, and, desc } from 'drizzle-orm';

export async function getTemplateLibrary() {
  try {
    // Library templates are global, no team restriction needed
    const templates = await db
      .select({
        id: templateLibrary.id,
        name: templateLibrary.name,
        description: templateLibrary.description,
        category: templateLibrary.category,
        canvasSettings: templateLibrary.canvasSettings,
        thumbnailUrl: templateLibrary.thumbnailUrl,
        previewUrl: templateLibrary.previewUrl,
        usageCount: templateLibrary.usageCount,
        rating: templateLibrary.rating,
        isFeatured: templateLibrary.isFeatured,
        isActive: templateLibrary.isActive,
        createdAt: templateLibrary.createdAt,
      })
      .from(templateLibrary)
      .where(eq(templateLibrary.isActive, true))
      .orderBy(desc(templateLibrary.isFeatured), desc(templateLibrary.usageCount));

    return templates;
  } catch (error) {
    console.error('Error fetching template library:', error);
    throw new Error('Failed to fetch template library');
  }
}

export async function getTemplateLibraryWithComponents(templateId: string) {
  try {
    const [template] = await db
      .select()
      .from(templateLibrary)
      .where(and(
        eq(templateLibrary.id, templateId),
        eq(templateLibrary.isActive, true)
      ));

    if (!template) {
      return null;
    }

    const components = await db
      .select()
      .from(templateLibraryComponents)
      .where(eq(templateLibraryComponents.libraryTemplateId, templateId))
      .orderBy(templateLibraryComponents.sortOrder);

    return {
      ...template,
      components: components.map(c => c.componentData),
    };
  } catch (error) {
    console.error('Error fetching template with components:', error);
    throw new Error('Failed to fetch template details');
  }
}

export async function getComponentLibrary() {
  try {
    // Get all library templates that are marked as component templates
    // You might want to add a field like `isComponentLibrary` to distinguish
    // For now, let's assume components are templates with specific categories
    const componentTemplates = await db
      .select({
        id: templateLibrary.id,
        name: templateLibrary.name,
        description: templateLibrary.description,
        category: templateLibrary.category,
        thumbnailUrl: templateLibrary.thumbnailUrl,
      })
      .from(templateLibrary)
      .where(and(
        eq(templateLibrary.isActive, true),
        // Add a condition to identify component templates
        // You might want to add an `isComponent` boolean field to the schema
      ))
      .orderBy(templateLibrary.category, templateLibrary.name);

    // Group by category
    const groupedComponents = componentTemplates.reduce((acc, template) => {
      const category = template.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(template);
      return acc;
    }, {} as Record<string, typeof componentTemplates>);

    return groupedComponents;
  } catch (error) {
    console.error('Error fetching component library:', error);
    throw new Error('Failed to fetch component library');
  }
}

export async function incrementTemplateUsage(templateId: string, teamId?: string) {
  try {
    // Increment usage count
    await db
      .update(templateLibrary)
      .set({ 
        usageCount: sql`${templateLibrary.usageCount} + 1` 
      })
      .where(eq(templateLibrary.id, templateId));

    // Log usage in history if teamId provided
    if (teamId) {
      const { user } = await requireTeamAccess(teamId);
      
      await db.insert(templateUsageHistory).values({
        libraryTemplateId: templateId,
        usedBy: user.user.email,
        teamId: teamId,
        action: 'used_from_library',
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error incrementing template usage:', error);
    return { success: false, error: 'Failed to update usage count' };
  }
}
