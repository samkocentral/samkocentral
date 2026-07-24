'use client';

import React from 'react';
import Link from 'next/link';
import { DOCUMENTS, COMPLIANCE, VENDORS } from '@/lib/mockData';
import { ASSETS, MAINTENANCE_RECORDS } from '@/lib/assetData';
import { Package, Wrench, ShieldCheck, Umbrella, FileSignature } from 'lucide-react';

export default function DashboardModulesSummary() {
  // Asset Management
  const totalAssets = ASSETS.length;
  const fixedAssets = ASSETS.filter((a) => a.isFixed).length;
  const nonFixedAssets = ASSETS.filter((a) => !a.isFixed).length;

  // Maintenance
  const scheduledMaint = MAINTENANCE_RECORDS.filter((m) => m.status === 'scheduled').length;
  const overdueMaint = MAINTENANCE_RECORDS.filter((m) => m.status === 'overdue').length;
  const completedMaint = MAINTENANCE_RECORDS.filter((m) => m.status === 'completed').length;
  const maintCompletion = Math.round((completedMaint / MAINTENANCE_RECORDS.length) * 100);

  // Compliance
  const totalCompliance = COMPLIANCE.length;
  const okCompliance = COMPLIANCE.filter((c) => c.status === 'ok').length;
  const criticalCompliance = COMPLIANCE.filter((c) => c.status === 'critical').length;
  const warningCompliance = COMPLIANCE.filter((c) => c.status === 'warning').length;

  // Insurance (from documents with Insurance category)
  const insuranceDocs = DOCUMENTS.filter((d) => d.category === 'Insurance');
  const activeInsurance = insuranceDocs.filter((d) => d.status === 'ok').length;
  const expiringInsurance = insuranceDocs.filter((d) => d.status === 'warning').length;

  // Contracts (vendors)
  const activeContracts = VENDORS.filter((v) => v.status === 'ok').length;
  const warningContracts = VENDORS.filter((v) => v.status === 'warning').length;
  const criticalContracts = VENDORS.filter((v) => v.status === 'critical').length;

  const modules = [
    {
      id: 'mod-assets',
      title: 'Asset Management',
      icon: <Package size={16} />,
      href: '/asset-management',
      color: '#60a5fa',
      bg: 'rgba(96,165,250,0.1)',
      stats: [
        { label: 'Total', value: totalAssets },
        { label: 'Fixed', value: fixedAssets },
        { label: 'Non-Fixed', value: nonFixedAssets },
      ],
      badge: null,
    },
    {
      id: 'mod-maintenance',
      title: 'Maintenance',
      icon: <Wrench size={16} />,
      href: '/asset-management/maintenance',
      color: overdueMaint > 0 ? 'var(--critical)' : 'var(--ok)',
      bg: overdueMaint > 0 ? 'var(--critical-bg)' : 'var(--ok-bg)',
      stats: [
        { label: 'Scheduled', value: scheduledMaint },
        { label: 'Overdue', value: overdueMaint },
        { label: 'Completion', value: `${maintCompletion}%` },
      ],
      badge: overdueMaint > 0 ? { label: `${overdueMaint} Overdue`, variant: 'critical' } : null,
    },
    {
      id: 'mod-compliance',
      title: 'Compliance',
      icon: <ShieldCheck size={16} />,
      href: '/compliance-register',
      color: criticalCompliance > 0 ? 'var(--critical)' : warningCompliance > 0 ? 'var(--warning)' : 'var(--ok)',
      bg: criticalCompliance > 0 ? 'var(--critical-bg)' : warningCompliance > 0 ? 'var(--warning-bg)' : 'var(--ok-bg)',
      stats: [
        { label: 'Compliant', value: okCompliance },
        { label: 'Warning', value: warningCompliance },
        { label: 'Critical', value: criticalCompliance },
      ],
      badge: criticalCompliance > 0 ? { label: `${criticalCompliance} Critical`, variant: 'critical' } : null,
    },
    {
      id: 'mod-insurance',
      title: 'Insurance',
      icon: <Umbrella size={16} />,
      href: '/insurance-register',
      color: expiringInsurance > 0 ? 'var(--warning)' : 'var(--ok)',
      bg: expiringInsurance > 0 ? 'var(--warning-bg)' : 'var(--ok-bg)',
      stats: [
        { label: 'Active', value: activeInsurance },
        { label: 'Expiring', value: expiringInsurance },
        { label: 'Total Policies', value: insuranceDocs.length },
      ],
      badge: expiringInsurance > 0 ? { label: `${expiringInsurance} Expiring`, variant: 'warning' } : null,
    },
    {
      id: 'mod-contracts',
      title: 'Contracts',
      icon: <FileSignature size={16} />,
      href: '/contracts-register',
      color: criticalContracts > 0 ? 'var(--critical)' : warningContracts > 0 ? 'var(--warning)' : 'var(--ok)',
      bg: criticalContracts > 0 ? 'var(--critical-bg)' : warningContracts > 0 ? 'var(--warning-bg)' : 'var(--ok-bg)',
      stats: [
        { label: 'Active', value: activeContracts },
        { label: 'Warning', value: warningContracts },
        { label: 'Critical', value: criticalContracts },
      ],
      badge: criticalContracts > 0 ? { label: `${criticalContracts} Critical`, variant: 'critical' } : warningContracts > 0 ? { label: `${warningContracts} Warning`, variant: 'warning' } : null,
    },
  ];

  const badgeColors: Record<string, string> = {
    critical: 'var(--critical)',
    warning: 'var(--warning)',
    ok: 'var(--ok)',
  };

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <h2
          className="font-head text-foreground"
          style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          Module Overview
        </h2>
      </div>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}
      >
        {modules.map((mod) => (
          <Link
            key={mod.id}
            href={mod.href}
            className="samko-card flex flex-col gap-3"
            style={{ padding: '16px 18px', textDecoration: 'none', borderTop: `3px solid ${mod.color}` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{ width: 30, height: 30, background: mod.bg, color: mod.color }}
                >
                  {mod.icon}
                </div>
                <span
                  className="font-head text-foreground"
                  style={{ fontSize: 12, fontWeight: 700 }}
                >
                  {mod.title}
                </span>
              </div>
              {mod.badge && (
                <span
                  className="rounded-full"
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '2px 7px',
                    background: badgeColors[mod.badge.variant] + '22',
                    color: badgeColors[mod.badge.variant],
                    border: `1px solid ${badgeColors[mod.badge.variant]}44`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {mod.badge.label}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              {mod.stats.map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span
                    className="font-head tabular-nums"
                    style={{ fontSize: 18, fontWeight: 800, color: mod.color, lineHeight: 1 }}
                  >
                    {stat.value}
                  </span>
                  <span className="text-muted-foreground" style={{ fontSize: 10, marginTop: 2 }}>
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
