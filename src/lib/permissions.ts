'use client';

export interface TabConfig {
  id: string;
  name: string;
  group:
    | 'Core & Portfolio'
    | 'Asset Management'
    | 'Maintenance'
    | 'Compliance'
    | 'Governance & Legal'
    | 'Analytics & Tools'
    | 'Administration';
  path: string;
  description: string;
  badge?: string;
  isSystem?: boolean;
}

export const ALL_SYSTEM_TABS: TabConfig[] = [
  // ── CORE & PORTFOLIO ──
  {
    id: 'dashboard',
    name: 'Dashboard Overview',
    group: 'Core & Portfolio',
    path: '/',
    description: 'High-level operational KPIs, alerts, site compliance and quick actions',
    isSystem: true,
  },
  {
    id: 'propco-dashboard',
    name: 'PropCo Dashboard',
    group: 'Asset Management',
    path: '/?portal=propco',
    description: 'Real estate asset company dashboard for properties, insurance and contracts',
  },
  {
    id: 'opco-dashboard',
    name: 'OpCo Dashboard',
    group: 'Maintenance',
    path: '/?portal=opco',
    description: 'Hotel operational portal for loose equipment, PPM maintenance and compliance',
  },
  {
    id: 'properties',
    name: 'Properties & Hotel Sites',
    group: 'Core & Portfolio',
    path: '/asset-management/properties',
    description: 'Master list of 5 UK properties, hotel managers, locations and room counts',
  },

  // ── ASSET MANAGEMENT ──
  {
    id: 'fixed-assets',
    name: 'Fixed Assets (Plant & Machinery)',
    group: 'Asset Management',
    path: '/asset-management/assets?type=fixed',
    description: 'Heavy equipment, HVAC, lifts, chillers, boilers, and building infrastructure',
  },
  {
    id: 'non-fixed-assets',
    name: 'Non-Fixed Assets (FF&E / Loose Items)',
    group: 'Asset Management',
    path: '/asset-management/assets?type=non-fixed',
    description: 'Movable furniture, fixtures, kitchen appliances, electronics & room equipment',
  },

  // ── MAINTENANCE & OPERATIONS ──
  {
    id: 'maintenance',
    name: 'Maintenance & PPM Schedules',
    group: 'Maintenance',
    path: '/asset-management/maintenance',
    description:
      'Planned preventive maintenance calendars, engineer work orders and contractor logs',
  },
  {
    id: 'compliance',
    name: 'Compliance Register',
    group: 'Compliance',
    path: '/compliance-register',
    description: 'Statutory compliance tracking (Legionella, Gas CP12, EICR, Fire Safety, LOLER)',
  },
  {
    id: 'insurance',
    name: 'Insurance Register',
    group: 'Governance & Legal',
    path: '/insurance-register',
    description: 'Active insurance policies, coverage limits, policy renewals and broker documents',
  },
  {
    id: 'contracts',
    name: 'Contracts & Supplier Agreements',
    group: 'Governance & Legal',
    path: '/contracts-register',
    description: 'Vendor SLA agreements, utility contracts, lift servicing, FM provider contracts',
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    group: 'Analytics & Tools',
    path: '/asset-management/reports',
    description: 'Asset valuation reports, maintenance spend summaries, compliance audit exports',
  },
  {
    id: 'acquisition',
    name: 'Acquisition',
    group: 'Governance & Legal',
    path: '/acquisition',
    description:
      'M&A due diligence repository, title deeds, legal contracts, surveys, and financial valuation models',
  },
  {
    id: 'tasks',
    name: 'Tasks & Action List',
    group: 'Core & Portfolio',
    path: '/tasks',
    description: 'Central task tracker, maintenance tickets, compliance obligations and workflows',
  },
  {
    id: 'utilities',
    name: 'Utilities & Energy Accounts',
    group: 'Governance & Legal',
    path: '/utilities-register',
    description:
      'Electricity, gas, water meters, billing records, consumption analytics and tariffs',
  },

  // ── BOTTOM / SYSTEM TABS ──
  {
    id: 'approvals',
    name: 'Approvals Register',
    group: 'Administration',
    path: '/approvals',
    description: 'Review and approve newly submitted assets, documents and compliance items',
  },
  {
    id: 'docs-upload',
    name: 'Docs Upload',
    group: 'Governance & Legal',
    path: '/document-repository',
    description:
      'Universal document repository, compliance certificates, warranties and O&M manual uploads',
  },
  {
    id: 'recent-logs',
    name: 'Audit Logs',
    group: 'Core & Portfolio',
    path: '/recent-logs',
    description:
      'Real-time ledger of actions taken by users, sign-offs, and critical system events',
    isSystem: true,
  },
  {
    id: 'import',
    name: 'Universal Import & Export Hub',
    group: 'Analytics & Tools',
    path: '/asset-management/import',
    description: 'Excel/CSV bulk data import for properties, assets, contracts and compliance logs',
  },
  {
    id: 'users',
    name: 'Users & Permissions Management',
    group: 'Administration',
    path: '/users',
    description: 'Multi-role user management (L1 Super Admin, L2 Admin, L3 Uploader, L4 Viewer)',
    isSystem: true,
  },
  {
    id: 'settings',
    name: 'System Settings',
    group: 'Administration',
    path: '/settings',
    description:
      'Global organization preferences, email alerts, CMS customization, and audit retention',
    isSystem: true,
  },
];

