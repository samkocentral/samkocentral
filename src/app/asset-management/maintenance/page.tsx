'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import { usePathname } from 'next/navigation';
import MaintenanceClient from './components/MaintenanceClient';

export default function MaintenancePage() {
  const pathname = usePathname();
  return (
    <AppLayout currentPath={pathname}>
      <MaintenanceClient />
    </AppLayout>
  );
}
