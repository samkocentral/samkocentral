'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Download, BarChart3, Package, Wrench, ClipboardCheck, TrendingUp, Building2, Shield, ScrollText, FileCheck, Zap } from 'lucide-react';
import { ASSETS, HOTELS, ASSET_CATEGORIES, MAINTENANCE_RECORDS, DEPARTMENTS, getAssetStats } from '@/lib/assetData';
import Icon from '@/components/ui/AppIcon';


const stats = getAssetStats();

// ── Shared helpers ────────────────────────────────────────────────────────────
const CHART_TOOLTIP_STYLE = {
  contentStyle: { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: 'var(--foreground)', fontWeight: 600 },
  itemStyle: { color: 'var(--text2)' },
};

function KPICard({ label, value, sub, color, icon: Icon }: { label: string; value: string | number; sub: string; color: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-border p-4 relative overflow-hidden" style={{ background: 'var(--surface)' }}>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <div className="font-head text-2xl font-extrabold" style={{ color }}>{value}</div>
      <div className="text-xs font-semibold mt-0.5">{label}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
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
})).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);

const byConditionData = [
  { name: 'Excellent', value: ASSETS.filter((a) => a.condition === 'excellent').length, color: '#3dd68c' },
  { name: 'Good', value: ASSETS.filter((a) => a.condition === 'good').length, color: '#60a5fa' },
  { name: 'Fair', value: ASSETS.filter((a) => a.condition === 'fair').length, color: '#f59e0b' },
  { name: 'Poor', value: ASSETS.filter((a) => a.condition === 'poor').length, color: '#f97316' },
  { name: 'Critical', value: ASSETS.filter((a) => a.condition === 'critical').length, color: '#f43f5e' },
].filter((d) => d.value > 0);

const byRiskData = [
  { name: 'Low', value: ASSETS.filter((a) => a.riskLevel === 'low').length, color: '#3dd68c' },
  { name: 'Medium', value: ASSETS.filter((a) => a.riskLevel === 'medium').length, color: '#f59e0b' },
  { name: 'High', value: ASSETS.filter((a) => a.riskLevel === 'high').length, color: '#f97316' },
  { name: 'Critical', value: ASSETS.filter((a) => a.riskLevel === 'critical').length, color: '#f43f5e' },
].filter((d) => d.value > 0);

const maintenanceStatusData = [
  { name: 'Scheduled', value: MAINTENANCE_RECORDS.filter((m) => m.status === 'scheduled').length, color: '#60a5fa' },
  { name: 'Due Today', value: MAINTENANCE_RECORDS.filter((m) => m.status === 'due-today').length, color: '#f59e0b' },
  { name: 'Overdue', value: MAINTENANCE_RECORDS.filter((m) => m.status === 'overdue').length, color: '#f43f5e' },
  { name: 'Completed', value: MAINTENANCE_RECORDS.filter((m) => m.status === 'completed').length, color: '#3dd68c' },
];

const topDeptData = DEPARTMENTS.map((d) => ({
  name: d,
  value: ASSETS.filter((a) => a.department === d).length,
})).filter((d) => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 8);

// ── Maintenance Report ────────────────────────────────────────────────────────
const MAINTENANCE_BY_HOTEL = HOTELS.map((h) => ({
  name: h.name.split(' ').slice(0, 2).join(' '),
  fullName: h.name,
  scheduled: MAINTENANCE_RECORDS.filter((m) => m.hotelId === h.id && m.status === 'scheduled').length,
  dueToday: MAINTENANCE_RECORDS.filter((m) => m.hotelId === h.id && m.status === 'due-today').length,
  overdue: MAINTENANCE_RECORDS.filter((m) => m.hotelId === h.id && m.status === 'overdue').length,
  completed: MAINTENANCE_RECORDS.filter((m) => m.hotelId === h.id && m.status === 'completed').length,
}));

const MAINTENANCE_BY_TYPE = [
  { name: 'Monthly', value: MAINTENANCE_RECORDS.filter((m) => m.frequency === 'monthly').length, color: '#60a5fa' },
  { name: 'Quarterly', value: MAINTENANCE_RECORDS.filter((m) => m.frequency === 'quarterly').length, color: '#a78bfa' },
  { name: '6-Monthly', value: MAINTENANCE_RECORDS.filter((m) => m.frequency === '6-monthly').length, color: '#f59e0b' },
  { name: 'Yearly', value: MAINTENANCE_RECORDS.filter((m) => m.frequency === 'yearly').length, color: '#3dd68c' },
].filter((d) => d.value > 0);

// ── Insurance Report Data (mock) ──────────────────────────────────────────────
const INSURANCE_HOTELS = ['Crowne Plaza Kingston-south', 'Stanhill Court', 'Hampton 1 & 2', 'Ravents Ait Island', 'River Club'];

const INSURANCE_POLICIES = [
  { hotel: 'Crowne Plaza Kingston-south', type: 'Building Insurance', company: 'Aviva Commercial', premium: 42000, coverage: 15000000, status: 'active', expiry: '2026-01-01' },
  { hotel: 'Crowne Plaza Kingston-south', type: 'Public Liability', company: 'AXA Commercial', premium: 18500, coverage: 10000000, status: 'active', expiry: '2026-01-01' },
  { hotel: 'Stanhill Court', type: 'Employers Liability', company: 'Zurich Insurance', premium: 12000, coverage: 10000000, status: 'active', expiry: '2026-02-01' },
  { hotel: 'Hampton 1 & 2', type: 'Equipment Breakdown', company: 'RSA Group', premium: 8400, coverage: 2000000, status: 'expiring-soon', expiry: '2025-08-01' },
  { hotel: 'Ravents Ait Island', type: 'Business Interruption', company: 'Lloyd\'s of London', premium: 22000, coverage: 5000000, status: 'active', expiry: '2026-03-01' },
  { hotel: 'River Club', type: 'Cyber Insurance', company: 'Hiscox', premium: 6500, coverage: 1000000, status: 'expiring-soon', expiry: '2025-09-15' },
  { hotel: 'Crowne Plaza Kingston-south', type: 'Engineering Insurance', company: 'Allianz', premium: 15000, coverage: 8000000, status: 'active', expiry: '2026-01-01' },
  { hotel: 'Stanhill Court', type: 'Contents Insurance', company: 'Aviva Commercial', premium: 9800, coverage: 3000000, status: 'active', expiry: '2026-02-01' },
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
  { name: 'Building', value: INSURANCE_POLICIES.filter((p) => p.type === 'Building Insurance').length, color: '#60a5fa' },
  { name: 'Liability', value: INSURANCE_POLICIES.filter((p) => p.type.includes('Liability')).length, color: '#a78bfa' },
  { name: 'Equipment', value: INSURANCE_POLICIES.filter((p) => p.type === 'Equipment Breakdown').length, color: '#f59e0b' },
  { name: 'Business', value: INSURANCE_POLICIES.filter((p) => p.type === 'Business Interruption').length, color: '#3dd68c' },
  { name: 'Cyber', value: INSURANCE_POLICIES.filter((p) => p.type === 'Cyber Insurance').length, color: '#f43f5e' },
  { name: 'Other', value: INSURANCE_POLICIES.filter((p) => !['Building Insurance', 'Business Interruption', 'Cyber Insurance', 'Equipment Breakdown'].includes(p.type) && !p.type.includes('Liability')).length, color: '#e8c97a' },
].filter((d) => d.value > 0);

