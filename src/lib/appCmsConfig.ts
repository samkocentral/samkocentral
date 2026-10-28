/**
 * SAMKO CENTRAL - Complete Application CMS Engine
 * Controls all core sections shown in the sidebar:
 * - Dashboard (KPIs, widgets, titles, greeting)
 * - PROPCO (Asset Co: Title, badge, color, all tabs, paths, icons, order, custom tabs)
 * - OPCO (Operations: Title, badge, color, all tabs, paths, icons, order, custom tabs)
 * - Recent Logs (Retention, categories, columns, export)
 * - Import / Export (Entities, size limits, templates)
 * - Users & Roles (Role titles, badge colors, descriptions)
 * - Global Navigation Hierarchy & Custom Navigation Links
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export interface AppCmsSubTab {
  id: string;
  label: string;
  path: string;
  iconName?: string;
}

export interface AppCmsTab {
  id: string;
  name: string;
  path: string;
  iconName: string;
  description: string;
  group: string;
  section: 'propco' | 'opco' | 'both' | 'bottom';
  enabled: boolean;
  order: number;
  isCustom?: boolean;
  badgeCount?: number;
  parentTabId?: string;
  subtabs?: AppCmsSubTab[];
}

export interface AppCmsPortalSection {
  id: 'propco' | 'opco';
  title: string;
  badgeText: string;
  badgeColor: string;
  description: string;
  iconName: string;
  enabled: boolean;
  tabs: AppCmsTab[];
}

export interface AppCmsKpiCard {
  id: string;
  label: string;
  value: string;
  sub: string;
  color: string;
  iconName: string;
  enabled: boolean;
}

export interface AppCmsDashboardConfig {
  pageTitle: string;
  pageSubtitle: string;
  welcomeGreeting: string;
  kpis: AppCmsKpiCard[];
}

export interface AppCmsRecentLogsConfig {
  moduleTitle: string;
  retentionDays: string;
  categories: string[];
  columns: string[];
  allowExport: boolean;
}

export interface AppCmsImportExportConfig {
  moduleTitle: string;
  maxUploadMb: number;
  supportedModules: string[];
  allowBatchDelete: boolean;
}

export interface AppCmsRoleConfig {
  roleLevel: string;
  title: string;
  badgeColor: string;
  description: string;
}

export interface AppCmsNavigationItem {
  id: string;
  label: string;
  href: string;
  iconName: string;
  enabled: boolean;
  order: number;
  badgeText?: string;
}

export interface AppCmsConfig {
  version: string;
  propco: AppCmsPortalSection;
  opco: AppCmsPortalSection;
  dashboard: AppCmsDashboardConfig;
  recentLogs: AppCmsRecentLogsConfig;
  importExport: AppCmsImportExportConfig;
  roles: AppCmsRoleConfig[];
  navigationItems: AppCmsNavigationItem[];
}

const STORAGE_KEY = 'samko:complete_app_cms_v1';
const EVENT_KEY = 'samko:app-cms-updated';

// ─── FACTORY SYSTEM DEFAULTS ──────────────────────────────────────────────────

export const DEFAULT_APP_CMS: AppCmsConfig = {
  version: '2.1',
  propco: {
    id: 'propco',
    title: 'PROPCO',
    badgeText: 'ASSET CO',
    badgeColor: '#e8c97a',
    iconName: 'Building2',
    enabled: true,
    description:
      'Capital infrastructure, real estate properties, fixed plant machinery, statutory compliance & long-term supplier contracts',
    tabs: [
      {
        id: 'properties',
        name: 'Properties',
        path: '/asset-management/properties',
        iconName: 'Building2',
        description: 'Hotel profiles, site locations, building specs & management contacts',
        group: 'Asset Management',
        section: 'propco',
        enabled: true,
        order: 1,
      },
      {
        id: 'all-assets',
        name: 'Fixed Assets',
        path: '/asset-management/assets',
        iconName: 'Package',
        description: 'HVAC, lifts, boilers, generators, plant & machinery infrastructure',
        group: 'Asset Management',
        section: 'propco',
        enabled: true,
        order: 2,
      },
      {
        id: 'insurance',
        name: 'Insurance',
        path: '/insurance-register',
        iconName: 'FileCheck',
        description: 'Property damage, public liability, employers liability & renewal policies',
        group: 'Governance & Legal',
        section: 'propco',
        enabled: true,
        order: 3,
        subtabs: [
          { id: 'register', label: 'Insurance Register', path: '/insurance-register' },
          { id: 'claims', label: 'Claims', path: '/insurance-register?tab=claims' },
          { id: 'renewals', label: 'Renewals', path: '/insurance-register?tab=renewals' },
        ],
      },
      {
        id: 'contracts',
        name: 'Contracts',
        path: '/contracts-register',
        iconName: 'ScrollText',
        description: 'Vendor maintenance contracts, SLAs, notice periods & renewal dates',
        group: 'Governance & Legal',
        section: 'propco',
        enabled: true,
        order: 4,
        subtabs: [
          { id: 'register', label: 'Contracts Register', path: '/contracts-register' },
          { id: 'suppliers', label: 'Suppliers', path: '/contracts-register?tab=suppliers' },
          { id: 'renewals', label: 'Renewals', path: '/contracts-register?tab=renewals' },
          { id: 'slas', label: 'SLAs', path: '/contracts-register?tab=slas' },
        ],
      },
      {
        id: 'reports',
        name: 'Reports',
        path: '/asset-management/reports?type=contracts',
        iconName: 'BarChart3',
        description: 'Portfolio valuation, lifecycle replacement forecasting & contract analysis',
        group: 'Analytics & Tools',
        section: 'propco',
        enabled: true,
        order: 5,
      },
    ],
  },
  opco: {
    id: 'opco',
    title: 'OPCO',
    badgeText: 'OPERATIONS',
    badgeColor: '#60a5fa',
    iconName: 'Shield',
    enabled: true,
    description:
      'Daily operations, preventative maintenance tasks, reactive work orders, routine checklists & hotel site actions',
    tabs: [
      {
        id: 'non-fixed',
        name: 'Non-Fixed Assets',
        path: '/asset-management/assets?type=non-fixed',
        iconName: 'Package',
        description: 'Operational and non-fixed movable equipment register & loose fixtures',
        group: 'Asset Management',
        section: 'opco',
        enabled: true,
        order: 1,
      },
      {
        id: 'maintenance',
        name: 'Maintenance',
        path: '/asset-management/maintenance',
        iconName: 'Calendar',
        description: 'Planned preventative maintenance, contractor work orders & servicing',
        group: 'Maintenance',
        section: 'opco',
        enabled: true,
        order: 2,
        subtabs: [
          { id: 'scheduled', label: 'Scheduled', path: '/asset-management/maintenance?filter=scheduled' },
          { id: 'due-today', label: 'Due Today', path: '/asset-management/maintenance?filter=due-today' },
          { id: 'overdue', label: 'Overdue', path: '/asset-management/maintenance?filter=overdue' },
          { id: 'completed', label: 'Completed', path: '/asset-management/maintenance?filter=completed' },
        ],
      },
      {
        id: 'compliance',
        name: 'Compliance',
        path: '/compliance-register',
        iconName: 'ShieldCheck',
        description: 'Fire safety, Legionella, EICR electrical, LOLER lifts & gas CP12 certificates',
        group: 'Compliance',
        section: 'opco',
        enabled: true,
        order: 3,
        subtabs: [
          { id: 'register', label: 'Compliance Register', path: '/compliance-register' },
          { id: 'certifications', label: 'Certifications', path: '/compliance-register?tab=certifications' },
          { id: 'statutory', label: 'Statutory Inspections', path: '/compliance-register?tab=statutory' },
          { id: 'expiry', label: 'Expiry Dashboard', path: '/compliance-tracker' },
        ],
      },
      {
        id: 'tasks',
        name: 'Tasks and Alerts',
        path: '/tasks',
        iconName: 'CheckSquare',
        description: 'Operational action items, assignees, priorities, due dates & tickets',
        group: 'Core & Portfolio',
        section: 'opco',
        enabled: true,
        order: 4,
      },
      {
        id: 'maintenance-reports',
        name: 'Reports',
        path: '/asset-management/reports?type=maintenance',
        iconName: 'BarChart3',
        description: 'Operational KPIs, maintenance uptime metrics, compliance summaries & exports',
        group: 'Analytics & Tools',
        section: 'opco',
        enabled: true,
        order: 5,
      },
      {
        id: 'task-manager',
        name: 'Task Module',
        path: '/task-manager',
        iconName: 'ClipboardList',
        description: 'Agile Kanban board for operational workflow tracking & ticket sprints',
        group: 'Core & Portfolio',
        section: 'opco',
        enabled: true,
        order: 6,
      },
      {
        id: 'utilities',
        name: 'Utility',
        path: '/utilities-register',
        iconName: 'Zap',
        description: 'Half-hourly electricity, commercial gas, water meters & supplier tariffs',
        group: 'Governance & Legal',
        section: 'opco',
        enabled: true,
        order: 7,
        subtabs: [
          { id: 'register', label: 'Utilities Register', path: '/utilities-register' },
          { id: 'energy', label: 'Energy & Water Accounts', path: '/utilities-register?type=electricity' },
        ],
      },
    ],
  },
  dashboard: {
    pageTitle: 'Operational Overview',
    pageSubtitle:
      'Real-time portfolio intelligence, statutory compliance status & cross-property operations',
    welcomeGreeting: 'Good afternoon, Marcus. Operational pulse across all UK properties.',
    kpis: [
      {
        id: 'kpi-sites',
        label: 'Active Properties',
        value: '8 Sites',
        sub: 'Across England & South East',
        color: '#e8c97a',
        iconName: 'Building2',
        enabled: true,
      },
      {
        id: 'kpi-asset-val',
        label: 'Total Asset Value',
        value: '£48.2M',
        sub: 'Fixed Plant & Machinery',
        color: '#60a5fa',
        iconName: 'Package',
        enabled: true,
      },
      {
        id: 'kpi-compliance',
        label: 'Statutory Compliance',
        value: '94.2%',
        sub: '2 certificates expiring < 30d',
        color: '#3dd68c',
        iconName: 'ShieldCheck',
        enabled: true,
      },
      {
        id: 'kpi-ppm',
        label: 'PPM Work Orders',
        value: '14 Active',
        sub: '3 scheduled this week',
        color: '#f59e0b',
        iconName: 'Wrench',
        enabled: true,
      },
      {
        id: 'kpi-contracts',
        label: 'Active Contracts',
        value: '27 SLAs',
        sub: '£218k annual committed',
        color: '#a78bfa',
        iconName: 'ScrollText',
        enabled: true,
      },
    ],
  },
  recentLogs: {
    moduleTitle: 'Recent Logs & System Audit Trail',
    retentionDays: '180',
    categories: [
      'Security & Authentication',
      'Asset Management Updates',
      'Compliance Inspections',
      'Contract & Renewal Terms',
      'User Permissions & Role Changes',
      'Work Order Sign-offs',
    ],
    columns: ['Timestamp', 'Event Type', 'User Account', 'Target Entity', 'IP Address', 'Status'],
    allowExport: true,
  },
  importExport: {
    moduleTitle: 'Import & Export Central Hub',
    maxUploadMb: 25,
    supportedModules: [
      'Fixed Assets (Plant & Machinery)',
      'Non-Fixed FF&E Equipment',
      'Contracts & SLAs Register',
      'Compliance Items & Expiries',
      'Planned Maintenance Schedules',
      'Utilities & Energy Meters',
    ],
    allowBatchDelete: true,
  },
  roles: [
    {
      roleLevel: 'L1',
      title: 'Super Admin',
      badgeColor: '#e8c97a',
      description: 'Complete unrestricted platform governance, CMS control & security',
    },
    {
      roleLevel: 'L2',
      title: 'Property Director / GM',
      badgeColor: '#60a5fa',
      description: 'Site-wide asset oversight, budget approvals & high-level operations',
    },
    {
      roleLevel: 'L3',
      title: 'Operations Manager',
      badgeColor: '#3dd68c',
      description: 'Daily operational tasks, compliance monitoring & contractor tickets',
    },
    {
      roleLevel: 'L4',
      title: 'Maintenance Engineer',
      badgeColor: '#f59e0b',
      description: 'On-site PPM servicing, machinery inspections & condition audits',
    },
    {
      roleLevel: 'L5',
      title: 'Auditor / Viewer',
      badgeColor: '#a78bfa',
      description: 'Read-only access to statutory compliance records & audit trails',
    },
  ],
  navigationItems: [
    { id: 'dashboard', label: 'Dashboard', href: '/', iconName: 'LayoutDashboard', enabled: true, order: 1 },
    { id: 'propco', label: 'PROPCO', href: '#propco', iconName: 'Building2', enabled: true, order: 2, badgeText: 'ASSET CO' },
    { id: 'opco', label: 'OPCO', href: '#opco', iconName: 'Shield', enabled: true, order: 3, badgeText: 'OPERATIONS' },
    { id: 'recent-logs', label: 'Recent Logs', href: '/recent-logs', iconName: 'History', enabled: true, order: 4 },
    { id: 'import', label: 'Import / Export', href: '/asset-management/import', iconName: 'Upload', enabled: true, order: 5 },
    { id: 'users', label: 'Users & Roles', href: '/users', iconName: 'Users', enabled: true, order: 6 },
    { id: 'settings', label: 'Settings', href: '/settings', iconName: 'Settings', enabled: true, order: 7 },
  ],
};

// ─── LOCAL STORAGE GET / SET ──────────────────────────────────────────────────

export function getAppCmsConfig(): AppCmsConfig {
  if (typeof window === 'undefined') return DEFAULT_APP_CMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_APP_CMS));
      return DEFAULT_APP_CMS;
    }
    const parsed: AppCmsConfig = JSON.parse(raw);
    if (!parsed || parsed.version !== DEFAULT_APP_CMS.version) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_APP_CMS));
      return DEFAULT_APP_CMS;
    }
    return {
      ...DEFAULT_APP_CMS,
      ...parsed,
      propco: { ...DEFAULT_APP_CMS.propco, ...(parsed.propco || {}) },
      opco: { ...DEFAULT_APP_CMS.opco, ...(parsed.opco || {}) },
      dashboard: { ...DEFAULT_APP_CMS.dashboard, ...(parsed.dashboard || {}) },
      recentLogs: { ...DEFAULT_APP_CMS.recentLogs, ...(parsed.recentLogs || {}) },
      importExport: { ...DEFAULT_APP_CMS.importExport, ...(parsed.importExport || {}) },
      roles: parsed.roles || DEFAULT_APP_CMS.roles,
      navigationItems: parsed.navigationItems || DEFAULT_APP_CMS.navigationItems,
    };
  } catch (err) {
    console.error('Error reading App CMS config:', err);
    return DEFAULT_APP_CMS;
  }
}

export function saveAppCmsConfig(config: AppCmsConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: config }));
  } catch (err) {
    console.error('Error saving App CMS config:', err);
  }
}

export function resetAppCmsConfig(): AppCmsConfig {
  if (typeof window === 'undefined') return DEFAULT_APP_CMS;
  try {
    localStorage.removeItem(STORAGE_KEY);
    saveAppCmsConfig(DEFAULT_APP_CMS);
    return DEFAULT_APP_CMS;
  } catch {
    return DEFAULT_APP_CMS;
  }
}

// ─── CONVENIENCE MUTATORS ─────────────────────────────────────────────────────

export function updatePortalSection(
  portalId: 'propco' | 'opco',
  updates: Partial<AppCmsPortalSection>
): AppCmsConfig {
  const current = getAppCmsConfig();
  current[portalId] = {
    ...current[portalId],
    ...updates,
  };

  // Keep reciprocal navigation item in sync
  if (current.navigationItems) {
    const navItem = current.navigationItems.find((i) => i.id === portalId);
    if (navItem) {
      if (updates.title !== undefined) navItem.label = updates.title;
      if (updates.badgeText !== undefined) navItem.badgeText = updates.badgeText;
      if (updates.enabled !== undefined) navItem.enabled = updates.enabled;
    }
  }

  saveAppCmsConfig(current);
  return current;
}

export function addTabToPortal(
  portalId: 'propco' | 'opco',
  tab: Omit<AppCmsTab, 'order' | 'section'>
): AppCmsTab {
  const current = getAppCmsConfig();
  const order = current[portalId].tabs.length + 1;
  const newTab: AppCmsTab = {
    ...tab,
    section: portalId,
    order,
    isCustom: true,
  };
  current[portalId].tabs.push(newTab);
  saveAppCmsConfig(current);
  return newTab;
}

export function updatePortalTab(
  portalId: 'propco' | 'opco',
  tabId: string,
  updates: Partial<AppCmsTab>
): boolean {
  const current = getAppCmsConfig();
  const index = current[portalId].tabs.findIndex((t) => t.id === tabId);
  if (index === -1) return false;

  current[portalId].tabs[index] = {
    ...current[portalId].tabs[index],
    ...updates,
  };
  saveAppCmsConfig(current);
  return true;
}

export function deletePortalTab(portalId: 'propco' | 'opco', tabId: string): boolean {
  const current = getAppCmsConfig();
  current[portalId].tabs = current[portalId].tabs.filter((t) => t.id !== tabId);
  saveAppCmsConfig(current);
  return true;
}

export function reorderPortalTabs(
  portalId: 'propco' | 'opco',
  fromIndex: number,
  toIndex: number
): boolean {
  const current = getAppCmsConfig();
  const tabs = current[portalId].tabs;
  if (fromIndex < 0 || fromIndex >= tabs.length || toIndex < 0 || toIndex >= tabs.length) {
    return false;
  }
  const [moved] = tabs.splice(fromIndex, 1);
  tabs.splice(toIndex, 0, moved);
  // Re-assign order
  tabs.forEach((t, i) => {
    t.order = i + 1;
  });
  saveAppCmsConfig(current);
  return true;
}

export function copyTabAcrossPortals(
  fromPortal: 'propco' | 'opco',
  toPortal: 'propco' | 'opco',
  tabId: string
): boolean {
  const current = getAppCmsConfig();
  const tab = current[fromPortal].tabs.find((t) => t.id === tabId);
  if (!tab) return false;

  const exists = current[toPortal].tabs.some((t) => t.id === tabId);
  if (exists) return false;

  current[toPortal].tabs.push({
    ...tab,
    section: 'both',
    order: current[toPortal].tabs.length + 1,
  });
  tab.section = 'both';

  saveAppCmsConfig(current);
  return true;
}

export function addDropdownSubtab(
  section: 'propco' | 'opco',
  parentTabId: string,
  subtab: { label: string; path: string; iconName?: string }
): boolean {
  const current = getAppCmsConfig();
  const portal = current[section];
  if (!portal) return false;
  const parentTab = portal.tabs.find((t) => t.id === parentTabId);
  if (!parentTab) return false;
  if (!parentTab.subtabs) {
    parentTab.subtabs = [];
  }
  const id = `sub-${Date.now()}`;
  parentTab.subtabs.push({
    id,
    label: subtab.label,
    path: subtab.path,
    iconName: subtab.iconName || 'Package',
  });
  saveAppCmsConfig(current);
  return true;
}

export function deleteDropdownSubtab(
  section: 'propco' | 'opco',
  parentTabId: string,
  subtabId: string
): boolean {
  const current = getAppCmsConfig();
  const portal = current[section];
  if (!portal) return false;
  const parentTab = portal.tabs.find((t) => t.id === parentTabId);
  if (!parentTab || !parentTab.subtabs) return false;
  parentTab.subtabs = parentTab.subtabs.filter((s) => s.id !== subtabId);
  saveAppCmsConfig(current);
  return true;
}

export function addCustomTabOrDropdown(params: {
  section: 'propco' | 'opco' | 'both' | 'bottom';
  targetTabId?: string; // If specified, adds as dropdown/subtab under this tab
  name: string;
  path: string;
  iconName?: string;
  description?: string;
}): { success: boolean; message: string } {
  const { section, targetTabId, name, path, iconName = 'Package', description = '' } = params;
  if (!name.trim()) return { success: false, message: 'Name cannot be empty' };

  const current = getAppCmsConfig();
  const cleanPath = path.trim() || `/${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  // If adding under a specific target tab as a dropdown/subtab
  if (targetTabId && targetTabId !== 'root') {
    const targetSection = section === 'both' ? 'opco' : section === 'bottom' ? 'opco' : section;
    const portal = current[targetSection];
    const parentTab = portal?.tabs.find((t) => t.id === targetTabId);
    if (parentTab) {
      if (!parentTab.subtabs) parentTab.subtabs = [];
      parentTab.subtabs.push({
        id: `sub-${Date.now()}`,
        label: name.trim(),
        path: cleanPath,
        iconName,
      });
      saveAppCmsConfig(current);
      return {
        success: true,
        message: `Dropdown sub-tab "${name.trim()}" added inside ${parentTab.name}!`,
      };
    }
  }

  // Adding as a top-level tab in section
  const newTabId = `tab-${Date.now()}`;
  const newTab: AppCmsTab = {
    id: newTabId,
    name: name.trim(),
    path: cleanPath,
    iconName,
    description: description.trim() || `Custom module: ${name.trim()}`,
    group: section === 'propco' ? 'Asset Management' : 'Maintenance',
    section,
    enabled: true,
    order: (current[section === 'opco' ? 'opco' : 'propco']?.tabs.length || 0) + 1,
    isCustom: true,
  };

  if (section === 'both') {
    current.propco.tabs.push({ ...newTab, section: 'both', order: current.propco.tabs.length + 1 });
    current.opco.tabs.push({ ...newTab, section: 'both', order: current.opco.tabs.length + 1 });
  } else if (section === 'propco') {
    current.propco.tabs.push(newTab);
  } else if (section === 'opco') {
    current.opco.tabs.push(newTab);
  } else if (section === 'bottom') {
    current.navigationItems.push({
      id: newTabId,
      label: name.trim(),
      href: cleanPath,
      iconName,
      enabled: true,
      order: current.navigationItems.length + 1,
    });
  }

  saveAppCmsConfig(current);
  return {
    success: true,
    message: `Tab "${name.trim()}" added to ${section.toUpperCase()}!`,
  };
}

export function updateDashboardConfig(updates: Partial<AppCmsDashboardConfig>): AppCmsConfig {
  const current = getAppCmsConfig();
  current.dashboard = {
    ...current.dashboard,
    ...updates,
  };
  saveAppCmsConfig(current);
  return current;
}

export function updateRecentLogsConfig(updates: Partial<AppCmsRecentLogsConfig>): AppCmsConfig {
  const current = getAppCmsConfig();
  current.recentLogs = {
    ...current.recentLogs,
    ...updates,
  };
  saveAppCmsConfig(current);
  return current;
}

export function updateImportExportConfig(updates: Partial<AppCmsImportExportConfig>): AppCmsConfig {
  const current = getAppCmsConfig();
  current.importExport = {
    ...current.importExport,
    ...updates,
  };
  saveAppCmsConfig(current);
  return current;
}

export function updateRoleConfig(roleLevel: string, updates: Partial<AppCmsRoleConfig>): boolean {
  const current = getAppCmsConfig();
  const roleIndex = current.roles.findIndex((r) => r.roleLevel === roleLevel);
  if (roleIndex === -1) return false;
  current.roles[roleIndex] = {
    ...current.roles[roleIndex],
    ...updates,
  };
  saveAppCmsConfig(current);
  return true;
}

export function updateNavigationItem(itemId: string, updates: Partial<AppCmsNavigationItem>): boolean {
  const current = getAppCmsConfig();
  if (!current.navigationItems) {
    current.navigationItems = [...DEFAULT_APP_CMS.navigationItems];
  }
  const itemIndex = current.navigationItems.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) return false;
  current.navigationItems[itemIndex] = {
    ...current.navigationItems[itemIndex],
    ...updates,
  };

  // Sync reciprocal portal sections if propco or opco was modified
  if (itemId === 'propco') {
    if (updates.label !== undefined) current.propco.title = updates.label;
    if (updates.badgeText !== undefined) current.propco.badgeText = updates.badgeText;
    if (updates.enabled !== undefined) current.propco.enabled = updates.enabled;
  } else if (itemId === 'opco') {
    if (updates.label !== undefined) current.opco.title = updates.label;
    if (updates.badgeText !== undefined) current.opco.badgeText = updates.badgeText;
    if (updates.enabled !== undefined) current.opco.enabled = updates.enabled;
  }

  saveAppCmsConfig(current);
  return true;
}

// ─── REACT HOOK ───────────────────────────────────────────────────────────────

export function useAppCms() {
  const [config, setConfig] = useState<AppCmsConfig>(() => getAppCmsConfig());

  const refresh = useCallback(() => {
    setConfig(getAppCmsConfig());
  }, []);

  useEffect(() => {
    refresh();

    const handleUpdate = () => {
      refresh();
    };

    window.addEventListener(EVENT_KEY, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_KEY, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refresh]);

  return {
    config,
    propco: config.propco,
    opco: config.opco,
    dashboard: config.dashboard,
    recentLogs: config.recentLogs,
    importExport: config.importExport,
    roles: config.roles,
    navigationItems: config.navigationItems,
    refresh,
  };
}
