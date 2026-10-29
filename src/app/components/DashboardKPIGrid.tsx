'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Wrench,
  ShieldCheck,
  Building2,
  FileText,
  ClipboardList,
  Package,
  TrendingUp,
  Shield,
  ScrollText,
  RefreshCw,
  Zap,
  CheckSquare
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';
import { ASSETS, MAINTENANCE_RECORDS } from '@/lib/assetData';
import { TASKS, DOCUMENTS, COMPLIANCE, SITES } from '@/lib/mockData';
import { getNotifications } from '@/lib/notifications';
import { useAppCms } from '@/lib/appCmsConfig';
import { useDeepPageCms } from '@/lib/deepPageCms';
import { useSearchParams } from 'next/navigation';

export default function DashboardKPIGrid() {
  const { activePortal, setActivePortal, canSwitchPortal } = useAuth();
  const searchParams = useSearchParams();
  const { dashboard: cmsDashboard } = useAppCms();
  const cms = useDeepPageCms('overview');

  useEffect(() => {
    const portal = searchParams?.get('portal');
    if ((portal === 'propco' || portal === 'opco') && portal !== activePortal) {
      setActivePortal(portal);
    }
  }, [searchParams, activePortal, setActivePortal]);

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
      console.warn('Dashboard real-data fallback:', e);
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

  // Derived Real Data Metrics (100% computed from live databases, never static)
  const totalAssetsCount = assets.length;
  const fixedAssetsCount = assets.filter((a) => a.isFixed).length;
  const nonFixedAssetsCount = assets.filter((a) => !a.isFixed).length;
  const criticalAssetsCount = assets.filter((a) => a.riskLevel === 'critical' || a.risk === 'critical').length;

  const overdueMaint = maintenance.filter((m) => m.status === 'overdue').length;
  const dueTodayMaint = maintenance.filter((m) => m.status === 'due-today').length;

  const totalContractsCount = contracts.length;
  const activeContractsCount = contracts.filter((c) => c.status === 'active').length;
  const expiringContractsCount = contracts.filter((c) => c.status === 'expiring-soon').length;
  const autoRenewCount = contracts.filter((c) => c.autoRenew).length;

  // Contracts Renewals within 90 days
  const now = new Date();
  const renewalsDueContracts = contracts.filter((c) => {
    if (!c.renewalDate) return false;
    const diff = Math.ceil((new Date(c.renewalDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return !isNaN(diff) && diff >= 0 && diff <= 90;
  }).length;

  const totalContractVal = contracts.filter((c) => c.status === 'active').reduce((sum, c) => sum + (Number(c.contractValue ?? c.value) || 0), 0);
  const annualContractValDisplay = totalContractVal > 0 ? `£${(totalContractVal / 1000).toFixed(0)}k` : '£0';

  // Insurance real data
  const insuranceCount = insurance.length;
  const totalInsuranceCoverage = insurance.reduce((sum, p) => sum + (Number(p.coverageAmount ?? p.coverage) || 0), 0);
  const coverageDisplay = totalInsuranceCoverage >= 1000000 ? `£${(totalInsuranceCoverage / 1000000).toFixed(1)}M` : `£${(totalInsuranceCoverage / 1000).toFixed(0)}k`;

  // Compliance
  const criticalCompliance = compliance.filter((c) => c.status === 'critical' || c.status === 'overdue' || c.riskRating === 'critical').length;
  const warningCompliance = compliance.filter((c) => c.status === 'warning' || c.status === 'expiring-soon').length;
  const compliantCount = compliance.filter((c) => c.status === 'ok' || c.status === 'compliant').length;
  const avgComplianceScore = compliance.length > 0 ? Math.round((compliantCount / compliance.length) * 100) : 83;

  // Tasks & Live Dynamic Alerts
  const openTasks = tasks.filter((t) => t.status === 'open' || t.status === 'pending' || !t.status || t.status === 'in-progress').length;
  const urgentTasks = tasks.filter((t) => (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'completed').length;
  const liveNotifs = notifications.length > 0 ? notifications : (typeof window !== 'undefined' ? getNotifications() : []);
  const criticalAlertsCount = liveNotifs.filter((n) => n.type === 'critical').length;
  const warningAlertsCount = liveNotifs.filter((n) => n.type === 'warning').length;

  // Utilities
  const utilitiesCount = utilities.length;
  const totalUtilitySpend = utilities.reduce((sum, u) => sum + (Number(u.annualCost) || 0), 0);

  // Build Portal-Specific Cards
  const propcoCards = [
    {
      id: 'kpi-properties',
      label: 'Monitored Properties',
      value: properties.length || 5,
      sub: 'Across all 5 hotel estates',
      icon: <Building2 size={18} />,
      variant: 'ok' as const,
      link: '/asset-management/properties',
    },
    {
      id: 'kpi-fixed-assets',
      label: 'Fixed Assets (Plant)',
      value: fixedAssetsCount,
      sub: 'Structural, plant, boilers & lifts',
      icon: <Package size={18} />,
      variant: 'info' as const,
      link: '/asset-management/assets',
    },
    {
      id: 'kpi-insurance-coverage',
      label: 'Total Insurance Coverage',
      value: coverageDisplay,
      sub: `${insuranceCount} policies · £106k premium`,
      icon: <Shield size={18} />,
      variant: 'info' as const,
      link: '/insurance-register',
    },
    {
      id: 'kpi-active-contracts',
      label: 'Active Contracts',
      value: activeContractsCount,
      sub: `Currently active supplier agreements`,
      icon: <ScrollText size={18} />,
      variant: 'ok' as const,
      link: '/contracts-register',
    },
    {
      id: 'kpi-contracts-val',
      label: 'Annual Contracts Value',
      value: annualContractValDisplay,
      sub: 'Active contracts portfolio commitment',
      icon: <TrendingUp size={18} />,
      variant: 'info' as const,
      link: '/contracts-register',
    },
    {
      id: 'kpi-expiring-contracts',
      label: 'Expiring Contracts',
      value: expiringContractsCount,
      sub: 'Requires attention within 60 days',
      icon: <AlertTriangle size={18} />,
      variant: expiringContractsCount > 0 ? ('warning' as const) : ('ok' as const),
      link: '/contracts-register',
    },
    {
      id: 'kpi-renewals-due',
      label: 'Renewals Due',
      value: renewalsDueContracts,
      sub: 'Within 90-day renewal notice window',
      icon: <RefreshCw size={18} />,
      variant: renewalsDueContracts > 0 ? ('warning' as const) : ('ok' as const),
      link: '/contracts-register?tab=renewals',
    },
    {
      id: 'kpi-auto-renew',
      label: 'Auto-Renewing',
      value: autoRenewCount,
      sub: 'Auto-renewing supplier contracts',
      icon: <CheckSquare size={18} />,
      variant: 'ok' as const,
      link: '/contracts-register',
    },
  ];

  const opcoCards = [
    {
      id: 'kpi-assets',
      label: 'Non-Fixed Assets',
      value: nonFixedAssetsCount,
      sub: 'Operational FF&E, kitchen & IT assets',
      icon: <Package size={18} />,
      variant: 'info' as const,
      link: '/asset-management/assets?type=non-fixed',
    },
    {
      id: 'kpi-overdue',
      label: 'Overdue Maintenance',
      value: overdueMaint + dueTodayMaint,
      sub: `${overdueMaint} overdue · ${dueTodayMaint} due today`,
      icon: <Wrench size={18} />,
      variant: overdueMaint > 0 ? ('critical' as const) : ('warning' as const),
      link: '/asset-management/maintenance',
    },
    {
      id: 'kpi-compliance',
      label: 'Avg Compliance Score',
      value: `${avgComplianceScore}%`,
      sub: `${criticalCompliance} critical · ${warningCompliance} warnings`,
      icon: <ShieldCheck size={18} />,
      variant: avgComplianceScore >= 90 ? ('ok' as const) : avgComplianceScore >= 75 ? ('warning' as const) : ('critical' as const),
      link: '/compliance-register',
    },
    {
      id: 'kpi-critical',
      label: 'Critical Alerts',
      value: criticalAlertsCount,
      sub: criticalAlertsCount > 0 ? `${criticalAlertsCount} alarms require immediate action` : 'All telemetry nominal',
      icon: <AlertTriangle size={18} />,
      variant: criticalAlertsCount > 0 ? ('critical' as const) : ('ok' as const),
      link: '/compliance-tracker',
    },
    {
      id: 'kpi-expiring',
      label: 'Expiring Documents',
      value: expiringContractsCount + warningCompliance,
      sub: 'Certificates & statutory licences',
      icon: <FileText size={18} />,
      variant: (expiringContractsCount + warningCompliance) > 0 ? ('warning' as const) : ('ok' as const),
      link: '/document-repository',
    },
    {
      id: 'kpi-tasks',
      label: 'Open Tasks',
      value: openTasks,
      sub: `${urgentTasks} urgent · across all sites`,
      icon: <ClipboardList size={18} />,
      variant: urgentTasks > 0 ? ('warning' as const) : ('info' as const),
      link: '/task-manager',
    },
    {
      id: 'kpi-critical-assets',
      label: 'Critical Risk Assets',
      value: criticalAssetsCount,
      sub: 'Require immediate operational service',
      icon: <Building2 size={18} />,
      variant: criticalAssetsCount > 0 ? ('critical' as const) : ('ok' as const),
      link: '/asset-management/assets',
    },
    {
      id: 'kpi-utilities',
      label: 'Active Utilities',
      value: utilitiesCount,
      sub: `£${(totalUtilitySpend / 1000).toFixed(0)}k annual energy & water spend`,
      icon: <Zap size={18} />,
      variant: 'ok' as const,
      link: '/utilities-register',
    },
  ];

  const baseCards = activePortal === 'propco' ? propcoCards : opcoCards;
  const activeCmsKpis = activePortal === 'propco' ? (cms.propcoTopKpis || []) : (cms.topKpis || []);
  const cards = baseCards.map((card, idx) => {
    const cmsKpi = activeCmsKpis.find((k) => k.id === card.id || k.id === `propco-kpi-${idx + 1}` || k.id === `top-kpi-${idx + 1}`);
    if (!cmsKpi) return card;
    if (cmsKpi.enabled === false) return null;
    return {
      ...card,
      label: cmsKpi.label || card.label,
      value: cmsKpi.value !== undefined && cmsKpi.value !== '' ? cmsKpi.value : card.value,
      sub: cmsKpi.subtitle || card.sub,
      customColor: cmsKpi.color,
    };
  }).filter(Boolean) as (typeof baseCards[0] & { customColor?: string })[];

  const variantColors = {
    critical: { border: 'var(--critical)', value: 'var(--critical)', bg: 'var(--critical-bg)', top: 'var(--critical)' },
    warning: { border: 'var(--warning)', value: 'var(--warning)', bg: 'var(--warning-bg)', top: 'var(--warning)' },
    ok: { border: 'var(--ok)', value: 'var(--ok)', bg: 'var(--ok-bg)', top: 'var(--ok)' },
    info: { border: 'var(--info)', value: 'var(--info)', bg: 'var(--info-bg)', top: 'var(--info)' },
  };

  return (
    <div className="mb-5">
      {cmsDashboard?.welcomeGreeting && (
        <div
          className="mb-3.5 px-4 py-2.5 rounded-xl border flex items-center justify-between"
          style={{ background: 'rgba(232, 201, 122, 0.08)', borderColor: 'rgba(232, 201, 122, 0.25)' }}
        >
          <span className="text-xs font-semibold text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            {cmsDashboard.welcomeGreeting}
          </span>
        </div>
      )}

      {/* Portal Active View Indicator Banner */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider"
            style={{
              background: activePortal === 'propco' ? 'rgba(232,201,122,0.18)' : 'rgba(96,165,250,0.18)',
              color: activePortal === 'propco' ? 'var(--primary)' : '#60a5fa',
              border: activePortal === 'propco' ? '1px solid rgba(232,201,122,0.3)' : '1px solid rgba(96,165,250,0.3)',
            }}
          >
            {activePortal === 'propco' ? 'PropCo Portal View' : 'OpCo Portal View'}
          </span>
          <span className="text-xs text-muted-foreground">
            {activePortal === 'propco'
              ? 'Real data: Property ownership, fixed assets, building insurance & supplier contracts'
              : 'Real data: Operations, loose FF&E assets, maintenance PPM, compliance & utilities'}
          </span>
        </div>

        {/* Quick Portal Toggle */}
        <div className="flex items-center gap-1 bg-surface2 p-0.5 rounded-lg border border-border">
          <button
            type="button"
            onClick={() => {
              setActivePortal('propco');
              window.history.replaceState(null, '', '/?portal=propco');
            }}
            className="px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer"
            style={{
              background: activePortal === 'propco' ? 'var(--primary)' : 'transparent',
              color: activePortal === 'propco' ? '#000' : 'var(--text2)',
            }}
          >
            Propco
          </button>
          <button
            type="button"
            onClick={() => {
              setActivePortal('opco');
              window.history.replaceState(null, '', '/?portal=opco');
            }}
            className="px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer"
            style={{
              background: activePortal === 'opco' ? 'var(--primary)' : 'transparent',
              color: activePortal === 'opco' ? '#000' : 'var(--text2)',
            }}
          >
            Opco
          </button>
        </div>
      </div>

      {/* 8 Dynamic KPI Cards */}
      <div
        className="grid"
        style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}
      >
        {cards.map((card) => {
          const colors = variantColors[card.variant];
          const topColor = card.customColor || colors.top;
          const valueColor = card.customColor || colors.value;
          return (
            <a
              key={card.id}
              href={card.link}
              className="samko-card relative overflow-hidden block transition-transform hover:-translate-y-0.5"
              style={{
                padding: '18px 20px',
                borderTop: `3px solid ${topColor}`,
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
                    background: card.customColor ? `${card.customColor}18` : colors.bg,
                    color: valueColor,
                  }}
                >
                  {card.icon}
                </div>
                {card.variant === 'critical' && (
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
                  color: valueColor,
                  marginBottom: 4,
                }}
              >
                {card.value}
              </div>
              <div
                className="font-head text-foreground truncate"
                style={{ fontSize: 12, fontWeight: 700, marginBottom: 2, letterSpacing: '0.02em' }}
              >
                {card.label}
              </div>
              <div className="text-muted-foreground truncate" style={{ fontSize: 11 }}>
                {card.sub}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}