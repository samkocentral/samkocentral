export type TabAccessMode = 'read' | 'write';

export interface TabConfig {
  id: string;
  name: string;
  group: 'Core & Portfolio' | 'Asset Management' | 'Maintenance' | 'Compliance' | 'Governance & Legal' | 'Analytics & Tools' | 'Administration';
  path: string;
  description: string;
}

export const ALL_SYSTEM_TABS: TabConfig[] = [
  // Core & Portfolio
  {
    id: 'dashboard',
    name: 'Dashboard Overview',
    group: 'Core & Portfolio',
    path: '/',
    description: 'High-level operational KPIs, alerts, property status & live counters',
  },
  {
    id: 'propco-dashboard',
    name: 'PropCo Dashboard',
    group: 'Asset Management',
    path: '/?portal=propco',
    description: 'PropCo asset owner KPIs, property valuation, fixed plant assets & contracts',
  },
  {
    id: 'opco-dashboard',
    name: 'OpCo Dashboard',
    group: 'Maintenance',
    path: '/?portal=opco',
    description: 'OpCo operational KPIs, maintenance PPM, statutory compliance & energy utilities',
  },
  {
    id: 'properties',
    name: 'Properties & Hotel Sites',
    group: 'Core & Portfolio',
    path: '/asset-management/properties',
    description: 'Hotel profiles, site locations, building specifications & management contacts',
  },
  {
    id: 'tasks',
    name: 'Tasks & Action List',
    group: 'Core & Portfolio',
    path: '/tasks',
    description: 'Operational action items, assignees, priorities, due dates & tickets',
  },
  {
    id: 'recent-logs',
    name: 'Recent Logs & Audit Trail',
    group: 'Core & Portfolio',
    path: '/recent-logs',
    description: 'Immutable system audit logs, user activity timestamps & compliance history',
  },

  // Asset Management
  {
    id: 'fixed-assets',
    name: 'Fixed Assets (Plant & Machinery)',
    group: 'Asset Management',
    path: '/asset-management/assets',
    description: 'HVAC, Lifts, Boilers, Generators, Fire Alarms & Heavy Plant Infrastructure',
  },
  {
    id: 'non-fixed-assets',
    name: 'Non-Fixed Assets (FF&E / Loose Items)',
    group: 'Asset Management',
    path: '/asset-management/assets?type=non-fixed',
    description: 'Furniture, Beds, Kitchenware, Appliances, TVs & Guest Room Fixtures',
  },
  {
    id: 'categories',
    name: 'Asset Categories',
    group: 'Asset Management',
    path: '/asset-management/categories',
    description: 'Category taxonomy, depreciation schedules & equipment classifications',
  },

  // Maintenance
  {
    id: 'maintenance',
    name: 'Maintenance & PPM Schedules',
    group: 'Maintenance',
    path: '/asset-management/maintenance',
    description: 'Planned preventative maintenance, contractor work orders & servicing',
  },

  // Compliance
  {
    id: 'compliance',
    name: 'Compliance Register',
    group: 'Compliance',
    path: '/compliance-register',
    description: 'Fire safety, Legionella, EICR electrical, LOLER lifts & gas CP12 certificates',
  },
  {
    id: 'compliance-tracker',
    name: 'Compliance Expiry Tracker',
    group: 'Compliance',
    path: '/compliance-tracker',
    description: 'Calendar view of upcoming statutory inspection deadlines & expiry alerts',
  },

  // Governance & Legal
  {
    id: 'insurance',
    name: 'Insurance Register',
    group: 'Governance & Legal',
    path: '/insurance-register',
    description: 'Property damage, public liability, employers liability & renewal policies',
  },
  {
    id: 'contracts',
    name: 'Contracts & Supplier Agreements',
    group: 'Governance & Legal',
    path: '/contracts-register',
    description: 'Vendor maintenance contracts, SLAs, notice periods & renewal dates',
  },
  {
    id: 'utilities',
    name: 'Utilities & Energy Accounts',
    group: 'Governance & Legal',
    path: '/utilities-register',
    description: 'Half-hourly electricity, commercial gas, water meters & supplier tariffs',
  },
  {
    id: 'documents',
    name: 'Document Vault & Repository',
    group: 'Governance & Legal',
    path: '/document-repository',
    description: 'O&M manuals, warranty certificates, architectural plans & compliance files',
  },

  // Analytics & Tools
  {
    id: 'reports',
    name: 'Reports & Analytics',
    group: 'Analytics & Tools',
    path: '/asset-management/reports',
    description: 'Executive asset registers, PDF summaries & operational analytics',
  },
  {
    id: 'import',
    name: 'Universal Import & Export Hub',
    group: 'Analytics & Tools',
    path: '/asset-management/import',
    description: 'Multi-sheet Excel upload, column mapping & database bulk exports',
  },
  {
    id: 'inspections',
    name: 'Asset Inspections & Audits',
    group: 'Maintenance',
    path: '/asset-management/inspections',
    description: 'Site asset condition surveys, audit checklists & pass/fail inspection records',
  },
  {
    id: 'qr-codes',
    name: 'QR Codes & Barcode Scanner',
    group: 'Asset Management',
    path: '/asset-management/qr-scanner',
    description: 'Scan asset physical QR tags, mobile lookup & label generator',
  },
  {
    id: 'multi-site',
    name: 'Multi-Site Operations',
    group: 'Core & Portfolio',
    path: '/multi-site-operations',
    description: 'Portfolio-wide site health, compliance ratings, manager contacts & estate map',
  },

  // Administration
  {
    id: 'users',
    name: 'Users & Permissions Management',
    group: 'Administration',
    path: '/users',
    description: 'User directory, role tiers, tab permissions matrix & security controls',
  },
  {
    id: 'settings',
    name: 'System Settings',
    group: 'Administration',
    path: '/settings',
    description: 'Global system configuration, cloud sync parameters & API integration keys',
  },
];

