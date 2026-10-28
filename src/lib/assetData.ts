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
  createdAt: string;
  updatedAt: string;
}

export function isAssetFixed(a: any): boolean {
  if (!a) return false;
  if (a.isFixed === false) return false;

  const rawCat =
    typeof a.category === 'object' && a.category !== null
      ? (a.category.name || a.category.label || '')
      : a.category;
  const cat = String(rawCat ?? '').toLowerCase();

  const rawName =
    typeof a.name === 'object' && a.name !== null
      ? (a.name.name || a.name.label || '')
      : (a.name || a.assetName);
  const name = String(rawName ?? '').toLowerCase();

  // Categories that are strictly Non-Fixed (FF&E / Loose Items)
  if (
    cat.includes('furniture') ||
    cat.includes('soft furnish') ||
    cat.includes('linen') ||
    cat.includes('joinery') ||
    cat.includes('guest room')
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
}

// ─── HOTELS ──────────────────────────────────────────────────────────────────

export const HOTELS: Hotel[] = [
  {
    id: 'hotel-001',
    name: 'Crowne Plaza Kingston-south',
    address: 'Holiday Inn, Kingston House Estate, Portsmouth Rd, Thames Ditton, Surbiton KT6 5QG',
    city: 'London',
    status: 'active',
    totalAssets: 171,
    manager: 'Marcus Webb',
    phone: '+44 20 8546 0100',
  },
  {
    id: 'hotel-002',
    name: 'Stanhill Court',
    address: 'Stanhill Road, Charlwood, Horley, Surrey RH6 0EP',
    city: 'Surrey',
    status: 'active',
    totalAssets: 342,
    manager: 'Sarah Chen',
    phone: '+44 1293 862 166',
  },
  {
    id: 'hotel-003',
    name: 'Hotel Hampton 1 & Hampton 2 Property',
    address: 'Kingston House Estate, Portsmouth Rd, Long Ditton, Surbiton KT6 5QG',
    city: 'Surrey',
    status: 'active',
    totalAssets: 188,
    manager: 'James Okafor',
    phone: '+44 20 8941 0200',
  },
  {
    id: 'hotel-004',
    name: 'Ravens Ait Island',
    address: "Ravens Ait, Portsmouth Rd, Surbiton KT6 4HN",
    city: 'London',
    status: 'active',
    totalAssets: 133,
    manager: 'Priya Sharma',
    phone: '+44 20 8399 0300',
  },
  {
    id: 'hotel-005',
    name: 'River Club',
    address: 'Old Malden Lane, Worcester Park KT4 7PX',
    city: 'London',
    status: 'active',
    totalAssets: 223,
    manager: 'David Thornton',
    phone: '+44 20 8977 0400',
  },
  {
    id: 'hotel-006',
    name: 'Warren House',
    address: '19 Warren Road, Kingston upon Thames, Surrey KT2 7HY',
    city: 'London',
    status: 'active',
    totalAssets: 0,
    manager: 'Harshit Gulati',
    phone: '+44 20 8335 6767',
  },
  {
    id: 'hotel-007',
    name: 'Gatwick Manor (Stanhill Court)',
    address: 'Stanhill Road, Charlwood, Horley, Surrey RH6 0EP',
    city: 'Surrey',
    status: 'active',
    totalAssets: 0,
    manager: 'Sarah Chen',
    phone: '+44 1293 862 166',
  },
  {
    id: 'hotel-008',
    name: 'Sharnbrook',
    address: 'Sharnbrook, Bedfordshire',
    city: 'Bedfordshire',
    status: 'active',
    totalAssets: 0,
    manager: 'Group Admin',
    phone: '+44 1234 000000',
  },
];

// ─── ASSET CATEGORIES ─────────────────────────────────────────────────────────

export const ASSET_CATEGORIES: AssetCategory[] = [
  { id: 'cat-001', name: 'Furniture & Joinery', color: '#e8c97a' },
  { id: 'cat-002', name: 'Electrical', color: '#60a5fa' },
  { id: 'cat-003', name: 'Mechanical', color: '#a78bfa' },
  { id: 'cat-004', name: 'HVAC', color: '#34d399' },
  { id: 'cat-005', name: 'Fire Safety', color: '#f43f5e' },
  { id: 'cat-006', name: 'IT Equipment', color: '#38bdf8' },
  { id: 'cat-007', name: 'Kitchen Equipment', color: '#fb923c' },
  { id: 'cat-008', name: 'Soft Furnishings', color: '#f472b6' },
  { id: 'cat-009', name: 'Fixtures', color: '#94a3b8' },
  { id: 'cat-010', name: 'Bathroom Equipment', color: '#67e8f9' },
  { id: 'cat-011', name: 'Plant Equipment', color: '#4ade80' },
  { id: 'cat-012', name: 'Security Systems', color: '#c084fc' },
  { id: 'cat-013', name: 'Other', color: '#6b7280' },
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
  // ── CROWNE PLAZA KINGSTON-SOUTH (Fixed Assets) ──
  { id: 'a-001', assetId: 'FA-001', name: 'Bed Bases', category: 'Furniture & Joinery', department: 'Housekeeping', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Guest Rooms', floor: 'All Floors', quantity: 240, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Housekeeping Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'monthly', inspectionFrequency: 'Monthly visual check', nextInspectionDate: '2026-08-01', lastInspectionDate: '2026-07-01', riskLevel: 'low', isFixed: false, notes: 'Visual check monthly; repair/replace as required', createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-002', assetId: 'FA-002', name: 'Mattresses', category: 'Furniture & Joinery', department: 'Housekeeping', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Guest Rooms', floor: 'All Floors', quantity: 240, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Housekeeping Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'monthly', inspectionFrequency: 'Monthly visual check', nextInspectionDate: '2026-08-01', lastInspectionDate: '2026-07-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-003', assetId: 'FA-003', name: 'Headboard', category: 'Furniture & Joinery', department: 'Housekeeping', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Guest Rooms', floor: 'All Floors', quantity: 120, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Housekeeping Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'monthly', inspectionFrequency: 'Monthly visual check', nextInspectionDate: '2026-08-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-004', assetId: 'FA-004', name: 'Wardrobe', category: 'Furniture & Joinery', department: 'Housekeeping', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Guest Rooms', floor: 'All Floors', quantity: 120, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Housekeeping Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'monthly', inspectionFrequency: 'Monthly visual check', nextInspectionDate: '2026-08-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-005', assetId: 'FA-005', name: 'Bedside Tables', category: 'Furniture & Joinery', department: 'Housekeeping', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Guest Rooms', floor: 'All Floors', quantity: 240, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Housekeeping Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'monthly', inspectionFrequency: 'Monthly visual check', nextInspectionDate: '2026-08-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-006', assetId: 'FA-006', name: 'Study / Writing Table', category: 'Furniture & Joinery', department: 'Housekeeping', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Guest Rooms', floor: 'All Floors', quantity: 120, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Housekeeping Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'monthly', inspectionFrequency: 'Monthly visual check', nextInspectionDate: '2026-08-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-007', assetId: 'FA-007', name: 'TV Cabinet', category: 'Furniture & Joinery', department: 'Maintenance', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Guest Rooms', floor: 'All Floors', quantity: 120, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'quarterly', inspectionFrequency: 'Quarterly functional check', nextInspectionDate: '2026-10-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-008', assetId: 'FA-008', name: 'Hospitality Unit (Safe, Fridge)', category: 'Furniture & Joinery', department: 'Maintenance', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Guest Rooms', floor: 'All Floors', quantity: 120, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'quarterly', inspectionFrequency: 'Quarterly functional check; annual PAT', nextInspectionDate: '2026-10-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-009', assetId: 'FA-009', name: 'Large Mirror', category: 'Fixtures', department: 'Maintenance', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Guest Rooms', floor: 'All Floors', quantity: 120, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'monthly', inspectionFrequency: 'Monthly inspection', nextInspectionDate: '2026-08-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-010', assetId: 'FA-010', name: 'Main Door', category: 'Fixtures', department: 'Housekeeping', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Guest Rooms', floor: 'All Floors', quantity: 120, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Housekeeping Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'monthly', inspectionFrequency: 'Monthly visual check', nextInspectionDate: '2026-08-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-011', assetId: 'FA-011', name: 'Indoor A/C Unit', category: 'HVAC', department: 'Maintenance', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Guest Rooms', floor: 'All Floors', quantity: 120, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'quarterly', inspectionFrequency: 'Quarterly PPM; annual service', nextInspectionDate: '2026-10-01', riskLevel: 'medium', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-012', assetId: 'FA-012', name: 'Outdoor A/C Unit', category: 'HVAC', department: 'Maintenance', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Plant Area', floor: 'Roof', quantity: 10, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'quarterly', inspectionFrequency: 'Quarterly PPM; annual service', nextInspectionDate: '2026-10-01', riskLevel: 'medium', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-013', assetId: 'FA-013', name: 'Ceiling Lights', category: 'Electrical', department: 'Maintenance', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Guest Rooms', floor: 'All Floors', quantity: 1080, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual PPM check', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-014', assetId: 'FA-014', name: 'Bathroom Extractor Fan', category: 'Mechanical', department: 'Maintenance', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Guest Rooms', floor: 'All Floors', quantity: 120, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'quarterly', inspectionFrequency: 'Quarterly PPM; annual service', nextInspectionDate: '2026-10-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-015', assetId: 'FA-015', name: 'WC Unit', category: 'Bathroom Equipment', department: 'Maintenance', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Guest Rooms', floor: 'All Floors', quantity: 120, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'monthly', inspectionFrequency: 'Monthly inspection', nextInspectionDate: '2026-08-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-016', assetId: 'FA-016', name: 'Wash Basin', category: 'Bathroom Equipment', department: 'Maintenance', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Guest Rooms', floor: 'All Floors', quantity: 120, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'monthly', inspectionFrequency: 'Monthly inspection', nextInspectionDate: '2026-08-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-017', assetId: 'FA-017', name: 'Shower Mixer Valve', category: 'Bathroom Equipment', department: 'Maintenance', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Guest Rooms', floor: 'All Floors', quantity: 120, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'monthly', inspectionFrequency: 'Monthly inspection', nextInspectionDate: '2026-08-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-018', assetId: 'FA-018', name: 'Television', category: 'IT Equipment', department: 'Maintenance', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Guest Rooms', floor: 'All Floors', quantity: 120, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'quarterly', inspectionFrequency: 'Quarterly functional check; annual PAT', nextInspectionDate: '2026-10-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-019', assetId: 'FA-019', name: 'In-Room Safe', category: 'IT Equipment', department: 'Maintenance', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Guest Rooms', floor: 'All Floors', quantity: 120, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'quarterly', inspectionFrequency: 'Quarterly functional check', nextInspectionDate: '2026-10-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-020', assetId: 'FA-020', name: 'Fire Alarm Detectors', category: 'Fire Safety', department: 'Maintenance', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Guest Rooms', floor: 'All Floors', quantity: 120, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: '6-monthly', inspectionFrequency: 'Weekly user test; 6-monthly service', nextInspectionDate: '2026-10-01', riskLevel: 'high', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-021', assetId: 'FA-021', name: 'Key Card Panel', category: 'Electrical', department: 'Maintenance', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Guest Rooms', floor: 'All Floors', quantity: 120, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual PPM check', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-022', assetId: 'FA-022', name: 'Balcony Chairs', category: 'Furniture & Joinery', department: 'Maintenance', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Balconies', floor: 'All Floors', quantity: 240, unit: 'Each', condition: 'fair', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'monthly', inspectionFrequency: 'Monthly inspection', nextInspectionDate: '2026-08-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  // Non-Fixed Assets
  { id: 'a-023', assetId: 'NFA-001', name: 'Bed Linen Set', category: 'Soft Furnishings', department: 'Housekeeping', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Linen Store', floor: 'Ground Floor', quantity: 480, unit: 'Set', condition: 'good', status: 'active', responsibleRole: 'Housekeeping Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'monthly', inspectionFrequency: 'Monthly stock check', nextInspectionDate: '2026-08-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-024', assetId: 'NFA-002', name: 'Towel Set', category: 'Soft Furnishings', department: 'Housekeeping', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Linen Store', floor: 'Ground Floor', quantity: 720, unit: 'Set', condition: 'good', status: 'active', responsibleRole: 'Housekeeping Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'monthly', inspectionFrequency: 'Monthly stock check', nextInspectionDate: '2026-08-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-025', assetId: 'NFA-003', name: 'Vacuum Cleaner', category: 'Electrical', department: 'Housekeeping', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Housekeeping Store', floor: 'Ground Floor', quantity: 12, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Housekeeping Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'quarterly', inspectionFrequency: 'Quarterly PAT; annual service', nextInspectionDate: '2026-10-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  // Restaurant
  { id: 'a-026', assetId: 'REST-001', name: 'Commercial Oven', category: 'Kitchen Equipment', department: 'Kitchen', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Main Kitchen', floor: 'Ground Floor', quantity: 4, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Head Chef', responsibleUser: 'Marcus Webb', maintenanceSchedule: '6-monthly', inspectionFrequency: '6-monthly service', nextInspectionDate: '2027-01-01', riskLevel: 'medium', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-027', assetId: 'REST-002', name: 'Commercial Dishwasher', category: 'Kitchen Equipment', department: 'Kitchen', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Main Kitchen', floor: 'Ground Floor', quantity: 2, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Head Chef', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'quarterly', inspectionFrequency: 'Quarterly service', nextInspectionDate: '2026-10-01', riskLevel: 'medium', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-028', assetId: 'REST-003', name: 'Restaurant Tables', category: 'Furniture & Joinery', department: 'Restaurant', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Restaurant', floor: 'Ground Floor', quantity: 40, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'F&B Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'monthly', inspectionFrequency: 'Monthly visual check', nextInspectionDate: '2026-08-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-029', assetId: 'REST-004', name: 'Restaurant Chairs', category: 'Furniture & Joinery', department: 'Restaurant', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Restaurant', floor: 'Ground Floor', quantity: 160, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'F&B Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'monthly', inspectionFrequency: 'Monthly visual check', nextInspectionDate: '2026-08-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  // Plant Equipment
  { id: 'a-030', assetId: 'PE-001', name: 'Boiler System', category: 'Plant Equipment', department: 'Engineering', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Plant Room', floor: 'Basement', quantity: 2, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Chief Engineer', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual statutory inspection', nextInspectionDate: '2027-01-01', riskLevel: 'high', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-031', assetId: 'PE-002', name: 'Water Pump', category: 'Plant Equipment', department: 'Engineering', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Plant Room', floor: 'Basement', quantity: 4, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Chief Engineer', responsibleUser: 'Marcus Webb', maintenanceSchedule: '6-monthly', inspectionFrequency: '6-monthly service', nextInspectionDate: '2027-01-01', riskLevel: 'high', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-032', assetId: 'PE-003', name: 'Emergency Generator', category: 'Plant Equipment', department: 'Engineering', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Plant Room', floor: 'Basement', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Chief Engineer', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'quarterly', inspectionFrequency: 'Quarterly test run; annual service', nextInspectionDate: '2026-10-01', riskLevel: 'critical', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  // Reception
  { id: 'a-033', assetId: 'REC-001', name: 'Reception Desk', category: 'Furniture & Joinery', department: 'Reception', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Reception', floor: 'Ground Floor', quantity: 1, unit: 'Each', condition: 'excellent', status: 'active', responsibleRole: 'Front Office Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-034', assetId: 'REC-002', name: 'CCTV System', category: 'Security Systems', department: 'Reception', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Reception', floor: 'Ground Floor', quantity: 1, unit: 'System', condition: 'good', status: 'active', responsibleRole: 'Security Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'quarterly', inspectionFrequency: 'Quarterly inspection', nextInspectionDate: '2026-10-01', riskLevel: 'high', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-035', assetId: 'REC-003', name: 'Fire Extinguisher – CO2', category: 'Fire Safety', department: 'Reception', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', location: 'Reception', floor: 'Ground Floor', quantity: 3, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Marcus Webb', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual service; monthly visual', nextInspectionDate: '2027-01-01', riskLevel: 'high', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },

  // ── STANHILL COURT ──
  { id: 'a-036', assetId: 'SC-001', name: 'Smoke Detector', category: 'Fire Safety', department: 'Maintenance', hotelId: 'hotel-002', hotelName: 'Stanhill Court', location: 'Guest Bedrooms', floor: 'All Floors', quantity: 42, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Sarah Chen', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual test', nextInspectionDate: '2027-01-01', riskLevel: 'high', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-037', assetId: 'SC-002', name: 'Wall Radiators', category: 'Mechanical', department: 'Maintenance', hotelId: 'hotel-002', hotelName: 'Stanhill Court', location: 'Guest Bedrooms', floor: 'All Floors', quantity: 84, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Sarah Chen', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual check', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-038', assetId: 'SC-003', name: 'Upholstered Chairs', category: 'Furniture & Joinery', department: 'Housekeeping', hotelId: 'hotel-002', hotelName: 'Stanhill Court', location: 'Guest Bedrooms', floor: 'All Floors', quantity: 84, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'HK Supervisor', responsibleUser: 'Sarah Chen', maintenanceSchedule: 'yearly', inspectionFrequency: 'As required', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-039', assetId: 'SC-004', name: 'Sofa', category: 'Furniture & Joinery', department: 'Housekeeping', hotelId: 'hotel-002', hotelName: 'Stanhill Court', location: 'Guest Bedrooms', floor: 'All Floors', quantity: 42, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'HK Supervisor', responsibleUser: 'Sarah Chen', maintenanceSchedule: 'yearly', inspectionFrequency: 'As required', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-040', assetId: 'SC-005', name: 'Bedside Tables', category: 'Furniture & Joinery', department: 'Housekeeping', hotelId: 'hotel-002', hotelName: 'Stanhill Court', location: 'Guest Bedrooms', floor: 'All Floors', quantity: 84, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'HK Supervisor', responsibleUser: 'Sarah Chen', maintenanceSchedule: 'yearly', inspectionFrequency: 'As required', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-041', assetId: 'SC-006', name: 'Bedside Lamps', category: 'Electrical', department: 'Maintenance', hotelId: 'hotel-002', hotelName: 'Stanhill Court', location: 'Guest Bedrooms', floor: 'All Floors', quantity: 84, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Sarah Chen', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual PAT', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-042', assetId: 'SC-007', name: 'Bed Mattress', category: 'Furniture & Joinery', department: 'Housekeeping', hotelId: 'hotel-002', hotelName: 'Stanhill Court', location: 'Guest Bedrooms', floor: 'All Floors', quantity: 42, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'HK Supervisor', responsibleUser: 'Sarah Chen', maintenanceSchedule: 'yearly', inspectionFrequency: 'Replace every 5-7 years', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-043', assetId: 'SC-008', name: 'Wardrobe', category: 'Furniture & Joinery', department: 'Housekeeping', hotelId: 'hotel-002', hotelName: 'Stanhill Court', location: 'Guest Bedrooms', floor: 'All Floors', quantity: 42, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'HK Supervisor', responsibleUser: 'Sarah Chen', maintenanceSchedule: 'yearly', inspectionFrequency: 'As required', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-044', assetId: 'SC-009', name: 'Bathroom Extractor Fan', category: 'Mechanical', department: 'Maintenance', hotelId: 'hotel-002', hotelName: 'Stanhill Court', location: 'Guest Bedrooms', floor: 'All Floors', quantity: 42, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Sarah Chen', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual service', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-045', assetId: 'SC-010', name: 'Television', category: 'IT Equipment', department: 'Maintenance', hotelId: 'hotel-002', hotelName: 'Stanhill Court', location: 'Guest Bedrooms', floor: 'All Floors', quantity: 42, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Sarah Chen', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-046', assetId: 'SC-011', name: 'Commercial Oven (Kitchen)', category: 'Kitchen Equipment', department: 'Kitchen', hotelId: 'hotel-002', hotelName: 'Stanhill Court', location: 'Main Kitchen', floor: 'Ground Floor', quantity: 3, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Head Chef', responsibleUser: 'Sarah Chen', maintenanceSchedule: '6-monthly', inspectionFrequency: '6-monthly service', nextInspectionDate: '2027-01-01', riskLevel: 'medium', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-047', assetId: 'SC-012', name: 'Bar Refrigerator', category: 'Kitchen Equipment', department: 'Restaurant', hotelId: 'hotel-002', hotelName: 'Stanhill Court', location: 'Bar Area', floor: 'Ground Floor', quantity: 4, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Bar Manager', responsibleUser: 'Sarah Chen', maintenanceSchedule: 'quarterly', inspectionFrequency: 'Quarterly service', nextInspectionDate: '2026-10-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-048', assetId: 'SC-013', name: 'Boiler System', category: 'Plant Equipment', department: 'Engineering', hotelId: 'hotel-002', hotelName: 'Stanhill Court', location: 'Plant Room', floor: 'Basement', quantity: 1, unit: 'System', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Sarah Chen', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual statutory inspection', nextInspectionDate: '2027-01-01', riskLevel: 'high', isFixed: true, notes: 'Connected to central boiler', createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-049', assetId: 'SC-014', name: 'Fire Alarm Panel', category: 'Fire Safety', department: 'Maintenance', hotelId: 'hotel-002', hotelName: 'Stanhill Court', location: 'Reception', floor: 'Ground Floor', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Sarah Chen', maintenanceSchedule: 'quarterly', inspectionFrequency: 'Quarterly fire alarm inspection', nextInspectionDate: '2026-10-01', riskLevel: 'critical', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-050', assetId: 'SC-015', name: 'Chandelier (Bedroom)', category: 'Electrical', department: 'Maintenance', hotelId: 'hotel-002', hotelName: 'Stanhill Court', location: 'Guest Bedrooms', floor: 'All Floors', quantity: 42, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Sarah Chen', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual check', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },

  // ── HAMPTON 1 & 2 ──
  { id: 'a-051', assetId: 'HS1-2BHK-001', name: 'Ceiling Lights', category: 'Electrical', department: 'Maintenance', hotelId: 'hotel-003', hotelName: 'Hotel Hampton 1 & Hampton 2 Property', location: '2BHK Flat', floor: 'All Floors', quantity: 25, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'James Okafor', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual electrical check', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-052', assetId: 'HS1-2BHK-002', name: 'Television', category: 'IT Equipment', department: 'Maintenance', hotelId: 'hotel-003', hotelName: 'Hotel Hampton 1 & Hampton 2 Property', location: 'Living Room / Bedroom', floor: 'All Floors', quantity: 2, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'James Okafor', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-053', assetId: 'HS1-2BHK-003', name: 'TV Cabinet', category: 'Furniture & Joinery', department: 'Housekeeping', hotelId: 'hotel-003', hotelName: 'Hotel Hampton 1 & Hampton 2 Property', location: 'Living Room', floor: 'All Floors', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'HK Supervisor', responsibleUser: 'James Okafor', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-054', assetId: 'HS1-2BHK-004', name: 'Microwave', category: 'Kitchen Equipment', department: 'Kitchen', hotelId: 'hotel-003', hotelName: 'Hotel Hampton 1 & Hampton 2 Property', location: 'Kitchen', floor: 'All Floors', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'James Okafor', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual check', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-055', assetId: 'HS1-2BHK-005', name: 'Dining Table', category: 'Furniture & Joinery', department: 'Housekeeping', hotelId: 'hotel-003', hotelName: 'Hotel Hampton 1 & Hampton 2 Property', location: 'Living Room', floor: 'All Floors', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'HK Supervisor', responsibleUser: 'James Okafor', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-056', assetId: 'HS1-2BHK-006', name: 'Dining Chairs', category: 'Furniture & Joinery', department: 'Housekeeping', hotelId: 'hotel-003', hotelName: 'Hotel Hampton 1 & Hampton 2 Property', location: 'Living Room', floor: 'All Floors', quantity: 4, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'HK Supervisor', responsibleUser: 'James Okafor', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-057', assetId: 'HS1-2BHK-007', name: 'Sofa', category: 'Furniture & Joinery', department: 'Housekeeping', hotelId: 'hotel-003', hotelName: 'Hotel Hampton 1 & Hampton 2 Property', location: 'Living Room', floor: 'All Floors', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'HK Supervisor', responsibleUser: 'James Okafor', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-058', assetId: 'HS1-2BHK-008', name: 'Sheer Curtains', category: 'Soft Furnishings', department: 'Housekeeping', hotelId: 'hotel-003', hotelName: 'Hotel Hampton 1 & Hampton 2 Property', location: 'Living Room', floor: 'All Floors', quantity: 1, unit: 'Set', condition: 'good', status: 'active', responsibleRole: 'HK Supervisor', responsibleUser: 'James Okafor', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-059', assetId: 'HS1-2BHK-009', name: 'Induction Hob', category: 'Kitchen Equipment', department: 'Kitchen', hotelId: 'hotel-003', hotelName: 'Hotel Hampton 1 & Hampton 2 Property', location: 'Kitchen', floor: 'All Floors', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'James Okafor', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual check', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-060', assetId: 'HS1-2BHK-010', name: 'Fridge', category: 'Kitchen Equipment', department: 'Kitchen', hotelId: 'hotel-003', hotelName: 'Hotel Hampton 1 & Hampton 2 Property', location: 'Kitchen', floor: 'All Floors', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'James Okafor', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-061', assetId: 'HS1-2BHK-011', name: 'Smoke Alarm', category: 'Fire Safety', department: 'Maintenance', hotelId: 'hotel-003', hotelName: 'Hotel Hampton 1 & Hampton 2 Property', location: 'Flat', floor: 'All Floors', quantity: 2, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'James Okafor', maintenanceSchedule: 'quarterly', inspectionFrequency: 'Quarterly check', nextInspectionDate: '2026-10-01', riskLevel: 'high', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-062', assetId: 'HS1-2BHK-012', name: 'Radiators', category: 'Mechanical', department: 'Maintenance', hotelId: 'hotel-003', hotelName: 'Hotel Hampton 1 & Hampton 2 Property', location: 'Flat', floor: 'All Floors', quantity: 2, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'James Okafor', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual heating service', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-063', assetId: 'HS1-2BHK-013', name: 'Wardrobe (Single)', category: 'Furniture & Joinery', department: 'Housekeeping', hotelId: 'hotel-003', hotelName: 'Hotel Hampton 1 & Hampton 2 Property', location: 'Bedroom', floor: 'All Floors', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'HK Supervisor', responsibleUser: 'James Okafor', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-064', assetId: 'HS1-2BHK-014', name: 'Wardrobe (Double)', category: 'Furniture & Joinery', department: 'Housekeeping', hotelId: 'hotel-003', hotelName: 'Hotel Hampton 1 & Hampton 2 Property', location: 'Bedroom', floor: 'All Floors', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'HK Supervisor', responsibleUser: 'James Okafor', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-065', assetId: 'HS1-2BHK-015', name: 'Chest of Drawers', category: 'Furniture & Joinery', department: 'Housekeeping', hotelId: 'hotel-003', hotelName: 'Hotel Hampton 1 & Hampton 2 Property', location: 'Bedroom', floor: 'All Floors', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'HK Supervisor', responsibleUser: 'James Okafor', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },

  // ── RAVENTS AIT ISLAND ──
  { id: 'a-066', assetId: 'RA-001', name: 'Ceiling Lights', category: 'Electrical', department: 'Maintenance', hotelId: 'hotel-004', hotelName: 'Ravents Ait Island', location: 'Event Room - Reception', floor: 'Ground Floor', quantity: 20, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Priya Sharma', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual electrical inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-067', assetId: 'RA-002', name: 'CCTV Camera', category: 'Security Systems', department: 'Maintenance', hotelId: 'hotel-004', hotelName: 'Ravents Ait Island', location: 'Event Room - Reception', floor: 'Ground Floor', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Priya Sharma', maintenanceSchedule: 'quarterly', inspectionFrequency: 'Quarterly inspection & system check', nextInspectionDate: '2026-10-01', riskLevel: 'high', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-068', assetId: 'RA-003', name: 'Smoke Alarms', category: 'Fire Safety', department: 'Maintenance', hotelId: 'hotel-004', hotelName: 'Ravents Ait Island', location: 'Event Room - Reception', floor: 'Ground Floor', quantity: 3, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Priya Sharma', maintenanceSchedule: 'monthly', inspectionFrequency: 'Monthly test; annual certification', nextInspectionDate: '2026-08-01', riskLevel: 'critical', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-069', assetId: 'RA-004', name: 'Chairs (Chivalry)', category: 'Furniture & Joinery', department: 'Housekeeping', hotelId: 'hotel-004', hotelName: 'Ravents Ait Island', location: 'Event Room - Reception', floor: 'Ground Floor', quantity: 22, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Events Manager', responsibleUser: 'Priya Sharma', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-070', assetId: 'RA-005', name: 'Fire Exit Sign', category: 'Fire Safety', department: 'Maintenance', hotelId: 'hotel-004', hotelName: 'Ravents Ait Island', location: 'Event Room - Reception', floor: 'Ground Floor', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Priya Sharma', maintenanceSchedule: 'monthly', inspectionFrequency: 'Monthly inspection', nextInspectionDate: '2026-08-01', riskLevel: 'high', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-071', assetId: 'RA-006', name: 'Room Divider', category: 'Furniture & Joinery', department: 'Housekeeping', hotelId: 'hotel-004', hotelName: 'Ravents Ait Island', location: 'Event Room - Reception', floor: 'Ground Floor', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Events Manager', responsibleUser: 'Priya Sharma', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-072', assetId: 'RA-007', name: 'Radiators', category: 'Mechanical', department: 'Maintenance', hotelId: 'hotel-004', hotelName: 'Ravents Ait Island', location: 'Event Room - Reception', floor: 'Ground Floor', quantity: 5, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Priya Sharma', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual heating system inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-073', assetId: 'RA-008', name: 'Fire Extinguisher – CO2', category: 'Fire Safety', department: 'Maintenance', hotelId: 'hotel-004', hotelName: 'Ravents Ait Island', location: 'Event Room - Reception', floor: 'Ground Floor', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Priya Sharma', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual service; monthly visual', nextInspectionDate: '2027-01-01', riskLevel: 'high', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-074', assetId: 'RA-009', name: 'Fire Extinguisher – Foam', category: 'Fire Safety', department: 'Maintenance', hotelId: 'hotel-004', hotelName: 'Ravents Ait Island', location: 'Event Room - Reception', floor: 'Ground Floor', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Priya Sharma', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual service; monthly visual', nextInspectionDate: '2027-01-01', riskLevel: 'high', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-075', assetId: 'RA-010', name: 'Emergency Light', category: 'Fire Safety', department: 'Maintenance', hotelId: 'hotel-004', hotelName: 'Ravents Ait Island', location: 'Event Room - Reception', floor: 'Ground Floor', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Priya Sharma', maintenanceSchedule: 'monthly', inspectionFrequency: 'Monthly function test; annual inspection', nextInspectionDate: '2026-08-01', riskLevel: 'high', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-076', assetId: 'RA-011', name: 'AC Unit', category: 'HVAC', department: 'Maintenance', hotelId: 'hotel-004', hotelName: 'Ravents Ait Island', location: 'Event Room - Reception', floor: 'Ground Floor', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Priya Sharma', maintenanceSchedule: '6-monthly', inspectionFrequency: 'Biannual servicing', nextInspectionDate: '2027-01-01', riskLevel: 'medium', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-077', assetId: 'RA-012', name: 'Premium Cushions', category: 'Soft Furnishings', department: 'Housekeeping', hotelId: 'hotel-004', hotelName: 'Ravents Ait Island', location: 'Reception', floor: 'Ground Floor', quantity: 6, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Events Manager', responsibleUser: 'Priya Sharma', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-078', assetId: 'RA-013', name: 'Fire Alarm Panel', category: 'Fire Safety', department: 'Maintenance', hotelId: 'hotel-004', hotelName: 'Ravents Ait Island', location: 'Reception', floor: 'Ground Floor', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Priya Sharma', maintenanceSchedule: 'quarterly', inspectionFrequency: 'Quarterly fire alarm inspection', nextInspectionDate: '2026-10-01', riskLevel: 'critical', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-079', assetId: 'RA-014', name: 'Sofa', category: 'Furniture & Joinery', department: 'Housekeeping', hotelId: 'hotel-004', hotelName: 'Ravents Ait Island', location: 'Reception', floor: 'Ground Floor', quantity: 2, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Events Manager', responsibleUser: 'Priya Sharma', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-080', assetId: 'RA-015', name: 'Advertisement Display Screen', category: 'IT Equipment', department: 'IT', hotelId: 'hotel-004', hotelName: 'Ravents Ait Island', location: 'Reception', floor: 'Ground Floor', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'IT Manager', responsibleUser: 'Priya Sharma', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-081', assetId: 'RA-016', name: 'Commercial Kitchen Equipment', category: 'Kitchen Equipment', department: 'Kitchen', hotelId: 'hotel-004', hotelName: 'Ravents Ait Island', location: 'Commercial Kitchen', floor: 'Ground Floor', quantity: 1, unit: 'Set', condition: 'good', status: 'active', responsibleRole: 'Head Chef', responsibleUser: 'Priya Sharma', maintenanceSchedule: '6-monthly', inspectionFrequency: '6-monthly service', nextInspectionDate: '2027-01-01', riskLevel: 'medium', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-082', assetId: 'RA-017', name: 'Marquee Structure', category: 'Fixtures', department: 'Maintenance', hotelId: 'hotel-004', hotelName: 'Ravents Ait Island', location: 'Marquee', floor: 'Ground Floor', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Priya Sharma', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual structural inspection', nextInspectionDate: '2027-01-01', riskLevel: 'high', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },

  // ── RIVER CLUB ──
  { id: 'a-083', assetId: 'RC-001', name: 'CCTV System', category: 'Security Systems', department: 'Maintenance', hotelId: 'hotel-005', hotelName: 'River Club', location: 'Lounge / Café Area', floor: 'Ground Floor', quantity: 1, unit: 'System', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Ewan McAllister', maintenanceSchedule: 'quarterly', inspectionFrequency: 'Quarterly inspection', nextInspectionDate: '2026-10-01', riskLevel: 'high', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-084', assetId: 'RC-002', name: 'Coffee Machines', category: 'Kitchen Equipment', department: 'F&B', hotelId: 'hotel-005', hotelName: 'River Club', location: 'Café Counter', floor: 'Ground Floor', quantity: 2, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'F&B Manager', responsibleUser: 'Ewan McAllister', maintenanceSchedule: 'quarterly', inspectionFrequency: 'Quarterly service', nextInspectionDate: '2026-10-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-085', assetId: 'RC-003', name: 'POS Monitor', category: 'IT Equipment', department: 'Reception', hotelId: 'hotel-005', hotelName: 'River Club', location: 'Counter / Desk Area', floor: 'Ground Floor', quantity: 2, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'IT Manager', responsibleUser: 'Ewan McAllister', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-086', assetId: 'RC-004', name: 'Cash Till', category: 'IT Equipment', department: 'Reception', hotelId: 'hotel-005', hotelName: 'River Club', location: 'Counter', floor: 'Ground Floor', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Reception Manager', responsibleUser: 'Ewan McAllister', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-087', assetId: 'RC-005', name: 'Fire Alarm Equipment', category: 'Fire Safety', department: 'Maintenance', hotelId: 'hotel-005', hotelName: 'River Club', location: 'Main Area', floor: 'Ground Floor', quantity: 1, unit: 'System', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Ewan McAllister', maintenanceSchedule: 'quarterly', inspectionFrequency: 'Quarterly inspection', nextInspectionDate: '2026-10-01', riskLevel: 'critical', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-088', assetId: 'RC-006', name: 'Speakers (AV)', category: 'IT Equipment', department: 'F&B', hotelId: 'hotel-005', hotelName: 'River Club', location: 'Lounge / Café Area', floor: 'Ground Floor', quantity: 3, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'F&B Manager', responsibleUser: 'Ewan McAllister', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-089', assetId: 'RC-007', name: 'Mini Fridges', category: 'Kitchen Equipment', department: 'F&B', hotelId: 'hotel-005', hotelName: 'River Club', location: 'Counter / Service Area', floor: 'Ground Floor', quantity: 2, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'F&B Manager', responsibleUser: 'Ewan McAllister', maintenanceSchedule: 'quarterly', inspectionFrequency: 'Quarterly service', nextInspectionDate: '2026-10-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-090', assetId: 'RC-008', name: 'Lounge Chairs', category: 'Furniture & Joinery', department: 'F&B', hotelId: 'hotel-005', hotelName: 'River Club', location: 'Lounge / Café Area', floor: 'Ground Floor', quantity: 6, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'F&B Manager', responsibleUser: 'Ewan McAllister', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-091', assetId: 'RC-009', name: 'Emergency Lights', category: 'Electrical', department: 'Maintenance', hotelId: 'hotel-005', hotelName: 'River Club', location: 'Lounge / Café Area', floor: 'Ground Floor', quantity: 4, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Ewan McAllister', maintenanceSchedule: 'monthly', inspectionFrequency: 'Monthly function test', nextInspectionDate: '2026-08-01', riskLevel: 'high', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-092', assetId: 'RC-FIRE-002', name: 'Fire Extinguisher – CO2', category: 'Fire Safety', department: 'Maintenance', hotelId: 'hotel-005', hotelName: 'River Club', location: 'Reception Corridor', floor: 'Ground Floor', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Ewan McAllister', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual service; monthly visual', nextInspectionDate: '2027-01-01', riskLevel: 'high', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-093', assetId: 'RC-FIRE-003', name: 'Fire Extinguisher – Water', category: 'Fire Safety', department: 'Maintenance', hotelId: 'hotel-005', hotelName: 'River Club', location: 'Reception Corridor', floor: 'Ground Floor', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Ewan McAllister', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual service; monthly visual', nextInspectionDate: '2027-01-01', riskLevel: 'high', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-094', assetId: 'RC-HVAC-001', name: 'A/C Unit', category: 'HVAC', department: 'Maintenance', hotelId: 'hotel-005', hotelName: 'River Club', location: 'Reception Corridor', floor: 'Ground Floor', quantity: 1, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Ewan McAllister', maintenanceSchedule: '6-monthly', inspectionFrequency: 'Biannual servicing', nextInspectionDate: '2027-01-01', riskLevel: 'medium', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-095', assetId: 'RC-GYM-001', name: 'Gym Equipment Set', category: 'Other', department: 'Other', hotelId: 'hotel-005', hotelName: 'River Club', location: 'Gym', floor: 'Ground Floor', quantity: 1, unit: 'Set', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Ewan McAllister', maintenanceSchedule: 'quarterly', inspectionFrequency: 'Quarterly inspection', nextInspectionDate: '2026-10-01', riskLevel: 'medium', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-096', assetId: 'RC-GYM-002', name: 'Weight Room Equipment', category: 'Other', department: 'Other', hotelId: 'hotel-005', hotelName: 'River Club', location: 'Weight Room', floor: 'Ground Floor', quantity: 1, unit: 'Set', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Ewan McAllister', maintenanceSchedule: 'quarterly', inspectionFrequency: 'Quarterly inspection', nextInspectionDate: '2026-10-01', riskLevel: 'medium', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-097', assetId: 'RC-STUDIO-001', name: 'Studio Mirrors', category: 'Fixtures', department: 'Other', hotelId: 'hotel-005', hotelName: 'River Club', location: 'Studio', floor: 'Ground Floor', quantity: 4, unit: 'Each', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Ewan McAllister', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'low', isFixed: true, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
  { id: 'a-098', assetId: 'RC-PHYSIO-001', name: 'Physiotherapy Equipment', category: 'Other', department: 'Other', hotelId: 'hotel-005', hotelName: 'River Club', location: 'Physiotherapy Room', floor: 'Ground Floor', quantity: 1, unit: 'Set', condition: 'good', status: 'active', responsibleRole: 'Maintenance Manager', responsibleUser: 'Ewan McAllister', maintenanceSchedule: 'yearly', inspectionFrequency: 'Annual inspection', nextInspectionDate: '2027-01-01', riskLevel: 'medium', isFixed: false, createdAt: '2024-01-01', updatedAt: '2026-07-01' },
];

// ─── MAINTENANCE RECORDS ──────────────────────────────────────────────────────

export const MAINTENANCE_RECORDS: MaintenanceRecord[] = [
  { id: 'mr-001', assetId: 'a-020', assetName: 'Fire Alarm Detectors', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', scheduledDate: '2026-07-15', status: 'overdue', type: 'Fire Safety Inspection', frequency: '6-monthly', assignedTo: 'Marcus Webb', notes: '6-monthly service overdue', nextDueDate: '2027-01-15' },
  { id: 'mr-002', assetId: 'a-030', assetName: 'Boiler System', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', scheduledDate: '2027-01-01', status: 'scheduled', type: 'Annual Statutory Inspection', frequency: 'yearly', assignedTo: 'Marcus Webb', nextDueDate: '2027-01-01' },
  { id: 'mr-003', assetId: 'a-032', assetName: 'Emergency Generator', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', scheduledDate: '2026-10-01', status: 'scheduled', type: 'Quarterly Test Run', frequency: 'quarterly', assignedTo: 'Marcus Webb', nextDueDate: '2026-10-01' },
  { id: 'mr-004', assetId: 'a-011', assetName: 'Indoor A/C Unit', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', scheduledDate: '2026-10-01', status: 'scheduled', type: 'Quarterly PPM', frequency: 'quarterly', assignedTo: 'Marcus Webb', nextDueDate: '2026-10-01' },
  { id: 'mr-005', assetId: 'a-049', assetName: 'Fire Alarm Panel', hotelId: 'hotel-002', hotelName: 'Stanhill Court', scheduledDate: '2026-07-21', status: 'due-today', type: 'Quarterly Fire Alarm Inspection', frequency: 'quarterly', assignedTo: 'Sarah Chen', nextDueDate: '2026-10-21' },
  { id: 'mr-006', assetId: 'a-046', assetName: 'Commercial Oven (Kitchen)', hotelId: 'hotel-002', hotelName: 'Stanhill Court', scheduledDate: '2027-01-01', status: 'scheduled', type: '6-Monthly Service', frequency: '6-monthly', assignedTo: 'Sarah Chen', nextDueDate: '2027-01-01' },
  { id: 'mr-007', assetId: 'a-048', assetName: 'Boiler System', hotelId: 'hotel-002', hotelName: 'Stanhill Court', scheduledDate: '2027-01-01', status: 'scheduled', type: 'Annual Statutory Inspection', frequency: 'yearly', assignedTo: 'Sarah Chen', nextDueDate: '2027-01-01' },
  { id: 'mr-008', assetId: 'a-061', assetName: 'Smoke Alarm', hotelId: 'hotel-003', hotelName: 'Hotel Hampton 1 & Hampton 2 Property', scheduledDate: '2026-07-10', status: 'overdue', type: 'Quarterly Check', frequency: 'quarterly', assignedTo: 'James Okafor', notes: 'Quarterly check overdue', nextDueDate: '2026-10-10' },
  { id: 'mr-009', assetId: 'a-067', assetName: 'CCTV Camera', hotelId: 'hotel-004', hotelName: 'Ravents Ait Island', scheduledDate: '2026-10-01', status: 'scheduled', type: 'Quarterly Inspection', frequency: 'quarterly', assignedTo: 'Priya Sharma', nextDueDate: '2026-10-01' },
  { id: 'mr-010', assetId: 'a-078', assetName: 'Fire Alarm Panel', hotelId: 'hotel-004', hotelName: 'Ravents Ait Island', scheduledDate: '2026-10-01', status: 'scheduled', type: 'Quarterly Fire Alarm Inspection', frequency: 'quarterly', assignedTo: 'Priya Sharma', nextDueDate: '2026-10-01' },
  { id: 'mr-011', assetId: 'a-068', assetName: 'Smoke Alarms', hotelId: 'hotel-004', hotelName: 'Ravents Ait Island', scheduledDate: '2026-07-21', status: 'due-today', type: 'Monthly Test', frequency: 'monthly', assignedTo: 'Priya Sharma', nextDueDate: '2026-08-21' },
  { id: 'mr-012', assetId: 'a-087', assetName: 'Fire Alarm Equipment', hotelId: 'hotel-005', hotelName: 'River Club', scheduledDate: '2026-10-01', status: 'scheduled', type: 'Quarterly Inspection', frequency: 'quarterly', assignedTo: 'Ewan McAllister', nextDueDate: '2026-10-01' },
  { id: 'mr-013', assetId: 'a-083', assetName: 'CCTV System', hotelId: 'hotel-005', hotelName: 'River Club', scheduledDate: '2026-10-01', status: 'scheduled', type: 'Quarterly Inspection', frequency: 'quarterly', assignedTo: 'Ewan McAllister', nextDueDate: '2026-10-01' },
  { id: 'mr-014', assetId: 'a-095', assetName: 'Gym Equipment Set', hotelId: 'hotel-005', hotelName: 'River Club', scheduledDate: '2026-07-05', status: 'overdue', type: 'Quarterly Inspection', frequency: 'quarterly', assignedTo: 'Ewan McAllister', notes: 'Quarterly inspection overdue', nextDueDate: '2026-10-05' },
  { id: 'mr-015', assetId: 'a-036', assetName: 'Smoke Detector', hotelId: 'hotel-002', hotelName: 'Stanhill Court', scheduledDate: '2026-06-01', completedDate: '2026-06-01', status: 'completed', type: 'Annual Test', frequency: 'yearly', assignedTo: 'Sarah Chen', result: 'pass', nextDueDate: '2027-06-01' },
  { id: 'mr-016', assetId: 'a-034', assetName: 'CCTV System', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', scheduledDate: '2026-04-01', completedDate: '2026-04-01', status: 'completed', type: 'Quarterly Inspection', frequency: 'quarterly', assignedTo: 'Marcus Webb', result: 'pass', nextDueDate: '2026-07-01' },
  { id: 'mr-017', assetId: 'a-026', assetName: 'Commercial Oven', hotelId: 'hotel-001', hotelName: 'Crowne Plaza Kingston-south', scheduledDate: '2026-01-01', completedDate: '2026-01-05', status: 'completed', type: '6-Monthly Service', frequency: '6-monthly', assignedTo: 'Marcus Webb', result: 'pass', nextDueDate: '2027-01-01' },
  { id: 'mr-018', assetId: 'a-076', assetName: 'AC Unit', hotelId: 'hotel-004', hotelName: 'Ravents Ait Island', scheduledDate: '2026-01-01', completedDate: '2026-01-10', status: 'completed', type: 'Biannual Servicing', frequency: '6-monthly', assignedTo: 'Priya Sharma', result: 'pass', nextDueDate: '2027-01-01' },
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
    (MAINTENANCE_RECORDS.filter((m) => m.status === 'completed').length / MAINTENANCE_RECORDS.length) * 100
  );
  return { total, fixed, nonFixed, overdueMaintenance, dueToday, criticalAssets, byDepartment, byCategory, byHotel, maintenanceCompletion };
}
