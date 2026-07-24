'use client';

import React from 'react';
import { TASKS, formatDateGB } from '@/lib/mockData';
import Link from 'next/link';

export default function DashboardUrgentTasks() {
  const urgentHighTasks = TASKS.filter(
    (t) => t.priority === 'urgent' || t.priority === 'high'
  );

  const priorityColor = {
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
        {urgentHighTasks.map((task, i) => (
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
                background: priorityColor[task.priority],
                display: 'block',
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-medium truncate" style={{ fontSize: 12.5 }}>
                {task.title}
              </p>
              <p className="text-muted-foreground truncate" style={{ fontSize: 11, marginTop: 1 }}>
                {task.site}
              </p>
            </div>
            <div className="text-muted-foreground flex-shrink-0" style={{ fontSize: 11 }}>
              {formatDateGB(task.due).split(' ').slice(0, 2).join(' ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}