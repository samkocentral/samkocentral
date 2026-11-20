'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Download,
  BarChart3,
  Package,
  Wrench,
  ClipboardCheck,
  TrendingUp,
  Building2,
  Shield,
  ScrollText,
  FileCheck,
  Zap,
  Eye,
  Printer,
  Search,
  X,
  CheckCircle2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import {
  ASSETS,
  HOTELS,
  ASSET_CATEGORIES,
  MAINTENANCE_RECORDS,
  DEPARTMENTS,
  getAssetStats,
} from '@/lib/assetData';
import { getLiveProperties } from '@/hooks/useLiveProperties';
import Icon from '@/components/ui/AppIcon';
import { api } from '@/lib/api';
import PageCMSEditButton from '@/components/cms/PageCMSEditButton';
import { useDeepPageCms } from '@/lib/deepPageCms';
import { useAuth } from '@/lib/authContext';
import DocumentTableCell from '@/components/ui/DocumentTableCell';

const stats = getAssetStats();

// ── Shared helpers ────────────────────────────────────────────────────────────
const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: 'var(--foreground)', fontWeight: 600 },
  itemStyle: { color: 'var(--text2)' },
};

function KPICard({
  label,
  value,
  sub,
  color,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div
      className="samko-kpi-card rounded-xl border border-border p-4 relative overflow-hidden transition-all shadow-sm"
      style={{ background: 'var(--surface)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: color }} />
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div className="font-head text-2xl font-extrabold samko-kpi-val tracking-tight" style={{ color }}>
        {value}
      </div>
      <div className="text-xs font-bold mt-1 text-foreground">{label}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}

// ── Asset Report Data ─────────────────────────────────────────────────────────
const byHotelData = HOTELS.map((h) => ({
  name: h.name.split(' ').slice(0, 2).join(' '),
  fullName: h.name,
  total: ASSETS.filter((a) => a.hotelId === h.id).length,
  fixed: ASSETS.filter((a) => a.hotelId === h.id && a.isFixed).length,
  nonFixed: ASSETS.filter((a) => a.hotelId === h.id && !a.isFixed).length,
}));

const byCategoryData = ASSET_CATEGORIES.map((c) => ({
  name: c.name.split(' ').slice(0, 2).join(' '),
  fullName: c.name,
  value: ASSETS.filter((a) => a.category === c.name).length,
  color: c.color,
}))
  .filter((d) => d.value > 0)
  .sort((a, b) => b.value - a.value);

const byConditionData = [
  {
    name: 'Excellent',
    value: ASSETS.filter((a) => a.condition === 'excellent').length,
    color: '#3dd68c',
  },
  { name: 'Good', value: ASSETS.filter((a) => a.condition === 'good').length, color: '#60a5fa' },
  { name: 'Fair', value: ASSETS.filter((a) => a.condition === 'fair').length, color: '#f59e0b' },
  { name: 'Poor', value: ASSETS.filter((a) => a.condition === 'poor').length, color: '#f97316' },
  {
    name: 'Critical',
    value: ASSETS.filter((a) => a.condition === 'critical').length,
    color: '#f43f5e',
  },
].filter((d) => d.value > 0);

const byRiskData = [
  { name: 'Low', value: ASSETS.filter((a) => a.riskLevel === 'low').length, color: '#3dd68c' },
  {
    name: 'Medium',
    value: ASSETS.filter((a) => a.riskLevel === 'medium').length,
    color: '#f59e0b',
  },
  { name: 'High', value: ASSETS.filter((a) => a.riskLevel === 'high').length, color: '#f97316' },
  {
    name: 'Critical',
    value: ASSETS.filter((a) => a.riskLevel === 'critical').length,
    color: '#f43f5e',
  },
].filter((d) => d.value > 0);

const maintenanceStatusData = [
  {
    name: 'Scheduled',
    value: MAINTENANCE_RECORDS.filter((m) => m.status === 'scheduled').length,
    color: '#60a5fa',
  },
  {
    name: 'Due Today',
    value: MAINTENANCE_RECORDS.filter((m) => m.status === 'due-today').length,
    color: '#f59e0b',
  },
  {
    name: 'Overdue',
    value: MAINTENANCE_RECORDS.filter((m) => m.status === 'overdue').length,
    color: '#f43f5e',
  },
  {
    name: 'Completed',
    value: MAINTENANCE_RECORDS.filter((m) => m.status === 'completed').length,
    color: '#3dd68c',
  },
];

const topDeptData = DEPARTMENTS.map((d) => ({
  name: d,
  value: ASSETS.filter((a) => a.department === d).length,
}))
  .filter((d) => d.value > 0)
  .sort((a, b) => b.value - a.value)
  .slice(0, 8);

// ── Maintenance Report ────────────────────────────────────────────────────────
const MAINTENANCE_BY_HOTEL = HOTELS.map((h) => ({
  id: h.id,
  name: h.name.split(' ').slice(0, 2).join(' '),
  fullName: h.name,
  scheduled: MAINTENANCE_RECORDS.filter((m) => m.hotelId === h.id && m.status === 'scheduled')
    .length,
  dueToday: MAINTENANCE_RECORDS.filter((m) => m.hotelId === h.id && m.status === 'due-today')
    .length,
  overdue: MAINTENANCE_RECORDS.filter((m) => m.hotelId === h.id && m.status === 'overdue').length,
  completed: MAINTENANCE_RECORDS.filter((m) => m.hotelId === h.id && m.status === 'completed')
    .length,
}));

const MAINTENANCE_BY_TYPE = [
  {
    name: 'Monthly',
    value: MAINTENANCE_RECORDS.filter((m) => m.frequency === 'monthly').length,
    color: '#60a5fa',
  },
  {
    name: 'Quarterly',
    value: MAINTENANCE_RECORDS.filter((m) => m.frequency === 'quarterly').length,
    color: '#a78bfa',
  },
  {
    name: '6-Monthly',
    value: MAINTENANCE_RECORDS.filter((m) => m.frequency === '6-monthly').length,
    color: '#f59e0b',
  },
  {
    name: 'Yearly',
    value: MAINTENANCE_RECORDS.filter((m) => m.frequency === 'yearly').length,
    color: '#3dd68c',
  },
].filter((d) => d.value > 0);

// ── Insurance Report Data (mock) ──────────────────────────────────────────────
const INSURANCE_HOTELS = [
  'Crowne Plaza Kingston-south',
  'Stanhill Court',
  'Hampton 1 & 2',
  'Ravents Ait Island',
  'River Club',
];

const INSURANCE_POLICIES = [
  {
    hotel: 'Crowne Plaza Kingston-south',
    type: 'Building Insurance',
    company: 'Aviva Commercial',
    premium: 42000,
    coverage: 15000000,
    status: 'active',
    expiry: '2026-01-01',
  },
  {
    hotel: 'Crowne Plaza Kingston-south',
    type: 'Public Liability',
    company: 'AXA Commercial',
    premium: 18500,
    coverage: 10000000,
    status: 'active',
    expiry: '2026-01-01',
  },
  {
    hotel: 'Stanhill Court',
    type: 'Employers Liability',
    company: 'Zurich Insurance',
    premium: 12000,
    coverage: 10000000,
    status: 'active',
    expiry: '2026-02-01',
  },
  {
    hotel: 'Hampton 1 & 2',
    type: 'Equipment Breakdown',
    company: 'RSA Group',
    premium: 8400,
    coverage: 2000000,
    status: 'expiring-soon',
    expiry: '2025-08-01',
  },
  {
    hotel: 'Ravents Ait Island',
    type: 'Business Interruption',
    company: "Lloyd's of London",
    premium: 22000,
    coverage: 5000000,
    status: 'active',
    expiry: '2026-03-01',
  },
  {
    hotel: 'River Club',
    type: 'Cyber Insurance',
    company: 'Hiscox',
    premium: 6500,
    coverage: 1000000,
    status: 'expiring-soon',
    expiry: '2025-09-15',
  },
  {
    hotel: 'Crowne Plaza Kingston-south',
    type: 'Engineering Insurance',
    company: 'Allianz',
    premium: 15000,
    coverage: 8000000,
    status: 'active',
    expiry: '2026-01-01',
  },
  {
    hotel: 'Stanhill Court',
    type: 'Contents Insurance',
    company: 'Aviva Commercial',
    premium: 9800,
    coverage: 3000000,
    status: 'active',
    expiry: '2026-02-01',
  },
];

const totalPremium = INSURANCE_POLICIES.reduce((s, p) => s + p.premium, 0);
const activePolicies = INSURANCE_POLICIES.filter((p) => p.status === 'active').length;
const expiringSoon = INSURANCE_POLICIES.filter((p) => p.status === 'expiring-soon').length;

const insuranceByHotel = INSURANCE_HOTELS.map((h) => ({
  name: h.split(' ').slice(0, 2).join(' '),
  fullName: h,
  policies: INSURANCE_POLICIES.filter((p) => p.hotel === h).length,
  premium: INSURANCE_POLICIES.filter((p) => p.hotel === h).reduce((s, p) => s + p.premium, 0),
}));

const insuranceByType = [
  {
    name: 'Building',
    value: INSURANCE_POLICIES.filter((p) => p.type === 'Building Insurance').length,
    color: '#60a5fa',
  },
  {
    name: 'Liability',
    value: INSURANCE_POLICIES.filter((p) => p.type.includes('Liability')).length,
    color: '#a78bfa',
  },
  {
    name: 'Equipment',
    value: INSURANCE_POLICIES.filter((p) => p.type === 'Equipment Breakdown').length,
    color: '#f59e0b',
  },
  {
    name: 'Business',
    value: INSURANCE_POLICIES.filter((p) => p.type === 'Business Interruption').length,
    color: '#3dd68c',
  },
  {
    name: 'Cyber',
    value: INSURANCE_POLICIES.filter((p) => p.type === 'Cyber Insurance').length,
    color: '#f43f5e',
  },
  {
    name: 'Other',
    value: INSURANCE_POLICIES.filter(
      (p) =>
        ![
          'Building Insurance',
          'Business Interruption',
          'Cyber Insurance',
          'Equipment Breakdown',
        ].includes(p.type) && !p.type.includes('Liability')
    ).length,
    color: '#e8c97a',
  },
].filter((d) => d.value > 0);

// ── Contract Report Data (mock) ───────────────────────────────────────────────
const CONTRACT_DATA = [
  {
    hotel: 'Crowne Plaza Kingston-south',
    supplier: 'FireGuard Systems',
    category: 'Fire Alarm Maintenance',
    value: 12500,
    status: 'expiring-soon',
    endDate: '2026-07-15',
  },
  {
    hotel: 'Crowne Plaza Kingston-south',
    supplier: 'CleanSafe Services Ltd',
    category: 'Cleaning',
    value: 48000,
    status: 'active',
    endDate: '2027-03-31',
  },
  {
    hotel: 'All Hotels',
    supplier: 'Apex Electrical',
    category: 'Electrical',
    value: 32000,
    status: 'active',
    endDate: '2027-12-31',
  },
  {
    hotel: 'Stanhill Court',
    supplier: 'City Gas Engineers',
    category: 'Plumbing',
    value: 6200,
    status: 'expired',
    endDate: '2025-06-10',
  },
  {
    hotel: 'Hampton 1 & 2',
    supplier: 'LiftTech UK',
    category: 'Lift Maintenance',
    value: 18000,
    status: 'active',
    endDate: '2027-06-30',
  },
  {
    hotel: 'Ravents Ait Island',
    supplier: 'PestAway Pro',
    category: 'Pest Control',
    value: 4800,
    status: 'active',
    endDate: '2026-12-31',
  },
  {
    hotel: 'River Club',
    supplier: 'SecureNet Ltd',
    category: 'Security',
    value: 36000,
    status: 'active',
    endDate: '2027-01-31',
  },
  {
    hotel: 'All Hotels',
    supplier: 'WasteWise UK',
    category: 'Waste Collection',
    value: 14400,
    status: 'expiring-soon',
    endDate: '2025-09-30',
  },
];

const totalContractValue = CONTRACT_DATA.reduce((s, c) => s + c.value, 0);
const activeContracts = CONTRACT_DATA.filter((c) => c.status === 'active').length;
const expiringContracts = CONTRACT_DATA.filter((c) => c.status === 'expiring-soon').length;
const expiredContracts = CONTRACT_DATA.filter((c) => c.status === 'expired').length;

const contractsByCategory = [
  {
    name: 'Cleaning',
    value: CONTRACT_DATA.filter((c) => c.category === 'Cleaning').length,
    color: '#60a5fa',
  },
  {
    name: 'Electrical',
    value: CONTRACT_DATA.filter((c) => c.category === 'Electrical').length,
    color: '#a78bfa',
  },
  {
    name: 'Security',
    value: CONTRACT_DATA.filter((c) => c.category === 'Security').length,
    color: '#f59e0b',
  },
  {
    name: 'Maintenance',
    value: CONTRACT_DATA.filter((c) =>
      ['Fire Alarm Maintenance', 'Lift Maintenance', 'Plumbing'].includes(c.category)
    ).length,
    color: '#3dd68c',
  },
  {
    name: 'Other',
    value: CONTRACT_DATA.filter(
      (c) =>
        ![
          'Cleaning',
          'Electrical',
          'Security',
          'Fire Alarm Maintenance',
          'Lift Maintenance',
          'Plumbing',
        ].includes(c.category)
    ).length,
    color: '#e8c97a',
  },
].filter((d) => d.value > 0);

const contractsByHotel = INSURANCE_HOTELS.map((h) => ({
  name: h.split(' ').slice(0, 2).join(' '),
  fullName: h,
  contracts: CONTRACT_DATA.filter((c) => c.hotel === h || c.hotel === 'All Hotels').length,
  value: CONTRACT_DATA.filter((c) => c.hotel === h || c.hotel === 'All Hotels').reduce(
    (s, c) => s + c.value,
    0
  ),
}));

// ── Compliance Report Data (mock) ─────────────────────────────────────────────
const COMPLIANCE_DATA = [
  {
    hotel: 'Crowne Plaza Kingston-south',
    category: 'Fire Risk Assessment',
    status: 'overdue',
    risk: 'critical',
    expiry: '2025-06-01',
  },
  {
    hotel: 'Crowne Plaza Kingston-south',
    category: 'Fire Alarm Certificate',
    status: 'compliant',
    risk: 'high',
    expiry: '2026-03-01',
  },
  {
    hotel: 'Stanhill Court',
    category: 'Gas Safety',
    status: 'expiring-soon',
    risk: 'high',
    expiry: '2025-08-15',
  },
  {
    hotel: 'Hampton 1 & 2',
    category: 'Legionella',
    status: 'compliant',
    risk: 'medium',
    expiry: '2026-01-01',
  },
  {
    hotel: 'Ravents Ait Island',
    category: 'PAT Testing',
    status: 'compliant',
    risk: 'low',
    expiry: '2026-04-01',
  },
  {
    hotel: 'River Club',
    category: 'Lift Inspection',
    status: 'expiring-soon',
    risk: 'high',
    expiry: '2025-09-01',
  },
  {
    hotel: 'Crowne Plaza Kingston-south',
    category: 'HVAC Certification',
    status: 'compliant',
    risk: 'medium',
    expiry: '2026-02-01',
  },
  {
    hotel: 'Stanhill Court',
    category: 'Asbestos Survey',
    status: 'overdue',
    risk: 'critical',
    expiry: '2025-05-01',
  },
  {
    hotel: 'Hampton 1 & 2',
    category: 'Fixed Wire Testing',
    status: 'compliant',
    risk: 'medium',
    expiry: '2026-06-01',
  },
  {
    hotel: 'Ravents Ait Island',
    category: 'Food Hygiene',
    status: 'compliant',
    risk: 'high',
    expiry: '2026-01-15',
  },
];

const totalCompliance = COMPLIANCE_DATA.length;
const compliantCount = COMPLIANCE_DATA.filter((c) => c.status === 'compliant').length;
const overdueCompliance = COMPLIANCE_DATA.filter((c) => c.status === 'overdue').length;
const expiringSoonCompliance = COMPLIANCE_DATA.filter((c) => c.status === 'expiring-soon').length;

const complianceByStatus = [
  { name: 'Compliant', value: compliantCount, color: '#3dd68c' },
  { name: 'Expiring Soon', value: expiringSoonCompliance, color: '#f59e0b' },
  { name: 'Overdue', value: overdueCompliance, color: '#f43f5e' },
].filter((d) => d.value > 0);

const complianceByRisk = [
  { name: 'Low', value: COMPLIANCE_DATA.filter((c) => c.risk === 'low').length, color: '#3dd68c' },
  {
    name: 'Medium',
    value: COMPLIANCE_DATA.filter((c) => c.risk === 'medium').length,
    color: '#f59e0b',
  },
  {
    name: 'High',
    value: COMPLIANCE_DATA.filter((c) => c.risk === 'high').length,
    color: '#f97316',
  },
  {
    name: 'Critical',
    value: COMPLIANCE_DATA.filter((c) => c.risk === 'critical').length,
    color: '#f43f5e',
  },
].filter((d) => d.value > 0);

const complianceByHotel = INSURANCE_HOTELS.map((h) => ({
  name: h.split(' ').slice(0, 2).join(' '),
  fullName: h,
  total: COMPLIANCE_DATA.filter((c) => c.hotel === h).length,
  compliant: COMPLIANCE_DATA.filter((c) => c.hotel === h && c.status === 'compliant').length,
  overdue: COMPLIANCE_DATA.filter((c) => c.hotel === h && c.status === 'overdue').length,
}));

// ── Report type config ────────────────────────────────────────────────────────
const REPORT_TYPES_EXPORT = [
  {
    id: 'asset-register',
    label: 'Asset Register',
    icon: Package,
    desc: 'Full list of all assets across all properties',
  },
  {
    id: 'maintenance',
    label: 'Maintenance Report',
    icon: Wrench,
    desc: 'Scheduled, overdue and completed maintenance',
  },
  {
    id: 'inspection',
    label: 'Inspection Report',
    icon: ClipboardCheck,
    desc: 'Inspection history and results',
  },
  {
    id: 'condition',
    label: 'Asset Condition Report',
    icon: TrendingUp,
    desc: 'Condition assessment across all assets',
  },
  {
    id: 'department',
    label: 'Department Report',
    icon: Building2,
    desc: 'Asset breakdown by department',
  },
  {
    id: 'hotel',
    label: 'Property Report',
    icon: Building2,
    desc: 'Per-property asset summary and compliance',
  },
];

const MAINTENANCE_EXPORT = [
  {
    id: 'maint-schedule',
    label: 'Maintenance Schedule',
    icon: Wrench,
    desc: 'All scheduled maintenance tasks by hotel',
  },
  {
    id: 'maint-overdue',
    label: 'Overdue Maintenance',
    icon: Wrench,
    desc: 'All overdue maintenance requiring action',
  },
  {
    id: 'maint-completed',
    label: 'Completed Maintenance',
    icon: ClipboardCheck,
    desc: 'History of completed maintenance records',
  },
  {
    id: 'maint-frequency',
    label: 'Frequency Analysis',
    icon: TrendingUp,
    desc: 'Maintenance frequency breakdown by asset type',
  },
];

const INSURANCE_EXPORT = [
  {
    id: 'ins-all',
    label: 'All Policies',
    icon: Shield,
    desc: 'Complete insurance policy register',
  },
  {
    id: 'ins-expiring',
    label: 'Expiring Policies',
    icon: Shield,
    desc: 'Policies expiring within 90 days',
  },
  {
    id: 'ins-claims',
    label: 'Claims History',
    icon: FileCheck,
    desc: 'All insurance claims and settlements',
  },
  {
    id: 'ins-premium',
    label: 'Premium Summary',
    icon: TrendingUp,
    desc: 'Annual premium breakdown by hotel and type',
  },
];

const CONTRACT_EXPORT = [
  { id: 'con-all', label: 'All Contracts', icon: ScrollText, desc: 'Complete contracts register' },
  {
    id: 'con-expiring',
    label: 'Expiring Contracts',
    icon: ScrollText,
    desc: 'Contracts expiring within 90 days',
  },
  {
    id: 'con-value',
    label: 'Contract Value Report',
    icon: TrendingUp,
    desc: 'Annual contract value by supplier and hotel',
  },
  {
    id: 'con-suppliers',
    label: 'Supplier Directory',
    icon: Building2,
    desc: 'All suppliers with contact details',
  },
];

const COMPLIANCE_EXPORT = [
  {
    id: 'comp-register',
    label: 'Compliance Register',
    icon: FileCheck,
    desc: 'Full compliance and certification register',
  },
  {
    id: 'comp-overdue',
    label: 'Overdue Items',
    icon: FileCheck,
    desc: 'All overdue compliance items requiring action',
  },
  {
    id: 'comp-expiring',
    label: 'Expiring Certifications',
    icon: FileCheck,
    desc: 'Certifications expiring within 60 days',
  },
  {
    id: 'comp-risk',
    label: 'Risk Assessment Report',
    icon: TrendingUp,
    desc: 'Compliance items by risk rating',
  },
];

// ── Utilities Report Data ─────────────────────────────────────────────────────
type UtilityType = 'Electricity' | 'Gas' | 'Water';
type UtilityStatus = 'active' | 'expiring-soon' | 'expired' | 'incomplete';

interface UtilityAccount {
  id: string;
  property: string;
  utilityType: UtilityType;
  supplier: string;
  accountNumber: string;
  meterReference: string;
  contractStart: string;
  contractEnd: string;
  annualCost: number;
  monthlyCost: number;
  tariffRate: string;
  status: UtilityStatus;
  flags?: string[];
}

const UTILITIES_DATA: UtilityAccount[] = [
  {
    id: 'u-001',
    property: 'Stanhill Court',
    utilityType: 'Electricity',
    supplier: 'British Gas Business',
    accountNumber: 'BG-GOW-001',
    meterReference: 'MPAN: 190002847192',
    contractStart: '2025-01-01',
    contractEnd: '2027-12-31',
    annualCost: 28400,
    monthlyCost: 2367,
    tariffRate: '21.5p/kWh',
    status: 'active',
  },
  {
    id: 'u-002',
    property: 'Crowne Plaza Kingston-south',
    utilityType: 'Gas',
    supplier: 'SEFE Energy',
    accountNumber: '100091219',
    meterReference: 'MPRN: 9209299704',
    contractStart: '2026-03-01',
    contractEnd: '2028-02-29',
    annualCost: 13508,
    monthlyCost: 1126,
    tariffRate: '3.8431p/kWh',
    status: 'active',
  },
  {
    id: 'u-003',
    property: 'Stanhill Court',
    utilityType: 'Water',
    supplier: 'Thames Water Commercial',
    accountNumber: 'TW-SC-003',
    meterReference: 'SPID: 301928471',
    contractStart: '2025-04-01',
    contractEnd: '2027-09-30',
    annualCost: 14800,
    monthlyCost: 1233,
    tariffRate: '£2.45/m³',
    status: 'active',
  },
];

const UTILITY_PROPERTIES = [...new Set(UTILITIES_DATA.map((u) => u.property))];

const utilitiesByProperty = UTILITY_PROPERTIES.map((p) => ({
  name: p.split(' ').slice(0, 2).join(' '),
  fullName: p,
  electricity: UTILITIES_DATA.filter((u) => u.property === p && u.utilityType === 'Electricity')
    .length,
  gas: UTILITIES_DATA.filter((u) => u.property === p && u.utilityType === 'Gas').length,
  water: UTILITIES_DATA.filter((u) => u.property === p && u.utilityType === 'Water').length,
  annualCost: UTILITIES_DATA.filter((u) => u.property === p).reduce((s, u) => s + u.annualCost, 0),
}));

const utilitiesByType = [
  {
    name: 'Electricity',
    value: UTILITIES_DATA.filter((u) => u.utilityType === 'Electricity').length,
    color: '#f59e0b',
  },
  {
    name: 'Gas',
    value: UTILITIES_DATA.filter((u) => u.utilityType === 'Gas').length,
    color: '#f97316',
  },
  {
    name: 'Water',
    value: UTILITIES_DATA.filter((u) => u.utilityType === 'Water').length,
    color: '#60a5fa',
  },
];

const utilitiesByStatus = [
  {
    name: 'Active',
    value: UTILITIES_DATA.filter((u) => u.status === 'active').length,
    color: '#3dd68c',
  },
  {
    name: 'Expiring Soon',
    value: UTILITIES_DATA.filter((u) => u.status === 'expiring-soon').length,
    color: '#f59e0b',
  },
  {
    name: 'Expired',
    value: UTILITIES_DATA.filter((u) => u.status === 'expired').length,
    color: '#f43f5e',
  },
  {
    name: 'Incomplete',
    value: UTILITIES_DATA.filter((u) => u.status === 'incomplete').length,
    color: '#94a3b8',
  },
].filter((d) => d.value > 0);

const totalAnnualUtilityCost = UTILITIES_DATA.reduce((s, u) => s + u.annualCost, 0);
const activeUtilities = UTILITIES_DATA.filter((u) => u.status === 'active').length;
const expiredUtilities = UTILITIES_DATA.filter((u) => u.status === 'expired').length;
const incompleteUtilities = UTILITIES_DATA.filter((u) => u.status === 'incomplete').length;

const UTILITIES_EXPORT = [
  {
    id: 'util-all',
    label: 'Full Utilities Register',
    icon: Zap,
    desc: 'All utility accounts across all properties',
  },
  {
    id: 'util-expiring',
    label: 'Expiring Contracts',
    icon: Zap,
    desc: 'Utility contracts expiring within 90 days',
  },
  {
    id: 'util-expired',
    label: 'Expired Contracts',
    icon: Zap,
    desc: 'Utility contracts that have already expired',
  },
  {
    id: 'util-cost',
    label: 'Annual Cost Summary',
    icon: TrendingUp,
    desc: 'Annual utility cost breakdown by property and type',
  },
  {
    id: 'util-incomplete',
    label: 'Incomplete Records',
    icon: Zap,
    desc: 'Utility accounts with missing documentation',
  },
];

// ── Sub-report components ─────────────────────────────────────────────────────

function MaintenanceReport() {
  const { isPropertyAccessible } = useAuth();
  const [activeSection, setActiveSection] = useState<'overview' | 'charts' | 'export'>('overview');
  const accessibleMaint = useMemo(() => {
    return MAINTENANCE_RECORDS.filter((m) => isPropertyAccessible(m.hotelName || m.hotelId));
  }, [isPropertyAccessible]);
  const accessibleMaintByHotel = useMemo(() => {
    return MAINTENANCE_BY_HOTEL.filter((h) => isPropertyAccessible(h.fullName));
  }, [isPropertyAccessible]);
  const accessibleStatusData = useMemo(
    () => [
      {
        name: 'Scheduled',
        value: accessibleMaint.filter((m) => m.status === 'scheduled').length,
        color: '#60a5fa',
      },
      {
        name: 'Due Today',
        value: accessibleMaint.filter((m) => m.status === 'due-today').length,
        color: '#f59e0b',
      },
      {
        name: 'Overdue',
        value: accessibleMaint.filter((m) => m.status === 'overdue').length,
        color: '#f43f5e',
      },
      {
        name: 'Completed',
        value: accessibleMaint.filter((m) => m.status === 'completed').length,
        color: '#3dd68c',
      },
    ],
    [accessibleMaint]
  );

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div>
          <h1 className="font-head text-xl font-bold">Maintenance Reports</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Maintenance schedule, completion and overdue analysis
          </p>
        </div>
        <div className="samko-segment-container flex items-center gap-1 p-1 rounded-xl">
          {(['overview', 'charts', 'export'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              data-active={activeSection === s ? 'true' : 'false'}
              className="samko-segment-btn px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 py-5">
        {activeSection === 'overview' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-4 gap-4">
              <KPICard
                label="Total Records"
                value={accessibleMaint.length}
                sub="Accessible maintenance tasks"
                color="#e8c97a"
                icon={Wrench}
              />
              <KPICard
                label="Scheduled"
                value={accessibleMaint.filter((m) => m.status === 'scheduled').length}
                sub="Upcoming tasks"
                color="#60a5fa"
                icon={ClipboardCheck}
              />
              <KPICard
                label="Overdue"
                value={accessibleMaint.filter((m) => m.status === 'overdue').length}
                sub="Require immediate action"
                color="#f43f5e"
                icon={Wrench}
              />
              <KPICard
                label="Completed"
                value={accessibleMaint.filter((m) => m.status === 'completed').length}
                sub="Successfully completed"
                color="#3dd68c"
                icon={ClipboardCheck}
              />
            </div>
            <div
              className="rounded-xl border border-border overflow-hidden"
              style={{ background: 'var(--surface)' }}
            >
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <Wrench size={15} style={{ color: 'var(--primary)' }} />
                <span className="font-head font-bold text-sm">Maintenance Summary by Hotel</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead style={{ background: 'var(--surface2)' }}>
                    <tr>
                      {['Hotel', 'Scheduled', 'Due Today', 'Overdue', 'Completed', 'Total'].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {accessibleMaintByHotel.map((row, idx) => (
                      <tr
                        key={row.fullName || (row as any).id || `${row.name}-${idx}`}
                        className="border-b border-border"
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td className="px-4 py-3 font-medium text-sm text-foreground">{row.fullName}</td>
                        <td
                          className={`px-4 py-3 text-sm font-semibold tabular-nums ${row.scheduled > 0 ? 'cell-num-scheduled' : 'cell-num-zero text-muted-foreground'}`}
                          style={{ color: row.scheduled > 0 ? undefined : undefined }}
                        >
                          {row.scheduled}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm font-semibold tabular-nums ${row.dueToday > 0 ? 'cell-num-due' : 'cell-num-zero text-muted-foreground'}`}
                          style={{ color: row.dueToday > 0 ? undefined : undefined }}
                        >
                          {row.dueToday}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm font-semibold tabular-nums ${row.overdue > 0 ? 'cell-num-overdue' : 'cell-num-zero text-muted-foreground'}`}
                          style={{ color: row.overdue > 0 ? undefined : undefined }}
                        >
                          {row.overdue}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm font-semibold tabular-nums ${row.completed > 0 ? 'cell-num-completed' : 'cell-num-zero text-muted-foreground'}`}
                          style={{ color: row.completed > 0 ? undefined : undefined }}
                        >
                          {row.completed}
                        </td>
                        <td
                          className="px-4 py-3 font-bold text-sm tabular-nums text-primary"
                        >
                          {row.scheduled + row.dueToday + row.overdue + row.completed}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div
              className="rounded-xl border border-border overflow-hidden"
              style={{ background: 'var(--surface)' }}
            >
              <div className="px-5 py-4 border-b border-border">
                <span className="font-head font-bold text-sm">Recent Maintenance Records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead style={{ background: 'var(--surface2)' }}>
                    <tr>
                      {['Asset', 'Hotel', 'Type', 'Scheduled Date', 'Assigned To', 'Status'].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {accessibleMaint.slice(0, 10).map((rec) => {
                      const statusColor =
                        rec.status === 'overdue'
                          ? '#f43f5e'
                          : rec.status === 'completed'
                            ? '#3dd68c'
                            : rec.status === 'due-today'
                              ? '#f59e0b'
                              : '#60a5fa';
                      return (
                        <tr
                          key={rec.id}
                          className="border-b border-border"
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = 'var(--surface2)')
                          }
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="px-4 py-3 font-medium text-sm">{rec.assetName}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {rec.hotelName.split(' ').slice(0, 2).join(' ')}
                          </td>
                          <td className="px-4 py-3 text-xs">{rec.type}</td>
                          <td className="px-4 py-3 text-xs">{rec.scheduledDate}</td>
                          <td className="px-4 py-3 text-xs">{rec.assignedTo}</td>
                          <td className="px-4 py-3">
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                              style={{ background: `${statusColor}18`, color: statusColor }}
                            >
                              {(rec.status || 'Scheduled').replace('-', ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeSection === 'charts' && (
          <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div
              className="rounded-xl border border-border p-5"
              style={{ background: 'var(--surface)' }}
            >
              <div className="font-head font-bold text-sm mb-4">Maintenance by Hotel</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={accessibleMaintByHotel}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Bar
                    dataKey="scheduled"
                    name="Scheduled"
                    fill="#60a5fa"
                    stackId="a"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="overdue"
                    name="Overdue"
                    fill="#f43f5e"
                    stackId="a"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="completed"
                    name="Completed"
                    fill="#3dd68c"
                    stackId="a"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div
              className="rounded-xl border border-border p-5"
              style={{ background: 'var(--surface)' }}
            >
              <div className="font-head font-bold text-sm mb-4">Maintenance Status</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={accessibleStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {accessibleStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div
              className="rounded-xl border border-border p-5 col-span-2"
              style={{ background: 'var(--surface)' }}
            >
              <div className="font-head font-bold text-sm mb-4">
                Maintenance Frequency Breakdown
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={MAINTENANCE_BY_TYPE}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="value" name="Tasks" radius={[4, 4, 0, 0]}>
                    {MAINTENANCE_BY_TYPE.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {activeSection === 'export' && <ExportSection items={MAINTENANCE_EXPORT} />}
      </div>
    </div>
  );
}

function InsuranceReport() {
  const { isPropertyAccessible } = useAuth();
  const [activeSection, setActiveSection] = useState<'overview' | 'charts' | 'export'>('overview');
  const accessiblePolicies = useMemo(() => {
    return INSURANCE_POLICIES.filter((p) => isPropertyAccessible(p.hotel));
  }, [isPropertyAccessible]);
  const accessibleInsuranceByHotel = useMemo(() => {
    return insuranceByHotel.filter((h) => isPropertyAccessible(h.fullName));
  }, [isPropertyAccessible]);
  const scopedActivePolicies = accessiblePolicies.filter((p) => p.status === 'active').length;
  const scopedExpiringSoon = accessiblePolicies.filter((p) => p.status === 'expiring-soon').length;
  const scopedTotalPremium = accessiblePolicies.reduce((s, p) => s + p.premium, 0);

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div>
          <h1 className="font-head text-xl font-bold">Insurance Reports</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Policy coverage, premiums and renewal analysis
          </p>
        </div>
        <div className="samko-segment-container flex items-center gap-1 p-1 rounded-xl">
          {(['overview', 'charts', 'export'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              data-active={activeSection === s ? 'true' : 'false'}
              className="samko-segment-btn px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 py-5">
        {activeSection === 'overview' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-4 gap-4">
              <KPICard
                label="Total Policies"
                value={accessiblePolicies.length}
                sub="Accessible policies"
                color="#e8c97a"
                icon={Shield}
              />
              <KPICard
                label="Active Policies"
                value={scopedActivePolicies}
                sub="Currently in force"
                color="#3dd68c"
                icon={Shield}
              />
              <KPICard
                label="Expiring Soon"
                value={scopedExpiringSoon}
                sub="Within 90 days"
                color="#f59e0b"
                icon={Shield}
              />
              <KPICard
                label="Annual Premium"
                value={`£${(scopedTotalPremium / 1000).toFixed(0)}k`}
                sub="Total annual cost"
                color="#60a5fa"
                icon={TrendingUp}
              />
            </div>
            <div
              className="rounded-xl border border-border overflow-hidden"
              style={{ background: 'var(--surface)' }}
            >
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <Shield size={15} style={{ color: 'var(--primary)' }} />
                <span className="font-head font-bold text-sm">Insurance Policies Register</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead style={{ background: 'var(--surface2)' }}>
                    <tr>
                      {[
                        'Hotel',
                        'Insurance Type',
                        'Company',
                        'Annual Premium',
                        'Coverage',
                        'Expiry',
                        'Status',
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {accessiblePolicies.map((pol, i) => {
                      const statusColor =
                        pol.status === 'active'
                          ? '#3dd68c'
                          : pol.status === 'expiring-soon'
                            ? '#f59e0b'
                            : '#f43f5e';
                      return (
                        <tr
                          key={i}
                          className="border-b border-border"
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = 'var(--surface2)')
                          }
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {pol.hotel.split(' ').slice(0, 2).join(' ')}
                          </td>
                          <td className="px-4 py-3 font-medium text-sm">{pol.type}</td>
                          <td className="px-4 py-3 text-xs">{pol.company}</td>
                          <td
                            className="px-4 py-3 text-sm font-semibold"
                            style={{ color: 'var(--primary)' }}
                          >
                            £{pol.premium.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            £{(pol.coverage / 1000000).toFixed(0)}M
                          </td>
                          <td className="px-4 py-3 text-xs">{pol.expiry}</td>
                          <td className="px-4 py-3">
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                              style={{ background: `${statusColor}18`, color: statusColor }}
                            >
                              {(pol.status || 'Active').replace('-', ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeSection === 'charts' && (
          <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div
              className="rounded-xl border border-border p-5"
              style={{ background: 'var(--surface)' }}
            >
              <div className="font-head font-bold text-sm mb-4">Policies by Hotel</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={accessibleInsuranceByHotel}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="policies" name="Policies" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div
              className="rounded-xl border border-border p-5"
              style={{ background: 'var(--surface)' }}
            >
              <div className="font-head font-bold text-sm mb-4">Insurance by Type</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={insuranceByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {insuranceByType.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div
              className="rounded-xl border border-border p-5 col-span-2"
              style={{ background: 'var(--surface)' }}
            >
              <div className="font-head font-bold text-sm mb-4">Annual Premium by Hotel</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={insuranceByHotel}
                  margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--text2)' }}
                    tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    {...CHART_TOOLTIP_STYLE}
                    formatter={(v: number) => [`£${v.toLocaleString()}`, 'Premium']}
                  />
                  <Bar
                    dataKey="premium"
                    name="Annual Premium"
                    fill="#e8c97a"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {activeSection === 'export' && <ExportSection items={INSURANCE_EXPORT} />}
      </div>
    </div>
  );
}

function ContractReport() {
  const { isPropertyAccessible } = useAuth();
  const [activeSection, setActiveSection] = useState<'overview' | 'charts' | 'export'>('overview');
  const accessibleContracts = useMemo(() => {
    return CONTRACT_DATA.filter((c) => isPropertyAccessible(c.hotel));
  }, [isPropertyAccessible]);
  const accessibleContractsByHotel = useMemo(() => {
    return contractsByHotel.filter((h) => isPropertyAccessible(h.fullName));
  }, [isPropertyAccessible]);
  const scopedActiveContracts = accessibleContracts.filter((c) => c.status === 'active').length;
  const scopedExpiringContracts = accessibleContracts.filter(
    (c) => c.status === 'expiring-soon'
  ).length;
  const scopedTotalContractValue = accessibleContracts.reduce((s, c) => s + c.value, 0);

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div>
          <h1 className="font-head text-xl font-bold">Contract Reports</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Supplier contracts, values and renewal analysis
          </p>
        </div>
        <div className="samko-segment-container flex items-center gap-1 p-1 rounded-xl">
          {(['overview', 'charts', 'export'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              data-active={activeSection === s ? 'true' : 'false'}
              className="samko-segment-btn px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 py-5">
        {activeSection === 'overview' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-4 gap-4">
              <KPICard
                label="Total Contracts"
                value={accessibleContracts.length}
                sub="Accessible contracts"
                color="#e8c97a"
                icon={ScrollText}
              />
              <KPICard
                label="Active"
                value={scopedActiveContracts}
                sub="Currently active"
                color="#3dd68c"
                icon={ScrollText}
              />
              <KPICard
                label="Expiring Soon"
                value={scopedExpiringContracts}
                sub="Within 90 days"
                color="#f59e0b"
                icon={ScrollText}
              />
              <KPICard
                label="Annual Value"
                value={`£${(scopedTotalContractValue / 1000).toFixed(0)}k`}
                sub="Total contract value"
                color="#60a5fa"
                icon={TrendingUp}
              />
            </div>
            <div
              className="rounded-xl border border-border overflow-hidden"
              style={{ background: 'var(--surface)' }}
            >
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <ScrollText size={15} style={{ color: 'var(--primary)' }} />
                <span className="font-head font-bold text-sm">Contracts Register</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px]">
                  <thead style={{ background: 'var(--surface2)' }}>
                    <tr>
                      {['Hotel', 'Supplier', 'Category', 'Annual Value', 'End Date', 'Status', 'Document'].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {accessibleContracts.map((con, i) => {
                      const statusColor =
                        con.status === 'active'
                          ? '#3dd68c'
                          : con.status === 'expiring-soon'
                            ? '#f59e0b'
                            : '#f43f5e';
                      const docName =
                        (con as any).documentName ||
                        (con as any).fileName ||
                        (con as any).document ||
                        null;
                      const docUrl =
                        (con as any).documentUrl ||
                        (con as any).fileUrl ||
                        null;

                      return (
                        <tr
                          key={i}
                          className="border-b border-border"
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = 'var(--surface2)')
                          }
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {con.hotel.split(' ').slice(0, 2).join(' ')}
                          </td>
                          <td className="px-4 py-3 font-medium text-sm">{con.supplier}</td>
                          <td className="px-4 py-3 text-xs">{con.category}</td>
                          <td
                            className="px-4 py-3 text-sm font-semibold"
                            style={{ color: 'var(--primary)' }}
                          >
                            £{con.value.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-xs">{con.endDate}</td>
                          <td className="px-4 py-3">
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                              style={{ background: `${statusColor}18`, color: statusColor }}
                            >
                              {(con.status || 'Active').replace('-', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <DocumentTableCell
                              documentName={docName}
                              documentUrl={docUrl}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeSection === 'charts' && (
          <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div
              className="rounded-xl border border-border p-5"
              style={{ background: 'var(--surface)' }}
            >
              <div className="font-head font-bold text-sm mb-4">Contracts by Category</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={contractsByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {contractsByCategory.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div
              className="rounded-xl border border-border p-5"
              style={{ background: 'var(--surface)' }}
            >
              <div className="font-head font-bold text-sm mb-4">Contracts by Hotel</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={accessibleContractsByHotel}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="contracts" name="Contracts" fill="#e8c97a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div
              className="rounded-xl border border-border p-5 col-span-2"
              style={{ background: 'var(--surface)' }}
            >
              <div className="font-head font-bold text-sm mb-4">Contract Value by Hotel</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={accessibleContractsByHotel}
                  margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--text2)' }}
                    tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    {...CHART_TOOLTIP_STYLE}
                    formatter={(v: number) => [`£${v.toLocaleString()}`, 'Value']}
                  />
                  <Bar dataKey="value" name="Annual Value" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {activeSection === 'export' && <ExportSection items={CONTRACT_EXPORT} />}
      </div>
    </div>
  );
}

function ComplianceReport() {
  const { isPropertyAccessible } = useAuth();
  const [activeSection, setActiveSection] = useState<'overview' | 'charts' | 'export'>('overview');
  const accessibleCompliance = useMemo(() => {
    return COMPLIANCE_DATA.filter((c) => isPropertyAccessible(c.hotel));
  }, [isPropertyAccessible]);
  const accessibleComplianceByHotel = useMemo(() => {
    return complianceByHotel.filter((h) => isPropertyAccessible(h.fullName));
  }, [isPropertyAccessible]);
  const scopedTotalCompliance = accessibleCompliance.length;
  const scopedCompliantCount = accessibleCompliance.filter((c) => c.status === 'compliant').length;
  const scopedOverdueCompliance = accessibleCompliance.filter((c) => c.status === 'overdue').length;
  const scopedExpiringSoonCompliance = accessibleCompliance.filter(
    (c) => c.status === 'expiring-soon'
  ).length;

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div>
          <h1 className="font-head text-xl font-bold">Compliance Reports</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Statutory compliance, certifications and risk analysis
          </p>
        </div>
        <div className="samko-segment-container flex items-center gap-1 p-1 rounded-xl">
          {(['overview', 'charts', 'export'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              data-active={activeSection === s ? 'true' : 'false'}
              className="samko-segment-btn px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 py-5">
        {activeSection === 'overview' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-4 gap-4">
              <KPICard
                label="Total Items"
                value={scopedTotalCompliance}
                sub="Accessible records"
                color="#e8c97a"
                icon={FileCheck}
              />
              <KPICard
                label="Compliant"
                value={scopedCompliantCount}
                sub="Up to date"
                color="#3dd68c"
                icon={FileCheck}
              />
              <KPICard
                label="Overdue"
                value={scopedOverdueCompliance}
                sub="Require immediate action"
                color="#f43f5e"
                icon={FileCheck}
              />
              <KPICard
                label="Expiring Soon"
                value={scopedExpiringSoonCompliance}
                sub="Within 60 days"
                color="#f59e0b"
                icon={FileCheck}
              />
            </div>
            <div
              className="rounded-xl border border-border overflow-hidden"
              style={{ background: 'var(--surface)' }}
            >
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <FileCheck size={15} style={{ color: 'var(--primary)' }} />
                <span className="font-head font-bold text-sm">Compliance Summary by Hotel</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px]">
                  <thead style={{ background: 'var(--surface2)' }}>
                    <tr>
                      {['Hotel', 'Total Items', 'Compliant', 'Overdue', 'Compliance Rate'].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {accessibleComplianceByHotel
                      .filter((r) => r.total > 0)
                      .map((row, idx) => {
                        const rate =
                          row.total > 0 ? Math.round((row.compliant / row.total) * 100) : 0;
                        return (
                          <tr
                            key={row.fullName || `${row.name}-${idx}`}
                            className="border-b border-border"
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = 'var(--surface2)')
                            }
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td className="px-4 py-3 font-medium text-sm">{row.fullName}</td>
                            <td
                              className="px-4 py-3 font-bold text-sm"
                              style={{ color: 'var(--primary)' }}
                            >
                              {row.total}
                            </td>
                            <td className="px-4 py-3 text-sm" style={{ color: '#3dd68c' }}>
                              {row.compliant}
                            </td>
                            <td
                              className="px-4 py-3 text-sm"
                              style={{ color: row.overdue > 0 ? '#f43f5e' : 'var(--text2)' }}
                            >
                              {row.overdue}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                                  style={{ background: 'var(--surface3)', maxWidth: 80 }}
                                >
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${rate}%`,
                                      background:
                                        rate >= 80 ? '#3dd68c' : rate >= 50 ? '#f59e0b' : '#f43f5e',
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-semibold">{rate}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
            <div
              className="rounded-xl border border-border overflow-hidden"
              style={{ background: 'var(--surface)' }}
            >
              <div className="px-5 py-4 border-b border-border">
                <span className="font-head font-bold text-sm">Compliance Items Detail</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px]">
                  <thead style={{ background: 'var(--surface2)' }}>
                    <tr>
                      {['Hotel', 'Category', 'Status', 'Risk', 'Expiry'].map((h) => (
                        <th
                          key={h}
                          className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {accessibleCompliance.map((item, i) => {
                      const statusColor =
                        item.status === 'compliant'
                          ? '#3dd68c'
                          : item.status === 'expiring-soon'
                            ? '#f59e0b'
                            : '#f43f5e';
                      const riskColor =
                        item.risk === 'critical'
                          ? '#f43f5e'
                          : item.risk === 'high'
                            ? '#f97316'
                            : item.risk === 'medium'
                              ? '#f59e0b'
                              : '#3dd68c';
                      return (
                        <tr
                          key={i}
                          className="border-b border-border"
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = 'var(--surface2)')
                          }
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {item.hotel.split(' ').slice(0, 2).join(' ')}
                          </td>
                          <td className="px-4 py-3 font-medium text-sm">{item.category}</td>
                          <td className="px-4 py-3">
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                              style={{ background: `${statusColor}18`, color: statusColor }}
                            >
                              {(item.status || 'Compliant').replace('-', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="text-xs font-semibold capitalize"
                              style={{ color: riskColor }}
                            >
                              {item.risk}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">{item.expiry}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeSection === 'charts' && (
          <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div
              className="rounded-xl border border-border p-5"
              style={{ background: 'var(--surface)' }}
            >
              <div className="font-head font-bold text-sm mb-4">Compliance Status</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={complianceByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {complianceByStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div
              className="rounded-xl border border-border p-5"
              style={{ background: 'var(--surface)' }}
            >
              <div className="font-head font-bold text-sm mb-4">Risk Level Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={complianceByRisk}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {complianceByRisk.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {activeSection === 'export' && <ExportSection items={COMPLIANCE_EXPORT} />}
      </div>
    </div>
  );
}

// ── Helper: Get real report dataset by ID ──────────────────────────────────────
function getReportDataset(
  reportId: string,
  isPropertyAccessible?: (prop?: string | null) => boolean
): { title: string; rows: Record<string, any>[] } {
  const check = (prop?: string | null) => !isPropertyAccessible || isPropertyAccessible(prop);
  const scopedMaint = MAINTENANCE_RECORDS.filter((m) => check(m.hotelName || m.hotelId));
  const scopedAssets = ASSETS.filter((a) => check(a.hotelName || a.hotelId));
  const scopedHotels = HOTELS.filter((h) => check(h.name || h.id));
  const scopedInsurance = INSURANCE_POLICIES.filter((p) => check(p.hotel));
  const scopedContracts = CONTRACT_DATA.filter((c) => check(c.hotel));
  const scopedCompliance = COMPLIANCE_DATA.filter((c) => check(c.hotel));
  const scopedUtilities = UTILITIES_DATA.filter((u) => check(u.property));

  switch (reportId) {
    // ── Maintenance Reports ──
    case 'maint-schedule':
      return {
        title: 'Maintenance Schedule',
        rows: scopedMaint.map((m) => ({
          'Asset Name': m.assetName,
          Property: m.hotelName,
          Type: m.type,
          Frequency: m.frequency,
          'Scheduled Date': m.scheduledDate,
          'Assigned To': m.assignedTo,
          Status: m.status.toUpperCase(),
          'Next Due Date': m.nextDueDate,
        })),
      };
    case 'maint-overdue':
      return {
        title: 'Overdue Maintenance',
        rows: scopedMaint
          .filter((m) => m.status === 'overdue')
          .map((m) => ({
            'Asset Name': m.assetName,
            Property: m.hotelName,
            'Scheduled Date': m.scheduledDate,
            'Assigned To': m.assignedTo,
            Frequency: m.frequency,
            Status: 'OVERDUE',
            Urgency: 'Immediate Action Required',
            Notes: m.notes || 'Overdue statutory maintenance',
          })),
      };
    case 'maint-completed':
      return {
        title: 'Completed Maintenance History',
        rows: scopedMaint
          .filter((m) => m.status === 'completed')
          .map((m) => ({
            'Asset Name': m.assetName,
            Property: m.hotelName,
            'Completed Date': m.completedDate || m.scheduledDate,
            'Inspector / Engineer': m.assignedTo,
            Type: m.type,
            Frequency: m.frequency,
            'Inspection Result': m.result || 'Pass',
            Status: 'Completed',
          })),
      };
    case 'maint-frequency':
      return {
        title: 'Maintenance Frequency Analysis',
        rows: scopedMaint.map((m) => ({
          'Asset Name': m.assetName,
          Property: m.hotelName,
          'Cycle Frequency': m.frequency,
          'Maintenance Type': m.type,
          'Assigned Engineer': m.assignedTo,
          'Current Status': m.status.toUpperCase(),
          'Next Due Date': m.nextDueDate,
        })),
      };

    // ── Asset Reports ──
    case 'asset-register':
      return {
        title: 'Complete Asset Register',
        rows: scopedAssets.map((a) => ({
          'Asset ID': a.assetId,
          'Asset Name': a.name,
          Category: a.category,
          Property: a.hotelName,
          Department: a.department,
          Location: a.location,
          Condition: a.condition.toUpperCase(),
          Status: a.status.toUpperCase(),
          'Fixed Asset': a.isFixed ? 'Yes' : 'No',
          'Purchase Cost': a.purchaseCost ? `£${a.purchaseCost.toLocaleString()}` : '—',
        })),
      };
    case 'condition':
      return {
        title: 'Asset Condition Assessment',
        rows: scopedAssets.map((a) => ({
          'Asset ID': a.assetId,
          'Asset Name': a.name,
          Property: a.hotelName,
          Category: a.category,
          'Condition Rating': a.condition.toUpperCase(),
          'Risk Level': a.riskLevel.toUpperCase(),
          'Responsible Role': a.responsibleRole,
          'Next Inspection': a.nextInspectionDate,
        })),
      };
    case 'department':
      return {
        title: 'Department Asset Breakdown',
        rows: scopedAssets.map((a) => ({
          Department: a.department,
          'Asset Name': a.name,
          'Asset ID': a.assetId,
          Property: a.hotelName,
          Category: a.category,
          Condition: a.condition,
          Status: a.status,
        })),
      };
    case 'hotel':
      return {
        title: 'Property Asset Summary',
        rows: scopedHotels.map((h) => ({
          'Property Name': h.name,
          City: h.city,
          Manager: h.manager,
          Phone: h.phone,
          'Total Assets': scopedAssets.filter((a) => a.hotelId === h.id).length,
          'Fixed Assets': scopedAssets.filter((a) => a.hotelId === h.id && a.isFixed).length,
          'Non-Fixed Assets': scopedAssets.filter((a) => a.hotelId === h.id && !a.isFixed).length,
          Status: h.status.toUpperCase(),
        })),
      };

    // ── Insurance Reports ──
    case 'ins-all':
      return {
        title: 'Insurance Policy Register',
        rows: scopedInsurance.map((p) => ({
          Property: p.hotel,
          'Insurance Type': p.type,
          'Underwriter / Company': p.company,
          'Annual Premium': `£${p.premium.toLocaleString()}`,
          'Coverage Limit': `£${(p.coverage / 1000000).toFixed(1)}M`,
          'Expiry Date': p.expiry,
          Status: p.status.toUpperCase(),
        })),
      };
    case 'ins-expiring':
      return {
        title: 'Expiring Insurance Policies',
        rows: scopedInsurance
          .filter((p) => p.status === 'expiring-soon')
          .map((p) => ({
            Property: p.hotel,
            'Insurance Type': p.type,
            Underwriter: p.company,
            'Annual Premium': `£${p.premium.toLocaleString()}`,
            'Expiry Date': p.expiry,
            'Action Required': 'Broker renewal quote needed',
            Status: 'EXPIRING SOON',
          })),
      };
    case 'ins-claims':
      return {
        title: 'Insurance Claims History',
        rows: [
          {
            'Claim ID': 'CLM-001',
            Property: 'Crowne Plaza Kingston-south',
            Policy: 'Building Insurance',
            Amount: '£14,500',
            Date: '2025-11-20',
            Status: 'Settled',
          },
          {
            'Claim ID': 'CLM-002',
            Property: 'Stanhill Court',
            Policy: 'Public Liability',
            Amount: '£8,200',
            Date: '2026-01-15',
            Status: 'Under Review',
          },
          {
            'Claim ID': 'CLM-003',
            Property: 'River Club',
            Policy: 'Waterfront Risk',
            Amount: '£22,000',
            Date: '2026-03-02',
            Status: 'In Progress',
          },
        ].filter((c) => check(c.Property)),
      };
    case 'ins-premium':
      return {
        title: 'Premium Summary by Property',
        rows: insuranceByHotel
          .filter((h) => check(h.fullName))
          .map((h) => ({
            Property: h.fullName,
            'Active Policies': h.policies,
            'Total Annual Spend': `£${h.premium.toLocaleString()}`,
          })),
      };

    // ── Contract Reports ──
    case 'con-all':
      return {
        title: 'Service Contracts Register',
        rows: scopedContracts.map((c) => ({
          'Contractor / Supplier': c.supplier,
          Property: c.hotel,
          'Service Category': c.category,
          'Annual Value': `£${c.value.toLocaleString()}`,
          'Contract End Date': c.endDate,
          Status: c.status.toUpperCase(),
        })),
      };
    case 'con-expiring':
      return {
        title: 'Expiring Service Contracts',
        rows: scopedContracts
          .filter((c) => c.status === 'expiring-soon')
          .map((c) => ({
            Supplier: c.supplier,
            Property: c.hotel,
            Category: c.category,
            'Annual Value': `£${c.value.toLocaleString()}`,
            'End Date': c.endDate,
            Status: 'EXPIRING SOON',
          })),
      };
    case 'con-value':
      return {
        title: 'Contract Value by Property',
        rows: contractsByHotel
          .filter((h) => check(h.fullName))
          .map((h) => ({
            Property: h.fullName,
            'Active Contracts': h.contracts,
            'Total Contract Value': `£${h.value.toLocaleString()}`,
          })),
      };
    case 'con-suppliers':
      return {
        title: 'Approved Suppliers Directory',
        rows: Array.from(new Set(scopedContracts.map((c) => c.supplier))).map((sup) => {
          const contracts = scopedContracts.filter((c) => c.supplier === sup);
          return {
            'Supplier Name': sup,
            Categories: contracts.map((c) => c.category).join(', '),
            'Active Contracts': contracts.length,
            'Total Value': `£${contracts.reduce((s, c) => s + c.value, 0).toLocaleString()}`,
          };
        }),
      };

    // ── Compliance Reports ──
    case 'comp-register':
      return {
        title: 'Statutory Compliance Register',
        rows: scopedCompliance.map((c) => ({
          Property: c.hotel,
          'Statutory Item': c.category,
          'Risk Level': c.risk.toUpperCase(),
          'Expiry Date': c.expiry,
          Status: c.status.toUpperCase(),
        })),
      };
    case 'comp-overdue':
      return {
        title: 'Overdue Statutory Compliance Items',
        rows: scopedCompliance
          .filter((c) => c.status === 'overdue')
          .map((c) => ({
            Property: c.hotel,
            'Statutory Item': c.category,
            'Risk Level': c.risk.toUpperCase(),
            'Expiry Date': c.expiry,
            Status: 'CRITICAL OVERDUE',
            'Action Required': 'Schedule urgent compliance inspection',
          })),
      };
    case 'comp-expiring':
      return {
        title: 'Expiring Compliance Certifications',
        rows: scopedCompliance
          .filter((c) => c.status === 'expiring-soon')
          .map((c) => ({
            Property: c.hotel,
            Certificate: c.category,
            'Risk Level': c.risk.toUpperCase(),
            'Expiry Date': c.expiry,
            Status: 'EXPIRING SOON',
          })),
      };
    case 'comp-risk':
      return {
        title: 'Compliance Risk Assessment',
        rows: scopedCompliance.map((c) => ({
          'Statutory Item': c.category,
          Property: c.hotel,
          'Assigned Risk': c.risk.toUpperCase(),
          'Current Status': c.status.toUpperCase(),
        })),
      };

    // ── Utilities Reports ──
    case 'util-all':
      return {
        title: 'Utility Accounts & Meters Register',
        rows: scopedUtilities.map((u) => ({
          Property: u.property,
          'Utility Type': u.utilityType,
          Supplier: u.supplier,
          'Account Number': u.accountNumber,
          'Meter Reference': u.meterReference,
          'Contract End': u.contractEnd || 'Not Recorded',
          'Annual Cost': u.annualCost ? `£${u.annualCost.toLocaleString()}` : '—',
          Tariff: u.tariffRate,
          Status: u.status.toUpperCase(),
        })),
      };
    case 'util-expiring':
      return {
        title: 'Expiring Utility Contracts',
        rows: scopedUtilities
          .filter((u) => u.status === 'expiring-soon')
          .map((u) => ({
            Property: u.property,
            'Utility Type': u.utilityType,
            Supplier: u.supplier,
            'Contract End': u.contractEnd,
            'Annual Cost': `£${u.annualCost.toLocaleString()}`,
            Status: 'RENEWAL DUE',
          })),
      };
    case 'util-expired':
      return {
        title: 'Expired Utility Contracts',
        rows: scopedUtilities
          .filter((u) => u.status === 'expired')
          .map((u) => ({
            Property: u.property,
            'Utility Type': u.utilityType,
            Supplier: u.supplier,
            'Contract End': u.contractEnd,
            'Annual Cost': `£${u.annualCost.toLocaleString()}`,
            Status: 'EXPIRED',
            Action: 'Broker tender required',
          })),
      };
    case 'util-cost':
      return {
        title: 'Annual Utility Cost Breakdown',
        rows: scopedUtilities.map((u) => ({
          Property: u.property,
          Utility: u.utilityType,
          'Annual Cost': u.annualCost ? `£${u.annualCost.toLocaleString()}` : '—',
          'Monthly Spend': u.monthlyCost ? `£${u.monthlyCost.toLocaleString()}` : '—',
          Supplier: u.supplier,
        })),
      };
    case 'util-incomplete':
      return {
        title: 'Incomplete Utility Records',
        rows: scopedUtilities
          .filter((u) => u.status === 'incomplete')
          .map((u) => ({
            Property: u.property,
            'Utility Type': u.utilityType,
            Supplier: u.supplier,
            Tariff: u.tariffRate,
            Status: 'INCOMPLETE',
          })),
      };

    default:
      return {
        title: 'Standard Report',
        rows: scopedMaint.map((m) => ({
          Asset: m.assetName,
          Property: m.hotelName,
          Status: m.status,
          Date: m.scheduledDate,
        })),
      };
  }
}

// ── Export Section Component with View, Excel, and PDF functionality ───────────
function ExportSection({
  items,
}: {
  items: { id: string; label: string; icon: React.ElementType; desc: string }[];
}) {
  const { isPropertyAccessible } = useAuth();
  const [previewReport, setPreviewReport] = useState<{
    id: string;
    label: string;
    desc: string;
    rows: Record<string, any>[];
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  // 1. Export Excel using XLSX (SheetJS)
  const handleExportExcel = (report: { id: string; label: string }) => {
    const dataset = getReportDataset(report.id, isPropertyAccessible);
    if (!dataset.rows || dataset.rows.length === 0) {
      toast.error('No data available to export');
      return;
    }

    try {
      const worksheet = XLSX.utils.json_to_sheet(dataset.rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, report.label.slice(0, 31));
      const filename = `SamkoCentral_${report.label.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success('Excel report downloaded successfully', {
        description: `"${filename}" saved with ${dataset.rows.length} rows.`,
      });
    } catch (err: any) {
      console.error('Failed to export Excel:', err);
      toast.error('Failed to export Excel spreadsheet');
    }
  };

  // 2. Export / Print as PDF
  const handleExportPDF = (report: { id: string; label: string }) => {
    const dataset = getReportDataset(report.id, isPropertyAccessible);
    if (!dataset.rows || dataset.rows.length === 0) {
      toast.error('No data available to export');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up window blocked. Please allow pop-ups to print or save PDF.');
      return;
    }

    const columns = Object.keys(dataset.rows[0]);
    const tableHeaders = columns
      .map(
        (col) =>
          `<th style="background:#f1f5f9;color:#1e293b;padding:8px 12px;font-size:11px;font-weight:700;text-align:left;border:1px solid #cbd5e1;text-transform:uppercase;">${col}</th>`
      )
      .join('');
    const tableBody = dataset.rows
      .map(
        (row, idx) => `
      <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        ${columns.map((col) => `<td style="padding:7px 12px;font-size:11px;border:1px solid #e2e8f0;color:#334155;">${row[col] ?? '—'}</td>`).join('')}
      </tr>
    `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>SamkoCentral UK - ${report.label}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; margin: 0; color: #0f172a; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e8c97a; padding-bottom: 12px; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #0a0c10; }
            .subtitle { font-size: 11px; color: #64748b; margin-top: 3px; font-weight: 500; }
            .meta { font-size: 11px; color: #475569; text-align: right; }
            .tag { display: inline-block; background: #fef3c7; color: #92400e; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 14px; }
            .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 8px; }
            @media print {
              body { padding: 12px; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">SamkoCentral UK</div>
              <div class="subtitle">Operations · Compliance · Document Governance</div>
            </div>
            <div class="meta">
              <span class="tag">${report.label}</span>
              <div>Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              <div>Total Records: ${dataset.rows.length}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>${tableHeaders}</tr>
            </thead>
            <tbody>
              ${tableBody}
            </tbody>
          </table>
          <div class="footer">
            <span>SamkoCentral UK Portfolio Intelligence · Confidential</span>
            <span>Page 1 of 1</span>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    toast.success('Print / PDF view opened', {
      description: `Save as PDF or print "${report.label}".`,
    });
  };

  // 3. Open interactive View preview modal
  const handleView = (report: { id: string; label: string; desc: string }) => {
    const dataset = getReportDataset(report.id, isPropertyAccessible);
    setSearchQuery('');
    setPreviewReport({
      id: report.id,
      label: report.label,
      desc: report.desc,
      rows: dataset.rows,
    });
  };

  // Filter preview rows by search
  const filteredPreviewRows = useMemo(() => {
    if (!previewReport) return [];
    if (!searchQuery.trim()) return previewReport.rows;
    const q = searchQuery.toLowerCase().trim();
    return previewReport.rows.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(q))
    );
  }, [previewReport, searchQuery]);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <div
        className="rounded-2xl border border-border p-6 shadow-xl"
        style={{ background: '#11141a' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-head font-bold text-base text-foreground">
              Export & View Reports
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Preview real-time report tables or export directly in Excel (.xlsx) and PDF format
            </div>
          </div>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(232,201,122,0.12)', color: 'var(--primary)' }}
          >
            {items.length} Reports Ready
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {items.map((report) => {
            const IconComponent = report.icon;
            return (
              <div
                key={report.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-border transition-all hover:border-border-strong"
                style={{ background: 'var(--surface2)' }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(232,201,122,0.12)',
                    border: '1px solid rgba(232,201,122,0.2)',
                  }}
                >
                  <IconComponent size={20} style={{ color: 'var(--primary)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                    {report.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{report.desc}</div>
                </div>

                {/* 3 Action Buttons: View, Excel, PDF */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleView(report)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer hover:bg-white/10 active:scale-95"
                    style={{
                      background: 'var(--surface3)',
                      color: 'var(--foreground)',
                      borderColor: 'var(--border-strong)',
                    }}
                    title={`View ${report.label} data table`}
                  >
                    <Eye size={13} style={{ color: 'var(--primary)' }} /> View
                  </button>
                  <button
                    onClick={() => handleExportExcel(report)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer hover:bg-emerald-500/20 active:scale-95"
                    style={{
                      background: 'rgba(52,211,153,0.12)',
                      color: '#34d399',
                      borderColor: 'rgba(52,211,153,0.3)',
                    }}
                    title="Export as Excel spreadsheet (.xlsx)"
                  >
                    <Download size={13} /> Excel
                  </button>
                  <button
                    onClick={() => handleExportPDF(report)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer hover:opacity-90 active:scale-95 font-medium"
                    style={{ background: 'var(--primary)', color: '#0a0c10' }}
                    title="Print or save as PDF"
                  >
                    <Download size={13} /> PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Interactive View Modal ─────────────────────────────────────────── */}
      {previewReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 samko-modal-overlay"
          onClick={() => setPreviewReport(null)}
        >
          <div
            className="rounded-2xl border border-border-strong w-full max-w-5xl max-h-[88vh] overflow-hidden flex flex-col shadow-2xl samko-modal-card"
            style={{ background: '#11141a', borderColor: 'var(--border-strong)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between p-5 border-b border-border"
              style={{ background: 'var(--surface2)' }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}
                  >
                    Report Preview
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · {previewReport.rows.length} Total Records
                  </span>
                </div>
                <h2 className="font-head font-bold text-lg text-foreground">
                  {previewReport.label}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{previewReport.desc}</p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleExportExcel(previewReport)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer hover:bg-emerald-500/20"
                  style={{
                    background: 'rgba(52,211,153,0.12)',
                    color: '#34d399',
                    borderColor: 'rgba(52,211,153,0.3)',
                  }}
                >
                  <Download size={13} /> Export Excel (.xlsx)
                </button>
                <button
                  onClick={() => handleExportPDF(previewReport)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer hover:opacity-90 active:scale-95"
                  style={{ background: 'var(--primary)', color: '#0a0c10' }}
                >
                  <Printer size={13} /> Print / Save PDF
                </button>
                <button
                  onClick={() => setPreviewReport(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors ml-1 text-lg font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Filter Search Bar */}
            <div
              className="p-3 border-b border-border flex items-center justify-between gap-3 px-6"
              style={{ background: 'var(--surface)' }}
            >
              <div
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 flex-1 max-w-sm"
                style={{ background: 'var(--surface2)' }}
              >
                <Search size={14} className="text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter report rows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-foreground outline-none w-full placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                Showing {filteredPreviewRows.length} of {previewReport.rows.length} rows
              </span>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto p-6" style={{ background: '#11141a' }}>
              {filteredPreviewRows.length > 0 ? (
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-left border-collapse" style={{ minWidth: 700 }}>
                    <thead style={{ background: 'var(--surface2)' }}>
                      <tr>
                        {Object.keys(previewReport.rows[0]).map((col) => (
                          <th
                            key={col}
                            className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap border-b border-border"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPreviewRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-border/60 transition-colors"
                          style={{
                            background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = 'var(--surface2)')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background =
                              idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)')
                          }
                        >
                          {Object.keys(previewReport.rows[0]).map((col) => {
                            const val = row[col];
                            const isStatus = col.toLowerCase().includes('status');
                            const isOverdue = String(val).toUpperCase().includes('OVERDUE');
                            const isCompleted =
                              String(val).toUpperCase().includes('COMPLETED') ||
                              String(val).toUpperCase().includes('PASS');

                            return (
                              <td
                                key={col}
                                className="px-4 py-2.5 text-xs whitespace-nowrap text-foreground font-medium"
                              >
                                {isStatus ? (
                                  <span
                                    className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                    style={{
                                      background: isOverdue
                                        ? 'rgba(244,63,94,0.15)'
                                        : isCompleted
                                          ? 'rgba(61,214,140,0.15)'
                                          : 'rgba(96,165,250,0.15)',
                                      color: isOverdue
                                        ? '#f43f5e'
                                        : isCompleted
                                          ? '#3dd68c'
                                          : '#60a5fa',
                                    }}
                                  >
                                    {val}
                                  </span>
                                ) : (
                                  (val ?? '—')
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  No records match your filter criteria.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className="flex items-center justify-between p-4 px-6 border-t border-border"
              style={{ background: 'var(--surface2)' }}
            >
              <span className="text-xs text-muted-foreground font-mono">
                SamkoCentral UK · Portfolio Data Analytics
              </span>
              <button
                onClick={() => setPreviewReport(null)}
                className="samko-btn-primary px-5 py-2 text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Utilities Report Component ────────────────────────────────────────────────
function UtilitiesReport() {
  const { isPropertyAccessible } = useAuth();
  const [activeSection, setActiveSection] = useState<'overview' | 'charts' | 'export'>('overview');
  const [filterType, setFilterType] = useState<'All' | UtilityType>('All');
  const [filterStatus, setFilterStatus] = useState<'all' | UtilityStatus>('all');

  const accessibleUtilities = useMemo(() => {
    return UTILITIES_DATA.filter((u) => isPropertyAccessible(u.property));
  }, [isPropertyAccessible]);

  const filtered = accessibleUtilities.filter((u) => {
    const typeMatch = filterType === 'All' || u.utilityType === filterType;
    const statusMatch = filterStatus === 'all' || u.status === filterStatus;
    return typeMatch && statusMatch;
  });

  const scopedActiveUtilities = accessibleUtilities.filter((u) => u.status === 'active').length;
  const scopedExpiredUtilities = accessibleUtilities.filter((u) => u.status === 'expired').length;
  const scopedExpiringUtilities = accessibleUtilities.filter(
    (u) => u.status === 'expiring-soon'
  ).length;
  const scopedTotalCost = accessibleUtilities.reduce((sum, u) => sum + (u.annualCost || 0), 0);

  const getStatusColor = (status: UtilityStatus) => {
    if (status === 'active') return '#3dd68c';
    if (status === 'expiring-soon') return '#f59e0b';
    if (status === 'expired') return '#f43f5e';
    return '#94a3b8';
  };

  const getTypeIcon = (type: UtilityType) => {
    if (type === 'Electricity') return { color: '#f59e0b', label: '⚡' };
    if (type === 'Gas') return { color: '#f97316', label: '🔥' };
    return { color: '#60a5fa', label: '💧' };
  };

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div>
          <h1 className="font-head text-xl font-bold">Utilities Report</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Supplier accounts, meter references, contract dates, costs and status across all
            properties
          </p>
        </div>
        <div className="samko-segment-container flex items-center gap-1 p-1 rounded-xl">
          {(['overview', 'charts', 'export'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              data-active={activeSection === s ? 'true' : 'false'}
              className="samko-segment-btn px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-5">
        {activeSection === 'overview' && (
          <div className="flex flex-col gap-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
              <KPICard
                label="Total Accounts"
                value={accessibleUtilities.length}
                sub="Accessible accounts"
                color="#e8c97a"
                icon={Zap}
              />
              <KPICard
                label="Active Contracts"
                value={scopedActiveUtilities}
                sub="Currently in force"
                color="#3dd68c"
                icon={Zap}
              />
              <KPICard
                label="Expired / Expiring"
                value={scopedExpiredUtilities + scopedExpiringUtilities}
                sub="Require renewal action"
                color="#f43f5e"
                icon={Zap}
              />
              <KPICard
                label="Annual Cost"
                value={scopedTotalCost > 0 ? `£${(scopedTotalCost / 1000).toFixed(0)}k` : '£0'}
                sub="Recorded annual spend"
                color="#60a5fa"
                icon={TrendingUp}
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground">Filter by type:</span>
              {(['All', 'Electricity', 'Gas', 'Water'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                  style={{
                    background: filterType === t ? 'rgba(232,201,122,0.12)' : 'var(--surface2)',
                    color: filterType === t ? 'var(--primary)' : 'var(--text2)',
                    borderColor: filterType === t ? 'var(--primary)' : 'var(--border)',
                  }}
                >
                  {t}
                </button>
              ))}
              <span className="text-xs font-semibold text-muted-foreground ml-4">Status:</span>
              {(['all', 'active', 'expiring-soon', 'expired', 'incomplete'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors capitalize"
                  style={{
                    background: filterStatus === s ? 'rgba(232,201,122,0.12)' : 'var(--surface2)',
                    color: filterStatus === s ? 'var(--primary)' : 'var(--text2)',
                    borderColor: filterStatus === s ? 'var(--primary)' : 'var(--border)',
                  }}
                >
                  {s.replace('-', ' ')}
                </button>
              ))}
            </div>

            {/* Summary by Property */}
            <div
              className="rounded-xl border border-border overflow-hidden"
              style={{ background: 'var(--surface)' }}
            >
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <Building2 size={15} style={{ color: 'var(--primary)' }} />
                <span className="font-head font-bold text-sm">Utility Summary by Property</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead style={{ background: 'var(--surface2)' }}>
                    <tr>
                      {['Property', 'Electricity', 'Gas', 'Water', 'Annual Cost', 'Accounts'].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {utilitiesByProperty.map((row, idx) => (
                      <tr
                        key={row.fullName || `${row.name}-${idx}`}
                        className="border-b border-border"
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td className="px-4 py-3 font-medium text-sm">{row.fullName}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: '#f59e0b' }}>
                          {row.electricity > 0 ? `${row.electricity} acct` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: '#f97316' }}>
                          {row.gas > 0 ? `${row.gas} acct` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: '#60a5fa' }}>
                          {row.water > 0 ? `${row.water} acct` : '—'}
                        </td>
                        <td
                          className="px-4 py-3 text-sm font-semibold"
                          style={{ color: 'var(--primary)' }}
                        >
                          {row.annualCost > 0 ? `£${row.annualCost.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-3 font-bold text-sm">
                          {row.electricity + row.gas + row.water}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Full Utilities Register */}
            <div
              className="rounded-xl border border-border overflow-hidden"
              style={{ background: 'var(--surface)' }}
            >
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={15} style={{ color: 'var(--primary)' }} />
                  <span className="font-head font-bold text-sm">
                    Utilities Register — {filtered.length} accounts
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead style={{ background: 'var(--surface2)' }}>
                    <tr>
                      {[
                        'Property',
                        'Type',
                        'Supplier',
                        'Account No.',
                        'Meter Reference',
                        'Contract End',
                        'Annual Cost',
                        'Tariff Rate',
                        'Status',
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => {
                      const statusColor = getStatusColor(u.status);
                      const typeInfo = getTypeIcon(u.utilityType);
                      return (
                        <tr
                          key={u.id}
                          className="border-b border-border"
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = 'var(--surface2)')
                          }
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="px-4 py-3 font-medium text-sm whitespace-nowrap">
                            {u.property}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: `${typeInfo.color}18`, color: typeInfo.color }}
                            >
                              {u.utilityType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">{u.supplier}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                            {u.accountNumber}
                          </td>
                          <td
                            className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate"
                            title={u.meterReference}
                          >
                            {u.meterReference}
                          </td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">
                            {u.contractEnd || '—'}
                          </td>
                          <td
                            className="px-4 py-3 text-sm font-semibold whitespace-nowrap"
                            style={{ color: 'var(--primary)' }}
                          >
                            {u.annualCost > 0
                              ? `£${u.annualCost.toLocaleString()}`
                              : u.monthlyCost > 0
                                ? `£${u.monthlyCost.toLocaleString()}/mo`
                                : '—'}
                          </td>
                          <td
                            className="px-4 py-3 text-xs text-muted-foreground max-w-[140px] truncate"
                            title={u.tariffRate}
                          >
                            {u.tariffRate}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize whitespace-nowrap"
                              style={{ background: `${statusColor}18`, color: statusColor }}
                            >
                              {(u.status || 'Active').replace('-', ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Flags */}
            {UTILITIES_DATA.filter((u) => u.flags && u.flags.length > 0).length > 0 && (
              <div
                className="rounded-xl border border-border overflow-hidden"
                style={{ background: 'var(--surface)' }}
              >
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <TrendingUp size={15} style={{ color: '#f43f5e' }} />
                  <span className="font-head font-bold text-sm">Action Flags</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'rgba(244,63,94,0.12)', color: '#f43f5e' }}
                  >
                    {UTILITIES_DATA.filter((u) => u.flags && u.flags.length > 0).length} accounts
                  </span>
                </div>
                <div className="p-5 flex flex-col gap-3">
                  {UTILITIES_DATA.filter((u) => u.flags && u.flags.length > 0).map((u) => (
                    <div
                      key={u.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border"
                      style={{ background: 'var(--surface2)' }}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: `${getTypeIcon(u.utilityType).color}18`,
                            color: getTypeIcon(u.utilityType).color,
                          }}
                        >
                          {u.utilityType}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {u.property} — {u.supplier}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {u.flags!.map((flag, fi) => (
                            <span
                              key={fi}
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}
                            >
                              ⚠ {flag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'charts' && (
          <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div
              className="rounded-xl border border-border p-5"
              style={{ background: 'var(--surface)' }}
            >
              <div className="font-head font-bold text-sm mb-4">Accounts by Utility Type</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={utilitiesByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {utilitiesByType.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div
              className="rounded-xl border border-border p-5"
              style={{ background: 'var(--surface)' }}
            >
              <div className="font-head font-bold text-sm mb-4">Contract Status Breakdown</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={utilitiesByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {utilitiesByStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div
              className="rounded-xl border border-border p-5 col-span-2"
              style={{ background: 'var(--surface)' }}
            >
              <div className="font-head font-bold text-sm mb-4">Utility Accounts by Property</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={utilitiesByProperty}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="electricity" name="Electricity" fill="#f59e0b" stackId="a" />
                  <Bar dataKey="gas" name="Gas" fill="#f97316" stackId="a" />
                  <Bar
                    dataKey="water"
                    name="Water"
                    fill="#60a5fa"
                    stackId="a"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div
              className="rounded-xl border border-border p-5 col-span-2"
              style={{ background: 'var(--surface)' }}
            >
              <div className="font-head font-bold text-sm mb-4">
                Annual Cost by Property (Recorded)
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={utilitiesByProperty.filter((p) => p.annualCost > 0)}
                  margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--text2)' }}
                    tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    {...CHART_TOOLTIP_STYLE}
                    formatter={(v: number) => [`£${v.toLocaleString()}`, 'Annual Cost']}
                  />
                  <Bar
                    dataKey="annualCost"
                    name="Annual Cost"
                    fill="#e8c97a"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeSection === 'export' && <ExportSection items={UTILITIES_EXPORT} />}
      </div>
    </div>
  );
}

// ── Asset Report (original) ───────────────────────────────────────────────────
function AssetReport() {
  const { isPropertyAccessible } = useAuth();
  const cms = useDeepPageCms('reports');
  const [activeSection, setActiveSection] = useState<'overview' | 'charts' | 'export'>('overview');
  const [assets, setAssets] = useState<any[]>(ASSETS);
  const [properties, setProperties] = useState<any[]>(() => getLiveProperties());
  const [maintenance, setMaintenance] = useState<any[]>(MAINTENANCE_RECORDS);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const [aRes, pRes, mRes] = await Promise.allSettled([
          api.assets.getAll(),
          api.properties.getAll(),
          api.maintenance.getAll(),
        ]);
        if (aRes.status === 'fulfilled' && aRes.value.success && aRes.value.data?.length > 0)
          setAssets(aRes.value.data);
        if (pRes.status === 'fulfilled' && pRes.value.success && pRes.value.data?.length > 0)
          setProperties(pRes.value.data);
        if (mRes.status === 'fulfilled' && mRes.value.success && mRes.value.data?.length > 0)
          setMaintenance(mRes.value.data);
      } catch (e) {
        console.warn('Asset report live fetch fallback:', e);
      }
    };
    fetchLive();
    window.addEventListener('samko:data-changed', fetchLive);
    return () => window.removeEventListener('samko:data-changed', fetchLive);
  }, []);

  const accessibleAssets = useMemo(() => {
    return assets.filter((a) => isPropertyAccessible(a.hotelName || a.hotelId || a.property));
  }, [assets, isPropertyAccessible]);

  const accessibleProperties = useMemo(() => {
    return properties.filter((p) => isPropertyAccessible(p.name || p.id));
  }, [properties, isPropertyAccessible]);

  const accessibleMaintenance = useMemo(() => {
    return maintenance.filter((m) => isPropertyAccessible(m.hotelName || m.hotelId || m.property));
  }, [maintenance, isPropertyAccessible]);

  const total = accessibleAssets.length;
  const fixed = accessibleAssets.filter((a) => a.isFixed).length;
  const overdueMaintenance = accessibleMaintenance.filter((m) => m.status === 'overdue').length;
  const completedMaintenance = accessibleMaintenance.filter((m) => m.status === 'completed').length;
  const maintenanceCompletion =
    accessibleMaintenance.length > 0
      ? Math.round((completedMaintenance / accessibleMaintenance.length) * 100)
      : 100;

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div>
          <h1 className="font-head text-xl font-bold">{cms.title || 'Asset Reports'}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cms.subtitle || 'Asset management insights and exports'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PageCMSEditButton pageId="reports" pageName="Reports & Analytics" />

          {(['overview', 'charts', 'export'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors"
              style={{
                background: activeSection === s ? 'rgba(232,201,122,0.12)' : 'var(--surface2)',
                color: activeSection === s ? 'var(--primary)' : 'var(--text2)',
                border: `1px solid ${activeSection === s ? 'var(--primary)' : 'var(--border)'}`,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 py-5">
        {activeSection === 'overview' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-4 gap-4">
              <KPICard
                label="Total Assets"
                value={total}
                sub="Accessible properties"
                color="#e8c97a"
                icon={Package}
              />
              <KPICard
                label="Fixed Assets"
                value={fixed}
                sub={`${Math.round((fixed / (total || 1)) * 100)}% of total`}
                color="#60a5fa"
                icon={Package}
              />
              <KPICard
                label="Overdue Maintenance"
                value={overdueMaintenance}
                sub="Require immediate action"
                color="#f43f5e"
                icon={Wrench}
              />
              <KPICard
                label="Maintenance Complete"
                value={`${maintenanceCompletion}%`}
                sub="Completion rate"
                color="#3dd68c"
                icon={ClipboardCheck}
              />
            </div>
            <div
              className="rounded-xl border border-border overflow-hidden"
              style={{ background: 'var(--surface)' }}
            >
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <Building2 size={15} style={{ color: 'var(--primary)' }} />
                <span className="font-head font-bold text-sm">Asset Summary by Property</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead style={{ background: 'var(--surface2)' }}>
                    <tr>
                      {[
                        'Property',
                        'Total Assets',
                        'Fixed',
                        'Non-Fixed',
                        'Overdue Maintenance',
                        'Critical Assets',
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {accessibleProperties.map((property) => {
                      const pName = property.name || '';
                      const pFirst = pName.toLowerCase().split(' ')[0];
                      const propAssets = accessibleAssets.filter(
                        (a) =>
                          a.hotelId === property.id ||
                          a.propertyId === property.id ||
                          a.hotelName?.toLowerCase()?.includes(pFirst) ||
                          a.property?.toLowerCase()?.includes(pFirst)
                      );
                      const propMaint = accessibleMaintenance.filter(
                        (m) =>
                          (m.hotelId === property.id ||
                            m.propertyId === property.id ||
                            m.hotelName?.toLowerCase()?.includes(pFirst) ||
                            m.property?.toLowerCase()?.includes(pFirst)) &&
                          m.status === 'overdue'
                      );
                      const criticalCount = propAssets.filter(
                        (a) => a.riskLevel === 'critical'
                      ).length;
                      return (
                        <tr
                          key={property.id}
                          className="border-b border-border"
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = 'var(--surface2)')
                          }
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-sm">{property.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {property.city || 'UK'}
                            </div>
                          </td>
                          <td
                            className="px-4 py-3 font-head font-bold text-sm"
                            style={{ color: 'var(--primary)' }}
                          >
                            {propAssets.length}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {propAssets.filter((a) => a.isFixed).length}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {propAssets.filter((a) => !a.isFixed).length}
                          </td>
                          <td className="px-4 py-3">
                            {propMaint.length > 0 ? (
                              <span
                                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(244,63,94,0.12)', color: '#f43f5e' }}
                              >
                                {propMaint.length} overdue
                              </span>
                            ) : (
                              <span
                                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(61,214,140,0.12)', color: '#3dd68c' }}
                              >
                                None
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {criticalCount > 0 ? (
                              <span className="text-xs font-semibold" style={{ color: '#f43f5e' }}>
                                {criticalCount}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div
              className="rounded-xl border border-border overflow-hidden"
              style={{ background: 'var(--surface)' }}
            >
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <BarChart3 size={15} style={{ color: 'var(--primary)' }} />
                <span className="font-head font-bold text-sm">Assets by Category</span>
              </div>
              <div className="p-5 grid gap-2">
                {byCategoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div className="w-28 text-xs text-muted-foreground truncate">
                      {cat.fullName}
                    </div>
                    <div
                      className="flex-1 h-2 rounded-full overflow-hidden"
                      style={{ background: 'var(--surface3)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(cat.value / stats.total) * 100}%`,
                          background: cat.color,
                        }}
                      />
                    </div>
                    <div className="w-8 text-xs text-right font-semibold">{cat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeSection === 'charts' && (
          <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div
              className="rounded-xl border border-border p-5"
              style={{ background: 'var(--surface)' }}
            >
              <div className="font-head font-bold text-sm mb-4">Assets by Hotel</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byHotelData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Bar
                    dataKey="fixed"
                    name="Fixed"
                    fill="#60a5fa"
                    radius={[3, 3, 0, 0]}
                    stackId="a"
                  />
                  <Bar
                    dataKey="nonFixed"
                    name="Non-Fixed"
                    fill="#e8c97a"
                    radius={[3, 3, 0, 0]}
                    stackId="a"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div
              className="rounded-xl border border-border p-5"
              style={{ background: 'var(--surface)' }}
            >
              <div className="font-head font-bold text-sm mb-4">Asset Condition</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={byConditionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {byConditionData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div
              className="rounded-xl border border-border p-5"
              style={{ background: 'var(--surface)' }}
            >
              <div className="font-head font-bold text-sm mb-4">Risk Level Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={byRiskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {byRiskData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div
              className="rounded-xl border border-border p-5"
              style={{ background: 'var(--surface)' }}
            >
              <div className="font-head font-bold text-sm mb-4">Maintenance Status</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={maintenanceStatusData}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="value" name="Records" radius={[4, 4, 0, 0]}>
                    {maintenanceStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div
              className="rounded-xl border border-border p-5 col-span-2"
              style={{ background: 'var(--surface)' }}
            >
              <div className="font-head font-bold text-sm mb-4">Assets by Department (Top 8)</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topDeptData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="value" name="Assets" fill="#e8c97a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {activeSection === 'export' && <ExportSection items={REPORT_TYPES_EXPORT} />}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ReportsClient() {
  const searchParams = useSearchParams();
  const [reportType, setReportType] = useState<string>('asset');

  useEffect(() => {
    const type = searchParams?.get('type') || 'asset';
    setReportType(type);
  }, [searchParams]);

  if (reportType === 'maintenance') return <MaintenanceReport />;
  if (reportType === 'insurance') return <InsuranceReport />;
  if (reportType === 'contracts') return <ContractReport />;
  if (reportType === 'compliance') return <ComplianceReport />;
  if (reportType === 'utilities') return <UtilitiesReport />;
  return <AssetReport />;
}