export type UserTabPermissions = Record<string, { enabled: boolean; accessLevel: TabAccessMode }>;

/**
 * Returns default tab permissions configured according to standard role level.
 */
export function getDefaultTabPermissionsForRole(roleLevel: string): UserTabPermissions {
  const result: UserTabPermissions = {};

  ALL_SYSTEM_TABS.forEach((tab) => {
    switch (roleLevel) {
      case 'L1': // Super Admin: Everything Enabled, Edit & Write
        result[tab.id] = { enabled: true, accessLevel: 'write' };
        break;

      case 'L2': // Admin: Everything except Settings, Edit & Write
        result[tab.id] = {
          enabled: tab.id !== 'settings',
          accessLevel: 'write',
        };
        break;

      case 'L3': // Uploader: Operational & Asset tabs enabled with Edit & Write, Admin tabs disabled
        const isL3Allowed = !['users', 'settings'].includes(tab.id);
        result[tab.id] = {
          enabled: isL3Allowed,
          accessLevel: isL3Allowed ? 'write' : 'read',
        };
        break;

      case 'L4': // Viewer: Enabled across portfolio, but strictly Read Only
      default:
        const isL4Allowed = !['users', 'settings'].includes(tab.id);
        result[tab.id] = {
          enabled: isL4Allowed,
          accessLevel: 'read',
        };
        break;
    }
  });

  return result;
}

const STORAGE_ROLE_TEMPLATES_KEY = 'samko:role_tab_templates';

/**
 * Gets all saved role tab templates from storage, or initializes with defaults.
 */
