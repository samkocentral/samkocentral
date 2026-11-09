const fs = require('fs');
const path = require('path');

const RUNTIME_DB_PATH = path.join(process.cwd(), '.runtime_data', 'samko_db.json');
const SEED_DB_PATH = path.join(process.cwd(), 'src', 'data', 'samko_db.json');
const CMS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'samko_cms.json');
const ASSET_DATA_PATH = path.join(process.cwd(), 'src', 'lib', 'assetData.ts');
const DEEP_CMS_PATH = path.join(process.cwd(), 'src', 'lib', 'deepPageCms.ts');
const UTILITIES_DATA_PATH = path.join(process.cwd(), 'src', 'data', 'utilitiesData.ts');
const TASKS_DATA_PATH = path.join(process.cwd(), 'src', 'data', 'tasksData.ts');

// ─── 1. FIXED & NON-FIXED ASSETS (3 Fixed + 3 Non-Fixed) ─────────────────────

const fixedAssets = [
  {
    id: 'FIX-1794221173240-3',
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
    quantity: 1,
    unit: 'Each',
    condition: 'good',
    risk_level: 'high',
    riskLevel: 'high',
    status: 'active',
    serialNumber: 'OTIS-8P-77',
    purchase_cost: 55000,
    purchaseCost: 55000,
    value: 55000,
    manufacturer: 'Otis',
    next_inspection: '2026-09-30',
    nextInspectionDate: '2026-09-30',
    type: 'fixed',
    assetType: 'fixed',
    isFixed: true,
    responsibleRole: 'Chief Engineer',
    responsibleUser: 'Marcus Webb',
    maintenanceSchedule: '6-monthly',
    inspectionFrequency: '6-monthly LOLER Thorough Examination',
    notes: 'Statutory LOLER 6-monthly thorough exam'
  },
  {
    id: 'AST-BULK-001',
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
    quantity: 1,
    unit: 'Each',
    condition: 'good',
    risk_level: 'medium',
    riskLevel: 'medium',
    status: 'active',
    serialNumber: 'CAR-AHU-20K',
    purchase_cost: 42000,
    purchaseCost: 42000,
    value: 42000,
    manufacturer: 'Carrier',
    next_inspection: '2026-11-01',
    nextInspectionDate: '2026-11-01',
    type: 'fixed',
    assetType: 'fixed',
    isFixed: true,
    responsibleRole: 'Maintenance Manager',
    responsibleUser: 'Marcus Webb',
    maintenanceSchedule: 'quarterly',
    inspectionFrequency: 'Quarterly filter check & coil service',
    notes: 'Primary heating and cooling AHU for public areas'
  },
  {
    id: 'AST-003',
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
    quantity: 1,
    unit: 'Each',
    condition: 'excellent',
    risk_level: 'critical',
    riskLevel: 'critical',
    status: 'active',
    serialNumber: 'CUM-250-GEN',
    purchase_cost: 68000,
    purchaseCost: 68000,
    value: 68000,
    manufacturer: 'Cummins Power',
    next_inspection: '2026-12-15',
    nextInspectionDate: '2026-12-15',
    type: 'fixed',
    assetType: 'fixed',
    isFixed: true,
    responsibleRole: 'Chief Engineer',
    responsibleUser: 'Sarah Chen',
    maintenanceSchedule: 'yearly',
    inspectionFrequency: 'Annual full load bank testing',
    notes: 'Auto-transfer switch standby generator for critical life safety systems'
  }
];

