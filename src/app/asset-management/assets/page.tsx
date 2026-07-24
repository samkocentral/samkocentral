'use client';

import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import { usePathname } from 'next/navigation';
import AssetsClient from './components/AssetsClient';

function AssetsPageInner() {
  const pathname = usePathname();
  return (
    <AppLayout currentPath={pathname}>
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
