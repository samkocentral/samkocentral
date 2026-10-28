'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Package,
  Tag,
  FileCheck,
  ScrollText,
  BarChart3,
  FolderOpen,
  Calendar,
  ShieldCheck,
  CheckSquare,
  ClipboardCheck,
  Zap,
  History,
  Upload,
  Users,
  Settings,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  Edit2,
  Check,
  Sparkles,
  Eye,
  EyeOff,
  Shield,
  Layers,
  LayoutDashboard,
  QrCode,
} from 'lucide-react';
import { useAppCms, updatePortalTab, type AppCmsTab } from '@/lib/appCmsConfig';
import DeepPageCMSEditor from '@/components/settings/DeepPageCMSEditor';
import CompleteAppCMS, { type AppCmsSectionKey } from '@/components/settings/CompleteAppCMS';
import { type DeepAppCMSStore } from '@/lib/deepPageCms';
import { toast } from 'sonner';

export type PortalType = 'opco' | 'propco';

interface PortalCMSEditorProps {
  portal: PortalType;
  initialTabId?: string;
}

interface SubTabDef {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  deepPage?: keyof DeepAppCMSStore;
  cmsSection?: AppCmsSectionKey;
  livePath: string;
  description: string;
  subtabs?: Array<{ id: string; label: string; livePath: string }>;
}

