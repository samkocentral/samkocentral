'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Upload,
  CheckSquare,
  Building2,
  Calendar,
  Plus,
  ChevronDown,
  LogOut,
  Shield,
  Eye,
  Check,
  Bell,
  CheckCheck,
  Trash2,
  X,
  Sparkles,
  Radio,
  ExternalLink,
  ClipboardCheck,
  AlertTriangle,
  Info,
  Clock,
  User,
  FileText,
} from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from '@/lib/authContext';
import { getInitialTasks, type TaskItem } from '@/data/tasksData';
import { useAppCms } from '@/lib/appCmsConfig';
import { getPageConfig, type DeepAppCMSStore } from '@/lib/deepPageCms';
import {
  getNotifications,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  triggerSimulatedAlarm,
  formatRelativeTime,
  type AppNotification,
} from '@/lib/notifications';
import { api } from '@/lib/api';

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  hideDefaultActions?: boolean;
}

function getAlertDestination(notif?: { actionUrl?: string; title?: string; message?: string; source?: string } | null): { url: string; label: string } {
  if (!notif) return { url: '/compliance-tracker', label: 'View Tracker' };
  if (notif.actionUrl && notif.actionUrl !== '/compliance-register') {
    return { url: notif.actionUrl, label: 'View Details' };
  }
  const text = `${notif.title || ''} ${notif.message || ''} ${notif.source || ''}`.toLowerCase();
  if (text.includes('backup') || text.includes('prun') || text.includes('database') || text.includes('setting')) {
    return { url: '/settings', label: 'View Settings' };
  }
  if (text.includes('leak') || text.includes('hvac') || text.includes('generator') || text.includes('plant') || text.includes('maintenance')) {
    return { url: '/asset-management/maintenance', label: 'View Maintenance' };
  }
  if (text.includes('gas') || text.includes('meter') || text.includes('water') || text.includes('electric') || text.includes('utility')) {
    return { url: '/utilities-register', label: 'View Utilities' };
  }
  if (text.includes('contract') || text.includes('supplier')) {
    return { url: '/contracts-register', label: 'View Contracts' };
  }
  if (text.includes('asset') || text.includes('equipment') || text.includes('loler')) {
    return { url: '/asset-management/assets', label: 'View Assets' };
  }
  if (text.includes('task') || text.includes('duty') || text.includes('action')) {
    return { url: '/tasks', label: 'View Tasks' };
  }
  return { url: '/compliance-tracker', label: 'View Tracker' };
}

