import { RoleLevel } from '@/lib/authContext';
import {
  AuditLogEntry,
  AuditDiff,
  getRealAuditLogs,
  exportAuditLogsToCSV,
  recordAuditLog,
  isBotLog,
} from '@/lib/auditLogger';

export type { AuditLogEntry, AuditDiff };
export { exportAuditLogsToCSV, recordAuditLog, isBotLog };

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
    email: 'viewer@samkocentral.com',
    name: 'David Park',
    roleLevel: 'L4',
    roleTitle: 'External Stakeholder',
    initials: 'DP',
    badgeColor: '#94a3b8',
  },
  {
    email: 'aruna@samkocentral.com',
    name: 'Aruna',
    roleLevel: 'L4',
    roleTitle: 'Viewer (Read-Only)',
    initials: 'AJ',
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

/**
 * Returns dynamic, REAL audit logs.
 * Strictly hides Digital Bot logs from all non-bot users (including admins).
 */
export function getRecentLogs(currentUser?: any): AuditLogEntry[] {
  return getRealAuditLogs(currentUser);
}

export const INITIAL_AUDIT_LOGS = getRecentLogs();

/**
 * Returns Digital Bot logs ONLY if the current authenticated user is Digital Bot.
 */
export function getDigitalBotLogs(currentUser?: any): AuditLogEntry[] {
  // If not on client or user not supplied, check localStorage
  let user = currentUser;
  let isPreviewMode = false;
  if (!user && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('samko_auth_user');
      if (raw) user = JSON.parse(raw);
      isPreviewMode = Boolean(localStorage.getItem('samko_original_admin'));
    } catch {}
  }

  const isStrictDigitalBot = Boolean(
    !isPreviewMode &&
    (user?.id === 'usr-bot-001' ||
     user?.email?.toLowerCase() === 'digitalbot@samkocentral.com' ||
     user?.name?.toLowerCase().includes('digital bot'))
  );

  // Requirement: Strictly hide Digital Bot logs from all other users including the admin!
  if (!isStrictDigitalBot) {
    return [];
  }

  const all = getRecentLogs(user);
  return all.filter((l) => isBotLog(l));
}
