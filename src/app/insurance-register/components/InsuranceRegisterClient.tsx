'use client';

import React, { useState } from 'react';
import {
  Shield, AlertTriangle, Clock, CheckCircle2, TrendingUp,
  Plus, Search, Download, Eye, Edit2, FileText, Bell, Phone, RefreshCw
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


type PolicyStatus = 'active' | 'expiring-soon' | 'expired' | 'pending-renewal';

interface InsurancePolicy {
  id: string;
  policyNumber: string;
  insuranceType: string;
  insuranceCompany: string;
  broker: string;
  hotel: string;
  coverageAmount: number;
  annualPremium: number;
  startDate: string;
  expiryDate: string;
  renewalDate: string;
  excessAmount: number;
  responsibleManager: string;
  contactPerson: string;
  emergencyPhone: string;
  status: PolicyStatus;
  notes?: string;
}

interface Claim {
  id: string;
  policyId: string;
  policyNumber: string;
  hotel: string;
  claimDate: string;
  description: string;
  amount: number;
  status: 'open' | 'in-progress' | 'settled' | 'rejected';
}

const INSURANCE_TYPES = [
  'Building Insurance', 'Contents Insurance', 'Public Liability', 'Employers Liability',
  'Product Liability', 'Professional Indemnity', 'Cyber Insurance', 'Equipment Breakdown',
  'Business Interruption', 'Vehicle Insurance', 'Directors Liability', 'Engineering Insurance',
];

const HOTELS = [
  'Crowne Plaza Kingston-south', 'Stanhill Court', 'Hampton 1 & 2', 'Ravents Ait Island', 'River Club',
];

const MOCK_POLICIES: InsurancePolicy[] = [
  {
    id: '1', policyNumber: 'POL-2025-001', insuranceType: 'Building Insurance',
    insuranceCompany: 'Aviva Commercial', broker: 'Marsh UK', hotel: 'Crowne Plaza Kingston-south',
    coverageAmount: 15000000, annualPremium: 42000, startDate: '2025-01-01', expiryDate: '2026-01-01',
    renewalDate: '2025-12-15', excessAmount: 5000, responsibleManager: 'Marcus Webb',
    contactPerson: 'Sarah Thompson', emergencyPhone: '+44 800 123 4567', status: 'active',
  },
  {
    id: '2', policyNumber: 'POL-2025-002', insuranceType: 'Public Liability',
    insuranceCompany: 'AXA Commercial', broker: 'Aon UK', hotel: 'Crowne Plaza Kingston-south',
    coverageAmount: 10000000, annualPremium: 18500, startDate: '2025-01-01', expiryDate: '2026-01-01',
    renewalDate: '2025-12-15', excessAmount: 2500, responsibleManager: 'Marcus Webb',
    contactPerson: 'James Patel', emergencyPhone: '+44 800 234 5678', status: 'active',
  },
  {
    id: '3', policyNumber: 'POL-2025-003', insuranceType: 'Employers Liability',
    insuranceCompany: 'Zurich Insurance', broker: 'Marsh UK', hotel: 'Stanhill Court',
    coverageAmount: 10000000, annualPremium: 12000, startDate: '2025-02-01', expiryDate: '2026-02-01',
    renewalDate: '2026-01-15', excessAmount: 1000, responsibleManager: 'Tom Bradley',
    contactPerson: 'Rachel Green', emergencyPhone: '+44 800 345 6789', status: 'active',
  },
  {
    id: '4', policyNumber: 'POL-2024-004', insuranceType: 'Equipment Breakdown',
    insuranceCompany: 'RSA Group', broker: 'Willis Towers Watson', hotel: 'Hampton 1 & 2',
    coverageAmount: 2000000, annualPremium: 8400, startDate: '2024-08-01', expiryDate: '2025-08-01',
    renewalDate: '2025-07-15', excessAmount: 500, responsibleManager: 'Priya Sharma',
    contactPerson: 'David Chen', emergencyPhone: '+44 800 456 7890', status: 'expiring-soon',
    notes: 'Renewal quote requested — awaiting response from broker',
  },
  {
    id: '5', policyNumber: 'POL-2025-005', insuranceType: 'Cyber Insurance',
    insuranceCompany: 'Hiscox', broker: 'Aon UK', hotel: 'Ravents Ait Island',
    coverageAmount: 1000000, annualPremium: 6200, startDate: '2025-03-01', expiryDate: '2026-03-01',
    renewalDate: '2026-02-15', excessAmount: 2500, responsibleManager: 'Ewan McAllister',
    contactPerson: 'Lisa Wong', emergencyPhone: '+44 800 567 8901', status: 'active',
  },
  {
    id: '6', policyNumber: 'POL-2024-006', insuranceType: 'Business Interruption',
    insuranceCompany: 'Allianz Commercial', broker: 'Marsh UK', hotel: 'River Club',
    coverageAmount: 5000000, annualPremium: 15800, startDate: '2024-06-01', expiryDate: '2025-06-01',
    renewalDate: '2025-05-15', excessAmount: 10000, responsibleManager: 'Isabelle Martin',
    contactPerson: 'Mark Phillips', emergencyPhone: '+44 800 678 9012', status: 'expired',
    notes: 'EXPIRED — renewal in progress',
  },
  {
    id: '7', policyNumber: 'POL-2025-007', insuranceType: 'Vehicle Insurance',
    insuranceCompany: 'Direct Line Commercial', broker: 'Direct', hotel: 'Crowne Plaza Kingston-south',
    coverageAmount: 500000, annualPremium: 3200, startDate: '2025-07-01', expiryDate: '2026-07-01',
    renewalDate: '2026-06-15', excessAmount: 250, responsibleManager: 'Marcus Webb',
    contactPerson: 'Auto Renewals', emergencyPhone: '+44 800 789 0123', status: 'active',
  },
];

const MOCK_CLAIMS: Claim[] = [
  { id: 'c1', policyId: '1', policyNumber: 'POL-2025-001', hotel: 'Crowne Plaza Kingston-south', claimDate: '2025-03-15', description: 'Water damage to ground floor lobby ceiling', amount: 12500, status: 'settled' },
  { id: 'c2', policyId: '2', policyNumber: 'POL-2025-002', hotel: 'Crowne Plaza Kingston-south', claimDate: '2025-05-20', description: 'Guest slip and fall in car park', amount: 8000, status: 'in-progress' },
  { id: 'c3', policyId: '4', policyNumber: 'POL-2024-004', hotel: 'Hampton 1 & 2', claimDate: '2025-06-10', description: 'Commercial kitchen oven breakdown', amount: 4500, status: 'open' },
];

const STATUS_CONFIG: Record<PolicyStatus, { label: string; bg: string; color: string }> = {
  active: { label: 'Active', bg: 'rgba(61,214,140,0.12)', color: '#3dd68c' },
  'expiring-soon': { label: 'Expiring Soon', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  expired: { label: 'Expired', bg: 'rgba(244,63,94,0.12)', color: '#f43f5e' },
  'pending-renewal': { label: 'Pending Renewal', bg: 'rgba(96,165,250,0.12)', color: '#60a5fa' },
};

const CLAIM_STATUS: Record<string, { bg: string; color: string }> = {
  open: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  'in-progress': { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa' },
  settled: { bg: 'rgba(61,214,140,0.12)', color: '#3dd68c' },
  rejected: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e' },
};

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date('2025-07-21');
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function fmt(n: number) { return `£${n.toLocaleString()}`; }

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

export default function InsuranceRegisterClient() {
  const [activeTab, setActiveTab] = useState<'register' | 'claims' | 'renewals'>('register');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterHotel, setFilterHotel] = useState('all');
  const [selectedPolicy, setSelectedPolicy] = useState<InsurancePolicy | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const activePolicies = MOCK_POLICIES.filter((p) => p.status === 'active').length;
  const expiringSoon = MOCK_POLICIES.filter((p) => p.status === 'expiring-soon').length;
  const expired = MOCK_POLICIES.filter((p) => p.status === 'expired').length;
  const totalPremium = MOCK_POLICIES.reduce((sum, p) => sum + p.annualPremium, 0);

  const filtered = MOCK_POLICIES.filter((p) => {
    const matchSearch = !search || p.policyNumber.toLowerCase().includes(search.toLowerCase()) || p.insuranceType.toLowerCase().includes(search.toLowerCase()) || p.insuranceCompany.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchHotel = filterHotel === 'all' || p.hotel === filterHotel;
    return matchSearch && matchStatus && matchHotel;
  });

  const renewalsDue = MOCK_POLICIES.filter((p) => { const d = daysUntil(p.renewalDate); return d >= 0 && d <= 90; }).sort((a, b) => daysUntil(a.renewalDate) - daysUntil(b.renewalDate));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between px-7 py-4 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <div>
          <h1 className="font-head font-bold text-xl">Insurance Register</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage all hotel insurance policies and claims</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-border" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
            <Download size={13} /> Export
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#000' }}>
            <Plus size={14} /> Add Policy
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 px-7 pt-5 pb-4 flex-shrink-0" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <KPICard label="Active Policies" value={activePolicies} sub="Currently active" color="#3dd68c" icon={Shield} />
        <KPICard label="Expiring Soon" value={expiringSoon} sub="Within 90 days" color="#f59e0b" icon={Clock} />
        <KPICard label="Expired" value={expired} sub="Requires renewal" color="#f43f5e" icon={AlertTriangle} />
        <KPICard label="Claims" value={MOCK_CLAIMS.length} sub="Total claims" color="#60a5fa" icon={FileText} />
        <KPICard label="Annual Premium" value={`£${(totalPremium / 1000).toFixed(0)}k`} sub="Total across all hotels" color="#a78bfa" icon={TrendingUp} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 px-7 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        {[{ id: 'register', label: 'Insurance Register' }, { id: 'claims', label: 'Claims' }, { id: 'renewals', label: 'Renewals' }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className="px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap"
            style={{ borderColor: activeTab === tab.id ? 'var(--primary)' : 'transparent', color: activeTab === tab.id ? 'var(--primary)' : 'var(--text2)', background: 'transparent' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-7 py-4">
        {activeTab === 'register' && (
          <>
            {/* Filters */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 flex-1 max-w-xs" style={{ background: 'var(--surface)' }}>
                <Search size={13} className="text-muted-foreground flex-shrink-0" />
                <input className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground" placeholder="Search policies…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select className="rounded-lg border border-border px-3 py-1.5 text-sm outline-none" style={{ background: 'var(--surface)', color: 'var(--foreground)' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="expiring-soon">Expiring Soon</option>
                <option value="expired">Expired</option>
              </select>
              <select className="rounded-lg border border-border px-3 py-1.5 text-sm outline-none" style={{ background: 'var(--surface)', color: 'var(--foreground)' }} value={filterHotel} onChange={(e) => setFilterHotel(e.target.value)}>
                <option value="all">All Hotels</option>
                {HOTELS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
              <span className="text-xs text-muted-foreground ml-auto">{filtered.length} policies</span>
            </div>
            <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--surface)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'var(--surface2)' }}>
                    {['Policy No.', 'Insurance Type', 'Company', 'Hotel', 'Coverage', 'Annual Premium', 'Expiry Date', 'Days Left', 'Manager', 'Status', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((policy) => {
                    const days = daysUntil(policy.expiryDate);
                    const sc = STATUS_CONFIG[policy.status];
                    return (
                      <tr key={policy.id} className="border-t border-border cursor-pointer transition-colors"
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => setSelectedPolicy(policy)}>
                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">{policy.policyNumber}</td>
                        <td className="px-4 py-3"><div className="font-medium text-sm">{policy.insuranceType}</div></td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{policy.insuranceCompany}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{policy.hotel}</td>
                        <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">{fmt(policy.coverageAmount)}</td>
                        <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">{fmt(policy.annualPremium)}/yr</td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">{new Date(policy.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap" style={{ color: days < 0 ? '#f43f5e' : days <= 30 ? '#f59e0b' : '#3dd68c' }}>
                          {days < 0 ? `${Math.abs(days)}d expired` : `${days}d`}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{policy.responsibleManager}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button className="p-1.5 rounded-lg" style={{ color: 'var(--text2)' }} onClick={(e) => { e.stopPropagation(); setSelectedPolicy(policy); }}><Eye size={14} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'claims' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="font-head font-bold text-sm">{MOCK_CLAIMS.length} Claims</div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#000' }}>
                <Plus size={14} /> Log Claim
              </button>
            </div>
            <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--surface)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'var(--surface2)' }}>
                    {['Policy Number', 'Hotel', 'Claim Date', 'Description', 'Amount', 'Status'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_CLAIMS.map((claim) => {
                    const cs = CLAIM_STATUS[claim.status];
                    return (
                      <tr key={claim.id} className="border-t border-border"
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{claim.policyNumber}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{claim.hotel}</td>
                        <td className="px-4 py-3 text-sm">{new Date(claim.claimDate).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-3 text-sm">{claim.description}</td>
                        <td className="px-4 py-3 text-sm font-semibold">{fmt(claim.amount)}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: cs.bg, color: cs.color }}>{claim.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'renewals' && (
          <div className="flex flex-col gap-4">
            <div className="font-head font-bold text-sm">{renewalsDue.length} Renewals Due in Next 90 Days</div>
            {renewalsDue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <CheckCircle2 size={32} className="mb-3 opacity-30" />
                <p className="text-sm">No renewals due in the next 90 days</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {renewalsDue.map((policy) => {
                  const days = daysUntil(policy.renewalDate);
                  const sc = STATUS_CONFIG[policy.status];
                  return (
                    <div key={policy.id} className="rounded-xl border border-border p-4 flex items-center gap-4" style={{ background: 'var(--surface)' }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: days <= 30 ? 'rgba(244,63,94,0.12)' : 'rgba(245,158,11,0.12)' }}>
                        <RefreshCw size={16} style={{ color: days <= 30 ? '#f43f5e' : '#f59e0b' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{policy.insuranceType}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{policy.insuranceCompany} · {policy.hotel}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-semibold" style={{ color: days <= 30 ? '#f43f5e' : '#f59e0b' }}>{days}d until renewal</div>
                        <div className="text-xs text-muted-foreground">{new Date(policy.renewalDate).toLocaleDateString('en-GB')}</div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0" style={{ background: 'var(--primary)', color: '#000' }}>
                        <Bell size={11} /> Remind
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Policy Detail Modal */}
      {selectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setSelectedPolicy(null)}>
          <div className="rounded-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-auto" style={{ background: 'var(--surface)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-border">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'var(--surface3)', color: 'var(--text2)' }}>{selectedPolicy.policyNumber}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: STATUS_CONFIG[selectedPolicy.status].bg, color: STATUS_CONFIG[selectedPolicy.status].color }}>{STATUS_CONFIG[selectedPolicy.status].label}</span>
                </div>
                <h2 className="font-head font-bold text-lg">{selectedPolicy.insuranceType}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{selectedPolicy.insuranceCompany} · Broker: {selectedPolicy.broker}</p>
              </div>
              <button onClick={() => setSelectedPolicy(null)} className="text-muted-foreground hover:text-foreground text-xl font-bold px-2">×</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                ['Hotel', selectedPolicy.hotel], ['Coverage Amount', fmt(selectedPolicy.coverageAmount)],
                ['Annual Premium', fmt(selectedPolicy.annualPremium)], ['Excess Amount', fmt(selectedPolicy.excessAmount)],
                ['Start Date', new Date(selectedPolicy.startDate).toLocaleDateString('en-GB')],
                ['Expiry Date', new Date(selectedPolicy.expiryDate).toLocaleDateString('en-GB')],
                ['Renewal Date', new Date(selectedPolicy.renewalDate).toLocaleDateString('en-GB')],
                ['Responsible Manager', selectedPolicy.responsibleManager],
                ['Contact Person', selectedPolicy.contactPerson], ['Emergency Phone', selectedPolicy.emergencyPhone],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
            {selectedPolicy.notes && (
              <div className="px-6 pb-4">
                <div className="text-xs text-muted-foreground mb-1">Notes</div>
                <div className="text-sm p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>{selectedPolicy.notes}</div>
              </div>
            )}
            <div className="flex gap-2 p-6 pt-0">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#000' }}><Edit2 size={13} /> Edit Policy</button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}><Bell size={13} /> Set Reminder</button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}><FileText size={13} /> Documents</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Policy Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowAddModal(false)}>
          <div className="rounded-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-auto" style={{ background: 'var(--surface)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-head font-bold text-lg">Add Insurance Policy</h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground text-xl font-bold px-2">×</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                ['Policy Number', 'text'], ['Insurance Type', 'select-type'],
                ['Insurance Company', 'text'], ['Broker', 'text'],
                ['Hotel', 'select-hotel'], ['Coverage Amount (£)', 'number'],
                ['Annual Premium (£)', 'number'], ['Excess Amount (£)', 'number'],
                ['Start Date', 'date'], ['Expiry Date', 'date'],
                ['Renewal Date', 'date'], ['Responsible Manager', 'text'],
                ['Contact Person', 'text'], ['Emergency Phone', 'text'],
              ].map(([label, type]) => (
                <div key={label} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">{label}</label>
                  {type === 'select-type' ? (
                    <select className="rounded-lg border border-border px-3 py-2 text-sm outline-none" style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}>
                      {INSURANCE_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  ) : type === 'select-hotel' ? (
                    <select className="rounded-lg border border-border px-3 py-2 text-sm outline-none" style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}>
                      {HOTELS.map((h) => <option key={h}>{h}</option>)}
                    </select>
                  ) : (
                    <input type={type} className="rounded-lg border border-border px-3 py-2 text-sm outline-none" style={{ background: 'var(--surface2)', color: 'var(--foreground)' }} />
                  )}
                </div>
              ))}
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                <textarea rows={3} className="rounded-lg border border-border px-3 py-2 text-sm outline-none resize-none" style={{ background: 'var(--surface2)', color: 'var(--foreground)' }} />
              </div>
            </div>
            <div className="flex gap-2 p-6 pt-0">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#000' }}>Save Policy</button>
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium border border-border" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
