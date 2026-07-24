// ─── SAMKOCENTRAL MOCK DATA ───────────────────────────────────────────────────
// Backend integration point: replace these with API calls to your data layer

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
  expiry: string;
  status: DocStatus;
  size: string;
  uploaded: string;
  uploadedBy: string;
  version: string;
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
    risk: 'medium',
    manager: 'Marcus Webb',
    phone: '+44 20 8546 0100',
    openIssues: 8,
    compliance: 72,
    address: 'Holiday Inn, Kingston House Estate, Portsmouth Rd, Thames Ditton, Surbiton KT6 5QG',
  },
  {
    id: 'site-002',
    name: 'Stanhill Court',
    type: 'Hotel',
    city: 'Surrey',
    status: 'at-risk',
    risk: 'high',
    manager: 'Sarah Chen',
    phone: '+44 1293 862 166',
    openIssues: 10,
    compliance: 58,
    address: 'Stanhill Road, Charlwood, Horley, Surrey RH6 0EP',
  },
  {
    id: 'site-003',
    name: 'Hampton 1 & 2',
    type: 'Hotel',
    city: 'Surrey',
    status: 'at-risk',
    risk: 'high',
    manager: 'James Okafor',
    phone: '+44 20 8941 0200',
    openIssues: 7,
    compliance: 55,
    address: 'Kingston House Estate, Portsmouth Rd, Long Ditton, Surbiton KT6 5QG',
  },
  {
    id: 'site-004',
    name: 'Ravens Ait Island',
    type: 'Hotel',
    city: 'London',
    status: 'at-risk',
    risk: 'high',
    manager: 'Priya Sharma',
    phone: '+44 20 8399 0300',
    openIssues: 12,
    compliance: 48,
    address: "Ravens Ait, Portsmouth Rd, Surbiton KT6 4HN",
  },
  {
    id: 'site-005',
    name: 'River Club',
    type: 'Hotel',
    city: 'London',
    status: 'operational',
    risk: 'medium',
    manager: 'David Thornton',
    phone: '+44 20 8977 0400',
    openIssues: 4,
    compliance: 80,
    address: 'Old Malden Lane, Worcester Park KT4 7PX',
  },
  {
    id: 'site-006',
    name: 'Warren House',
    type: 'Hotel',
    city: 'London',
    status: 'at-risk',
    risk: 'high',
    manager: 'Harshit Gulati',
    phone: '+44 20 8335 6767',
    openIssues: 6,
    compliance: 62,
    address: '19 Warren Road, Kingston upon Thames, Surrey KT2 7HY',
  },
  {
    id: 'site-007',
    name: 'Gatwick Manor (Stanhill Court)',
    type: 'Hotel',
    city: 'Surrey',
    status: 'operational',
    risk: 'low',
    manager: 'Sarah Chen',
    phone: '+44 1293 862 166',
    openIssues: 2,
    compliance: 85,
    address: 'Stanhill Road, Charlwood, Horley, Surrey RH6 0EP',
  },
  {
    id: 'site-008',
    name: 'Sharnbrook',
    type: 'Hotel',
    city: 'Bedfordshire',
    status: 'operational',
    risk: 'low',
    manager: 'Group Admin',
    phone: '+44 1234 000000',
    openIssues: 1,
    compliance: 90,
    address: 'Sharnbrook, Bedfordshire',
  },
];

export const DOCUMENTS: Document[] = [
  {
    id: 'doc-001',
    name: 'Public Liability Insurance',
    site: 'Crowne Plaza Kingston-south',
    category: 'Insurance',
    expiry: '2026-12-25',
    status: 'ok',
    size: '2.4 MB',
    uploaded: '2025-12-24',
    uploadedBy: 'Marcus Webb',
    version: 'v3.1',
  },
  {
    id: 'doc-002',
    name: 'Fire Risk Assessment',
    site: 'Stanhill Court',
    category: 'Fire Safety',
    expiry: '2026-01-08',
    status: 'critical',
    size: '1.1 MB',
    uploaded: '2025-01-08',
    uploadedBy: 'Sarah Chen',
    version: 'v2.0',
  },
  {
    id: 'doc-003',
    name: 'Gas Safety Record',
    site: 'Ravens Ait Island',
    category: 'Gas Safety',
    expiry: '2026-01-01',
    status: 'critical',
    size: '0.8 MB',
    uploaded: '2025-01-01',
    uploadedBy: 'Priya Sharma',
    version: 'v1.4',
  },
  {
    id: 'doc-004',
    name: 'Premises Licence',
    site: 'River Club',
    category: 'Licenses',
    expiry: '2027-01-31',
    status: 'ok',
    size: '3.2 MB',
    uploaded: '2025-01-28',
    uploadedBy: 'David Thornton',
    version: 'v5.0',
  },
  {
    id: 'doc-005',
    name: 'EICR – Electrical Installation Report',
    site: 'Hampton 1 & 2',
    category: 'Electrical',
    expiry: '2028-06-19',
    status: 'ok',
    size: '5.7 MB',
    uploaded: '2025-06-19',
    uploadedBy: 'James Okafor',
    version: 'v1.0',
  },
  {
    id: 'doc-006',
    name: 'Food Hygiene Certificate',
    site: 'Crowne Plaza Kingston-south',
    category: 'Food Hygiene',
    expiry: '2030-06-04',
    status: 'ok',
    size: '0.6 MB',
    uploaded: '2024-06-04',
    uploadedBy: 'Marcus Webb',
    version: 'v2.2',
  },
  {
    id: 'doc-007',
    name: 'Employer Liability Insurance',
    site: 'Crowne Plaza Kingston-south',
    category: 'Insurance',
    expiry: '2026-12-23',
    status: 'ok',
    size: '1.9 MB',
    uploaded: '2025-12-24',
    uploadedBy: 'Marcus Webb',
    version: 'v4.0',
  },
  {
    id: 'doc-008',
    name: 'PAT Testing Record',
    site: 'Ravens Ait Island',
    category: 'Electrical',
    expiry: '2025-10-20',
    status: 'critical',
    size: '1.2 MB',
    uploaded: '2025-10-20',
    uploadedBy: 'Priya Sharma',
    version: 'v1.1',
  },
  {
    id: 'doc-009',
    name: 'Legionella Risk Assessment',
    site: 'Warren House',
    category: 'H&S',
    expiry: '2027-03-06',
    status: 'ok',
    size: '2.1 MB',
    uploaded: '2025-03-06',
    uploadedBy: 'Harshit Gulati',
    version: 'v1.0',
  },
  {
    id: 'doc-010',
    name: 'Lease Agreement – Main Premises',
    site: 'River Club',
    category: 'Lease',
    expiry: '2031-12-31',
    status: 'ok',
    size: '8.1 MB',
    uploaded: '2024-01-05',
    uploadedBy: 'David Thornton',
    version: 'v1.0',
  },
  {
    id: 'doc-011',
    name: 'Fire Risk Assessment',
    site: 'Warren House',
    category: 'Fire Safety',
    expiry: '2026-11-27',
    status: 'ok',
    size: '1.4 MB',
    uploaded: '2025-11-27',
    uploadedBy: 'Harshit Gulati',
    version: 'v3.0',
  },
  {
    id: 'doc-012',
    name: 'Energy Performance Certificate',
    site: 'Warren House',
    category: 'Building Regulations',
    expiry: '2031-08-03',
    status: 'ok',
    size: '0.5 MB',
    uploaded: '2021-07-28',
    uploadedBy: 'Harshit Gulati',
    version: 'v1.0',
  },
  {
    id: 'doc-013',
    name: 'Fire Alarm Inspection',
    site: 'Stanhill Court',
    category: 'Fire Safety',
    expiry: '2026-11-04',
    status: 'ok',
    size: '2.1 MB',
    uploaded: '2026-05-08',
    uploadedBy: 'Sarah Chen',
    version: 'v1.0',
  },
  {
    id: 'doc-014',
    name: 'EICR – Fixed Wire Testing',
    site: 'Stanhill Court',
    category: 'Electrical',
    expiry: '2028-01-31',
    status: 'ok',
    size: '0.9 MB',
    uploaded: '2023-02-01',
    uploadedBy: 'Sarah Chen',
    version: 'v2.1',
  },
  {
    id: 'doc-015',
    name: 'Food Hygiene Rating',
    site: 'Stanhill Court',
    category: 'Food Hygiene',
    expiry: '2030-04-13',
    status: 'ok',
    size: '0.7 MB',
    uploaded: '2024-04-13',
    uploadedBy: 'Sarah Chen',
    version: 'v1.0',
  },
  {
    id: 'doc-016',
    name: 'Employers Liability Insurance',
    site: 'Stanhill Court',
    category: 'Insurance',
    expiry: '2027-01-17',
    status: 'ok',
    size: '3.1 MB',
    uploaded: '2026-01-17',
    uploadedBy: 'Sarah Chen',
    version: 'v2.0',
  },
  {
    id: 'doc-017',
    name: 'Fire Risk Assessment',
    site: 'River Club',
    category: 'Fire Safety',
    expiry: '2027-04-01',
    status: 'ok',
    size: '1.8 MB',
    uploaded: '2026-04-01',
    uploadedBy: 'David Thornton',
    version: 'v1.5',
  },
];

