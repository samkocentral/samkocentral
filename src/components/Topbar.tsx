'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Upload, Plus, ChevronDown, LogOut, Shield, Crown, Eye, UploadCloud, Building2, Check, RefreshCw } from 'lucide-react';
import { ALERTS } from '@/lib/mockData';
import { useAuth, DEMO_CREDENTIALS } from '@/lib/authContext';
import { useAppCms } from '@/lib/appCmsConfig';
import { getPageConfig, type DeepAppCMSStore } from '@/lib/deepPageCms';

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  hideDefaultActions?: boolean;
}

export default function Topbar({ title, subtitle, actions, hideDefaultActions = false }: TopbarProps) {
  const [criticalCount, setCriticalCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [pulse, setPulse] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
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
    canSwitchPortal,
    roleBadgeText,
    roleBadgeColor,
    isImpersonating,
    exitImpersonation,
  } = useAuth();

  useEffect(() => {
    setCriticalCount(ALERTS.filter((a) => a.type === 'critical').length);
    setWarningCount(ALERTS.filter((a) => a.type === 'warning').length);

    const interval = setInterval(() => {
      setPulse((p) => !p);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

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
            primaryActionLabel: ovCfg.primaryActionLabel || undefined,
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
              primaryActionLabel: cfg.primaryActionLabel || undefined,
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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
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

      <div className="flex items-center gap-2.5 flex-shrink-0">
        {criticalCount > 0 && (
          <span
            className="status-badge hidden sm:inline-flex"
            style={{
              background: 'var(--critical-bg)',
              color: 'var(--critical)',
              fontSize: 11,
              opacity: pulse ? 1 : 0.65,
              transition: 'opacity 0.4s ease',
            }}
          >
            <span className="status-dot" />
            {criticalCount} critical
          </span>
        )}
        {warningCount > 0 && (
          <span
            className="status-badge hidden sm:inline-flex"
            style={{
              background: 'var(--warning-bg)',
              color: 'var(--warning)',
              fontSize: 11,
            }}
          >
            <span className="status-dot" />
            {warningCount} warnings
          </span>
        )}

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
            <span className="hidden sm:inline">{cmsOverride.primaryActionLabel || 'Add Item'}</span>
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