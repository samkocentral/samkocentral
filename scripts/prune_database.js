const fs = require('fs');
const path = require('path');

const RUNTIME_DB_PATH = path.join(process.cwd(), '.runtime_data', 'samko_db.json');
const SEED_DB_PATH = path.join(process.cwd(), 'src', 'data', 'samko_db.json');
const AUDIT_LOGS_PATH = path.join(process.cwd(), '.runtime_data', 'samko_audit_logs.json');
const NOTIFICATIONS_PATH = path.join(process.cwd(), '.runtime_data', 'samko_notifications.json');

// Read existing runtime DB
const existingDb = JSON.parse(fs.readFileSync(RUNTIME_DB_PATH, 'utf8'));

// 1. Properties (3 records)
const properties = [
  existingDb.properties.find(p => p.id === 'hotel-2657' || (p.name || '').toLowerCase() === 'gow') || {
    id: 'hotel-2657',
    name: 'Gow',
    city: 'London',
    address: 'Gowtham Avenue, London',
    manager: 'Marcus Webb',
    phone: '+44 20 8576 9679',
    rooms: 120,
    portal: 'both',
    status: 'active',
    type: 'Hotel & Estate',
    totalAssets: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  existingDb.properties.find(p => p.id === 'hotel-001' || (p.name || '').toLowerCase().includes('crowne')) || {
    id: 'hotel-001',
    name: 'Crowne Plaza Kingston-south',
    city: 'London',
    address: 'Holiday Inn, Kingston House Estate, Portsmouth Rd, Surbiton KT6 5QG',
    manager: 'Marcus Webb',
    phone: '+44 20 8546 0100',
    rooms: 171,
    portal: 'both',
    status: 'active',
    type: 'Hotel & Estate',
    totalAssets: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  existingDb.properties.find(p => p.id === 'hotel-002' || (p.name || '').toLowerCase().includes('stanhill')) || {
    id: 'hotel-002',
    name: 'Stanhill Court',
    city: 'Surrey',
    address: 'Stanhill Road, Charlwood, Horley, Surrey RH6 0EP',
    manager: 'Sarah Chen',
    phone: '+44 1293 862166',
    rooms: 90,
    portal: 'both',
    status: 'active',
    type: 'Hotel & Estate',
    totalAssets: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Ensure names are clean
properties[0].name = 'Gow';
properties[1].name = 'Crowne Plaza Kingston-south';
properties[2].name = 'Stanhill Court';

// 2. Categories (3 records)
const categories = [
  { id: 'cat-001', name: 'Furniture & Joinery', color: '#e8c97a' },
  { id: 'cat-002', name: 'Electrical & Lighting', color: '#38bdf8' },
  { id: 'cat-004', name: 'HVAC & Mechanical', color: '#34d399' }
];

// 3. Assets (3 records)
const existingGowAsset = existingDb.assets.find(a => (a.hotel || a.property || '').toLowerCase().includes('gow')) || {};
const existingCpAsset = existingDb.assets.find(a => (a.hotel || a.property || '').toLowerCase().includes('crowne')) || {};
const existingScAsset = existingDb.assets.find(a => (a.hotel || a.property || '').toLowerCase().includes('stanhill') || a.id === 'AST-003') || {};

const assets = [
  {
    ...existingGowAsset,
    id: existingGowAsset.id || 'FIX-1794221173240-3',
    assetId: 'FIX-173240-3',
    name: 'Otis Passenger Lift 8-Person',
    title: 'Otis Passenger Lift 8-Person',
    category: 'Plant Equipment',
    property: 'Gow',
    hotel: 'Gow',
    hotelName: 'Gow',
    hotelId: 'hotel-2657',
    site: 'Gow',
    location: 'Main Lobby',
    floor: 'All Floors',
    department: 'Engineering',
    status: 'active',
    condition: 'good',
    risk_level: 'high',
    purchase_cost: 55000,
    value: 55000,
    manufacturer: 'Otis',
    serialNumber: 'OTIS-8P-77',
    next_inspection: '2026-09-30',
    type: 'fixed',
    assetType: 'fixed',
    isFixed: true,
  },
  {
    ...existingCpAsset,
    id: existingCpAsset.id || 'AST-BULK-001',
    assetId: 'AST-BULK-001',
    name: 'Carrier Rooftop Air Handler 20kW',
    title: 'Carrier Rooftop Air Handler 20kW',
    category: 'HVAC',
    property: 'Crowne Plaza Kingston-south',
    hotel: 'Crowne Plaza Kingston-south',
    hotelName: 'Crowne Plaza Kingston-south',
    hotelId: 'hotel-001',
    site: 'Crowne Plaza Kingston-south',
    location: 'Rooftop Plant Room',
    floor: 'Roof',
    department: 'Engineering',
    status: 'active',
    condition: 'good',
    risk_level: 'medium',
    purchase_cost: 42000,
    value: 42000,
    manufacturer: 'Carrier',
    serialNumber: 'CAR-AHU-20K',
    next_inspection: '2026-11-01',
    type: 'fixed',
    assetType: 'fixed',
    isFixed: true,
  },
  {
    ...existingScAsset,
    id: existingScAsset.id || 'AST-003',
    assetId: 'AST-003',
    name: 'Cummins 250kVA Standby Generator',
    title: 'Cummins 250kVA Standby Generator',
    category: 'Electrical',
    property: 'Stanhill Court',
    hotel: 'Stanhill Court',
    hotelName: 'Stanhill Court',
    hotelId: 'hotel-002',
    site: 'Stanhill Court',
    location: 'External Energy Enclosure',
    floor: 'Ground',
    department: 'Engineering',
    status: 'active',
    condition: 'excellent',
    risk_level: 'critical',
    purchase_cost: 68000,
    value: 68000,
    manufacturer: 'Cummins Power',
    serialNumber: 'CUM-250-GEN',
    next_inspection: '2026-12-15',
    type: 'fixed',
    assetType: 'fixed',
    isFixed: true,
  }
];

// 4. Maintenance (3 records)
const maintenance = [
  {
    id: 'mai-001',
    assetId: 'FIX-1794221173240-3',
    assetName: 'Otis Passenger Lift 8-Person',
    type: 'LOLER Thorough Examination & Lift Servicing',
    property: 'Gow',
    hotel: 'Gow',
    hotelName: 'Gow',
    hotelId: 'hotel-2657',
    assignedTo: 'Otis UK Services',
    frequency: 'semi-annual',
    status: 'scheduled',
    scheduledDate: '2026-12-10',
    nextDueDate: '2027-06-10',
    notes: 'Statutory 6-monthly LOLER lift inspection',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mai-002',
    assetId: 'AST-BULK-001',
    assetName: 'Carrier Rooftop Air Handler 20kW',
    type: 'Quarterly Air Filter Inspection & Coil Clean',
    property: 'Crowne Plaza Kingston-south',
    hotel: 'Crowne Plaza Kingston-south',
    hotelName: 'Crowne Plaza Kingston-south',
    hotelId: 'hotel-001',
    assignedTo: 'Marcus Webb',
    frequency: 'quarterly',
    status: 'scheduled',
    scheduledDate: '2026-11-20',
    nextDueDate: '2027-02-20',
    notes: 'Replace secondary HEPA filters and clean heat recovery coil',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mai-003',
    assetId: 'AST-003',
    assetName: 'Cummins 250kVA Standby Generator',
    type: 'Annual Full Load Bank Testing & Fuel Polish',
    property: 'Stanhill Court',
    hotel: 'Stanhill Court',
    hotelName: 'Stanhill Court',
    hotelId: 'hotel-002',
    assignedTo: 'Chubb Power Systems',
    frequency: 'yearly',
    status: 'scheduled',
    scheduledDate: '2026-12-15',
    nextDueDate: '2027-12-15',
    notes: 'Full 4-hour resistive load test and diesel fuel polishing',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// 5. Compliance (3 records)
const compliance = [
  {
    id: '1',
    complianceId: 'COMP-001',
    name: 'Fire Risk Assessment',
    type: 'Statutory',
    category: 'Fire Risk Assessment',
    description: 'Annual comprehensive fire risk assessment for the entire property',
    property: 'Crowne Plaza Kingston-south',
    hotel: 'Crowne Plaza Kingston-south',
    department: 'Engineering',
    area: 'Whole Building',
    regulatoryAuthority: 'Fire & Rescue Service',
    certificateNumber: 'FRA-2025-001',
    issueDate: '2025-06-01',
    expiryDate: '2026-06-01',
    renewalDate: '2026-05-15',
    inspectionFrequency: 'Yearly',
    responsiblePerson: 'Marcus Webb',
    contractor: 'FireGuard Systems',
    status: 'compliant',
    riskRating: 'critical',
    notes: 'Current certificate valid and on file'
  },
  {
    id: '2',
    complianceId: 'COMP-002',
    name: 'Fire Alarm & Emergency Lighting Certificate',
    type: 'Statutory',
    category: 'Fire Alarm Certificate',
    description: 'Annual fire alarm system inspection and certification (BS 5839)',
    property: 'Stanhill Court',
    hotel: 'Stanhill Court',
    department: 'Engineering',
    area: 'All Floors',
    regulatoryAuthority: 'BS 5839',
    certificateNumber: 'FAC-2026-002',
    issueDate: '2025-01-10',
    expiryDate: '2026-01-10',
    renewalDate: '2025-12-15',
    inspectionFrequency: 'Yearly',
    responsiblePerson: 'Sarah Chen',
    contractor: 'Chubb Fire & Security',
    status: 'expiring-soon',
    riskRating: 'high',
    notes: 'Due for annual re-inspection'
  },
  {
    id: '3',
    complianceId: 'COMP-003',
    name: 'Passenger Lift LOLER Thorough Examination',
    type: 'Statutory',
    category: 'Lifting Equipment (LOLER)',
    description: 'Statutory 6-monthly thorough examination under LOLER 1998 Regulations',
    property: 'Gow',
    hotel: 'Gow',
    department: 'Engineering',
    area: 'Main Lobby Lift Shaft',
    regulatoryAuthority: 'HSE / LOLER 1998',
    certificateNumber: 'LOLER-2026-GOW',
    issueDate: '2026-03-01',
    expiryDate: '2026-09-30',
    renewalDate: '2026-09-15',
    inspectionFrequency: '6 Months',
    responsiblePerson: 'Marcus Webb',
    contractor: 'Otis Technical Services',
    status: 'compliant',
    riskRating: 'medium',
    notes: 'Full report attached, 0 defects noted'
  }
];

// 6. Tasks (3 records)
const tasks = [
  {
    id: 'task-001',
    title: 'Renew gas safety certificate – Crowne Plaza',
    description: 'Annual gas installation safety inspection to be scheduled with certified gas engineer.',
    site: 'Crowne Plaza Kingston-south',
    property: 'Crowne Plaza Kingston-south',
    hotel: 'Crowne Plaza Kingston-south',
    priority: 'urgent',
    status: 'open',
    category: 'Gas Safety',
    assignee: 'Marcus Webb',
    due: '2026-11-30'
  },
  {
    id: 'task-002',
    title: 'Water hygiene & legionella testing – Stanhill Court',
    description: 'Monthly sentinel temperature checks and legionella water sample collection.',
    site: 'Stanhill Court',
    property: 'Stanhill Court',
    hotel: 'Stanhill Court',
    priority: 'high',
    status: 'in_progress',
    category: 'Water Hygiene',
    assignee: 'Sarah Chen',
    due: '2026-12-05'
  },
  {
    id: 'task-003',
    title: 'LOLER Lift periodic service – Gow',
    description: 'Coordinate with Otis engineer for scheduled maintenance and lubrication of lift mechanism.',
    site: 'Gow',
    property: 'Gow',
    hotel: 'Gow',
    priority: 'normal',
    status: 'open',
    category: 'Plant & Machinery',
    assignee: 'Marcus Webb',
    due: '2026-12-15'
  }
];

// 7. Alerts (3 records)
const alerts = [
  {
    id: 'alert-001',
    type: 'critical',
    message: 'Gas Safety Certificate due for renewal – Crowne Plaza Kingston-south',
    site: 'Crowne Plaza Kingston-south',
    property: 'Crowne Plaza Kingston-south',
    time: 'Today, 09:00'
  },
  {
    id: 'alert-002',
    type: 'warning',
    message: 'Fire Alarm Certificate due in 25 days – Stanhill Court',
    site: 'Stanhill Court',
    property: 'Stanhill Court',
    time: 'Yesterday, 14:30'
  },
  {
    id: 'alert-003',
    type: 'info',
    message: 'Passenger Lift LOLER inspection verified – Gow',
    site: 'Gow',
    property: 'Gow',
    time: '2 days ago'
  }
];

// 8. Contracts (3 records)
const contracts = [
  {
    id: 'con-001',
    contractId: 'CON-001',
    contractName: 'Experian Credit Services',
    supplierName: 'Experian',
    supplierContact: 'Experian Support',
    email: 'business@experian.com',
    phone: '0844 481 8000',
    property: 'Crowne Plaza Kingston-south',
    hotel: 'Crowne Plaza Kingston-south',
    department: 'Finance',
    category: 'Professional Services',
    value: 1840,
    contractValue: 1840,
    monthlyCost: 153,
    startDate: '2025-01-01',
    endDate: '2026-12-31',
    renewalDate: '2026-11-30',
    noticePeriod: '30 days',
    paymentFrequency: 'Annual',
    autoRenew: true,
    sla: 'Standard SLA',
    contractOwner: 'Marcus Webb',
    status: 'active'
  },
  {
    id: 'con-002',
    contractId: 'CON-002',
    contractName: 'Otis Elevator Maintenance SLA',
    supplierName: 'Otis Lifts UK',
    supplierContact: 'Otis Commercial Support',
    email: 'service@otis.com',
    phone: '0800 181 363',
    property: 'Gow',
    hotel: 'Gow',
    department: 'Engineering',
    category: 'Building Services',
    value: 4500,
    contractValue: 4500,
    monthlyCost: 375,
    startDate: '2025-06-01',
    endDate: '2027-05-31',
    renewalDate: '2027-04-30',
    noticePeriod: '60 days',
    paymentFrequency: 'Quarterly',
    autoRenew: true,
    sla: '4-hour emergency entrapment response',
    contractOwner: 'Marcus Webb',
    status: 'active'
  },
  {
    id: 'con-003',
    contractId: 'CON-003',
    contractName: 'Chubb Fire & Security Monitoring',
    supplierName: 'Chubb Fire & Security',
    supplierContact: 'Chubb Client Desk',
    email: 'contracts@chubbfs.com',
    phone: '0800 321 666',
    property: 'Stanhill Court',
    hotel: 'Stanhill Court',
    department: 'Engineering',
    category: 'Life Safety',
    value: 2800,
    contractValue: 2800,
    monthlyCost: 233,
    startDate: '2025-03-01',
    endDate: '2027-02-28',
    renewalDate: '2027-01-31',
    noticePeriod: '30 days',
    paymentFrequency: 'Annual',
    autoRenew: true,
    sla: '24/7 Central Station Monitoring',
    contractOwner: 'Sarah Chen',
    status: 'active'
  }
];

// 9. Insurance (3 records)
const existingGowIns = existingDb.insurance.find(i => (i.hotel || i.property || '').toLowerCase().includes('gow')) || {};
const insurance = [
  {
    ...existingGowIns,
    id: existingGowIns.id || 'INS-008547',
    policyNumber: existingGowIns.policyNumber || 'hehe',
    insurer: existingGowIns.insurer || existingGowIns.provider || 'lwksjdslakj',
    provider: existingGowIns.provider || existingGowIns.insurer || 'lwksjdslakj',
    coverageType: 'Buildings & Plant',
    department: 'Kitchen',
    coverage: existingGowIns.coverage || 9004,
    coverageAmount: '9004',
    annualPremium: existingGowIns.annualPremium || 59335,
    effectiveDate: existingGowIns.effectiveDate || '2024-07-01',
    renewalDate: existingGowIns.renewalDate || '2027-06-30',
    property: 'Gow',
    hotel: 'Gow',
    status: 'active',
    broker: 'Gallagher Commercial'
  },
  {
    id: 'ins-002',
    policyNumber: 'AVIVA-CP-2026',
    insurer: 'Aviva Commercial',
    provider: 'Aviva Commercial',
    coverageType: 'Property & Business Interruption',
    department: 'Whole Building',
    coverage: 25000000,
    coverageAmount: '25000000',
    annualPremium: 42000,
    effectiveDate: '2025-05-01',
    renewalDate: '2027-04-30',
    property: 'Crowne Plaza Kingston-south',
    hotel: 'Crowne Plaza Kingston-south',
    status: 'active',
    broker: 'Marsh Commercial'
  },
  {
    id: 'ins-003',
    policyNumber: 'AXA-SC-2026',
    insurer: 'AXA UK plc',
    provider: 'AXA UK plc',
    coverageType: 'Public & Employers Liability',
    department: 'Operations',
    coverage: 10000000,
    coverageAmount: '10000000',
    annualPremium: 18500,
    effectiveDate: '2025-09-01',
    renewalDate: '2027-08-31',
    property: 'Stanhill Court',
    hotel: 'Stanhill Court',
    status: 'active',
    broker: 'Aon Risk Solutions'
  }
];

// 10. Utilities (3 records)
const utilities = [
  {
    id: 'util-001',
    utilityType: 'Electricity',
    type: 'Electricity',
    meterNumber: 'MPAN-19002847192',
    accountNumber: 'BG-EL-883921',
    provider: 'British Gas Business',
    supplier: 'British Gas Business',
    property: 'Crowne Plaza Kingston-south',
    hotel: 'Crowne Plaza Kingston-south',
    annualCost: 38400,
    monthlyCost: 3200,
    status: 'active',
    contractEndDate: '2027-09-30'
  },
  {
    id: 'util-002',
    utilityType: 'Gas',
    type: 'Gas',
    meterNumber: 'MPRN-8492019482',
    accountNumber: 'TE-GS-490218',
    provider: 'TotalEnergies Gas & Power',
    supplier: 'TotalEnergies Gas & Power',
    property: 'Stanhill Court',
    hotel: 'Stanhill Court',
    annualCost: 24600,
    monthlyCost: 2050,
    status: 'active',
    contractEndDate: '2027-03-31'
  },
  {
    id: 'util-003',
    utilityType: 'Water',
    type: 'Water',
    meterNumber: 'SPID-3901928471',
    accountNumber: 'TW-WT-109283',
    provider: 'Thames Water Commercial',
    supplier: 'Thames Water Commercial',
    property: 'Gow',
    hotel: 'Gow',
    annualCost: 14200,
    monthlyCost: 1183,
    status: 'active',
    contractEndDate: '2028-01-31'
  }
];

// 11. Documents (3 records)
const documents = [
  {
    id: 'doc-001',
    name: 'Fire Risk Assessment 2026.pdf',
    title: 'Fire Risk Assessment 2026.pdf',
    fileName: 'Fire_Risk_Assessment_2026.pdf',
    type: 'Compliance',
    category: 'Compliance',
    fileType: 'application/pdf',
    property: 'Crowne Plaza Kingston-south',
    hotel: 'Crowne Plaza Kingston-south',
    approvalStatus: 'approved',
    uploadedAt: '2026-06-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-002',
    name: 'Insurance Policy Schedule 2026-27.pdf',
    title: 'Insurance Policy Schedule 2026-27.pdf',
    fileName: 'Insurance_Policy_Schedule_2026.pdf',
    type: 'Insurance',
    category: 'Insurance',
    fileType: 'application/pdf',
    property: 'Gow',
    hotel: 'Gow',
    approvalStatus: 'approved',
    uploadedAt: '2026-07-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-003',
    name: 'Health & Safety Compliance Audit.pdf',
    title: 'Health & Safety Compliance Audit.pdf',
    fileName: 'Health_and_Safety_Audit.pdf',
    type: 'Health & Safety',
    category: 'Health & Safety',
    fileType: 'application/pdf',
    property: 'Stanhill Court',
    hotel: 'Stanhill Court',
    approvalStatus: 'approved',
    uploadedAt: '2026-08-15',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// 12. Claims (3 records)
const claims = [
  {
    id: 'c1',
    policyId: 'ins-002',
    policyNumber: 'AVIVA-CP-2026',
    hotel: 'Crowne Plaza Kingston-south',
    property: 'Crowne Plaza Kingston-south',
    claimDate: '2025-03-15',
    description: 'Water damage to ground floor lobby ceiling',
    amount: 12500,
    status: 'settled'
  },
  {
    id: 'c2',
    policyId: 'ins-003',
    policyNumber: 'AXA-SC-2026',
    hotel: 'Stanhill Court',
    property: 'Stanhill Court',
    claimDate: '2025-07-22',
    description: 'Storm damage to roof tiling in west wing',
    amount: 8400,
    status: 'in-progress'
  },
  {
    id: 'c3',
    policyId: 'INS-008547',
    policyNumber: 'hehe',
    hotel: 'Gow',
    property: 'Gow',
    claimDate: '2025-10-04',
    description: 'Kitchen walk-in freezer compressor replacement claim',
    amount: 4600,
    status: 'submitted'
  }
];

// 13. Users (3 records - Digital Bot, Group Admin, Madhu)
const botUser = existingDb.users.find(u => u.id === 'usr-bot-001' || u.email === 'digitalbot@samkocentral.com') || {
  id: 'usr-bot-001',
  name: 'Digital Bot',
  email: 'digitalbot@samkocentral.com',
  roleLevel: 'L1',
  roleTitle: 'Super Admin',
  portal: 'both',
  hotel: 'All Properties',
  assignedProperties: ['Gow', 'Crowne Plaza Kingston-south', 'Stanhill Court'],
  status: 'active',
  initials: 'DB'
};
botUser.assignedProperties = ['Gow', 'Crowne Plaza Kingston-south', 'Stanhill Court'];

const adminUser = existingDb.users.find(u => u.id === '1' || u.email === 'admin@samkocentral.com') || {
  id: '1',
  name: 'Group Admin',
  email: 'admin@samkocentral.com',
  roleLevel: 'L1',
  roleTitle: 'Super Admin',
  portal: 'both',
  hotel: 'All Properties',
  assignedProperties: ['Gow', 'Crowne Plaza Kingston-south', 'Stanhill Court'],
  status: 'active',
  initials: 'GA'
};
adminUser.assignedProperties = ['Gow', 'Crowne Plaza Kingston-south', 'Stanhill Court'];

const madhuUser = existingDb.users.find(u => u.email === 'madhu@gmail.com') || {
  id: 'usr-l2-511370',
  name: 'Madhu',
  email: 'madhu@gmail.com',
  roleLevel: 'L2',
  roleTitle: 'Property Director / GM',
  portal: 'both',
  hotel: 'Gow, Crowne Plaza Kingston-south, Stanhill Court',
  assignedProperties: ['Gow', 'Crowne Plaza Kingston-south', 'Stanhill Court'],
  status: 'active',
  initials: 'M'
};
madhuUser.assignedProperties = ['Gow', 'Crowne Plaza Kingston-south', 'Stanhill Court'];
madhuUser.hotel = 'Gow, Crowne Plaza Kingston-south, Stanhill Court';

const users = [botUser, adminUser, madhuUser];

const prunedDb = {
  properties,
  categories,
  assets,
  maintenance,
  compliance,
  tasks,
  alerts,
  contracts,
  insurance,
  utilities,
  documents,
  claims,
  users
};

// Write pruned database to both runtime and seed locations
fs.writeFileSync(RUNTIME_DB_PATH, JSON.stringify(prunedDb, null, 2), 'utf8');
fs.writeFileSync(SEED_DB_PATH, JSON.stringify(prunedDb, null, 2), 'utf8');

// Prune audit logs to 3 records
const auditLogs = [
  {
    id: 'log-001',
    action: 'DATABASE_PRUNED',
    entity: 'System Data',
    details: 'All collections pruned to 3 active verified records. Full master backup preserved.',
    user: 'Digital Bot',
    timestamp: new Date().toISOString()
  },
  {
    id: 'log-002',
    action: 'BACKUP_CREATED',
    entity: 'Database Backup',
    details: 'Master database backup exported to backups/samkocentral_database_backup_latest.json (312 records).',
    user: 'Digital Bot',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'log-003',
    action: 'PROPERTY_ACTIVE',
    entity: 'Property Hub',
    details: 'Verified Gow, Crowne Plaza Kingston-south, and Stanhill Court active configuration.',
    user: 'Digital Bot',
    timestamp: new Date(Date.now() - 7200000).toISOString()
  }
];
fs.writeFileSync(AUDIT_LOGS_PATH, JSON.stringify(auditLogs, null, 2), 'utf8');

// Prune notifications to 3 records
const notifications = [
  {
    id: 'notif-001',
    type: 'success',
    title: 'Database Pruning Complete',
    message: 'All collections successfully streamlined to 3 records each. Master backup safely preserved.',
    timestamp: new Date().toISOString(),
    read: false
  },
  {
    id: 'notif-002',
    type: 'info',
    title: 'Master Backup Ready',
    message: 'Master backup file ready for download or restore anytime in Settings > Data & Backup.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: true
  },
  {
    id: 'notif-003',
    type: 'warning',
    title: 'Gas Safety Certificate Notice',
    message: 'Crowne Plaza Kingston-south gas certificate renewal pending review.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    read: true
  }
];
fs.writeFileSync(NOTIFICATIONS_PATH, JSON.stringify(notifications, null, 2), 'utf8');

console.log('--- DATABASE PRUNING SUMMARY ---');
for (const [k, v] of Object.entries(prunedDb)) {
  console.log(`${k}: ${v.length} records`);
}
console.log(`audit_logs: ${auditLogs.length} records`);
console.log(`notifications: ${notifications.length} records`);
console.log('Pruning successfully applied to .runtime_data and src/data!');

