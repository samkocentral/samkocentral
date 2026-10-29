'use client';

export interface TabConfig {
  id: string;
  name: string;
  group: 'Core & Portfolio' | 'Asset Management' | 'Maintenance' | 'Compliance' | 'Governance & Legal' | 'Analytics & Tools' | 'Administration';
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
  {
    id: 'tasks',
    name: 'Tasks & Action List',
    group: 'Core & Portfolio',
    path: '/task-manager',
    description: 'Central task tracker, maintenance tickets, compliance obligations and workflows',
  },
  {
    id: 'recent-logs',
    name: 'Recent Logs & Audit Trail',
    group: 'Core & Portfolio',
    path: '/recent-logs',
    description: 'Real-time ledger of actions taken by users, sign-offs, and critical system events',
    isSystem: true,
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
  {
    id: 'categories',
    name: 'Asset Categories',
    group: 'Asset Management',
    path: '/asset-management/categories',
    description: 'Hierarchical taxonomy for asset classification and tagging across properties',
  },

  // ── MAINTENANCE ──
  {
    id: 'maintenance',
    name: 'Maintenance & PPM Schedules',
    group: 'Maintenance',
    path: '/asset-management/maintenance',
    description: 'Planned preventive maintenance calendars, engineer work orders and contractor logs',
  },

  // ── COMPLIANCE ──
  {
    id: 'compliance',
    name: 'Compliance Register',
    group: 'Compliance',
    path: '/compliance-register',
    description: 'Statutory compliance tracking (Legionella, Gas CP12, EICR, Fire Safety, LOLER)',
  },
  {
    id: 'compliance-tracker',
    name: 'Compliance Expiry Tracker',
    group: 'Compliance',
    path: '/compliance-tracker',
    description: 'Timeline and countdown of certificates approaching statutory expiration',
  },

  // ── GOVERNANCE & LEGAL ──
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
    id: 'utilities',
    name: 'Utilities & Energy Accounts',
    group: 'Governance & Legal',
    path: '/utilities-register',
    description: 'Electricity, gas, water meters, billing records, consumption analytics and tariffs',
  },
  {
    id: 'documents',
    name: 'Document Vault & Repository',
    group: 'Governance & Legal',
    path: '/document-repository',
    description: 'Secure digital repository for statutory certificates, manuals, floor plans and audits',
  },

  // ── ANALYTICS & TOOLS ──
  {
    id: 'reports',
    name: 'Reports & Analytics',
    group: 'Analytics & Tools',
    path: '/asset-management/reports',
    description: 'Asset valuation reports, maintenance spend summaries, compliance audit exports',
  },
  {
    id: 'import',
    name: 'Universal Import & Export Hub',
    group: 'Analytics & Tools',
    path: '/asset-management/import',
    description: 'Excel/CSV bulk data import for properties, assets, contracts and compliance logs',
  },
  {
    id: 'inspections',
    name: 'Asset Inspections & Audits',
    group: 'Maintenance',
    path: '/asset-management/inspections',
    description: 'Routine site walkthrough checklists, room inspections and condition assessments',
  },
  {
    id: 'qr-codes',
    name: 'QR Codes & Barcode Scanner',
    group: 'Asset Management',
    path: '/asset-management/qr-scanner',
    description: 'Scan physical equipment QR labels or print badge sheets for site engineering',
  },
  {
    id: 'multi-site',
    name: 'Multi-Site Operations',
    group: 'Core & Portfolio',
    path: '/multi-site-operations',
    description: 'Group-wide multi-property benchmark KPIs and regional facility summaries',
  },

  // ── ADMINISTRATION ──
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
    description: 'Global organization preferences, email alerts, CMS customization, and audit retention',
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
    } else {
      acc[tab.id] = { enabled: true, accessLevel: 'write' };
    }
    return acc;
  },
  {} as UserTabPermissions
);