const nonFixedAssets = [
  {
    id: 'NFA-001',
    assetId: 'FA-001',
    name: 'Bed Bases & Mattresses (Executive King)',
    title: 'Bed Bases & Mattresses (Executive King)',
    category: 'Furniture & Joinery',
    property: 'Crowne Plaza Kingston-south',
    hotel: 'Crowne Plaza Kingston-south',
    hotelName: 'Crowne Plaza Kingston-south',
    hotelId: 'hotel-001',
    site: 'Crowne Plaza Kingston-south',
    location: 'Guest Rooms',
    floor: 'All Floors',
    department: 'Housekeeping',
    quantity: 120,
    unit: 'Sets',
    condition: 'good',
    risk_level: 'low',
    riskLevel: 'low',
    status: 'active',
    serialNumber: 'BB-CP-2024',
    purchase_cost: 24000,
    purchaseCost: 24000,
    value: 24000,
    manufacturer: 'Hypnos UK',
    next_inspection: '2026-10-01',
    nextInspectionDate: '2026-10-01',
    type: 'non-fixed',
    assetType: 'non-fixed',
    isFixed: false,
    responsibleRole: 'Housekeeping Manager',
    responsibleUser: 'Marcus Webb',
    maintenanceSchedule: 'monthly',
    inspectionFrequency: 'Monthly visual check',
    notes: 'Full hotel room FF&E inventory'
  },
  {
    id: 'NFA-002',
    assetId: 'FA-002',
    name: 'Commercial Winterhalter Pass-Through Dishwasher',
    title: 'Commercial Winterhalter Pass-Through Dishwasher',
    category: 'Kitchen Equipment',
    property: 'Gow',
    hotel: 'Gow',
    hotelName: 'Gow',
    hotelId: 'hotel-2657',
    site: 'Gow',
    location: 'Main Kitchen',
    floor: 'Ground',
    department: 'Kitchen',
    quantity: 2,
    unit: 'Units',
    condition: 'good',
    risk_level: 'medium',
    riskLevel: 'medium',
    status: 'active',
    serialNumber: 'WH-PT-500',
    purchase_cost: 16500,
    purchaseCost: 16500,
    value: 16500,
    manufacturer: 'Winterhalter',
    next_inspection: '2026-11-15',
    nextInspectionDate: '2026-11-15',
    type: 'non-fixed',
    assetType: 'non-fixed',
    isFixed: false,
    responsibleRole: 'Head Chef',
    responsibleUser: 'Marcus Webb',
    maintenanceSchedule: 'quarterly',
    inspectionFrequency: 'Quarterly descaling & PAT testing',
    notes: 'Commercial kitchen wash-station equipment'
  },
  {
    id: 'NFA-003',
    assetId: 'FA-003',
    name: 'Reception Lounge Suite & Coffee Tables',
    title: 'Reception Lounge Suite & Coffee Tables',
    category: 'Furniture & Joinery',
    property: 'Stanhill Court',
    hotel: 'Stanhill Court',
    hotelName: 'Stanhill Court',
    hotelId: 'hotel-002',
    site: 'Stanhill Court',
    location: 'Main Reception & Lounge',
    floor: 'Ground',
    department: 'Reception',
    quantity: 6,
    unit: 'Sets',
    condition: 'excellent',
    risk_level: 'low',
    riskLevel: 'low',
    status: 'active',
    serialNumber: 'RLS-SC-01',
    purchase_cost: 9800,
    purchaseCost: 9800,
    value: 9800,
    manufacturer: 'Morgan Contract Furniture',
    next_inspection: '2026-12-01',
    nextInspectionDate: '2026-12-01',
    type: 'non-fixed',
    assetType: 'non-fixed',
    isFixed: false,
    responsibleRole: 'Front Office Manager',
    responsibleUser: 'Sarah Chen',
    maintenanceSchedule: 'yearly',
    inspectionFrequency: 'Annual structural check',
    notes: 'High-traffic lobby lounge furniture'
  }
];

const allAssets = [...fixedAssets, ...nonFixedAssets];

// ─── 2. UPDATE SAMKO_DB.JSON (RUNTIME & SEED) ────────────────────────────────

const runtimeDb = JSON.parse(fs.readFileSync(RUNTIME_DB_PATH, 'utf8'));
runtimeDb.assets = allAssets;

fs.writeFileSync(RUNTIME_DB_PATH, JSON.stringify(runtimeDb, null, 2), 'utf8');
fs.writeFileSync(SEED_DB_PATH, JSON.stringify(runtimeDb, null, 2), 'utf8');
console.log('samko_db.json updated with 3 Fixed Assets and 3 Non-Fixed Assets (total 6)!');

// ─── 3. UPDATE SAMKO_CMS.JSON ────────────────────────────────────────────────

