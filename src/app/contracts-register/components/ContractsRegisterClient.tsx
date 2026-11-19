'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ScrollText,
  Clock,
  CheckCircle2,
  Plus,
  Search,
  Download,
  Eye,
  Edit2,
  FileText,
  Bell,
  RefreshCw,
  Handshake,
  DollarSign,
  ChevronDown,
  Loader2,
  Trash2,
  AlertTriangle,
  X,
  Upload,
  ExternalLink,
  Calendar,
  Tag,
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import CustomDropdown from '@/components/ui/CustomDropdown';
import DocumentUploadField from '@/components/ui/DocumentUploadField';
import DocumentTableCell from '@/components/ui/DocumentTableCell';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { toast } from 'sonner';
import { useCMSForm } from '@/lib/cmsConfig';
import {
  useDeepPageCms,
  DEFAULT_CONTRACT_CATEGORIES,
  addDropdownOption,
  removeDropdownOptionByName,
} from '@/lib/deepPageCms';
import PageCMSEditButton from '@/components/cms/PageCMSEditButton';
import LoadingPagination from '@/components/ui/LoadingPagination';
import { useLoadingPagination } from '@/hooks/useLoadingPagination';
import TableCheckbox from '@/components/ui/TableCheckbox';
import BulkActionBar from '@/components/ui/BulkActionBar';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import { getLiveProperties } from '@/hooks/useLiveProperties';

type ContractStatus = 'active' | 'expiring-soon' | 'expired' | 'pending' | 'terminated';

interface Contract {
  id: string;
  contractId: string;
  supplierName: string;
  contractName: string;
  category: string;
  hotel: string;
  department: string;
  startDate: string;
  endDate: string;
  renewalDate: string;
  noticePeriod: string;
  autoRenew: boolean;
  contractValue: number;
  monthlyCost: number;
  paymentFrequency: string;
  contractOwner: string;
  supplierContact: string;
  phone: string;
  email: string;
  sla: string;
  status: ContractStatus;
  notes?: string;
  portal?: 'propco' | 'opco';
}

const CONTRACT_CATEGORIES = [
  'Lift Maintenance',
  'Fire Alarm Maintenance',
  'HVAC',
  'Pest Control',
  'Cleaning',
  'Laundry',
  'Waste Collection',
  'Security',
  'Landscaping',
  'Catering Equipment',
  'IT Support',
  'Internet',
  'Telephone',
  'Utilities',
  'Building Maintenance',
  'Roofing',
  'Plumbing',
  'Electrical',
  'Kitchen Equipment',
  'Generator',
  'Pest Inspection',
  'Licensing',
  'Professional Services',
  'F&B Supply',
  'HR & Payroll',
  'Maintenance & Servicing',
  'Waste & Cleaning',
  'Housekeeping',
];

const HOTELS = ['Crowne Plaza Kingston-south', 'Stanhill Court'];

// ─── REAL DATA — Seeded from Samko_Holdings_Master_Contracts_Register ─────────
const MOCK_CONTRACTS: Contract[] = [
  {
    id: '1',
    contractId: 'CON-001',
    supplierName: 'Otis Elevators UK',
    contractName: 'Lift Maintenance & LOLER Inspection',
    category: 'Lift Maintenance',
    hotel: 'Stanhill Court',
    department: 'Facilities',
    startDate: '2025-01-01',
    endDate: '2027-12-31',
    renewalDate: '2027-11-30',
    noticePeriod: '60 days',
    autoRenew: true,
    contractValue: 12500,
    monthlyCost: 1042,
    paymentFrequency: 'Quarterly',
    contractOwner: 'Marcus Webb',
    supplierContact: 'Otis UK Service Desk',
    phone: '+44 800 181 363',
    email: 'service.uk@otis.com',
    sla: '24/7 emergency dispatch < 45 mins; bi-annual LOLER inspections',
    status: 'active',
  },
  {
    id: '2',
    contractId: 'CON-002',
    supplierName: 'Carrier Commercial Services',
    contractName: 'Carrier Rooftop AHU & Chiller Maintenance',
    category: 'HVAC',
    hotel: 'Crowne Plaza Kingston-south',
    department: 'Engineering',
    startDate: '2025-04-01',
    endDate: '2027-03-31',
    renewalDate: '2027-01-31',
    noticePeriod: '30 days',
    autoRenew: true,
    contractValue: 18200,
    monthlyCost: 1517,
    paymentFrequency: 'Monthly',
    contractOwner: 'Marcus Webb',
    supplierContact: 'Carrier Facilities Team',
    phone: '+44 800 242 437',
    email: 'service@carrier.com',
    sla: 'Quarterly filter changes, seasonal commissioning & 4h callout',
    status: 'active',
  },
  {
    id: '3',
    contractId: 'CON-003',
    supplierName: 'Cummins Power Systems',
    contractName: 'Standby Generator Load Bank & Fuel Polishing',
    category: 'Electrical',
    hotel: 'Stanhill Court',
    department: 'Engineering',
    startDate: '2025-06-01',
    endDate: '2027-05-31',
    renewalDate: '2027-04-30',
    noticePeriod: '30 days',
    autoRenew: false,
    contractValue: 9800,
    monthlyCost: 817,
    paymentFrequency: 'Annual',
    contractOwner: 'Sarah Chen',
    supplierContact: 'Cummins UK Service',
    phone: '+44 1293 882 100',
    email: 'generators@cummins.co.uk',
    sla: 'Annual resistive load bank testing, oil sampling & 24/7 emergency start cover',
    status: 'active',
  },
];

