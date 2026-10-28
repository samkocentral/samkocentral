'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Shield, AlertTriangle, Clock, CheckCircle2, TrendingUp,
  Plus, Search, Download, Eye, Edit2, FileText, Bell, Phone, RefreshCw, ChevronDown, Loader2,
  Trash2, X, Check
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { useDeepPageCms } from '@/lib/deepPageCms';
import PageCMSEditButton from '@/components/cms/PageCMSEditButton';

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

const DEFAULT_HOTELS = [
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
  open: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e' },
  'in-progress': { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  settled: { bg: 'rgba(61,214,140,0.12)', color: '#3dd68c' },
  rejected: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
};

function daysUntil(dateStr?: string): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function fmt(n: number | undefined | null): string {
  if (typeof n !== 'number' || isNaN(n)) return '£0';
  if (n >= 1000000) return `£${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `£${(n / 1000).toFixed(0)}k`;
  return `£${n.toLocaleString('en-GB')}`;
}

function formatDateSafe(dStr?: string): string {
  if (!dStr) return '—';
  const d = new Date(dStr);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB');
}

function normalizePolicy(item: any): InsurancePolicy {
  let coverageNum = 0;
  if (typeof item.coverageAmount === 'number' && !isNaN(item.coverageAmount)) {
    coverageNum = item.coverageAmount;
  } else if (typeof item.coverage === 'number' && !isNaN(item.coverage)) {
    coverageNum = item.coverage;
  } else if (typeof item.coverage === 'string') {
    coverageNum = parseFloat(item.coverage.replace(/[^0-9.]/g, '')) || 0;
  } else if (typeof item.coverageAmount === 'string') {
    coverageNum = parseFloat(item.coverageAmount.replace(/[^0-9.]/g, '')) || 0;
  }

  let premiumNum = 0;
  if (typeof item.annualPremium === 'number' && !isNaN(item.annualPremium)) {
    premiumNum = item.annualPremium;
  } else if (typeof item.annualPremium === 'string') {
    premiumNum = parseFloat(item.annualPremium.replace(/[^0-9.]/g, '')) || 0;
  } else if (typeof item.premium === 'number' && !isNaN(item.premium)) {
    premiumNum = item.premium;
  } else if (typeof item.premium === 'string') {
    premiumNum = parseFloat(item.premium.replace(/[^0-9.]/g, '')) || 0;
  }

  let excessNum = 2500;
  if (typeof item.excessAmount === 'number' && !isNaN(item.excessAmount)) {
    excessNum = item.excessAmount;
  } else if (typeof item.excessAmount === 'string') {
    excessNum = parseFloat(item.excessAmount.replace(/[^0-9.]/g, '')) || 2500;
  } else if (typeof item.excess === 'number' && !isNaN(item.excess)) {
    excessNum = item.excess;
  }

  const hotelName = item.hotel || item.property || 'Crowne Plaza Kingston-south';
  const companyName = item.insuranceCompany || item.company || 'Aviva UK';
  const managerName = item.responsibleManager || item.manager || 'Marcus Webb';
  const expiry = item.expiryDate || item.expiry || '2026-12-31';

  const expiryDateObj = new Date(expiry);
  const isValidExpiry = !isNaN(expiryDateObj.getTime());
  const startDateStr = item.startDate && !isNaN(new Date(item.startDate).getTime())
    ? item.startDate
    : (isValidExpiry ? new Date(expiryDateObj.getTime() - 365 * 86400000).toISOString().split('T')[0] : '2026-01-01');
  const renewalDateStr = item.renewalDate && !isNaN(new Date(item.renewalDate).getTime())
    ? item.renewalDate
    : (isValidExpiry ? new Date(expiryDateObj.getTime() - 30 * 86400000).toISOString().split('T')[0] : '2026-11-30');

  return {
    id: String(item.id || item.policyNumber || Math.random()),
    policyNumber: item.policyNumber || 'POL-2026-001',
    insuranceType: item.insuranceType || item.type || 'Property & Buildings',
    insuranceCompany: companyName,
    broker: item.broker || 'Marsh UK',
    hotel: hotelName,
    coverageAmount: coverageNum,
    annualPremium: premiumNum,
    startDate: startDateStr,
    expiryDate: expiry,
    renewalDate: renewalDateStr,
    excessAmount: excessNum,
    responsibleManager: managerName,
    contactPerson: item.contactPerson || 'Sarah Thompson',
    emergencyPhone: item.emergencyPhone || '+44 800 123 4567',
    status: (item.status as PolicyStatus) || 'active',
    notes: item.notes || '',
  };
}

export default function InsuranceRegisterClient() {
  const { isViewer, canEdit } = useAuth();
  const {
    title: cmsTitle,
    subtitle: cmsSubtitle,
    searchPlaceholder: cmsSearchPlaceholder,
    primaryActionLabel: cmsPrimaryActionLabel,
  } = useDeepPageCms('insurance');

  const [policies, setPolicies] = useState<InsurancePolicy[]>(MOCK_POLICIES.map(normalizePolicy));
  const [propertyList, setPropertyList] = useState<string[]>(DEFAULT_HOTELS);
  const [claims, setClaims] = useState<Claim[]>(MOCK_CLAIMS);
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams?.get('tab');
  const initialTab: 'register' | 'claims' | 'renewals' = tabParam === 'claims' || tabParam === 'renewals' ? tabParam : 'register';

  const [activeTab, setActiveTab] = useState<'register' | 'claims' | 'renewals'>(initialTab);

  useEffect(() => {
    const t = searchParams?.get('tab');
    if (t === 'claims' || t === 'renewals') {
      setActiveTab(t);
    } else {
      setActiveTab('register');
    }
  }, [searchParams]);

  const handleTabChange = (t: 'register' | 'claims' | 'renewals') => {
    setActiveTab(t);
    const url = t === 'register' ? '/insurance-register' : `/insurance-register?tab=${t}`;
    router.push(url, { scroll: false });
  };
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterHotel, setFilterHotel] = useState<string[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<InsurancePolicy | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<InsurancePolicy | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<InsurancePolicy | null>(null);
  const [deletingPolicy, setDeletingPolicy] = useState(false);

  // Claims management state
  const [showLogClaimModal, setShowLogClaimModal] = useState(false);
  const [showEditClaimModal, setShowEditClaimModal] = useState(false);
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
  const [claimToDelete, setClaimToDelete] = useState<Claim | null>(null);
  const [savingClaim, setSavingClaim] = useState(false);
  const [deletingClaim, setDeletingClaim] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  const [claimForm, setClaimForm] = useState({
    policyNumber: '',
    hotel: DEFAULT_HOTELS[0],
    claimDate: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    status: 'open' as 'open' | 'in-progress' | 'settled' | 'rejected',
  });

  // Add form state
  const [addForm, setAddForm] = useState({
    policyNumber: '',
    insuranceType: 'Building Insurance',
    insuranceCompany: '',
    broker: '',
    hotel: DEFAULT_HOTELS[0],
    coverageAmount: 1000000,
    annualPremium: 10000,
    excessAmount: 1000,
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    renewalDate: new Date(Date.now() + 335 * 86400000).toISOString().split('T')[0],
    responsibleManager: 'Marcus Webb',
    contactPerson: '',
    emergencyPhone: '',
    status: 'active' as PolicyStatus,
    notes: '',
  });

  const fetchInsurance = useCallback(async () => {
    try {
      setLoading(true);
      const [insRes, propsRes, claimsRes] = await Promise.allSettled([
        api.insurance.getAll(),
        api.properties.getAll(),
        api.claims.getAll(),
      ]);

      if (insRes.status === 'fulfilled' && insRes.value.success && insRes.value.data && insRes.value.data.length > 0) {
        setPolicies(insRes.value.data.map(normalizePolicy));
      }
      if (propsRes.status === 'fulfilled' && propsRes.value.success && propsRes.value.data && propsRes.value.data.length > 0) {
        setPropertyList(propsRes.value.data.map((p: any) => p.name));
      }
      if (claimsRes.status === 'fulfilled' && claimsRes.value.success && claimsRes.value.data && claimsRes.value.data.length > 0) {
        setClaims(claimsRes.value.data);
      }
    } catch (err) {
      console.warn('Using local fallback insurance data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsurance();
    const handleDataChanged = () => {
      fetchInsurance();
    };
    window.addEventListener('samko:data-changed', handleDataChanged);
    return () => window.removeEventListener('samko:data-changed', handleDataChanged);
  }, [fetchInsurance]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus as PolicyStatus } : p))
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'insurance', id, status: newStatus },
        })
      );
    }

    try {
      await api.insurance.update(id, { status: newStatus });
    } catch (err) {
      console.error('Failed to sync insurance status:', err);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...addForm,
      coverageAmount: Number(addForm.coverageAmount),
      annualPremium: Number(addForm.annualPremium),
      excessAmount: Number(addForm.excessAmount),
    };

    try {
      const res = await api.insurance.create(payload);
      const created = normalizePolicy(res.data || { ...payload, id: `ins-${Date.now()}` });
      setPolicies((prev) => [created, ...prev]);
      setShowAddModal(false);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'insurance' } }));
      }
    } catch (err: any) {
      alert(`Error saving insurance policy: ${err.message}`);
    }
  };

  const handleOpenEdit = (policy: InsurancePolicy) => {
    setEditingPolicy({ ...policy });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;
    setSavingEdit(true);
    try {
      const updated = normalizePolicy({
        ...editingPolicy,
        coverageAmount: Number(editingPolicy.coverageAmount),
        annualPremium: Number(editingPolicy.annualPremium),
        excessAmount: Number(editingPolicy.excessAmount),
      });
      setPolicies((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (selectedPolicy?.id === updated.id) {
        setSelectedPolicy(updated);
      }
      setShowEditModal(false);
      toast.success('Policy updated', { description: `${updated.policyNumber} updated successfully` });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'insurance', id: updated.id } }));
      }
      await api.insurance.update(updated.id, updated);
    } catch (err: any) {
      toast.error('Failed to update insurance policy');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!policyToDelete) return;
    const id = policyToDelete.id;
    setDeletingPolicy(true);
    try {
      setPolicies((prev) => prev.filter((p) => p.id !== id));
      if (selectedPolicy?.id === id) {
        setSelectedPolicy(null);
      }
      toast.success('Policy deleted', { description: `${policyToDelete.policyNumber} has been removed` });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'insurance', id } }));
      }
      await api.insurance.delete(id);
    } catch (err: any) {
      toast.error('Failed to delete insurance policy');
    } finally {
      setDeletingPolicy(false);
      setPolicyToDelete(null);
    }
  };

  const handleExport = () => {
    let csvContent = '';
    let filename = '';
    if (activeTab === 'register') {
      filename = 'insurance_policies.csv';
      const headers = ['Policy Number', 'Insurance Type', 'Company', 'Property', 'Coverage Amount', 'Annual Premium', 'Expiry Date', 'Status'];
      const rows = filtered.map((p) => [
        `"${p.policyNumber}"`,
        `"${p.insuranceType}"`,
        `"${p.insuranceCompany}"`,
        `"${p.hotel}"`,
        p.coverageAmount,
        p.annualPremium,
        `"${p.expiryDate}"`,
        `"${p.status}"`,
      ]);
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (activeTab === 'claims') {
      filename = 'insurance_claims.csv';
      const headers = ['Policy Number', 'Property', 'Claim Date', 'Description', 'Amount', 'Status'];
      const rows = claims.map((c) => [
        `"${c.policyNumber}"`,
        `"${c.hotel}"`,
        `"${c.claimDate}"`,
        `"${c.description.replace(/"/g, '""')}"`,
        c.amount,
        `"${c.status}"`,
      ]);
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else {
      filename = 'insurance_renewals.csv';
      const headers = ['Policy Number', 'Insurance Type', 'Company', 'Property', 'Renewal Date', 'Days Left', 'Status'];
      const rows = renewalsDue.map((p) => [
        `"${p.policyNumber}"`,
        `"${p.insuranceType}"`,
        `"${p.insuranceCompany}"`,
        `"${p.hotel}"`,
        `"${p.renewalDate}"`,
        daysUntil(p.renewalDate),
        `"${p.status}"`,
      ]);
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filename}`);
  };

  const handleScheduleReminder = (policy: InsurancePolicy) => {
    const days = daysUntil(policy.renewalDate);
    toast.success(`Reminder scheduled for ${policy.insuranceType} (${days > 0 ? `${days} days before renewal` : 'due immediately'})`);
  };

  const handleLogClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimForm.description.trim()) {
      toast.error('Claim description is required');
      return;
    }
    setSavingClaim(true);
    const polNum = claimForm.policyNumber || policies[0]?.policyNumber || 'POL-2025-001';
    const matchingPol = policies.find((p) => p.policyNumber === polNum);
    const payload = {
      ...claimForm,
      policyNumber: polNum,
      policyId: matchingPol?.id || '1',
      hotel: claimForm.hotel || matchingPol?.hotel || propertyList[0] || 'Crowne Plaza Kingston-south',
      property: claimForm.hotel || matchingPol?.hotel || propertyList[0] || 'Crowne Plaza Kingston-south',
      amount: Number(claimForm.amount) || 0,
    };
    try {
      const res = await api.claims.create(payload);
      const created = res.data || { ...payload, id: `c-${Date.now()}` };
      setClaims((prev) => [created, ...prev]);
      setShowLogClaimModal(false);
      toast.success('Claim logged successfully');
      setClaimForm({
        policyNumber: '',
        hotel: propertyList[0] || DEFAULT_HOTELS[0],
        claimDate: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        status: 'open',
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'claims' } }));
      }
    } catch (err: any) {
      toast.error('Failed to log claim');
    } finally {
      setSavingClaim(false);
    }
  };

  const handleOpenEditClaim = (c: Claim) => {
    setEditingClaim({ ...c });
    setShowEditClaimModal(true);
  };

  const handleSaveEditClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClaim) return;
    setSavingClaim(true);
    try {
      const updated = {
        ...editingClaim,
        amount: Number(editingClaim.amount) || 0,
      };
      setClaims((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (selectedClaim?.id === updated.id) {
        setSelectedClaim(updated);
      }
      setShowEditClaimModal(false);
      toast.success('Claim updated successfully');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'claims', id: updated.id } }));
      }
      await api.claims.update(updated.id, updated);
    } catch (err: any) {
      toast.error('Failed to update claim');
    } finally {
      setSavingClaim(false);
    }
  };

  const handleDeleteClaim = async () => {
    if (!claimToDelete) return;
    const id = claimToDelete.id;
    setDeletingClaim(true);
    try {
      setClaims((prev) => prev.filter((c) => c.id !== id));
      if (selectedClaim?.id === id) {
        setSelectedClaim(null);
      }
      toast.success('Claim deleted successfully');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'claims', id } }));
      }
      await api.claims.delete(id);
    } catch (err: any) {
      toast.error('Failed to delete claim');
    } finally {
      setDeletingClaim(false);
      setClaimToDelete(null);
    }
  };

  const handleClaimStatusChange = async (id: string, newStatus: string) => {
    setClaims((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus as any } : c)));
    toast.success(`Claim status updated to ${newStatus}`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'claims', id, status: newStatus } }));
    }
    try {
      await api.claims.update(id, { status: newStatus });
    } catch (err) {
      console.warn('Updated claim locally:', err);
    }
  };

  const totalCoverage = policies.reduce((s, p) => s + (p.coverageAmount || 0), 0);
  const totalPremium = policies.reduce((s, p) => s + (p.annualPremium || 0), 0);
  const expiringSoon = policies.filter((p) => { const d = daysUntil(p.expiryDate); return d >= 0 && d <= 30; }).length;
  const expiredCount = policies.filter((p) => p.status === 'expired').length;

  const filtered = policies.filter((p) => {
    const matchSearch = !search || p.policyNumber.toLowerCase().includes(search.toLowerCase()) || p.insuranceCompany.toLowerCase().includes(search.toLowerCase()) || p.hotel.toLowerCase().includes(search.toLowerCase()) || p.insuranceType.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType.length === 0 || filterType.includes(p.insuranceType);
    const matchHotel = filterHotel.length === 0 || filterHotel.includes(p.hotel);
    return matchSearch && matchType && matchHotel;
  });

  const renewalsDue = policies.filter((p) => {
    const d = daysUntil(p.renewalDate);
    return d >= 0 && d <= 90;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between px-7 py-4 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-head font-bold text-xl">{cmsTitle || 'Insurance Management'}</h1>
            {loading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{cmsSubtitle || 'Manage insurance policies, coverage, premiums, claims, and renewals'}</p>
        </div>
        <div className="flex items-center gap-2">
          <PageCMSEditButton pageId="insurance" pageName="Insurance Register" />

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
              <Plus size={14} /> {cmsPrimaryActionLabel || 'Add Policy'}
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
        <div className="rounded-xl border border-border px-4 py-3.5 relative overflow-hidden" style={{ background: 'var(--surface)' }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#60a5fa' }} />
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 whitespace-nowrap truncate" title="Total Coverage">Total Coverage</div>
          <div className="font-head font-bold text-2xl xl:text-[26px] tracking-tight whitespace-nowrap leading-tight" style={{ color: '#60a5fa' }}>{fmt(totalCoverage)}</div>
          <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap truncate">Across all properties</div>
        </div>
        <div className="rounded-xl border border-border px-4 py-3.5 relative overflow-hidden" style={{ background: 'var(--surface)' }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#3dd68c' }} />
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 whitespace-nowrap truncate" title="Annual Premium">Annual Premium</div>
          <div className="font-head font-bold text-2xl xl:text-[26px] tracking-tight whitespace-nowrap leading-tight" style={{ color: '#3dd68c' }}>{fmt(totalPremium)}</div>
          <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap truncate">Annual portfolio spend</div>
        </div>
        <div className="rounded-xl border border-border px-4 py-3.5 relative overflow-hidden" style={{ background: 'var(--surface)' }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#f59e0b' }} />
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 whitespace-nowrap truncate" title="Expiring in 30 Days">Expiring in 30 Days</div>
          <div className="font-head font-bold text-2xl xl:text-[26px] tracking-tight whitespace-nowrap leading-tight" style={{ color: '#f59e0b' }}>{expiringSoon}</div>
          <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap truncate">Renewal required</div>
        </div>
        <div className="rounded-xl border border-border px-4 py-3.5 relative overflow-hidden" style={{ background: 'var(--surface)' }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#f43f5e' }} />
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 whitespace-nowrap truncate" title="Expired Policies">Expired Policies</div>
          <div className="font-head font-bold text-2xl xl:text-[26px] tracking-tight whitespace-nowrap leading-tight" style={{ color: '#f43f5e' }}>{expiredCount}</div>
          <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap truncate">Immediate action</div>
        </div>
        <div className="rounded-xl border border-border px-4 py-3.5 relative overflow-hidden" style={{ background: 'var(--surface)' }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#a78bfa' }} />
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 whitespace-nowrap truncate" title="Active Claims">Active Claims</div>
          <div className="font-head font-bold text-2xl xl:text-[26px] tracking-tight whitespace-nowrap leading-tight" style={{ color: '#a78bfa' }}>{claims.filter((c) => c.status !== 'settled' && c.status !== 'rejected').length}</div>
          <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap truncate">Open & in-progress</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 px-6 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        {[
          { id: 'register', label: 'Policy Register', count: policies.length },
          { id: 'claims', label: 'Claims Register', count: claims.length },
          { id: 'renewals', label: 'Renewals Due', count: renewalsDue.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as typeof activeTab)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer"
            style={{
              borderColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text2)',
              background: 'transparent',
            }}
          >
            {tab.label}
            <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {activeTab === 'register' && (
          <>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 flex-1 max-w-xs" style={{ background: 'var(--surface)' }}>
                <Search size={13} className="text-muted-foreground flex-shrink-0" />
                <input
                  className="bg-transparent text-xs outline-none flex-1"
                  placeholder="Search policies, company, property..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ color: 'var(--foreground)' }}
                />
              </div>
              <CustomDropdown
                label="All Insurance Types"
                value={filterType}
                multiple
                options={INSURANCE_TYPES.map((t) => ({ value: t, label: t }))}
                onChange={setFilterType}
              />
              <CustomDropdown
                label="All Properties"
                value={filterHotel}
                multiple
                options={propertyList.map((h) => ({ value: h, label: h }))}
                onChange={setFilterHotel}
              />
              <span className="text-xs text-muted-foreground ml-auto">{filtered.length} policies</span>
            </div>
            <div className="rounded-xl border border-border overflow-x-auto shadow-sm" style={{ background: 'var(--surface)' }}>
              <table className="w-full text-left border-collapse" style={{ minWidth: 900 }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)' }}>
                    {['Policy No.', 'Insurance Type', 'Company', 'Property', 'Coverage', 'Annual Premium', 'Expiry Date', 'Days Left', 'Manager', 'Status', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((policy) => {
                    const days = daysUntil(policy.expiryDate);
                    const sc = STATUS_CONFIG[policy.status] || STATUS_CONFIG.active;
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
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {/* Dynamic interactive Status dropdown */}
                          <div className="relative inline-block">
                            <select
                              disabled={isViewer}
                              value={policy.status}
                              onChange={(e) => handleStatusChange(policy.id, e.target.value)}
                              className={`appearance-none ${isViewer ? 'cursor-default opacity-85' : 'cursor-pointer'} pl-4 pr-6 py-1 rounded-full text-xs font-semibold outline-none transition-all capitalize`}
                              title={isViewer ? 'Read-only access (L4 Viewer)' : 'Change status'}
                              style={{
                                background: sc.bg,
                                color: sc.color,
                                border: `1px solid ${sc.color}33`,
                              }}
                            >
                              <option value="active" style={{ background: '#18181b', color: '#3dd68c' }}>Active</option>
                              <option value="expiring-soon" style={{ background: '#18181b', color: '#f59e0b' }}>Expiring Soon</option>
                              <option value="expired" style={{ background: '#18181b', color: '#f43f5e' }}>Expired</option>
                              <option value="pending-renewal" style={{ background: '#18181b', color: '#60a5fa' }}>Pending Renewal</option>
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
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <button
                              className="p-1.5 rounded-lg border border-border hover:bg-surface2 transition-colors"
                              style={{ color: 'var(--text2)' }}
                              title="View Details"
                              onClick={() => setSelectedPolicy(policy)}
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              className="p-1.5 rounded-lg border border-border hover:bg-surface2 transition-colors text-muted-foreground hover:text-primary"
                              title="Edit Policy"
                              onClick={() => handleOpenEdit(policy)}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              className="p-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/15 text-rose-400 transition-colors"
                              title="Delete Policy"
                              onClick={() => setPolicyToDelete(policy)}
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
            </div>
          </>
        )}

        {activeTab === 'claims' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="font-head font-bold text-sm">{claims.length} Claims</div>
              {canEdit ? (
                <button
                  onClick={() => setShowLogClaimModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95 cursor-pointer"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  <Plus size={14} /> Log Claim
                </button>
              ) : isViewer ? (
                <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-surface2">Read-Only</span>
              ) : null}
            </div>
            <div className="rounded-xl border border-border overflow-x-auto shadow-sm" style={{ background: 'var(--surface)' }}>
              <table className="w-full text-left border-collapse" style={{ minWidth: 800 }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)' }}>
                    {['Policy Number', 'Property', 'Claim Date', 'Description', 'Amount', 'Status', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => {
                    const cs = CLAIM_STATUS[claim.status] || CLAIM_STATUS.open;
                    return (
                      <tr
                        key={claim.id}
                        className="border-t border-border cursor-pointer transition-colors"
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => setSelectedClaim(claim)}
                      >
                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">{claim.policyNumber}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{claim.hotel}</td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">{new Date(claim.claimDate).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-3 text-sm font-medium">{claim.description}</td>
                        <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap">{fmt(claim.amount)}</td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-block">
                            <select
                              disabled={isViewer}
                              value={claim.status}
                              onChange={(e) => handleClaimStatusChange(claim.id, e.target.value)}
                              className={`appearance-none ${isViewer ? 'cursor-default opacity-85' : 'cursor-pointer'} pl-4 pr-6 py-1 rounded-full text-xs font-semibold outline-none transition-all capitalize`}
                              style={{
                                background: cs.bg,
                                color: cs.color,
                                border: `1px solid ${cs.color}33`,
                              }}
                              title="Change claim status"
                            >
                              <option value="open" style={{ background: '#18181b', color: '#f43f5e' }}>Open</option>
                              <option value="in-progress" style={{ background: '#18181b', color: '#f59e0b' }}>In-Progress</option>
                              <option value="settled" style={{ background: '#18181b', color: '#3dd68c' }}>Settled</option>
                              <option value="rejected" style={{ background: '#18181b', color: '#94a3b8' }}>Rejected</option>
                            </select>
                            <span
                              className="w-1.5 h-1.5 rounded-full absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
                              style={{ background: cs.color }}
                            />
                            <ChevronDown
                              size={11}
                              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-80"
                              style={{ color: cs.color }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <button
                              className="p-1.5 rounded-lg border border-border hover:bg-surface2 transition-colors cursor-pointer"
                              style={{ color: 'var(--text2)' }}
                              title="View Details"
                              onClick={() => setSelectedClaim(claim)}
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              className="p-1.5 rounded-lg border border-border hover:bg-surface2 transition-colors text-muted-foreground hover:text-primary cursor-pointer"
                              title="Edit Claim"
                              onClick={() => handleOpenEditClaim(claim)}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              className="p-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/15 text-rose-400 transition-colors cursor-pointer"
                              title="Delete Claim"
                              onClick={() => setClaimToDelete(claim)}
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
                      <button
                        onClick={() => handleScheduleReminder(policy)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-transform active:scale-95 cursor-pointer"
                        style={{ background: 'var(--primary)', color: '#000' }}
                      >
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 samko-modal-overlay" onClick={() => setSelectedPolicy(null)}>
          <div className="rounded-2xl border border-border-strong w-full max-w-2xl max-h-[85vh] overflow-auto shadow-2xl samko-modal-card" style={{ background: '#11141a', borderColor: 'var(--border-strong)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-border" style={{ background: 'var(--surface2)' }}>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded font-bold" style={{ background: 'var(--surface3)', color: 'var(--primary)' }}>{selectedPolicy.policyNumber}</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: STATUS_CONFIG[selectedPolicy.status]?.bg, color: STATUS_CONFIG[selectedPolicy.status]?.color }}>{STATUS_CONFIG[selectedPolicy.status]?.label}</span>
                </div>
                <h2 className="font-head font-bold text-lg text-foreground">{selectedPolicy.insuranceType}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{selectedPolicy.insuranceCompany} · Broker: {selectedPolicy.broker || 'Marsh UK'}</p>
              </div>
              <button onClick={() => setSelectedPolicy(null)} className="text-muted-foreground hover:text-foreground text-xl font-bold px-2 py-1 rounded hover:bg-white/10 transition-colors">✕</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4" style={{ background: '#11141a' }}>
              {[
                ['Property', selectedPolicy.hotel || '—'],
                ['Coverage Amount', fmt(selectedPolicy.coverageAmount)],
                ['Annual Premium', `${fmt(selectedPolicy.annualPremium)}/yr`],
                ['Excess Amount', fmt(selectedPolicy.excessAmount)],
                ['Start Date', formatDateSafe(selectedPolicy.startDate)],
                ['Expiry Date', formatDateSafe(selectedPolicy.expiryDate)],
                ['Renewal Date', formatDateSafe(selectedPolicy.renewalDate)],
                ['Responsible Manager', selectedPolicy.responsibleManager || '—'],
                ['Contact Person', selectedPolicy.contactPerson || '—'],
                ['Emergency Phone', selectedPolicy.emergencyPhone || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1 p-3 rounded-xl border border-border/60" style={{ background: 'var(--surface2)' }}>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
                  <span className="text-sm font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>
            {selectedPolicy.notes && (
              <div className="px-6 pb-4" style={{ background: '#11141a' }}>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">Notes</div>
                <div className="text-sm p-3.5 rounded-xl border border-border/60" style={{ background: 'var(--surface2)' }}>{selectedPolicy.notes}</div>
              </div>
            )}
            <div className="flex items-center justify-between gap-2 p-6 border-t border-border" style={{ background: 'var(--surface2)' }}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(selectedPolicy)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-surface2 text-foreground transition-colors"
                  style={{ background: 'var(--surface)' }}
                >
                  <Edit2 size={13} /> Edit Policy
                </button>
                <button
                  type="button"
                  onClick={() => setPolicyToDelete(selectedPolicy)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-rose-500/30 hover:bg-rose-500/15 text-rose-400 transition-colors"
                >
                  <Trash2 size={13} /> Delete Policy
                </button>
              </div>
              <button onClick={() => setSelectedPolicy(null)} className="samko-btn-primary px-5 py-2">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Policy Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 samko-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="rounded-2xl border border-border-strong w-full max-w-2xl max-h-[85vh] overflow-auto shadow-2xl samko-modal-card" style={{ background: '#11141a', borderColor: 'var(--border-strong)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border" style={{ background: 'var(--surface2)' }}>
              <h2 className="font-head font-bold text-lg text-foreground">Add Insurance Policy</h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground text-xl font-bold px-2">×</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Policy Number</label>
                  <input
                    type="text"
                    required
                    value={addForm.policyNumber}
                    onChange={(e) => setAddForm({ ...addForm, policyNumber: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Insurance Type</label>
                  <select
                    value={addForm.insuranceType}
                    onChange={(e) => setAddForm({ ...addForm, insuranceType: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {INSURANCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Insurance Company</label>
                  <input
                    type="text"
                    required
                    value={addForm.insuranceCompany}
                    onChange={(e) => setAddForm({ ...addForm, insuranceCompany: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Broker</label>
                  <input
                    type="text"
                    value={addForm.broker}
                    onChange={(e) => setAddForm({ ...addForm, broker: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Property</label>
                  <select
                    value={addForm.hotel}
                    onChange={(e) => setAddForm({ ...addForm, hotel: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {propertyList.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Coverage Amount (£)</label>
                  <input
                    type="number"
                    value={addForm.coverageAmount}
                    onChange={(e) => setAddForm({ ...addForm, coverageAmount: Number(e.target.value) })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Annual Premium (£)</label>
                  <input
                    type="number"
                    value={addForm.annualPremium}
                    onChange={(e) => setAddForm({ ...addForm, annualPremium: Number(e.target.value) })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Excess Amount (£)</label>
                  <input
                    type="number"
                    value={addForm.excessAmount}
                    onChange={(e) => setAddForm({ ...addForm, excessAmount: Number(e.target.value) })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                  <input
                    type="date"
                    value={addForm.startDate}
                    onChange={(e) => setAddForm({ ...addForm, startDate: e.target.value })}
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
                  <label className="text-xs font-medium text-muted-foreground">Responsible Manager</label>
                  <input
                    type="text"
                    value={addForm.responsibleManager}
                    onChange={(e) => setAddForm({ ...addForm, responsibleManager: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Initial Status</label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm({ ...addForm, status: e.target.value as PolicyStatus })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="active">Active</option>
                    <option value="expiring-soon">Expiring Soon</option>
                    <option value="expired">Expired</option>
                    <option value="pending-renewal">Pending Renewal</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 p-6 pt-0 border-t border-border mt-2">
                <button type="submit" className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#000' }}>
                  Save Policy
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium border border-border" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Policy Modal */}
      {showEditModal && editingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 samko-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="rounded-2xl border border-border-strong w-full max-w-2xl max-h-[85vh] overflow-auto shadow-2xl samko-modal-card" style={{ background: '#11141a', borderColor: 'var(--border-strong)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border" style={{ background: 'var(--surface2)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}>
                  <Edit2 size={16} />
                </div>
                <div>
                  <h2 className="font-head font-bold text-base text-foreground">Edit Insurance Policy</h2>
                  <p className="text-xs text-muted-foreground">{editingPolicy.policyNumber} · Update policy record dynamically</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-muted-foreground hover:text-foreground text-xl font-bold px-2 py-1 rounded hover:bg-white/10 transition-colors">✕</button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Policy Number *</label>
                  <input
                    type="text"
                    required
                    value={editingPolicy.policyNumber}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, policyNumber: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Insurance Type</label>
                  <select
                    value={editingPolicy.insuranceType}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, insuranceType: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {INSURANCE_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Insurance Company</label>
                  <input
                    type="text"
                    required
                    value={editingPolicy.insuranceCompany}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, insuranceCompany: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Broker</label>
                  <input
                    type="text"
                    value={editingPolicy.broker}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, broker: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Property</label>
                  <select
                    value={editingPolicy.hotel}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, hotel: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {propertyList.map((h) => <option key={h}>{h}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Coverage Amount (£)</label>
                  <input
                    type="number"
                    value={editingPolicy.coverageAmount}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, coverageAmount: Number(e.target.value) || 0 })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Annual Premium (£)</label>
                  <input
                    type="number"
                    value={editingPolicy.annualPremium}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, annualPremium: Number(e.target.value) || 0 })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Excess (£)</label>
                  <input
                    type="number"
                    value={editingPolicy.excessAmount}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, excessAmount: Number(e.target.value) || 0 })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Start Date</label>
                  <input
                    type="date"
                    value={editingPolicy.startDate}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, startDate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Expiry Date</label>
                  <input
                    type="date"
                    value={editingPolicy.expiryDate}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, expiryDate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Responsible Manager</label>
                  <input
                    type="text"
                    value={editingPolicy.responsibleManager}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, responsibleManager: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
                  <select
                    value={editingPolicy.status}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, status: e.target.value as PolicyStatus })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="active">Active</option>
                    <option value="expiring-soon">Expiring Soon</option>
                    <option value="expired">Expired</option>
                    <option value="pending-renewal">Pending Renewal</option>
                  </select>
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Notes</label>
                  <textarea
                    rows={2}
                    value={editingPolicy.notes || ''}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, notes: e.target.value })}
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
      {policyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/20 text-rose-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-head font-bold text-base text-foreground">Confirm Deletion</h3>
                <p className="text-xs text-muted-foreground">{policyToDelete.policyNumber}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground mb-5">
              Are you sure you want to permanently delete policy <strong className="text-foreground">{policyToDelete.policyNumber} ({policyToDelete.insuranceType})</strong> from the insurance register? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPolicyToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-surface2 transition-colors"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingPolicy}
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                {deletingPolicy ? (
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

      {/* Log Claim Modal */}
      {showLogClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 samko-modal-overlay" onClick={() => setShowLogClaimModal(false)}>
          <div className="rounded-2xl border border-border-strong w-full max-w-xl max-h-[85vh] overflow-auto shadow-2xl samko-modal-card" style={{ background: '#11141a' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border" style={{ background: 'var(--surface2)' }}>
              <div>
                <h2 className="font-head font-bold text-lg text-foreground">Log Insurance Claim</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Submit a new incident or property insurance claim</p>
              </div>
              <button onClick={() => setShowLogClaimModal(false)} className="text-muted-foreground hover:text-foreground text-xl font-bold px-2 py-1 rounded hover:bg-white/10 transition-colors">✕</button>
            </div>
            <form onSubmit={handleLogClaimSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Associated Policy</label>
                  <select
                    value={claimForm.policyNumber}
                    onChange={(e) => setClaimForm({ ...claimForm, policyNumber: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="">Select a policy...</option>
                    {policies.map((p) => (
                      <option key={p.id} value={p.policyNumber}>
                        {p.policyNumber} - {p.insuranceType}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Property</label>
                  <select
                    value={claimForm.hotel}
                    onChange={(e) => setClaimForm({ ...claimForm, hotel: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {propertyList.map((prop) => (
                      <option key={prop} value={prop}>{prop}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Claim Date</label>
                  <input
                    type="date"
                    required
                    value={claimForm.claimDate}
                    onChange={(e) => setClaimForm({ ...claimForm, claimDate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Estimated Amount (£)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5000"
                    value={claimForm.amount}
                    onChange={(e) => setClaimForm({ ...claimForm, amount: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
                  <select
                    value={claimForm.status}
                    onChange={(e) => setClaimForm({ ...claimForm, status: e.target.value as any })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In-Progress</option>
                    <option value="settled">Settled</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Description of Incident</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe the damages or reason for claim..."
                    value={claimForm.description}
                    onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none resize-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setShowLogClaimModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-border cursor-pointer"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingClaim}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95 cursor-pointer"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  {savingClaim ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Log Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Claim Modal */}
      {showEditClaimModal && editingClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 samko-modal-overlay" onClick={() => setShowEditClaimModal(false)}>
          <div className="rounded-2xl border border-border-strong w-full max-w-xl max-h-[85vh] overflow-auto shadow-2xl samko-modal-card" style={{ background: '#11141a' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border" style={{ background: 'var(--surface2)' }}>
              <div>
                <h2 className="font-head font-bold text-lg text-foreground">Edit Insurance Claim</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{editingClaim.policyNumber} · {editingClaim.hotel}</p>
              </div>
              <button onClick={() => setShowEditClaimModal(false)} className="text-muted-foreground hover:text-foreground text-xl font-bold px-2 py-1 rounded hover:bg-white/10 transition-colors">✕</button>
            </div>
            <form onSubmit={handleSaveEditClaim} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Associated Policy</label>
                  <select
                    value={editingClaim.policyNumber}
                    onChange={(e) => setEditingClaim({ ...editingClaim, policyNumber: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {policies.map((p) => (
                      <option key={p.id} value={p.policyNumber}>
                        {p.policyNumber} - {p.insuranceType}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Property</label>
                  <select
                    value={editingClaim.hotel}
                    onChange={(e) => setEditingClaim({ ...editingClaim, hotel: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {propertyList.map((prop) => (
                      <option key={prop} value={prop}>{prop}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Claim Date</label>
                  <input
                    type="date"
                    required
                    value={editingClaim.claimDate}
                    onChange={(e) => setEditingClaim({ ...editingClaim, claimDate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Amount (£)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingClaim.amount}
                    onChange={(e) => setEditingClaim({ ...editingClaim, amount: Number(e.target.value) || 0 })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
                  <select
                    value={editingClaim.status}
                    onChange={(e) => setEditingClaim({ ...editingClaim, status: e.target.value as any })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In-Progress</option>
                    <option value="settled">Settled</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Description</label>
                  <textarea
                    rows={3}
                    required
                    value={editingClaim.description}
                    onChange={(e) => setEditingClaim({ ...editingClaim, description: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none resize-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setShowEditClaimModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-border cursor-pointer"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingClaim}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95 cursor-pointer"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  {savingClaim ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 samko-modal-overlay" onClick={() => setSelectedClaim(null)}>
          <div className="rounded-2xl border border-border-strong w-full max-w-lg overflow-hidden shadow-2xl samko-modal-card" style={{ background: '#11141a' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-border" style={{ background: 'var(--surface2)' }}>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded font-bold" style={{ background: 'var(--surface3)', color: 'var(--primary)' }}>{selectedClaim.policyNumber}</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize" style={{ background: CLAIM_STATUS[selectedClaim.status]?.bg, color: CLAIM_STATUS[selectedClaim.status]?.color }}>{selectedClaim.status}</span>
                </div>
                <h2 className="font-head font-bold text-lg text-foreground">{selectedClaim.description}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedClaim.hotel} · {new Date(selectedClaim.claimDate).toLocaleDateString('en-GB')}</p>
              </div>
              <button onClick={() => setSelectedClaim(null)} className="text-muted-foreground hover:text-foreground text-xl font-bold px-2 py-1 rounded hover:bg-white/10 transition-colors">✕</button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border/60" style={{ background: 'var(--surface2)' }}>
                  <div className="text-xs text-muted-foreground uppercase">Claim Amount</div>
                  <div className="font-bold text-lg text-primary mt-0.5">{fmt(selectedClaim.amount)}</div>
                </div>
                <div className="p-3 rounded-xl border border-border/60" style={{ background: 'var(--surface2)' }}>
                  <div className="text-xs text-muted-foreground uppercase">Claim Date</div>
                  <div className="font-semibold text-sm text-foreground mt-1">{new Date(selectedClaim.claimDate).toLocaleDateString('en-GB')}</div>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-border/60" style={{ background: 'var(--surface2)' }}>
                <div className="text-xs text-muted-foreground uppercase mb-1">Details & Scope</div>
                <p className="text-sm leading-relaxed text-foreground">{selectedClaim.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border-t border-border" style={{ background: 'var(--surface2)' }}>
              <button
                onClick={() => {
                  setClaimToDelete(selectedClaim);
                  setSelectedClaim(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/15 border border-rose-500/20 transition-colors cursor-pointer"
              >
                <Trash2 size={13} /> Delete Claim
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenEditClaim(selectedClaim);
                    setSelectedClaim(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-surface3 transition-colors cursor-pointer"
                >
                  <Edit2 size={13} /> Edit Claim
                </button>
                <button
                  onClick={() => setSelectedClaim(null)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Claim Confirmation Dialog */}
      {claimToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/20 text-rose-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-head font-bold text-base text-foreground">Confirm Delete Claim</h3>
                <p className="text-xs text-muted-foreground">{claimToDelete.policyNumber} · {claimToDelete.hotel}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground mb-5">
              Are you sure you want to permanently delete the insurance claim for <strong className="text-foreground">"{claimToDelete.description}" ({fmt(claimToDelete.amount)})</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setClaimToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-surface2 transition-colors cursor-pointer"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingClaim}
                onClick={handleDeleteClaim}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
              >
                {deletingClaim ? (
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
