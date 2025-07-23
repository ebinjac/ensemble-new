// lib/auth.ts
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { StatelessSessionManager, type SessionPayload } from '@/app/(auth)/lib/token';
import type { TeamAccess } from '@/app/types/auth';

export type AuthUser = {
  user: SessionPayload | null;
  isAuthenticated: boolean;
};

export type FormattedUser = {
  id: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  adsId: string;
  image?: string;
};

export type FormattedTeam = {
  id: string;
  name: string;
  role: 'admin' | 'user';
};

/**
 * Gets the authenticated user from the encrypted JWT token (READ-ONLY)
 * @param redirectOnFailure - Whether to redirect to home page on auth failure
 * @returns The authenticated user or null
 */
export async function getServerUser(redirectOnFailure = true): Promise<AuthUser> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');

    if (!authToken) {
      if (redirectOnFailure) redirect('/');
      return { user: null, isAuthenticated: false };
    }

    const sessionData = await StatelessSessionManager.verifySession(authToken.value);
    
    if (!sessionData) {
      if (redirectOnFailure) redirect('/');
      return { user: null, isAuthenticated: false };
    }

    // DON'T update cookies here - just return the session data
    return { user: sessionData, isAuthenticated: true };
    
  } catch (error) {
    console.error('Auth error:', error);
    if (redirectOnFailure) redirect('/');
    return { user: null, isAuthenticated: false };
  }
}

/**
 * Get formatted user data for UI components (READ-ONLY)
 */
export async function getFormattedUserData(): Promise<{
  user: FormattedUser | null;
  teams: FormattedTeam[];
  isAuthenticated: boolean;
}> {
  const { user: sessionUser, isAuthenticated } = await getServerUser(false);

  if (!isAuthenticated || !sessionUser) {
    return {
      user: null,
      teams: [],
      isAuthenticated: false,
    };
  }

  const formattedUser: FormattedUser = {
    id: sessionUser.user.employeeId,
    name: sessionUser.user.fullName,
    email: sessionUser.user.email,
    firstName: sessionUser.user.firstName,
    lastName: sessionUser.user.lastName,
    employeeId: sessionUser.user.employeeId,
    adsId: sessionUser.user.adsId,
    image: undefined,
  };

  const formattedTeams: FormattedTeam[] = sessionUser.teams.map(team => ({
    id: team.teamId,
    name: team.teamName,
    role: team.role,
  }));

  return {
    user: formattedUser,
    teams: formattedTeams,
    isAuthenticated: true,
  };
}

/**
 * Middleware to ensure user is authenticated
 */
export async function requireAuth(): Promise<SessionPayload> {
  const { user, isAuthenticated } = await getServerUser(true);
  
  if (!isAuthenticated || !user) {
    redirect('/');
  }

  return user;
}

/**
 * Check if user is authenticated without redirecting
 */
export async function checkAuth(): Promise<boolean> {
  const { isAuthenticated } = await getServerUser(false);
  return isAuthenticated;
}

/**
 * Check if user has access to a specific team
 */
export async function checkTeamAccess(teamId: string): Promise<{
  hasAccess: boolean;
  role?: 'admin' | 'user';
}> {
  const { user } = await getServerUser(false);
  
  if (!user) {
    return { hasAccess: false };
  }

  const teamAccess = user.teams.find(team => team.teamId === teamId);
  
  return {
    hasAccess: !!teamAccess,
    role: teamAccess?.role,
  };
}

/**
 * Require team access for a specific team
 */
export async function requireTeamAccess(teamId: string): Promise<{
  user: SessionPayload;
  role: 'admin' | 'user';
}> {
  const user = await requireAuth();
  const teamAccess = user.teams.find(team => team.teamId === teamId);
  
  if (!teamAccess) {
    redirect('/unauthorized');
  }

  return {
    user,
    role: teamAccess.role,
  };
}