// ── Contract Report Data (mock) ───────────────────────────────────────────────
const CONTRACT_DATA = [
  { hotel: 'Crowne Plaza Kingston-south', supplier: 'FireGuard Systems', category: 'Fire Alarm Maintenance', value: 12500, status: 'expiring-soon', endDate: '2026-07-15' },
  { hotel: 'Crowne Plaza Kingston-south', supplier: 'CleanSafe Services Ltd', category: 'Cleaning', value: 48000, status: 'active', endDate: '2027-03-31' },
  { hotel: 'All Hotels', supplier: 'Apex Electrical', category: 'Electrical', value: 32000, status: 'active', endDate: '2027-12-31' },
  { hotel: 'Stanhill Court', supplier: 'City Gas Engineers', category: 'Plumbing', value: 6200, status: 'expired', endDate: '2025-06-10' },
  { hotel: 'Hampton 1 & 2', supplier: 'LiftTech UK', category: 'Lift Maintenance', value: 18000, status: 'active', endDate: '2027-06-30' },
  { hotel: 'Ravents Ait Island', supplier: 'PestAway Pro', category: 'Pest Control', value: 4800, status: 'active', endDate: '2026-12-31' },
  { hotel: 'River Club', supplier: 'SecureNet Ltd', category: 'Security', value: 36000, status: 'active', endDate: '2027-01-31' },
  { hotel: 'All Hotels', supplier: 'WasteWise UK', category: 'Waste Collection', value: 14400, status: 'expiring-soon', endDate: '2025-09-30' },
];

const totalContractValue = CONTRACT_DATA.reduce((s, c) => s + c.value, 0);
const activeContracts = CONTRACT_DATA.filter((c) => c.status === 'active').length;
const expiringContracts = CONTRACT_DATA.filter((c) => c.status === 'expiring-soon').length;
const expiredContracts = CONTRACT_DATA.filter((c) => c.status === 'expired').length;

const contractsByCategory = [
  { name: 'Cleaning', value: CONTRACT_DATA.filter((c) => c.category === 'Cleaning').length, color: '#60a5fa' },
  { name: 'Electrical', value: CONTRACT_DATA.filter((c) => c.category === 'Electrical').length, color: '#a78bfa' },
  { name: 'Security', value: CONTRACT_DATA.filter((c) => c.category === 'Security').length, color: '#f59e0b' },
  { name: 'Maintenance', value: CONTRACT_DATA.filter((c) => ['Fire Alarm Maintenance', 'Lift Maintenance', 'Plumbing'].includes(c.category)).length, color: '#3dd68c' },
  { name: 'Other', value: CONTRACT_DATA.filter((c) => !['Cleaning', 'Electrical', 'Security', 'Fire Alarm Maintenance', 'Lift Maintenance', 'Plumbing'].includes(c.category)).length, color: '#e8c97a' },
].filter((d) => d.value > 0);

const contractsByHotel = INSURANCE_HOTELS.map((h) => ({
  name: h.split(' ').slice(0, 2).join(' '),
  fullName: h,
  contracts: CONTRACT_DATA.filter((c) => c.hotel === h || c.hotel === 'All Hotels').length,
  value: CONTRACT_DATA.filter((c) => c.hotel === h || c.hotel === 'All Hotels').reduce((s, c) => s + c.value, 0),
}));

// ── Compliance Report Data (mock) ─────────────────────────────────────────────
const COMPLIANCE_DATA = [
  { hotel: 'Crowne Plaza Kingston-south', category: 'Fire Risk Assessment', status: 'overdue', risk: 'critical', expiry: '2025-06-01' },
  { hotel: 'Crowne Plaza Kingston-south', category: 'Fire Alarm Certificate', status: 'compliant', risk: 'high', expiry: '2026-03-01' },
  { hotel: 'Stanhill Court', category: 'Gas Safety', status: 'expiring-soon', risk: 'high', expiry: '2025-08-15' },
  { hotel: 'Hampton 1 & 2', category: 'Legionella', status: 'compliant', risk: 'medium', expiry: '2026-01-01' },
  { hotel: 'Ravents Ait Island', category: 'PAT Testing', status: 'compliant', risk: 'low', expiry: '2026-04-01' },
  { hotel: 'River Club', category: 'Lift Inspection', status: 'expiring-soon', risk: 'high', expiry: '2025-09-01' },
  { hotel: 'Crowne Plaza Kingston-south', category: 'HVAC Certification', status: 'compliant', risk: 'medium', expiry: '2026-02-01' },
  { hotel: 'Stanhill Court', category: 'Asbestos Survey', status: 'overdue', risk: 'critical', expiry: '2025-05-01' },
  { hotel: 'Hampton 1 & 2', category: 'Fixed Wire Testing', status: 'compliant', risk: 'medium', expiry: '2026-06-01' },
  { hotel: 'Ravents Ait Island', category: 'Food Hygiene', status: 'compliant', risk: 'high', expiry: '2026-01-15' },
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
  { name: 'Medium', value: COMPLIANCE_DATA.filter((c) => c.risk === 'medium').length, color: '#f59e0b' },
  { name: 'High', value: COMPLIANCE_DATA.filter((c) => c.risk === 'high').length, color: '#f97316' },
  { name: 'Critical', value: COMPLIANCE_DATA.filter((c) => c.risk === 'critical').length, color: '#f43f5e' },
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
  { id: 'asset-register', label: 'Asset Register', icon: Package, desc: 'Full list of all assets across all hotels' },
  { id: 'maintenance', label: 'Maintenance Report', icon: Wrench, desc: 'Scheduled, overdue and completed maintenance' },
  { id: 'inspection', label: 'Inspection Report', icon: ClipboardCheck, desc: 'Inspection history and results' },
  { id: 'condition', label: 'Asset Condition Report', icon: TrendingUp, desc: 'Condition assessment across all assets' },
  { id: 'department', label: 'Department Report', icon: Building2, desc: 'Asset breakdown by department' },
  { id: 'hotel', label: 'Hotel Report', icon: Building2, desc: 'Per-hotel asset summary and compliance' },
];

