'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Plus,
  Search,
  Download,
  Eye,
  Edit2,
  FileText,
  Bell,
  Phone,
  RefreshCw,
  ChevronDown,
  Loader2,
  Trash2,
  X,
  Check,
  Tag,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';
import CustomDropdown from '@/components/ui/CustomDropdown';
import {
  useDeepPageCms,
  DEFAULT_INSURANCE_CATEGORIES,
  DEFAULT_INSURANCE_TYPES,
  addDropdownOption,
  removeDropdownOptionByName,
} from '@/lib/deepPageCms';
import PageCMSEditButton from '@/components/cms/PageCMSEditButton';
import LoadingPagination from '@/components/ui/LoadingPagination';
import { useLoadingPagination } from '@/hooks/useLoadingPagination';
import TableCheckbox from '@/components/ui/TableCheckbox';
import BulkActionBar from '@/components/ui/BulkActionBar';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import { getLivePropertyNames } from '@/hooks/useLiveProperties';
import DocumentUploadField from '@/components/ui/DocumentUploadField';
import DocumentTableCell from '@/components/ui/DocumentTableCell';

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
  portal?: 'propco' | 'opco';
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
  portal?: 'propco' | 'opco';
}

const INSURANCE_TYPES = [
  'Building Insurance',
  'Contents Insurance',
  'Public Liability',
  'Employers Liability',
  'Product Liability',
  'Professional Indemnity',
  'Cyber Insurance',
  'Equipment Breakdown',
  'Business Interruption',
  'Vehicle Insurance',
  'Directors Liability',
  'Engineering Insurance',
];

const DEFAULT_HOTELS = ['Crowne Plaza Kingston-south', 'Stanhill Court'];

const MOCK_POLICIES: InsurancePolicy[] = [
  {
    id: '1',
    policyNumber: 'INS-008547',
    insuranceType: 'Buildings & Plant Cover',
    insuranceCompany: 'Aviva Commercial',
    broker: 'Marsh UK',
    hotel: 'Stanhill Court',
    coverageAmount: 25000000,
    annualPremium: 59335,
    startDate: '2025-07-01',
    expiryDate: '2027-06-30',
    renewalDate: '2027-06-30',
    excessAmount: 5000,
    responsibleManager: 'Marcus Webb',
    contactPerson: 'Sarah Thompson',
    emergencyPhone: '+44 800 123 4567',
    status: 'active',
  },
  {
    id: '2',
    policyNumber: 'POL-2025-001',
    insuranceType: 'Building Insurance',
    insuranceCompany: 'Aviva Commercial',
    broker: 'Marsh UK',
    hotel: 'Crowne Plaza Kingston-south',
    coverageAmount: 15000000,
    annualPremium: 42000,
    startDate: '2025-01-01',
    expiryDate: '2026-12-31',
    renewalDate: '2026-12-15',
    excessAmount: 5000,
    responsibleManager: 'Marcus Webb',
    contactPerson: 'Sarah Thompson',
    emergencyPhone: '+44 800 123 4567',
    status: 'active',
  },
  {
    id: '3',
    policyNumber: 'POL-2025-003',
    insuranceType: 'Employers Liability',
    insuranceCompany: 'Zurich Insurance',
    broker: 'Marsh UK',
    hotel: 'Stanhill Court',
    coverageAmount: 10000000,
    annualPremium: 12000,
    startDate: '2025-02-01',
    expiryDate: '2027-02-01',
    renewalDate: '2027-01-15',
    excessAmount: 1000,
    responsibleManager: 'Sarah Chen',
    contactPerson: 'Rachel Green',
    emergencyPhone: '+44 800 345 6789',
    status: 'active',
  },
];

