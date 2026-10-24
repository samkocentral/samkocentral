'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ALERTS } from '@/lib/mockData';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function DashboardAlertFeed() {
  const [alerts, setAlerts] = useState<any[]>(ALERTS);

  const fetchLiveAlerts = useCallback(async () => {
    try {
      const [maintRes, compRes] = await Promise.allSettled([
        api.maintenance.getAll(),
        api.compliance.getAll(),
      ]);

      const liveAlerts: any[] = [];

      if (maintRes.status === 'fulfilled' && maintRes.value.success) {
        const overdues = maintRes.value.data.filter((m: any) => m.status === 'overdue');
        overdues.slice(0, 3).forEach((m: any) => {
          liveAlerts.push({
            id: `alert-m-${m.id}`,
            type: 'critical',
            message: `Overdue maintenance: ${m.title || m.assetName} at ${m.hotelName || m.property || 'Site'}`,
            time: 'Action required',
          });
        });
      }

      if (compRes.status === 'fulfilled' && compRes.value.success) {
        const expiringComp = compRes.value.data.filter((c: any) => c.status === 'overdue' || c.status === 'critical' || c.status === 'expiring-soon');
        expiringComp.slice(0, 3).forEach((c: any) => {
          liveAlerts.push({
            id: `alert-c-${c.id}`,
            type: c.status === 'overdue' || c.status === 'critical' ? 'critical' : 'warning',
            message: `Compliance warning: ${c.name || c.item} at ${c.property || c.hotel || 'Property'}`,
            time: c.expiryDate ? `Expires ${c.expiryDate}` : 'Due soon',
          });
        });
      }

      if (liveAlerts.length > 0) {
        setAlerts(liveAlerts);
      }
    } catch (e) {
      console.warn('Live alerts fetch fallback:', e);
    }
  }, []);

  useEffect(() => {
    fetchLiveAlerts();
    const handleDataChanged = () => fetchLiveAlerts();
    window.addEventListener('samko:data-changed', handleDataChanged);
    return () => window.removeEventListener('samko:data-changed', handleDataChanged);
  }, [fetchLiveAlerts]);

  const iconMap: Record<string, React.ReactNode> = {
    critical: <AlertCircle size={14} style={{ color: 'var(--critical)' }} />,
    warning: <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />,
    info: <Info size={14} style={{ color: 'var(--info)' }} />,
  };

  const bgMap: Record<string, string> = {
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
        {alerts.slice(0, 5).map((alert, i) => (
          <div
            key={alert.id}
            className="flex items-start gap-3"
            style={{
              padding: '10px 0',
              borderBottom: i < Math.min(alerts.length, 5) - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div
              className="flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"
              style={{
                width: 28,
                height: 28,
                background: bgMap[alert.type] || 'var(--surface3)',
              }}
            >
              {iconMap[alert.type] || <Info size={14} style={{ color: 'var(--info)' }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-foreground font-medium"
                style={{ fontSize: 12.5, lineHeight: 1.4 }}
              >
                {alert.message}
              </p>
              <p className="text-muted-foreground" style={{ fontSize: 11, marginTop: 2 }}>
                {alert.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}