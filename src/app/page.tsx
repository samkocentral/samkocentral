import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import DashboardKPIGrid from './components/DashboardKPIGrid';
import DashboardAlertFeed from './components/DashboardAlertFeed';
import DashboardUrgentTasks from './components/DashboardUrgentTasks';
import DashboardSiteTable from './components/DashboardSiteTable';
import DashboardComplianceChart from './components/DashboardComplianceChart';
import DashboardModulesSummary from './components/DashboardModulesSummary';

import PageCMSEditButton from '@/components/cms/PageCMSEditButton';

export default function ExecutiveDashboardPage() {
  return (
    <AppLayout currentPath="/">
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
        <div
          className="grid gap-4 mb-5"
          style={{ gridTemplateColumns: '1fr 1fr' }}
        >
          <DashboardAlertFeed />
          <DashboardUrgentTasks />
        </div>
        <DashboardSiteTable />
      </main>
    </AppLayout>
  );
}