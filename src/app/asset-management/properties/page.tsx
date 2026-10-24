'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import { usePathname } from 'next/navigation';
import PropertiesClient from './components/PropertiesClient';

export default function PropertiesPage() {
  const pathname = usePathname();
  return (
    <AppLayout currentPath={pathname}>
      <PropertiesClient />
    </AppLayout>
  );
}
