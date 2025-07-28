'use client';

import { useState, useCallback } from 'react';
import type { FormattedUser, FormattedTeam } from '@/app/(auth)/lib/auth';

// ✅ New: Pure state management hook
export function useAuthState() {
  const [user, setUser] = useState<FormattedUser | null>(null);
  const [teams, setTeams] = useState<FormattedTeam[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const updateAuthState = useCallback((authData: {
    user: FormattedUser;
    teams: FormattedTeam[];
  }) => {
    setUser(authData.user);
    setTeams(authData.teams);
    setIsAuthenticated(true);
    setError(null);
  }, []);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setTeams([]);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  return {
    // State
    user,
    teams,
    isAuthenticated,
    loading,
    error,
    
    // Helpers
    hasTeamAccess,
    isTeamAdmin,
    getTeamRole,
    
    // State setters
    setUser,
    setTeams,
    setIsAuthenticated,
    setLoading,
    setError,
    updateAuthState,
    clearAuthState,
  };
}
