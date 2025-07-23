// hooks/useTokenRefresh.ts
'use client';

import { useEffect, useCallback, useState } from 'react';
import { refreshAuthToken } from '../actions/auth';


export function useTokenRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refreshToken = useCallback(async () => {
    if (isRefreshing) {
      console.log('🔄 Refresh already in progress, skipping...');
      return false;
    }

    setIsRefreshing(true);
    
    try {
      console.log('🔄 Refreshing auth token...');
      const result = await refreshAuthToken();
      
      if (result.success) {
        console.log('✅ Token refreshed successfully');
        setLastRefresh(new Date());
        return true;
      } else {
        console.log('❌ Token refresh failed:', result.error);
        // Could trigger logout or redirect to login page
        return false;
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  // Set up automatic token refresh
  useEffect(() => {
    // Refresh token every 14 minutes (1 minute before expiry)
    const interval = setInterval(refreshToken, 14 * 60 * 1000);
    
    console.log('⏰ Token refresh interval set up (14 minutes)');
    
    return () => {
      clearInterval(interval);
      console.log('⏰ Token refresh interval cleared');
    };
  }, [refreshToken]);

  return { 
    refreshToken, 
    isRefreshing, 
    lastRefresh 
  };
}
