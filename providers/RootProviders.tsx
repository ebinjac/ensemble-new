'use client';

import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/app/(auth)/providers/AuthProvider';
import { AuthErrorBoundary } from '@/app/(auth)/components/AuthErrorBoundary';
import { Suspense } from 'react';

// ✅ Enhanced: Added error boundary
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthErrorBoundary>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          </div>
        }>
          <AuthProvider>
            {children}
          </AuthProvider>
        </Suspense>
      </AuthErrorBoundary>
    </ThemeProvider>
  );
}
