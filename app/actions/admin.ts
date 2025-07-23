'use server';

import { db } from '@/db';
import { teams, teamRegistrationRequests } from '@/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { requireAuth } from '@/app/(auth)/lib/auth';

export type DashboardStats = {
  totalTeams: number;
  pendingRequests: number;
  approvalRate: number;
  activeTeams: number;
};

export type ActivityData = {
  date: string;
  count: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get total teams count
    const totalTeams = await db.select().from(teams).execute();
    
    // Get pending requests count
    const pendingRequests = await db
      .select()
      .from(teamRegistrationRequests)
      .where(eq(teamRegistrationRequests.status, 'pending'))
      .execute();

    // Calculate approval rate
    const allRequests = await db
      .select()
      .from(teamRegistrationRequests)
      .where(
        and(
          eq(teamRegistrationRequests.status, 'approved'),
          gte(teamRegistrationRequests.reviewedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
        )
      )
      .execute();

    const totalProcessed = allRequests.length;
    const approvedCount = allRequests.filter(req => req.status === 'approved').length;
    const approvalRate = totalProcessed > 0 ? (approvedCount / totalProcessed) * 100 : 0;

    // Get active teams (teams with recent activity - for demo, all teams are considered active)
    const activeTeams = totalTeams.length;

    return {
      totalTeams: totalTeams.length,
      pendingRequests: pendingRequests.length,
      approvalRate,
      activeTeams,
    };
  } catch (error) {
    console.error('Failed to get dashboard stats:', error);
    throw error;
  }
}

export async function getActivityData(): Promise<ActivityData[]> {
  try {
    // Get the date 3 months ago
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Get all registration requests in the last 3 months
    const requests = await db
      .select({
        requestedAt: teamRegistrationRequests.requestedAt,
      })
      .from(teamRegistrationRequests)
      .where(gte(teamRegistrationRequests.requestedAt, threeMonthsAgo))
      .orderBy(desc(teamRegistrationRequests.requestedAt))
      .execute();

    // Create a map to store counts by date
    const activityMap = new Map<string, number>();

    // Initialize all dates in the last 3 months with 0
    for (let d = new Date(threeMonthsAgo); d <= new Date(); d.setDate(d.getDate() + 1)) {
      activityMap.set(d.toISOString().split('T')[0], 0);
    }

    // Count requests by date
    requests.forEach((request) => {
      const date = request.requestedAt.toISOString().split('T')[0];
      activityMap.set(date, (activityMap.get(date) || 0) + 1);
    });

    // Convert map to array and sort by date
    return Array.from(activityMap, ([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Failed to get activity data:', error);
    throw error;
  }
} 