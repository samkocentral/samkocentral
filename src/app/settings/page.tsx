'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import { usePathname } from 'next/navigation';
import SettingsClient from './components/SettingsClient';

export default function SettingsPage() {
  const pathname = usePathname();
  return (
    <AppLayout currentPath={pathname}>
      <SettingsClient />
    </AppLayout>
  );
}
