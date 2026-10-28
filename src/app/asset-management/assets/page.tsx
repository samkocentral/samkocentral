'use client';

import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import { usePathname, useSearchParams } from 'next/navigation';
import AssetsClient from './components/AssetsClient';

function AssetsPageInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryStr = searchParams?.toString();
  const fullPath = queryStr ? `${pathname}?${queryStr}` : (pathname || '/asset-management/assets');
  return (
    <AppLayout currentPath={fullPath}>
      <AssetsClient />
    </AppLayout>
  );
}

export default function AssetsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground text-sm">Loading assets…</div>}>
      <AssetsPageInner />
    </Suspense>
  );
}
