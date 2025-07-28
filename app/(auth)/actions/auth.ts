'use server';

import { cookies } from 'next/headers';

import { db } from '@/db';
import { teams } from '@/db/schema/teams';
import { eq, or } from 'drizzle-orm';
import type { SSOUser, AuthResponse, TeamAccess } from '@/app/types/auth';
import { getUserTeamAccess } from '../lib/team-utils';
import { StatelessSessionManager } from '../lib/token';

export async function handleSSOCallback(
  userData: SSOUser,
  deviceInfo?: string,
  ipAddress?: string
): Promise<{ success: boolean; error?: string; data?: AuthResponse }> {
  console.log('🚀 Starting SSO callback for user:', userData.attributes.email);
  
  try {
    // Get user's team access using the shared utility
    const teamAccess = await getUserTeamAccess(userData.attributes.groups);
    console.log('📊 Found team access for', teamAccess.length, 'teams');

    // Create session data
    const sessionData = {
      user: {
        firstName: userData.attributes.firstName,
        lastName: userData.attributes.lastName,
        fullName: userData.attributes.fullName,
        adsId: userData.attributes.adsId,
        guid: userData.attributes.guid,
        employeeId: userData.attributes.employeeId,
        email: userData.attributes.email,
      },
      teams: teamAccess,
      deviceInfo: deviceInfo || 'unknown',
      ipAddress: ipAddress || 'unknown',
    };

    // Create encrypted session tokens
    const tokens = await StatelessSessionManager.createSession(sessionData);
    
    // Set secure HTTP-only cookies
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production';
    
    cookieStore.set('auth-token', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    cookieStore.set('refresh-token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    console.log('🍪 Cookies set successfully');

    return {
      success: true,
      data: {
        user: userData,
        teams: teamAccess,
        expiresAt: tokens.expiresAt,
      }
    };
    
  } catch (error) {
    console.error('❌ SSO callback error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Authentication failed' 
    };
  }
}

export async function refreshAuthToken(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔄 Attempting to refresh auth token...');
    
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh-token');
    
    if (!refreshToken) {
      console.log('❌ No refresh token found');
      return { success: false, error: 'No refresh token found' };
    }

    // Use the StatelessSessionManager to refresh the session
    const result = await StatelessSessionManager.refreshSession(refreshToken.value);
    
    if (!result) {
      console.log('❌ Refresh token is invalid or expired');
      // Clear invalid cookies
      cookieStore.delete('auth-token');
      cookieStore.delete('refresh-token');
      return { success: false, error: 'Invalid or expired refresh token' };
    }

    // Set the new access token cookie
    const isProduction = process.env.NODE_ENV === 'production';
    cookieStore.set('auth-token', result.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    console.log('✅ Access token refreshed successfully');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Token refresh failed' 
    };
  }
}

export async function logout(): Promise<void> {
  try {
    console.log('🚪 Logging out user...');
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
    cookieStore.delete('refresh-token');
    console.log('✅ User logged out successfully');
  } catch (error) {
    console.error('❌ Logout error:', error);
  }
}

// Debug function to check refresh token status
export async function debugRefreshToken(): Promise<{
  hasRefreshToken: boolean;
  refreshTokenValid: boolean;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh-token');
    
    if (!refreshToken) {
      return { hasRefreshToken: false, refreshTokenValid: false };
    }

    const result = await StatelessSessionManager.refreshSession(refreshToken.value);
    
    return {
      hasRefreshToken: true,
      refreshTokenValid: !!result,
    };
  } catch (error) {
    return {
      hasRefreshToken: true,
      refreshTokenValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}