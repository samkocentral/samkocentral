'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Zap, Flame, Droplets, Search, Plus, Download, Eye, AlertTriangle, CheckCircle2, Clock, RefreshCw, ChevronDown, Loader2, Trash2, X, Check, Edit2 } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import PageCMSEditButton from '@/components/cms/PageCMSEditButton';
import { useDeepPageCms } from '@/lib/deepPageCms';
import LoadingPagination from '@/components/ui/LoadingPagination';
import { useLoadingPagination } from '@/hooks/useLoadingPagination';



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
  portalLogin: string;
  supplierPhone: string;
  supplierEmail: string;
  status: UtilityStatus;
  notes?: string;
  flags?: string[];
}

// ─── REAL DATA — Seeded from Samko_Holdings_Utilities_Master ─────────────────
const UTILITIES: UtilityAccount[] = [
  // ── SUN HOTEL (CROWNE PLAZA KINGSTON) ──
  {
    id: 'u-001', property: 'Crowne Plaza Kingston-south', utilityType: 'Electricity',
    supplier: 'EDF Energy', accountNumber: '3898198541', meterReference: 'MPAN: 1900092859450 / Meter: E24BG03134_P272',
    contractStart: '2025-11-01', contractEnd: '2026-10-31', annualCost: 0, monthlyCost: 213,
    tariffRate: '20.0878p/kWh; Standing: £40.14/day', portalLogin: 'Accounts@cplondonkingston.co.uk',
    supplierPhone: '0845 366 3664', supplierEmail: 'remittanceadvices@edfenergy.com',
    status: 'expiring-soon', notes: 'Contract: Q_2225032. Fixed Fully Inclusive (Half-Hourly). Renewal due Oct 2026.',
    flags: ['Renewal Due Oct 2026'],
  },
  {
    id: 'u-002', property: 'Crowne Plaza Kingston-south', utilityType: 'Gas',
    supplier: 'SEFE Energy', accountNumber: '100091219', meterReference: 'MPRN: 9209299704 / Meter: M100K0079408D6',
    contractStart: '2026-03-01', contractEnd: '2028-02-29', annualCost: 13508, monthlyCost: 1126,
    tariffRate: '3.8431p/kWh; Standing: £5.607/day', portalLogin: 'Accounts@cplondonkingston.co.uk',
    supplierPhone: '0161 837 3395', supplierEmail: 'enquiries@sefe-energy.com',
    status: 'active', notes: 'Contract: AG08104881. Fixed 2-year SEFE Energy Shield. AQ: 298,269 kWh. Signed 09-Feb-2026.',
  },
  {
    id: 'u-003', property: 'Crowne Plaza Kingston-south', utilityType: 'Water',
    supplier: 'Everflow', accountNumber: 'EFW293246-0', meterReference: 'SPID: 3010968825 / Meter: 319025069',
    contractStart: '2023-07-10', contractEnd: '2026-07-09', annualCost: 35240, monthlyCost: 2937,
    tariffRate: 'Water: £2.7346/m³; Waste: £1.5496/m³; Fixed: £1,202.56/yr', portalLogin: 'EFW293246-0',
    supplierPhone: '0330 6600 137', supplierEmail: 'customer.services@everflowutilities.com',
    status: 'expired', notes: 'CONTRACT RENEWAL DUE — expired 09-Jul-2026. Address: Holiday Inn, Portsmouth Rd, Surbiton KT6 5QQ.',
    flags: ['⚠️ CONTRACT EXPIRED — Renewal Required'],
  },

  // ── WARREN HOUSE ──
  {
    id: 'u-004', property: 'Warren House', utilityType: 'Electricity',
    supplier: 'EDF Energy', accountNumber: '0506000000', meterReference: 'MPAN: 1200010214798 / Top: 00 845 072',
    contractStart: '2026-05-01', contractEnd: '2027-04-30', annualCost: 100198, monthlyCost: 8350,
    tariffRate: 'Day: 21.3419p/kWh; Night: 15.6863p/kWh; Standing: £13.04/day; Availability: 7.257p/kVA/day',
    portalLogin: 'accounts@warrenhouse.com (portal login email not recorded)',
    supplierPhone: '0845 366 3664', supplierEmail: 'Anete.Painter@edfenergy.com',
    status: 'active', notes: 'Contract: Q-52926-R1L7P0. Annual volume: 459,826 kWh. Signed 04-Feb-2026. Broker: Nationwide Utilities Ltd. EDF Relationship Manager: Anete Painter — 020 8186 1382.',
    flags: ['Portal login email not recorded'],
  },
  {
    id: 'u-005', property: 'Warren House', utilityType: 'Gas',
    supplier: 'SEFE Energy', accountNumber: '100093919', meterReference: 'MPRN: 10473207 / Meter: M160A0004412A7',
    contractStart: '2026-05-01', contractEnd: '2028-04-30', annualCost: 30397, monthlyCost: 2533,
    tariffRate: '3.4765p/kWh; Standing: £13.167/day', portalLogin: 'accounts@warrenhouse.com',
    supplierPhone: '0161 837 3395', supplierEmail: 'enquiries@sefe-energy.com',
    status: 'active', notes: 'Contract: AG08019270. Fixed 2-year SEFE Energy Shield. AQ: 736,171 kWh. Signed 04-Feb-2026.',
  },
  {
    id: 'u-006', property: 'Warren House', utilityType: 'Water',
    supplier: 'Everflow', accountNumber: 'EFW232342-0', meterReference: 'SPID: 3010981651 (waste-only) + SPID: 3011506736 (water+waste)',
    contractStart: '2023-07-10', contractEnd: '2026-10-02', annualCost: 21509, monthlyCost: 954,
    tariffRate: 'Water: £1.7760/m³; Waste: £1.0544/m³; Fixed: £676.44/yr per SPID', portalLogin: 'EFW232342-0',
    supplierPhone: '0330 6600 137', supplierEmail: 'customer.services@everflowutilities.com',
    status: 'expiring-soon', notes: 'Contract renewal due Oct 2026. ⚠️ Outstanding balance £9,007.52 — ACTION REQUIRED. Annual forecast: £21,509.15 net.',
    flags: ['⚠️ Renewal Due Oct 2026', '⚠️ Outstanding Balance £9,007.52'],
  },

  // ── STANHILL COURT ──
  {
    id: 'u-007', property: 'Stanhill Court', utilityType: 'Electricity',
    supplier: 'SSE Energy Solutions', accountNumber: '8701889865', meterReference: 'MPAN: 1900018001128 / Meter: K20A002284',
    contractStart: '2026-02-12', contractEnd: '2027-01-31', annualCost: 0, monthlyCost: 0,
    tariffRate: 'Fixed Green Protect HH Non-Energy Only', portalLogin: 'ab@stanhillcourthotel.co.uk',
    supplierPhone: '0345 725 2526', supplierEmail: 'businesscontracts@sse.com',
    status: 'active', notes: 'Contract: AGR5408710. Portal: my.sseenergysolutions.co.uk. Tariff/rate details not yet recorded.',
  },
  {
    id: 'u-008', property: 'Stanhill Court', utilityType: 'Gas',
    supplier: 'Calor Gas', accountNumber: 'N/A', meterReference: 'N/A',
    contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0,
    tariffRate: 'LPG/Calor — rate not recorded', portalLogin: 'SH1881',
    supplierPhone: 'N/A', supplierEmail: 'N/A',
    status: 'incomplete', notes: '⚠️ Portal not working. Account details to be provided via WhatsApp. All fields require updating.',
    flags: ['⚠️ Incomplete — Portal not working'],
  },
  {
    id: 'u-009', property: 'Stanhill Court', utilityType: 'Water',
    supplier: 'Everflow', accountNumber: 'EFW364357-0', meterReference: 'SPID: 3026521701 / Meter: 5069925',
    contractStart: '', contractEnd: '2026-01-27', annualCost: 0, monthlyCost: 0,
    tariffRate: 'Rate not recorded', portalLogin: 'EFW364357-0',
    supplierPhone: '0330 6600 137', supplierEmail: 'customer.services@everflowutilities.com',
    status: 'expired', notes: '⚠️ Contract end date 27-Jan-2026 has already passed. Renewal action required.',
    flags: ['⚠️ CONTRACT EXPIRED — Renewal Required'],
  },

  // ── THE RIVER CLUB ──
  {
    id: 'u-010', property: 'River Club', utilityType: 'Electricity',
    supplier: 'SSE Energy Solutions', accountNumber: '880000068119', meterReference: 'MPANs: 1900029038809 / 1900031000016 / 1900070285553 / 1900090295272',
    contractStart: '2025-09-01', contractEnd: '2026-08-31', annualCost: 21082, monthlyCost: 1757,
    tariffRate: 'NHH: 20.5107p/kWh; Day: 23.6805p/kWh; Night: 16.2019p/kWh; Eve: 17.9279p/kWh',
    portalLogin: 'david@theriverclub.co.uk',
    supplierPhone: '0345 072 9402', supplierEmail: 'cmt.commercial@sse.com',
    status: 'expiring-soon', notes: 'Contract: AGR3464675. 4 MPANs total. Annual volume: ~89,604 kWh. Signed 09/07/2025. ⚠️ Legacy invoice IV04388495 for £89,837.19 (Revenue Protection 2018–2025) — VERIFY/DISPUTE.',
    flags: ['Renewal Due Aug 2026', '⚠️ Legacy Invoice £89,837.19 — Verify/Dispute'],
  },
  {
    id: 'u-011', property: 'River Club', utilityType: 'Gas',
    supplier: 'SEFE Energy', accountNumber: '100022228', meterReference: 'MPRN: 9116667904 / Meter: M016A0564215A6',
    contractStart: '2027-01-01', contractEnd: '2027-09-30', annualCost: 20329, monthlyCost: 1694,
    tariffRate: '3.8114p/kWh (from Jan-27); Standing: £5.756/day; Current rate: 6.8508p/kWh',
    portalLogin: 'david@theriverclub.co.uk',
    supplierPhone: '0161 837 3395', supplierEmail: 'enquiries@sefe-energy.com',
    status: 'active', notes: 'Contract: AG07576924. AQ: 478,165 kWh. Signed 09/07/2025. New contract starts Jan-27.',
  },
  {
    id: 'u-012', property: 'River Club', utilityType: 'Water',
    supplier: 'Everflow', accountNumber: 'EFW292393-0', meterReference: 'SPID: 3012811532 / Meter: 150005643',
    contractStart: '', contractEnd: '2027-10-06', annualCost: 0, monthlyCost: 1420,
    tariffRate: 'Wholesale + Retail — full tariff to be extracted from invoice', portalLogin: 'EFW292393-0',
    supplierPhone: '0330 6600 137', supplierEmail: 'customer.services@everflowutilities.com',
    status: 'active', notes: 'Contract end: 06-Oct-2027. Latest invoice: £1,420.06 net (May 2026).',
  },

  // ── HAMPTON APARTMENTS 1 (SUN TV) ──
  {
    id: 'u-013', property: 'Hampton 1 & 2', utilityType: 'Electricity',
    supplier: 'ENGIE Power', accountNumber: '10314633', meterReference: 'MPAN: 1900026425412 / Meter: 44651946',
    contractStart: '', contractEnd: '2027-05-31', annualCost: 0, monthlyCost: 2465,
    tariffRate: '65.2243p/kWh; Standing: £5.0718/day; CCL: 0.801p/kWh',
    portalLogin: 'Portal login not yet available',
    supplierPhone: 'N/A', supplierEmail: 'N/A',
    status: 'active', notes: 'Account: Sampath Kumar Mallaya & Sun TV UK Limited (T/A Hampton Suites). Next contract ends 31-Mar-2029 — notice required by 01-Mar-2029.',
    flags: ['Portal login not yet available'],
  },
  {
    id: 'u-014', property: 'Hampton 1 & 2', utilityType: 'Water',
    supplier: 'Castle Water', accountNumber: '2578329', meterReference: 'Meter/SPID awaiting from main invoice',
    contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0,
    tariffRate: 'Awaiting full tariff sheet', portalLogin: 'Not recorded',
    supplierPhone: 'N/A', supplierEmail: 'N/A',
    status: 'incomplete', notes: '⚠️ Outstanding balance £1,029.50 (due 06/05/2026) — investigate late payment charge. Meter/SPID and full tariff awaiting main invoice.',
    flags: ['⚠️ Outstanding Balance £1,029.50', 'Meter/SPID Awaiting'],
  },

  // ── RAVENS AIT (4YOU HOSPITALITY / 4YOU INVESTMENTS) ──
  {
    id: 'u-015', property: 'Ravens Ait Island', utilityType: 'Electricity',
    supplier: 'EDF Energy', accountNumber: 'A-7F0A5110', meterReference: 'MPAN: 1900034424274 / Meter: A7471465',
    contractStart: '', contractEnd: '', annualCost: 36518, monthlyCost: 3480,
    tariffRate: '45.550p/kWh; Standing: £1.86/day; CCL: 0.801p/kWh',
    portalLogin: 'Not recorded',
    supplierPhone: '0845 366 3664', supplierEmail: 'remittanceadvices@edfenergy.com',
    status: 'incomplete', notes: '⚠️ On variable Freedom tariff — no fixed-rate contract on file. REVIEW FOR FIXED-RATE PROCUREMENT. Account Holder: 4You Investments Ltd. Annual estimated usage: 78,710 kWh.',
    flags: ['⚠️ Variable Tariff — Review for Fixed-Rate', 'Portal Login Not Recorded'],
  },
  {
    id: 'u-016', property: 'Ravens Ait Island', utilityType: 'Water',
    supplier: 'Castle Water', accountNumber: '2531103', meterReference: 'Water SPID: 3011855706W14 / Waste SPID: 3011855706S11 / Meter: 131612389',
    contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 319,
    tariffRate: 'Water: £2.9534/m³; Foul Sewerage: £1.7046/m³; Fixed: £2.039/day',
    portalLogin: 'Not recorded',
    supplierPhone: 'N/A', supplierEmail: 'N/A',
    status: 'incomplete', notes: 'Account Holder: 4You Hospitality Services Limited. Meter size: 40mm. Latest invoice: £319.34 (May 2026).',
    flags: ['Portal Login Not Recorded'],
  },

  // ── CLAPHAM APARTMENT ──
  {
    id: 'u-017', property: 'Clapham Apartment', utilityType: 'Electricity',
    supplier: 'Not recorded', accountNumber: 'N/A', meterReference: 'N/A',
    contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0,
    tariffRate: 'N/A', portalLogin: 'N/A',
    supplierPhone: 'N/A', supplierEmail: 'N/A',
    status: 'incomplete', notes: 'No supplier documentation on file. Placeholder — all details required.',
    flags: ['⚠️ No Documentation on File'],
  },
  {
    id: 'u-018', property: 'Clapham Apartment', utilityType: 'Gas',
    supplier: 'Not recorded', accountNumber: 'N/A', meterReference: 'N/A',
    contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0,
    tariffRate: 'N/A', portalLogin: 'N/A',
    supplierPhone: 'N/A', supplierEmail: 'N/A',
    status: 'incomplete', notes: 'No supplier documentation on file. Placeholder — all details required.',
    flags: ['⚠️ No Documentation on File'],
  },
  {
    id: 'u-019', property: 'Clapham Apartment', utilityType: 'Water',
    supplier: 'Not recorded', accountNumber: 'N/A', meterReference: 'N/A',
    contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0,
    tariffRate: 'N/A', portalLogin: 'N/A',
    supplierPhone: 'N/A', supplierEmail: 'N/A',
    status: 'incomplete', notes: 'No supplier documentation on file. Placeholder — all details required.',
    flags: ['⚠️ No Documentation on File'],
  },

  // ── SHARNBROOK ──
  {
    id: 'u-020', property: 'Sharnbrook', utilityType: 'Electricity',
    supplier: 'Not recorded', accountNumber: 'N/A', meterReference: 'N/A',
    contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0,
    tariffRate: 'N/A', portalLogin: 'N/A',
    supplierPhone: 'N/A', supplierEmail: 'N/A',
    status: 'incomplete', notes: 'Placeholder — awaiting documents.',
    flags: ['⚠️ No Documentation on File'],
  },
  {
    id: 'u-021', property: 'Sharnbrook', utilityType: 'Gas',
    supplier: 'Not recorded', accountNumber: 'N/A', meterReference: 'N/A',
    contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0,
    tariffRate: 'N/A', portalLogin: 'N/A',
    supplierPhone: 'N/A', supplierEmail: 'N/A',
    status: 'incomplete', notes: 'Placeholder — awaiting documents.',
    flags: ['⚠️ No Documentation on File'],
  },
  {
    id: 'u-022', property: 'Sharnbrook', utilityType: 'Water',
    supplier: 'Not recorded', accountNumber: 'N/A', meterReference: 'N/A',
    contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0,
    tariffRate: 'N/A', portalLogin: 'N/A',
    supplierPhone: 'N/A', supplierEmail: 'N/A',
    status: 'incomplete', notes: 'Placeholder — awaiting documents.',
    flags: ['⚠️ No Documentation on File'],
  },

  // ── HAMPTON APARTMENTS 2 (MAX MERIDIAN) ──
  {
    id: 'u-023', property: 'Hampton 1 & 2', utilityType: 'Gas',
    supplier: 'Not recorded', accountNumber: 'N/A', meterReference: 'N/A',
    contractStart: '', contractEnd: '', annualCost: 0, monthlyCost: 0,
    tariffRate: 'N/A', portalLogin: 'N/A',
    supplierPhone: 'N/A', supplierEmail: 'N/A',
    status: 'incomplete', notes: 'Hampton Apartments 2 (Max Meridian) — awaiting documents.',
    flags: ['⚠️ No Documentation on File'],
  },
];

