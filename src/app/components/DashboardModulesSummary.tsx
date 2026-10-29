'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Package, Wrench, ShieldCheck, Umbrella, FileSignature, Building2, Zap, BarChart3, CheckSquare } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';
import { ASSETS, MAINTENANCE_RECORDS } from '@/lib/assetData';
import { COMPLIANCE, TASKS, SITES } from '@/lib/mockData';
import { getNotifications } from '@/lib/notifications';
import { useDeepPageCms } from '@/lib/deepPageCms';

export default function DashboardModulesSummary() {
  const { activePortal } = useAuth();
  const cms = useDeepPageCms('overview');

  const [assets, setAssets] = useState<any[]>(ASSETS);
  const [maintenance, setMaintenance] = useState<any[]>(MAINTENANCE_RECORDS);
  const [contracts, setContracts] = useState<any[]>([]);
  const [insurance, setInsurance] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<any[]>(COMPLIANCE);
  const [utilities, setUtilities] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>(SITES);
  const [tasks, setTasks] = useState<any[]>(TASKS);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const syncNotifs = () => setNotifications(getNotifications());
    syncNotifs();
    window.addEventListener('samko:notifications-updated', syncNotifs);
    return () => window.removeEventListener('samko:notifications-updated', syncNotifs);
  }, []);

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

  // Dynamic Asset counts
  const totalAssets = assets.length;
  const fixedAssets = assets.filter((a) => a.isFixed).length;
  const nonFixedAssets = assets.filter((a) => !a.isFixed).length;

  // Dynamic Maintenance
  const scheduledMaint = maintenance.filter((m) => m.status === 'scheduled').length;
  const overdueMaint = maintenance.filter((m) => m.status === 'overdue').length;
  const completedMaint = maintenance.filter((m) => m.status === 'completed').length;
  const totalMaint = maintenance.length;
  const maintCompletion = totalMaint > 0 ? Math.round((completedMaint / totalMaint) * 100) : 100;

  // Dynamic Compliance
  const okCompliance = compliance.filter((c) => c.status === 'ok' || c.status === 'compliant').length;
  const criticalCompliance = compliance.filter((c) => c.status === 'critical' || c.status === 'overdue' || c.riskRating === 'critical').length;
  const warningCompliance = compliance.filter((c) => c.status === 'warning' || c.status === 'expiring-soon').length;

  // Dynamic Insurance
  const totalPolicies = insurance.length;
  const activeInsurance = insurance.filter((i) => i.status === 'active').length;
  const expiringInsurance = insurance.filter((i) => i.status === 'expiring-soon' || i.status === 'expired').length;

  // Dynamic Contracts
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter((c) => c.status === 'active').length;
  const expiringContracts = contracts.filter((c) => c.status === 'expiring-soon').length;
  const criticalContracts = contracts.filter((c) => c.status === 'expired').length;

  // Dynamic Utilities
  const totalUtilities = utilities.length;
  const totalSpendK = Math.round(utilities.reduce((sum, u) => sum + (Number(u.annualCost) || 0), 0) / 1000);

  // Dynamic Tasks & Dynamic Alarms
  const openTasks = tasks.filter((t) => t.status === 'open' || t.status === 'pending' || !t.status || t.status === 'in-progress').length;
  const urgentTasks = tasks.filter((t) => (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'completed').length;
  const liveNotifs = notifications.length > 0 ? notifications : (typeof window !== 'undefined' ? getNotifications() : []);
  const totalAlerts = liveNotifs.length;

  const propcoKpiMap = new Map((cms.propcoKpis || []).map((k) => [k.id, k]));

  // PropCo Modules (Asset Owner / Property Company View)
  const propcoModules = [
    {
      id: 'mod-properties',
      title: propcoKpiMap.get('mod-properties')?.label || 'Properties Portfolio',
      icon: <Building2 size={16} />,
      href: '/asset-management/properties',
      color: propcoKpiMap.get('mod-properties')?.color || '#e8c97a',
      bg: 'rgba(232,201,122,0.1)',
      stats: [
        { label: 'Properties', value: properties.length || 5 },
        { label: 'Active Sites', value: properties.length || 5 },
        { label: 'Monitored', value: '100%' },
      ],
      badge: null,
      enabled: propcoKpiMap.get('mod-properties')?.enabled !== false,
    },
    {
      id: 'mod-fixed-assets',
      title: propcoKpiMap.get('mod-fixed-assets')?.label || 'Fixed Assets',
      icon: <Package size={16} />,
      href: '/asset-management/assets',
      color: propcoKpiMap.get('mod-fixed-assets')?.color || '#60a5fa',
      bg: 'rgba(96,165,250,0.1)',
      stats: [
        { label: 'Fixed Items', value: fixedAssets },
        { label: 'Total Assets', value: totalAssets },
        { label: 'Plant & MEP', value: `${Math.round((fixedAssets / totalAssets) * 100)}%` },
      ],
      badge: null,
      enabled: propcoKpiMap.get('mod-fixed-assets')?.enabled !== false,
    },
    {
      id: 'mod-insurance',
      title: propcoKpiMap.get('mod-insurance')?.label || 'Insurance',
      icon: <Umbrella size={16} />,
      href: '/insurance-register',
      color: propcoKpiMap.get('mod-insurance')?.color || (expiringInsurance > 0 ? 'var(--warning)' : 'var(--ok)'),
      bg: expiringInsurance > 0 ? 'var(--warning-bg)' : 'var(--ok-bg)',
      stats: [
        { label: 'Active', value: activeInsurance },
        { label: 'Expiring', value: expiringInsurance },
        { label: 'Total Policies', value: totalPolicies },
      ],
      badge: expiringInsurance > 0 ? { label: `${expiringInsurance} Attention`, variant: 'warning' } : null,
      enabled: propcoKpiMap.get('mod-insurance')?.enabled !== false,
    },
    {
      id: 'mod-contracts',
      title: propcoKpiMap.get('mod-contracts')?.label || 'Contracts Register',
      icon: <FileSignature size={16} />,
      href: '/contracts-register',
      color: propcoKpiMap.get('mod-contracts')?.color || (criticalContracts > 0 ? 'var(--critical)' : expiringContracts > 0 ? 'var(--warning)' : 'var(--ok)'),
      bg: criticalContracts > 0 ? 'var(--critical-bg)' : expiringContracts > 0 ? 'var(--warning-bg)' : 'var(--ok-bg)',
      stats: [
        { label: 'Active', value: activeContracts },
        { label: 'Expiring', value: expiringContracts },
        { label: 'Total', value: totalContracts },
      ],
      badge: expiringContracts > 0 ? { label: `${expiringContracts} Attention`, variant: 'warning' } : null,
      enabled: propcoKpiMap.get('mod-contracts')?.enabled !== false,
    },
    {
      id: 'mod-reports',
      title: propcoKpiMap.get('mod-reports')?.label || 'PropCo Reports',
      icon: <BarChart3 size={16} />,
      href: '/asset-management/reports?type=contracts',
      color: propcoKpiMap.get('mod-reports')?.color || '#a78bfa',
      bg: 'rgba(167,139,250,0.1)',
      stats: [
        { label: 'Contracts', value: '£1175k' },
        { label: 'Insurance', value: '£43.5M' },
        { label: 'Sites', value: properties.length || 5 },
      ],
      badge: null,
      enabled: propcoKpiMap.get('mod-reports')?.enabled !== false,
    },
  ];

  const kpiMap = new Map((cms.kpis || []).map((k) => [k.id, k]));

  // OpCo Modules (Operating Company / Management View)
  const opcoModules = [
    {
      id: 'mod-nonfixed',
      title: kpiMap.get('ov-kpi-1')?.label || 'Non-Fixed Assets',
      icon: <Package size={16} />,
      href: '/asset-management/assets?type=non-fixed',
      color: kpiMap.get('ov-kpi-1')?.color || '#60a5fa',
      bg: 'rgba(96,165,250,0.1)',
      stats: [
        { label: 'Non-Fixed', value: kpiMap.get('ov-kpi-1')?.value || nonFixedAssets },
        { label: 'Kitchen & FF&E', value: Math.round(nonFixedAssets * 0.6) },
        { label: 'IT & Audio', value: Math.round(nonFixedAssets * 0.4) },
      ],
      badge: null,
      enabled: kpiMap.get('ov-kpi-1')?.enabled !== false,
    },
    {
      id: 'mod-maintenance',
      title: kpiMap.get('ov-kpi-2')?.label || 'Maintenance',
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
      enabled: kpiMap.get('ov-kpi-2')?.enabled !== false,
    },
    {
      id: 'mod-compliance',
      title: kpiMap.get('ov-kpi-3')?.label || 'Compliance',
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
      enabled: kpiMap.get('ov-kpi-3')?.enabled !== false,
    },
    {
      id: 'mod-tasks',
      title: kpiMap.get('ov-kpi-4')?.label || 'Tasks & Alerts',
      icon: <CheckSquare size={16} />,
      href: '/tasks',
      color: urgentTasks > 0 ? 'var(--warning)' : 'var(--ok)',
      bg: urgentTasks > 0 ? 'var(--warning-bg)' : 'var(--ok-bg)',
      stats: [
        { label: 'Open Tasks', value: openTasks },
        { label: 'Urgent', value: urgentTasks },
        { label: 'Alerts', value: totalAlerts },
      ],
      badge: urgentTasks > 0 ? { label: `${urgentTasks} Urgent`, variant: 'warning' } : null,
      enabled: kpiMap.get('ov-kpi-4')?.enabled !== false,
    },
    {
      id: 'mod-utilities',
      title: kpiMap.get('ov-kpi-5')?.label || 'Utilities & Energy',
      icon: <Zap size={16} />,
      href: '/utilities-register',
      color: kpiMap.get('ov-kpi-5')?.color || '#3dd68c',
      bg: 'rgba(61,214,140,0.1)',
      stats: [
        { label: 'Accounts', value: totalUtilities },
        { label: 'Spend', value: `£${totalSpendK}k` },
        { label: 'Suppliers', value: '4 Active' },
      ],
      badge: null,
      enabled: kpiMap.get('ov-kpi-5')?.enabled !== false,
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
          {cms.sections?.kpiRadar?.title || (activePortal === 'propco' ? 'PropCo Module Overview' : 'OpCo Module Overview')}
        </h2>
        <span className="text-xs text-muted-foreground font-medium">
          {cms.sections?.kpiRadar?.subtitle || (activePortal === 'propco'
            ? 'Asset management, legal contracts, property insurance & portfolio records'
            : 'Hotel operations, equipment maintenance, statutory compliance & utilities')}
        </span>
      </div>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}
      >
        {modules.filter((m: any) => m.enabled !== false).map((mod) => (
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
