const fs = require('fs');
const path = require('path');

// 1. Prune src/lib/assetData.ts
const assetDataPath = path.join(process.cwd(), 'src', 'lib', 'assetData.ts');
let assetContent = fs.readFileSync(assetDataPath, 'utf8');

const newAssets = `export const ASSETS: Asset[] = [
  {
    id: 'FIX-1794221173240-3',
    assetId: 'FIX-173240-3',
    name: 'Otis Passenger Lift 8-Person',
    category: 'Plant Equipment',
    department: 'Engineering',
    hotelId: 'hotel-2657',
    hotelName: 'Gow',
    location: 'Main Lobby',
    floor: 'All Floors',
    quantity: 1,
    unit: 'Each',
    condition: 'good',
    status: 'active',
    responsibleRole: 'Chief Engineer',
    responsibleUser: 'Marcus Webb',
    maintenanceSchedule: '6-monthly',
    inspectionFrequency: '6-monthly LOLER Thorough Examination',
    nextInspectionDate: '2026-09-30',
    lastInspectionDate: '2026-03-30',
    riskLevel: 'high',
    isFixed: true,
    notes: 'Statutory LOLER 6-monthly thorough exam',
    createdAt: '2026-11-09',
    updatedAt: '2026-11-09'
  },
  {
    id: 'AST-BULK-001',
    assetId: 'AST-BULK-001',
    name: 'Carrier Rooftop Air Handler 20kW',
    category: 'HVAC',
    department: 'Engineering',
    hotelId: 'hotel-001',
    hotelName: 'Crowne Plaza Kingston-south',
    location: 'Rooftop Plant Room',
    floor: 'Roof',
    quantity: 1,
    unit: 'Each',
    condition: 'good',
    status: 'active',
    responsibleRole: 'Maintenance Manager',
    responsibleUser: 'Marcus Webb',
    maintenanceSchedule: 'quarterly',
    inspectionFrequency: 'Quarterly filter check & coil service',
    nextInspectionDate: '2026-11-01',
    lastInspectionDate: '2026-08-01',
    riskLevel: 'medium',
    isFixed: true,
    notes: 'Primary heating and cooling AHU for public areas',
    createdAt: '2024-01-01',
    updatedAt: '2026-10-21'
  },
  {
    id: 'AST-003',
    assetId: 'AST-003',
    name: 'Cummins 250kVA Standby Generator',
    category: 'Electrical',
    department: 'Engineering',
    hotelId: 'hotel-002',
    hotelName: 'Stanhill Court',
    location: 'External Energy Enclosure',
    floor: 'Ground',
    quantity: 1,
    unit: 'Each',
    condition: 'excellent',
    status: 'active',
    responsibleRole: 'Chief Engineer',
    responsibleUser: 'Sarah Chen',
    maintenanceSchedule: 'yearly',
    inspectionFrequency: 'Annual full load bank testing',
    nextInspectionDate: '2026-12-15',
    lastInspectionDate: '2025-12-15',
    riskLevel: 'critical',
    isFixed: true,
    notes: 'Auto-transfer switch standby generator for critical life safety systems',
    createdAt: '2024-01-01',
    updatedAt: '2026-07-01'
  }
];`;

const newMaintenance = `export const MAINTENANCE_RECORDS: MaintenanceRecord[] = [
  {
    id: 'mai-001',
    assetId: 'FIX-1794221173240-3',
    assetName: 'Otis Passenger Lift 8-Person',
    hotelId: 'hotel-2657',
    hotelName: 'Gow',
    type: 'LOLER Thorough Examination & Lift Servicing',
    status: 'scheduled',
    frequency: '6-monthly',
    assignedTo: 'Otis UK Services',
    scheduledDate: '2026-12-10',
    nextDueDate: '2027-06-10',
    notes: 'Statutory 6-monthly LOLER lift inspection',
    createdAt: '2026-11-09T10:47:27.886Z',
    updatedAt: '2026-11-09T10:47:27.887Z'
  },
  {
    id: 'mai-002',
    assetId: 'AST-BULK-001',
    assetName: 'Carrier Rooftop Air Handler 20kW',
    hotelId: 'hotel-001',
    hotelName: 'Crowne Plaza Kingston-south',
    type: 'Quarterly Air Filter Inspection & Coil Clean',
    status: 'scheduled',
    frequency: 'quarterly',
    assignedTo: 'Marcus Webb',
    scheduledDate: '2026-11-20',
    nextDueDate: '2027-02-20',
    notes: 'Replace secondary HEPA filters and clean coil',
    createdAt: '2026-10-21T10:47:27.886Z',
    updatedAt: '2026-10-21T10:47:27.887Z'
  },
  {
    id: 'mai-003',
    assetId: 'AST-003',
    assetName: 'Cummins 250kVA Standby Generator',
    hotelId: 'hotel-002',
    hotelName: 'Stanhill Court',
    type: 'Annual Full Load Bank Testing & Fuel Polish',
    status: 'scheduled',
    frequency: 'yearly',
    assignedTo: 'Chubb Power Systems',
    scheduledDate: '2026-12-15',
    nextDueDate: '2027-12-15',
    notes: 'Full resistive load bank test and diesel polish',
    createdAt: '2026-07-01T10:47:27.886Z',
    updatedAt: '2026-07-01T10:47:27.887Z'
  }
];`;

