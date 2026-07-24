'use client';

import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import { usePathname } from 'next/navigation';
import ComplianceRegisterClient from './components/ComplianceRegisterClient';

function ComplianceRegisterInner() {
  const pathname = usePathname();
  return (
    <AppLayout currentPath={pathname}>
      <ComplianceRegisterClient />
    </AppLayout>
  );
}

export default function ComplianceRegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground text-sm">Loading…</div>}>
      <ComplianceRegisterInner />
    </Suspense>
  );
}
