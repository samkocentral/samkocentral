'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, ShieldCheck, Settings, ChevronLeft, ChevronRight, AlertTriangle,
  Package, Building2, ChevronDown, BarChart3, Upload, BarChart2, Shield,
  FileCheck, Flame, ScrollText, Users, FileBarChart, Calendar, CheckSquare,
  AlertCircle, RefreshCw, Handshake, Star, Zap, History, Eye, ClipboardList,
  Tag, FolderOpen, ClipboardCheck, QrCode, Globe
} from 'lucide-react';
import { ALERTS, TASKS } from '@/lib/mockData';
import { MAINTENANCE_RECORDS } from '@/lib/assetData';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';

interface SidebarProps {
  currentPath: string;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badgeCount?: number;
  badgeVariant?: 'critical' | 'warning';
}

export default function Sidebar({ currentPath }: SidebarProps) {
  const { user, activePortal, roleBadgeColor, canManageUsers, canAccessSettings, isViewer, isTabEnabled, getTabAccess } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [criticalCount, setCriticalCount] = useState(0);
  const [openTaskCount, setOpenTaskCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(
    MAINTENANCE_RECORDS.filter((m) => m.status === 'overdue').length
  );
  const [dueTodayCount, setDueTodayCount] = useState(
    MAINTENANCE_RECORDS.filter((m) => m.status === 'due-today').length
  );
  const [pulse, setPulse] = useState(true);

  // PropCo & OpCo accordion dropdown states (always closed unless opened by user)
  const [openPortals, setOpenPortals] = useState<Record<string, boolean>>({
    propco: false,
    opco: false,
  });

  // Nested sub-dropdown states inside PropCo and OpCo
  const [openSubDropdowns, setOpenSubDropdowns] = useState<Record<string, boolean>>({
    insurance: false,
    contracts: false,
    maintenance: false,
    compliance: false,
    utilities: false,
  });

  const fetchDynamicCounts = async () => {
    try {
      const [mRes, compRes, tasksRes] = await Promise.allSettled([
        api.maintenance.getAll(),
        api.compliance.getAll(),
        api.tasks.getAll(),
      ]);

      if (mRes.status === 'fulfilled' && mRes.value.success && mRes.value.data) {
        const records = mRes.value.data;
        setOverdueCount(records.filter((m: any) => m.status === 'overdue').length);
        setDueTodayCount(records.filter((m: any) => m.status === 'due-today').length);
      }

      if (compRes.status === 'fulfilled' && compRes.value.success && compRes.value.data) {
        const compItems = compRes.value.data;
        const overdueOrCrit = compItems.filter((c: any) => c.status === 'overdue' || c.riskRating === 'critical').length;
        if (overdueOrCrit > 0) setCriticalCount(overdueOrCrit);
      }

      if (tasksRes.status === 'fulfilled' && tasksRes.value.success && tasksRes.value.data) {
        setOpenTaskCount(tasksRes.value.data.filter((t: any) => t.status === 'open').length);
      }
    } catch (err) {
      console.warn('Could not fetch dynamic sidebar counts:', err);
    }
  };

  useEffect(() => {
    setCriticalCount(ALERTS.filter((a) => a.type === 'critical').length);
    setOpenTaskCount(TASKS.filter((t) => t.status === 'open').length);
    setWarningCount(ALERTS.filter((a) => a.type === 'warning').length);
    setOverdueCount(MAINTENANCE_RECORDS.filter((m) => m.status === 'overdue').length);
    setDueTodayCount(MAINTENANCE_RECORDS.filter((m) => m.status === 'due-today').length);

    fetchDynamicCounts();

    const pulseInterval = setInterval(() => setPulse((p) => !p), 1200);
    return () => clearInterval(pulseInterval);
  }, []);

  const togglePortal = (portalKey: 'propco' | 'opco') => {
    setOpenPortals((s) => ({ ...s, [portalKey]: !s[portalKey] }));
  };

  const toggleSubDropdown = (key: string) => {
    setOpenSubDropdowns((s) => ({ ...s, [key]: !s[key] }));
  };

  const isActive = (href: string) => {
    if (href === '/') return currentPath === '/';
    if (
      (href === '/asset-management/hotels' || href === '/asset-management/properties') &&
      (currentPath.startsWith('/asset-management/properties') || currentPath.startsWith('/asset-management/hotels'))
    ) {
      return true;
    }
    if (href === '/tasks' && currentPath === '/tasks') {
      return true;
    }
    if (href === '/task-manager' && currentPath.startsWith('/task-manager')) {
      return true;
    }
    if (href === '/asset-management/categories' && currentPath.startsWith('/asset-management/categories')) {
      return true;
    }
    if (href === '/document-repository' && currentPath.startsWith('/document-repository')) {
      return true;
    }
    if (href === '/asset-management/inspections' && currentPath.startsWith('/asset-management/inspections')) {
      return true;
    }
    if (href === '/asset-management/qr-scanner' && currentPath.startsWith('/asset-management/qr-scanner')) {
      return true;
    }
    if (href === '/multi-site-operations' && currentPath.startsWith('/multi-site-operations')) {
      return true;
    }
    if (href === '/asset-management/assets' && currentPath.startsWith('/asset-management/assets') && !currentPath.includes('type=non-fixed')) {
      return true;
    }
    if (href === '/asset-management/assets?type=non-fixed' && currentPath.includes('type=non-fixed')) {
      return true;
    }
    return currentPath === href || currentPath.startsWith(href + '/');
  };

  const renderNavItem = (item: NavItem, isIndented = false) => {
    if (!isTabEnabled(item.id)) {
      return null;
    }

    const active = isActive(item.href);
    const access = getTabAccess(item.id);
    const isReadOnly = access === 'read';

    return (
      <Link
        key={`nav-${item.id}`}
        href={item.href}
        title={collapsed ? `${item.label}${isReadOnly ? ' (Read Only)' : ''}` : undefined}
        className="flex items-center gap-2 rounded-lg transition-all duration-150 group relative"
        style={{
          padding: collapsed ? '8px 10px' : isIndented ? '6px 10px 6px 12px' : '7px 10px',
          background: active ? 'rgba(232,201,122,0.12)' : 'transparent',
          color: active ? 'var(--primary)' : 'var(--text2)',
          fontSize: isIndented ? 12.5 : 13,
          fontWeight: active ? 600 : 500,
          textDecoration: 'none',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.background = 'var(--surface2)';
            e.currentTarget.style.color = 'var(--foreground)';
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text2)';
          }
        }}
      >
        <span className="flex-shrink-0">{item.icon}</span>
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {isReadOnly && user.roleLevel !== 'L1' && user.roleLevel !== 'L4' && (
              <span className="text-[10px] text-muted-foreground opacity-60" title="Read Only Access">
                <Eye size={11} />
              </span>
            )}
            {item.badgeCount !== undefined && item.badgeCount > 0 && (
              <span
                className={item.badgeVariant === 'critical' ? 'nav-badge-count' : 'nav-badge-warn'}
                style={{ transition: 'opacity 0.4s ease', opacity: item.badgeVariant === 'critical' ? (pulse ? 1 : 0.55) : 1 }}
              >
                {item.badgeCount}
              </span>
            )}
          </>
        )}
        {collapsed && item.badgeCount !== undefined && item.badgeCount > 0 && (
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{
              background: item.badgeVariant === 'critical' ? 'var(--critical)' : 'var(--warning)',
              opacity: item.badgeVariant === 'critical' ? (pulse ? 1 : 0.5) : 1,
              transition: 'opacity 0.4s ease',
            }}
          />
        )}
        {collapsed && (
          <span
            className="absolute left-full ml-2 px-2 py-1 rounded text-xs font-medium pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50"
            style={{ background: 'var(--surface3)', color: 'var(--foreground)', border: '1px solid var(--border-strong)', fontSize: 12 }}
          >
            {item.label}
            {isReadOnly && ' (Read Only)'}
            {item.badgeCount !== undefined && item.badgeCount > 0 && ` (${item.badgeCount})`}
          </span>
        )}
      </Link>
    );
  };

  const renderSubDropdown = (
    id: string,
    label: string,
    icon: React.ReactNode,
    items: NavItem[],
    badgeCount?: number,
    badgeVariant?: 'critical' | 'warning'
  ) => {
    const visibleSubItems = items.filter((item) => isTabEnabled(item.id));
    if (visibleSubItems.length === 0) return null;

    const isOpen = openSubDropdowns[id];
    const isChildActive = visibleSubItems.some((item) => isActive(item.href));

    if (collapsed) {
      return (
        <div key={`sub-${id}`} className="flex flex-col gap-0.5">
          {visibleSubItems.map((item) => renderNavItem(item))}
        </div>
      );
    }

    return (
      <div key={`sub-${id}`} className="flex flex-col gap-0.5 mb-0.5">
        <button
          type="button"
          onClick={() => toggleSubDropdown(id)}
          className="flex items-center gap-2 rounded-lg transition-all duration-150 group relative cursor-pointer w-full text-left"
          style={{
            padding: '7px 10px',
            background: isChildActive ? 'rgba(232,201,122,0.08)' : 'transparent',
            color: isChildActive ? 'var(--primary)' : 'var(--text2)',
            fontSize: 13,
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            if (!isChildActive) {
              e.currentTarget.style.background = 'var(--surface2)';
              e.currentTarget.style.color = 'var(--foreground)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isChildActive) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text2)';
            }
          }}
        >
          <span className="flex-shrink-0">{icon}</span>
          <span className="flex-1 truncate" style={{ fontSize: 13 }}>{label}</span>
          {badgeCount !== undefined && badgeCount > 0 && (
            <span
              className={badgeVariant === 'critical' ? 'nav-badge-count' : 'nav-badge-warn'}
              style={{ transition: 'opacity 0.4s ease', opacity: badgeVariant === 'critical' ? (pulse ? 1 : 0.55) : 1 }}
            >
              {badgeCount}
            </span>
          )}
          <ChevronDown
            size={12}
            className="text-muted-foreground transition-transform duration-200 opacity-75"
            style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          />
        </button>

        {isOpen && (
          <div className="border-l border-border/80 ml-4 pl-1.5 flex flex-col gap-0.5 my-0.5">
            {visibleSubItems.map((item) => renderNavItem(item, true))}
          </div>
        )}
      </div>
    );
  };

  const renderPortalHeader = (
    portalKey: 'propco' | 'opco',
    title: string,
    badgeText: string,
    badgeColor: string,
    icon: React.ReactNode,
    isOpen: boolean
  ) => {
    if (collapsed) {
      return <div className="border-t border-border my-2" />;
    }
    const isCurrentActive = activePortal === portalKey;

    return (
      <div className="mt-3 mb-1 px-1">
        <button
          type="button"
          onClick={() => togglePortal(portalKey)}
          className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg transition-all cursor-pointer group"
          style={{
            background: isCurrentActive
              ? portalKey === 'propco'
                ? 'rgba(232,201,122,0.12)'
                : 'rgba(96,165,250,0.12)'
              : 'var(--surface2)',
            border: isCurrentActive
              ? portalKey === 'propco'
                ? '1px solid rgba(232,201,122,0.35)'
                : '1px solid rgba(96,165,250,0.35)'
              : '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span style={{ color: badgeColor }}>{icon}</span>
            <span
              className="font-head font-bold truncate"
              style={{
                fontSize: 11.5,
                letterSpacing: '0.8px',
                color: isCurrentActive ? 'var(--foreground)' : 'var(--text2)',
                textTransform: 'uppercase',
              }}
            >
              {title}
            </span>
            <span
              className="text-[9px] font-extrabold px-1.5 py-0.2 rounded tracking-wider uppercase"
              style={{
                background: `${badgeColor}22`,
                color: badgeColor,
              }}
            >
              {badgeText}
            </span>
          </div>
          <ChevronDown
            size={12}
            className="text-muted-foreground transition-transform duration-200"
            style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          />
        </button>
      </div>
    );
  };

  const bottomNavItems: NavItem[] = [
    { id: 'categories', label: 'Categories', href: '/asset-management/categories', icon: <Tag size={16} /> },
    { id: 'recent-logs', label: 'Recent Logs', href: '/recent-logs', icon: <History size={16} /> },
    { id: 'import', label: 'Import / Export', href: '/asset-management/import', icon: <Upload size={16} /> },
    ...(canManageUsers
      ? [{ id: 'users', label: 'Users & Roles', href: '/users', icon: <Users size={16} /> }]
      : []),
    ...(canAccessSettings
      ? [{ id: 'settings', label: 'Settings', href: '/settings', icon: <Settings size={16} /> }]
      : []),
  ];

  return (
    <aside
      className="flex flex-col bg-card border-r border-border transition-sidebar flex-shrink-0 relative"
      style={{ width: collapsed ? 68 : 256, minWidth: collapsed ? 68 : 256 }}
    >
      {/* Logo */}
      <div
        className="flex items-center border-b border-border flex-shrink-0"
        style={{
          height: 64,
          padding: collapsed ? '0 14px' : '0 14px',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <Link
          href="/"
          className={`flex items-center no-underline ${collapsed ? 'justify-center w-full' : 'gap-2.5 min-w-0 flex-1'}`}
        >
          <div className="flex-shrink-0">
            <img
              src="/assets/images/samko_logo.png?v=4"
              alt="SamkoCentral Logo"
              className="transition-all duration-200"
              style={{
                width: collapsed ? 34 : 36,
                height: collapsed ? 34 : 36,
                objectFit: 'contain',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '2px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              }}
            />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 overflow-visible pr-1">
              <div
                className="font-head text-primary leading-tight whitespace-nowrap overflow-visible"
                style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: '-0.2px', paddingRight: 4 }}
              >
                SamkoCentral
              </div>
              <div
                className="whitespace-nowrap font-medium overflow-visible"
                style={{
                  fontSize: 8.5,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: '#60a5fa',
                  marginTop: 2,
                  paddingRight: 4,
                }}
              >
                Operations · Compliance
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: '10px 8px 8px' }}>
        {/* Top: Dashboard */}
        <div className="flex flex-col gap-0.5 mb-1">
          {renderNavItem({
            id: 'dashboard',
            label: 'Dashboard',
            href: '/',
            icon: <LayoutDashboard size={16} />,
          })}
        </div>

        {/* ── PROPCO DROPDOWN / ACCORDION ── */}
        {renderPortalHeader(
          'propco',
          'PropCo',
          'Asset Co',
          '#e8c97a',
          <Building2 size={13} />,
          openPortals.propco
        )}

        {(openPortals.propco || collapsed) && (
          <div className="flex flex-col gap-0.5 mb-2 pl-0.5">
            {/* 1. Properties */}
            {renderNavItem({
              id: 'properties',
              label: 'Properties',
              href: '/asset-management/properties',
              icon: <Building2 size={15} />,
            })}

            {/* 2. Fixed Assets */}
            {renderNavItem({
              id: 'all-assets',
              label: 'Fixed Assets',
              href: '/asset-management/assets',
              icon: <Package size={15} />,
            })}

            {/* 3. Categories */}
            {renderNavItem({
              id: 'categories',
              label: 'Categories',
              href: '/asset-management/categories',
              icon: <Tag size={15} />,
            })}

            {/* 3. Insurance Dropdown */}
            {renderSubDropdown(
              'insurance',
              'Insurance',
              <Shield size={15} />,
              [
                { id: 'insurance-register', label: 'Insurance Register', href: '/insurance-register', icon: <Shield size={13} /> },
                { id: 'claims', label: 'Claims', href: '/insurance-register?tab=claims', icon: <FileBarChart size={13} /> },
                { id: 'insurance-renewals', label: 'Renewals', href: '/insurance-register?tab=renewals', icon: <RefreshCw size={13} /> },
              ]
            )}

            {/* 4. Contracts Dropdown */}
            {renderSubDropdown(
              'contracts',
              'Contracts',
              <ScrollText size={15} />,
              [
                { id: 'contracts-register', label: 'Contracts Register', href: '/contracts-register', icon: <ScrollText size={13} /> },
                { id: 'suppliers', label: 'Suppliers', href: '/contracts-register?tab=suppliers', icon: <Handshake size={13} /> },
                { id: 'contracts-renewals', label: 'Renewals', href: '/contracts-register?tab=renewals', icon: <RefreshCw size={13} /> },
                { id: 'slas', label: 'SLAs', href: '/contracts-register?tab=slas', icon: <Star size={13} /> },
              ]
            )}

            {/* 5. Reports */}
            {renderNavItem({
              id: 'contract-reports',
              label: 'Reports',
              href: '/asset-management/reports?type=contracts',
              icon: <BarChart3 size={15} />,
            })}
          </div>
        )}

        {/* ── OPCO DROPDOWN / ACCORDION ── */}
        {renderPortalHeader(
          'opco',
          'OpCo',
          'Operations',
          '#60a5fa',
          <ShieldCheck size={13} />,
          openPortals.opco
        )}

        {(openPortals.opco || collapsed) && (
          <div className="flex flex-col gap-0.5 mb-2 pl-0.5">
            {/* 1. Non-Fixed Assets */}
            {renderNavItem({
              id: 'non-fixed',
              label: 'Non-Fixed Assets',
              href: '/asset-management/assets?type=non-fixed',
              icon: <Package size={15} />,
            })}

            {/* Categories */}
            {renderNavItem({
              id: 'categories',
              label: 'Categories',
              href: '/asset-management/categories',
              icon: <Tag size={15} />,
            })}

            {/* 2. Maintenance Dropdown */}
            {renderSubDropdown(
              'maintenance',
              'Maintenance',
              <Calendar size={15} />,
              [
                { id: 'maintenance-scheduled', label: 'Scheduled', href: '/asset-management/maintenance', icon: <Calendar size={13} /> },
                { id: 'maintenance-due', label: 'Due Today', href: '/asset-management/maintenance?filter=due-today', icon: <AlertCircle size={13} />, badgeCount: dueTodayCount, badgeVariant: 'warning' },
                { id: 'maintenance-overdue', label: 'Overdue', href: '/asset-management/maintenance?filter=overdue', icon: <AlertTriangle size={13} />, badgeCount: overdueCount, badgeVariant: 'critical' },
                { id: 'maintenance-completed', label: 'Completed', href: '/asset-management/maintenance?filter=completed', icon: <CheckSquare size={13} /> },
              ],
              overdueCount > 0 ? overdueCount : dueTodayCount > 0 ? dueTodayCount : undefined,
              overdueCount > 0 ? 'critical' : 'warning'
            )}

            {/* 3. Compliance Dropdown */}
            {renderSubDropdown(
              'compliance',
              'Compliance',
              <ShieldCheck size={15} />,
              [
                { id: 'compliance-register', label: 'Compliance Register', href: '/compliance-register', icon: <ShieldCheck size={13} />, badgeCount: criticalCount, badgeVariant: 'critical' },
                { id: 'certifications', label: 'Certifications', href: '/compliance-register?tab=certifications', icon: <FileCheck size={13} /> },
                { id: 'statutory', label: 'Statutory Inspections', href: '/compliance-register?tab=statutory', icon: <Flame size={13} /> },
                { id: 'expiry-dashboard', label: 'Expiry Dashboard', href: '/compliance-tracker', icon: <AlertTriangle size={13} /> },
              ],
              criticalCount > 0 ? criticalCount : undefined,
              'critical'
            )}

            {/* 4. Tasks and Alerts */}
            {renderNavItem({
              id: 'tasks',
              label: 'Tasks and Alerts',
              href: '/tasks',
              icon: <CheckSquare size={15} />,
              badgeCount: openTaskCount,
              badgeVariant: 'warning',
            })}

            {/* 5. Reports */}
            {renderNavItem({
              id: 'maintenance-reports',
              label: 'Reports',
              href: '/asset-management/reports?type=maintenance',
              icon: <BarChart2 size={15} />,
            })}

            {/* 6. Task Module */}
            {renderNavItem({
              id: 'task-module',
              label: 'Task Module',
              href: '/task-manager',
              icon: <ClipboardList size={15} />,
            })}

            {/* 7. Utility Dropdown */}
            {renderSubDropdown(
              'utilities',
              'Utility',
              <Zap size={15} />,
              [
                { id: 'utilities-register', label: 'Utilities Register', href: '/utilities-register', icon: <Zap size={13} /> },
                { id: 'utilities-energy', label: 'Energy & Water Accounts', href: '/utilities-register?type=electricity', icon: <Zap size={13} /> },
              ]
            )}
          </div>
        )}

        <div className="border-t border-border my-2" />

        {/* Bottom nav items */}
        <div className="flex flex-col gap-0.5">
          {bottomNavItems.map((item) => renderNavItem(item))}
        </div>
      </nav>

      {/* Critical Alert Banner */}
      {!collapsed && criticalCount > 0 && (
        <div
          className="mx-2 mb-2 rounded-lg flex items-center gap-2"
          style={{
            background: 'rgba(244,63,94,0.10)',
            border: `1px solid rgba(244,63,94,${pulse ? '0.35' : '0.18'})`,
            padding: '8px 10px',
            transition: 'border-color 0.4s ease',
          }}
        >
          <AlertTriangle size={13} style={{ color: 'var(--critical)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--critical)', fontWeight: 600 }}>
            {criticalCount} critical · {warningCount} warnings
          </span>
        </div>
      )}

      {/* User info */}
      <div className="border-t border-border" style={{ padding: collapsed ? '12px 8px' : '12px 10px' }}>
        {!collapsed && (
          <div className="flex items-center justify-between text-muted-foreground font-head" style={{ fontSize: 9, letterSpacing: '1.4px', textTransform: 'uppercase', padding: '0 4px', marginBottom: 8 }}>
            <span>Account</span>
            <span
              className="px-1.5 py-0.2 rounded font-extrabold"
              style={{ background: `${roleBadgeColor}20`, color: roleBadgeColor }}
            >
              {user.roleLevel}
            </span>
          </div>
        )}
        {canManageUsers || isViewer ? (
          <Link
            href={isViewer ? '/users?tab=audit' : '/users'}
            className="flex items-center gap-2 rounded-lg cursor-pointer transition-colors hover:bg-surface2"
            style={{ padding: collapsed ? '6px' : '7px 8px', background: 'var(--surface2)', justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            <div
              className="rounded-full flex items-center justify-center flex-shrink-0 font-bold"
              style={{ width: 28, height: 28, background: roleBadgeColor, color: '#000', fontSize: 10 }}
            >
              {user.initials || 'AV'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-foreground font-medium truncate" style={{ fontSize: 12 }}>{user.name}</div>
                <div className="truncate font-semibold text-[10px]" style={{ color: roleBadgeColor }}>
                  {user.roleTitle} {isViewer && '(Read-Only)'}
                </div>
              </div>
            )}
          </Link>
        ) : (
          <div
            className="flex items-center gap-2 rounded-lg"
            style={{ padding: collapsed ? '6px' : '7px 8px', background: 'var(--surface2)', justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            <div
              className="rounded-full flex items-center justify-center flex-shrink-0 font-bold"
              style={{ width: 28, height: 28, background: roleBadgeColor, color: '#000', fontSize: 10 }}
            >
              {user.initials || 'AV'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-foreground font-medium truncate" style={{ fontSize: 12 }}>{user.name}</div>
                <div className="truncate font-semibold text-[10px]" style={{ color: roleBadgeColor }}>
                  {user.roleTitle} {isViewer && '(Read-Only)'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute flex items-center justify-center rounded-full border border-border"
        style={{ top: 20, right: -12, width: 24, height: 24, background: 'var(--card)', color: 'var(--text2)', cursor: 'pointer', zIndex: 10 }}
        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}