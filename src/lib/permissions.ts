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
