import { COMPLIANCE_MASTER_ITEMS } from '@/data/complianceMasterData';
// ─── SAMKOCENTRAL MOCK DATA ───────────────────────────────────────────────────
// Restored to exact main branch / production dataset

export type SiteStatus = 'operational' | 'maintenance' | 'at-risk';
export type RiskLevel = 'low' | 'medium' | 'high';
export type DocStatus = 'ok' | 'warning' | 'critical';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'open' | 'in-progress' | 'completed';
export type AlertType = 'critical' | 'warning' | 'info';
export type VendorStatus = 'ok' | 'warning' | 'critical';

export interface Site {
  id: string;
  name: string;
  type: 'Hotel';
  city: string;
  status: SiteStatus;
  risk: RiskLevel;
  manager: string;
  phone: string;
  openIssues: number;
  compliance: number;
  address: string;
}

export interface Document {
  id: string;
  name: string;
  site: string;
  category: string;
  department?: string;
  expiry: string;
  status: DocStatus;
  size: string;
  uploaded: string;
  uploadedBy: string;
  version: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  notes?: string;
  approvalStatus?: 'pending' | 'hold' | 'approved';
  approvedBy?: string;
  approvedDate?: string;
  approvalNotes?: string;
}

export interface ComplianceItem {
  id: string;
  item: string;
  site: string;
  category: string;
  dueDate: string;
  status: DocStatus;
  assignee: string;
  lastReviewed: string;
  notes: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  sites: string[];
  contractExpiry: string;
  insuranceExpiry: string;
  status: VendorStatus;
  contact: string;
  email: string;
  phone: string;
  value: string;
}

export interface Task {
  id: string;
  title: string;
  site: string;
  priority: TaskPriority;
  due: string;
  status: TaskStatus;
  assignee: string;
  category: string;
  description: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  message: string;
  time: string;
  site: string;
}

export const SITES: Site[] = [
  {
    id: 'site-001',
    name: 'Crowne Plaza Kingston-south',
    type: 'Hotel',
    city: 'London',
    status: 'operational',
    risk: 'low',
    manager: 'Marcus Webb',
    phone: '+44 20 8546 0100',
    openIssues: 1,
    compliance: 96,
    address: 'Kingston Road, Kingston upon Thames, London',
  },
  {
    id: 'site-002',
    name: 'Stanhill Court',
    type: 'Hotel',
    city: 'Surrey',
    status: 'operational',
    risk: 'medium',
    manager: 'Sarah Chen',
    phone: '+44 1293 862 166',
    openIssues: 1,
    compliance: 88,
    address: 'Stanhill Road, Charlwood, Horley, Surrey',
  },
  
];

export const DOCUMENTS: Document[] = [
  {
    id: 'doc-001',
    name: 'Fire Risk Assessment 2026.pdf',
    site: 'Crowne Plaza Kingston-south',
    category: 'Compliance',
    expiry: '2026-06-01',
    status: 'ok',
    size: '2.4 MB',
    uploaded: '2026-06-01',
    uploadedBy: 'Marcus Webb',
    version: 'v2.1',
    approvalStatus: 'approved',
  },
  {
    id: 'doc-002',
    name: 'Insurance Policy Schedule 2026-27.pdf',
    site: 'Stanhill Court',
    category: 'Insurance',
    expiry: '2027-06-30',
    status: 'ok',
    size: '1.8 MB',
    uploaded: '2026-07-01',
    uploadedBy: 'Digital Bot',
    version: 'v1.0',
    approvalStatus: 'approved',
  },
  {
    id: 'doc-003',
    name: 'Health & Safety Compliance Audit.pdf',
    site: 'Stanhill Court',
    category: 'Compliance',
    expiry: '2027-01-10',
    status: 'ok',
    size: '3.1 MB',
    uploaded: '2026-08-15',
    uploadedBy: 'Sarah Chen',
    version: 'v1.4',
    approvalStatus: 'approved',
  },
];

