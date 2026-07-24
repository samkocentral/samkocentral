'use client';

import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, Clock, CheckCircle2, TrendingUp, Plus, Search, Download, Eye, Edit2, FileText, Bell } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


type ComplianceStatus = 'compliant' | 'expiring-soon' | 'overdue' | 'pending';
type RiskRating = 'low' | 'medium' | 'high' | 'critical';

interface ComplianceItem {
  id: string;
  complianceId: string;
  name: string;
  type: string;
  category: string;
  description: string;
  hotel: string;
  department: string;
  area: string;
  relatedAsset?: string;
  regulatoryAuthority: string;
  certificateNumber?: string;
  issueDate: string;
  expiryDate: string;
  renewalDate: string;
  inspectionFrequency: string;
  responsiblePerson: string;
  contractor?: string;
  status: ComplianceStatus;
  riskRating: RiskRating;
  notes?: string;
}

const COMPLIANCE_CATEGORIES = [
  'Fire Risk Assessment', 'Fire Alarm Certificate', 'Emergency Lighting',
  'PAT Testing', 'Fixed Wire Testing', 'Gas Safety', 'Water Hygiene',
  'Legionella', 'Lift Inspection', 'Pressure Systems', 'Kitchen Extraction',
  'HVAC Certification', 'Asbestos Survey', 'Electrical Compliance',
  'Health & Safety', 'Food Hygiene', 'Environmental', 'Insurance Compliance',
  'Hotel Brand Standards', 'Local Authority Requirements',
];

const HOTELS = [
  'Crowne Plaza Kingston-south', 'Stanhill Court', 'Hampton 1 & 2', 'Ravens Ait Island',
  'River Club', 'Warren House', 'Gatwick Manor', 'Sharnbrook',
];

