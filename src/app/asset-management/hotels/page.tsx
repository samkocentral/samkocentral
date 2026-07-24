'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import { usePathname } from 'next/navigation';
import HotelsClient from './components/HotelsClient';

export default function HotelsPage() {
  const pathname = usePathname();
  return (
    <AppLayout currentPath={pathname}>
      <HotelsClient />
    </AppLayout>
  );
}
