'use client';

import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import DashboardKPIGrid from './components/DashboardKPIGrid';
import DashboardAlertFeed from './components/DashboardAlertFeed';
import DashboardUrgentTasks from './components/DashboardUrgentTasks';
import DashboardBotAuditFeed from './components/DashboardBotAuditFeed';
import DashboardSiteTable from './components/DashboardSiteTable';
import DashboardComplianceChart from './components/DashboardComplianceChart';
import DashboardModulesSummary from './components/DashboardModulesSummary';
import PageCMSEditButton from '@/components/cms/PageCMSEditButton';
import { usePathname, useSearchParams } from 'next/navigation';

function ExecutiveDashboardInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryStr = searchParams?.toString();
  const fullPath = queryStr ? `${pathname}?${queryStr}` : (pathname || '/');

  return (
    <AppLayout currentPath={fullPath}>
      <Topbar
        title="Executive Dashboard"
        subtitle="Group-wide facilities overview — 5 Hotels · Asset Management · Maintenance · Compliance · Insurance · Contracts"
        actions={<PageCMSEditButton pageId="overview" pageName="Executive Dashboard" />}
      />
      <main
        className="flex-1 overflow-y-auto"
        style={{ padding: '24px 28px', background: 'var(--background)' }}
      >
        <DashboardKPIGrid />
        <DashboardModulesSummary />
        <DashboardComplianceChart />
        <div className="grid gap-4 mb-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          <DashboardAlertFeed />
          <DashboardUrgentTasks />
          <DashboardBotAuditFeed />
        </div>
        <DashboardSiteTable />
      </main>
    </AppLayout>
  );
}

export default function ExecutiveDashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground text-sm">Loading dashboard…</div>}>
      <ExecutiveDashboardInner />
    </Suspense>
  );
}