// ─── COMPLIANCE DATA — Seeded from Group_Compliance_Tracker_July ─────────────
export const COMPLIANCE: ComplianceItem[] = [
  // ── CROWNE PLAZA ──
  { id: 'comp-001', item: 'Asbestos Survey', site: 'Crowne Plaza Kingston-south', category: 'H&S', dueDate: '2030-09-18', status: 'ok', assignee: 'Marcus Webb', lastReviewed: '2025-09-18', notes: 'Latest visit confirms no asbestos onsite. Contractor: PCA' },
  { id: 'comp-002', item: 'Fire Door Inspection (Internal)', site: 'Crowne Plaza Kingston-south', category: 'Fire Safety', dueDate: '2026-02-28', status: 'critical', assignee: 'Marcus Webb', lastReviewed: '2025-08-29', notes: 'To be completed by Internal Maintenance team – all defects/remedial work to be listed' },
  { id: 'comp-003', item: 'Fire Alarms Inspection', site: 'Crowne Plaza Kingston-south', category: 'Fire Safety', dueDate: '2026-10-11', status: 'warning', assignee: 'Marcus Webb', lastReviewed: '2026-04-14', notes: '65 current faults with Fire Alarms. Contractor: CityFire' },
  { id: 'comp-004', item: 'Fire Risk Assessment', site: 'Crowne Plaza Kingston-south', category: 'Fire Safety', dueDate: '2027-04-27', status: 'ok', assignee: 'Marcus Webb', lastReviewed: '2026-04-27', notes: 'Completed by Peninsula. Booked with Peninsula for 3/3/2026' },
  { id: 'comp-005', item: 'Fire Extinguisher Inspection', site: 'Crowne Plaza Kingston-south', category: 'Fire Safety', dueDate: '2027-03-13', status: 'ok', assignee: 'Marcus Webb', lastReviewed: '2026-03-13', notes: 'Scheduled for 17/3/2026. Contractor: CityFire' },
  { id: 'comp-006', item: 'Emergency Lighting Service', site: 'Crowne Plaza Kingston-south', category: 'H&S', dueDate: '2027-04-14', status: 'ok', assignee: 'Marcus Webb', lastReviewed: '2026-04-14', notes: 'Faults need to be fixed. Contractor: CityFire' },
  { id: 'comp-007', item: 'Fire Drill Evacuation', site: 'Crowne Plaza Kingston-south', category: 'Fire Safety', dueDate: '2026-10-11', status: 'warning', assignee: 'Marcus Webb', lastReviewed: '2026-04-14', notes: 'Training date to be organised for HR – Fire strategy to be created. Contractor: HR/Maintenance' },
  { id: 'comp-008', item: 'Dry Riser Test', site: 'Crowne Plaza Kingston-south', category: 'H&S', dueDate: '2027-01-30', status: 'ok', assignee: 'Marcus Webb', lastReviewed: '2026-01-30', notes: 'Contractor: Dry Risers Direct' },
  { id: 'comp-009', item: 'Dry Riser Visual Assessment', site: 'Crowne Plaza Kingston-south', category: 'H&S', dueDate: '2026-07-29', status: 'warning', assignee: 'Marcus Webb', lastReviewed: '2026-01-30', notes: 'Contractor: Dry Risers Direct' },
  { id: 'comp-010', item: 'Kitchen Fire Suppression System', site: 'Crowne Plaza Kingston-south', category: 'Fire Safety', dueDate: '2026-09-08', status: 'warning', assignee: 'Marcus Webb', lastReviewed: '2026-03-12', notes: 'Quotation shared to Viktor & Nathan on 08/01/2026 – Awaiting approval. Contractor: Ansul' },
  { id: 'comp-011', item: 'Duct Cleaning', site: 'Crowne Plaza Kingston-south', category: 'H&S', dueDate: '2026-09-07', status: 'warning', assignee: 'Marcus Webb', lastReviewed: '2026-03-11', notes: 'Quotation shared to Viktor & Nathan on 08/01/2026 – Awaiting approval' },
  { id: 'comp-012', item: 'Pest Control', site: 'Crowne Plaza Kingston-south', category: 'H&S', dueDate: '2026-01-02', status: 'critical', assignee: 'Marcus Webb', lastReviewed: '2026-01-26', notes: 'To be handed over to Vel on return from Holiday. Contractor: Nuture' },
  { id: 'comp-013', item: 'Boiler Service (1)', site: 'Crowne Plaza Kingston-south', category: 'H&S', dueDate: '2026-10-02', status: 'warning', assignee: 'Marcus Webb', lastReviewed: '2025-10-02', notes: 'Contractor: Industraheat' },
  { id: 'comp-014', item: 'Boiler Service (2)', site: 'Crowne Plaza Kingston-south', category: 'H&S', dueDate: '2026-10-02', status: 'warning', assignee: 'Marcus Webb', lastReviewed: '2025-10-02', notes: 'Contractor: Industraheat' },
  { id: 'comp-015', item: 'Gas Installation Safety (Boiler)', site: 'Crowne Plaza Kingston-south', category: 'Gas Safety', dueDate: '2026-04-16', status: 'critical', assignee: 'Marcus Webb', lastReviewed: '2025-04-15', notes: 'New visit to be scheduled – not First Call Limited. Contractor: First Call Limited' },
  { id: 'comp-016', item: 'Gas Installation Safety (Commercial Kitchen)', site: 'Crowne Plaza Kingston-south', category: 'Gas Safety', dueDate: '2026-04-15', status: 'critical', assignee: 'Marcus Webb', lastReviewed: '2025-04-15', notes: 'Contractor: First Call Limited' },
  { id: 'comp-017', item: 'Linen Chute Inspection', site: 'Crowne Plaza Kingston-south', category: 'H&S', dueDate: '2026-01-01', status: 'critical', assignee: 'Marcus Webb', lastReviewed: '2025-12-10', notes: 'Remedial work to be completed. Quote of £1,250. Contractor: Hardall International Limited' },
  { id: 'comp-018', item: 'Legionella Risk Assessment', site: 'Crowne Plaza Kingston-south', category: 'H&S', dueDate: '2027-01-22', status: 'ok', assignee: 'Marcus Webb', lastReviewed: '2025-01-22', notes: 'Contractor: Guardian – Kai Smith' },
  { id: 'comp-019', item: 'LOLER – Kitchen (Good Lifts)', site: 'Crowne Plaza Kingston-south', category: 'H&S', dueDate: '2025-01-02', status: 'critical', assignee: 'Marcus Webb', lastReviewed: '2025-01-01', notes: 'All lifts need servicing and repairs. Obtain LOLER certificate from Engineering Insurance' },
  { id: 'comp-020', item: 'LOLER – Staff Lift 2 B+G+4', site: 'Crowne Plaza Kingston-south', category: 'H&S', dueDate: '2025-01-03', status: 'critical', assignee: 'Marcus Webb', lastReviewed: '2025-01-02', notes: 'Lift requires servicing and repairs' },
  { id: 'comp-021', item: 'LOLER – Guest Lift Otis Gen 2', site: 'Crowne Plaza Kingston-south', category: 'H&S', dueDate: '2025-09-04', status: 'critical', assignee: 'Marcus Webb', lastReviewed: '2025-03-04', notes: 'Contractor: Ashdale Engineering' },
  { id: 'comp-022', item: 'Lift Service – Kitchen (Good Lifts)', site: 'Crowne Plaza Kingston-south', category: 'H&S', dueDate: '2026-09-20', status: 'warning', assignee: 'Marcus Webb', lastReviewed: '2026-03-24', notes: 'Service due' },
  { id: 'comp-023', item: 'Lift Service – Staff Lift 2 B+G+4', site: 'Crowne Plaza Kingston-south', category: 'H&S', dueDate: '2026-09-24', status: 'warning', assignee: 'Marcus Webb', lastReviewed: '2026-03-24', notes: 'Service due' },
  { id: 'comp-024', item: 'Lift Service – Otis Gen 2', site: 'Crowne Plaza Kingston-south', category: 'H&S', dueDate: '2026-09-24', status: 'warning', assignee: 'Marcus Webb', lastReviewed: '2026-03-24', notes: 'Contractor: Schindler' },
  { id: 'comp-025', item: 'Health & Safety Visit', site: 'Crowne Plaza Kingston-south', category: 'H&S', dueDate: '2027-01-27', status: 'ok', assignee: 'Marcus Webb', lastReviewed: '2026-01-27', notes: 'Actions to be reviewed. Contractor: Peninsula' },
  { id: 'comp-026', item: 'COSHH Risk Assessment Review', site: 'Crowne Plaza Kingston-south', category: 'H&S', dueDate: '2025-01-01', status: 'critical', assignee: 'Marcus Webb', lastReviewed: '2025-01-01', notes: 'Contractor: Sulthana' },
  { id: 'comp-027', item: 'Portable Appliance Testing (PAT)', site: 'Crowne Plaza Kingston-south', category: 'Electrical', dueDate: '2027-05-21', status: 'ok', assignee: 'Marcus Webb', lastReviewed: '2026-05-21', notes: 'PAT Test Quote shared and work to be booked in. Contractor: Internal Maintenance Team' },
  { id: 'comp-028', item: 'Food Hygiene Rating', site: 'Crowne Plaza Kingston-south', category: 'Food Hygiene', dueDate: '2030-06-04', status: 'ok', assignee: 'Marcus Webb', lastReviewed: '2024-06-04', notes: 'Contractor: Elmbridge Council' },
  { id: 'comp-029', item: 'Lightning Protection', site: 'Crowne Plaza Kingston-south', category: 'H&S', dueDate: '2025-11-05', status: 'critical', assignee: 'Marcus Webb', lastReviewed: '2025-11-05', notes: 'Project work has to be completed before remedial work. Contractor: Strike Control' },
  { id: 'comp-030', item: 'Energy Rating (EPC)', site: 'Crowne Plaza Kingston-south', category: 'Building Regulations', dueDate: '2028-04-15', status: 'ok', assignee: 'Marcus Webb', lastReviewed: '2018-04-16', notes: 'Contractor: Elmhurst Energy Systems Ltd' },
  { id: 'comp-031', item: 'EICR – Fixed Wire Testing', site: 'Crowne Plaza Kingston-south', category: 'Electrical', dueDate: '2029-09-16', status: 'ok', assignee: 'Marcus Webb', lastReviewed: '2024-09-16', notes: 'Contractor: NICEIC' },
  { id: 'comp-032', item: 'Air Conditioning Service', site: 'Crowne Plaza Kingston-south', category: 'H&S', dueDate: '2025-07-03', status: 'critical', assignee: 'Marcus Webb', lastReviewed: '2024-07-02', notes: 'Awaiting schedule of work and quotation. Contractor: Baseline Air Conditioning' },
  { id: 'comp-033', item: 'Employers Liability Insurance', site: 'Crowne Plaza Kingston-south', category: 'Insurance', dueDate: '2026-12-23', status: 'ok', assignee: 'Marcus Webb', lastReviewed: '2025-12-24', notes: 'Contractor: Convex / Ascott / Sompo' },
  { id: 'comp-034', item: 'PPL PRS Licence', site: 'Crowne Plaza Kingston-south', category: 'Licenses', dueDate: '2027-01-20', status: 'ok', assignee: 'Marcus Webb', lastReviewed: '2026-01-21', notes: 'Contractor: PPL RS' },
  { id: 'comp-035', item: 'MPLC Licence', site: 'Crowne Plaza Kingston-south', category: 'Licenses', dueDate: '2026-09-21', status: 'warning', assignee: 'Marcus Webb', lastReviewed: '2025-09-21', notes: 'Contractor: MPLC' },
  { id: 'comp-036', item: 'Wedding License', site: 'Crowne Plaza Kingston-south', category: 'Licenses', dueDate: '2027-12-13', status: 'ok', assignee: 'Marcus Webb', lastReviewed: '2025-12-13', notes: 'Contractor: Surrey County Council' },
  { id: 'comp-037', item: 'Data Protection Registration Certificate', site: 'Crowne Plaza Kingston-south', category: 'Licenses', dueDate: '2025-11-01', status: 'critical', assignee: 'Marcus Webb', lastReviewed: '2024-11-01', notes: 'Renewal required' },

  // ── STANHILL COURT ──
  { id: 'comp-038', item: 'Emergency Lighting', site: 'Stanhill Court', category: 'H&S', dueDate: '2026-07-16', status: 'critical', assignee: 'Sarah Chen', lastReviewed: '2025-07-15', notes: 'Reach out to JB or Westside to complete. Contractor: Westside Electrical Contractors Limited' },
  { id: 'comp-039', item: 'Fire Extinguisher Inspection', site: 'Stanhill Court', category: 'Fire Safety', dueDate: '2027-01-08', status: 'ok', assignee: 'Sarah Chen', lastReviewed: '2026-01-08', notes: 'Need latest document update. Contractor: Fire Protection Services' },
  { id: 'comp-040', item: 'Fire Risk Assessment', site: 'Stanhill Court', category: 'Fire Safety', dueDate: '2026-01-08', status: 'critical', assignee: 'Sarah Chen', lastReviewed: '2025-01-08', notes: 'Once all assessments done, arrange FRA. Contractor: Fire Protection Services' },
  { id: 'comp-041', item: 'Fire Door Inspection', site: 'Stanhill Court', category: 'Fire Safety', dueDate: '2026-01-08', status: 'critical', assignee: 'Sarah Chen', lastReviewed: '2025-01-08', notes: 'Have John inspect all fire doors and document' },
  { id: 'comp-042', item: 'Fire Alarm Inspection', site: 'Stanhill Court', category: 'Fire Safety', dueDate: '2026-11-04', status: 'ok', assignee: 'Sarah Chen', lastReviewed: '2026-05-08', notes: 'Contractor: JB Fire Systems Ltd' },
  { id: 'comp-043', item: 'Fire Alarm Inspection (Staff Accommodation)', site: 'Stanhill Court', category: 'Fire Safety', dueDate: '2027-01-13', status: 'ok', assignee: 'Sarah Chen', lastReviewed: '2026-07-15', notes: 'Valid' },
  { id: 'comp-044', item: 'Fire Drill Evacuation', site: 'Stanhill Court', category: 'Fire Safety', dueDate: '2026-04-12', status: 'critical', assignee: 'Sarah Chen', lastReviewed: '2025-10-14', notes: 'Complete ASAP and send proof. Peninsula Fire Drill Evac sheet attached' },
  { id: 'comp-045', item: 'Duct Cleaning', site: 'Stanhill Court', category: 'H&S', dueDate: '2026-06-02', status: 'critical', assignee: 'Sarah Chen', lastReviewed: '2025-06-01', notes: 'Arrange a visit to clean ducts. Contractor: NAAD' },
  { id: 'comp-046', item: 'Orangery Boiler Service', site: 'Stanhill Court', category: 'H&S', dueDate: '2026-09-23', status: 'warning', assignee: 'Sarah Chen', lastReviewed: '2025-09-22', notes: 'Contractor: J&P Services' },
  { id: 'comp-047', item: 'Gas Safety Inspection CP15 – Orangery Boiler', site: 'Stanhill Court', category: 'Gas Safety', dueDate: '2024-11-22', status: 'critical', assignee: 'Sarah Chen', lastReviewed: '2023-11-23', notes: 'All three boilers need a Gas Safety Inspection – arrange all at same time after serviced' },
  { id: 'comp-048', item: 'Gas Safety Inspection (Non-Domestic Boiler)', site: 'Stanhill Court', category: 'Gas Safety', dueDate: '2026-09-15', status: 'warning', assignee: 'Sarah Chen', lastReviewed: '2025-09-15', notes: 'Contractor: Sonny Moore' },
  { id: 'comp-049', item: 'Pest Control', site: 'Stanhill Court', category: 'H&S', dueDate: '2026-05-30', status: 'critical', assignee: 'Sarah Chen', lastReviewed: '2026-03-01', notes: 'Contracts need to be renewed' },
  { id: 'comp-050', item: 'PAT Test', site: 'Stanhill Court', category: 'Electrical', dueDate: '2027-12-13', status: 'ok', assignee: 'Sarah Chen', lastReviewed: '2026-12-13', notes: 'Locate document to prove test completed. Contractor: Westside Electrical Contractors Limited' },
  { id: 'comp-051', item: 'EICR – Fixed Wire Testing', site: 'Stanhill Court', category: 'Electrical', dueDate: '2028-01-31', status: 'ok', assignee: 'Sarah Chen', lastReviewed: '2023-02-01', notes: 'Contractor: Westside Electrical Contractors Limited' },
  { id: 'comp-052', item: 'Legionella Risk Assessment', site: 'Stanhill Court', category: 'H&S', dueDate: '2026-01-01', status: 'critical', assignee: 'Sarah Chen', lastReviewed: '2024-01-01', notes: 'Please send latest legionella document' },
  { id: 'comp-053', item: 'LOLER – Lift Inspection', site: 'Stanhill Court', category: 'H&S', dueDate: '2026-01-01', status: 'critical', assignee: 'Sarah Chen', lastReviewed: '2024-01-01', notes: 'Engineering insurance being placed for the lifts to give LOLER certificate' },
  { id: 'comp-054', item: 'Lift Service', site: 'Stanhill Court', category: 'H&S', dueDate: '2026-03-24', status: 'critical', assignee: 'Sarah Chen', lastReviewed: '2025-09-25', notes: 'Organise a Lift service. Contractor: United Lift Service' },
  { id: 'comp-055', item: 'Health & Safety Visit', site: 'Stanhill Court', category: 'H&S', dueDate: '2026-05-20', status: 'critical', assignee: 'Sarah Chen', lastReviewed: '2025-05-20', notes: 'Contractor: Peninsula' },
  { id: 'comp-056', item: 'Food Hygiene Rating', site: 'Stanhill Court', category: 'Food Hygiene', dueDate: '2030-04-13', status: 'ok', assignee: 'Sarah Chen', lastReviewed: '2024-04-13', notes: 'Valid' },
  { id: 'comp-057', item: 'Chimney Clean', site: 'Stanhill Court', category: 'H&S', dueDate: '2023-11-14', status: 'critical', assignee: 'Sarah Chen', lastReviewed: '2022-11-14', notes: 'Organise a visit' },
  { id: 'comp-058', item: 'Energy Rating (EPC)', site: 'Stanhill Court', category: 'Building Regulations', dueDate: '2033-10-04', status: 'ok', assignee: 'Sarah Chen', lastReviewed: '2023-10-07', notes: 'Valid' },
  { id: 'comp-059', item: 'Air Conditioning Service', site: 'Stanhill Court', category: 'H&S', dueDate: '2027-08-14', status: 'ok', assignee: 'Sarah Chen', lastReviewed: '2026-08-14', notes: 'Valid' },
  { id: 'comp-060', item: 'Employers Liability Insurance', site: 'Stanhill Court', category: 'Insurance', dueDate: '2027-01-17', status: 'ok', assignee: 'Sarah Chen', lastReviewed: '2026-01-17', notes: 'Valid' },
  { id: 'comp-061', item: 'TV License', site: 'Stanhill Court', category: 'Licenses', dueDate: '2025-12-01', status: 'critical', assignee: 'Sarah Chen', lastReviewed: '2024-12-01', notes: 'Contractor: TV License' },
  { id: 'comp-062', item: 'MPLC Licence', site: 'Stanhill Court', category: 'Licenses', dueDate: '2026-09-05', status: 'warning', assignee: 'Sarah Chen', lastReviewed: '2025-09-06', notes: 'Contractor: MPLC' },
  { id: 'comp-063', item: 'PPL RS Licence', site: 'Stanhill Court', category: 'Licenses', dueDate: '2026-04-12', status: 'critical', assignee: 'Sarah Chen', lastReviewed: '2025-03-12', notes: 'Contractor: PPL RS' },

  // ── RAVENS AIT ──
  { id: 'comp-064', item: 'Duct Cleaning', site: 'Ravens Ait Island', category: 'H&S', dueDate: '2026-09-24', status: 'warning', assignee: 'Priya Sharma', lastReviewed: '2025-09-24', notes: 'Contractor: Clean Eco Tech' },
  { id: 'comp-065', item: 'Asbestos Survey', site: 'Ravens Ait Island', category: 'H&S', dueDate: '2030-09-08', status: 'ok', assignee: 'Priya Sharma', lastReviewed: '2020-09-08', notes: 'Contractor: NSUK' },
  { id: 'comp-066', item: 'EICR Ground Floor', site: 'Ravens Ait Island', category: 'Electrical', dueDate: '2025-09-26', status: 'critical', assignee: 'Priya Sharma', lastReviewed: '2020-08-27', notes: 'Expired – renewal required' },
  { id: 'comp-067', item: 'EICR – Fuse Box Boiler/Hot Water Cylinder', site: 'Ravens Ait Island', category: 'Electrical', dueDate: '2028-02-27', status: 'ok', assignee: 'Priya Sharma', lastReviewed: '2023-02-27', notes: 'Valid' },
  { id: 'comp-068', item: 'EICR Marquee', site: 'Ravens Ait Island', category: 'Electrical', dueDate: '2025-09-14', status: 'critical', assignee: 'Priya Sharma', lastReviewed: '2022-09-14', notes: 'Expired – renewal required' },
  { id: 'comp-069', item: 'EICR Marquee Store', site: 'Ravens Ait Island', category: 'Electrical', dueDate: '2025-09-15', status: 'critical', assignee: 'Priya Sharma', lastReviewed: '2022-09-14', notes: 'Expired – renewal required' },
  { id: 'comp-070', item: 'EICR Flats', site: 'Ravens Ait Island', category: 'Electrical', dueDate: '2025-09-16', status: 'critical', assignee: 'Priya Sharma', lastReviewed: '2022-09-14', notes: 'Expired – renewal required' },
  { id: 'comp-071', item: 'EICR Chiller Room', site: 'Ravens Ait Island', category: 'Electrical', dueDate: '2028-01-26', status: 'ok', assignee: 'Priya Sharma', lastReviewed: '2023-01-26', notes: 'Valid' },
  { id: 'comp-072', item: 'PAT Test', site: 'Ravens Ait Island', category: 'Electrical', dueDate: '2025-10-20', status: 'critical', assignee: 'Priya Sharma', lastReviewed: '2025-10-20', notes: 'Contractor: Internal – Sathish' },
  { id: 'comp-073', item: 'Boiler Service', site: 'Ravens Ait Island', category: 'H&S', dueDate: '2026-01-01', status: 'critical', assignee: 'Priya Sharma', lastReviewed: '2024-01-01', notes: 'Service overdue' },
  { id: 'comp-074', item: 'Legionella Risk Assessment', site: 'Ravens Ait Island', category: 'H&S', dueDate: '2026-01-07', status: 'critical', assignee: 'Priya Sharma', lastReviewed: '2026-01-07', notes: 'Visit commenced in January however no actions completed' },
  { id: 'comp-075', item: 'Health & Safety Visit', site: 'Ravens Ait Island', category: 'H&S', dueDate: '2027-01-22', status: 'ok', assignee: 'Priya Sharma', lastReviewed: '2026-01-22', notes: 'Valid' },
  { id: 'comp-076', item: 'Fire Risk Assessment', site: 'Ravens Ait Island', category: 'Fire Safety', dueDate: '2026-11-12', status: 'ok', assignee: 'Priya Sharma', lastReviewed: '2025-11-12', notes: 'Contractor: Nashyrocks' },
  { id: 'comp-077', item: 'Fire Extinguisher Inspection', site: 'Ravens Ait Island', category: 'Fire Safety', dueDate: '2026-09-29', status: 'warning', assignee: 'Priya Sharma', lastReviewed: '2025-09-29', notes: 'Contractor: City Fire' },
  { id: 'comp-078', item: 'Emergency Light Record', site: 'Ravens Ait Island', category: 'H&S', dueDate: '2025-12-26', status: 'critical', assignee: 'Priya Sharma', lastReviewed: '2025-06-26', notes: 'Contractor: City Fire' },
  { id: 'comp-079', item: 'Fire Alarm Service', site: 'Ravens Ait Island', category: 'Fire Safety', dueDate: '2025-12-26', status: 'critical', assignee: 'Priya Sharma', lastReviewed: '2025-06-26', notes: 'Contractor: City Fire' },
  { id: 'comp-080', item: 'Pest Control Service Report', site: 'Ravens Ait Island', category: 'H&S', dueDate: '2026-04-28', status: 'critical', assignee: 'Priya Sharma', lastReviewed: '2025-08-28', notes: 'Contractor: Nuture' },
  { id: 'comp-081', item: 'Asbestos Register', site: 'Ravens Ait Island', category: 'H&S', dueDate: '2026-01-15', status: 'critical', assignee: 'Priya Sharma', lastReviewed: '2025-01-15', notes: 'Contractor: Internal' },
  { id: 'comp-082', item: 'EPC Rating', site: 'Ravens Ait Island', category: 'Building Regulations', dueDate: '2035-05-01', status: 'ok', assignee: 'Priya Sharma', lastReviewed: '2025-05-01', notes: 'Contractor: Gov.uk' },
  { id: 'comp-083', item: 'TV License', site: 'Ravens Ait Island', category: 'Licenses', dueDate: '2026-06-30', status: 'critical', assignee: 'Priya Sharma', lastReviewed: '2025-06-30', notes: 'Contractor: TV License' },
  { id: 'comp-084', item: 'MPLC Licence', site: 'Ravens Ait Island', category: 'Licenses', dueDate: '2026-09-21', status: 'warning', assignee: 'Priya Sharma', lastReviewed: '2025-09-21', notes: 'Contractor: MPLC' },
  { id: 'comp-085', item: 'PPL RS Licence', site: 'Ravens Ait Island', category: 'Licenses', dueDate: '2027-05-09', status: 'ok', assignee: 'Priya Sharma', lastReviewed: '2026-05-09', notes: 'Contractor: PPL RS' },
  { id: 'comp-086', item: 'Wedding License', site: 'Ravens Ait Island', category: 'Licenses', dueDate: '2026-09-19', status: 'warning', assignee: 'Priya Sharma', lastReviewed: '2023-09-19', notes: 'Contractor: Kingston License' },
  { id: 'comp-087', item: 'Employers Liability Insurance', site: 'Ravens Ait Island', category: 'Insurance', dueDate: '2026-06-09', status: 'critical', assignee: 'Priya Sharma', lastReviewed: '2025-06-09', notes: 'Contractor: Accelerant' },

  // ── WARREN HOUSE ──
  { id: 'comp-088', item: 'Asbestos Survey', site: 'Warren House', category: 'H&S', dueDate: '2030-11-10', status: 'ok', assignee: 'Harshit Gulati', lastReviewed: '2017-11-10', notes: 'Contractor: AV Asbestos' },
  { id: 'comp-089', item: 'Fire Risk Assessment', site: 'Warren House', category: 'Fire Safety', dueDate: '2026-11-27', status: 'ok', assignee: 'Harshit Gulati', lastReviewed: '2025-11-27', notes: 'Contractor: CityFire' },
  { id: 'comp-090', item: 'Gas Installation Safety', site: 'Warren House', category: 'Gas Safety', dueDate: '2026-04-15', status: 'critical', assignee: 'Harshit Gulati', lastReviewed: '2025-04-15', notes: 'Contractor: First Call Limited' },
  { id: 'comp-091', item: 'Legionella Risk Assessment', site: 'Warren House', category: 'H&S', dueDate: '2027-03-06', status: 'ok', assignee: 'Harshit Gulati', lastReviewed: '2025-03-06', notes: 'Contractor: Guardian – Jack Trenoweth' },
  { id: 'comp-092', item: 'Emergency Lights Assessment', site: 'Warren House', category: 'H&S', dueDate: '2025-10-17', status: 'critical', assignee: 'Harshit Gulati', lastReviewed: '2024-10-17', notes: 'Contractor: NICEIC' },
  { id: 'comp-093', item: 'Food Hygiene Rating', site: 'Warren House', category: 'Food Hygiene', dueDate: '2025-07-09', status: 'critical', assignee: 'Harshit Gulati', lastReviewed: '2025-07-09', notes: 'Contractor: Kingston Council' },
  { id: 'comp-094', item: 'Fire Extinguisher Inspection', site: 'Warren House', category: 'Fire Safety', dueDate: '2026-08-21', status: 'warning', assignee: 'Harshit Gulati', lastReviewed: '2025-08-21', notes: 'Contractor: City Fire – Lee Masters' },
  { id: 'comp-095', item: 'Kitchen Fire Suppression System', site: 'Warren House', category: 'Fire Safety', dueDate: '2025-12-17', status: 'critical', assignee: 'Harshit Gulati', lastReviewed: '2024-12-17', notes: 'Contractor: City Fire' },
  { id: 'comp-096', item: 'Energy Rating (EPC)', site: 'Warren House', category: 'Building Regulations', dueDate: '2031-08-03', status: 'ok', assignee: 'Harshit Gulati', lastReviewed: '2021-07-28', notes: 'Contractor: Certifymycompany – Bizhan Jeddi' },
  { id: 'comp-097', item: 'EICR – Orangery', site: 'Warren House', category: 'Electrical', dueDate: '2029-07-09', status: 'ok', assignee: 'Harshit Gulati', lastReviewed: '2024-07-09', notes: 'Contractor: NICEIC – K.Shahla' },
  { id: 'comp-098', item: 'Air Conditioning Assessment', site: 'Warren House', category: 'H&S', dueDate: '2029-05-13', status: 'ok', assignee: 'Harshit Gulati', lastReviewed: '2024-05-13', notes: 'Contractor: MVHR Commissioning' },
  { id: 'comp-099', item: 'Premises Licence (Operating Licence)', site: 'Warren House', category: 'Licenses', dueDate: '2027-02-23', status: 'ok', assignee: 'Harshit Gulati', lastReviewed: '2024-02-23', notes: 'Yearly payment. Contractor: Kingston Council' },
  { id: 'comp-100', item: 'Wedding License', site: 'Warren House', category: 'Licenses', dueDate: '2027-03-12', status: 'ok', assignee: 'Harshit Gulati', lastReviewed: '2024-03-12', notes: 'Contractor: Kingston Council' },
  { id: 'comp-101', item: 'PPL PRS Licence', site: 'Warren House', category: 'Licenses', dueDate: '2026-07-22', status: 'warning', assignee: 'Harshit Gulati', lastReviewed: '2025-07-22', notes: 'Expiring soon' },
  { id: 'comp-102', item: 'TV Licence', site: 'Warren House', category: 'Licenses', dueDate: '2026-02-28', status: 'critical', assignee: 'Harshit Gulati', lastReviewed: '2026-02-28', notes: 'Expired' },
  { id: 'comp-103', item: 'MPLC Licence', site: 'Warren House', category: 'Licenses', dueDate: '2026-09-07', status: 'warning', assignee: 'Harshit Gulati', lastReviewed: '2025-09-07', notes: 'Contractor: MPLC' },
  { id: 'comp-104', item: 'Data Protection Registration Certificate', site: 'Warren House', category: 'Licenses', dueDate: '2025-11-01', status: 'critical', assignee: 'Harshit Gulati', lastReviewed: '2024-11-01', notes: 'Renewal required' },

  // ── RIVER CLUB ──
  { id: 'comp-105', item: 'Asbestos Survey', site: 'River Club', category: 'H&S', dueDate: '2030-03-03', status: 'ok', assignee: 'David Thornton', lastReviewed: '2025-03-03', notes: 'Contractor: Key Asbestos Services' },
  { id: 'comp-106', item: 'Fire Risk Assessment', site: 'River Club', category: 'Fire Safety', dueDate: '2027-04-01', status: 'ok', assignee: 'David Thornton', lastReviewed: '2026-04-01', notes: 'Contractor: Nashyrocks' },
  { id: 'comp-107', item: 'Gas Installation Safety Report', site: 'River Club', category: 'Gas Safety', dueDate: '2026-10-21', status: 'warning', assignee: 'David Thornton', lastReviewed: '2025-10-21', notes: 'Contractor: Plumbsa Plumbing' },
  { id: 'comp-108', item: 'Legionella Risk Assessment', site: 'River Club', category: 'H&S', dueDate: '2025-03-30', status: 'critical', assignee: 'David Thornton', lastReviewed: '2023-03-30', notes: 'Review required. Contractor: Safecare' },
  { id: 'comp-109', item: 'Fire Extinguisher Inspection', site: 'River Club', category: 'Fire Safety', dueDate: '2027-03-27', status: 'ok', assignee: 'David Thornton', lastReviewed: '2026-03-27', notes: 'Valid' },
  { id: 'comp-110', item: 'Fire Alarms Assessment', site: 'River Club', category: 'Fire Safety', dueDate: '2026-01-01', status: 'critical', assignee: 'David Thornton', lastReviewed: '2025-07-01', notes: 'Contractor: Millwood Services' },
  { id: 'comp-111', item: 'Portable Appliance Testing (PAT)', site: 'River Club', category: 'Electrical', dueDate: '2027-01-22', status: 'ok', assignee: 'David Thornton', lastReviewed: '2026-01-22', notes: 'Contractor: MEW Electrical – Mark Wise' },
  { id: 'comp-112', item: 'Emergency Lighting Service', site: 'River Club', category: 'H&S', dueDate: '2027-02-03', status: 'ok', assignee: 'David Thornton', lastReviewed: '2026-02-03', notes: 'Valid' },
  { id: 'comp-113', item: 'Fire Drill Evacuation', site: 'River Club', category: 'Fire Safety', dueDate: '2026-06-16', status: 'critical', assignee: 'David Thornton', lastReviewed: '2025-12-18', notes: 'Overdue' },
  { id: 'comp-114', item: 'Health & Safety Policy Review', site: 'River Club', category: 'H&S', dueDate: '2027-01-25', status: 'ok', assignee: 'David Thornton', lastReviewed: '2026-01-25', notes: 'Valid' },
  { id: 'comp-115', item: 'Intruder Alarm', site: 'River Club', category: 'H&S', dueDate: '2026-11-28', status: 'ok', assignee: 'David Thornton', lastReviewed: '2025-11-28', notes: 'Contractor: Millwood Services' },
  { id: 'comp-116', item: 'Energy Rating (EPC)', site: 'River Club', category: 'Building Regulations', dueDate: '2035-03-06', status: 'ok', assignee: 'David Thornton', lastReviewed: '2025-03-06', notes: 'Valid' },
  { id: 'comp-117', item: 'EICR – Understairs Supply', site: 'River Club', category: 'Electrical', dueDate: '2027-11-15', status: 'ok', assignee: 'David Thornton', lastReviewed: '2022-11-15', notes: 'Valid' },
  { id: 'comp-118', item: 'EICR – Lane Supply', site: 'River Club', category: 'Electrical', dueDate: '2027-11-15', status: 'ok', assignee: 'David Thornton', lastReviewed: '2022-11-15', notes: 'Valid' },
  { id: 'comp-119', item: 'EICR – Dance Studio', site: 'River Club', category: 'Electrical', dueDate: '2023-05-28', status: 'critical', assignee: 'David Thornton', lastReviewed: '2023-05-28', notes: 'Expired – renewal required' },
  { id: 'comp-120', item: 'EICR – Car Wash Hut', site: 'River Club', category: 'Electrical', dueDate: '2027-05-25', status: 'ok', assignee: 'David Thornton', lastReviewed: '2023-05-25', notes: 'Valid' },

  // ── HAMPTON 1 ──
  { id: 'comp-121', item: 'Asbestos Survey', site: 'Hampton 1 & 2', category: 'H&S', dueDate: '2030-08-14', status: 'ok', assignee: 'James Okafor', lastReviewed: '2025-08-14', notes: 'Valid' },
  { id: 'comp-122', item: 'Fire Risk Assessment', site: 'Hampton 1 & 2', category: 'Fire Safety', dueDate: '2026-06-20', status: 'critical', assignee: 'James Okafor', lastReviewed: '2025-06-18', notes: 'Expired' },
  { id: 'comp-123', item: 'Gas Installation Safety Report', site: 'Hampton 1 & 2', category: 'Gas Safety', dueDate: '2027-01-27', status: 'ok', assignee: 'James Okafor', lastReviewed: '2026-01-27', notes: 'Valid' },
  { id: 'comp-124', item: 'Legionella Risk Assessment', site: 'Hampton 1 & 2', category: 'H&S', dueDate: '2025-01-01', status: 'critical', assignee: 'James Okafor', lastReviewed: '2024-01-01', notes: 'Overdue – renewal required' },
  { id: 'comp-125', item: 'Dry Riser Flow Test', site: 'Hampton 1 & 2', category: 'H&S', dueDate: '2025-11-11', status: 'critical', assignee: 'James Okafor', lastReviewed: '2025-05-15', notes: 'Expired' },
  { id: 'comp-126', item: 'Dry Risers Visual', site: 'Hampton 1 & 2', category: 'H&S', dueDate: '2025-11-11', status: 'critical', assignee: 'James Okafor', lastReviewed: '2025-05-15', notes: 'Expired' },
  { id: 'comp-127', item: 'Fire Extinguisher Inspection', site: 'Hampton 1 & 2', category: 'Fire Safety', dueDate: '2027-03-12', status: 'ok', assignee: 'James Okafor', lastReviewed: '2026-03-12', notes: 'Valid' },
  { id: 'comp-128', item: 'Portable Appliance Testing (PAT)', site: 'Hampton 1 & 2', category: 'Electrical', dueDate: '2026-06-16', status: 'critical', assignee: 'James Okafor', lastReviewed: '2025-06-16', notes: 'Expired' },
  { id: 'comp-129', item: 'Emergency Lighting Service', site: 'Hampton 1 & 2', category: 'H&S', dueDate: '2026-02-17', status: 'critical', assignee: 'James Okafor', lastReviewed: '2025-02-17', notes: 'Expired' },
  { id: 'comp-130', item: 'EPC Certificate', site: 'Hampton 1 & 2', category: 'Building Regulations', dueDate: '2029-05-23', status: 'ok', assignee: 'James Okafor', lastReviewed: '2019-05-23', notes: 'Valid' },
  { id: 'comp-131', item: 'EICR Flat 1–12', site: 'Hampton 1 & 2', category: 'Electrical', dueDate: '2028-06-18', status: 'ok', assignee: 'James Okafor', lastReviewed: '2025-06-19', notes: 'Valid' },
];

