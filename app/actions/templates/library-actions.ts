// actions/library/library-actions.ts
'use server'

import { z } from 'zod'
import { createServerAction } from 'zsa'
import { db } from '@/db'
import { templateLibrary, templateLibraryComponents, emailTemplates, emailTemplateComponents } from '@/db/schema/bluemailer'
import { eq, desc, like, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

const getLibraryTemplatesSchema = z.object({
  category: z.enum(['newsletter', 'promotional', 'transactional', 'onboarding', 'notification', 'announcement', 'custom']).optional(),
  search: z.string().optional(),
  featuredOnly: z.boolean().default(false),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
})

const importLibraryTemplateSchema = z.object({
  libraryTemplateId: z.string().uuid(),
  teamId: z.string().uuid(),
  name: z.string().min(1).max(255),
  importedBy: z.string(),
})

// Get Library Templates
export const getLibraryTemplates = createServerAction()
  .input(getLibraryTemplatesSchema)
  .handler(async ({ input }) => {
    try {
      let query = db.select().from(templateLibrary).where(eq(templateLibrary.isActive, true))

      // Apply filters
      const conditions = [eq(templateLibrary.isActive, true)]

      if (input.category) {
        conditions.push(eq(templateLibrary.category, input.category))
      }

      if (input.featuredOnly) {
        conditions.push(eq(templateLibrary.isFeatured, true))
      }

      if (input.search) {
        conditions.push(
          like(templateLibrary.name, `%${input.search}%`)
        )
      }

      if (conditions.length > 1) {
        query = query.where(and(...conditions))
      }

      // Order by featured first, then by usage count
      query = query
        .orderBy(
          desc(templateLibrary.isFeatured),
          desc(templateLibrary.usageCount),
          desc(templateLibrary.createdAt)
        )
        .limit(input.limit)
        .offset(input.offset)

      const templates = await query

      return { templates }
    } catch (error) {
      console.error('Error fetching library templates:', error)
      throw new Error('Failed to fetch library templates')
    }
  })

// Get Library Template with Components
export const getLibraryTemplateById = createServerAction()
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    try {
      const template = await db.query.templateLibrary.findFirst({
        where: eq(templateLibrary.id, input.id),
        with: {
          components: {
            orderBy: (components, { asc }) => [asc(components.sortOrder)],
          },
        },
      })

      if (!template) {
        throw new Error('Library template not found')
      }

      return { template }
    } catch (error) {
      console.error('Error fetching library template:', error)
      throw new Error('Failed to fetch library template')
    }
  })

// Import Template from Library
export const importLibraryTemplate = createServerAction()
  .input(importLibraryTemplateSchema)
  .handler(async ({ input }) => {
    try {
      // Get library template with components
      const libraryTemplate = await db.query.templateLibrary.findFirst({
        where: eq(templateLibrary.id, input.libraryTemplateId),
        with: {
          components: true,
        },
      })

      if (!libraryTemplate) {
        throw new Error('Library template not found')
      }

      const result = await db.transaction(async (tx) => {
        // Create new template
        const [newTemplate] = await tx.insert(emailTemplates).values({
          name: input.name,
          description: libraryTemplate.description,
          category: libraryTemplate.category,
          teamId: input.teamId,
          canvasSettings: libraryTemplate.canvasSettings,
          visibility: 'private',
          createdBy: input.importedBy,
          updatedBy: input.importedBy,
        }).returning()

        // Import components
        if (libraryTemplate.components.length > 0) {
          const componentsToInsert = libraryTemplate.components.map(component => ({
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

      // Update usage count for library template
      await db
        .update(templateLibrary)
        .set({ 
          usageCount: libraryTemplate.usageCount + 1 
        })
        .where(eq(templateLibrary.id, input.libraryTemplateId))

      revalidatePath(`/teams/${input.teamId}/bluemailer`)
      return { success: true, template: result }
    } catch (error) {
      console.error('Error importing library template:', error)
      throw new Error('Failed to import template from library')
    }
  })
