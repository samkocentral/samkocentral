'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import { usePathname } from 'next/navigation';
import CategoriesClient from './components/CategoriesClient';

export default function CategoriesPage() {
  const pathname = usePathname();
  return (
    <AppLayout currentPath={pathname}>
      <CategoriesClient />
    </AppLayout>
  );
}