const UTILITY_ICONS: Record<UtilityType, React.ElementType> = {
  Electricity: Zap,
  Gas: Flame,
  Water: Droplets,
};

const UTILITY_COLORS: Record<UtilityType, string> = {
  Electricity: '#f59e0b',
  Gas: '#f97316',
  Water: '#38bdf8',
};

const STATUS_CONFIG: Record<UtilityStatus, { label: string; bg: string; color: string }> = {
  active: { label: 'Active', bg: 'rgba(61,214,140,0.12)', color: '#3dd68c' },
  'expiring-soon': { label: 'Expiring Soon', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  expired: { label: 'Expired', bg: 'rgba(244,63,94,0.12)', color: '#f43f5e' },
  incomplete: { label: 'Incomplete', bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
};

const PROPERTIES = Array.from(new Set(UTILITIES.map((u) => u.property))).sort();

function fmt(n: number) { return n > 0 ? `£${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : '—'; }

function fmtDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getUTCDate()).padStart(2, '0');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${day} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function KPICard({ label, value, sub, color, icon: Icon }: { label: string; value: number | string; sub: string; color: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-border px-3.5 py-3 relative overflow-hidden" style={{ background: 'var(--surface)' }}>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 whitespace-nowrap truncate" title={label}>{label}</div>
          <div className="font-head font-bold text-xl xl:text-2xl tracking-tight whitespace-nowrap leading-tight truncate" style={{ color }}>{value}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5 whitespace-nowrap truncate">{sub}</div>
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

export default function UtilitiesRegisterClient() {
  const {
    title: cmsTitle,
    subtitle: cmsSubtitle,
    searchPlaceholder: cmsSearchPlaceholder,
    primaryActionLabel: cmsPrimaryActionLabel,
    columns: cmsColumns,
    items: cmsItems,
  } = useDeepPageCms('utilities');

  const activeColumns = useMemo(() => {
    if (cmsColumns && cmsColumns.length > 0) {
      return [...cmsColumns].sort((a, b) => a.order - b.order).filter((c) => c.visible !== false);
    }
    return [
      { id: 'property', label: 'Property', visible: true, order: 1 },
      { id: 'utilityType', label: 'Type', visible: true, order: 2 },
      { id: 'supplier', label: 'Supplier', visible: true, order: 3 },
      { id: 'accountNumber', label: 'Account No.', visible: true, order: 4 },
      { id: 'meterReference', label: 'Meter Reference', visible: true, order: 5 },
      { id: 'contractEnd', label: 'Contract End', visible: true, order: 6 },
      { id: 'annualCost', label: 'Annual Cost', visible: true, order: 7 },
      { id: 'monthlyCost', label: 'Monthly Cost', visible: true, order: 8 },
      { id: 'tariffRate', label: 'Tariff', visible: true, order: 9 },
      { id: 'status', label: 'Status', visible: true, order: 10 },
      { id: 'actions', label: 'Actions', visible: true, order: 11 },
    ];
  }, [cmsColumns]);

  const [accounts, setAccounts] = useState<UtilityAccount[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('samko_cache_utilities');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    if (cmsItems && cmsItems.length > 0) return cmsItems as any;
    return UTILITIES;
  });

  useEffect(() => {
    if (cmsItems && cmsItems.length > 0) {
      setAccounts(cmsItems as any);
    }
  }, [cmsItems]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  const typeParam = searchParams?.get('type')?.toLowerCase();
  const initialType: 'all' | UtilityType =
    typeParam === 'electricity' ? 'Electricity' :
    typeParam === 'gas' ? 'Gas' :
    typeParam === 'water' ? 'Water' : 'all';

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | UtilityType>(initialType);

  useEffect(() => {
    const t = searchParams?.get('type')?.toLowerCase();
    if (t === 'electricity') setFilterType('Electricity');
    else if (t === 'gas') setFilterType('Gas');
    else if (t === 'water') setFilterType('Water');
    else setFilterType('all');
  }, [searchParams]);

  const handleFilterTypeChange = (type: 'all' | UtilityType) => {
    setFilterType(type);
    const url = type === 'all' ? '/utilities-register' : `/utilities-register?type=${type.toLowerCase()}`;
    router.push(url, { scroll: false });
  };
  const [filterProperty, setFilterProperty] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<UtilityAccount | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UtilityAccount | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<UtilityAccount | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [formData, setFormData] = useState({
    property: PROPERTIES[0] || 'Crowne Plaza Kingston-south',
    utilityType: 'Electricity' as UtilityType,
    supplier: '',
    accountNumber: '',
    meterReference: '',
    contractStart: new Date().toISOString().slice(0, 10),
    contractEnd: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    annualCost: '',
    monthlyCost: '',
    tariffRate: '',
    portalLogin: '',
    supplierPhone: '',
    supplierEmail: '',
    status: 'active' as UtilityStatus,
    notes: '',
  });

  const fetchUtilitiesData = useCallback(async () => {
    try {
      setLoading(true);
      const [res, propsRes] = await Promise.all([
        api.utilities.getAll().catch(() => ({ success: false, data: [] })),
        api.properties.getAll().catch(() => ({ success: false, data: [] })),
      ]);
      if (res.success && res.data && res.data.length > 0) {
        setAccounts(res.data);
        try {
          sessionStorage.setItem('samko_cache_utilities', JSON.stringify(res.data));
        } catch {}
      }
      if (propsRes.success && propsRes.data && propsRes.data.length > 0) {
        setProperties(propsRes.data);
      }
    } catch (err) {
      console.warn('Utilities offline/fallback:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUtilitiesData();
  }, [fetchUtilitiesData]);

  useEffect(() => {
    const handleDataChanged = (e: any) => {
      if (e.detail?.type === 'utilities' || e.detail?.type === 'properties') {
        fetchUtilitiesData();
      }
    };
    window.addEventListener('samko:data-changed', handleDataChanged);
    return () => window.removeEventListener('samko:data-changed', handleDataChanged);
  }, [fetchUtilitiesData]);

  const propertyOptions = properties.length > 0
    ? Array.from(new Set([...properties.map((p) => p.name), ...PROPERTIES]))
    : PROPERTIES;

  const handleStatusChange = async (id: string, newStatus: UtilityStatus) => {
    setAccounts((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u))
    );
    if (selectedAccount && selectedAccount.id === id) {
      setSelectedAccount((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'utilities', id, status: newStatus },
        })
      );
    }
    try {
      await api.utilities.update(id, { status: newStatus });
    } catch (e) {
      console.warn('Utility status updated locally:', e);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier.trim() || !formData.accountNumber.trim()) return;
    setSaving(true);
    const tempId = `u-${Date.now()}`;
    const payload = {
      ...formData,
      id: tempId,
      annualCost: Number(formData.annualCost) || 0,
      monthlyCost: Number(formData.monthlyCost) || 0,
    };
    try {
      const res = await api.utilities.create(payload);
      const created = res.data || payload;
      setAccounts((prev) => [created, ...prev]);
      setShowAddModal(false);
      setFormData({
        property: propertyOptions[0] || 'Crowne Plaza Kingston-south',
        utilityType: 'Electricity' as UtilityType,
        supplier: '',
        accountNumber: '',
        meterReference: '',
        contractStart: new Date().toISOString().slice(0, 10),
        contractEnd: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
        annualCost: '',
        monthlyCost: '',
        tariffRate: '',
        portalLogin: '',
        supplierPhone: '',
        supplierEmail: '',
        status: 'active' as UtilityStatus,
        notes: '',
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', {
            detail: { type: 'utilities', id: created.id },
          })
        );
      }
    } catch (err: any) {
      console.warn('Utility account created locally:', err);
      setAccounts((prev) => [payload, ...prev]);
      setShowAddModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (acc: UtilityAccount) => {
    setEditingAccount({ ...acc });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    setSavingEdit(true);
    try {
      const updated = {
        ...editingAccount,
        annualCost: Number(editingAccount.annualCost) || 0,
        monthlyCost: Number(editingAccount.monthlyCost) || 0,
      };
      setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      if (selectedAccount?.id === updated.id) {
        setSelectedAccount(updated);
      }
      setShowEditModal(false);
      toast.success('Utility updated', { description: `${updated.property} (${updated.utilityType}) updated` });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'utilities', id: updated.id } }));
      }
      await api.utilities.update(updated.id, updated);
    } catch (err: any) {
      toast.error('Failed to update utility account');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!accountToDelete) return;
    const id = accountToDelete.id;
    setDeletingAccount(true);
    try {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      if (selectedAccount?.id === id) {
        setSelectedAccount(null);
      }
      toast.success('Account deleted', { description: `${accountToDelete.supplier} account removed` });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'utilities', id } }));
      }
      await api.utilities.delete(id);
    } catch (err: any) {
      toast.error('Failed to delete utility account');
    } finally {
      setDeletingAccount(false);
      setAccountToDelete(null);
    }
  };

  const activeCount = accounts.filter((u) => u.status === 'active').length;
  const expiringSoon = accounts.filter((u) => u.status === 'expiring-soon').length;
  const expiredCount = accounts.filter((u) => u.status === 'expired').length;
  const incompleteCount = accounts.filter((u) => u.status === 'incomplete').length;
  const totalAnnual = accounts.filter((u) => u.annualCost > 0).reduce((sum, u) => sum + u.annualCost, 0);
  const flaggedCount = accounts.filter((u) => u.flags && u.flags.length > 0).length;

  const filtered = useMemo(() => {
    return accounts.filter((u) => {
      const matchSearch = !search || u.property.toLowerCase().includes(search.toLowerCase()) || u.supplier.toLowerCase().includes(search.toLowerCase()) || u.accountNumber.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'all' || u.utilityType === filterType;
      const matchProperty = filterProperty.length === 0 || filterProperty.includes(u.property);
      const matchStatus = filterStatus.length === 0 || filterStatus.includes(u.status);
      return matchSearch && matchType && matchProperty && matchStatus;
    });
  }, [accounts, search, filterType, filterProperty, filterStatus]);

  const {
    currentPage,
    pageSize,
    totalRecords,
    paginatedItems: paginatedAccounts,
    isPageLoading,
    changePage,
    changePageSize,
  } = useLoadingPagination(filtered, 4);

  const handleExport = () => {
    const headers = ['Property', 'Utility Type', 'Supplier', 'Account Number', 'Meter Reference', 'Annual Cost', 'Monthly Cost', 'Contract Start', 'Contract End', 'Status'];
    const rows = filtered.map((u: any) => [
      `"${u.property || ''}"`,
      `"${u.utilityType || ''}"`,
      `"${(u.supplier || '').replace(/"/g, '""')}"`,
      `"${u.accountNumber || ''}"`,
      `"${u.meterReference || ''}"`,
      u.annualCost,
      u.monthlyCost,
      `"${u.contractStart || ''}"`,
      `"${u.contractEnd || ''}"`,
      `"${u.status || ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'utilities_register.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} utility accounts to CSV`);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-head font-bold text-xl">{cmsTitle || 'Utilities Register'}</h1>
            {loading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{cmsSubtitle || `Centralised utility account management across all properties — ${accounts.length} accounts`}</p>
        </div>
        <div className="flex items-center gap-2">
          <PageCMSEditButton pageId="utilities" pageName="Utilities Register" />

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-border hover:bg-surface2 transition-all active:scale-95 cursor-pointer"
            style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
          >
            <Download size={13} /> Export
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95 cursor-pointer" style={{ background: 'var(--primary)', color: '#000' }}>
            <Plus size={14} /> {(cmsPrimaryActionLabel || 'Add Account').replace(/^[\+\s]+/, '').trim()}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-2.5 px-6 pt-5 pb-4 flex-shrink-0" style={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
        <KPICard label="Active Accounts" value={activeCount} sub="Fully documented" color="#3dd68c" icon={CheckCircle2} />
        <KPICard label="Expiring Soon" value={expiringSoon} sub="Renewal required" color="#f59e0b" icon={Clock} />
        <KPICard label="Expired" value={expiredCount} sub="Action required" color="#f43f5e" icon={AlertTriangle} />
        <KPICard label="Incomplete" value={incompleteCount} sub="Awaiting documents" color="#94a3b8" icon={RefreshCw} />
        <KPICard label="Flagged" value={flaggedCount} sub="Require attention" color="#f97316" icon={AlertTriangle} />
        <KPICard label="Annual Cost" value={`£${(totalAnnual / 1000).toFixed(0)}k`} sub="Documented accounts" color="#a78bfa" icon={Zap} />
      </div>

      {/* Utility Type Summary */}
      <div className="grid gap-3 px-7 pb-4 flex-shrink-0" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {(['Electricity', 'Gas', 'Water'] as UtilityType[]).map((type) => {
          const typeAccounts = accounts.filter((u) => u.utilityType === type);
          const typeActive = typeAccounts.filter((u) => u.status === 'active').length;
          const typeAnnual = typeAccounts.filter((u) => u.annualCost > 0).reduce((sum, u) => sum + u.annualCost, 0);
          const TypeIcon = UTILITY_ICONS[type];
          const color = UTILITY_COLORS[type];
          return (
            <button key={type} onClick={() => handleFilterTypeChange(filterType === type ? 'all' : type)}
              className="rounded-xl border p-4 flex items-center gap-4 transition-all"
              style={{ background: filterType === type ? `${color}10` : 'var(--surface)', borderColor: filterType === type ? color : 'var(--border)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                <TypeIcon size={18} style={{ color }} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-head font-bold text-sm">{type}</div>
                <div className="text-xs text-muted-foreground">{typeAccounts.length} accounts · {typeActive} active</div>
              </div>
              <div className="text-right">
                <div className="font-head font-bold text-sm" style={{ color }}>{typeAnnual > 0 ? `£${(typeAnnual / 1000).toFixed(0)}k/yr` : '—'}</div>
                <div className="text-xs text-muted-foreground">Annual cost</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 pb-3 flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 flex-1 min-w-48" style={{ background: 'var(--surface)' }}>
          <Search size={13} className="text-muted-foreground flex-shrink-0" />
          <input className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground" placeholder={cmsSearchPlaceholder || 'Search by property, supplier, account…'} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <CustomDropdown
          label="All Properties"
          value={filterProperty}
          multiple
          options={propertyOptions.map((p) => ({ value: p, label: p }))}
          onChange={setFilterProperty}
        />
        <CustomDropdown
          label="All Statuses"
          value={filterStatus}
          multiple
          options={[
            { value: 'active', label: 'Active', color: '#3dd68c' },
            { value: 'expiring-soon', label: 'Expiring Soon', color: '#f59e0b' },
            { value: 'expired', label: 'Expired', color: '#f43f5e' },
            { value: 'incomplete', label: 'Incomplete', color: '#f59e0b' },
          ]}
          onChange={setFilterStatus}
        />
        <span className="text-xs text-muted-foreground">{filtered.length} accounts</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="rounded-xl border border-border overflow-x-auto shadow-sm" style={{ background: 'var(--surface)' }}>
          <table className="w-full text-left border-collapse" style={{ minWidth: 920 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {activeColumns.map((col) => (
                  <th
                    key={col.id}
                    className={`text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${
                      col.id.toLowerCase() === 'actions' ? 'text-right' : ''
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedAccounts.map((account) => {
                const TypeIcon = UTILITY_ICONS[account.utilityType] || Zap;
                const color = UTILITY_COLORS[account.utilityType] || '#e8c97a';
                const sc = STATUS_CONFIG[account.status] || STATUS_CONFIG.active;
                return (
                  <tr key={account.id} className="border-t border-border cursor-pointer transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => setSelectedAccount(account)}>
                    {activeColumns.map((col) => {
                      const colKey = col.id.toLowerCase();
                      if (colKey === 'property') {
                        return (
                          <td key={col.id} className="px-4 py-3 font-medium text-sm whitespace-nowrap">{account.property}</td>
                        );
                      }
                      if (colKey === 'utilitytype' || colKey === 'type') {
                        return (
                          <td key={col.id} className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <TypeIcon size={13} style={{ color }} />
                              <span className="text-sm font-medium" style={{ color }}>{account.utilityType}</span>
                            </div>
                          </td>
                        );
                      }
                      if (colKey === 'supplier') {
                        return (
                          <td key={col.id} className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{account.supplier}</td>
                        );
                      }
                      if (colKey === 'accountnumber' || colKey === 'accountno') {
                        return (
                          <td key={col.id} className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">{account.accountNumber}</td>
                        );
                      }
                      if (colKey === 'meterreference' || colKey === 'meter') {
                        return (
                          <td key={col.id} className="px-4 py-3 text-xs text-muted-foreground max-w-48 truncate">{account.meterReference}</td>
                        );
                      }
                      if (colKey === 'contractend') {
                        return (
                          <td key={col.id} className="px-4 py-3 text-sm whitespace-nowrap">
                            {fmtDate(account.contractEnd)}
                          </td>
                        );
                      }
                      if (colKey === 'annualcost') {
                        return (
                          <td key={col.id} className="px-4 py-3 text-sm font-medium whitespace-nowrap">{fmt(account.annualCost)}</td>
                        );
                      }
                      if (colKey === 'monthlycost') {
                        return (
                          <td key={col.id} className="px-4 py-3 text-sm whitespace-nowrap">{fmt(account.monthlyCost)}</td>
                        );
                      }
                      if (colKey === 'tariffrate' || colKey === 'tariff') {
                        return (
                          <td key={col.id} className="px-4 py-3 text-xs text-muted-foreground max-w-40 truncate">{account.tariffRate}</td>
                        );
                      }
                      if (colKey === 'status') {
                        return (
                          <td key={col.id} className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="relative inline-block">
                              <select
                                value={account.status}
                                onChange={(e) => handleStatusChange(account.id, e.target.value as UtilityStatus)}
                                className="appearance-none cursor-pointer pl-4 pr-6 py-1 rounded-full text-xs font-semibold outline-none transition-all capitalize"
                                style={{
                                  background: sc.bg,
                                  color: sc.color,
                                  border: `1px solid ${sc.color}33`,
                                }}
                              >
                                <option value="active" style={{ background: '#18181b', color: '#3dd68c' }}>Active</option>
                                <option value="expiring-soon" style={{ background: '#18181b', color: '#f59e0b' }}>Expiring Soon</option>
                                <option value="expired" style={{ background: '#18181b', color: '#f43f5e' }}>Expired</option>
                                <option value="incomplete" style={{ background: '#18181b', color: '#94a3b8' }}>Incomplete</option>
                              </select>
                              <span
                                className="w-1.5 h-1.5 rounded-full absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
                                style={{ background: sc.color }}
                              />
                              <ChevronDown
                                size={11}
                                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-80"
                                style={{ color: sc.color }}
                              />
                            </div>
                          </td>
                        );
                      }
                      if (colKey === 'flags') {
                        return (
                          <td key={col.id} className="px-4 py-3">
                            {account.flags && account.flags.length > 0 && (
                              <div className="flex items-center gap-1">
                                <AlertTriangle size={12} className="text-amber-400 flex-shrink-0" />
                                <span className="text-xs text-amber-400">{account.flags.length} flag{account.flags.length > 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </td>
                        );
                      }
                      if (colKey === 'actions') {
                        return (
                          <td key={col.id} className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                              <button
                                className="p-1.5 rounded-lg border border-border hover:bg-surface2 transition-colors cursor-pointer"
                                style={{ color: 'var(--text2)' }}
                                title="View Details"
                                onClick={() => setSelectedAccount(account)}
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                className="p-1.5 rounded-lg border border-border hover:bg-surface2 transition-colors text-muted-foreground hover:text-primary cursor-pointer"
                                title="Edit Utility Account"
                                onClick={() => handleOpenEdit(account)}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                className="p-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/15 text-rose-400 transition-colors cursor-pointer"
                                title="Delete Utility Account"
                                onClick={() => setAccountToDelete(account)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        );
                      }

                      // Dynamic custom columns
                      const val = (account as any)[col.id] ?? (account as any)[colKey];
                      return (
                        <td key={col.id} className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                          {val !== undefined && val !== null && String(val).trim() !== '' ? String(val) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <LoadingPagination
            currentPage={currentPage}
            totalRecords={totalRecords}
            pageSize={pageSize}
            pageSizeOptions={[5, 7, 10, 20]}
            onPageChange={changePage}
            onPageSizeChange={changePageSize}
            isLoading={loading || isPageLoading}
            recordName="utility accounts"
          />
        </div>
      </div>

      {/* Account Detail Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setSelectedAccount(null)}>
          <div className="rounded-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-auto" style={{ background: 'var(--surface)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-border">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {(() => { const TypeIcon = UTILITY_ICONS[selectedAccount.utilityType]; const color = UTILITY_COLORS[selectedAccount.utilityType]; return <div className="flex items-center gap-1.5"><TypeIcon size={14} style={{ color }} /><span className="text-sm font-semibold" style={{ color }}>{selectedAccount.utilityType}</span></div>; })()}
                  <div className="relative inline-block">
                    <select
                      value={selectedAccount.status}
                      onChange={(e) => handleStatusChange(selectedAccount.id, e.target.value as UtilityStatus)}
                      className="appearance-none cursor-pointer pl-4 pr-6 py-1 rounded-full text-xs font-semibold outline-none transition-all capitalize"
                      style={{
                        background: (STATUS_CONFIG[selectedAccount.status] || STATUS_CONFIG.active).bg,
                        color: (STATUS_CONFIG[selectedAccount.status] || STATUS_CONFIG.active).color,
                        border: `1px solid ${(STATUS_CONFIG[selectedAccount.status] || STATUS_CONFIG.active).color}33`,
                      }}
                    >
                      <option value="active" style={{ background: '#18181b', color: '#3dd68c' }}>Active</option>
                      <option value="expiring-soon" style={{ background: '#18181b', color: '#f59e0b' }}>Expiring Soon</option>
                      <option value="expired" style={{ background: '#18181b', color: '#f43f5e' }}>Expired</option>
                      <option value="incomplete" style={{ background: '#18181b', color: '#94a3b8' }}>Incomplete</option>
                    </select>
                    <span
                      className="w-1.5 h-1.5 rounded-full absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ background: (STATUS_CONFIG[selectedAccount.status] || STATUS_CONFIG.active).color }}
                    />
                    <ChevronDown
                      size={11}
                      className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-80"
                      style={{ color: (STATUS_CONFIG[selectedAccount.status] || STATUS_CONFIG.active).color }}
                    />
                  </div>
                </div>
                <h2 className="font-head font-bold text-lg">{selectedAccount.property}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{selectedAccount.supplier}</p>
              </div>
              <button onClick={() => setSelectedAccount(null)} className="text-muted-foreground hover:text-foreground text-xl font-bold px-2">×</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                ['Account Number', selectedAccount.accountNumber],
                ['Meter Reference', selectedAccount.meterReference],
                ['Supplier Phone', selectedAccount.supplierPhone],
                ['Supplier Email', selectedAccount.supplierEmail],
                ['Contract Start', fmtDate(selectedAccount.contractStart)],
                ['Contract End', fmtDate(selectedAccount.contractEnd)],
                ['Annual Cost', fmt(selectedAccount.annualCost)],
                ['Monthly Cost', fmt(selectedAccount.monthlyCost)],
                ['Portal Login', selectedAccount.portalLogin],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium break-all">{value}</span>
                </div>
              ))}
              <div className="col-span-2 flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Tariff / Rate</span>
                <span className="text-sm font-medium">{selectedAccount.tariffRate}</span>
              </div>
            </div>
            {selectedAccount.flags && selectedAccount.flags.length > 0 && (
              <div className="px-6 pb-4">
                <div className="text-xs text-muted-foreground mb-2">Action Flags</div>
                <div className="flex flex-col gap-1.5">
                  {selectedAccount.flags.map((flag, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm p-2.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}>
                      <AlertTriangle size={13} />
                      {flag}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedAccount.notes && (
              <div className="px-6 pb-6">
                <div className="text-xs text-muted-foreground mb-1">Notes</div>
                <div className="text-sm p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>{selectedAccount.notes}</div>
              </div>
            )}
            <div className="flex items-center justify-between gap-2 p-6 border-t border-border" style={{ background: 'var(--surface2)' }}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(selectedAccount)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-surface2 text-foreground transition-colors"
                  style={{ background: 'var(--surface)' }}
                >
                  <Edit2 size={13} /> Edit Account
                </button>
                <button
                  type="button"
                  onClick={() => setAccountToDelete(selectedAccount)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-rose-500/30 hover:bg-rose-500/15 text-rose-400 transition-colors"
                >
                  <Trash2 size={13} /> Delete Account
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAccount(null)}
                className="px-5 py-2 rounded-lg text-xs font-semibold"
                style={{ background: 'var(--primary)', color: '#000' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowAddModal(false)}>
          <div className="rounded-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-auto" style={{ background: 'var(--surface)' }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleAddAccount}>
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="font-head font-bold text-lg">Add Utility Account</h2>
                <button type="button" onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground text-xl font-bold px-2">×</button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Property *</label>
                  <select
                    value={formData.property}
                    onChange={(e) => setFormData({ ...formData, property: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {propertyOptions.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Utility Type *</label>
                  <select
                    value={formData.utilityType}
                    onChange={(e) => setFormData({ ...formData, utilityType: e.target.value as UtilityType })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="Electricity">Electricity</option>
                    <option value="Gas">Gas</option>
                    <option value="Water">Water</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Supplier *</label>
                  <input
                    type="text"
                    required
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Account Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Meter Reference / MPAN / MPRN</label>
                  <input
                    type="text"
                    value={formData.meterReference}
                    onChange={(e) => setFormData({ ...formData, meterReference: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Contract Start</label>
                  <input
                    type="date"
                    value={formData.contractStart}
                    onChange={(e) => setFormData({ ...formData, contractStart: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Contract End</label>
                  <input
                    type="date"
                    value={formData.contractEnd}
                    onChange={(e) => setFormData({ ...formData, contractEnd: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Annual Cost (£)</label>
                  <input
                    type="number"
                    value={formData.annualCost}
                    onChange={(e) => setFormData({ ...formData, annualCost: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Monthly Cost (£)</label>
                  <input
                    type="number"
                    value={formData.monthlyCost}
                    onChange={(e) => setFormData({ ...formData, monthlyCost: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Tariff / Rate</label>
                  <input
                    type="text"
                    value={formData.tariffRate}
                    onChange={(e) => setFormData({ ...formData, tariffRate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Portal Login</label>
                  <input
                    type="text"
                    value={formData.portalLogin}
                    onChange={(e) => setFormData({ ...formData, portalLogin: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Supplier Phone</label>
                  <input
                    type="text"
                    value={formData.supplierPhone}
                    onChange={(e) => setFormData({ ...formData, supplierPhone: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Supplier Email</label>
                  <input
                    type="email"
                    value={formData.supplierEmail}
                    onChange={(e) => setFormData({ ...formData, supplierEmail: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as UtilityStatus })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="active">Active</option>
                    <option value="expiring-soon">Expiring Soon</option>
                    <option value="expired">Expired</option>
                    <option value="incomplete">Incomplete</option>
                  </select>
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Notes / Flags</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none resize-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>
              <div className="flex gap-2 p-6 pt-0">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  Save Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-border"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Utility Account Modal */}
      {showEditModal && editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }} onClick={() => setShowEditModal(false)}>
          <div className="rounded-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-auto shadow-2xl animate-in zoom-in-95 duration-150" style={{ background: 'var(--surface)' }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveEdit}>
              <div className="flex items-center justify-between p-6 border-b border-border" style={{ background: 'var(--surface2)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}>
                    <Edit2 size={16} />
                  </div>
                  <div>
                    <h2 className="font-head font-bold text-base text-foreground">Edit Utility Account</h2>
                    <p className="text-xs text-muted-foreground">{editingAccount.accountNumber} · Update utility record dynamically</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowEditModal(false)} className="text-muted-foreground hover:text-foreground text-xl font-bold px-2">×</button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Property *</label>
                  <select
                    value={editingAccount.property}
                    onChange={(e) => setEditingAccount({ ...editingAccount, property: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {propertyOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Utility Type *</label>
                  <select
                    value={editingAccount.utilityType}
                    onChange={(e) => setEditingAccount({ ...editingAccount, utilityType: e.target.value as UtilityType })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="Electricity">Electricity</option>
                    <option value="Gas">Gas</option>
                    <option value="Water">Water</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Supplier *</label>
                  <input
                    required
                    type="text"
                    value={editingAccount.supplier}
                    onChange={(e) => setEditingAccount({ ...editingAccount, supplier: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Account Number *</label>
                  <input
                    required
                    type="text"
                    value={editingAccount.accountNumber}
                    onChange={(e) => setEditingAccount({ ...editingAccount, accountNumber: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Meter Reference (MPAN / MPRN / SPID)</label>
                  <input
                    type="text"
                    value={editingAccount.meterReference}
                    onChange={(e) => setEditingAccount({ ...editingAccount, meterReference: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
                  <select
                    value={editingAccount.status}
                    onChange={(e) => setEditingAccount({ ...editingAccount, status: e.target.value as UtilityStatus })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="active">Active</option>
                    <option value="expiring-soon">Expiring Soon</option>
                    <option value="expired">Expired</option>
                    <option value="incomplete">Incomplete</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Contract Start</label>
                  <input
                    type="date"
                    value={editingAccount.contractStart}
                    onChange={(e) => setEditingAccount({ ...editingAccount, contractStart: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Contract End</label>
                  <input
                    type="date"
                    value={editingAccount.contractEnd}
                    onChange={(e) => setEditingAccount({ ...editingAccount, contractEnd: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Annual Cost (£)</label>
                  <input
                    type="number"
                    value={editingAccount.annualCost}
                    onChange={(e) => setEditingAccount({ ...editingAccount, annualCost: Number(e.target.value) || 0 })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Monthly Cost (£)</label>
                  <input
                    type="number"
                    value={editingAccount.monthlyCost}
                    onChange={(e) => setEditingAccount({ ...editingAccount, monthlyCost: Number(e.target.value) || 0 })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Tariff / Rate Details</label>
                  <input
                    type="text"
                    value={editingAccount.tariffRate}
                    onChange={(e) => setEditingAccount({ ...editingAccount, tariffRate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Supplier Phone</label>
                  <input
                    type="text"
                    value={editingAccount.supplierPhone}
                    onChange={(e) => setEditingAccount({ ...editingAccount, supplierPhone: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Supplier Email</label>
                  <input
                    type="text"
                    value={editingAccount.supplierEmail}
                    onChange={(e) => setEditingAccount({ ...editingAccount, supplierEmail: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Notes / Contract Details</label>
                  <textarea
                    rows={2}
                    value={editingAccount.notes || ''}
                    onChange={(e) => setEditingAccount({ ...editingAccount, notes: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none resize-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 pt-0 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-border"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  {savingEdit ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/20 text-rose-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-head font-bold text-base text-foreground">Confirm Deletion</h3>
                <p className="text-xs text-muted-foreground">{accountToDelete.accountNumber} · {accountToDelete.supplier}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground mb-5">
              Are you sure you want to permanently delete the <strong className="text-foreground">{accountToDelete.utilityType} account for {accountToDelete.property}</strong> from the utilities register? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-surface2 transition-colors"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingAccount}
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                {deletingAccount ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={13} /> Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

