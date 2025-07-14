'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSSOPolicy } from '@/app/hooks/useSSOPolicy';
import { handleSSOCallback } from '@/app/actions/auth';
import type { SSOUser, TeamAccess } from '@/app/types/auth';

type AuthContextType = {
  user: SSOUser | null;
  teams: TeamAccess[];
  loading: boolean;
  error: Error | null;
  // Helper functions
  hasTeamAccess: (teamId: string) => boolean;
  isTeamAdmin: (teamId: string) => boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  teams: [],
  loading: true,
  error: null,
  hasTeamAccess: () => false,
  isTeamAdmin: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: ssoLoading, error: ssoError } = useSSOPolicy();
  const [teams, setTeams] = useState<TeamAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function handleAuth() {
      if (user) {
        try {
          const response = await handleSSOCallback(user);
          setTeams(response.teams);
          setError(null);
        } catch (err) {
          console.error('Auth error:', err);
          setError(err instanceof Error ? err : new Error('Authentication failed'));
        } finally {
          setLoading(false);
        }
      }
    }

    if (!ssoLoading) {
      handleAuth();
    }
  }, [user, ssoLoading]);

  // Helper functions for checking team access
  const hasTeamAccess = (teamId: string) => {
    return teams.some(team => team.teamId === teamId);
  };

  const isTeamAdmin = (teamId: string) => {
    return teams.some(team => team.teamId === teamId && team.role === 'admin');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        teams,
        loading: loading || ssoLoading, 
        error: error || ssoError,
        hasTeamAccess,
        isTeamAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 