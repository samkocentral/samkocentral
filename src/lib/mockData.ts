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

export const COMPLIANCE: ComplianceItem[] = [
  {
    "id": "comp-cp-1",
    "item": "Fire Risk Assessment (FRA)",
    "site": "Crowne Plaza Kingston-south",
    "category": "Fire Safety",
    "dueDate": "2027-04-27",
    "status": "ok",
    "assignee": "Nathan Coote",
    "lastReviewed": "2026-04-27",
    "notes": "Standard: Regulatory Reform (Fire Safety) Order 2005. Contractor: Peninsula. Frequency: Yearly."
  },
  {
    "id": "comp-cp-2",
    "item": "Fire Alarm Service",
    "site": "Crowne Plaza Kingston-south",
    "category": "Fire Safety",
    "dueDate": "2026-10-14",
    "status": "critical",
    "assignee": "Nathan Coote",
    "lastReviewed": "2026-04-14",
    "notes": "Standard: BS 5839. Contractor: City Fire. Frequency: 6 Months."
  },
  {
    "id": "comp-cp-3",
    "item": "Emergency Lighting Service",
    "site": "Crowne Plaza Kingston-south",
    "category": "Fire Safety",
    "dueDate": "2027-04-14",
    "status": "ok",
    "assignee": "Nathan Coote",
    "lastReviewed": "2026-04-14",
    "notes": "Standard: BS 5266-1:2025 / BS EN 50172 / BS EN 1838. Contractor: City Fire. Frequency: Yearly."
  },
  {
    "id": "comp-cp-4",
    "item": "Dry Riser Test",
    "site": "Crowne Plaza Kingston-south",
    "category": "Fire Safety",
    "dueDate": "2027-01-30",
    "status": "ok",
    "assignee": "Nathan Coote",
    "lastReviewed": "2026-01-30",
    "notes": "Standard: BS 9990:2015. Contractor: Dry Risers Direct. Frequency: Yearly."
  },
  {
    "id": "comp-cp-5",
    "item": "Fire Door Inspectation",
    "site": "Crowne Plaza Kingston-south",
    "category": "Fire Safety",
    "dueDate": "2026-08-29",
    "status": "critical",
    "assignee": "Nathan Coote",
    "lastReviewed": "2026-02-27",
    "notes": "Standard: Regulatory Reform (Fire Safety) Order 2005. Contractor: Internal team. Frequency: 6 Months."
  },
  {
    "id": "comp-cp-6",
    "item": "Fire Extinguisher",
    "site": "Crowne Plaza Kingston-south",
    "category": "Fire Safety",
    "dueDate": "2027-03-13",
    "status": "ok",
    "assignee": "Nathan Coote",
    "lastReviewed": "2026-03-13",
    "notes": "Standard: Regulatory Reform (Fire Safety) Order 2005. Contractor: City Fire. Frequency: Yearly."
  },
  {
    "id": "comp-cp-7",
    "item": "Fire Drill Evacuation",
    "site": "Crowne Plaza Kingston-south",
    "category": "Fire Safety",
    "dueDate": "2026-10-14",
    "status": "critical",
    "assignee": "Nathan Coote",
    "lastReviewed": "2026-04-14",
    "notes": "Standard: Regulatory Reform (Fire Safety) Order 2005. Contractor: Internal team. Frequency: 6 Months."
  },
  {
    "id": "comp-cp-8",
    "item": "Kitchen Fire Supression System Inspections",
    "site": "Crowne Plaza Kingston-south",
    "category": "Fire Safety",
    "dueDate": "2026-09-11",
    "status": "critical",
    "assignee": "Nathan Coote",
    "lastReviewed": "2026-03-12",
    "notes": "Standard: Regulatory Reform (Fire Safety) Order 2005. Contractor: Ansul. Frequency: 6 Months."
  },
  {
    "id": "comp-cp-9",
    "item": "Duct Cleaning",
    "site": "Crowne Plaza Kingston-south",
    "category": "Fire Safety",
    "dueDate": "2026-09-10",
    "status": "critical",
    "assignee": "Nathan Coote",
    "lastReviewed": "2026-03-11",
    "notes": "Standard: BESA TR19 Grease. Contractor: Internal. Frequency: 6 Months."
  },
  {
    "id": "comp-cp-10",
    "item": "Linen Chute Inspectation",
    "site": "Crowne Plaza Kingston-south",
    "category": "Fire Safety",
    "dueDate": "2026-12-10",
    "status": "critical",
    "assignee": "Nathan Coote",
    "lastReviewed": "2025-12-10",
    "notes": "Standard: Regulatory Reform (Fire Safety) Order 2005. Contractor: Hardall International Limited. Frequency: Yearly."
  },
  {
    "id": "comp-cp-11",
    "item": "Boiler Service",
    "site": "Crowne Plaza Kingston-south",
    "category": "Gas Safety",
    "dueDate": "2026-10-02",
    "status": "critical",
    "assignee": "Nathan Coote",
    "lastReviewed": "2025-10-02",
    "notes": "Standard: Gas Safety (Installation and Use) Regulations 1998. Contractor: Industraheat. Frequency: Yearly."
  },
  {
    "id": "comp-cp-12",
    "item": "Boiler Service",
    "site": "Crowne Plaza Kingston-south",
    "category": "Gas Safety",
    "dueDate": "2026-10-02",
    "status": "critical",
    "assignee": "Nathan Coote",
    "lastReviewed": "2025-10-02",
    "notes": "Standard: Gas Safety (Installation and Use) Regulations 1998. Contractor: Industraheat. Frequency: Yearly."
  },
  {
    "id": "comp-cp-13",
    "item": "Commercial Gas Safety Certificate – Boilers (CP15)",
    "site": "Crowne Plaza Kingston-south",
    "category": "Gas Safety",
    "dueDate": "2026-04-15",
    "status": "critical",
    "assignee": "Nathan Coote",
    "lastReviewed": "2025-04-15",
    "notes": "Standard: Gas Safety (Installation and Use) Regulations 1998. Contractor: First Call Limited. Frequency: Yearly."
  },
  {
    "id": "comp-cp-14",
    "item": "Commercial Catering Gas Safety Certificate – Kitchen (CP42)",
    "site": "Crowne Plaza Kingston-south",
    "category": "Gas Safety",
    "dueDate": "2026-04-15",
    "status": "critical",
    "assignee": "Nathan Coote",
    "lastReviewed": "2025-04-15",
    "notes": "Standard: Gas Safety (Installation and Use) Regulations 1998. Contractor: First Call Limited. Frequency: Yearly."
  },
  {
    "id": "comp-cp-15",
    "item": "Lift Service",
    "site": "Crowne Plaza Kingston-south",
    "category": "Lifting Equipment",
    "dueDate": "2026-10-02",
    "status": "critical",
    "assignee": "Nathan Coote",
    "lastReviewed": "2026-04-02",
    "notes": "Standard: LOLER 1998. Contractor: Schindler. Frequency: 6 months."
  },
  {
    "id": "comp-cp-16",
    "item": "Lift Service",
    "site": "Crowne Plaza Kingston-south",
    "category": "Lifting Equipment",
    "dueDate": "2026-10-02",
    "status": "critical",
    "assignee": "Nathan Coote",
    "lastReviewed": "2026-04-02",
    "notes": "Standard: LOLER 1998. Contractor: Schindler. Frequency: 6 months."
  },
  {
    "id": "comp-cp-17",
    "item": "Lift Service",
    "site": "Crowne Plaza Kingston-south",
    "category": "Lifting Equipment",
    "dueDate": "2026-10-02",
    "status": "critical",
    "assignee": "Nathan Coote",
    "lastReviewed": "2026-04-02",
    "notes": "Standard: LOLER 1998. Contractor: Schindler. Frequency: 6 months."
  },
  {
    "id": "comp-cp-18",
    "item": "Health & Safety Visit",
    "site": "Crowne Plaza Kingston-south",
    "category": "Health & Safety",
    "dueDate": "2027-01-27",
    "status": "ok",
    "assignee": "Nathan Coote",
    "lastReviewed": "2026-01-27",
    "notes": "Standard: Health & Safety Visit Act 1974. Contractor: Peninsula. Frequency: Yearly."
  },
  {
    "id": "comp-cp-19",
    "item": "PAT Test",
    "site": "Crowne Plaza Kingston-south",
    "category": "Electrical Safety",
    "dueDate": "2027-05-21",
    "status": "ok",
    "assignee": "Nathan Coote",
    "lastReviewed": "2026-05-21",
    "notes": "Standard: Electricity at Work Regulations 1989. Contractor: Blacksure Services. Frequency: Yearly."
  },
  {
    "id": "comp-cp-20",
    "item": "Food Hygiene Rating",
    "site": "Crowne Plaza Kingston-south",
    "category": "Food Safety",
    "dueDate": "2027-12-31",
    "status": "ok",
    "assignee": "Nathan Coote",
    "lastReviewed": "2024-06-04",
    "notes": "Standard: Food Safety Act 1990. Contractor: Elmbridge Council. Frequency: N/A."
  },
  {
    "id": "comp-cp-21",
    "item": "Air Conditioning Service",
    "site": "Crowne Plaza Kingston-south",
    "category": "HVAC",
    "dueDate": "2026-01-01",
    "status": "critical",
    "assignee": "Nathan Coote",
    "lastReviewed": "2025-01-01",
    "notes": "Standard: Gas Regulations 2015. Contractor: Baseline. Frequency: Yearly."
  },
  {
    "id": "comp-cp-22",
    "item": "PPL PRS Licence",
    "site": "Crowne Plaza Kingston-south",
    "category": "Licensing",
    "dueDate": "2027-01-20",
    "status": "ok",
    "assignee": "Nathan Coote",
    "lastReviewed": "2026-01-21",
    "notes": "Standard: Copyright, Designs and Patents Act 1988. Contractor: PPL PRS. Frequency: Yearly."
  },
  {
    "id": "comp-cp-23",
    "item": "MPLC",
    "site": "Crowne Plaza Kingston-south",
    "category": "Licensing",
    "dueDate": "2026-09-21",
    "status": "critical",
    "assignee": "Nathan Coote",
    "lastReviewed": "2025-09-21",
    "notes": "Standard: Copyright, Designs and Patents Act 1988. Contractor: MPLC. Frequency: Yearly."
  },
  {
    "id": "comp-cp-24",
    "item": "Wedding License",
    "site": "Crowne Plaza Kingston-south",
    "category": "Licensing",
    "dueDate": "2026-12-13",
    "status": "ok",
    "assignee": "Nathan Coote",
    "lastReviewed": "2025-12-13",
    "notes": "Standard: Marriages and Civil Partnerships (Approved Premises) Regulations 200. Contractor: Elmbridge Council. Frequency: Yearly."
  },
  {
    "id": "comp-cp-25",
    "item": "TV License",
    "site": "Crowne Plaza Kingston-south",
    "category": "Licensing",
    "dueDate": "2026-01-01",
    "status": "critical",
    "assignee": "Nathan Coote",
    "lastReviewed": "2025-01-01",
    "notes": "Standard: Communications Act 2003. Contractor: Tv Licensing. Frequency: Yearly."
  },
  {
    "id": "comp-cp-26",
    "item": "Data Protection Registration  Certificate",
    "site": "Crowne Plaza Kingston-south",
    "category": "Licensing",
    "dueDate": "2026-01-01",
    "status": "critical",
    "assignee": "Nathan Coote",
    "lastReviewed": "2025-01-01",
    "notes": "Standard: Data Protection (Charges and Information) Regulations 2018. Contractor: DPRC. Frequency: Yearly."
  },
  {
    "id": "comp-cp-27",
    "item": "Pest Control",
    "site": "Crowne Plaza Kingston-south",
    "category": "Food Safety",
    "dueDate": "2026-04-26",
    "status": "critical",
    "assignee": "Nathan Coote",
    "lastReviewed": "2026-01-26",
    "notes": "Standard: Food Safety Act 1990. Contractor: Nuture. Frequency: 3 Months."
  },
  {
    "id": "comp-cp-28",
    "item": "Legionella Bacteria Water Risk Assessment",
    "site": "Crowne Plaza Kingston-south",
    "category": "Water Safety",
    "dueDate": "2027-01-22",
    "status": "ok",
    "assignee": "Kevin Davis",
    "lastReviewed": "2025-01-22",
    "notes": "Standard: HSE ACOP L8 / HSG274. Contractor: Guardian. Frequency: 2 Years."
  },
  {
    "id": "comp-cp-29",
    "item": "Asbestos",
    "site": "Crowne Plaza Kingston-south",
    "category": "Asbestos Managenment",
    "dueDate": "2027-12-31",
    "status": "ok",
    "assignee": "Kevin Davis",
    "lastReviewed": "2025-09-18",
    "notes": "Standard: Control of Asbestos Regulations 2012. Contractor: PCA. Frequency: N/A."
  },
  {
    "id": "comp-cp-30",
    "item": "LOLER",
    "site": "Crowne Plaza Kingston-south",
    "category": "Lifting Equipment",
    "dueDate": "2027-02-17",
    "status": "ok",
    "assignee": "Kevin Davis",
    "lastReviewed": "2026-08-18",
    "notes": "Standard: LOLER 1998. Contractor: Allianz. Frequency: 6 Months."
  },
  {
    "id": "comp-cp-31",
    "item": "LOLER",
    "site": "Crowne Plaza Kingston-south",
    "category": "Lifting Equipment",
    "dueDate": "2027-02-17",
    "status": "ok",
    "assignee": "Kevin Davis",
    "lastReviewed": "2026-08-18",
    "notes": "Standard: LOLER 1998. Contractor: Allianz. Frequency: 6 Months."
  },
  {
    "id": "comp-cp-32",
    "item": "LOLER",
    "site": "Crowne Plaza Kingston-south",
    "category": "Lifting Equipment",
    "dueDate": "2027-02-17",
    "status": "ok",
    "assignee": "Kevin Davis",
    "lastReviewed": "2026-08-18",
    "notes": "Standard: LOLER 1998. Contractor: Allianz. Frequency: 6 Months."
  },
  {
    "id": "comp-cp-33",
    "item": "Lightning Protection",
    "site": "Crowne Plaza Kingston-south",
    "category": "Electrical Safety",
    "dueDate": "2026-08-05",
    "status": "ok",
    "assignee": "Kevin Davis",
    "lastReviewed": "2025-08-05",
    "notes": "Standard: BS EN 62305. Contractor: Strike Control. Frequency: Yearly."
  },
  {
    "id": "comp-cp-34",
    "item": "External Wall Assessment FRAEW",
    "site": "Crowne Plaza Kingston-south",
    "category": "Fire Safety",
    "dueDate": "2027-12-31",
    "status": "ok",
    "assignee": "Kevin Davis",
    "lastReviewed": "2025-08-19",
    "notes": "Standard: Regulatory Reform (Fire Safety) Order 2005. Contractor: City Fire. Frequency: N/A."
  },
  {
    "id": "comp-cp-35",
    "item": "Energy Performance Certificate",
    "site": "Crowne Plaza Kingston-south",
    "category": "Electrical Safety",
    "dueDate": "2028-04-13",
    "status": "ok",
    "assignee": "Kevin Davis",
    "lastReviewed": "2018-04-16",
    "notes": "Standard: BS EN 62305. Contractor: Elmbridge Conuncil. Frequency: 10 years."
  },
  {
    "id": "comp-cp-36",
    "item": "Electrical Installation Condition Report",
    "site": "Crowne Plaza Kingston-south",
    "category": "Electrical Safety",
    "dueDate": "2029-09-15",
    "status": "ok",
    "assignee": "Kevin Davis",
    "lastReviewed": "2024-09-16",
    "notes": "Standard: BS EN 62305. Contractor: NICEIC. Frequency: 5 Years."
  }
];