export const COMPLIANCE: ComplianceItem[] = COMPLIANCE_MASTER_ITEMS.map((c) => ({
  id: c.id,
  item: c.name,
  site: c.property,
  category: c.category,
  dueDate: c.expiryDate || c.dueDate || '',
  status: c.status === 'overdue' ? 'critical' : c.status === 'expiring-soon' ? 'warning' : 'ok',
  assignee: c.responsiblePerson,
  lastReviewed: c.lastInspection || c.issueDate || '',
  notes: c.notes,
  complianceType: c.complianceType,
  section: c.section,
  portal: c.portal,
}));

export const TASKS: Task[] = [
  {
    id: 'task-001',
    title: 'Renew gas safety certificate – Crowne Plaza',
    site: 'Crowne Plaza Kingston-south',
    priority: 'urgent',
    due: '2026-11-30',
    status: 'open',
    assignee: 'Marcus Webb',
    category: 'Gas Safety',
    description:
      'Annual gas installation safety inspection to be scheduled with certified gas engineer.',
  },
  {
    id: 'task-002',
    title: 'Water hygiene & legionella testing – Stanhill Court',
    site: 'Stanhill Court',
    priority: 'high',
    due: '2026-12-05',
    status: 'in-progress',
    assignee: 'Sarah Chen',
    category: 'Water Hygiene',
    description: 'Monthly sentinel temperature checks and legionella water sample collection.',
  },
  {
    id: 'task-003',
    title: 'LOLER Lift periodic service – Stanhill Court',
    site: 'Stanhill Court',
    priority: 'medium',
    due: '2026-12-15',
    status: 'open',
    assignee: 'Marcus Webb',
    category: 'Plant & Machinery',
    description:
      'Coordinate with Otis engineer for scheduled maintenance and lubrication of lift mechanism.',
  },
];

export const ALERTS: Alert[] = [
  {
    id: 'alert-001',
    type: 'critical',
    message: 'Gas Safety Certificate due for renewal – Crowne Plaza Kingston-south',
    time: 'Today, 09:00',
    site: 'Crowne Plaza Kingston-south',
  },
  {
    id: 'alert-002',
    type: 'warning',
    message: 'Fire Alarm Certificate due in 25 days – Stanhill Court',
    time: 'Yesterday, 14:30',
    site: 'Stanhill Court',
  },
  {
    id: 'alert-003',
    type: 'info',
    message: 'Passenger Lift LOLER inspection verified – Stanhill Court',
    time: '2 days ago',
    site: 'Stanhill Court',
  },
];

export const REFERENCE_DATE = '2026-05-29';

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const ref = new Date(REFERENCE_DATE);
  return Math.ceil((target.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDateGB(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' });
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

export const COMPLIANCE_TREND = [
  { week: 'W1 Mar', score: 88, critical: 2, warnings: 4 },
  { week: 'W2 Mar', score: 86, critical: 3, warnings: 3 },
  { week: 'W3 Mar', score: 84, critical: 3, warnings: 5 },
  { week: 'W4 Mar', score: 87, critical: 2, warnings: 4 },
  { week: 'W1 Apr', score: 85, critical: 2, warnings: 4 },
  { week: 'W2 Apr', score: 83, critical: 3, warnings: 5 },
  { week: 'W3 Apr', score: 80, critical: 4, warnings: 4 },
  { week: 'W4 Apr', score: 82, critical: 3, warnings: 4 },
  { week: 'W1 May', score: 79, critical: 4, warnings: 5 },
  { week: 'W2 May', score: 77, critical: 5, warnings: 4 },
  { week: 'W3 May', score: 75, critical: 5, warnings: 4 },
  { week: 'W4 May', score: 73, critical: 6, warnings: 4 },
];

export const MOCK_USERS = [
  {
    role: 'Group Admin',
    email: 'g.admin@samkocentral.co.uk',
    password: 'SamkoCentral2026!',
    name: 'George Ashworth',
    initials: 'GA',
  },
  {
    role: 'Site Manager',
    email: 's.chen@samkocentral.co.uk',
    password: 'SiteManager2026!',
    name: 'Sarah Chen',
    initials: 'SC',
  },
  {
    role: 'Compliance Officer',
    email: 'c.officer@samkocentral.co.uk',
    password: 'Compliance2026!',
    name: 'Claire Oduya',
    initials: 'CO',
  },
];
