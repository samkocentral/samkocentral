import React from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import RecentLogsClient from './components/RecentLogsClient';

export const metadata = {
  title: 'Recent Logs | SamkoCentral UK',
  description: 'Audit trail and activity log of all user operations, compliance inspections, and asset changes.',
};

export default function RecentLogsPage() {
  return (
    <AppLayout currentPath="/recent-logs">
      <Topbar
        title="Recent Logs"
        subtitle="Live audit trail and historical logs across all properties, users, and compliance operations"
      />
      <main
        className="flex-1 overflow-y-auto"
        style={{ padding: '20px 24px', background: 'var(--background)' }}
      >
        <RecentLogsClient />
      </main>
    </AppLayout>
  );
}
