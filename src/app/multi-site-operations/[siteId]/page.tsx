import React from 'react';
import { notFound } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import SiteDetailClient from './components/SiteDetailClient';
import { SITES } from '@/lib/mockData';

interface PageProps {
  params: Promise<{ siteId: string }>;
}

export default async function SiteDetailPage({ params }: PageProps) {
  const { siteId } = await params;
  const site = SITES.find((s) => s.id === siteId);
  if (!site) notFound();

  return (
    <AppLayout currentPath="/multi-site-operations">
      <SiteDetailClient siteId={siteId} />
    </AppLayout>
  );
}

export async function generateStaticParams() {
  return SITES.map((s) => ({ siteId: s.id }));
}