export const DEFAULT_L3_UPLOADER_PERMISSIONS: UserTabPermissions = ALL_SYSTEM_TABS.reduce(
  (acc, tab) => {
    if (tab.id === 'users' || tab.id === 'settings') {
      acc[tab.id] = { enabled: false, accessLevel: 'read' };
    } else if (tab.group === 'Core & Portfolio' || tab.group === 'Asset Management' || tab.group === 'Maintenance') {
      acc[tab.id] = { enabled: true, accessLevel: 'write' };
    } else {
      acc[tab.id] = { enabled: true, accessLevel: 'read' };
    }
    return acc;
  },
  {} as UserTabPermissions
);

export const DEFAULT_L4_VIEWER_PERMISSIONS: UserTabPermissions = ALL_SYSTEM_TABS.reduce(
  (acc, tab) => {
    if (tab.id === 'users' || tab.id === 'settings') {
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
      return {
        L1: { ...DEFAULT_L1_SUPER_ADMIN_PERMISSIONS, ...(parsed.L1 || {}) },
        L2: { ...DEFAULT_L2_ADMIN_PERMISSIONS, ...(parsed.L2 || {}) },
        L3: { ...DEFAULT_L3_UPLOADER_PERMISSIONS, ...(parsed.L3 || {}) },
        L4: { ...DEFAULT_L4_VIEWER_PERMISSIONS, ...(parsed.L4 || {}) },
      };
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
    window.dispatchEvent(new CustomEvent('samko:role-templates-changed', { detail: { templates } }));
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
    window.dispatchEvent(new CustomEvent('samko:role-templates-changed', { detail: { templates } }));
  }

  return templates;
}

export type TabSectionLocation = 'propco' | 'opco' | 'both' | 'bottom';

export const DEFAULT_TAB_SECTIONS: Record<string, TabSectionLocation> = {
  // PropCo
  dashboard: 'propco',
  'propco-dashboard': 'propco',
  properties: 'propco',
  'fixed-assets': 'propco',
  'all-assets': 'propco',
  categories: 'propco',
  insurance: 'propco',
  contracts: 'propco',
  'contract-reports': 'propco',
  documents: 'propco',
  'multi-site': 'propco',
  reports: 'both',

  // OpCo
  'opco-dashboard': 'opco',
  'non-fixed-assets': 'opco',
  'non-fixed': 'opco',
  maintenance: 'opco',
  compliance: 'opco',
  'compliance-tracker': 'opco',
  tasks: 'opco',
  'maintenance-reports': 'opco',
  'task-module': 'opco',
  utilities: 'opco',
  inspections: 'opco',
  'qr-codes': 'opco',

  // Bottom / Common
  'recent-logs': 'bottom',
  import: 'bottom',
  users: 'bottom',
  settings: 'bottom',
};

const STORAGE_TAB_SECTIONS_KEY = 'samko:tab_section_mapping';

export function getTabSectionMapping(): Record<string, TabSectionLocation> {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_TAB_SECTIONS };
  }
  try {
    const raw = localStorage.getItem(STORAGE_TAB_SECTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_TAB_SECTIONS, ...parsed };
      }
    }
  } catch (err) {
    console.warn('Failed to load tab section mapping:', err);
  }
  return { ...DEFAULT_TAB_SECTIONS };
}

export function saveTabSectionMapping(mapping: Record<string, TabSectionLocation>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_TAB_SECTIONS_KEY, JSON.stringify(mapping));
    window.dispatchEvent(new CustomEvent('samko:sections-changed', { detail: { mapping } }));
    window.dispatchEvent(new CustomEvent('samko:app-cms-updated', { detail: { mapping } }));
  } catch (err) {
    console.error('Failed to save tab section mapping:', err);
  }
}

export const TAB_ALIASES: Record<string, string[]> = {
  dashboard: ['propco-dashboard', 'opco-dashboard'],
  'propco-dashboard': ['dashboard'],
  'opco-dashboard': ['dashboard'],
  'fixed-assets': ['all-assets'],
  'all-assets': ['fixed-assets'],
  'non-fixed-assets': ['non-fixed'],
  'non-fixed': ['non-fixed-assets'],
  reports: ['contract-reports', 'maintenance-reports'],
  'contract-reports': ['reports', 'maintenance-reports'],
  'maintenance-reports': ['reports', 'contract-reports'],
  tasks: ['task-module'],
  'task-module': ['tasks'],
  compliance: ['compliance-tracker'],
  'compliance-tracker': ['compliance'],
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
