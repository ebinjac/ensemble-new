// actions/templates/analytics-actions.ts
'use server'

import { z } from 'zod'
import { createServerAction } from 'zsa'
import { db } from '@/db'
import { templateUsageHistory, emailTemplates } from '@/db/schema/bluemailer'
import { eq, desc, count, sql, and, gte } from 'drizzle-orm'

const getTeamAnalyticsSchema = z.object({
  teamId: z.string().uuid(),
  days: z.number().min(1).max(365).default(30),
})

// Get Team Analytics
export const getTeamAnalytics = createServerAction()
  .input(getTeamAnalyticsSchema)
  .handler(async ({ input }) => {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - input.days)

      // Get usage statistics
      const usageStats = await db
        .select({
          action: templateUsageHistory.action,
          count: count(templateUsageHistory.id),
        })
        .from(templateUsageHistory)
        .where(
          and(
            eq(templateUsageHistory.teamId, input.teamId),
            gte(templateUsageHistory.usedAt, startDate)
          )
        )
        .groupBy(templateUsageHistory.action)

      // Get most popular templates
      const popularTemplates = await db
        .select({
          templateId: templateUsageHistory.templateId,
          templateName: emailTemplates.name,
          usageCount: count(templateUsageHistory.id),
        })
        .from(templateUsageHistory)
        .innerJoin(emailTemplates, eq(templateUsageHistory.templateId, emailTemplates.id))
        .where(
          and(
            eq(templateUsageHistory.teamId, input.teamId),
            gte(templateUsageHistory.usedAt, startDate)
          )
        )
        .groupBy(templateUsageHistory.templateId, emailTemplates.name)
        .orderBy(desc(count(templateUsageHistory.id)))
        .limit(10)

      // Get daily usage trends
      const dailyUsage = await db
        .select({
          date: sql<string>`DATE(${templateUsageHistory.usedAt})`,
          count: count(templateUsageHistory.id),
        })
        .from(templateUsageHistory)
        .where(
          and(
            eq(templateUsageHistory.teamId, input.teamId),
            gte(templateUsageHistory.usedAt, startDate)
          )
        )
        .groupBy(sql`DATE(${templateUsageHistory.usedAt})`)
        .orderBy(sql`DATE(${templateUsageHistory.usedAt})`)

      // Get template statistics
      const templateStats = await db
        .select({
          total: count(emailTemplates.id),
          active: sql<number>`SUM(CASE WHEN ${emailTemplates.status} = 'active' THEN 1 ELSE 0 END)`,
          draft: sql<number>`SUM(CASE WHEN ${emailTemplates.status} = 'draft' THEN 1 ELSE 0 END)`,
        })
        .from(emailTemplates)
        .where(eq(emailTemplates.teamId, input.teamId))

      return {
        usageStats,
        popularTemplates,
        dailyUsage,
        templateStats: templateStats[0],
        period: { days: input.days, startDate, endDate: new Date() },
      }
    } catch (error) {
      console.error('Error fetching team analytics:', error)
      throw new Error('Failed to fetch analytics data')
    }
  })