export type TabAccessMode = 'read' | 'write';

export interface TabPermission {
  enabled: boolean;
  accessLevel: TabAccessMode;
}

export type UserTabPermissions = Record<string, TabPermission>;

export const DEFAULT_L1_SUPER_ADMIN_PERMISSIONS: UserTabPermissions = ALL_SYSTEM_TABS.reduce(
  (acc, tab) => {
    acc[tab.id] = { enabled: true, accessLevel: 'write' };
    return acc;
  },
  {} as UserTabPermissions
);

export const DEFAULT_L2_ADMIN_PERMISSIONS: UserTabPermissions = ALL_SYSTEM_TABS.reduce(
  (acc, tab) => {
    if (tab.id === 'settings') {
      acc[tab.id] = { enabled: true, accessLevel: 'read' };
    } else if (tab.id === 'approvals') {
      // Approvals tab is strictly restricted to Super Admin & Digital Bot (L1)
      acc[tab.id] = { enabled: false, accessLevel: 'read' };
    } else if (tab.id === 'docs-upload') {
      // Docs Upload is accessible to PropCo / OpCo Admin (L2)
      acc[tab.id] = { enabled: true, accessLevel: 'write' };
    } else {
      acc[tab.id] = { enabled: true, accessLevel: 'write' };
    }
    return acc;
  },
  {} as UserTabPermissions
);

export const DEFAULT_L3_UPLOADER_PERMISSIONS: UserTabPermissions = ALL_SYSTEM_TABS.reduce(
  (acc, tab) => {
    if (tab.id === 'users' || tab.id === 'settings' || tab.id === 'approvals') {
      // Approvals, Users & Settings are hidden from L3 Uploader
      acc[tab.id] = { enabled: false, accessLevel: 'read' };
    } else if (tab.id === 'docs-upload') {
      // Docs Upload is accessible to L3 Uploader for uploading files
      acc[tab.id] = { enabled: true, accessLevel: 'write' };
    } else {
      // All other tabs are read-only for L3 Uploader (no edit rights)
      acc[tab.id] = { enabled: true, accessLevel: 'read' };
    }
    return acc;
  },
  {} as UserTabPermissions
);

export const DEFAULT_L4_VIEWER_PERMISSIONS: UserTabPermissions = ALL_SYSTEM_TABS.reduce(
  (acc, tab) => {
    if (
      tab.id === 'users' ||
      tab.id === 'settings' ||
      tab.id === 'approvals' ||
      tab.id === 'docs-upload'
    ) {
      // Approvals, Docs Upload, Users & Settings are hidden from L4 Viewer
      acc[tab.id] = { enabled: false, accessLevel: 'read' };
    } else {
      acc[tab.id] = { enabled: true, accessLevel: 'read' };
    }
    return acc;
  },
  {} as UserTabPermissions
);

