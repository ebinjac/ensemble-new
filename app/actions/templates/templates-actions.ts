// actions/templates/template-actions.ts
'use server'

import { z } from 'zod'
import { createServerAction } from 'zsa'
import { db } from '@/db'
import { emailTemplates, emailTemplateComponents, templateUsageHistory } from '@/db/schema/bluemailer'
import { eq, and, desc, asc, count } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireAuth, requireTeamAccess, checkTeamAccess } from '@/app/(auth)/lib/auth'

// Enhanced input schemas with auth context
const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(255),
  description: z.string().optional(),
  category: z.enum(['newsletter', 'promotional', 'transactional', 'onboarding', 'notification', 'announcement', 'custom']),
  teamId: z.string().uuid(),
  canvasSettings: z.object({
    backgroundColor: z.string(),
    contentBackgroundColor: z.string(),
    contentWidth: z.string(),
    maxWidth: z.string(),
    padding: z.string(),
    fontFamily: z.string(),
    fontSize: z.string(),
    lineHeight: z.string(),
    color: z.string(),
  }),
  components: z.array(z.any()),
  visibility: z.enum(['private', 'team', 'public', 'shared']).default('private'),
})

// Create Template Action with Auth
export const createTemplate = createServerAction()
  .input(createTemplateSchema)
  .handler(async ({ input }) => {
    try {
      // Check authentication and team access
      const { user, role } = await requireTeamAccess(input.teamId)
      
      // Verify user has permission to create templates
      if (role !== 'admin' && role !== 'user') {
        throw new Error('Insufficient permissions to create templates')
      }

      const result = await db.transaction(async (tx) => {
        // Create template with authenticated user context
        const [template] = await tx.insert(emailTemplates).values({
          name: input.name,
          description: input.description,
          category: input.category,
          teamId: input.teamId,
          canvasSettings: input.canvasSettings,
          visibility: input.visibility,
          createdBy: user.user.email,
          updatedBy: user.user.email,
        }).returning()

        // Create components
        if (input.components.length > 0) {
          const componentsToInsert = input.components.map((component, index) => ({
            templateId: template.id,
            componentId: component.id,
            type: component.type,
            componentData: component,
            sortOrder: index,
            parentComponentId: component.parentId || null,
          }))

          await tx.insert(emailTemplateComponents).values(componentsToInsert)
        }

        return template
      })

      // Track usage with authenticated user
      await db.insert(templateUsageHistory).values({
        templateId: result.id,
        usedBy: user.user.email,
        teamId: input.teamId,
        action: 'create',
      })

      revalidatePath(`/teams/${input.teamId}/bluemailer`)
      return { success: true, template: result }
    } catch (error) {
      console.error('Error creating template:', error)
      if (error instanceof Error && error.message.includes('permission')) {
        throw error
      }
      throw new Error('Failed to create template')
    }
  })

