'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ChevronDown, X, ExternalLink, Loader2, FileSpreadsheet, Plus, Tag, Edit2, Trash2, AlertTriangle, Check } from 'lucide-react';
import { ASSETS, HOTELS, ASSET_CATEGORIES, DEPARTMENTS, type Asset, isAssetFixed } from '@/lib/assetData';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { toast } from 'sonner';
import CustomDropdown from '@/components/ui/CustomDropdown';
import StatusDropdown from '@/components/ui/StatusDropdown';
import { useDeepPageCms, updatePageItem, addPageItem, deletePageItem } from '@/lib/deepPageCms';
import PageCMSEditButton from '@/components/cms/PageCMSEditButton';
import LoadingPagination from '@/components/ui/LoadingPagination';
import { useLoadingPagination } from '@/hooks/useLoadingPagination';

const CONDITION_STYLES: Record<string, { bg: string; color: string }> = {
  excellent: { bg: 'rgba(61,214,140,0.12)', color: '#3dd68c' },
  good: { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa' },
  fair: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  poor: { bg: 'rgba(249,115,22,0.12)', color: '#f97316' },
  critical: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e' },
};

const RISK_STYLES: Record<string, { bg: string; color: string }> = {
  low: { bg: 'rgba(61,214,140,0.12)', color: '#3dd68c' },
  medium: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  high: { bg: 'rgba(249,115,22,0.12)', color: '#f97316' },
  critical: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e' },
};

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: 'rgba(61,214,140,0.12)', color: '#3dd68c', label: 'Active' },
  'under-maintenance': { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Under Maintenance' },
  inactive: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', label: 'Inactive' },
  disposed: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e', label: 'Disposed' },
  lost: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e', label: 'Lost' },
};

function Badge({ label, style }: { label: string; style: { bg: string; color: string } }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ background: style.bg, color: style.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: style.color }} />
      {label}
    </span>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  align = 'auto',
}: {
  label: string;
  value: string[];
  options: ({ value: string; label: string } | string)[];
  onChange: (v: string[]) => void;
  align?: 'left' | 'right' | 'auto';
}) {
  return (
    <CustomDropdown
      label={label}
      value={value}
      options={options}
      onChange={onChange}
      variant="filter"
      align={align}
      multiple
    />
  );
}