const STORAGE_ROLE_TEMPLATES_KEY = 'samko:role_tab_templates_v2';

export function getAllRoleTabTemplates(): Record<string, UserTabPermissions> {
  if (typeof window === 'undefined') {
    return {
      L1: { ...DEFAULT_L1_SUPER_ADMIN_PERMISSIONS },
      L2: { ...DEFAULT_L2_ADMIN_PERMISSIONS },
      L3: { ...DEFAULT_L3_UPLOADER_PERMISSIONS },
      L4: { ...DEFAULT_L4_VIEWER_PERMISSIONS },
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_ROLE_TEMPLATES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const res = {
        L1: { ...DEFAULT_L1_SUPER_ADMIN_PERMISSIONS, ...(parsed.L1 || {}) },
        L2: { ...DEFAULT_L2_ADMIN_PERMISSIONS, ...(parsed.L2 || {}) },
        L3: { ...DEFAULT_L3_UPLOADER_PERMISSIONS, ...(parsed.L3 || {}) },
        L4: { ...DEFAULT_L4_VIEWER_PERMISSIONS, ...(parsed.L4 || {}) },
      };
      // Mandatory security constraints even if cached in localStorage
      if (res.L2.approvals) res.L2.approvals.enabled = false;
      if (res.L3.approvals) res.L3.approvals.enabled = false;
      if (res.L4.approvals) res.L4.approvals.enabled = false;
      if (res.L1.approvals) res.L1.approvals.enabled = true;
      if (res.L1['docs-upload']) res.L1['docs-upload'].enabled = true;
      if (res.L2['docs-upload']) res.L2['docs-upload'].enabled = true;
      if (res.L3['docs-upload']) res.L3['docs-upload'].enabled = true;
      if (res.L4['docs-upload']) res.L4['docs-upload'].enabled = false;
      // Enforce L3 Uploader has read-only access on all operational tabs (no edit rights)
      if (res.L3) {
        Object.keys(res.L3).forEach((tabKey) => {
          if (tabKey !== 'docs-upload') {
            res.L3[tabKey] = { ...res.L3[tabKey], accessLevel: 'read' };
          }
        });
      }
      return res;
    }
  } catch (err) {
    console.warn('Failed to load role tab templates from localStorage:', err);
  }
  return {
    L1: { ...DEFAULT_L1_SUPER_ADMIN_PERMISSIONS },
    L2: { ...DEFAULT_L2_ADMIN_PERMISSIONS },
    L3: { ...DEFAULT_L3_UPLOADER_PERMISSIONS },
    L4: { ...DEFAULT_L4_VIEWER_PERMISSIONS },
  };
}

export function saveRoleTabPermissions(role: string, permissions: UserTabPermissions): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getAllRoleTabTemplates();
    current[role] = { ...permissions };
    localStorage.setItem(STORAGE_ROLE_TEMPLATES_KEY, JSON.stringify(current));
    window.dispatchEvent(
      new CustomEvent('samko:role-templates-changed', {
        detail: { role, permissions },
      })
    );
  } catch (err) {
    console.error('Failed to save role tab template:', err);
  }
}

export function getRoleTabPermissions(role: string): UserTabPermissions {
  const all = getAllRoleTabTemplates();
  return all[role] || getDefaultTabPermissionsForRole(role);
}

export function getDefaultTabPermissionsForRole(role: string): UserTabPermissions {
  switch (role) {
    case 'L1':
      return { ...DEFAULT_L1_SUPER_ADMIN_PERMISSIONS };
    case 'L2':
      return { ...DEFAULT_L2_ADMIN_PERMISSIONS };
    case 'L3':
      return { ...DEFAULT_L3_UPLOADER_PERMISSIONS };
    case 'L4':
    default:
      return { ...DEFAULT_L4_VIEWER_PERMISSIONS };
  }
}

