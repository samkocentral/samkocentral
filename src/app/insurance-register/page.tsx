'use client';

import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import { usePathname } from 'next/navigation';
import InsuranceRegisterClient from './components/InsuranceRegisterClient';

function InsuranceRegisterInner() {
  const pathname = usePathname();
  return (
    <AppLayout currentPath={pathname}>
      <InsuranceRegisterClient />
    </AppLayout>
  );
}

export default function InsuranceRegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground text-sm">Loading…</div>}>
      <InsuranceRegisterInner />
    </Suspense>
  );
}
