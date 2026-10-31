import { RoleLevel } from '@/lib/authContext';

export interface AuditDiff {
  field: string;
  previous: string;
  current: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // YYYY-MM-DD HH:mm:ss
  relativeTime: string;
  actorName: string;
  actorEmail: string;
  actorInitials: string;
  roleLevel: RoleLevel;
  action: 'LOGIN' | 'CREATE' | 'UPDATE' | 'DELETE' | 'ROLE_SWITCH' | 'EXPORT' | 'SECURITY' | 'SIGN_OFF';
  actionLabel: string;
  category: 'AUTH' | 'USER_MANAGEMENT' | 'ASSET_REGISTER' | 'COMPLIANCE' | 'MAINTENANCE' | 'SECURITY';
  categoryLabel: string;
  resource: string;
  property?: string;
  ipAddress: string;
  location: string;
  userAgent?: string;
  status: 'success' | 'warning' | 'alert';
  details: string;
  diff?: AuditDiff[];
}

export interface FilterUserOption {
  email: string;
  name: string;
  roleLevel: RoleLevel;
  roleTitle: string;
  initials: string;
  badgeColor: string;
}

export const AUDIT_USERS: FilterUserOption[] = [
  {
    email: 'superadmin@samkocentral.com',
    name: 'Alexander Vance',
    roleLevel: 'L1',
    roleTitle: 'Super Admin',
    initials: 'AV',
    badgeColor: '#f43f5e',
  },
  {
    email: 'info@samko.co.uk',
    name: 'Amit Samani',
    roleLevel: 'L1',
    roleTitle: 'Managing Director',
    initials: 'AS',
    badgeColor: '#f43f5e',
  },
  {
    email: 'admin.propco@samkocentral.com',
    name: 'Rachel Green',
    roleLevel: 'L2',
    roleTitle: 'Propco Admin',
    initials: 'RG',
    badgeColor: '#a78bfa',
  },
  {
    email: 'admin.opco@samkocentral.com',
    name: 'Marcus Webb',
    roleLevel: 'L2',
    roleTitle: 'Opco Admin',
    initials: 'MW',
    badgeColor: '#60a5fa',
  },
  {
    email: 'uploader@samkocentral.com',
    name: 'Sarah Chen',
    roleLevel: 'L3',
    roleTitle: 'Operational Uploader',
    initials: 'SC',
    badgeColor: '#10b981',
  },
  {
    email: 'duty.engineer@samkocentral.com',
    name: 'Duty Engineer',
    roleLevel: 'L3',
    roleTitle: 'Facilities Engineer',
    initials: 'DE',
    badgeColor: '#10b981',
  },
  {
    email: 'qa.auditor.4353@samkocentral.com',
    name: 'Auditor Test 4353',
    roleLevel: 'L4',
    roleTitle: 'Quality & Compliance Auditor',
    initials: 'AT',
    badgeColor: '#94a3b8',
  },
  {
    email: 'viewer@samkocentral.com',
    name: 'David Park',
    roleLevel: 'L4',
    roleTitle: 'External Stakeholder',
    initials: 'DP',
    badgeColor: '#94a3b8',
  },
  {
    email: 'digitalbot@samkocentral.com',
    name: 'Digital Bot',
    roleLevel: 'L1',
    roleTitle: 'Automated Governance Bot',
    initials: 'DB',
    badgeColor: '#38bdf8',
  },
  {
    email: 'system.security@samkocentral.com',
    name: 'Platform Security Daemon',
    roleLevel: 'L1',
    roleTitle: 'Automated Bot',
    initials: 'SY',
    badgeColor: '#f59e0b',
  },
];

export const ACTION_STYLES: Record<
  AuditLogEntry['action'],
  { bg: string; color: string; border: string }
> = {
  ROLE_SWITCH: { bg: 'rgba(167,139,250,0.14)', color: '#c084fc', border: 'rgba(167,139,250,0.30)' },
  CREATE: { bg: 'rgba(52,211,153,0.14)', color: '#34d399', border: 'rgba(52,211,153,0.30)' },
  UPDATE: { bg: 'rgba(96,165,250,0.14)', color: '#60a5fa', border: 'rgba(96,165,250,0.30)' },
  DELETE: { bg: 'rgba(244,63,94,0.14)', color: '#f43f5e', border: 'rgba(244,63,94,0.30)' },
  LOGIN: { bg: 'rgba(251,191,36,0.14)', color: '#fbbf24', border: 'rgba(251,191,36,0.30)' },
  SECURITY: { bg: 'rgba(239,68,68,0.14)', color: '#ef4444', border: 'rgba(239,68,68,0.30)' },
  EXPORT: { bg: 'rgba(147,197,253,0.14)', color: '#93c5fd', border: 'rgba(147,197,253,0.30)' },
  SIGN_OFF: { bg: 'rgba(45,212,191,0.14)', color: '#2dd4bf', border: 'rgba(45,212,191,0.30)' },
};

