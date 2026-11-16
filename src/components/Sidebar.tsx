'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Package,
  Building2,
  ChevronDown,
  BarChart3,
  Upload,
  BarChart2,
  Shield,
  FileCheck,
  Flame,
  ScrollText,
  Users,
  FileBarChart,
  Calendar,
  CheckSquare,
  AlertCircle,
  RefreshCw,
  Handshake,
  Star,
  Zap,
  History,
  Eye,
  ClipboardList,
  Tag,
  FolderOpen,
  ClipboardCheck,
  QrCode,
  Globe,
  SlidersHorizontal,
  ArrowRightLeft,
  Copy,
  Layers,
  Check,
  Search,
  Plus,
  CloudUpload,
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
import { useAppCms, type AppCmsNavigationItem, addCustomTabOrDropdown } from '@/lib/appCmsConfig';
import Modal from '@/components/ui/Modal';
import CustomDropdown from '@/components/ui/CustomDropdown';
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
  badgeTag?: string;
}

const SECTION_BADGE_STYLES: Record<
  TabSectionLocation,
  { label: string; badgeBg: string; color: string }
> = {
  propco: { label: 'PROPCO', badgeBg: 'rgba(232,201,122,0.15)', color: '#e8c97a' },
  opco: { label: 'OPCO', badgeBg: 'rgba(96,165,250,0.15)', color: '#60a5fa' },
  both: { label: 'PROPCO & OPCO', badgeBg: 'rgba(61,214,140,0.15)', color: '#3dd68c' },
  bottom: { label: 'BOTTOM', badgeBg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
};

export default function Sidebar({ currentPath }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeItemRef = useRef<HTMLAnchorElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  const activeRoutePath = useMemo(() => {
    const qs = searchParams?.toString();
    if (qs) return `${pathname}?${qs}`;
    if (currentPath && currentPath.includes('?')) return currentPath;
    return pathname || currentPath || '/';
  }, [pathname, searchParams, currentPath]);

  // Keep active tab smoothly scrolled into view so it never jumps to the top section
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [activeRoutePath]);

  const {
    user,
    isDigitalBot,
    activePortal,
    setActivePortal,
    roleBadgeColor,
    canManageUsers,
    canAccessSettings,
    isViewer,
    isTabEnabled,
    getTabAccess,
    isPropertyAccessible,
  } = useAuth();
  const isSuperAdmin = user.roleLevel === 'L1';
  const isSuperAdminOrBot =
    user.roleLevel === 'L1' ||
    user.id === 'usr-bot-001' ||
    user.name?.toLowerCase().includes('digital bot');
  const canAccessApprovals = isSuperAdminOrBot && isTabEnabled('approvals');
  const canAccessDocsUpload = user.roleLevel !== 'L4' && isTabEnabled('docs-upload');
  const { propco: cmsPropco, opco: cmsOpco, navigationItems, refresh: refreshCms } = useAppCms();

  const navItemsMap = useMemo(() => {
    const map: Record<string, AppCmsNavigationItem> = {};
    (navigationItems || []).forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [navigationItems]);

  const getNavLabel = (id: string, fallback: string) => {
    if (id === 'recent-logs') return 'Audit Logs';
    if (id === 'approvals') return navItemsMap['approvals']?.label || 'Approvals';
    if (id === 'docs-upload') return navItemsMap['docs-upload']?.label || 'Docs Upload';
    return navItemsMap[id]?.label || fallback;
  };

  const isNavVisible = (id: string) => {
    return navItemsMap[id] ? navItemsMap[id].enabled !== false : true;
  };

  const getTabLabel = (portal: 'propco' | 'opco', tabId: string, fallback: string) => {
    const portalConfig = portal === 'propco' ? cmsPropco : cmsOpco;
    const tab = portalConfig?.tabs?.find(
      (t) =>
        t.id === tabId ||
        (tabId === 'all-assets' && t.id === 'fixed-assets') ||
        (tabId === 'reports' && t.id === 'maintenance-reports')
    );
    if (tabId === 'propco-dashboard' && (!tab?.name || tab?.name === 'Dashboard')) {
      return 'PropCo Dashboard';
    }
    if (tabId === 'opco-dashboard' && (!tab?.name || tab?.name === 'Dashboard')) {
      return 'OpCo Dashboard';
    }
    if (tab?.name) return tab.name;

    // Check inside subtabs of all tabs in portalConfig
    if (portalConfig?.tabs) {
      for (const t of portalConfig.tabs) {
        if (t.subtabs) {
          const sub = t.subtabs.find(
            (s) =>
              s.id === tabId ||
              `${t.id}-${s.id}` === tabId ||
              tabId.endsWith(s.id) ||
              s.label.toLowerCase() === fallback.toLowerCase()
          );
          if (sub?.label) return sub.label;
        }
      }
    }
    return fallback;
  };

  const isTabVisibleInCms = (portal: 'propco' | 'opco', tabId: string) => {
    const portalConfig = portal === 'propco' ? cmsPropco : cmsOpco;
    const tab = portalConfig?.tabs?.find(
      (t) =>
        t.id === tabId ||
        (tabId === 'all-assets' && t.id === 'fixed-assets') ||
        (tabId === 'reports' && t.id === 'maintenance-reports')
    );
    if (!tab) return true;
    return tab.enabled !== false;
  };

  const getTabPath = (portal: 'propco' | 'opco', tabId: string, fallback: string) => {
    const portalConfig = portal === 'propco' ? cmsPropco : cmsOpco;
    const tab = portalConfig?.tabs?.find(
      (t) =>
        t.id === tabId ||
        (tabId === 'all-assets' && t.id === 'fixed-assets') ||
        (tabId === 'reports' && t.id === 'maintenance-reports')
    );
    if (tab?.path) return tab.path;

    // Check inside subtabs of all tabs
    if (portalConfig?.tabs) {
      for (const t of portalConfig.tabs) {
        if (t.subtabs) {
          const sub = t.subtabs.find(
            (s) => s.id === tabId || `${t.id}-${s.id}` === tabId || tabId.endsWith(s.id)
          );
          if (sub?.path) return sub.path;
        }
      }
    }
    return fallback;
  };

  const getDropdownNavItems = (
    portal: 'propco' | 'opco',
    tabId: string,
    defaultItems: NavItem[]
  ): NavItem[] => {
    const portalConfig = portal === 'propco' ? cmsPropco : cmsOpco;
    const tab = portalConfig?.tabs?.find(
      (t) =>
        t.id === tabId ||
        (tabId === 'all-assets' && t.id === 'fixed-assets') ||
        (tabId === 'reports' && t.id === 'maintenance-reports')
    );

    if (tab?.subtabs && tab.subtabs.length > 0) {
      return tab.subtabs.map((sub, idx) => {
        const match = defaultItems.find(
          (d) =>
            d.id === sub.id ||
            d.id === `${tabId}-${sub.id}` ||
            sub.id === `${tabId}-${d.id}` ||
            d.href === sub.path ||
            d.label.toLowerCase() === sub.label.toLowerCase()
        );

        return {
          id: match?.id || sub.id || `${tabId}-sub-${idx}`,
          label: sub.label,
          href: sub.path,
          icon: match?.icon || <Package size={13} />,
          badgeCount: match?.badgeCount,
          badgeVariant: match?.badgeVariant,
        };
      });
    }

    return defaultItems;
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
  const [propcoCriticalCount, setPropcoCriticalCount] = useState(0);
  const [openTaskCount, setOpenTaskCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [dueTodayCount, setDueTodayCount] = useState(0);
  const [pulse, setPulse] = useState(true);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);

  // Dynamic Section Mapping (PropCo vs OpCo vs Both vs Bottom)
  const [sectionMapping, setSectionMapping] = useState<Record<string, TabSectionLocation>>(() =>
    getTabSectionMapping()
  );
  const [showSectionModal, setShowSectionModal] = useState<boolean>(false);
  const [sectionSearch, setSectionSearch] = useState<string>('');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');

  // Add new tab/dropdown form state inside section modal
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTabSection, setNewTabSection] = useState<'propco' | 'opco' | 'both' | 'bottom'>('opco');
  const [newTabTarget, setNewTabTarget] = useState<string>('root');
  const [newTabName, setNewTabName] = useState<string>('');
  const [newTabPath, setNewTabPath] = useState<string>('');
  const [newTabIcon, setNewTabIcon] = useState<string>('Package');

  const updateSuggestedPath = (name: string, target: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
    if (!slug) return;
    if (target === 'root') {
      setNewTabPath(`/${slug}`);
    } else if (target === 'insurance') {
      setNewTabPath(`/insurance-register?tab=${slug}`);
    } else if (target === 'contracts') {
      setNewTabPath(`/contracts-register?tab=${slug}`);
    } else if (target === 'maintenance') {
      setNewTabPath(`/asset-management/maintenance?filter=${slug}`);
    } else if (target === 'compliance') {
      setNewTabPath(`/compliance-register?tab=${slug}`);
    } else if (target === 'utilities') {
      setNewTabPath(`/utilities-register?type=${slug}`);
    } else {
      setNewTabPath(`/${target}?sub=${slug}`);
    }
  };

  const handleAddNewTabOrDropdown = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTabName.trim()) {
      toast.error('Please enter a tab / dropdown name');
      return;
    }
    const res = addCustomTabOrDropdown({
      section: newTabSection,
      targetTabId: newTabTarget,
      name: newTabName.trim(),
      path: newTabPath.trim(),
      iconName: newTabIcon,
    });
    if (res.success) {
      toast.success(res.message);
      setNewTabName('');
      setNewTabPath('');
      setShowAddForm(false);
      refreshCms();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:app-cms-updated'));
        window.dispatchEvent(new CustomEvent('samko:sections-changed'));
      }
    } else {
      toast.error(res.message);
    }
  };

  useEffect(() => {
    const handleSectionChange = () => {
      setSectionMapping(getTabSectionMapping());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('samko:sections-changed', handleSectionChange);
      window.addEventListener('samko:app-cms-updated', handleSectionChange);
      window.addEventListener('storage', handleSectionChange);
      return () => {
        window.removeEventListener('samko:sections-changed', handleSectionChange);
        window.removeEventListener('samko:app-cms-updated', handleSectionChange);
        window.removeEventListener('storage', handleSectionChange);
      };
    }
  }, []);

  const getSectionForTab = (tabId: string): TabSectionLocation => {
    let s = sectionMapping[tabId];
    if (!s && (tabId === 'fixed-assets' || tabId === 'all-assets')) {
      s = sectionMapping['all-assets'] || sectionMapping['fixed-assets'];
    }
    if (!s && (tabId === 'non-fixed' || tabId === 'non-fixed-assets')) {
      s = sectionMapping['non-fixed'] || sectionMapping['non-fixed-assets'];
    }
    if (
      !s &&
      (tabId === 'reports' || tabId === 'contract-reports' || tabId === 'maintenance-reports')
    ) {
      s =
        sectionMapping['reports'] ||
        sectionMapping['contract-reports'] ||
        sectionMapping['maintenance-reports'];
    }
    if (!s && tabId === 'tasks') {
      s = sectionMapping['tasks'];
    }
    return s || DEFAULT_TAB_SECTIONS[tabId] || 'propco';
  };

  const isInPropCo = (tabId: string) => {
    if (tabId === 'docs-upload' || tabId === 'documents') return false;
    const s = getSectionForTab(tabId);
    return s === 'propco' || s === 'both';
  };

  const isInOpCo = (tabId: string) => {
    if (tabId === 'task-module' || tabId === 'task-manager') return false;
    const s = getSectionForTab(tabId);
    return s === 'opco' || s === 'both';
  };

  const isInBottom = (tabId: string) => {
    if (tabId === 'dashboard') return false;
    if (tabId === 'docs-upload' || tabId === 'documents') return true;
    const s = getSectionForTab(tabId);
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
    const p =
      typeof window !== 'undefined'
        ? window.location.pathname + window.location.search
        : currentPath || '';
    if (
      p.includes('type=non-fixed') ||
      p.startsWith('/asset-management/maintenance') ||
      ((p.startsWith('/compliance-register') || p.startsWith('/compliance-tracker')) &&
        !p.includes('portal=propco') &&
        !p.includes('tab=propco')) ||
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
      ((p.startsWith('/compliance-register') || p.startsWith('/compliance-tracker')) &&
        (p.includes('portal=propco') || p.includes('tab=propco')))
    ) {
      saved.propco = true;
    }
    return saved;
  };

  const getInitialOpenSubDropdowns = (): Record<string, boolean> => {
    const saved: Record<string, boolean> = {
      insurance: false,
      contracts: false,
      maintenance: false,
      compliance: false,
      'propco-compliance': false,
      utilities: false,
    };
    const p =
      typeof window !== 'undefined'
        ? window.location.pathname + window.location.search
        : currentPath || '';
    // Only expand a subdropdown if the user is currently actively viewing one of its child pages!
    if (p.startsWith('/insurance-register')) saved.insurance = true;
    if (p.startsWith('/contracts-register')) saved.contracts = true;
    if (p.startsWith('/asset-management/maintenance')) saved.maintenance = true;
    if (p.startsWith('/compliance-register') || p.startsWith('/compliance-tracker')) {
      if (p.includes('portal=propco') || p.includes('tab=propco')) {
        saved['propco-compliance'] = true;
      } else {
        saved.compliance = true;
      }
    }
    if (p.startsWith('/utilities-register')) saved.utilities = true;
    return saved;
  };

  const [openPortals, setOpenPortals] = useState<Record<string, boolean>>(getInitialOpenPortals);
  const [openSubDropdowns, setOpenSubDropdowns] = useState<Record<string, boolean>>(
    getInitialOpenSubDropdowns
  );

  // Synchronize open state and portal context whenever activeRoutePath changes
  useEffect(() => {
    const p = activeRoutePath;
    if (!p) return;

    const isNonFixed = p.includes('type=non-fixed');
    const isMaintenance =
      p.startsWith('/asset-management/maintenance') || p.includes('type=maintenance');
    const isPropcoCompliance =
      (p.startsWith('/compliance-register') || p.startsWith('/compliance-tracker')) &&
      (p.includes('portal=propco') || p.includes('tab=propco'));
    const isOpcoCompliance =
      (p.startsWith('/compliance-register') || p.startsWith('/compliance-tracker')) &&
      !isPropcoCompliance;
    const isOpcoTasks = p.startsWith('/tasks') || p.startsWith('/task-manager');
    const isUtilities = p.startsWith('/utilities-register');
    const isOpcoDashboard = p.includes('portal=opco');

    const isOpCoRoute =
      isNonFixed || isMaintenance || isOpcoCompliance || isOpcoTasks || isUtilities || isOpcoDashboard;

    const isProperties =
      p.startsWith('/asset-management/properties') || p.startsWith('/asset-management/hotels');
    const isFixedAssets = p.startsWith('/asset-management/assets') && !isNonFixed;
    const isInsurance = p.startsWith('/insurance-register');
    const isContracts = p.startsWith('/contracts-register') || p.includes('type=contracts');
    const isPropcoDashboard = p.includes('portal=propco');

    const isPropCoRoute =
      isProperties || isFixedAssets || isInsurance || isContracts || isPropcoDashboard || isPropcoCompliance;

    if (isOpCoRoute) {
      // In OpCo route: keep OpCo open and collapse PropCo so OpCo stays at the top and never scrolls off-screen
      setOpenPortals((prev) => {
        if (!prev.propco && prev.opco) return prev;
        return { propco: false, opco: true };
      });
      try {
        localStorage.setItem(
          'samko:sidebar_open_portals',
          JSON.stringify({ propco: false, opco: true })
        );
      } catch (e) {}
      if (activePortal !== 'opco' && setActivePortal) {
        setActivePortal('opco');
      }
    } else if (isPropCoRoute) {
      // In PropCo route: keep PropCo open and collapse OpCo
      setOpenPortals((prev) => {
        if (prev.propco && !prev.opco) return prev;
        return { propco: true, opco: false };
      });
      try {
        localStorage.setItem(
          'samko:sidebar_open_portals',
          JSON.stringify({ propco: true, opco: false })
        );
      } catch (e) {}
      if (activePortal !== 'propco' && setActivePortal) {
        setActivePortal('propco');
      }
    }

    const openSub: Record<string, boolean> = {};
    if (p.startsWith('/insurance-register')) openSub.insurance = true;
    if (p.startsWith('/contracts-register')) openSub.contracts = true;
    if (p.startsWith('/asset-management/maintenance')) openSub.maintenance = true;
    if (p.startsWith('/compliance-register') || p.startsWith('/compliance-tracker')) {
      if (p.includes('portal=propco') || p.includes('tab=propco')) {
        openSub['propco-compliance'] = true;
      } else {
        openSub.compliance = true;
      }
    }
    if (p.startsWith('/utilities-register')) openSub.utilities = true;

    if (Object.keys(openSub).length > 0) {
      setOpenSubDropdowns((prev) => {
        let changed = false;
        for (const [k, v] of Object.entries(openSub)) {
          if (prev[k] !== v) {
            changed = true;
            break;
          }
        }
        if (!changed) return prev;
        const next = { ...prev, ...openSub };
        try {
          localStorage.setItem('samko:sidebar_open_subdropdowns', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }
  }, [activeRoutePath]);

  const fetchDynamicCounts = useCallback(async () => {
    try {
      const [mRes, compRes, tasksRes] = await Promise.allSettled([
        api.maintenance.getAll(),
        api.compliance.getAll(),
        api.tasks.getAll(),
      ]);

      if (mRes.status === 'fulfilled' && mRes.value.success && mRes.value.data) {
        const records = mRes.value.data.filter((m: any) =>
          isPropertyAccessible(m.hotelName || m.hotelId || m.property || m.propertyName)
        );
        setOverdueCount(records.filter((m: any) => m.status === 'overdue').length);
        setDueTodayCount(records.filter((m: any) => m.status === 'due-today').length);
      }

      if (compRes.status === 'fulfilled' && compRes.value.success && compRes.value.data) {
        const comp = compRes.value.data.filter((c: any) =>
          isPropertyAccessible(c.property || c.hotelName || c.hotel || c.propertyName || c.site)
        );
        const propcoComp = comp.filter(
          (c: any) => (c.complianceType || c.section || '').toLowerCase() === 'propco'
        );
        const opcoComp = comp.filter(
          (c: any) => (c.complianceType || c.section || '').toLowerCase() === 'opco'
        );
        setPropcoCriticalCount(
          propcoComp.filter(
            (c: any) =>
              c.status === 'overdue' || c.status === 'Expired' || c.status === 'Action Required'
          ).length
        );
        setCriticalCount(
          opcoComp.length > 0
            ? opcoComp.filter(
                (c: any) =>
                  c.status === 'overdue' || c.status === 'Expired' || c.status === 'Action Required'
              ).length
            : comp.filter(
                (c: any) => c.status === 'Expired' || c.status === 'Action Required'
              ).length
        );
      }

      if (tasksRes.status === 'fulfilled' && tasksRes.value.success && tasksRes.value.data) {
        const tasks = tasksRes.value.data.filter((t: any) =>
          isPropertyAccessible(t.hotel || t.property || t.hotelName || t.propertyName || t.site)
        );
        setOpenTaskCount(
          tasks.filter((t: any) => t.status === 'open' || t.status === 'in-progress').length
        );
      }
    } catch (e) {
      console.error('Error fetching dynamic counts:', e);
    }
  }, [isPropertyAccessible]);

  useEffect(() => {
    const updateLocalCounts = () => {
      const accAlerts = ALERTS.filter((a) =>
        isPropertyAccessible(
          (a as any).property ||
            (a as any).hotelName ||
            (a as any).hotel ||
            (a as any).propertyName ||
            (a as any).site
        )
      );
      setCriticalCount(accAlerts.filter((a) => a.type === 'critical').length);
      setWarningCount(accAlerts.filter((a) => a.type === 'warning').length);

      let allTasks: any[] = TASKS;
      try {
        const stored = localStorage.getItem('samko_tasks');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) allTasks = parsed;
        }
      } catch {}
      const accTasks = allTasks.filter((t) =>
        isPropertyAccessible(t.hotel || t.property || t.hotelName || t.propertyName || t.site)
      );
      setOpenTaskCount(
        accTasks.filter((t) => t.status === 'open' || t.status === 'in-progress').length
      );

      const accMaint = MAINTENANCE_RECORDS.filter((m) =>
        isPropertyAccessible(
          m.hotelName || m.hotelId || (m as any).property || (m as any).propertyName
        )
      );
      setOverdueCount(accMaint.filter((m) => m.status === 'overdue').length);
      setDueTodayCount(accMaint.filter((m) => m.status === 'due-today').length);

      try {
        const cached = localStorage.getItem('samko_repository_documents');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            const count = parsed
              .filter((d: any) =>
                isPropertyAccessible(
                  d.site || d.property || d.propertyName || d.hotelName || d.hotel
                )
              )
              .filter((d: any) => {
                const isFood =
                  (d.name && d.name.toLowerCase().includes('food')) ||
                  (d.category && d.category.toLowerCase().includes('food'));
                const isUserUpload =
                  String(d.id).startsWith('doc-17') || String(d.id).startsWith('doc-food');
                const status =
                  d.approvalStatus || (isFood || isUserUpload ? 'pending' : 'approved');
                return status === 'pending' || status === 'hold';
              }).length;
            setPendingApprovalsCount(count);
            return;
          }
        }
        setPendingApprovalsCount(0);
      } catch (e) {
        setPendingApprovalsCount(0);
      }
    };

    updateLocalCounts();
    fetchDynamicCounts();

    const handleApprovalsChange = () => {
      updateLocalCounts();
      fetchDynamicCounts();
    };

    window.addEventListener('samko:doc_uploaded', handleApprovalsChange);
    window.addEventListener('samko:doc_approved', handleApprovalsChange);
    window.addEventListener('samko:approvals-changed', handleApprovalsChange);
    window.addEventListener('samko:data-changed', handleApprovalsChange);
    window.addEventListener('samko:task-changed', handleApprovalsChange);
    window.addEventListener('samko:user-changed', handleApprovalsChange);
    window.addEventListener('storage', handleApprovalsChange);

    const pulseInterval = setInterval(() => setPulse((p) => !p), 1200);
    return () => {
      clearInterval(pulseInterval);
      window.removeEventListener('samko:doc_uploaded', handleApprovalsChange);
      window.removeEventListener('samko:doc_approved', handleApprovalsChange);
      window.removeEventListener('samko:approvals-changed', handleApprovalsChange);
      window.removeEventListener('samko:data-changed', handleApprovalsChange);
      window.removeEventListener('samko:task-changed', handleApprovalsChange);
      window.removeEventListener('samko:user-changed', handleApprovalsChange);
      window.removeEventListener('storage', handleApprovalsChange);
    };
  }, [user, isPropertyAccessible, fetchDynamicCounts]);

  const togglePortal = (portalKey: 'propco' | 'opco') => {
    setOpenPortals((s) => {
      const nextIsOpen = !s[portalKey];
      const next = { ...s, [portalKey]: nextIsOpen };
      try {
        localStorage.setItem('samko:sidebar_open_portals', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // Requirement: When opening PropCo or OpCo, only show the tabs - do NOT open dropdowns inside PropCo/OpCo directly!
    setOpenSubDropdowns((prev) => {
      const next = { ...prev };
      if (portalKey === 'propco') {
        if (!activeRoutePath.startsWith('/insurance-register')) next.insurance = false;
        if (!activeRoutePath.startsWith('/contracts-register')) next.contracts = false;
      } else if (portalKey === 'opco') {
        if (!activeRoutePath.startsWith('/asset-management/maintenance')) next.maintenance = false;
        if (
          !activeRoutePath.startsWith('/compliance-register') &&
          !activeRoutePath.startsWith('/compliance-tracker')
        )
          next.compliance = false;
        if (!activeRoutePath.startsWith('/utilities-register')) next.utilities = false;
      }
      try {
        localStorage.setItem('samko:sidebar_open_subdropdowns', JSON.stringify(next));
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

  const isActive = (href: string, portalContext: 'propco' | 'opco' | 'default' = 'default') => {
    const effectiveCurrent = activeRoutePath;

    if (!effectiveCurrent || !href) return false;
    if (href === '/') {
      return (
        (effectiveCurrent === '/' || currentPath === '/') && !effectiveCurrent.includes('portal=')
      );
    }

    const [hPath, hQuery] = href.split('?');
    const [cPath, cQuery] = effectiveCurrent.split('?');

    if (
      (href === '/asset-management/hotels' || href === '/asset-management/properties') &&
      (cPath === '/asset-management/properties' || cPath === '/asset-management/hotels')
    ) {
      return true;
    }

    if (
      (hPath === '/document-repository' || hPath === '/docs-upload') &&
      (cPath === '/document-repository' || cPath === '/docs-upload')
    ) {
      return true;
    }

    if (hPath === '/asset-management/assets') {
      const isNonFixedHref = (hQuery || '').includes('type=non-fixed');
      const isNonFixedCurrent = (cQuery || '').includes('type=non-fixed');
      if (cPath === '/asset-management/assets') {
        // Enforce strict portal context boundary
        if (portalContext === 'opco' && !isNonFixedHref) return false;
        if (portalContext === 'propco' && isNonFixedHref) return false;
        return isNonFixedHref === isNonFixedCurrent;
      }
      return false;
    }

    // Planned Preventive Maintenance tabs (strictly single active tab)
    if (cPath === '/asset-management/maintenance' && hPath === '/asset-management/maintenance') {
      const hParams = new URLSearchParams(hQuery || '');
      const hFilter = hParams.get('filter') || 'scheduled';
      const cParams = new URLSearchParams(cQuery || '');
      const cFilter = cParams.get('filter') || 'scheduled';
      return hFilter === cFilter;
    }

    // Insurance Register tabs (strictly single active tab: 'register', 'claims', or 'renewals')
    if (cPath === '/insurance-register' && hPath === '/insurance-register') {
      const hParams = new URLSearchParams(hQuery || '');
      const hTab = hParams.get('tab') || 'register';
      const cParams = new URLSearchParams(cQuery || '');
      const cTab = cParams.get('tab') || 'register';
      return hTab === cTab;
    }

    // Contracts Register tabs (strictly single active tab: 'register', 'suppliers', 'renewals', 'slas')
    if (cPath === '/contracts-register' && hPath === '/contracts-register') {
      const hParams = new URLSearchParams(hQuery || '');
      const hTab = hParams.get('tab') || 'register';
      const cParams = new URLSearchParams(cQuery || '');
      const cTab = cParams.get('tab') || 'register';
      return hTab === cTab;
    }

    // Compliance Register tabs (strictly single active tab: 'register', 'certifications', 'statutory')
    if (cPath === '/compliance-register' && hPath === '/compliance-register') {
      const hParams = new URLSearchParams(hQuery || '');
      const hTab = hParams.get('tab') || 'register';
      const cParams = new URLSearchParams(cQuery || '');
      const cTab = cParams.get('tab') || 'register';
      const cPortal = cParams.get('portal');
      if (portalContext === 'propco' && cPortal !== 'propco') return false;
      if (portalContext === 'opco' && cPortal === 'propco') return false;
      return hTab === cTab;
    }

    if (cPath === '/compliance-tracker' && hPath === '/compliance-tracker') {
      const cParams = new URLSearchParams(cQuery || '');
      const cPortal = cParams.get('portal');
      if (portalContext === 'propco' && cPortal !== 'propco') return false;
      if (portalContext === 'opco' && cPortal === 'propco') return false;
      return true;
    }

    // Utilities Register types (strictly single active tab: 'all' vs specific type)
    if (cPath === '/utilities-register' && hPath === '/utilities-register') {
      const hParams = new URLSearchParams(hQuery || '');
      const hType = hParams.get('type') || 'all';
      const cParams = new URLSearchParams(cQuery || '');
      const cType = cParams.get('type') || 'all';
      return hType === cType;
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

    const active = isActive(item.href, portalContext);
    const access = getTabAccess(item.id);
    const isReadOnly = access === 'read';

    const isOpCo = portalContext === 'opco';
    const activeColor = isOpCo ? '#60a5fa' : '#e8c97a';
    const activeBg = isOpCo ? 'rgba(96, 165, 250, 0.16)' : 'rgba(232, 201, 122, 0.16)';
    const activeBorder = isOpCo
      ? '1px solid rgba(96, 165, 250, 0.40)'
      : '1px solid rgba(232, 201, 122, 0.40)';
    const activeShadow = isOpCo
      ? '0 0 12px rgba(96, 165, 250, 0.16)'
      : '0 0 12px rgba(232, 201, 122, 0.16)';

    return (
      <Link
        key={`nav-${portalContext}-${item.id}`}
        ref={active ? activeItemRef : undefined}
        href={item.href}
        scroll={false}
        title={collapsed ? `${item.label}${isReadOnly ? ' (Read Only)' : ''}` : undefined}
        onClick={() => {
          if (portalContext === 'propco') {
            if (setActivePortal) setActivePortal('propco');
            setOpenPortals({ propco: true, opco: false });
            try {
              localStorage.setItem(
                'samko:sidebar_open_portals',
                JSON.stringify({ propco: true, opco: false })
              );
            } catch (e) {}
          } else if (portalContext === 'opco') {
            if (setActivePortal) setActivePortal('opco');
            setOpenPortals({ propco: false, opco: true });
            try {
              localStorage.setItem(
                'samko:sidebar_open_portals',
                JSON.stringify({ propco: false, opco: true })
              );
            } catch (e) {}
          }
        }}
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
            e.currentTarget.style.background = isOpCo
              ? 'rgba(96, 165, 250, 0.08)'
              : 'rgba(232, 201, 122, 0.08)';
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
        <span className="flex-shrink-0" style={{ color: active ? activeColor : undefined }}>
          {item.icon}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {isReadOnly && user.roleLevel !== 'L1' && user.roleLevel !== 'L4' && (
              <span
                className="text-[10px] text-muted-foreground opacity-60"
                title="Read Only Access"
              >
                <Eye size={11} />
              </span>
            )}
            {item.badgeTag && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold font-mono tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {item.badgeTag}
              </span>
            )}
            {item.badgeCount !== undefined && item.badgeCount > 0 && (
              <span
                className={item.badgeVariant === 'critical' ? 'nav-badge-count' : 'nav-badge-warn'}
                style={{
                  transition: 'opacity 0.4s ease',
                  opacity: item.badgeVariant === 'critical' ? (pulse ? 1 : 0.55) : 1,
                }}
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
            style={{
              background: 'var(--surface3)',
              color: 'var(--foreground)',
              border: '1px solid var(--border-strong)',
              fontSize: 12,
            }}
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
    const isChildActive = visibleSubItems.some((item) => isActive(item.href, portalContext));

    const isOpCo = portalContext === 'opco';
    const activeColor = isOpCo ? '#60a5fa' : '#e8c97a';
    const activeBg = isOpCo ? 'rgba(96, 165, 250, 0.12)' : 'rgba(232, 201, 122, 0.12)';
    const activeBorder = isOpCo
      ? '1px solid rgba(96, 165, 250, 0.30)'
      : '1px solid rgba(232, 201, 122, 0.30)';

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
              e.currentTarget.style.background = isOpCo
                ? 'rgba(96, 165, 250, 0.08)'
                : 'rgba(232, 201, 122, 0.08)';
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
          <span
            className="flex-shrink-0"
            style={{ color: isChildActive ? activeColor : undefined }}
          >
            {icon}
          </span>
          <span className="flex-1 truncate" style={{ fontSize: 13 }}>
            {label}
          </span>
          {badgeCount !== undefined && badgeCount > 0 && (
            <span
              className={badgeVariant === 'critical' ? 'nav-badge-count' : 'nav-badge-warn'}
              style={{
                transition: 'opacity 0.4s ease',
                opacity: badgeVariant === 'critical' ? (pulse ? 1 : 0.55) : 1,
              }}
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
                ? isOpCo
                  ? 'rgba(96, 165, 250, 0.40)'
                  : 'rgba(232, 201, 122, 0.40)'
                : 'rgba(255, 255, 255, 0.10)',
            }}
          >
            {visibleSubItems.map((item) => renderNavItem(item, true, portalContext))}
          </div>
        )}
      </div>
    );
  };

  const renderPropCoNavItem = (item: NavItem, isIndented = false) =>
    renderNavItem(item, isIndented, 'propco');
  const renderOpCoNavItem = (item: NavItem, isIndented = false) =>
    renderNavItem(item, isIndented, 'opco');
  const renderPropCoSubDropdown = (
    id: string,
    label: string,
    icon: React.ReactNode,
    items: NavItem[],
    badgeCount?: number,
    badgeVariant?: 'critical' | 'warning'
  ) => renderSubDropdown(id, label, icon, items, badgeCount, badgeVariant, 'propco');
  const renderOpCoSubDropdown = (
    id: string,
    label: string,
    icon: React.ReactNode,
    items: NavItem[],
    badgeCount?: number,
    badgeVariant?: 'critical' | 'warning'
  ) => renderSubDropdown(id, label, icon, items, badgeCount, badgeVariant, 'opco');

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
      case 'dashboard':
        return <LayoutDashboard size={15} />;
      case 'properties':
        return <Building2 size={15} />;
      case 'multi-site':
        return <Globe size={15} />;
      case 'fixed-assets':
      case 'all-assets':
        return <Package size={15} />;
      case 'non-fixed-assets':
      case 'non-fixed':
        return <Package size={15} />;
      case 'categories':
        return <Tag size={15} />;
      case 'maintenance':
        return <Calendar size={15} />;
      case 'compliance':
        return <ShieldCheck size={15} />;
      case 'compliance-tracker':
        return <Calendar size={15} />;
      case 'insurance':
        return <Shield size={15} />;
      case 'contracts':
        return <ScrollText size={15} />;
      case 'utilities':
        return <Zap size={15} />;
      case 'tasks':
        return <CheckSquare size={15} />;
      case 'documents':
        return <FolderOpen size={15} />;
      case 'reports':
        return <BarChart3 size={15} />;
      case 'inspections':
        return <ClipboardCheck size={15} />;
      case 'qr-codes':
        return <QrCode size={15} />;
      case 'import':
        return <Upload size={15} />;
      case 'recent-logs':
        return <History size={15} />;
      case 'users':
        return <Users size={15} />;
      case 'settings':
        return <Settings size={15} />;
      default:
        return <Package size={15} />;
    }
  };

  const bottomNavItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [];

    if (isInBottom('properties') && isNavVisible('properties')) {
      items.push({
        id: 'properties',
        label: getTabLabel('propco', 'properties', 'Properties'),
        href: getTabPath('propco', 'properties', '/asset-management/properties'),
        icon: <Building2 size={16} />,
      });
    }
    if ((isInBottom('all-assets') || isInBottom('fixed-assets')) && isNavVisible('all-assets')) {
      items.push({
        id: 'all-assets',
        label: getTabLabel('propco', 'all-assets', 'Fixed Assets'),
        href: getTabPath('propco', 'all-assets', '/asset-management/assets'),
        icon: <Package size={16} />,
      });
    }
    if ((isInBottom('non-fixed') || isInBottom('non-fixed-assets')) && isNavVisible('non-fixed')) {
      items.push({
        id: 'non-fixed',
        label: getTabLabel('opco', 'non-fixed', 'Non-Fixed Assets'),
        href: getTabPath('opco', 'non-fixed', '/asset-management/assets?type=non-fixed'),
        icon: <Package size={16} />,
      });
    }
    if (isInBottom('maintenance') && isNavVisible('maintenance')) {
      items.push({
        id: 'maintenance',
        label: getTabLabel('opco', 'maintenance', 'Maintenance'),
        href: getTabPath('opco', 'maintenance', '/asset-management/maintenance'),
        icon: <Calendar size={16} />,
        badgeCount: overdueCount > 0 ? overdueCount : dueTodayCount > 0 ? dueTodayCount : undefined,
        badgeVariant: overdueCount > 0 ? 'critical' : 'warning',
      });
    }
    if (isInBottom('compliance') && isNavVisible('compliance')) {
      items.push({
        id: 'compliance',
        label: getTabLabel('opco', 'compliance', 'Compliance'),
        href: getTabPath('opco', 'compliance', '/compliance-register'),
        icon: <ShieldCheck size={16} />,
        badgeCount: criticalCount > 0 ? criticalCount : undefined,
        badgeVariant: 'critical',
      });
    }
    if (isInBottom('compliance-tracker') && isNavVisible('compliance-tracker')) {
      items.push({
        id: 'compliance-tracker',
        label: getNavLabel('compliance-tracker', 'Compliance Tracker'),
        href: '/compliance-tracker',
        icon: <FileCheck size={16} />,
      });
    }
    if (isInBottom('insurance') && isNavVisible('insurance')) {
      items.push({
        id: 'insurance',
        label: getTabLabel('propco', 'insurance', 'Insurance'),
        href: getTabPath('propco', 'insurance', '/insurance-register'),
        icon: <Shield size={16} />,
      });
    }
    if (isInBottom('contracts') && isNavVisible('contracts')) {
      items.push({
        id: 'contracts',
        label: getTabLabel('propco', 'contracts', 'Contracts'),
        href: getTabPath('propco', 'contracts', '/contracts-register'),
        icon: <ScrollText size={16} />,
      });
    }
    if (isInBottom('tasks') && isNavVisible('tasks')) {
      items.push({
        id: 'tasks',
        label: getTabLabel('opco', 'tasks', 'Tasks and Alerts'),
        href: getTabPath('opco', 'tasks', '/tasks'),
        icon: <CheckSquare size={16} />,
        badgeCount: openTaskCount,
        badgeVariant: 'warning',
      });
    }
    if (isInBottom('utilities') && isNavVisible('utilities')) {
      items.push({
        id: 'utilities',
        label: getTabLabel('opco', 'utilities', 'Utility'),
        href: getTabPath('opco', 'utilities', '/utilities-register'),
        icon: <Zap size={16} />,
      });
    }
    if (isInBottom('reports') && isNavVisible('reports')) {
      items.push({
        id: 'reports',
        label: 'Reports',
        href: '/asset-management/reports',
        icon: <BarChart3 size={16} />,
      });
    }
    if (canAccessApprovals && isInBottom('approvals') && isNavVisible('approvals')) {
      items.push({
        id: 'approvals',
        label: getNavLabel('approvals', 'Approvals'),
        href: '/approvals',
        icon: <ClipboardCheck size={16} />,
        badgeCount: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
        badgeVariant: 'warning',
      });
    }
    if (
      canAccessDocsUpload &&
      (isInBottom('docs-upload') || isInBottom('documents')) &&
      (isNavVisible('docs-upload') || isNavVisible('documents'))
    ) {
      items.push({
        id: 'docs-upload',
        label: getNavLabel('docs-upload', getNavLabel('documents', 'Docs Upload')),
        href: '/document-repository',
        icon: <CloudUpload size={16} />,
      });
    }
    if (isInBottom('recent-logs') && isNavVisible('recent-logs')) {
      items.push({
        id: 'recent-logs',
        label: getNavLabel('recent-logs', 'Audit Logs'),
        href: '/recent-logs',
        icon: <History size={16} />,
      });
    }
    if (isInBottom('import') && isNavVisible('import')) {
      items.push({
        id: 'import',
        label: getNavLabel('import', 'Import / Export'),
        href: '/asset-management/import',
        icon: <Upload size={16} />,
      });
    }
    if (canManageUsers && isInBottom('users') && isNavVisible('users')) {
      items.push({
        id: 'users',
        label: getNavLabel('users', 'Users & Roles'),
        href: '/users',
        icon: <Users size={16} />,
      });
    }
    if (canAccessSettings && isInBottom('settings') && isNavVisible('settings')) {
      items.push({
        id: 'settings',
        label: getNavLabel('settings', 'Settings'),
        href: '/settings',
        icon: <Settings size={16} />,
      });
    }

    return items;
  }, [
    sectionMapping,
    navItemsMap,
    cmsPropco,
    cmsOpco,
    overdueCount,
    dueTodayCount,
    criticalCount,
    openTaskCount,
    pendingApprovalsCount,
    canManageUsers,
    canAccessSettings,
    canAccessApprovals,
    canAccessDocsUpload,
    isDigitalBot,
  ]);

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
                style={{
                  fontSize: 15.5,
                  fontWeight: 800,
                  letterSpacing: '-0.2px',
                  paddingRight: 4,
                }}
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
      <nav ref={navRef} className="flex-1 overflow-y-auto" style={{ padding: '10px 8px 8px' }}>
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
                {/* PropCo Dashboard */}
                {isInPropCo('propco-dashboard') &&
                  isTabVisibleInCms('propco', 'propco-dashboard') &&
                  renderPropCoNavItem({
                    id: 'propco-dashboard',
                    label: getTabLabel('propco', 'propco-dashboard', 'PropCo Dashboard'),
                    href: getTabPath('propco', 'propco-dashboard', '/?portal=propco'),
                    icon: <LayoutDashboard size={15} />,
                  })}

                {/* Properties */}
                {isInPropCo('properties') &&
                  isTabVisibleInCms('propco', 'properties') &&
                  renderPropCoNavItem({
                    id: 'properties',
                    label: getTabLabel('propco', 'properties', 'Properties'),
                    href: getTabPath('propco', 'properties', '/asset-management/properties'),
                    icon: <Building2 size={15} />,
                  })}

                {/* Fixed Assets */}
                {(isInPropCo('all-assets') || isInPropCo('fixed-assets')) &&
                  isTabVisibleInCms('propco', 'all-assets') &&
                  renderPropCoNavItem({
                    id: 'all-assets',
                    label: getTabLabel('propco', 'all-assets', 'Fixed Assets'),
                    href: getTabPath('propco', 'all-assets', '/asset-management/assets'),
                    icon: <Package size={15} />,
                  })}

                {/* Non-Fixed Assets (when moved to PropCo) */}
                {(isInPropCo('non-fixed') || isInPropCo('non-fixed-assets')) &&
                  renderPropCoNavItem({
                    id: 'non-fixed',
                    label: getTabLabel('opco', 'non-fixed', 'Non-Fixed Assets'),
                    href: getTabPath(
                      'opco',
                      'non-fixed',
                      '/asset-management/assets?type=non-fixed'
                    ),
                    icon: <Package size={15} />,
                  })}

                {/* Maintenance (when moved to PropCo) */}
                {isInPropCo('maintenance') &&
                  renderPropCoSubDropdown(
                    'maintenance',
                    getTabLabel('opco', 'maintenance', 'Maintenance'),
                    <Calendar size={15} />,
                    [
                      {
                        id: 'maintenance-scheduled',
                        label: getTabLabel('opco', 'maintenance-scheduled', 'Scheduled'),
                        href: '/asset-management/maintenance?filter=scheduled',
                        icon: <Calendar size={13} />,
                      },
                      {
                        id: 'maintenance-due',
                        label: getTabLabel('opco', 'maintenance-due', 'Due Today'),
                        href: '/asset-management/maintenance?filter=due-today',
                        icon: <AlertCircle size={13} />,
                        badgeCount: dueTodayCount,
                        badgeVariant: 'warning',
                      },
                      {
                        id: 'maintenance-overdue',
                        label: getTabLabel('opco', 'maintenance-overdue', 'Overdue'),
                        href: '/asset-management/maintenance?filter=overdue',
                        icon: <AlertTriangle size={13} />,
                        badgeCount: overdueCount,
                        badgeVariant: 'critical',
                      },
                      {
                        id: 'maintenance-completed',
                        label: getTabLabel('opco', 'maintenance-completed', 'Completed'),
                        href: '/asset-management/maintenance?filter=completed',
                        icon: <CheckSquare size={13} />,
                      },
                    ],
                    overdueCount > 0 ? overdueCount : dueTodayCount > 0 ? dueTodayCount : undefined,
                    overdueCount > 0 ? 'critical' : 'warning'
                  )}

                {/* Compliance in PropCo */}
                {renderPropCoSubDropdown(
                  'propco-compliance',
                  getTabLabel('propco', 'compliance', 'Compliance'),
                  <ShieldCheck size={15} />,
                  [
                    {
                      id: 'propco-compliance-register',
                      label: 'Compliance Register',
                      href: '/compliance-register?portal=propco',
                      icon: <ShieldCheck size={13} />,
                      badgeCount: propcoCriticalCount > 0 ? propcoCriticalCount : undefined,
                      badgeVariant: 'critical',
                    },
                    {
                      id: 'propco-certifications',
                      label: 'Certifications',
                      href: '/compliance-register?tab=certifications&portal=propco',
                      icon: <FileCheck size={13} />,
                    },
                    {
                      id: 'propco-statutory',
                      label: 'Statutory Inspections',
                      href: '/compliance-register?tab=statutory&portal=propco',
                      icon: <Flame size={13} />,
                    },
                    {
                      id: 'propco-expiry-dashboard',
                      label: 'Expiry Dashboard',
                      href: '/compliance-tracker?portal=propco',
                      icon: <AlertTriangle size={13} />,
                    },
                  ],
                  propcoCriticalCount > 0 ? propcoCriticalCount : undefined,
                  'critical'
                )}

                {/* Insurance Tab / Dropdown */}
                {isInPropCo('insurance') &&
                  isTabVisibleInCms('propco', 'insurance') &&
                  renderPropCoSubDropdown(
                    'insurance',
                    getTabLabel('propco', 'insurance', 'Insurance'),
                    <Shield size={15} />,
                    getDropdownNavItems('propco', 'insurance', [
                      {
                        id: 'insurance-register',
                        label: 'Insurance Register',
                        href: '/insurance-register',
                        icon: <Shield size={13} />,
                      },
                      {
                        id: 'claims',
                        label: 'Claims',
                        href: '/insurance-register?tab=claims',
                        icon: <FileBarChart size={13} />,
                      },
                      {
                        id: 'insurance-renewals',
                        label: 'Renewals',
                        href: '/insurance-register?tab=renewals',
                        icon: <RefreshCw size={13} />,
                      },
                    ])
                  )}

                {/* Contracts Tab / Dropdown */}
                {isInPropCo('contracts') &&
                  isTabVisibleInCms('propco', 'contracts') &&
                  renderPropCoSubDropdown(
                    'contracts',
                    getTabLabel('propco', 'contracts', 'Contracts'),
                    <ScrollText size={15} />,
                    getDropdownNavItems('propco', 'contracts', [
                      {
                        id: 'contracts-register',
                        label: 'Contracts Register',
                        href: '/contracts-register',
                        icon: <ScrollText size={13} />,
                      },
                      {
                        id: 'suppliers',
                        label: 'Suppliers',
                        href: '/contracts-register?tab=suppliers',
                        icon: <Handshake size={13} />,
                      },
                      {
                        id: 'contracts-renewals',
                        label: 'Renewals',
                        href: '/contracts-register?tab=renewals',
                        icon: <RefreshCw size={13} />,
                      },
                      {
                        id: 'slas',
                        label: 'SLAs',
                        href: '/contracts-register?tab=slas',
                        icon: <Star size={13} />,
                      },
                    ])
                  )}

                {/* Tasks (when moved to PropCo) */}
                {isInPropCo('tasks') &&
                  renderPropCoNavItem({
                    id: 'tasks',
                    label: getTabLabel('opco', 'tasks', 'Tasks and Alerts'),
                    href: getTabPath('opco', 'tasks', '/tasks'),
                    icon: <CheckSquare size={15} />,
                    badgeCount: openTaskCount,
                    badgeVariant: 'warning',
                  })}

                {/* Utilities (when moved to PropCo) */}
                {isInPropCo('utilities') &&
                  renderPropCoSubDropdown(
                    'utilities',
                    getTabLabel('opco', 'utilities', 'Utility'),
                    <Zap size={15} />,
                    [
                      {
                        id: 'utilities-register',
                        label: getTabLabel('opco', 'utilities-register', 'Utilities Register'),
                        href: '/utilities-register',
                        icon: <Zap size={13} />,
                      },
                      {
                        id: 'utilities-energy',
                        label: getTabLabel('opco', 'utilities-energy', 'Energy & Water Accounts'),
                        href: '/utilities-register?type=electricity',
                        icon: <Zap size={13} />,
                      },
                    ]
                  )}

                {/* Reports */}
                {isInPropCo('reports') &&
                  isTabVisibleInCms('propco', 'reports') &&
                  renderPropCoNavItem({
                    id: 'contract-reports',
                    label: getTabLabel('propco', 'reports', 'Reports'),
                    href: getTabPath(
                      'propco',
                      'reports',
                      '/asset-management/reports?type=contracts'
                    ),
                    icon: <BarChart3 size={15} />,
                  })}

                {/* Approvals (when moved to PropCo - Restricted to Super Admin & Digital Bot) */}
                {canAccessApprovals &&
                  isInPropCo('approvals') &&
                  isNavVisible('approvals') &&
                  renderPropCoNavItem({
                    id: 'approvals',
                    label: getNavLabel('approvals', 'Approvals'),
                    href: '/approvals',
                    icon: <ClipboardCheck size={15} />,
                    badgeCount: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
                    badgeVariant: 'warning',
                  })}

                {/* Recent Logs (when moved to PropCo) */}
                {isInPropCo('recent-logs') &&
                  isNavVisible('recent-logs') &&
                  renderPropCoNavItem({
                    id: 'recent-logs',
                    label: getNavLabel('recent-logs', 'Audit Logs'),
                    href: '/recent-logs',
                    icon: <History size={15} />,
                  })}

                {/* Import (when moved to PropCo) */}
                {isInPropCo('import') &&
                  isNavVisible('import') &&
                  renderPropCoNavItem({
                    id: 'import',
                    label: getNavLabel('import', 'Import / Export'),
                    href: '/asset-management/import',
                    icon: <Upload size={15} />,
                  })}

                {/* Users (when moved to PropCo) */}
                {canManageUsers &&
                  isInPropCo('users') &&
                  isNavVisible('users') &&
                  renderPropCoNavItem({
                    id: 'users',
                    label: getNavLabel('users', 'Users & Roles'),
                    href: '/users',
                    icon: <Users size={15} />,
                  })}

                {/* Settings (when moved to PropCo) */}
                {canAccessSettings &&
                  isInPropCo('settings') &&
                  isNavVisible('settings') &&
                  renderPropCoNavItem({
                    id: 'settings',
                    label: getNavLabel('settings', 'Settings'),
                    href: '/settings',
                    icon: <Settings size={15} />,
                  })}

                {/* Dynamic Custom Tabs Added via CMS */}
                {cmsPropco?.tabs
                  ?.filter((t) => t.isCustom && t.enabled && isInPropCo(t.id))
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
                {/* OpCo Dashboard */}
                {isInOpCo('opco-dashboard') &&
                  isTabVisibleInCms('opco', 'opco-dashboard') &&
                  renderOpCoNavItem({
                    id: 'opco-dashboard',
                    label: getTabLabel('opco', 'opco-dashboard', 'OpCo Dashboard'),
                    href: getTabPath('opco', 'opco-dashboard', '/?portal=opco'),
                    icon: <LayoutDashboard size={15} />,
                  })}

                {/* Properties (when moved to OpCo) */}
                {isInOpCo('properties') &&
                  renderOpCoNavItem({
                    id: 'properties',
                    label: getTabLabel('propco', 'properties', 'Properties'),
                    href: getTabPath('propco', 'properties', '/asset-management/properties'),
                    icon: <Building2 size={15} />,
                  })}

                {/* Fixed Assets (when moved to OpCo) */}
                {(isInOpCo('all-assets') || isInOpCo('fixed-assets')) &&
                  renderOpCoNavItem({
                    id: 'all-assets',
                    label: getTabLabel('propco', 'all-assets', 'Fixed Assets'),
                    href: getTabPath('propco', 'all-assets', '/asset-management/assets'),
                    icon: <Package size={15} />,
                  })}

                {/* 1. Non-Fixed Assets */}
                {(isInOpCo('non-fixed') || isInOpCo('non-fixed-assets')) &&
                  isTabVisibleInCms('opco', 'non-fixed') &&
                  renderOpCoNavItem({
                    id: 'non-fixed',
                    label: getTabLabel('opco', 'non-fixed', 'Non-Fixed Assets'),
                    href: getTabPath(
                      'opco',
                      'non-fixed',
                      '/asset-management/assets?type=non-fixed'
                    ),
                    icon: <Package size={15} />,
                  })}

                {/* 2. Maintenance Dropdown */}
                {isInOpCo('maintenance') &&
                  isTabVisibleInCms('opco', 'maintenance') &&
                  renderOpCoSubDropdown(
                    'maintenance',
                    getTabLabel('opco', 'maintenance', 'Maintenance'),
                    <Calendar size={15} />,
                    getDropdownNavItems('opco', 'maintenance', [
                      {
                        id: 'maintenance-scheduled',
                        label: 'Scheduled',
                        href: '/asset-management/maintenance?filter=scheduled',
                        icon: <Calendar size={13} />,
                      },
                      {
                        id: 'maintenance-due',
                        label: 'Due Today',
                        href: '/asset-management/maintenance?filter=due-today',
                        icon: <AlertCircle size={13} />,
                        badgeCount: dueTodayCount,
                        badgeVariant: 'warning',
                      },
                      {
                        id: 'maintenance-overdue',
                        label: 'Overdue',
                        href: '/asset-management/maintenance?filter=overdue',
                        icon: <AlertTriangle size={13} />,
                        badgeCount: overdueCount,
                        badgeVariant: 'critical',
                      },
                      {
                        id: 'maintenance-completed',
                        label: 'Completed',
                        href: '/asset-management/maintenance?filter=completed',
                        icon: <CheckSquare size={13} />,
                      },
                    ]),
                    overdueCount > 0 ? overdueCount : dueTodayCount > 0 ? dueTodayCount : undefined,
                    overdueCount > 0 ? 'critical' : 'warning'
                  )}

                {/* 3. Compliance Dropdown */}
                {isInOpCo('compliance') &&
                  isTabVisibleInCms('opco', 'compliance') &&
                  renderOpCoSubDropdown(
                    'compliance',
                    getTabLabel('opco', 'compliance', 'Compliance'),
                    <ShieldCheck size={15} />,
                    getDropdownNavItems('opco', 'compliance', [
                      {
                        id: 'compliance-register',
                        label: 'Compliance Register',
                        href: '/compliance-register?portal=opco',
                        icon: <ShieldCheck size={13} />,
                        badgeCount: criticalCount,
                        badgeVariant: 'critical',
                      },
                      {
                        id: 'certifications',
                        label: 'Certifications',
                        href: '/compliance-register?tab=certifications&portal=opco',
                        icon: <FileCheck size={13} />,
                      },
                      {
                        id: 'statutory',
                        label: 'Statutory Inspections',
                        href: '/compliance-register?tab=statutory&portal=opco',
                        icon: <Flame size={13} />,
                      },
                      {
                        id: 'expiry-dashboard',
                        label: 'Expiry Dashboard',
                        href: '/compliance-tracker?portal=opco',
                        icon: <AlertTriangle size={13} />,
                      },
                    ]),
                    criticalCount > 0 ? criticalCount : undefined,
                    'critical'
                  )}

                {/* Insurance (when moved to OpCo) */}
                {isInOpCo('insurance') &&
                  renderOpCoSubDropdown(
                    'insurance',
                    getTabLabel('propco', 'insurance', 'Insurance'),
                    <Shield size={15} />,
                    [
                      {
                        id: 'insurance-register',
                        label: getTabLabel('propco', 'insurance-register', 'Insurance Register'),
                        href: '/insurance-register',
                        icon: <Shield size={13} />,
                      },
                      {
                        id: 'claims',
                        label: getTabLabel('propco', 'claims', 'Claims'),
                        href: '/insurance-register?tab=claims',
                        icon: <FileBarChart size={13} />,
                      },
                      {
                        id: 'insurance-renewals',
                        label: getTabLabel('propco', 'insurance-renewals', 'Renewals'),
                        href: '/insurance-register?tab=renewals',
                        icon: <RefreshCw size={13} />,
                      },
                    ]
                  )}

                {/* Contracts (when moved to OpCo) */}
                {isInOpCo('contracts') &&
                  renderOpCoSubDropdown(
                    'contracts',
                    getTabLabel('propco', 'contracts', 'Contracts'),
                    <ScrollText size={15} />,
                    [
                      {
                        id: 'contracts-register',
                        label: getTabLabel('propco', 'contracts-register', 'Contracts Register'),
                        href: '/contracts-register',
                        icon: <ScrollText size={13} />,
                      },
                      {
                        id: 'suppliers',
                        label: getTabLabel('propco', 'suppliers', 'Suppliers'),
                        href: '/contracts-register?tab=suppliers',
                        icon: <Handshake size={13} />,
                      },
                      {
                        id: 'contracts-renewals',
                        label: getTabLabel('propco', 'contracts-renewals', 'Renewals'),
                        href: '/contracts-register?tab=renewals',
                        icon: <RefreshCw size={13} />,
                      },
                      {
                        id: 'slas',
                        label: getTabLabel('propco', 'slas', 'SLAs'),
                        href: '/contracts-register?tab=slas',
                        icon: <Star size={13} />,
                      },
                    ]
                  )}

                {/* 4. Tasks and Alerts */}
                {isInOpCo('tasks') &&
                  isTabVisibleInCms('opco', 'tasks') &&
                  renderOpCoNavItem({
                    id: 'tasks',
                    label: getTabLabel('opco', 'tasks', 'Tasks and Alerts'),
                    href: getTabPath('opco', 'tasks', '/tasks'),
                    icon: <CheckSquare size={15} />,
                    badgeCount: openTaskCount,
                    badgeVariant: 'warning',
                  })}

                {/* 5. Reports */}
                {isInOpCo('reports') &&
                  isTabVisibleInCms('opco', 'reports') &&
                  renderOpCoNavItem({
                    id: 'maintenance-reports',
                    label: getTabLabel('opco', 'reports', 'Reports'),
                    href: getTabPath(
                      'opco',
                      'reports',
                      '/asset-management/reports?type=maintenance'
                    ),
                    icon: <BarChart2 size={15} />,
                  })}

                {/* 7. Utility Dropdown */}
                {isInOpCo('utilities') &&
                  isTabVisibleInCms('opco', 'utilities') &&
                  renderOpCoSubDropdown(
                    'utilities',
                    getTabLabel('opco', 'utilities', 'Utility'),
                    <Zap size={15} />,
                    getDropdownNavItems('opco', 'utilities', [
                      {
                        id: 'utilities-register',
                        label: 'Utilities Register',
                        href: '/utilities-register',
                        icon: <Zap size={13} />,
                      },
                      {
                        id: 'utilities-energy',
                        label: 'Energy & Water Accounts',
                        href: '/utilities-register?type=electricity',
                        icon: <Zap size={13} />,
                      },
                    ])
                  )}

                {/* Approvals (when moved to OpCo - Restricted to Super Admin & Digital Bot) */}
                {canAccessApprovals &&
                  isInOpCo('approvals') &&
                  isNavVisible('approvals') &&
                  renderOpCoNavItem({
                    id: 'approvals',
                    label: getNavLabel('approvals', 'Approvals'),
                    href: '/approvals',
                    icon: <ClipboardCheck size={15} />,
                    badgeCount: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
                    badgeVariant: 'warning',
                  })}

                {/* Docs Upload (when moved to OpCo - Accessible to L1, L2, L3) */}
                {canAccessDocsUpload &&
                  (isInOpCo('docs-upload') || isInOpCo('documents')) &&
                  isNavVisible('docs-upload') &&
                  renderOpCoNavItem({
                    id: 'docs-upload',
                    label: getNavLabel('docs-upload', getNavLabel('documents', 'Docs Upload')),
                    href: '/document-repository',
                    icon: <CloudUpload size={15} />,
                  })}

                {/* Recent Logs (when moved to OpCo) */}
                {isInOpCo('recent-logs') &&
                  isNavVisible('recent-logs') &&
                  renderOpCoNavItem({
                    id: 'recent-logs',
                    label: getNavLabel('recent-logs', 'Audit Logs'),
                    href: '/recent-logs',
                    icon: <History size={15} />,
                  })}

                {/* Import (when moved to OpCo) */}
                {isInOpCo('import') &&
                  isNavVisible('import') &&
                  renderOpCoNavItem({
                    id: 'import',
                    label: getNavLabel('import', 'Import / Export'),
                    href: '/asset-management/import',
                    icon: <Upload size={15} />,
                  })}

                {/* Users (when moved to OpCo) */}
                {canManageUsers &&
                  isInOpCo('users') &&
                  isNavVisible('users') &&
                  renderOpCoNavItem({
                    id: 'users',
                    label: getNavLabel('users', 'Users & Roles'),
                    href: '/users',
                    icon: <Users size={15} />,
                  })}

                {/* Settings (when moved to OpCo) */}
                {canAccessSettings &&
                  isInOpCo('settings') &&
                  isNavVisible('settings') &&
                  renderOpCoNavItem({
                    id: 'settings',
                    label: getNavLabel('settings', 'Settings'),
                    href: '/settings',
                    icon: <Settings size={15} />,
                  })}

                {/* Dynamic Custom Tabs Added via CMS */}
                {cmsOpco?.tabs
                  ?.filter((t) => t.isCustom && t.enabled && isInOpCo(t.id))
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
      <div
        className="border-t border-border"
        style={{ padding: collapsed ? '12px 8px' : '12px 10px' }}
      >
        {!collapsed && (
          <div
            className="flex items-center justify-between text-muted-foreground font-head"
            style={{
              fontSize: 9,
              letterSpacing: '1.4px',
              textTransform: 'uppercase',
              padding: '0 4px',
              marginBottom: 8,
            }}
          >
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
            style={{
              padding: collapsed ? '6px' : '7px 8px',
              background: 'var(--surface2)',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <div
              className="rounded-full flex items-center justify-center flex-shrink-0 font-bold"
              style={{
                width: 28,
                height: 28,
                background: roleBadgeColor,
                color: '#000',
                fontSize: 10,
              }}
            >
              {user.initials || 'AV'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-foreground font-medium truncate" style={{ fontSize: 12 }}>
                  {user.name}
                </div>
                <div
                  className="truncate font-semibold text-[10px]"
                  style={{ color: roleBadgeColor }}
                >
                  {user.roleTitle} {isViewer && '(Read-Only)'}
                </div>
              </div>
            )}
          </Link>
        ) : (
          <div
            className="flex items-center gap-2 rounded-lg"
            style={{
              padding: collapsed ? '6px' : '7px 8px',
              background: 'var(--surface2)',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <div
              className="rounded-full flex items-center justify-center flex-shrink-0 font-bold"
              style={{
                width: 28,
                height: 28,
                background: roleBadgeColor,
                color: '#000',
                fontSize: 10,
              }}
            >
              {user.initials || 'AV'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-foreground font-medium truncate" style={{ fontSize: 12 }}>
                  {user.name}
                </div>
                <div
                  className="truncate font-semibold text-[10px]"
                  style={{ color: roleBadgeColor }}
                >
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
        style={{
          top: 20,
          right: -12,
          width: 24,
          height: 24,
          background: 'var(--card)',
          color: 'var(--text2)',
          cursor: 'pointer',
          zIndex: 10,
        }}
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
                <div className="font-bold text-foreground">
                  Copy &amp; Move Tabs Across Sections
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Click <strong className="text-emerald-400">Both Sections</strong> to copy a tab so
                  it displays in both PropCo and OpCo without removing it from either. Or click{' '}
                  <strong className="text-amber-400">PropCo</strong> /{' '}
                  <strong className="text-blue-400">OpCo</strong> to assign it exclusively.
                </div>
              </div>
            </div>

            {/* ── LOCATION SELECTION & ADD NEW TAB / DROPDOWN CARD ── */}
            <div
              className="p-3.5 rounded-xl border border-border transition-all"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
                    style={{ background: 'var(--primary)', color: '#000' }}
                  >
                    <Plus size={15} />
                  </div>
                  <div>
                    <div className="font-bold text-foreground text-xs">Add New Tab or Dropdown</div>
                    <div className="text-[10.5px] text-muted-foreground">
                      Select section and target tab location to add into that section or specific
                      tab dropdown
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer"
                  style={{
                    background: showAddForm ? 'var(--primary)' : 'var(--surface)',
                    color: showAddForm ? '#000' : 'var(--foreground)',
                    borderColor: 'var(--border)',
                  }}
                >
                  {showAddForm ? 'Close Form' : '+ Add Tab / Dropdown'}
                </button>
              </div>

              {showAddForm && (
                <form
                  onSubmit={handleAddNewTabOrDropdown}
                  className="mt-3 pt-3 border-t border-border/60 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* 1. Section Selection Dropdown */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                        1. Section Location
                      </label>
                      <CustomDropdown
                        variant="form"
                        width="100%"
                        value={newTabSection}
                        onChange={(val) => {
                          const s = val as 'propco' | 'opco' | 'both' | 'bottom';
                          setNewTabSection(s);
                          setNewTabTarget('root');
                        }}
                        options={[
                          { value: 'opco', label: 'OpCo (Operations Portal)' },
                          { value: 'propco', label: 'PropCo (Asset Co Portal)' },
                          { value: 'both', label: 'Both Sections (PropCo & OpCo)' },
                          { value: 'bottom', label: 'Bottom Nav List' },
                        ]}
                      />
                    </div>

                    {/* 2. Target Location / Tab Dropdown */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                        2. Target Location / Tab
                      </label>
                      <CustomDropdown
                        variant="form"
                        width="100%"
                        value={newTabTarget}
                        onChange={(val) => {
                          setNewTabTarget(val);
                          if (newTabName) {
                            updateSuggestedPath(newTabName, val);
                          }
                        }}
                        options={[
                          { value: 'root', label: 'Section Root (New Top-Level Sidebar Tab)' },
                          ...(newTabSection === 'opco'
                            ? [
                                { value: 'non-fixed', label: 'Inside Non-Fixed Assets' },
                                {
                                  value: 'maintenance',
                                  label: 'Inside Maintenance (PPM / Work Orders)',
                                },
                                {
                                  value: 'compliance',
                                  label: 'Inside Compliance (Certs / Statutory)',
                                },
                                { value: 'tasks', label: 'Inside Tasks and Alerts' },
                                { value: 'reports', label: 'Inside Reports' },
                                { value: 'task-module', label: 'Inside Task Module' },
                                {
                                  value: 'utilities',
                                  label: 'Inside Utility (Electricity / Gas / Water)',
                                },
                              ]
                            : []),
                          ...(newTabSection === 'propco'
                            ? [
                                { value: 'properties', label: 'Inside Properties' },
                                { value: 'all-assets', label: 'Inside Fixed Assets' },
                                {
                                  value: 'insurance',
                                  label: 'Inside Insurance (Claims / Renewals)',
                                },
                                {
                                  value: 'contracts',
                                  label: 'Inside Contracts (Suppliers / SLAs)',
                                },
                                { value: 'reports', label: 'Inside Reports' },
                              ]
                            : []),
                        ]}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Tab/Dropdown Title */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                        Tab or Dropdown Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Energy Audit, Water Log, Gas Safety..."
                        value={newTabName}
                        onChange={(e) => {
                          const name = e.target.value;
                          setNewTabName(name);
                          updateSuggestedPath(name, newTabTarget);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-foreground outline-none"
                      />
                    </div>

                    {/* Route Path */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                        Page Route / URL
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. /utilities-register?type=water"
                        value={newTabPath}
                        onChange={(e) => setNewTabPath(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-foreground outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10.5px] text-muted-foreground">
                      {newTabTarget === 'root'
                        ? `Will appear as a new tab under ${newTabSection.toUpperCase()}`
                        : `Will appear inside the ${newTabTarget} page and dropdown in ${newTabSection.toUpperCase()}`}
                    </span>
                    <button
                      type="submit"
                      className="samko-btn-primary px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Save Tab / Dropdown
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
                  Filter:
                </span>
                {['ALL', 'propco', 'opco', 'both', 'bottom'].map((f) => {
                  const isSelected = sectionFilter === f;
                  const label =
                    f === 'ALL' ? 'All Tabs' : f === 'both' ? 'Both Sections' : f.toUpperCase();
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
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
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
                const currentLoc =
                  sectionMapping[tab.id] || DEFAULT_TAB_SECTIONS[tab.id] || 'propco';
                const meta = SECTION_BADGE_STYLES[currentLoc] || SECTION_BADGE_STYLES.propco;

                return (
                  <div
                    key={tab.id}
                    className="p-3 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-white/[0.02] transition-colors"
                    style={{ background: 'var(--surface)' }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className="p-1.5 rounded-lg flex-shrink-0"
                        style={{ background: 'var(--surface2)' }}
                      >
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
                          background:
                            currentLoc === 'propco' ? 'rgba(232,201,122,0.18)' : 'var(--surface2)',
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
                          background:
                            currentLoc === 'opco' ? 'rgba(96,165,250,0.18)' : 'var(--surface2)',
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
                          background:
                            currentLoc === 'both' ? 'rgba(61,214,140,0.2)' : 'var(--surface2)',
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
                          background:
                            currentLoc === 'bottom' ? 'rgba(148,163,184,0.18)' : 'var(--surface2)',
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
