'use client';

import React from 'react';
import { DOCUMENTS, COMPLIANCE, TASKS, SITES } from '@/lib/mockData';
import { ASSETS, MAINTENANCE_RECORDS } from '@/lib/assetData';
import {
  AlertTriangle,
  Wrench,
  ShieldCheck,
  Building2,
  FileText,
  ClipboardList,
  Package,
  TrendingUp,
} from 'lucide-react';

export default function DashboardKPIGrid() {
  // Asset Management KPIs
  const totalAssets = ASSETS.length;
  const overdueAssets = MAINTENANCE_RECORDS.filter((m) => m.status === 'overdue').length;
  const dueTodayAssets = MAINTENANCE_RECORDS.filter((m) => m.status === 'due-today').length;
  const criticalAssets = ASSETS.filter((a) => a.riskLevel === 'critical').length;

  // Compliance KPIs
  const criticalCompliance = COMPLIANCE.filter((c) => c.status === 'critical').length;
  const warningCompliance = COMPLIANCE.filter((c) => c.status === 'warning').length;
  const avgCompliance = Math.round(
    SITES.reduce((a, s) => a + s.compliance, 0) / SITES.length
  );

  // Insurance & Contracts (from documents)
  const expiringDocs = DOCUMENTS.filter((d) => d.status === 'warning').length;
  const criticalDocs = DOCUMENTS.filter((d) => d.status === 'critical').length;

  // Tasks
  const openTasks = TASKS.filter((t) => t.status === 'open').length;
  const urgentTasks = TASKS.filter((t) => t.priority === 'urgent' && t.status === 'open').length;

  const cards = [
    {
      id: 'kpi-assets',
      label: 'Total Assets',
      value: totalAssets,
      sub: 'Across all 5 hotels',
      icon: <Package size={18} />,
      variant: 'info' as const,
      span: 1,
      link: '/asset-management',
    },
    {
      id: 'kpi-overdue',
      label: 'Overdue Maintenance',
      value: overdueAssets + dueTodayAssets,
      sub: `${overdueAssets} overdue · ${dueTodayAssets} due today`,
      icon: <Wrench size={18} />,
      variant: overdueAssets > 0 ? ('critical' as const) : ('warning' as const),
      span: 1,
      link: '/asset-management/maintenance',
    },
    {
      id: 'kpi-compliance',
      label: 'Avg Compliance Score',
      value: `${avgCompliance}%`,
      sub: `${criticalCompliance} critical · ${warningCompliance} warnings`,
      icon: <ShieldCheck size={18} />,
      variant: avgCompliance >= 85 ? ('ok' as const) : avgCompliance >= 70 ? ('warning' as const) : ('critical' as const),
      span: 1,
      link: '/compliance-register',
    },
    {
      id: 'kpi-critical',
      label: 'Critical Alerts',
      value: criticalCompliance + criticalDocs,
      sub: 'Immediate action required',
      icon: <AlertTriangle size={18} />,
      variant: 'critical' as const,
      span: 1,
      link: '/compliance-tracker',
    },
    {
      id: 'kpi-expiring',
      label: 'Expiring Documents',
      value: expiringDocs,
      sub: 'Insurance, certificates & licences',
      icon: <FileText size={18} />,
      variant: expiringDocs > 3 ? ('warning' as const) : ('ok' as const),
      span: 1,
      link: '/document-repository',
    },
    {
      id: 'kpi-tasks',
      label: 'Open Tasks',
      value: openTasks,
      sub: `${urgentTasks} urgent · across all sites`,
      icon: <ClipboardList size={18} />,
      variant: urgentTasks > 0 ? ('warning' as const) : ('info' as const),
      span: 1,
      link: '/task-manager',
    },
    {
      id: 'kpi-critical-assets',
      label: 'Critical Risk Assets',
      value: criticalAssets,
      sub: 'Require immediate attention',
      icon: <Building2 size={18} />,
      variant: criticalAssets > 0 ? ('critical' as const) : ('ok' as const),
      span: 1,
      link: '/asset-management/assets',
    },
    {
      id: 'kpi-hotels',
      label: 'Active Hotels',
      value: SITES.length,
      sub: 'All properties monitored',
      icon: <TrendingUp size={18} />,
      variant: 'ok' as const,
      span: 1,
      link: '/asset-management/hotels',
    },
  ];

  const variantColors = {
    critical: { border: 'var(--critical)', value: 'var(--critical)', bg: 'var(--critical-bg)', top: 'var(--critical)' },
    warning: { border: 'var(--warning)', value: 'var(--warning)', bg: 'var(--warning-bg)', top: 'var(--warning)' },
    ok: { border: 'var(--ok)', value: 'var(--ok)', bg: 'var(--ok-bg)', top: 'var(--ok)' },
    info: { border: 'var(--info)', value: 'var(--info)', bg: 'var(--info-bg)', top: 'var(--info)' },
  };

  return (
    <div
      className="grid mb-5"
      style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}
    >
      {cards.map((card) => {
        const colors = variantColors[card.variant];
        return (
          <a
            key={card.id}
            href={card.link}
            className="samko-card relative overflow-hidden block"
            style={{
              gridColumn: card.span > 1 ? `span ${card.span}` : undefined,
              padding: '18px 20px',
              borderTop: `3px solid ${colors.top}`,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: 34,
                  height: 34,
                  background: colors.bg,
                  color: colors.value,
                }}
              >
                {card.icon}
              </div>
              {card.id === 'kpi-critical' && (criticalCompliance + criticalDocs) > 0 && (
                <span
                  className="animate-pulse-gold rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    background: 'var(--critical)',
                    display: 'block',
                  }}
                />
              )}
            </div>
            <div
              className="font-head tabular-nums"
              style={{
                fontSize: 32,
                fontWeight: 800,
                lineHeight: 1,
                color: colors.value,
                marginBottom: 4,
              }}
            >
              {card.value}
            </div>
            <div
              className="font-head text-foreground"
              style={{ fontSize: 12, fontWeight: 700, marginBottom: 2, letterSpacing: '0.02em' }}
            >
              {card.label}
            </div>
            <div className="text-muted-foreground" style={{ fontSize: 11 }}>
              {card.sub}
            </div>
          </a>
        );
      })}
    </div>
  );
}