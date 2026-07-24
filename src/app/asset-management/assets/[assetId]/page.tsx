'use client';

import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import { usePathname } from 'next/navigation';
import AssetDetailClient from './components/AssetDetailClient';
import { use } from 'react';

interface Props {
  params: Promise<{ assetId: string }>;
}

function AssetDetailInner({ params }: Props) {
  const pathname = usePathname();
  const { assetId } = use(params);
  return (
    <AppLayout currentPath={pathname}>
      <AssetDetailClient assetId={assetId} />
    </AppLayout>
  );
}

export default function AssetDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground text-sm">Loading asset…</div>}>
      <AssetDetailInner params={params} />
    </Suspense>
  );
}
