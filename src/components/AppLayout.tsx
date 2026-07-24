'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
}

export default function AppLayout({ children, currentPath }: AppLayoutProps) {
  const pathname = usePathname();
  const resolvedPath = currentPath ?? pathname ?? '/';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar currentPath={resolvedPath} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {children}
      </div>
    </div>
  );
}