export const VENDORS: Vendor[] = [
  {
    id: 'vendor-001',
    name: 'Clean Linen Services Ltd',
    category: 'Laundry',
    sites: ['Crowne Plaza Kingston-south', 'Hampton 1 & 2'],
    contractExpiry: '2026-12-31',
    insuranceExpiry: '2026-12-31',
    status: 'ok',
    contact: 'Group Procurement',
    email: 'info@cleanlinenservices.co.uk',
    phone: '+44 20 7946 1100',
    value: 'Variable/Weekly',
  },
  {
    id: 'vendor-002',
    name: 'CityFire',
    category: 'Fire Safety',
    sites: ['Crowne Plaza Kingston-south', 'Warren House'],
    contractExpiry: '2027-03-13',
    insuranceExpiry: '2026-12-31',
    status: 'ok',
    contact: 'Lee Masters',
    email: 'info@cityfire.co.uk',
    phone: '+44 20 7946 2200',
    value: 'Variable',
  },
  {
    id: 'vendor-003',
    name: 'SEFE Energy',
    category: 'Utilities',
    sites: ['Crowne Plaza Kingston-south', 'Warren House', 'River Club'],
    contractExpiry: '2028-02-29',
    insuranceExpiry: '2028-02-29',
    status: 'ok',
    contact: 'Supplier Relations',
    email: 'enquiries@sefe-energy.com',
    phone: '0161 837 3395',
    value: '£13,509/yr (CP)',
  },
  {
    id: 'vendor-004',
    name: 'EDF Energy',
    category: 'Utilities',
    sites: ['Crowne Plaza Kingston-south', 'Warren House', 'Ravens Ait Island'],
    contractExpiry: '2027-04-30',
    insuranceExpiry: '2027-04-30',
    status: 'ok',
    contact: 'Anete Painter',
    email: 'Anete.Painter@edfenergy.com',
    phone: '0845 366 3664',
    value: '£100,197/yr (WH)',
  },
  {
    id: 'vendor-005',
    name: 'Everflow',
    category: 'Utilities',
    sites: ['Crowne Plaza Kingston-south', 'Warren House', 'Stanhill Court', 'River Club'],
    contractExpiry: '2027-10-06',
    insuranceExpiry: '2027-10-06',
    status: 'warning',
    contact: 'Customer Services',
    email: 'customer.services@everflowutilities.com',
    phone: '0330 6600 137',
    value: '£21,509/yr (WH)',
  },
  {
    id: 'vendor-006',
    name: 'Peninsula',
    category: 'H&S Consultancy',
    sites: ['Crowne Plaza Kingston-south', 'Stanhill Court'],
    contractExpiry: '2027-01-27',
    insuranceExpiry: '2027-01-27',
    status: 'ok',
    contact: 'Peninsula Group',
    email: 'info@peninsula-uk.com',
    phone: '+44 161 827 4600',
    value: 'Annual retainer',
  },
];

