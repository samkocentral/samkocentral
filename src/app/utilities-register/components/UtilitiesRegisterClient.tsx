'use client';

import React, { useState, useMemo } from 'react';
import { Zap, Flame, Droplets, Search, Plus, Download, Eye, AlertTriangle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';



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
    <div className="rounded-xl border border-border p-5 relative overflow-hidden" style={{ background: 'var(--surface)' }}>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{label}</div>
          <div className="font-head font-extrabold text-3xl" style={{ color }}>{value}</div>
          <div className="text-xs text-muted-foreground mt-1">{sub}</div>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

export default function UtilitiesRegisterClient() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | UtilityType>('all');
  const [filterProperty, setFilterProperty] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState<UtilityAccount | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const activeCount = UTILITIES.filter((u) => u.status === 'active').length;
  const expiringSoon = UTILITIES.filter((u) => u.status === 'expiring-soon').length;
  const expiredCount = UTILITIES.filter((u) => u.status === 'expired').length;
  const incompleteCount = UTILITIES.filter((u) => u.status === 'incomplete').length;
  const totalAnnual = UTILITIES.filter((u) => u.annualCost > 0).reduce((sum, u) => sum + u.annualCost, 0);
  const flaggedCount = UTILITIES.filter((u) => u.flags && u.flags.length > 0).length;

  const filtered = useMemo(() => {
    return UTILITIES.filter((u) => {
      const matchSearch = !search || u.property.toLowerCase().includes(search.toLowerCase()) || u.supplier.toLowerCase().includes(search.toLowerCase()) || u.accountNumber.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'all' || u.utilityType === filterType;
      const matchProperty = filterProperty === 'all' || u.property === filterProperty;
      const matchStatus = filterStatus === 'all' || u.status === filterStatus;
      return matchSearch && matchType && matchProperty && matchStatus;
    });
  }, [search, filterType, filterProperty, filterStatus]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between px-7 py-4 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <div>
          <h1 className="font-head font-bold text-xl">Utilities Register</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Centralised utility account management across all properties — {UTILITIES.length} accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-border" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
            <Download size={13} /> Export
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#000' }}>
            <Plus size={14} /> Add Account
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 px-7 pt-5 pb-4 flex-shrink-0" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
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
          const typeAccounts = UTILITIES.filter((u) => u.utilityType === type);
          const typeActive = typeAccounts.filter((u) => u.status === 'active').length;
          const typeAnnual = typeAccounts.filter((u) => u.annualCost > 0).reduce((sum, u) => sum + u.annualCost, 0);
          const TypeIcon = UTILITY_ICONS[type];
          const color = UTILITY_COLORS[type];
          return (
            <button key={type} onClick={() => setFilterType(filterType === type ? 'all' : type)}
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
      <div className="flex items-center gap-3 px-7 pb-4 flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 flex-1 min-w-48" style={{ background: 'var(--surface)' }}>
          <Search size={13} className="text-muted-foreground flex-shrink-0" />
          <input className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground" placeholder="Search by property, supplier, account…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="rounded-lg border border-border px-3 py-1.5 text-sm outline-none" style={{ background: 'var(--surface)', color: 'var(--foreground)' }} value={filterProperty} onChange={(e) => setFilterProperty(e.target.value)}>
          <option value="all">All Properties</option>
          {PROPERTIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="rounded-lg border border-border px-3 py-1.5 text-sm outline-none" style={{ background: 'var(--surface)', color: 'var(--foreground)' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="expiring-soon">Expiring Soon</option>
          <option value="expired">Expired</option>
          <option value="incomplete">Incomplete</option>
        </select>
        <span className="text-xs text-muted-foreground">{filtered.length} accounts</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-7 pb-6">
        <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--surface)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['Property', 'Type', 'Supplier', 'Account No.', 'Meter Reference', 'Contract End', 'Annual Cost', 'Monthly Cost', 'Tariff', 'Status', 'Flags', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((account) => {
                const TypeIcon = UTILITY_ICONS[account.utilityType];
                const color = UTILITY_COLORS[account.utilityType];
                const sc = STATUS_CONFIG[account.status];
                return (
                  <tr key={account.id} className="border-t border-border cursor-pointer transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => setSelectedAccount(account)}>
                    <td className="px-4 py-3 font-medium text-sm whitespace-nowrap">{account.property}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <TypeIcon size={13} style={{ color }} />
                        <span className="text-sm font-medium" style={{ color }}>{account.utilityType}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{account.supplier}</td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">{account.accountNumber}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-48 truncate">{account.meterReference}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {fmtDate(account.contractEnd)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">{fmt(account.annualCost)}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{fmt(account.monthlyCost)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-40 truncate">{account.tariffRate}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {account.flags && account.flags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle size={12} className="text-amber-400 flex-shrink-0" />
                          <span className="text-xs text-amber-400">{account.flags.length} flag{account.flags.length > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 rounded-lg" style={{ color: 'var(--text2)' }} onClick={(e) => { e.stopPropagation(); setSelectedAccount(account); }}><Eye size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: STATUS_CONFIG[selectedAccount.status].bg, color: STATUS_CONFIG[selectedAccount.status].color }}>{STATUS_CONFIG[selectedAccount.status].label}</span>
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
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowAddModal(false)}>
          <div className="rounded-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-auto" style={{ background: 'var(--surface)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-head font-bold text-lg">Add Utility Account</h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground text-xl font-bold px-2">×</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                ['Property', 'select-property'], ['Utility Type', 'select-type'],
                ['Supplier', 'text'], ['Account Number', 'text'],
                ['Meter Reference / MPAN / MPRN', 'text'], ['Contract Start', 'date'],
                ['Contract End', 'date'], ['Annual Cost (£)', 'number'],
                ['Monthly Cost (£)', 'number'], ['Tariff / Rate', 'text'],
                ['Portal Login', 'text'], ['Supplier Phone', 'text'],
                ['Supplier Email', 'email'], ['Status', 'select-status'],
              ].map(([label, type]) => (
                <div key={label} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">{label}</label>
                  {type === 'select-property' ? (
                    <select className="rounded-lg border border-border px-3 py-2 text-sm outline-none" style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}>
                      {PROPERTIES.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  ) : type === 'select-type' ? (
                    <select className="rounded-lg border border-border px-3 py-2 text-sm outline-none" style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}>
                      <option>Electricity</option><option>Gas</option><option>Water</option>
                    </select>
                  ) : type === 'select-status' ? (
                    <select className="rounded-lg border border-border px-3 py-2 text-sm outline-none" style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}>
                      <option value="active">Active</option>
                      <option value="expiring-soon">Expiring Soon</option>
                      <option value="expired">Expired</option>
                      <option value="incomplete">Incomplete</option>
                    </select>
                  ) : (
                    <input type={type} className="rounded-lg border border-border px-3 py-2 text-sm outline-none" style={{ background: 'var(--surface2)', color: 'var(--foreground)' }} />
                  )}
                </div>
              ))}
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Notes / Flags</label>
                <textarea rows={3} className="rounded-lg border border-border px-3 py-2 text-sm outline-none resize-none" style={{ background: 'var(--surface2)', color: 'var(--foreground)' }} />
              </div>
            </div>
            <div className="flex gap-2 p-6 pt-0">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#000' }}>Save Account</button>
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium border border-border" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