// Update Template Action with Auth
export const updateTemplate = createServerAction()
  .input(z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    category: z.enum(['newsletter', 'promotional', 'transactional', 'onboarding', 'notification', 'announcement', 'custom']).optional(),
    canvasSettings: z.object({
      backgroundColor: z.string(),
      contentBackgroundColor: z.string(),
      contentWidth: z.string(),
      maxWidth: z.string(),
      padding: z.string(),
      fontFamily: z.string(),
      fontSize: z.string(),
      lineHeight: z.string(),
      color: z.string(),
    }).optional(),
    components: z.array(z.any()).optional(),
    visibility: z.enum(['private', 'team', 'public', 'shared']).optional(),
    status: z.enum(['draft', 'active', 'archived', 'deprecated']).optional(),
  }))
  .handler(async ({ input }) => {
    try {
      // Get current user
      const authUser = await requireAuth()
      
      // Get template to check team ownership
      const existingTemplate = await db.query.emailTemplates.findFirst({
        where: eq(emailTemplates.id, input.id),
        columns: { teamId: true, createdBy: true }
      })

      if (!existingTemplate) {
        throw new Error('Template not found')
      }

      // Check team access
      const { user, role } = await requireTeamAccess(existingTemplate.teamId)

      // Check if user can edit (owner or admin)
      const canEdit = role === 'admin' || existingTemplate.createdBy === user.user.email
      if (!canEdit) {
        throw new Error('Insufficient permissions to edit this template')
      }

      const result = await db.transaction(async (tx) => {
        // Update template
        const [template] = await tx
          .update(emailTemplates)
          .set({
            ...(input.name && { name: input.name }),
            ...(input.description !== undefined && { description: input.description }),
            ...(input.category && { category: input.category }),
            ...(input.canvasSettings && { canvasSettings: input.canvasSettings }),
            ...(input.visibility && { visibility: input.visibility }),
            ...(input.status && { status: input.status }),
            updatedBy: user.user.email,
            updatedAt: new Date(),
          })
          .where(eq(emailTemplates.id, input.id))
          .returning()

        // Update components if provided
        if (input.components) {
          await tx.delete(emailTemplateComponents).where(eq(emailTemplateComponents.templateId, input.id))

          if (input.components.length > 0) {
            const componentsToInsert = input.components.map((component, index) => ({
              templateId: input.id,
              componentId: component.id,
              type: component.type,
              componentData: component,
              sortOrder: index,
              parentComponentId: component.parentId || null,
            }))

            await tx.insert(emailTemplateComponents).values(componentsToInsert)
          }
        }

        return template
      })

      // Track usage
      await db.insert(templateUsageHistory).values({
        templateId: input.id,
        usedBy: user.user.email,
        teamId: existingTemplate.teamId,
        action: 'update',
      })

      revalidatePath(`/teams/${existingTemplate.teamId}/bluemailer`)
      return { success: true, template: result }
    } catch (error) {
      console.error('Error updating template:', error)
      if (error instanceof Error && error.message.includes('permission')) {
        throw error
      }
      throw new Error('Failed to update template')
    }
  })

// Get Templates with Auth
export const getTemplates = createServerAction()
  .input(z.object({
    teamId: z.string().uuid(),
    status: z.enum(['draft', 'active', 'archived', 'deprecated']).optional(),
    category: z.enum(['newsletter', 'promotional', 'transactional', 'onboarding', 'notification', 'announcement', 'custom']).optional(),
    visibility: z.enum(['private', 'team', 'public', 'shared']).optional(),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'usageCount']).default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
  }))
  .handler(async ({ input }) => {
    try {
      // Check team access
      const { user } = await requireTeamAccess(input.teamId)

      let query = db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.teamId, input.teamId))

      // Apply filters
      const conditions = [eq(emailTemplates.teamId, input.teamId)]
      
      if (input.status) {
        conditions.push(eq(emailTemplates.status, input.status))
      }
      
      if (input.category) {
        conditions.push(eq(emailTemplates.category, input.category))
      }
      
      if (input.visibility) {
        conditions.push(eq(emailTemplates.visibility, input.visibility))
      }

      if (conditions.length > 1) {
        query = query.where(and(...conditions))
      }

      // Apply sorting
      const orderBy = input.sortOrder === 'asc' 
        ? asc(emailTemplates[input.sortBy])
        : desc(emailTemplates[input.sortBy])

      query = query.orderBy(orderBy)
      query = query.limit(input.limit).offset(input.offset)

      const templates = await query

      // Get total count
      const [{ count: totalCount }] = await db
        .select({ count: count() })
        .from(emailTemplates)
        .where(and(...conditions))

      return {
        templates,
        pagination: {
          total: totalCount,
          limit: input.limit,
          offset: input.offset,
          hasMore: input.offset + input.limit < totalCount,
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      throw new Error('Failed to fetch templates')
    }
  })

