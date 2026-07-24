'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLogo from './ui/AppLogo';
import { LayoutDashboard, ShieldCheck, Settings, ChevronLeft, ChevronRight, AlertTriangle, Package, Hotel, ChevronDown, BarChart3, Upload, Tag, QrCode, BarChart2, Shield, FileCheck, Flame, ScrollText, Users, FileBarChart, TrendingUp, Calendar, CheckSquare, AlertCircle, RefreshCw, Handshake, FileSignature, Star, Zap } from 'lucide-react';
import { ALERTS, TASKS } from '@/lib/mockData';
import { MAINTENANCE_RECORDS } from '@/lib/assetData';

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

interface NavSection {
  label: string;
  key: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

export default function Sidebar({ currentPath }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [criticalCount, setCriticalCount] = useState(0);
  const [openTaskCount, setOpenTaskCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [pulse, setPulse] = useState(true);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    assetManagement: true,
    maintenance: true,
    compliance: false,
    insurance: false,
    contracts: false,
    reports: false,
  });

  useEffect(() => {
    setCriticalCount(ALERTS.filter((a) => a.type === 'critical').length);
    setOpenTaskCount(TASKS.filter((t) => t.status === 'open').length);
    setWarningCount(ALERTS.filter((a) => a.type === 'warning').length);
    const pulseInterval = setInterval(() => setPulse((p) => !p), 1200);
    return () => clearInterval(pulseInterval);
  }, []);

  // Auto-open section based on current path
  useEffect(() => {
    if (currentPath.startsWith('/asset-management')) {
      setOpenSections((s) => ({ ...s, assetManagement: true }));
    }
    if (currentPath.startsWith('/asset-management/maintenance')) {
      setOpenSections((s) => ({ ...s, maintenance: true }));
    }
    if (currentPath.startsWith('/compliance-register') || currentPath.startsWith('/compliance-tracker')) {
      setOpenSections((s) => ({ ...s, compliance: true }));
    }
    if (currentPath.startsWith('/insurance')) {
      setOpenSections((s) => ({ ...s, insurance: true }));
    }
    if (currentPath.startsWith('/contracts')) {
      setOpenSections((s) => ({ ...s, contracts: true }));
    }
    if (currentPath.startsWith('/asset-management/reports') || currentPath.startsWith('/reports')) {
      setOpenSections((s) => ({ ...s, reports: true }));
    }
  }, [currentPath]);

  const overdueCount = MAINTENANCE_RECORDS.filter((m) => m.status === 'overdue').length;
  const dueTodayCount = MAINTENANCE_RECORDS.filter((m) => m.status === 'due-today').length;

