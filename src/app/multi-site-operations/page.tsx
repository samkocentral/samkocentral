import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import MultiSiteClient from './components/MultiSiteClient';

export default function MultiSiteOperationsPage() {
  return (
    <AppLayout currentPath="/multi-site-operations">
      <Topbar
        title="Multi-Site Operations"
        subtitle="Compliance health, risk levels, and manager contacts across all properties"
      />
      <main
        className="flex-1 overflow-y-auto"
        style={{ padding: '24px 28px', background: 'var(--background)' }}
      >
        <MultiSiteClient />
      </main>
    </AppLayout>
  );
}