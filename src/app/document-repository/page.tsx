import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import DocumentRepositoryClient from './components/DocumentRepositoryClient';

export default function DocumentRepositoryPage() {
  return (
    <AppLayout currentPath="/document-repository">
      <Topbar
        title="Document Repository"
        subtitle="All compliance documents across all sites — searchable, filterable, with expiry tracking"
      />
      <main
        className="flex-1 overflow-y-auto"
        style={{ padding: '24px 28px', background: 'var(--background)' }}
      >
        <DocumentRepositoryClient />
      </main>
    </AppLayout>
  );
}