export function getAllRoleTabTemplates(): Record<string, UserTabPermissions> {
  if (typeof window === 'undefined') {
    return {
      L1: getDefaultTabPermissionsForRole('L1'),
      L2: getDefaultTabPermissionsForRole('L2'),
      L3: getDefaultTabPermissionsForRole('L3'),
      L4: getDefaultTabPermissionsForRole('L4'),
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_ROLE_TEMPLATES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        L1: parsed.L1 || getDefaultTabPermissionsForRole('L1'),
        L2: parsed.L2 || getDefaultTabPermissionsForRole('L2'),
        L3: parsed.L3 || getDefaultTabPermissionsForRole('L3'),
        L4: parsed.L4 || getDefaultTabPermissionsForRole('L4'),
      };
    }
  } catch (err) {
    console.warn('Failed to load role tab templates from localStorage:', err);
  }

  return {
    L1: getDefaultTabPermissionsForRole('L1'),
    L2: getDefaultTabPermissionsForRole('L2'),
    L3: getDefaultTabPermissionsForRole('L3'),
    L4: getDefaultTabPermissionsForRole('L4'),
  };
}

/**
 * Returns the tab permissions template for a specific role.
 */
export function getRoleTabPermissions(roleLevel: string): UserTabPermissions {
  const templates = getAllRoleTabTemplates();
  return templates[roleLevel] || getDefaultTabPermissionsForRole(roleLevel);
}

/**
 * Saves updated tab permissions for a role level template.
 */
export function saveRoleTabPermissions(roleLevel: string, perms: UserTabPermissions): void {
  if (typeof window === 'undefined') return;
  try {
    const templates = getAllRoleTabTemplates();
    templates[roleLevel] = perms;
    localStorage.setItem(STORAGE_ROLE_TEMPLATES_KEY, JSON.stringify(templates));
    window.dispatchEvent(new CustomEvent('samko:role-templates-changed', { detail: { roleLevel, perms } }));
  } catch (err) {
    console.error('Failed to save role tab permissions:', err);
  }
}

/**
 * Copies or moves a single tab between two roles.
 */
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

  // If toRole is 'ALL', apply to L1, L2, L3, L4
  const targetRoles = toRole === 'ALL' ? ['L1', 'L2', 'L3', 'L4'] : [toRole];

  targetRoles.forEach((role) => {
    if (!templates[role]) templates[role] = getDefaultTabPermissionsForRole(role);
    templates[role] = {
      ...templates[role],
      [tabId]: { enabled: true, accessLevel },
    };
  });

  // If moving, disable in source role (unless source was target)
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

/**
 * Copies or moves all enabled tabs from one role to another role.
 */
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

    ALL_SYSTEM_TABS.forEach((tab) => {
      const src = sourcePerms[tab.id];
      if (src?.enabled) {
        updatedTarget[tab.id] = {
          enabled: true,
          accessLevel: forceAccessLevel || src.accessLevel,
        };
      }
    });

    templates[r] = updatedTarget;
  });

  if (mode === 'move' && toRole !== fromRole && toRole !== 'ALL') {
    const disabledSource: UserTabPermissions = { ...templates[fromRole] };
    ALL_SYSTEM_TABS.forEach((tab) => {
      if (disabledSource[tab.id]?.enabled) {
        disabledSource[tab.id] = { ...disabledSource[tab.id], enabled: false };
      }
    });
    templates[fromRole] = disabledSource;
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
  'propco-dashboard': 'propco',
  properties: 'propco',
  'fixed-assets': 'propco',
  'all-assets': 'propco',
  insurance: 'propco',
  contracts: 'propco',
  'contract-reports': 'propco',
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
      delete parsed['dashboard'];
      delete parsed['qr-codes'];
      delete parsed['inspections'];
      delete parsed['documents'];
      delete parsed['multi-site'];
      delete parsed['categories'];
      return { ...DEFAULT_TAB_SECTIONS, ...parsed };
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
  } catch (err) {
    console.error('Failed to save tab section mapping:', err);
  }
}

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

  if (targetSection === 'both') {
    mapping[tabId] = 'both';
  } else if (current === 'both') {
    mapping[tabId] = 'both'; // already in both
  } else if (current !== targetSection) {
    // Current is propco and target is opco (or vice-versa) -> becomes both!
    mapping[tabId] = 'both';
  } else {
    mapping[tabId] = targetSection;
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
  saveTabSectionMapping(mapping);
  return mapping;
}
