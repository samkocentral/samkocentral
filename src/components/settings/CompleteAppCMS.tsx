'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Building2,
  Shield,
  History,
  Upload,
  Users,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Copy,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff,
  Palette,
  Sparkles,
  Layers,
  Tag,
  CheckSquare,
  Wrench,
  ShieldCheck,
  ScrollText,
  Zap,
  FolderOpen,
  BarChart3,
  Calendar,
  FileCheck,
  Package,
  SlidersHorizontal,
} from 'lucide-react';
import {
  useAppCms,
  updatePortalSection,
  addTabToPortal,
  updatePortalTab,
  deletePortalTab,
  reorderPortalTabs,
  copyTabAcrossPortals,
  updateDashboardConfig,
  updateRecentLogsConfig,
  updateImportExportConfig,
  updateRoleConfig,
  updateNavigationItem,
  resetAppCmsConfig,
  type AppCmsTab,
  type AppCmsKpiCard,
} from '@/lib/appCmsConfig';
import { toast } from 'sonner';

export type AppCmsSectionKey =
  | 'dashboard'
  | 'propco'
  | 'opco'
  | 'recent-logs'
  | 'import'
  | 'users'
  | 'navigation';

interface Props {
  activeSection: AppCmsSectionKey;
  onSelectSection?: (section: AppCmsSectionKey) => void;
}