export default function Topbar({
  title,
  subtitle,
  actions,
  hideDefaultActions = false,
}: TopbarProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'critical' | 'warning' | 'unread'>('all');
  const [pulse, setPulse] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const tasksMenuRef = useRef<HTMLDivElement>(null);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [tasksFilter, setTasksFilter] = useState<'all' | 'urgent' | 'open'>('all');
  const [tasksList, setTasksList] = useState<TaskItem[]>([]);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [selectedAlertModal, setSelectedAlertModal] = useState<AppNotification | null>(null);
  const [selectedTaskModal, setSelectedTaskModal] = useState<TaskItem | null>(null);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.users.getAll();
        if (res.success && Array.isArray(res.data)) {
          setSystemUsers(res.data.filter((u: any) => u.id !== 'usr-bot-001'));
        }
      } catch {}
    };
    fetchUsers();
    window.addEventListener('samko:data-changed', fetchUsers);
    return () => window.removeEventListener('samko:data-changed', fetchUsers);
  }, []);
  const pathname = usePathname();
  const {
    dashboard: cmsDashboard,
    recentLogs: cmsRecentLogs,
    importExport: cmsImportExport,
  } = useAppCms();
  const [cmsOverride, setCmsOverride] = useState<{
    title?: string;
    subtitle?: string;
    primaryActionLabel?: string;
    secondaryActionLabel?: string;
  }>({});

  const {
    user,
    activePortal,
    setActivePortal,
    logout,
    switchUser,
    isSuperAdmin,
    isViewer,
    canUpload,
    canEdit,
    roleBadgeColor,
    isImpersonating,
    exitImpersonation,
    isDigitalBot,
    isPropertyAccessible,
  } = useAuth();

  const isSuperAdminOrBot =
    isSuperAdmin ||
    isDigitalBot ||
    user?.roleLevel === 'L1' ||
    user?.id === 'usr-bot-001' ||
    user?.name?.toLowerCase().includes('digital bot') ||
    user?.roleTitle?.toLowerCase().includes('digital bot') ||
    user?.roleTitle?.toLowerCase().includes('super admin');

  // Load and listen for live notifications, tasks, and approvals updates across the application
  useEffect(() => {
    const syncNotifs = () => {
      setNotifications(getNotifications());
    };
    const syncTasks = () => {
      try {
        const stored = localStorage.getItem('samko_tasks');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTasksList(parsed);
            return;
          }
        }
      } catch (e) {}
      setTasksList(getInitialTasks());
    };
    const syncApprovals = () => {
      try {
        const rawDel = localStorage.getItem('samko_deleted_doc_ids');
        const deletedIds = rawDel ? new Set(JSON.parse(rawDel)) : new Set();
        const rawCount = localStorage.getItem('samko_approvals_count');
        if (rawCount !== null && !isNaN(parseInt(rawCount, 10))) {
          setPendingApprovalsCount(parseInt(rawCount, 10));
          return;
        }
        const cached = localStorage.getItem('samko_repository_documents');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            const count = parsed
              .filter((d: any) => !deletedIds.has(d.id))
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
      } catch {}
      setPendingApprovalsCount(0);
    };

    const handleApprovalsEvent = (e: any) => {
      if (e?.detail?.count !== undefined && typeof e.detail.count === 'number') {
        setPendingApprovalsCount(e.detail.count);
      } else {
        syncApprovals();
      }
    };

    syncTasks();
    syncNotifs();
    syncApprovals();

    window.addEventListener('samko:notifications-updated', syncNotifs);
    window.addEventListener('samko:task-changed', syncTasks);
    window.addEventListener('samko:doc_uploaded', syncApprovals);
    window.addEventListener('samko:doc_approved', syncApprovals);
    window.addEventListener('samko:approvals-changed', handleApprovalsEvent);
    window.addEventListener('samko:data-changed', syncNotifs);
    window.addEventListener('samko:data-changed', syncApprovals);
    window.addEventListener('storage', syncNotifs);
    window.addEventListener('storage', syncApprovals);

    const interval = setInterval(() => {
      setPulse((p) => !p);
    }, 1200);

    return () => {
      window.removeEventListener('samko:notifications-updated', syncNotifs);
      window.removeEventListener('samko:task-changed', syncTasks);
      window.removeEventListener('samko:doc_uploaded', syncApprovals);
      window.removeEventListener('samko:doc_approved', syncApprovals);
      window.removeEventListener('samko:approvals-changed', handleApprovalsEvent);
      window.removeEventListener('samko:data-changed', syncNotifs);
      window.removeEventListener('samko:data-changed', syncApprovals);
      window.removeEventListener('storage', syncNotifs);
      window.removeEventListener('storage', syncApprovals);
      clearInterval(interval);
    };
  }, [isPropertyAccessible]);

  // Scope notifications and tasks by user's assigned property
  const accessibleNotifications = useMemo(() => {
    return notifications.filter((n: AppNotification) => !n.site || isPropertyAccessible(n.site));
  }, [notifications, isPropertyAccessible]);

  const accessibleTasks = useMemo(() => {
    return tasksList.filter((t: TaskItem) =>
      !t.property && !(t as any).hotel ? true : isPropertyAccessible(t.property || (t as any).hotel)
    );
  }, [tasksList, isPropertyAccessible]);

  // Compute live alarm / notification metrics
  const unreadCount = accessibleNotifications.filter((n: AppNotification) => !n.read).length;
  const criticalList = accessibleNotifications.filter(
    (n: AppNotification) => n.type === 'critical'
  );
  const warningList = accessibleNotifications.filter((n: AppNotification) => n.type === 'warning');
  const unreadCriticalCount = accessibleNotifications.filter(
    (n: AppNotification) => n.type === 'critical' && !n.read
  ).length;
  const unreadWarningCount = accessibleNotifications.filter(
    (n: AppNotification) => n.type === 'warning' && !n.read
  ).length;

  const displayCriticalCount =
    criticalList.length > 0
      ? unreadCriticalCount > 0
        ? unreadCriticalCount
        : criticalList.length
      : isSuperAdmin
        ? 3
        : 0;
  const displayWarningCount =
    warningList.length > 0
      ? unreadWarningCount > 0
        ? unreadWarningCount
        : warningList.length
      : isSuperAdmin
        ? 3
        : 0;

  // Filtered notifications for popover
  const filteredNotifications = accessibleNotifications.filter((n: AppNotification) => {
    if (notifFilter === 'critical') return n.type === 'critical';
    if (notifFilter === 'warning') return n.type === 'warning';
    if (notifFilter === 'unread') return !n.read;
    return true;
  });

  // Dynamically resolve titles and subtitles edited in CMS
  useEffect(() => {
    const resolveCmsTitle = () => {
      if (!pathname) return;
      if (pathname === '/') {
        const ovCfg = getPageConfig('overview');
        if (ovCfg?.title) {
          setCmsOverride({
            title: ovCfg.title,
            subtitle: ovCfg.subtitle || undefined,
            primaryActionLabel: ovCfg.primaryActionLabel
              ? ovCfg.primaryActionLabel.replace(/^[\+\s]+/, '').trim()
              : undefined,
            secondaryActionLabel: ovCfg.secondaryActionLabel || undefined,
          });
          return;
        }
        if (cmsDashboard?.pageTitle) {
          setCmsOverride({
            title: cmsDashboard.pageTitle,
            subtitle: cmsDashboard.pageSubtitle || undefined,
          });
          return;
        }
      }
      if (pathname === '/recent-logs') {
        setCmsOverride({
          title: 'Audit Logs',
          subtitle:
            'Live audit trail of real platform operations, compliance checks, and user activities',
        });
        return;
      }
      if (pathname.startsWith('/asset-management/import')) {
        if (cmsImportExport?.moduleTitle) {
          setCmsOverride({
            title: cmsImportExport.moduleTitle,
          });
          return;
        }
      }
      const pageKeyMap: Record<string, keyof DeepAppCMSStore> = {
        '/asset-management/properties': 'properties',
        '/asset-management/assets': 'assets',
        '/asset-management/categories': 'categories',
        '/asset-management/maintenance': 'maintenance',
        '/compliance-register': 'compliance',
        '/compliance-tracker': 'compliancetracker',
        '/contracts-register': 'contracts',
        '/insurance-register': 'insurance',
        '/utilities-register': 'utilities',
        '/tasks': 'tasks',
        '/task-manager': 'tasks',
        '/document-repository': 'documents',
        '/asset-management/reports': 'reports',
        '/asset-management/inspections': 'inspections',
        '/multi-site-operations': 'multisite',
        '/recent-logs': 'recentlogs',
        '/users': 'users',
        '/asset-management/import': 'import',
        '/asset-management/qr-scanner': 'qr',
        '/asset-management': 'assetdashboard',
      };
      for (const [route, key] of Object.entries(pageKeyMap)) {
        if (pathname.startsWith(route)) {
          const cfg = getPageConfig(key);
          if (cfg && cfg.title) {
            setCmsOverride({
              title: cfg.title,
              subtitle: cfg.subtitle || undefined,
              primaryActionLabel: cfg.primaryActionLabel
                ? cfg.primaryActionLabel.replace(/^[\+\s]+/, '').trim()
                : undefined,
              secondaryActionLabel: cfg.secondaryActionLabel || undefined,
            });
          }
          return;
        }
      }
      setCmsOverride({});
    };

    resolveCmsTitle();
    window.addEventListener('samko:app-cms-updated', resolveCmsTitle);
    window.addEventListener('samko:deep-page-cms-updated', resolveCmsTitle);
    window.addEventListener('storage', resolveCmsTitle);
    return () => {
      window.removeEventListener('samko:app-cms-updated', resolveCmsTitle);
      window.removeEventListener('samko:deep-page-cms-updated', resolveCmsTitle);
      window.removeEventListener('storage', resolveCmsTitle);
    };
  }, [pathname, cmsDashboard, cmsRecentLogs, cmsImportExport]);

  const displayTitle = cmsOverride.title || title;
  const displaySubtitle = cmsOverride.subtitle || subtitle;

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (tasksMenuRef.current && !tasksMenuRef.current.contains(e.target as Node)) {
        setTasksOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header
      className="flex items-center gap-4 border-b border-border flex-shrink-0"
      style={{ padding: '0 24px', height: 62, background: 'var(--card)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h1
            className="font-head text-foreground truncate"
            style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}
          >
            {displayTitle}
          </h1>

          {/* Portal Indicator / Switcher */}
          <div
            className="flex items-center rounded-lg p-0.5"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
          >
            <button
              type="button"
              onClick={() => {
                setActivePortal('propco');
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  url.searchParams.set('portal', 'propco');
                  router.push(url.pathname + url.search);
                }
              }}
              className="px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer"
              style={{
                background: activePortal === 'propco' ? 'var(--primary)' : 'transparent',
                color: activePortal === 'propco' ? '#000' : 'var(--text2)',
              }}
            >
              Propco Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePortal('opco');
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  url.searchParams.set('portal', 'opco');
                  router.push(url.pathname + url.search);
                }
              }}
              className="px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer"
              style={{
                background: activePortal === 'opco' ? 'var(--primary)' : 'transparent',
                color: activePortal === 'opco' ? '#000' : 'var(--text2)',
              }}
            >
              Opco Portal
            </button>
          </div>

          {/* Read-only indicator for L4 Viewer */}
          {isViewer && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold"
              style={{ background: 'rgba(148,163,184,0.15)', color: '#94a3b8' }}
            >
              <Eye size={12} /> Read-Only Mode
            </span>
          )}
        </div>

        {displaySubtitle && (
          <p className="text-muted-foreground truncate" style={{ fontSize: 11, marginTop: 1 }}>
            {displaySubtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
        {/* Dynamic Clickable Critical Alarms Badge */}
        <button
          type="button"
          onClick={() => {
            setNotifFilter('critical');
            setNotifOpen(true);
          }}
          className="status-badge hidden sm:inline-flex cursor-pointer transition-all hover:scale-105 active:scale-95 border-0"
          title="Click to view critical facility alarms"
          style={{
            background: 'var(--critical-bg)',
            color: 'var(--critical)',
            fontSize: 11,
            opacity: pulse ? 1 : 0.7,
            transition: 'opacity 0.4s ease',
          }}
        >
          <span className="status-dot animate-pulse" />
          {displayCriticalCount} critical
        </button>

        {/* Dynamic Clickable Warnings Badge */}
        <button
          type="button"
          onClick={() => {
            setNotifFilter('warning');
            setNotifOpen(true);
          }}
          className="status-badge hidden sm:inline-flex cursor-pointer transition-all hover:scale-105 active:scale-95 border-0"
          title="Click to view facility warnings"
          style={{
            background: 'var(--warning-bg)',
            color: 'var(--warning)',
            fontSize: 11,
          }}
        >
          <span className="status-dot" />
          {displayWarningCount} warnings
        </button>

        {/* Live Alarms & Notifications Bell */}
        <div className="relative" ref={notifMenuRef}>
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all hover:border-primary/60 hover:bg-surface2 cursor-pointer text-foreground group shadow-sm"
            title="Facility Alerts & Real-Time Notifications"
            style={{
              background: notifOpen ? 'var(--surface2)' : 'var(--surface)',
              borderColor: unreadCriticalCount > 0 ? 'rgba(239, 68, 68, 0.6)' : 'var(--border)',
              boxShadow: unreadCriticalCount > 0 ? '0 0 12px rgba(239, 68, 68, 0.25)' : undefined,
            }}
            aria-label="Alarms and Notifications"
          >
            <Bell
              size={15}
              className={`transition-colors ${
                unreadCriticalCount > 0
                  ? 'text-rose-400 animate-bounce'
                  : unreadCount > 0
                    ? 'text-primary'
                    : 'text-muted-foreground group-hover:text-foreground'
              }`}
            />
            <span className="text-xs font-bold text-foreground hidden sm:inline">Alerts</span>

            {/* Counter Badge */}
            {unreadCount > 0 && (
              <span
                className={`min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                  unreadCriticalCount > 0
                    ? 'bg-rose-500 shadow-md shadow-rose-500/50'
                    : 'bg-amber-500 shadow-md shadow-amber-500/40'
                }`}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}

            {/* Pulsing ring on critical alarms */}
            {unreadCriticalCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping ml-0.5" />
            )}
          </button>

          {/* Alarms & Notifications Popover Drawer */}
          {notifOpen && (
            <div
              className="absolute right-0 mt-2 w-96 sm:w-[440px] max-w-[92vw] rounded-2xl border border-border shadow-2xl z-50 flex flex-col overflow-hidden backdrop-blur-md"
              style={{
                background: 'var(--card)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06)',
              }}
            >
              {/* Header */}
              <div
                className="p-3.5 border-b border-border flex items-center justify-between"
                style={{ background: 'var(--surface2)' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                    <Radio size={14} className="text-rose-400 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-head font-bold text-xs sm:text-sm text-foreground">
                        Live Alerts & Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Real-time facility telemetry & statutory alerts
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setNotifOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface3 transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Action Toolbar */}
              <div
                className="px-3.5 py-2 border-b border-border flex items-center justify-between gap-2 flex-wrap"
                style={{ background: 'var(--surface)' }}
              >
                {/* ⚡ Simulate Live Alarm Button */}
                <button
                  type="button"
                  onClick={() => triggerSimulatedAlarm()}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/35 hover:bg-amber-500/25 transition-all shadow-sm cursor-pointer active:scale-95"
                  title="Simulate an incoming live building alert in real-time"
                >
                  <Sparkles size={12} className="text-amber-400" />
                  <span>Simulate Alert</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => markAllAsRead()}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-surface2 transition-colors cursor-pointer"
                    title="Mark all notifications as read"
                  >
                    <CheckCheck size={12} />
                    <span>Read all</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => clearAllNotifications()}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Clear all notifications"
                  >
                    <Trash2 size={12} />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center px-3 pt-2 gap-1.5 border-b border-border/70 overflow-x-auto custom-scrollbar">
                {(
                  [
                    { key: 'all', label: 'All', count: notifications.length },
                    { key: 'critical', label: '🚨 Critical', count: criticalList.length },
                    { key: 'warning', label: '⚠️ Warnings', count: warningList.length },
                    { key: 'unread', label: 'Unread', count: unreadCount },
                  ] as const
                ).map((tab) => {
                  const isActive = notifFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setNotifFilter(tab.key)}
                      className="px-2.5 py-1.5 text-[11px] font-bold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                      style={{
                        background: isActive ? 'var(--surface2)' : 'transparent',
                        color: isActive ? 'var(--primary)' : 'var(--text2)',
                        borderBottom: isActive
                          ? '2px solid var(--primary)'
                          : '2px solid transparent',
                      }}
                    >
                      <span>{tab.label}</span>
                      <span
                        className="px-1.5 py-0.2 rounded-full text-[9px] font-black"
                        style={{
                          background: isActive ? 'var(--primary)' : 'var(--surface3)',
                          color: isActive ? '#000' : 'var(--muted-foreground)',
                        }}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Notification Items List */}
              <div className="max-h-[360px] overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                {filteredNotifications.length === 0 ? (
                  <div className="py-10 text-center flex flex-col items-center justify-center">
                    <Shield size={34} className="text-emerald-500/70 mb-2" />
                    <p className="text-xs font-bold text-foreground">
                      All Systems Operating Normally
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 max-w-[240px]">
                      No active notifications under this filter. New alerts appear here dynamically.
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notif: AppNotification) => {
                    const isCrit = notif.type === 'critical';
                    const isWarn = notif.type === 'warning';
                    return (
                      <div
                        key={notif.id}
                        className={`relative p-3 rounded-xl border transition-all ${
                          notif.read
                            ? 'bg-surface/60 border-border opacity-85 hover:opacity-100'
                            : 'bg-surface2 border-border-strong shadow-md'
                        }`}
                        style={{
                          borderLeftWidth: 4,
                          borderLeftColor: isCrit
                            ? '#ef4444'
                            : isWarn
                              ? '#f59e0b'
                              : notif.type === 'success'
                                ? '#10b981'
                                : '#3b82f6',
                        }}
                      >
                        {/* Top Meta */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                isCrit
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : isWarn
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}
                            >
                              {notif.source || notif.type}
                            </span>
                            {notif.site && (
                              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-surface3 text-muted-foreground border border-border truncate max-w-[180px]">
                                {notif.site}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {formatRelativeTime(notif.timestamp)}
                            </span>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 animate-pulse" />
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notif.id);
                              }}
                              className="text-muted-foreground hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
                              title="Delete notification"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div
                          className="mt-1.5 cursor-pointer"
                          onClick={() => setSelectedAlertModal(notif)}
                        >
                          <p
                            className={`text-xs font-bold leading-tight ${
                              isCrit ? 'text-rose-300' : 'text-foreground'
                            }`}
                          >
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>

                        {/* Bottom Actions */}
                        <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAlertModal(notif);
                              }}
                              className="inline-flex items-center gap-1 text-[10.5px] font-bold text-foreground hover:text-primary transition-colors cursor-pointer bg-surface3/90 hover:bg-surface3 px-2 py-0.5 rounded border border-border/60"
                              title="View this alert in detail"
                            >
                              <Eye size={11} className="text-primary" />
                              <span>View Alert</span>
                            </button>

                            {(() => {
                              const dest = getAlertDestination(notif);
                              return (
                                <Link
                                  href={dest.url}
                                  onClick={() => {
                                    markAsRead(notif.id);
                                    setNotifOpen(false);
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                                >
                                  <span>{notif.actionLabel || dest.label}</span>
                                  <ExternalLink size={10} />
                                </Link>
                              );
                            })()}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (notif.read) {
                                markAsUnread(notif.id);
                              } else {
                                markAsRead(notif.id);
                              }
                            }}
                            className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            {notif.read ? 'Mark unread' : 'Mark as read'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Popover Footer with Real-time monitoring radar */}
              <div
                className="p-2.5 border-t border-border flex items-center justify-between text-[11px]"
                style={{ background: 'var(--surface2)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-[10.5px] font-semibold text-emerald-400">
                    Live Telemetry Monitoring Active
                  </span>
                </div>
                <Link
                  href="/compliance-tracker"
                  onClick={() => setNotifOpen(false)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                >
                  <span>View All Alerts</span>
                  <ExternalLink size={10} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Tasks View for Super Admin and Digital Bot */}
        {(isSuperAdmin || isDigitalBot) && (
          <div className="relative" ref={tasksMenuRef}>
            <button
              type="button"
              onClick={() => setTasksOpen(!tasksOpen)}
              className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all hover:border-primary/60 hover:bg-surface2 cursor-pointer text-foreground group shadow-sm"
              title="Operational Tasks & Assigned Duties (Super Admin / Digital Bot)"
              style={{
                background: tasksOpen ? 'var(--surface2)' : 'var(--surface)',
                borderColor: 'var(--border)',
              }}
              aria-label="Tasks"
            >
              <CheckSquare
                size={14}
                className="text-amber-400 group-hover:text-primary transition-colors"
              />
              <span className="text-xs font-bold text-foreground hidden sm:inline">Tasks</span>

              {/* Dynamic Task Count Badge */}
              <span
                className="min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-black"
                style={{
                  background: 'rgba(232, 201, 122, 0.2)',
                  color: 'var(--primary)',
                  border: '1px solid rgba(232, 201, 122, 0.35)',
                }}
              >
                {accessibleTasks.filter((t: TaskItem) => t.status !== 'completed').length}
              </span>
            </button>

            {/* Tasks Popover Drawer */}
            {tasksOpen && (
              <div
                className="absolute right-0 mt-2 w-96 sm:w-[440px] max-w-[92vw] rounded-2xl border border-border shadow-2xl z-50 flex flex-col overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
                style={{
                  background: 'var(--card)',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06)',
                }}
              >
                {/* Header */}
                <div
                  className="p-3.5 border-b border-border flex items-center justify-between"
                  style={{ background: 'var(--surface2)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                      <CheckSquare size={14} className="text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-head font-bold text-xs sm:text-sm text-foreground">
                          Operational Tasks & Workflows
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {accessibleTasks.filter((t: TaskItem) => t.status !== 'completed').length}{' '}
                          open
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Assigned duties & property statutory actions
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTasksOpen(false)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface3 transition-colors cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Filter Tabs */}
                <div
                  className="px-3.5 pt-2 border-b border-border flex items-center gap-1 overflow-x-auto"
                  style={{ background: 'var(--surface)' }}
                >
                  {[
                    { key: 'all', label: 'All Tasks', count: accessibleTasks.length },
                    {
                      key: 'urgent',
                      label: 'Urgent',
                      count: accessibleTasks.filter((t: TaskItem) => t.priority === 'urgent')
                        .length,
                    },
                    {
                      key: 'open',
                      label: 'Open',
                      count: accessibleTasks.filter((t: TaskItem) => t.status === 'open').length,
                    },
                  ].map((tab) => {
                    const isActive = tasksFilter === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setTasksFilter(tab.key as any)}
                        className="px-2.5 py-1.5 text-[11px] font-bold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                        style={{
                          background: isActive ? 'var(--surface2)' : 'transparent',
                          color: isActive ? 'var(--primary)' : 'var(--text2)',
                          borderBottom: isActive
                            ? '2px solid var(--primary)'
                            : '2px solid transparent',
                        }}
                      >
                        <span>{tab.label}</span>
                        <span
                          className="px-1.5 py-0.2 rounded-full text-[9px] font-black"
                          style={{
                            background: isActive ? 'var(--primary)' : 'var(--surface3)',
                            color: isActive ? '#000' : 'var(--muted-foreground)',
                          }}
                        >
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Tasks List */}
                <div className="max-h-[340px] overflow-y-auto p-3 space-y-2 custom-scrollbar">
                  {accessibleTasks
                    .filter((t: TaskItem) => {
                      if (tasksFilter === 'urgent') return t.priority === 'urgent';
                      if (tasksFilter === 'open') return t.status === 'open';
                      return true;
                    })
                    .map((task: TaskItem) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskModal(task)}
                        className="block p-2.5 rounded-xl border border-border/70 hover:border-primary/50 transition-all hover:bg-surface2/80 text-foreground group cursor-pointer"
                        style={{ background: 'var(--surface2)' }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex-shrink-0"
                              style={{
                                background:
                                  task.priority === 'urgent'
                                    ? 'rgba(244,63,94,0.15)'
                                    : task.priority === 'high'
                                      ? 'rgba(245,158,11,0.15)'
                                      : 'rgba(56,189,248,0.15)',
                                color:
                                  task.priority === 'urgent'
                                    ? '#f43f5e'
                                    : task.priority === 'high'
                                      ? '#f59e0b'
                                      : '#38bdf8',
                              }}
                            >
                              {task.priority}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate font-medium">
                              {task.property}
                            </span>
                          </div>
                          <span
                            className="text-[10px] font-semibold whitespace-nowrap"
                            style={{
                              color: task.dueInDays < 0 ? '#f43f5e' : 'var(--muted-foreground)',
                            }}
                          >
                            {task.dueInDays < 0
                              ? `${Math.abs(task.dueInDays)}d overdue`
                              : task.dueInDays === 0
                                ? 'Due today'
                                : `Due in ${task.dueInDays}d`}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-foreground mt-1 group-hover:text-primary transition-colors line-clamp-1">
                          {task.title}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1.5 pt-1.5 border-t border-border/40">
                          <span className="flex items-center gap-1">
                            <span
                              className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-black"
                              style={{ background: task.assigneeColor || '#e8c97a' }}
                            >
                              {task.assigneeInitials}
                            </span>
                            <span>{task.assignee}</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTaskModal(task);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary-focus px-1.5 py-0.5 rounded bg-surface3 border border-border/60 hover:bg-surface3/80 transition-colors cursor-pointer"
                              title="View this task in detail"
                            >
                              <Eye size={10} />
                              <span>View Task</span>
                            </button>
                            <span className="capitalize">{task.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Footer link to Task Manager */}
                <div
                  className="p-3 border-t border-border flex items-center justify-between"
                  style={{ background: 'var(--surface)' }}
                >
                  <Link
                    href="/tasks"
                    onClick={() => setTasksOpen(false)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold samko-btn-primary transition-all text-center"
                  >
                    <span>Open Task Manager & Action List (View All Tasks)</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {actions}

        {/* Approvals Quick Button (Strictly Super Admin & Digital Bot only) */}
        {!hideDefaultActions && isSuperAdminOrBot && (
          <Link
            href="/approvals"
            className={`samko-btn-ghost flex items-center gap-1.5 transition-all text-xs font-semibold ${
              pathname === '/approvals' ? 'border-primary/60 bg-surface2 text-primary' : ''
            }`}
            style={{ padding: '6px 12px', fontSize: 12 }}
            title="Approvals Management Queue"
          >
            <ClipboardCheck size={14} className="text-primary" />
            <span className="hidden sm:inline">Approvals</span>
            {pendingApprovalsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {pendingApprovalsCount}
              </span>
            )}
          </Link>
        )}

        {/* User Account Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg border border-border transition-colors hover:border-border-strong cursor-pointer"
            style={{ background: 'var(--surface2)' }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px]"
              style={{ background: roleBadgeColor, color: '#000' }}
            >
              {user.initials || 'SA'}
            </div>

            <div className="hidden lg:flex flex-col text-left">
              <span className="text-foreground text-xs font-semibold leading-tight truncate max-w-[120px]">
                {user.name.split(' ')[0]}
              </span>
              <span
                className="text-[10px] font-extrabold uppercase tracking-wide leading-tight"
                style={{ color: roleBadgeColor }}
              >
                {user.roleLevel} · {user.roleTitle}
              </span>
            </div>

            <ChevronDown size={13} className="text-muted-foreground ml-0.5" />
          </button>

          {/* User Menu Dropdown */}
          {userMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-72 rounded-xl border border-border shadow-2xl z-50 p-2"
              style={{ background: 'var(--card)' }}
            >
              <div className="px-3 py-2 border-b border-border mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{user.name}</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase"
                    style={{ background: `${roleBadgeColor}20`, color: roleBadgeColor }}
                  >
                    {user.roleLevel}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                  Assigned: {user.hotel || 'All Properties'}
                </div>
              </div>

              {/* Return to Super Admin button when viewing as another role */}
              {isImpersonating && (
                <div className="mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      exitImpersonation();
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-black transition-all hover:brightness-110 shadow-sm"
                    style={{ background: 'var(--primary)' }}
                  >
                    <span className="flex items-center gap-1.5">
                      <LogOut size={13} /> Return to Super Admin
                    </span>
                    <span className="text-[10px] uppercase font-extrabold bg-black/20 px-1.5 py-0.5 rounded">
                      Exit
                    </span>
                  </button>
                </div>
              )}

              {/* Quick switch test accounts — available for Super Admin and while in Admin Preview */}
              {(isSuperAdmin || isImpersonating) && (
                <>
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Switch Role (Testing)
                  </div>
                  <div className="space-y-1 mb-2">
                    {DEMO_CREDENTIALS.filter((cred) => {
                      const isBot =
                        cred.user.id === 'usr-bot-001' ||
                        cred.user.email?.toLowerCase() === 'digitalbot@samkocentral.com' ||
                        cred.title.toLowerCase().includes('digital bot');
                      return !isBot || isDigitalBot;
                    }).map((cred) => {
                      const isActive = user.email === cred.user.email;
                      return (
                        <button
                          key={cred.level + cred.title}
                          type="button"
                          onClick={() => {
                            switchUser(cred.user);
                            setUserMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left text-xs transition-colors hover:bg-surface2"
                          style={{ background: isActive ? 'var(--surface2)' : 'transparent' }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: cred.color }}
                            />
                            <span className="truncate text-foreground font-medium">
                              {cred.level} · {cred.title}
                            </span>
                          </div>
                          {isActive ? (
                            <Check size={12} className="text-primary flex-shrink-0" />
                          ) : (
                            <span className="text-[10px] text-muted-foreground uppercase">
                              Switch
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {systemUsers
                      .filter(
                        (su) =>
                          !DEMO_CREDENTIALS.some(
                            (c) =>
                              c.user.id === su.id ||
                              c.user.email?.toLowerCase() === su.email?.toLowerCase()
                          )
                      )
                      .map((su) => {
                        const isActive = user.email === su.email;
                        const roleColor =
                          su.roleLevel === 'L1'
                            ? '#f43f5e'
                            : su.roleLevel === 'L2'
                              ? '#60a5fa'
                              : su.roleLevel === 'L3'
                                ? '#10b981'
                                : '#94a3b8';
                        return (
                          <button
                            key={su.id}
                            type="button"
                            onClick={() => {
                              switchUser(su);
                              setUserMenuOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left text-xs transition-colors hover:bg-surface2"
                            style={{ background: isActive ? 'var(--surface2)' : 'transparent' }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ background: roleColor }}
                              />
                              <span className="truncate text-foreground font-medium">
                                {su.name} ({su.roleLevel} · {su.roleTitle || su.role})
                              </span>
                            </div>
                            {isActive ? (
                              <Check size={12} className="text-primary flex-shrink-0" />
                            ) : (
                              <span className="text-[10px] text-muted-foreground uppercase">
                                Switch
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </>
              )}

              <div className="border-t border-border pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut size={13} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

      {/* Alert Detail View Modal */}
      {selectedAlertModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setSelectedAlertModal(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-border shadow-2xl p-6 text-foreground overflow-hidden"
            style={{ background: 'var(--surface, #11141a)', backgroundColor: '#11141a' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    selectedAlertModal.type === 'critical'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : selectedAlertModal.type === 'warning'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  {selectedAlertModal.type === 'critical' || selectedAlertModal.type === 'warning' ? (
                    <AlertTriangle size={18} />
                  ) : (
                    <Info size={18} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        selectedAlertModal.type === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : selectedAlertModal.type === 'warning'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {selectedAlertModal.source || selectedAlertModal.type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(selectedAlertModal.timestamp)}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mt-1">
                    {selectedAlertModal.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlertModal(null)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-surface2 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="py-4 space-y-3.5">
              {/* Site info */}
              {selectedAlertModal.site && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-surface2 px-3 py-2 rounded-xl border border-border/70">
                  <Building2 size={15} className="text-primary flex-shrink-0" />
                  <span className="font-semibold text-foreground">Property / Site:</span>
                  <span>{selectedAlertModal.site}</span>
                </div>
              )}

              {/* Message */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Alert Message & Details
                </label>
                <div className="p-3.5 rounded-xl bg-surface2 border border-border text-xs leading-relaxed text-foreground/90">
                  {selectedAlertModal.message}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-surface3/50 border border-border/60">
                <span className="text-muted-foreground font-medium">Notification Status:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    selectedAlertModal.read
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {selectedAlertModal.read ? 'Read' : 'Unread (Action Pending)'}
                </span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-border flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedAlertModal.read) {
                      markAsUnread(selectedAlertModal.id);
                      setSelectedAlertModal((prev) => (prev ? { ...prev, read: false } : null));
                    } else {
                      markAsRead(selectedAlertModal.id);
                      setSelectedAlertModal((prev) => (prev ? { ...prev, read: true } : null));
                    }
                  }}
                  className="samko-btn-ghost px-3 py-1.5 text-xs font-semibold cursor-pointer"
                >
                  {selectedAlertModal.read ? 'Mark Unread' : 'Mark as Read'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteNotification(selectedAlertModal.id);
                    setSelectedAlertModal(null);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1.5 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>

              <div className="flex items-center gap-2">
                {(() => {
                  const dest = getAlertDestination(selectedAlertModal);
                  return (
                    <Link
                      href={dest.url}
                      onClick={() => {
                        markAsRead(selectedAlertModal.id);
                        setSelectedAlertModal(null);
                        setNotifOpen(false);
                      }}
                      className="samko-btn-primary px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{selectedAlertModal.actionLabel || dest.label}</span>
                      <ExternalLink size={12} />
                    </Link>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => setSelectedAlertModal(null)}
                  className="samko-btn-secondary px-3.5 py-1.5 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail View Modal */}
      {selectedTaskModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setSelectedTaskModal(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-border shadow-2xl p-6 text-foreground overflow-hidden"
            style={{ background: 'var(--surface, #11141a)', backgroundColor: '#11141a' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      selectedTaskModal.priority === 'urgent'
                        ? 'rgba(244,63,94,0.15)'
                        : selectedTaskModal.priority === 'high'
                          ? 'rgba(245,158,11,0.15)'
                          : 'rgba(56,189,248,0.15)',
                    color:
                      selectedTaskModal.priority === 'urgent'
                        ? '#f43f5e'
                        : selectedTaskModal.priority === 'high'
                          ? '#f59e0b'
                          : '#38bdf8',
                  }}
                >
                  <CheckSquare size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
                      style={{
                        background:
                          selectedTaskModal.priority === 'urgent'
                            ? 'rgba(244,63,94,0.15)'
                            : selectedTaskModal.priority === 'high'
                              ? 'rgba(245,158,11,0.15)'
                              : 'rgba(56,189,248,0.15)',
                        color:
                          selectedTaskModal.priority === 'urgent'
                            ? '#f43f5e'
                            : selectedTaskModal.priority === 'high'
                              ? '#f59e0b'
                              : '#38bdf8',
                      }}
                    >
                      {selectedTaskModal.priority} Priority
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {selectedTaskModal.id}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mt-1">
                    {selectedTaskModal.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskModal(null)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-surface2 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="py-4 space-y-3.5">
              {/* Grid info: Property, Timing, Assignee, Status */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-xl bg-surface2 border border-border/70">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Property / Site
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-foreground truncate">
                    <Building2 size={13} className="text-primary flex-shrink-0" />
                    <span className="truncate">{selectedTaskModal.property || 'Portfolio-wide'}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-surface2 border border-border/70">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Due Date & Timing
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-foreground">
                    <Calendar size={13} className="text-primary flex-shrink-0" />
                    <span
                      style={{
                        color: selectedTaskModal.dueInDays < 0 ? '#f43f5e' : 'inherit',
                      }}
                    >
                      {selectedTaskModal.dueInDays < 0
                        ? `${Math.abs(selectedTaskModal.dueInDays)}d overdue`
                        : selectedTaskModal.dueInDays === 0
                          ? 'Due Today'
                          : `In ${selectedTaskModal.dueInDays} days`}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-surface2 border border-border/70">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Assignee
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-foreground">
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-black flex-shrink-0"
                      style={{ background: selectedTaskModal.assigneeColor || '#e8c97a' }}
                    >
                      {selectedTaskModal.assigneeInitials}
                    </span>
                    <span className="truncate">{selectedTaskModal.assignee}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-surface2 border border-border/70">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Status
                  </span>
                  <div className="mt-1">
                    <span className="text-xs font-bold capitalize px-2 py-0.5 rounded bg-surface3 border border-border/60">
                      {selectedTaskModal.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedTaskModal.description && (
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Task Description & Instructions
                  </label>
                  <div className="p-3.5 rounded-xl bg-surface2 border border-border text-xs leading-relaxed text-foreground/90">
                    {selectedTaskModal.description}
                  </div>
                </div>
              )}

              {/* Linked Document if any */}
              {(selectedTaskModal as any).documentName && (
                <div className="p-2.5 rounded-xl bg-surface2 border border-border/70 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-primary" />
                    <span className="text-xs font-semibold text-foreground truncate max-w-[240px]">
                      {(selectedTaskModal as any).documentName}
                    </span>
                  </div>
                  {(selectedTaskModal as any).documentUrl && (
                    <a
                      href={(selectedTaskModal as any).documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 flex-shrink-0"
                    >
                      <span>View Doc</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-border flex items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">
                Assigned duty & statutory action item
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href="/tasks"
                  onClick={() => {
                    setSelectedTaskModal(null);
                    setTasksOpen(false);
                  }}
                  className="samko-btn-primary px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Open in Task Manager</span>
                  <ExternalLink size={12} />
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedTaskModal(null)}
                  className="samko-btn-secondary px-3.5 py-1.5 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
