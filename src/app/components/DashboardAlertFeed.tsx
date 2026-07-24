import React from 'react';
import { ALERTS } from '@/lib/mockData';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import Link from 'next/link';

export default function DashboardAlertFeed() {
  const iconMap = {
    critical: <AlertCircle size={14} style={{ color: 'var(--critical)' }} />,
    warning: <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />,
    info: <Info size={14} style={{ color: 'var(--info)' }} />,
  };

  const bgMap = {
    critical: 'var(--critical-bg)',
    warning: 'var(--warning-bg)',
    info: 'var(--info-bg)',
  };

  return (
    <div className="samko-card" style={{ padding: '18px 20px' }}>
      <div className="flex items-center justify-between mb-4">
        <h2
          className="font-head text-foreground"
          style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          Live Alerts
        </h2>
        <Link
          href="/compliance-tracker"
          style={{ fontSize: 11, color: 'var(--primary)', textDecoration: 'none' }}
        >
          View all →
        </Link>
      </div>
      <div className="flex flex-col">
        {ALERTS?.map((alert, i) => (
          <div
            key={alert?.id}
            className="flex items-start gap-3"
            style={{
              padding: '10px 0',
              borderBottom: i < ALERTS?.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div
              className="flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"
              style={{
                width: 28,
                height: 28,
                background: bgMap?.[alert?.type],
              }}
            >
              {iconMap?.[alert?.type]}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-foreground font-medium"
                style={{ fontSize: 12.5, lineHeight: 1.4 }}
              >
                {alert?.message}
              </p>
              <p className="text-muted-foreground" style={{ fontSize: 11, marginTop: 2 }}>
                {alert?.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}