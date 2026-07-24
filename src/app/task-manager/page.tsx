import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import TaskManagerClient from './components/TaskManagerClient';

export default function TaskManagerPage() {
  return (
    <AppLayout currentPath="/task-manager">
      <Topbar
        title="Task Manager"
        subtitle="All compliance action items — prioritised, assigned, and tracked to completion"
      />
      <main
        className="flex-1 overflow-y-auto"
        style={{ padding: '24px 28px', background: 'var(--background)' }}
      >
        <TaskManagerClient />
      </main>
    </AppLayout>
  );
}