export const TASKS: Task[] = [
  {
    id: 'task-001',
    title: 'Renew gas safety certificate – Crowne Plaza',
    site: 'Crowne Plaza Kingston-south',
    priority: 'urgent',
    due: '2026-04-16',
    status: 'open',
    assignee: 'Marcus Webb',
    category: 'Gas Safety',
    description: 'Gas Installation Safety (Boiler) expired 16-Apr-26. New visit to be scheduled with a new company, not First Call Limited.',
  },
  {
    id: 'task-002',
    title: 'Fire door inspection – Crowne Plaza',
    site: 'Crowne Plaza Kingston-south',
    priority: 'urgent',
    due: '2026-02-28',
    status: 'open',
    assignee: 'Marcus Webb',
    category: 'Fire Safety',
    description: 'Fire Door (Internal) inspection expired 28-Feb-26. To be completed by Internal Maintenance team with all defects/remedial work listed.',
  },
  {
    id: 'task-003',
    title: 'Fire Risk Assessment renewal – Stanhill Court',
    site: 'Stanhill Court',
    priority: 'urgent',
    due: '2026-01-08',
    status: 'open',
    assignee: 'Sarah Chen',
    category: 'Fire Safety',
    description: 'Fire Risk Assessment expired 08-Jan-26. Once all assessments done, arrange FRA with Fire Protection Services.',
  },
  {
    id: 'task-004',
    title: 'Legionella assessment – Ravens Ait',
    site: 'Ravens Ait Island',
    priority: 'urgent',
    due: '2026-01-07',
    status: 'in-progress',
    assignee: 'Priya Sharma',
    category: 'H&S',
    description: 'Visit commenced in January however no actions completed. Mandatory water system risk assessment.',
  },
  {
    id: 'task-005',
    title: 'EICR renewal – Ravens Ait (multiple circuits)',
    site: 'Ravens Ait Island',
    priority: 'urgent',
    due: '2025-09-26',
    status: 'open',
    assignee: 'Priya Sharma',
    category: 'Electrical',
    description: 'Multiple EICR certificates expired: Ground Floor, Marquee, Marquee Store, Flats. All require renewal.',
  },
  {
    id: 'task-006',
    title: 'Emergency lighting renewal – Warren House',
    site: 'Warren House',
    priority: 'high',
    due: '2025-10-17',
    status: 'open',
    assignee: 'Harshit Gulati',
    category: 'H&S',
    description: 'Emergency Lights Assessment expired 17-Oct-25. Contractor: NICEIC.',
  },
  {
    id: 'task-007',
    title: 'Legionella assessment – River Club',
    site: 'River Club',
    priority: 'urgent',
    due: '2025-03-30',
    status: 'open',
    assignee: 'David Thornton',
    category: 'H&S',
    description: 'Legionella Risk Assessment expired 30-Mar-25. Review required. Contractor: Safecare.',
  },
  {
    id: 'task-008',
    title: 'Boiler service – Ravens Ait',
    site: 'Ravens Ait Island',
    priority: 'high',
    due: '2026-01-01',
    status: 'open',
    assignee: 'Priya Sharma',
    category: 'H&S',
    description: 'Boiler service overdue since Jan 2026. Arrange service immediately.',
  },
  {
    id: 'task-009',
    title: 'TV Licence renewal – multiple sites',
    site: 'All Sites',
    priority: 'medium',
    due: '2026-07-01',
    status: 'open',
    assignee: 'Group Admin',
    category: 'Licenses',
    description: 'TV Licences expired at Stanhill Court, Ravens Ait, and Warren House. Renew immediately.',
  },
];

