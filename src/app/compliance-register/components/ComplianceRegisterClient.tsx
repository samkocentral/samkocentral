'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, AlertTriangle, Clock, CheckCircle2, TrendingUp, Plus, Search, Download, Eye, Edit2, FileText, Bell, ChevronDown, Loader2, Trash2, X, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';
import CustomDropdown from '@/components/ui/CustomDropdown';
import StatusDropdown from '@/components/ui/StatusDropdown';
import { useDeepPageCms } from '@/lib/deepPageCms';
import PageCMSEditButton from '@/components/cms/PageCMSEditButton';
import LoadingPagination from '@/components/ui/LoadingPagination';
import { useLoadingPagination } from '@/hooks/useLoadingPagination';

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

const DEFAULT_HOTELS = [
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

function KPICard({ label, value, sub, color, icon: IconComponent }: { label: string; value: number | string; sub: string; color: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-border px-4 py-3.5 relative overflow-hidden" style={{ background: 'var(--surface)' }}>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 whitespace-nowrap truncate" title={label}>{label}</div>
          <div className="font-head font-bold text-2xl xl:text-[26px] tracking-tight whitespace-nowrap leading-tight truncate" style={{ color }}>{value}</div>
          <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap truncate">{sub}</div>
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
          <IconComponent size={16} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

export default function ComplianceRegisterClient() {
  const { isViewer, canEdit } = useAuth();
  const {
    title: cmsTitle,
    subtitle: cmsSubtitle,
    searchPlaceholder: cmsSearchPlaceholder,
    primaryActionLabel: cmsPrimaryActionLabel,
  } = useDeepPageCms('compliance');

  const [items, setItems] = useState<ComplianceItem[]>(MOCK_COMPLIANCE);
  const [propertyList, setPropertyList] = useState<string[]>(DEFAULT_HOTELS);
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams?.get('tab');
  const initialTab: 'register' | 'certifications' | 'statutory' | 'expiry' =
    tabParam === 'certifications' || tabParam === 'statutory' || tabParam === 'expiry' ? tabParam : 'register';

  const [activeTab, setActiveTab] = useState<'register' | 'certifications' | 'statutory' | 'expiry'>(initialTab);

  useEffect(() => {
    const t = searchParams?.get('tab');
    if (t === 'certifications' || t === 'statutory' || t === 'expiry') {
      setActiveTab(t);
    } else {
      setActiveTab('register');
    }
  }, [searchParams]);

  const handleTabChange = (t: 'register' | 'certifications' | 'statutory' | 'expiry') => {
    setActiveTab(t);
    const url = t === 'register' ? '/compliance-register' : `/compliance-register?tab=${t}`;
    router.push(url, { scroll: false });
  };
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterHotel, setFilterHotel] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ComplianceItem | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ComplianceItem | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ComplianceItem | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  // Add form state
  const [addForm, setAddForm] = useState({
    name: '',
    type: 'Statutory',
    category: 'Fire Risk Assessment',
    hotel: DEFAULT_HOTELS[0],
    department: 'Engineering',
    area: 'Whole Building',
    regulatoryAuthority: 'Fire & Rescue Service',
    certificateNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    renewalDate: new Date(Date.now() + 335 * 86400000).toISOString().split('T')[0],
    inspectionFrequency: 'Yearly',
    responsiblePerson: 'Marcus Webb',
    contractor: '',
    riskRating: 'medium' as RiskRating,
    status: 'compliant' as ComplianceStatus,
    notes: '',
  });

  const fetchCompliance = useCallback(async () => {
    try {
      setLoading(true);
      const [compRes, propsRes] = await Promise.allSettled([
        api.compliance.getAll(),
        api.properties.getAll(),
      ]);

      if (compRes.status === 'fulfilled' && compRes.value.success && compRes.value.data && compRes.value.data.length > 0) {
        setItems(compRes.value.data);
      }
      if (propsRes.status === 'fulfilled' && propsRes.value.success && propsRes.value.data && propsRes.value.data.length > 0) {
        setPropertyList(propsRes.value.data.map((p: any) => p.name));
      }
    } catch (err) {
      console.warn('Using local fallback compliance data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompliance();
    const handleDataChanged = () => {
      fetchCompliance();
    };
    window.addEventListener('samko:data-changed', handleDataChanged);
    return () => window.removeEventListener('samko:data-changed', handleDataChanged);
  }, [fetchCompliance]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus as ComplianceStatus } : item))
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'compliance', id, status: newStatus },
        })
      );
    }

    try {
      await api.compliance.update(id, { status: newStatus });
    } catch (err) {
      console.error('Failed to sync compliance status:', err);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const complianceId = `COMP-${String(items.length + 1).padStart(3, '0')}`;
    const payload = {
      ...addForm,
      complianceId,
      description: `${addForm.name} for ${addForm.hotel}`,
    };

    try {
      const res = await api.compliance.create(payload);
      const created = res.data || { ...payload, id: `comp-${Date.now()}` };
      setItems((prev) => [created, ...prev]);
      setShowAddModal(false);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'compliance' } }));
      }
    } catch (err: any) {
      alert(`Error saving compliance item: ${err.message}`);
    }
  };

  const handleOpenEdit = (item: ComplianceItem) => {
    setEditingItem({ ...item });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setSavingEdit(true);
    try {
      const updated = { ...editingItem };
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      if (selectedItem?.id === updated.id) {
        setSelectedItem(updated);
      }
      setShowEditModal(false);
      toast.success('Compliance updated', { description: `${updated.name} updated successfully` });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'compliance', id: updated.id } }));
      }
      await api.compliance.update(updated.id, updated);
    } catch (err: any) {
      toast.error('Failed to update compliance item');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete.id;
    setDeletingItem(true);
    try {
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      toast.success('Compliance item deleted', { description: `${itemToDelete.name} has been removed` });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'compliance', id } }));
      }
      await api.compliance.delete(id);
    } catch (err: any) {
      toast.error('Failed to delete compliance item');
    } finally {
      setDeletingItem(false);
      setItemToDelete(null);
    }
  };

  const totalItems = items.length;
  const expiringIn30 = items.filter((c) => { const d = daysUntil(c.expiryDate); return d >= 0 && d <= 30; }).length;
  const overdue = items.filter((c) => c.status === 'overdue').length;
  const compliant = items.filter((c) => c.status === 'compliant').length;
  const highRisk = items.filter((c) => c.riskRating === 'high' || c.riskRating === 'critical').length;

  const filtered = items.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.hotel.toLowerCase().includes(search.toLowerCase()) || c.complianceId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus.length === 0 || filterStatus.includes(c.status);
    const matchHotel = filterHotel.length === 0 || filterHotel.includes(c.hotel);
    const matchCat = filterCategory.length === 0 || filterCategory.includes(c.category);
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

  const {
    currentPage,
    pageSize,
    totalRecords,
    paginatedItems: paginatedCompliance,
    isPageLoading,
    changePage,
    changePageSize,
  } = useLoadingPagination(displayItems, 7);

  const handleExport = () => {
    const headers = ['Compliance ID', 'Name', 'Category', 'Type', 'Property', 'Authority', 'Certificate Number', 'Expiry Date', 'Status', 'Risk Rating'];
    const rows = displayItems.map((c: any) => [
      `"${c.complianceId || c.id}"`,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${c.category || ''}"`,
      `"${c.type || ''}"`,
      `"${c.hotel || ''}"`,
      `"${c.regulatoryAuthority || ''}"`,
      `"${c.certificateNumber || ''}"`,
      `"${c.expiryDate || ''}"`,
      `"${c.status || ''}"`,
      `"${c.riskRating || ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'compliance_register.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${displayItems.length} compliance items to CSV`);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between px-7 py-4 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-head font-bold text-xl">{cmsTitle || 'Compliance & Certification Register'}</h1>
            {loading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{cmsSubtitle || 'Manage statutory and internal compliance requirements'}</p>
        </div>
        <div className="flex items-center gap-2">
          <PageCMSEditButton pageId="compliance" pageName="Compliance Register" />

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-border hover:bg-surface2 transition-all active:scale-95 cursor-pointer"
            style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
          >
            <Download size={13} /> Export
          </button>
          {canEdit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95"
              style={{ background: 'var(--primary)', color: '#000' }}
            >
              <Plus size={14} /> {cmsPrimaryActionLabel || 'Add Compliance Item'}
            </button>
          )}
          {isViewer && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(148,163,184,0.12)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.25)' }}
            >
              L4 · Read-Only Access
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 px-6 pt-5 pb-4 flex-shrink-0" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
        <KPICard label="Total Items" value={totalItems} sub="All compliance items" color="#60a5fa" icon={ShieldCheck} />
        <KPICard label="Expiring in 30 Days" value={expiringIn30} sub="Requires attention" color="#f59e0b" icon={Clock} />
        <KPICard label="Overdue" value={overdue} sub="Immediate action needed" color="#f43f5e" icon={AlertTriangle} />
        <KPICard label="Compliant" value={compliant} sub="Up to date" color="#3dd68c" icon={CheckCircle2} />
        <KPICard label="High Risk" value={highRisk} sub="High & critical risk" color="#f97316" icon={TrendingUp} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 px-6 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as typeof activeTab)}
            className="px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer"
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
      <div className="flex items-center gap-3 px-6 py-2.5 border-b border-border flex-shrink-0 flex-wrap" style={{ background: 'var(--surface2)' }}>
        <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 flex-1 max-w-xs" style={{ background: 'var(--surface)' }}>
          <Search size={13} className="text-muted-foreground flex-shrink-0" />
          <input
            className="bg-transparent text-xs outline-none flex-1"
            placeholder="Search compliance, property, authority..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ color: 'var(--foreground)' }}
          />
        </div>
        <CustomDropdown
          label="All Statuses"
          value={filterStatus}
          multiple
          options={[
            { value: 'compliant', label: 'Compliant', color: '#3dd68c' },
            { value: 'expiring-soon', label: 'Expiring Soon', color: '#f59e0b' },
            { value: 'overdue', label: 'Overdue', color: '#f43f5e' },
            { value: 'pending', label: 'Pending', color: '#60a5fa' },
          ]}
          onChange={setFilterStatus}
        />
        <CustomDropdown
          label="All Properties"
          value={filterHotel}
          multiple
          options={propertyList.map((h) => ({ value: h, label: h }))}
          onChange={setFilterHotel}
        />
        <CustomDropdown
          label="All Categories"
          value={filterCategory}
          multiple
          align="right"
          options={COMPLIANCE_CATEGORIES.map((c) => ({ value: c, label: c }))}
          onChange={setFilterCategory}
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="rounded-xl border border-border overflow-x-auto shadow-sm" style={{ background: 'var(--surface)' }}>
          <table className="w-full text-left border-collapse" style={{ minWidth: 900 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['ID', 'Compliance Item', 'Category', 'Property', 'Department', 'Expiry Date', 'Days Left', 'Responsible', 'Risk', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedCompliance.map((item) => {
                const days = daysUntil(item.expiryDate);
                const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.compliant;
                const riskCfg = RISK_CONFIG[item.riskRating] || RISK_CONFIG.low;

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
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <StatusDropdown
                        value={item.status}
                        disabled={isViewer || !canEdit}
                        options={[
                          { value: 'compliant', label: 'Compliant', color: '#3dd68c', bg: 'rgba(61,214,140,0.12)' },
                          { value: 'expiring-soon', label: 'Expiring Soon', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
                          { value: 'overdue', label: 'Overdue', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
                          { value: 'pending', label: 'Pending', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
                        ]}
                        onChange={(val) => handleStatusChange(item.id, val)}
                      />
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <button
                          className="p-1.5 rounded-lg border border-border hover:bg-surface2 transition-colors"
                          style={{ color: 'var(--text2)' }}
                          title="View Details"
                          onClick={() => setSelectedItem(item)}
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg border border-border hover:bg-surface2 transition-colors text-muted-foreground hover:text-primary"
                          title="Edit Compliance Item"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/15 text-rose-400 transition-colors"
                          title="Delete Compliance Item"
                          onClick={() => setItemToDelete(item)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
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
          <LoadingPagination
            currentPage={currentPage}
            totalRecords={totalRecords}
            pageSize={pageSize}
            pageSizeOptions={[5, 7, 10, 20]}
            onPageChange={changePage}
            onPageSizeChange={changePageSize}
            isLoading={loading || isPageLoading}
            recordName="compliance items"
          />
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
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: STATUS_CONFIG[selectedItem.status]?.bg, color: STATUS_CONFIG[selectedItem.status]?.color }}>{STATUS_CONFIG[selectedItem.status]?.label}</span>
                </div>
                <h2 className="font-head font-bold text-lg">{selectedItem.name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{selectedItem.description}</p>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-muted-foreground hover:text-foreground text-xl font-bold px-2">×</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                ['Category', selectedItem.category], ['Type', selectedItem.type],
                ['Property', selectedItem.hotel], ['Department', selectedItem.department],
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
            <div className="flex items-center justify-between p-6 pt-0 border-t border-border mt-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(selectedItem)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-surface2 text-foreground transition-colors"
                  style={{ background: 'var(--surface2)' }}
                >
                  <Edit2 size={13} /> Edit Item
                </button>
                <button
                  type="button"
                  onClick={() => setItemToDelete(selectedItem)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-rose-500/30 hover:bg-rose-500/15 text-rose-400 transition-colors"
                >
                  <Trash2 size={13} /> Delete Item
                </button>
              </div>
              <button onClick={() => setSelectedItem(null)} className="px-5 py-2 rounded-lg text-xs font-semibold" style={{ background: 'var(--primary)', color: '#000' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowAddModal(false)}>
          <div className="rounded-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-auto" style={{ background: 'var(--surface)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-head font-bold text-lg">Add Compliance Item</h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground text-xl font-bold px-2">×</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Compliance Name</label>
                  <input
                    type="text"
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Type</label>
                  <select
                    value={addForm.type}
                    onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="Statutory">Statutory</option>
                    <option value="Internal">Internal</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <select
                    value={addForm.category}
                    onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {COMPLIANCE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Property</label>
                  <select
                    value={addForm.hotel}
                    onChange={(e) => setAddForm({ ...addForm, hotel: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {propertyList.map((h) => <option key={h}>{h}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Department</label>
                  <input
                    type="text"
                    value={addForm.department}
                    onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Area / Location</label>
                  <input
                    type="text"
                    value={addForm.area}
                    onChange={(e) => setAddForm({ ...addForm, area: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Regulatory Authority</label>
                  <input
                    type="text"
                    value={addForm.regulatoryAuthority}
                    onChange={(e) => setAddForm({ ...addForm, regulatoryAuthority: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Certificate Number</label>
                  <input
                    type="text"
                    value={addForm.certificateNumber}
                    onChange={(e) => setAddForm({ ...addForm, certificateNumber: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Issue Date</label>
                  <input
                    type="date"
                    value={addForm.issueDate}
                    onChange={(e) => setAddForm({ ...addForm, issueDate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Expiry Date</label>
                  <input
                    type="date"
                    value={addForm.expiryDate}
                    onChange={(e) => setAddForm({ ...addForm, expiryDate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Responsible Person</label>
                  <input
                    type="text"
                    value={addForm.responsiblePerson}
                    onChange={(e) => setAddForm({ ...addForm, responsiblePerson: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Risk Rating</label>
                  <select
                    value={addForm.riskRating}
                    onChange={(e) => setAddForm({ ...addForm, riskRating: e.target.value as RiskRating })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {['low', 'medium', 'high', 'critical'].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Initial Status</label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm({ ...addForm, status: e.target.value as ComplianceStatus })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {['compliant', 'expiring-soon', 'overdue', 'pending'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Notes</label>
                  <textarea
                    rows={2}
                    value={addForm.notes}
                    onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none resize-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>
              <div className="flex gap-2 p-6 pt-0 border-t border-border mt-2">
                <button type="submit" className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#000' }}>
                  Save Compliance Item
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium border border-border" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }} onClick={() => setShowEditModal(false)}>
          <div className="rounded-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-auto shadow-2xl animate-in zoom-in-95 duration-150" style={{ background: 'var(--surface)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border" style={{ background: 'var(--surface2)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}>
                  <Edit2 size={16} />
                </div>
                <div>
                  <h2 className="font-head font-bold text-base text-foreground">Edit Compliance Item</h2>
                  <p className="text-xs text-muted-foreground">{editingItem.complianceId} · Update compliance record dynamically</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-muted-foreground hover:text-foreground text-xl font-bold px-2">×</button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Compliance Name *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Type</label>
                  <select
                    value={editingItem.type}
                    onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="Statutory">Statutory</option>
                    <option value="Internal">Internal</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Category</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {COMPLIANCE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Property</label>
                  <select
                    value={editingItem.hotel}
                    onChange={(e) => setEditingItem({ ...editingItem, hotel: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {propertyList.map((h) => <option key={h}>{h}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Department</label>
                  <input
                    type="text"
                    value={editingItem.department}
                    onChange={(e) => setEditingItem({ ...editingItem, department: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Area / Location</label>
                  <input
                    type="text"
                    value={editingItem.area}
                    onChange={(e) => setEditingItem({ ...editingItem, area: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Regulatory Authority</label>
                  <input
                    type="text"
                    value={editingItem.regulatoryAuthority}
                    onChange={(e) => setEditingItem({ ...editingItem, regulatoryAuthority: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Certificate Number</label>
                  <input
                    type="text"
                    value={editingItem.certificateNumber || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, certificateNumber: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Responsible Person</label>
                  <input
                    type="text"
                    value={editingItem.responsiblePerson}
                    onChange={(e) => setEditingItem({ ...editingItem, responsiblePerson: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Contractor / Auditor</label>
                  <input
                    type="text"
                    value={editingItem.contractor || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, contractor: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Expiry Date</label>
                  <input
                    type="date"
                    value={editingItem.expiryDate}
                    onChange={(e) => setEditingItem({ ...editingItem, expiryDate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Renewal Date</label>
                  <input
                    type="date"
                    value={editingItem.renewalDate}
                    onChange={(e) => setEditingItem({ ...editingItem, renewalDate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Risk Rating</label>
                  <select
                    value={editingItem.riskRating}
                    onChange={(e) => setEditingItem({ ...editingItem, riskRating: e.target.value as RiskRating })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {['low', 'medium', 'high', 'critical'].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
                  <select
                    value={editingItem.status}
                    onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as ComplianceStatus })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {['compliant', 'expiring-soon', 'overdue', 'pending'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Notes</label>
                  <textarea
                    rows={2}
                    value={editingItem.notes || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none resize-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 pt-0 border-t border-border mt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium border border-border" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={savingEdit} className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#000' }}>
                  {savingEdit ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/20 text-rose-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-head font-bold text-base text-foreground">Confirm Deletion</h3>
                <p className="text-xs text-muted-foreground">{itemToDelete.complianceId}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground mb-5">
              Are you sure you want to permanently delete <strong className="text-foreground">{itemToDelete.name}</strong> from the compliance register? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-surface2 transition-colors"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingItem}
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                {deletingItem ? (
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
