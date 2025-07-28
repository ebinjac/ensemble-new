// lib/auth-server.ts
import 'server-only';
import { cookies } from 'next/headers';
import { StatelessSessionManager, type SessionPayload } from '@/app/(auth)/lib/token';
import { authCache } from '@/app/(auth)/lib/auth-cache';
import type { FormattedUser, FormattedTeam } from '@/app/(auth)/lib/auth';

let requestCount = 0;

export async function getServerAuthData(): Promise<{
  isAuthenticated: boolean;
  user: FormattedUser | null;
  teams: FormattedTeam[];
  sessionData: SessionPayload | null;
}> {
  requestCount++;
  console.log(`🔍 [${requestCount}] getServerAuthData called`);
  
  // Use cache to prevent excessive calls
  return authCache.getAuthData(async () => {
    try {
      const cookieStore = await cookies();
      const authToken = cookieStore.get('auth-token');
      
      if (!authToken) {
        console.log('❌ No auth token found');
        return {
          isAuthenticated: false,
          user: null,
          teams: [],
          sessionData: null,
        };
      }

      console.log('🔍 Verifying session token...');
      const sessionData = await StatelessSessionManager.verifySession(authToken.value);
      
      if (!sessionData) {
        console.log('❌ Session verification failed');
        return {
          isAuthenticated: false,
          user: null,
          teams: [],
          sessionData: null,
        };
      }

      console.log('✅ Session verified successfully for user:', sessionData.user.email);

      const formattedUser: FormattedUser = {
        id: sessionData.user.employeeId,
        name: sessionData.user.fullName,
        email: sessionData.user.email,
        firstName: sessionData.user.firstName,
        lastName: sessionData.user.lastName,
        employeeId: sessionData.user.employeeId,
        adsId: sessionData.user.adsId,
        image: undefined,
      };

      const formattedTeams: FormattedTeam[] = sessionData.teams.map(team => ({
        id: team.teamId,
        name: team.teamName,
        role: team.role,
      }));

      return {
        isAuthenticated: true,
        user: formattedUser,
        teams: formattedTeams,
        sessionData,
      };
    } catch (error) {
      console.error('❌ Error getting server auth data:', error);
      return {
        isAuthenticated: false,
        user: null,
        teams: [],
        sessionData: null,
      };
    }
  });
}
