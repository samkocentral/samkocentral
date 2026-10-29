/**
 * SAMKO CENTRAL - Deep Page & Content CMS Engine
 * Provides granular content editing for EVERY tab and page inside the application:
 * - Page Titles, Subtitles, Search Placeholders, Action Buttons
 * - Table Column Headers (rename, reorder, toggle)
 * - Card Content (Hotels/Properties, Assets, Maintenance, Compliance, Contracts)
 * - Status Badges & Color Themes
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ASSETS, HOTELS, ASSET_CATEGORIES, MAINTENANCE_RECORDS } from '@/lib/assetData';
import { UTILITIES } from '@/data/utilitiesData';
import db from '@/data/samko_db.json';
import { getInitialTasks } from '@/data/tasksData';
import { INITIAL_AUDIT_LOGS } from '@/data/auditLogsData';
import { SITES, COMPLIANCE } from '@/lib/mockData';

export interface ColumnDefinition {
  id: string;
  label: string;
  originalLabel: string;
  visible: boolean;
  order: number;
  type?: 'text' | 'number' | 'date' | 'badge' | 'status' | 'custom';
  defaultValue?: any;
  isCustom?: boolean;
}

export interface DeepPageKpi {
  id: string;
  label: string;
  value: string;
  subtitle: string;
  color?: string;
  enabled?: boolean;
}

export interface DeepPageDropdown {
  id: string;
  label: string;
  options: string[];
}

export interface DeepPageSection {
  title: string;
  subtitle?: string;
  badgeText?: string;
}

export interface DeepAlertItem {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  time: string;
  link?: string;
}

export interface DeepTaskItem {
  id: string;
  title: string;
  hotelName: string;
  dueDate: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status?: string;
}

export interface DeepChartDataPoint {
  week: string;
  compliance: number;
  critical: number;
}

export interface DeepPageConfig {
  id: string;
  title: string;
  subtitle: string;
  badgeText?: string;
  badgeColor?: string;
  searchPlaceholder: string;
  primaryActionLabel: string;
  secondaryActionLabel?: string;
  topKpis?: DeepPageKpi[];
  propcoTopKpis?: DeepPageKpi[];
  propcoKpis?: DeepPageKpi[];
  kpis?: DeepPageKpi[];
  dropdowns?: DeepPageDropdown[];
  sections?: Record<string, DeepPageSection>;
  tabFilters?: Array<{ id: string; label: string; count?: number }>;
  columns?: ColumnDefinition[];
  customLabels?: Record<string, string>;
  items?: Array<Record<string, any>>;
  alerts?: DeepAlertItem[];
  tasks?: DeepTaskItem[];
  chartData?: DeepChartDataPoint[];
}

export interface DeepAppCMSStore {
  properties: DeepPageConfig;
  assets: DeepPageConfig;
  nonfixed: DeepPageConfig;
  assetdashboard: DeepPageConfig;
  categories: DeepPageConfig;
  maintenance: DeepPageConfig;
  compliance: DeepPageConfig;
  compliancetracker: DeepPageConfig;
  contracts: DeepPageConfig;
  insurance: DeepPageConfig;
  utilities: DeepPageConfig;
  tasks: DeepPageConfig;
  documents: DeepPageConfig;
  reports: DeepPageConfig;
  inspections: DeepPageConfig;
  overview: DeepPageConfig;
  multisite: DeepPageConfig;
  recentlogs: DeepPageConfig;
  users: DeepPageConfig;
  import: DeepPageConfig;
  qr: DeepPageConfig;
}

const STORAGE_KEY = 'samko:deep_page_cms_v12';
const EVENT_KEY = 'samko:deep-page-cms-updated';

// Automatically purge legacy cache keys once in browser
if (typeof window !== 'undefined') {
  for (let i = 1; i <= 11; i++) {
    try {
      localStorage.removeItem(`samko:deep_page_cms_v${i}`);
    } catch {}
  }
}

// ─── SYSTEM DEFAULT DEEP PAGE CONFIGURATIONS ──────────────────────────────────

export const DEFAULT_DEEP_CMS: DeepAppCMSStore = {
  properties: {
    id: 'properties',
    title: 'Properties & Hotel Sites',
    subtitle: '8 properties managed across England & South East portfolio',
    badgeText: '8 Properties Active',
    badgeColor: '#e8c97a',
    searchPlaceholder: 'Search properties by name, city, manager, phone...',
    primaryActionLabel: 'Add Property',
    dropdowns: [
      { id: 'city', label: 'City / Region', options: ['All Cities', 'London', 'Surrey', 'West Sussex', 'Bedfordshire'] },
      { id: 'status', label: 'Property Status', options: ['All Statuses', 'active', 'inactive'] },
    ],
    customLabels: {
      assetsStatLabel: 'Assets',
      overdueStatLabel: 'Overdue',
      dueTodayStatLabel: 'Due Today',
      viewRegisterLabel: 'View Asset Register',
      activeStatusLabel: 'Active',
      inactiveStatusLabel: 'Inactive',
    },
    items: [
      {
        id: 'cp-kingston',
        name: 'Crowne Plaza Kingston-south',
        city: 'London',
        address: 'Holiday Inn, Kingston House Estate, Portsmouth Rd, Surbiton KT6 5QQ',
        manager: 'Marcus Webb',
        phone: '+44 20 8546 0100',
        status: 'active',
        totalAssets: 35,
        overdueCount: 1,
        dueTodayCount: 0,
      },
      {
        id: 'stanhill-court',
        name: 'Stanhill Court',
        city: 'Surrey',
        address: 'Stanhill Road, Charlwood, Horley, Surrey RH6 0EP',
        manager: 'Sarah Chen',
        phone: '+44 1293 862 166',
        status: 'active',
        totalAssets: 15,
        overdueCount: 0,
        dueTodayCount: 1,
      },
      {
        id: 'hampton',
        name: 'Hotel Hampton 1 & Hampton 2 Property',
        city: 'Surrey',
        address: 'Kingston House Estate, Portsmouth Rd, Long Ditton, Surbiton KT6 5QQ',
        manager: 'James Okafor',
        phone: '+44 20 8941 0200',
        status: 'active',
        totalAssets: 15,
        overdueCount: 1,
        dueTodayCount: 0,
      },
      {
        id: 'ravens-ait',
        name: 'Ravens Ait Island',
        city: 'London',
        address: 'Ravens Ait, Portsmouth Rd, Surbiton KT6 4HN',
        manager: 'Priya Sharma',
        phone: '+44 20 8399 0300',
        status: 'active',
        totalAssets: 17,
        overdueCount: 0,
        dueTodayCount: 1,
      },
      {
        id: 'river-club',
        name: 'River Club',
        city: 'London',
        address: 'Old Malden Lane, Worcester Park KT4 7PX',
        manager: 'David Thornton',
        phone: '+44 20 8977 0400',
        status: 'active',
        totalAssets: 16,
        overdueCount: 1,
        dueTodayCount: 0,
      },
      {
        id: 'warren-house',
        name: 'Warren House',
        city: 'London',
        address: '19 Warren Road, Kingston upon Thames, Surrey KT2 7HY',
        manager: 'Harshit Gulati',
        phone: '+44 20 8335 6767',
        status: 'active',
        totalAssets: 0,
        overdueCount: 0,
        dueTodayCount: 0,
      },
      {
        id: 'gatwick-manor',
        name: 'Gatwick Manor Hotel',
        city: 'West Sussex',
        address: 'London Road, Lowfield Heath, Crawley RH10 9ST',
        manager: 'Oliver Smith',
        phone: '+44 1293 543 543',
        status: 'active',
        totalAssets: 0,
        overdueCount: 0,
        dueTodayCount: 0,
      },
      {
        id: 'sharnbrook',
        name: 'Sharnbrook Hotel',
        city: 'Bedfordshire',
        address: 'Park Lane, Sharnbrook, Bedford MK44 1LX',
        manager: 'Elena Rossi',
        phone: '+44 1933 778 000',
        status: 'active',
        totalAssets: 0,
        overdueCount: 0,
        dueTodayCount: 0,
      },
    ],
  },
  assets: {
    id: 'assets',
    title: 'Fixed Assets Register',
    subtitle: 'Fixed plant, machinery, HVAC, infrastructure and capital assets across all portfolio properties',
    badgeText: 'Fixed Assets',
    badgeColor: '#60a5fa',
    searchPlaceholder: 'Search fixed assets, ID, location, serial number...',
    primaryActionLabel: 'Add Asset',
    secondaryActionLabel: 'Import Excel',
    kpis: [
      { id: 'asset-kpi-1', label: 'Total Fixed Assets', value: '62 Items', subtitle: 'Across 8 properties', color: '#60a5fa', enabled: true },
      { id: 'asset-kpi-2', label: 'Active Fixed Plant', value: '60 Plant & Machinery', subtitle: 'Depreciable balance sheet items', color: '#e8c97a', enabled: true },
      { id: 'asset-kpi-3', label: 'Under Maintenance', value: '2 Plant Items', subtitle: 'Scheduled repairs & servicing', color: '#3dd68c', enabled: true },
      { id: 'asset-kpi-4', label: 'High Risk Flagged', value: '4 Critical Assets', subtitle: 'Urgent service inspection', color: '#f43f5e', enabled: true },
    ],
    dropdowns: [
      { id: 'asset-cat', label: 'Asset Category', options: ['All Categories', 'HVAC & Air Conditioning', 'Electrical & Lighting', 'Plant Equipment & Boilers', 'Fire Safety & Alarms', 'Commercial Kitchen & Catering', 'Bathroom & Sanitaryware', 'Lifts & Escalators', 'IT & Telecoms'] },
      { id: 'asset-hotel', label: 'Property / Hotel Site', options: ['All Hotels', 'Crowne Plaza Kingston-south', 'Stanhill Court', 'Hotel Hampton 1 & 2', 'Ravens Ait Island', 'River Club', 'Warren House', 'Gatwick Manor Hotel', 'Sharnbrook Hotel'] },
      { id: 'asset-dept', label: 'Department', options: ['All Departments', 'Engineering & Facilities', 'Housekeeping', 'Food & Beverage', 'Front Office', 'Spa & Leisure', 'Security', 'Administration'] },
      { id: 'asset-cond', label: 'Asset Condition', options: ['All Conditions', 'Excellent', 'Good', 'Fair', 'Poor', 'End of Life'] },
      { id: 'asset-risk', label: 'Risk Rating', options: ['All Risk Levels', 'Low Risk', 'Medium Risk', 'High Risk', 'Urgent Statutory'] },
    ],
    tabFilters: [
      { id: 'fixed', label: 'Fixed Assets', count: 41 },
    ],
    columns: [
      { id: 'assetId', label: 'Asset ID', originalLabel: 'Asset ID', visible: true, order: 1 },
      { id: 'name', label: 'Asset Name', originalLabel: 'Asset Name', visible: true, order: 2 },
      { id: 'category', label: 'Category', originalLabel: 'Category', visible: true, order: 3 },
      { id: 'property', label: 'Property / Site', originalLabel: 'Property', visible: true, order: 4 },
      { id: 'department', label: 'Department', originalLabel: 'Department', visible: true, order: 5 },
      { id: 'location', label: 'Location', originalLabel: 'Location', visible: true, order: 6 },
      { id: 'qty', label: 'Qty', originalLabel: 'Qty', visible: true, order: 7 },
      { id: 'condition', label: 'Condition', originalLabel: 'Condition', visible: true, order: 8 },
      { id: 'risk', label: 'Risk', originalLabel: 'Risk', visible: true, order: 9 },
      { id: 'nextInspection', label: 'Next Inspection', originalLabel: 'Next Inspection', visible: true, order: 10 },
      { id: 'status', label: 'Status', originalLabel: 'Status', visible: true, order: 11 },
      { id: 'actions', label: 'Actions', originalLabel: 'Actions', visible: true, order: 12 },
    ],
    items: ASSETS.map((a) => ({
      id: a.id,
      assetId: a.assetId,
      name: a.name,
      category: a.category,
      department: a.department,
      hotelId: a.hotelId,
      hotelName: a.hotelName,
      location: a.location,
      floor: a.floor,
      quantity: a.quantity,
      condition: a.condition,
      status: a.status,
      riskLevel: a.riskLevel,
      nextInspectionDate: a.nextInspectionDate,
      isFixed: a.isFixed,
      notes: a.notes,
    })),
  },
  categories: {
    id: 'categories',
    title: 'Asset Categories',
    subtitle: '7 categories · 98 total assets across portfolio',
    badgeText: '7 Categories Defined',
    badgeColor: '#e8c97a',
    searchPlaceholder: 'Search categories...',
    primaryActionLabel: 'Add Category',
    dropdowns: [
      { id: 'categoryType', label: 'Category Group', options: ['All Groups', 'Fixed Capital', 'FF&E Movable', 'Life Safety', 'Kitchen & Food Ops'] },
    ],
    items: ASSET_CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      assetCount: ASSETS.filter((a) => a.category === c.name).length,
    })),
  },
  maintenance: {
    id: 'maintenance',
    title: 'Planned Preventive Maintenance',
    subtitle: 'Asset servicing schedules and statutory compliance checks across portfolio',
    badgeText: 'PPM Operations',
    badgeColor: '#60a5fa',
    searchPlaceholder: 'Search asset, type, property…',
    primaryActionLabel: 'Schedule Maintenance',
    kpis: [
      { id: 'maint-kpi-1', label: 'Scheduled', value: `${MAINTENANCE_RECORDS.filter((m) => m.status === 'scheduled').length} Tasks`, subtitle: 'Upcoming preventive work', color: '#60a5fa', enabled: true },
      { id: 'maint-kpi-2', label: 'Due Today', value: `${MAINTENANCE_RECORDS.filter((m) => m.status === 'due-today').length} Due`, subtitle: 'Critical deadline today', color: '#f59e0b', enabled: true },
      { id: 'maint-kpi-3', label: 'Overdue', value: `${MAINTENANCE_RECORDS.filter((m) => m.status === 'overdue').length} Overdue`, subtitle: 'Requires escalation', color: '#f43f5e', enabled: true },
      { id: 'maint-kpi-4', label: 'Completed', value: `${MAINTENANCE_RECORDS.filter((m) => m.status === 'completed').length} Done`, subtitle: 'Servicing complete', color: '#3dd68c', enabled: true },
    ],
    dropdowns: [
      { id: 'property', label: 'Filter by Property', options: ['All Properties', ...HOTELS.map((h) => h.name)] },
    ],
    columns: [
      { id: 'asset', label: 'Asset Name', originalLabel: 'Asset', visible: true, order: 1 },
      { id: 'property', label: 'Property Site', originalLabel: 'Property', visible: true, order: 2 },
      { id: 'type', label: 'Service Type', originalLabel: 'Type', visible: true, order: 3 },
      { id: 'frequency', label: 'Frequency', originalLabel: 'Frequency', visible: true, order: 4 },
      { id: 'nextDueDate', label: 'Next Due Date', originalLabel: 'Next Due', visible: true, order: 5 },
      { id: 'assignedTo', label: 'Assigned To', originalLabel: 'Assignee', visible: true, order: 6 },
      { id: 'status', label: 'Status', originalLabel: 'Status', visible: true, order: 7 },
      { id: 'actions', label: 'Actions', originalLabel: 'Actions', visible: true, order: 8 },
    ],
    items: MAINTENANCE_RECORDS.map((m) => ({
      id: m.id,
      asset: m.assetName,
      assetName: m.assetName,
      assetId: m.assetId,
      property: m.hotelName,
      hotelName: m.hotelName,
      hotelId: m.hotelId,
      type: m.type,
      frequency: m.frequency,
      scheduledDate: m.scheduledDate,
      nextDueDate: m.nextDueDate,
      assignedTo: m.assignedTo,
      status: m.status,
    })),
  },
  compliance: {
    id: 'compliance',
    title: 'Compliance & Certification Register',
    subtitle: 'Manage statutory and internal compliance requirements across 8 properties',
    badgeText: 'Statutory Register',
    badgeColor: '#3dd68c',
    searchPlaceholder: 'Search compliance, property, authority...',
    primaryActionLabel: 'Add Compliance Item',
    secondaryActionLabel: 'Export Register',
    kpis: [
      { id: 'comp-kpi-1', label: 'Total Items', value: `${(db.compliance || []).length} Items`, subtitle: 'All statutory items', color: '#60a5fa', enabled: true },
      { id: 'comp-kpi-2', label: 'Expiring in 30 Days', value: '2 Due Soon', subtitle: 'Requires attention', color: '#f59e0b', enabled: true },
      { id: 'comp-kpi-3', label: 'Overdue', value: '1 Expired', subtitle: 'Immediate action needed', color: '#f43f5e', enabled: true },
      { id: 'comp-kpi-4', label: 'Compliant', value: '9 Compliant', subtitle: 'Up to date certificates', color: '#3dd68c', enabled: true },
      { id: 'comp-kpi-5', label: 'High Risk', value: '3 High Risk', subtitle: 'High & critical risk items', color: '#f97316', enabled: true },
    ],
    dropdowns: [
      { id: 'status', label: 'All Statuses', options: ['All Statuses', 'compliant', 'expiring-soon', 'overdue', 'pending'] },
      { id: 'property', label: 'All Properties', options: ['All Properties', ...HOTELS.map((h) => h.name)] },
      { id: 'category', label: 'All Categories', options: ['All Categories', 'Fire Risk Assessment', 'Fire Alarm Certificate', 'Gas Safety', 'Legionella', 'PAT Testing', 'Fixed Wire Testing', 'Lift Inspection'] },
    ],
    columns: [
      { id: 'id', label: 'Compliance ID', originalLabel: 'ID', visible: true, order: 1 },
      { id: 'name', label: 'Compliance Item', originalLabel: 'Name', visible: true, order: 2 },
      { id: 'category', label: 'Category', originalLabel: 'Category', visible: true, order: 3 },
      { id: 'property', label: 'Property', originalLabel: 'Property', visible: true, order: 4 },
      { id: 'department', label: 'Department', originalLabel: 'Department', visible: true, order: 5 },
      { id: 'expiryDate', label: 'Expiry Date', originalLabel: 'Expiry Date', visible: true, order: 6 },
      { id: 'responsiblePerson', label: 'Responsible', originalLabel: 'Responsible', visible: true, order: 7 },
      { id: 'riskRating', label: 'Risk Rating', originalLabel: 'Risk', visible: true, order: 8 },
      { id: 'status', label: 'Status', originalLabel: 'Status', visible: true, order: 9 },
      { id: 'actions', label: 'Actions', originalLabel: 'Actions', visible: true, order: 10 },
    ],
    items: (db.compliance || []).map((c: any) => ({
      id: c.id,
      complianceId: c.complianceId || c.id,
      name: c.name || c.item,
      category: c.category,
      property: c.property || c.hotel,
      department: c.department || 'Engineering',
      expiryDate: c.expiryDate || c.dueDate,
      responsiblePerson: c.responsiblePerson || c.assignee,
      riskRating: c.riskRating || 'medium',
      status: c.status,
    })),
  },
  contracts: {
    id: 'contracts',
    title: 'Contracts & Supplier Agreements',
    subtitle: 'Manage supplier agreements, renewals, and SLAs across all properties',
    badgeText: '39 Contracts Active',
    badgeColor: '#3dd68c',
    searchPlaceholder: 'Search contracts, suppliers, categories, hotels...',
    primaryActionLabel: 'Add Contract',
    secondaryActionLabel: 'Export Register',
    kpis: [
      { id: 'cont-kpi-1', label: 'Active Contracts', value: '39 Active', subtitle: 'Live supplier agreements', color: '#3dd68c', enabled: true },
      { id: 'cont-kpi-2', label: 'Expiring Soon', value: '6 Contracts', subtitle: 'Expires in <= 60 days', color: '#f59e0b', enabled: true },
      { id: 'cont-kpi-3', label: 'Renewals Due', value: '4 Renewals', subtitle: 'Notice window open', color: '#f97316', enabled: true },
      { id: 'cont-kpi-4', label: 'Auto Renewal', value: '30 Auto-Renew', subtitle: 'Rolling agreements', color: '#60a5fa', enabled: true },
      { id: 'cont-kpi-5', label: 'Annual Value', value: '£1.18M', subtitle: 'Total committed portfolio spend', color: '#e8c97a', enabled: true },
    ],
    dropdowns: [
      { id: 'status', label: 'All Statuses', options: ['All Statuses', 'active', 'expiring-soon', 'expired', 'pending', 'terminated'] },
      { id: 'hotel', label: 'All Properties', options: ['All Properties', ...HOTELS.map((h) => h.name), 'Group / Portfolio-wide'] },
      { id: 'category', label: 'All Categories', options: ['All Categories', 'Lift Maintenance', 'Fire Alarm Maintenance', 'HVAC', 'Pest Control', 'Cleaning', 'Laundry', 'Waste Collection', 'Security', 'IT Support', 'Utilities', 'Building Maintenance'] },
    ],
    columns: [
      { id: 'contractId', label: 'Contract ID', originalLabel: 'ID', visible: true, order: 1 },
      { id: 'contractName', label: 'Agreement Title', originalLabel: 'Contract', visible: true, order: 2 },
      { id: 'supplierName', label: 'Supplier Name', originalLabel: 'Supplier', visible: true, order: 3 },
      { id: 'category', label: 'Category', originalLabel: 'Category', visible: true, order: 4 },
      { id: 'hotel', label: 'Property Site', originalLabel: 'Property', visible: true, order: 5 },
      { id: 'contractValue', label: 'Annual Value', originalLabel: 'Value', visible: true, order: 6 },
      { id: 'monthlyCost', label: 'Monthly Cost', originalLabel: 'Monthly', visible: true, order: 7 },
      { id: 'endDate', label: 'Term End Date', originalLabel: 'End Date', visible: true, order: 8 },
      { id: 'noticePeriod', label: 'Notice Period', originalLabel: 'Notice', visible: true, order: 9 },
      { id: 'status', label: 'Status', originalLabel: 'Status', visible: true, order: 10 },
      { id: 'actions', label: 'Actions', originalLabel: 'Actions', visible: true, order: 11 },
    ],
    items: (db.contracts || []).map((c: any) => ({
      id: c.id,
      contractId: c.contractId,
      contractName: c.contractName,
      supplierName: c.supplierName,
      category: c.category,
      hotel: c.hotel || c.property,
      contractValue: typeof c.contractValue === 'number' ? `£${c.contractValue.toLocaleString()}/yr` : c.contractValue,
      monthlyCost: typeof c.monthlyCost === 'number' ? `£${c.monthlyCost.toLocaleString()}/mo` : c.monthlyCost,
      endDate: c.endDate,
      noticePeriod: c.noticePeriod,
      status: c.status,
    })),
  },
  insurance: {
    id: 'insurance',
    title: 'Insurance Management',
    subtitle: 'Manage insurance policies, coverage, premiums, claims, and renewals across portfolio',
    badgeText: '£43.5M Cover Active',
    badgeColor: '#60a5fa',
    searchPlaceholder: 'Search policies, company, property...',
    primaryActionLabel: 'Add Policy',
    secondaryActionLabel: 'Policy Claims',
    kpis: [
      { id: 'ins-kpi-1', label: 'Total Coverage', value: '£43.5M', subtitle: 'Across all portfolio properties', color: '#60a5fa', enabled: true },
      { id: 'ins-kpi-2', label: 'Annual Premium', value: '£106k', subtitle: 'Annual portfolio spend', color: '#3dd68c', enabled: true },
      { id: 'ins-kpi-3', label: 'Expiring in 30 Days', value: '2 Policies', subtitle: 'Renewal required soon', color: '#f59e0b', enabled: true },
      { id: 'ins-kpi-4', label: 'Expired Policies', value: '0 Policies', subtitle: 'Immediate action needed', color: '#f43f5e', enabled: true },
      { id: 'ins-kpi-5', label: 'Active Claims', value: '1 Claim', subtitle: 'Open & in-progress claims', color: '#a78bfa', enabled: true },
    ],
    dropdowns: [
      { id: 'type', label: 'All Insurance Types', options: ['All Insurance Types', 'Building Insurance', 'Contents Insurance', 'Public Liability', 'Employers Liability', 'Product Liability', 'Cyber Insurance', 'Equipment Breakdown', 'Business Interruption'] },
      { id: 'hotel', label: 'All Properties', options: ['All Properties', ...HOTELS.map((h) => h.name)] },
    ],
    columns: [
      { id: 'policyNumber', label: 'Policy Number', originalLabel: 'Policy No.', visible: true, order: 1 },
      { id: 'insuranceType', label: 'Insurance Type', originalLabel: 'Type', visible: true, order: 2 },
      { id: 'insuranceCompany', label: 'Underwriter / Insurer', originalLabel: 'Insurer', visible: true, order: 3 },
      { id: 'hotel', label: 'Property Site', originalLabel: 'Property', visible: true, order: 4 },
      { id: 'coverageAmount', label: 'Coverage Amount', originalLabel: 'Coverage', visible: true, order: 5 },
      { id: 'annualPremium', label: 'Annual Premium', originalLabel: 'Premium', visible: true, order: 6 },
      { id: 'expiryDate', label: 'Expiry Date', originalLabel: 'Expiry Date', visible: true, order: 7 },
      { id: 'status', label: 'Policy Status', originalLabel: 'Status', visible: true, order: 8 },
    ],
    items: (db.insurance || []).map((p: any) => ({
      id: p.id,
      policyNumber: p.policyNumber,
      insuranceType: p.insuranceType,
      insuranceCompany: p.insuranceCompany,
      hotel: p.hotel,
      coverageAmount: typeof p.coverageAmount === 'number' ? `£${(p.coverageAmount / 1000000).toFixed(1)}M` : p.coverageAmount,
      annualPremium: typeof p.annualPremium === 'number' ? `£${(p.annualPremium / 1000).toFixed(0)}k/yr` : p.annualPremium,
      expiryDate: p.expiryDate,
      status: p.status,
    })),
  },
  utilities: {
    id: 'utilities',
    title: 'Utilities Register',
    subtitle: 'Electricity, Gas, Water & Telecoms across 8 portfolio properties',
    badgeText: '23 Accounts Active',
    badgeColor: '#3dd68c',
    searchPlaceholder: 'Search accounts, suppliers, meter refs...',
    primaryActionLabel: 'Add Utility Account',
    secondaryActionLabel: 'Export Register',
    kpis: [
      { id: 'util-kpi-1', label: 'Active Accounts', value: '7 Accounts', subtitle: 'Live utility supplies', color: '#3dd68c', enabled: true },
      { id: 'util-kpi-2', label: 'Expiring Soon', value: '3 Contracts', subtitle: 'Expires in <= 60 days', color: '#e8c97a', enabled: true },
      { id: 'util-kpi-3', label: 'Expired', value: '2 Overdue', subtitle: 'Needs contract renewal', color: '#f43f5e', enabled: true },
      { id: 'util-kpi-4', label: 'Incomplete Info', value: '11 Accounts', subtitle: 'Missing MPAN or contract info', color: '#f59e0b', enabled: true },
      { id: 'util-kpi-5', label: 'Flagged for Review', value: '18 Accounts', subtitle: 'Review required', color: '#ec4899', enabled: true },
      { id: 'util-kpi-6', label: 'Annual Spend', value: '£279k', subtitle: 'Tracked utility costs', color: '#60a5fa', enabled: true },
    ],
    dropdowns: [
      { id: 'property', label: 'Filter by Property', options: ['All Properties', 'Crowne Plaza Kingston', 'Warren House Hotel', 'Stanhill Court Hotel', 'The River Club', 'Hotel Hampton 1 & 2', 'Ravens Ait Island', 'Clapham Apartment', 'The Sharnbrook'] },
      { id: 'status', label: 'Filter by Status', options: ['All Statuses', 'active', 'expiring', 'expired', 'incomplete'] },
    ],
    columns: [
      { id: 'property', label: 'Property / Site', originalLabel: 'Property', visible: true, order: 1 },
      { id: 'utilityType', label: 'Utility Type', originalLabel: 'Utility Type', visible: true, order: 2 },
      { id: 'supplier', label: 'Supplier', originalLabel: 'Supplier', visible: true, order: 3 },
      { id: 'accountNumber', label: 'Account Number', originalLabel: 'Account Number', visible: true, order: 4 },
      { id: 'meterReference', label: 'Meter Reference', originalLabel: 'Meter Reference', visible: true, order: 5 },
      { id: 'contractEnd', label: 'Contract End', originalLabel: 'Contract End', visible: true, order: 6 },
      { id: 'annualCost', label: 'Annual Cost', originalLabel: 'Annual Cost', visible: true, order: 7 },
    ],
    items: UTILITIES.map((u) => ({
      id: u.id,
      property: u.property,
      utilityType: u.utilityType,
      supplier: u.supplier,
      accountNumber: u.accountNumber,
      meterReference: u.meterReference,
      contractEnd: u.contractEnd,
      annualCost: u.annualCost ? `£${u.annualCost.toLocaleString()}/yr` : '—',
      status: u.status,
    })),
  },
  tasks: {
    id: 'tasks',
    title: 'Tasks & Action Items',
    subtitle: 'Operational tasks, maintenance follow-ups, and urgent statutory action items',
    badgeText: '10 Tasks Managed',
    badgeColor: '#f59e0b',
    searchPlaceholder: 'Search tasks by title, room, assignee...',
    primaryActionLabel: 'Add Item',
    secondaryActionLabel: 'Upload Doc',
    kpis: [
      { id: 'task-kpi-1', label: 'Open Tasks', value: '7 Tasks', subtitle: 'Across all portfolio properties', color: '#60a5fa', enabled: true },
      { id: 'task-kpi-2', label: 'Overdue Tasks', value: '2 Overdue', subtitle: 'Requires urgent resolution', color: '#f43f5e', enabled: true },
      { id: 'task-kpi-3', label: 'Urgent Priority', value: '4 Priority', subtitle: 'High attention required', color: '#f59e0b', enabled: true },
      { id: 'task-kpi-4', label: 'Completed Tasks', value: '3 Completed', subtitle: 'Successfully closed tickets', color: '#3dd68c', enabled: true },
    ],
    dropdowns: [
      { id: 'property', label: 'All Properties', options: ['All Properties', ...HOTELS.map((h) => h.name)] },
      { id: 'assignee', label: 'All Assignees', options: ['All Assignees', 'Marcus Webb', 'Sarah Chen', 'James Okafor', 'Jamie Clarke', 'Elena Rossi'] },
    ],
    columns: [
      { id: 'title', label: 'Task / Action', originalLabel: 'Task', visible: true, order: 1 },
      { id: 'property', label: 'Property Site', originalLabel: 'Property', visible: true, order: 2 },
      { id: 'assignee', label: 'Assignee', originalLabel: 'Assignee', visible: true, order: 3 },
      { id: 'dueDate', label: 'Due Date', originalLabel: 'Due Date', visible: true, order: 4 },
      { id: 'priority', label: 'Priority', originalLabel: 'Priority', visible: true, order: 5 },
      { id: 'status', label: 'Status', originalLabel: 'Status', visible: true, order: 6 },
    ],
    items: getInitialTasks().map((t) => ({
      id: t.id,
      title: t.title,
      property: t.property,
      assignee: t.assignee,
      dueDate: t.dueDate,
      priority: t.priority,
      status: t.status,
    })),
  },
  documents: {
    id: 'documents',
    title: 'Document Repository & Vault',
    subtitle: 'O&M manuals, warranty certificates, architectural plans & files',
    badgeText: 'Vault Active',
    badgeColor: '#a78bfa',
    searchPlaceholder: 'Search documents, properties, categories…',
    primaryActionLabel: 'Upload Document',
    secondaryActionLabel: 'Folder View',
    kpis: [
      { id: 'doc-kpi-1', label: 'Total Documents', value: `${(db.documents || []).length} Files`, subtitle: 'In cloud repository', color: '#60a5fa', enabled: true },
      { id: 'doc-kpi-2', label: 'Overdue / Expired', value: '1 Overdue', subtitle: 'Certificates expired', color: '#f43f5e', enabled: true },
      { id: 'doc-kpi-3', label: 'Expiring Soon', value: '2 Due Soon', subtitle: 'Next 60 days radar', color: '#f59e0b', enabled: true },
      { id: 'doc-kpi-4', label: 'Compliant', value: '7 Valid', subtitle: 'Verified documents', color: '#3dd68c', enabled: true },
    ],
    dropdowns: [
      { id: 'category', label: 'All Categories', options: ['All Categories', 'Architectural & O&M', 'Statutory Certificates', 'Insurance', 'Manuals & Warranties', 'Contracts'] },
      { id: 'site', label: 'All Sites', options: ['All Sites', ...HOTELS.map((h) => h.name)] },
      { id: 'status', label: 'All Statuses', options: ['All Statuses', 'critical', 'warning', 'ok'] },
    ],
    columns: [
      { id: 'name', label: 'Document Title', originalLabel: 'Name', visible: true, order: 1 },
      { id: 'site', label: 'Property Site', originalLabel: 'Property', visible: true, order: 2 },
      { id: 'category', label: 'Category', originalLabel: 'Category', visible: true, order: 3 },
      { id: 'expiry', label: 'Expiry Date', originalLabel: 'Expiry', visible: true, order: 4 },
      { id: 'version', label: 'Version', originalLabel: 'Version', visible: true, order: 5 },
      { id: 'status', label: 'Status', originalLabel: 'Status', visible: true, order: 6 },
    ],
    items: (db.documents || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      site: d.site,
      category: d.category,
      expiry: d.expiry,
      version: d.version,
      status: d.status,
    })),
  },
  reports: {
    id: 'reports',
    title: 'Asset Reports & Analytics',
    subtitle: 'Valuation analytics, replacement forecasting and condition graphs',
    badgeText: 'Analytics Live',
    badgeColor: '#3dd68c',
    searchPlaceholder: 'Search reports and portfolio metrics...',
    primaryActionLabel: 'Export Full Portfolio Report',
    secondaryActionLabel: 'Custom Query',
    dropdowns: [
      { id: 'property', label: 'Property Site', options: ['All Properties', ...HOTELS.map((h) => h.name)] },
      { id: 'category', label: 'Asset Category', options: ['All Categories', ...ASSET_CATEGORIES.map((c) => c.name)] },
    ],
    kpis: [
      { id: 'rep-kpi-1', label: 'Total Catalogued Assets', value: '98 Items', subtitle: 'Across all portfolio properties', color: '#60a5fa', enabled: true },
      { id: 'rep-kpi-2', label: 'Fixed Capital Assets', value: '60 Fixed', subtitle: 'Plant, boilers & lifts', color: '#e8c97a', enabled: true },
      { id: 'rep-kpi-3', label: 'Overdue Maintenance', value: '1 Item', subtitle: 'Escalation required', color: '#f43f5e', enabled: true },
      { id: 'rep-kpi-4', label: 'Maintenance Complete', value: '94%', subtitle: 'Contractor SLA benchmark', color: '#3dd68c', enabled: true },
    ],
    columns: [
      { id: 'hotel', label: 'Property Site', originalLabel: 'Property', visible: true, order: 1 },
      { id: 'total', label: 'Total Assets', originalLabel: 'Total', visible: true, order: 2 },
      { id: 'fixed', label: 'Fixed Assets', originalLabel: 'Fixed', visible: true, order: 3 },
      { id: 'nonFixed', label: 'Non-Fixed', originalLabel: 'Non-Fixed', visible: true, order: 4 },
      { id: 'overdue', label: 'Overdue Maint.', originalLabel: 'Overdue', visible: true, order: 5 },
      { id: 'critical', label: 'Critical Risk', originalLabel: 'Critical', visible: true, order: 6 },
    ],
    items: HOTELS.map((h) => ({
      id: h.id,
      hotel: h.name,
      total: ASSETS.filter((a) => a.hotelId === h.id).length,
      fixed: ASSETS.filter((a) => a.hotelId === h.id && a.isFixed).length,
      nonFixed: ASSETS.filter((a) => a.hotelId === h.id && !a.isFixed).length,
      overdue: MAINTENANCE_RECORDS.filter((m) => m.hotelId === h.id && m.status === 'overdue').length,
      critical: ASSETS.filter((a) => a.hotelId === h.id && a.riskLevel === 'critical').length,
    })),
  },
  inspections: {
    id: 'inspections',
    title: 'Asset Inspections & Audits',
    subtitle: 'On-site condition audits, defect logging & compliance certificates',
    badgeText: 'Audits Active',
    badgeColor: '#60a5fa',
    searchPlaceholder: 'Search inspections...',
    primaryActionLabel: 'Start New Audit',
    secondaryActionLabel: 'Schedule Audit',
    kpis: [
      { id: 'insp-kpi-1', label: 'Total Audits Conducted', value: '42 Audits', subtitle: 'Across all portfolio sites', color: '#60a5fa', enabled: true },
      { id: 'insp-kpi-2', label: 'Pass Rate', value: '97.6%', subtitle: 'Passed on first inspection', color: '#3dd68c', enabled: true },
      { id: 'insp-kpi-3', label: 'Remedial Flags', value: '2 Remedials', subtitle: 'Action items issued', color: '#f43f5e', enabled: true },
    ],
    dropdowns: [
      { id: 'property', label: 'All Properties', options: ['All Properties', ...HOTELS.map((h) => h.name)] },
    ],
    columns: [
      { id: 'inspectionTitle', label: 'Audit / Inspection Title', originalLabel: 'Inspection', visible: true, order: 1 },
      { id: 'property', label: 'Property Site', originalLabel: 'Property', visible: true, order: 2 },
      { id: 'inspector', label: 'Lead Auditor', originalLabel: 'Inspector', visible: true, order: 3 },
      { id: 'inspectionDate', label: 'Inspection Date', originalLabel: 'Date', visible: true, order: 4 },
      { id: 'conditionScore', label: 'Condition Score', originalLabel: 'Score', visible: true, order: 5 },
      { id: 'status', label: 'Audit Outcome', originalLabel: 'Status', visible: true, order: 6 },
      { id: 'actions', label: 'Actions', originalLabel: 'Actions', visible: true, order: 7 },
    ],
    items: [
      { id: 'insp-01', inspectionTitle: 'Comprehensive Site Condition & Plant Survey', property: 'Crowne Plaza Kingston-south', inspector: 'Marcus Webb', inspectionDate: '2026-10-15', conditionScore: '96 / 100', status: 'Passed (Clean)' },
      { id: 'insp-02', inspectionTitle: 'Bi-Annual Fire Safety & Emergency Lighting Audit', property: 'Stanhill Court', inspector: 'Sarah Chen', inspectionDate: '2026-10-18', conditionScore: '92 / 100', status: 'Passed with Notes' },
      { id: 'insp-03', inspectionTitle: 'Commercial Kitchen Deep Hygiene & Gas Safety Audit', property: 'Hotel Hampton 1 & 2', inspector: 'James Okafor', inspectionDate: '2026-09-28', conditionScore: '98 / 100', status: 'Passed (Clean)' },
      { id: 'insp-04', inspectionTitle: 'Passenger Lift & Escalator LOLER Condition Survey', property: 'Ravens Ait Island', inspector: 'Priya Sharma', inspectionDate: '2026-10-02', conditionScore: '84 / 100', status: 'Remedial Action Required' },
    ],
  },
  multisite: {
    id: 'multisite',
    title: 'Multi-Site Operations',
    subtitle: 'Compliance health, risk levels, and manager contacts across all properties',
    badgeText: '8 Sites Connected',
    badgeColor: '#38bdf8',
    searchPlaceholder: 'Filter sites by property name, manager, city, phone...',
    primaryActionLabel: 'Add Site',
    secondaryActionLabel: 'View Map',
    dropdowns: [
      { id: 'region', label: 'Portfolio Region', options: ['All Regions', 'London & Greater London', 'Surrey & South East', 'Home Counties'] },
      { id: 'status', label: 'Operational Status', options: ['All Statuses', 'Fully Operational', 'Under Refurbishment', 'Restricted Operations'] },
    ],
    kpis: [
      { id: 'ms-kpi-1', label: 'Total Sites', value: '8 Sites', subtitle: 'Hotels & venues portfolio', color: '#60a5fa', enabled: true },
      { id: 'ms-kpi-2', label: 'Operational', value: '7 Sites', subtitle: 'Fully trading sites', color: '#3dd68c', enabled: true },
      { id: 'ms-kpi-3', label: 'High Risk', value: '1 Site', subtitle: 'Compliance below 70%', color: '#f43f5e', enabled: true },
      { id: 'ms-kpi-4', label: 'Group Avg Compliance', value: '88%', subtitle: 'Across all portfolio sites', color: '#e8c97a', enabled: true },
    ],
    items: SITES.map((s) => ({
      id: s.id,
      name: s.name,
      city: s.city,
      type: s.type,
      compliance: s.compliance,
      openIssues: s.openIssues,
      risk: s.risk,
      manager: s.manager,
      phone: s.phone,
    })),
  },
  recentlogs: {
    id: 'recentlogs',
    title: 'Recent Logs & Audit Trail',
    subtitle: 'Live audit trail and historical logs across all properties, users, and compliance operations',
    badgeText: 'Live Audit Trail',
    badgeColor: '#a78bfa',
    searchPlaceholder: 'Search audit logs by actor, action, resource, IP address...',
    primaryActionLabel: 'Export CSV',
    secondaryActionLabel: 'Filter Dates',
    kpis: [
      { id: 'rl-kpi-1', label: "Today's Logs", value: `${INITIAL_AUDIT_LOGS.length} Operations`, subtitle: 'Activity recorded today', color: '#e8c97a', enabled: true },
      { id: 'rl-kpi-2', label: 'Active Users', value: '6 Operators', subtitle: 'Actors with recorded actions', color: '#60a5fa', enabled: true },
      { id: 'rl-kpi-3', label: 'Compliance Sign-Offs', value: '8 Audits', subtitle: 'Inspections & certifications', color: '#3dd68c', enabled: true },
      { id: 'rl-kpi-4', label: 'Security & Alerts', value: '2 Warnings', subtitle: 'Flagged events & elevated actions', color: '#f43f5e', enabled: true },
    ],
    dropdowns: [
      { id: 'user', label: 'Filter by User', options: ['ALL', 'Alasdair Samko', 'Marcus Webb', 'Sarah Chen', 'James Okafor', 'Jamie Clarke', 'System Monitor'] },
      { id: 'category', label: 'Filter by Category', options: ['ALL', 'USER_MANAGEMENT', 'COMPLIANCE', 'ASSET', 'MAINTENANCE', 'SECURITY', 'SYSTEM'] },
      { id: 'status', label: 'Filter by Status', options: ['ALL', 'success', 'warning', 'alert', 'info'] },
    ],
    columns: [
      { id: 'timestamp', label: 'Timestamp', originalLabel: 'Time', visible: true, order: 1 },
      { id: 'actorName', label: 'Operator / User', originalLabel: 'Actor', visible: true, order: 2 },
      { id: 'actionLabel', label: 'Action Executed', originalLabel: 'Action', visible: true, order: 3 },
      { id: 'categoryLabel', label: 'Category', originalLabel: 'Category', visible: true, order: 4 },
      { id: 'resource', label: 'Target Resource', originalLabel: 'Resource', visible: true, order: 5 },
      { id: 'ipAddress', label: 'IP & Workstation', originalLabel: 'IP Address', visible: true, order: 6 },
      { id: 'status', label: 'Event Status', originalLabel: 'Status', visible: true, order: 7 },
    ],
    items: INITIAL_AUDIT_LOGS.map((l) => ({
      id: l.id,
      timestamp: l.relativeTime || l.timestamp,
      actorName: l.actorName,
      actionLabel: l.actionLabel,
      categoryLabel: l.categoryLabel,
      resource: l.resource,
      ipAddress: l.ipAddress,
      status: l.status,
    })),
  },
  users: {
    id: 'users',
    title: 'User Management & Role Hierarchy',
    subtitle: 'Manage system access, tab-level permissions, and role hierarchies (L1 – L4)',
    badgeText: 'L1 Super Admin',
    badgeColor: '#f43f5e',
    searchPlaceholder: 'Search users by name, email, portal, hotel, role...',
    primaryActionLabel: 'Add User Account',
    secondaryActionLabel: 'Audit Permissions',
    kpis: [
      { id: 'usr-kpi-1', label: 'L1 Super Admin', value: `${(db.users || []).filter((u: any) => u.roleLevel === 'L1').length} Accounts`, subtitle: 'Full system authority', color: '#f43f5e', enabled: true },
      { id: 'usr-kpi-2', label: 'L2 Admin', value: `${(db.users || []).filter((u: any) => u.roleLevel === 'L2').length} Accounts`, subtitle: 'PropCo & OpCo managers', color: '#a78bfa', enabled: true },
      { id: 'usr-kpi-3', label: 'L3 Uploader', value: `${(db.users || []).filter((u: any) => u.roleLevel === 'L3').length} Accounts`, subtitle: 'Operational uploaders', color: '#3dd68c', enabled: true },
      { id: 'usr-kpi-4', label: 'L4 Viewer', value: `${(db.users || []).filter((u: any) => u.roleLevel === 'L4').length} Accounts`, subtitle: 'Read-only auditors', color: '#60a5fa', enabled: true },
    ],
    dropdowns: [
      { id: 'role', label: 'Role Level', options: ['All Roles', 'L1 - Super Admin', 'L2 - Portal Admin', 'L3 - Department Uploader', 'L4 - Auditor / Viewer'] },
      { id: 'portal', label: 'Portal Assignment', options: ['All Portals', 'PropCo Portal', 'OpCo Portal', 'Both Portals'] },
      { id: 'status', label: 'Account Status', options: ['All Statuses', 'Active', 'Suspended', 'Pending Invite'] },
    ],
    columns: [
      { id: 'name', label: 'User Name', originalLabel: 'Name', visible: true, order: 1 },
      { id: 'email', label: 'Email Address', originalLabel: 'Email', visible: true, order: 2 },
      { id: 'roleLevel', label: 'Role Level', originalLabel: 'Role', visible: true, order: 3 },
      { id: 'portal', label: 'Assigned Portal', originalLabel: 'Portal', visible: true, order: 4 },
      { id: 'hotel', label: 'Property Site', originalLabel: 'Property', visible: true, order: 5 },
      { id: 'status', label: 'Account Status', originalLabel: 'Status', visible: true, order: 6 },
    ],
    items: (db.users || []).map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      roleLevel: u.roleLevel,
      portal: u.portal,
      hotel: u.hotel || 'All Properties',
      status: u.status,
    })),
  },
  import: {
    id: 'import',
    title: 'Bulk Data Import & Migration',
    subtitle: 'Upload Excel (.xlsx) spreadsheets to populate assets, compliance, maintenance, and contracts',
    badgeText: '5-Step Wizard',
    badgeColor: '#3dd68c',
    searchPlaceholder: 'Search import schemas...',
    primaryActionLabel: 'Upload Spreadsheet',
    secondaryActionLabel: 'Download Sample Excel',
    dropdowns: [
      { id: 'targetModule', label: 'Module Destination', options: ['All Modules', 'Assets Register', 'Maintenance Records', 'Compliance Documents', 'Contracts & Suppliers'] },
    ],
  },
  qr: {
    id: 'qr',
    title: 'QR Asset Scanner & Mobile Audit',
    subtitle: 'Scan physical QR codes on plant, machinery, and equipment for instant lookup and sign-off',
    badgeText: 'Mobile Ready',
    badgeColor: '#e8c97a',
    searchPlaceholder: 'Type or scan Asset ID (e.g. AST-001, AST-002)...',
    primaryActionLabel: 'Activate Camera',
    secondaryActionLabel: 'Print QR Codes',
    dropdowns: [
      { id: 'property', label: 'Target Property', options: ['All Properties', ...HOTELS.map((h) => h.name)] },
    ],
  },
  nonfixed: {
    id: 'nonfixed',
    title: 'Non-Fixed Assets (FF&E Register)',
    subtitle: 'Movable furniture, fixtures, kitchen appliances, electronics & guest room equipment',
    badgeText: '248 FF&E Items',
    badgeColor: '#60a5fa',
    searchPlaceholder: 'Search loose equipment, rooms, furniture, serial...',
    primaryActionLabel: 'Add FF&E Asset',
    secondaryActionLabel: 'Print QR Asset Labels',
    kpis: [
      { id: 'nf-kpi-1', label: 'Total FF&E Items', value: '248 Items', subtitle: 'Across all guest rooms & public areas', color: '#60a5fa', enabled: true },
      { id: 'nf-kpi-2', label: 'Good / Pristine Condition', value: '218 Items', subtitle: '88% condition health', color: '#3dd68c', enabled: true },
      { id: 'nf-kpi-3', label: 'Needs Repair / Attention', value: '18 Items', subtitle: 'Work tickets logged', color: '#f59e0b', enabled: true },
      { id: 'nf-kpi-4', label: 'Room Audit Completion', value: '94%', subtitle: 'Quarterly audit progress', color: '#a78bfa', enabled: true },
    ],
    dropdowns: [
      { id: 'property', label: 'Property Site', options: ['All Properties', 'Crowne Plaza Kingston-south', 'Stanhill Court', 'Hotel Hampton 1 & 2', 'River Club', 'Ravens Ait Island'] },
      { id: 'category', label: 'FF&E Category', options: ['All Categories', 'Furniture & Joinery', 'Audio Visual & Tech', 'Commercial Kitchenware', 'Guest Room Appliances', 'Linen & Soft Furnishings'] },
      { id: 'condition', label: 'Condition Score', options: ['All Conditions', 'Excellent', 'Good', 'Fair', 'Poor', 'Condemned'] },
    ],
    tabFilters: [
      { id: 'non-fixed', label: 'Non-Fixed Assets', count: 4 },
    ],
    columns: [
      { id: 'assetId', label: 'Asset ID', originalLabel: 'ID', visible: true, order: 1 },
      { id: 'name', label: 'Item Name / Description', originalLabel: 'Name', visible: true, order: 2 },
      { id: 'property', label: 'Property', originalLabel: 'Property', visible: true, order: 3 },
      { id: 'location', label: 'Room / Area', originalLabel: 'Location', visible: true, order: 4 },
      { id: 'category', label: 'Category', originalLabel: 'Category', visible: true, order: 5 },
      { id: 'department', label: 'Department', originalLabel: 'Department', visible: true, order: 6 },
      { id: 'quantity', label: 'Quantity', originalLabel: 'Qty', visible: true, order: 7 },
      { id: 'condition', label: 'Condition', originalLabel: 'Condition', visible: true, order: 8 },
      { id: 'status', label: 'Status', originalLabel: 'Status', visible: true, order: 9 },
      { id: 'actions', label: 'Actions', originalLabel: 'Actions', visible: true, order: 10 },
    ],
    items: [
      { id: 'ffe-1', assetId: 'FFE-101', name: 'King Size Pocket Sprung Bed', property: 'Crowne Plaza Kingston-south', location: 'Suite 204', category: 'Furniture & Joinery', condition: 'Good', quantity: 1, status: 'active' },
      { id: 'ffe-2', assetId: 'FFE-102', name: 'Smart 55" Hospitality 4K TV', property: 'Crowne Plaza Kingston-south', location: 'Executive Suite 301', category: 'Audio Visual & Tech', condition: 'Excellent', quantity: 1, status: 'active' },
      { id: 'ffe-3', assetId: 'FFE-103', name: 'Nespresso Professional Coffee Machine', property: 'Stanhill Court', location: 'Lounge Bar', category: 'Guest Room Appliances', condition: 'Good', quantity: 2, status: 'active' },
      { id: 'ffe-4', assetId: 'FFE-104', name: 'Ergonomic Desk & Executive Armchair', property: 'Hotel Hampton 1 & 2', location: 'Meeting Room Alpha', category: 'Furniture & Joinery', condition: 'Fair', quantity: 6, status: 'active' },
    ],
  },
  assetdashboard: {
    id: 'assetdashboard',
    title: 'Asset Management Dashboard',
    subtitle: 'High-level capital portfolio metrics, condition scores, and operational asset summaries',
    badgeText: 'Portfolio Overview',
    badgeColor: '#e8c97a',
    searchPlaceholder: 'Quick filter metrics...',
    primaryActionLabel: 'All Assets',
    secondaryActionLabel: 'Export Excel Report',
    kpis: [
      { id: 'dash-kpi-1', label: 'Total Catalogued Assets', value: '98 Items', subtitle: 'Across all portfolio properties', color: '#60a5fa', enabled: true },
      { id: 'dash-kpi-2', label: 'Fixed Capital Assets', value: '60 Plant', subtitle: 'Heavy infrastructure & machinery', color: '#a78bfa', enabled: true },
      { id: 'dash-kpi-3', label: 'Non-Fixed FF&E Assets', value: '38 FF&E', subtitle: 'Movable equipment & fixtures', color: '#e8c97a', enabled: true },
      { id: 'dash-kpi-4', label: 'Critical Assets', value: '4 Items', subtitle: 'Priority maintenance attention', color: '#f43f5e', enabled: true },
      { id: 'dash-kpi-5', label: 'Overdue Maintenance', value: '1 Item', subtitle: 'Past scheduled date', color: '#f43f5e', enabled: true },
      { id: 'dash-kpi-6', label: 'Due Today', value: '0 Items', subtitle: 'Scheduled for today', color: '#f59e0b', enabled: true },
      { id: 'dash-kpi-7', label: 'Maintenance Complete', value: '94%', subtitle: 'Completion rate', color: '#3dd68c', enabled: true },
      { id: 'dash-kpi-8', label: 'Properties Managed', value: '8 Sites', subtitle: 'Active properties', color: '#34d399', enabled: true },
    ],
    items: HOTELS.map((h) => ({
      id: h.id,
      property: h.name,
      city: h.city,
      manager: h.manager,
      phone: h.phone,
      totalAssets: h.totalAssets,
    })),
  },
  compliancetracker: {
    id: 'compliancetracker',
    title: 'Compliance Expiry Tracker & Statutory Radar',
    subtitle: 'Traffic-light statutory inspection deadlines, regulatory expirations & renewal radar',
    badgeText: 'Statutory Radar',
    badgeColor: '#f43f5e',
    searchPlaceholder: 'Search compliance obligations, certificates, assignees...',
    primaryActionLabel: 'Log Compliance / Issue',
    secondaryActionLabel: 'Export Schedule CSV',
    kpis: [
      { id: 'ct-kpi-1', label: 'Overdue / Expired', value: '4 Overdue', subtitle: 'Immediate regulatory risk', color: '#f43f5e', enabled: true },
      { id: 'ct-kpi-2', label: 'Due Within 60 Days', value: '7 Due Soon', subtitle: 'Action required soon', color: '#f59e0b', enabled: true },
      { id: 'ct-kpi-3', label: 'Compliant', value: '23 Valid', subtitle: 'No action required', color: '#3dd68c', enabled: true },
    ],
    dropdowns: [
      { id: 'status', label: 'Statutory Status', options: ['All Statuses', 'critical', 'warning', 'ok'] },
      { id: 'category', label: 'Compliance Category', options: ['All Categories', 'Fire Safety', 'Water Hygiene (L8)', 'Electrical (EICR)', 'Gas Safety (CP12)', 'Lift Safety (LOLER)', 'Asbestos Register'] },
      { id: 'site', label: 'Property Site', options: ['All Sites', ...HOTELS.map((h) => h.name)] },
    ],
    columns: [
      { id: 'status', label: 'Traffic Light Status', originalLabel: 'Status', visible: true, order: 1 },
      { id: 'item', label: 'Statutory Item / Obligation', originalLabel: 'Item', visible: true, order: 2 },
      { id: 'site', label: 'Property Site', originalLabel: 'Site', visible: true, order: 3 },
      { id: 'category', label: 'Category', originalLabel: 'Category', visible: true, order: 4 },
      { id: 'dueDate', label: 'Due Date', originalLabel: 'Due Date', visible: true, order: 5 },
      { id: 'assignee', label: 'Responsible Officer', originalLabel: 'Assignee', visible: true, order: 6 },
      { id: 'actions', label: 'Actions', originalLabel: 'Actions', visible: true, order: 7 },
    ],
    items: COMPLIANCE.map((c) => ({
      id: c.id,
      item: c.item,
      site: c.site,
      category: c.category,
      dueDate: c.dueDate,
      assignee: c.assignee,
      status: c.status,
    })),
  },
  overview: {
    id: 'overview',
    title: 'Executive Dashboard',
    subtitle: 'Group-wide facilities overview — 5 Hotels · Asset Management · Maintenance · Compliance · Insurance · Contracts',
    badgeText: '5 Hotels Monitored',
    badgeColor: '#e8c97a',
    searchPlaceholder: 'Search portfolio properties, managers, cities, alerts...',
    primaryActionLabel: 'Add Item',
    secondaryActionLabel: 'Upload Doc',
    topKpis: [
      { id: 'top-kpi-1', label: 'Non-Fixed Assets', value: '38', subtitle: 'Operational FF&E, kitchen & IT assets', color: '#60a5fa', enabled: true },
      { id: 'top-kpi-2', label: 'Overdue Maintenance', value: '7', subtitle: '5 overdue · 2 due today', color: '#f43f5e', enabled: true },
      { id: 'top-kpi-3', label: 'Avg Compliance Score', value: '83%', subtitle: '2 critical · 3 warnings', color: '#e8c97a', enabled: true },
      { id: 'top-kpi-4', label: 'Critical Alerts', value: '3', subtitle: 'Immediate operational action required', color: '#f43f5e', enabled: true },
      { id: 'top-kpi-5', label: 'Expiring Documents', value: '4', subtitle: 'Certificates & statutory licences', color: '#f59e0b', enabled: true },
      { id: 'top-kpi-6', label: 'Open Tasks', value: '8', subtitle: '7 urgent · across all sites', color: '#f59e0b', enabled: true },
      { id: 'top-kpi-7', label: 'Critical Risk Assets', value: '5', subtitle: 'Require immediate operational service', color: '#f43f5e', enabled: true },
      { id: 'top-kpi-8', label: 'Active Utilities', value: '23', subtitle: '£279k annual energy & water spend', color: '#3dd68c', enabled: true },
    ],
    propcoTopKpis: [
      { id: 'kpi-properties', label: 'Monitored Properties', value: '8', subtitle: 'Across all 5 hotel estates', color: '#3dd68c', enabled: true },
      { id: 'kpi-fixed-assets', label: 'Fixed Assets (Plant)', value: '62', subtitle: 'Structural, plant, boilers & lifts', color: '#60a5fa', enabled: true },
      { id: 'kpi-insurance-coverage', label: 'Total Insurance Coverage', value: '£43.5M', subtitle: '7 policies · £106k premium', color: '#60a5fa', enabled: true },
      { id: 'kpi-active-contracts', label: 'Active Contracts', value: '39', subtitle: 'Currently active supplier agreements', color: '#3dd68c', enabled: true },
      { id: 'kpi-contracts-val', label: 'Annual Contracts Value', value: '£1175k', subtitle: 'Active contracts portfolio commitment', color: '#60a5fa', enabled: true },
      { id: 'kpi-expiring-contracts', label: 'Expiring Contracts', value: '6', subtitle: 'Requires attention within 60 days', color: '#f59e0b', enabled: true },
      { id: 'kpi-renewals-due', label: 'Renewals Due', value: '4', subtitle: 'Within 90-day renewal notice window', color: '#f59e0b', enabled: true },
      { id: 'kpi-auto-renew', label: 'Auto-Renewing', value: '30', subtitle: 'Auto-renewing supplier contracts', color: '#3dd68c', enabled: true },
    ],
    propcoKpis: [
      { id: 'mod-properties', label: 'Properties Portfolio', value: '8 Sites', subtitle: '8 active sites · 100% monitored', color: '#e8c97a', enabled: true },
      { id: 'mod-fixed-assets', label: 'Fixed Assets', value: '62 Items', subtitle: '62 plant & machinery · 62% ratio', color: '#60a5fa', enabled: true },
      { id: 'mod-insurance', label: 'Insurance', value: '7 Policies', subtitle: '5 active · 2 expiring attention', color: '#e8c97a', enabled: true },
      { id: 'mod-contracts', label: 'Contracts Register', value: '39 Active', subtitle: '39 active · 6 expiring · 50 total', color: '#f43f5e', enabled: true },
      { id: 'mod-reports', label: 'PropCo Reports', value: '£1175k Contracts', subtitle: '£43.5M insurance · 8 sites', color: '#a78bfa', enabled: true },
    ],
    kpis: [
      { id: 'ov-kpi-1', label: 'Non-Fixed Assets', value: '38 Items', subtitle: 'Kitchen, IT & audio loose inventory', color: '#60a5fa', enabled: true },
      { id: 'ov-kpi-2', label: 'Maintenance (PPM)', value: '5 Overdue', subtitle: '12 scheduled · 10% completion', color: '#f43f5e', enabled: true },
      { id: 'ov-kpi-3', label: 'Statutory Compliance', value: '2 Critical', subtitle: '6 compliant · 3 warning · 2 critical', color: '#e8c97a', enabled: true },
      { id: 'ov-kpi-4', label: 'Tasks & Alerts', value: '7 Urgent', subtitle: '8 open tasks · 7 urgent alerts', color: '#a78bfa', enabled: true },
      { id: 'ov-kpi-5', label: 'Utilities & Energy', value: '£27k Spend', subtitle: '23 active accounts across 4 suppliers', color: '#3dd68c', enabled: true },
    ],
    dropdowns: [
      { id: 'property', label: 'Property Filter', options: ['All Properties', 'Crowne Plaza Kingston-south', 'Stanhill Court', 'Hotel Hampton 1 & 2 Property', 'Ravens Ait Island', 'River Club', 'Warren House', 'Gatwick Manor (Stanhill Court)', 'Sharnbrook'] },
      { id: 'status', label: 'Status Filter', options: ['All Statuses', 'Operational', 'Maintenance'] },
      { id: 'risk', label: 'Risk Rating', options: ['All Risk Levels', 'Low', 'Medium', 'High'] },
    ],
    chartData: [
      { week: 'W1 Mar', compliance: 88, critical: 3 },
      { week: 'W2 Mar', compliance: 86, critical: 4 },
      { week: 'W3 Mar', compliance: 85, critical: 4 },
      { week: 'W4 Mar', compliance: 87, critical: 3 },
      { week: 'W1 Apr', compliance: 86, critical: 4 },
      { week: 'W2 Apr', compliance: 83, critical: 5 },
      { week: 'W3 Apr', compliance: 80, critical: 6 },
      { week: 'W4 Apr', compliance: 81, critical: 5 },
      { week: 'W1 May', compliance: 78, critical: 6 },
      { week: 'W2 May', compliance: 76, critical: 6 },
      { week: 'W3 May', compliance: 75, critical: 5 },
      { week: 'W4 May', compliance: 73, critical: 7 },
    ],
    alerts: [
      { id: 'al-1', type: 'critical', message: 'Overdue maintenance: Fire Alarm Detectors at Crowne Plaza Kingston-south', time: 'Action required' },
      { id: 'al-2', type: 'critical', message: 'Overdue maintenance: Smoke Alarm at Hotel Hampton 1 & Hampton 2 Property', time: 'Action required' },
      { id: 'al-3', type: 'critical', message: 'Overdue maintenance: Gym Equipment Set at River Club', time: 'Action required' },
      { id: 'al-4', type: 'warning', message: 'Compliance warning: Fire Risk Assessment at Crowne Plaza Kingston-south', time: 'Expires 2025-06-01' },
      { id: 'al-5', type: 'warning', message: 'Compliance warning: PAT Testing at Ravens Ait Island', time: 'Expires 2025-08-15' },
    ],
    tasks: [
      { id: 'ut-1', title: 'Renew gas safety certificate — Crowne Plaza', hotelName: 'Crowne Plaza Kingston-south', dueDate: '16 Apr', priority: 'urgent' },
      { id: 'ut-2', title: 'Fire door inspection — Crowne Plaza', hotelName: 'Crowne Plaza Kingston-south', dueDate: '28 Feb', priority: 'urgent' },
      { id: 'ut-3', title: 'Fire Risk Assessment renewal — Stanhill Court', hotelName: 'Stanhill Court', dueDate: '08 Jan', priority: 'urgent' },
      { id: 'ut-4', title: 'Legionella assessment — Ravens Ait', hotelName: 'Ravens Ait Island', dueDate: '07 Jan', priority: 'urgent' },
      { id: 'ut-5', title: 'EICR renewal — Ravens Ait (multiple circuits)', hotelName: 'Ravens Ait Island', dueDate: '26 Sept', priority: 'urgent' },
      { id: 'ut-6', title: 'Emergency lighting renewal — Warren House', hotelName: 'Warren House', dueDate: '17 Oct', priority: 'high' },
    ],
    columns: [
      { id: 'name', label: 'Property', originalLabel: 'Property', visible: true, order: 1 },
      { id: 'city', label: 'City', originalLabel: 'City', visible: true, order: 2 },
      { id: 'manager', label: 'Manager', originalLabel: 'Manager', visible: true, order: 3 },
      { id: 'status', label: 'Status', originalLabel: 'Status', visible: true, order: 4 },
      { id: 'risk', label: 'Risk Level', originalLabel: 'Risk Level', visible: true, order: 5 },
      { id: 'assetCount', label: 'Assets', originalLabel: 'Assets', visible: true, order: 6 },
      { id: 'overdueCount', label: 'Overdue Maint.', originalLabel: 'Overdue Maint.', visible: true, order: 7 },
      { id: 'openIssues', label: 'Open Issues', originalLabel: 'Open Issues', visible: true, order: 8 },
      { id: 'compliance', label: 'Compliance Score', originalLabel: 'Compliance Score', visible: true, order: 9 },
    ],
    items: [
      { id: 'prop-ov-1', name: 'Crowne Plaza Kingston-south', city: 'London', manager: 'Marcus Webb', status: 'Maintenance', risk: 'Medium', assetCount: 36, overdueCount: 2, openIssues: 3, compliance: 86 },
      { id: 'prop-ov-2', name: 'Stanhill Court', city: 'Surrey', manager: 'Sarah Chen', status: 'Maintenance', risk: 'Medium', assetCount: 15, overdueCount: 1, openIssues: 2, compliance: 86 },
      { id: 'prop-ov-3', name: 'Hotel Hampton 1 & Hampton 2 Property', city: 'Surrey', manager: 'James Okafor', status: 'Maintenance', risk: 'Medium', assetCount: 15, overdueCount: 1, openIssues: 2, compliance: 86 },
      { id: 'prop-ov-4', name: 'Ravens Ait Island', city: 'London', manager: 'Priya Sharma', status: 'Operational', risk: 'Low', assetCount: 17, overdueCount: 0, openIssues: 1, compliance: 94 },
      { id: 'prop-ov-5', name: 'River Club', city: 'London', manager: 'David Thornton', status: 'Maintenance', risk: 'Medium', assetCount: 16, overdueCount: 1, openIssues: 2, compliance: 86 },
      { id: 'prop-ov-6', name: 'Warren House', city: 'London', manager: 'Harshit Gulati', status: 'Operational', risk: 'Low', assetCount: 0, overdueCount: 0, openIssues: 1, compliance: 94 },
      { id: 'prop-ov-7', name: 'Gatwick Manor (Stanhill Court)', city: 'Surrey', manager: 'Sarah Chen', status: 'Operational', risk: 'Low', assetCount: 15, overdueCount: 0, openIssues: 1, compliance: 94 },
      { id: 'prop-ov-8', name: 'Sharnbrook', city: 'Bedfordshire', manager: 'Group Admin', status: 'Operational', risk: 'Low', assetCount: 0, overdueCount: 0, openIssues: 1, compliance: 94 },
    ],
  },
};

// ─── STORAGE ACCESSORS ────────────────────────────────────────────────────────

export function getDeepCMSStore(): DeepAppCMSStore {
  if (typeof window === 'undefined') return DEFAULT_DEEP_CMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DEEP_CMS));
      return DEFAULT_DEEP_CMS;
    }
    const parsed: DeepAppCMSStore = JSON.parse(raw);
    const store: DeepAppCMSStore = { ...DEFAULT_DEEP_CMS };

    (Object.keys(DEFAULT_DEEP_CMS) as Array<keyof DeepAppCMSStore>).forEach((key) => {
      const def = DEFAULT_DEEP_CMS[key];
      const saved = parsed[key];
      if (!saved) {
        store[key] = def;
      } else {
        const hasLegacyMockItems = saved.items && saved.items.some((it: any) =>
          it?.id === 'util-01' || it?.id === 'comp-01' || it?.id === 'pol-01' || it?.id === 'doc-01'
        );
        store[key] = {
          ...def,
          title: saved.title || def.title,
          subtitle: saved.subtitle || def.subtitle,
          badgeText: saved.badgeText ?? def.badgeText,
          badgeColor: saved.badgeColor ?? def.badgeColor,
          searchPlaceholder: saved.searchPlaceholder || def.searchPlaceholder,
          primaryActionLabel: (saved.primaryActionLabel || def.primaryActionLabel)?.replace(/^[\+\s]+/, '').trim(),
          secondaryActionLabel: saved.secondaryActionLabel || def.secondaryActionLabel,
          topKpis: def.topKpis
            ? def.topKpis.map((defKpi) => {
                const existing = saved.topKpis?.find((k) => k.id === defKpi.id);
                return existing ? { ...defKpi, ...existing } : defKpi;
              })
            : undefined,
          propcoTopKpis: def.propcoTopKpis
            ? def.propcoTopKpis.map((defKpi) => {
                const existing = saved.propcoTopKpis?.find((k) => k.id === defKpi.id);
                return existing ? { ...defKpi, ...existing } : defKpi;
              })
            : undefined,
          propcoKpis: def.propcoKpis
            ? def.propcoKpis.map((defKpi) => {
                const existing = saved.propcoKpis?.find((k) => k.id === defKpi.id);
                return existing ? { ...defKpi, ...existing } : defKpi;
              })
            : undefined,
          kpis: def.kpis
            ? def.kpis.map((defKpi) => {
                const existing = saved.kpis?.find((k) => k.id === defKpi.id);
                return existing ? { ...defKpi, ...existing } : defKpi;
              })
            : undefined,
          dropdowns: Array.isArray(saved.dropdowns)
            ? saved.dropdowns
            : (def.dropdowns ? [...def.dropdowns] : []),
          columns: Array.isArray(saved.columns) && saved.columns.length > 0
            ? (() => {
                const savedCols: ColumnDefinition[] = saved.columns.map((c: any, idx: number) => ({
                  ...c,
                  order: typeof c.order === 'number' ? c.order : idx + 1,
                  visible: c.visible !== false,
                }));
                savedCols.sort((a, b) => a.order - b.order);
                const missingDefCols = (def.columns || []).filter(
                  (defCol) => !savedCols.some((sc) => sc.id.toLowerCase() === defCol.id.toLowerCase())
                );
                return [...savedCols, ...missingDefCols].map((c, idx) => ({
                  ...c,
                  order: idx + 1,
                }));
              })()
            : (def.columns ? def.columns.map((c, idx) => ({ ...c, order: idx + 1 })) : undefined),
          sections: undefined,
          customLabels: { ...def.customLabels, ...(saved.customLabels || {}) },
          items: (!hasLegacyMockItems && Array.isArray(saved.items) && saved.items.length > 0) ? saved.items : def.items,
          alerts: saved.alerts && saved.alerts.length > 0 ? saved.alerts : def.alerts,
          tasks: saved.tasks && saved.tasks.length > 0 ? saved.tasks : def.tasks,
          chartData: saved.chartData && saved.chartData.length > 0 ? saved.chartData : def.chartData,
        };
      }
    });
    return store;
  } catch (err) {
    console.error('Error reading Deep CMS:', err);
    return DEFAULT_DEEP_CMS;
  }
}

export function saveDeepCMSStore(store: DeepAppCMSStore): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: store }));
    fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(store),
    }).catch((err) => console.warn('[CMS] Remote sync error:', err));
  } catch (err) {
    console.error('Error saving Deep CMS:', err);
  }
}

// Background sync from Firebase Firestore
if (typeof window !== 'undefined') {
  setTimeout(() => {
    fetch('/api/cms')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data && typeof res.data === 'object' && res.source !== 'default') {
          const current = getDeepCMSStore();
          const merged = { ...current, ...res.data };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: merged }));
        }
      })
      .catch((err) => console.warn('[CMS] Remote load fallback:', err));
  }, 200);
}

export function getPageConfig(pageId: keyof DeepAppCMSStore): DeepPageConfig {
  const store = getDeepCMSStore();
  const page = store[pageId] || DEFAULT_DEEP_CMS[pageId];
  if (page && page.primaryActionLabel) {
    return {
      ...page,
      primaryActionLabel: page.primaryActionLabel.replace(/^[\+\s]+/, '').trim(),
    };
  }
  return page;
}

export function updatePageConfig(
  pageId: keyof DeepAppCMSStore,
  updates: Partial<DeepPageConfig>
): DeepPageConfig {
  const store = getDeepCMSStore();
  const sanitizedUpdates = { ...updates };
  if (sanitizedUpdates.primaryActionLabel) {
    sanitizedUpdates.primaryActionLabel = sanitizedUpdates.primaryActionLabel.replace(/^[\+\s]+/, '').trim();
  }
  store[pageId] = {
    ...store[pageId],
    ...sanitizedUpdates,
  };
  saveDeepCMSStore(store);
  return store[pageId];
}

export function updateColumnTitle(
  pageId: keyof DeepAppCMSStore,
  columnId: string,
  newLabel: string
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page || !page.columns) return false;

  const colIndex = page.columns.findIndex((c) => c.id === columnId);
  if (colIndex === -1) return false;

  page.columns[colIndex].label = newLabel;
  saveDeepCMSStore(store);
  return true;
}

export function toggleColumnVisibility(
  pageId: keyof DeepAppCMSStore,
  columnId: string
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page || !page.columns) return false;

  const colIndex = page.columns.findIndex((c) => c.id === columnId);
  if (colIndex === -1) return false;

  page.columns[colIndex].visible = !page.columns[colIndex].visible;
  saveDeepCMSStore(store);
  return true;
}

export function reorderColumns(
  pageId: keyof DeepAppCMSStore,
  newColumns: ColumnDefinition[]
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page) return false;

  page.columns = newColumns.map((col, idx) => ({
    ...col,
    order: idx + 1,
  }));
  saveDeepCMSStore(store);
  return true;
}

export function moveColumn(
  pageId: keyof DeepAppCMSStore,
  columnId: string,
  direction: 'left' | 'right'
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page || !page.columns) return false;

  const cols = [...page.columns].sort((a, b) => a.order - b.order);
  const idx = cols.findIndex((c) => c.id.toLowerCase() === columnId.toLowerCase());
  if (idx === -1) return false;

  const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= cols.length) return false;

  const [removed] = cols.splice(idx, 1);
  cols.splice(targetIdx, 0, removed);

  page.columns = cols.map((col, i) => ({
    ...col,
    order: i + 1,
  }));
  saveDeepCMSStore(store);
  return true;
}

export function addColumn(
  pageId: keyof DeepAppCMSStore,
  column: {
    id: string;
    label: string;
    originalLabel?: string;
    visible?: boolean;
    type?: string;
    defaultValue?: any;
    isCustom?: boolean;
  }
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page) return false;

  if (!page.columns) page.columns = [];

  const rawId = (column.id || column.label).trim();
  const safeId = rawId.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  if (!safeId) return false;

  if (page.columns.some((c) => c.id.toLowerCase() === safeId.toLowerCase())) return false;

  const newCol: ColumnDefinition = {
    id: safeId,
    label: column.label.trim() || safeId,
    originalLabel: column.originalLabel || column.label.trim() || safeId,
    visible: column.visible !== false,
    order: page.columns.length + 1,
    type: (column.type as any) || 'text',
    defaultValue: column.defaultValue ?? '',
    isCustom: true,
  };

  page.columns.push(newCol);

  // Initialize field across all items for this page
  if (Array.isArray(page.items)) {
    page.items = page.items.map((item) => ({
      ...item,
      [safeId]: item[safeId] !== undefined ? item[safeId] : (column.defaultValue ?? ''),
    }));
  }

  saveDeepCMSStore(store);
  return true;
}

export function deleteColumn(
  pageId: keyof DeepAppCMSStore,
  columnId: string
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page || !page.columns) return false;

  page.columns = page.columns
    .filter((c) => c.id.toLowerCase() !== columnId.toLowerCase())
    .map((c, i) => ({ ...c, order: i + 1 }));

  saveDeepCMSStore(store);
  return true;
}

export function addCustomSection(
  pageId: keyof DeepAppCMSStore,
  sectionKey: string,
  section: DeepPageSection,
  initialItems?: Array<Record<string, any>>
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page) return false;

  if (!page.sections) page.sections = {};
  const safeKey = sectionKey.toLowerCase().replace(/[^a-z0-9]/g, '_');
  page.sections[safeKey] = section;

  if (initialItems && initialItems.length > 0) {
    if (!page.items) page.items = [];
    page.items.push(...initialItems);
  }

  saveDeepCMSStore(store);
  return true;
}

export function deletePageSection(
  pageId: keyof DeepAppCMSStore,
  sectionKey: string
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page || !page.sections) return false;

  delete page.sections[sectionKey];
  saveDeepCMSStore(store);
  return true;
}

export function updatePageItem(
  pageId: keyof DeepAppCMSStore,
  itemId: string,
  updates: Record<string, any>
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page || !page.items) return false;

  const itemIndex = page.items.findIndex((item) => item.id === itemId);
  if (itemIndex === -1) return false;

  page.items[itemIndex] = {
    ...page.items[itemIndex],
    ...updates,
  };
  saveDeepCMSStore(store);
  return true;
}

export function addPageItem(
  pageId: keyof DeepAppCMSStore,
  newItem: Record<string, any>
): Record<string, any> | null {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page) return null;

  if (!page.items) page.items = [];

  const itemToAdd = {
    ...newItem,
    id: newItem.id || `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  };

  page.items.push(itemToAdd);
  saveDeepCMSStore(store);
  return itemToAdd;
}

export function deletePageItem(
  pageId: keyof DeepAppCMSStore,
  itemId: string
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page || !page.items) return false;

  page.items = page.items.filter((item) => item.id !== itemId);
  saveDeepCMSStore(store);
  return true;
}

export function updatePageKpi(
  pageId: keyof DeepAppCMSStore,
  kpiId: string,
  updates: Partial<DeepPageKpi>
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page) return false;
  if (!page.kpis) page.kpis = [];
  page.kpis = page.kpis.map((k) => (k.id === kpiId ? { ...k, ...updates } : k));
  saveDeepCMSStore(store);
  return true;
}

export function addPageKpi(
  pageId: keyof DeepAppCMSStore,
  newKpi: DeepPageKpi
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page) return false;
  if (!page.kpis) page.kpis = [];
  page.kpis.push(newKpi);
  saveDeepCMSStore(store);
  return true;
}

export function deletePageKpi(
  pageId: keyof DeepAppCMSStore,
  kpiId: string
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page || !page.kpis) return false;
  page.kpis = page.kpis.filter((k) => k.id !== kpiId);
  saveDeepCMSStore(store);
  return true;
}

export function updatePageDropdown(
  pageId: keyof DeepAppCMSStore,
  dropdownId: string,
  updates: Partial<DeepPageDropdown>
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page) return false;
  if (!page.dropdowns) page.dropdowns = [];
  page.dropdowns = page.dropdowns.map((d) => (d.id === dropdownId ? { ...d, ...updates } : d));
  saveDeepCMSStore(store);
  return true;
}

export function addPageDropdown(
  pageId: keyof DeepAppCMSStore,
  dropdown: DeepPageDropdown
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page) return false;
  if (!page.dropdowns) page.dropdowns = [];

  let cleanId = (dropdown.id || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  if (!cleanId) {
    cleanId = (dropdown.label || 'filter').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  }
  if (!cleanId) cleanId = `drop-${Date.now()}`;

  let finalId = cleanId;
  let counter = 1;
  while (page.dropdowns.some((d) => d.id === finalId)) {
    finalId = `${cleanId}-${counter}`;
    counter++;
  }

  const cleanOptions = (dropdown.options || [])
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  page.dropdowns.push({
    id: finalId,
    label: dropdown.label.trim() || 'New Filter',
    options: cleanOptions.length > 0 ? cleanOptions : [`All ${dropdown.label.trim() || 'Options'}`],
  });

  saveDeepCMSStore(store);
  return true;
}

export function deletePageDropdown(
  pageId: keyof DeepAppCMSStore,
  dropdownId: string
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page || !page.dropdowns) return false;
  page.dropdowns = page.dropdowns.filter((d) => d.id !== dropdownId);
  saveDeepCMSStore(store);
  return true;
}

export function addDropdownOption(
  pageId: keyof DeepAppCMSStore,
  dropdownId: string,
  option: string
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page) return false;
  if (!page.dropdowns) page.dropdowns = [];
  const d = page.dropdowns.find((item) => item.id === dropdownId);
  if (!d) return false;
  if (!d.options.includes(option)) {
    d.options.push(option);
    saveDeepCMSStore(store);
  }
  return true;
}

export function removeDropdownOption(
  pageId: keyof DeepAppCMSStore,
  dropdownId: string,
  optionIndex: number
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page || !page.dropdowns) return false;
  const d = page.dropdowns.find((item) => item.id === dropdownId);
  if (!d) return false;
  d.options.splice(optionIndex, 1);
  saveDeepCMSStore(store);
  return true;
}

export function updatePageSection(
  pageId: keyof DeepAppCMSStore,
  sectionKey: string,
  updates: Partial<DeepPageSection>
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page) return false;
  if (!page.sections) page.sections = {};
  page.sections[sectionKey] = {
    ...page.sections[sectionKey],
    ...updates,
    title: updates.title ?? (page.sections[sectionKey]?.title || ''),
  };
  saveDeepCMSStore(store);
  return true;
}

export function updateCustomLabel(
  pageId: keyof DeepAppCMSStore,
  labelKey: string,
  labelValue: string
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page) return false;
  if (!page.customLabels) page.customLabels = {};
  page.customLabels[labelKey] = labelValue;
  saveDeepCMSStore(store);
  return true;
}

export function updateTopKpi(
  pageId: keyof DeepAppCMSStore,
  kpiId: string,
  updates: Partial<DeepPageKpi>
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page) return false;
  if (!page.topKpis) page.topKpis = [];
  page.topKpis = page.topKpis.map((k) => (k.id === kpiId ? { ...k, ...updates } : k));
  saveDeepCMSStore(store);
  return true;
}

export function updatePropcoTopKpi(
  pageId: keyof DeepAppCMSStore,
  kpiId: string,
  updates: Partial<DeepPageKpi>
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page) return false;
  if (!page.propcoTopKpis) page.propcoTopKpis = [];
  page.propcoTopKpis = page.propcoTopKpis.map((k) => (k.id === kpiId ? { ...k, ...updates } : k));
  saveDeepCMSStore(store);
  return true;
}

export function updatePropcoKpi(
  pageId: keyof DeepAppCMSStore,
  kpiId: string,
  updates: Partial<DeepPageKpi>
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page) return false;
  if (!page.propcoKpis) page.propcoKpis = [];
  page.propcoKpis = page.propcoKpis.map((k) => (k.id === kpiId ? { ...k, ...updates } : k));
  saveDeepCMSStore(store);
  return true;
}

export function updateAlertItem(
  pageId: keyof DeepAppCMSStore,
  alertId: string,
  updates: Partial<DeepAlertItem>
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page || !page.alerts) return false;
  page.alerts = page.alerts.map((a) => (a.id === alertId ? { ...a, ...updates } : a));
  saveDeepCMSStore(store);
  return true;
}

export function addAlertItem(
  pageId: keyof DeepAppCMSStore,
  alert: Omit<DeepAlertItem, 'id'> & { id?: string }
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page) return false;
  if (!page.alerts) page.alerts = [];
  page.alerts.push({
    ...alert,
    id: alert.id || `al-${Date.now()}`,
  });
  saveDeepCMSStore(store);
  return true;
}

export function deleteAlertItem(
  pageId: keyof DeepAppCMSStore,
  alertId: string
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page || !page.alerts) return false;
  page.alerts = page.alerts.filter((a) => a.id !== alertId);
  saveDeepCMSStore(store);
  return true;
}

export function updateTaskItem(
  pageId: keyof DeepAppCMSStore,
  taskId: string,
  updates: Partial<DeepTaskItem>
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page || !page.tasks) return false;
  page.tasks = page.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
  saveDeepCMSStore(store);
  return true;
}

export function addTaskItem(
  pageId: keyof DeepAppCMSStore,
  task: Omit<DeepTaskItem, 'id'> & { id?: string }
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page) return false;
  if (!page.tasks) page.tasks = [];
  page.tasks.push({
    ...task,
    id: task.id || `ut-${Date.now()}`,
  });
  saveDeepCMSStore(store);
  return true;
}

export function deleteTaskItem(
  pageId: keyof DeepAppCMSStore,
  taskId: string
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page || !page.tasks) return false;
  page.tasks = page.tasks.filter((t) => t.id !== taskId);
  saveDeepCMSStore(store);
  return true;
}

export function updateChartDataPoint(
  pageId: keyof DeepAppCMSStore,
  weekIndex: number,
  updates: Partial<DeepChartDataPoint>
): boolean {
  const store = getDeepCMSStore();
  const page = store[pageId];
  if (!page || !page.chartData || !page.chartData[weekIndex]) return false;
  page.chartData[weekIndex] = { ...page.chartData[weekIndex], ...updates };
  saveDeepCMSStore(store);
  return true;
}

export function resetPageConfig(pageId: keyof DeepAppCMSStore): DeepPageConfig {
  const def = DEFAULT_DEEP_CMS[pageId];
  const store = getDeepCMSStore();
  store[pageId] = def;
  saveDeepCMSStore(store);
  return def;
}

// ─── REACT HOOK FOR REAL-TIME CONSUMPTION ─────────────────────────────────────

export function useDeepPageCms(pageId: keyof DeepAppCMSStore) {
  const [pageConfig, setPageConfig] = useState<DeepPageConfig>(() => getPageConfig(pageId));

  const refresh = useCallback(() => {
    setPageConfig(getPageConfig(pageId));
  }, [pageId]);

  useEffect(() => {
    refresh();

    const handleUpdate = () => {
      refresh();
    };

    window.addEventListener(EVENT_KEY, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_KEY, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refresh]);

  const getColLabel = useCallback(
    (colId: string, fallback: string) => {
      const col = pageConfig.columns?.find((c) => c.id === colId);
      return col ? col.label : fallback;
    },
    [pageConfig]
  );

  const isColVisible = useCallback(
    (colId: string, fallback = true) => {
      const col = pageConfig.columns?.find((c) => c.id === colId);
      return col ? col.visible : fallback;
    },
    [pageConfig]
  );

  return {
    config: pageConfig,
    title: pageConfig.title,
    subtitle: pageConfig.subtitle,
    searchPlaceholder: pageConfig.searchPlaceholder,
    primaryActionLabel: pageConfig.primaryActionLabel?.replace(/^[\+\s]+/, '').trim() || '',
    secondaryActionLabel: pageConfig.secondaryActionLabel,
    columns: pageConfig.columns || [],
    sortedVisibleColumns: (pageConfig.columns || [])
      .filter((c) => c.visible !== false)
      .sort((a, b) => a.order - b.order),
    items: pageConfig.items || [],
    customLabels: pageConfig.customLabels || {},
    topKpis: pageConfig.topKpis || [],
    propcoTopKpis: pageConfig.propcoTopKpis || [],
    propcoKpis: pageConfig.propcoKpis || [],
    kpis: pageConfig.kpis || [],
    dropdowns: pageConfig.dropdowns || [],
    sections: pageConfig.sections || {},
    alerts: pageConfig.alerts || [],
    tasks: pageConfig.tasks || [],
    chartData: pageConfig.chartData || [],
    badgeText: pageConfig.badgeText,
    badgeColor: pageConfig.badgeColor,
    getColLabel,
    isColVisible,
    refresh,
  };
}
