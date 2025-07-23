// app/providers/Providers.tsx
'use client';

import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/app/(auth)/providers/AuthProvider';
import { Suspense } from 'react';
import { AuthenticationPage } from '@/app/(auth)/components/AuthenticationPage';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Suspense fallback={<AuthenticationPage />}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </Suspense>
    </ThemeProvider>
  );
}
