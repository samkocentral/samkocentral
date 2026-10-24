'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TASKS, formatDateGB } from '@/lib/mockData';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function DashboardUrgentTasks() {
  const [tasks, setTasks] = useState<any[]>(TASKS);

  const fetchLiveTasks = useCallback(async () => {
    try {
      const res = await api.tasks.getAll();
      if (res.success && res.data && res.data.length > 0) {
        setTasks(res.data);
      }
    } catch (e) {
      console.warn('Dashboard urgent tasks fetch fallback:', e);
    }
  }, []);

  useEffect(() => {
    fetchLiveTasks();
    const handleDataChanged = () => fetchLiveTasks();
    window.addEventListener('samko:data-changed', handleDataChanged);
    return () => window.removeEventListener('samko:data-changed', handleDataChanged);
  }, [fetchLiveTasks]);

  const urgentHighTasks = tasks.filter(
    (t: any) =>
      (t.priority === 'urgent' || t.priority === 'high') &&
      t.status !== 'completed'
  );

  const priorityColor: Record<string, string> = {
    urgent: 'var(--critical)',
    high: 'var(--warning)',
    medium: 'var(--info)',
    low: 'var(--text3)',
  };

  return (
    <div className="samko-card" style={{ padding: '18px 20px' }}>
      <div className="flex items-center justify-between mb-4">
        <h2
          className="font-head text-foreground"
          style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          Urgent Tasks
        </h2>
        <Link
          href="/task-manager"
          style={{ fontSize: 11, color: 'var(--primary)', textDecoration: 'none' }}
        >
          View all →
        </Link>
      </div>
      <div className="flex flex-col gap-0.5">
        {urgentHighTasks.slice(0, 6).map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 rounded-lg transition-all duration-150"
            style={{ padding: '9px 8px' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--surface2)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <span
              className="rounded-full flex-shrink-0"
              style={{
                width: 7,
                height: 7,
                background: priorityColor[task.priority] || 'var(--warning)',
                display: 'block',
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-medium truncate" style={{ fontSize: 12.5 }}>
                {task.title}
              </p>
              <p className="text-muted-foreground truncate" style={{ fontSize: 11, marginTop: 1 }}>
                {task.site || task.property || 'All Properties'}
              </p>
            </div>
            <div className="text-muted-foreground flex-shrink-0" style={{ fontSize: 11 }}>
              {task.due ? formatDateGB(task.due).split(' ').slice(0, 2).join(' ') : 'Soon'}
            </div>
          </div>
        ))}
        {urgentHighTasks.length === 0 && (
          <p className="text-xs text-muted-foreground py-4 text-center">No urgent tasks pending</p>
        )}
      </div>
    </div>
  );
}