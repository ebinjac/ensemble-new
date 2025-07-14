import { useEffect, useState } from 'react';
import type { SSOUser } from '@/app/types/auth';

// Mock SSO user data for development
const mockSSOUser: SSOUser = {
  firstName: "Ensemble",
  lastName: "Test",
  fullName: "Ensemble Test",
  adsId: "ensemble",
  guid: "@fca9376056149663519865855188315",
  employeeId: "8229989",
  email: "ensemble.test@daexp.com",
  groups: ["SSO_ENSEMBLE_E1"]
};

export function useSSOPolicy() {
  const [user, setUser] = useState<SSOUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Simulate SSO callback delay
    const timer = setTimeout(() => {
      try {
        // In development, always return mock user
        if (process.env.NODE_ENV === 'development') {
          setUser(mockSSOUser);
        }
        // In production, this would get real SSO data
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to get SSO data'));
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return { user, loading, error };
} 