export const STATUS_STYLES: Record<
  AuditLogEntry['status'],
  { bg: string; color: string; label: string; dotColor: string }
> = {
  success: { bg: 'rgba(52,211,153,0.14)', color: '#34d399', label: 'Success', dotColor: '#10b981' },
  warning: { bg: 'rgba(251,191,36,0.14)', color: '#fbbf24', label: 'Warning', dotColor: '#f59e0b' },
  alert: { bg: 'rgba(244,63,94,0.16)', color: '#f43f5e', label: 'Security Alert', dotColor: '#f43f5e' },
};

// Formats a Date object to "YYYY-MM-DD HH:mm:ss"
function formatDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Returns dynamic audit logs with timestamps computed relative to the current time.
 * This guarantees that "Today's Logs" is always rich and populated with live events,
 * and also generates realistic entries across 1 week, 30 days, 45 days, and 90 days.
 */
export function getRecentLogs(): AuditLogEntry[] {
  const now = new Date();

  // Helper to get date subtracted by minutes/hours/days
  const getDateAgo = (days = 0, hours = 0, minutes = 0) => {
    const d = new Date(now.getTime());
    d.setDate(d.getDate() - days);
    d.setHours(d.getHours() - hours);
    d.setMinutes(d.getMinutes() - minutes);
    return d;
  };

  const logs: AuditLogEntry[] = [
    // -------------------------------------------------------------
    // TODAY'S LOGS (0 to 12 hours ago)
    // -------------------------------------------------------------
    {
      id: 'AUD-BOT-901',
      timestamp: formatDateTime(getDateAgo(0, 0, 15)),
      relativeTime: '15 mins ago',
      actorName: 'Digital Bot',
      actorEmail: 'digitalbot@samkocentral.com',
      actorInitials: 'DB',
      roleLevel: 'L1',
      action: 'SECURITY',
      actionLabel: 'Access Boundary Check',
      category: 'SECURITY',
      categoryLabel: 'Security',
      resource: 'Governance Vault & Security Matrix',
      property: 'All Properties (Portfolio)',
      ipAddress: '127.0.0.1 (Internal Service)',
      location: 'London, United Kingdom',
      userAgent: 'DigitalBot-Daemon/3.2',
      status: 'success',
      details: 'Automated security boundary audit: Confirmed Digital Bot account and audit logs are strictly isolated and restricted from Super Admin access.',
      diff: [
        { field: 'botAuditAccess', previous: 'Open', current: 'Restricted to Digital Bot' },
        { field: 'superAdminAccess', previous: 'Allowed', current: 'Denied' },
      ],
    },
    {
      id: 'AUD-BOT-902',
      timestamp: formatDateTime(getDateAgo(0, 2, 10)),
      relativeTime: '2 hours ago',
      actorName: 'Digital Bot',
      actorEmail: 'digitalbot@samkocentral.com',
      actorInitials: 'DB',
      roleLevel: 'L1',
      action: 'UPDATE',
      actionLabel: 'CMS Store Sync',
      category: 'USER_MANAGEMENT',
      categoryLabel: 'System CMS',
      resource: 'Application CMS Schema Store',
      property: 'All Properties (Portfolio)',
      ipAddress: '127.0.0.1 (Internal Service)',
      location: 'London, United Kingdom',
      userAgent: 'DigitalBot-Daemon/3.2',
      status: 'success',
      details: 'Digital Bot verified and synchronized dynamic sub-tab configurations and real-time records for 27 portal deep pages.',
    },
    {
      id: 'AUD-BOT-903',
      timestamp: formatDateTime(getDateAgo(1, 4, 30)),
      relativeTime: '1 day ago',
      actorName: 'Digital Bot',
      actorEmail: 'digitalbot@samkocentral.com',
      actorInitials: 'DB',
      roleLevel: 'L1',
      action: 'SECURITY',
      actionLabel: 'Protected Vault Backup',
      category: 'SECURITY',
      categoryLabel: 'Security',
      resource: 'samko_db.json Automated Snapshot',
      property: 'All Properties (Portfolio)',
      ipAddress: '127.0.0.1 (Internal Service)',
      location: 'London, United Kingdom',
      userAgent: 'DigitalBot-Daemon/3.2',
      status: 'success',
      details: 'Automated nightly state snapshot taken by Digital Bot with SHA-256 integrity check and cold-storage archiving.',
    },
    {
      id: 'AUD-BOT-904',
      timestamp: formatDateTime(getDateAgo(0, 5, 20)),
      relativeTime: '5 hours ago',
      actorName: 'Digital Bot',
      actorEmail: 'digitalbot@samkocentral.com',
      actorInitials: 'DB',
      roleLevel: 'L1',
      action: 'SECURITY',
      actionLabel: 'Statutory Health Sweep',
      category: 'COMPLIANCE',
      categoryLabel: 'Compliance',
      resource: 'Portfolio Compliance Matrix',
      property: 'All Properties (Portfolio)',
      ipAddress: '127.0.0.1 (Internal Service)',
      location: 'London, United Kingdom',
      userAgent: 'DigitalBot-Daemon/3.2',
      status: 'success',
      details: 'Automated statutory sweep: Verified 11 statutory compliance items across 8 properties. 1 overdue item flagged for urgent engineering review.',
    },
    {
      id: 'AUD-BOT-905',
      timestamp: formatDateTime(getDateAgo(0, 8, 45)),
      relativeTime: '8 hours ago',
      actorName: 'Digital Bot',
      actorEmail: 'digitalbot@samkocentral.com',
      actorInitials: 'DB',
      roleLevel: 'L1',
      action: 'UPDATE',
      actionLabel: 'Database Cache Refresh',
      category: 'SECURITY',
      categoryLabel: 'Database',
      resource: 'samko_db.json Sub-millisecond Cache',
      property: 'All Properties (Portfolio)',
      ipAddress: '127.0.0.1 (Internal Service)',
      location: 'London, United Kingdom',
      userAgent: 'DigitalBot-Daemon/3.2',
      status: 'success',
      details: 'Automated mtime index refresh and sub-millisecond memory cache synchronization executed successfully.',
    },
    {
      id: 'AUD-BOT-906',
      timestamp: formatDateTime(getDateAgo(2, 1, 15)),
      relativeTime: '2 days ago',
      actorName: 'Digital Bot',
      actorEmail: 'digitalbot@samkocentral.com',
      actorInitials: 'DB',
      roleLevel: 'L1',
      action: 'UPDATE',
      actionLabel: 'Contract SLA Sentinel',
      category: 'COMPLIANCE',
      categoryLabel: 'Contracts',
      resource: 'Supplier Contracts Register',
      property: 'All Properties (Portfolio)',
      ipAddress: '127.0.0.1 (Internal Service)',
      location: 'London, United Kingdom',
      userAgent: 'DigitalBot-Daemon/3.2',
      status: 'success',
      details: 'Digital Bot contract expiry sentinel flagged 6 contracts within the 60-day renewal notice window.',
    },
    {
      id: 'AUD-9520',
      timestamp: formatDateTime(getDateAgo(0, 0, 12)),
      relativeTime: '12 mins ago',
      actorName: 'Alexander Vance',
      actorEmail: 'superadmin@samkocentral.com',
      actorInitials: 'AV',
      roleLevel: 'L1',
      action: 'UPDATE',
      actionLabel: 'Asset Modified',
      category: 'ASSET_REGISTER',
      categoryLabel: 'Asset Register',
      resource: 'Asset FA-020: Fire Alarm Detectors',
      property: 'Crowne Plaza Kingston-south',
      ipAddress: '86.154.21.90',
      location: 'London, United Kingdom',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0.0.0 Safari/537.36',
      status: 'success',
      details: 'Updated inspection schedule and confirmed replacement of 6 optical smoke sensors in guest wing B.',
      diff: [
        { field: 'inspectionFrequency', previous: '6-monthly visual check', current: 'Monthly comprehensive check' },
        { field: 'nextInspectionDate', previous: '2026-10-01', current: '2026-11-20' },
      ],
    },
    {
      id: 'AUD-9519',
      timestamp: formatDateTime(getDateAgo(0, 0, 38)),
      relativeTime: '38 mins ago',
      actorName: 'Sarah Chen',
      actorEmail: 'uploader@samkocentral.com',
      actorInitials: 'SC',
      roleLevel: 'L3',
      action: 'CREATE',
      actionLabel: 'Document Upload',
      category: 'COMPLIANCE',
      categoryLabel: 'Compliance & Safety',
      resource: 'Cert: LOLER Passenger Lift A 6-Month Pass',
      property: 'Stanhill Court',
      ipAddress: '194.73.112.5',
      location: 'Horley / Gatwick, UK',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0',
      status: 'success',
      details: 'Uploaded certified LOLER statutory examination report from Zurich Municipal Engineering.',
    },
    {
      id: 'AUD-9518',
      timestamp: formatDateTime(getDateAgo(0, 1, 15)),
      relativeTime: '1 hour ago',
      actorName: 'Auditor Test 4353',
      actorEmail: 'qa.auditor.4353@samkocentral.com',
      actorInitials: 'AT',
      roleLevel: 'L4',
      action: 'EXPORT',
      actionLabel: 'Audit Export',
      category: 'COMPLIANCE',
      categoryLabel: 'Compliance & Safety',
      resource: 'Export: Statutory_Certifications_Audit_Summary.csv',
      property: 'All Properties (Portfolio)',
      ipAddress: '81.187.30.22',
      location: 'Edinburgh, United Kingdom',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/131.0',
      status: 'success',
      details: 'Exported complete statutory compliance register dataset for Q4 internal audit and risk assessment.',
    },
    {
      id: 'AUD-9517',
      timestamp: formatDateTime(getDateAgo(0, 2, 5)),
      relativeTime: '2 hours ago',
      actorName: 'Marcus Webb',
      actorEmail: 'admin.opco@samkocentral.com',
      actorInitials: 'MW',
      roleLevel: 'L2',
      action: 'SIGN_OFF',
      actionLabel: 'Maintenance Sign-off',
      category: 'MAINTENANCE',
      categoryLabel: 'Maintenance',
      resource: 'Work Order: WO-2026-0814 (Chiller Unit Refurbishment)',
      property: 'Crowne Plaza Kingston-south',
      ipAddress: '86.154.21.90',
      location: 'London, United Kingdom',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0.0.0',
      status: 'success',
      details: 'Approved completed contractor sign-off and signed maintenance verification certificate for Daikin Chiller B.',
      diff: [
        { field: 'workOrderStatus', previous: 'Awaiting Opco Review', current: 'Approved & Closed' },
        { field: 'approvedSpend', previous: '£4,250 estimated', current: '£4,180 actual' },
      ],
    },
    {
      id: 'AUD-9516',
      timestamp: formatDateTime(getDateAgo(0, 3, 20)),
      relativeTime: '3 hours ago',
      actorName: 'Rachel Green',
      actorEmail: 'admin.propco@samkocentral.com',
      actorInitials: 'RG',
      roleLevel: 'L2',
      action: 'UPDATE',
      actionLabel: 'Policy Re-verified',
      category: 'ASSET_REGISTER',
      categoryLabel: 'Asset Register',
      resource: 'Insurance Schedule: RSA Property Damage 2026-2027',
      property: 'Mercure London Watford',
      ipAddress: '86.154.21.90',
      location: 'London, United Kingdom',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      status: 'success',
      details: 'Re-indexed insured replacement sum for main hotel building structure following RICS valuation update.',
      diff: [
        { field: 'declaredBuildingValue', previous: '£38,500,000', current: '£41,200,000' },
        { field: 'annualPremium', previous: '£54,000', current: '£57,800' },
      ],
    },
    {
      id: 'AUD-9515',
      timestamp: formatDateTime(getDateAgo(0, 4, 10)),
      relativeTime: '4 hours ago',
      actorName: 'Duty Engineer',
      actorEmail: 'duty.engineer@samkocentral.com',
      actorInitials: 'DE',
      roleLevel: 'L3',
      action: 'UPDATE',
      actionLabel: 'Sampling Logged',
      category: 'COMPLIANCE',
      categoryLabel: 'Compliance & Safety',
      resource: 'Monthly Legionella & Water Temperature Log',
      property: 'Crowne Plaza Kingston-south',
      ipAddress: '194.73.112.5',
      location: 'Kingston upon Thames, UK',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) Mobile/15E148',
      status: 'success',
      details: 'Logged calorifier sentinel outlet temperatures (61.4°C hot, 14.2°C cold) into compliance ledger.',
    },
    {
      id: 'AUD-9514',
      timestamp: formatDateTime(getDateAgo(0, 5, 45)),
      relativeTime: '5 hours ago',
      actorName: 'Platform Security Daemon',
      actorEmail: 'system.security@samkocentral.com',
      actorInitials: 'SY',
      roleLevel: 'L1',
      action: 'SECURITY',
      actionLabel: 'Failed Login Blocked',
      category: 'SECURITY',
      categoryLabel: 'Security',
      resource: 'Endpoint: /api/auth/login (admin.opco)',
      property: 'All Properties (Portfolio)',
      ipAddress: '185.191.171.42',
      location: 'Frankfurt, Germany',
      userAgent: 'python-requests/2.31.0',
      status: 'alert',
      details: 'Automated brute-force defense engaged: 5 failed authentication attempts intercepted and IP placed in 30-min tarpit.',
      diff: [
        { field: 'threatScore', previous: '12 (Low)', current: '98 (Critical)' },
        { field: 'wafState', previous: 'Pass', current: 'Blocked (HTTP 429)' },
      ],
    },
    {
      id: 'AUD-9513',
      timestamp: formatDateTime(getDateAgo(0, 6, 30)),
      relativeTime: '6 hours ago',
      actorName: 'Alexander Vance',
      actorEmail: 'superadmin@samkocentral.com',
      actorInitials: 'AV',
      roleLevel: 'L1',
      action: 'LOGIN',
      actionLabel: 'Primary Login',
      category: 'AUTH',
      categoryLabel: 'Auth & Access',
      resource: 'Web Session (Chrome / macOS)',
      property: 'All Properties (Portfolio)',
      ipAddress: '86.154.21.90',
      location: 'London, United Kingdom',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0.0.0 Safari/537.36',
      status: 'success',
      details: 'User authenticated with 2FA TOTP hardware token verification.',
    },
    {
      id: 'AUD-9512',
      timestamp: formatDateTime(getDateAgo(0, 8, 15)),
      relativeTime: '8 hours ago',
      actorName: 'David Park',
      actorEmail: 'viewer@samkocentral.com',
      actorInitials: 'DP',
      roleLevel: 'L4',
      action: 'LOGIN',
      actionLabel: 'Auditor Session',
      category: 'AUTH',
      categoryLabel: 'Auth & Access',
      resource: 'Web Session (Edge / Windows 11)',
      property: 'All Properties (Portfolio)',
      ipAddress: '194.73.112.5',
      location: 'London, United Kingdom',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/130.0.0.0',
      status: 'success',
      details: 'Auditor initiated read-only inspection session across portfolio compliance registers.',
    },

    // -------------------------------------------------------------
    // PAST 1 WEEK (1 to 7 days ago)
    // -------------------------------------------------------------
    {
      id: 'AUD-9511',
      timestamp: formatDateTime(getDateAgo(1, 4, 12)),
      relativeTime: '1 day ago',
      actorName: 'Amit Samani',
      actorEmail: 'info@samko.co.uk',
      actorInitials: 'AS',
      roleLevel: 'L1',
      action: 'ROLE_SWITCH',
      actionLabel: 'Role Switch',
      category: 'AUTH',
      categoryLabel: 'Auth & Access',
      resource: 'Session Simulator (L1 -> L4)',
      property: 'All Properties (Portfolio)',
      ipAddress: '86.154.21.90',
      location: 'London, United Kingdom',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0.0.0 Safari/537.36',
      status: 'success',
      details: 'Switched session preview to L4 (Viewer - Read-Only) to test auditor permission matrix.',
      diff: [
        { field: 'simulatedRole', previous: 'L1 Super Admin', current: 'L4 Viewer' },
        { field: 'writePrivileges', previous: 'Granted (Global)', current: 'Restricted (Read-Only)' },
      ],
    },
    {
      id: 'AUD-9510',
      timestamp: formatDateTime(getDateAgo(2, 2, 45)),
      relativeTime: '2 days ago',
      actorName: 'Sarah Chen',
      actorEmail: 'uploader@samkocentral.com',
      actorInitials: 'SC',
      roleLevel: 'L3',
      action: 'UPDATE',
      actionLabel: 'Asset Maintenance',
      category: 'ASSET_REGISTER',
      categoryLabel: 'Asset Register',
      resource: 'Asset PE-003: Emergency Generator',
      property: 'Crowne Plaza Kingston-south',
      ipAddress: '194.73.112.5',
      location: 'Kingston upon Thames, UK',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0',
      status: 'success',
      details: 'Completed quarterly run test and recorded diesel fuel reserve at 94% tank capacity.',
    },
    {
      id: 'AUD-9509',
      timestamp: formatDateTime(getDateAgo(3, 5, 10)),
      relativeTime: '3 days ago',
      actorName: 'Auditor Test 4353',
      actorEmail: 'qa.auditor.4353@samkocentral.com',
      actorInitials: 'AT',
      roleLevel: 'L4',
      action: 'EXPORT',
      actionLabel: 'Report Download',
      category: 'COMPLIANCE',
      categoryLabel: 'Compliance & Safety',
      resource: 'Dossier: Statutory_Compliance_Q3.pdf',
      property: 'Mercure London Watford',
      ipAddress: '81.187.30.22',
      location: 'Edinburgh, United Kingdom',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/131.0',
      status: 'success',
      details: 'Generated and downloaded Q3 Statutory Compliance and Certification Inspection Dossier for external audit.',
    },
    {
      id: 'AUD-9508',
      timestamp: formatDateTime(getDateAgo(4, 3, 20)),
      relativeTime: '4 days ago',
      actorName: 'Alexander Vance',
      actorEmail: 'superadmin@samkocentral.com',
      actorInitials: 'AV',
      roleLevel: 'L1',
      action: 'UPDATE',
      actionLabel: 'User Permissions',
      category: 'USER_MANAGEMENT',
      categoryLabel: 'User Management',
      resource: 'User: duty.engineer@samkocentral.com',
      property: 'Crowne Plaza Kingston-south',
      ipAddress: '86.154.21.90',
      location: 'London, United Kingdom',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0.0.0',
      status: 'success',
      details: 'Assigned additional maintenance sign-off permissions for secondary mechanical plant rooms.',
      diff: [
        { field: 'assignedZones', previous: 'Guest Wings Only', current: 'Guest Wings & Plant Basement' },
      ],
    },
    {
      id: 'AUD-9507',
      timestamp: formatDateTime(getDateAgo(5, 6, 0)),
      relativeTime: '5 days ago',
      actorName: 'Marcus Webb',
      actorEmail: 'admin.opco@samkocentral.com',
      actorInitials: 'MW',
      roleLevel: 'L2',
      action: 'CREATE',
      actionLabel: 'New Asset Added',
      category: 'ASSET_REGISTER',
      categoryLabel: 'Asset Register',
      resource: 'Asset REST-009: Rational Combi Oven (Kitchen 2)',
      property: 'Holiday Inn Southampton',
      ipAddress: '86.154.21.90',
      location: 'Southampton, United Kingdom',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0.0.0',
      status: 'success',
      details: 'Commissioned new high-efficiency combi-steamer in main banquet prep kitchen.',
    },
    {
      id: 'AUD-9506',
      timestamp: formatDateTime(getDateAgo(6, 7, 30)),
      relativeTime: '6 days ago',
      actorName: 'Rachel Green',
      actorEmail: 'admin.propco@samkocentral.com',
      actorInitials: 'RG',
      roleLevel: 'L2',
      action: 'SIGN_OFF',
      actionLabel: 'Contract SLA Renewed',
      category: 'COMPLIANCE',
      categoryLabel: 'Compliance & Safety',
      resource: 'Contract CON-2026-CHUBB-FIRE: 3-Year Fire Alarm SLA',
      property: 'Crowne Plaza Kingston-south',
      ipAddress: '86.154.21.90',
      location: 'London, United Kingdom',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      status: 'success',
      details: 'Executed SLA renewal with Chubb Fire & Security UK covering all 120 guest room detectors.',
      diff: [
        { field: 'contractTerm', previous: '2023-2026', current: '2026-2029' },
        { field: 'emergencyResponseSLA', previous: '8 Hours', current: '4 Hours (Guaranteed)' },
      ],
    },

    // -------------------------------------------------------------
    // PAST 30 DAYS (8 to 30 days ago)
    // -------------------------------------------------------------
    {
      id: 'AUD-9505',
      timestamp: formatDateTime(getDateAgo(12, 4, 15)),
      relativeTime: '12 days ago',
      actorName: 'Amit Samani',
      actorEmail: 'info@samko.co.uk',
      actorInitials: 'AS',
      roleLevel: 'L1',
      action: 'EXPORT',
      actionLabel: 'Master Export',
      category: 'ASSET_REGISTER',
      categoryLabel: 'Asset Register',
      resource: 'Export: Master_Fixed_Asset_Register.xlsx',
      property: 'All Properties (Portfolio)',
      ipAddress: '86.154.21.90',
      location: 'London, United Kingdom',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0.0.0 Safari/537.36',
      status: 'success',
      details: 'Exported encrypted portfolio asset census containing 842 asset records across 8 hotels.',
    },
    {
      id: 'AUD-9504',
      timestamp: formatDateTime(getDateAgo(16, 2, 30)),
      relativeTime: '16 days ago',
      actorName: 'Duty Engineer',
      actorEmail: 'duty.engineer@samkocentral.com',
      actorInitials: 'DE',
      roleLevel: 'L3',
      action: 'UPDATE',
      actionLabel: 'Work Order Completed',
      category: 'MAINTENANCE',
      categoryLabel: 'Maintenance',
      resource: 'Asset FA-011: Indoor A/C Unit 402',
      property: 'Crowne Plaza Kingston-south',
      ipAddress: '194.73.112.5',
      location: 'Kingston upon Thames, UK',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
      status: 'success',
      details: 'Cleared condensate tray blockage and replaced washable nylon air filter.',
    },
    {
      id: 'AUD-9503',
      timestamp: formatDateTime(getDateAgo(21, 5, 50)),
      relativeTime: '21 days ago',
      actorName: 'Sarah Chen',
      actorEmail: 'uploader@samkocentral.com',
      actorInitials: 'SC',
      roleLevel: 'L3',
      action: 'CREATE',
      actionLabel: 'Cert Uploaded',
      category: 'COMPLIANCE',
      categoryLabel: 'Compliance & Safety',
      resource: 'CP12 Commercial Gas Safety Certificate',
      property: 'Stanhill Court',
      ipAddress: '194.73.112.5',
      location: 'Horley / Gatwick, UK',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0',
      status: 'success',
      details: 'Uploaded certified British Gas annual gas soundness & CP12 report with zero defects.',
    },
    {
      id: 'AUD-9502',
      timestamp: formatDateTime(getDateAgo(27, 8, 10)),
      relativeTime: '27 days ago',
      actorName: 'Alexander Vance',
      actorEmail: 'superadmin@samkocentral.com',
      actorInitials: 'AV',
      roleLevel: 'L1',
      action: 'SECURITY',
      actionLabel: 'Session Policy',
      category: 'SECURITY',
      categoryLabel: 'Security',
      resource: 'Platform Global Policy',
      property: 'All Properties (Portfolio)',
      ipAddress: '86.154.21.90',
      location: 'London, United Kingdom',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0.0.0',
      status: 'success',
      details: 'Enforced re-authentication for all destructive asset deletions and role management operations.',
      diff: [
        { field: 'requireReauthForDestructive', previous: 'Disabled', current: 'Enforced (Password/WebAuthn)' },
      ],
    },

    // -------------------------------------------------------------
    // PAST 45 DAYS (31 to 45 days ago)
    // -------------------------------------------------------------
    {
      id: 'AUD-9501',
      timestamp: formatDateTime(getDateAgo(34, 3, 15)),
      relativeTime: '34 days ago',
      actorName: 'Auditor Test 4353',
      actorEmail: 'qa.auditor.4353@samkocentral.com',
      actorInitials: 'AT',
      roleLevel: 'L4',
      action: 'EXPORT',
      actionLabel: 'Compliance Audit',
      category: 'COMPLIANCE',
      categoryLabel: 'Compliance & Safety',
      resource: 'Export: Fire_Safety_Inspections_2026.csv',
      property: 'Crowne Plaza Kingston-south',
      ipAddress: '81.187.30.22',
      location: 'Edinburgh, United Kingdom',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/131.0',
      status: 'success',
      details: 'Audited and exported 6-monthly fire alarm detector check logs for local fire authority validation.',
    },
    {
      id: 'AUD-9500',
      timestamp: formatDateTime(getDateAgo(39, 6, 40)),
      relativeTime: '39 days ago',
      actorName: 'Rachel Green',
      actorEmail: 'admin.propco@samkocentral.com',
      actorInitials: 'RG',
      roleLevel: 'L2',
      action: 'UPDATE',
      actionLabel: 'Hotel Details Updated',
      category: 'ASSET_REGISTER',
      categoryLabel: 'Asset Register',
      resource: 'Hotel: Mercure London Watford',
      property: 'Mercure London Watford',
      ipAddress: '86.154.21.90',
      location: 'London, United Kingdom',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      status: 'success',
      details: 'Updated property asset contact officer and registered new primary EPC rating B.',
      diff: [
        { field: 'epcRating', previous: 'C (72)', current: 'B (84)' },
        { field: 'leadSurveyor', previous: 'External Consultant', current: 'Rachel Green (Propco)' },
      ],
    },
    {
      id: 'AUD-9499',
      timestamp: formatDateTime(getDateAgo(43, 2, 10)),
      relativeTime: '43 days ago',
      actorName: 'Marcus Webb',
      actorEmail: 'admin.opco@samkocentral.com',
      actorInitials: 'MW',
      roleLevel: 'L2',
      action: 'DELETE',
      actionLabel: 'Decommissioned Asset',
      category: 'ASSET_REGISTER',
      categoryLabel: 'Asset Register',
      resource: 'Asset OLD-WASH-02: Commercial Washer 15kg',
      property: 'Crowne Plaza Kingston-south',
      ipAddress: '86.154.21.90',
      location: 'London, United Kingdom',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0.0.0',
      status: 'warning',
      details: 'Decommissioned end-of-life Electrolux laundry washer; disposed of in accordance with WEEE directives.',
    },

    // -------------------------------------------------------------
    // PAST 90 DAYS (46 to 90 days ago)
    // -------------------------------------------------------------
    {
      id: 'AUD-9498',
      timestamp: formatDateTime(getDateAgo(52, 5, 20)),
      relativeTime: '52 days ago',
      actorName: 'Alexander Vance',
      actorEmail: 'superadmin@samkocentral.com',
      actorInitials: 'AV',
      roleLevel: 'L1',
      action: 'CREATE',
      actionLabel: 'New Auditor Onboarded',
      category: 'USER_MANAGEMENT',
      categoryLabel: 'User Management',
      resource: 'User: qa.auditor.4353@samkocentral.com',
      property: 'All Properties (Portfolio)',
      ipAddress: '86.154.21.90',
      location: 'London, United Kingdom',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0.0.0',
      status: 'success',
      details: 'Provisioned read-only L4 compliance auditor access for external quality auditor.',
    },
    {
      id: 'AUD-9497',
      timestamp: formatDateTime(getDateAgo(68, 7, 15)),
      relativeTime: '68 days ago',
      actorName: 'Amit Samani',
      actorEmail: 'info@samko.co.uk',
      actorInitials: 'AS',
      roleLevel: 'L1',
      action: 'SIGN_OFF',
      actionLabel: 'Annual Portfolio Sign-off',
      category: 'COMPLIANCE',
      categoryLabel: 'Compliance & Safety',
      resource: 'Statutory Certification Dossier: Samko Portfolio 2026',
      property: 'All Properties (Portfolio)',
      ipAddress: '86.154.21.90',
      location: 'London, United Kingdom',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0.0.0',
      status: 'success',
      details: 'Formal annual director sign-off on group statutory obligations and statutory register integrity.',
    },
    {
      id: 'AUD-9496',
      timestamp: formatDateTime(getDateAgo(84, 4, 30)),
      relativeTime: '84 days ago',
      actorName: 'Platform Security Daemon',
      actorEmail: 'system.security@samkocentral.com',
      actorInitials: 'SY',
      roleLevel: 'L1',
      action: 'SECURITY',
      actionLabel: 'Certificate Auto-Renewed',
      category: 'SECURITY',
      categoryLabel: 'Security',
      resource: 'TLS/SSL Wildcard: *.samkocentral.com',
      property: 'All Properties (Portfolio)',
      ipAddress: '127.0.0.1',
      location: 'London, United Kingdom',
      userAgent: 'certbot/2.9.0',
      status: 'success',
      details: 'Automated Let’s Encrypt ECC wildcard certificate renewal completed successfully with zero downtime.',
    },
  ];

  return logs;
}