export default function AssetsClient() {
  const { isViewer, canEdit, canUpload } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialHotel = searchParams?.get('hotel') || '';
  const isNonFixed = searchParams?.get('type') === 'non-fixed';
  const pageKey = isNonFixed ? 'nonfixed' : 'assets';

  const {
    title: cmsTitle,
    subtitle: cmsSubtitle,
    searchPlaceholder: cmsSearchPlaceholder,
    primaryActionLabel: cmsPrimaryActionLabel,
    secondaryActionLabel: cmsSecondaryActionLabel,
    columns: cmsColumns,
    items: cmsAssets,
    dropdowns: cmsDropdowns,
  } = useDeepPageCms(pageKey);

  const colMap = useMemo(() => {
    const map: Record<string, { label: string; visible: boolean }> = {};
    (cmsColumns || []).forEach((c) => {
      map[c.id] = { label: c.label, visible: c.visible };
    });
    return map;
  }, [cmsColumns]);

  const visibleColCount = useMemo(() => {
    if (!cmsColumns || cmsColumns.length === 0) return 12;
    return cmsColumns.filter((c) => c.visible).length;
  }, [cmsColumns]);

  const [assets, setAssets] = useState<Asset[]>(() => {
    if (cmsAssets && cmsAssets.length > 0) return cmsAssets as Asset[];
    return ASSETS;
  });

  useEffect(() => {
    if (cmsAssets && cmsAssets.length > 0) {
      setAssets(cmsAssets as Asset[]);
    }
  }, [cmsAssets]);

  const [properties, setProperties] = useState<{ value: string; label: string }[]>(
    HOTELS.map((h) => ({ value: h.id, label: h.name }))
  );
  const [categories, setCategories] = useState<string[]>(ASSET_CATEGORIES.map((c) => c.name));
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [hotelFilter, setHotelFilter] = useState<string[]>(initialHotel ? [initialHotel] : []);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [customDropdownFilters, setCustomDropdownFilters] = useState<Record<string, string[]>>({});
  const [activeTab, setActiveTab] = useState<'fixed' | 'non-fixed'>(isNonFixed ? 'non-fixed' : 'fixed');

  useEffect(() => {
    setActiveTab(isNonFixed ? 'non-fixed' : 'fixed');
    setCategoryFilter([]);
  }, [isNonFixed]);

  const scopedAssets = useMemo(() => {
    return assets.filter((a) => (isNonFixed ? !isAssetFixed(a) : isAssetFixed(a)));
  }, [assets, isNonFixed]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    scopedAssets.forEach((a) => {
      const raw = (a as any).category;
      const cat = typeof raw === 'object' && raw !== null ? (raw.name || raw.label) : raw;
      if (cat) set.add(String(cat));
    });
    return Array.from(set);
  }, [scopedAssets]);

  const customCmsDropdowns = useMemo(() => {
    if (!cmsDropdowns) return [];
    const coreIds = new Set(['property', 'asset-hotel', 'category', 'asset-cat', 'department', 'asset-dept', 'status']);
    return cmsDropdowns.filter((d) => !coreIds.has(d.id));
  }, [cmsDropdowns]);

  const propertyLabel = useMemo(() => {
    return cmsDropdowns?.find((d) => d.id === 'property' || d.id === 'asset-hotel')?.label || 'All Properties';
  }, [cmsDropdowns]);

  const categoryLabel = useMemo(() => {
    return cmsDropdowns?.find((d) => d.id === 'category' || d.id === 'asset-cat')?.label || 'Category';
  }, [cmsDropdowns]);

  const departmentLabel = useMemo(() => {
    return cmsDropdowns?.find((d) => d.id === 'department' || d.id === 'asset-dept')?.label || 'Department';
  }, [cmsDropdowns]);

  const statusLabel = useMemo(() => {
    return cmsDropdowns?.find((d) => d.id === 'status')?.label || 'Status';
  }, [cmsDropdowns]);

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#e8c97a');
  const [savingCategory, setSavingCategory] = useState(false);

  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [savingAsset, setSavingAsset] = useState(false);
  const [showEditAssetModal, setShowEditAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState(false);
  const [newAssetForm, setNewAssetForm] = useState({
    name: '',
    category: ASSET_CATEGORIES[0]?.name || 'HVAC',
    hotelId: HOTELS[0]?.id || 'h-01',
    hotelName: HOTELS[0]?.name || 'Crowne Plaza Kingston-south',
    department: 'Engineering',
    location: '',
    quantity: 1,
    condition: 'good',
    riskLevel: 'low',
    status: 'active',
    isFixed: true,
    serialNumber: '',
    purchaseCost: 0,
    notes: '',
  });

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const [assetsRes, propsRes, catsRes] = await Promise.allSettled([
        api.assets.getAll(),
        api.properties.getAll(),
        api.categories.getAll(),
      ]);

      if (assetsRes.status === 'fulfilled' && assetsRes.value.success && assetsRes.value.data && assetsRes.value.data.length > 0) {
        setAssets(assetsRes.value.data);
        try {
          sessionStorage.setItem('samko_all_assets', JSON.stringify(assetsRes.value.data));
        } catch {}
      }
      if (propsRes.status === 'fulfilled' && propsRes.value.success && propsRes.value.data && propsRes.value.data.length > 0) {
        setProperties(propsRes.value.data.map((p: any) => ({ value: p.id, label: p.name })));
      }
      if (catsRes.status === 'fulfilled' && catsRes.value.success && catsRes.value.data && catsRes.value.data.length > 0) {
        setCategories(catsRes.value.data.map((c: any) => c.name));
      }
    } catch (err) {
      console.warn('Using local fallback assets data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
    const handleDataChanged = () => {
      fetchAssets();
    };
    window.addEventListener('samko:data-changed', handleDataChanged);
    return () => window.removeEventListener('samko:data-changed', handleDataChanged);
  }, [fetchAssets]);

  const handleStatusChange = async (assetId: string, newStatus: string) => {
    // Optimistic update
    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, status: newStatus as any } : a))
    );

    // Notify other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'asset', id: assetId, status: newStatus },
        })
      );
    }

    const label = newStatus.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    toast.success('Asset Status Updated', {
      description: `Asset status changed to ${label}`,
    });

    try {
      await api.assets.update(assetId, { status: newStatus });
    } catch (err: any) {
      console.error('Failed to sync asset status:', err);
      toast.error('Failed to update status', { description: err?.message || 'Server error' });
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSavingCategory(true);
    const catName = newCatName.trim();
    setCategories((prev) => (prev.includes(catName) ? prev : [...prev, catName]));
    setShowAddCategoryModal(false);
    setNewCatName('');
    toast.success('Category created', { description: `Added "${catName}" to categories` });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'category' } }));
    }

    try {
      await api.categories.create({ name: catName, color: newCatColor });
    } catch (err: any) {
      console.warn('Failed to save category to Firestore:', err);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetForm.name.trim()) return;
    setSavingAsset(true);
    const newId = isNonFixed ? `FFE-${Date.now().toString().slice(-4)}` : `AST-${Date.now().toString().slice(-4)}`;
    const assetToSave = {
      ...newAssetForm,
      id: newId,
      assetId: newId,
      isFixed: !isNonFixed,
      nextInspection: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };

    setAssets((prev) => [assetToSave as any, ...prev]);
    addPageItem(pageKey, assetToSave);
    setShowAddAssetModal(false);
    toast.success('Asset created', { description: `${assetToSave.name} saved to database` });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'assets', id: newId } }));
    }

    try {
      await api.assets.create(assetToSave);
    } catch (err: any) {
      console.warn('Failed to save asset to Firestore:', err);
    } finally {
      setSavingAsset(false);
    }
  };

  const handleOpenEditAsset = (asset: Asset) => {
    setEditingAsset({
      ...asset,
      quantity: asset.quantity || 1,
      purchaseCost: (asset as any).purchaseCost || 0,
    });
    setShowEditAssetModal(true);
  };

  const handleSaveEditAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    setSavingAsset(true);
    const updated = {
      ...editingAsset,
      quantity: Number(editingAsset.quantity) || 1,
      purchaseCost: Number(editingAsset.purchaseCost) || 0,
      updatedAt: new Date().toISOString(),
    };
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    updatePageItem(pageKey, updated.id, updated);
    setShowEditAssetModal(false);
    toast.success('Asset updated', { description: `${updated.name} updated successfully` });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'assets', id: updated.id } }));
    }
    try {
      await api.assets.update(updated.id, updated);
    } catch (err: any) {
      console.warn('Failed to update asset in Firestore:', err);
    } finally {
      setSavingAsset(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!assetToDelete) return;
    const id = assetToDelete.id;
    setDeletingAsset(true);
    setAssets((prev) => prev.filter((a) => a.id !== id));
    deletePageItem(pageKey, id);
    toast.success('Asset deleted', { description: `${assetToDelete.name} removed from register` });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'assets', id } }));
    }
    try {
      await api.assets.delete(id);
    } catch (err: any) {
      console.warn('Failed to delete asset from Firestore:', err);
    } finally {
      setDeletingAsset(false);
      setAssetToDelete(null);
    }
  };

  const filtered = useMemo(() => {
    return scopedAssets.filter((a) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        String(a.name || '').toLowerCase().includes(q) ||
        String(a.assetId || '').toLowerCase().includes(q) ||
        String(a.department || '').toLowerCase().includes(q) ||
        String(a.location || '').toLowerCase().includes(q) ||
        String(a.category || '').toLowerCase().includes(q) ||
        String(a.manufacturer || '').toLowerCase().includes(q) ||
        String(a.serialNumber || '').toLowerCase().includes(q);

      const matchHotel =
        hotelFilter.length === 0 ||
        hotelFilter.includes(a.hotelId) ||
        hotelFilter.includes((a as any).propertyId) ||
        hotelFilter.includes((a as any).property);
      const matchCategory =
        categoryFilter.length === 0 || categoryFilter.includes(a.category);
      const matchDept =
        departmentFilter.length === 0 || departmentFilter.includes(a.department);
      const matchStatus =
        statusFilter.length === 0 || statusFilter.includes(a.status);
      const matchCustom = Object.entries(customDropdownFilters).every(([key, vals]) => {
        if (!vals || vals.length === 0) return true;
        if (vals.some((v) => v.toLowerCase().startsWith('all '))) return true;
        const assetVal = String((a as any)[key] || (a as any).metadata?.[key] || (a as any).condition || (a as any).riskLevel || '').toLowerCase();
        return vals.some((v) => v.toLowerCase() === assetVal || assetVal.includes(v.toLowerCase()));
      });

      return matchSearch && matchHotel && matchCategory && matchDept && matchStatus && matchCustom;
    });
  }, [scopedAssets, search, hotelFilter, categoryFilter, departmentFilter, statusFilter, customDropdownFilters]);

  // Loading pagination: 7 records default per page (adjustable to 5, 7, 10, 20)
  const {
    currentPage,
    pageSize,
    totalRecords,
    paginatedItems: paginatedAssets,
    isPageLoading,
    changePage,
    changePageSize,
  } = useLoadingPagination(filtered, 4);

  const hasFilters =
    Boolean(search) ||
    hotelFilter.length > 0 ||
    categoryFilter.length > 0 ||
    departmentFilter.length > 0 ||
    statusFilter.length > 0;

  const clearFilters = () => {
    setSearch('');
    setHotelFilter([]);
    setCategoryFilter([]);
    setDepartmentFilter([]);
    setStatusFilter([]);
  };

  const fixedCount = useMemo(() => {
    if (!isNonFixed) {
      return assets.filter((a) => isAssetFixed(a)).length;
    }
    return ASSETS.filter((a) => isAssetFixed(a)).length;
  }, [assets, isNonFixed]);

  const nonFixedCount = useMemo(() => {
    if (isNonFixed) {
      return assets.filter((a) => !isAssetFixed(a)).length;
    }
    return 4;
  }, [assets, isNonFixed]);

  const tabs = useMemo(() => {
    if (isNonFixed) {
      return [
        { id: 'non-fixed' as const, label: 'Non-Fixed Assets', count: nonFixedCount },
      ];
    }
    return [
      { id: 'fixed' as const, label: 'Fixed Assets', count: fixedCount },
    ];
  }, [isNonFixed, fixedCount, nonFixedCount]);

  const handleTabClick = (tabId: 'fixed' | 'non-fixed') => {
    setActiveTab(tabId);
    if (tabId === 'non-fixed') {
      router.push('/asset-management/assets?type=non-fixed');
    } else {
      router.push('/asset-management/assets');
    }
  };

  const cacheAssetForDetail = (a: Asset) => {
    try {
      sessionStorage.setItem('samko_last_clicked_asset', JSON.stringify(a));
      sessionStorage.setItem(`samko_asset_${a.id}`, JSON.stringify(a));
      if (a.assetId) {
        sessionStorage.setItem(`samko_asset_${a.assetId}`, JSON.stringify(a));
      }
    } catch {}
  };

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-head text-xl font-bold">
              {cmsTitle && cmsTitle !== 'Asset Register'
                ? cmsTitle
                : isNonFixed
                ? 'Non-Fixed Assets (FF&E Register)'
                : 'Fixed Assets Register'}
            </h1>
            {loading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cmsSubtitle && !cmsSubtitle.includes('of 98') && !cmsSubtitle.includes('of 100')
              ? cmsSubtitle
              : `${filtered.length} of ${scopedAssets.length} ${isNonFixed ? 'non-fixed' : 'fixed'} assets managed across all portfolio properties`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-border"
              style={{ color: 'var(--text2)', background: 'var(--surface2)' }}
            >
              <X size={12} /> Clear Filters
            </button>
          )}

          <PageCMSEditButton
            pageId={pageKey}
            pageName={isNonFixed ? 'Non-Fixed Assets (FF&E)' : 'Fixed Assets Register'}
          />

          {canUpload && (
            <Link
              href="/asset-management/import"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors hover:border-primary"
              style={{ background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)' }}
            >
              <FileSpreadsheet size={14} style={{ color: 'var(--primary)' }} />
              {cmsSecondaryActionLabel || 'Import Excel'}
            </Link>
          )}
          {canEdit && (
            <>
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border border-border transition-colors hover:border-primary"
                style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
              >
                <Tag size={13} style={{ color: 'var(--primary)' }} />
                Add Category
              </button>
              <button
                onClick={() => setShowAddAssetModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-transform active:scale-95"
                style={{ background: 'var(--primary)', color: '#000' }}
              >
                <Plus size={14} />
                {cmsPrimaryActionLabel || 'Add Asset'}
              </button>
            </>
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

      {/* Tabs */}
      <div
        className="flex items-center gap-1 px-6 pt-3 pb-0 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors"
            style={{
              borderColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text2)',
              background: 'transparent',
            }}
          >
            {tab.label}
            <span
              className="px-1.5 py-0.5 rounded text-xs font-bold"
              style={{
                background: activeTab === tab.id ? 'rgba(232,201,122,0.15)' : 'var(--surface2)',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text2)',
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div
        className="flex items-center gap-3 px-6 py-3 border-b border-border flex-shrink-0 flex-wrap"
        style={{ background: 'var(--surface)' }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border flex-1 min-w-48"
          style={{ background: 'var(--surface2)' }}
        >
          <Search size={14} className="text-muted-foreground flex-shrink-0" />
          <input
            className="bg-transparent text-sm outline-none flex-1"
            placeholder={cmsSearchPlaceholder || 'Search assets, ID, location, serial…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ color: 'var(--foreground)' }}
          />
        </div>
        <FilterSelect
          label={propertyLabel}
          value={hotelFilter}
          options={properties}
          onChange={setHotelFilter}
        />
        <FilterSelect
          label={categoryLabel}
          value={categoryFilter}
          options={availableCategories.length > 0 ? availableCategories : categories}
          onChange={setCategoryFilter}
        />
        <FilterSelect
          label={departmentLabel}
          value={departmentFilter}
          options={DEPARTMENTS}
          onChange={setDepartmentFilter}
          align="right"
        />
        <FilterSelect
          label={statusLabel}
          value={statusFilter}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'under-maintenance', label: 'Under Maintenance' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'disposed', label: 'Disposed' },
            { value: 'lost', label: 'Lost' },
          ]}
          onChange={setStatusFilter}
          align="right"
        />
        {customCmsDropdowns.map((drop) => (
          <FilterSelect
            key={drop.id}
            label={drop.label}
            value={customDropdownFilters[drop.id] || []}
            options={drop.options.map((opt) => ({ value: opt, label: opt }))}
            onChange={(val) => setCustomDropdownFilters((prev) => ({ ...prev, [drop.id]: val }))}
            align="right"
          />
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full min-w-[1020px]">
          <thead
            className="sticky top-0 z-10"
            style={{ background: 'var(--surface)' }}
          >
            <tr>
              {colMap['assetId']?.visible !== false && (
                <th className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-3.5 py-3 border-b border-border whitespace-nowrap">
                  {colMap['assetId']?.label || 'Asset ID'}
                </th>
              )}
              {colMap['name']?.visible !== false && (
                <th className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-3.5 py-3 border-b border-border whitespace-nowrap">
                  {colMap['name']?.label || 'Asset Name'}
                </th>
              )}
              {colMap['category']?.visible !== false && (
                <th className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-3.5 py-3 border-b border-border whitespace-nowrap">
                  {colMap['category']?.label || 'Category'}
                </th>
              )}
              {colMap['property']?.visible !== false && (
                <th className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-3.5 py-3 border-b border-border whitespace-nowrap">
                  {colMap['property']?.label || 'Property'}
                </th>
              )}
              {colMap['department']?.visible !== false && (
                <th className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-3.5 py-3 border-b border-border whitespace-nowrap">
                  {colMap['department']?.label || 'Department'}
                </th>
              )}
              {colMap['location']?.visible !== false && (
                <th className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-3.5 py-3 border-b border-border whitespace-nowrap">
                  {colMap['location']?.label || 'Location'}
                </th>
              )}
              {colMap['qty']?.visible !== false && (
                <th className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-3.5 py-3 border-b border-border whitespace-nowrap">
                  {colMap['qty']?.label || 'Qty'}
                </th>
              )}
              {colMap['condition']?.visible !== false && (
                <th className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-3.5 py-3 border-b border-border whitespace-nowrap">
                  {colMap['condition']?.label || 'Condition'}
                </th>
              )}
              {colMap['risk']?.visible !== false && (
                <th className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-3.5 py-3 border-b border-border whitespace-nowrap">
                  {colMap['risk']?.label || 'Risk'}
                </th>
              )}
              {colMap['nextInspection']?.visible !== false && (
                <th className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-3.5 py-3 border-b border-border whitespace-nowrap">
                  {colMap['nextInspection']?.label || 'Next Inspection'}
                </th>
              )}
              {colMap['status']?.visible !== false && (
                <th className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-3.5 py-3 border-b border-border whitespace-nowrap">
                  {colMap['status']?.label || 'Status'}
                </th>
              )}
              {colMap['actions']?.visible !== false && (
                <th className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-3.5 py-3 border-b border-border whitespace-nowrap">
                  {colMap['actions']?.label || 'Actions'}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={visibleColCount} className="text-center py-16 text-muted-foreground text-sm">
                  No assets found matching your filters.
                </td>
              </tr>
            ) : (
              paginatedAssets.map((asset) => {
                const s = STATUS_CONFIG[asset.status] || STATUS_CONFIG.active;
                const propDisplayName = asset.hotelName || (asset as any).propertyName || 'Property';

                return (
                  <tr
                    key={asset.id}
                    className="border-b border-border transition-colors cursor-pointer"
                    onClick={() => {
                      cacheAssetForDetail(asset);
                      router.push(`/asset-management/assets/${asset.id}`);
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--surface2)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    {colMap['assetId']?.visible !== false && (
                      <td className="px-3 py-2.5 font-mono text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                        {asset.assetId}
                      </td>
                    )}
                    {colMap['name']?.visible !== false && (
                      <td className="px-3 py-2.5">
                        <span
                          className="font-medium text-sm"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {asset.name}
                        </span>
                      </td>
                    )}
                    {colMap['category']?.visible !== false && (
                      <td className="px-3 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--surface3)', color: 'var(--text2)' }}>
                          {asset.category}
                        </span>
                      </td>
                    )}
                    {colMap['property']?.visible !== false && (
                      <td className="px-3 py-2.5 text-xs text-muted-foreground" title={propDisplayName}>
                        {propDisplayName.split(' ').slice(0, 2).join(' ')}
                      </td>
                    )}
                    {colMap['department']?.visible !== false && (
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{asset.department}</td>
                    )}
                    {colMap['location']?.visible !== false && (
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{asset.location}</td>
                    )}
                    {colMap['qty']?.visible !== false && (
                      <td className="px-3 py-2.5 text-xs font-semibold">{asset.quantity}</td>
                    )}
                    {colMap['condition']?.visible !== false && (
                      <td className="px-3 py-2.5">
                        <Badge label={asset.condition} style={CONDITION_STYLES[asset.condition] || CONDITION_STYLES.good} />
                      </td>
                    )}
                    {colMap['risk']?.visible !== false && (
                      <td className="px-3 py-2.5">
                        <Badge label={asset.riskLevel} style={RISK_STYLES[asset.riskLevel] || RISK_STYLES.low} />
                      </td>
                    )}
                    {colMap['nextInspection']?.visible !== false && (
                      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {asset.nextInspectionDate ? new Date(asset.nextInspectionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                      </td>
                    )}
                    {colMap['status']?.visible !== false && (
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        {!canEdit || isViewer ? (
                          <Badge label={STATUS_CONFIG[asset.status || 'active']?.label || asset.status || 'Active'} style={s} />
                        ) : (
                          <StatusDropdown
                            value={asset.status || 'active'}
                            options={[
                              { value: 'active', label: 'Active', color: '#3dd68c', bg: 'rgba(61,214,140,0.12)' },
                              { value: 'under-maintenance', label: 'Under Maintenance', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
                              { value: 'inactive', label: 'Inactive', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
                              { value: 'disposed', label: 'Disposed', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
                              { value: 'lost', label: 'Lost', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
                            ]}
                            onChange={(val) => handleStatusChange(asset.id, val)}
                          />
                        )}
                      </td>
                    )}
                    {colMap['actions']?.visible !== false && (
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <Link
                          href={`/asset-management/assets/${asset.id}`}
                          onClick={() => cacheAssetForDetail(asset)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-surface2"
                          style={{ background: 'rgba(232,201,122,0.12)', color: 'var(--primary)', border: '1px solid rgba(232,201,122,0.25)' }}
                          title="View Full Details"
                        >
                          <ExternalLink size={11} />
                          View
                        </Link>
                        <button
                          onClick={() => handleOpenEditAsset(asset)}
                          className="p-1.5 rounded-lg border border-border hover:bg-surface2 text-muted-foreground hover:text-primary transition-colors"
                          title="Edit Asset"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => setAssetToDelete(asset)}
                          className="p-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/15 text-rose-400 transition-colors"
                          title="Delete Asset"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Loading Pagination Bar */}
      <LoadingPagination
        currentPage={currentPage}
        totalRecords={totalRecords}
        pageSize={pageSize}
        pageSizeOptions={[5, 7, 10, 20]}
        onPageChange={changePage}
        onPageSizeChange={changePageSize}
        isLoading={loading || isPageLoading}
        recordName="assets"
      />

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl border border-border overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border" style={{ background: 'var(--surface2)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}>
                  <Tag size={16} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base text-foreground">Add New Category</h3>
                  <p className="text-xs text-muted-foreground">Create a dynamic asset category</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Category Name *
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. EV Chargers, Spa Facilities, IT Hardware"
                  className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  Category Colour Theme
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['#e8c97a', '#60a5fa', '#a78bfa', '#34d399', '#f43f5e', '#38bdf8', '#fb923c', '#4ade80'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      className="w-6 h-6 rounded-full border transition-transform"
                      style={{
                        background: c,
                        borderColor: newCatColor === c ? '#fff' : 'transparent',
                        transform: newCatColor === c ? 'scale(1.2)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs text-muted-foreground">Custom: {newCatColor}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  {savingCategory ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {showAddAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-xl rounded-2xl border border-border overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border" style={{ background: 'var(--surface2)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}>
                  <Plus size={16} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base text-foreground">Add New Asset</h3>
                  <p className="text-xs text-muted-foreground">Store asset record directly into Google Cloud Firestore</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddAssetModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Asset / Equipment Name *
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newAssetForm.name}
                  onChange={(e) => setNewAssetForm({ ...newAssetForm, name: e.target.value })}
                  placeholder="e.g. Daikin VRV Heat Recovery Unit"
                  className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Category
                  </label>
                  <select
                    value={newAssetForm.category}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Property
                  </label>
                  <select
                    value={newAssetForm.hotelId}
                    onChange={(e) => {
                      const prop = properties.find((p) => p.value === e.target.value);
                      setNewAssetForm({
                        ...newAssetForm,
                        hotelId: e.target.value,
                        hotelName: prop ? prop.label : 'Property',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {properties.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Department
                  </label>
                  <select
                    value={newAssetForm.department}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Location / Room
                  </label>
                  <input
                    type="text"
                    value={newAssetForm.location}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, location: e.target.value })}
                    placeholder="e.g. Plant Room B, 2nd Floor, Kitchen"
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newAssetForm.quantity}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, quantity: Number(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Condition
                  </label>
                  <select
                    value={newAssetForm.condition}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, condition: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Risk Level
                  </label>
                  <select
                    value={newAssetForm.riskLevel}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, riskLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Serial Number / Barcode
                  </label>
                  <input
                    type="text"
                    value={newAssetForm.serialNumber}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, serialNumber: e.target.value })}
                    placeholder="e.g. SN-892184-X"
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Purchase Cost (£)
                  </label>
                  <input
                    type="number"
                    value={newAssetForm.purchaseCost}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, purchaseCost: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="asset-is-fixed"
                  checked={newAssetForm.isFixed}
                  onChange={(e) => setNewAssetForm({ ...newAssetForm, isFixed: e.target.checked })}
                  className="rounded cursor-pointer"
                />
                <label htmlFor="asset-is-fixed" className="text-xs text-foreground cursor-pointer">
                  This is a Fixed Asset (affects balance sheet & fixed asset register)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddAssetModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAsset}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  {savingAsset ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Plus size={13} /> Add Asset to Database
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {showEditAssetModal && editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-2xl rounded-2xl border border-border overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border" style={{ background: 'var(--surface2)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}>
                  <Edit2 size={16} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base text-foreground">Edit Asset: {editingAsset.name}</h3>
                  <p className="text-xs text-muted-foreground">{editingAsset.assetId} · Update asset details dynamically</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditAssetModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditAsset} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Asset Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAsset.name}
                    onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Category *
                  </label>
                  <select
                    value={editingAsset.category}
                    onChange={(e) => setEditingAsset({ ...editingAsset, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Property *
                  </label>
                  <select
                    value={editingAsset.hotelName || (editingAsset as any).propertyName || (editingAsset as any).property || ''}
                    onChange={(e) => {
                      const prop = properties.find((p) => p.label === e.target.value || p.value === e.target.value);
                      setEditingAsset({
                        ...editingAsset,
                        hotelName: prop ? prop.label : e.target.value,
                        hotelId: prop ? prop.value : editingAsset.hotelId,
                        property: prop ? prop.label : e.target.value,
                      } as any);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {properties.map((p) => (
                      <option key={p.value} value={p.label}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editingAsset.department || ''}
                    onChange={(e) => setEditingAsset({ ...editingAsset, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Location / Room
                  </label>
                  <input
                    type="text"
                    value={editingAsset.location || ''}
                    onChange={(e) => setEditingAsset({ ...editingAsset, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingAsset.quantity || 1}
                    onChange={(e) => setEditingAsset({ ...editingAsset, quantity: Number(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Status
                  </label>
                  <select
                    value={editingAsset.status}
                    onChange={(e) => setEditingAsset({ ...editingAsset, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="active">Active</option>
                    <option value="under-maintenance">Under Maintenance</option>
                    <option value="inactive">Inactive</option>
                    <option value="disposed">Disposed</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Condition
                  </label>
                  <select
                    value={editingAsset.condition || 'good'}
                    onChange={(e) => setEditingAsset({ ...editingAsset, condition: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="new">New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Risk Level
                  </label>
                  <select
                    value={editingAsset.risk || 'low'}
                    onChange={(e) => setEditingAsset({ ...editingAsset, risk: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Serial Number / Barcode
                  </label>
                  <input
                    type="text"
                    value={editingAsset.serialNumber || ''}
                    onChange={(e) => setEditingAsset({ ...editingAsset, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Purchase Cost (£)
                  </label>
                  <input
                    type="number"
                    value={(editingAsset as any).purchaseCost || 0}
                    onChange={(e) => setEditingAsset({ ...editingAsset, purchaseCost: Number(e.target.value) || 0 } as any)}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-asset-is-fixed"
                  checked={editingAsset.isFixed ?? true}
                  onChange={(e) => setEditingAsset({ ...editingAsset, isFixed: e.target.checked })}
                  className="rounded cursor-pointer"
                />
                <label htmlFor="edit-asset-is-fixed" className="text-xs text-foreground cursor-pointer">
                  Fixed Asset (affects balance sheet & fixed asset register)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowEditAssetModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAsset}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  {savingAsset ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Check size={13} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {assetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/20 text-rose-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-head font-bold text-base text-foreground">Confirm Deletion</h3>
                <p className="text-xs text-muted-foreground">{assetToDelete.assetId}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground mb-5">
              Are you sure you want to permanently delete <strong className="text-foreground">{assetToDelete.name}</strong> from the asset register? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setAssetToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-surface2 transition-colors"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingAsset}
                onClick={handleDeleteAsset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                {deletingAsset ? (
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