if (fs.existsSync(CMS_FILE_PATH)) {
  const cms = JSON.parse(fs.readFileSync(CMS_FILE_PATH, 'utf8'));

  // Update nonfixed
  if (cms.nonfixed) {
    cms.nonfixed.badgeText = '3 FF&E Items';
    cms.nonfixed.items = nonFixedAssets.map(a => ({
      id: a.id,
      assetId: a.assetId,
      name: a.name,
      property: a.property,
      hotelId: a.hotelId,
      hotelName: a.hotelName,
      location: a.location,
      category: a.category,
      department: a.department,
      quantity: a.quantity,
      condition: a.condition,
      status: a.status,
      riskLevel: a.riskLevel,
      nextInspectionDate: a.nextInspectionDate,
      isFixed: false
    }));
    cms.nonfixed.kpis = [
      { id: 'nf-kpi-1', label: 'Total FF&E Items', value: '3 Items', subtitle: 'Across 3 portfolio properties', color: '#60a5fa', enabled: true },
      { id: 'nf-kpi-2', label: 'Good / Pristine Condition', value: '3 Items', subtitle: '100% condition health', color: '#3dd68c', enabled: true },
      { id: 'nf-kpi-3', label: 'Needs Repair / Attention', value: '0 Items', subtitle: 'Work tickets clear', color: '#f59e0b', enabled: true },
      { id: 'nf-kpi-4', label: 'Room Audit Completion', value: '100%', subtitle: 'Quarterly audit verified', color: '#a78bfa', enabled: true }
    ];
    cms.nonfixed.tabFilters = [
      { id: 'non-fixed', label: 'Non-Fixed Assets', count: 3 }
    ];
  }

  // Update assets (fixed assets)
  if (cms.assets) {
    cms.assets.badgeText = '3 Fixed Assets';
    cms.assets.items = fixedAssets.map(a => ({
      id: a.id,
      assetId: a.assetId,
      name: a.name,
      property: a.property,
      hotelId: a.hotelId,
      hotelName: a.hotelName,
      location: a.location,
      category: a.category,
      department: a.department,
      quantity: a.quantity,
      condition: a.condition,
      status: a.status,
      riskLevel: a.riskLevel,
      nextInspectionDate: a.nextInspectionDate,
      isFixed: true
    }));
    cms.assets.kpis = [
      { id: 'asset-kpi-1', label: 'Total Fixed Assets', value: '3 Items', subtitle: 'Across 3 properties', color: '#60a5fa', enabled: true },
      { id: 'asset-kpi-2', label: 'Active Fixed Plant', value: '3 Plant & Machinery', subtitle: 'Depreciable balance sheet items', color: '#e8c97a', enabled: true },
      { id: 'asset-kpi-3', label: 'Under Maintenance', value: '0 Plant Items', subtitle: 'Scheduled repairs & servicing', color: '#3dd68c', enabled: true },
      { id: 'asset-kpi-4', label: 'High Risk Flagged', value: '1 Critical Asset', subtitle: 'Generator load test scheduled', color: '#f43f5e', enabled: true }
    ];
    cms.assets.tabFilters = [
      { id: 'fixed', label: 'Fixed Assets', count: 3 }
    ];
  }

  // Prune all other collections in samko_cms.json to at most 3 items
  for (const key of Object.keys(cms)) {
    if (key === 'nonfixed' || key === 'assets') continue;
    if (cms[key].items && Array.isArray(cms[key].items) && cms[key].items.length > 3) {
      cms[key].items = cms[key].items.slice(0, 3);
    }
  }

  fs.writeFileSync(CMS_FILE_PATH, JSON.stringify(cms, null, 2), 'utf8');
  console.log('samko_cms.json successfully updated! nonfixed has 3 items, assets has 3 items.');
}

// ─── 4. UPDATE SRC/LIB/ASSETDATA.TS ──────────────────────────────────────────

let assetCode = fs.readFileSync(ASSET_DATA_PATH, 'utf8');
const assetsExport = `export const ASSETS: Asset[] = ${JSON.stringify(allAssets, null, 2)};`;
assetCode = assetCode.replace(/export const ASSETS: Asset\[\] = \[[\s\S]*?\];\s*\/\/\s*─── MAINTENANCE RECORDS/, `${assetsExport}\n\n// ─── MAINTENANCE RECORDS`);
fs.writeFileSync(ASSET_DATA_PATH, assetCode, 'utf8');
console.log('src/lib/assetData.ts updated with 6 assets (3 fixed + 3 non-fixed)!');

// ─── 5. UPDATE SRC/LIB/DEEPPAGECMS.TS (REMOVE < 10 RESET GUARD) ──────────────

