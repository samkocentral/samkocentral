'use client';

import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { usePathname, useSearchParams } from 'next/navigation';
import AcquisitionClient from './components/AcquisitionClient';

function AcquisitionPageInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryStr = searchParams?.toString();
  const fullPath = queryStr ? `${pathname}?${queryStr}` : pathname || '/acquisition';

  return (
    <AppLayout currentPath={fullPath}>
      <Topbar
        title="Acquisition & Deals"
        subtitle="Hierarchical due diligence repository, surveys, title deeds, and financial valuation models"
      />
      <main
        className="flex-1 overflow-y-auto"
        style={{ padding: '20px 24px', background: 'var(--background)' }}
      >
        <AcquisitionClient />
      </main>
    </AppLayout>
  );
}

export default function AcquisitionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen text-muted-foreground text-sm">
          Loading acquisition…
        </div>
      }
    >
      <AcquisitionPageInner />
    </Suspense>
  );
}

