'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import { usePathname } from 'next/navigation';
import ImportClient from './components/ImportClient';

export default function ImportPage() {
  const pathname = usePathname();
  return (
    <AppLayout currentPath={pathname}>
      <ImportClient />
    </AppLayout>
  );
}
