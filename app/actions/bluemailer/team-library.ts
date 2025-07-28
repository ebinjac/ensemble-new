'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { 
    emailTemplateComponents,
    emailTemplates,
  templateLibrary, 
  templateLibraryComponents,
  templateUsageHistory 
} from '@/db/schema/bluemailer';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { eq, and, or, desc, sql } from 'drizzle-orm';

export type LibraryVisibility = 'private' | 'team' | 'public';
export type LibraryCategory = 'newsletter' | 'promotional' | 'transactional' | 'onboarding' | 'notification' | 'announcement' | 'component' | 'custom';

export interface CreateLibraryItemData {
  name: string;
  description?: string;
  category: LibraryCategory;
  visibility: LibraryVisibility;
  canvasSettings?: any;
  components: any[];
  thumbnailUrl?: string;
  isComponent?: boolean; // true for reusable components, false for full templates
}

export async function createTeamLibraryItem(
    teamId: string,
    data: CreateLibraryItemData
  ): Promise<{ success: boolean; itemId?: string; error?: string }> {
    try {
      const { user } = await requireTeamAccess(teamId);
  
      const [libraryItem] = await db.insert(templateLibrary).values({
        name: data.name,
        description: data.description || null, // Handle empty descriptions
        category: data.category,
        teamId: teamId,
        visibility: data.visibility,
        canvasSettings: data.canvasSettings || {},
        thumbnailUrl: data.thumbnailUrl || null, // Handle null thumbnails
        isComponent: data.isComponent || false,
        isFeatured: false,
        isActive: true,
        usageCount: 0,
        rating: 0,
        createdBy: user.user.email,
        updatedBy: user.user.email,
      }).returning();
  
      // Add components
      if (data.components && data.components.length > 0) {
        const componentInserts = data.components.map((comp, index) => ({
          libraryTemplateId: libraryItem.id,
          componentId: comp.id || `comp_${index}`,
          type: comp.type,
          componentData: comp,
          sortOrder: index,
        }));
  
        await db.insert(templateLibraryComponents).values(componentInserts);
      }
  
      // Log creation
      await db.insert(templateUsageHistory).values({
        libraryTemplateId: libraryItem.id,
        usedBy: user.user.email,
        teamId: teamId,
        action: 'created_library_item',
      });
  
      revalidatePath(`/tools/teams/${teamId}/bluemailer/library`);
      return { success: true, itemId: libraryItem.id };
  
    } catch (error) {
      console.error('Create library item error:', error);
      return { success: false, error: 'Failed to create library item' };
    }
  }

  export async function updateTeamLibraryItem(
    teamId: string,
    itemId: string,
    data: Partial<CreateLibraryItemData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { user } = await requireTeamAccess(teamId);
  
      // Verify ownership
      const [item] = await db
        .select()
        .from(templateLibrary)
        .where(and(
          eq(templateLibrary.id, itemId),
          eq(templateLibrary.teamId, teamId) // Only team items can be edited
        ));
  
      if (!item) {
        return { success: false, error: 'Library item not found or permission denied' };
      }
  
      // Update item (filter out undefined values)
      const updateData = Object.fromEntries(
        Object.entries({
          name: data.name,
          description: data.description,
          category: data.category,
          visibility: data.visibility,
          canvasSettings: data.canvasSettings,
          thumbnailUrl: data.thumbnailUrl,
          isComponent: data.isComponent,
          updatedBy: user.user.email,
          updatedAt: new Date(),
        }).filter(([_, value]) => value !== undefined)
      );
  
      await db
        .update(templateLibrary)
        .set(updateData)
        .where(eq(templateLibrary.id, itemId));
  
      // Update components if provided
      if (data.components !== undefined) {
        // Delete existing components
        await db
          .delete(templateLibraryComponents)
          .where(eq(templateLibraryComponents.libraryTemplateId, itemId));
  
        // Insert new components
        if (data.components.length > 0) {
          const componentInserts = data.components.map((comp, index) => ({
            libraryTemplateId: itemId,
            componentId: comp.id || `comp_${index}`,
            type: comp.type,
            componentData: comp,
            sortOrder: index,
          }));
  
          await db.insert(templateLibraryComponents).values(componentInserts);
        }
      }
  
      revalidatePath(`/tools/teams/${teamId}/bluemailer/library`);
      revalidatePath(`/tools/teams/${teamId}/bluemailer/library/${itemId}/edit`);
      return { success: true };
  
    } catch (error) {
      console.error('Update library item error:', error);
      return { success: false, error: 'Failed to update library item' };
    }
  }

