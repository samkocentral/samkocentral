import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import ComplianceTrackerClient from './components/ComplianceTrackerClient';

export default function ComplianceTrackerPage() {
  return (
    <AppLayout currentPath="/compliance-tracker">
      <Topbar
        title="Compliance Tracker"
        subtitle="Traffic-light view of all compliance obligations — overdue, due soon, and compliant"
      />
      <main
        className="flex-1 overflow-y-auto"
        style={{ padding: '24px 28px', background: 'var(--background)' }}
      >
        <ComplianceTrackerClient />
      </main>
    </AppLayout>
  );
}