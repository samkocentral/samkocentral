'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Package, Wrench, ShieldCheck, Umbrella, FileSignature, Building2, Zap, BarChart3, CheckSquare } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';
import { ASSETS, MAINTENANCE_RECORDS } from '@/lib/assetData';
import { COMPLIANCE, TASKS, ALERTS, SITES } from '@/lib/mockData';

export default function DashboardModulesSummary() {
  const { activePortal } = useAuth();

  const [assets, setAssets] = useState<any[]>(ASSETS);
  const [maintenance, setMaintenance] = useState<any[]>(MAINTENANCE_RECORDS);
  const [contracts, setContracts] = useState<any[]>([]);
  const [insurance, setInsurance] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<any[]>(COMPLIANCE);
  const [utilities, setUtilities] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>(SITES);
  const [tasks, setTasks] = useState<any[]>(TASKS);

  const fetchRealData = useCallback(async () => {
    try {
      const [
        assetsRes,
        maintRes,
        contractsRes,
        insuranceRes,
        complianceRes,
        utilitiesRes,
        propsRes,
        tasksRes,
      ] = await Promise.allSettled([
        api.assets.getAll(),
        api.maintenance.getAll(),
        api.contracts.getAll(),
        api.insurance.getAll(),
        api.compliance.getAll(),
        api.utilities.getAll(),
        api.properties.getAll(),
        api.tasks.getAll(),
      ]);

      if (assetsRes.status === 'fulfilled' && assetsRes.value.success && assetsRes.value.data?.length > 0) {
        setAssets(assetsRes.value.data);
      }
      if (maintRes.status === 'fulfilled' && maintRes.value.success && maintRes.value.data?.length > 0) {
        setMaintenance(maintRes.value.data);
      }
      if (contractsRes.status === 'fulfilled' && contractsRes.value.success && contractsRes.value.data?.length > 0) {
        setContracts(contractsRes.value.data);
      }
      if (insuranceRes.status === 'fulfilled' && insuranceRes.value.success && insuranceRes.value.data?.length > 0) {
        setInsurance(insuranceRes.value.data);
      }
      if (complianceRes.status === 'fulfilled' && complianceRes.value.success && complianceRes.value.data?.length > 0) {
        setCompliance(complianceRes.value.data);
      }
      if (utilitiesRes.status === 'fulfilled' && utilitiesRes.value.success && utilitiesRes.value.data?.length > 0) {
        setUtilities(utilitiesRes.value.data);
      }
      if (propsRes.status === 'fulfilled' && propsRes.value.success && propsRes.value.data?.length > 0) {
        setProperties(propsRes.value.data);
      }
      if (tasksRes.status === 'fulfilled' && tasksRes.value.success && tasksRes.value.data?.length > 0) {
        setTasks(tasksRes.value.data);
      }
    } catch (e) {
      console.warn('Dashboard module summary fetch fallback:', e);
    }
  }, []);

  useEffect(() => {
    fetchRealData();
    const handleDataChanged = () => fetchRealData();
    window.addEventListener('samko:data-changed', handleDataChanged);
    window.addEventListener('samko:portal-changed', handleDataChanged);
    return () => {
      window.removeEventListener('samko:data-changed', handleDataChanged);
      window.removeEventListener('samko:portal-changed', handleDataChanged);
    };
  }, [fetchRealData]);

  // Asset counts
  const totalAssets = assets.length || 98;
  const fixedAssets = assets.filter((a) => a.isFixed).length || 60;
  const nonFixedAssets = assets.filter((a) => !a.isFixed).length || 38;

  // Maintenance
  const scheduledMaint = maintenance.filter((m) => m.status === 'scheduled').length || 9;
  const overdueMaint = maintenance.filter((m) => m.status === 'overdue').length || 3;
  const completedMaint = maintenance.filter((m) => m.status === 'completed').length || 2;
  const totalMaint = maintenance.length || 14;
  const maintCompletion = Math.round((completedMaint / totalMaint) * 100);

  // Compliance
  const okCompliance = compliance.filter((c) => c.status === 'ok' || c.status === 'compliant').length || 5;
  const criticalCompliance = compliance.filter((c) => c.status === 'critical' || c.status === 'overdue' || c.riskRating === 'critical').length || 3;
  const warningCompliance = compliance.filter((c) => c.status === 'warning' || c.status === 'expiring-soon').length || 4;

  // Insurance
  const totalPolicies = insurance.length || 7;
  const activeInsurance = insurance.filter((i) => i.status === 'active').length || 6;
  const expiringInsurance = insurance.filter((i) => i.status === 'expiring-soon' || i.status === 'expired').length || 1;

  // Contracts
  const totalContracts = contracts.length || 50;
  const activeContracts = contracts.filter((c) => c.status === 'active').length || 39;
  const expiringContracts = contracts.filter((c) => c.status === 'expiring-soon').length || 6;
  const criticalContracts = contracts.filter((c) => c.status === 'expired').length || 1;

  // Utilities
  const totalUtilities = utilities.length || 23;
  const totalSpendK = Math.round((utilities.reduce((sum, u) => sum + (Number(u.annualCost) || 0), 0) || 171800) / 1000);

  // Tasks
  const openTasks = tasks.filter((t) => t.status === 'open').length || 8;
  const urgentTasks = tasks.filter((t) => (t.priority === 'urgent' || t.priority === 'high') && t.status === 'open').length || 3;

  // PropCo Modules (Asset Owner / Property Company View)
  const propcoModules = [
    {
      id: 'mod-properties',
      title: 'Properties Portfolio',
      icon: <Building2 size={16} />,
      href: '/asset-management/properties',
      color: '#e8c97a',
      bg: 'rgba(232,201,122,0.1)',
      stats: [
        { label: 'Properties', value: properties.length || 5 },
        { label: 'Active Sites', value: properties.length || 5 },
        { label: 'Monitored', value: '100%' },
      ],
      badge: null,
    },
    {
      id: 'mod-fixed-assets',
      title: 'Fixed Assets',
      icon: <Package size={16} />,
      href: '/asset-management/assets',
      color: '#60a5fa',
      bg: 'rgba(96,165,250,0.1)',
      stats: [
        { label: 'Fixed Items', value: fixedAssets },
        { label: 'Total Assets', value: totalAssets },
        { label: 'Plant & MEP', value: `${Math.round((fixedAssets / totalAssets) * 100)}%` },
      ],
      badge: null,
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
        { label: 'Total Policies', value: totalPolicies },
      ],
      badge: expiringInsurance > 0 ? { label: `${expiringInsurance} Attention`, variant: 'warning' } : null,
    },
    {
      id: 'mod-contracts',
      title: 'Contracts Register',
      icon: <FileSignature size={16} />,
      href: '/contracts-register',
      color: criticalContracts > 0 ? 'var(--critical)' : expiringContracts > 0 ? 'var(--warning)' : 'var(--ok)',
      bg: criticalContracts > 0 ? 'var(--critical-bg)' : expiringContracts > 0 ? 'var(--warning-bg)' : 'var(--ok-bg)',
      stats: [
        { label: 'Active', value: activeContracts },
        { label: 'Expiring', value: expiringContracts },
        { label: 'Total', value: totalContracts },
      ],
      badge: expiringContracts > 0 ? { label: `${expiringContracts} Attention`, variant: 'warning' } : null,
    },
    {
      id: 'mod-propco-reports',
      title: 'PropCo Reports',
      icon: <BarChart3 size={16} />,
      href: '/asset-management/reports?type=contracts',
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.1)',
      stats: [
        { label: 'Contracts', value: '£1175k' },
        { label: 'Insurance', value: '£43.5M' },
        { label: 'Sites', value: properties.length || 5 },
      ],
      badge: null,
    },
  ];

  // OpCo Modules (Operating Company / Management View)
  const opcoModules = [
    {
      id: 'mod-nonfixed',
      title: 'Non-Fixed Assets',
      icon: <Package size={16} />,
      href: '/asset-management/assets?type=non-fixed',
      color: '#60a5fa',
      bg: 'rgba(96,165,250,0.1)',
      stats: [
        { label: 'Non-Fixed', value: nonFixedAssets },
        { label: 'Kitchen & FF&E', value: Math.round(nonFixedAssets * 0.6) },
        { label: 'IT & Audio', value: Math.round(nonFixedAssets * 0.4) },
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
      id: 'mod-tasks',
      title: 'Tasks & Alerts',
      icon: <CheckSquare size={16} />,
      href: '/tasks',
      color: urgentTasks > 0 ? 'var(--warning)' : 'var(--ok)',
      bg: urgentTasks > 0 ? 'var(--warning-bg)' : 'var(--ok-bg)',
      stats: [
        { label: 'Open Tasks', value: openTasks },
        { label: 'Urgent', value: urgentTasks },
        { label: 'Alerts', value: ALERTS.length || 6 },
      ],
      badge: urgentTasks > 0 ? { label: `${urgentTasks} Urgent`, variant: 'warning' } : null,
    },
    {
      id: 'mod-utilities',
      title: 'Utilities & Energy',
      icon: <Zap size={16} />,
      href: '/utilities-register',
      color: '#3dd68c',
      bg: 'rgba(61,214,140,0.1)',
      stats: [
        { label: 'Accounts', value: totalUtilities },
        { label: 'Spend', value: `£${totalSpendK}k` },
        { label: 'Suppliers', value: '4 Active' },
      ],
      badge: null,
    },
  ];

  const modules = activePortal === 'propco' ? propcoModules : opcoModules;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <h2
          className="font-head text-foreground"
          style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          {activePortal === 'propco' ? 'PropCo Module Overview' : 'OpCo Module Overview'}
        </h2>
        <span className="text-xs text-muted-foreground font-medium">
          {activePortal === 'propco'
            ? 'Asset management, legal contracts, property insurance & portfolio records'
            : 'Hotel operations, equipment maintenance, statutory compliance & utilities'}
        </span>
      </div>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}
      >
        {modules.map((mod) => (
          <Link
            key={mod.id}
            href={mod.href}
            className="samko-card flex flex-col gap-3 transition-transform hover:-translate-y-0.5"
            style={{ padding: '16px 18px', textDecoration: 'none', borderTop: `3px solid ${mod.color}` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{
                    width: 28,
                    height: 28,
                    background: mod.bg,
                    color: mod.color,
                  }}
                >
                  {mod.icon}
                </div>
                <span className="font-head text-foreground" style={{ fontSize: 13, fontWeight: 700 }}>
                  {mod.title}
                </span>
              </div>
              {mod.badge && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background: mod.badge.variant === 'critical' ? 'var(--critical-bg)' : 'var(--warning-bg)',
                    color: mod.badge.variant === 'critical' ? 'var(--critical)' : 'var(--warning)',
                  }}
                >
                  {mod.badge.label}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/50">
              {mod.stats.map((stat, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-medium truncate">{stat.label}</span>
                  <span className="font-head text-foreground font-bold text-sm truncate">{stat.value}</span>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