export async function deleteTeamLibraryItem(
  teamId: string,
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await requireTeamAccess(teamId);

    // Verify ownership
    const [item] = await db
      .select()
      .from(templateLibrary)
      .where(and(
        eq(templateLibrary.id, itemId),
        eq(templateLibrary.teamId, teamId)
      ));

    if (!item) {
      return { success: false, error: 'Library item not found' };
    }

    // Soft delete (mark as inactive)
    await db
      .update(templateLibrary)
      .set({
        isActive: false,
        updatedBy: user.user.email,
        updatedAt: new Date(),
      })
      .where(eq(templateLibrary.id, itemId));

    revalidatePath(`/tools/teams/${teamId}/bluemailer/library`);
    return { success: true };

  } catch (error) {
    console.error('Delete library item error:', error);
    return { success: false, error: 'Failed to delete library item' };
  }
}

export async function getTeamLibraryItems(teamId: string) {
  try {
    const { user } = await requireTeamAccess(teamId);

    // Get team's private items + public items from all teams
    const items = await db
      .select({
        id: templateLibrary.id,
        name: templateLibrary.name,
        description: templateLibrary.description,
        category: templateLibrary.category,
        visibility: templateLibrary.visibility,
        thumbnailUrl: templateLibrary.thumbnailUrl,
        isComponent: templateLibrary.isComponent,
        usageCount: templateLibrary.usageCount,
        rating: templateLibrary.rating,
        isFeatured: templateLibrary.isFeatured,
        createdAt: templateLibrary.createdAt,
        createdBy: templateLibrary.createdBy,
        teamId: templateLibrary.teamId,
      })
      .from(templateLibrary)
      .where(and(
        eq(templateLibrary.isActive, true),
        or(
          eq(templateLibrary.teamId, teamId), // Team's own items
          eq(templateLibrary.visibility, 'public'), // Public items from all teams
          and(
            eq(templateLibrary.visibility, 'team'),
            eq(templateLibrary.teamId, teamId)
          )
        )
      ))
      .orderBy(
        desc(templateLibrary.isFeatured), 
        desc(templateLibrary.usageCount),
        desc(templateLibrary.createdAt)
      );

    return items;

  } catch (error) {
    console.error('Get team library items error:', error);
    throw new Error('Failed to fetch library items');
  }
}

export async function getLibraryItemWithComponents(itemId: string, teamId: string) {
  try {
    const { user } = await requireTeamAccess(teamId);

    const [item] = await db
      .select()
      .from(templateLibrary)
      .where(and(
        eq(templateLibrary.id, itemId),
        eq(templateLibrary.isActive, true),
        or(
          eq(templateLibrary.teamId, teamId),
          eq(templateLibrary.visibility, 'public')
        )
      ));

    if (!item) {
      return null;
    }

    const components = await db
      .select()
      .from(templateLibraryComponents)
      .where(eq(templateLibraryComponents.libraryTemplateId, itemId))
      .orderBy(templateLibraryComponents.sortOrder);

    return {
      ...item,
      components: components.map(c => c.componentData),
    };

  } catch (error) {
    console.error('Get library item error:', error);
    throw new Error('Failed to fetch library item');
  }
}

export async function createLibraryFromTemplate(
  teamId: string,
  templateId: string,
  libraryData: {
    name: string;
    description?: string;
    category: LibraryCategory;
    visibility: LibraryVisibility;
    isComponent?: boolean;
  }
): Promise<{ success: boolean; itemId?: string; error?: string }> {
  try {
    const { user } = await requireTeamAccess(teamId);

    // Get the original template (from emailTemplates table)
    const originalTemplate = await db
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.id, templateId),
        eq(emailTemplates.teamId, teamId)
      ));

    if (!originalTemplate[0]) {
      return { success: false, error: 'Template not found' };
    }

    const template = originalTemplate[0];

    // Get template components
    const components = await db
      .select()
      .from(emailTemplateComponents)
      .where(eq(emailTemplateComponents.templateId, templateId))
      .orderBy(emailTemplateComponents.sortOrder);

    // Create library item
    const result = await createTeamLibraryItem(teamId, {
      name: libraryData.name,
      description: libraryData.description,
      category: libraryData.category,
      visibility: libraryData.visibility,
      canvasSettings: template.canvasSettings,
      components: components.map(c => c.componentData),
      isComponent: libraryData.isComponent,
    });

    if (result.success) {
      // Update the new library item with original template reference
      await db
        .update(templateLibrary)
        .set({ 
          originalTemplateId: templateId,
          thumbnailUrl: template.thumbnailUrl,
        })
        .where(eq(templateLibrary.id, result.itemId!));
    }

    return result;

  } catch (error) {
    console.error('Create library from template error:', error);
    return { success: false, error: 'Failed to create library item from template' };
  }
}
