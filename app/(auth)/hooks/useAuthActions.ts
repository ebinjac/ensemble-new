'use client';

import { useCallback } from 'react';
import type { SSOUser } from '@/app/types/auth';
import type { FormattedUser, FormattedTeam } from '@/app/(auth)/lib/auth';
import { handleSSOCallback } from '@/app/(auth)/actions/auth';

// ✅ New: Separate auth operations hook
export function useAuthActions() {
  const processAuthentication = useCallback(async (
    ssoUser: SSOUser,
    onSuccess: (data: { user: FormattedUser; teams: FormattedTeam[] }) => void,
    onError: (error: string) => void
  ) => {
    try {
      const deviceInfo = navigator.userAgent;
      const result = await handleSSOCallback(ssoUser, deviceInfo);
      
      if (result.success && result.data) {
        // Map the response to our formatted types
        const formattedUser: FormattedUser = {
          id: result.data.user.attributes.employeeId,
          name: result.data.user.attributes.fullName,
          email: result.data.user.attributes.email,
          firstName: result.data.user.attributes.firstName,
          lastName: result.data.user.attributes.lastName,
          employeeId: result.data.user.attributes.employeeId,
          adsId: result.data.user.attributes.adsId,
          image: undefined,
        };

        const formattedTeams: FormattedTeam[] = result.data.teams.map(team => ({
          id: team.teamId,
          name: team.teamName,
          role: team.role,
        }));

        onSuccess({ user: formattedUser, teams: formattedTeams });
        
        console.log('✅ Authentication successful:', formattedUser.name);
        console.log('👥 User teams:', formattedTeams.length);
      } else {
        throw new Error(result.error || 'Authentication failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      console.error('❌ Authentication error:', errorMessage);
      onError(errorMessage);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const { logout } = await import('@/app/(auth)/actions/auth');
      await logout();
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      throw new Error('Logout failed');
    }
  }, []);

  return {
    processAuthentication,
    logout,
  };
}
