import React from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import TasksClient from '../tasks/components/TasksClient';

export const metadata = {
  title: 'Tasks & Action List | SamkoCentral UK',
  description: 'Operational tasks and compliance action items across all properties.',
};

export default function TaskManagerPage() {
  return (
    <AppLayout currentPath="/tasks">
      <Topbar
        title="Tasks / Action List"
        subtitle="Manage, prioritize, and track property action items and statutory deadlines"
        hideDefaultActions={true}
      />
      <main
        className="flex-1 overflow-y-auto"
        style={{ padding: '20px 24px', background: 'var(--background)' }}
      >
        <TasksClient />
      </main>
    </AppLayout>
  );
}