const MOCK_COMPLIANCE: ComplianceItem[] = [
  {
    id: '1', complianceId: 'COMP-001', name: 'Fire Risk Assessment', type: 'Statutory', category: 'Fire Risk Assessment',
    description: 'Annual fire risk assessment for the entire property', hotel: 'Crowne Plaza Kingston-south',
    department: 'Engineering', area: 'Whole Building', regulatoryAuthority: 'Fire & Rescue Service',
    certificateNumber: 'FRA-2024-001', issueDate: '2024-06-01', expiryDate: '2025-06-01',
    renewalDate: '2025-05-15', inspectionFrequency: 'Yearly', responsiblePerson: 'Marcus Webb',
    contractor: 'FireGuard Systems', status: 'overdue', riskRating: 'critical', notes: 'Renewal overdue — book immediately',
  },
  {
    id: '2', complianceId: 'COMP-002', name: 'Fire Alarm Certificate', type: 'Statutory', category: 'Fire Alarm Certificate',
    description: 'Annual fire alarm system inspection and certification', hotel: 'Crowne Plaza Kingston-south',
    department: 'Engineering', area: 'All Floors', regulatoryAuthority: 'BS 5839', certificateNumber: 'FAC-2025-002',
    issueDate: '2025-01-10', expiryDate: '2026-01-10', renewalDate: '2025-12-20',
    inspectionFrequency: 'Yearly', responsiblePerson: 'Marcus Webb', contractor: 'FireGuard Systems',
    status: 'compliant', riskRating: 'high',
  },
  {
    id: '3', complianceId: 'COMP-003', name: 'Gas Safety Certificate', type: 'Statutory', category: 'Gas Safety',
    description: 'Annual gas safety inspection for all gas appliances', hotel: 'Stanhill Court',
    department: 'Kitchen', area: 'Kitchen & Plant Room', regulatoryAuthority: 'Gas Safe Register',
    certificateNumber: 'GSC-2025-003', issueDate: '2025-03-01', expiryDate: '2026-03-01',
    renewalDate: '2026-02-15', inspectionFrequency: 'Yearly', responsiblePerson: 'Tom Bradley',
    contractor: 'City Gas Engineers', status: 'compliant', riskRating: 'high',
  },
  {
    id: '4', complianceId: 'COMP-004', name: 'Legionella Risk Assessment', type: 'Statutory', category: 'Legionella',
    description: 'Water hygiene and legionella risk assessment', hotel: 'Hampton 1 & 2',
    department: 'Engineering', area: 'Water Systems', regulatoryAuthority: 'HSE L8',
    certificateNumber: 'LEG-2025-004', issueDate: '2025-02-01', expiryDate: '2026-02-01',
    renewalDate: '2026-01-15', inspectionFrequency: 'Yearly', responsiblePerson: 'Priya Sharma',
    status: 'compliant', riskRating: 'high',
  },
  {
    id: '5', complianceId: 'COMP-005', name: 'PAT Testing', type: 'Internal', category: 'PAT Testing',
    description: 'Portable appliance testing for all electrical equipment', hotel: 'Ravents Ait Island',
    department: 'Engineering', area: 'All Areas', regulatoryAuthority: 'IET Code of Practice',
    issueDate: '2025-01-15', expiryDate: '2025-08-15', renewalDate: '2025-08-01',
    inspectionFrequency: 'Yearly', responsiblePerson: 'James Okafor',
    contractor: 'Apex Electrical', status: 'expiring-soon', riskRating: 'medium',
  },
  {
    id: '6', complianceId: 'COMP-006', name: 'EICR – Fixed Wire Testing', type: 'Statutory', category: 'Fixed Wire Testing',
    description: 'Electrical installation condition report', hotel: 'River Club',
    department: 'Engineering', area: 'Whole Building', regulatoryAuthority: 'BS 7671',
    certificateNumber: 'EICR-2021-006', issueDate: '2021-07-01', expiryDate: '2026-07-01',
    renewalDate: '2026-06-15', inspectionFrequency: '5 Yearly', responsiblePerson: 'Ewan McAllister',
    contractor: 'Apex Electrical', status: 'expiring-soon', riskRating: 'high',
  },
  {
    id: '7', complianceId: 'COMP-007', name: 'Food Hygiene Inspection', type: 'Statutory', category: 'Food Hygiene',
    description: 'Local authority food hygiene inspection', hotel: 'Stanhill Court',
    department: 'Restaurant', area: 'Kitchen', regulatoryAuthority: 'Local Authority EHO',
    certificateNumber: 'FH-2025-007', issueDate: '2025-03-22', expiryDate: '2028-03-22',
    renewalDate: '2028-03-01', inspectionFrequency: 'As Required', responsiblePerson: 'Isabelle Martin',
    status: 'compliant', riskRating: 'medium',
  },
  {
    id: '8', complianceId: 'COMP-008', name: 'Lift Inspection', type: 'Statutory', category: 'Lift Inspection',
    description: 'LOLER thorough examination of passenger lifts', hotel: 'Crowne Plaza Kingston-south',
    department: 'Engineering', area: 'Lifts', regulatoryAuthority: 'LOLER 1998',
    certificateNumber: 'LIFT-2025-008', issueDate: '2025-04-01', expiryDate: '2025-10-01',
    renewalDate: '2025-09-15', inspectionFrequency: '6 Monthly', responsiblePerson: 'Marcus Webb',
    contractor: 'Otis Elevators', status: 'expiring-soon', riskRating: 'critical',
  },
  {
    id: '9', complianceId: 'COMP-009', name: 'Asbestos Survey', type: 'Statutory', category: 'Asbestos Survey',
    description: 'Management asbestos survey and register', hotel: 'Hampton 1 & 2',
    department: 'Engineering', area: 'Whole Building', regulatoryAuthority: 'CAR 2012',
    certificateNumber: 'ASB-2023-009', issueDate: '2023-01-01', expiryDate: '2028-01-01',
    renewalDate: '2027-12-01', inspectionFrequency: '5 Yearly', responsiblePerson: 'Priya Sharma',
    status: 'compliant', riskRating: 'high',
  },
  {
    id: '10', complianceId: 'COMP-010', name: 'Health & Safety Policy Review', type: 'Internal', category: 'Health & Safety',
    description: 'Annual review and update of H&S policy', hotel: 'River Club',
    department: 'Management', area: 'All Areas', regulatoryAuthority: 'HSE',
    issueDate: '2025-11-01', expiryDate: '2026-11-01', renewalDate: '2026-10-15',
    inspectionFrequency: 'Yearly', responsiblePerson: 'Group Admin',
    status: 'compliant', riskRating: 'low',
  },
];