export const VENDORS: Vendor[] = [
  {
    id: 'ven-001',
    name: 'Otis Lifts UK',
    category: 'Lift Maintenance',
    sites: ['Crowne Plaza Kingston-south', 'Stanhill Court'],
    contractExpiry: '2027-05-31',
    insuranceExpiry: '2027-06-30',
    status: 'ok',
    contact: 'Service Desk',
    email: 'service@otis.com',
    phone: '0800 181 363',
    value: '£4,500/yr',
  },
  {
    id: 'ven-002',
    name: 'Chubb Fire & Security',
    category: 'Life Safety',
    sites: ['Stanhill Court', 'Crowne Plaza Kingston-south'],
    contractExpiry: '2027-02-28',
    insuranceExpiry: '2027-04-30',
    status: 'ok',
    contact: 'Contracts Desk',
    email: 'contracts@chubbfs.com',
    phone: '0800 321 666',
    value: '£2,800/yr',
  },
  {
    id: 'ven-003',
    name: 'British Gas Business',
    category: 'Utilities',
    sites: ['Crowne Plaza Kingston-south'],
    contractExpiry: '2027-09-30',
    insuranceExpiry: '2028-01-01',
    status: 'ok',
    contact: 'Corporate Team',
    email: 'business@britishgas.co.uk',
    phone: '0800 048 0202',
    value: '£38,400/yr',
  },
];

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