const MOCK_CLAIMS: Claim[] = [
  {
    id: 'c1',
    policyId: '1',
    policyNumber: 'INS-008547',
    hotel: 'Stanhill Court',
    claimDate: '2025-03-15',
    description: 'Water damage to ground floor lobby ceiling',
    amount: 12500,
    status: 'settled',
  },
  {
    id: 'c2',
    policyId: '2',
    policyNumber: 'POL-2025-001',
    hotel: 'Crowne Plaza Kingston-south',
    claimDate: '2025-05-20',
    description: 'Guest slip and fall in car park',
    amount: 8000,
    status: 'in-progress',
  },
  {
    id: 'c3',
    policyId: '3',
    policyNumber: 'POL-2025-003',
    hotel: 'Stanhill Court',
    claimDate: '2025-07-22',
    description: 'Commercial kitchen oven breakdown repair',
    amount: 4500,
    status: 'open',
  },
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
  const startDateStr =
    item.startDate && !isNaN(new Date(item.startDate).getTime())
      ? item.startDate
      : isValidExpiry
        ? new Date(expiryDateObj.getTime() - 365 * 86400000).toISOString().split('T')[0]
        : '2026-01-01';
  const renewalDateStr =
    item.renewalDate && !isNaN(new Date(item.renewalDate).getTime())
      ? item.renewalDate
      : isValidExpiry
        ? new Date(expiryDateObj.getTime() - 30 * 86400000).toISOString().split('T')[0]
        : '2026-11-30';

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
  const { user, isViewer, canEdit, canDelete, canWriteTab, isPropertyAccessible, activePortal } =
    useAuth();
  const hasWriteAccess = !isViewer && canEdit && canWriteTab('insurance');
  const hasDeleteAccess = !isViewer && canDelete && canWriteTab('insurance');
  const {
    title: cmsTitle,
    subtitle: cmsSubtitle,
    searchPlaceholder: cmsSearchPlaceholder,
    primaryActionLabel: cmsPrimaryActionLabel,
    dropdowns: cmsDropdowns,
  } = useDeepPageCms('insurance');

  const [policies, setPolicies] = useState<InsurancePolicy[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('samko_cache_insurance');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed.length <= 3)
            return parsed.map(normalizePolicy);
          else {
            sessionStorage.removeItem('samko_cache_insurance');
            localStorage.removeItem('samko_insurance_policies');
          }
        }
      } catch {}
    }
    return MOCK_POLICIES.map(normalizePolicy);
  });
  const [propertyList, setPropertyList] = useState<string[]>(() => getLivePropertyNames());
  const [claims, setClaims] = useState<Claim[]>(MOCK_CLAIMS);
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams?.get('tab');
  const initialTab: 'register' | 'claims' | 'renewals' =
    tabParam === 'claims' || tabParam === 'renewals' ? tabParam : 'register';

  const [activeTab, setActiveTab] = useState<'register' | 'claims' | 'renewals'>(initialTab);

  useEffect(() => {
    const t = searchParams?.get('tab');
    if (t === 'claims' || t === 'renewals') {
      setActiveTab(t);
    } else {
      setActiveTab('register');
    }
  }, [searchParams]);

  const portalParam = searchParams?.get('portal');
  const isOpCo = portalParam === 'opco' || (!portalParam && activePortal === 'opco');

  const handleTabChange = (t: 'register' | 'claims' | 'renewals') => {
    setActiveTab(t);
    const portalQuery = portalParam ? `portal=${portalParam}` : '';
    const base = t === 'register' ? '/insurance-register' : `/insurance-register?tab=${t}`;
    const url = portalQuery ? (t === 'register' ? `${base}?${portalQuery}` : `${base}&${portalQuery}`) : base;
    router.push(url, { scroll: false });
  };
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterHotel, setFilterHotel] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<InsurancePolicy | null>(null);
  // Dynamic Categories and Types state
  const [customTypes, setCustomTypes] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('samko_insurance_types');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('samko_insurance_categories');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  const categoryDropdown = (cmsDropdowns || []).find((d) => d.id === 'category');
  const typeDropdown = (cmsDropdowns || []).find((d) => d.id === 'type');

  const allTypes = React.useMemo(() => {
    const cmsOptions = typeDropdown?.options || [];
    const deleted = new Set((typeDropdown?.deletedOptions || []).map((o) => o.toLowerCase()));
    const merged = new Set<string>();

    cmsOptions.forEach((t) => {
      const clean = t.trim();
      if (
        clean &&
        !clean.toLowerCase().startsWith('all ') &&
        clean.toLowerCase() !== 'all' &&
        !deleted.has(clean.toLowerCase())
      ) {
        merged.add(clean);
      }
    });

    DEFAULT_INSURANCE_TYPES.forEach((t) => {
      const clean = t.trim();
      if (!deleted.has(clean.toLowerCase())) {
        merged.add(clean);
      }
    });

    customTypes.forEach((t) => {
      const clean = t.trim();
      if (!deleted.has(clean.toLowerCase())) {
        merged.add(clean);
      }
    });

    policies.forEach((p) => {
      const clean = (p.insuranceType || '').trim();
      if (clean && !deleted.has(clean.toLowerCase())) {
        merged.add(clean);
      }
    });

    return Array.from(merged).sort();
  }, [typeDropdown, customTypes, policies]);

  const hotelOptions = React.useMemo(() => {
    return Array.from(
      new Set([...propertyList, ...policies.map((p) => p.hotel).filter(Boolean), ...DEFAULT_HOTELS])
    )
      .filter((p) => p && p.toLowerCase() !== 'gow' && isPropertyAccessible(p))
      .sort();
  }, [propertyList, policies, isPropertyAccessible]);

  const allCategories = React.useMemo(() => {
    const cmsOptions = categoryDropdown?.options || [];
    const deleted = new Set((categoryDropdown?.deletedOptions || []).map((o) => o.toLowerCase()));
    const merged = new Set<string>();

    cmsOptions.forEach((c) => {
      const clean = c.trim();
      if (
        clean &&
        !clean.toLowerCase().startsWith('all ') &&
        clean.toLowerCase() !== 'all' &&
        !deleted.has(clean.toLowerCase())
      ) {
        merged.add(clean);
      }
    });

    DEFAULT_INSURANCE_CATEGORIES.forEach((c) => {
      const clean = c.trim();
      if (!deleted.has(clean.toLowerCase())) {
        merged.add(clean);
      }
    });

    customCategories.forEach((c) => {
      const clean = c.trim();
      if (!deleted.has(clean.toLowerCase())) {
        merged.add(clean);
      }
    });

    return Array.from(merged).sort();
  }, [categoryDropdown, customCategories]);

  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [typeToDelete, setTypeToDelete] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<{ oldName: string; newName: string } | null>(null);
  const [catToDelete, setCatToDelete] = useState<string | null>(null);
  const [editingCat, setEditingCat] = useState<{ oldName: string; newName: string } | null>(null);
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const handleSaveType = (e: React.FormEvent) => {
    e.preventDefault();
    const t = newTypeName.trim();
    if (!t) return;
    addDropdownOption('insurance', 'type', t);
    if (!customTypes.includes(t)) {
      const updated = [...customTypes, t];
      setCustomTypes(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('samko_insurance_types', JSON.stringify(updated));
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', { detail: { type: 'insurance_type', name: t } })
        );
      }
    }
    toast.success('Insurance Type Created', { description: `Added "${t}" to insurance types` });
    setNewTypeName('');
  };

  const handleDeleteType = (typeName: string) => {
    removeDropdownOptionByName('insurance', 'type', typeName);
    const updated = customTypes.filter((t) => t.toLowerCase() !== typeName.toLowerCase());
    setCustomTypes(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('samko_insurance_types', JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'insurance_type_deleted', name: typeName },
        })
      );
    }
    setFilterType((prev) => prev.filter((t) => t !== typeName));
    toast.success(`Removed type "${typeName}"`);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const c = newCatName.trim();
    if (!c) return;
    addDropdownOption('insurance', 'category', c);
    if (!customCategories.includes(c)) {
      const updated = [...customCategories, c];
      setCustomCategories(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('samko_insurance_categories', JSON.stringify(updated));
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', { detail: { type: 'insurance_category', name: c } })
        );
      }
    }
    toast.success('Insurance Category Created', {
      description: `Added "${c}" to insurance categories`,
    });
    setNewCatName('');
  };

  const handleDeleteCategory = (catName: string) => {
    removeDropdownOptionByName('insurance', 'category', catName);
    const updated = customCategories.filter((c) => c.toLowerCase() !== catName.toLowerCase());
    setCustomCategories(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('samko_insurance_categories', JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'insurance_category_deleted', name: catName },
        })
      );
    }
    toast.success(`Removed category "${catName}"`);
  };

  const handleViewTypeRecords = (typeName: string) => {
    setFilterType([typeName]);
    setShowAddTypeModal(false);
    const count = policies.filter((p) => p.insuranceType === typeName).length;
    toast.info(`Filtered to ${typeName}`, {
      description: `Showing ${count} policy record(s) matching insurance type "${typeName}"`,
    });
  };

  const handleSaveEditType = () => {
    if (!editingType) return;
    const oldName = editingType.oldName.trim();
    const newName = editingType.newName.trim();
    if (!newName || oldName === newName) {
      setEditingType(null);
      return;
    }
    const updatedCustom = customTypes.map((t) =>
      t.toLowerCase() === oldName.toLowerCase() ? newName : t
    );
    if (!updatedCustom.includes(newName)) {
      updatedCustom.push(newName);
    }
    setCustomTypes(updatedCustom);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('samko_insurance_types', JSON.stringify(updatedCustom));
      } catch {}
    }
    removeDropdownOptionByName('insurance', 'type', oldName);
    addDropdownOption('insurance', 'type', newName);

    const updatedPolicies = policies.map((p) => {
      if (p.insuranceType === oldName) {
        return { ...p, insuranceType: newName };
      }
      return p;
    });
    setPolicies(updatedPolicies);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('samko_insurance_policies', JSON.stringify(updatedPolicies));
      } catch {}
    }
    setEditingType(null);
    toast.success(`Renamed "${oldName}" to "${newName}"`);
  };

  const handleConfirmDeleteType = () => {
    if (!typeToDelete) return;
    handleDeleteType(typeToDelete);
    setTypeToDelete(null);
  };

  const handleViewCategoryRecords = (catName: string) => {
    setShowAddCategoryModal(false);
    toast.info(`Selected Category: ${catName}`, {
      description: `Category "${catName}" active`,
    });
  };

  const handleSaveEditCategory = () => {
    if (!editingCat) return;
    const oldName = editingCat.oldName.trim();
    const newName = editingCat.newName.trim();
    if (!newName || oldName === newName) {
      setEditingCat(null);
      return;
    }
    const updatedCustom = customCategories.map((c) =>
      c.toLowerCase() === oldName.toLowerCase() ? newName : c
    );
    if (!updatedCustom.includes(newName)) {
      updatedCustom.push(newName);
    }
    setCustomCategories(updatedCustom);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('samko_insurance_categories', JSON.stringify(updatedCustom));
      } catch {}
    }
    removeDropdownOptionByName('insurance', 'category', oldName);
    addDropdownOption('insurance', 'category', newName);
    setEditingCat(null);
    toast.success(`Renamed category "${oldName}" to "${newName}"`);
  };

  const handleConfirmDeleteCategory = () => {
    if (!catToDelete) return;
    handleDeleteCategory(catToDelete);
    setCatToDelete(null);
  };

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
    documentName: '',
    documentUrl: '',
    documentSize: '',
  });

  const fetchInsurance = useCallback(async () => {
    try {
      setLoading(true);
      const [insRes, propsRes, claimsRes] = await Promise.allSettled([
        api.insurance.getAll(),
        api.properties.getAll(),
        api.claims.getAll(),
      ]);

      if (
        insRes.status === 'fulfilled' &&
        insRes.value.success &&
        insRes.value.data &&
        insRes.value.data.length > 0
      ) {
        setPolicies(insRes.value.data.map(normalizePolicy));
        try {
          sessionStorage.setItem('samko_cache_insurance', JSON.stringify(insRes.value.data));
        } catch {}
      }
      if (
        propsRes.status === 'fulfilled' &&
        propsRes.value.success &&
        propsRes.value.data &&
        propsRes.value.data.length > 0
      ) {
        setPropertyList(propsRes.value.data.map((p: any) => p.name));
      }
      if (
        claimsRes.status === 'fulfilled' &&
        claimsRes.value.success &&
        claimsRes.value.data &&
        claimsRes.value.data.length > 0
      ) {
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
      portal: isOpCo ? 'opco' : 'propco',
    };

    try {
      const res = await api.insurance.create(payload);
      const created = normalizePolicy(res.data || { ...payload, id: `ins-${Date.now()}` });
      setPolicies((prev) => [created, ...prev]);
      setShowAddModal(false);
      toast.success('Insurance policy created', {
        description: `Policy ${created.policyNumber} (${created.insuranceType}) registered successfully`,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', { detail: { type: 'insurance' } })
        );
      }
    } catch (err: any) {
      toast.error('Failed to create insurance policy', { description: err.message });
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
      toast.success('Policy updated', {
        description: `${updated.policyNumber} updated successfully`,
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', { detail: { type: 'insurance', id: updated.id } })
        );
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
      toast.success('Policy deleted', {
        description: `${policyToDelete.policyNumber} has been removed`,
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', { detail: { type: 'insurance', id } })
        );
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
      const headers = [
        'Policy Number',
        'Insurance Type',
        'Company',
        'Property',
        'Coverage Amount',
        'Annual Premium',
        'Expiry Date',
        'Status',
      ];
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
      const headers = [
        'Policy Number',
        'Property',
        'Claim Date',
        'Description',
        'Amount',
        'Status',
      ];
      const rows = accessibleClaims.map((c) => [
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
      const headers = [
        'Policy Number',
        'Insurance Type',
        'Company',
        'Property',
        'Renewal Date',
        'Days Left',
        'Status',
      ];
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
    toast.success(
      `Reminder scheduled for ${policy.insuranceType} (${days > 0 ? `${days} days before renewal` : 'due immediately'})`
    );
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
      hotel:
        claimForm.hotel || matchingPol?.hotel || propertyList[0] || 'Crowne Plaza Kingston-south',
      property:
        claimForm.hotel || matchingPol?.hotel || propertyList[0] || 'Crowne Plaza Kingston-south',
      amount: Number(claimForm.amount) || 0,
      portal: isOpCo ? 'opco' : 'propco',
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
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', { detail: { type: 'claims', id: updated.id } })
        );
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
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', { detail: { type: 'claims', id } })
        );
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
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', { detail: { type: 'claims', id, status: newStatus } })
      );
    }
    try {
      await api.claims.update(id, { status: newStatus });
    } catch (err) {
      console.warn('Updated claim locally:', err);
    }
  };

  const accessiblePolicies = React.useMemo(() => {
    return policies.filter((p) => {
      const itemPortal = (p as any).portal || 'propco';
      if (isOpCo && itemPortal !== 'opco') return false;
      if (!isOpCo && itemPortal === 'opco') return false;
      return isPropertyAccessible(p.hotel || (p as any).property || (p as any).site);
    });
  }, [policies, isPropertyAccessible, isOpCo]);

  const accessibleClaims = React.useMemo(() => {
    return claims.filter((c) => {
      const itemPortal = (c as any).portal || 'propco';
      if (isOpCo && itemPortal !== 'opco') return false;
      if (!isOpCo && itemPortal === 'opco') return false;
      return isPropertyAccessible(c.hotel || (c as any).property || (c as any).site);
    });
  }, [claims, isPropertyAccessible, isOpCo]);

  const totalCoverage = accessiblePolicies.reduce((s, p) => s + (p.coverageAmount || 0), 0);
  const totalPremium = accessiblePolicies.reduce((s, p) => s + (p.annualPremium || 0), 0);
  const expiringSoon = accessiblePolicies.filter((p) => {
    const d = daysUntil(p.expiryDate);
    return d >= 0 && d <= 30;
  }).length;
  const expiredCount = accessiblePolicies.filter((p) => p.status === 'expired').length;

  const filtered = accessiblePolicies.filter((p) => {
    const matchSearch =
      !search ||
      p.policyNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.insuranceCompany.toLowerCase().includes(search.toLowerCase()) ||
      p.hotel.toLowerCase().includes(search.toLowerCase()) ||
      p.insuranceType.toLowerCase().includes(search.toLowerCase());

    const matchType =
      filterType.length === 0 ||
      filterType.some(
        (t) => t.trim().toLowerCase() === (p.insuranceType || '').trim().toLowerCase()
      );

    const matchHotel =
      filterHotel.length === 0 ||
      filterHotel.some((h) => h.trim().toLowerCase() === (p.hotel || '').trim().toLowerCase());

    const matchStatus =
      filterStatus.length === 0 ||
      filterStatus.some((s) => s.trim().toLowerCase() === (p.status || '').trim().toLowerCase());

    return matchSearch && matchType && matchHotel && matchStatus;
  });

  const {
    currentPage,
    pageSize,
    totalRecords,
    paginatedItems: paginatedPolicies,
    isPageLoading,
    changePage,
    changePageSize,
  } = useLoadingPagination(filtered, 10);

  // Multi-select Policies
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([]);
  const [isBulkDeletingPolicies, setIsBulkDeletingPolicies] = useState(false);
  const [showBulkDeletePoliciesModal, setShowBulkDeletePoliciesModal] = useState(false);
  const [selectedPolicyTypeFilter, setSelectedPolicyTypeFilter] = useState('');

  const isAllPoliciesPageSelected =
    paginatedPolicies.length > 0 &&
    paginatedPolicies.every((p) => selectedPolicyIds.includes(p.id));
  const isSomePoliciesPageSelected =
    paginatedPolicies.some((p) => selectedPolicyIds.includes(p.id)) && !isAllPoliciesPageSelected;

  const handleToggleSelectAllPoliciesPage = () => {
    if (isAllPoliciesPageSelected) {
      const pageIds = new Set(paginatedPolicies.map((p) => p.id));
      setSelectedPolicyIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = paginatedPolicies.map((p) => p.id);
      setSelectedPolicyIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleTogglePolicySelect = (id: string) => {
    setSelectedPolicyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFilteredPolicies = () => {
    setSelectedPolicyIds(filtered.map((p) => p.id));
  };

  const handleClearPolicySelection = () => {
    setSelectedPolicyIds([]);
    setSelectedPolicyTypeFilter('');
  };

  const policyTypeOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((p) => {
      counts[`type:${p.insuranceType}`] = (counts[`type:${p.insuranceType}`] || 0) + 1;
      counts[`hotel:${p.hotel}`] = (counts[`hotel:${p.hotel}`] || 0) + 1;
      counts[`status:${p.status}`] = (counts[`status:${p.status}`] || 0) + 1;
    });

    const opts: { label: string; value: string; count: number }[] = [];
    allTypes.forEach((t) => {
      if (counts[`type:${t}`]) {
        opts.push({ label: `Type: ${t}`, value: `type:${t}`, count: counts[`type:${t}`] });
      }
    });
    hotelOptions
      .filter((h) => h !== 'All Properties')
      .forEach((h) => {
        if (counts[`hotel:${h}`]) {
          opts.push({ label: `Property: ${h}`, value: `hotel:${h}`, count: counts[`hotel:${h}`] });
        }
      });
    if (counts['status:active'])
      opts.push({
        label: 'Status: Active',
        value: 'status:active',
        count: counts['status:active'],
      });
    if (counts['status:expiring-soon'])
      opts.push({
        label: 'Status: Expiring Soon',
        value: 'status:expiring-soon',
        count: counts['status:expiring-soon'],
      });
    if (counts['status:expired'])
      opts.push({
        label: 'Status: Expired',
        value: 'status:expired',
        count: counts['status:expired'],
      });
    if (counts['status:pending-renewal'])
      opts.push({
        label: 'Status: Pending Renewal',
        value: 'status:pending-renewal',
        count: counts['status:pending-renewal'],
      });

    return opts;
  }, [filtered, allTypes, hotelOptions]);

  const handleSelectPolicyByType = (typeKey: string) => {
    setSelectedPolicyTypeFilter(typeKey);
    if (!typeKey) {
      setSelectedPolicyIds([]);
      return;
    }
    const [kind, val] = typeKey.split(':');
    const matched = filtered.filter((p) => {
      if (kind === 'type') return p.insuranceType === val;
      if (kind === 'hotel') return p.hotel === val;
      if (kind === 'status') return p.status === val;
      return false;
    });
    setSelectedPolicyIds(matched.map((p) => p.id));
    toast.info(`Selected ${matched.length} policies matching ${typeKey.replace(':', ': ')}`);
  };

  const handleConfirmBulkDeletePolicies = async () => {
    if (selectedPolicyIds.length === 0) return;
    setIsBulkDeletingPolicies(true);
    try {
      const ids = [...selectedPolicyIds];
      const count = ids.length;
      setPolicies((prev) => prev.filter((p) => !ids.includes(p.id)));
      setSelectedPolicyIds([]);
      setSelectedPolicyTypeFilter('');
      setShowBulkDeletePoliciesModal(false);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', { detail: { type: 'insurance' } })
        );
      }
      await Promise.allSettled(ids.map((id) => api.insurance.delete(id)));
      toast.success(`Deleted ${count} insurance policies successfully!`);
    } catch (err: any) {
      toast.error('Failed to bulk delete insurance policies');
    } finally {
      setIsBulkDeletingPolicies(false);
    }
  };

  // Multi-select Claims
  const [selectedClaimIds, setSelectedClaimIds] = useState<string[]>([]);
  const [isBulkDeletingClaims, setIsBulkDeletingClaims] = useState(false);
  const [showBulkDeleteClaimsModal, setShowBulkDeleteClaimsModal] = useState(false);

  const isAllClaimsSelected =
    accessibleClaims.length > 0 && accessibleClaims.every((c) => selectedClaimIds.includes(c.id));
  const isSomeClaimsSelected =
    accessibleClaims.some((c) => selectedClaimIds.includes(c.id)) && !isAllClaimsSelected;

  const handleToggleSelectAllClaims = () => {
    if (isAllClaimsSelected) {
      setSelectedClaimIds([]);
    } else {
      setSelectedClaimIds(accessibleClaims.map((c) => c.id));
    }
  };

  const handleToggleClaimSelect = (id: string) => {
    setSelectedClaimIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmBulkDeleteClaims = async () => {
    if (selectedClaimIds.length === 0) return;
    setIsBulkDeletingClaims(true);
    try {
      const ids = [...selectedClaimIds];
      const count = ids.length;
      setClaims((prev) => prev.filter((c) => !ids.includes(c.id)));
      setSelectedClaimIds([]);
      setShowBulkDeleteClaimsModal(false);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'claims' } }));
      }
      await Promise.allSettled(ids.map((id) => api.claims.delete(id)));
      toast.success(`Deleted ${count} claims successfully!`);
    } catch (err: any) {
      toast.error('Failed to bulk delete claims');
    } finally {
      setIsBulkDeletingClaims(false);
    }
  };

  const renewalsDue = accessiblePolicies.filter((p) => {
    const d = daysUntil(p.renewalDate);
    return d >= 0 && d <= 90;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div
        className="flex items-center justify-between px-7 py-4 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-head font-bold text-xl">
              {cmsTitle || (isOpCo ? 'OpCo Insurance Management' : 'PropCo Insurance Management')}
            </h1>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border"
              style={{
                background: isOpCo ? 'rgba(96,165,250,0.15)' : 'rgba(232,201,122,0.15)',
                color: isOpCo ? '#60a5fa' : '#e8c97a',
                borderColor: isOpCo ? 'rgba(96,165,250,0.35)' : 'rgba(232,201,122,0.35)',
              }}
            >
              {isOpCo ? 'OpCo Operations' : 'PropCo Asset Co'}
            </span>
            {loading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cmsSubtitle ||
              (isOpCo
                ? `Operational insurance policies & incident claims — ${accessiblePolicies.length} OpCo policies`
                : `Manage capital asset insurance policies, coverage, premiums, claims, and renewals — ${accessiblePolicies.length} policies across properties`)}
          </p>
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
          {hasWriteAccess && (
            <>
              <button
                onClick={() => setShowAddTypeModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border border-border transition-colors hover:border-primary"
                style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
              >
                <Plus size={13} style={{ color: 'var(--primary)' }} />
                Add Type
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95"
                style={{ background: 'var(--primary)', color: '#000' }}
              >
                <Plus size={14} />{' '}
                {(cmsPrimaryActionLabel || 'Add Policy').replace(/^[\+\s]+/, '').trim()}
              </button>
            </>
          )}
          {isViewer && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                background: 'rgba(148,163,184,0.12)',
                color: '#94a3b8',
                border: '1px solid rgba(148,163,184,0.25)',
              }}
            >
              L4 · Read-Only Access
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div
        className="grid gap-3 px-6 pt-5 pb-4 flex-shrink-0"
        style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}
      >
        <div
          className="rounded-xl border border-border px-4 py-3.5 relative overflow-hidden"
          style={{ background: 'var(--surface)' }}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#60a5fa' }} />
          <div
            className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 whitespace-nowrap truncate"
            title="Total Coverage"
          >
            Total Coverage
          </div>
          <div
            className="font-head font-bold text-2xl xl:text-[26px] tracking-tight whitespace-nowrap leading-tight"
            style={{ color: '#60a5fa' }}
          >
            {fmt(totalCoverage)}
          </div>
          <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap truncate">
            {user?.hotel && user.hotel !== 'All Properties'
              ? `for ${user.hotel}`
              : 'Across all properties'}
          </div>
        </div>
        <div
          className="rounded-xl border border-border px-4 py-3.5 relative overflow-hidden"
          style={{ background: 'var(--surface)' }}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#3dd68c' }} />
          <div
            className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 whitespace-nowrap truncate"
            title="Annual Premium"
          >
            Annual Premium
          </div>
          <div
            className="font-head font-bold text-2xl xl:text-[26px] tracking-tight whitespace-nowrap leading-tight"
            style={{ color: '#3dd68c' }}
          >
            {fmt(totalPremium)}
          </div>
          <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap truncate">
            Annual portfolio spend
          </div>
        </div>
        <div
          className="rounded-xl border border-border px-4 py-3.5 relative overflow-hidden"
          style={{ background: 'var(--surface)' }}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#f59e0b' }} />
          <div
            className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 whitespace-nowrap truncate"
            title="Expiring in 30 Days"
          >
            Expiring in 30 Days
          </div>
          <div
            className="font-head font-bold text-2xl xl:text-[26px] tracking-tight whitespace-nowrap leading-tight"
            style={{ color: '#f59e0b' }}
          >
            {expiringSoon}
          </div>
          <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap truncate">
            Renewal required
          </div>
        </div>
        <div
          className="rounded-xl border border-border px-4 py-3.5 relative overflow-hidden"
          style={{ background: 'var(--surface)' }}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#f43f5e' }} />
          <div
            className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 whitespace-nowrap truncate"
            title="Expired Policies"
          >
            Expired Policies
          </div>
          <div
            className="font-head font-bold text-2xl xl:text-[26px] tracking-tight whitespace-nowrap leading-tight"
            style={{ color: '#f43f5e' }}
          >
            {expiredCount}
          </div>
          <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap truncate">
            Immediate action
          </div>
        </div>
        <div
          className="rounded-xl border border-border px-4 py-3.5 relative overflow-hidden"
          style={{ background: 'var(--surface)' }}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#a78bfa' }} />
          <div
            className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 whitespace-nowrap truncate"
            title="Active Claims"
          >
            Active Claims
          </div>
          <div
            className="font-head font-bold text-2xl xl:text-[26px] tracking-tight whitespace-nowrap leading-tight"
            style={{ color: '#a78bfa' }}
          >
            {
              accessibleClaims.filter((c) => c.status !== 'settled' && c.status !== 'rejected')
                .length
            }
          </div>
          <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap truncate">
            Open & in-progress
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-0 px-6 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        {[
          { id: 'register', label: 'Policy Register', count: accessiblePolicies.length },
          { id: 'claims', label: 'Claims Register', count: accessibleClaims.length },
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
            <span
              className="text-xs px-1.5 py-0.5 rounded font-bold"
              style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
            >
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
              <div
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 flex-1 max-w-xs"
                style={{ background: 'var(--surface)' }}
              >
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
                options={allTypes.map((t) => ({ value: t, label: t }))}
                onChange={setFilterType}
              />
              <CustomDropdown
                label="All Properties"
                value={filterHotel}
                multiple
                options={hotelOptions.map((h) => ({ value: h, label: h }))}
                onChange={setFilterHotel}
              />
              <CustomDropdown
                label="All Statuses"
                value={filterStatus}
                multiple
                options={[
                  { value: 'active', label: 'Active', color: '#3dd68c' },
                  { value: 'pending', label: 'Pending Renewal', color: '#f59e0b' },
                  { value: 'expired', label: 'Expired', color: '#f43f5e' },
                  { value: 'cancelled', label: 'Cancelled', color: '#94a3b8' },
                ]}
                onChange={setFilterStatus}
              />
              <span className="text-xs text-muted-foreground ml-auto">
                {filtered.length} policies
              </span>
            </div>
            <div
              ref={tableContainerRef}
              className="rounded-xl border border-border overflow-x-auto shadow-sm custom-scrollbar"
              style={{ background: 'var(--surface)' }}
            >
              <table className="w-full text-left border-collapse" style={{ minWidth: 900 }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)' }}>
                    {hasDeleteAccess && (
                      <th className="px-3 py-3 w-10 text-center">
                        <TableCheckbox
                          checked={isAllPoliciesPageSelected}
                          indeterminate={isSomePoliciesPageSelected}
                          onChange={handleToggleSelectAllPoliciesPage}
                          title="Select all on this page"
                        />
                      </th>
                    )}
                    {[
                      'Policy No.',
                      'Insurance Type',
                      'Company',
                      'Property',
                      'Coverage',
                      'Annual Premium',
                      'Expiry Date',
                      'Days Left',
                      'Manager',
                      'Status',
                      'Document',
                      '',
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedPolicies.map((policy) => {
                    const days = daysUntil(policy.expiryDate);
                    const sc = STATUS_CONFIG[policy.status] || STATUS_CONFIG.active;
                    return (
                      <tr
                        key={policy.id}
                        className={`border-t border-border cursor-pointer transition-colors ${selectedPolicyIds.includes(policy.id) ? 'bg-[#e8c97a]/5' : ''}`}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = selectedPolicyIds.includes(policy.id)
                            ? 'rgba(232,201,122,0.08)'
                            : 'var(--surface2)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = selectedPolicyIds.includes(policy.id)
                            ? 'rgba(232,201,122,0.05)'
                            : 'transparent')
                        }
                        onClick={() => setSelectedPolicy(policy)}
                      >
                        {hasDeleteAccess && (
                          <td
                            className="px-3 py-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <TableCheckbox
                              checked={selectedPolicyIds.includes(policy.id)}
                              onChange={() => handleTogglePolicySelect(policy.id)}
                              title={`Select ${policy.policyNumber}`}
                            />
                          </td>
                        )}
                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
                          {policy.policyNumber}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-sm">{policy.insuranceType}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {policy.insuranceCompany}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {policy.hotel}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                          {fmt(policy.coverageAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                          {fmt(policy.annualPremium)}/yr
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          {new Date(policy.expiryDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td
                          className="px-4 py-3 text-sm font-semibold whitespace-nowrap"
                          style={{
                            color: days < 0 ? '#f43f5e' : days <= 30 ? '#f59e0b' : '#3dd68c',
                          }}
                        >
                          {days < 0 ? `${Math.abs(days)}d expired` : `${days}d`}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {policy.responsibleManager}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {isViewer ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold capitalize select-none"
                              style={{
                                background: sc.bg,
                                color: sc.color,
                                border: `1px solid ${sc.color}33`,
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: sc.color }}
                              />
                              {sc.label}
                            </span>
                          ) : (
                            <CustomDropdown
                              size="sm"
                              variant="pill"
                              value={policy.status}
                              onChange={(val) => handleStatusChange(policy.id, val)}
                              options={[
                                { value: 'active', label: 'Active', color: '#3dd68c' },
                                {
                                  value: 'expiring-soon',
                                  label: 'Expiring Soon',
                                  color: '#f59e0b',
                                },
                                { value: 'expired', label: 'Expired', color: '#f43f5e' },
                                {
                                  value: 'pending-renewal',
                                  label: 'Pending Renewal',
                                  color: '#60a5fa',
                                },
                              ]}
                              style={{
                                background: sc.bg,
                                color: sc.color,
                                border: `1px solid ${sc.color}33`,
                              }}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <DocumentTableCell
                            documentName={(policy as any).documentName || (policy as any).document || (policy as any).policyDocument}
                            documentUrl={(policy as any).documentUrl}
                          />
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <button
                              className="p-1.5 rounded-lg border border-border hover:bg-surface2 transition-colors cursor-pointer"
                              style={{ color: 'var(--text2)' }}
                              title="View Details"
                              onClick={() => setSelectedPolicy(policy)}
                            >
                              <Eye size={13} />
                            </button>
                            {hasWriteAccess && (
                              <button
                                className="p-1.5 rounded-lg border border-border hover:bg-surface2 transition-colors text-muted-foreground hover:text-primary cursor-pointer"
                                title="Edit Policy"
                                onClick={() => handleOpenEdit(policy)}
                              >
                                <Edit2 size={13} />
                              </button>
                            )}
                            {hasDeleteAccess && (
                              <button
                                className="p-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/15 text-rose-400 transition-colors cursor-pointer"
                                title="Delete Policy"
                                onClick={() => setPolicyToDelete(policy)}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <LoadingPagination
              currentPage={currentPage}
              totalRecords={totalRecords}
              pageSize={pageSize}
              pageSizeOptions={[5, 10, 15, 20, 50]}
              onPageChange={changePage}
              onPageSizeChange={changePageSize}
              isLoading={loading || isPageLoading}
              recordName="policies"
            />

            {/* Floating Bulk Action Bar for Policies (Only shown for authorized delete users) */}
            {hasDeleteAccess && (
              <div className="mt-4">
                <BulkActionBar
                  selectedCount={selectedPolicyIds.length}
                  totalCount={filtered.length}
                  onClearSelection={handleClearPolicySelection}
                  onSelectAll={handleSelectAllFilteredPolicies}
                  onDeleteSelected={() => setShowBulkDeletePoliciesModal(true)}
                  typeOptions={policyTypeOptions}
                  onSelectByType={handleSelectPolicyByType}
                  selectedTypeValue={selectedPolicyTypeFilter}
                  typePlaceholder="Select all of type (Insurance Type, Property, Status)..."
                  recordName="policies"
                  isDeleting={isBulkDeletingPolicies}
                />
              </div>
            )}
          </>
        )}

        {activeTab === 'claims' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="font-head font-bold text-sm">{accessibleClaims.length} Claims</div>
              {canEdit ? (
                <button
                  onClick={() => setShowLogClaimModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95 cursor-pointer"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  <Plus size={14} /> Log Claim
                </button>
              ) : isViewer ? (
                <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-surface2">
                  Read-Only
                </span>
              ) : null}
            </div>
            <div
              className="rounded-xl border border-border overflow-x-auto shadow-sm"
              style={{ background: 'var(--surface)' }}
            >
              <table className="w-full text-left border-collapse" style={{ minWidth: 800 }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)' }}>
                    <th className="px-3 py-3 w-10 text-center">
                      <TableCheckbox
                        checked={isAllClaimsSelected}
                        indeterminate={isSomeClaimsSelected}
                        onChange={handleToggleSelectAllClaims}
                        title="Select all claims"
                      />
                    </th>
                    {[
                      'Policy Number',
                      'Property',
                      'Claim Date',
                      'Description',
                      'Amount',
                      'Status',
                      'Document',
                      '',
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accessibleClaims.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <CheckCircle2 size={32} className="opacity-30" />
                          <p className="text-sm font-medium">
                            No claims recorded for this property
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    accessibleClaims.map((claim) => {
                      const cs = CLAIM_STATUS[claim.status] || CLAIM_STATUS.open;
                      return (
                        <tr
                          key={claim.id}
                          className={`border-t border-border cursor-pointer transition-colors ${selectedClaimIds.includes(claim.id) ? 'bg-[#e8c97a]/5' : ''}`}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = 'var(--surface2)')
                          }
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          onClick={() => setSelectedClaim(claim)}
                        >
                          <td
                            className="px-3 py-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <TableCheckbox
                              checked={selectedClaimIds.includes(claim.id)}
                              onChange={() => handleToggleClaimSelect(claim.id)}
                              title={`Select ${claim.policyNumber}`}
                            />
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
                            {claim.policyNumber}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                            {claim.hotel}
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            {new Date(claim.claimDate).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">{claim.description}</td>
                          <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap">
                            {fmt(claim.amount)}
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <CustomDropdown
                              size="sm"
                              variant="pill"
                              disabled={isViewer}
                              value={claim.status}
                              onChange={(val) => handleClaimStatusChange(claim.id, val)}
                              options={[
                                { value: 'open', label: 'Open', color: '#f43f5e' },
                                { value: 'in-progress', label: 'In-Progress', color: '#f59e0b' },
                                { value: 'settled', label: 'Settled', color: '#3dd68c' },
                                { value: 'rejected', label: 'Rejected', color: '#94a3b8' },
                              ]}
                              style={{
                                background: cs.bg,
                                color: cs.color,
                                border: `1px solid ${cs.color}33`,
                              }}
                            />
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <DocumentTableCell
                              documentName={(claim as any).documentName || (claim as any).document}
                              documentUrl={(claim as any).documentUrl}
                            />
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
                              {hasWriteAccess && (
                                <button
                                  className="p-1.5 rounded-lg border border-border hover:bg-surface2 transition-colors text-muted-foreground hover:text-primary cursor-pointer"
                                  title="Edit Claim"
                                  onClick={() => handleOpenEditClaim(claim)}
                                >
                                  <Edit2 size={13} />
                                </button>
                              )}
                              {hasDeleteAccess && (
                                <button
                                  className="p-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/15 text-rose-400 transition-colors cursor-pointer"
                                  title="Delete Claim"
                                  onClick={() => setClaimToDelete(claim)}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Floating Bulk Action Bar for Claims (Only shown for authorized delete users) */}
            {hasDeleteAccess && (
              <div className="mt-4">
                <BulkActionBar
                  selectedCount={selectedClaimIds.length}
                  totalCount={accessibleClaims.length}
                  onClearSelection={() => setSelectedClaimIds([])}
                  onSelectAll={() => setSelectedClaimIds(accessibleClaims.map((c) => c.id))}
                  onDeleteSelected={() => setShowBulkDeleteClaimsModal(true)}
                  recordName="claims"
                  isDeleting={isBulkDeletingClaims}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'renewals' && (
          <div className="flex flex-col gap-4">
            <div className="font-head font-bold text-sm">
              {renewalsDue.length} Renewals Due in Next 90 Days
            </div>
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
                    <div
                      key={policy.id}
                      className="rounded-xl border border-border p-4 flex items-center gap-4"
                      style={{ background: 'var(--surface)' }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: days <= 30 ? 'rgba(244,63,94,0.12)' : 'rgba(245,158,11,0.12)',
                        }}
                      >
                        <RefreshCw
                          size={16}
                          style={{ color: days <= 30 ? '#f43f5e' : '#f59e0b' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{policy.insuranceType}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {policy.insuranceCompany} · {policy.hotel}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div
                          className="text-sm font-semibold"
                          style={{ color: days <= 30 ? '#f43f5e' : '#f59e0b' }}
                        >
                          {days}d until renewal
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(policy.renewalDate).toLocaleDateString('en-GB')}
                        </div>
                      </div>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: sc.bg, color: sc.color }}
                      >
                        {sc.label}
                      </span>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 samko-modal-overlay"
          onClick={() => setSelectedPolicy(null)}
        >
          <div
            className="rounded-2xl border border-border-strong w-full max-w-2xl max-h-[85vh] overflow-auto shadow-2xl samko-modal-card"
            style={{ background: '#11141a', borderColor: 'var(--border-strong)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-start justify-between p-6 border-b border-border"
              style={{ background: 'var(--surface2)' }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="font-mono text-xs px-2.5 py-0.5 rounded font-bold"
                    style={{ background: 'var(--surface3)', color: 'var(--primary)' }}
                  >
                    {selectedPolicy.policyNumber}
                  </span>
                  <span
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{
                      background: STATUS_CONFIG[selectedPolicy.status]?.bg,
                      color: STATUS_CONFIG[selectedPolicy.status]?.color,
                    }}
                  >
                    {STATUS_CONFIG[selectedPolicy.status]?.label}
                  </span>
                </div>
                <h2 className="font-head font-bold text-lg text-foreground">
                  {selectedPolicy.insuranceType}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {selectedPolicy.insuranceCompany} · Broker: {selectedPolicy.broker || 'Marsh UK'}
                </p>
              </div>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="text-muted-foreground hover:text-foreground text-xl font-bold px-2 py-1 rounded hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
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
                <div
                  key={label}
                  className="flex flex-col gap-1 p-3 rounded-xl border border-border/60"
                  style={{ background: 'var(--surface2)' }}
                >
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {label}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>
            {selectedPolicy.notes && (
              <div className="px-6 pb-4" style={{ background: '#11141a' }}>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
                  Notes
                </div>
                <div
                  className="text-sm p-3.5 rounded-xl border border-border/60"
                  style={{ background: 'var(--surface2)' }}
                >
                  {selectedPolicy.notes}
                </div>
              </div>
            )}
            <div
              className="flex items-center justify-between gap-2 p-6 border-t border-border"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-2">
                {hasWriteAccess && (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(selectedPolicy)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-surface2 text-foreground transition-colors cursor-pointer"
                    style={{ background: 'var(--surface)' }}
                  >
                    <Edit2 size={13} /> Edit Policy
                  </button>
                )}
                {hasDeleteAccess && (
                  <button
                    type="button"
                    onClick={() => setPolicyToDelete(selectedPolicy)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-rose-500/30 hover:bg-rose-500/15 text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} /> Delete Policy
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="samko-btn-primary px-5 py-2 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Policy Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 samko-modal-overlay"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="rounded-2xl border border-border-strong w-full max-w-2xl max-h-[85vh] overflow-auto shadow-2xl samko-modal-card"
            style={{ background: '#11141a', borderColor: 'var(--border-strong)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between p-6 border-b border-border"
              style={{ background: 'var(--surface2)' }}
            >
              <h2 className="font-head font-bold text-lg text-foreground">Add Insurance Policy</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground text-xl font-bold px-2"
              >
                ×
              </button>
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
                  <label className="text-xs font-medium text-muted-foreground">
                    Insurance Type
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={addForm.insuranceType}
                    onChange={(val) => setAddForm({ ...addForm, insuranceType: val })}
                    options={allTypes}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Insurance Company
                  </label>
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
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={addForm.hotel}
                    onChange={(val) => setAddForm({ ...addForm, hotel: val })}
                    options={hotelOptions}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Coverage Amount (£)
                  </label>
                  <input
                    type="number"
                    value={addForm.coverageAmount}
                    onChange={(e) =>
                      setAddForm({ ...addForm, coverageAmount: Number(e.target.value) })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Annual Premium (£)
                  </label>
                  <input
                    type="number"
                    value={addForm.annualPremium}
                    onChange={(e) =>
                      setAddForm({ ...addForm, annualPremium: Number(e.target.value) })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Excess Amount (£)
                  </label>
                  <input
                    type="number"
                    value={addForm.excessAmount}
                    onChange={(e) =>
                      setAddForm({ ...addForm, excessAmount: Number(e.target.value) })
                    }
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
                  <label className="text-xs font-medium text-muted-foreground">
                    Responsible Manager
                  </label>
                  <input
                    type="text"
                    value={addForm.responsibleManager}
                    onChange={(e) => setAddForm({ ...addForm, responsibleManager: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Initial Status
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={addForm.status}
                    onChange={(val) => setAddForm({ ...addForm, status: val as PolicyStatus })}
                    options={[
                      { value: 'active', label: 'Active', color: '#3dd68c' },
                      { value: 'expiring-soon', label: 'Expiring Soon', color: '#f59e0b' },
                      { value: 'expired', label: 'Expired', color: '#f43f5e' },
                      { value: 'pending-renewal', label: 'Pending Renewal', color: '#60a5fa' },
                    ]}
                  />
                </div>
                <div className="col-span-2">
                  <DocumentUploadField
                    label="Policy Document / Schedule / Certificate (Optional)"
                    documentName={addForm.documentName}
                    documentUrl={addForm.documentUrl}
                    documentSize={addForm.documentSize}
                    onUpload={({ name, url, size }) =>
                      setAddForm({
                        ...addForm,
                        documentName: name,
                        documentUrl: url,
                        documentSize: size || '',
                      })
                    }
                    onRemove={() =>
                      setAddForm({
                        ...addForm,
                        documentName: '',
                        documentUrl: '',
                        documentSize: '',
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2 p-6 pt-0 border-t border-border mt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  Save Policy
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

      {/* Edit Policy Modal */}
      {showEditModal && editingPolicy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 samko-modal-overlay"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="rounded-2xl border border-border-strong w-full max-w-2xl max-h-[85vh] overflow-auto shadow-2xl samko-modal-card"
            style={{ background: '#11141a', borderColor: 'var(--border-strong)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between p-6 border-b border-border"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}
                >
                  <Edit2 size={16} />
                </div>
                <div>
                  <h2 className="font-head font-bold text-base text-foreground">
                    Edit Insurance Policy
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {editingPolicy.policyNumber} · Update policy record dynamically
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-muted-foreground hover:text-foreground text-xl font-bold px-2 py-1 rounded hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Policy Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPolicy.policyNumber}
                    onChange={(e) =>
                      setEditingPolicy({ ...editingPolicy, policyNumber: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Insurance Type
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={editingPolicy.insuranceType}
                    onChange={(val) => setEditingPolicy({ ...editingPolicy, insuranceType: val })}
                    options={allTypes}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Insurance Company
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPolicy.insuranceCompany}
                    onChange={(e) =>
                      setEditingPolicy({ ...editingPolicy, insuranceCompany: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Broker
                  </label>
                  <input
                    type="text"
                    value={editingPolicy.broker}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, broker: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Property
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={editingPolicy.hotel}
                    onChange={(val) => setEditingPolicy({ ...editingPolicy, hotel: val })}
                    options={hotelOptions}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Coverage Amount (£)
                  </label>
                  <input
                    type="number"
                    value={editingPolicy.coverageAmount}
                    onChange={(e) =>
                      setEditingPolicy({
                        ...editingPolicy,
                        coverageAmount: Number(e.target.value) || 0,
                      })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Annual Premium (£)
                  </label>
                  <input
                    type="number"
                    value={editingPolicy.annualPremium}
                    onChange={(e) =>
                      setEditingPolicy({
                        ...editingPolicy,
                        annualPremium: Number(e.target.value) || 0,
                      })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Excess (£)
                  </label>
                  <input
                    type="number"
                    value={editingPolicy.excessAmount}
                    onChange={(e) =>
                      setEditingPolicy({
                        ...editingPolicy,
                        excessAmount: Number(e.target.value) || 0,
                      })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editingPolicy.startDate}
                    onChange={(e) =>
                      setEditingPolicy({ ...editingPolicy, startDate: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={editingPolicy.expiryDate}
                    onChange={(e) =>
                      setEditingPolicy({ ...editingPolicy, expiryDate: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Responsible Manager
                  </label>
                  <input
                    type="text"
                    value={editingPolicy.responsibleManager}
                    onChange={(e) =>
                      setEditingPolicy({ ...editingPolicy, responsibleManager: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Status
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={editingPolicy.status}
                    onChange={(val) =>
                      setEditingPolicy({ ...editingPolicy, status: val as PolicyStatus })
                    }
                    options={[
                      { value: 'active', label: 'Active', color: '#3dd68c' },
                      { value: 'expiring-soon', label: 'Expiring Soon', color: '#f59e0b' },
                      { value: 'expired', label: 'Expired', color: '#f43f5e' },
                      { value: 'pending-renewal', label: 'Pending Renewal', color: '#60a5fa' },
                    ]}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={editingPolicy.notes || ''}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, notes: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none resize-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="col-span-2">
                  <DocumentUploadField
                    label="Policy Document / Schedule / Certificate (Optional)"
                    documentName={(editingPolicy as any).documentName || (editingPolicy as any).document || (editingPolicy as any).policyDocument || ''}
                    documentUrl={(editingPolicy as any).documentUrl || (editingPolicy as any).policyDocumentUrl}
                    documentSize={(editingPolicy as any).documentSize}
                    onUpload={({ name, url, size }) =>
                      setEditingPolicy({
                        ...editingPolicy,
                        documentName: name,
                        documentUrl: url,
                        documentSize: size || '',
                      } as any)
                    }
                    onRemove={() =>
                      setEditingPolicy({
                        ...editingPolicy,
                        documentName: '',
                        documentUrl: '',
                        documentSize: '',
                      } as any)
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 pt-0 border-t border-border mt-2">
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
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  {savingEdit ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {policyToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-rose-500/30 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{ background: 'var(--surface)' }}
          >
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
              Are you sure you want to permanently delete policy{' '}
              <strong className="text-foreground">
                {policyToDelete.policyNumber} ({policyToDelete.insuranceType})
              </strong>{' '}
              from the insurance register? This action cannot be undone.
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 samko-modal-overlay"
          onClick={() => setShowLogClaimModal(false)}
        >
          <div
            className="rounded-2xl border border-border-strong w-full max-w-xl max-h-[85vh] overflow-auto shadow-2xl samko-modal-card"
            style={{ background: '#11141a' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between p-6 border-b border-border"
              style={{ background: 'var(--surface2)' }}
            >
              <div>
                <h2 className="font-head font-bold text-lg text-foreground">Log Insurance Claim</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Submit a new incident or property insurance claim
                </p>
              </div>
              <button
                onClick={() => setShowLogClaimModal(false)}
                className="text-muted-foreground hover:text-foreground text-xl font-bold px-2 py-1 rounded hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleLogClaimSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Associated Policy
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    placeholder="Select a policy..."
                    value={claimForm.policyNumber}
                    onChange={(val) => {
                      const matched = accessiblePolicies.find((p) => p.policyNumber === val);
                      setClaimForm((prev) => ({
                        ...prev,
                        policyNumber: val,
                        hotel: matched?.hotel || prev.hotel,
                      }));
                    }}
                    options={accessiblePolicies.map((p) => ({
                      value: p.policyNumber,
                      label: `${p.policyNumber} - ${p.insuranceType} (${p.hotel})`,
                    }))}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Property
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={claimForm.hotel}
                    onChange={(val) => setClaimForm({ ...claimForm, hotel: val })}
                    options={hotelOptions}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Claim Date
                  </label>
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
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Estimated Amount (£)
                  </label>
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
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Status
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={claimForm.status}
                    onChange={(val) => setClaimForm({ ...claimForm, status: val as any })}
                    options={[
                      { value: 'open', label: 'Open', color: '#f43f5e' },
                      { value: 'in-progress', label: 'In-Progress', color: '#f59e0b' },
                      { value: 'settled', label: 'Settled', color: '#3dd68c' },
                      { value: 'rejected', label: 'Rejected', color: '#94a3b8' },
                    ]}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Description of Incident
                  </label>
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
                  {savingClaim ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  Log Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Claim Modal */}
      {showEditClaimModal && editingClaim && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 samko-modal-overlay"
          onClick={() => setShowEditClaimModal(false)}
        >
          <div
            className="rounded-2xl border border-border-strong w-full max-w-xl max-h-[85vh] overflow-auto shadow-2xl samko-modal-card"
            style={{ background: '#11141a' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between p-6 border-b border-border"
              style={{ background: 'var(--surface2)' }}
            >
              <div>
                <h2 className="font-head font-bold text-lg text-foreground">
                  Edit Insurance Claim
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editingClaim.policyNumber} · {editingClaim.hotel}
                </p>
              </div>
              <button
                onClick={() => setShowEditClaimModal(false)}
                className="text-muted-foreground hover:text-foreground text-xl font-bold px-2 py-1 rounded hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEditClaim} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Associated Policy
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={editingClaim.policyNumber}
                    onChange={(val) => {
                      const matched = accessiblePolicies.find((p) => p.policyNumber === val);
                      setEditingClaim((prev) =>
                        prev
                          ? {
                              ...prev,
                              policyNumber: val,
                              hotel: matched?.hotel || prev.hotel,
                            }
                          : null
                      );
                    }}
                    options={accessiblePolicies.map((p) => ({
                      value: p.policyNumber,
                      label: `${p.policyNumber} - ${p.insuranceType} (${p.hotel})`,
                    }))}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Property
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={editingClaim.hotel}
                    onChange={(val) => setEditingClaim({ ...editingClaim, hotel: val })}
                    options={hotelOptions}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Claim Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editingClaim.claimDate}
                    onChange={(e) =>
                      setEditingClaim({ ...editingClaim, claimDate: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Amount (£)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingClaim.amount}
                    onChange={(e) =>
                      setEditingClaim({ ...editingClaim, amount: Number(e.target.value) || 0 })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Status
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={editingClaim.status}
                    onChange={(val) => setEditingClaim({ ...editingClaim, status: val as any })}
                    options={[
                      { value: 'open', label: 'Open', color: '#f43f5e' },
                      { value: 'in-progress', label: 'In-Progress', color: '#f59e0b' },
                      { value: 'settled', label: 'Settled', color: '#3dd68c' },
                      { value: 'rejected', label: 'Rejected', color: '#94a3b8' },
                    ]}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={editingClaim.description}
                    onChange={(e) =>
                      setEditingClaim({ ...editingClaim, description: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none resize-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="col-span-2">
                  <DocumentUploadField
                    label="Claim Document / Evidence / Report (Optional)"
                    documentName={(editingClaim as any).documentName || (editingClaim as any).document || ''}
                    documentUrl={(editingClaim as any).documentUrl}
                    documentSize={(editingClaim as any).documentSize}
                    onUpload={({ name, url, size }) =>
                      setEditingClaim({
                        ...editingClaim,
                        documentName: name,
                        documentUrl: url,
                        documentSize: size || '',
                      } as any)
                    }
                    onRemove={() =>
                      setEditingClaim({
                        ...editingClaim,
                        documentName: '',
                        documentUrl: '',
                        documentSize: '',
                      } as any)
                    }
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
                  {savingClaim ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 samko-modal-overlay"
          onClick={() => setSelectedClaim(null)}
        >
          <div
            className="rounded-2xl border border-border-strong w-full max-w-lg overflow-hidden shadow-2xl samko-modal-card"
            style={{ background: '#11141a' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-start justify-between p-6 border-b border-border"
              style={{ background: 'var(--surface2)' }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="font-mono text-xs px-2.5 py-0.5 rounded font-bold"
                    style={{ background: 'var(--surface3)', color: 'var(--primary)' }}
                  >
                    {selectedClaim.policyNumber}
                  </span>
                  <span
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize"
                    style={{
                      background: CLAIM_STATUS[selectedClaim.status]?.bg,
                      color: CLAIM_STATUS[selectedClaim.status]?.color,
                    }}
                  >
                    {selectedClaim.status}
                  </span>
                </div>
                <h2 className="font-head font-bold text-lg text-foreground">
                  {selectedClaim.description}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedClaim.hotel} ·{' '}
                  {new Date(selectedClaim.claimDate).toLocaleDateString('en-GB')}
                </p>
              </div>
              <button
                onClick={() => setSelectedClaim(null)}
                className="text-muted-foreground hover:text-foreground text-xl font-bold px-2 py-1 rounded hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-3 rounded-xl border border-border/60"
                  style={{ background: 'var(--surface2)' }}
                >
                  <div className="text-xs text-muted-foreground uppercase">Claim Amount</div>
                  <div className="font-bold text-lg text-primary mt-0.5">
                    {fmt(selectedClaim.amount)}
                  </div>
                </div>
                <div
                  className="p-3 rounded-xl border border-border/60"
                  style={{ background: 'var(--surface2)' }}
                >
                  <div className="text-xs text-muted-foreground uppercase">Claim Date</div>
                  <div className="font-semibold text-sm text-foreground mt-1">
                    {new Date(selectedClaim.claimDate).toLocaleDateString('en-GB')}
                  </div>
                </div>
              </div>
              <div
                className="p-4 rounded-xl border border-border/60"
                style={{ background: 'var(--surface2)' }}
              >
                <div className="text-xs text-muted-foreground uppercase mb-1">Details & Scope</div>
                <p className="text-sm leading-relaxed text-foreground">
                  {selectedClaim.description}
                </p>
              </div>
            </div>
            <div
              className="flex items-center justify-between p-4 border-t border-border"
              style={{ background: 'var(--surface2)' }}
            >
              {hasDeleteAccess && (
                <button
                  onClick={() => {
                    setClaimToDelete(selectedClaim);
                    setSelectedClaim(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/15 border border-rose-500/20 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} /> Delete Claim
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                {hasWriteAccess && (
                  <button
                    onClick={() => {
                      handleOpenEditClaim(selectedClaim);
                      setSelectedClaim(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-surface3 transition-colors cursor-pointer"
                  >
                    <Edit2 size={13} /> Edit Claim
                  </button>
                )}
                <button
                  onClick={() => setSelectedClaim(null)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-rose-500/30 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{ background: 'var(--surface)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/20 text-rose-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-head font-bold text-base text-foreground">
                  Confirm Delete Claim
                </h3>
                <p className="text-xs text-muted-foreground">
                  {claimToDelete.policyNumber} · {claimToDelete.hotel}
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground mb-5">
              Are you sure you want to permanently delete the insurance claim for{' '}
              <strong className="text-foreground">
                "{claimToDelete.description}" ({fmt(claimToDelete.amount)})
              </strong>
              ? This action cannot be undone.
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
      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            style={{ background: 'var(--surface)' }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-border"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}
                >
                  <Tag size={16} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base text-foreground">
                    Manage Insurance Categories
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Add new categories, view assigned policies, rename or delete
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <form onSubmit={handleSaveCategory} className="space-y-3">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Add New Category
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 rounded-lg border border-border text-xs outline-none focus:border-primary"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                    placeholder="e.g. Property & Assets, Financial & Cyber"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!newCatName.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-black cursor-pointer disabled:opacity-50"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              </form>

              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Active Categories ({allCategories.length})
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    Eye to view · Pencil to edit · Trash to delete
                  </span>
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                  {allCategories.map((c) => {
                    const isEditing = editingCat?.oldName === c;
                    return (
                      <div
                        key={c}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 hover:border-border transition-all"
                        style={{ background: 'var(--surface2)' }}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1 mr-2">
                            <input
                              type="text"
                              value={editingCat.newName}
                              onChange={(e) =>
                                setEditingCat({ ...editingCat, newName: e.target.value })
                              }
                              className="flex-1 px-2.5 py-1 rounded-lg border border-primary text-xs outline-none bg-surface text-foreground"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleSaveEditCategory}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary text-black cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCat(null)}
                              className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                  background: 'rgba(232,201,122,0.15)',
                                  color: 'var(--primary)',
                                }}
                              >
                                <Tag size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">
                                  {c}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleViewCategoryRecords(c)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-border hover:bg-surface transition-colors cursor-pointer"
                                style={{
                                  color: 'var(--primary)',
                                  borderColor: 'rgba(232,201,122,0.25)',
                                  background: 'rgba(232,201,122,0.08)',
                                }}
                                title={`Select category ${c}`}
                              >
                                <Eye size={12} />
                                <span className="hidden sm:inline">Records</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCat({ oldName: c, newName: c })}
                                className="p-1.5 rounded-lg border border-border hover:bg-surface text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                title="Rename category"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setCatToDelete(c)}
                                className="p-1.5 rounded-lg border border-border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-colors cursor-pointer"
                                title="Delete category"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border cursor-pointer"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Type Modal */}
      {showAddTypeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            style={{ background: 'var(--surface)' }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-border"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}
                >
                  <Plus size={16} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base text-foreground">
                    Manage Insurance Types
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Add new policy types, view records, rename or delete
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddTypeModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <form onSubmit={handleSaveType} className="space-y-3">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Add New Insurance Type
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 rounded-lg border border-border text-xs outline-none focus:border-primary"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                    placeholder="e.g. Environmental Impairment, Terrorism Cover, Key Person"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!newTypeName.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-black cursor-pointer disabled:opacity-50"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              </form>

              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Active Insurance Types ({allTypes.length})
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    Eye to view · Pencil to edit · Trash to delete
                  </span>
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                  {allTypes.map((t) => {
                    const count = policies.filter((p) => p.insuranceType === t).length;
                    const isEditing = editingType?.oldName === t;

                    return (
                      <div
                        key={t}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 hover:border-border transition-all"
                        style={{ background: 'var(--surface2)' }}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1 mr-2">
                            <input
                              type="text"
                              value={editingType.newName}
                              onChange={(e) =>
                                setEditingType({ ...editingType, newName: e.target.value })
                              }
                              className="flex-1 px-2.5 py-1 rounded-lg border border-primary text-xs outline-none bg-surface text-foreground"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleSaveEditType}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary text-black cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingType(null)}
                              className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                  background: 'rgba(232,201,122,0.15)',
                                  color: 'var(--primary)',
                                }}
                              >
                                <Shield size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">
                                  {t}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {count} {count === 1 ? 'policy' : 'policies'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleViewTypeRecords(t)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-border hover:bg-surface transition-colors cursor-pointer"
                                style={{
                                  color: 'var(--primary)',
                                  borderColor: 'rgba(232,201,122,0.25)',
                                  background: 'rgba(232,201,122,0.08)',
                                }}
                                title={`See records for ${t}`}
                              >
                                <Eye size={12} />
                                <span className="hidden sm:inline">Records</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingType({ oldName: t, newName: t })}
                                className="p-1.5 rounded-lg border border-border hover:bg-surface text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                title="Rename type"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setTypeToDelete(t)}
                                className="p-1.5 rounded-lg border border-border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-colors cursor-pointer"
                                title="Delete type"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddTypeModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border cursor-pointer"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Type Delete Confirmation Dialog */}
      {typeToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-rose-500/30 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{ background: 'var(--surface)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/20 text-rose-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-head font-bold text-base text-foreground">
                  Delete Insurance Type
                </h3>
                <p className="text-xs text-muted-foreground">{typeToDelete}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground mb-5">
              Are you sure you want to remove{' '}
              <strong className="text-foreground">{typeToDelete}</strong> from insurance types?
              {policies.filter((p) => p.insuranceType === typeToDelete).length > 0 && (
                <span className="block mt-2 text-rose-400">
                  Warning: {policies.filter((p) => p.insuranceType === typeToDelete).length} policy
                  record(s) currently use this insurance type.
                </span>
              )}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setTypeToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-surface2 transition-colors cursor-pointer"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteType}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
              >
                <Trash2 size={13} /> Delete Type
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Delete Confirmation Dialog */}
      {catToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-rose-500/30 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{ background: 'var(--surface)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/20 text-rose-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-head font-bold text-base text-foreground">
                  Delete Insurance Category
                </h3>
                <p className="text-xs text-muted-foreground">{catToDelete}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground mb-5">
              Are you sure you want to delete the category{' '}
              <strong className="text-foreground">{catToDelete}</strong>?
              <span className="block mt-2 text-emerald-400 font-medium">
                Note: All existing insurance policies and claims will safely stay in the database.
                Only this category option will be removed from future dropdown selections.
              </span>
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCatToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-surface2 transition-colors cursor-pointer"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
              >
                <Trash2 size={13} /> Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Policies Modal */}
      <ConfirmDeleteModal
        isOpen={showBulkDeletePoliciesModal}
        onClose={() => setShowBulkDeletePoliciesModal(false)}
        onConfirm={handleConfirmBulkDeletePolicies}
        title="Confirm Bulk Deletion"
        itemName={`${selectedPolicyIds.length} Selected Policies`}
        registerName="insurance policies register"
        customWarning={`Are you sure you want to permanently delete these ${selectedPolicyIds.length} selected insurance policies? This action cannot be undone.`}
        confirmButtonText={`Delete ${selectedPolicyIds.length} Policies`}
        isDeleting={isBulkDeletingPolicies}
      />

      {/* Bulk Delete Claims Modal */}
      <ConfirmDeleteModal
        isOpen={showBulkDeleteClaimsModal}
        onClose={() => setShowBulkDeleteClaimsModal(false)}
        onConfirm={handleConfirmBulkDeleteClaims}
        title="Confirm Bulk Deletion"
        itemName={`${selectedClaimIds.length} Selected Claims`}
        registerName="insurance claims register"
        customWarning={`Are you sure you want to permanently delete these ${selectedClaimIds.length} selected claims? This action cannot be undone.`}
        confirmButtonText={`Delete ${selectedClaimIds.length} Claims`}
        isDeleting={isBulkDeletingClaims}
      />
    </div>
  );
}
