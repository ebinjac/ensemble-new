'use server';

import { db } from '@/db';
import { 
  emailSendHistory, 
  emailTemplates,
} from '@/db/schema/bluemailer';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { eq, and, gte, lte, desc, count } from 'drizzle-orm';

export interface AnalyticsFilters {
  startDate: Date;
  endDate: Date;
  period: string;
}



export async function getEmailAnalytics(teamId: string, filters: AnalyticsFilters) {
  try {
    await requireTeamAccess(teamId);

    // Get all emails for the period
    const emails = await db
      .select()
      .from(emailSendHistory)
      .where(and(
        eq(emailSendHistory.teamId, teamId),
        gte(emailSendHistory.createdAt, filters.startDate),
        lte(emailSendHistory.createdAt, filters.endDate)
      ));

    // Calculate stats in JavaScript
    const totalSent = emails.length;
    const totalDelivered = emails.filter(e => e.status === 'sent').length;
    const totalFailed = emails.filter(e => e.status === 'failed').length;
    const totalBounced = emails.filter(e => e.status === 'bounced').length;
    const totalQueued = emails.filter(e => e.status === 'queued').length;
    const totalOpened = emails.reduce((sum, e) => sum + (e.openCount || 0), 0);

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
    const failureRate = totalSent > 0 ? (totalFailed / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;

    // Group emails by date
    const emailsByDate = emails.reduce((acc, email) => {
      const date = email.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { sent: 0, delivered: 0, failed: 0, opened: 0 };
      }
      acc[date].sent++;
      if (email.status === 'sent') acc[date].delivered++;
      if (email.status === 'failed') acc[date].failed++;
      acc[date].opened += email.openCount || 0;
      return acc;
    }, {} as Record<string, any>);

    const emailsOverTime = Object.entries(emailsByDate)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get top performing emails by opens only
    const topPerformingEmails = emails
      .filter(e => e.status === 'sent')
      .map(email => {
        const recipients = Array.isArray(email.toEmails) ? email.toEmails.length : 0;
        const openCount = email.openCount || 0;
        
        return {
          id: email.id,
          subject: email.subject,
          sentAt: email.sentAt,
          recipients,
          openCount,
          openRate: recipients > 0 ? (openCount / recipients) * 100 : 0,
        };
      })
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, 10);

    // Get recent email activity
    const recentEmails = emails
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(email => ({
        id: email.id,
        subject: email.subject,
        status: email.status,
        recipients: Array.isArray(email.toEmails) ? email.toEmails.length : 0,
        createdAt: email.createdAt,
        sentAt: email.sentAt,
      }));

    return {
      totalSent,
      totalDelivered,
      totalOpened,
      totalFailed,
      totalBounced,
      totalQueued,
      deliveryRate,
      openRate,
      failureRate,
      bounceRate,
      emailsOverTime,
      topPerformingEmails,
      recentEmails,
    };

  } catch (error) {
    console.error('Get email analytics error:', error);
    throw new Error('Failed to fetch email analytics');
  }
}

export async function getTemplateAnalytics(teamId: string, filters: AnalyticsFilters) {
  try {
    await requireTeamAccess(teamId);

    // Get all templates
    const templates = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.teamId, teamId));

    const totalTemplates = templates.length;
    const totalUsage = templates.reduce((sum, t) => sum + (t.usageCount || 0), 0);
    const averageUsage = totalTemplates > 0 ? totalUsage / totalTemplates : 0;

    // Get templates with email performance data
    const templatesWithPerformance = [];
    for (const template of templates) {
      // Get emails sent using this template
      const templateEmails = await db
        .select()
        .from(emailSendHistory)
        .where(and(
          eq(emailSendHistory.templateId, template.id),
          eq(emailSendHistory.status, 'sent'),
          gte(emailSendHistory.createdAt, filters.startDate),
          lte(emailSendHistory.createdAt, filters.endDate)
        ));

      const emailsSent = templateEmails.length;
      const totalRecipients = templateEmails.reduce((sum, email) => {
        return sum + (Array.isArray(email.toEmails) ? email.toEmails.length : 0);
      }, 0);
      const totalOpens = templateEmails.reduce((sum, email) => sum + (email.openCount || 0), 0);
      const openRate = totalRecipients > 0 ? (totalOpens / totalRecipients) * 100 : 0;

      templatesWithPerformance.push({
        id: template.id,
        name: template.name,
        category: template.category,
        usageCount: template.usageCount || 0,
        emailsSent,
        totalRecipients,
        totalOpens,
        openRate,
        createdAt: template.createdAt,
        lastUsedAt: template.lastUsedAt,
      });
    }

    // Sort by usage count
    const topTemplates = templatesWithPerformance
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    // Category breakdown
    const categoryCount = templates.reduce((acc, template) => {
      acc[template.category] = (acc[template.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryBreakdown = Object.entries(categoryCount).map(([category, count]) => ({
      category,
      count,
      percentage: totalTemplates > 0 ? (count / totalTemplates) * 100 : 0,
    }));

    // Templates by creation date
    const templatesByMonth = templates.reduce((acc, template) => {
      const month = template.createdAt.toISOString().slice(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const templateGrowth = Object.entries(templatesByMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalTemplates,
      totalUsage,
      averageUsage,
      topTemplates,
      categoryBreakdown,
      templateGrowth,
      templatesWithPerformance,
    };

  } catch (error) {
    console.error('Get template analytics error:', error);
    throw new Error('Failed to fetch template analytics');
  }
}


export async function getEngagementMetrics(teamId: string, filters: AnalyticsFilters) {
    try {
      await requireTeamAccess(teamId);
  
      // Return simplified mock data
      return {
        averageOpenTime: 32,
        peakEngagementHours: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          opens: Math.floor(Math.random() * 50) + 10,
          clicks: Math.floor(Math.random() * 15) + 2,
        })),
        deviceBreakdown: [
          { device: 'mobile', count: 520, percentage: 65.0 },
          { device: 'desktop', count: 200, percentage: 25.0 },
          { device: 'tablet', count: 80, percentage: 10.0 },
        ],
        geographicData: [
          { country: 'United States', opens: 1200, clicks: 180 },
          { country: 'United Kingdom', opens: 800, clicks: 120 },
          { country: 'Canada', opens: 600, clicks: 95 },
        ],
      };
  
    } catch (error) {
      console.error('Get engagement metrics error:', error);
      throw new Error('Failed to fetch engagement metrics');
    }
  }