const MAINTENANCE_EXPORT = [
  { id: 'maint-schedule', label: 'Maintenance Schedule', icon: Wrench, desc: 'All scheduled maintenance tasks by hotel' },
  { id: 'maint-overdue', label: 'Overdue Maintenance', icon: Wrench, desc: 'All overdue maintenance requiring action' },
  { id: 'maint-completed', label: 'Completed Maintenance', icon: ClipboardCheck, desc: 'History of completed maintenance records' },
  { id: 'maint-frequency', label: 'Frequency Analysis', icon: TrendingUp, desc: 'Maintenance frequency breakdown by asset type' },
];

const INSURANCE_EXPORT = [
  { id: 'ins-all', label: 'All Policies', icon: Shield, desc: 'Complete insurance policy register' },
  { id: 'ins-expiring', label: 'Expiring Policies', icon: Shield, desc: 'Policies expiring within 90 days' },
  { id: 'ins-claims', label: 'Claims History', icon: FileCheck, desc: 'All insurance claims and settlements' },
  { id: 'ins-premium', label: 'Premium Summary', icon: TrendingUp, desc: 'Annual premium breakdown by hotel and type' },
];

const CONTRACT_EXPORT = [
  { id: 'con-all', label: 'All Contracts', icon: ScrollText, desc: 'Complete contracts register' },
  { id: 'con-expiring', label: 'Expiring Contracts', icon: ScrollText, desc: 'Contracts expiring within 90 days' },
  { id: 'con-value', label: 'Contract Value Report', icon: TrendingUp, desc: 'Annual contract value by supplier and hotel' },
  { id: 'con-suppliers', label: 'Supplier Directory', icon: Building2, desc: 'All suppliers with contact details' },
];

const COMPLIANCE_EXPORT = [
  { id: 'comp-register', label: 'Compliance Register', icon: FileCheck, desc: 'Full compliance and certification register' },
  { id: 'comp-overdue', label: 'Overdue Items', icon: FileCheck, desc: 'All overdue compliance items requiring action' },
  { id: 'comp-expiring', label: 'Expiring Certifications', icon: FileCheck, desc: 'Certifications expiring within 60 days' },
  { id: 'comp-risk', label: 'Risk Assessment Report', icon: TrendingUp, desc: 'Compliance items by risk rating' },
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
  { id: 'u-001', property: 'Crowne Plaza Kingston-south', utilityType: 'Electricity', supplier: 'EDF Energy', accountNumber: '3898198541', meterReference: 'MPAN: 1900092859450', contractStart: '2025-11-01', contractEnd: '2026-10-31', annualCost: 0, monthlyCost: 213, tariffRate: '20.0878p/kWh', status: 'expiring-soon', flags: ['Renewal Due Oct 2026'] },
  { id: 'u-002', property: 'Crowne Plaza Kingston-south', utilityType: 'Gas', supplier: 'SEFE Energy', accountNumber: '100091219', meterReference: 'MPRN: 9209299704', contractStart: '2026-03-01', contractEnd: '2028-02-29', annualCost: 13508, monthlyCost: 1126, tariffRate: '3.8431p/kWh', status: 'active' },
  { id: 'u-003', property: 'Crowne Plaza Kingston-south', utilityType: 'Water', supplier: 'Everflow', accountNumber: 'EFW293246-0', meterReference: 'SPID: 3010968825', contractStart: '2023-07-10', contractEnd: '2026-07-09', annualCost: 35240, monthlyCost: 2937, tariffRate: '£2.7346/m³', status: 'expired', flags: ['CONTRACT EXPIRED — Renewal Required'] },
  { id: 'u-004', property: 'Warren House', utilityType: 'Electricity', supplier: 'EDF Energy', accountNumber: '0506000000', meterReference: 'MPAN: 1200010214798', contractStart: '2026-05-01', contractEnd: '2027-04-30', annualCost: 100198, monthlyCost: 8350, tariffRate: '21.3419p/kWh', status: 'active', flags: ['Portal login email not recorded'] },
  { id: 'u-005', property: 'Warren House', utilityType: 'Gas', supplier: 'SEFE Energy', accountNumber: '100093919', meterReference: 'MPRN: 10473207', contractStart: '2026-05-01', contractEnd: '2028-04-30', annualCost: 30397, monthlyCost: 2533, tariffRate: '3.4765p/kWh', status: 'active' },
  { id: 'u-006', property: 'Warren House', utilityType: 'Water', supplier: 'Everflow', accountNumber: 'EFW232342-0', meterReference: 'SPID: 3010981651', contractStart: '2023-07-10', contractEnd: '2026-10-02', annualCost: 21509, monthlyCost: 954, tariffRate: '£1.7760/m³', status: 'expiring-soon', flags: ['Renewal Due Oct 2026', 'Outstanding Balance £9,007.52'] },
  { id: 'u-007', property: 'Stanhill Court', utilityType: 'Electricity', supplier: 'SSE Energy Solutions', accountNumber: '8701889865', meterReference: 'MPAN: 1900018001128', contractStart: '2026-02-12', contractEnd: '2027-01-31', annualCost: 0, monthlyCost: 0, tariffRate: 'Fixed Green Protect HH', status: 'active' },
  { id: 'u-008', property: 'Stanhill Court', utilityType: 'Gas', supplier: 'Calor Gas', accountNumber: 'N/A', meterReference: 'N/A', contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0, tariffRate: 'LPG/Calor', status: 'incomplete', flags: ['Incomplete — Portal not working'] },
  { id: 'u-009', property: 'Stanhill Court', utilityType: 'Water', supplier: 'Everflow', accountNumber: 'EFW364357-0', meterReference: 'SPID: 3026521701', contractStart: '', contractEnd: '2026-01-27', annualCost: 0, monthlyCost: 0, tariffRate: 'Rate not recorded', status: 'expired', flags: ['CONTRACT EXPIRED — Renewal Required'] },
  { id: 'u-010', property: 'River Club', utilityType: 'Electricity', supplier: 'SSE Energy Solutions', accountNumber: '880000068119', meterReference: 'MPAN: 1900029038809', contractStart: '2025-09-01', contractEnd: '2026-08-31', annualCost: 21082, monthlyCost: 1757, tariffRate: '20.5107p/kWh', status: 'expiring-soon', flags: ['Renewal Due Aug 2026'] },
  { id: 'u-011', property: 'River Club', utilityType: 'Gas', supplier: 'SEFE Energy', accountNumber: '100022228', meterReference: 'MPRN: 9116667904', contractStart: '2027-01-01', contractEnd: '2027-09-30', annualCost: 20329, monthlyCost: 1694, tariffRate: '3.8114p/kWh', status: 'active' },
  { id: 'u-012', property: 'River Club', utilityType: 'Water', supplier: 'Everflow', accountNumber: 'EFW292393-0', meterReference: 'SPID: 3012811532', contractStart: '', contractEnd: '2027-10-06', annualCost: 0, monthlyCost: 1420, tariffRate: 'Wholesale + Retail', status: 'active' },
  { id: 'u-013', property: 'Hampton 1 & 2', utilityType: 'Electricity', supplier: 'ENGIE Power', accountNumber: '10314633', meterReference: 'MPAN: 1900026425412', contractStart: '', contractEnd: '2027-05-31', annualCost: 0, monthlyCost: 2465, tariffRate: '65.2243p/kWh', status: 'active', flags: ['Portal login not yet available'] },
  { id: 'u-014', property: 'Hampton 1 & 2', utilityType: 'Water', supplier: 'Castle Water', accountNumber: '2578329', meterReference: 'Awaiting invoice', contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0, tariffRate: 'Awaiting tariff', status: 'incomplete', flags: ['Outstanding Balance £1,029.50'] },
  { id: 'u-015', property: 'Ravens Ait Island', utilityType: 'Electricity', supplier: 'EDF Energy', accountNumber: 'A-7F0A5110', meterReference: 'MPAN: 1900034424274', contractStart: '', contractEnd: '', annualCost: 36518, monthlyCost: 3480, tariffRate: '45.550p/kWh', status: 'incomplete', flags: ['Variable Tariff — Review for Fixed-Rate'] },
  { id: 'u-016', property: 'Ravens Ait Island', utilityType: 'Water', supplier: 'Castle Water', accountNumber: '2531103', meterReference: 'SPID: 3011855706W14', contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 319, tariffRate: '£2.9534/m³', status: 'incomplete' },
  { id: 'u-017', property: 'Clapham Apartment', utilityType: 'Electricity', supplier: 'Not recorded', accountNumber: 'N/A', meterReference: 'N/A', contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0, tariffRate: 'N/A', status: 'incomplete', flags: ['No Documentation on File'] },
  { id: 'u-018', property: 'Clapham Apartment', utilityType: 'Gas', supplier: 'Not recorded', accountNumber: 'N/A', meterReference: 'N/A', contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0, tariffRate: 'N/A', status: 'incomplete', flags: ['No Documentation on File'] },
  { id: 'u-019', property: 'Clapham Apartment', utilityType: 'Water', supplier: 'Not recorded', accountNumber: 'N/A', meterReference: 'N/A', contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0, tariffRate: 'N/A', status: 'incomplete', flags: ['No Documentation on File'] },
  { id: 'u-020', property: 'Sharnbrook', utilityType: 'Electricity', supplier: 'Not recorded', accountNumber: 'N/A', meterReference: 'N/A', contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0, tariffRate: 'N/A', status: 'incomplete', flags: ['No Documentation on File'] },
  { id: 'u-021', property: 'Sharnbrook', utilityType: 'Gas', supplier: 'Not recorded', accountNumber: 'N/A', meterReference: 'N/A', contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0, tariffRate: 'N/A', status: 'incomplete', flags: ['No Documentation on File'] },
  { id: 'u-022', property: 'Sharnbrook', utilityType: 'Water', supplier: 'Not recorded', accountNumber: 'N/A', meterReference: 'N/A', contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0, tariffRate: 'N/A', status: 'incomplete', flags: ['No Documentation on File'] },
];

