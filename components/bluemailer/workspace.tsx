'use client';

import { ReactNode } from 'react';
import { AppSidebar } from './sidebar';
import { Header } from './header';

interface WorkspaceProps {
  children: ReactNode;
}

export function Workspace({ children }: WorkspaceProps) {
  return (
    <div className="flex">
      <AppSidebar />
      <div className="flex-1 ml-64 flex flex-col">
      <Header />
        <main className="p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