export const INITIAL_AUDIT_LOGS = getRecentLogs();

export function exportAuditLogsToCSV(logs: AuditLogEntry[]) {
  const headers = [
    'Event ID',
    'Timestamp',
    'Actor Name',
    'Actor Email',
    'Role Level',
    'Action',
    'Category',
    'Property',
    'Target Resource',
    'IP Address',
    'Location',
    'Status',
    'Details',
  ];

  const rows = logs.map((l) => [
    l.id,
    l.timestamp,
    `"${l.actorName.replace(/"/g, '""')}"`,
    `"${l.actorEmail.replace(/"/g, '""')}"`,
    l.roleLevel,
    l.action,
    l.category,
    `"${(l.property || 'Portfolio-wide').replace(/"/g, '""')}"`,
    `"${l.resource.replace(/"/g, '""')}"`,
    l.ipAddress,
    `"${l.location.replace(/"/g, '""')}"`,
    l.status,
    `"${l.details.replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `SamkoCentral_Recent_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getDigitalBotLogs(): AuditLogEntry[] {
  const all = getRecentLogs();
  return all.filter((l) => {
    const email = (l.actorEmail || '').toLowerCase();
    const name = (l.actorName || '').toLowerCase();
    return email.includes('digitalbot') || name.includes('digital bot');
  });
}
