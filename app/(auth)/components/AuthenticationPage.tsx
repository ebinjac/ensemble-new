'use client';

import EnsembleLogo from '@/components/home/logo';
import { Loader2 } from 'lucide-react';

export function AuthenticationPage() {
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="flex flex-col items-center space-y-8">
        <div className="w-24 h-24">
          <EnsembleLogo />
        </div>

        <div className="flex flex-col items-center space-y-4">
          <h1 className="text-2xl font-semibold">
            Authenticating
          </h1>
          <div className="flex items-center space-x-3 text-sm">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Verifying your credentials</span>
          </div>
        </div>
      </div>
    </div>
  );
} 