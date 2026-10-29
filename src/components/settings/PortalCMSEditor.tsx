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
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  RefreshCw,
} from 'lucide-react';
import {
  useAppCms,
  updatePortalTab,
  addTabToPortal,
  addDropdownSubtab,
  updateDropdownSubtab,
  deleteDropdownSubtab,
  reorderDropdownSubtabs,
  type AppCmsTab,
  type AppCmsSubTab,
} from '@/lib/appCmsConfig';
import DeepPageCMSEditor from '@/components/settings/DeepPageCMSEditor';
import CompleteAppCMS, { type AppCmsSectionKey, AVAILABLE_ICONS } from '@/components/settings/CompleteAppCMS';
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
    id: 'opco-dashboard',
    label: 'OpCo Dashboard',
    icon: LayoutDashboard,
    deepPage: 'overview',
    livePath: '/?portal=opco',
    description: 'Operations executive dashboard, real-time portfolio health, daily alerts, and operational tasks',
  },
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
    deepPage: 'tasks',
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
    id: 'propco-dashboard',
    label: 'PropCo Dashboard',
    icon: LayoutDashboard,
    deepPage: 'overview',
    livePath: '/?portal=propco',
    description: 'PropCo capital asset portfolio overview, property values, risk exposure, and statutory compliance',
  },
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
  const { propco, opco, refresh } = useAppCms();

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
        (currentTab.id === 'all-assets' && t.id === 'fixed-assets') ||
        (currentTab.id === 'assets' && (t.id === 'all-assets' || t.id === 'fixed-assets')) ||
        (currentTab.id === 'task-module' && (t.id === 'task-manager' || t.id === 'tasks')) ||
        (currentTab.id === 'reports' && t.id === 'maintenance-reports') ||
        t.name.toLowerCase().includes(currentTab.label.toLowerCase().slice(0, 5)) ||
        t.path.toLowerCase() === currentTab.livePath.toLowerCase()
    );
  }, [portalConfig.tabs, currentTab]);

  // Quick Tab Editing state
  const [editingTabLabel, setEditingTabLabel] = useState(false);
  const [tabLabelInput, setTabLabelInput] = useState('');
  const [editingTabPath, setEditingTabPath] = useState(false);
  const [tabPathInput, setTabPathInput] = useState('');

  // Dropdown Sub-Tabs Management State
  const [showAddSubtabForm, setShowAddSubtabForm] = useState(false);
  const [newSubtabLabel, setNewSubtabLabel] = useState('');
  const [newSubtabPath, setNewSubtabPath] = useState('');
  const [editingSubtabId, setEditingSubtabId] = useState<string | null>(null);
  const [editSubtabLabel, setEditSubtabLabel] = useState('');
  const [editSubtabPath, setEditSubtabPath] = useState('');

  // New Tab creation state for left panel
  const [showAddTabModal, setShowAddTabModal] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [newTabPathCustom, setNewTabPathCustom] = useState('');
  const [newTabDesc, setNewTabDesc] = useState('');
  const [newTabIcon, setNewTabIcon] = useState('Package');

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

  const handleStartPathEdit = () => {
    setTabPathInput(matchedCmsTab?.path || currentTab.livePath);
    setEditingTabPath(true);
  };

  const handleSaveTabPath = () => {
    if (matchedCmsTab && tabPathInput.trim()) {
      updatePortalTab(portal, matchedCmsTab.id, { path: tabPathInput.trim() });
      toast.success(`Updated tab route to "${tabPathInput.trim()}"`);
      refresh();
    }
    setEditingTabPath(false);
  };

  const handleToggleTabVisibility = () => {
    if (matchedCmsTab) {
      const next = !matchedCmsTab.enabled;
      updatePortalTab(portal, matchedCmsTab.id, { enabled: next });
      toast.success(next ? `Tab "${matchedCmsTab.name}" enabled in sidebar` : `Tab "${matchedCmsTab.name}" hidden from sidebar`);
      refresh();
    }
  };

  // Subtab handlers
  const activeSubtabs = useMemo<AppCmsSubTab[]>(() => {
    if (matchedCmsTab?.subtabs && matchedCmsTab.subtabs.length > 0) {
      return matchedCmsTab.subtabs;
    }
    if (currentTab.subtabs && currentTab.subtabs.length > 0) {
      return currentTab.subtabs.map((s) => ({
        id: s.id,
        label: s.label,
        path: s.livePath,
      }));
    }
    return [];
  }, [matchedCmsTab, currentTab]);

  const targetTabIdForSubtabs = matchedCmsTab?.id || currentTab.id;

  const handleAddSubtab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtabLabel.trim()) {
      toast.error('Please enter a sub-item label');
      return;
    }
    const cleanPath = newSubtabPath.trim() || `${currentTab.livePath}?tab=${newSubtabLabel.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const ok = addDropdownSubtab(portal, targetTabIdForSubtabs, {
      label: newSubtabLabel.trim(),
      path: cleanPath,
    });
    if (ok) {
      toast.success(`Added "${newSubtabLabel.trim()}" to ${currentTab.label} dropdown`);
      setNewSubtabLabel('');
      setNewSubtabPath('');
      setShowAddSubtabForm(false);
      refresh();
    } else {
      toast.error('Could not add sub-item');
    }
  };

  const handleStartSubtabEdit = (sub: AppCmsSubTab) => {
    setEditingSubtabId(sub.id);
    setEditSubtabLabel(sub.label);
    setEditSubtabPath(sub.path);
  };

  const handleSaveSubtabEdit = (subId: string) => {
    if (!editSubtabLabel.trim()) {
      toast.error('Label cannot be empty');
      return;
    }
    const ok = updateDropdownSubtab(portal, targetTabIdForSubtabs, subId, {
      label: editSubtabLabel.trim(),
      path: editSubtabPath.trim(),
    });
    if (ok) {
      toast.success(`Updated dropdown item "${editSubtabLabel.trim()}"`);
      setEditingSubtabId(null);
      refresh();
    } else {
      toast.error('Could not save changes');
    }
  };

  const handleDeleteSubtab = (subId: string, subLabel: string) => {
    if (confirm(`Remove "${subLabel}" from the ${currentTab.label} dropdown?`)) {
      const ok = deleteDropdownSubtab(portal, targetTabIdForSubtabs, subId);
      if (ok) {
        toast.success(`Removed "${subLabel}"`);
        refresh();
      }
    }
  };

  const handleMoveSubtab = (fromIdx: number, direction: 'up' | 'down') => {
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
    const ok = reorderDropdownSubtabs(portal, targetTabIdForSubtabs, fromIdx, toIdx);
    if (ok) {
      refresh();
    }
  };

  // Add new tab to portal
  const handleCreateNewTab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTabName.trim()) {
      toast.error('Tab name is required');
      return;
    }
    const cleanId = `tab_${newTabName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36).slice(-4)}`;
    const created = addTabToPortal(portal, {
      id: cleanId,
      name: newTabName.trim(),
      path: newTabPathCustom.trim() || `/${cleanId}`,
      description: newTabDesc.trim() || 'Custom operational section',
      group: isOpco ? 'Operations' : 'Asset Management',
      iconName: newTabIcon,
      enabled: true,
    });
    if (created) {
      toast.success(`Added tab "${created.name}" to ${portal.toUpperCase()} sidebar!`);
      setShowAddTabModal(false);
      setNewTabName('');
      setNewTabPathCustom('');
      setNewTabDesc('');
      refresh();
    }
  };

  const themeColor = isOpco ? '#60a5fa' : '#e8c97a';
  const PortalIcon = isOpco ? Shield : Building2;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0 flex-1 overflow-hidden w-full max-w-[1600px]">
      {/* ─── LEFT COLUMN: Section Tabs + Divider + Bottom 4 Tabs (Sticky Docked Sidebar) ─── */}
      <div
        className="w-full lg:w-72 flex-shrink-0 rounded-2xl border p-3 shadow-sm max-h-[35vh] lg:max-h-none lg:h-full overflow-y-auto flex flex-col justify-between"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          scrollbarWidth: 'thin',
          scrollbarColor: `${themeColor}40 transparent`,
        }}
      >
        <div>
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

          {/* Section Tabs */}
          <div className="flex flex-col gap-1">
            {sectionTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              const matchingCms = portalConfig.tabs.find(
                (t) =>
                  t.id === tab.id ||
                  (tab.id === 'all-assets' && t.id === 'fixed-assets') ||
                  (tab.id === 'task-module' && (t.id === 'task-manager' || t.id === 'tasks'))
              );
              const hasSubtabs = (matchingCms?.subtabs && matchingCms.subtabs.length > 0) || (tab.subtabs && tab.subtabs.length > 0);
              const subCount = matchingCms?.subtabs?.length || tab.subtabs?.length || 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveSubTab(tab.id);
                    setEditingTabLabel(false);
                    setEditingTabPath(false);
                    setShowAddSubtabForm(false);
                    setEditingSubtabId(null);
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
                  <span className="flex-1 truncate text-xs">{matchingCms?.name || tab.label}</span>
                  {hasSubtabs && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/5 text-muted-foreground border border-white/10 flex-shrink-0"
                      title={`${subCount} dropdown sub-items`}
                    >
                      {subCount} sub
                    </span>
                  )}
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

          {/* Divider to Bottom Tabs */}
          <div className="my-3 px-2 pt-2 border-t border-border flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <SlidersHorizontal size={11} />
              System & Common Tabs
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/5 text-muted-foreground">
              4 Tabs
            </span>
          </div>

          {/* Bottom Common Tabs */}
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
                    setEditingTabPath(false);
                    setShowAddSubtabForm(false);
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
                  {isActive && <ChevronRight size={12} className="flex-shrink-0" style={{ color: themeColor }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add Tab Button at bottom of sidebar list */}
        <div className="pt-3 border-t border-border mt-3">
          <button
            onClick={() => setShowAddTabModal(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            style={{ background: 'var(--surface2)' }}
          >
            <Plus size={13} style={{ color: themeColor }} />
            <span>Add Tab to {portalConfig.title}</span>
          </button>
        </div>
      </div>

      {/* ─── RIGHT CONTENT: Active Sub-Tab Layout / CMS Data View ─── */}
      <div
        ref={rightContentRef}
        className="flex-1 flex flex-col gap-5 overflow-y-auto pr-1 min-w-0"
        style={{ scrollbarWidth: 'thin' }}
      >
        {/* Section Context Header Banner */}
        <div
          className="rounded-2xl border p-4 sm:p-5 relative overflow-hidden shadow-sm flex-shrink-0"
          style={{
            background: isOpco
              ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(18, 19, 22, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(232, 201, 122, 0.08) 0%, rgba(18, 19, 22, 0.95) 100%)',
            borderColor: isOpco ? 'rgba(96, 165, 250, 0.25)' : 'rgba(232, 201, 122, 0.25)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                style={{
                  background: isOpco
                    ? 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)'
                    : 'linear-gradient(135deg, #e8c97a 0%, #b89340 100%)',
                  color: '#121316',
                }}
              >
                <PortalIcon size={22} strokeWidth={2.3} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold font-head tracking-tight text-foreground uppercase">
                    {portalConfig.title}
                  </h2>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
                    style={{
                      background: `${themeColor}22`,
                      color: themeColor,
                      border: `1px solid ${themeColor}40`,
                    }}
                  >
                    {portalConfig.badgeText}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-muted-foreground uppercase">
                    Editable CMS Pages & Dropdowns
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {portalConfig.description ||
                    `Select any tab on the left to edit its live page layout, table headers, column visibility, and every single record.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
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
                {/* Tab Label: editable */}
                {!editingTabLabel ? (
                  <div className="flex items-center gap-1.5">
                    <span className="font-head font-bold text-sm text-foreground">
                      {matchedCmsTab?.name || currentTab.label}
                    </span>
                    {matchedCmsTab && (
                      <button
                        onClick={handleStartLabelEdit}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
                      className="p-1 rounded bg-primary text-black font-bold text-xs cursor-pointer"
                    >
                      <Check size={12} strokeWidth={3} />
                    </button>
                    <button
                      onClick={() => setEditingTabLabel(false)}
                      className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Route URL / Path: editable */}
                {!editingTabPath ? (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground font-mono">
                      {matchedCmsTab?.path || currentTab.livePath}
                    </span>
                    {matchedCmsTab && (
                      <button
                        onClick={handleStartPathEdit}
                        className="p-0.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                        title="Edit Route URL"
                      >
                        <Edit2 size={10} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={tabPathInput}
                      onChange={(e) => setTabPathInput(e.target.value)}
                      className="rounded px-2 py-0.5 text-xs font-mono border border-primary bg-surface2 text-foreground outline-none"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveTabPath}
                      className="p-1 rounded bg-primary text-black font-bold text-xs cursor-pointer"
                    >
                      <Check size={12} strokeWidth={3} />
                    </button>
                    <button
                      onClick={() => setEditingTabPath(false)}
                      className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {matchedCmsTab?.description || currentTab.description}
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
              href={matchedCmsTab?.path || currentTab.livePath}
              target="_blank"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <span>View Live</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>

        {/* ─── DEDICATED SIDEBAR DROPDOWN & SUB-TABS MANAGER ─── */}
        <div
          className="rounded-xl border p-4 flex flex-col gap-3 shadow-sm flex-shrink-0"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between pb-2 border-b border-border flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Layers size={15} style={{ color: themeColor }} />
              <div>
                <span className="font-head font-bold text-xs uppercase tracking-wider text-foreground">
                  Sidebar Dropdown Sub-Items ({activeSubtabs.length})
                </span>
                <p className="text-[11px] text-muted-foreground">
                  These items appear directly inside the {currentTab.label} dropdown in the application sidebar.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowAddSubtabForm(!showAddSubtabForm);
                setNewSubtabPath(`${currentTab.livePath}?tab=new-filter`);
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              style={{ background: 'var(--primary)', color: '#121316' }}
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>Add Dropdown Item</span>
            </button>
          </div>

          {/* Inline Form to Add a New Subtab */}
          {showAddSubtabForm && (
            <form
              onSubmit={handleAddSubtab}
              className="p-3 rounded-lg border border-primary/40 bg-black/25 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Plus size={12} /> New Dropdown Sub-Item for {currentTab.label}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddSubtabForm(false)}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  <X size={13} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Display Title * (e.g., &quot;Statutory Inspections&quot;, &quot;Annual Renewals&quot;)
                  </label>
                  <input
                    type="text"
                    value={newSubtabLabel}
                    onChange={(e) => {
                      setNewSubtabLabel(e.target.value);
                      if (!newSubtabPath || newSubtabPath.includes('?tab=')) {
                        const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-');
                        setNewSubtabPath(`${currentTab.livePath}?tab=${slug}`);
                      }
                    }}
                    placeholder="Enter item title..."
                    className="px-3 py-1.5 rounded-lg border border-border text-xs outline-none focus:border-primary text-foreground"
                    style={{ background: 'var(--surface2)' }}
                    autoFocus
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Route URL / Filter Query * (e.g., &quot;{currentTab.livePath}?tab=certifications&quot;)
                  </label>
                  <input
                    type="text"
                    value={newSubtabPath}
                    onChange={(e) => setNewSubtabPath(e.target.value)}
                    placeholder={`${currentTab.livePath}?filter=...`}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs font-mono outline-none focus:border-primary text-foreground"
                    style={{ background: 'var(--surface2)' }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddSubtabForm(false)}
                  className="px-3 py-1 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-transform active:scale-95 cursor-pointer"
                  style={{ background: 'var(--primary)', color: '#121316' }}
                >
                  <Check size={12} strokeWidth={3} />
                  <span>Save to Dropdown</span>
                </button>
              </div>
            </form>
          )}

          {/* List of Sub-Items */}
          {activeSubtabs.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {activeSubtabs.map((sub, idx) => {
                const isEditingThis = editingSubtabId === sub.id;

                return (
                  <div
                    key={sub.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg border border-border/70 hover:border-border transition-all gap-2"
                    style={{ background: 'var(--surface2)' }}
                  >
                    {!isEditingThis ? (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-muted-foreground flex-shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-xs text-foreground truncate">
                            {sub.label}
                          </span>
                          <span className="text-[10px] font-mono text-primary/80 truncate">
                            {sub.path}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* Reorder Up / Down */}
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMoveSubtab(idx, 'up')}
                            className="p-1 rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp size={11} />
                          </button>
                          <button
                            disabled={idx === activeSubtabs.length - 1}
                            onClick={() => handleMoveSubtab(idx, 'down')}
                            className="p-1 rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown size={11} />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleStartSubtabEdit(sub)}
                            className="p-1 rounded border border-border text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            title="Edit Title & URL"
                          >
                            <Edit2 size={11} />
                          </button>

                          {/* Open Live Route */}
                          <Link
                            href={sub.path}
                            target="_blank"
                            className="p-1 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
                            title="Open in new tab"
                          >
                            <ExternalLink size={11} />
                          </Link>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteSubtab(sub.id, sub.label)}
                            className="p-1 rounded border border-border text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Sub-Item"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Inline Edit Form for this Subtab */
                      <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                        <input
                          type="text"
                          value={editSubtabLabel}
                          onChange={(e) => setEditSubtabLabel(e.target.value)}
                          className="px-2.5 py-1 rounded border border-primary text-xs text-foreground bg-black/40 outline-none flex-1 font-semibold"
                          placeholder="Title"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={editSubtabPath}
                          onChange={(e) => setEditSubtabPath(e.target.value)}
                          className="px-2.5 py-1 rounded border border-border text-xs font-mono text-primary bg-black/40 outline-none flex-1"
                          placeholder="Route / Query"
                        />
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleSaveSubtabEdit(sub.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-transform active:scale-95 cursor-pointer"
                            style={{ background: 'var(--primary)', color: '#121316' }}
                          >
                            <Check size={11} strokeWidth={3} />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={() => setEditingSubtabId(null)}
                            className="px-2 py-1 rounded border border-border text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-dashed border-border/80 flex flex-col items-center justify-center gap-2 text-center">
              <span className="text-xs text-muted-foreground">
                This tab does not currently have sub-dropdown options. It renders as a single link in the sidebar.
              </span>
              <button
                onClick={() => {
                  setShowAddSubtabForm(true);
                  setNewSubtabPath(`${currentTab.livePath}?tab=overview`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-primary/40 text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <Plus size={12} />
                <span>Convert to Sidebar Dropdown (Add First Sub-Item)</span>
              </button>
            </div>
          )}
        </div>

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

      {/* ─── ADD NEW TAB MODAL (Left Panel) ─── */}
      {showAddTabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md rounded-2xl border p-5 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Plus size={16} style={{ color: themeColor }} />
                <h3 className="font-head font-bold text-sm text-foreground">
                  Add New Tab to {portalConfig.title}
                </h3>
              </div>
              <button
                onClick={() => setShowAddTabModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateNewTab} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground">Tab Display Name *</label>
                <input
                  type="text"
                  value={newTabName}
                  onChange={(e) => {
                    setNewTabName(e.target.value);
                    if (!newTabPathCustom) {
                      setNewTabPathCustom(`/${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
                    }
                  }}
                  placeholder="e.g. Health & Safety Register"
                  className="px-3 py-2 rounded-lg border border-border text-xs text-foreground bg-surface2 outline-none focus:border-primary"
                  required
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground">Route URL / Path *</label>
                <input
                  type="text"
                  value={newTabPathCustom}
                  onChange={(e) => setNewTabPathCustom(e.target.value)}
                  placeholder="/health-and-safety"
                  className="px-3 py-2 rounded-lg border border-border text-xs font-mono text-foreground bg-surface2 outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground">Description / Subtitle</label>
                <input
                  type="text"
                  value={newTabDesc}
                  onChange={(e) => setNewTabDesc(e.target.value)}
                  placeholder="Short description of this operational section"
                  className="px-3 py-2 rounded-lg border border-border text-xs text-foreground bg-surface2 outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground">Icon</label>
                <select
                  value={newTabIcon}
                  onChange={(e) => setNewTabIcon(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border text-xs text-foreground bg-surface2 outline-none cursor-pointer"
                >
                  {AVAILABLE_ICONS.map((ico) => (
                    <option key={ico.name} value={ico.name}>
                      {ico.name} ({ico.label})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTabModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-transform active:scale-95 cursor-pointer"
                  style={{ background: 'var(--primary)', color: '#121316' }}
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>Create Tab</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
