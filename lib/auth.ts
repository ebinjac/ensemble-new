import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import type { SSOUser, JWTPayload } from '@/app/types/auth';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-development-secret'
);

export type AuthUser = {
  user: JWTPayload | null;
  isAuthenticated: boolean;
};

/**
 * Gets the authenticated user from the JWT token
 * @param redirectOnFailure - Whether to redirect to home page on auth failure
 * @returns The authenticated user or null
 */
export async function getServerUser(redirectOnFailure = true): Promise<AuthUser> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
      if (redirectOnFailure) redirect('/');
      return { user: null, isAuthenticated: false };
    }

    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    const user = payload as unknown as JWTPayload;

    return {
      user,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error('Auth error:', error);
    if (redirectOnFailure) redirect('/');
    return { user: null, isAuthenticated: false };
  }
}

/**
 * Middleware to ensure user is authenticated
 * Redirects to home page if not authenticated
 */
export async function requireAuth(): Promise<JWTPayload> {
  const { user, isAuthenticated } = await getServerUser(true);
  
  if (!isAuthenticated || !user) {
    redirect('/');
  }

  return user;
}

/**
 * Check if user is authenticated without redirecting
 * Useful for conditional rendering based on auth status
 */
export async function checkAuth(): Promise<boolean> {
  const { isAuthenticated } = await getServerUser(false);
  return isAuthenticated;
} 