  const toggleSection = (key: string) => {
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));
  };

  const isActive = (href: string) => {
    if (href === '/') return currentPath === '/';
    return currentPath === href || currentPath.startsWith(href + '/');
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={`nav-${item.id}`}
        href={item.href}
        title={collapsed ? item.label : undefined}
        className="flex items-center gap-2 rounded-lg transition-all duration-150 group relative"
        style={{
          padding: collapsed ? '8px 10px' : '7px 10px',
          background: active ? 'rgba(232,201,122,0.12)' : 'transparent',
          color: active ? 'var(--primary)' : 'var(--text2)',
          fontSize: 13,
          fontWeight: 500,
          textDecoration: 'none',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
        onMouseEnter={(e) => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = 'var(--surface2)';
            (e.currentTarget as HTMLElement).style.color = 'var(--foreground)';
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--text2)';
          }
        }}
      >
        <span className="flex-shrink-0">{item.icon}</span>
        {!collapsed && (
          <>
            <span className="flex-1 truncate" style={{ fontSize: 13 }}>{item.label}</span>
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
            {item.badgeCount !== undefined && item.badgeCount > 0 && ` (${item.badgeCount})`}
          </span>
        )}
      </Link>
    );
  };

  const renderSection = (section: NavSection) => {
    const isOpen = openSections[section.key];
    const isInSection = section.items.some((item) => isActive(item.href));

    return (
      <div key={section.key} className="mb-1">
        {!collapsed ? (
          <button
            onClick={() => toggleSection(section.key)}
            className="flex items-center justify-between w-full px-2 py-1.5 mb-0.5 rounded-lg transition-colors"
            style={{ background: isInSection ? 'rgba(232,201,122,0.06)' : 'transparent' }}
          >
            <span className="font-head text-muted-foreground" style={{ fontSize: 10, letterSpacing: '1.4px', textTransform: 'uppercase' }}>
              {section.label}
            </span>
            <ChevronDown
              size={11}
              className="text-muted-foreground transition-transform duration-200"
              style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            />
          </button>
        ) : (
          <div className="border-t border-border my-1.5" />
        )}
        {(isOpen || collapsed) && (
          <div className="flex flex-col gap-0.5">
            {section.items.map(renderNavItem)}
          </div>
        )}
      </div>
    );
  };

  const topNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', href: '/', icon: <LayoutDashboard size={16} /> },
    { id: 'hotels', label: 'Hotels', href: '/asset-management/hotels', icon: <Hotel size={16} /> },
  ];

  const navSections: NavSection[] = [
    {
      label: 'Asset Management',
      key: 'assetManagement',
      items: [
        { id: 'all-assets', label: 'Fixed Assets', href: '/asset-management/assets', icon: <Package size={15} /> },
        { id: 'non-fixed', label: 'Non-Fixed Assets', href: '/asset-management/assets?type=non-fixed', icon: <Package size={15} /> },
        { id: 'categories', label: 'Categories', href: '/asset-management/categories', icon: <Tag size={15} /> },
        { id: 'qr-codes', label: 'QR Codes', href: '/asset-management/qr-scanner', icon: <QrCode size={15} /> },
      ],
    },
    {
      label: 'Maintenance',
      key: 'maintenance',
      items: [
        { id: 'maintenance-scheduled', label: 'Scheduled', href: '/asset-management/maintenance', icon: <Calendar size={15} /> },
        { id: 'maintenance-due', label: 'Due Today', href: '/asset-management/maintenance?filter=due-today', icon: <AlertCircle size={15} />, badgeCount: dueTodayCount, badgeVariant: 'warning' },
        { id: 'maintenance-overdue', label: 'Overdue', href: '/asset-management/maintenance?filter=overdue', icon: <AlertTriangle size={15} />, badgeCount: overdueCount, badgeVariant: 'critical' },
        { id: 'maintenance-completed', label: 'Completed', href: '/asset-management/maintenance?filter=completed', icon: <CheckSquare size={15} /> },
      ],
    },
    {
      label: 'Compliance',
      key: 'compliance',
      items: [
        { id: 'compliance-register', label: 'Compliance Register', href: '/compliance-register', icon: <ShieldCheck size={15} />, badgeCount: criticalCount, badgeVariant: 'critical' },
        { id: 'certifications', label: 'Certifications', href: '/compliance-register?tab=certifications', icon: <FileCheck size={15} /> },
        { id: 'statutory', label: 'Statutory Inspections', href: '/compliance-register?tab=statutory', icon: <Flame size={15} /> },
        { id: 'expiry-dashboard', label: 'Expiry Dashboard', href: '/compliance-tracker', icon: <AlertTriangle size={15} /> },
      ],
    },
    {
      label: 'Insurance',
      key: 'insurance',
      items: [
        { id: 'insurance-register', label: 'Insurance Register', href: '/insurance-register', icon: <Shield size={15} /> },
        { id: 'claims', label: 'Claims', href: '/insurance-register?tab=claims', icon: <FileBarChart size={15} /> },
        { id: 'insurance-renewals', label: 'Renewals', href: '/insurance-register?tab=renewals', icon: <RefreshCw size={15} /> },
      ],
    },
    {
      label: 'Contracts',
      key: 'contracts',
      items: [
        { id: 'contracts-register', label: 'Contracts Register', href: '/contracts-register', icon: <ScrollText size={15} /> },
        { id: 'suppliers', label: 'Suppliers', href: '/contracts-register?tab=suppliers', icon: <Handshake size={15} /> },
        { id: 'contracts-renewals', label: 'Renewals', href: '/contracts-register?tab=renewals', icon: <RefreshCw size={15} /> },
        { id: 'slas', label: 'SLAs', href: '/contracts-register?tab=slas', icon: <Star size={15} /> },
      ],
    },
    {
      label: 'Utilities',
      key: 'utilities',
      items: [
        { id: 'utilities-register', label: 'Utilities Register', href: '/utilities-register', icon: <Zap size={15} /> },
      ],
    },
    {
      label: 'Reports',
      key: 'reports',
      items: [
        { id: 'asset-reports', label: 'Asset Reports', href: '/asset-management/reports', icon: <BarChart3 size={15} /> },
        { id: 'maintenance-reports', label: 'Maintenance Reports', href: '/asset-management/reports?type=maintenance', icon: <BarChart2 size={15} /> },
        { id: 'compliance-reports', label: 'Compliance Reports', href: '/asset-management/reports?type=compliance', icon: <FileBarChart size={15} /> },
        { id: 'insurance-reports', label: 'Insurance Reports', href: '/asset-management/reports?type=insurance', icon: <TrendingUp size={15} /> },
        { id: 'contract-reports', label: 'Contract Reports', href: '/asset-management/reports?type=contracts', icon: <FileSignature size={15} /> },
        { id: 'utilities-reports', label: 'Utilities Reports', href: '/asset-management/reports?type=utilities', icon: <Zap size={15} /> },
      ],
    },
  ];

  const bottomNavItems: NavItem[] = [
    { id: 'import', label: 'Import / Export', href: '/asset-management/import', icon: <Upload size={16} /> },
    { id: 'users', label: 'Users & Roles', href: '/users', icon: <Users size={16} /> },
    { id: 'settings', label: 'Settings', href: '/settings', icon: <Settings size={16} /> },
  ];

  return (
    <aside
      className="flex flex-col bg-card border-r border-border transition-sidebar flex-shrink-0 relative"
      style={{ width: collapsed ? 64 : 220, minWidth: collapsed ? 64 : 220 }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 border-b border-border flex-shrink-0"
        style={{ padding: collapsed ? '18px 14px' : '18px 18px', minHeight: 64 }}
      >
        <div className="flex-shrink-0">
          <AppLogo size={28} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-head text-primary leading-tight" style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px' }}>
              SamkoCentral
            </div>
            <div className="text-muted-foreground" style={{ fontSize: 9, letterSpacing: '1.4px', textTransform: 'uppercase', marginTop: 1 }}>
              Operations · Compliance
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: '10px 8px 8px' }}>
        {/* Top nav items */}
        <div className="flex flex-col gap-0.5 mb-2">
          {topNavItems.map(renderNavItem)}
        </div>

        <div className="border-t border-border my-2" />

        {/* Collapsible sections */}
        {navSections.map(renderSection)}

        <div className="border-t border-border my-2" />

        {/* Bottom nav items */}
        <div className="flex flex-col gap-0.5">
          {bottomNavItems.map(renderNavItem)}
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

      {/* User */}
      <div className="border-t border-border" style={{ padding: collapsed ? '12px 8px' : '12px 10px' }}>
        {!collapsed && (
          <div className="text-muted-foreground font-head" style={{ fontSize: 9, letterSpacing: '1.4px', textTransform: 'uppercase', padding: '0 4px', marginBottom: 8 }}>
            Account
          </div>
        )}
        <div
          className="flex items-center gap-2 rounded-lg cursor-pointer"
          style={{ padding: collapsed ? '6px' : '7px 8px', background: 'var(--surface2)', justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          <div
            className="rounded-full flex items-center justify-center flex-shrink-0"
            style={{ width: 28, height: 28, background: 'var(--primary)', color: '#000', fontSize: 10, fontWeight: 800 }}
          >
            GA
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-foreground font-medium truncate" style={{ fontSize: 12 }}>Group Admin</div>
              <div className="text-muted-foreground truncate" style={{ fontSize: 10 }}>Super Admin</div>
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute flex items-center justify-center rounded-full border border-border"
        style={{ top: 20, right: -12, width: 24, height: 24, background: 'var(--card)', color: 'var(--text2)', cursor: 'pointer', zIndex: 10 }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}