const STATUS_CONFIG: Record<ComplianceStatus, { label: string; bg: string; color: string; icon: React.ElementType }> = {
  compliant: { label: 'Compliant', bg: 'rgba(61,214,140,0.12)', color: '#3dd68c', icon: CheckCircle2 },
  'expiring-soon': { label: 'Expiring Soon', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', icon: Clock },
  overdue: { label: 'Overdue', bg: 'rgba(244,63,94,0.12)', color: '#f43f5e', icon: AlertTriangle },
  pending: { label: 'Pending', bg: 'rgba(96,165,250,0.12)', color: '#60a5fa', icon: Clock },
};

const RISK_CONFIG: Record<RiskRating, { bg: string; color: string }> = {
  low: { bg: 'rgba(61,214,140,0.12)', color: '#3dd68c' },
  medium: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  high: { bg: 'rgba(249,115,22,0.12)', color: '#f97316' },
  critical: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e' },
};

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date('2025-07-21');
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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

export default function ComplianceRegisterClient() {
  const [activeTab, setActiveTab] = useState<'register' | 'certifications' | 'statutory' | 'expiry'>('register');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterHotel, setFilterHotel] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ComplianceItem | null>(null);

  const totalItems = MOCK_COMPLIANCE.length;
  const expiringIn30 = MOCK_COMPLIANCE.filter((c) => { const d = daysUntil(c.expiryDate); return d >= 0 && d <= 30; }).length;
  const overdue = MOCK_COMPLIANCE.filter((c) => c.status === 'overdue').length;
  const compliant = MOCK_COMPLIANCE.filter((c) => c.status === 'compliant').length;
  const highRisk = MOCK_COMPLIANCE.filter((c) => c.riskRating === 'high' || c.riskRating === 'critical').length;

  const filtered = MOCK_COMPLIANCE.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.hotel.toLowerCase().includes(search.toLowerCase()) || c.complianceId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchHotel = filterHotel === 'all' || c.hotel === filterHotel;
    const matchCat = filterCategory === 'all' || c.category === filterCategory;
    return matchSearch && matchStatus && matchHotel && matchCat;
  });

  const tabs = [
    { id: 'register', label: 'Compliance Register' },
    { id: 'certifications', label: 'Certifications' },
    { id: 'statutory', label: 'Statutory Inspections' },
    { id: 'expiry', label: 'Expiry Dashboard' },
  ];

  const displayItems = activeTab === 'certifications'
    ? filtered.filter((c) => c.certificateNumber)
    : activeTab === 'statutory'
    ? filtered.filter((c) => c.type === 'Statutory')
    : activeTab === 'expiry'
    ? [...filtered].sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate))
    : filtered;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between px-7 py-4 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <div>
          <h1 className="font-head font-bold text-xl">Compliance & Certification Register</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage statutory and internal compliance requirements</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-border" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
            <Download size={13} /> Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--primary)', color: '#000' }}
          >
            <Plus size={14} /> Add Compliance Item
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 px-7 pt-5 pb-4 flex-shrink-0" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <KPICard label="Total Items" value={totalItems} sub="All compliance items" color="#60a5fa" icon={ShieldCheck} />
        <KPICard label="Expiring in 30 Days" value={expiringIn30} sub="Requires attention" color="#f59e0b" icon={Clock} />
        <KPICard label="Overdue" value={overdue} sub="Immediate action needed" color="#f43f5e" icon={AlertTriangle} />
        <KPICard label="Compliant" value={compliant} sub="Up to date" color="#3dd68c" icon={CheckCircle2} />
        <KPICard label="High Risk" value={highRisk} sub="High & critical risk" color="#f97316" icon={TrendingUp} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 px-7 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className="px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap"
            style={{
              borderColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text2)',
              background: 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-7 py-3 border-b border-border flex-shrink-0" style={{ background: 'var(--surface2)' }}>
        <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 flex-1 max-w-xs" style={{ background: 'var(--surface)' }}>
          <Search size={13} className="text-muted-foreground flex-shrink-0" />
          <input
            className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground"
            placeholder="Search compliance items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border border-border px-3 py-1.5 text-sm outline-none"
          style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="compliant">Compliant</option>
          <option value="expiring-soon">Expiring Soon</option>
          <option value="overdue">Overdue</option>
          <option value="pending">Pending</option>
        </select>
        <select
          className="rounded-lg border border-border px-3 py-1.5 text-sm outline-none"
          style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
          value={filterHotel}
          onChange={(e) => setFilterHotel(e.target.value)}
        >
          <option value="all">All Hotels</option>
          {HOTELS.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
        <select
          className="rounded-lg border border-border px-3 py-1.5 text-sm outline-none"
          style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {COMPLIANCE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-xs text-muted-foreground ml-auto">{displayItems.length} items</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-7 py-4">
        <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--surface)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['ID', 'Compliance Item', 'Category', 'Hotel', 'Department', 'Expiry Date', 'Days Left', 'Responsible', 'Risk', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayItems.map((item) => {
                const days = daysUntil(item.expiryDate);
                const statusCfg = STATUS_CONFIG[item.status];
                const riskCfg = RISK_CONFIG[item.riskRating];
                const StatusIcon = statusCfg.icon;
                return (
                  <tr
                    key={item.id}
                    className="border-t border-border cursor-pointer transition-colors"
                    style={{ background: 'transparent' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => setSelectedItem(item)}
                  >
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">{item.complianceId}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.type}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--surface3)', color: 'var(--text2)' }}>{item.category}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{item.hotel}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{item.department}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{new Date(item.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap" style={{ color: days < 0 ? '#f43f5e' : days <= 30 ? '#f59e0b' : days <= 90 ? '#f97316' : '#3dd68c' }}>
                      {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{item.responsiblePerson}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: riskCfg.bg, color: riskCfg.color }}>{item.riskRating}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full w-fit" style={{ background: statusCfg.bg, color: statusCfg.color }}>
                        <StatusIcon size={10} />{statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text2)' }} onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}>
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {displayItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ShieldCheck size={32} className="mb-3 opacity-30" />
              <p className="text-sm">No compliance items found</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setSelectedItem(null)}>
          <div className="rounded-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-auto" style={{ background: 'var(--surface)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-border">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'var(--surface3)', color: 'var(--text2)' }}>{selectedItem.complianceId}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: STATUS_CONFIG[selectedItem.status].bg, color: STATUS_CONFIG[selectedItem.status].color }}>{STATUS_CONFIG[selectedItem.status].label}</span>
                </div>
                <h2 className="font-head font-bold text-lg">{selectedItem.name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{selectedItem.description}</p>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-muted-foreground hover:text-foreground text-xl font-bold px-2">×</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                ['Category', selectedItem.category], ['Type', selectedItem.type],
                ['Hotel', selectedItem.hotel], ['Department', selectedItem.department],
                ['Area', selectedItem.area], ['Regulatory Authority', selectedItem.regulatoryAuthority],
                ['Certificate Number', selectedItem.certificateNumber || '—'], ['Issue Date', new Date(selectedItem.issueDate).toLocaleDateString('en-GB')],
                ['Expiry Date', new Date(selectedItem.expiryDate).toLocaleDateString('en-GB')], ['Renewal Date', new Date(selectedItem.renewalDate).toLocaleDateString('en-GB')],
                ['Inspection Frequency', selectedItem.inspectionFrequency], ['Responsible Person', selectedItem.responsiblePerson],
                ['Contractor', selectedItem.contractor || '—'], ['Risk Rating', selectedItem.riskRating],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium capitalize">{value}</span>
                </div>
              ))}
            </div>
            {selectedItem.notes && (
              <div className="px-6 pb-4">
                <div className="text-xs text-muted-foreground mb-1">Notes</div>
                <div className="text-sm p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>{selectedItem.notes}</div>
              </div>
            )}
            <div className="flex gap-2 p-6 pt-0">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#000' }}>
                <Edit2 size={13} /> Edit Record
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
                <Bell size={13} /> Set Reminder
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
                <FileText size={13} /> Documents
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowAddModal(false)}>
          <div className="rounded-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-auto" style={{ background: 'var(--surface)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-head font-bold text-lg">Add Compliance Item</h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground text-xl font-bold px-2">×</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                ['Compliance Name', 'text'], ['Compliance Type', 'text'],
                ['Category', 'select-category'], ['Hotel', 'select-hotel'],
                ['Department', 'text'], ['Area', 'text'],
                ['Regulatory Authority', 'text'], ['Certificate Number', 'text'],
                ['Issue Date', 'date'], ['Expiry Date', 'date'],
                ['Renewal Date', 'date'], ['Inspection Frequency', 'text'],
                ['Responsible Person', 'text'], ['Contractor', 'text'],
                ['Risk Rating', 'select-risk'], ['Status', 'select-status'],
              ].map(([label, type]) => (
                <div key={label} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">{label}</label>
                  {type === 'select-category' ? (
                    <select className="rounded-lg border border-border px-3 py-2 text-sm outline-none" style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}>
                      {COMPLIANCE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  ) : type === 'select-hotel' ? (
                    <select className="rounded-lg border border-border px-3 py-2 text-sm outline-none" style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}>
                      {HOTELS.map((h) => <option key={h}>{h}</option>)}
                    </select>
                  ) : type === 'select-risk' ? (
                    <select className="rounded-lg border border-border px-3 py-2 text-sm outline-none" style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}>
                      {['low', 'medium', 'high', 'critical'].map((r) => <option key={r}>{r}</option>)}
                    </select>
                  ) : type === 'select-status' ? (
                    <select className="rounded-lg border border-border px-3 py-2 text-sm outline-none" style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}>
                      {['compliant', 'expiring-soon', 'overdue', 'pending'].map((s) => <option key={s}>{s}</option>)}
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
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#000' }}>
                Save Compliance Item
              </button>
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium border border-border" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
