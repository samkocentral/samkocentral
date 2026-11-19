'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Zap,
  Flame,
  Droplets,
  Search,
  Plus,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  ChevronDown,
  Loader2,
  Trash2,
  X,
  Check,
  Edit2,
  Tag,
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { toast } from 'sonner';
import PageCMSEditButton from '@/components/cms/PageCMSEditButton';
import {
  useDeepPageCms,
  addDropdownOption,
  removeDropdownOptionByName,
  type ColumnDefinition,
} from '@/lib/deepPageCms';
import LoadingPagination from '@/components/ui/LoadingPagination';
import { useLoadingPagination } from '@/hooks/useLoadingPagination';
import TableCheckbox from '@/components/ui/TableCheckbox';
import BulkActionBar from '@/components/ui/BulkActionBar';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import DocumentUploadField from '@/components/ui/DocumentUploadField';
import DocumentTableCell from '@/components/ui/DocumentTableCell';

type UtilityType = 'Electricity' | 'Gas' | 'Water' | string;
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
  {
    id: 'u-001',
    property: 'Stanhill Court',
    utilityType: 'Electricity',
    supplier: 'British Gas Business',
    accountNumber: 'BG-GOW-001',
    meterReference: 'MPAN: 190002847192 / Meter: E19BG001',
    contractStart: '2025-01-01',
    contractEnd: '2027-12-31',
    annualCost: 28400,
    monthlyCost: 2367,
    tariffRate: '21.5p/kWh; Standing: £1.85/day',
    portalLogin: 'accounts@samkocentral.com',
    supplierPhone: '+44 800 048 0202',
    supplierEmail: 'business@britishgas.co.uk',
    status: 'active',
    notes: 'Main 3-phase electricity supply for Stanhill Court site.',
  },
  {
    id: 'u-002',
    property: 'Crowne Plaza Kingston-south',
    utilityType: 'Gas',
    supplier: 'SEFE Energy',
    accountNumber: '100091219',
    meterReference: 'MPRN: 9209299704 / Meter: M100K0079408D6',
    contractStart: '2026-03-01',
    contractEnd: '2028-02-29',
    annualCost: 13508,
    monthlyCost: 1126,
    tariffRate: '3.8431p/kWh; Standing: £5.607/day',
    portalLogin: 'Accounts@cplondonkingston.co.uk',
    supplierPhone: '0161 837 3395',
    supplierEmail: 'enquiries@sefe-energy.com',
    status: 'active',
    notes: 'Contract: AG08104881. Fixed 2-year SEFE Energy Shield.',
  },
  {
    id: 'u-003',
    property: 'Stanhill Court',
    utilityType: 'Water',
    supplier: 'Thames Water Commercial',
    accountNumber: 'TW-SC-003',
    meterReference: 'SPID: 301928471 / Meter: 5069925',
    contractStart: '2025-04-01',
    contractEnd: '2027-09-30',
    annualCost: 14800,
    monthlyCost: 1233,
    tariffRate: 'Water: £2.45/m³; Waste: £1.35/m³',
    portalLogin: 'facilities@stanhillcourt.com',
    supplierPhone: '+44 800 980 8800',
    supplierEmail: 'commercial@thameswater.co.uk',
    status: 'active',
    notes: 'Commercial water and wastewater services.',
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

function fmt(n: number) {
  return n > 0 ? `£${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : '—';
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getUTCDate()).padStart(2, '0');
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${day} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
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
      className="rounded-xl border border-border px-3.5 py-3 relative overflow-hidden"
      style={{ background: 'var(--surface)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <div
            className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 whitespace-nowrap truncate"
            title={label}
          >
            {label}
          </div>
          <div
            className="font-head font-bold text-xl xl:text-2xl tracking-tight whitespace-nowrap leading-tight truncate"
            style={{ color }}
          >
            {value}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 whitespace-nowrap truncate">
            {sub}
          </div>
        </div>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18` }}
        >
          <Icon size={14} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

const DEFAULT_UTILITY_TYPES = ['Electricity', 'Gas', 'Water', 'Solar', 'Biomass', 'Telecoms'];
const DEFAULT_UTILITY_CATEGORIES = [
  'Half-Hourly Metered',
  'Commercial Contract',
  'Green / Renewable Tariff',
  'Fixed Rate Contract',
  'Flexible Purchasing',
  'Standard Supply',
];

