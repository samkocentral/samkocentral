// ─── HOTEL ASSET MANAGEMENT DATA ─────────────────────────────────────────────
// Seeded from Excel workbooks: Crowne Plaza Kingston-south, Stanhill Court,
// Hampton 1 & 2, Ravents Ait Island, River Club

export type AssetStatus = 'active' | 'inactive' | 'under-maintenance' | 'disposed' | 'lost';
export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type MaintenanceFrequency = 'monthly' | 'quarterly' | '6-monthly' | 'yearly' | 'custom';
export type MaintenanceStatus = 'scheduled' | 'due-today' | 'overdue' | 'completed' | 'in-progress';
export type InspectionResult = 'pass' | 'fail' | 'pending';

export interface Hotel {
  id: string;
  name: string;
  address: string;
  city: string;
  status: 'active' | 'inactive';
  totalAssets: number;
  manager: string;
  phone: string;
}

export interface Department {
  id: string;
  name: string;
  hotelId: string;
}

export interface AssetCategory {
  id: string;
  name: string;
  color: string;
}

export interface Asset {
  id: string;
  assetId: string;
  name: string;
  category: string;
  department: string;
  hotelId: string;
  hotelName: string;
  location: string;
  floor: string;
  building?: string;
  roomNumber?: string;
  quantity: number;
  unit: string;
  condition: AssetCondition;
  status: AssetStatus;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  replacementDate?: string;
  purchaseCost?: number;
  currentValue?: number;
  responsibleRole: string;
  responsibleUser: string;
  maintenanceSchedule: MaintenanceFrequency;
  inspectionFrequency: string;
  nextInspectionDate: string;
  lastInspectionDate?: string;
  riskLevel: RiskLevel;
  isFixed: boolean;
  notes?: string;
  approvalStatus?: 'approved' | 'pending' | 'hold';
  submittedBy?: string;
  submittedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export function isAssetFixed(a: any): boolean {
  if (!a) return false;
  if (a.isFixed === false) return false;

  const rawType = String(a.type || a.assetType || '').toLowerCase();
  if (
    rawType === 'non-fixed' ||
    rawType.includes('non-fixed') ||
    rawType.includes('loose') ||
    rawType.includes('ffe')
  ) {
    return false;
  }

  const rawCat =
    typeof a.category === 'object' && a.category !== null
      ? a.category.name || a.category.label || ''
      : a.category;
  const cat = String(rawCat ?? '').toLowerCase();

  const rawName =
    typeof a.name === 'object' && a.name !== null
      ? a.name.name || a.name.label || ''
      : a.name || a.assetName;
  const name = String(rawName ?? '').toLowerCase();

  const assetId = String(a.assetId || a.id || '').toUpperCase();
  if (assetId.startsWith('FFE') || assetId.startsWith('NF-')) {
    return false;
  }

  // Categories that are strictly Non-Fixed (FF&E / Loose Items)
  if (
    cat.includes('furniture') ||
    cat.includes('soft furnish') ||
    cat.includes('linen') ||
    cat.includes('joinery') ||
    cat.includes('guest room') ||
    cat.includes('audio visual') ||
    cat.includes('tech') ||
    cat.includes('appliance') ||
    cat.includes('kitchenware')
  ) {
    return false;
  }

  // Common FF&E items that must never be considered fixed infrastructure
  if (
    name.includes('bed base') ||
    name.includes('mattress') ||
    name.includes('headboard') ||
    name.includes('wardrobe') ||
    name.includes('bedside table') ||
    name.includes('writing table') ||
    name.includes('study') ||
    name.includes('tv cabinet') ||
    name.includes('hospitality unit') ||
    name.includes('mirror') ||
    name.includes('television') ||
    name.includes(' tv') ||
    name.includes('tv ') ||
    name.includes('in-room safe') ||
    name.includes('chair') ||
    name.includes('sofa') ||
    name.includes('cushion') ||
    name.includes('towel') ||
    name.includes('vacuum cleaner') ||
    name.includes('microwave') ||
    name.includes('coffee machine') ||
    name.includes('curtain') ||
    name.includes('drawers') ||
    name.includes('dining table')
  ) {
    return false;
  }

  return a.isFixed !== false;
}

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  assetName: string;
  hotelId: string;
  hotelName: string;
  scheduledDate: string;
  completedDate?: string;
  status: MaintenanceStatus;
  type: string;
  frequency: MaintenanceFrequency;
  assignedTo: string;
  notes?: string;
  result?: InspectionResult;
  nextDueDate: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── HOTELS ──────────────────────────────────────────────────────────────────

export const HOTELS: Hotel[] = [
  
  {
    id: 'hotel-001',
    name: 'Crowne Plaza Kingston-south',
    address: 'Holiday Inn, Kingston House Estate, Portsmouth Rd, Thames Ditton, Surbiton KT6 5QG',
    city: 'London',
    status: 'active',
    totalAssets: 1,
    manager: 'Marcus Webb',
    phone: '+44 20 8546 0100',
  },
  {
    id: 'hotel-002',
    name: 'Stanhill Court',
    address: 'Stanhill Road, Charlwood, Horley, Surrey RH6 0EP',
    city: 'Surrey',
    status: 'active',
    totalAssets: 1,
    manager: 'Sarah Chen',
    phone: '+44 1293 862 166',
  },
];

// ─── ASSET CATEGORIES ─────────────────────────────────────────────────────────

export const ASSET_CATEGORIES: AssetCategory[] = [
  { id: 'cat-001', name: 'Furniture & Joinery', color: '#e8c97a' },
  { id: 'cat-002', name: 'Electrical & Lighting', color: '#60a5fa' },
  { id: 'cat-004', name: 'HVAC & Mechanical', color: '#34d399' },
];

// ─── DEPARTMENTS ──────────────────────────────────────────────────────────────

export const DEPARTMENTS = [
  'Housekeeping',
  'Reception',
  'Restaurant',
  'Kitchen',
  'Back Office',
  'Engineering',
  'Plant Room',
  'Public Areas',
  'Laundry',
  'Conference',
  'Maintenance',
  'IT',
  'F&B',
  'Other',
];

// ─── ASSETS (Seeded from all 5 Excel workbooks) ───────────────────────────────

export const ASSETS: Asset[] = [
  {
    id: 'FIX-1794221173240-3',
    assetId: 'FIX-173240-3',
    name: 'Otis Passenger Lift 8-Person',
    category: 'Plant Equipment',
    department: 'Engineering',
    hotelId: 'hotel-002',
    hotelName: 'Stanhill Court',
    location: 'Main Lobby',
    floor: 'All Floors',
    quantity: 1,
    unit: 'Each',
    condition: 'good',
    status: 'active',
    serialNumber: 'OTIS-8P-77',
    purchaseCost: 55000,
    currentValue: 55000,
    manufacturer: 'Otis',
    responsibleRole: 'Chief Engineer',
    responsibleUser: 'Marcus Webb',
    maintenanceSchedule: '6-monthly',
    inspectionFrequency: '6-monthly LOLER Thorough Examination',
    nextInspectionDate: '2026-09-30',
    riskLevel: 'high',
    isFixed: true,
    notes: 'Statutory LOLER 6-monthly thorough exam',
    createdAt: '2026-11-09T10:46:13.240Z',
    updatedAt: '2026-11-09T10:46:18.504Z',
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
    serialNumber: 'CAR-AHU-20K',
    purchaseCost: 42000,
    currentValue: 42000,
    manufacturer: 'Carrier',
    responsibleRole: 'Maintenance Manager',
    responsibleUser: 'Marcus Webb',
    maintenanceSchedule: 'quarterly',
    inspectionFrequency: 'Quarterly filter check & coil service',
    nextInspectionDate: '2026-11-01',
    riskLevel: 'medium',
    isFixed: true,
    notes: 'Primary heating and cooling AHU for public areas',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2026-10-21T00:00:00.000Z',
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
    serialNumber: 'CUM-250-GEN',
    purchaseCost: 68000,
    currentValue: 68000,
    manufacturer: 'Cummins Power',
    responsibleRole: 'Chief Engineer',
    responsibleUser: 'Sarah Chen',
    maintenanceSchedule: 'yearly',
    inspectionFrequency: 'Annual full load bank testing',
    nextInspectionDate: '2026-12-15',
    riskLevel: 'critical',
    isFixed: true,
    notes: 'Auto-transfer switch standby generator for critical life safety systems',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
  },
  {
    id: 'NFA-001',
    assetId: 'FA-001',
    name: 'Bed Bases & Mattresses (Executive King)',
    category: 'Furniture & Joinery',
    department: 'Housekeeping',
    hotelId: 'hotel-001',
    hotelName: 'Crowne Plaza Kingston-south',
    location: 'Guest Rooms',
    floor: 'All Floors',
    quantity: 120,
    unit: 'Each',
    condition: 'good',
    status: 'active',
    serialNumber: 'BB-CP-2024',
    purchaseCost: 24000,
    currentValue: 24000,
    manufacturer: 'Hypnos UK',
    responsibleRole: 'Housekeeping Manager',
    responsibleUser: 'Marcus Webb',
    maintenanceSchedule: 'monthly',
    inspectionFrequency: 'Monthly visual check',
    nextInspectionDate: '2026-10-01',
    riskLevel: 'low',
    isFixed: false,
    notes: 'Full hotel room FF&E inventory',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
  },
  {
    id: 'NFA-002',
    assetId: 'FA-002',
    name: 'Commercial Winterhalter Pass-Through Dishwasher',
    category: 'Kitchen Equipment',
    department: 'Kitchen',
    hotelId: 'hotel-002',
    hotelName: 'Stanhill Court',
    location: 'Main Kitchen',
    floor: 'Ground',
    quantity: 2,
    unit: 'Each',
    condition: 'good',
    status: 'active',
    serialNumber: 'WH-PT-500',
    purchaseCost: 16500,
    currentValue: 16500,
    manufacturer: 'Winterhalter',
    responsibleRole: 'Head Chef',
    responsibleUser: 'Marcus Webb',
    maintenanceSchedule: 'quarterly',
    inspectionFrequency: 'Quarterly descaling & PAT testing',
    nextInspectionDate: '2026-11-15',
    riskLevel: 'medium',
    isFixed: false,
    notes: 'Commercial kitchen wash-station equipment',
    createdAt: '2026-11-09T00:00:00.000Z',
    updatedAt: '2026-11-09T00:00:00.000Z',
  },
  {
    id: 'NFA-003',
    assetId: 'FA-003',
    name: 'Reception Lounge Suite & Coffee Tables',
    category: 'Furniture & Joinery',
    department: 'Reception',
    hotelId: 'hotel-002',
    hotelName: 'Stanhill Court',
    location: 'Main Reception & Lounge',
    floor: 'Ground',
    quantity: 6,
    unit: 'Each',
    condition: 'excellent',
    status: 'active',
    serialNumber: 'RLS-SC-01',
    purchaseCost: 9800,
    currentValue: 9800,
    manufacturer: 'Morgan Contract Furniture',
    responsibleRole: 'Front Office Manager',
    responsibleUser: 'Sarah Chen',
    maintenanceSchedule: 'yearly',
    inspectionFrequency: 'Annual structural check',
    nextInspectionDate: '2026-12-01',
    riskLevel: 'low',
    isFixed: false,
    notes: 'High-traffic lobby lounge furniture',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
  },
];

// ─── MAINTENANCE RECORDS ──────────────────────────────────────────────────────

export const MAINTENANCE_RECORDS: MaintenanceRecord[] = [
  {
    id: 'mai-001',
    assetId: 'FIX-1794221173240-3',
    assetName: 'Otis Passenger Lift 8-Person',
    hotelId: 'hotel-002',
    hotelName: 'Stanhill Court',
    type: 'LOLER Thorough Examination & Lift Servicing',
    status: 'scheduled',
    frequency: '6-monthly',
    assignedTo: 'Otis UK Services',
    scheduledDate: '2026-12-10',
    nextDueDate: '2027-06-10',
    notes: 'Statutory 6-monthly LOLER lift inspection',
    createdAt: '2026-11-09T10:47:27.886Z',
    updatedAt: '2026-11-09T10:47:27.887Z',
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
    updatedAt: '2026-10-21T10:47:27.887Z',
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
    updatedAt: '2026-07-01T10:47:27.887Z',
  },
];

// ─── COMPUTED STATS ───────────────────────────────────────────────────────────

export function getAssetStats() {
  const total = ASSETS.length;
  const fixed = ASSETS.filter((a) => a.isFixed).length;
  const nonFixed = ASSETS.filter((a) => !a.isFixed).length;
  const overdueMaintenance = MAINTENANCE_RECORDS.filter((m) => m.status === 'overdue').length;
  const dueToday = MAINTENANCE_RECORDS.filter((m) => m.status === 'due-today').length;
  const criticalAssets = ASSETS.filter((a) => a.riskLevel === 'critical').length;
  const byDepartment = DEPARTMENTS.reduce(
    (acc, dept) => {
      acc[dept] = ASSETS.filter((a) => a.department === dept).length;
      return acc;
    },
    {} as Record<string, number>
  );
  const byCategory = ASSET_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat.name] = ASSETS.filter((a) => a.category === cat.name).length;
      return acc;
    },
    {} as Record<string, number>
  );
  const byHotel = HOTELS.reduce(
    (acc, h) => {
      acc[h.name] = ASSETS.filter((a) => a.hotelId === h.id).length;
      return acc;
    },
    {} as Record<string, number>
  );
  const maintenanceCompletion = Math.round(
    (MAINTENANCE_RECORDS.filter((m) => m.status === 'completed').length /
      MAINTENANCE_RECORDS.length) *
      100
  );
  return {
    total,
    fixed,
    nonFixed,
    overdueMaintenance,
    dueToday,
    criticalAssets,
    byDepartment,
    byCategory,
    byHotel,
    maintenanceCompletion,
  };
}
