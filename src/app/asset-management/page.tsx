'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { usePathname } from 'next/navigation';
import AssetDashboardClient from './components/AssetDashboardClient';

export default function AssetManagementPage() {
  const pathname = usePathname();
  return (
    <AppLayout currentPath={pathname}>
      <AssetDashboardClient />
    </AppLayout>
  );
}
