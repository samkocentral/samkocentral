'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Upload,
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
} from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from '@/lib/authContext';
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

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  hideDefaultActions?: boolean;
}

export default function Topbar({ title, subtitle, actions, hideDefaultActions = false }: TopbarProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'critical' | 'warning' | 'unread'>('all');
  const [pulse, setPulse] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { dashboard: cmsDashboard, recentLogs: cmsRecentLogs, importExport: cmsImportExport } = useAppCms();
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
  } = useAuth();

  // Load and listen for live notifications updates across the entire application
  useEffect(() => {
    const syncNotifs = () => {
      setNotifications(getNotifications());
    };
    syncNotifs();

    window.addEventListener('samko:notifications-updated', syncNotifs);
    window.addEventListener('samko:data-changed', syncNotifs);
    window.addEventListener('storage', syncNotifs);

    const interval = setInterval(() => {
      setPulse((p) => !p);
    }, 1200);

    return () => {
      window.removeEventListener('samko:notifications-updated', syncNotifs);
      window.removeEventListener('samko:data-changed', syncNotifs);
      window.removeEventListener('storage', syncNotifs);
      clearInterval(interval);
    };
  }, []);

  // Compute live alarm / notification metrics
  const unreadCount = notifications.filter((n) => !n.read).length;
  const criticalList = notifications.filter((n) => n.type === 'critical');
  const warningList = notifications.filter((n) => n.type === 'warning');
  const unreadCriticalCount = notifications.filter((n) => n.type === 'critical' && !n.read).length;
  const unreadWarningCount = notifications.filter((n) => n.type === 'warning' && !n.read).length;

  const displayCriticalCount = unreadCriticalCount > 0 ? unreadCriticalCount : criticalList.length;
  const displayWarningCount = unreadWarningCount > 0 ? unreadWarningCount : warningList.length;

  // Filtered notifications for popover
  const filteredNotifications = notifications.filter((n) => {
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
            primaryActionLabel: ovCfg.primaryActionLabel ? ovCfg.primaryActionLabel.replace(/^\+\s*/, '') : undefined,
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
        if (cmsRecentLogs?.moduleTitle) {
          setCmsOverride({
            title: cmsRecentLogs.moduleTitle,
          });
          return;
        }
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
              primaryActionLabel: cfg.primaryActionLabel ? cfg.primaryActionLabel.replace(/^\+\s*/, '') : undefined,
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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
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
                if (pathname === '/') {
                  window.history.replaceState(null, '', '/?portal=propco');
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
                if (pathname === '/') {
                  window.history.replaceState(null, '', '/?portal=opco');
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
        {displayCriticalCount > 0 && (
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
        )}

        {/* Dynamic Clickable Warnings Badge */}
        {displayWarningCount > 0 && (
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
        )}

        {/* Live Alarms & Notifications Bell */}
        <div className="relative" ref={notifMenuRef}>
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all hover:border-primary/60 hover:bg-surface2 cursor-pointer text-foreground group shadow-sm"
            title="Facility Alarms & Real-Time Notifications"
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
            <span className="text-xs font-bold text-foreground hidden sm:inline">
              Alarms
            </span>

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
                        Live Alarms & Notifications
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
                  title="Simulate an incoming live building alarm in real-time"
                >
                  <Sparkles size={12} className="text-amber-400" />
                  <span>Simulate Alarm</span>
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
                        borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
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
                    <p className="text-xs font-bold text-foreground">All Systems Operating Normally</p>
                    <p className="text-[11px] text-muted-foreground mt-1 max-w-[240px]">
                      No active notifications under this filter. New alarms appear here dynamically.
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => {
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
                        <div className="mt-1.5">
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
                          {notif.actionUrl ? (
                            <Link
                              href={notif.actionUrl}
                              onClick={() => {
                                markAsRead(notif.id);
                                setNotifOpen(false);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                            >
                              <span>{notif.actionLabel || 'View Details'}</span>
                              <ExternalLink size={10} />
                            </Link>
                          ) : (
                            <span />
                          )}

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
                <span className="text-[10px] text-muted-foreground font-medium">
                  5 UK Properties
                </span>
              </div>
            </div>
          )}
        </div>

        {actions}

        {/* Action buttons (hidden or restricted for L4 Viewers) */}
        {!hideDefaultActions && canUpload && (
          <Link
            href="/document-repository"
            className="samko-btn-ghost flex items-center gap-1.5"
            style={{ padding: '6px 12px', fontSize: 12 }}
          >
            <Upload size={13} />
            <span className="hidden sm:inline">{cmsOverride.secondaryActionLabel || 'Upload Doc'}</span>
          </Link>
        )}

        {!hideDefaultActions && canEdit && (
          <Link
            href="/asset-management/assets"
            className="samko-btn-primary flex items-center gap-1.5"
            style={{ padding: '6px 12px', fontSize: 12 }}
          >
            <Plus size={13} />
            <span className="hidden sm:inline">{(cmsOverride.primaryActionLabel || 'Add Item').replace(/^\+\s*/, '')}</span>
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
                    <span className="text-[10px] uppercase font-extrabold bg-black/20 px-1.5 py-0.5 rounded">Exit</span>
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
                    {DEMO_CREDENTIALS.map((cred) => {
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
                            <span className="text-[10px] text-muted-foreground uppercase">Switch</span>
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
  );
}
