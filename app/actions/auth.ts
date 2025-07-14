'use server';

import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { teams } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { type SSOUser, type AuthResponse, type TeamAccess } from '@/app/types/auth';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-development-secret'
);

export async function handleSSOCallback(
  userData: SSOUser
): Promise<AuthResponse> {
  try {
    // Find all teams where the user has any role (user or admin)
    const matchingTeams = await db
      .select()
      .from(teams)
      .where(
        or(
          ...userData.groups.map(
            (group) =>
              or(
                eq(teams.userGroup, group),
                eq(teams.adminGroup, group)
              )
          )
        )
      );

    // Map user's access for each team
    const teamAccess: TeamAccess[] = matchingTeams.map(team => {
      const isAdmin = userData.groups.includes(team.adminGroup);
      const isUser = userData.groups.includes(team.userGroup);
      
      // If user has both admin and user roles, admin takes precedence
      return {
        teamId: team.id,
        teamName: team.teamName,
        role: isAdmin ? 'admin' : isUser ? 'user' : 'user'
      };
    });

    // If user has no team access, throw error
    if (teamAccess.length === 0) {
      throw new Error('No team access found');
    }

    // Create JWT payload
    const { groups, ...userWithoutGroups } = userData;
    const payload = {
      user: userWithoutGroups,
      teams: teamAccess,
      groups,
    };

    // Sign JWT
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(JWT_SECRET);

    // Set JWT in HTTP-only cookie
    const cookieStore = cookies();
    (await cookieStore).set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60, // 8 hours
    });

    return {
      token,
      user: userData,
      teams: teamAccess,
    };
  } catch (error) {
    console.error('SSO callback error:', error);
    throw new Error('Authentication failed');
  }
} 