let deepCmsCode = fs.readFileSync(DEEP_CMS_PATH, 'utf8');

// Remove the `< 10` reset checks that were forcing 57/100 mock assets
deepCmsCode = deepCmsCode.replace(
  /\(key === 'nonfixed' && \(!saved\.items \|\| saved\.items\.length < 10\)\)/g,
  `false`
);
deepCmsCode = deepCmsCode.replace(
  /\(key === 'assets' && \(!saved\.items \|\| saved\.items\.length < 10\)\)/g,
  `false`
);

// Update badgeText and KPIs in DEFAULT_DEEP_CMS for nonfixed
deepCmsCode = deepCmsCode.replace(/badgeText:\s*'[0-9]+\s*FF&E Items'/g, "badgeText: '3 FF&E Items'");
deepCmsCode = deepCmsCode.replace(/value:\s*'[0-9]+\s*FF&E Items'/g, "value: '3 FF&E Items'");
deepCmsCode = deepCmsCode.replace(/value:\s*'57 Items'/g, "value: '3 Items'");
deepCmsCode = deepCmsCode.replace(/value:\s*'248 Items'/g, "value: '3 Items'");
deepCmsCode = deepCmsCode.replace(/value:\s*'62 Items'/g, "value: '3 Items'");

fs.writeFileSync(DEEP_CMS_PATH, deepCmsCode, 'utf8');
console.log('src/lib/deepPageCms.ts updated: reset guard removed and KPI counts updated!');

// ─── 6. UPDATE UTILITIES & TASKS DATA ────────────────────────────────────────

let utilCode = fs.readFileSync(UTILITIES_DATA_PATH, 'utf8');
const prunedUtilities = [
  {
    id: 'util-001',
    property: 'Crowne Plaza Kingston-south',
    utilityType: 'Electricity',
    supplier: 'British Gas Business',
    accountNumber: 'BG-EL-883921',
    meterReference: 'MPAN: 19002847192',
    contractStart: '2025-10-01',
    contractEnd: '2027-09-30',
    annualCost: 38400,
    monthlyCost: 3200,
    tariffRate: '21.5p/kWh; Standing: £1.20/day',
    portalLogin: 'admin@samkocentral.com',
    supplierPhone: '0800 048 0202',
    supplierEmail: 'business@britishgas.co.uk',
    status: 'active',
    notes: 'Primary half-hourly electricity supply contract.'
  },
  {
    id: 'util-002',
    property: 'Stanhill Court',
    utilityType: 'Gas',
    supplier: 'TotalEnergies Gas & Power',
    accountNumber: 'TE-GS-490218',
    meterReference: 'MPRN: 8492019482',
    contractStart: '2025-04-01',
    contractEnd: '2027-03-31',
    annualCost: 24600,
    monthlyCost: 2050,
    tariffRate: '4.2p/kWh; Standing: £2.50/day',
    portalLogin: 'admin@samkocentral.com',
    supplierPhone: '0333 003 7874',
    supplierEmail: 'customercare@totalenergies.com',
    status: 'active',
    notes: '2-year fixed commercial gas tariff for heating & hot water.'
  },
  {
    id: 'util-003',
    property: 'Gow',
    utilityType: 'Water',
    supplier: 'Thames Water Commercial',
    accountNumber: 'TW-WT-109283',
    meterReference: 'SPID: 3901928471',
    contractStart: '2025-02-01',
    contractEnd: '2028-01-31',
    annualCost: 14200,
    monthlyCost: 1183,
    tariffRate: 'Water: £2.10/m³; Sewerage: £1.45/m³',
    portalLogin: 'admin@samkocentral.com',
    supplierPhone: '0800 980 8800',
    supplierEmail: 'commercial@thameswater.co.uk',
    status: 'active',
    notes: 'Commercial water & wastewater services agreement.'
  }
];

utilCode = utilCode.replace(/export const UTILITIES: UtilityAccount\[\] = \[[\s\S]*?\];/g, `export const UTILITIES: UtilityAccount[] = ${JSON.stringify(prunedUtilities, null, 2)};`);
fs.writeFileSync(UTILITIES_DATA_PATH, utilCode, 'utf8');
console.log('utilitiesData.ts pruned to 3 utilities!');

console.log('--- ALL PRUNING COMPLETED SUCCESSFULLY ---');