const UTILITY_PROPERTIES = [...new Set(UTILITIES_DATA.map((u) => u.property))];

const utilitiesByProperty = UTILITY_PROPERTIES.map((p) => ({
  name: p.split(' ').slice(0, 2).join(' '),
  fullName: p,
  electricity: UTILITIES_DATA.filter((u) => u.property === p && u.utilityType === 'Electricity').length,
  gas: UTILITIES_DATA.filter((u) => u.property === p && u.utilityType === 'Gas').length,
  water: UTILITIES_DATA.filter((u) => u.property === p && u.utilityType === 'Water').length,
  annualCost: UTILITIES_DATA.filter((u) => u.property === p).reduce((s, u) => s + u.annualCost, 0),
}));

const utilitiesByType = [
  { name: 'Electricity', value: UTILITIES_DATA.filter((u) => u.utilityType === 'Electricity').length, color: '#f59e0b' },
  { name: 'Gas', value: UTILITIES_DATA.filter((u) => u.utilityType === 'Gas').length, color: '#f97316' },
  { name: 'Water', value: UTILITIES_DATA.filter((u) => u.utilityType === 'Water').length, color: '#60a5fa' },
];

const utilitiesByStatus = [
  { name: 'Active', value: UTILITIES_DATA.filter((u) => u.status === 'active').length, color: '#3dd68c' },
  { name: 'Expiring Soon', value: UTILITIES_DATA.filter((u) => u.status === 'expiring-soon').length, color: '#f59e0b' },
  { name: 'Expired', value: UTILITIES_DATA.filter((u) => u.status === 'expired').length, color: '#f43f5e' },
  { name: 'Incomplete', value: UTILITIES_DATA.filter((u) => u.status === 'incomplete').length, color: '#94a3b8' },
].filter((d) => d.value > 0);

const totalAnnualUtilityCost = UTILITIES_DATA.reduce((s, u) => s + u.annualCost, 0);
const activeUtilities = UTILITIES_DATA.filter((u) => u.status === 'active').length;
const expiredUtilities = UTILITIES_DATA.filter((u) => u.status === 'expired').length;
const incompleteUtilities = UTILITIES_DATA.filter((u) => u.status === 'incomplete').length;

const UTILITIES_EXPORT = [
  { id: 'util-all', label: 'Full Utilities Register', icon: Zap, desc: 'All utility accounts across all properties' },
  { id: 'util-expiring', label: 'Expiring Contracts', icon: Zap, desc: 'Utility contracts expiring within 90 days' },
  { id: 'util-expired', label: 'Expired Contracts', icon: Zap, desc: 'Utility contracts that have already expired' },
  { id: 'util-cost', label: 'Annual Cost Summary', icon: TrendingUp, desc: 'Annual utility cost breakdown by property and type' },
  { id: 'util-incomplete', label: 'Incomplete Records', icon: Zap, desc: 'Utility accounts with missing documentation' },
];

// ── Sub-report components ─────────────────────────────────────────────────────