export default function UtilitiesRegisterClient() {
  const { isViewer, canEdit, canDelete, canWriteTab, isPropertyAccessible, activePortal } = useAuth();
  const hasWriteAccess = !isViewer && canEdit && canWriteTab('utilities');
  const hasDeleteAccess = !isViewer && canDelete && canWriteTab('utilities');
  const {
    title: cmsTitle,
    subtitle: cmsSubtitle,
    searchPlaceholder: cmsSearchPlaceholder,
    primaryActionLabel: cmsPrimaryActionLabel,
    columns: cmsColumns,
    items: cmsItems,
    dropdowns: cmsDropdowns,
  } = useDeepPageCms('utilities');

  const activeColumns = useMemo(() => {
    let cols: ColumnDefinition[] = [];
    if (cmsColumns && cmsColumns.length > 0) {
      cols = [...cmsColumns].filter((c) => c.visible !== false);
    } else {
      cols = [
        {
          id: 'property',
          label: 'Property / Site',
          visible: true,
          order: 1,
          originalLabel: 'Property / Site',
        },
        {
          id: 'utilityType',
          label: 'Utility Type',
          visible: true,
          order: 2,
          originalLabel: 'Utility Type',
        },
        { id: 'supplier', label: 'Supplier', visible: true, order: 3, originalLabel: 'Supplier' },
        {
          id: 'accountNumber',
          label: 'Account Number',
          visible: true,
          order: 4,
          originalLabel: 'Account Number',
        },
        {
          id: 'meterReference',
          label: 'Meter Reference',
          visible: true,
          order: 5,
          originalLabel: 'Meter Reference',
        },
        {
          id: 'contractEnd',
          label: 'Contract End',
          visible: true,
          order: 6,
          originalLabel: 'Contract End',
        },
        {
          id: 'annualCost',
          label: 'Annual Cost',
          visible: true,
          order: 7,
          originalLabel: 'Annual Cost',
        },
        { id: 'status', label: 'Status', visible: true, order: 8, originalLabel: 'Status' },
        { id: 'document', label: 'Document', visible: true, order: 9, originalLabel: 'Document' },
        { id: 'actions', label: 'Actions', visible: true, order: 10, originalLabel: 'Actions' },
      ];
    }

    // Guarantee data columns first, then Document, then Actions ALWAYS last!
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
      originalLabel: 'Document',
    };

    const actionsCol = cols.find((c) => c.id.toLowerCase() === 'actions') || {
      id: 'actions',
      label: 'Actions',
      visible: true,
      order: 9999,
      originalLabel: 'Actions',
    };

    return [...nonActions, docCol, actionsCol];
  }, [cmsColumns]);

  const [accounts, setAccounts] = useState<UtilityAccount[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('samko_cache_utilities');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed.length <= 3) return parsed;
          else {
            sessionStorage.removeItem('samko_cache_utilities');
          }
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
  const portalParam = searchParams?.get('portal');
  const isPropco = portalParam === 'propco' || (!portalParam && activePortal === 'propco');

  const typeParam = searchParams?.get('type')?.toLowerCase();
  const initialType: 'all' | UtilityType =
    typeParam === 'electricity'
      ? 'Electricity'
      : typeParam === 'gas'
        ? 'Gas'
        : typeParam === 'water'
          ? 'Water'
          : 'all';

  const [search, setSearch] = useState('');
  const [filterTypes, setFilterTypes] = useState<string[]>(() => {
    return initialType && initialType !== 'all' ? [initialType] : [];
  });

  const handleFilterTypeChange = (type: 'all' | UtilityType) => {
    if (type === 'all') {
      setFilterTypes([]);
      router.push('/utilities-register', { scroll: false });
    } else {
      setFilterTypes((prev) => {
        const isSelected = prev.length === 1 && prev[0].toLowerCase() === type.toLowerCase();
        const next = isSelected ? [] : [type];
        const url =
          next.length > 0
            ? `/utilities-register?type=${next[0].toLowerCase()}`
            : '/utilities-register';
        router.push(url, { scroll: false });
        return next;
      });
    }
  };
  const [filterProperty, setFilterProperty] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<UtilityAccount | null>(null);
  // Dynamic Categories and Types state
  const [customTypes, setCustomTypes] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('samko_utility_types');
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
        const saved = localStorage.getItem('samko_utility_categories');
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

  const allTypes = useMemo(() => {
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

    DEFAULT_UTILITY_TYPES.forEach((t) => {
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

    accounts.forEach((a) => {
      const clean = (a.utilityType || '').trim();
      if (clean && !deleted.has(clean.toLowerCase())) {
        merged.add(clean);
      }
    });

    return Array.from(merged).sort();
  }, [typeDropdown, customTypes, accounts]);

  useEffect(() => {
    const t = searchParams?.get('type')?.toLowerCase();
    if (t === 'electricity') setFilterTypes(['Electricity']);
    else if (t === 'gas') setFilterTypes(['Gas']);
    else if (t === 'water') setFilterTypes(['Water']);
    else if (t && t !== 'all') {
      const found = allTypes.find((at) => at.toLowerCase() === t);
      if (found) setFilterTypes([found]);
    }
  }, [searchParams, allTypes]);

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

    DEFAULT_UTILITY_CATEGORIES.forEach((c) => {
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

  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [typeToDelete, setTypeToDelete] = useState<string | null>(null);
  const [catToDelete, setCatToDelete] = useState<string | null>(null);
  const [editingCat, setEditingCat] = useState<{ oldName: string; newName: string } | null>(null);
  const [editingType, setEditingType] = useState<{ oldName: string; newName: string } | null>(null);

  const handleViewTypeRecords = (typeName: string) => {
    setFilterTypes([typeName]);
    setShowAddTypeModal(false);
    const count = accounts.filter((u) => u.utilityType === typeName).length;
    toast.info(`Filtered to ${typeName}`, {
      description: `Showing ${count} record(s) matching utility type "${typeName}"`,
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
        localStorage.setItem('samko_utility_types', JSON.stringify(updatedCustom));
      } catch {}
    }
    removeDropdownOptionByName('utilities', 'type', oldName);
    addDropdownOption('utilities', 'type', newName);

    const updatedAccounts = accounts.map((a) => {
      if (a.utilityType === oldName) {
        return { ...a, utilityType: newName as UtilityType };
      }
      return a;
    });
    setAccounts(updatedAccounts);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('samko_cache_utilities', JSON.stringify(updatedAccounts));
      } catch {}
    }

    setFilterTypes((prev) =>
      prev.map((t) => (t.toLowerCase() === oldName.toLowerCase() ? newName : t))
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'utility_type_renamed', oldName, newName },
        })
      );
    }

    toast.success('Utility Type Updated', {
      description: `Renamed "${oldName}" to "${newName}" across ${updatedAccounts.filter((a) => a.utilityType === newName).length} accounts`,
    });
    setEditingType(null);
  };

  const handleSaveType = (e: React.FormEvent) => {
    e.preventDefault();
    const t = newTypeName.trim();
    if (!t) return;
    addDropdownOption('utilities', 'type', t);
    if (!customTypes.includes(t)) {
      const updated = [...customTypes, t];
      setCustomTypes(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('samko_utility_types', JSON.stringify(updated));
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', { detail: { type: 'utility_type', name: t } })
        );
      }
    }
    toast.success('Utility Type Created', { description: `Added "${t}" to utility types` });
    setNewTypeName('');
  };

  const handleDeleteType = (typeName: string) => {
    removeDropdownOptionByName('utilities', 'type', typeName);
    const updated = customTypes.filter((t) => t.toLowerCase() !== typeName.toLowerCase());
    setCustomTypes(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('samko_utility_types', JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'utility_type_deleted', name: typeName },
        })
      );
    }
    setFilterTypes((prev) => prev.filter((t) => t.toLowerCase() !== typeName.toLowerCase()));
    toast.success(`Removed type "${typeName}"`);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const c = newCatName.trim();
    if (!c) return;
    addDropdownOption('utilities', 'category', c);
    if (!customCategories.includes(c)) {
      const updated = [...customCategories, c];
      setCustomCategories(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('samko_utility_categories', JSON.stringify(updated));
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', { detail: { type: 'utility_category', name: c } })
        );
      }
    }
    toast.success('Utility Category Created', {
      description: `Added "${c}" to utility categories`,
    });
    setNewCatName('');
  };

  const handleDeleteCategory = (catName: string) => {
    removeDropdownOptionByName('utilities', 'category', catName);
    const updated = customCategories.filter((c) => c.toLowerCase() !== catName.toLowerCase());
    setCustomCategories(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('samko_utility_categories', JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'utility_category_deleted', name: catName },
        })
      );
    }
    setCategoryFilter((prev) => prev.filter((c) => c !== catName));
    toast.success(`Removed category "${catName}"`);
  };

  const handleViewCategoryRecords = (catName: string) => {
    setCategoryFilter([catName]);
    setShowAddCategoryModal(false);
    toast.info(`Filtered to category ${catName}`, {
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
        localStorage.setItem('samko_utility_categories', JSON.stringify(updatedCustom));
      } catch {}
    }
    removeDropdownOptionByName('utilities', 'category', oldName);
    addDropdownOption('utilities', 'category', newName);
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
    documentName: '',
    documentUrl: '',
    documentSize: '',
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

  const propertyOptions = useMemo(() => {
    return Array.from(
      new Set([
        ...properties.map((p) => p.name),
        ...accounts.map((a) => a.property).filter(Boolean),
        ...PROPERTIES,
      ])
    )
      .filter((p) => isPropertyAccessible(p))
      .sort();
  }, [properties, accounts, isPropertyAccessible]);

  const handleStatusChange = async (id: string, newStatus: UtilityStatus) => {
    setAccounts((prev) => prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u)));
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
      toast.success('Utility account created', {
        description: `${created.supplier} (${created.utilityType}) added to ${created.property}`,
      });
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
        documentName: '',
        documentUrl: '',
        documentSize: '',
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
      toast.success('Utility updated', {
        description: `${updated.property} (${updated.utilityType}) updated`,
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', { detail: { type: 'utilities', id: updated.id } })
        );
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
      toast.success('Account deleted', {
        description: `${accountToDelete.supplier} account removed`,
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', { detail: { type: 'utilities', id } })
        );
      }
      await api.utilities.delete(id);
    } catch (err: any) {
      toast.error('Failed to delete utility account');
    } finally {
      setDeletingAccount(false);
      setAccountToDelete(null);
    }
  };

  const accessibleAccounts = useMemo(() => {
    return accounts.filter((u) => {
      const itemPortal = (u as any).portal || 'opco';
      if (isPropco && itemPortal !== 'propco') return false;
      if (!isPropco && itemPortal === 'propco') return false;
      return isPropertyAccessible(u.property || (u as any).hotel || (u as any).site);
    });
  }, [accounts, isPropertyAccessible, isPropco]);

  const activeCount = accessibleAccounts.filter((u) => u.status === 'active').length;
  const expiringSoon = accessibleAccounts.filter((u) => u.status === 'expiring-soon').length;
  const expiredCount = accessibleAccounts.filter((u) => u.status === 'expired').length;
  const incompleteCount = accessibleAccounts.filter((u) => u.status === 'incomplete').length;
  const totalAnnual = accessibleAccounts
    .filter((u) => u.annualCost > 0)
    .reduce((sum, u) => sum + u.annualCost, 0);
  const flaggedCount = accessibleAccounts.filter((u) => u.flags && u.flags.length > 0).length;

  const filtered = useMemo(() => {
    return accessibleAccounts.filter((u) => {
      const matchSearch =
        !search ||
        (u.property || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.supplier || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.accountNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.meterReference || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.utilityType || '').toLowerCase().includes(search.toLowerCase());

      const matchType =
        filterTypes.length === 0 ||
        filterTypes.some(
          (t) => t.trim().toLowerCase() === (u.utilityType || '').trim().toLowerCase()
        );

      const matchProperty =
        filterProperty.length === 0 ||
        filterProperty.some(
          (p) => p.trim().toLowerCase() === (u.property || '').trim().toLowerCase()
        );

      const matchStatus =
        filterStatus.length === 0 ||
        filterStatus.some((s) => s.trim().toLowerCase() === (u.status || '').trim().toLowerCase());

      const matchCategory =
        categoryFilter.length === 0 ||
        categoryFilter.some((c) => (u as any).category?.toLowerCase() === c.toLowerCase()) ||
        categoryFilter.some((c) => (u.notes || '').toLowerCase().includes(c.toLowerCase()));

      return matchSearch && matchType && matchProperty && matchStatus && matchCategory;
    });
  }, [accessibleAccounts, search, filterTypes, filterProperty, filterStatus, categoryFilter]);

  const {
    currentPage,
    pageSize,
    totalRecords,
    paginatedItems: paginatedAccounts,
    isPageLoading,
    changePage,
    changePageSize,
  } = useLoadingPagination(filtered, 10);

  // Multi-select Utilities State
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [isBulkDeletingAccounts, setIsBulkDeletingAccounts] = useState(false);
  const [showBulkDeleteAccountsModal, setShowBulkDeleteAccountsModal] = useState(false);
  const [selectedAccountTypeFilter, setSelectedAccountTypeFilter] = useState('');

  const isAllAccountsPageSelected =
    paginatedAccounts.length > 0 &&
    paginatedAccounts.every((u) => selectedAccountIds.includes(u.id));
  const isSomeAccountsPageSelected =
    paginatedAccounts.some((u) => selectedAccountIds.includes(u.id)) && !isAllAccountsPageSelected;

  const handleToggleSelectAllAccountsPage = () => {
    if (isAllAccountsPageSelected) {
      const pageIds = new Set(paginatedAccounts.map((u) => u.id));
      setSelectedAccountIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = paginatedAccounts.map((u) => u.id);
      setSelectedAccountIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleAccountSelect = (id: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFilteredAccounts = () => {
    setSelectedAccountIds(filtered.map((u) => u.id));
  };

  const handleClearAccountSelection = () => {
    setSelectedAccountIds([]);
    setSelectedAccountTypeFilter('');
  };

  const utilityTypeOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((u) => {
      counts[`type:${u.utilityType}`] = (counts[`type:${u.utilityType}`] || 0) + 1;
      counts[`prop:${u.property}`] = (counts[`prop:${u.property}`] || 0) + 1;
      counts[`status:${u.status}`] = (counts[`status:${u.status}`] || 0) + 1;
    });

    const opts: { label: string; value: string; count: number }[] = [];
    ['Electricity', 'Gas', 'Water'].forEach((t) => {
      if (counts[`type:${t}`])
        opts.push({ label: `Type: ${t}`, value: `type:${t}`, count: counts[`type:${t}`] });
    });
    PROPERTIES.forEach((h: string) => {
      if (counts[`prop:${h}`])
        opts.push({ label: `Property: ${h}`, value: `prop:${h}`, count: counts[`prop:${h}`] });
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

    return opts;
  }, [filtered]);

  const handleSelectAccountByType = (typeKey: string) => {
    setSelectedAccountTypeFilter(typeKey);
    if (!typeKey) {
      setSelectedAccountIds([]);
      return;
    }
    const [kind, val] = typeKey.split(':');
    const matched = filtered.filter((u) => {
      if (kind === 'type') return u.utilityType === val;
      if (kind === 'prop') return u.property === val;
      if (kind === 'status') return u.status === val;
      return false;
    });
    setSelectedAccountIds(matched.map((u) => u.id));
    toast.info(
      `Selected ${matched.length} utility accounts matching ${typeKey.replace(':', ': ')}`
    );
  };

  const handleConfirmBulkDeleteAccounts = async () => {
    if (selectedAccountIds.length === 0) return;
    setIsBulkDeletingAccounts(true);
    try {
      const ids = [...selectedAccountIds];
      const count = ids.length;
      setAccounts((prev) => prev.filter((u) => !ids.includes(u.id)));
      setSelectedAccountIds([]);
      setSelectedAccountTypeFilter('');
      setShowBulkDeleteAccountsModal(false);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', { detail: { type: 'utilities' } })
        );
      }
      await Promise.allSettled(ids.map((id) => api.utilities.delete(id)));
      toast.success(`Deleted ${count} utility accounts successfully!`);
    } catch (err: any) {
      toast.error('Failed to bulk delete utility accounts');
    } finally {
      setIsBulkDeletingAccounts(false);
    }
  };

  const handleExport = () => {
    const headers = [
      'Property',
      'Utility Type',
      'Supplier',
      'Account Number',
      'Meter Reference',
      'Annual Cost',
      'Monthly Cost',
      'Contract Start',
      'Contract End',
      'Status',
    ];
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
      <div
        className="flex items-center justify-between px-6 py-3.5 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-head font-bold text-xl">{cmsTitle || 'Utilities Register'}</h1>
            {loading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cmsSubtitle ||
              `Centralised utility account management across all properties — ${accounts.length} accounts`}
          </p>
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
                onClick={() => setShowAddTypeModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border border-border transition-colors hover:border-primary cursor-pointer"
                style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
              >
                <Plus size={13} style={{ color: 'var(--primary)' }} />
                Add Type
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95 cursor-pointer"
                style={{ background: 'var(--primary)', color: '#000' }}
              >
                <Plus size={14} />{' '}
                {(cmsPrimaryActionLabel || 'Add Account').replace(/^[\+\s]+/, '').trim()}
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
        className="grid gap-2.5 px-6 pt-5 pb-4 flex-shrink-0"
        style={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}
      >
        <KPICard
          label="Active Accounts"
          value={activeCount}
          sub="Fully documented"
          color="#3dd68c"
          icon={CheckCircle2}
        />
        <KPICard
          label="Expiring Soon"
          value={expiringSoon}
          sub="Renewal required"
          color="#f59e0b"
          icon={Clock}
        />
        <KPICard
          label="Expired"
          value={expiredCount}
          sub="Action required"
          color="#f43f5e"
          icon={AlertTriangle}
        />
        <KPICard
          label="Incomplete"
          value={incompleteCount}
          sub="Awaiting documents"
          color="#94a3b8"
          icon={RefreshCw}
        />
        <KPICard
          label="Flagged"
          value={flaggedCount}
          sub="Require attention"
          color="#f97316"
          icon={AlertTriangle}
        />
        <KPICard
          label="Annual Cost"
          value={`£${(totalAnnual / 1000).toFixed(0)}k`}
          sub="Documented accounts"
          color="#a78bfa"
          icon={Zap}
        />
      </div>

      {/* Utility Type Summary */}
      <div
        className="grid gap-3 px-7 pb-4 flex-shrink-0"
        style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
      >
        {(['Electricity', 'Gas', 'Water'] as UtilityType[]).map((type) => {
          const typeAccounts = accessibleAccounts.filter((u) => u.utilityType === type);
          const typeActive = typeAccounts.filter((u) => u.status === 'active').length;
          const typeAnnual = typeAccounts
            .filter((u) => u.annualCost > 0)
            .reduce((sum, u) => sum + u.annualCost, 0);
          const TypeIcon = UTILITY_ICONS[type];
          const color = UTILITY_COLORS[type];
          const isCardActive =
            filterTypes.length === 1 && filterTypes[0].toLowerCase() === type.toLowerCase();
          return (
            <button
              key={type}
              onClick={() => handleFilterTypeChange(isCardActive ? 'all' : type)}
              className="rounded-xl border p-4 flex items-center gap-4 transition-all"
              style={{
                background: isCardActive ? `${color}10` : 'var(--surface)',
                borderColor: isCardActive ? color : 'var(--border)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}18` }}
              >
                <TypeIcon size={18} style={{ color }} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-head font-bold text-sm">{type}</div>
                <div className="text-xs text-muted-foreground">
                  {typeAccounts.length} accounts · {typeActive} active
                </div>
              </div>
              <div className="text-right">
                <div className="font-head font-bold text-sm" style={{ color }}>
                  {typeAnnual > 0 ? `£${(typeAnnual / 1000).toFixed(0)}k/yr` : '—'}
                </div>
                <div className="text-xs text-muted-foreground">Annual cost</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 pb-3 flex-shrink-0 flex-wrap">
        <div
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 flex-1 min-w-48"
          style={{ background: 'var(--surface)' }}
        >
          <Search size={13} className="text-muted-foreground flex-shrink-0" />
          <input
            className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground"
            placeholder={cmsSearchPlaceholder || 'Search by property, supplier, account…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <CustomDropdown
          label="All Utility Types"
          value={filterTypes}
          multiple
          options={allTypes.map((t) => ({ value: t, label: t }))}
          onChange={setFilterTypes}
        />
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
        <CustomDropdown
          label="All Categories"
          value={categoryFilter}
          multiple
          options={allCategories.map((c) => ({ value: c, label: c }))}
          onChange={setCategoryFilter}
        />
        <span className="text-xs text-muted-foreground">{filtered.length} accounts</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div
          className="rounded-xl border border-border overflow-x-auto shadow-sm"
          style={{ background: 'var(--surface)' }}
        >
          <table className="w-full text-left border-collapse" style={{ minWidth: 1050 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {hasDeleteAccess && (
                  <th className="px-3 py-3 w-10 text-center">
                    <TableCheckbox
                      checked={isAllAccountsPageSelected}
                      indeterminate={isSomeAccountsPageSelected}
                      onChange={handleToggleSelectAllAccountsPage}
                      title="Select all on this page"
                    />
                  </th>
                )}
                {activeColumns.map((col) => (
                  <th
                    key={col.id}
                    className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${
                      col.id.toLowerCase() === 'actions' ? 'text-right' : 'text-left'
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
                  <tr
                    key={account.id}
                    className={`border-t border-border cursor-pointer transition-colors ${selectedAccountIds.includes(account.id) ? 'bg-[#e8c97a]/5' : ''}`}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = selectedAccountIds.includes(account.id)
                        ? 'rgba(232,201,122,0.08)'
                        : 'var(--surface2)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = selectedAccountIds.includes(account.id)
                        ? 'rgba(232,201,122,0.05)'
                        : 'transparent')
                    }
                    onClick={() => setSelectedAccount(account)}
                  >
                    {hasDeleteAccess && (
                      <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <TableCheckbox
                          checked={selectedAccountIds.includes(account.id)}
                          onChange={() => handleToggleAccountSelect(account.id)}
                          title={`Select ${account.property} - ${account.utilityType}`}
                        />
                      </td>
                    )}
                    {activeColumns.map((col) => {
                      const colKey = col.id.toLowerCase();
                      if (colKey === 'property') {
                        return (
                          <td
                            key={col.id}
                            className="px-4 py-3 font-medium text-sm whitespace-nowrap"
                          >
                            {account.property}
                          </td>
                        );
                      }
                      if (colKey === 'utilitytype' || colKey === 'type') {
                        return (
                          <td key={col.id} className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <TypeIcon size={13} style={{ color }} />
                              <span className="text-sm font-medium" style={{ color }}>
                                {account.utilityType}
                              </span>
                            </div>
                          </td>
                        );
                      }
                      if (colKey === 'supplier') {
                        return (
                          <td
                            key={col.id}
                            className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap"
                          >
                            {account.supplier}
                          </td>
                        );
                      }
                      if (colKey === 'accountnumber' || colKey === 'accountno') {
                        return (
                          <td
                            key={col.id}
                            className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap"
                          >
                            {account.accountNumber}
                          </td>
                        );
                      }
                      if (colKey === 'meterreference' || colKey === 'meter') {
                        return (
                          <td
                            key={col.id}
                            className="px-4 py-3 text-xs text-muted-foreground max-w-48 truncate"
                          >
                            {account.meterReference}
                          </td>
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
                          <td
                            key={col.id}
                            className="px-4 py-3 text-sm font-medium whitespace-nowrap"
                          >
                            {fmt(account.annualCost)}
                          </td>
                        );
                      }
                      if (colKey === 'monthlycost') {
                        return (
                          <td key={col.id} className="px-4 py-3 text-sm whitespace-nowrap">
                            {fmt(account.monthlyCost)}
                          </td>
                        );
                      }
                      if (colKey === 'tariffrate' || colKey === 'tariff') {
                        return (
                          <td
                            key={col.id}
                            className="px-4 py-3 text-xs text-muted-foreground max-w-40 truncate"
                          >
                            {account.tariffRate}
                          </td>
                        );
                      }
                      if (colKey === 'status') {
                        return (
                          <td
                            key={col.id}
                            className="px-4 py-3"
                            onClick={(e) => e.stopPropagation()}
                          >
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
                                {account.status.replace('-', ' ')}
                              </span>
                            ) : (
                              <CustomDropdown
                                size="sm"
                                variant="pill"
                                value={account.status}
                                onChange={(val) =>
                                  handleStatusChange(account.id, val as UtilityStatus)
                                }
                                options={[
                                  { value: 'active', label: 'Active', color: '#3dd68c' },
                                  {
                                    value: 'expiring-soon',
                                    label: 'Expiring Soon',
                                    color: '#f59e0b',
                                  },
                                  { value: 'expired', label: 'Expired', color: '#f43f5e' },
                                  { value: 'incomplete', label: 'Incomplete', color: '#94a3b8' },
                                ]}
                                style={{
                                  background: sc.bg,
                                  color: sc.color,
                                  border: `1px solid ${sc.color}33`,
                                }}
                              />
                            )}
                          </td>
                        );
                      }
                      if (colKey === 'flags') {
                        return (
                          <td key={col.id} className="px-4 py-3">
                            {account.flags && account.flags.length > 0 && (
                              <div className="flex items-center gap-1">
                                <AlertTriangle size={12} className="text-amber-400 flex-shrink-0" />
                                <span className="text-xs text-amber-400">
                                  {account.flags.length} flag{account.flags.length > 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      }
                      if (colKey === 'document' || colKey === 'attachment') {
                        return (
                          <td
                            key={col.id}
                            className="px-4 py-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DocumentTableCell
                              documentName={(account as any).documentName || (account as any).document || (account as any).billDocument}
                              documentUrl={(account as any).documentUrl}
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
                            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-surface2 cursor-pointer"
                                style={{
                                  background: 'rgba(232,201,122,0.12)',
                                  color: 'var(--primary)',
                                  border: '1px solid rgba(232,201,122,0.25)',
                                }}
                                title="View Details"
                                onClick={() => setSelectedAccount(account)}
                              >
                                <Eye size={12} />
                                View
                              </button>
                              {hasWriteAccess && (
                                <button
                                  type="button"
                                  className="p-1.5 rounded-lg border border-border hover:bg-surface2 transition-colors text-muted-foreground hover:text-primary cursor-pointer"
                                  title="Edit Utility Account"
                                  onClick={() => handleOpenEdit(account)}
                                >
                                  <Edit2 size={13} />
                                </button>
                              )}
                              {hasDeleteAccess && (
                                <button
                                  type="button"
                                  className="p-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/15 text-rose-400 transition-colors cursor-pointer"
                                  title="Delete Utility Account"
                                  onClick={() => setAccountToDelete(account)}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      }

                      // Dynamic custom columns
                      const val = (account as any)[col.id] ?? (account as any)[colKey];
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
          <LoadingPagination
            currentPage={currentPage}
            totalRecords={totalRecords}
            pageSize={pageSize}
            pageSizeOptions={[5, 10, 15, 20, 50]}
            onPageChange={changePage}
            onPageSizeChange={changePageSize}
            isLoading={loading || isPageLoading}
            recordName="utility accounts"
          />
        </div>

        {/* Floating Bulk Action Bar (Only shown for authorized delete users) */}
        {hasDeleteAccess && (
          <div className="mt-4">
            <BulkActionBar
              selectedCount={selectedAccountIds.length}
              totalCount={filtered.length}
              onClearSelection={handleClearAccountSelection}
              onSelectAll={handleSelectAllFilteredAccounts}
              onDeleteSelected={() => setShowBulkDeleteAccountsModal(true)}
              typeOptions={utilityTypeOptions}
              onSelectByType={handleSelectAccountByType}
              selectedTypeValue={selectedAccountTypeFilter}
              typePlaceholder="Select all of type (Type, Property, Status)..."
              recordName="utility accounts"
              isDeleting={isBulkDeletingAccounts}
            />
          </div>
        )}
      </div>

      {/* Account Detail Modal */}
      {selectedAccount && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setSelectedAccount(null)}
        >
          <div
            className="rounded-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-auto"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-6 border-b border-border">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {(() => {
                    const TypeIcon = UTILITY_ICONS[selectedAccount.utilityType];
                    const color = UTILITY_COLORS[selectedAccount.utilityType];
                    return (
                      <div className="flex items-center gap-1.5">
                        <TypeIcon size={14} style={{ color }} />
                        <span className="text-sm font-semibold" style={{ color }}>
                          {selectedAccount.utilityType}
                        </span>
                      </div>
                    );
                  })()}
                  <CustomDropdown
                    size="sm"
                    variant="pill"
                    value={selectedAccount.status}
                    onChange={(val) => handleStatusChange(selectedAccount.id, val as UtilityStatus)}
                    options={[
                      { value: 'active', label: 'Active', color: '#3dd68c' },
                      { value: 'expiring-soon', label: 'Expiring Soon', color: '#f59e0b' },
                      { value: 'expired', label: 'Expired', color: '#f43f5e' },
                      { value: 'incomplete', label: 'Incomplete', color: '#94a3b8' },
                    ]}
                    style={{
                      background: (STATUS_CONFIG[selectedAccount.status] || STATUS_CONFIG.active)
                        .bg,
                      color: (STATUS_CONFIG[selectedAccount.status] || STATUS_CONFIG.active).color,
                      border: `1px solid ${(STATUS_CONFIG[selectedAccount.status] || STATUS_CONFIG.active).color}33`,
                    }}
                  />
                </div>
                <h2 className="font-head font-bold text-lg">{selectedAccount.property}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{selectedAccount.supplier}</p>
              </div>
              <button
                onClick={() => setSelectedAccount(null)}
                className="text-muted-foreground hover:text-foreground text-xl font-bold px-2"
              >
                ×
              </button>
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
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm p-2.5 rounded-lg"
                      style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}
                    >
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
                <div className="text-sm p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>
                  {selectedAccount.notes}
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
                    onClick={() => handleOpenEdit(selectedAccount)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-surface2 text-foreground transition-colors cursor-pointer"
                    style={{ background: 'var(--surface)' }}
                  >
                    <Edit2 size={13} /> Edit Account
                  </button>
                )}
                {hasDeleteAccess && (
                  <button
                    type="button"
                    onClick={() => setAccountToDelete(selectedAccount)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-rose-500/30 hover:bg-rose-500/15 text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} /> Delete Account
                  </button>
                )}
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
            <form onSubmit={handleAddAccount}>
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="font-head font-bold text-lg">Add Utility Account</h2>
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
                  <label className="text-xs font-medium text-muted-foreground">Property *</label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={formData.property}
                    onChange={(val) => setFormData({ ...formData, property: val })}
                    options={propertyOptions}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Utility Type *
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={formData.utilityType}
                    onChange={(val) =>
                      setFormData({ ...formData, utilityType: val as UtilityType })
                    }
                    options={allTypes}
                  />
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
                  <label className="text-xs font-medium text-muted-foreground">
                    Account Number *
                  </label>
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
                  <label className="text-xs font-medium text-muted-foreground">
                    Meter Reference / MPAN / MPRN
                  </label>
                  <input
                    type="text"
                    value={formData.meterReference}
                    onChange={(e) => setFormData({ ...formData, meterReference: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Contract Start
                  </label>
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
                  <label className="text-xs font-medium text-muted-foreground">
                    Annual Cost (£)
                  </label>
                  <input
                    type="number"
                    value={formData.annualCost}
                    onChange={(e) => setFormData({ ...formData, annualCost: e.target.value })}
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
                  <label className="text-xs font-medium text-muted-foreground">
                    Supplier Phone
                  </label>
                  <input
                    type="text"
                    value={formData.supplierPhone}
                    onChange={(e) => setFormData({ ...formData, supplierPhone: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Supplier Email
                  </label>
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
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={formData.status}
                    onChange={(val) => setFormData({ ...formData, status: val as UtilityStatus })}
                    options={[
                      { value: 'active', label: 'Active', color: '#3dd68c' },
                      { value: 'expiring-soon', label: 'Expiring Soon', color: '#f59e0b' },
                      { value: 'expired', label: 'Expired', color: '#f43f5e' },
                      { value: 'incomplete', label: 'Incomplete', color: '#94a3b8' },
                    ]}
                  />
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
                <div className="col-span-2">
                  <DocumentUploadField
                    label="Attach Utility Bill / Contract / Agreement (Optional)"
                    documentName={formData.documentName}
                    onUpload={({ name, url, size }) =>
                      setFormData({
                        ...formData,
                        documentName: name,
                        documentUrl: url,
                        documentSize: size || '',
                      })
                    }
                    onRemove={() =>
                      setFormData({
                        ...formData,
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="rounded-2xl border border-border w-full max-w-2xl max-h-[85vh] overflow-auto shadow-2xl animate-in zoom-in-95 duration-150"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveEdit}>
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
                      Edit Utility Account
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {editingAccount.accountNumber} · Update utility record dynamically
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
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Property *
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={editingAccount.property}
                    onChange={(val) => setEditingAccount({ ...editingAccount, property: val })}
                    options={propertyOptions}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Utility Type *
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={editingAccount.utilityType}
                    onChange={(val) =>
                      setEditingAccount({ ...editingAccount, utilityType: val as UtilityType })
                    }
                    options={allTypes}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Supplier *
                  </label>
                  <input
                    required
                    type="text"
                    value={editingAccount.supplier}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, supplier: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Account Number *
                  </label>
                  <input
                    required
                    type="text"
                    value={editingAccount.accountNumber}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, accountNumber: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Meter Reference (MPAN / MPRN / SPID)
                  </label>
                  <input
                    type="text"
                    value={editingAccount.meterReference}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, meterReference: e.target.value })
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
                    value={editingAccount.status}
                    onChange={(val) =>
                      setEditingAccount({ ...editingAccount, status: val as UtilityStatus })
                    }
                    options={[
                      { value: 'active', label: 'Active', color: '#3dd68c' },
                      { value: 'expiring-soon', label: 'Expiring Soon', color: '#f59e0b' },
                      { value: 'expired', label: 'Expired', color: '#f43f5e' },
                      { value: 'incomplete', label: 'Incomplete', color: '#94a3b8' },
                    ]}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Contract Start
                  </label>
                  <input
                    type="date"
                    value={editingAccount.contractStart}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, contractStart: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Contract End
                  </label>
                  <input
                    type="date"
                    value={editingAccount.contractEnd}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, contractEnd: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Annual Cost (£)
                  </label>
                  <input
                    type="number"
                    value={editingAccount.annualCost}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount,
                        annualCost: Number(e.target.value) || 0,
                      })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Monthly Cost (£)
                  </label>
                  <input
                    type="number"
                    value={editingAccount.monthlyCost}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount,
                        monthlyCost: Number(e.target.value) || 0,
                      })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Tariff / Rate Details
                  </label>
                  <input
                    type="text"
                    value={editingAccount.tariffRate}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, tariffRate: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Supplier Phone
                  </label>
                  <input
                    type="text"
                    value={editingAccount.supplierPhone}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, supplierPhone: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Supplier Email
                  </label>
                  <input
                    type="text"
                    value={editingAccount.supplierEmail}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, supplierEmail: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Notes / Contract Details
                  </label>
                  <textarea
                    rows={2}
                    value={editingAccount.notes || ''}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, notes: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none resize-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="col-span-2">
                  <DocumentUploadField
                    label="Attach Utility Bill / Contract / Agreement (Optional)"
                    documentName={(editingAccount as any).documentName || (editingAccount as any).document || (editingAccount as any).billDocument || ''}
                    onUpload={({ name, url, size }) =>
                      setEditingAccount({
                        ...editingAccount,
                        documentName: name,
                        documentUrl: url,
                        documentSize: size || '',
                      } as any)
                    }
                    onRemove={() =>
                      setEditingAccount({
                        ...editingAccount,
                        documentName: '',
                        documentUrl: '',
                        documentSize: '',
                      } as any)
                    }
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
      {accountToDelete && (
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
                <p className="text-xs text-muted-foreground">
                  {accountToDelete.accountNumber} · {accountToDelete.supplier}
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground mb-5">
              Are you sure you want to permanently delete the{' '}
              <strong className="text-foreground">
                {accountToDelete.utilityType} account for {accountToDelete.property}
              </strong>{' '}
              from the utilities register? This action cannot be undone.
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
      {/* Add Utility Category Modal */}
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
                    Manage Utility Categories
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Add new categories, rename or delete existing categories
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
                    placeholder="e.g. Pass-Through Contract, Maximum Demand Tariff, Microgeneration"
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
                  Delete Utility Category
                </h3>
                <p className="text-xs text-muted-foreground">{catToDelete}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground mb-5">
              Are you sure you want to delete the category{' '}
              <strong className="text-foreground">{catToDelete}</strong>?
              <span className="block mt-2 text-emerald-400 font-medium">
                Note: All existing utility meters and invoices will safely stay in the database.
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

      {/* Delete Utility Type Confirmation Dialog */}
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
                <h3 className="font-head font-bold text-base text-foreground">Confirm Deletion</h3>
                <p className="text-xs text-muted-foreground">{typeToDelete}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground mb-5">
              Are you sure you want to permanently delete the utility type{' '}
              <strong className="text-foreground">"{typeToDelete}"</strong>?
              {accounts.filter((u) => u.utilityType === typeToDelete).length > 0 && (
                <span className="block mt-2 text-amber-400">
                  Note: There are {accounts.filter((u) => u.utilityType === typeToDelete).length}{' '}
                  account(s) currently assigned to this type.
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
                onClick={() => handleDeleteType(typeToDelete)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
              >
                <Trash2 size={13} /> Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Utility Type Modal */}
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
                    Manage Utility Types
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Add new utility types or delete existing types
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
                  Add New Utility Type
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 rounded-lg border border-border text-xs outline-none focus:border-primary"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                    placeholder="e.g. Solar PV, Biomass, LPG, Trade Waste"
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
                    Active Utility Types ({allTypes.length})
                  </label>
                  <span className="text-[10px] text-muted-foreground">Click × to delete</span>
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                  {allTypes.map((t) => {
                    const count = accounts.filter((u) => u.utilityType === t).length;
                    const IconComponent = UTILITY_ICONS[t as UtilityType] || Zap;
                    const iconColor = UTILITY_COLORS[t as UtilityType] || '#e8c97a';
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
                              onClick={() => handleSaveEditType()}
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
                                style={{ background: `${iconColor}15`, color: iconColor }}
                              >
                                <IconComponent size={14} />
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-xs text-foreground block truncate">
                                  {t}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {count} {count === 1 ? 'account' : 'accounts'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {/* Eye icon: See records */}
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
                              {/* Edit icon: Rename */}
                              <button
                                type="button"
                                onClick={() => setEditingType({ oldName: t, newName: t })}
                                className="p-1.5 rounded-lg border border-border hover:bg-surface text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                title={`Edit "${t}"`}
                              >
                                <Edit2 size={13} />
                              </button>
                              {/* Delete icon: Delete with dialog */}
                              <button
                                type="button"
                                onClick={() => setTypeToDelete(t)}
                                className="p-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/15 text-rose-400 transition-colors cursor-pointer"
                                title={`Delete "${t}"`}
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

      {/* Bulk Delete Utilities Modal */}
      <ConfirmDeleteModal
        isOpen={showBulkDeleteAccountsModal}
        onClose={() => setShowBulkDeleteAccountsModal(false)}
        onConfirm={handleConfirmBulkDeleteAccounts}
        title="Confirm Bulk Deletion"
        itemName={`${selectedAccountIds.length} Selected Utility Accounts`}
        registerName="utilities register"
        customWarning={`Are you sure you want to permanently delete these ${selectedAccountIds.length} selected utility accounts? This action cannot be undone.`}
        confirmButtonText={`Delete ${selectedAccountIds.length} Accounts`}
        isDeleting={isBulkDeletingAccounts}
      />
    </div>
  );
}