export function transferTabBetweenRoles({
  tabId,
  fromRole,
  toRole,
  mode = 'copy',
  accessLevel = 'write',
}: {
  tabId: string;
  fromRole: string;
  toRole: string;
  mode: 'copy' | 'move';
  accessLevel?: TabAccessMode;
}): Record<string, UserTabPermissions> {
  const templates = getAllRoleTabTemplates();

  const targetRoles = toRole === 'ALL' ? ['L1', 'L2', 'L3', 'L4'] : [toRole];

  targetRoles.forEach((role) => {
    if (!templates[role]) templates[role] = getDefaultTabPermissionsForRole(role);
    templates[role] = {
      ...templates[role],
      [tabId]: { enabled: true, accessLevel },
    };
  });

  if (mode === 'move' && toRole !== fromRole && toRole !== 'ALL') {
    if (templates[fromRole]) {
      templates[fromRole] = {
        ...templates[fromRole],
        [tabId]: { ...templates[fromRole][tabId], enabled: false },
      };
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_ROLE_TEMPLATES_KEY, JSON.stringify(templates));
    window.dispatchEvent(
      new CustomEvent('samko:role-templates-changed', { detail: { templates } })
    );
  }

  return templates;
}

export function transferAllTabsBetweenRoles({
  fromRole,
  toRole,
  mode = 'copy',
  forceAccessLevel,
}: {
  fromRole: string;
  toRole: string;
  mode: 'copy' | 'move';
  forceAccessLevel?: TabAccessMode;
}): Record<string, UserTabPermissions> {
  const templates = getAllRoleTabTemplates();
  const sourcePerms = templates[fromRole] || getDefaultTabPermissionsForRole(fromRole);

  const targetRoles = toRole === 'ALL' ? ['L1', 'L2', 'L3', 'L4'] : [toRole];

  targetRoles.forEach((r) => {
    if (!templates[r]) templates[r] = getDefaultTabPermissionsForRole(r);
    const updatedTarget: UserTabPermissions = { ...templates[r] };

    Object.entries(sourcePerms).forEach(([tabId, perm]) => {
      if (perm.enabled) {
        updatedTarget[tabId] = {
          enabled: true,
          accessLevel: forceAccessLevel || perm.accessLevel,
        };
      }
    });

    templates[r] = updatedTarget;
  });

  if (mode === 'move' && toRole !== fromRole && toRole !== 'ALL') {
    if (templates[fromRole]) {
      const stripped: UserTabPermissions = { ...templates[fromRole] };
      Object.keys(stripped).forEach((k) => {
        stripped[k] = { ...stripped[k], enabled: false };
      });
      templates[fromRole] = stripped;
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_ROLE_TEMPLATES_KEY, JSON.stringify(templates));
    window.dispatchEvent(
      new CustomEvent('samko:role-templates-changed', { detail: { templates } })
    );
  }

  return templates;
}

export type TabSectionLocation = 'propco' | 'opco' | 'both' | 'bottom' | 'hidden';

export const DEFAULT_TAB_SECTIONS: Record<string, TabSectionLocation> = {
  // PropCo Exclusive
  'propco-dashboard': 'propco',
  properties: 'propco',
  insurance: 'propco',
  contracts: 'propco',

  // Both Sections (In PropCo and OpCo)
  'fixed-assets': 'both',
  'all-assets': 'both',
  'non-fixed-assets': 'both',
  'non-fixed': 'both',
  compliance: 'both',
  'compliance-register': 'both',
  'propco-compliance': 'both',
  reports: 'both',
  'contract-reports': 'both',
  'maintenance-reports': 'both',
  acquisition: 'both',

  // OpCo Exclusive
  'opco-dashboard': 'opco',
  maintenance: 'opco',
  tasks: 'opco',
  'task-module': 'opco',
  utilities: 'opco',

  // Bottom
  approvals: 'bottom',
  'docs-upload': 'bottom',
  documents: 'bottom',
  'recent-logs': 'bottom',
  import: 'bottom',
  users: 'bottom',
  settings: 'bottom',
};

const STORAGE_TAB_SECTIONS_KEY = 'samko:tab_section_mapping';

