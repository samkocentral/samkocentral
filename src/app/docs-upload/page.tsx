import React from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import DocumentRepositoryClient from '@/app/document-repository/components/DocumentRepositoryClient';

export const metadata = {
  title: 'Document Repository | SamkoCentral UK',
  description: 'All compliance documents across all sites — searchable, filterable, with expiry tracking.',
};

export default function DocsUploadPage() {
  return (
    <AppLayout currentPath="/document-repository">
      <Topbar
        title="Document Repository"
        subtitle="O&M manuals, warranty certificates, architectural plans & files"
      />
      <main
        className="flex-1 overflow-y-auto"
        style={{ padding: '20px 24px', background: 'var(--background)' }}
      >
        <DocumentRepositoryClient />
      </main>
    </AppLayout>
  );
}