export const ALERTS: Alert[] = [
  {
    id: 'alert-001',
    type: 'critical',
    message: 'Gas Safety Certificate EXPIRED – Crowne Plaza Kingston-south',
    time: 'Today, 08:14',
    site: 'Crowne Plaza Kingston-south',
  },
  {
    id: 'alert-002',
    type: 'critical',
    message: 'Fire Door Inspection EXPIRED – Crowne Plaza Kingston-south',
    time: 'Today, 08:14',
    site: 'Crowne Plaza Kingston-south',
  },
  {
    id: 'alert-003',
    type: 'critical',
    message: 'Multiple EICR certificates EXPIRED – Ravens Ait Island',
    time: 'Yesterday, 09:30',
    site: 'Ravens Ait Island',
  },
  {
    id: 'alert-004',
    type: 'critical',
    message: 'Fire Risk Assessment EXPIRED – Stanhill Court',
    time: '2 days ago',
    site: 'Stanhill Court',
  },
  {
    id: 'alert-005',
    type: 'critical',
    message: 'Legionella Risk Assessment EXPIRED – River Club',
    time: '2 days ago',
    site: 'River Club',
  },
  {
    id: 'alert-006',
    type: 'warning',
    message: 'Fire Alarms Inspection expiring soon – Crowne Plaza Kingston-south',
    time: '3 days ago',
    site: 'Crowne Plaza Kingston-south',
  },
  {
    id: 'alert-007',
    type: 'warning',
    message: 'Gas Safety Inspection expiring – Stanhill Court',
    time: '4 days ago',
    site: 'Stanhill Court',
  },
  {
    id: 'alert-008',
    type: 'critical',
    message: 'Emergency Lighting EXPIRED – Warren House',
    time: '4 days ago',
    site: 'Warren House',
  },
];

// Reference date for all calculations: 2026-07-22
export const REFERENCE_DATE = '2026-07-22';

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
  { week: 'W1 Mar', score: 68, critical: 18, warnings: 12 },
  { week: 'W2 Mar', score: 66, critical: 20, warnings: 11 },
  { week: 'W3 Mar', score: 65, critical: 21, warnings: 12 },
  { week: 'W4 Mar', score: 67, critical: 19, warnings: 11 },
  { week: 'W1 Apr', score: 64, critical: 22, warnings: 10 },
  { week: 'W2 Apr', score: 63, critical: 23, warnings: 11 },
  { week: 'W3 Apr', score: 61, critical: 24, warnings: 10 },
  { week: 'W4 Apr', score: 62, critical: 23, warnings: 11 },
  { week: 'W1 May', score: 60, critical: 25, warnings: 10 },
  { week: 'W2 May', score: 59, critical: 26, warnings: 10 },
  { week: 'W3 May', score: 58, critical: 27, warnings: 9 },
  { week: 'W4 May', score: 57, critical: 28, warnings: 9 },
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