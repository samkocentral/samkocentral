'use client';

import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import { usePathname } from 'next/navigation';
import ReportsClient from './components/ReportsClient';

export default function ReportsPage() {
  const pathname = usePathname();
  return (
    <AppLayout currentPath={pathname}>
      <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading reports...</div>}>
        <ReportsClient />
      </Suspense>
    </AppLayout>
  );
}
