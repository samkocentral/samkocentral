import React from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import ApprovalsClient from './components/ApprovalsClient';

export const metadata = {
  title: 'Approvals Register | SamkoCentral UK',
  description:
    'Review and approve newly submitted assets, documents, and compliance records across all properties.',
};

export default function ApprovalsPage() {
  return (
    <AppLayout currentPath="/approvals">
      <Topbar
        title="Approvals Register"
        subtitle="Review, approve, or place on hold newly submitted assets, documents, and compliance items"
      />
      <main
        className="flex-1 overflow-y-auto"
        style={{ padding: '20px 24px', background: 'var(--background)' }}
      >
        <ApprovalsClient />
      </main>
    </AppLayout>
  );
}
