'use client';

import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import { usePathname, useSearchParams } from 'next/navigation';
import InsuranceRegisterClient from './components/InsuranceRegisterClient';

function InsuranceRegisterInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryStr = searchParams?.toString();
  const fullPath = queryStr ? `${pathname}?${queryStr}` : pathname;

  return (
    <AppLayout currentPath={fullPath}>
      <InsuranceRegisterClient />
    </AppLayout>
  );
}

export default function InsuranceRegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground text-sm">Loading insurance register…</div>}>
      <InsuranceRegisterInner />
    </Suspense>
  );
}