const STATUS_CONFIG: Record<ContractStatus, { label: string; bg: string; color: string }> = {
  active: { label: 'Active', bg: 'rgba(61,214,140,0.12)', color: '#3dd68c' },
  'expiring-soon': { label: 'Expiring Soon', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  expired: { label: 'Expired', bg: 'rgba(244,63,94,0.12)', color: '#f43f5e' },
  pending: { label: 'Pending', bg: 'rgba(96,165,250,0.12)', color: '#60a5fa' },
  terminated: { label: 'Terminated', bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
};

function normalizeContract(c: any): Contract {
  const val = Number(c.contractValue ?? c.value ?? 0) || 0;
  const mCost = Number(c.monthlyCost ?? (val > 0 ? Math.round(val / 12) : 0)) || 0;
  const hotel = c.hotel || c.property || 'Crowne Plaza Kingston-south';
  const start = c.startDate && !isNaN(new Date(c.startDate).getTime()) ? c.startDate : '2025-01-01';
  const end = c.endDate && !isNaN(new Date(c.endDate).getTime()) ? c.endDate : '2026-12-31';
  const renewal = c.renewalDate && !isNaN(new Date(c.renewalDate).getTime()) ? c.renewalDate : end;

  return {
    id: String(c.id || c.contractId || Math.random()),
    contractId: c.contractId || `CON-${c.id}`,
    supplierName: c.supplierName || 'Supplier',
    contractName: c.contractName || 'Service Agreement',
    category: c.category || 'Maintenance & Servicing',
    hotel,
    department: c.department || 'Operations',
    startDate: start,
    endDate: end,
    renewalDate: renewal,
    noticePeriod: c.noticePeriod || '30 days',
    autoRenew: Boolean(c.autoRenew),
    contractValue: val,
    monthlyCost: mCost,
    paymentFrequency: c.paymentFrequency || 'Monthly',
    contractOwner: c.contractOwner || 'Marcus Webb',
    supplierContact: c.supplierContact || 'Supplier Contact',
    phone: c.phone || '+44 20 0000 0000',
    email: c.email || 'info@supplier.co.uk',
    sla: c.sla || 'Standard SLA Terms',
    status: (c.status as ContractStatus) || 'active',
    notes: c.notes || '',
  };
}

function daysUntil(dateStr?: string): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  const now = new Date('2026-07-22');
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmt(n: number) {
  return `£${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function KPICard({
  label,
  value,
  sub,
  color,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  sub: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div
      className="rounded-xl border border-border px-4 py-3.5 relative overflow-hidden"
      style={{ background: 'var(--surface)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div
            className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 whitespace-nowrap truncate"
            title={label}
          >
            {label}
          </div>
          <div
            className="font-head font-bold text-2xl xl:text-[26px] tracking-tight whitespace-nowrap leading-tight truncate"
            style={{ color }}
          >
            {value}
          </div>
          <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap truncate">{sub}</div>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18` }}
        >
          <Icon size={16} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

export default function ContractsRegisterClient() {
  const { isViewer, canEdit, canDelete, canWriteTab, isPropertyAccessible, activePortal } = useAuth();
  const hasWriteAccess = !isViewer && canEdit && canWriteTab('contracts');
  const hasDeleteAccess = !isViewer && canDelete && canWriteTab('contracts');
  const {
    title: cmsTitle,
    subtitle: cmsSubtitle,
    searchPlaceholder: cmsSearchPlaceholder,
    primaryActionLabel: cmsPrimaryActionLabel,
    columns: cmsColumns,
    items: cmsItems,
    dropdowns: cmsDropdowns,
  } = useDeepPageCms('contracts');

  const activeColumns = useMemo(() => {
    let cols: any[] = [];
    if (cmsColumns && cmsColumns.length > 0) {
      cols = [...cmsColumns].filter((c) => c.visible !== false);
    } else {
      cols = [
        { id: 'contractId', label: 'ID', visible: true, order: 1 },
        { id: 'contractName', label: 'Contract', visible: true, order: 2 },
        { id: 'supplierName', label: 'Supplier', visible: true, order: 3 },
        { id: 'category', label: 'Category', visible: true, order: 4 },
        { id: 'hotel', label: 'Property', visible: true, order: 5 },
        { id: 'contractValue', label: 'Value', visible: true, order: 6 },
        { id: 'endDate', label: 'End Date', visible: true, order: 7 },
        { id: 'daysLeft', label: 'Days Left', visible: true, order: 8 },
        { id: 'autoRenew', label: 'Auto Renew', visible: true, order: 9 },
        { id: 'contractOwner', label: 'Owner', visible: true, order: 10 },
        { id: 'status', label: 'Status', visible: true, order: 11 },
        { id: 'document', label: 'Document', visible: true, order: 12 },
        { id: 'actions', label: 'Actions', visible: true, order: 13 },
      ];
    }

    const nonActions = cols
      .filter(
        (c) =>
          c.id.toLowerCase() !== 'actions' &&
          c.id.toLowerCase() !== 'document' &&
          c.id.toLowerCase() !== 'attachment'
      )
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const docCol = cols.find(
      (c) => c.id.toLowerCase() === 'document' || c.id.toLowerCase() === 'attachment'
    ) || {
      id: 'document',
      label: 'Document',
      visible: true,
      order: 9998,
    };

    const actionsCol = cols.find((c) => c.id.toLowerCase() === 'actions') || {
      id: 'actions',
      label: 'Actions',
      visible: true,
      order: 9999,
    };

    return [...nonActions, docCol, actionsCol];
  }, [cmsColumns]);

  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams?.get('tab');
  const initialTab: 'register' | 'suppliers' | 'renewals' | 'slas' =
    tabParam === 'suppliers' || tabParam === 'renewals' || tabParam === 'slas'
      ? tabParam
      : 'register';

  const [contracts, setContracts] = useState<Contract[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('samko_cache_contracts');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed.length <= 3)
            return parsed.map(normalizeContract);
          else {
            sessionStorage.removeItem('samko_cache_contracts');
            localStorage.removeItem('samko_contracts_data');
          }
        }
      } catch {}
    }
    if (cmsItems && cmsItems.length > 0) return (cmsItems as any).map(normalizeContract);
    return MOCK_CONTRACTS.map(normalizeContract);
  });

  useEffect(() => {
    if (cmsItems && cmsItems.length > 0) {
      setContracts((cmsItems as any).map(normalizeContract));
    }
  }, [cmsItems]);
  const [properties, setProperties] = useState<any[]>(() => getLiveProperties());
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'register' | 'suppliers' | 'renewals' | 'slas'>(
    initialTab
  );

  useEffect(() => {
    const t = searchParams?.get('tab');
    if (t === 'suppliers' || t === 'renewals' || t === 'slas') {
      setActiveTab(t);
    } else {
      setActiveTab('register');
    }
  }, [searchParams]);

  const portalParam = searchParams?.get('portal');
  const isOpCo = portalParam === 'opco' || (!portalParam && activePortal === 'opco');

  const handleTabChange = (t: 'register' | 'suppliers' | 'renewals' | 'slas') => {
    setActiveTab(t);
    const portalQuery = portalParam ? `portal=${portalParam}` : '';
    const base = t === 'register' ? '/contracts-register' : `/contracts-register?tab=${t}`;
    const url = portalQuery ? (t === 'register' ? `${base}?${portalQuery}` : `${base}&${portalQuery}`) : base;
    router.push(url, { scroll: false });
  };
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterHotel, setFilterHotel] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  // Dynamic Categories state
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('samko_contract_categories');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  const categoryDropdown = (cmsDropdowns || []).find((d) => d.id === 'category');
  const allCategories = useMemo(() => {
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

    DEFAULT_CONTRACT_CATEGORIES.forEach((c) => {
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

    contracts.forEach((c) => {
      const clean = (c.category || '').trim();
      if (clean && !deleted.has(clean.toLowerCase())) {
        merged.add(clean);
      }
    });

    return Array.from(merged).sort();
  }, [categoryDropdown, customCategories, contracts]);

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catToDelete, setCatToDelete] = useState<string | null>(null);
  const [editingCat, setEditingCat] = useState<{ oldName: string; newName: string } | null>(null);

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const c = newCatName.trim();
    if (!c) return;
    addDropdownOption('contracts', 'category', c);
    if (!customCategories.includes(c)) {
      const updated = [...customCategories, c];
      setCustomCategories(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('samko_contract_categories', JSON.stringify(updated));
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', { detail: { type: 'contract_category', name: c } })
        );
      }
    }
    toast.success('Contract Category Created', {
      description: `Added "${c}" to contract categories`,
    });
    setNewCatName('');
  };

  const handleDeleteCategory = (catName: string) => {
    removeDropdownOptionByName('contracts', 'category', catName);
    const updated = customCategories.filter((c) => c.toLowerCase() !== catName.toLowerCase());
    setCustomCategories(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('samko_contract_categories', JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'contract_category_deleted', name: catName },
        })
      );
    }
    setFilterCategory((prev) => prev.filter((c) => c !== catName));
    toast.success(`Removed category "${catName}"`);
  };

  const handleViewCategoryRecords = (catName: string) => {
    setFilterCategory([catName]);
    setShowAddCategoryModal(false);
    const count = contracts.filter((c) => c.category === catName).length;
    toast.info(`Filtered to ${catName}`, {
      description: `Showing ${count} contract(s) matching category "${catName}"`,
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
        localStorage.setItem('samko_contract_categories', JSON.stringify(updatedCustom));
      } catch {}
    }
    removeDropdownOptionByName('contracts', 'category', oldName);
    addDropdownOption('contracts', 'category', newName);

    const updatedContracts = contracts.map((c) => {
      if (c.category === oldName) {
        return { ...c, category: newName };
      }
      return c;
    });
    setContracts(updatedContracts);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('samko_contracts_data', JSON.stringify(updatedContracts));
      } catch {}
    }
    setEditingCat(null);
    toast.success(`Renamed category "${oldName}" to "${newName}"`);
  };

  const handleConfirmDeleteCategory = () => {
    if (!catToDelete) return;
    handleDeleteCategory(catToDelete);
    setCatToDelete(null);
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit contract modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);

  // Set reminder modal state
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderDays, setReminderDays] = useState(30);
  const [reminderNote, setReminderNote] = useState('');

  // Documents modal state
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [documentsList, setDocumentsList] = useState<
    Array<{ id: string; name: string; size: string; date: string; type: string; url?: string }>
  >([
    {
      id: 'doc-1',
      name: 'Master_Service_Agreement_Executed.pdf',
      size: '2.4 MB',
      date: '12 Jan 2026',
      type: 'agreement',
    },
    {
      id: 'doc-2',
      name: 'SLA_Maintenance_Schedule_Scope.pdf',
      size: '1.1 MB',
      date: '15 Jan 2026',
      type: 'sla',
    },
    {
      id: 'doc-3',
      name: 'Statutory_Compliance_Certificate.pdf',
      size: '890 KB',
      date: '01 Feb 2026',
      type: 'certificate',
    },
  ]);

  // Delete confirmation state
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    supplierName: '',
    contractName: '',
    category: CONTRACT_CATEGORIES[0],
    hotel: HOTELS[0],
    department: 'Operations',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    renewalDate: new Date(Date.now() + 330 * 86400000).toISOString().slice(0, 10),
    noticePeriod: '30 days',
    autoRenew: false,
    contractValue: '',
    monthlyCost: '',
    paymentFrequency: 'Monthly',
    contractOwner: 'Marcus Webb',
    supplierContact: '',
    phone: '',
    email: '',
    sla: 'Standard Support & Maintenance SLA',
    status: 'active' as ContractStatus,
    notes: '',
  });

  const fetchContractsData = useCallback(async () => {
    try {
      setLoading(true);
      const [res, propsRes] = await Promise.all([
        api.contracts.getAll().catch(() => ({ success: false, data: [] })),
        api.properties.getAll().catch(() => ({ success: false, data: [] })),
      ]);
      if (res.success && res.data && res.data.length > 0) {
        setContracts(res.data.map(normalizeContract));
        try {
          sessionStorage.setItem('samko_cache_contracts', JSON.stringify(res.data));
        } catch {}
      } else {
        setContracts(MOCK_CONTRACTS.map(normalizeContract));
      }
      if (propsRes.success && propsRes.data && propsRes.data.length > 0) {
        setProperties(propsRes.data);
      }
    } catch (err) {
      console.warn('Contracts offline/fallback:', err);
      setContracts(MOCK_CONTRACTS.map(normalizeContract));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContractsData();
  }, [fetchContractsData]);

  useEffect(() => {
    const handleDataChanged = (e: any) => {
      if (e.detail?.type === 'contracts' || e.detail?.type === 'properties') {
        fetchContractsData();
      }
    };
    window.addEventListener('samko:data-changed', handleDataChanged);
    return () => window.removeEventListener('samko:data-changed', handleDataChanged);
  }, [fetchContractsData]);

  const propertyOptions = useMemo(() => {
    return Array.from(
      new Set([
        ...properties.map((p) => p.name),
        ...contracts.map((c) => c.hotel).filter(Boolean),
        ...HOTELS,
      ])
    )
      .filter((p) => isPropertyAccessible(p))
      .sort();
  }, [properties, contracts, isPropertyAccessible]);

  const { getDropdownOptions, getFieldLabel, customFields } = useCMSForm('contracts');

  const cmsCategoryOptions = allCategories.map((c) => ({ value: c, label: c }));
  const cmsStatusOptions = getDropdownOptions('status', [
    { value: 'active', label: 'Active', color: '#3dd68c' },
    { value: 'expiring-soon', label: 'Expiring Soon', color: '#f59e0b' },
    { value: 'expired', label: 'Expired', color: '#f43f5e' },
    { value: 'pending', label: 'Pending', color: '#60a5fa' },
    { value: 'terminated', label: 'Terminated', color: '#94a3b8' },
  ]);
  const cmsHotelOptions = getDropdownOptions(
    'hotel',
    propertyOptions.map((h) => ({ value: h, label: h }))
  );

  const handleStatusChange = async (id: string, newStatus: ContractStatus) => {
    if (isViewer || !canEdit) {
      toast.error('Permission Denied', {
        description: 'L4 Viewers have read-only access. Status changes are disabled.',
      });
      return;
    }
    setContracts((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));
    if (selectedContract && selectedContract.id === id) {
      setSelectedContract((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    toast.success(`Status updated to ${newStatus}`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'contracts', id, status: newStatus },
        })
      );
    }
    try {
      await api.contracts.update(id, { status: newStatus });
    } catch (e) {
      console.warn('Contract status updated locally:', e);
    }
  };

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contractName.trim() || !formData.supplierName.trim()) return;
    setSaving(true);
    const tempId = `CON-${String(contracts.length + 1).padStart(3, '0')}`;
    const payload = normalizeContract({
      ...formData,
      contractId: tempId,
      contractValue: Number(formData.contractValue) || 0,
      monthlyCost: Number(formData.monthlyCost) || 0,
      portal: isOpCo ? 'opco' : 'propco',
    });
    try {
      const res = await api.contracts.create(payload);
      const created = normalizeContract(res.data || { ...payload, id: `con-${Date.now()}` });
      setContracts((prev) => [created, ...prev]);
      setShowAddModal(false);
      toast.success('Contract added successfully');
      setFormData({
        supplierName: '',
        contractName: '',
        category: CONTRACT_CATEGORIES[0],
        hotel: propertyOptions[0] || HOTELS[0],
        department: 'Operations',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
        renewalDate: new Date(Date.now() + 330 * 86400000).toISOString().slice(0, 10),
        noticePeriod: '30 days',
        autoRenew: false,
        contractValue: '',
        monthlyCost: '',
        paymentFrequency: 'Monthly',
        contractOwner: 'Marcus Webb',
        supplierContact: '',
        phone: '',
        email: '',
        sla: 'Standard Support & Maintenance SLA',
        status: 'active' as ContractStatus,
        notes: '',
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', {
            detail: { type: 'contracts', id: created.id },
          })
        );
      }
    } catch (err: any) {
      console.warn('Contract created locally:', err);
      const created = normalizeContract({ ...payload, id: `con-${Date.now()}` });
      setContracts((prev) => [created, ...prev]);
      setShowAddModal(false);
      toast.success('Contract added locally');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (contract: Contract) => {
    setEditFormData({
      ...contract,
      contractValue: String(contract.contractValue || ''),
      monthlyCost: String(contract.monthlyCost || ''),
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    setSaving(true);
    const updated = normalizeContract({
      ...editFormData,
      contractValue: Number(editFormData.contractValue) || 0,
      monthlyCost: Number(editFormData.monthlyCost) || 0,
    });
    setContracts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (selectedContract && selectedContract.id === updated.id) {
      setSelectedContract(updated);
    }
    try {
      await api.contracts.update(updated.id, updated);
      toast.success('Contract updated successfully');
    } catch (err) {
      toast.success('Contract updated locally');
    } finally {
      setSaving(false);
      setShowEditModal(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', {
            detail: { type: 'contracts', id: updated.id },
          })
        );
      }
    }
  };

  const handleDeleteContract = async () => {
    if (!contractToDelete) return;
    const id = contractToDelete.id;
    setDeleting(true);
    setContracts((prev) => prev.filter((c) => c.id !== id));
    if (selectedContract && selectedContract.id === id) {
      setSelectedContract(null);
    }
    try {
      await api.contracts.delete(id);
      toast.success('Contract deleted permanently', {
        description: `${contractToDelete.supplierName} removed from contracts register`,
      });
    } catch (err) {
      toast.success('Contract deleted permanently', {
        description: `${contractToDelete.supplierName} removed from contracts register`,
      });
    } finally {
      setDeleting(false);
      setContractToDelete(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', {
            detail: { type: 'contracts', id },
          })
        );
      }
    }
  };

  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;
    toast.success(
      `Reminder scheduled ${reminderDays} days prior to renewal (${formatDate(selectedContract.renewalDate)})`
    );
    setShowReminderModal(false);
    setReminderNote('');
  };

  const handleUploadDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isViewer) {
      toast.error('Permission Denied', {
        description: 'L4 Viewers have read-only access. Document upload is disabled.',
      });
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      date: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      type: file.name.split('.').pop() || 'pdf',
    };
    setDocumentsList((prev) => [newDoc, ...prev]);
    toast.success(`Uploaded ${file.name}`);
  };

  const accessibleContracts = useMemo(() => {
    return contracts.filter((c) => {
      const itemPortal = (c as any).portal || 'propco';
      if (isOpCo && itemPortal !== 'opco') return false;
      if (!isOpCo && itemPortal === 'opco') return false;
      return isPropertyAccessible(c.hotel || (c as any).property || (c as any).site);
    });
  }, [contracts, isPropertyAccessible, isOpCo]);

  const activeContracts = accessibleContracts.filter((c) => c.status === 'active').length;
  const expiringSoon = accessibleContracts.filter((c) => c.status === 'expiring-soon').length;
  const renewalsDue = accessibleContracts.filter((c) => {
    const d = daysUntil(c.renewalDate);
    return !isNaN(d) && d >= 0 && d <= 90;
  }).length;
  const autoRenewCount = accessibleContracts.filter((c) => c.autoRenew).length;
  const totalValue = accessibleContracts
    .filter((c) => c.status === 'active')
    .reduce((sum, c) => sum + (Number(c.contractValue) || 0), 0);
  const annualValDisplay =
    isNaN(totalValue) || totalValue === 0
      ? '£0'
      : totalValue >= 1000
        ? `£${(totalValue / 1000).toFixed(0)}k`
        : `£${totalValue.toLocaleString()}`;

  const filtered = accessibleContracts.filter((c) => {
    const matchSearch =
      !search ||
      (c.contractId || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.supplierName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.contractName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.hotel || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus.length === 0 ||
      filterStatus.some((s) => s.trim().toLowerCase() === (c.status || '').trim().toLowerCase());
    const matchHotel =
      filterHotel.length === 0 ||
      filterHotel.some((h) => h.trim().toLowerCase() === (c.hotel || '').trim().toLowerCase());
    const matchCat =
      filterCategory.length === 0 ||
      filterCategory.some(
        (cat) => cat.trim().toLowerCase() === (c.category || '').trim().toLowerCase()
      );
    return matchSearch && matchStatus && matchHotel && matchCat;
  });

  const {
    currentPage,
    pageSize,
    totalRecords,
    paginatedItems: paginatedContracts,
    isPageLoading,
    changePage,
    changePageSize,
  } = useLoadingPagination(filtered, 10);

  // Multi-select Contracts State
  const [selectedContractIds, setSelectedContractIds] = useState<string[]>([]);
  const [isBulkDeletingContracts, setIsBulkDeletingContracts] = useState(false);
  const [showBulkDeleteContractsModal, setShowBulkDeleteContractsModal] = useState(false);
  const [selectedContractTypeFilter, setSelectedContractTypeFilter] = useState('');

  const isAllContractsPageSelected =
    paginatedContracts.length > 0 &&
    paginatedContracts.every((c) => selectedContractIds.includes(c.id));
  const isSomeContractsPageSelected =
    paginatedContracts.some((c) => selectedContractIds.includes(c.id)) &&
    !isAllContractsPageSelected;

  const handleToggleSelectAllContractsPage = () => {
    if (isAllContractsPageSelected) {
      const pageIds = new Set(paginatedContracts.map((c) => c.id));
      setSelectedContractIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = paginatedContracts.map((c) => c.id);
      setSelectedContractIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleContractSelect = (id: string) => {
    setSelectedContractIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFilteredContracts = () => {
    setSelectedContractIds(filtered.map((c) => c.id));
  };

  const handleClearContractSelection = () => {
    setSelectedContractIds([]);
    setSelectedContractTypeFilter('');
  };

  const contractTypeOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((c) => {
      counts[`cat:${c.category}`] = (counts[`cat:${c.category}`] || 0) + 1;
      counts[`hotel:${c.hotel}`] = (counts[`hotel:${c.hotel}`] || 0) + 1;
      counts[`status:${c.status}`] = (counts[`status:${c.status}`] || 0) + 1;
    });

    const opts: { label: string; value: string; count: number }[] = [];
    allCategories.forEach((cat) => {
      if (counts[`cat:${cat}`])
        opts.push({ label: `Category: ${cat}`, value: `cat:${cat}`, count: counts[`cat:${cat}`] });
    });
    HOTELS.forEach((h) => {
      if (counts[`hotel:${h}`])
        opts.push({ label: `Property: ${h}`, value: `hotel:${h}`, count: counts[`hotel:${h}`] });
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
    if (counts['status:pending'])
      opts.push({
        label: 'Status: Pending',
        value: 'status:pending',
        count: counts['status:pending'],
      });

    return opts;
  }, [filtered, allCategories]);

  const handleSelectContractByType = (typeKey: string) => {
    setSelectedContractTypeFilter(typeKey);
    if (!typeKey) {
      setSelectedContractIds([]);
      return;
    }
    const [kind, val] = typeKey.split(':');
    const matched = filtered.filter((c) => {
      if (kind === 'cat') return c.category === val;
      if (kind === 'hotel') return c.hotel === val;
      if (kind === 'status') return c.status === val;
      return false;
    });
    setSelectedContractIds(matched.map((c) => c.id));
    toast.info(`Selected ${matched.length} contracts matching ${typeKey.replace(':', ': ')}`);
  };

  const handleConfirmBulkDeleteContracts = async () => {
    if (selectedContractIds.length === 0) return;
    setIsBulkDeletingContracts(true);
    try {
      const ids = [...selectedContractIds];
      const count = ids.length;
      setContracts((prev) => prev.filter((c) => !ids.includes(c.id)));
      setSelectedContractIds([]);
      setSelectedContractTypeFilter('');
      setShowBulkDeleteContractsModal(false);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', { detail: { type: 'contracts' } })
        );
      }
      await Promise.allSettled(ids.map((id) => api.contracts.delete(id)));
      toast.success(`Deleted ${count} contracts successfully!`);
    } catch (err: any) {
      toast.error('Failed to bulk delete contracts');
    } finally {
      setIsBulkDeletingContracts(false);
    }
  };

  const suppliers = Array.from(
    new Map(accessibleContracts.map((c) => [c.supplierName, c])).values()
  );
  const renewals = accessibleContracts
    .filter((c) => {
      const d = daysUntil(c.renewalDate);
      return d >= 0 && d <= 120;
    })
    .sort((a, b) => daysUntil(a.renewalDate) - daysUntil(b.renewalDate));

  const handleExport = () => {
    const headers = [
      'Contract ID',
      'Contract Name',
      'Supplier',
      'Category',
      'Property',
      'Annual Value',
      'Start Date',
      'End Date',
      'Renewal Date',
      'Status',
      'Auto Renew',
    ];
    const rows = filtered.map((c) => [
      `"${c.contractId}"`,
      `"${c.contractName.replace(/"/g, '""')}"`,
      `"${c.supplierName.replace(/"/g, '""')}"`,
      `"${c.category}"`,
      `"${c.hotel}"`,
      c.contractValue,
      `"${c.startDate}"`,
      `"${c.endDate}"`,
      `"${c.renewalDate}"`,
      `"${c.status}"`,
      c.autoRenew ? 'Yes' : 'No',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'contracts_register.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} contracts to CSV`);
  };

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
              {cmsTitle || (isOpCo ? 'OpCo Contracts & Supplier Register' : 'PropCo Contracts & Supplier Register')}
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
                ? `Operational supplier and service agreements — ${accessibleContracts.length} OpCo contracts`
                : `Capital asset supplier and service contracts — ${accessibleContracts.length} PropCo contracts across all properties`)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PageCMSEditButton pageId="contracts" pageName="Contracts Register" />

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
                onClick={() => setShowAddCategoryModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border border-border transition-colors hover:border-primary cursor-pointer"
                style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
              >
                <Tag size={13} style={{ color: 'var(--primary)' }} />
                Add Category
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95 cursor-pointer"
                style={{ background: 'var(--primary)', color: '#000' }}
              >
                <Plus size={14} />{' '}
                {(cmsPrimaryActionLabel || 'Add Contract').replace(/^[\+\s]+/, '').trim()}
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
        className="grid gap-3 px-6 pt-4 pb-3 flex-shrink-0"
        style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}
      >
        <KPICard
          label="Active Contracts"
          value={activeContracts}
          sub="Currently active"
          color="#3dd68c"
          icon={ScrollText}
        />
        <KPICard
          label="Expiring Soon"
          value={expiringSoon}
          sub="Requires attention"
          color="#f59e0b"
          icon={Clock}
        />
        <KPICard
          label="Renewals Due"
          value={renewalsDue}
          sub="Within 90 days"
          color="#f97316"
          icon={RefreshCw}
        />
        <KPICard
          label="Auto Renewal"
          value={autoRenewCount}
          sub="Auto-renewing contracts"
          color="#60a5fa"
          icon={CheckCircle2}
        />
        <KPICard
          label="Annual Value"
          value={annualValDisplay}
          sub="Active contract value"
          color="#a78bfa"
          icon={DollarSign}
        />
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-0 px-6 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        {[
          { id: 'register', label: 'Contracts Register' },
          { id: 'suppliers', label: 'Suppliers' },
          { id: 'renewals', label: 'Renewals' },
          { id: 'slas', label: 'SLAs' },
        ].map((tab) => (
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

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {activeTab === 'register' && (
          <>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 flex-1 min-w-48"
                style={{ background: 'var(--surface)' }}
              >
                <Search size={13} className="text-muted-foreground flex-shrink-0" />
                <input
                  className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground"
                  placeholder="Search contracts…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <CustomDropdown
                label={`All ${getFieldLabel('status', 'Statuses')}`}
                value={filterStatus}
                multiple
                options={cmsStatusOptions}
                onChange={setFilterStatus}
              />
              <CustomDropdown
                label={`All ${getFieldLabel('hotel', 'Properties')}`}
                value={filterHotel}
                multiple
                options={cmsHotelOptions}
                onChange={setFilterHotel}
              />
              <CustomDropdown
                label={`All ${getFieldLabel('category', 'Contract Types')}`}
                value={filterCategory}
                multiple
                options={cmsCategoryOptions}
                onChange={setFilterCategory}
              />
              <span className="text-xs text-muted-foreground">{filtered.length} contracts</span>
            </div>
            <div
              className="rounded-xl border border-border overflow-x-auto shadow-sm"
              style={{ background: 'var(--surface)' }}
            >
              <table className="w-full text-left border-collapse" style={{ minWidth: 960 }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)' }}>
                    {hasDeleteAccess && (
                      <th className="px-3 py-3 w-10 text-center">
                        <TableCheckbox
                          checked={isAllContractsPageSelected}
                          indeterminate={isSomeContractsPageSelected}
                          onChange={handleToggleSelectAllContractsPage}
                          title="Select all on this page"
                        />
                      </th>
                    )}
                    {activeColumns.map((col: any) => (
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
                  {paginatedContracts.map((contract) => {
                    const days = daysUntil(contract.endDate);
                    const sc = STATUS_CONFIG[contract.status] || STATUS_CONFIG.active;
                    return (
                      <tr
                        key={contract.id}
                        className={`border-t border-border cursor-pointer transition-colors ${selectedContractIds.includes(contract.id) ? 'bg-[#e8c97a]/5' : ''}`}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = selectedContractIds.includes(
                            contract.id
                          )
                            ? 'rgba(232,201,122,0.08)'
                            : 'var(--surface2)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = selectedContractIds.includes(
                            contract.id
                          )
                            ? 'rgba(232,201,122,0.05)'
                            : 'transparent')
                        }
                        onClick={() => setSelectedContract(contract)}
                      >
                        {hasDeleteAccess && (
                          <td
                            className="px-3 py-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <TableCheckbox
                              checked={selectedContractIds.includes(contract.id)}
                              onChange={() => handleToggleContractSelect(contract.id)}
                              title={`Select ${contract.contractName}`}
                            />
                          </td>
                        )}
                        {activeColumns.map((col: any) => {
                          const colKey = col.id.toLowerCase();
                          if (colKey === 'contractid' || colKey === 'id') {
                            return (
                              <td
                                key={col.id}
                                className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap"
                              >
                                {contract.contractId}
                              </td>
                            );
                          }
                          if (
                            colKey === 'contractname' ||
                            colKey === 'contract' ||
                            colKey === 'name'
                          ) {
                            return (
                              <td key={col.id} className="px-4 py-3">
                                <div className="font-medium text-sm max-w-48 truncate">
                                  {contract.contractName}
                                </div>
                              </td>
                            );
                          }
                          if (colKey === 'suppliername' || colKey === 'supplier') {
                            return (
                              <td
                                key={col.id}
                                className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap"
                              >
                                {contract.supplierName}
                              </td>
                            );
                          }
                          if (colKey === 'category') {
                            return (
                              <td key={col.id} className="px-4 py-3">
                                <span
                                  className="text-xs px-2 py-0.5 rounded"
                                  style={{ background: 'var(--surface3)', color: 'var(--text2)' }}
                                >
                                  {contract.category}
                                </span>
                              </td>
                            );
                          }
                          if (colKey === 'hotel' || colKey === 'property') {
                            return (
                              <td
                                key={col.id}
                                className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap max-w-32 truncate"
                              >
                                {contract.hotel}
                              </td>
                            );
                          }
                          if (colKey === 'contractvalue' || colKey === 'value') {
                            return (
                              <td
                                key={col.id}
                                className="px-4 py-3 text-sm font-medium whitespace-nowrap"
                              >
                                {contract.contractValue > 0
                                  ? fmt(contract.contractValue) + '/yr'
                                  : 'Variable'}
                              </td>
                            );
                          }
                          if (colKey === 'monthlycost' || colKey === 'monthly') {
                            return (
                              <td key={col.id} className="px-4 py-3 text-sm whitespace-nowrap">
                                {contract.monthlyCost > 0 ? fmt(contract.monthlyCost) : '—'}
                              </td>
                            );
                          }
                          if (colKey === 'enddate') {
                            return (
                              <td key={col.id} className="px-4 py-3 text-sm whitespace-nowrap">
                                {new Date(contract.endDate).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </td>
                            );
                          }
                          if (colKey === 'noticeperiod' || colKey === 'notice') {
                            return (
                              <td
                                key={col.id}
                                className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap"
                              >
                                {contract.noticePeriod ? `${contract.noticePeriod} days` : '—'}
                              </td>
                            );
                          }
                          if (colKey === 'daysleft') {
                            return (
                              <td
                                key={col.id}
                                className="px-4 py-3 text-sm font-semibold whitespace-nowrap"
                                style={{
                                  color:
                                    days < 0
                                      ? '#f43f5e'
                                      : days <= 30
                                        ? '#f59e0b'
                                        : days <= 90
                                          ? '#f97316'
                                          : '#3dd68c',
                                }}
                              >
                                {days < 0
                                  ? `${Math.abs(days)}d ago`
                                  : days > 3000
                                    ? '∞'
                                    : `${days}d`}
                              </td>
                            );
                          }
                          if (colKey === 'autorenew') {
                            return (
                              <td key={col.id} className="px-4 py-3 text-center">
                                <span
                                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                  style={{
                                    background: contract.autoRenew
                                      ? 'rgba(61,214,140,0.12)'
                                      : 'rgba(148,163,184,0.12)',
                                    color: contract.autoRenew ? '#3dd68c' : '#94a3b8',
                                  }}
                                >
                                  {contract.autoRenew ? 'Yes' : 'No'}
                                </span>
                              </td>
                            );
                          }
                          if (colKey === 'contractowner' || colKey === 'owner') {
                            return (
                              <td
                                key={col.id}
                                className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap"
                              >
                                {contract.contractOwner}
                              </td>
                            );
                          }
                          if (colKey === 'status') {
                            if (isViewer || !canEdit) {
                              return (
                                <td
                                  key={col.id}
                                  className="px-4 py-3"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold select-none"
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
                                </td>
                              );
                            }
                            return (
                              <td
                                key={col.id}
                                className="px-4 py-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <CustomDropdown
                                  size="sm"
                                  variant="pill"
                                  value={contract.status}
                                  onChange={(val) =>
                                    handleStatusChange(contract.id, val as ContractStatus)
                                  }
                                  options={[
                                    { value: 'active', label: 'Active', color: '#3dd68c' },
                                    {
                                      value: 'expiring-soon',
                                      label: 'Expiring Soon',
                                      color: '#f59e0b',
                                    },
                                    { value: 'expired', label: 'Expired', color: '#f43f5e' },
                                    { value: 'pending', label: 'Pending', color: '#60a5fa' },
                                    { value: 'terminated', label: 'Terminated', color: '#94a3b8' },
                                  ]}
                                  style={{
                                    background: sc.bg,
                                    color: sc.color,
                                    border: `1px solid ${sc.color}33`,
                                  }}
                                />
                              </td>
                            );
                          }
                          if (colKey === 'document') {
                            return (
                              <td
                                key={col.id}
                                className="px-4 py-3 text-xs"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DocumentTableCell
                                  documentName={
                                    (contract as any).documentName ||
                                    (contract as any).attachmentName ||
                                    (contract as any).document ||
                                    (contract as any).contractFile
                                  }
                                  documentUrl={
                                    (contract as any).documentUrl ||
                                    (contract as any).attachmentUrl ||
                                    (contract as any).fileUrl
                                  }
                                />
                              </td>
                            );
                          }
                          if (colKey === 'actions') {
                            return (
                              <td
                                key={col.id}
                                className="px-4 py-3 text-right"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    className="p-1.5 rounded-lg hover:bg-surface2 transition-colors"
                                    style={{ color: 'var(--text2)' }}
                                    title="View Contract Details"
                                    onClick={() => setSelectedContract(contract)}
                                  >
                                    <Eye size={14} />
                                  </button>
                                  {hasWriteAccess && (
                                    <button
                                      className="p-1.5 rounded-lg hover:bg-surface2 transition-colors"
                                      style={{ color: 'var(--primary)' }}
                                      title="Edit Contract"
                                      onClick={() => handleOpenEdit(contract)}
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                  )}
                                  {hasDeleteAccess && (
                                    <button
                                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors"
                                      title="Delete Contract"
                                      onClick={() => setContractToDelete(contract)}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            );
                          }

                          // Dynamic custom columns
                          const val = (contract as any)[col.id] ?? (contract as any)[colKey];
                          return (
                            <td
                              key={col.id}
                              className="px-4 py-3 text-sm text-foreground whitespace-nowrap"
                            >
                              {val !== undefined && val !== null && String(val).trim() !== ''
                                ? String(val)
                                : '—'}
                            </td>
                          );
                        })}
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
              recordName="contracts"
            />

            {/* Floating Bulk Action Bar (Only shown for authorized delete users) */}
            {hasDeleteAccess && (
              <div className="mt-4">
                <BulkActionBar
                  selectedCount={selectedContractIds.length}
                  totalCount={filtered.length}
                  onClearSelection={handleClearContractSelection}
                  onSelectAll={handleSelectAllFilteredContracts}
                  onDeleteSelected={() => setShowBulkDeleteContractsModal(true)}
                  typeOptions={contractTypeOptions}
                  onSelectByType={handleSelectContractByType}
                  selectedTypeValue={selectedContractTypeFilter}
                  typePlaceholder="Select all of type (Category, Property, Status)..."
                  recordName="contracts"
                  isDeleting={isBulkDeletingContracts}
                />
              </div>
            )}
          </>
        )}

        {activeTab === 'suppliers' && (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
          >
            {suppliers.map((s) => {
              const supplierContracts = contracts.filter((c) => c.supplierName === s.supplierName);
              const totalVal = supplierContracts.reduce((sum, c) => sum + c.contractValue, 0);
              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-border p-5 cursor-pointer transition-colors"
                  style={{ background: 'var(--surface)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-head font-bold text-sm">{s.supplierName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{s.category}</div>
                    </div>
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(232,201,122,0.1)' }}
                    >
                      <Handshake size={16} style={{ color: 'var(--primary)' }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="rounded-lg p-2.5" style={{ background: 'var(--surface2)' }}>
                      <div className="text-xs text-muted-foreground">Contracts</div>
                      <div className="font-head font-bold text-lg" style={{ color: '#60a5fa' }}>
                        {supplierContracts.length}
                      </div>
                    </div>
                    <div className="rounded-lg p-2.5" style={{ background: 'var(--surface2)' }}>
                      <div className="text-xs text-muted-foreground">Annual Value</div>
                      <div className="font-head font-bold text-lg" style={{ color: '#3dd68c' }}>
                        {totalVal > 0 ? fmt(totalVal) : 'Variable'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Contact: {s.supplierContact}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.email}</div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'renewals' && (
          <div className="flex flex-col gap-4">
            <div className="font-head font-bold text-sm">
              {renewals.length} Contracts Renewing in Next 120 Days
            </div>
            {renewals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <CheckCircle2 size={32} className="mb-3 opacity-30" />
                <p className="text-sm">No renewals due in the next 120 days</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {renewals.map((contract) => {
                  const days = daysUntil(contract.renewalDate);
                  const sc = STATUS_CONFIG[contract.status] || STATUS_CONFIG.active;
                  return (
                    <div
                      key={contract.id}
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
                        <div className="font-semibold text-sm truncate">
                          {contract.contractName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {contract.supplierName} · {contract.hotel}
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
                          Notice: {contract.noticePeriod}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-semibold">
                          {contract.contractValue > 0
                            ? fmt(contract.contractValue) + '/yr'
                            : 'Variable'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Auto: {contract.autoRenew ? 'Yes' : 'No'}
                        </div>
                      </div>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: sc.bg, color: sc.color }}
                      >
                        {sc.label}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedContract(contract);
                          setShowReminderModal(true);
                        }}
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

        {activeTab === 'slas' && (
          <div className="flex flex-col gap-4">
            <div className="font-head font-bold text-sm">Service Level Agreements</div>
            <div
              className="rounded-xl border border-border overflow-x-auto shadow-sm"
              style={{ background: 'var(--surface)' }}
            >
              <table className="w-full text-left border-collapse" style={{ minWidth: 720 }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)' }}>
                    {['Contract', 'Supplier', 'Category', 'Property', 'SLA Terms', 'Status'].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => {
                    const sc = STATUS_CONFIG[contract.status] || STATUS_CONFIG.active;
                    return (
                      <tr
                        key={contract.id}
                        className="border-t border-border"
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-sm max-w-48 truncate">
                            {contract.contractName}
                          </div>
                          <div className="text-xs font-mono text-muted-foreground">
                            {contract.contractId}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {contract.supplierName}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{ background: 'var(--surface3)', color: 'var(--text2)' }}
                          >
                            {contract.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {contract.hotel}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs">
                          {contract.sla}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: sc.bg, color: sc.color }}
                          >
                            {sc.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Contract Detail Modal */}
      {selectedContract && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setSelectedContract(null)}
        >
          <div
            className="rounded-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-auto"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-6 border-b border-border">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="font-mono text-xs px-2 py-0.5 rounded"
                    style={{ background: 'var(--surface3)', color: 'var(--text2)' }}
                  >
                    {selectedContract.contractId}
                  </span>
                  {isViewer || !canEdit ? (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold select-none"
                      style={{
                        background: (STATUS_CONFIG[selectedContract.status] || STATUS_CONFIG.active)
                          .bg,
                        color: (STATUS_CONFIG[selectedContract.status] || STATUS_CONFIG.active)
                          .color,
                        border: `1px solid ${(STATUS_CONFIG[selectedContract.status] || STATUS_CONFIG.active).color}33`,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: (
                            STATUS_CONFIG[selectedContract.status] || STATUS_CONFIG.active
                          ).color,
                        }}
                      />
                      {(STATUS_CONFIG[selectedContract.status] || STATUS_CONFIG.active).label}
                    </span>
                  ) : (
                    <CustomDropdown
                      size="sm"
                      variant="pill"
                      value={selectedContract.status}
                      onChange={(val) =>
                        handleStatusChange(selectedContract.id, val as ContractStatus)
                      }
                      options={[
                        { value: 'active', label: 'Active', color: '#3dd68c' },
                        { value: 'expiring-soon', label: 'Expiring Soon', color: '#f59e0b' },
                        { value: 'expired', label: 'Expired', color: '#f43f5e' },
                        { value: 'pending', label: 'Pending', color: '#60a5fa' },
                        { value: 'terminated', label: 'Terminated', color: '#94a3b8' },
                      ]}
                      style={{
                        background: (STATUS_CONFIG[selectedContract.status] || STATUS_CONFIG.active)
                          .bg,
                        color: (STATUS_CONFIG[selectedContract.status] || STATUS_CONFIG.active)
                          .color,
                        border: `1px solid ${(STATUS_CONFIG[selectedContract.status] || STATUS_CONFIG.active).color}33`,
                      }}
                    />
                  )}
                  {selectedContract.autoRenew && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(61,214,140,0.12)', color: '#3dd68c' }}
                    >
                      Auto Renew
                    </span>
                  )}
                </div>
                <h2 className="font-head font-bold text-lg">{selectedContract.contractName}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {selectedContract.supplierName}
                </p>
              </div>
              <button
                onClick={() => setSelectedContract(null)}
                className="text-muted-foreground hover:text-foreground text-xl font-bold px-2"
              >
                ×
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                ['Category', selectedContract.category],
                ['Property', selectedContract.hotel],
                ['Department', selectedContract.department],
                [
                  'Contract Value',
                  selectedContract.contractValue > 0
                    ? fmt(selectedContract.contractValue) + '/yr'
                    : 'Variable',
                ],
                [
                  'Monthly Cost',
                  selectedContract.monthlyCost > 0
                    ? fmt(selectedContract.monthlyCost) + '/mo'
                    : 'Variable',
                ],
                ['Payment Frequency', selectedContract.paymentFrequency],
                ['Start Date', formatDate(selectedContract.startDate)],
                ['End Date', formatDate(selectedContract.endDate)],
                ['Renewal Date', formatDate(selectedContract.renewalDate)],
                ['Notice Period', selectedContract.noticePeriod],
                ['Contract Owner', selectedContract.contractOwner],
                ['Supplier Contact', selectedContract.supplierContact],
                ['Phone', selectedContract.phone],
                ['Email', selectedContract.email],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
              <div className="col-span-2 flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">SLA Terms</span>
                <span className="text-sm font-medium">{selectedContract.sla}</span>
              </div>
            </div>
            {selectedContract.notes && (
              <div className="px-6 pb-4">
                <div className="text-xs text-muted-foreground mb-1">Notes</div>
                <div className="text-sm p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>
                  {selectedContract.notes}
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 p-6 pt-0">
              {!isViewer && canEdit && (
                <button
                  onClick={() => handleOpenEdit(selectedContract)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  <Edit2 size={13} /> Edit Contract
                </button>
              )}
              <button
                onClick={() => setShowReminderModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border transition-colors hover:bg-surface2"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                <Bell size={13} /> Set Reminder
              </button>
              <button
                onClick={() => setShowDocumentsModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border transition-colors hover:bg-surface2"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                <FileText size={13} /> Documents
              </button>
              {hasDeleteAccess && (
                <button
                  onClick={() => setContractToDelete(selectedContract)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors ml-auto"
                >
                  <Trash2 size={13} /> Delete Contract
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Contract Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="rounded-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-auto"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleAddContract}>
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="font-head font-bold text-lg">Add Contract</h2>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-muted-foreground hover:text-foreground text-xl font-bold px-2"
                >
                  ×
                </button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Contract Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contractName}
                    onChange={(e) => setFormData({ ...formData, contractName: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {getFieldLabel('category', 'Category')}
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={formData.category}
                    onChange={(val) => setFormData({ ...formData, category: val })}
                    options={cmsCategoryOptions}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {getFieldLabel('hotel', 'Property')}
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={formData.hotel}
                    onChange={(val) => setFormData({ ...formData, hotel: val })}
                    options={cmsHotelOptions}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Renewal Date</label>
                  <input
                    type="date"
                    value={formData.renewalDate}
                    onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Notice Period</label>
                  <input
                    type="text"
                    value={formData.noticePeriod}
                    onChange={(e) => setFormData({ ...formData, noticePeriod: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Contract Value (£)
                  </label>
                  <input
                    type="number"
                    value={formData.contractValue}
                    onChange={(e) => setFormData({ ...formData, contractValue: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Monthly Cost (£)
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyCost}
                    onChange={(e) => setFormData({ ...formData, monthlyCost: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Payment Frequency
                  </label>
                  <input
                    type="text"
                    value={formData.paymentFrequency}
                    onChange={(e) => setFormData({ ...formData, paymentFrequency: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Contract Owner
                  </label>
                  <input
                    type="text"
                    value={formData.contractOwner}
                    onChange={(e) => setFormData({ ...formData, contractOwner: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Supplier Contact
                  </label>
                  <input
                    type="text"
                    value={formData.supplierContact}
                    onChange={(e) => setFormData({ ...formData, supplierContact: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoRenew"
                    checked={formData.autoRenew}
                    onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="autoRenew" className="text-sm font-medium">
                    Auto Renew
                  </label>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {getFieldLabel('status', 'Initial Status')}
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={formData.status}
                    onChange={(val) => setFormData({ ...formData, status: val as ContractStatus })}
                    options={cmsStatusOptions}
                  />
                </div>

                {/* Dynamic Custom Fields Added via CMS */}
                {customFields.map((cf) => (
                  <div key={cf.id} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                      <span>
                        {cf.label} {cf.required && <span className="text-rose-400">*</span>}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        (CMS Field)
                      </span>
                    </label>
                    {cf.type === 'select' ? (
                      <CustomDropdown
                        variant="form"
                        width="100%"
                        placeholder={`Select ${cf.label}...`}
                        value={(formData as any)[cf.id] || ''}
                        onChange={(val) => setFormData({ ...formData, [cf.id]: val } as any)}
                        options={cf.options || []}
                      />
                    ) : (
                      <input
                        type={
                          cf.type === 'number' ? 'number' : cf.type === 'date' ? 'date' : 'text'
                        }
                        value={(formData as any)[cf.id] || ''}
                        placeholder={cf.placeholder || `Enter ${cf.label}...`}
                        onChange={(e) =>
                          setFormData({ ...formData, [cf.id]: e.target.value } as any)
                        }
                        className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                        style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                      />
                    )}
                  </div>
                ))}
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">SLA Terms</label>
                  <input
                    type="text"
                    value={formData.sla}
                    onChange={(e) => setFormData({ ...formData, sla: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Notes</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none resize-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="col-span-2">
                  <DocumentUploadField
                    label="Attach Contract Document / SLA / Agreement (Optional)"
                    documentName={(formData as any).documentName}
                    documentUrl={(formData as any).documentUrl}
                    documentSize={(formData as any).documentSize}
                    onUpload={({ name, url, size }) =>
                      setFormData({
                        ...formData,
                        documentName: name,
                        documentUrl: url,
                        documentSize: size,
                      } as any)
                    }
                    onRemove={() =>
                      setFormData({
                        ...formData,
                        documentName: '',
                        documentUrl: '',
                        documentSize: '',
                      } as any)
                    }
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
                  Save Contract
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

      {/* Edit Contract Modal */}
      {showEditModal && editFormData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="rounded-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-auto shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveEdit}>
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}
                  >
                    <Edit2 size={16} />
                  </div>
                  <div>
                    <h2 className="font-head font-bold text-lg">Edit Contract</h2>
                    <p className="text-xs text-muted-foreground">
                      {editFormData.contractId} · {editFormData.contractName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="text-muted-foreground hover:text-foreground text-xl font-bold px-2"
                >
                  ×
                </button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.supplierName || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, supplierName: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Contract Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.contractName || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, contractName: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={editFormData.category || CONTRACT_CATEGORIES[0]}
                    onChange={(val) => setEditFormData({ ...editFormData, category: val })}
                    options={allCategories}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Property</label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={editFormData.hotel || propertyOptions[0]}
                    onChange={(val) => setEditFormData({ ...editFormData, hotel: val })}
                    options={propertyOptions}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Department</label>
                  <input
                    type="text"
                    value={editFormData.department || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, department: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Annual Value (£)
                  </label>
                  <input
                    type="number"
                    value={editFormData.contractValue ?? ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, contractValue: e.target.value })
                    }
                    placeholder="e.g. 24500"
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Monthly Cost (£)
                  </label>
                  <input
                    type="number"
                    value={editFormData.monthlyCost ?? ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, monthlyCost: e.target.value })
                    }
                    placeholder="e.g. 2041"
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Payment Frequency
                  </label>
                  <input
                    type="text"
                    value={editFormData.paymentFrequency || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, paymentFrequency: e.target.value })
                    }
                    placeholder="Monthly, Annual, Quarterly"
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                  <input
                    type="date"
                    value={editFormData.startDate || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, startDate: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">End Date</label>
                  <input
                    type="date"
                    value={editFormData.endDate || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Renewal Date</label>
                  <input
                    type="date"
                    value={editFormData.renewalDate || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, renewalDate: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Notice Period</label>
                  <input
                    type="text"
                    value={editFormData.noticePeriod || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, noticePeriod: e.target.value })
                    }
                    placeholder="e.g. 30 days"
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Contract Owner
                  </label>
                  <input
                    type="text"
                    value={editFormData.contractOwner || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, contractOwner: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Supplier Contact
                  </label>
                  <input
                    type="text"
                    value={editFormData.supplierContact || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, supplierContact: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Phone</label>
                  <input
                    type="text"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="editAutoRenew"
                    checked={Boolean(editFormData.autoRenew)}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, autoRenew: e.target.checked })
                    }
                    className="rounded w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="editAutoRenew" className="text-sm font-medium cursor-pointer">
                    Auto Renew Agreement
                  </label>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={editFormData.status || 'active'}
                    onChange={(val) =>
                      setEditFormData({ ...editFormData, status: val as ContractStatus })
                    }
                    options={[
                      { value: 'active', label: 'Active', color: '#3dd68c' },
                      { value: 'expiring-soon', label: 'Expiring Soon', color: '#f59e0b' },
                      { value: 'expired', label: 'Expired', color: '#f43f5e' },
                      { value: 'pending', label: 'Pending', color: '#60a5fa' },
                      { value: 'terminated', label: 'Terminated', color: '#94a3b8' },
                    ]}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">SLA Terms</label>
                  <input
                    type="text"
                    value={editFormData.sla || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, sla: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Notes</label>
                  <textarea
                    rows={3}
                    value={editFormData.notes || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none resize-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="col-span-2">
                  <DocumentUploadField
                    label="Contract Document / Agreement (Optional)"
                    documentName={editFormData.documentName || editFormData.document || ''}
                    documentUrl={editFormData.documentUrl}
                    documentSize={editFormData.documentSize}
                    onUpload={({ name, url, size }) =>
                      setEditFormData({
                        ...editFormData,
                        documentName: name,
                        documentUrl: url,
                        documentSize: size,
                      })
                    }
                    onRemove={() =>
                      setEditFormData({
                        ...editFormData,
                        documentName: '',
                        documentUrl: '',
                        documentSize: '',
                      })
                    }
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
                  Update Contract
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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

      {/* Set Reminder Modal */}
      {showReminderModal && selectedContract && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowReminderModal(false)}
        >
          <div
            className="rounded-2xl border border-border w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}
                >
                  <Bell size={16} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base">Set Renewal Reminder</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedContract.contractId} · Renewal{' '}
                    {formatDate(selectedContract.renewalDate)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReminderModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  When to Remind
                </label>
                <CustomDropdown
                  variant="form"
                  width="100%"
                  value={reminderDays}
                  onChange={(val) => setReminderDays(Number(val))}
                  options={[
                    { value: '15', label: '15 days before renewal' },
                    { value: '30', label: '30 days before renewal (Recommended)' },
                    { value: '60', label: '60 days before renewal' },
                    { value: '90', label: '90 days before renewal' },
                    { value: '120', label: '120 days before renewal' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Reminder Recipient
                </label>
                <input
                  type="email"
                  defaultValue={selectedContract.email || 'marcus.webb@samkocentral.com'}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Custom Reminder Note
                </label>
                <textarea
                  rows={3}
                  value={reminderNote}
                  onChange={(e) => setReminderNote(e.target.value)}
                  placeholder="e.g. Request competitive quote 45 days prior to notice period..."
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none resize-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  <Bell size={13} />
                  Confirm Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {showDocumentsModal && selectedContract && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowDocumentsModal(false)}
        >
          <div
            className="rounded-2xl border border-border w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}
                >
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base">Contract Documents</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedContract.contractId} · {selectedContract.supplierName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDocumentsModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 mb-5 max-h-64 overflow-y-auto pr-1">
              {documentsList.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border transition-colors hover:border-primary/40"
                  style={{ background: 'var(--surface2)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={18} className="text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate text-foreground">
                        {doc.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {doc.size} · Uploaded {doc.date}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => window.open(doc.url || '#', '_blank')}
                      className="px-2.5 py-1 rounded-md text-xs font-medium border border-border hover:bg-surface"
                      style={{ color: 'var(--text2)' }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => toast.success(`Downloading ${doc.name}`)}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface"
                      title="Download"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              {!isViewer && (
                <label
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border border-border hover:bg-surface2 transition-colors"
                  style={{ color: 'var(--foreground)' }}
                >
                  <Upload size={13} className="text-primary" />
                  Upload New Document
                  <input type="file" onChange={handleUploadDocument} className="hidden" />
                </label>
              )}
              {isViewer && (
                <span className="text-xs text-muted-foreground italic">
                  Document repository in read-only mode
                </span>
              )}
              <button
                onClick={() => setShowDocumentsModal(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold border border-border"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {contractToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(3px)' }}
          onClick={() => setContractToDelete(null)}
        >
          <div
            className="rounded-2xl border border-border w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-rose-500/15 text-rose-400">
                <AlertTriangle size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-head font-bold text-base text-foreground">Confirm Deletion</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-foreground">
                    {contractToDelete.contractName}
                  </span>{' '}
                  ({contractToDelete.contractId}) with{' '}
                  <span className="font-semibold text-foreground">
                    {contractToDelete.supplierName}
                  </span>
                  ?
                </p>
                <div className="p-3 rounded-lg border border-border mt-3 bg-surface2 text-xs space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Property:</span>
                    <span className="font-medium text-foreground">{contractToDelete.hotel}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Annual Value:</span>
                    <span className="font-medium text-foreground">
                      {contractToDelete.contractValue > 0
                        ? fmt(contractToDelete.contractValue)
                        : 'Variable'}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>End Date:</span>
                    <span className="font-medium text-foreground">
                      {formatDate(contractToDelete.endDate)}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-rose-400 mt-2 font-medium">
                  This action will remove the contract from the register and database.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setContractToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-border"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteContract}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                Delete Permanently
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
                    Manage Contract Categories
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Add new categories, view assigned contracts, rename or delete
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
                    placeholder="e.g. Facilities Management, Jyothi Services, Legal Counsel"
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
                    const count = contracts.filter((x) => x.category === c).length;
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
                                <p className="text-[11px] text-muted-foreground">
                                  {count} {count === 1 ? 'contract' : 'contracts'}
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
                                title={`See records for ${c}`}
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

      {/* Category Delete Confirmation Dialog */}
      {catToDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
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
                  Delete Contract Category
                </h3>
                <p className="text-xs text-muted-foreground">{catToDelete}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground mb-5">
              Are you sure you want to delete the category{' '}
              <strong className="text-foreground">{catToDelete}</strong>?
              <span className="block mt-2 text-emerald-400 font-medium">
                Note: All {contracts.filter((c) => c.category === catToDelete).length} existing
                contract records will safely stay in the database. Only this category option will be
                removed from future dropdown selections.
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

      {/* Bulk Delete Contracts Modal */}
      <ConfirmDeleteModal
        isOpen={showBulkDeleteContractsModal}
        onClose={() => setShowBulkDeleteContractsModal(false)}
        onConfirm={handleConfirmBulkDeleteContracts}
        title="Confirm Bulk Deletion"
        itemName={`${selectedContractIds.length} Selected Contracts`}
        registerName="contracts register"
        customWarning={`Are you sure you want to permanently delete these ${selectedContractIds.length} selected contracts? This action cannot be undone.`}
        confirmButtonText={`Delete ${selectedContractIds.length} Contracts`}
        isDeleting={isBulkDeletingContracts}
      />
    </div>
  );
}
