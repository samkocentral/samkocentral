'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import { usePathname } from 'next/navigation';
import QRScannerClient from './components/QRScannerClient';

export default function QRScannerPage() {
  const pathname = usePathname();
  return (
    <AppLayout currentPath={pathname}>
      <QRScannerClient />
    </AppLayout>
  );
}