const COLOR_OPTIONS = [
  { label: 'Gold / Amber', value: '#e8c97a' },
  { label: 'Sky Blue', value: '#60a5fa' },
  { label: 'Emerald Green', value: '#3dd68c' },
  { label: 'Rose / Red', value: '#f43f5e' },
  { label: 'Purple / Violet', value: '#a78bfa' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Teal', value: '#2dd4bf' },
  { label: 'Slate', value: '#94a3b8' },
];

export const AVAILABLE_ICONS = [
  { name: 'Package', label: 'Assets & Machinery' },
  { name: 'Building2', label: 'Properties & Hotel Sites' },
  { name: 'ShieldCheck', label: 'Compliance & Safety' },
  { name: 'Tag', label: 'Categories & Taxonomy' },
  { name: 'Calendar', label: 'Tracker & Schedules' },
  { name: 'FileCheck', label: 'Insurance & Policies' },
  { name: 'ScrollText', label: 'Contracts & Vendors' },
  { name: 'Zap', label: 'Utilities & Energy' },
  { name: 'FolderOpen', label: 'Document Repository' },
  { name: 'Wrench', label: 'Maintenance & PPM' },
  { name: 'BarChart3', label: 'Reports & Audits' },
  { name: 'Layers', label: 'Tasks & Operations' },
  { name: 'Shield', label: 'Security & Access' },
  { name: 'SlidersHorizontal', label: 'Controls & System' },
];

export function resolvePageIdFromTab(tab: { id: string; path: string }): string {
  const p = (tab.path || '').toLowerCase();
  const id = (tab.id || '').toLowerCase();
  if (id.includes('dashboard') || p === '/' || p.includes('portal=')) return 'overview';
  if (id.includes('proper') || id.includes('hotel') || p.includes('/properties') || p.includes('/hotels')) return 'properties';
  if (id.includes('asset') || p.includes('/assets')) return 'assets';
  if (id.includes('categor') || p.includes('/categories')) return 'categories';
  if (id.includes('compliance') || p.includes('/compliance')) return 'compliance';
  if (id.includes('contract') || p.includes('/contracts')) return 'contracts';
  if (id.includes('insur') || p.includes('/insurance')) return 'insurance';
  if (id.includes('util') || p.includes('/utilities')) return 'utilities';
  if (id.includes('maint') || p.includes('/maintenance')) return 'maintenance';
  if (id.includes('task') || p.includes('/task')) return 'tasks';
  if (id.includes('doc') || p.includes('/document')) return 'documents';
  if (id.includes('report') || p.includes('/report')) return 'reports';
  if (id.includes('inspect') || p.includes('/inspection')) return 'inspections';
  return 'properties';
}

export default function CompleteAppCMS({ activeSection, onSelectSection }: Props) {
  const { config, propco, opco, dashboard, recentLogs, importExport, roles, navigationItems, refresh } =
    useAppCms();

  // Tab editing state - all fields editable
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [tabEditForm, setTabEditForm] = useState<{
    name: string;
    description: string;
    path: string;
    section: 'propco' | 'opco' | 'both';
    group: string;
    iconName: string;
    enabled: boolean;
  }>({
    name: '',
    description: '',
    path: '',
    section: 'propco',
    group: 'Asset Management',
    iconName: 'Package',
    enabled: true,
  });

  // Add tab modal
  const [showAddTabModal, setShowAddTabModal] = useState(false);
  const [targetPortal, setTargetPortal] = useState<'propco' | 'opco'>('propco');
  const [newTabForm, setNewTabForm] = useState<{
    name: string;
    path: string;
    description: string;
    group: string;
    iconName: string;
  }>({
    name: '',
    path: '',
    description: '',
    group: 'Asset Management',
    iconName: 'Package',
  });

  // Section Header Editing
  const [editingHeader, setEditingHeader] = useState<boolean>(false);
  const [headerForm, setHeaderForm] = useState<{
    title: string;
    badgeText: string;
    badgeColor: string;
    description: string;
  }>({
    title: '',
    badgeText: '',
    badgeColor: '',
    description: '',
  });

  // ─── PORTAL (PROPCO / OPCO) EDITING HANDLERS ─────────────────────────────────

  const handleStartHeaderEdit = (portal: typeof propco) => {
    setHeaderForm({
      title: portal.title,
      badgeText: portal.badgeText,
      badgeColor: portal.badgeColor,
      description: portal.description,
    });
    setEditingHeader(true);
  };

  const handleSaveHeader = (portalId: 'propco' | 'opco') => {
    if (!headerForm.title.trim()) {
      toast.error('Title cannot be empty');
      return;
    }
    updatePortalSection(portalId, {
      title: headerForm.title.trim(),
      badgeText: headerForm.badgeText.trim(),
      badgeColor: headerForm.badgeColor,
      description: headerForm.description.trim(),
    });
    setEditingHeader(false);
    toast.success(`Updated ${headerForm.title} section header!`);
    refresh();
  };

  const handleStartTabEdit = (tab: AppCmsTab) => {
    setEditingTabId(tab.id);
    const validSection = tab.section === 'bottom' ? 'propco' : tab.section || 'propco';
    setTabEditForm({
      name: tab.name,
      description: tab.description,
      path: tab.path,
      section: validSection,
      group: tab.group || 'Asset Management',
      iconName: tab.iconName || 'Package',
      enabled: tab.enabled !== false,
    });
  };

  const handleSaveTabEdit = (portalId: 'propco' | 'opco', tabId: string) => {
    if (!tabEditForm.name.trim()) {
      toast.error('Tab name cannot be empty');
      return;
    }
    updatePortalTab(portalId, tabId, {
      name: tabEditForm.name.trim(),
      description: tabEditForm.description.trim(),
      path: tabEditForm.path.trim(),
      section: tabEditForm.section,
      group: tabEditForm.group,
      iconName: tabEditForm.iconName,
      enabled: tabEditForm.enabled,
    });
    setEditingTabId(null);
    toast.success('Tab updated successfully!');
    refresh();
  };

  const handleToggleTab = (portalId: 'propco' | 'opco', tabId: string, current: boolean) => {
    updatePortalTab(portalId, tabId, { enabled: !current });
    toast.success(current ? 'Tab hidden from sidebar' : 'Tab enabled in sidebar');
    refresh();
  };

  const handleMoveTab = (
    portalId: 'propco' | 'opco',
    fromIdx: number,
    direction: 'up' | 'down'
  ) => {
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
    reorderPortalTabs(portalId, fromIdx, toIdx);
    refresh();
  };

  const handleCopyTab = (
    fromPortal: 'propco' | 'opco',
    toPortal: 'propco' | 'opco',
    tabId: string,
    tabName: string
  ) => {
    const success = copyTabAcrossPortals(fromPortal, toPortal, tabId);
    if (success) {
      toast.success(`Copied "${tabName}" to ${toPortal.toUpperCase()}!`);
      refresh();
    } else {
      toast.error(`Tab already exists in ${toPortal.toUpperCase()}`);
    }
  };

  const handleDeleteTab = (portalId: 'propco' | 'opco', tabId: string, tabName: string) => {
    if (confirm(`Are you sure you want to remove the tab "${tabName}" from ${portalId.toUpperCase()}?`)) {
      deletePortalTab(portalId, tabId);
      toast.success(`Removed "${tabName}"`);
      refresh();
    }
  };

  const handleCreateNewTab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTabForm.name.trim()) {
      toast.error('Tab name is required');
      return;
    }
    const cleanId = `custom_${newTabForm.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36).slice(-4)}`;
    const created = addTabToPortal(targetPortal, {
      id: cleanId,
      name: newTabForm.name.trim(),
      path: newTabForm.path.trim() || `/${cleanId}`,
      description: newTabForm.description.trim() || 'Custom operational module',
      group: newTabForm.group,
      iconName: newTabForm.iconName,
      enabled: true,
    });

    if (created) {
      toast.success(`Added new tab "${created.name}" to ${targetPortal.toUpperCase()}`);
      setShowAddTabModal(false);
      setNewTabForm({
        name: '',
        path: '',
        description: '',
        group: 'Asset Management',
        iconName: 'Package',
      });
      refresh();
    }
  };

  // ─── DASHBOARD EDITING ────────────────────────────────────────────────────────

  const [dashTitle, setDashTitle] = useState(dashboard.pageTitle);
  const [dashSub, setDashSub] = useState(dashboard.pageSubtitle);
  const [dashGreeting, setDashGreeting] = useState(dashboard.welcomeGreeting);

  const handleSaveDashboard = () => {
    updateDashboardConfig({
      pageTitle: dashTitle.trim(),
      pageSubtitle: dashSub.trim(),
      welcomeGreeting: dashGreeting.trim(),
    });
    toast.success('Dashboard settings saved!');
    refresh();
  };

  const handleToggleKpi = (kpiId: string, current: boolean) => {
    const updated = dashboard.kpis.map((k) =>
      k.id === kpiId ? { ...k, enabled: !current } : k
    );
    updateDashboardConfig({ kpis: updated });
    refresh();
  };

  const handleUpdateKpi = (kpiId: string, updates: Partial<AppCmsKpiCard>) => {
    const updated = dashboard.kpis.map((k) =>
      k.id === kpiId ? { ...k, ...updates } : k
    );
    updateDashboardConfig({ kpis: updated });
    refresh();
  };

  // ─── RESET ALL ────────────────────────────────────────────────────────────────

  const handleReset = () => {
    if (confirm('Reset entire application structure and CMS back to factory defaults?')) {
      resetAppCmsConfig();
      toast.success('Application CMS reset to factory defaults');
      refresh();
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl pb-24 w-full">
      {/* CMS Top Header */}
      <div
        className="rounded-2xl border p-6 relative overflow-hidden shadow-sm"
        style={{
          background: 'linear-gradient(135deg, rgba(232, 201, 122, 0.08) 0%, rgba(18, 19, 22, 0.95) 100%)',
          borderColor: 'rgba(232, 201, 122, 0.25)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
              style={{
                background: 'linear-gradient(135deg, #e8c97a 0%, #b89340 100%)',
                color: '#121316',
              }}
            >
              {activeSection === 'dashboard' && <LayoutDashboard size={24} strokeWidth={2.3} />}
              {activeSection === 'propco' && <Building2 size={24} strokeWidth={2.3} />}
              {activeSection === 'opco' && <Shield size={24} strokeWidth={2.3} />}
              {activeSection === 'recent-logs' && <History size={24} strokeWidth={2.3} />}
              {activeSection === 'import' && <Upload size={24} strokeWidth={2.3} />}
              {activeSection === 'users' && <Users size={24} strokeWidth={2.3} />}
              {activeSection === 'navigation' && <SlidersHorizontal size={24} strokeWidth={2.3} />}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold font-head tracking-tight text-foreground capitalize">
                  {activeSection === 'propco' && `${propco.title} (${propco.badgeText}) CMS`}
                  {activeSection === 'opco' && `${opco.title} (${opco.badgeText}) CMS`}
                  {activeSection === 'dashboard' && 'Dashboard Overview CMS'}
                  {activeSection === 'recent-logs' && 'Recent Logs & Audit CMS'}
                  {activeSection === 'import' && 'Import & Export Hub CMS'}
                  {activeSection === 'users' && 'Users & Roles CMS'}
                  {activeSection === 'navigation' && 'Complete App Navigation CMS'}
                </h2>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase"
                  style={{
                    background: 'rgba(232, 201, 122, 0.15)',
                    color: 'var(--primary)',
                    border: '1px solid rgba(232, 201, 122, 0.3)',
                  }}
                >
                  Super Admin L1
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                Edit everything in this section: titles, badges, colors, tabs, URLs, icons, descriptions,
                and add new tabs with dynamic routing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(activeSection === 'propco' || activeSection === 'opco') && (
              <button
                onClick={() => {
                  setTargetPortal(activeSection);
                  setShowAddTabModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                style={{ background: 'var(--primary)', color: '#121316' }}
              >
                <Plus size={14} strokeWidth={2.5} />
                Add New Tab to {activeSection.toUpperCase()}
              </button>
            )}

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border transition-colors hover:bg-white/[0.04] text-muted-foreground hover:text-foreground cursor-pointer"
              title="Reset to Factory Defaults"
            >
              <RefreshCw size={12} />
              Reset All
            </button>
          </div>
        </div>
      </div>

      {/* ─── 1. PROPCO & OPCO SECTION CMS ─── */}
      {(activeSection === 'propco' || activeSection === 'opco') && (() => {
        const portal = activeSection === 'propco' ? propco : opco;

        return (
          <div className="flex flex-col gap-5">
            {/* Portal Header Customizer Card */}
            <div
              className="rounded-xl border p-5 flex flex-col gap-4 shadow-sm"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
                    style={{ background: `${portal.badgeColor}25`, color: portal.badgeColor }}
                  >
                    {portal.id === 'propco' ? <Building2 size={16} /> : <Shield size={16} />}
                  </div>
                  <div>
                    <span className="font-head font-bold text-sm text-foreground">
                      Sidebar Header Styling & Branding
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Controls how this accordion section is displayed in the main application sidebar
                    </p>
                  </div>
                </div>

                {!editingHeader ? (
                  <button
                    onClick={() => handleStartHeaderEdit(portal)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:border-primary/50 text-foreground transition-colors cursor-pointer"
                  >
                    <Edit2 size={12} /> Edit Section Title & Badges
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveHeader(portal.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-transform active:scale-95 cursor-pointer"
                      style={{ background: 'var(--primary)', color: '#121316' }}
                    >
                      <Check size={12} strokeWidth={3} /> Save Header
                    </button>
                    <button
                      onClick={() => setEditingHeader(false)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Editable or Display View */}
              {editingHeader ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Section Title</label>
                    <input
                      type="text"
                      value={headerForm.title}
                      onChange={(e) => setHeaderForm({ ...headerForm, title: e.target.value })}
                      className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                      style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Subtitle Badge Text</label>
                    <input
                      type="text"
                      value={headerForm.badgeText}
                      onChange={(e) => setHeaderForm({ ...headerForm, badgeText: e.target.value })}
                      className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                      style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Badge Theme Color</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={headerForm.badgeColor}
                        onChange={(e) => setHeaderForm({ ...headerForm, badgeColor: e.target.value })}
                        className="rounded-lg border border-border px-3 py-2 text-xs outline-none flex-1"
                        style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                      >
                        {COLOR_OPTIONS.map((col) => (
                          <option key={col.value} value={col.value}>
                            {col.label}
                          </option>
                        ))}
                      </select>
                      <div
                        className="w-7 h-7 rounded-lg border border-white/20 flex-shrink-0"
                        style={{ background: headerForm.badgeColor }}
                      />
                    </div>
                  </div>
                  <div className="col-span-1 md:col-span-3 flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Section Description</label>
                    <input
                      type="text"
                      value={headerForm.description}
                      onChange={(e) => setHeaderForm({ ...headerForm, description: e.target.value })}
                      className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                      style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-black/20">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="font-head font-bold text-sm tracking-wider uppercase"
                      style={{ color: portal.badgeColor }}
                    >
                      {portal.title}
                    </span>
                    <span
                      className="text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wider uppercase"
                      style={{
                        background: `${portal.badgeColor}25`,
                        color: portal.badgeColor,
                        border: `1px solid ${portal.badgeColor}40`,
                      }}
                    >
                      {portal.badgeText}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
                      {portal.description}
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-white/5 border border-white/10 text-muted-foreground">
                    {portal.tabs.length} Tabs Configured
                  </span>
                </div>
              )}
            </div>

            {/* Tabs List */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers size={13} /> {portal.title} Tabs ({portal.tabs.length})
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Drag / reorder, rename, or copy to both sections
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {portal.tabs.map((tab, idx) => {
                  const isEditing = editingTabId === tab.id;

                  return (
                    <div
                      key={tab.id}
                      className={`rounded-xl border transition-all ${
                        tab.enabled ? 'border-border' : 'border-border/50 opacity-60'
                      }`}
                      style={{ background: 'var(--surface)' }}
                    >
                      {!isEditing ? (
                        <div className="p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Order badge */}
                            <span className="w-6 h-6 rounded-md bg-white/10 text-[11px] font-bold flex items-center justify-center text-muted-foreground flex-shrink-0">
                              #{idx + 1}
                            </span>

                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-head font-bold text-sm text-foreground">
                                  {tab.name}
                                </span>
                                <span className="text-[11px] text-primary/80 font-mono">
                                  {tab.path}
                                </span>
                                {tab.isCustom && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    Custom Tab
                                  </span>
                                )}
                                {tab.section === 'both' && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                    In Both (PropCo & OpCo)
                                  </span>
                                )}
                                {!tab.enabled && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                    Hidden
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {tab.description}
                              </p>
                            </div>
                          </div>

                          {/* Right action buttons */}
                          <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                            {/* Reorder Up/Down */}
                            <button
                              disabled={idx === 0}
                              onClick={() => handleMoveTab(portal.id, idx, 'up')}
                              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              disabled={idx === portal.tabs.length - 1}
                              onClick={() => handleMoveTab(portal.id, idx, 'down')}
                              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown size={12} />
                            </button>

                            {/* Copy to other portal */}
                            <button
                              onClick={() =>
                                handleCopyTab(
                                  portal.id,
                                  portal.id === 'propco' ? 'opco' : 'propco',
                                  tab.id,
                                  tab.name
                                )
                              }
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                              title={`Copy this tab to ${portal.id === 'propco' ? 'OPCO' : 'PROPCO'}`}
                            >
                              <Copy size={11} />
                              <span>Copy to {portal.id === 'propco' ? 'OpCo' : 'PropCo'}</span>
                            </button>

                            {/* Direct Deep Page CMS Button */}
                            <Link
                              href={`/settings?tab=cms-pages&page=${resolvePageIdFromTab(tab)}`}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-amber-500/30 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                              title="Edit this tab's page content, titles, buttons & columns"
                            >
                              <Sparkles size={11} />
                              <span>Page CMS</span>
                            </Link>

                            {/* Toggle visibility */}
                            <button
                              onClick={() => handleToggleTab(portal.id, tab.id, tab.enabled)}
                              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                              title={tab.enabled ? 'Hide tab from sidebar' : 'Show tab in sidebar'}
                            >
                              {tab.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                            </button>

                            {/* Edit Tab */}
                            <button
                              onClick={() => handleStartTabEdit(tab)}
                              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary cursor-pointer"
                              title="Edit All Details of this Tab"
                            >
                              <Edit2 size={13} />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteTab(portal.id, tab.id, tab.name)}
                              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                              title="Delete / Remove Tab"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Expanded Dedicated Full-Width Tab Editor */
                        <div
                          className="p-5 rounded-xl border-2 flex flex-col gap-4 shadow-lg animate-in fade-in duration-150"
                          style={{
                            background: 'rgba(232, 201, 122, 0.04)',
                            borderColor: 'rgba(232, 201, 122, 0.5)',
                          }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-md bg-amber-400/20 text-amber-300 text-xs font-bold flex items-center justify-center">
                                #{idx + 1}
                              </span>
                              <div>
                                <span className="font-head font-bold text-sm text-foreground">
                                  Editing Tab: <span className="text-primary">{tab.name}</span>
                                </span>
                                <p className="text-[11px] text-muted-foreground">
                                  Configure route, placement, and visual settings for this tab
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                href={`/settings?tab=cms-pages&page=${resolvePageIdFromTab(tab)}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-500/40 text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 transition-colors"
                              >
                                <Sparkles size={12} />
                                <span>Edit Page Columns & Data</span>
                              </Link>
                              <button
                                onClick={() => handleSaveTabEdit(portal.id, tab.id)}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-transform active:scale-95 cursor-pointer"
                                style={{ background: 'var(--primary)', color: '#121316' }}
                              >
                                <Check size={13} strokeWidth={3} /> Save Tab
                              </button>
                              <button
                                onClick={() => setEditingTabId(null)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Tab Display Name */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-foreground">
                                Tab Display Name *
                              </label>
                              <input
                                type="text"
                                value={tabEditForm.name}
                                onChange={(e) =>
                                  setTabEditForm({ ...tabEditForm, name: e.target.value })
                                }
                                className="px-3 py-2 rounded-lg border border-border outline-none text-xs text-foreground focus:border-primary font-medium"
                                style={{ background: 'var(--surface2)' }}
                                placeholder="Tab Display Name"
                              />
                            </div>

                            {/* Route Path */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-foreground">
                                Route URL / Path *
                              </label>
                              <input
                                type="text"
                                value={tabEditForm.path}
                                onChange={(e) =>
                                  setTabEditForm({ ...tabEditForm, path: e.target.value })
                                }
                                className="px-3 py-2 rounded-lg border border-border outline-none text-xs font-mono text-foreground focus:border-primary"
                                style={{ background: 'var(--surface2)' }}
                                placeholder="/asset-management/..."
                              />
                            </div>

                            {/* Portal Placement */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-foreground">
                                Portal Placement
                              </label>
                              <select
                                value={tabEditForm.section}
                                onChange={(e) =>
                                  setTabEditForm({ ...tabEditForm, section: e.target.value as any })
                                }
                                className="px-3 py-2 rounded-lg border border-border outline-none text-xs text-foreground cursor-pointer"
                                style={{ background: 'var(--surface2)' }}
                              >
                                <option value="propco">PROPCO (Asset Co)</option>
                                <option value="opco">OPCO (Operations)</option>
                                <option value="both">Both (PropCo & OpCo)</option>
                              </select>
                            </div>

                            {/* Description */}
                            <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-foreground">
                                Tab Subtitle / Description
                              </label>
                              <input
                                type="text"
                                value={tabEditForm.description}
                                onChange={(e) =>
                                  setTabEditForm({ ...tabEditForm, description: e.target.value })
                                }
                                className="px-3 py-2 rounded-lg border border-border outline-none text-xs text-foreground focus:border-primary"
                                style={{ background: 'var(--surface2)' }}
                                placeholder="Module description shown below the tab name..."
                              />
                            </div>

                            {/* Icon Selection */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-foreground">
                                Tab Icon
                              </label>
                              <select
                                value={tabEditForm.iconName}
                                onChange={(e) =>
                                  setTabEditForm({ ...tabEditForm, iconName: e.target.value })
                                }
                                className="px-3 py-2 rounded-lg border border-border outline-none text-xs text-foreground cursor-pointer"
                                style={{ background: 'var(--surface2)' }}
                              >
                                {AVAILABLE_ICONS.map((ico) => (
                                  <option key={ico.name} value={ico.name}>
                                    {ico.name} ({ico.label})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── 2. DASHBOARD CMS ─── */}
      {activeSection === 'dashboard' && (
        <div className="flex flex-col gap-5">
          <div
            className="rounded-xl border p-5 flex flex-col gap-4 shadow-sm"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="font-head font-bold text-sm text-foreground">
                Dashboard Headings & Greetings
              </span>
              <button
                onClick={handleSaveDashboard}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-transform active:scale-95 cursor-pointer"
                style={{ background: 'var(--primary)', color: '#121316' }}
              >
                <Check size={13} strokeWidth={3} /> Save Dashboard Text
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Page Title</label>
                <input
                  type="text"
                  value={dashTitle}
                  onChange={(e) => setDashTitle(e.target.value)}
                  className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Welcome Greeting</label>
                <input
                  type="text"
                  value={dashGreeting}
                  onChange={(e) => setDashGreeting(e.target.value)}
                  className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Page Subtitle / Tagline</label>
                <input
                  type="text"
                  value={dashSub}
                  onChange={(e) => setDashSub(e.target.value)}
                  className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>
            </div>
          </div>

          {/* KPI Cards Editor */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <BarChart3 size={13} /> Dashboard KPI Metrics ({dashboard.kpis.length})
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dashboard.kpis.map((kpi) => (
                <div
                  key={kpi.id}
                  className="rounded-xl border p-4 flex flex-col gap-2.5 transition-all shadow-sm"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-bold"
                      style={{ color: kpi.color }}
                    >
                      {kpi.label}
                    </span>
                    <button
                      onClick={() => handleToggleKpi(kpi.id, kpi.enabled)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground"
                    >
                      {kpi.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={kpi.label}
                      onChange={(e) => handleUpdateKpi(kpi.id, { label: e.target.value })}
                      placeholder="Label"
                      className="rounded border border-border px-2 py-1 text-xs outline-none flex-1"
                      style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                    />
                    <input
                      type="text"
                      value={kpi.value}
                      onChange={(e) => handleUpdateKpi(kpi.id, { value: e.target.value })}
                      placeholder="Value"
                      className="rounded border border-border px-2 py-1 text-xs font-bold outline-none w-24"
                      style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                    />
                  </div>

                  <input
                    type="text"
                    value={kpi.sub}
                    onChange={(e) => handleUpdateKpi(kpi.id, { sub: e.target.value })}
                    placeholder="Subtitle"
                    className="rounded border border-border px-2 py-1 text-[11px] text-muted-foreground outline-none"
                    style={{ background: 'var(--surface2)' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. RECENT LOGS CMS ─── */}
      {activeSection === 'recent-logs' && (
        <div
          className="rounded-xl border p-5 flex flex-col gap-4 shadow-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="font-head font-bold text-sm text-foreground">
              Audit Trail Configuration
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Module Header</label>
              <input
                type="text"
                defaultValue={recentLogs.moduleTitle}
                onChange={(e) => updateRecentLogsConfig({ moduleTitle: e.target.value })}
                className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Audit Retention</label>
              <select
                defaultValue={recentLogs.retentionDays}
                onChange={(e) => updateRecentLogsConfig({ retentionDays: e.target.value })}
                className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
              >
                <option value="90">90 Days</option>
                <option value="180">180 Days (Standard)</option>
                <option value="365">1 Year (Statutory)</option>
                <option value="1825">5 Years (Audit Grade)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            <label className="text-xs font-semibold text-foreground">Monitored Event Categories</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {recentLogs.categories.map((cat, i) => (
                <div
                  key={i}
                  className="px-3 py-2 rounded-lg border border-border text-xs flex items-center justify-between"
                  style={{ background: 'var(--surface2)' }}
                >
                  <span className="truncate">{cat}</span>
                  <Check size={12} className="text-emerald-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. IMPORT / EXPORT CMS ─── */}
      {activeSection === 'import' && (
        <div
          className="rounded-xl border p-5 flex flex-col gap-4 shadow-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="font-head font-bold text-sm text-foreground">
              Import & Export Engine Settings
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Hub Title</label>
              <input
                type="text"
                defaultValue={importExport.moduleTitle}
                onChange={(e) => updateImportExportConfig({ moduleTitle: e.target.value })}
                className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Max File Upload Limit (MB)</label>
              <input
                type="number"
                defaultValue={importExport.maxUploadMb}
                onChange={(e) =>
                  updateImportExportConfig({ maxUploadMb: parseInt(e.target.value) || 25 })
                }
                className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            <label className="text-xs font-semibold text-foreground">Supported Data Entities</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {importExport.supportedModules.map((mod, i) => (
                <div
                  key={i}
                  className="px-3 py-2 rounded-lg border border-border text-xs flex items-center justify-between"
                  style={{ background: 'var(--surface2)' }}
                >
                  <span className="truncate">{mod}</span>
                  <Check size={12} className="text-primary" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. USERS & ROLES CMS ─── */}
      {activeSection === 'users' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users size={13} /> Platform Role Levels (L1 - L5)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {roles.map((role) => (
              <div
                key={role.roleLevel}
                className="rounded-xl border p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm shadow-sm"
                    style={{ background: `${role.badgeColor}25`, color: role.badgeColor }}
                  >
                    {role.roleLevel}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={role.title}
                        onChange={(e) =>
                          updateRoleConfig(role.roleLevel, { title: e.target.value })
                        }
                        className="font-head font-bold text-sm border-b border-transparent hover:border-border focus:border-primary outline-none bg-transparent"
                      />
                    </div>
                    <input
                      type="text"
                      value={role.description}
                      onChange={(e) =>
                        updateRoleConfig(role.roleLevel, { description: e.target.value })
                      }
                      className="text-xs text-muted-foreground border-b border-transparent hover:border-border focus:border-primary outline-none bg-transparent w-full mt-0.5"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={role.badgeColor}
                    onChange={(e) =>
                      updateRoleConfig(role.roleLevel, { badgeColor: e.target.value })
                    }
                    className="text-xs rounded-lg border border-border px-2 py-1 outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {COLOR_OPTIONS.map((col) => (
                      <option key={col.value} value={col.value}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ background: role.badgeColor }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 6. NAVIGATION & SIDEBAR CMS ─── */}
      {activeSection === 'navigation' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <SlidersHorizontal size={13} /> Main Sidebar Navigation Items
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {navigationItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border p-4 flex items-center justify-between gap-3"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-white/10 text-xs font-bold flex items-center justify-center text-muted-foreground">
                    #{item.order}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => {
                        updateNavigationItem(item.id, { label: e.target.value });
                        refresh();
                      }}
                      className="font-head font-bold text-sm bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none"
                    />
                    {item.badgeText && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-[#e8c97a]">
                        {item.badgeText}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      updateNavigationItem(item.id, { enabled: !item.enabled });
                      refresh();
                    }}
                    className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {item.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW TAB */}
      {showAddTabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="rounded-2xl border max-w-lg w-full overflow-hidden shadow-2xl"
            style={{ background: '#161a22', borderColor: 'rgba(232, 201, 122, 0.3)' }}
          >
            <div
              className="px-6 py-4 border-b border-border flex items-center justify-between"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-2">
                <Plus size={16} className="text-primary" />
                <h3 className="font-head font-bold text-sm text-foreground">
                  Add New Tab to {targetPortal.toUpperCase()}
                </h3>
              </div>
              <button
                onClick={() => setShowAddTabModal(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateNewTab} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Tab Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Energy Audits, Incident Logs, Vendor Invoices"
                  value={newTabForm.name}
                  onChange={(e) => setNewTabForm({ ...newTabForm, name: e.target.value })}
                  className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Route Path</label>
                  <input
                    type="text"
                    placeholder="e.g. /asset-management/energy"
                    value={newTabForm.path}
                    onChange={(e) => setNewTabForm({ ...newTabForm, path: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none font-mono"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Tab Group</label>
                  <select
                    value={newTabForm.group}
                    onChange={(e) => setNewTabForm({ ...newTabForm, group: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="Asset Management">Asset Management</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Governance & Legal">Governance & Legal</option>
                    <option value="Analytics & Tools">Analytics & Tools</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Tab Icon</label>
                <select
                  value={newTabForm.iconName}
                  onChange={(e) => setNewTabForm({ ...newTabForm, iconName: e.target.value })}
                  className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                >
                  {AVAILABLE_ICONS.map((ico) => (
                    <option key={ico.name} value={ico.name}>
                      {ico.name} ({ico.label})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Description</label>
                <input
                  type="text"
                  placeholder="Module summary and purpose..."
                  value={newTabForm.description}
                  onChange={(e) =>
                    setNewTabForm({ ...newTabForm, description: e.target.value })
                  }
                  className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-1">
                <button
                  type="button"
                  onClick={() => setShowAddTabModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-border hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold transition-transform active:scale-95"
                  style={{ background: 'var(--primary)', color: '#121316' }}
                >
                  Create Tab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
