// components/auth/AuthDataProvider.tsx
'use client';

import { createContext, useContext } from 'react';
import { useTokenRefresh } from '@/app/(auth)/hooks/useRefreshToken';
import type { FormattedUser, FormattedTeam } from '@/app/(auth)/lib/auth';

type AuthLayoutContextType = {
  user: FormattedUser | null;
  teams: FormattedTeam[];
  isAuthenticated: boolean;
  hasTeamAccess: (teamId: string) => boolean;
  isTeamAdmin: (teamId: string) => boolean;
  getTeamRole: (teamId: string) => 'admin' | 'user' | null;
};

const AuthLayoutContext = createContext<AuthLayoutContextType | null>(null);

interface AuthDataProviderProps {
  children: React.ReactNode;
  initialUser: FormattedUser | null;
  initialTeams: FormattedTeam[];
  initialIsAuthenticated: boolean;
}

export function AuthDataProvider({ 
  children, 
  initialUser, 
  initialTeams, 
  initialIsAuthenticated 
}: AuthDataProviderProps) {
  
  // Set up automatic token refresh
  useTokenRefresh();
  
  const hasTeamAccess = (teamId: string) => {
    return initialTeams.some(team => team.id === teamId);
  };

  const isTeamAdmin = (teamId: string) => {
    return initialTeams.some(team => team.id === teamId && team.role === 'admin');
  };

  const getTeamRole = (teamId: string) => {
    const team = initialTeams.find(team => team.id === teamId);
    return team?.role || null;
  };

  const contextValue: AuthLayoutContextType = {
    user: initialUser,
    teams: initialTeams,
    isAuthenticated: initialIsAuthenticated,
    hasTeamAccess,
    isTeamAdmin,
    getTeamRole,
  };

  return (
    <AuthLayoutContext.Provider value={contextValue}>
      {children}
    </AuthLayoutContext.Provider>
  );
}

export function useAuthLayout() {
  const context = useContext(AuthLayoutContext);
  if (!context) {
    throw new Error('useAuthLayout must be used within AuthDataProvider');
  }
  return context;
}
