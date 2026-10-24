'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import { usePathname } from 'next/navigation';
import PropertiesClient from '../properties/components/PropertiesClient';

export default function HotelsPage() {
  const pathname = usePathname();
  return (
    <AppLayout currentPath={pathname}>
      <PropertiesClient />
    </AppLayout>
  );
}