export function getTabSectionMapping(): Record<string, TabSectionLocation> {
  if (typeof window === 'undefined') {
    const res = { ...DEFAULT_TAB_SECTIONS };
    delete res.dashboard;
    return res;
  }
  try {
    const raw = localStorage.getItem(STORAGE_TAB_SECTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const merged = { ...DEFAULT_TAB_SECTIONS, ...parsed };
        if (merged.compliance === 'opco') merged.compliance = 'both';
        delete merged.dashboard;
        delete merged['qr-codes'];
        delete merged.categories;
        delete merged.inspections;
        delete merged['multi-site'];
        delete merged['compliance-tracker'];
        return merged;
      }
    }
  } catch (err) {
    console.warn('Failed to load tab section mapping:', err);
  }
  const res = { ...DEFAULT_TAB_SECTIONS };
  delete res.dashboard;
  return res;
}

export function saveTabSectionMapping(mapping: Record<string, TabSectionLocation>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_TAB_SECTIONS_KEY, JSON.stringify(mapping));
    window.dispatchEvent(new CustomEvent('samko:sections-changed', { detail: { mapping } }));
    window.dispatchEvent(new CustomEvent('samko:app-cms-updated', { detail: { mapping } }));
    fetch('/api/cms?type=tab_section_mapping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapping),
    }).catch((err) => console.warn('[Permissions] Failed to sync tab sections to database:', err));
  } catch (err) {
    console.error('Failed to save tab section mapping:', err);
  }
}

