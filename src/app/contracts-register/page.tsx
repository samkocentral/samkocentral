'use client';

import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import { usePathname } from 'next/navigation';
import ContractsRegisterClient from './components/ContractsRegisterClient';

function ContractsRegisterInner() {
  const pathname = usePathname();
  return (
    <AppLayout currentPath={pathname}>
      <ContractsRegisterClient />
    </AppLayout>
  );
}

export default function ContractsRegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground text-sm">Loading…</div>}>
      <ContractsRegisterInner />
    </Suspense>
  );
}
