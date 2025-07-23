// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { StatelessSessionManager } from '@/app/(auth)/lib/token';

export async function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth-token');
  
  if (authToken) {
    try {
      const sessionData = await StatelessSessionManager.verifySession(authToken.value);
      
      if (sessionData) {
        // Check if token needs refresh (e.g., less than 5 minutes remaining)
        const tokenAge = Date.now() - sessionData.lastActivity;
        const shouldRefresh = tokenAge > 10 * 60 * 1000; // 10 minutes
        
        if (shouldRefresh) {
          const updatedToken = await StatelessSessionManager.updateSession(authToken.value, {
            lastActivity: Date.now()
          });
          
          if (updatedToken) {
            const response = NextResponse.next();
            response.cookies.set('auth-token', updatedToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              path: '/',
              maxAge: 15 * 60,
            });
            return response;
          }
        }
      }
    } catch (error) {
      console.error('Middleware auth error:', error);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
