'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  X,
  ExternalLink,
  Loader2,
  FileSpreadsheet,
  Plus,
  Tag,
  Edit2,
  Trash2,
  AlertTriangle,
  Check,
  Eye,
  Package,
} from 'lucide-react';
import {
  ASSETS,
  HOTELS,
  ASSET_CATEGORIES,
  DEPARTMENTS,
  type Asset,
  isAssetFixed,
} from '@/lib/assetData';
import { getLiveProperties } from '@/hooks/useLiveProperties';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { toast } from 'sonner';
import CustomDropdown from '@/components/ui/CustomDropdown';
import StatusDropdown from '@/components/ui/StatusDropdown';
import DocumentUploadField from '@/components/ui/DocumentUploadField';
import DocumentTableCell from '@/components/ui/DocumentTableCell';
import { useDeepPageCms, updatePageItem, addPageItem, deletePageItem } from '@/lib/deepPageCms';
import PageCMSEditButton from '@/components/cms/PageCMSEditButton';
import LoadingPagination from '@/components/ui/LoadingPagination';
import { useLoadingPagination } from '@/hooks/useLoadingPagination';
import TableCheckbox from '@/components/ui/TableCheckbox';
import BulkActionBar from '@/components/ui/BulkActionBar';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';

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
  'under-maintenance': {
    bg: 'rgba(245,158,11,0.12)',
    color: '#f59e0b',
    label: 'Under Maintenance',
  },
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
  const { isViewer, isUploader, canEdit, canUpload, canDelete, canWriteTab, isPropertyAccessible, activePortal } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialHotel = searchParams?.get('hotel') || '';
  const isNonFixed = searchParams?.get('type') === 'non-fixed';
  const portalParam = searchParams?.get('portal');
  const isOpCo = portalParam === 'opco' || (!portalParam && activePortal === 'opco');
  const pageKey = isNonFixed ? 'nonfixed' : 'assets';
  const tabId = isNonFixed ? 'non-fixed-assets' : 'fixed-assets';
  const hasWriteAccess = !isViewer && !isUploader && canEdit && canWriteTab(tabId);
  const hasDeleteAccess = !isViewer && !isUploader && canDelete && canWriteTab(tabId);

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

  const activeColumns = useMemo(() => {
    let cols: any[] = [];
    if (cmsColumns && cmsColumns.length > 0 && !isNonFixed) {
      cols = [...cmsColumns].sort((a, b) => a.order - b.order).filter((c) => c.visible !== false);
    } else if (isNonFixed) {
      cols = [
        { id: 'assetId', label: 'Asset ID', visible: true, order: 1 },
        { id: 'name', label: 'Item Name / Description', visible: true, order: 2 },
        { id: 'property', label: 'Property', visible: true, order: 3 },
        { id: 'location', label: 'Room / Area', visible: true, order: 4 },
        { id: 'category', label: 'Category', visible: true, order: 5 },
        { id: 'department', label: 'Department', visible: true, order: 6 },
        { id: 'quantity', label: 'Quantity', visible: true, order: 7 },
        { id: 'condition', label: 'Condition', visible: true, order: 8 },
        { id: 'status', label: 'Status', visible: true, order: 9 },
        { id: 'document', label: 'Document', visible: true, order: 10 },
        { id: 'actions', label: 'Actions', visible: true, order: 11 },
      ];
    } else {
      cols = [
        { id: 'assetId', label: 'Asset ID', visible: true, order: 1 },
        { id: 'name', label: 'Asset Name', visible: true, order: 2 },
        { id: 'category', label: 'Category', visible: true, order: 3 },
        { id: 'property', label: 'Property', visible: true, order: 4 },
        { id: 'department', label: 'Department', visible: true, order: 5 },
        { id: 'location', label: 'Location', visible: true, order: 6 },
        { id: 'qty', label: 'Qty', visible: true, order: 7 },
        { id: 'condition', label: 'Condition', visible: true, order: 8 },
        { id: 'risk', label: 'Risk', visible: true, order: 9 },
        { id: 'nextInspection', label: 'Next Inspection', visible: true, order: 10 },
        { id: 'status', label: 'Status', visible: true, order: 11 },
        { id: 'document', label: 'Document', visible: true, order: 12 },
        { id: 'actions', label: 'Actions', visible: true, order: 13 },
      ];
    }

    // Separate columns: all standard data columns first, then Document, then Actions as absolute last!
    const nonActions = cols.filter(
      (c) =>
        c.id.toLowerCase() !== 'actions' &&
        c.id.toLowerCase() !== 'document' &&
        c.id.toLowerCase() !== 'attachment'
    );
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
  }, [cmsColumns, isNonFixed]);

  const customColumns = useMemo(() => {
    const standardKeys = new Set([
      'assetid',
      'name',
      'category',
      'property',
      'department',
      'location',
      'qty',
      'quantity',
      'condition',
      'risk',
      'nextinspection',
      'status',
      'document',
      'attachment',
      'actions',
    ]);
    return (cmsColumns || []).filter((c) => !standardKeys.has(c.id.toLowerCase()));
  }, [cmsColumns]);

  const colMap = useMemo(() => {
    const map: Record<string, { label: string; visible: boolean }> = {};
    (cmsColumns || []).forEach((c) => {
      map[c.id] = { label: c.label, visible: c.visible };
    });
    return map;
  }, [cmsColumns]);

  const visibleColCount = useMemo(() => {
    return activeColumns.length;
  }, [activeColumns]);

  const [assets, setAssets] = useState<Asset[]>(() => {
    let raw: any[] = ASSETS;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('samko_all_assets');
        sessionStorage.removeItem('samko_all_assets');
        localStorage.removeItem('samko_all_assets_v2');
        sessionStorage.removeItem('samko_all_assets_v2');

        const cached =
          localStorage.getItem('samko_all_assets_v5') || sessionStorage.getItem('samko_all_assets_v5');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed.length <= 6) {
            raw = parsed.filter((a: any) => {
              const h = String(a.hotel || a.hotelName || a.property || a.site || '').toLowerCase();
              return h !== 'gow' && !h.includes('gow');
            });
          }
        }
      } catch { }
    }
    return raw.map((a) => {
      const explicit = (a as any).approvalStatus;
      const approvalStatus =
        explicit || (a.status === 'under-maintenance' ? 'pending' : 'approved');
      const status =
        approvalStatus === 'approved'
          ? a.status === 'under-maintenance'
            ? 'active'
            : a.status || 'active'
          : a.status || 'under-maintenance';
      return {
        ...a,
        approvalStatus,
        status,
      };
    });
  });

  // Purge legacy unpruned browser caches immediately on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('samko_all_assets');
        sessionStorage.removeItem('samko_all_assets');
        localStorage.removeItem('samko_all_assets_v2');
        sessionStorage.removeItem('samko_all_assets_v2');
        localStorage.removeItem('samko_deep_cms_store');
      } catch { }
    }
  }, []);

  const saveAssetsToStorage = (updatedAssets: Asset[]) => {
    if (typeof window !== 'undefined') {
      try {
        const cleaned = updatedAssets.filter((a: any) => {
          const h = String(a.hotel || a.hotelName || a.property || a.site || '').toLowerCase();
          return h !== 'gow' && !h.includes('gow');
        });
        localStorage.setItem('samko_all_assets_v5', JSON.stringify(cleaned));
        sessionStorage.setItem('samko_all_assets_v5', JSON.stringify(cleaned));
        window.dispatchEvent(
          new CustomEvent('samko:assets-changed', { detail: { assets: cleaned } })
        );
        window.dispatchEvent(
          new CustomEvent('samko:approvals-changed', { detail: { submissions: cleaned } })
        );
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'assets' } }));
      } catch (e) { }
    }
  };

  useEffect(() => {
    if (cmsAssets && cmsAssets.length > 0) {
      setAssets((prev) => {
        const validCms = (cmsAssets as Asset[]).slice(0, 3);
        const opposite = prev
          .filter((p) => (isNonFixed ? isAssetFixed(p) : !isAssetFixed(p)))
          .slice(0, 3);
        const prevMap = new Map(prev.map((a) => [a.id || a.assetId, a]));
        const mergedCms = validCms.map((c) => {
          const id = c.id || c.assetId;
          const existing = prevMap.get(id);
          return existing ? { ...c, ...existing } : c;
        });
        return [...mergedCms, ...opposite];
      });
    }
  }, [cmsAssets, isNonFixed]);

  const [properties, setProperties] = useState<{ value: string; label: string }[]>(() =>
    getLiveProperties().map((h) => ({ value: h.id, label: h.name }))
  );
  const [categories, setCategories] = useState<string[]>(ASSET_CATEGORIES.map((c) => c.name));
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [hotelFilter, setHotelFilter] = useState<string[]>(initialHotel ? [initialHotel] : []);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [customDropdownFilters, setCustomDropdownFilters] = useState<Record<string, string[]>>({});
  const [activeTab, setActiveTab] = useState<'fixed' | 'non-fixed'>(
    isNonFixed ? 'non-fixed' : 'fixed'
  );

  useEffect(() => {
    setActiveTab(isNonFixed ? 'non-fixed' : 'fixed');
    setCategoryFilter([]);
  }, [isNonFixed]);

  const accessibleAssets = useMemo(() => {
    return assets.filter((a) => {
      const isFixed = isAssetFixed(a);
      const defaultPortal = isFixed ? 'propco' : 'opco';
      const itemPortal = (a as any).portal || defaultPortal;
      if (isOpCo && itemPortal !== 'opco') return false;
      if (!isOpCo && itemPortal === 'opco') return false;
      return isPropertyAccessible(
        a.hotelName || a.hotelId || (a as any).property || (a as any).propertyName
      );
    });
  }, [assets, isPropertyAccessible, isOpCo]);

  const scopedAssets = useMemo(() => {
    return accessibleAssets.filter((a) => (isNonFixed ? !isAssetFixed(a) : isAssetFixed(a)));
  }, [accessibleAssets, isNonFixed]);

  const accessiblePropertyOptions = useMemo(() => {
    return properties.filter((p) => isPropertyAccessible(p.label || p.value));
  }, [properties, isPropertyAccessible]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    scopedAssets.forEach((a) => {
      const raw = (a as any).category;
      const cat = typeof raw === 'object' && raw !== null ? raw.name || raw.label : raw;
      if (cat) set.add(String(cat));
    });
    return Array.from(set);
  }, [scopedAssets]);

  const customCmsDropdowns = useMemo(() => {
    if (!cmsDropdowns) return [];
    const coreIds = new Set([
      'property',
      'asset-hotel',
      'category',
      'asset-cat',
      'department',
      'asset-dept',
      'status',
    ]);
    return cmsDropdowns.filter((d) => !coreIds.has(d.id));
  }, [cmsDropdowns]);

  const propertyLabel = useMemo(() => {
    return (
      cmsDropdowns?.find((d) => d.id === 'property' || d.id === 'asset-hotel')?.label ||
      'All Properties'
    );
  }, [cmsDropdowns]);

  const categoryLabel = useMemo(() => {
    return (
      cmsDropdowns?.find((d) => d.id === 'category' || d.id === 'asset-cat')?.label || 'Category'
    );
  }, [cmsDropdowns]);

  const departmentLabel = useMemo(() => {
    return (
      cmsDropdowns?.find((d) => d.id === 'department' || d.id === 'asset-dept')?.label ||
      'Department'
    );
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
  const [inlineEditingCell, setInlineEditingCell] = useState<{ id: string; colId: string } | null>(
    null
  );
  const [inlineVal, setInlineVal] = useState<string>('');

  const handleSaveInlineCustom = (assetId: string, colId: string, value: string) => {
    const colKey = colId.toLowerCase();
    setAssets((prev) =>
      prev.map((a) => {
        if (a.id === assetId) {
          return {
            ...a,
            [colId]: value,
            [colKey]: value,
          };
        }
        return a;
      })
    );
    const target = assets.find((a) => a.id === assetId);
    if (target) {
      const updated = {
        ...target,
        [colId]: value,
        [colKey]: value,
      };
      updatePageItem(pageKey, assetId, updated);
    }
    setInlineEditingCell(null);
    toast.success('Updated', { description: `Saved "${value || '—'}" for ${colId}` });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', { detail: { type: 'assets', id: assetId } })
      );
    }
  };
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
    documentName: '',
    documentUrl: '',
    documentSize: '',
  });

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const [assetsRes, propsRes, catsRes] = await Promise.allSettled([
        api.assets.getAll(),
        api.properties.getAll(),
        api.categories.getAll(),
      ]);

      if (
        assetsRes.status === 'fulfilled' &&
        assetsRes.value.success &&
        assetsRes.value.data &&
        assetsRes.value.data.length > 0
      ) {
        let localMap: Record<string, any> = {};
        if (typeof window !== 'undefined') {
          try {
            const cached =
              localStorage.getItem('samko_all_assets_v5') ||
              sessionStorage.getItem('samko_all_assets_v5');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length <= 6) {
                parsed.forEach((x: any) => {
                  const k = x.id || x.assetId;
                  if (k) localMap[k] = x;
                });
              } else {
                localStorage.removeItem('samko_all_assets');
                sessionStorage.removeItem('samko_all_assets');
              }
            }
          } catch { }
        }

        const normalizedAssets = assetsRes.value.data
          .filter((item: any) => {
            const h = String(item.hotel || item.hotelName || item.property || item.site || '').toLowerCase();
            return h !== 'gow' && !h.includes('gow');
          })
          .map((item: any) => {
            const k = item.id || item.assetId;
            const localItem = localMap[k];
            const approvalStatus =
              localItem?.approvalStatus === 'approved' || item.approvalStatus === 'approved'
                ? 'approved'
                : localItem?.approvalStatus ||
                item.approvalStatus ||
                (item.status === 'under-maintenance' ? 'pending' : 'approved');

            const status =
              approvalStatus === 'approved'
                ? 'active'
                : approvalStatus === 'pending' || approvalStatus === 'hold'
                  ? 'under-maintenance'
                  : localItem?.status || item.status || 'active';

            return {
              ...item,
              approvalStatus,
              status,
            };
          });

        setAssets(normalizedAssets);
        saveAssetsToStorage(normalizedAssets);
      }
      if (
        propsRes.status === 'fulfilled' &&
        propsRes.value.success &&
        propsRes.value.data &&
        propsRes.value.data.length > 0
      ) {
        setProperties(propsRes.value.data.map((p: any) => ({ value: p.id, label: p.name })));
      }
      if (
        catsRes.status === 'fulfilled' &&
        catsRes.value.success &&
        catsRes.value.data &&
        catsRes.value.data.length > 0
      ) {
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
    const handleSync = () => {
      try {
        const cached =
          localStorage.getItem('samko_all_assets_v5') || sessionStorage.getItem('samko_all_assets_v5');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const synced = parsed
              .filter((a: any) => {
                const h = String(a.hotel || a.hotelName || a.property || a.site || '').toLowerCase();
                return h !== 'gow' && !h.includes('gow');
              })
              .map((a: any) => {
                const appStatus = a.approvalStatus || 'approved';
                const st =
                  appStatus === 'approved'
                    ? a.status === 'under-maintenance'
                      ? 'active'
                      : a.status || 'active'
                    : a.status || 'under-maintenance';
                return { ...a, approvalStatus: appStatus, status: st };
              });
            setAssets(synced);
            return;
          }
        }
      } catch { }
      fetchAssets();
    };
    window.addEventListener('samko:data-changed', handleSync);
    window.addEventListener('samko:assets-changed', handleSync);
    window.addEventListener('samko:approvals-changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('samko:data-changed', handleSync);
      window.removeEventListener('samko:assets-changed', handleSync);
      window.removeEventListener('samko:approvals-changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [fetchAssets]);

  const handleStatusChange = async (assetId: string, newStatus: string) => {
    const approvalStatus =
      newStatus === 'active'
        ? ('approved' as const)
        : newStatus === 'under-maintenance'
          ? ('hold' as const)
          : ('approved' as const);
    const updated = assets.map((a) => {
      if (a.id === assetId || a.assetId === assetId) {
        return {
          ...a,
          status: newStatus as any,
          approvalStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return a;
    });

    setAssets(updated);
    saveAssetsToStorage(updated);

    const label = newStatus.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    toast.success('Asset Status Updated', {
      description: `Asset status changed to ${label} across all registers`,
    });

    try {
      await api.assets.update(assetId, {
        status: newStatus,
        approvalStatus,
      });
    } catch (err: any) {
      console.warn('Failed to sync asset status:', err);
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
    const newId = isNonFixed
      ? `FFE-${Date.now().toString().slice(-4)}`
      : `AST-${Date.now().toString().slice(-4)}`;
    const assetToSave = {
      ...newAssetForm,
      id: newId,
      assetId: newId,
      isFixed: !isNonFixed,
      portal: isOpCo ? 'opco' : 'propco',
      nextInspection: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };

    const nextList = [assetToSave as any, ...assets];
    setAssets(nextList);
    saveAssetsToStorage(nextList);
    addPageItem(pageKey, assetToSave);
    setShowAddAssetModal(false);
    toast.success('Asset created', { description: `${assetToSave.name} saved to database` });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', { detail: { type: 'assets', id: newId } })
      );
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
    const nextList = assets.map((a) => (a.id === updated.id ? updated : a));
    setAssets(nextList);
    saveAssetsToStorage(nextList);
    updatePageItem(pageKey, updated.id, updated);
    setShowEditAssetModal(false);
    toast.success('Asset updated', { description: `${updated.name} updated successfully` });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', { detail: { type: 'assets', id: updated.id } })
      );
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
    const nextList = assets.filter((a) => a.id !== id && a.assetId !== id);
    setAssets(nextList);
    saveAssetsToStorage(nextList);
    deletePageItem(pageKey, id);
    toast.success('Asset deleted', { description: `${assetToDelete.name} removed from register` });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', { detail: { type: 'assets', id } })
      );
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
        String(a.name || '')
          .toLowerCase()
          .includes(q) ||
        String(a.assetId || '')
          .toLowerCase()
          .includes(q) ||
        String(a.department || '')
          .toLowerCase()
          .includes(q) ||
        String(a.location || '')
          .toLowerCase()
          .includes(q) ||
        String(a.category || '')
          .toLowerCase()
          .includes(q) ||
        String(a.manufacturer || '')
          .toLowerCase()
          .includes(q) ||
        String(a.serialNumber || '')
          .toLowerCase()
          .includes(q);

      const matchHotel =
        hotelFilter.length === 0 ||
        hotelFilter.includes(a.hotelId) ||
        hotelFilter.includes((a as any).propertyId) ||
        hotelFilter.includes((a as any).property);
      const matchCategory = categoryFilter.length === 0 || categoryFilter.includes(a.category);
      const matchDept = departmentFilter.length === 0 || departmentFilter.includes(a.department);
      const matchStatus = statusFilter.length === 0 || statusFilter.includes(a.status);
      const matchCustom = Object.entries(customDropdownFilters).every(([key, vals]) => {
        if (!vals || vals.length === 0) return true;
        if (vals.some((v) => v.toLowerCase().startsWith('all '))) return true;
        const assetVal = String(
          (a as any)[key] ||
          (a as any).metadata?.[key] ||
          (a as any).condition ||
          (a as any).riskLevel ||
          ''
        ).toLowerCase();
        return vals.some((v) => v.toLowerCase() === assetVal || assetVal.includes(v.toLowerCase()));
      });

      return matchSearch && matchHotel && matchCategory && matchDept && matchStatus && matchCustom;
    });
  }, [
    scopedAssets,
    search,
    hotelFilter,
    categoryFilter,
    departmentFilter,
    statusFilter,
    customDropdownFilters,
  ]);

  // Loading pagination: 7 records default per page (adjustable to 5, 7, 10, 20)
  const {
    currentPage,
    pageSize,
    totalRecords,
    paginatedItems: paginatedAssets,
    isPageLoading,
    changePage,
    changePageSize,
  } = useLoadingPagination(filtered, 10);

  // Multi-select Assets State
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [isBulkDeletingAssets, setIsBulkDeletingAssets] = useState(false);
  const [showBulkDeleteAssetsModal, setShowBulkDeleteAssetsModal] = useState(false);
  const [selectedAssetTypeFilter, setSelectedAssetTypeFilter] = useState('');

  const isAllAssetsPageSelected =
    paginatedAssets.length > 0 && paginatedAssets.every((a) => selectedAssetIds.includes(a.id));
  const isSomeAssetsPageSelected =
    paginatedAssets.some((a) => selectedAssetIds.includes(a.id)) && !isAllAssetsPageSelected;

  const handleToggleSelectAllAssetsPage = () => {
    if (isAllAssetsPageSelected) {
      const pageIds = new Set(paginatedAssets.map((a) => a.id));
      setSelectedAssetIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = paginatedAssets.map((a) => a.id);
      setSelectedAssetIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleAssetSelect = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFilteredAssets = () => {
    setSelectedAssetIds(filtered.map((a) => a.id));
  };

  const handleClearAssetSelection = () => {
    setSelectedAssetIds([]);
    setSelectedAssetTypeFilter('');
  };

  const assetTypeOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((a) => {
      const isFixed = isAssetFixed(a);
      counts[isFixed ? 'type:fixed' : 'type:non-fixed'] =
        (counts[isFixed ? 'type:fixed' : 'type:non-fixed'] || 0) + 1;
      counts[`cat:${a.category}`] = (counts[`cat:${a.category}`] || 0) + 1;
      const hotel = a.hotelName || (a as any).propertyName;
      if (hotel) counts[`hotel:${hotel}`] = (counts[`hotel:${hotel}`] || 0) + 1;
      counts[`status:${a.status}`] = (counts[`status:${a.status}`] || 0) + 1;
      counts[`cond:${a.condition}`] = (counts[`cond:${a.condition}`] || 0) + 1;
      counts[`risk:${a.riskLevel}`] = (counts[`risk:${a.riskLevel}`] || 0) + 1;
    });

    const opts: { label: string; value: string; count: number }[] = [];
    if (counts['type:fixed'])
      opts.push({ label: 'Type: Fixed Assets', value: 'type:fixed', count: counts['type:fixed'] });
    if (counts['type:non-fixed'])
      opts.push({
        label: 'Type: Non-Fixed Assets',
        value: 'type:non-fixed',
        count: counts['type:non-fixed'],
      });

    categories.forEach((c) => {
      if (counts[`cat:${c}`])
        opts.push({ label: `Category: ${c}`, value: `cat:${c}`, count: counts[`cat:${c}`] });
    });
    HOTELS.forEach((h) => {
      if (counts[`hotel:${h.name}`])
        opts.push({
          label: `Property: ${h.name}`,
          value: `hotel:${h.name}`,
          count: counts[`hotel:${h.name}`],
        });
    });
    if (counts['status:active'])
      opts.push({
        label: 'Status: Active',
        value: 'status:active',
        count: counts['status:active'],
      });
    if (counts['status:under-maintenance'])
      opts.push({
        label: 'Status: Under Maintenance',
        value: 'status:under-maintenance',
        count: counts['status:under-maintenance'],
      });
    if (counts['status:inactive'])
      opts.push({
        label: 'Status: Inactive',
        value: 'status:inactive',
        count: counts['status:inactive'],
      });
    if (counts['cond:excellent'])
      opts.push({
        label: 'Condition: Excellent',
        value: 'cond:excellent',
        count: counts['cond:excellent'],
      });
    if (counts['cond:good'])
      opts.push({ label: 'Condition: Good', value: 'cond:good', count: counts['cond:good'] });
    if (counts['cond:poor'])
      opts.push({ label: 'Condition: Poor', value: 'cond:poor', count: counts['cond:poor'] });
    if (counts['risk:high'])
      opts.push({ label: 'Risk: High', value: 'risk:high', count: counts['risk:high'] });

    return opts;
  }, [filtered, categories]);

  const handleSelectAssetByType = (typeKey: string) => {
    setSelectedAssetTypeFilter(typeKey);
    if (!typeKey) {
      setSelectedAssetIds([]);
      return;
    }
    const [kind, val] = typeKey.split(':');
    const matched = filtered.filter((a) => {
      if (kind === 'type') return val === 'fixed' ? isAssetFixed(a) : !isAssetFixed(a);
      if (kind === 'cat') return a.category === val;
      if (kind === 'hotel') return (a.hotelName || (a as any).propertyName) === val;
      if (kind === 'status') return a.status === val;
      if (kind === 'cond') return a.condition === val;
      if (kind === 'risk') return a.riskLevel === val;
      return false;
    });
    setSelectedAssetIds(matched.map((a) => a.id));
    toast.info(`Selected ${matched.length} assets matching ${typeKey.replace(':', ': ')}`);
  };

  const handleConfirmBulkDeleteAssets = async () => {
    if (selectedAssetIds.length === 0) return;
    setIsBulkDeletingAssets(true);
    try {
      const ids = [...selectedAssetIds];
      const count = ids.length;

      const nextList = assets.filter((a) => !ids.includes(a.id) && !ids.includes(a.assetId));
      setAssets(nextList);
      saveAssetsToStorage(nextList);
      setSelectedAssetIds([]);
      setSelectedAssetTypeFilter('');
      setShowBulkDeleteAssetsModal(false);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'assets' } }));
      }
      await Promise.allSettled(ids.map((id) => api.assets.delete(id)));
      toast.success(`Deleted ${count} assets successfully!`);
    } catch (err: any) {
      toast.error('Failed to bulk delete assets');
    } finally {
      setIsBulkDeletingAssets(false);
    }
  };

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
    return accessibleAssets.filter((a) => isAssetFixed(a)).length;
  }, [accessibleAssets]);

  const nonFixedCount = useMemo(() => {
    return accessibleAssets.filter((a) => !isAssetFixed(a)).length;
  }, [accessibleAssets]);

  const tabs = useMemo(() => {
    if (isNonFixed) {
      return [{ id: 'non-fixed' as const, label: 'Non-Fixed Assets', count: nonFixedCount }];
    }
    return [{ id: 'fixed' as const, label: 'Fixed Assets', count: fixedCount }];
  }, [isNonFixed, fixedCount, nonFixedCount]);

  const handleTabClick = (tabId: 'fixed' | 'non-fixed') => {
    setActiveTab(tabId);
    const portalQuery = portalParam ? `&portal=${portalParam}` : '';
    if (tabId === 'non-fixed') {
      router.push(`/asset-management/assets?type=non-fixed${portalQuery}`);
    } else {
      router.push(portalParam ? `/asset-management/assets?portal=${portalParam}` : '/asset-management/assets');
    }
  };

  const cacheAssetForDetail = (a: Asset) => {
    try {
      sessionStorage.setItem('samko_last_clicked_asset', JSON.stringify(a));
      sessionStorage.setItem(`samko_asset_${a.id}`, JSON.stringify(a));
      if (a.assetId) {
        sessionStorage.setItem(`samko_asset_${a.assetId}`, JSON.stringify(a));
      }
    } catch { }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden">
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
            {isOpCo ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border border-[#60a5fa]/40 bg-[#60a5fa]/15 text-[#93c5fd] uppercase">
                OpCo Operations
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border border-[#e8c97a]/40 bg-[#e8c97a]/15 text-[#e8c97a] uppercase">
                PropCo Asset Co
              </span>
            )}
            {loading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cmsSubtitle && !cmsSubtitle.includes('of 98') && !cmsSubtitle.includes('of 100')
              ? cmsSubtitle
              : `${filtered.length} of ${scopedAssets.length} ${isNonFixed ? 'non-fixed' : 'fixed'} assets managed`}
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

          {hasWriteAccess && canUpload && (
            <Link
              href="/asset-management/import"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors hover:border-primary"
              style={{
                background: 'var(--surface2)',
                color: 'var(--text2)',
                border: '1px solid var(--border)',
              }}
            >
              <FileSpreadsheet size={14} style={{ color: 'var(--primary)' }} />
              {cmsSecondaryActionLabel || 'Import Excel'}
            </Link>
          )}
          {hasWriteAccess && (
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
                {(cmsPrimaryActionLabel || (isNonFixed ? 'Add FF&E Asset' : 'Add Asset'))
                  .replace(/^[\+\s]+/, '')
                  .trim()}
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
          options={accessiblePropertyOptions}
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
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
        <table className="w-full min-w-[1020px]">
          <thead className="sticky top-0 z-10" style={{ background: 'var(--surface)' }}>
            <tr>
              {hasDeleteAccess && (
                <th className="text-center px-3 py-3 border-b border-border w-10 whitespace-nowrap">
                  <TableCheckbox
                    checked={isAllAssetsPageSelected}
                    indeterminate={isSomeAssetsPageSelected}
                    onChange={handleToggleSelectAllAssetsPage}
                    title="Select all on this page"
                  />
                </th>
              )}
              {activeColumns.map((col) => (
                <th
                  key={col.id}
                  className={`text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-3.5 py-3 border-b border-border whitespace-nowrap ${col.id.toLowerCase() === 'actions' ? 'text-right' : ''
                    }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColCount + 1}
                  className="text-center py-20 text-muted-foreground text-sm"
                >
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
                      style={{
                        background: isOpCo ? 'rgba(96, 165, 250, 0.12)' : 'rgba(232, 201, 122, 0.12)',
                        border: isOpCo
                          ? '1px solid rgba(96, 165, 250, 0.25)'
                          : '1px solid rgba(232, 201, 122, 0.25)',
                        color: isOpCo ? '#60a5fa' : '#e8c97a',
                      }}
                    >
                      <Package size={24} />
                    </div>
                    <p className="font-semibold text-foreground text-sm">
                      {hasFilters
                        ? 'No assets found matching filters'
                        : `No ${isNonFixed ? 'Non-Fixed' : 'Fixed'} Assets in ${isOpCo ? 'OpCo' : 'PropCo'}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {hasFilters
                        ? 'Try adjusting your search criteria or clearing active filters.'
                        : `There are currently no ${isNonFixed ? 'non-fixed' : 'fixed'} assets recorded under ${isOpCo ? 'OpCo (Operations)' : 'PropCo (Asset Co)'}. Click "+ Add Asset" above to record a new asset.`}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedAssets.map((asset) => {
                const s = STATUS_CONFIG[asset.status] || STATUS_CONFIG.active;
                const propDisplayName =
                  asset.hotelName || (asset as any).propertyName || 'Property';

                return (
                  <tr
                    key={asset.id}
                    className={`border-b border-border transition-colors cursor-pointer ${selectedAssetIds.includes(asset.id) ? 'bg-[#e8c97a]/5' : ''
                      }`}
                    onClick={() => {
                      cacheAssetForDetail(asset);
                      router.push(`/asset-management/assets/${asset.id}`);
                    }}
                    onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      selectedAssetIds.includes(asset.id)
                        ? 'rgba(232,201,122,0.08)'
                        : 'var(--surface2)')
                    }
                    onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      selectedAssetIds.includes(asset.id)
                        ? 'rgba(232,201,122,0.05)'
                        : 'transparent')
                    }
                  >
                    {hasDeleteAccess && (
                      <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <TableCheckbox
                          checked={selectedAssetIds.includes(asset.id)}
                          onChange={() => handleToggleAssetSelect(asset.id)}
                          title={`Select ${asset.name}`}
                        />
                      </td>
                    )}
                    {activeColumns.map((col) => {
                      const colKey = col.id.toLowerCase();
                      if (colKey === 'assetid') {
                        return (
                          <td
                            key={col.id}
                            className="px-3 py-2.5 font-mono text-xs font-semibold"
                            style={{ color: 'var(--primary)' }}
                          >
                            {asset.assetId}
                          </td>
                        );
                      }
                      if (colKey === 'name') {
                        return (
                          <td key={col.id} className="px-3 py-2.5">
                            <span
                              className="font-medium text-sm"
                              style={{ color: 'var(--foreground)' }}
                            >
                              {asset.name}
                            </span>
                          </td>
                        );
                      }
                      if (colKey === 'category') {
                        return (
                          <td key={col.id} className="px-3 py-2.5">
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: 'var(--surface3)', color: 'var(--text2)' }}
                            >
                              {asset.category}
                            </span>
                          </td>
                        );
                      }
                      if (colKey === 'property') {
                        return (
                          <td
                            key={col.id}
                            className="px-3 py-2.5 text-xs text-muted-foreground"
                            title={propDisplayName}
                          >
                            {propDisplayName.split(' ').slice(0, 2).join(' ')}
                          </td>
                        );
                      }
                      if (colKey === 'department') {
                        return (
                          <td key={col.id} className="px-3 py-2.5 text-xs text-muted-foreground">
                            {asset.department}
                          </td>
                        );
                      }
                      if (colKey === 'location') {
                        return (
                          <td key={col.id} className="px-3 py-2.5 text-xs text-muted-foreground">
                            {asset.location}
                          </td>
                        );
                      }
                      if (colKey === 'qty' || colKey === 'quantity') {
                        return (
                          <td key={col.id} className="px-3 py-2.5 text-xs font-semibold">
                            {asset.quantity}
                          </td>
                        );
                      }
                      if (colKey === 'condition') {
                        return (
                          <td key={col.id} className="px-3 py-2.5">
                            <Badge
                              label={asset.condition}
                              style={CONDITION_STYLES[asset.condition] || CONDITION_STYLES.good}
                            />
                          </td>
                        );
                      }
                      if (colKey === 'risk') {
                        return (
                          <td key={col.id} className="px-3 py-2.5">
                            <Badge
                              label={asset.riskLevel}
                              style={RISK_STYLES[asset.riskLevel] || RISK_STYLES.low}
                            />
                          </td>
                        );
                      }
                      if (colKey === 'nextinspection') {
                        return (
                          <td
                            key={col.id}
                            className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap"
                          >
                            {asset.nextInspectionDate
                              ? new Date(asset.nextInspectionDate).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: '2-digit',
                              })
                              : '—'}
                          </td>
                        );
                      }
                      if (colKey === 'status') {
                        const effectiveStatus =
                          (asset as any).approvalStatus === 'approved'
                            ? 'active'
                            : asset.status || 'active';
                        const statusStyle = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.active;
                        return (
                          <td
                            key={col.id}
                            className="px-3 py-2.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {!canEdit || isViewer ? (
                              <Badge
                                label={STATUS_CONFIG[effectiveStatus]?.label || effectiveStatus}
                                style={statusStyle}
                              />
                            ) : (
                              <StatusDropdown
                                value={effectiveStatus}
                                options={[
                                  {
                                    value: 'active',
                                    label: 'Active',
                                    color: '#3dd68c',
                                    bg: 'rgba(61,214,140,0.12)',
                                  },
                                  {
                                    value: 'under-maintenance',
                                    label: 'Under Maintenance',
                                    color: '#f59e0b',
                                    bg: 'rgba(245,158,11,0.12)',
                                  },
                                  {
                                    value: 'inactive',
                                    label: 'Inactive',
                                    color: '#94a3b8',
                                    bg: 'rgba(148,163,184,0.12)',
                                  },
                                  {
                                    value: 'disposed',
                                    label: 'Disposed',
                                    color: '#f43f5e',
                                    bg: 'rgba(244,63,94,0.12)',
                                  },
                                  {
                                    value: 'lost',
                                    label: 'Lost',
                                    color: '#f43f5e',
                                    bg: 'rgba(244,63,94,0.12)',
                                  },
                                ]}
                                onChange={(val) => handleStatusChange(asset.id, val)}
                              />
                            )}
                          </td>
                        );
                      }
                      if (colKey === 'document' || colKey === 'attachment') {
                        return (
                          <td
                            key={col.id}
                            className="px-3 py-2.5 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DocumentTableCell
                              documentName={
                                (asset as any).documentName ||
                                (asset as any).attachmentName ||
                                (asset as any).document ||
                                (asset as any).docName
                              }
                              documentUrl={
                                (asset as any).documentUrl ||
                                (asset as any).attachmentUrl ||
                                (asset as any).fileUrl
                              }
                            />
                          </td>
                        );
                      }
                      if (colKey === 'actions') {
                        return (
                          <td
                            key={col.id}
                            className="px-3 py-2.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-1.5 whitespace-nowrap justify-end">
                              <Link
                                href={`/asset-management/assets/${asset.id}`}
                                onClick={() => cacheAssetForDetail(asset)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-surface2"
                                style={{
                                  background: 'rgba(232,201,122,0.12)',
                                  color: 'var(--primary)',
                                  border: '1px solid rgba(232,201,122,0.25)',
                                }}
                                title="View Full Details"
                              >
                                <Eye size={12} />
                                View
                              </Link>
                              {hasWriteAccess && (
                                <button
                                  onClick={() => handleOpenEditAsset(asset)}
                                  className="p-1.5 rounded-lg border border-border hover:bg-surface2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                  title="Edit Asset"
                                >
                                  <Edit2 size={12} />
                                </button>
                              )}
                              {hasDeleteAccess && (
                                <button
                                  onClick={() => setAssetToDelete(asset)}
                                  className="p-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/15 text-rose-400 transition-colors cursor-pointer"
                                  title="Delete Asset"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      }

                      // Dynamic custom column value with inline quick editing!
                      const val = (asset as any)[col.id] ?? (asset as any)[colKey];
                      const isEditing =
                        inlineEditingCell?.id === asset.id && inlineEditingCell?.colId === col.id;

                      if (isEditing) {
                        return (
                          <td
                            key={col.id}
                            className="px-2 py-1.5 whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                autoFocus
                                value={inlineVal}
                                onChange={(e) => setInlineVal(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveInlineCustom(asset.id, col.id, inlineVal);
                                  } else if (e.key === 'Escape') {
                                    setInlineEditingCell(null);
                                  }
                                }}
                                onBlur={() => handleSaveInlineCustom(asset.id, col.id, inlineVal)}
                                placeholder={`Enter ${col.label}...`}
                                className="px-2 py-1 text-xs rounded border border-primary outline-none text-foreground w-full min-w-[120px] shadow-sm"
                                style={{ background: 'var(--surface2)' }}
                              />
                              <button
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSaveInlineCustom(asset.id, col.id, inlineVal);
                                }}
                                className="p-1 rounded bg-primary text-black hover:opacity-90 shrink-0"
                                title="Save"
                              >
                                <Check size={11} strokeWidth={3} />
                              </button>
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={col.id}
                          className="px-3 py-2.5 text-xs whitespace-nowrap cursor-pointer hover:bg-white/[0.04] transition-colors group"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isViewer || isUploader || !canEdit) return;
                            setInlineEditingCell({ id: asset.id, colId: col.id });
                            setInlineVal(String(val !== undefined && val !== null ? val : ''));
                          }}
                          title={!isViewer && !isUploader && canEdit ? `Click to edit ${col.label}` : undefined}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className={
                                val !== undefined && val !== null && String(val).trim() !== ''
                                  ? 'text-foreground font-medium'
                                  : 'text-muted-foreground/60'
                              }
                            >
                              {val !== undefined && val !== null && String(val).trim() !== ''
                                ? String(val)
                                : '—'}
                            </span>
                            {!isViewer && !isUploader && canEdit && (
                              <Edit2
                                size={10}
                                className="opacity-0 group-hover:opacity-60 text-primary transition-opacity shrink-0"
                              />
                            )}
                          </div>
                        </td>
                      );
                    })}
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
        pageSizeOptions={[5, 10, 15, 20, 50]}
        onPageChange={changePage}
        onPageSizeChange={changePageSize}
        isLoading={loading || isPageLoading}
        recordName="assets"
        className="sticky bottom-0 z-20 flex-shrink-0"
      />

      {/* Floating Bulk Action Bar (Only shown for authorized delete users) */}
      {hasDeleteAccess && (
        <div className="mt-2">
          <BulkActionBar
            selectedCount={selectedAssetIds.length}
            totalCount={filtered.length}
            onClearSelection={handleClearAssetSelection}
            onSelectAll={handleSelectAllFilteredAssets}
            onDeleteSelected={() => setShowBulkDeleteAssetsModal(true)}
            typeOptions={assetTypeOptions}
            onSelectByType={handleSelectAssetByType}
            selectedTypeValue={selectedAssetTypeFilter}
            typePlaceholder="Select all of type (Category, Property, Status)..."
            recordName="assets"
            isDeleting={isBulkDeletingAssets}
          />
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
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
                    Add New Category
                  </h3>
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
                  {[
                    '#e8c97a',
                    '#60a5fa',
                    '#a78bfa',
                    '#34d399',
                    '#f43f5e',
                    '#38bdf8',
                    '#fb923c',
                    '#4ade80',
                  ].map((c) => (
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
                  {savingCategory ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Plus size={13} />
                  )}
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {showAddAssetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-border overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
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
                  <h3 className="font-head font-bold text-base text-foreground">Add New Asset</h3>
                  <p className="text-xs text-muted-foreground">
                    Store asset record directly into Google Cloud Firestore
                  </p>
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
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={newAssetForm.category}
                    onChange={(val) => setNewAssetForm({ ...newAssetForm, category: val })}
                    options={categories}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Property
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={newAssetForm.hotelId}
                    onChange={(val) => {
                      const prop = properties.find((p) => p.value === val);
                      setNewAssetForm({
                        ...newAssetForm,
                        hotelId: val,
                        hotelName: prop ? prop.label : 'Property',
                      });
                    }}
                    options={accessiblePropertyOptions}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Department
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={newAssetForm.department}
                    onChange={(val) => setNewAssetForm({ ...newAssetForm, department: val })}
                    options={DEPARTMENTS}
                  />
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
                    onChange={(e) =>
                      setNewAssetForm({ ...newAssetForm, quantity: Number(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Condition
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={newAssetForm.condition}
                    onChange={(val) => setNewAssetForm({ ...newAssetForm, condition: val })}
                    options={[
                      { value: 'excellent', label: 'Excellent', color: '#10b981' },
                      { value: 'good', label: 'Good', color: '#3dd68c' },
                      { value: 'fair', label: 'Fair', color: '#f59e0b' },
                      { value: 'poor', label: 'Poor', color: '#ef4444' },
                      { value: 'critical', label: 'Critical', color: '#dc2626' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Risk Level
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={newAssetForm.riskLevel}
                    onChange={(val) => setNewAssetForm({ ...newAssetForm, riskLevel: val })}
                    options={[
                      { value: 'low', label: 'Low', color: '#10b981' },
                      { value: 'medium', label: 'Medium', color: '#f59e0b' },
                      { value: 'high', label: 'High', color: '#ef4444' },
                      { value: 'critical', label: 'Critical', color: '#dc2626' },
                    ]}
                  />
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
                    onChange={(e) =>
                      setNewAssetForm({ ...newAssetForm, serialNumber: e.target.value })
                    }
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
                    onChange={(e) =>
                      setNewAssetForm({
                        ...newAssetForm,
                        purchaseCost: Number(e.target.value) || 0,
                      })
                    }
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

              {/* Optional Document Upload */}
              <DocumentUploadField
                label="Attach Document / Specification / Invoice (Optional)"
                documentName={(newAssetForm as any).documentName}
                documentUrl={(newAssetForm as any).documentUrl}
                documentSize={(newAssetForm as any).documentSize}
                onUpload={({ name, url, size }) =>
                  setNewAssetForm({
                    ...newAssetForm,
                    documentName: name,
                    documentUrl: url,
                    documentSize: size || '',
                  })
                }
                onRemove={() =>
                  setNewAssetForm({
                    ...newAssetForm,
                    documentName: '',
                    documentUrl: '',
                    documentSize: '',
                  })
                }
              />

              {/* Dynamic Custom Columns */}
              {customColumns && customColumns.length > 0 && (
                <div className="pt-3 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-primary">
                      Custom Columns ({customColumns.length})
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      Dynamically configured attributes
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {customColumns.map((col) => (
                      <div key={col.id}>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                          {col.label}
                        </label>
                        <input
                          type="text"
                          value={
                            (newAssetForm as any)[col.id] ??
                            (newAssetForm as any)[col.id.toLowerCase()] ??
                            ''
                          }
                          onChange={(e) =>
                            setNewAssetForm({
                              ...newAssetForm,
                              [col.id]: e.target.value,
                              [col.id.toLowerCase()]: e.target.value,
                            })
                          }
                          placeholder={`Enter ${col.label}...`}
                          className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                          style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-border overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
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
                  <Edit2 size={16} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base text-foreground">
                    Edit Asset: {editingAsset.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {editingAsset.assetId} · Update asset details dynamically
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditAssetModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleSaveEditAsset}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
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
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={editingAsset.category}
                    onChange={(val) => setEditingAsset({ ...editingAsset, category: val })}
                    options={categories}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Property *
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={
                      editingAsset.hotelName ||
                      (editingAsset as any).propertyName ||
                      (editingAsset as any).property ||
                      ''
                    }
                    onChange={(val) => {
                      const prop = properties.find((p) => p.label === val || p.value === val);
                      setEditingAsset({
                        ...editingAsset,
                        hotelName: prop ? prop.label : val,
                        hotelId: prop ? prop.value : editingAsset.hotelId,
                        property: prop ? prop.label : val,
                      } as any);
                    }}
                    options={accessiblePropertyOptions.map((p) => ({
                      value: p.label,
                      label: p.label,
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editingAsset.department || ''}
                    onChange={(e) =>
                      setEditingAsset({ ...editingAsset, department: e.target.value })
                    }
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
                    onChange={(e) =>
                      setEditingAsset({ ...editingAsset, quantity: Number(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Status
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={editingAsset.status}
                    onChange={(val) => setEditingAsset({ ...editingAsset, status: val as any })}
                    options={[
                      { value: 'active', label: 'Active', color: '#10b981' },
                      { value: 'under-maintenance', label: 'Under Maintenance', color: '#f59e0b' },
                      { value: 'inactive', label: 'Inactive', color: '#ef4444' },
                      { value: 'disposed', label: 'Disposed', color: '#6b7280' },
                      { value: 'lost', label: 'Lost', color: '#dc2626' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Condition
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={editingAsset.condition || 'good'}
                    onChange={(val) => setEditingAsset({ ...editingAsset, condition: val as any })}
                    options={[
                      { value: 'new', label: 'New', color: '#10b981' },
                      { value: 'good', label: 'Good', color: '#3dd68c' },
                      { value: 'fair', label: 'Fair', color: '#f59e0b' },
                      { value: 'poor', label: 'Poor', color: '#ef4444' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Risk Level
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={editingAsset.risk || 'low'}
                    onChange={(val) => setEditingAsset({ ...editingAsset, risk: val as any })}
                    options={[
                      { value: 'low', label: 'Low Risk', color: '#10b981' },
                      { value: 'medium', label: 'Medium Risk', color: '#f59e0b' },
                      { value: 'high', label: 'High Risk', color: '#ef4444' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Serial Number / Barcode
                  </label>
                  <input
                    type="text"
                    value={editingAsset.serialNumber || ''}
                    onChange={(e) =>
                      setEditingAsset({ ...editingAsset, serialNumber: e.target.value })
                    }
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
                    onChange={(e) =>
                      setEditingAsset({
                        ...editingAsset,
                        purchaseCost: Number(e.target.value) || 0,
                      } as any)
                    }
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
                <label
                  htmlFor="edit-asset-is-fixed"
                  className="text-xs text-foreground cursor-pointer"
                >
                  Fixed Asset (affects balance sheet & fixed asset register)
                </label>
              </div>

              {/* Optional Document Upload */}
              <DocumentUploadField
                label="Attach Document / Specification / Invoice (Optional)"
                documentName={(editingAsset as any)?.documentName}
                documentUrl={(editingAsset as any)?.documentUrl || (editingAsset as any)?.attachmentUrl || (editingAsset as any)?.fileUrl}
                documentSize={(editingAsset as any)?.documentSize}
                onUpload={({ name, url, size }) =>
                  setEditingAsset((prev: any) =>
                    prev
                      ? ({
                        ...prev,
                        documentName: name,
                        documentUrl: url,
                        documentSize: size || '',
                      } as any)
                      : null
                  )
                }
                onRemove={() =>
                  setEditingAsset((prev: any) =>
                    prev
                      ? ({
                        ...prev,
                        documentName: '',
                        documentUrl: '',
                        documentSize: '',
                      } as any)
                      : null
                  )
                }
              />

              {/* Dynamic Custom Columns */}
              {customColumns && customColumns.length > 0 && (
                <div className="pt-3 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-primary">
                      Custom Columns ({customColumns.length})
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      Dynamically configured attributes
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {customColumns.map((col) => (
                      <div key={col.id}>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                          {col.label}
                        </label>
                        <input
                          type="text"
                          value={editingAsset[col.id] ?? editingAsset[col.id.toLowerCase()] ?? ''}
                          onChange={(e) =>
                            setEditingAsset({
                              ...editingAsset,
                              [col.id]: e.target.value,
                              [col.id.toLowerCase()]: e.target.value,
                            })
                          }
                          placeholder={`Enter ${col.label}...`}
                          className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                          style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-rose-500/30 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            style={{ background: 'var(--surface)' }}
          >
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
              Are you sure you want to permanently delete{' '}
              <strong className="text-foreground">{assetToDelete.name}</strong> from the asset
              register? This action cannot be undone.
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

      {/* Bulk Delete Assets Modal */}
      <ConfirmDeleteModal
        isOpen={showBulkDeleteAssetsModal}
        onClose={() => setShowBulkDeleteAssetsModal(false)}
        onConfirm={handleConfirmBulkDeleteAssets}
        title="Confirm Bulk Deletion"
        itemName={`${selectedAssetIds.length} Selected Assets`}
        registerName="fixed assets register"
        customWarning={`Are you sure you want to permanently delete these ${selectedAssetIds.length} selected assets from the register? This action cannot be undone.`}
        confirmButtonText={`Delete ${selectedAssetIds.length} Assets`}
        isDeleting={isBulkDeletingAssets}
      />
    </div>
  );
}
