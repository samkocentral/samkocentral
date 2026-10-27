'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, ShieldCheck, Settings, ChevronLeft, ChevronRight, AlertTriangle,
  Package, Building2, ChevronDown, BarChart3, Upload, BarChart2, Shield,
  FileCheck, Flame, ScrollText, Users, FileBarChart, Calendar, CheckSquare,
  AlertCircle, RefreshCw, Handshake, Star, Zap, History, Eye, ClipboardList,
  Tag, FolderOpen, ClipboardCheck, QrCode, Globe, SlidersHorizontal, ArrowRightLeft,
  Copy, Layers, Check, Search
} from 'lucide-react';
import { ALERTS, TASKS } from '@/lib/mockData';
import { MAINTENANCE_RECORDS } from '@/lib/assetData';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import {
  ALL_SYSTEM_TABS,
  type TabConfig,
  type TabSectionLocation,
  DEFAULT_TAB_SECTIONS,
  getTabSectionMapping,
  copyTabToSection,
  moveTabToSection,
} from '@/lib/permissions';
import { useAppCms, type AppCmsNavigationItem } from '@/lib/appCmsConfig';
import Modal from '@/components/ui/Modal';
import { toast } from 'sonner';

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

const SECTION_BADGE_STYLES: Record<TabSectionLocation, { label: string; badgeBg: string; color: string }> = {
  propco: { label: 'PROPCO', badgeBg: 'rgba(232,201,122,0.15)', color: '#e8c97a' },
  opco: { label: 'OPCO', badgeBg: 'rgba(96,165,250,0.15)', color: '#60a5fa' },
  both: { label: 'PROPCO & OPCO', badgeBg: 'rgba(61,214,140,0.15)', color: '#3dd68c' },
  bottom: { label: 'BOTTOM', badgeBg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
};

export default function Sidebar({ currentPath }: SidebarProps) {
  const { user, activePortal, roleBadgeColor, canManageUsers, canAccessSettings, isViewer, isTabEnabled, getTabAccess } = useAuth();
  const isSuperAdmin = user.roleLevel === 'L1';
  const { propco: cmsPropco, opco: cmsOpco, navigationItems } = useAppCms();

  const navItemsMap = useMemo(() => {
    const map: Record<string, AppCmsNavigationItem> = {};
    (navigationItems || []).forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [navigationItems]);

  const getNavLabel = (id: string, fallback: string) => {
    return navItemsMap[id]?.label || fallback;
  };

  const isNavVisible = (id: string) => {
    return navItemsMap[id] ? navItemsMap[id].enabled !== false : true;
  };

  const getTabLabel = (portal: 'propco' | 'opco', tabId: string, fallback: string) => {
    const portalConfig = portal === 'propco' ? cmsPropco : cmsOpco;
    const tab = portalConfig?.tabs?.find((t) => t.id === tabId);
    return tab?.name || fallback;
  };

  const isTabVisibleInCms = (portal: 'propco' | 'opco', tabId: string) => {
    const portalConfig = portal === 'propco' ? cmsPropco : cmsOpco;
    const tab = portalConfig?.tabs?.find((t) => t.id === tabId);
    if (!tab) return true;
    return tab.enabled !== false;
  };

  const getTabPath = (portal: 'propco' | 'opco', tabId: string, fallback: string) => {
    const portalConfig = portal === 'propco' ? cmsPropco : cmsOpco;
    const tab = portalConfig?.tabs?.find((t) => t.id === tabId);
    return tab?.path || fallback;
  };

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname.startsWith('/settings');
    }
    return false;
  });

  useEffect(() => {
    if (currentPath?.startsWith('/settings')) {
      setCollapsed(true);
    }
  }, [currentPath]);

  useEffect(() => {
    const handleCollapseEvent = (e: any) => {
      if (e.detail && typeof e.detail.collapsed === 'boolean') {
        setCollapsed(e.detail.collapsed);
      } else {
        setCollapsed(true);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('samko:collapse-sidebar', handleCollapseEvent);
      return () => window.removeEventListener('samko:collapse-sidebar', handleCollapseEvent);
    }
  }, []);

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

  // Dynamic Section Mapping (PropCo vs OpCo vs Both vs Bottom)
  const [sectionMapping, setSectionMapping] = useState<Record<string, TabSectionLocation>>(() =>
    getTabSectionMapping()
  );
  const [showSectionModal, setShowSectionModal] = useState<boolean>(false);
  const [sectionSearch, setSectionSearch] = useState<string>('');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');

  useEffect(() => {
    const handleSectionChange = () => {
      setSectionMapping(getTabSectionMapping());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('samko:sections-changed', handleSectionChange);
      return () => window.removeEventListener('samko:sections-changed', handleSectionChange);
    }
  }, []);

  // Section visibility checks
  const isInPropCo = (tabId: string) => {
    const s = sectionMapping[tabId] || DEFAULT_TAB_SECTIONS[tabId] || 'propco';
    return s === 'propco' || s === 'both';
  };

  const isInOpCo = (tabId: string) => {
    const s = sectionMapping[tabId] || DEFAULT_TAB_SECTIONS[tabId] || 'opco';
    return s === 'opco' || s === 'both';
  };

  const isInBottom = (tabId: string) => {
    const s = sectionMapping[tabId] || DEFAULT_TAB_SECTIONS[tabId] || 'bottom';
    return s === 'bottom';
  };

  // Persistent PropCo & OpCo accordion dropdown states
  const getInitialOpenPortals = (): Record<string, boolean> => {
    let saved: Record<string, boolean> = { propco: false, opco: false };
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('samko:sidebar_open_portals');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (typeof parsed.propco === 'boolean') saved.propco = parsed.propco;
          if (typeof parsed.opco === 'boolean') saved.opco = parsed.opco;
        }
      } catch (e) {}
    }
    const p = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : (currentPath || '');
    if (
      p.includes('type=non-fixed') ||
      p.startsWith('/asset-management/maintenance') ||
      p.startsWith('/compliance-register') ||
      p.startsWith('/compliance-tracker') ||
      p.startsWith('/tasks') ||
      p.startsWith('/task-manager') ||
      p.startsWith('/utilities-register') ||
      p.includes('type=maintenance')
    ) {
      saved.opco = true;
    }
    if (
      p.startsWith('/asset-management/properties') ||
      p.startsWith('/asset-management/hotels') ||
      (p.startsWith('/asset-management/assets') && !p.includes('type=non-fixed')) ||
      p.startsWith('/insurance-register') ||
      p.startsWith('/contracts-register') ||
      p.includes('type=contracts') ||
      p.startsWith('/document-repository')
    ) {
      saved.propco = true;
    }
    return saved;
  };

  const getInitialOpenSubDropdowns = (): Record<string, boolean> => {
    let saved: Record<string, boolean> = {
      insurance: false,
      contracts: false,
      maintenance: false,
      compliance: false,
      utilities: false,
    };
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('samko:sidebar_open_subdropdowns');
        if (stored) {
          const parsed = JSON.parse(stored);
          Object.keys(saved).forEach((k) => {
            if (typeof parsed[k] === 'boolean') saved[k] = parsed[k];
          });
        }
      } catch (e) {}
    }
    const p = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : (currentPath || '');
    if (p.startsWith('/insurance-register')) saved.insurance = true;
    if (p.startsWith('/contracts-register')) saved.contracts = true;
    if (p.startsWith('/asset-management/maintenance')) saved.maintenance = true;
    if (p.startsWith('/compliance-register') || p.startsWith('/compliance-tracker')) saved.compliance = true;
    if (p.startsWith('/utilities-register')) saved.utilities = true;
    return saved;
  };

  const [openPortals, setOpenPortals] = useState<Record<string, boolean>>(getInitialOpenPortals);
  const [openSubDropdowns, setOpenSubDropdowns] = useState<Record<string, boolean>>(getInitialOpenSubDropdowns);

  // Synchronize open state whenever currentPath changes
  useEffect(() => {
    if (!currentPath) return;

    const p = currentPath;
    let openOpCo = false;
    let openPropCo = false;
    const openSub: Record<string, boolean> = {};

    if (
      p.includes('type=non-fixed') ||
      p.startsWith('/asset-management/maintenance') ||
      p.startsWith('/compliance-register') ||
      p.startsWith('/compliance-tracker') ||
      p.startsWith('/tasks') ||
      p.startsWith('/task-manager') ||
      p.startsWith('/utilities-register') ||
      p.includes('type=maintenance')
    ) {
      openOpCo = true;
    }

    if (
      p.startsWith('/asset-management/properties') ||
      p.startsWith('/asset-management/hotels') ||
      (p.startsWith('/asset-management/assets') && !p.includes('type=non-fixed')) ||
      p.startsWith('/insurance-register') ||
      p.startsWith('/contracts-register') ||
      p.includes('type=contracts') ||
      p.startsWith('/document-repository')
    ) {
      openPropCo = true;
    }

    if (p.startsWith('/insurance-register')) openSub.insurance = true;
    if (p.startsWith('/contracts-register')) openSub.contracts = true;
    if (p.startsWith('/asset-management/maintenance')) openSub.maintenance = true;
    if (p.startsWith('/compliance-register') || p.startsWith('/compliance-tracker')) openSub.compliance = true;
    if (p.startsWith('/utilities-register')) openSub.utilities = true;

    if (openOpCo || openPropCo) {
      setOpenPortals((prev) => {
        const next = {
          ...prev,
          ...(openOpCo ? { opco: true } : {}),
          ...(openPropCo ? { propco: true } : {}),
        };
        try {
          localStorage.setItem('samko:sidebar_open_portals', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }

    if (Object.keys(openSub).length > 0) {
      setOpenSubDropdowns((prev) => {
        const next = { ...prev, ...openSub };
        try {
          localStorage.setItem('samko:sidebar_open_subdropdowns', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }
  }, [currentPath]);

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
        const comp = compRes.value.data;
        setCriticalCount(comp.filter((c: any) => c.status === 'Expired' || c.status === 'Action Required').length);
      }

      if (tasksRes.status === 'fulfilled' && tasksRes.value.success && tasksRes.value.data) {
        const tasks = tasksRes.value.data;
        setOpenTaskCount(tasks.filter((t: any) => t.status === 'open' || t.status === 'in-progress').length);
      }
    } catch (e) {
      console.error('Error fetching dynamic counts:', e);
    }
  };

  useEffect(() => {
    setCriticalCount(ALERTS.filter((a) => a.type === 'critical').length);
    setOpenTaskCount(TASKS.filter((t) => t.status === 'open' || t.status === 'in-progress').length);
    setWarningCount(ALERTS.filter((a) => a.type === 'warning').length);
    setOverdueCount(MAINTENANCE_RECORDS.filter((m) => m.status === 'overdue').length);
    setDueTodayCount(MAINTENANCE_RECORDS.filter((m) => m.status === 'due-today').length);

    fetchDynamicCounts();

    const pulseInterval = setInterval(() => setPulse((p) => !p), 1200);
    return () => clearInterval(pulseInterval);
  }, []);

  const togglePortal = (portalKey: 'propco' | 'opco') => {
    setOpenPortals((s) => {
      const next = { ...s, [portalKey]: !s[portalKey] };
      try {
        localStorage.setItem('samko:sidebar_open_portals', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const toggleSubDropdown = (key: string) => {
    setOpenSubDropdowns((s) => {
      const next = { ...s, [key]: !s[key] };
      try {
        localStorage.setItem('samko:sidebar_open_subdropdowns', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const isActive = (href: string) => {
    const effectiveCurrent = (typeof window !== 'undefined' && window.location.search)
      ? (window.location.pathname + window.location.search)
      : (currentPath || '');

    if (!effectiveCurrent || !href) return false;
    if (href === '/') return effectiveCurrent === '/' || currentPath === '/';

    const [hPath, hQuery] = href.split('?');
    const [cPath, cQuery] = effectiveCurrent.split('?');

    if (
      (href === '/asset-management/hotels' || href === '/asset-management/properties') &&
      (cPath === '/asset-management/properties' || cPath === '/asset-management/hotels')
    ) {
      return true;
    }

    if (href === effectiveCurrent) return true;

    if (hPath === '/asset-management/assets') {
      const isNonFixedHref = (hQuery || '').includes('type=non-fixed');
      const isNonFixedCurrent = (cQuery || '').includes('type=non-fixed');
      if (cPath === '/asset-management/assets') {
        return isNonFixedHref === isNonFixedCurrent;
      }
      return false;
    }

    // Planned Preventive Maintenance tabs
    if (cPath === '/asset-management/maintenance' && hPath === '/asset-management/maintenance') {
      const cParams = new URLSearchParams(cQuery || '');
      const hParams = new URLSearchParams(hQuery || '');
      const cFilter = cParams.get('filter');
      const hFilter = hParams.get('filter');

      if (hFilter) {
        if (hFilter === 'scheduled') {
          return !cFilter || cFilter === 'scheduled';
        }
        return cFilter === hFilter;
      }
      return !cFilter || cFilter === 'scheduled';
    }

    // Insurance Register tabs
    if (cPath === '/insurance-register' && hPath === '/insurance-register') {
      const cParams = new URLSearchParams(cQuery || '');
      const hParams = new URLSearchParams(hQuery || '');
      const cTab = cParams.get('tab');
      const hTab = hParams.get('tab');
      if (hTab) return cTab === hTab;
      return !cTab || cTab === 'register';
    }

    // Contracts Register tabs
    if (cPath === '/contracts-register' && hPath === '/contracts-register') {
      const cParams = new URLSearchParams(cQuery || '');
      const hParams = new URLSearchParams(hQuery || '');
      const cTab = cParams.get('tab');
      const hTab = hParams.get('tab');
      if (hTab) return cTab === hTab;
      return !cTab || cTab === 'register';
    }

    // Compliance Register tabs
    if (cPath === '/compliance-register' && hPath === '/compliance-register') {
      const cParams = new URLSearchParams(cQuery || '');
      const hParams = new URLSearchParams(hQuery || '');
      const cTab = cParams.get('tab');
      const hTab = hParams.get('tab');
      if (hTab) return cTab === hTab;
      return !cTab || cTab === 'register';
    }

    // Utilities Register types
    if (cPath === '/utilities-register' && hPath === '/utilities-register') {
      const cParams = new URLSearchParams(cQuery || '');
      const hParams = new URLSearchParams(hQuery || '');
      const cType = cParams.get('type');
      const hType = hParams.get('type');
      if (hType) return cType === hType;
      return !cType || cType === 'all';
    }

    if (hQuery) {
      if (cPath === hPath && cQuery) {
        const hParams = new URLSearchParams(hQuery);
        const cParams = new URLSearchParams(cQuery);
        let allMatch = true;
        hParams.forEach((val, key) => {
          if (cParams.get(key) !== val) allMatch = false;
        });
        return allMatch;
      }
      return false;
    }

    if (cPath === hPath) {
      if (cQuery) {
        return !cQuery;
      }
      return true;
    }

    if (cPath.startsWith(hPath + '/')) {
      return true;
    }

    return false;
  };

  const renderNavItem = (
    item: NavItem,
    isIndented = false,
    portalContext: 'propco' | 'opco' | 'default' = 'default'
  ) => {
    if (!isTabEnabled(item.id)) {
      return null;
    }

    const active = isActive(item.href);
    const access = getTabAccess(item.id);
    const isReadOnly = access === 'read';

    const isOpCo = portalContext === 'opco';
    const activeColor = isOpCo ? '#60a5fa' : '#e8c97a';
    const activeBg = isOpCo
      ? 'rgba(96, 165, 250, 0.16)'
      : 'rgba(232, 201, 122, 0.16)';
    const activeBorder = isOpCo
      ? '1px solid rgba(96, 165, 250, 0.40)'
      : '1px solid rgba(232, 201, 122, 0.40)';
    const activeShadow = isOpCo
      ? '0 0 12px rgba(96, 165, 250, 0.16)'
      : '0 0 12px rgba(232, 201, 122, 0.16)';

    return (
      <Link
        key={`nav-${item.id}`}
        href={item.href}
        title={collapsed ? `${item.label}${isReadOnly ? ' (Read Only)' : ''}` : undefined}
        className="flex items-center gap-2 rounded-lg transition-all duration-150 group relative"
        style={{
          padding: collapsed ? '8px 10px' : '7px 10px',
          background: active ? activeBg : 'transparent',
          border: active ? activeBorder : '1px solid transparent',
          color: active ? activeColor : 'var(--text2)',
          boxShadow: active ? activeShadow : 'none',
          fontSize: 13,
          fontWeight: active ? 600 : 500,
          textDecoration: 'none',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.background = isOpCo ? 'rgba(96, 165, 250, 0.08)' : 'rgba(232, 201, 122, 0.08)';
            e.currentTarget.style.color = isOpCo ? '#93c5fd' : '#fde68a';
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text2)';
          }
        }}
      >
        <span className="flex-shrink-0" style={{ color: active ? activeColor : undefined }}>{item.icon}</span>
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
    badgeVariant?: 'critical' | 'warning',
    portalContext: 'propco' | 'opco' | 'default' = 'default'
  ) => {
    const visibleSubItems = items.filter((item) => isTabEnabled(item.id));
    if (visibleSubItems.length === 0) return null;

    const isOpen = openSubDropdowns[id];
    const isChildActive = visibleSubItems.some((item) => isActive(item.href));

    const isOpCo = portalContext === 'opco';
    const activeColor = isOpCo ? '#60a5fa' : '#e8c97a';
    const activeBg = isOpCo ? 'rgba(96, 165, 250, 0.12)' : 'rgba(232, 201, 122, 0.12)';
    const activeBorder = isOpCo ? '1px solid rgba(96, 165, 250, 0.30)' : '1px solid rgba(232, 201, 122, 0.30)';

    if (collapsed) {
      return (
        <div key={`sub-${id}`} className="flex flex-col gap-0.5">
          {visibleSubItems.map((item) => renderNavItem(item, false, portalContext))}
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
            background: isChildActive ? activeBg : 'transparent',
            border: isChildActive ? activeBorder : '1px solid transparent',
            color: isChildActive ? activeColor : 'var(--text2)',
            fontSize: 13,
            fontWeight: isChildActive ? 600 : 500,
          }}
          onMouseEnter={(e) => {
            if (!isChildActive) {
              e.currentTarget.style.background = isOpCo ? 'rgba(96, 165, 250, 0.08)' : 'rgba(232, 201, 122, 0.08)';
              e.currentTarget.style.color = isOpCo ? '#93c5fd' : '#fde68a';
            }
          }}
          onMouseLeave={(e) => {
            if (!isChildActive) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text2)';
            }
          }}
        >
          <span className="flex-shrink-0" style={{ color: isChildActive ? activeColor : undefined }}>{icon}</span>
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
          <div
            className="border-l ml-4 pl-1.5 flex flex-col gap-0.5 my-0.5 transition-colors"
            style={{
              borderColor: isChildActive
                ? (isOpCo ? 'rgba(96, 165, 250, 0.40)' : 'rgba(232, 201, 122, 0.40)')
                : 'rgba(255, 255, 255, 0.10)',
            }}
          >
            {visibleSubItems.map((item) => renderNavItem(item, true, portalContext))}
          </div>
        )}
      </div>
    );
  };

  const renderPropCoNavItem = (item: NavItem, isIndented = false) => renderNavItem(item, isIndented, 'propco');
  const renderOpCoNavItem = (item: NavItem, isIndented = false) => renderNavItem(item, isIndented, 'opco');
  const renderPropCoSubDropdown = (id: string, label: string, icon: React.ReactNode, items: NavItem[], badgeCount?: number, badgeVariant?: 'critical' | 'warning') =>
    renderSubDropdown(id, label, icon, items, badgeCount, badgeVariant, 'propco');
  const renderOpCoSubDropdown = (id: string, label: string, icon: React.ReactNode, items: NavItem[], badgeCount?: number, badgeVariant?: 'critical' | 'warning') =>
    renderSubDropdown(id, label, icon, items, badgeCount, badgeVariant, 'opco');

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
        <div
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

          <div className="flex items-center gap-1.5">
            {/* Super Admin Quick Section Manager Button */}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSectionModal(true);
                }}
                className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-white/10 transition-colors cursor-pointer"
                title="Super Admin: Organize tabs for PropCo & OpCo"
              >
                <SlidersHorizontal size={11} />
              </button>
            )}

            <ChevronDown
              size={12}
              className="text-muted-foreground transition-transform duration-200"
              style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            />
          </div>
        </div>
      </div>
    );
  };

  const getTabIcon = (tabId: string): React.ReactNode => {
    switch (tabId) {
      case 'dashboard': return <LayoutDashboard size={15} />;
      case 'properties': return <Building2 size={15} />;
      case 'multi-site': return <Globe size={15} />;
      case 'fixed-assets':
      case 'all-assets': return <Package size={15} />;
      case 'non-fixed-assets':
      case 'non-fixed': return <Package size={15} />;
      case 'categories': return <Tag size={15} />;
      case 'maintenance': return <Calendar size={15} />;
      case 'compliance': return <ShieldCheck size={15} />;
      case 'compliance-tracker': return <Calendar size={15} />;
      case 'insurance': return <Shield size={15} />;
      case 'contracts': return <ScrollText size={15} />;
      case 'utilities': return <Zap size={15} />;
      case 'tasks': return <CheckSquare size={15} />;
      case 'documents': return <FolderOpen size={15} />;
      case 'reports': return <BarChart3 size={15} />;
      case 'inspections': return <ClipboardCheck size={15} />;
      case 'qr-codes': return <QrCode size={15} />;
      case 'import': return <Upload size={15} />;
      case 'recent-logs': return <History size={15} />;
      case 'users': return <Users size={15} />;
      case 'settings': return <Settings size={15} />;
      default: return <Package size={15} />;
    }
  };

  const bottomNavItems: NavItem[] = [
    ...(isInBottom('recent-logs') && isNavVisible('recent-logs')
      ? [{ id: 'recent-logs', label: getNavLabel('recent-logs', 'Recent Logs'), href: '/recent-logs', icon: <History size={16} /> }]
      : []),
    ...(isInBottom('multi-site') && isNavVisible('multi-site')
      ? [{ id: 'multi-site', label: getNavLabel('multi-site', 'Multi-Site Operations'), href: '/multi-site-operations', icon: <Globe size={16} /> }]
      : []),
    ...(isInBottom('import') && isNavVisible('import')
      ? [{ id: 'import', label: getNavLabel('import', 'Import / Export'), href: '/asset-management/import', icon: <Upload size={16} /> }]
      : []),
    ...(canManageUsers && isInBottom('users') && isNavVisible('users')
      ? [{ id: 'users', label: getNavLabel('users', 'Users & Roles'), href: '/users', icon: <Users size={16} /> }]
      : []),
    ...(canAccessSettings && isInBottom('settings') && isNavVisible('settings')
      ? [{ id: 'settings', label: getNavLabel('settings', 'Settings'), href: '/settings', icon: <Settings size={16} /> }]
      : []),
    // Dynamically include any other system tabs assigned to Bottom by Super Admin
    ...ALL_SYSTEM_TABS.filter((tab) =>
      !['recent-logs', 'multi-site', 'import', 'users', 'settings'].includes(tab.id) &&
      isInBottom(tab.id) &&
      isNavVisible(tab.id)
    ).map((tab) => ({
      id: tab.id,
      label: getNavLabel(tab.id, tab.name),
      href: tab.path,
      icon: getTabIcon(tab.id),
    })),
  ];

  // Filter tabs for the Super Admin Section Organizer Modal
  const modalTabs = useMemo(() => {
    return ALL_SYSTEM_TABS.filter((tab) => {
      const matchSearch =
        tab.name.toLowerCase().includes(sectionSearch.toLowerCase()) ||
        tab.id.toLowerCase().includes(sectionSearch.toLowerCase()) ||
        tab.description.toLowerCase().includes(sectionSearch.toLowerCase());
      const loc = sectionMapping[tab.id] || DEFAULT_TAB_SECTIONS[tab.id] || 'propco';
      const matchFilter =
        sectionFilter === 'ALL' ||
        (sectionFilter === 'both' ? loc === 'both' : loc === sectionFilter);
      return matchSearch && matchFilter;
    });
  }, [sectionSearch, sectionFilter, sectionMapping]);

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
              src="/assets/images/samko_logo.png?v=6"
              alt="SamkoCentral Logo"
              className="transition-all duration-200"
              style={{
                width: collapsed ? 36 : 38,
                height: collapsed ? 36 : 38,
                objectFit: 'contain',
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
        {isNavVisible('dashboard') && (
          <div className="flex flex-col gap-0.5 mb-1">
            {renderNavItem({
              id: 'dashboard',
              label: getNavLabel('dashboard', 'Dashboard'),
              href: '/',
              icon: <LayoutDashboard size={16} />,
            })}
          </div>
        )}

        {/* ── PROPCO DROPDOWN / ACCORDION ── */}
        {isNavVisible('propco') && (
          <>
            {renderPortalHeader(
              'propco',
              getNavLabel('propco', cmsPropco?.title || 'PROPCO'),
              navItemsMap['propco']?.badgeText || cmsPropco?.badgeText || 'Asset Co',
              cmsPropco?.badgeColor || '#e8c97a',
              <Building2 size={13} />,
              openPortals.propco
            )}

        {(openPortals.propco || collapsed) && (
          <div className="flex flex-col gap-0.5 mb-2 pl-0.5">
            {/* Properties */}
            {isInPropCo('properties') && isTabVisibleInCms('propco', 'properties') &&
              renderPropCoNavItem({
                id: 'properties',
                label: getTabLabel('propco', 'properties', 'Properties'),
                href: getTabPath('propco', 'properties', '/asset-management/properties'),
                icon: <Building2 size={15} />,
              })}

            {/* Fixed Assets */}
            {(isInPropCo('fixed-assets') || isInPropCo('all-assets')) && isTabVisibleInCms('propco', 'all-assets') &&
              renderPropCoNavItem({
                id: 'all-assets',
                label: getTabLabel('propco', 'all-assets', 'Fixed Assets'),
                href: getTabPath('propco', 'all-assets', '/asset-management/assets'),
                icon: <Package size={15} />,
              })}

            {/* Non-Fixed Assets (if placed in PropCo or Both) */}
            {(isInPropCo('non-fixed-assets') || isInPropCo('non-fixed')) && isTabVisibleInCms('propco', 'non-fixed') &&
              renderPropCoNavItem({
                id: 'non-fixed',
                label: getTabLabel('propco', 'non-fixed', 'Non-Fixed Assets'),
                href: getTabPath('propco', 'non-fixed', '/asset-management/assets?type=non-fixed'),
                icon: <Package size={15} />,
              })}

            {/* Categories */}
            {isInPropCo('categories') && isTabVisibleInCms('propco', 'categories') &&
              renderPropCoNavItem({
                id: 'categories',
                label: getTabLabel('propco', 'categories', 'Categories'),
                href: getTabPath('propco', 'categories', '/asset-management/categories'),
                icon: <Tag size={15} />,
              })}

            {/* Insurance Dropdown */}
            {isInPropCo('insurance') && isTabVisibleInCms('propco', 'insurance') &&
              renderPropCoSubDropdown(
                'insurance',
                getTabLabel('propco', 'insurance', 'Insurance'),
                <Shield size={15} />,
                [
                  { id: 'insurance-register', label: getTabLabel('propco', 'insurance-register', 'Insurance Register'), href: '/insurance-register', icon: <Shield size={13} /> },
                  { id: 'claims', label: getTabLabel('propco', 'claims', 'Claims'), href: '/insurance-register?tab=claims', icon: <FileBarChart size={13} /> },
                  { id: 'insurance-renewals', label: getTabLabel('propco', 'insurance-renewals', 'Renewals'), href: '/insurance-register?tab=renewals', icon: <RefreshCw size={13} /> },
                ]
              )}

            {/* Contracts Dropdown */}
            {isInPropCo('contracts') && isTabVisibleInCms('propco', 'contracts') &&
              renderPropCoSubDropdown(
                'contracts',
                getTabLabel('propco', 'contracts', 'Contracts'),
                <ScrollText size={15} />,
                [
                  { id: 'contracts-register', label: getTabLabel('propco', 'contracts-register', 'Contracts Register'), href: '/contracts-register', icon: <ScrollText size={13} /> },
                  { id: 'suppliers', label: getTabLabel('propco', 'suppliers', 'Suppliers'), href: '/contracts-register?tab=suppliers', icon: <Handshake size={13} /> },
                  { id: 'contracts-renewals', label: getTabLabel('propco', 'contracts-renewals', 'Renewals'), href: '/contracts-register?tab=renewals', icon: <RefreshCw size={13} /> },
                  { id: 'slas', label: getTabLabel('propco', 'slas', 'SLAs'), href: '/contracts-register?tab=slas', icon: <Star size={13} /> },
                ]
              )}

            {/* Maintenance Dropdown (if placed in PropCo or Both) */}
            {isInPropCo('maintenance') && isTabVisibleInCms('propco', 'maintenance') &&
              renderPropCoSubDropdown(
                'maintenance',
                getTabLabel('propco', 'maintenance', 'Maintenance'),
                <Calendar size={15} />,
                [
                  { id: 'maintenance-scheduled', label: getTabLabel('propco', 'maintenance-scheduled', 'Scheduled'), href: '/asset-management/maintenance?filter=scheduled', icon: <Calendar size={13} /> },
                  { id: 'maintenance-due', label: getTabLabel('propco', 'maintenance-due', 'Due Today'), href: '/asset-management/maintenance?filter=due-today', icon: <AlertCircle size={13} />, badgeCount: dueTodayCount, badgeVariant: 'warning' },
                  { id: 'maintenance-overdue', label: getTabLabel('propco', 'maintenance-overdue', 'Overdue'), href: '/asset-management/maintenance?filter=overdue', icon: <AlertTriangle size={13} />, badgeCount: overdueCount, badgeVariant: 'critical' },
                  { id: 'maintenance-completed', label: getTabLabel('propco', 'maintenance-completed', 'Completed'), href: '/asset-management/maintenance?filter=completed', icon: <CheckSquare size={13} /> },
                ],
                overdueCount > 0 ? overdueCount : dueTodayCount > 0 ? dueTodayCount : undefined,
                overdueCount > 0 ? 'critical' : 'warning'
              )}

            {/* Compliance Dropdown (if placed in PropCo or Both) */}
            {isInPropCo('compliance') && isTabVisibleInCms('propco', 'compliance') &&
              renderPropCoSubDropdown(
                'compliance',
                getTabLabel('propco', 'compliance', 'Compliance'),
                <ShieldCheck size={15} />,
                [
                  { id: 'compliance-register', label: getTabLabel('propco', 'compliance-register', 'Compliance Register'), href: '/compliance-register', icon: <ShieldCheck size={13} />, badgeCount: criticalCount, badgeVariant: 'critical' },
                  { id: 'certifications', label: getTabLabel('propco', 'certifications', 'Certifications'), href: '/compliance-register?tab=certifications', icon: <FileCheck size={13} /> },
                  { id: 'statutory', label: getTabLabel('propco', 'statutory', 'Statutory Inspections'), href: '/compliance-register?tab=statutory', icon: <Flame size={13} /> },
                  { id: 'expiry-dashboard', label: getTabLabel('propco', 'expiry-dashboard', 'Expiry Dashboard'), href: '/compliance-tracker', icon: <AlertTriangle size={13} /> },
                ],
                criticalCount > 0 ? criticalCount : undefined,
                'critical'
              )}

            {/* Tasks (if placed in PropCo or Both) */}
            {isInPropCo('tasks') && isTabVisibleInCms('propco', 'tasks') &&
              renderPropCoNavItem({
                id: 'tasks',
                label: getTabLabel('propco', 'tasks', 'Tasks and Alerts'),
                href: getTabPath('propco', 'tasks', '/tasks'),
                icon: <CheckSquare size={15} />,
                badgeCount: openTaskCount,
                badgeVariant: 'warning',
              })}

            {/* Reports */}
            {(isInPropCo('reports') || isInPropCo('contract-reports')) && isTabVisibleInCms('propco', 'reports') &&
              renderPropCoNavItem({
                id: 'contract-reports',
                label: getTabLabel('propco', 'reports', 'Reports'),
                href: getTabPath('propco', 'reports', '/asset-management/reports?type=contracts'),
                icon: <BarChart3 size={15} />,
              })}

            {/* Documents (if placed in PropCo or Both) */}
            {isInPropCo('documents') && isTabVisibleInCms('propco', 'documents') &&
              renderPropCoNavItem({
                id: 'documents',
                label: getTabLabel('propco', 'documents', 'Documents'),
                href: getTabPath('propco', 'documents', '/document-repository'),
                icon: <FolderOpen size={15} />,
              })}

            {/* Utility Dropdown (if placed in PropCo or Both) */}
            {isInPropCo('utilities') && isTabVisibleInCms('propco', 'utilities') &&
              renderPropCoSubDropdown(
                'utilities',
                getTabLabel('propco', 'utilities', 'Utility'),
                <Zap size={15} />,
                [
                  { id: 'utilities-register', label: getTabLabel('propco', 'utilities-register', 'Utilities Register'), href: '/utilities-register', icon: <Zap size={13} /> },
                  { id: 'utilities-energy', label: getTabLabel('propco', 'utilities-energy', 'Energy & Water Accounts'), href: '/utilities-register?type=electricity', icon: <Zap size={13} /> },
                ]
              )}

            {/* Multi-Site (if placed in PropCo or Both) */}
            {isInPropCo('multi-site') && isTabVisibleInCms('propco', 'multi-site') &&
              renderPropCoNavItem({
                id: 'multi-site',
                label: getTabLabel('propco', 'multi-site', 'Multi-Site Operations'),
                href: getTabPath('propco', 'multi-site', '/multi-site-operations'),
                icon: <Globe size={15} />,
              })}

            {/* Inspections (if placed in PropCo or Both) */}
            {isInPropCo('inspections') && isTabVisibleInCms('propco', 'inspections') &&
              renderPropCoNavItem({
                id: 'inspections',
                label: getTabLabel('propco', 'inspections', 'Asset Inspections'),
                href: getTabPath('propco', 'inspections', '/asset-management/inspections'),
                icon: <ClipboardCheck size={15} />,
              })}

            {/* QR Codes (if placed in PropCo or Both) */}
            {isInPropCo('qr-codes') && isTabVisibleInCms('propco', 'qr-codes') &&
              renderPropCoNavItem({
                id: 'qr-codes',
                label: getTabLabel('propco', 'qr-codes', 'QR Codes & Scanner'),
                href: getTabPath('propco', 'qr-codes', '/asset-management/qr-scanner'),
                icon: <QrCode size={15} />,
              })}

            {/* Dynamic Custom Tabs Added via CMS */}
            {cmsPropco?.tabs
              ?.filter((t) => t.isCustom && t.enabled)
              .map((t) =>
                renderPropCoNavItem({
                  id: t.id,
                  label: t.name,
                  href: t.path,
                  icon: <Package size={15} />,
                })
              )}
          </div>
        )}
          </>
        )}

        {/* ── OPCO DROPDOWN / ACCORDION ── */}
        {isNavVisible('opco') && (
          <>
            {renderPortalHeader(
              'opco',
              getNavLabel('opco', cmsOpco?.title || 'OPCO'),
              navItemsMap['opco']?.badgeText || cmsOpco?.badgeText || 'Operations',
              cmsOpco?.badgeColor || '#60a5fa',
              <ShieldCheck size={13} />,
              openPortals.opco
            )}

        {(openPortals.opco || collapsed) && (
          <div className="flex flex-col gap-0.5 mb-2 pl-0.5">
            {/* Non-Fixed Assets */}
            {(isInOpCo('non-fixed-assets') || isInOpCo('non-fixed')) && isTabVisibleInCms('opco', 'non-fixed') &&
              renderOpCoNavItem({
                id: 'non-fixed',
                label: getTabLabel('opco', 'non-fixed', 'Non-Fixed Assets'),
                href: getTabPath('opco', 'non-fixed', '/asset-management/assets?type=non-fixed'),
                icon: <Package size={15} />,
              })}

            {/* Fixed Assets (if placed in OpCo or Both) */}
            {(isInOpCo('fixed-assets') || isInOpCo('all-assets')) && isTabVisibleInCms('opco', 'all-assets') &&
              renderOpCoNavItem({
                id: 'all-assets',
                label: getTabLabel('opco', 'all-assets', 'Fixed Assets'),
                href: getTabPath('opco', 'all-assets', '/asset-management/assets'),
                icon: <Package size={15} />,
              })}

            {/* Properties (if placed in OpCo or Both) */}
            {isInOpCo('properties') && isTabVisibleInCms('opco', 'properties') &&
              renderOpCoNavItem({
                id: 'properties',
                label: getTabLabel('opco', 'properties', 'Properties'),
                href: getTabPath('opco', 'properties', '/asset-management/properties'),
                icon: <Building2 size={15} />,
              })}

            {/* Categories */}
            {isInOpCo('categories') && isTabVisibleInCms('opco', 'categories') &&
              renderOpCoNavItem({
                id: 'categories',
                label: getTabLabel('opco', 'categories', 'Categories'),
                href: getTabPath('opco', 'categories', '/asset-management/categories'),
                icon: <Tag size={15} />,
              })}

            {/* Insurance Dropdown (if placed in OpCo or Both) */}
            {isInOpCo('insurance') && isTabVisibleInCms('opco', 'insurance') &&
              renderOpCoSubDropdown(
                'insurance',
                getTabLabel('opco', 'insurance', 'Insurance'),
                <Shield size={15} />,
                [
                  { id: 'insurance-register', label: getTabLabel('opco', 'insurance-register', 'Insurance Register'), href: '/insurance-register', icon: <Shield size={13} /> },
                  { id: 'claims', label: getTabLabel('opco', 'claims', 'Claims'), href: '/insurance-register?tab=claims', icon: <FileBarChart size={13} /> },
                  { id: 'insurance-renewals', label: getTabLabel('opco', 'insurance-renewals', 'Renewals'), href: '/insurance-register?tab=renewals', icon: <RefreshCw size={13} /> },
                ]
              )}

            {/* Contracts Dropdown (if placed in OpCo or Both) */}
            {isInOpCo('contracts') && isTabVisibleInCms('opco', 'contracts') &&
              renderOpCoSubDropdown(
                'contracts',
                getTabLabel('opco', 'contracts', 'Contracts'),
                <ScrollText size={15} />,
                [
                  { id: 'contracts-register', label: getTabLabel('opco', 'contracts-register', 'Contracts Register'), href: '/contracts-register', icon: <ScrollText size={13} /> },
                  { id: 'suppliers', label: getTabLabel('opco', 'suppliers', 'Suppliers'), href: '/contracts-register?tab=suppliers', icon: <Handshake size={13} /> },
                  { id: 'contracts-renewals', label: getTabLabel('opco', 'contracts-renewals', 'Renewals'), href: '/contracts-register?tab=renewals', icon: <RefreshCw size={13} /> },
                  { id: 'slas', label: getTabLabel('opco', 'slas', 'SLAs'), href: '/contracts-register?tab=slas', icon: <Star size={13} /> },
                ]
              )}

            {/* Maintenance Dropdown */}
            {isInOpCo('maintenance') && isTabVisibleInCms('opco', 'maintenance') &&
              renderOpCoSubDropdown(
                'maintenance',
                getTabLabel('opco', 'maintenance', 'Maintenance'),
                <Calendar size={15} />,
                [
                  { id: 'maintenance-scheduled', label: getTabLabel('opco', 'maintenance-scheduled', 'Scheduled'), href: '/asset-management/maintenance?filter=scheduled', icon: <Calendar size={13} /> },
                  { id: 'maintenance-due', label: getTabLabel('opco', 'maintenance-due', 'Due Today'), href: '/asset-management/maintenance?filter=due-today', icon: <AlertCircle size={13} />, badgeCount: dueTodayCount, badgeVariant: 'warning' },
                  { id: 'maintenance-overdue', label: getTabLabel('opco', 'maintenance-overdue', 'Overdue'), href: '/asset-management/maintenance?filter=overdue', icon: <AlertTriangle size={13} />, badgeCount: overdueCount, badgeVariant: 'critical' },
                  { id: 'maintenance-completed', label: getTabLabel('opco', 'maintenance-completed', 'Completed'), href: '/asset-management/maintenance?filter=completed', icon: <CheckSquare size={13} /> },
                ],
                overdueCount > 0 ? overdueCount : dueTodayCount > 0 ? dueTodayCount : undefined,
                overdueCount > 0 ? 'critical' : 'warning'
              )}

            {/* Compliance Dropdown */}
            {isInOpCo('compliance') && isTabVisibleInCms('opco', 'compliance') &&
              renderOpCoSubDropdown(
                'compliance',
                getTabLabel('opco', 'compliance', 'Compliance'),
                <ShieldCheck size={15} />,
                [
                  { id: 'compliance-register', label: getTabLabel('opco', 'compliance-register', 'Compliance Register'), href: '/compliance-register', icon: <ShieldCheck size={13} />, badgeCount: criticalCount, badgeVariant: 'critical' },
                  { id: 'certifications', label: getTabLabel('opco', 'certifications', 'Certifications'), href: '/compliance-register?tab=certifications', icon: <FileCheck size={13} /> },
                  { id: 'statutory', label: getTabLabel('opco', 'statutory', 'Statutory Inspections'), href: '/compliance-register?tab=statutory', icon: <Flame size={13} /> },
                  { id: 'expiry-dashboard', label: getTabLabel('opco', 'expiry-dashboard', 'Expiry Dashboard'), href: '/compliance-tracker', icon: <AlertTriangle size={13} /> },
                ],
                criticalCount > 0 ? criticalCount : undefined,
                'critical'
              )}

            {/* Tasks and Alerts */}
            {isInOpCo('tasks') && isTabVisibleInCms('opco', 'tasks') &&
              renderOpCoNavItem({
                id: 'tasks',
                label: getTabLabel('opco', 'tasks', 'Tasks and Alerts'),
                href: getTabPath('opco', 'tasks', '/tasks'),
                icon: <CheckSquare size={15} />,
                badgeCount: openTaskCount,
                badgeVariant: 'warning',
              })}

            {/* Reports */}
            {(isInOpCo('reports') || isInOpCo('maintenance-reports')) && isTabVisibleInCms('opco', 'reports') &&
              renderOpCoNavItem({
                id: 'maintenance-reports',
                label: getTabLabel('opco', 'reports', 'Reports'),
                href: getTabPath('opco', 'reports', '/asset-management/reports?type=maintenance'),
                icon: <BarChart2 size={15} />,
              })}

            {/* Task Module */}
            {isInOpCo('task-module') && isTabVisibleInCms('opco', 'task-module') &&
              renderOpCoNavItem({
                id: 'task-module',
                label: getTabLabel('opco', 'task-module', 'Task Module'),
                href: getTabPath('opco', 'task-module', '/task-manager'),
                icon: <ClipboardList size={15} />,
              })}

            {/* Utility Dropdown */}
            {isInOpCo('utilities') && isTabVisibleInCms('opco', 'utilities') &&
              renderOpCoSubDropdown(
                'utilities',
                getTabLabel('opco', 'utilities', 'Utility'),
                <Zap size={15} />,
                [
                  { id: 'utilities-register', label: getTabLabel('opco', 'utilities-register', 'Utilities Register'), href: '/utilities-register', icon: <Zap size={13} /> },
                  { id: 'utilities-energy', label: getTabLabel('opco', 'utilities-energy', 'Energy & Water Accounts'), href: '/utilities-register?type=electricity', icon: <Zap size={13} /> },
                ]
              )}

            {/* Documents (if placed in OpCo or Both) */}
            {isInOpCo('documents') && isTabVisibleInCms('opco', 'documents') &&
              renderOpCoNavItem({
                id: 'documents',
                label: getTabLabel('opco', 'documents', 'Documents'),
                href: getTabPath('opco', 'documents', '/document-repository'),
                icon: <FolderOpen size={15} />,
              })}

            {/* Multi-Site (if placed in OpCo or Both) */}
            {isInOpCo('multi-site') && isTabVisibleInCms('opco', 'multi-site') &&
              renderOpCoNavItem({
                id: 'multi-site',
                label: getTabLabel('opco', 'multi-site', 'Multi-Site Operations'),
                href: getTabPath('opco', 'multi-site', '/multi-site-operations'),
                icon: <Globe size={15} />,
              })}

            {/* Inspections (if placed in OpCo or Both) */}
            {isInOpCo('inspections') && isTabVisibleInCms('opco', 'inspections') &&
              renderOpCoNavItem({
                id: 'inspections',
                label: getTabLabel('opco', 'inspections', 'Asset Inspections'),
                href: getTabPath('opco', 'inspections', '/asset-management/inspections'),
                icon: <ClipboardCheck size={15} />,
              })}

            {/* QR Codes (if placed in OpCo or Both) */}
            {isInOpCo('qr-codes') && isTabVisibleInCms('opco', 'qr-codes') &&
              renderOpCoNavItem({
                id: 'qr-codes',
                label: getTabLabel('opco', 'qr-codes', 'QR Codes & Scanner'),
                href: getTabPath('opco', 'qr-codes', '/asset-management/qr-scanner'),
                icon: <QrCode size={15} />,
              })}

            {/* Dynamic Custom Tabs Added via CMS */}
            {cmsOpco?.tabs
              ?.filter((t) => t.isCustom && t.enabled)
              .map((t) =>
                renderOpCoNavItem({
                  id: t.id,
                  label: t.name,
                  href: t.path,
                  icon: <Package size={15} />,
                })
              )}
          </div>
        )}
          </>
        )}

        <div className="border-t border-border my-2" />

        {/* Bottom nav items */}
        {bottomNavItems.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {bottomNavItems.map((item) => renderNavItem(item))}
          </div>
        )}
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

      {/* ── SUPER ADMIN: ORGANIZE SECTION TABS MODAL (PROPCO / OPCO) ── */}
      {showSectionModal && (
        <Modal
          open={showSectionModal}
          onClose={() => setShowSectionModal(false)}
          title="Organize Section Tabs · PROPCO & OPCO"
          subtitle="Super Admin tool: Copy or move tabs into PROPCO, OPCO, or BOTH sections."
          width={680}
        >
          <div className="space-y-4 text-xs">
            {/* Explanatory note */}
            <div
              className="p-3 rounded-xl border border-border flex items-start gap-2.5"
              style={{ background: 'var(--surface2)' }}
            >
              <Layers size={16} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-foreground">Copy &amp; Move Tabs Across Sections</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Click <strong className="text-emerald-400">Both Sections</strong> to copy a tab so it displays in both PropCo and OpCo without removing it from either. Or click <strong className="text-amber-400">PropCo</strong> / <strong className="text-blue-400">OpCo</strong> to assign it exclusively.
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
                  Filter:
                </span>
                {['ALL', 'propco', 'opco', 'both', 'bottom'].map((f) => {
                  const isSelected = sectionFilter === f;
                  const label = f === 'ALL' ? 'All Tabs' : f === 'both' ? 'Both Sections' : f.toUpperCase();
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setSectionFilter(f)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer"
                      style={{
                        background: isSelected ? 'var(--primary)' : 'var(--surface2)',
                        color: isSelected ? '#000' : 'var(--muted-foreground)',
                        borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tabs..."
                  value={sectionSearch}
                  onChange={(e) => setSectionSearch(e.target.value)}
                  className="pl-8 pr-2.5 py-1 text-xs rounded-lg border border-border outline-none w-48"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>
            </div>

            {/* Tab list */}
            <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
              {modalTabs.map((tab) => {
                const currentLoc = sectionMapping[tab.id] || DEFAULT_TAB_SECTIONS[tab.id] || 'propco';
                const meta = SECTION_BADGE_STYLES[currentLoc] || SECTION_BADGE_STYLES.propco;

                return (
                  <div
                    key={tab.id}
                    className="p-3 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-white/[0.02] transition-colors"
                    style={{ background: 'var(--surface)' }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: 'var(--surface2)' }}>
                        <Building2 size={14} className="text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs text-foreground">{tab.name}</span>
                          <span
                            className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase border"
                            style={{
                              background: meta.badgeBg,
                              color: meta.color,
                              borderColor: `${meta.color}44`,
                            }}
                          >
                            {currentLoc === 'both' ? 'PropCo & OpCo' : meta.label}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">{tab.path}</div>
                      </div>
                    </div>

                    {/* Section Assignment Buttons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                      {/* 1. PropCo */}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = moveTabToSection(tab.id, 'propco');
                          setSectionMapping(updated);
                          toast.success(`Tab "${tab.name}" moved to PROPCO!`);
                        }}
                        className="px-2 py-1 rounded text-[10.5px] font-bold border transition-all cursor-pointer"
                        style={{
                          background: currentLoc === 'propco' ? 'rgba(232,201,122,0.18)' : 'var(--surface2)',
                          borderColor: currentLoc === 'propco' ? '#e8c97a' : 'var(--border)',
                          color: currentLoc === 'propco' ? '#e8c97a' : 'var(--muted-foreground)',
                        }}
                        title="Move to PropCo section"
                      >
                        PropCo
                      </button>

                      {/* 2. OpCo */}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = moveTabToSection(tab.id, 'opco');
                          setSectionMapping(updated);
                          toast.success(`Tab "${tab.name}" moved to OPCO!`);
                        }}
                        className="px-2 py-1 rounded text-[10.5px] font-bold border transition-all cursor-pointer"
                        style={{
                          background: currentLoc === 'opco' ? 'rgba(96,165,250,0.18)' : 'var(--surface2)',
                          borderColor: currentLoc === 'opco' ? '#60a5fa' : 'var(--border)',
                          color: currentLoc === 'opco' ? '#60a5fa' : 'var(--muted-foreground)',
                        }}
                        title="Move to OpCo section"
                      >
                        OpCo
                      </button>

                      {/* 3. Both Sections (Copy to Both) */}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = copyTabToSection(tab.id, 'both');
                          setSectionMapping(updated);
                          toast.success(`Tab "${tab.name}" copied to BOTH PropCo & OpCo!`, {
                            description: 'It now appears in both sections without moving away.',
                          });
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-[10.5px] font-bold border transition-all cursor-pointer"
                        style={{
                          background: currentLoc === 'both' ? 'rgba(61,214,140,0.2)' : 'var(--surface2)',
                          borderColor: currentLoc === 'both' ? '#3dd68c' : 'var(--border)',
                          color: currentLoc === 'both' ? '#3dd68c' : 'var(--muted-foreground)',
                        }}
                        title="Copy to both PropCo and OpCo sections so it exists in both places"
                      >
                        <Copy size={10} />
                        <span>Both Sections</span>
                      </button>

                      {/* 4. Bottom */}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = moveTabToSection(tab.id, 'bottom');
                          setSectionMapping(updated);
                          toast.success(`Tab "${tab.name}" moved to Bottom Nav!`);
                        }}
                        className="px-2 py-1 rounded text-[10.5px] font-bold border transition-all cursor-pointer"
                        style={{
                          background: currentLoc === 'bottom' ? 'rgba(148,163,184,0.18)' : 'var(--surface2)',
                          borderColor: currentLoc === 'bottom' ? '#94a3b8' : 'var(--border)',
                          color: currentLoc === 'bottom' ? '#94a3b8' : 'var(--muted-foreground)',
                        }}
                        title="Move to bottom nav list"
                      >
                        Bottom
                      </button>
                    </div>
                  </div>
                );
              })}

              {modalTabs.length === 0 && (
                <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                  No tabs match &quot;{sectionSearch}&quot;
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowSectionModal(false)}
                className="samko-btn-primary px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </aside>
  );
}