// Background sync from database for tab section mapping
if (typeof window !== 'undefined') {
  setTimeout(() => {
    fetch('/api/cms?type=tab_section_mapping')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data && typeof res.data === 'object') {
          try {
            const raw = localStorage.getItem(STORAGE_TAB_SECTIONS_KEY);
            const localObj = raw ? JSON.parse(raw) : null;
            if (!localObj || JSON.stringify(localObj) !== JSON.stringify(res.data)) {
              localStorage.setItem(STORAGE_TAB_SECTIONS_KEY, JSON.stringify(res.data));
              window.dispatchEvent(new CustomEvent('samko:sections-changed', { detail: { mapping: res.data } }));
              window.dispatchEvent(new CustomEvent('samko:app-cms-updated', { detail: { mapping: res.data } }));
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, 200);
}

export const TAB_ALIASES: Record<string, string[]> = {
  'fixed-assets': ['all-assets'],
  'all-assets': ['fixed-assets'],
  'non-fixed-assets': ['non-fixed'],
  'non-fixed': ['non-fixed-assets'],
  reports: ['contract-reports', 'maintenance-reports'],
  'contract-reports': ['reports', 'maintenance-reports'],
  'maintenance-reports': ['reports', 'contract-reports'],
  tasks: ['task-module', 'task-manager'],
  'task-module': ['tasks', 'task-manager'],
  'task-manager': ['tasks', 'task-module'],
  compliance: ['compliance-register', 'propco-compliance'],
  'compliance-register': ['compliance', 'propco-compliance'],
  'propco-compliance': ['compliance', 'compliance-register'],
  contracts: ['contracts-register'],
  'contracts-register': ['contracts'],
  insurance: ['insurance-register'],
  'insurance-register': ['insurance'],
  documents: ['docs-upload', 'document-repository'],
  'docs-upload': ['documents', 'document-repository'],
  'document-repository': ['documents', 'docs-upload'],
  acquisition: ['acquisitions', 'deal-room'],
  acquisitions: ['acquisition', 'deal-room'],
  'deal-room': ['acquisition', 'acquisitions'],
};

/**
 * Copies a tab to a section (PropCo or OpCo).
 * If it's already in one section, copying to the other section sets its location to 'both'
 * so it exists in both places without completely moving away.
 */
export function copyTabToSection(
  tabId: string,
  targetSection: 'propco' | 'opco' | 'both'
): Record<string, TabSectionLocation> {
  const mapping = getTabSectionMapping();
  const current = mapping[tabId] || DEFAULT_TAB_SECTIONS[tabId] || 'propco';

  let finalVal: TabSectionLocation = targetSection;
  if (targetSection === 'both' || current === 'both' || current !== targetSection) {
    finalVal = 'both';
  } else {
    finalVal = targetSection;
  }

  mapping[tabId] = finalVal;
  if (TAB_ALIASES[tabId]) {
    TAB_ALIASES[tabId].forEach((alias) => {
      mapping[alias] = finalVal;
    });
  }

  saveTabSectionMapping(mapping);
  return mapping;
}

/**
 * Moves a tab directly to a specific section.
 */
export function moveTabToSection(
  tabId: string,
  targetSection: TabSectionLocation
): Record<string, TabSectionLocation> {
  const mapping = getTabSectionMapping();
  mapping[tabId] = targetSection;
  if (TAB_ALIASES[tabId]) {
    TAB_ALIASES[tabId].forEach((alias) => {
      mapping[alias] = targetSection;
    });
  }
  saveTabSectionMapping(mapping);
  return mapping;
}

const STORAGE_TAB_ORDER_KEY = 'samko:tab_order';

export const DEFAULT_PROPCO_ORDER: string[] = [
  'propco-dashboard',
  'properties',
  'fixed-assets',
  'non-fixed-assets',
  'compliance',
  'insurance',
  'contracts',
  'reports',
  'acquisition',
];

export const DEFAULT_OPCO_ORDER: string[] = [
  'opco-dashboard',
  'fixed-assets',
  'non-fixed-assets',
  'maintenance',
  'compliance',
  'reports',
  'acquisition',
  'tasks',
  'utilities',
];

export const DEFAULT_BOTTOM_ORDER: string[] = [
  'approvals',
  'docs-upload',
  'recent-logs',
  'import',
  'users',
  'settings',
];

export const DEFAULT_TAB_ORDER: string[] = [
  ...DEFAULT_PROPCO_ORDER,
  'opco-dashboard',
  'maintenance',
  'tasks',
  'utilities',
  ...DEFAULT_BOTTOM_ORDER,
];

export function getPortalTabOrder(portal: 'propco' | 'opco' | 'bottom'): string[] {
  const defaults =
    portal === 'propco'
      ? DEFAULT_PROPCO_ORDER
      : portal === 'opco'
      ? DEFAULT_OPCO_ORDER
      : DEFAULT_BOTTOM_ORDER;

  if (typeof window === 'undefined') return [...defaults];
  try {
    const raw = localStorage.getItem(`samko:${portal}_tab_order`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validIds = new Set(ALL_SYSTEM_TABS.map((t) => t.id));
        const filtered = parsed.filter(
          (id: string) =>
            typeof id === 'string' &&
            (validIds.has(id) || defaults.includes(id) || id.startsWith('custom-'))
        );
        defaults.forEach((id) => {
          if (!filtered.includes(id)) filtered.push(id);
        });
        return filtered;
      }
    }
  } catch (e) {}
  return [...defaults];
}

export function savePortalTabOrder(portal: 'propco' | 'opco' | 'bottom', order: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`samko:${portal}_tab_order`, JSON.stringify(order));
    window.dispatchEvent(
      new CustomEvent('samko:tab-order-changed', { detail: { portal, order } })
    );
    fetch(`/api/cms?type=tab_order&portal=${portal}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portal, order }),
    }).catch(() => {});
  } catch (e) {}
}

export function getTabOrder(): string[] {
  if (typeof window === 'undefined') return [...DEFAULT_TAB_ORDER];
  try {
    const raw = localStorage.getItem(STORAGE_TAB_ORDER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validIds = new Set(ALL_SYSTEM_TABS.map((t) => t.id));
        const filtered = parsed.filter(
          (id: string) =>
            typeof id === 'string' &&
            (validIds.has(id) || DEFAULT_TAB_ORDER.includes(id) || id.startsWith('custom-'))
        );
        DEFAULT_TAB_ORDER.forEach((id) => {
          if (!filtered.includes(id)) {
            filtered.push(id);
          }
        });
        return filtered;
      }
    }
  } catch (e) {}
  return [...DEFAULT_TAB_ORDER];
}

export function saveTabOrder(order: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_TAB_ORDER_KEY, JSON.stringify(order));
    window.dispatchEvent(new CustomEvent('samko:tab-order-changed', { detail: { order } }));
    fetch('/api/cms?type=tab_order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    }).catch(() => {});
  } catch (e) {}
}
