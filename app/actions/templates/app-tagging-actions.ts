// actions/applications/app-tagging-actions.ts
'use server'

import { z } from 'zod'
import { createServerAction } from 'zsa'
import { db } from '@/db'
import { templateApplicationTags, emailTemplates } from '@/db/schema/bluemailer'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

const tagTemplateSchema = z.object({
  templateId: z.string().uuid(),
  applicationIds: z.array(z.string().uuid()),
  isPrimary: z.boolean().default(false),
  createdBy: z.string(),
})

const updateTagsSchema = z.object({
  templateId: z.string().uuid(),
  applicationIds: z.array(z.string().uuid()),
  updatedBy: z.string(),
})

// Tag Template to Applications
export const tagTemplateToApplications = createServerAction()
  .input(tagTemplateSchema)
  .handler(async ({ input }) => {
    try {
      // Get template team info
      const template = await db.query.emailTemplates.findFirst({
        where: eq(emailTemplates.id, input.templateId),
        columns: { teamId: true },
      })

      if (!template) {
        throw new Error('Template not found')
      }

      // Remove existing tags for this template
      await db.delete(templateApplicationTags).where(
        eq(templateApplicationTags.templateId, input.templateId)
      )

      // Create new tags
      if (input.applicationIds.length > 0) {
        const tagRecords = input.applicationIds.map((appId, index) => ({
          templateId: input.templateId,
          applicationId: appId,
          isPrimary: input.isPrimary && index === 0, // Only first one can be primary
          createdBy: input.createdBy,
        }))

        await db.insert(templateApplicationTags).values(tagRecords)
      }

      revalidatePath(`/teams/${template.teamId}/bluemailer`)
      return { success: true, tagged: input.applicationIds.length }
    } catch (error) {
      console.error('Error tagging template:', error)
      throw new Error('Failed to tag template to applications')
    }
  })

// Get Templates by Application
export const getTemplatesByApplication = createServerAction()
  .input(z.object({
    applicationId: z.string().uuid(),
    includePrimaryOnly: z.boolean().default(false),
  }))
  .handler(async ({ input }) => {
    try {
      const templates = await db.query.templateApplicationTags.findMany({
        where: input.includePrimaryOnly 
          ? and(
              eq(templateApplicationTags.applicationId, input.applicationId),
              eq(templateApplicationTags.isPrimary, true)
            )
          : eq(templateApplicationTags.applicationId, input.applicationId),
        with: {
          template: {
            with: {
              team: {
                columns: { id: true, teamName: true }
              }
            }
          }
        },
        orderBy: (templateApplicationTags, { desc, asc }) => [
          desc(templateApplicationTags.isPrimary),
          asc(templateApplicationTags.createdAt)
        ],
      })

      return { templates }
    } catch (error) {
      console.error('Error fetching templates by application:', error)
      throw new Error('Failed to fetch templates')
    }
  })

// Set Primary Template for Application
export const setPrimaryTemplate = createServerAction()
  .input(z.object({
    templateId: z.string().uuid(),
    applicationId: z.string().uuid(),
    updatedBy: z.string(),
  }))
  .handler(async ({ input }) => {
    try {
      await db.transaction(async (tx) => {
        // Remove primary status from all templates for this application
        await tx
          .update(templateApplicationTags)
          .set({ isPrimary: false })
          .where(eq(templateApplicationTags.applicationId, input.applicationId))

        // Set this template as primary
        await tx
          .update(templateApplicationTags)
          .set({ isPrimary: true })
          .where(
            and(
              eq(templateApplicationTags.templateId, input.templateId),
              eq(templateApplicationTags.applicationId, input.applicationId)
            )
          )
      })

      // Get template team for revalidation
      const template = await db.query.emailTemplates.findFirst({
        where: eq(emailTemplates.id, input.templateId),
        columns: { teamId: true },
      })

      if (template) {
        revalidatePath(`/teams/${template.teamId}/bluemailer`)
      }

      return { success: true }
    } catch (error) {
      console.error('Error setting primary template:', error)
      throw new Error('Failed to set primary template')
    }
  })
