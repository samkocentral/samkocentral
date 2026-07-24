'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import { usePathname } from 'next/navigation';
import UsersClient from './components/UsersClient';

export default function UsersPage() {
  const pathname = usePathname();
  return (
    <AppLayout currentPath={pathname}>
      <UsersClient />
    </AppLayout>
  );
}