function MaintenanceReport() {
  const [activeSection, setActiveSection] = useState<'overview' | 'charts' | 'export'>('overview');
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-7 py-4 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <div>
          <h1 className="font-head text-xl font-bold">Maintenance Reports</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Maintenance schedule, completion and overdue analysis</p>
        </div>
        <div className="flex items-center gap-2">
          {(['overview', 'charts', 'export'] as const).map((s) => (
            <button key={s} onClick={() => setActiveSection(s)} className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors"
              style={{ background: activeSection === s ? 'rgba(232,201,122,0.12)' : 'var(--surface2)', color: activeSection === s ? 'var(--primary)' : 'var(--text2)', border: `1px solid ${activeSection === s ? 'var(--primary)' : 'var(--border)'}` }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-7">
        {activeSection === 'overview' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-4 gap-4">
              <KPICard label="Total Records" value={MAINTENANCE_RECORDS.length} sub="All maintenance tasks" color="#e8c97a" icon={Wrench} />
              <KPICard label="Scheduled" value={MAINTENANCE_RECORDS.filter((m) => m.status === 'scheduled').length} sub="Upcoming tasks" color="#60a5fa" icon={ClipboardCheck} />
              <KPICard label="Overdue" value={MAINTENANCE_RECORDS.filter((m) => m.status === 'overdue').length} sub="Require immediate action" color="#f43f5e" icon={Wrench} />
              <KPICard label="Completed" value={MAINTENANCE_RECORDS.filter((m) => m.status === 'completed').length} sub="Successfully completed" color="#3dd68c" icon={ClipboardCheck} />
            </div>
            <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--surface)' }}>
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <Wrench size={15} style={{ color: 'var(--primary)' }} />
                <span className="font-head font-bold text-sm">Maintenance Summary by Hotel</span>
              </div>
              <table className="w-full">
                <thead style={{ background: 'var(--surface2)' }}>
                  <tr>
                    {['Hotel', 'Scheduled', 'Due Today', 'Overdue', 'Completed', 'Total'].map((h) => (
                      <th key={h} className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MAINTENANCE_BY_HOTEL.map((row) => (
                    <tr key={row.name} className="border-b border-border" onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                      <td className="px-4 py-3 font-medium text-sm">{row.fullName}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#60a5fa' }}>{row.scheduled}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#f59e0b' }}>{row.dueToday}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#f43f5e' }}>{row.overdue}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#3dd68c' }}>{row.completed}</td>
                      <td className="px-4 py-3 font-bold text-sm" style={{ color: 'var(--primary)' }}>{row.scheduled + row.dueToday + row.overdue + row.completed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--surface)' }}>
              <div className="px-5 py-4 border-b border-border"><span className="font-head font-bold text-sm">Recent Maintenance Records</span></div>
              <table className="w-full">
                <thead style={{ background: 'var(--surface2)' }}>
                  <tr>
                    {['Asset', 'Hotel', 'Type', 'Scheduled Date', 'Assigned To', 'Status'].map((h) => (
                      <th key={h} className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MAINTENANCE_RECORDS.slice(0, 10).map((rec) => {
                    const statusColor = rec.status === 'overdue' ? '#f43f5e' : rec.status === 'completed' ? '#3dd68c' : rec.status === 'due-today' ? '#f59e0b' : '#60a5fa';
                    return (
                      <tr key={rec.id} className="border-b border-border" onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <td className="px-4 py-3 font-medium text-sm">{rec.assetName}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{rec.hotelName.split(' ').slice(0, 2).join(' ')}</td>
                        <td className="px-4 py-3 text-xs">{rec.type}</td>
                        <td className="px-4 py-3 text-xs">{rec.scheduledDate}</td>
                        <td className="px-4 py-3 text-xs">{rec.assignedTo}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: `${statusColor}18`, color: statusColor }}>{rec.status.replace('-', ' ')}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeSection === 'charts' && (
          <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-4">Maintenance by Hotel</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={MAINTENANCE_BY_HOTEL} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="scheduled" name="Scheduled" fill="#60a5fa" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="overdue" name="Overdue" fill="#f43f5e" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#3dd68c" stackId="a" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-4">Maintenance Status</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={maintenanceStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {maintenanceStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-border p-5 col-span-2" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-4">Maintenance Frequency Breakdown</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={MAINTENANCE_BY_TYPE} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="value" name="Tasks" radius={[4, 4, 0, 0]}>
                    {MAINTENANCE_BY_TYPE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
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
  const [activeSection, setActiveSection] = useState<'overview' | 'charts' | 'export'>('overview');
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-7 py-4 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <div>
          <h1 className="font-head text-xl font-bold">Insurance Reports</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Policy coverage, premiums and renewal analysis</p>
        </div>
        <div className="flex items-center gap-2">
          {(['overview', 'charts', 'export'] as const).map((s) => (
            <button key={s} onClick={() => setActiveSection(s)} className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors"
              style={{ background: activeSection === s ? 'rgba(232,201,122,0.12)' : 'var(--surface2)', color: activeSection === s ? 'var(--primary)' : 'var(--text2)', border: `1px solid ${activeSection === s ? 'var(--primary)' : 'var(--border)'}` }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-7">
        {activeSection === 'overview' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-4 gap-4">
              <KPICard label="Total Policies" value={INSURANCE_POLICIES.length} sub="Across all hotels" color="#e8c97a" icon={Shield} />
              <KPICard label="Active Policies" value={activePolicies} sub="Currently in force" color="#3dd68c" icon={Shield} />
              <KPICard label="Expiring Soon" value={expiringSoon} sub="Within 90 days" color="#f59e0b" icon={Shield} />
              <KPICard label="Annual Premium" value={`£${(totalPremium / 1000).toFixed(0)}k`} sub="Total annual cost" color="#60a5fa" icon={TrendingUp} />
            </div>
            <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--surface)' }}>
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <Shield size={15} style={{ color: 'var(--primary)' }} />
                <span className="font-head font-bold text-sm">Insurance Policies Register</span>
              </div>
              <table className="w-full">
                <thead style={{ background: 'var(--surface2)' }}>
                  <tr>
                    {['Hotel', 'Insurance Type', 'Company', 'Annual Premium', 'Coverage', 'Expiry', 'Status'].map((h) => (
                      <th key={h} className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INSURANCE_POLICIES.map((pol, i) => {
                    const statusColor = pol.status === 'active' ? '#3dd68c' : pol.status === 'expiring-soon' ? '#f59e0b' : '#f43f5e';
                    return (
                      <tr key={i} className="border-b border-border" onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{pol.hotel.split(' ').slice(0, 2).join(' ')}</td>
                        <td className="px-4 py-3 font-medium text-sm">{pol.type}</td>
                        <td className="px-4 py-3 text-xs">{pol.company}</td>
                        <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--primary)' }}>£{pol.premium.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs">£{(pol.coverage / 1000000).toFixed(0)}M</td>
                        <td className="px-4 py-3 text-xs">{pol.expiry}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: `${statusColor}18`, color: statusColor }}>{pol.status.replace('-', ' ')}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeSection === 'charts' && (
          <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-4">Policies by Hotel</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={insuranceByHotel} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="policies" name="Policies" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-4">Insurance by Type</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={insuranceByType} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {insuranceByType.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-border p-5 col-span-2" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-4">Annual Premium by Hotel</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={insuranceByHotel} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v: number) => [`£${v.toLocaleString()}`, 'Premium']} />
                  <Bar dataKey="premium" name="Annual Premium" fill="#e8c97a" radius={[4, 4, 0, 0]} />
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
  const [activeSection, setActiveSection] = useState<'overview' | 'charts' | 'export'>('overview');
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-7 py-4 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <div>
          <h1 className="font-head text-xl font-bold">Contract Reports</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Supplier contracts, values and renewal analysis</p>
        </div>
        <div className="flex items-center gap-2">
          {(['overview', 'charts', 'export'] as const).map((s) => (
            <button key={s} onClick={() => setActiveSection(s)} className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors"
              style={{ background: activeSection === s ? 'rgba(232,201,122,0.12)' : 'var(--surface2)', color: activeSection === s ? 'var(--primary)' : 'var(--text2)', border: `1px solid ${activeSection === s ? 'var(--primary)' : 'var(--border)'}` }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-7">
        {activeSection === 'overview' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-4 gap-4">
              <KPICard label="Total Contracts" value={CONTRACT_DATA.length} sub="Across all hotels" color="#e8c97a" icon={ScrollText} />
              <KPICard label="Active" value={activeContracts} sub="Currently active" color="#3dd68c" icon={ScrollText} />
              <KPICard label="Expiring Soon" value={expiringContracts} sub="Within 90 days" color="#f59e0b" icon={ScrollText} />
              <KPICard label="Annual Value" value={`£${(totalContractValue / 1000).toFixed(0)}k`} sub="Total contract value" color="#60a5fa" icon={TrendingUp} />
            </div>
            <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--surface)' }}>
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <ScrollText size={15} style={{ color: 'var(--primary)' }} />
                <span className="font-head font-bold text-sm">Contracts Register</span>
              </div>
              <table className="w-full">
                <thead style={{ background: 'var(--surface2)' }}>
                  <tr>
                    {['Hotel', 'Supplier', 'Category', 'Annual Value', 'End Date', 'Status'].map((h) => (
                      <th key={h} className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CONTRACT_DATA.map((con, i) => {
                    const statusColor = con.status === 'active' ? '#3dd68c' : con.status === 'expiring-soon' ? '#f59e0b' : '#f43f5e';
                    return (
                      <tr key={i} className="border-b border-border" onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{con.hotel.split(' ').slice(0, 2).join(' ')}</td>
                        <td className="px-4 py-3 font-medium text-sm">{con.supplier}</td>
                        <td className="px-4 py-3 text-xs">{con.category}</td>
                        <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--primary)' }}>£{con.value.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs">{con.endDate}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: `${statusColor}18`, color: statusColor }}>{con.status.replace('-', ' ')}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeSection === 'charts' && (
          <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-4">Contracts by Category</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={contractsByCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {contractsByCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-4">Contracts by Hotel</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={contractsByHotel} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="contracts" name="Contracts" fill="#e8c97a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-border p-5 col-span-2" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-4">Contract Value by Hotel</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={contractsByHotel} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v: number) => [`£${v.toLocaleString()}`, 'Value']} />
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
  const [activeSection, setActiveSection] = useState<'overview' | 'charts' | 'export'>('overview');
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-7 py-4 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <div>
          <h1 className="font-head text-xl font-bold">Compliance Reports</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Statutory compliance, certifications and risk analysis</p>
        </div>
        <div className="flex items-center gap-2">
          {(['overview', 'charts', 'export'] as const).map((s) => (
            <button key={s} onClick={() => setActiveSection(s)} className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors"
              style={{ background: activeSection === s ? 'rgba(232,201,122,0.12)' : 'var(--surface2)', color: activeSection === s ? 'var(--primary)' : 'var(--text2)', border: `1px solid ${activeSection === s ? 'var(--primary)' : 'var(--border)'}` }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-7">
        {activeSection === 'overview' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-4 gap-4">
              <KPICard label="Total Items" value={totalCompliance} sub="All compliance records" color="#e8c97a" icon={FileCheck} />
              <KPICard label="Compliant" value={compliantCount} sub="Up to date" color="#3dd68c" icon={FileCheck} />
              <KPICard label="Overdue" value={overdueCompliance} sub="Require immediate action" color="#f43f5e" icon={FileCheck} />
              <KPICard label="Expiring Soon" value={expiringSoonCompliance} sub="Within 60 days" color="#f59e0b" icon={FileCheck} />
            </div>
            <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--surface)' }}>
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <FileCheck size={15} style={{ color: 'var(--primary)' }} />
                <span className="font-head font-bold text-sm">Compliance Summary by Hotel</span>
              </div>
              <table className="w-full">
                <thead style={{ background: 'var(--surface2)' }}>
                  <tr>
                    {['Hotel', 'Total Items', 'Compliant', 'Overdue', 'Compliance Rate'].map((h) => (
                      <th key={h} className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {complianceByHotel.filter((r) => r.total > 0).map((row) => {
                    const rate = row.total > 0 ? Math.round((row.compliant / row.total) * 100) : 0;
                    return (
                      <tr key={row.name} className="border-b border-border" onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <td className="px-4 py-3 font-medium text-sm">{row.fullName}</td>
                        <td className="px-4 py-3 font-bold text-sm" style={{ color: 'var(--primary)' }}>{row.total}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: '#3dd68c' }}>{row.compliant}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: row.overdue > 0 ? '#f43f5e' : 'var(--text2)' }}>{row.overdue}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface3)', maxWidth: 80 }}>
                              <div className="h-full rounded-full" style={{ width: `${rate}%`, background: rate >= 80 ? '#3dd68c' : rate >= 50 ? '#f59e0b' : '#f43f5e' }} />
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
            <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--surface)' }}>
              <div className="px-5 py-4 border-b border-border"><span className="font-head font-bold text-sm">Compliance Items Detail</span></div>
              <table className="w-full">
                <thead style={{ background: 'var(--surface2)' }}>
                  <tr>
                    {['Hotel', 'Category', 'Status', 'Risk', 'Expiry'].map((h) => (
                      <th key={h} className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPLIANCE_DATA.map((item, i) => {
                    const statusColor = item.status === 'compliant' ? '#3dd68c' : item.status === 'expiring-soon' ? '#f59e0b' : '#f43f5e';
                    const riskColor = item.risk === 'critical' ? '#f43f5e' : item.risk === 'high' ? '#f97316' : item.risk === 'medium' ? '#f59e0b' : '#3dd68c';
                    return (
                      <tr key={i} className="border-b border-border" onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{item.hotel.split(' ').slice(0, 2).join(' ')}</td>
                        <td className="px-4 py-3 font-medium text-sm">{item.category}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: `${statusColor}18`, color: statusColor }}>{item.status.replace('-', ' ')}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold capitalize" style={{ color: riskColor }}>{item.risk}</span>
                        </td>
                        <td className="px-4 py-3 text-xs">{item.expiry}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeSection === 'charts' && (
          <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-4">Compliance Status</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={complianceByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {complianceByStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-4">Risk Level Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={complianceByRisk} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {complianceByRisk.map((entry, i) => <Cell key={i} fill={entry.color} />)}
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

function ExportSection({ items }: { items: { id: string; label: string; icon: React.ElementType; desc: string }[] }) {
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
        <div className="font-head font-bold text-sm mb-1">Export Reports</div>
        <div className="text-xs text-muted-foreground mb-5">Download reports in Excel or PDF format</div>
        <div className="flex flex-col gap-3">
          {items.map((report) => {
            const Icon = report.icon;
            return (
              <div key={report.id} className="flex items-center gap-4 p-4 rounded-xl border border-border transition-colors" style={{ background: 'var(--surface2)' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(232,201,122,0.1)' }}>
                  <Icon size={18} style={{ color: 'var(--primary)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{report.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{report.desc}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border" style={{ background: 'var(--surface)', color: 'var(--text2)' }}>
                    <Download size={12} /> Excel
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'var(--primary)', color: '#000' }}>
                    <Download size={12} /> PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Utilities Report Component ────────────────────────────────────────────────
function UtilitiesReport() {
  const [activeSection, setActiveSection] = useState<'overview' | 'charts' | 'export'>('overview');
  const [filterType, setFilterType] = useState<'All' | UtilityType>('All');
  const [filterStatus, setFilterStatus] = useState<'all' | UtilityStatus>('all');

  const filtered = UTILITIES_DATA.filter((u) => {
    const typeMatch = filterType === 'All' || u.utilityType === filterType;
    const statusMatch = filterStatus === 'all' || u.status === filterStatus;
    return typeMatch && statusMatch;
  });

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
      <div className="flex items-center justify-between px-7 py-4 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <div>
          <h1 className="font-head text-xl font-bold">Utilities Report</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Supplier accounts, meter references, contract dates, costs and status across all properties</p>
        </div>
        <div className="flex items-center gap-2">
          {(['overview', 'charts', 'export'] as const).map((s) => (
            <button key={s} onClick={() => setActiveSection(s)} className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors"
              style={{ background: activeSection === s ? 'rgba(232,201,122,0.12)' : 'var(--surface2)', color: activeSection === s ? 'var(--primary)' : 'var(--text2)', border: `1px solid ${activeSection === s ? 'var(--primary)' : 'var(--border)'}` }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-7">
        {activeSection === 'overview' && (
          <div className="flex flex-col gap-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
              <KPICard label="Total Accounts" value={UTILITIES_DATA.length} sub="Across all properties" color="#e8c97a" icon={Zap} />
              <KPICard label="Active Contracts" value={activeUtilities} sub="Currently in force" color="#3dd68c" icon={Zap} />
              <KPICard label="Expired / Expiring" value={expiredUtilities + UTILITIES_DATA.filter((u) => u.status === 'expiring-soon').length} sub="Require renewal action" color="#f43f5e" icon={Zap} />
              <KPICard label="Annual Cost" value={totalAnnualUtilityCost > 0 ? `£${(totalAnnualUtilityCost / 1000).toFixed(0)}k` : 'Partial'} sub="Recorded annual spend" color="#60a5fa" icon={TrendingUp} />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground">Filter by type:</span>
              {(['All', 'Electricity', 'Gas', 'Water'] as const).map((t) => (
                <button key={t} onClick={() => setFilterType(t)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                  style={{ background: filterType === t ? 'rgba(232,201,122,0.12)' : 'var(--surface2)', color: filterType === t ? 'var(--primary)' : 'var(--text2)', borderColor: filterType === t ? 'var(--primary)' : 'var(--border)' }}>
                  {t}
                </button>
              ))}
              <span className="text-xs font-semibold text-muted-foreground ml-4">Status:</span>
              {(['all', 'active', 'expiring-soon', 'expired', 'incomplete'] as const).map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors capitalize"
                  style={{ background: filterStatus === s ? 'rgba(232,201,122,0.12)' : 'var(--surface2)', color: filterStatus === s ? 'var(--primary)' : 'var(--text2)', borderColor: filterStatus === s ? 'var(--primary)' : 'var(--border)' }}>
                  {s.replace('-', ' ')}
                </button>
              ))}
            </div>

            {/* Summary by Property */}
            <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--surface)' }}>
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <Building2 size={15} style={{ color: 'var(--primary)' }} />
                <span className="font-head font-bold text-sm">Utility Summary by Property</span>
              </div>
              <table className="w-full">
                <thead style={{ background: 'var(--surface2)' }}>
                  <tr>
                    {['Property', 'Electricity', 'Gas', 'Water', 'Annual Cost', 'Accounts'].map((h) => (
                      <th key={h} className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {utilitiesByProperty.map((row) => (
                    <tr key={row.name} className="border-b border-border" onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                      <td className="px-4 py-3 font-medium text-sm">{row.fullName}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#f59e0b' }}>{row.electricity > 0 ? `${row.electricity} acct` : '—'}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#f97316' }}>{row.gas > 0 ? `${row.gas} acct` : '—'}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#60a5fa' }}>{row.water > 0 ? `${row.water} acct` : '—'}</td>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--primary)' }}>{row.annualCost > 0 ? `£${row.annualCost.toLocaleString()}` : '—'}</td>
                      <td className="px-4 py-3 font-bold text-sm">{row.electricity + row.gas + row.water}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Full Utilities Register */}
            <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--surface)' }}>
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={15} style={{ color: 'var(--primary)' }} />
                  <span className="font-head font-bold text-sm">Utilities Register — {filtered.length} accounts</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead style={{ background: 'var(--surface2)' }}>
                    <tr>
                      {['Property', 'Type', 'Supplier', 'Account No.', 'Meter Reference', 'Contract End', 'Annual Cost', 'Tariff Rate', 'Status'].map((h) => (
                        <th key={h} className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => {
                      const statusColor = getStatusColor(u.status);
                      const typeInfo = getTypeIcon(u.utilityType);
                      return (
                        <tr key={u.id} className="border-b border-border" onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                          <td className="px-4 py-3 font-medium text-sm whitespace-nowrap">{u.property}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${typeInfo.color}18`, color: typeInfo.color }}>{u.utilityType}</span>
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">{u.supplier}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{u.accountNumber}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate" title={u.meterReference}>{u.meterReference}</td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">{u.contractEnd || '—'}</td>
                          <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--primary)' }}>{u.annualCost > 0 ? `£${u.annualCost.toLocaleString()}` : u.monthlyCost > 0 ? `£${u.monthlyCost.toLocaleString()}/mo` : '—'}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-[140px] truncate" title={u.tariffRate}>{u.tariffRate}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize whitespace-nowrap" style={{ background: `${statusColor}18`, color: statusColor }}>{u.status.replace('-', ' ')}</span>
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
              <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--surface)' }}>
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <TrendingUp size={15} style={{ color: '#f43f5e' }} />
                  <span className="font-head font-bold text-sm">Action Flags</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(244,63,94,0.12)', color: '#f43f5e' }}>
                    {UTILITIES_DATA.filter((u) => u.flags && u.flags.length > 0).length} accounts
                  </span>
                </div>
                <div className="p-5 flex flex-col gap-3">
                  {UTILITIES_DATA.filter((u) => u.flags && u.flags.length > 0).map((u) => (
                    <div key={u.id} className="flex items-start gap-3 p-3 rounded-lg border border-border" style={{ background: 'var(--surface2)' }}>
                      <div className="flex-shrink-0 mt-0.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${getTypeIcon(u.utilityType).color}18`, color: getTypeIcon(u.utilityType).color }}>{u.utilityType}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{u.property} — {u.supplier}</div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {u.flags!.map((flag, fi) => (
                            <span key={fi} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}>⚠ {flag}</span>
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
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-4">Accounts by Utility Type</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={utilitiesByType} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {utilitiesByType.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-4">Contract Status Breakdown</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={utilitiesByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {utilitiesByStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-border p-5 col-span-2" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-4">Utility Accounts by Property</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={utilitiesByProperty} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="electricity" name="Electricity" fill="#f59e0b" stackId="a" />
                  <Bar dataKey="gas" name="Gas" fill="#f97316" stackId="a" />
                  <Bar dataKey="water" name="Water" fill="#60a5fa" stackId="a" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-border p-5 col-span-2" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-4">Annual Cost by Property (Recorded)</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={utilitiesByProperty.filter((p) => p.annualCost > 0)} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v: number) => [`£${v.toLocaleString()}`, 'Annual Cost']} />
                  <Bar dataKey="annualCost" name="Annual Cost" fill="#e8c97a" radius={[4, 4, 0, 0]} />
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
  const [activeSection, setActiveSection] = useState<'overview' | 'charts' | 'export'>('overview');
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-7 py-4 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <div>
          <h1 className="font-head text-xl font-bold">Asset Reports</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Asset management insights and exports</p>
        </div>
        <div className="flex items-center gap-2">
          {(['overview', 'charts', 'export'] as const).map((s) => (
            <button key={s} onClick={() => setActiveSection(s)} className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors"
              style={{ background: activeSection === s ? 'rgba(232,201,122,0.12)' : 'var(--surface2)', color: activeSection === s ? 'var(--primary)' : 'var(--text2)', border: `1px solid ${activeSection === s ? 'var(--primary)' : 'var(--border)'}` }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-7">
        {activeSection === 'overview' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-4 gap-4">
              <KPICard label="Total Assets" value={stats.total} sub="Across all hotels" color="#e8c97a" icon={Package} />
              <KPICard label="Fixed Assets" value={stats.fixed} sub={`${Math.round((stats.fixed / stats.total) * 100)}% of total`} color="#60a5fa" icon={Package} />
              <KPICard label="Overdue Maintenance" value={stats.overdueMaintenance} sub="Require immediate action" color="#f43f5e" icon={Wrench} />
              <KPICard label="Maintenance Complete" value={`${stats.maintenanceCompletion}%`} sub="Completion rate" color="#3dd68c" icon={ClipboardCheck} />
            </div>
            <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--surface)' }}>
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <Building2 size={15} style={{ color: 'var(--primary)' }} />
                <span className="font-head font-bold text-sm">Asset Summary by Hotel</span>
              </div>
              <table className="w-full">
                <thead style={{ background: 'var(--surface2)' }}>
                  <tr>
                    {['Hotel', 'Total Assets', 'Fixed', 'Non-Fixed', 'Overdue Maintenance', 'Critical Assets'].map((h) => (
                      <th key={h} className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HOTELS.map((hotel) => {
                    const hotelAssets = ASSETS.filter((a) => a.hotelId === hotel.id);
                    const hotelMaint = MAINTENANCE_RECORDS.filter((m) => m.hotelId === hotel.id && m.status === 'overdue');
                    const criticalCount = hotelAssets.filter((a) => a.riskLevel === 'critical').length;
                    return (
                      <tr key={hotel.id} className="border-b border-border" onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <td className="px-4 py-3"><div className="font-medium text-sm">{hotel.name}</div><div className="text-xs text-muted-foreground">{hotel.city}</div></td>
                        <td className="px-4 py-3 font-head font-bold text-sm" style={{ color: 'var(--primary)' }}>{hotelAssets.length}</td>
                        <td className="px-4 py-3 text-sm">{hotelAssets.filter((a) => a.isFixed).length}</td>
                        <td className="px-4 py-3 text-sm">{hotelAssets.filter((a) => !a.isFixed).length}</td>
                        <td className="px-4 py-3">
                          {hotelMaint.length > 0 ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(244,63,94,0.12)', color: '#f43f5e' }}>{hotelMaint.length} overdue</span>
                          ) : (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(61,214,140,0.12)', color: '#3dd68c' }}>None</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {criticalCount > 0 ? <span className="text-xs font-semibold" style={{ color: '#f43f5e' }}>{criticalCount}</span> : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--surface)' }}>
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <BarChart3 size={15} style={{ color: 'var(--primary)' }} />
                <span className="font-head font-bold text-sm">Assets by Category</span>
              </div>
              <div className="p-5 grid gap-2">
                {byCategoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div className="w-28 text-xs text-muted-foreground truncate">{cat.fullName}</div>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface3)' }}>
                      <div className="h-full rounded-full" style={{ width: `${(cat.value / stats.total) * 100}%`, background: cat.color }} />
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
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-4">Assets by Hotel</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byHotelData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="fixed" name="Fixed" fill="#60a5fa" radius={[3, 3, 0, 0]} stackId="a" />
                  <Bar dataKey="nonFixed" name="Non-Fixed" fill="#e8c97a" radius={[3, 3, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-4">Asset Condition</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={byConditionData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {byConditionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-4">Risk Level Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={byRiskData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {byRiskData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-4">Maintenance Status</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={maintenanceStatusData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="value" name="Records" radius={[4, 4, 0, 0]}>
                    {maintenanceStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-border p-5 col-span-2" style={{ background: 'var(--surface)' }}>
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
    const type = searchParams.get('type') || 'asset';
    setReportType(type);
  }, [searchParams]);

  if (reportType === 'maintenance') return <MaintenanceReport />;
  if (reportType === 'insurance') return <InsuranceReport />;
  if (reportType === 'contracts') return <ContractReport />;
  if (reportType === 'compliance') return <ComplianceReport />;
  if (reportType === 'utilities') return <UtilitiesReport />;
  return <AssetReport />;
}