// Replace ASSETS
assetContent = assetContent.replace(/export const ASSETS: Asset\[\] = \[[\s\S]*?\];\s*\/\/\s*─── MAINTENANCE RECORDS/, `${newAssets}\n\n// ─── MAINTENANCE RECORDS`);

// Replace MAINTENANCE_RECORDS
assetContent = assetContent.replace(/export const MAINTENANCE_RECORDS: MaintenanceRecord\[\] = \[[\s\S]*?\];\s*\/\/\s*─── COMPUTED STATS/, `${newMaintenance}\n\n// ─── COMPUTED STATS`);

fs.writeFileSync(assetDataPath, assetContent, 'utf8');
console.log('assetData.ts updated successfully with 3 assets and 3 maintenance records!');

// 2. Prune src/lib/mockData.ts
const mockDataPath = path.join(process.cwd(), 'src', 'lib', 'mockData.ts');
let mockContent = fs.readFileSync(mockDataPath, 'utf8');

const newSites = `export const SITES: Site[] = [
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
  {
    id: 'site-2657',
    name: 'Gow',
    type: 'Hotel',
    city: 'London',
    status: 'operational',
    risk: 'low',
    manager: 'Marcus Webb',
    phone: '+44 20 8576 9679',
    openIssues: 0,
    compliance: 100,
    address: 'Gowtham Avenue, London',
  },
];`;

const newDocs = `export const DOCUMENTS: Document[] = [
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
    site: 'Gow',
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
];`;

const newCompliance = `export const COMPLIANCE: ComplianceItem[] = [
  {
    id: 'comp-001',
    item: 'Fire Risk Assessment',
    site: 'Crowne Plaza Kingston-south',
    category: 'Fire Safety',
    dueDate: '2026-06-01',
    status: 'ok',
    assignee: 'Marcus Webb',
    lastReviewed: '2026-05-15',
    notes: 'Annual assessment complete; next review scheduled.',
  },
  {
    id: 'comp-002',
    item: 'Fire Alarm & Emergency Lighting Certificate',
    site: 'Stanhill Court',
    category: 'Fire Safety',
    dueDate: '2026-01-10',
    status: 'warning',
    assignee: 'Sarah Chen',
    lastReviewed: '2025-12-15',
    notes: 'BS 5839 certification scheduled with Chubb.',
  },
  {
    id: 'comp-003',
    item: 'Passenger Lift LOLER Thorough Examination',
    site: 'Gow',
    category: 'Lifting Equipment',
    dueDate: '2026-09-30',
    status: 'ok',
    assignee: 'Marcus Webb',
    lastReviewed: '2026-03-30',
    notes: 'Statutory 6-monthly LOLER inspection verified.',
  },
];`;

const newVendors = `export const VENDORS: Vendor[] = [
  {
    id: 'ven-001',
    name: 'Otis Lifts UK',
    category: 'Lift Maintenance',
    sites: ['Gow', 'Crowne Plaza Kingston-south'],
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
];`;

const newTasks = `export const TASKS: Task[] = [
  {
    id: 'task-001',
    title: 'Renew gas safety certificate – Crowne Plaza',
    site: 'Crowne Plaza Kingston-south',
    priority: 'urgent',
    due: '2026-11-30',
    status: 'open',
    assignee: 'Marcus Webb',
    category: 'Gas Safety',
    description: 'Annual gas installation safety inspection to be scheduled with certified gas engineer.',
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
    title: 'LOLER Lift periodic service – Gow',
    site: 'Gow',
    priority: 'medium',
    due: '2026-12-15',
    status: 'open',
    assignee: 'Marcus Webb',
    category: 'Plant & Machinery',
    description: 'Coordinate with Otis engineer for scheduled maintenance and lubrication of lift mechanism.',
  },
];`;

const newAlerts = `export const ALERTS: Alert[] = [
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
    message: 'Passenger Lift LOLER inspection verified – Gow',
    time: '2 days ago',
    site: 'Gow',
  },
];`;

// Replace SITES
mockContent = mockContent.replace(/export const SITES: Site\[\] = \[[\s\S]*?\];\s*export const DOCUMENTS/, `${newSites}\n\nexport const DOCUMENTS`);

// Replace DOCUMENTS
mockContent = mockContent.replace(/export const DOCUMENTS: Document\[\] = \[[\s\S]*?\];\s*export const COMPLIANCE/, `${newDocs}\n\nexport const COMPLIANCE`);

// Replace COMPLIANCE
mockContent = mockContent.replace(/export const COMPLIANCE: ComplianceItem\[\] = \[[\s\S]*?\];\s*export const VENDORS/, `${newCompliance}\n\nexport const VENDORS`);

// Replace VENDORS
mockContent = mockContent.replace(/export const VENDORS: Vendor\[\] = \[[\s\S]*?\];\s*export const TASKS/, `${newVendors}\n\nexport const TASKS`);

// Replace TASKS
mockContent = mockContent.replace(/export const TASKS: Task\[\] = \[[\s\S]*?\];\s*export const ALERTS/, `${newTasks}\n\nexport const ALERTS`);

// Replace ALERTS
mockContent = mockContent.replace(/export const ALERTS: Alert\[\] = \[[\s\S]*?\];\s*export const REFERENCE_DATE/, `${newAlerts}\n\nexport const REFERENCE_DATE`);

fs.writeFileSync(mockDataPath, mockContent, 'utf8');
console.log('mockData.ts updated successfully with 3 sites, 3 docs, 3 compliance, 3 vendors, 3 tasks, and 3 alerts!');

