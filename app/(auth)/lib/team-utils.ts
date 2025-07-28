// lib/team-utils.ts
import { db } from '@/db';
import { teams } from '@/db/schema/teams';
import { eq, or } from 'drizzle-orm';
import type { TeamAccess } from '@/app/types/auth';

// Cache team access queries in-memory
const teamAccessCache = new Map<string, { data: TeamAccess[], expiry: number }>();

export async function getUserTeamAccess(userGroups: string[]): Promise<TeamAccess[]> {
  const cacheKey = userGroups.sort().join(',');
  const cached = teamAccessCache.get(cacheKey);
  
  // Check cache (5-minute expiry)
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  try {
    const matchingTeams = await db
      .select({
        id: teams.id,
        teamName: teams.teamName,
        userGroup: teams.userGroup,
        adminGroup: teams.adminGroup,
      })
      .from(teams)
      .where(
        or(
          ...userGroups.map(group =>
            or(
              eq(teams.userGroup, group),
              eq(teams.adminGroup, group)
            )
          )
        )
      );

    const teamAccess: TeamAccess[] = matchingTeams.map(team => {
      const isAdmin = userGroups.includes(team.adminGroup);
      return {
        teamId: team.id,
        teamName: team.teamName,
        role: isAdmin ? 'admin' : 'user'
      };
    });

    // Cache for 5 minutes
    teamAccessCache.set(cacheKey, {
      data: teamAccess,
      expiry: Date.now() + 5 * 60 * 1000
    });

    return teamAccess;
  } catch (error) {
    console.error('Failed to get user team access:', error);
    return [];
  }
}

export function clearTeamAccessCache(): void {
  teamAccessCache.clear();
}
