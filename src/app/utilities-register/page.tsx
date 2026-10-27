'use client';

import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import { usePathname, useSearchParams } from 'next/navigation';
import UtilitiesRegisterClient from './components/UtilitiesRegisterClient';

function UtilitiesRegisterInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryStr = searchParams?.toString();
  const fullPath = queryStr ? `${pathname}?${queryStr}` : pathname;

  return (
    <AppLayout currentPath={fullPath}>
      <UtilitiesRegisterClient />
    </AppLayout>
  );
}

export default function UtilitiesRegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground text-sm">Loading utilities register…</div>}>
      <UtilitiesRegisterInner />
    </Suspense>
  );
}
