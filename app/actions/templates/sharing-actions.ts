// actions/templates/sharing-actions.ts
'use server'

import { z } from 'zod'
import { createServerAction } from 'zsa'
import { db } from '@/db'
import { templateSharing, emailTemplates, templateUsageHistory } from '@/db/schema/bluemailer'
import { eq, and, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireAuth, requireTeamAccess, checkTeamAccess } from '@/app/(auth)/lib/auth'

// Share Template Action with Auth
export const shareTemplate = createServerAction()
  .input(z.object({
    templateId: z.string().uuid(),
    sharedWithTeamIds: z.array(z.string().uuid()),
    canEdit: z.boolean().default(false),
    canDuplicate: z.boolean().default(true),
  }))
  .handler(async ({ input }) => {
    try {
      // Get authenticated user
      const authUser = await requireAuth()

      // Verify template exists and user has access
      const template = await db.query.emailTemplates.findFirst({
        where: eq(emailTemplates.id, input.templateId),
        columns: { id: true, teamId: true, name: true, createdBy: true },
      })

      if (!template) {
        throw new Error('Template not found')
      }

      // Check team access and sharing permissions
      const { user, role } = await requireTeamAccess(template.teamId)
      
      // Only template owner or team admin can share
      const canShare = role === 'admin' || template.createdBy === user.user.email
      if (!canShare) {
        throw new Error('Insufficient permissions to share this template')
      }

      // Verify user has access to target teams (for security)
      for (const teamId of input.sharedWithTeamIds) {
        const { hasAccess } = await checkTeamAccess(teamId)
        if (!hasAccess) {
          throw new Error(`No access to team ${teamId}`)
        }
      }

      // Remove existing sharing for these teams
      await db.delete(templateSharing).where(
        and(
          eq(templateSharing.templateId, input.templateId),
          inArray(templateSharing.sharedWithTeamId, input.sharedWithTeamIds)
        )
      )

      // Create new sharing records
      const sharingRecords = input.sharedWithTeamIds.map(teamId => ({
        templateId: input.templateId,
        sharedWithTeamId: teamId,
        canEdit: input.canEdit,
        canDuplicate: input.canDuplicate,
        sharedBy: user.user.email,
      }))

      await db.insert(templateSharing).values(sharingRecords)

      // Track sharing activity
      await db.insert(templateUsageHistory).values({
        templateId: input.templateId,
        usedBy: user.user.email,
        teamId: template.teamId,
        action: 'share',
      })

      // Revalidate relevant paths
      revalidatePath(`/teams/${template.teamId}/bluemailer`)
      for (const teamId of input.sharedWithTeamIds) {
        revalidatePath(`/teams/${teamId}/bluemailer/shared`)
      }

      return { success: true, sharedWith: input.sharedWithTeamIds.length }
    } catch (error) {
      console.error('Error sharing template:', error)
      if (error instanceof Error && error.message.includes('permission')) {
        throw error
      }
      throw new Error('Failed to share template')
    }
  })

// Get Shared Templates with Auth
export const getSharedTemplates = createServerAction()
  .input(z.object({
    teamId: z.string().uuid(),
    includeSharedByTeam: z.boolean().default(false),
    includeSharedWithTeam: z.boolean().default(true),
  }))
  .handler(async ({ input }) => {
    try {
      // Check team access
      await requireTeamAccess(input.teamId)

      const results = {
        sharedWithTeam: [] as any[],
        sharedByTeam: [] as any[],
      }

      // Get templates shared WITH this team
      if (input.includeSharedWithTeam) {
        results.sharedWithTeam = await db.query.templateSharing.findMany({
          where: eq(templateSharing.sharedWithTeamId, input.teamId),
          with: {
            template: {
              with: {
                team: {
                  columns: { id: true, teamName: true }
                }
              }
            }
          },
          orderBy: (templateSharing, { desc }) => [desc(templateSharing.sharedAt)],
        })
      }

      // Get templates shared BY this team
      if (input.includeSharedByTeam) {
        const teamTemplates = await db.query.emailTemplates.findMany({
          where: eq(emailTemplates.teamId, input.teamId),
          with: {
            sharing: {
              with: {
                sharedWithTeam: {
                  columns: { id: true, teamName: true }
                }
              }
            }
          },
        })

        results.sharedByTeam = teamTemplates.filter(template => template.sharing.length > 0)
      }

      return results
    } catch (error) {
      console.error('Error fetching shared templates:', error)
      throw new Error('Failed to fetch shared templates')
    }
  })
