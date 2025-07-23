// app/auth/components/AuthProvider.tsx
'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSSOPolicy } from '@/app/(auth)/hooks/useSSOPolicy';
import { useTokenRefresh } from '@/app/(auth)/hooks/useRefreshToken';
import type { FormattedUser, FormattedTeam } from '@/app/(auth)/lib/auth';
import { handleSSOCallback } from '@/app/(auth)/actions/auth';

type AuthContextType = {
  user: FormattedUser | null;
  teams: FormattedTeam[];
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  hasTeamAccess: (teamId: string) => boolean;
  isTeamAdmin: (teamId: string) => boolean;
  getTeamRole: (teamId: string) => 'admin' | 'user' | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  lastRefresh: Date | null;
  isRefreshing: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // SSO hook for fetching user data
  const { user: ssoUser, loading: ssoLoading, error: ssoError } = useSSOPolicy();
  
  // Token refresh hook
  const { refreshToken, isRefreshing, lastRefresh } = useTokenRefresh();
  
  // Auth state
  const [user, setUser] = useState<FormattedUser | null>(null);
  const [teams, setTeams] = useState<FormattedTeam[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're client-side before doing anything
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Helper functions
  const hasTeamAccess = useCallback((teamId: string) => {
    return teams.some(team => team.id === teamId);
  }, [teams]);

  const isTeamAdmin = useCallback((teamId: string) => {
    return teams.some(team => team.id === teamId && team.role === 'admin');
  }, [teams]);

  const getTeamRole = useCallback((teamId: string) => {
    const team = teams.find(team => team.id === teamId);
    return team?.role || null;
  }, [teams]);

  // Process SSO authentication
  const processAuthentication = useCallback(async () => {
    if (!ssoUser) return;

    setAuthLoading(true);
    setAuthError(null);

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

        setUser(formattedUser);
        setTeams(formattedTeams);
        setIsAuthenticated(true);
        
        console.log('✅ Authentication successful:', formattedUser.name);
        console.log('👥 User teams:', formattedTeams.length);
      } else {
        throw new Error(result.error || 'Authentication failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setAuthError(errorMessage);
      setIsAuthenticated(false);
      setUser(null);
      setTeams([]);
      console.error('❌ Authentication error:', errorMessage);
    } finally {
      setAuthLoading(false);
    }
  }, [ssoUser]);

  // Handle SSO user changes
  useEffect(() => {
    if (isClient && ssoUser && !ssoLoading && !isAuthenticated && !authLoading) {
      console.log('🔄 SSO user available, triggering authentication...');
      processAuthentication();
    }
  }, [isClient, ssoUser, ssoLoading, isAuthenticated, authLoading, processAuthentication]);

  // Auth actions
  const login = useCallback(async () => {
    if (ssoUser) {
      await processAuthentication();
    } else {
      setAuthError('No SSO user data available');
    }
  }, [ssoUser, processAuthentication]);

  const logout = useCallback(async () => {
    try {
      const { logout } = await import('@/app/(auth)/actions/auth');
      await logout();
      
      setUser(null);
      setTeams([]);
      setIsAuthenticated(false);
      setAuthError(null);
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      setAuthError('Logout failed');
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    const success = await refreshToken();
    if (!success) {
      // If refresh fails, try to re-authenticate
      if (ssoUser) {
        await processAuthentication();
      }
    }
  }, [refreshToken, ssoUser, processAuthentication]);

  // Show loading until client-side hydration is complete
  if (!isClient) {
    return (
      <AuthContext.Provider value={{
        user: null,
        teams: [],
        isAuthenticated: false,
        loading: true,
        error: null,
        hasTeamAccess: () => false,
        isTeamAdmin: () => false,
        getTeamRole: () => null,
        login: async () => {},
        logout: async () => {},
        refreshAuth: async () => {},
        lastRefresh: null,
        isRefreshing: false,
      }}>
        {children}
      </AuthContext.Provider>
    );
  }

  // Combine loading states and errors
  const loading = ssoLoading || authLoading;
  const error = ssoError?.message || authError;

  const contextValue: AuthContextType = {
    user,
    teams,
    isAuthenticated,
    loading,
    error,
    hasTeamAccess,
    isTeamAdmin,
    getTeamRole,
    login,
    logout,
    refreshAuth,
    lastRefresh,
    isRefreshing,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