// ── OPCO TABS (Operations) ──────────────────────────────────────────────────
const OPCO_SECTION_TABS: SubTabDef[] = [
  {
    id: 'non-fixed',
    label: 'Non-Fixed Assets',
    icon: Package,
    deepPage: 'nonfixed',
    livePath: '/asset-management/assets?type=non-fixed',
    description: 'Operational and non-fixed movable equipment register and condition surveys',
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    icon: Calendar,
    badge: '5',
    badgeColor: '#f43f5e',
    deepPage: 'maintenance',
    livePath: '/asset-management/maintenance',
    description: 'Scheduled preventive maintenance, work orders, and contractor service logs',
    subtabs: [
      { id: 'scheduled', label: 'Scheduled', livePath: '/asset-management/maintenance?filter=scheduled' },
      { id: 'due-today', label: 'Due Today', livePath: '/asset-management/maintenance?filter=due-today' },
      { id: 'overdue', label: 'Overdue', livePath: '/asset-management/maintenance?filter=overdue' },
      { id: 'completed', label: 'Completed', livePath: '/asset-management/maintenance?filter=completed' },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: ShieldCheck,
    deepPage: 'compliance',
    livePath: '/compliance-register',
    description: 'Statutory compliance standards, fire, water, lift, and gas certifications',
    subtabs: [
      { id: 'register', label: 'Compliance Register', livePath: '/compliance-register' },
      { id: 'certifications', label: 'Certifications', livePath: '/compliance-register?tab=certifications' },
      { id: 'statutory', label: 'Statutory Inspections', livePath: '/compliance-register?tab=statutory' },
      { id: 'expiry', label: 'Expiry Dashboard', livePath: '/compliance-tracker' },
    ],
  },
  {
    id: 'tasks',
    label: 'Tasks and Alerts',
    icon: CheckSquare,
    badge: '9',
    badgeColor: '#f59e0b',
    deepPage: 'tasks',
    livePath: '/tasks',
    description: 'Daily operational tasks, escalations, tickets, and assigned checklists',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    deepPage: 'reports',
    livePath: '/asset-management/reports?type=maintenance',
    description: 'Operational KPIs, maintenance uptime metrics, and analytics',
  },
  {
    id: 'task-module',
    label: 'Task Module',
    icon: Layers,
    livePath: '/task-manager',
    description: 'Kanban operational task workflow and ticket tracking',
  },
  {
    id: 'utilities',
    label: 'Utility',
    icon: Zap,
    deepPage: 'utilities',
    livePath: '/utilities-register',
    description: 'Electricity, gas, and water meter logs, tariffs, and utility accounts',
    subtabs: [
      { id: 'register', label: 'Utilities Register', livePath: '/utilities-register' },
      { id: 'energy', label: 'Energy & Water Accounts', livePath: '/utilities-register?type=electricity' },
    ],
  },
];

// ── PROPCO TABS (Asset Co) ──────────────────────────────────────────────────
const PROPCO_SECTION_TABS: SubTabDef[] = [
  {
    id: 'properties',
    label: 'Properties',
    icon: Building2,
    badge: '8',
    badgeColor: '#e8c97a',
    deepPage: 'properties',
    livePath: '/asset-management/properties',
    description: 'Real estate portfolio, freehold/leasehold properties, and site details',
  },
  {
    id: 'assets',
    label: 'Fixed Assets',
    icon: Package,
    deepPage: 'assets',
    livePath: '/asset-management/assets',
    description: 'High-value capital assets, machinery, plant equipment, and lifecycle records',
  },
  {
    id: 'insurance',
    label: 'Insurance',
    icon: FileCheck,
    deepPage: 'insurance',
    livePath: '/insurance-register',
    description: 'Building & property coverage policies, underwriters, premiums, and claims history',
    subtabs: [
      { id: 'register', label: 'Insurance Register', livePath: '/insurance-register' },
      { id: 'claims', label: 'Claims', livePath: '/insurance-register?tab=claims' },
      { id: 'renewals', label: 'Renewals', livePath: '/insurance-register?tab=renewals' },
    ],
  },
  {
    id: 'contracts',
    label: 'Contracts',
    icon: ScrollText,
    deepPage: 'contracts',
    livePath: '/contracts-register',
    description: 'Major vendor agreements, facility contracts, SLAs, notice periods, and renewals',
    subtabs: [
      { id: 'register', label: 'Contracts Register', livePath: '/contracts-register' },
      { id: 'suppliers', label: 'Suppliers', livePath: '/contracts-register?tab=suppliers' },
      { id: 'renewals', label: 'Renewals', livePath: '/contracts-register?tab=renewals' },
      { id: 'slas', label: 'SLAs', livePath: '/contracts-register?tab=slas' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    deepPage: 'reports',
    livePath: '/asset-management/reports?type=contracts',
    description: 'Capital asset register valuation, contract reports, and capex forecasting',
  },
];

// ── BOTTOM 4 SYSTEM TABS (Common to both portals) ───────────────────────────
const BOTTOM_COMMON_TABS: SubTabDef[] = [
  {
    id: 'recent-logs',
    label: 'Recent Logs',
    icon: History,
    deepPage: 'recentlogs',
    livePath: '/recent-logs',
    description: 'System audit logs, user activity tracking, and security trails',
  },
  {
    id: 'import',
    label: 'Import / Export',
    icon: Upload,
    deepPage: 'import',
    livePath: '/asset-management/import',
    description: 'Bulk data ingestion, spreadsheet imports, and backup exports',
  },
  {
    id: 'users',
    label: 'Users & Roles',
    icon: Users,
    deepPage: 'users',
    livePath: '/users',
    description: 'Access control tiers (L1-L4), staff permissions, and role titles',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    cmsSection: 'navigation',
    livePath: '/settings',
    description: 'Portal navigation layout, sidebar accordion, and structural controls',
  },
];

export default function PortalCMSEditor({ portal, initialTabId }: PortalCMSEditorProps) {
  const { config, propco, opco, refresh } = useAppCms();

  const isOpco = portal === 'opco';
  const portalConfig = isOpco ? opco : propco;

  const sectionTabs = useMemo(() => {
    return isOpco ? OPCO_SECTION_TABS : PROPCO_SECTION_TABS;
  }, [isOpco]);

  const defaultSubTab = initialTabId || sectionTabs[0].id;
  const [activeSubTab, setActiveSubTab] = useState<string>(defaultSubTab);
  const rightContentRef = React.useRef<HTMLDivElement>(null);

  // Synchronize if portal or initialTabId prop changes
  React.useEffect(() => {
    setActiveSubTab(initialTabId || sectionTabs[0].id);
  }, [portal, initialTabId, sectionTabs]);

  // When activeSubTab changes, smoothly scroll the right content area to the top
  React.useEffect(() => {
    if (rightContentRef.current) {
      rightContentRef.current.scrollTop = 0;
    }
  }, [activeSubTab]);

  // Close main sidebar when portal CMS editor is open to maximize workspace
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:collapse-sidebar', { detail: { collapsed: true } }));
    }
  }, []);

  // Find active tab definition
  const currentTab = useMemo(() => {
    const foundInSection = sectionTabs.find((t) => t.id === activeSubTab);
    if (foundInSection) return foundInSection;
    const foundInBottom = BOTTOM_COMMON_TABS.find((t) => t.id === activeSubTab);
    if (foundInBottom) return foundInBottom;
    return sectionTabs[0];
  }, [activeSubTab, sectionTabs]);

  // Find corresponding portal tab in AppCMS config if present
  const matchedCmsTab = useMemo(() => {
    return portalConfig.tabs.find(
      (t) =>
        t.id.toLowerCase() === currentTab.id.toLowerCase() ||
        t.name.toLowerCase().includes(currentTab.label.toLowerCase().slice(0, 5)) ||
        t.path.toLowerCase() === currentTab.livePath.toLowerCase()
    );
  }, [portalConfig.tabs, currentTab]);

  // Quick Tab Editing state
  const [editingTabLabel, setEditingTabLabel] = useState(false);
  const [tabLabelInput, setTabLabelInput] = useState('');

  const handleStartLabelEdit = () => {
    setTabLabelInput(matchedCmsTab?.name || currentTab.label);
    setEditingTabLabel(true);
  };

  const handleSaveTabLabel = () => {
    if (matchedCmsTab && tabLabelInput.trim()) {
      updatePortalTab(portal, matchedCmsTab.id, { name: tabLabelInput.trim() });
      toast.success(`Updated tab label to "${tabLabelInput.trim()}"`);
      refresh();
    }
    setEditingTabLabel(false);
  };

  const handleToggleTabVisibility = () => {
    if (matchedCmsTab) {
      const next = !matchedCmsTab.enabled;
      updatePortalTab(portal, matchedCmsTab.id, { enabled: next });
      toast.success(next ? `Tab "${matchedCmsTab.name}" enabled in sidebar` : `Tab "${matchedCmsTab.name}" hidden from sidebar`);
      refresh();
    }
  };

  const themeColor = isOpco ? '#60a5fa' : '#e8c97a';
  const PortalIcon = isOpco ? Shield : Building2;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0 flex-1 overflow-hidden w-full max-w-[1600px]">
      {/* ─── LEFT COLUMN: Section Tabs + Divider + Bottom 4 Tabs (Sticky Docked Sidebar) ─── */}
      <div
        className="w-full lg:w-72 flex-shrink-0 rounded-2xl border p-3 shadow-sm max-h-[35vh] lg:max-h-none lg:h-full overflow-y-auto flex flex-col"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          scrollbarWidth: 'thin',
          scrollbarColor: `${themeColor}40 transparent`,
        }}
      >
        {/* Header indicator */}
          <div className="px-2 py-1.5 mb-2 flex items-center justify-between">
            <span
              className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: themeColor }}
            >
              <PortalIcon size={13} />
              {portalConfig.title} Tabs
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/5 text-muted-foreground border border-white/10">
              {sectionTabs.length} Pages
            </span>
          </div>

          {/* Section 1 Tabs */}
          <div className="flex flex-col gap-1">
            {sectionTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveSubTab(tab.id);
                    setEditingTabLabel(false);
                  }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-left transition-all cursor-pointer group ${
                    isActive ? 'shadow-sm' : 'hover:bg-surface2 text-muted-foreground hover:text-foreground'
                  }`}
                  style={{
                    background: isActive ? `${themeColor}18` : 'transparent',
                    border: isActive ? `1px solid ${themeColor}45` : '1px solid transparent',
                    color: isActive ? themeColor : undefined,
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  <Icon
                    size={14}
                    style={{ color: isActive ? themeColor : 'var(--text2)' }}
                    className="flex-shrink-0"
                  />
                  <span className="flex-1 truncate text-xs">{tab.label}</span>
                  {tab.badge && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.2 rounded-full flex-shrink-0 text-white"
                      style={{ background: tab.badgeColor || '#f43f5e' }}
                    >
                      {tab.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight size={12} className="flex-shrink-0" style={{ color: themeColor }} />}
                </button>
              );
            })}
          </div>

          {/* ─── VISUAL DIVIDER / SEPARATOR (User request requirement) ─── */}
          <div className="my-3 pt-3 border-t border-border">
            <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal size={11} />
                System & Common Tabs
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 border border-white/10 font-bold">
                4 Tabs
              </span>
            </div>
          </div>

          {/* Section 2: Bottom 4 Tabs (Image 4) */}
          <div className="flex flex-col gap-1">
            {BOTTOM_COMMON_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveSubTab(tab.id);
                    setEditingTabLabel(false);
                  }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-left transition-all cursor-pointer group ${
                    isActive ? 'shadow-sm' : 'hover:bg-surface2 text-muted-foreground hover:text-foreground'
                  }`}
                  style={{
                    background: isActive ? 'rgba(232, 201, 122, 0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(232, 201, 122, 0.4)' : '1px solid transparent',
                    color: isActive ? '#e8c97a' : undefined,
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  <Icon
                    size={14}
                    style={{ color: isActive ? '#e8c97a' : 'var(--text2)' }}
                    className="flex-shrink-0"
                  />
                  <span className="flex-1 truncate text-xs">{tab.label}</span>
                  {isActive && <ChevronRight size={12} className="text-amber-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

      {/* ─── RIGHT COLUMN: ONLY THIS SCROLLS UP AND DOWN ─── */}
      <div
        ref={rightContentRef}
        className="flex-1 min-w-0 h-full overflow-y-auto pr-3 sm:pr-4 pb-16 flex flex-col gap-5"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: `${themeColor}40 transparent`,
        }}
      >
        {/* ─── PORTAL BRANDING BANNER ─── */}
        <div
          className="rounded-2xl border p-5 relative overflow-hidden shadow-sm flex-shrink-0"
          style={{
            background: isOpco
              ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.09) 0%, rgba(18, 19, 22, 0.96) 100%)'
              : 'linear-gradient(135deg, rgba(232, 201, 122, 0.09) 0%, rgba(18, 19, 22, 0.96) 100%)',
            borderColor: isOpco ? 'rgba(96, 165, 250, 0.3)' : 'rgba(232, 201, 122, 0.3)',
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md font-bold text-lg"
                style={{
                  background: isOpco
                    ? 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)'
                    : 'linear-gradient(135deg, #e8c97a 0%, #b89340 100%)',
                  color: '#121316',
                }}
              >
                <PortalIcon size={24} strokeWidth={2.3} />
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold font-head tracking-tight text-foreground">
                    {portalConfig.title}
                  </h1>
                  <span
                    className="px-2.5 py-0.5 rounded text-[11px] font-extrabold tracking-wider uppercase"
                    style={{
                      background: `${portalConfig.badgeColor || themeColor}25`,
                      color: portalConfig.badgeColor || themeColor,
                      border: `1px solid ${portalConfig.badgeColor || themeColor}45`,
                    }}
                  >
                    {portalConfig.badgeText || (isOpco ? 'OPERATIONS' : 'ASSET CO')}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-muted-foreground uppercase font-bold">
                    Editable CMS Pages
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {portalConfig.description ||
                    `Select any tab on the left to edit its live page layout, table headers, column visibility, and every single record.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={currentTab.livePath}
                target="_blank"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors shadow-sm"
                style={{
                  background: `${themeColor}18`,
                  borderColor: `${themeColor}45`,
                  color: themeColor,
                }}
              >
                <span>Open Live Route</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        </div>

        {/* Active Tab Top Summary & Controls Bar */}
        <div
          className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm flex-shrink-0"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${themeColor}22`,
                  color: themeColor,
                  border: `1px solid ${themeColor}40`,
                }}
              >
                <currentTab.icon size={18} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {!editingTabLabel ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-head font-bold text-sm text-foreground">
                        {matchedCmsTab?.name || currentTab.label}
                      </span>
                      {matchedCmsTab && (
                        <button
                          onClick={handleStartLabelEdit}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          title="Rename Tab Label in Sidebar"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={tabLabelInput}
                        onChange={(e) => setTabLabelInput(e.target.value)}
                        className="rounded px-2 py-0.5 text-xs border border-primary bg-surface2 text-foreground font-bold outline-none"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveTabLabel}
                        className="p-1 rounded bg-primary text-black font-bold text-xs"
                      >
                        <Check size={12} strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => setEditingTabLabel(false)}
                        className="text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground font-mono">
                    {currentTab.livePath}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {currentTab.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {matchedCmsTab && (
                <button
                  onClick={handleToggleTabVisibility}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    matchedCmsTab.enabled
                      ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                  title={matchedCmsTab.enabled ? 'Click to hide from sidebar' : 'Click to enable in sidebar'}
                >
                  {matchedCmsTab.enabled ? <Eye size={12} /> : <EyeOff size={12} />}
                  <span>{matchedCmsTab.enabled ? 'Sidebar Visible' : 'Sidebar Hidden'}</span>
                </button>
              )}

              <Link
                href={currentTab.livePath}
                target="_blank"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <span>View Live</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>

          {/* Subtabs Bar for Dropdown Tabs */}
          {((matchedCmsTab?.subtabs && matchedCmsTab.subtabs.length > 0) || (currentTab.subtabs && currentTab.subtabs.length > 0)) && (
            <div
              className="rounded-xl border p-3 flex flex-col gap-2 shadow-sm flex-shrink-0"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                <span className="flex items-center gap-1.5 text-foreground">
                  <Layers size={13} style={{ color: themeColor }} />
                  Dropdown Sub-Tabs ({(matchedCmsTab?.subtabs?.length || currentTab.subtabs?.length || 0)})
                </span>
                <span className="text-[10px] text-muted-foreground normal-case font-normal">
                  All subtabs displayed inside their respective page places
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {(matchedCmsTab?.subtabs || currentTab.subtabs || []).map((sub: any) => (
                  <Link
                    key={sub.id}
                    href={sub.path || sub.livePath}
                    target="_blank"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border/70 hover:border-primary/50 bg-surface2/60 hover:bg-surface2 transition-all group"
                  >
                    <span className="text-foreground group-hover:text-primary transition-colors font-medium">
                      {sub.label}
                    </span>
                    <ExternalLink size={10} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Active Editable Page Component */}
          <div className="min-w-0">
            {/* If deep page exists for this tab: load the full DeepPageCMSEditor */}
            {currentTab.deepPage && (
              <DeepPageCMSEditor activePage={currentTab.deepPage} hidePageGrid={true} initialPortal={portal} />
            )}

            {/* If it's one of the bottom 4 system tabs: load CompleteAppCMS for that section */}
            {!currentTab.deepPage && currentTab.cmsSection === 'recent-logs' && (
              <CompleteAppCMS activeSection="recent-logs" />
            )}

            {!currentTab.deepPage && currentTab.cmsSection === 'import' && (
              <CompleteAppCMS activeSection="import" />
            )}

            {!currentTab.deepPage && currentTab.cmsSection === 'users' && (
              <CompleteAppCMS activeSection="users" />
            )}

            {!currentTab.deepPage && currentTab.cmsSection === 'navigation' && (
              <div className="flex flex-col gap-5">
                <CompleteAppCMS activeSection={portal} />
                <div className="mt-4 pt-4 border-t border-border">
                  <CompleteAppCMS activeSection="navigation" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