// Get Template by ID with Auth
export const getTemplateById = createServerAction()
  .input(z.object({ 
    id: z.string().uuid(),
  }))
  .handler(async ({ input }) => {
    try {
      // Get authenticated user
      const authUser = await requireAuth()

      // Get template with components
      const template = await db.query.emailTemplates.findFirst({
        where: eq(emailTemplates.id, input.id),
        with: {
          components: {
            orderBy: asc(emailTemplateComponents.sortOrder),
          },
          team: true,
          applicationTags: {
            with: {
              application: true,
            },
          },
        },
      })

      if (!template) {
        throw new Error('Template not found')
      }

      // Check if user has access to this template's team
      const { hasAccess } = await checkTeamAccess(template.teamId)
      if (!hasAccess) {
        throw new Error('Insufficient permissions to view this template')
      }

      // Track template view
      await db.insert(templateUsageHistory).values({
        templateId: input.id,
        usedBy: authUser.user.email,
        teamId: template.teamId,
        action: 'view',
      })

      // Update last used timestamp
      await db
        .update(emailTemplates)
        .set({ lastUsedAt: new Date() })
        .where(eq(emailTemplates.id, input.id))

      return { template }
    } catch (error) {
      console.error('Error fetching template:', error)
      if (error instanceof Error && error.message.includes('permission')) {
        throw error
      }
      throw new Error('Failed to fetch template')
    }
  })

// Delete Template with Auth
export const deleteTemplate = createServerAction()
  .input(z.object({ 
    id: z.string().uuid(),
  }))
  .handler(async ({ input }) => {
    try {
      // Get authenticated user
      const authUser = await requireAuth()

      // Get template to check ownership and team
      const template = await db.query.emailTemplates.findFirst({
        where: eq(emailTemplates.id, input.id),
        columns: { teamId: true, createdBy: true },
      })

      if (!template) {
        throw new Error('Template not found')
      }

      // Check team access and permissions
      const { user, role } = await requireTeamAccess(template.teamId)
      
      // Only creator or admin can delete
      const canDelete = role === 'admin' || template.createdBy === user.user.email
      if (!canDelete) {
        throw new Error('Insufficient permissions to delete this template')
      }

      // Delete template (components will be deleted via cascade)
      await db.delete(emailTemplates).where(eq(emailTemplates.id, input.id))

      // Track deletion
      await db.insert(templateUsageHistory).values({
        templateId: input.id,
        usedBy: user.user.email,
        teamId: template.teamId,
        action: 'delete',
      })

      revalidatePath(`/teams/${template.teamId}/bluemailer`)
      return { success: true }
    } catch (error) {
      console.error('Error deleting template:', error)
      if (error instanceof Error && error.message.includes('permission')) {
        throw error
      }
      throw new Error('Failed to delete template')
    }
  })

// Duplicate Template with Auth
export const duplicateTemplate = createServerAction()
  .input(z.object({ 
    id: z.string().uuid(),
    name: z.string().min(1).max(255),
  }))
  .handler(async ({ input }) => {
    try {
      // Get authenticated user
      const authUser = await requireAuth()

      // Get original template with components
      const originalTemplate = await db.query.emailTemplates.findFirst({
        where: eq(emailTemplates.id, input.id),
        with: {
          components: true,
        },
      })

      if (!originalTemplate) {
        throw new Error('Template not found')
      }

      // Check team access
      const { user } = await requireTeamAccess(originalTemplate.teamId)

      const result = await db.transaction(async (tx) => {
        // Create new template
        const [newTemplate] = await tx.insert(emailTemplates).values({
          name: input.name,
          description: originalTemplate.description,
          category: originalTemplate.category,
          teamId: originalTemplate.teamId,
          canvasSettings: originalTemplate.canvasSettings,
          visibility: 'private', // Always create as private
          parentTemplateId: originalTemplate.id,
          createdBy: user.user.email,
          updatedBy: user.user.email,
        }).returning()

        // Duplicate components
        if (originalTemplate.components.length > 0) {
          const componentsToInsert = originalTemplate.components.map(component => ({
            templateId: newTemplate.id,
            componentId: component.componentId,
            type: component.type,
            componentData: component.componentData,
            sortOrder: component.sortOrder,
            parentComponentId: component.parentComponentId,
          }))

          await tx.insert(emailTemplateComponents).values(componentsToInsert)
        }

        return newTemplate
      })

      // Track duplication
      await db.insert(templateUsageHistory).values({
        templateId: result.id,
        usedBy: user.user.email,
        teamId: result.teamId,
        action: 'duplicate',
      })

      revalidatePath(`/teams/${result.teamId}/bluemailer`)
      return { success: true, template: result }
    } catch (error) {
      console.error('Error duplicating template:', error)
      if (error instanceof Error && error.message.includes('permission')) {
        throw error
      }
      throw new Error('Failed to duplicate template')
    }
  })
