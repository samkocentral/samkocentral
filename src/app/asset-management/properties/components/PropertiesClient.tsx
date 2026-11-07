'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Building2, MapPin, Phone, User, Package, ChevronRight, ChevronDown, Search, Plus, X, Loader2, Edit2, Trash2, Sparkles } from 'lucide-react';
import { HOTELS, MAINTENANCE_RECORDS, ASSETS, getAssetStats, type Hotel } from '@/lib/assetData';
import { getLiveProperties, saveLivePropertiesToCache } from '@/hooks/useLiveProperties';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { toast } from 'sonner';
import { useDeepPageCms, updatePageItem, deletePageItem } from '@/lib/deepPageCms';
import PageCMSEditButton from '@/components/cms/PageCMSEditButton';
import CustomDropdown from '@/components/ui/CustomDropdown';
import LoadingPagination from '@/components/ui/LoadingPagination';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import { useLoadingPagination } from '@/hooks/useLoadingPagination';
import TableCheckbox from '@/components/ui/TableCheckbox';
import BulkActionBar from '@/components/ui/BulkActionBar';

export default function PropertiesClient() {
  const { isViewer, canEdit, canDelete, canWriteTab, isPropertyAccessible, userAssignedProperties } = useAuth();
  const hasWriteAccess = !isViewer && canEdit && canWriteTab('properties');
  const hasDeleteAccess = !isViewer && canDelete && canWriteTab('properties');
  const {
    title: cmsTitle,
    subtitle: cmsSubtitle,
    searchPlaceholder: cmsSearchPlaceholder,
    primaryActionLabel: cmsPrimaryActionLabel,
    customLabels: cmsCustomLabels,
    items: cmsPropertiesList,
    dropdowns: cmsDropdowns,
  } = useDeepPageCms('properties');

  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [properties, setProperties] = useState<Hotel[]>(() => getLiveProperties());
  const [maintenance, setMaintenance] = useState<any[]>(MAINTENANCE_RECORDS);
  const [assets, setAssets] = useState<any[]>(ASSETS);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    city: 'London',
    address: '',
    manager: '',
    phone: '',
    status: 'active' as 'active' | 'inactive',
  });

  // Edit property modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingProperty, setIsDeletingProperty] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    city: '',
    address: '',
    manager: '',
    phone: '',
    status: 'active' as 'active' | 'inactive',
    totalAssets: 0,
    overdueCount: 0,
    dueTodayCount: 0,
  });

  const handleOpenEditProperty = (hotel: any) => {
    setEditingProperty(hotel);
    setEditForm({
      name: hotel.name || '',
      city: hotel.city || 'London',
      address: hotel.address || '',
      manager: hotel.manager || '',
      phone: hotel.phone || '',
      status: (hotel.status as any) || 'active',
      totalAssets: hotel.totalAssets || 0,
      overdueCount: hotel.overdueCount || 0,
      dueTodayCount: hotel.dueTodayCount || 0,
    });
    setShowEditModal(true);
  };

  const handleSavePropertyEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty || !editForm.name.trim()) return;

    const propertyId = editingProperty.id;
    // 1. Update deep page CMS store
    updatePageItem('properties', propertyId, editForm);

    // 2. Update local state
    setProperties((prev) => {
      const next = prev.map((p) => (p.id === propertyId ? { ...p, ...editForm } : p));
      saveLivePropertiesToCache(next);
      return next;
    });

    // 3. Persist to API/Firestore
    try {
      await api.properties.update(propertyId, editForm);
    } catch (err) {
      console.warn('API update fallback:', err);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'property', id: propertyId } }));
    }

    toast.success('Property Details Saved', {
      description: `"${editForm.name}" updated successfully`,
    });
    setShowEditModal(false);
  };

  const handleDeleteProperty = (propertyId: string, propertyName: string) => {
    setPropertyToDelete({ id: propertyId, name: propertyName });
  };

  const confirmDeleteProperty = async () => {
    if (!propertyToDelete) return;
    const { id: propertyId, name: propertyName } = propertyToDelete;
    setIsDeletingProperty(true);

    deletePageItem('properties', propertyId);
    setProperties((prev) => {
      const next = prev.filter((p) => p.id !== propertyId);
      saveLivePropertiesToCache(next);
      return next;
    });

    try {
      await api.properties.delete(propertyId);
    } catch (err) {
      console.warn('API delete fallback:', err);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'property', id: propertyId } }));
    }

    toast.success('Property Deleted', {
      description: `"${propertyName}" removed from portfolio`,
    });
    setShowEditModal(false);
  };

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [propsRes, mRes, assetsRes] = await Promise.allSettled([
        api.properties.getAll(),
        api.maintenance.getAll(),
        api.assets.getAll(),
      ]);

      if (propsRes.status === 'fulfilled' && propsRes.value.success && propsRes.value.data && propsRes.value.data.length > 0) {
        setProperties(propsRes.value.data);
        saveLivePropertiesToCache(propsRes.value.data);
      }
      if (mRes.status === 'fulfilled' && mRes.value.success && mRes.value.data && mRes.value.data.length > 0) {
        setMaintenance(mRes.value.data);
      }
      if (assetsRes.status === 'fulfilled' && assetsRes.value.success && assetsRes.value.data && assetsRes.value.data.length > 0) {
        setAssets(assetsRes.value.data);
      }
    } catch (e) {
      console.warn('Using default properties data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
    const handleDataChanged = () => {
      loadAllData();
    };
    window.addEventListener('samko:data-changed', handleDataChanged);
    return () => window.removeEventListener('samko:data-changed', handleDataChanged);
  }, [loadAllData]);

  const handleStatusChange = async (propertyId: string, newStatus: string) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === propertyId ? { ...p, status: newStatus as any } : p))
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'property', id: propertyId, status: newStatus } }));
    }

    toast.success('Property Status Updated', {
      description: `Property status set to ${newStatus.toUpperCase()}`,
    });

    try {
      await api.properties.update(propertyId, { status: newStatus });
    } catch (err: any) {
      console.error('Failed to update property status:', err);
      toast.error('Failed to update status', { description: err?.message || 'Server error' });
    }
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    try {
      const res = await api.properties.create({
        ...form,
        totalAssets: 0,
      });

      if (res.success && res.data) {
        setProperties((prev) => {
          const next = [res.data, ...prev];
          saveLivePropertiesToCache(next);
          return next;
        });
        setShowAddModal(false);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'property' } }));
        }
        toast.success('Property Registered', {
          description: `${res.data.name} successfully added to portfolio`,
        });
        setForm({
          name: '',
          city: 'London',
          address: '',
          manager: '',
          phone: '',
          status: 'active',
        });
      }
    } catch (err: any) {
      toast.error('Failed to save property', { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const effectiveProperties = useMemo(() => {
    const cmsList = (cmsPropertiesList && cmsPropertiesList.length > 0 ? (cmsPropertiesList as any[]) : []) || [];
    if (properties.length === 0) return cmsList;
    if (cmsList.length === 0) return properties;

    // Merge database properties with CMS overrides by matching ID or name
    const merged: any[] = [];
    const matchedCmsIds = new Set<string>();

    properties.forEach((dbProp) => {
      const dbCleanName = (dbProp.name || '').toLowerCase().trim();
      const dbId = (dbProp.id || '').toLowerCase().trim();

      const cmsMatch = cmsList.find((c) => {
        const cCleanName = (c.name || '').toLowerCase().trim();
        const cId = (c.id || '').toLowerCase().trim();
        return (
          cId === dbId ||
          cCleanName === dbCleanName ||
          (dbCleanName && cCleanName && (dbCleanName.includes(cCleanName) || cCleanName.includes(dbCleanName)))
        );
      });

      if (cmsMatch) {
        matchedCmsIds.add(cmsMatch.id);
        merged.push({
          ...dbProp,
          ...cmsMatch,
          name: cmsMatch.name || dbProp.name,
          id: dbProp.id || cmsMatch.id,
        });
      } else {
        merged.push(dbProp);
      }
    });

    // Add any remaining CMS items that didn't match a DB property
    cmsList.forEach((c) => {
      if (!matchedCmsIds.has(c.id)) {
        merged.push(c);
      }
    });

    return merged;
  }, [cmsPropertiesList, properties]);

  const filtered = effectiveProperties?.filter((h) => {
    if (!isPropertyAccessible(h?.name) && !isPropertyAccessible(h?.id) && !isPropertyAccessible(h?.propertyId)) return false;
    const matchSearch =
      !search ||
      h?.name?.toLowerCase()?.includes(search?.toLowerCase()) ||
      h?.city?.toLowerCase()?.includes(search?.toLowerCase()) ||
      h?.manager?.toLowerCase()?.includes(search?.toLowerCase());

    const cityFilter = selectedFilters['city'] || [];
    const matchCity =
      cityFilter.length === 0 ||
      cityFilter.includes('All Cities') ||
      cityFilter.some((c) => c.toLowerCase() === h?.city?.toLowerCase());

    const statusFilter = selectedFilters['status'] || [];
    const matchStatus =
      statusFilter.length === 0 ||
      statusFilter.includes('All Statuses') ||
      statusFilter.some((s) => s.toLowerCase() === (h?.status || 'active').toLowerCase());

    // Generic match for newly added custom dropdowns
    const customMatches = Object.entries(selectedFilters).every(([key, vals]) => {
      if (key === 'city' || key === 'status' || !vals || vals.length === 0) return true;
      if (vals.some((v) => v.toLowerCase().startsWith('all '))) return true;
      const propVal = String(h?.[key] || h?.metadata?.[key] || '').toLowerCase();
      return vals.some((v) => v.toLowerCase() === propVal || propVal.includes(v.toLowerCase()));
    });

    return matchSearch && matchCity && matchStatus && customMatches;
  });

  const {
    currentPage,
    pageSize,
    totalRecords,
    paginatedItems: paginatedProperties,
    isPageLoading,
    changePage,
    changePageSize,
  } = useLoadingPagination(filtered || [], 10);

  // Multi-select Properties State
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [isBulkDeletingProperties, setIsBulkDeletingProperties] = useState(false);
  const [showBulkDeletePropertiesModal, setShowBulkDeletePropertiesModal] = useState(false);
  const [selectedPropertyTypeFilter, setSelectedPropertyTypeFilter] = useState('');

  const isAllPropertiesPageSelected =
    paginatedProperties.length > 0 && paginatedProperties.every((p) => selectedPropertyIds.includes(p.id));

  const handleToggleSelectAllPropertiesPage = () => {
    if (isAllPropertiesPageSelected) {
      const pageIds = new Set(paginatedProperties.map((p) => p.id));
      setSelectedPropertyIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = paginatedProperties.map((p) => p.id);
      setSelectedPropertyIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleTogglePropertySelect = (id: string) => {
    setSelectedPropertyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFilteredProperties = () => {
    setSelectedPropertyIds(filtered.map((p) => p.id));
  };

  const handleClearPropertySelection = () => {
    setSelectedPropertyIds([]);
    setSelectedPropertyTypeFilter('');
  };

  const propertyTypeOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((p) => {
      counts[`status:${p.status || 'active'}`] = (counts[`status:${p.status || 'active'}`] || 0) + 1;
      if (p.city) counts[`city:${p.city}`] = (counts[`city:${p.city}`] || 0) + 1;
    });

    const opts: { label: string; value: string; count: number }[] = [];
    if (counts['status:active']) opts.push({ label: 'Status: Active', value: 'status:active', count: counts['status:active'] });
    if (counts['status:inactive']) opts.push({ label: 'Status: Inactive', value: 'status:inactive', count: counts['status:inactive'] });
    return opts;
  }, [filtered]);

  const handleSelectPropertyByType = (typeKey: string) => {
    setSelectedPropertyTypeFilter(typeKey);
    if (!typeKey) {
      setSelectedPropertyIds([]);
      return;
    }
    const [kind, val] = typeKey.split(':');
    const matched = filtered.filter((p) => {
      if (kind === 'status') return (p.status || 'active') === val;
      if (kind === 'city') return p.city === val;
      return false;
    });
    setSelectedPropertyIds(matched.map((p) => p.id));
    toast.info(`Selected ${matched.length} properties matching ${typeKey.replace(':', ': ')}`);
  };

  const handleConfirmBulkDeleteProperties = async () => {
    if (selectedPropertyIds.length === 0) return;
    setIsBulkDeletingProperties(true);
    try {
      const ids = [...selectedPropertyIds];
      const count = ids.length;
      setProperties((prev) => prev.filter((p) => !ids.includes(p.id)));
      setSelectedPropertyIds([]);
      setSelectedPropertyTypeFilter('');
      setShowBulkDeletePropertiesModal(false);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'properties' } }));
      }
      await Promise.allSettled(ids.map((id) => api.properties.delete(id)));
      toast.success(`Deleted ${count} properties successfully!`);
    } catch (err: any) {
      toast.error('Failed to bulk delete properties');
    } finally {
      setIsBulkDeletingProperties(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div>
          <h1 className="font-head text-xl font-bold">{cmsTitle || 'Properties'}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {userAssignedProperties && userAssignedProperties.length > 0 && !userAssignedProperties.includes('all')
              ? `${filtered?.length} assigned ${filtered?.length === 1 ? 'property' : 'properties'} managed across portfolio`
              : cmsSubtitle && !/\b\d+\s+properties\b/i.test(cmsSubtitle)
                ? cmsSubtitle
                : `${filtered?.length} ${filtered?.length === 1 ? 'property' : 'properties'} managed across England & South East portfolio`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border"
            style={{ background: 'var(--surface2)' }}
          >
            <Search size={14} className="text-muted-foreground" />
            <input
              className="bg-transparent text-sm outline-none w-48"
              placeholder={cmsSearchPlaceholder || 'Search properties…'}
              value={search}
              onChange={(e) => setSearch(e?.target?.value)}
              style={{ color: 'var(--foreground)' }}
            />
          </div>

          <PageCMSEditButton pageId="properties" pageName="Properties & Sites" />

          {hasWriteAccess && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
              style={{ background: 'var(--primary)', color: '#000' }}
            >
              <Plus size={14} /> {(cmsPrimaryActionLabel || 'Add Property').replace(/^[\+\s]+/, '').trim()}
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

      {/* Dynamic CMS Filters Row */}
      {cmsDropdowns && cmsDropdowns.length > 0 && (
        <div
          className="flex items-center gap-2.5 px-6 py-2.5 border-b border-border flex-shrink-0 flex-wrap"
          style={{ background: 'var(--surface)' }}
        >
          {cmsDropdowns.map((drop) => (
            <CustomDropdown
              key={drop.id}
              label={drop.label}
              value={selectedFilters[drop.id] || []}
              options={drop.options.map((opt) => ({ value: opt, label: opt }))}
              onChange={(val) => setSelectedFilters((prev) => ({ ...prev, [drop.id]: val }))}
              multiple
            />
          ))}
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} properties</span>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 items-stretch">
          {paginatedProperties?.map((hotel) => {
            const assetCount =
              assets.filter(
                (a) => a.hotelId === hotel?.id || a.hotelName === hotel?.name || (a as any).propertyId === hotel?.id
              ).length || hotel?.totalAssets || 0;
            const overdueCount =
              maintenance.filter(
                (m) => (m.hotelId === hotel?.id || m.hotelName === hotel?.name || (m as any).propertyId === hotel?.id) && m.status === 'overdue'
              ).length || 0;
            const dueTodayCount =
              maintenance.filter(
                (m) => (m.hotelId === hotel?.id || m.hotelName === hotel?.name || (m as any).propertyId === hotel?.id) && m.status === 'due-today'
              ).length || 0;

            const isActive = hotel?.status === 'active';

            return (
              <div
                key={hotel?.id}
                className={`flex flex-col justify-between h-full rounded-xl border p-5 transition-all duration-150 hover:border-opacity-60 ${
                  selectedPropertyIds.includes(hotel?.id)
                    ? 'border-[#e8c97a] shadow-[0_0_15px_rgba(232,201,122,0.15)] bg-[#e8c97a]/5'
                    : 'border-border'
                }`}
                style={{ background: selectedPropertyIds.includes(hotel?.id) ? 'rgba(232,201,122,0.04)' : 'var(--surface)' }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2.5 mb-3.5">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className="pt-1 flex-shrink-0">
                      <TableCheckbox
                        checked={selectedPropertyIds.includes(hotel?.id)}
                        onChange={() => handleTogglePropertySelect(hotel?.id)}
                        title={`Select ${hotel?.name}`}
                      />
                    </div>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(232,201,122,0.12)' }}
                    >
                      <Building2 size={18} style={{ color: '#e8c97a' }} />
                    </div>
                    <div className="min-w-0 flex-1 pr-1">
                      <div
                        className="font-head font-bold text-sm leading-snug line-clamp-2 h-10 flex items-center"
                        title={hotel?.name}
                      >
                        <span className="line-clamp-2">{hotel?.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate h-4 flex items-center">
                        <span>{hotel?.city || 'United Kingdom'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
                    {/* Status Badge */}
                    {!canEdit || isViewer ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
                        style={{
                          background: isActive ? 'rgba(61,214,140,0.12)' : 'rgba(245,158,11,0.12)',
                          color: isActive ? '#3dd68c' : '#f59e0b',
                          border: `1px solid ${isActive ? 'rgba(61,214,140,0.3)' : 'rgba(245,158,11,0.3)'}`,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: isActive ? '#3dd68c' : '#f59e0b' }}
                        />
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    ) : (
                      <CustomDropdown
                        value={hotel?.status || 'active'}
                        onChange={(val) => handleStatusChange(hotel.id, val)}
                        options={[
                          { value: 'active', label: 'Active', color: '#3dd68c' },
                          { value: 'inactive', label: 'Inactive', color: '#f59e0b' }
                        ]}
                        variant="pill"
                        size="sm"
                      />
                    )}

                    {hasWriteAccess && (
                      <button
                        onClick={() => handleOpenEditProperty(hotel)}
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                        title="Edit Property Card"
                      >
                        <Edit2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4 pt-2.5 pb-1 border-t border-border/30">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground h-4">
                    <MapPin size={12} className="flex-shrink-0 text-muted-foreground/70" />
                    <span className="truncate" title={hotel?.address}>{hotel?.address || 'Address not registered'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground h-4">
                    <User size={12} className="flex-shrink-0 text-muted-foreground/70" />
                    <span className="truncate">{hotel?.manager || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground h-4">
                    <Phone size={12} className="flex-shrink-0 text-muted-foreground/70" />
                    <span className="truncate">{hotel?.phone || 'N/A'}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div
                    className="rounded-lg p-2.5 text-center transition-all hover:bg-white/[0.03]"
                    style={{ background: 'var(--surface2)' }}
                  >
                    <div className="font-head font-bold text-lg" style={{ color: '#e8c97a' }}>
                      {assetCount}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{cmsCustomLabels.assetsStatLabel || 'Assets'}</div>
                  </div>
                  <div
                    className="rounded-lg p-2.5 text-center transition-all hover:bg-white/[0.03]"
                    style={{ background: 'var(--surface2)' }}
                  >
                    <div
                      className="font-head font-bold text-lg"
                      style={{ color: overdueCount > 0 ? '#f43f5e' : '#3dd68c' }}
                    >
                      {overdueCount}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{cmsCustomLabels.overdueStatLabel || 'Overdue'}</div>
                  </div>
                  <div
                    className="rounded-lg p-2.5 text-center transition-all hover:bg-white/[0.03]"
                    style={{ background: 'var(--surface2)' }}
                  >
                    <div
                      className="font-head font-bold text-lg"
                      style={{ color: dueTodayCount > 0 ? '#f59e0b' : '#3dd68c' }}
                    >
                      {dueTodayCount}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{cmsCustomLabels.dueTodayStatLabel || 'Due Today'}</div>
                  </div>
                </div>

                {/* Action */}
                <div className="mt-auto">
                  <Link
                    href={`/asset-management/assets?hotel=${hotel?.id}`}
                    className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110 active:scale-[0.99]"
                    style={{ background: 'rgba(232,201,122,0.08)', color: '#e8c97a', border: '1px solid rgba(232,201,122,0.2)' }}
                  >
                    <span className="flex items-center gap-1.5">
                      <Package size={13} />
                      {cmsCustomLabels.viewRegisterLabel || 'View Asset Register'}
                    </span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
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
        recordName="properties"
        className="sticky bottom-0 z-20 flex-shrink-0"
      />

      {/* Floating Bulk Action Bar */}
      <div className="mt-2 px-6">
        <BulkActionBar
          selectedCount={selectedPropertyIds.length}
          totalCount={filtered.length}
          onClearSelection={handleClearPropertySelection}
          onSelectAll={handleSelectAllFilteredProperties}
          onDeleteSelected={() => setShowBulkDeletePropertiesModal(true)}
          typeOptions={propertyTypeOptions}
          onSelectByType={handleSelectPropertyByType}
          selectedTypeValue={selectedPropertyTypeFilter}
          typePlaceholder="Select all of type (Status)..."
          recordName="properties"
          isDeleting={isBulkDeletingProperties}
        />
      </div>

      {/* Add Property Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border p-6 shadow-2xl" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-amber-400" />
                <h2 className="font-head font-bold text-base">Add New Property</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Property Name *</label>
                <input
                  required
                  placeholder="e.g. Grand Palace Kensington"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">City</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Status</label>
                  <CustomDropdown
                    value={form.status}
                    onChange={(val) => setForm({ ...form, status: val as any })}
                    options={[
                      { value: 'active', label: 'Active', color: '#3dd68c' },
                      { value: 'inactive', label: 'Inactive', color: '#f59e0b' }
                    ]}
                    variant="form"
                    width="100%"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Address</label>
                <input
                  placeholder="Full street address, postcode"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">General Manager</label>
                  <input
                    placeholder="Manager name"
                    value={form.manager}
                    onChange={(e) => setForm({ ...form, manager: e.target.value })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Phone</label>
                  <input
                    placeholder="+44 20 ..."
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  {saving ? 'Saving...' : 'Save Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {showEditModal && editingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg rounded-2xl border border-border overflow-hidden shadow-2xl"
            style={{ background: '#161a22', borderColor: 'rgba(232, 201, 122, 0.3)' }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-border"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(232,201,122,0.15)', color: '#e8c97a' }}
                >
                  <Edit2 size={16} />
                </div>
                <div>
                  <h2 className="font-head font-bold text-sm text-foreground">Edit Property Card</h2>
                  <p className="text-[11px] text-muted-foreground">Modify property details, contacts, and counts</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg border border-border"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePropertyEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Property Name *</label>
                <input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none font-bold"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">City / Region</label>
                  <input
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Status</label>
                  <CustomDropdown
                    value={editForm.status}
                    onChange={(val) => setEditForm({ ...editForm, status: val as any })}
                    options={[
                      { value: 'active', label: 'Active', color: '#3dd68c' },
                      { value: 'inactive', label: 'Inactive', color: '#f59e0b' }
                    ]}
                    variant="form"
                    width="100%"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Full Address</label>
                <input
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">General Manager</label>
                  <input
                    value={editForm.manager}
                    onChange={(e) => setEditForm({ ...editForm, manager: e.target.value })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Phone Number</label>
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              {/* Statistics Counters */}
              <div className="pt-2 border-t border-border">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                  Card Statistic Counters
                </span>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-0.5">Assets Count</label>
                    <input
                      type="number"
                      value={editForm.totalAssets}
                      onChange={(e) => setEditForm({ ...editForm, totalAssets: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-border px-2.5 py-1.5 text-xs outline-none font-bold text-amber-400"
                      style={{ background: 'var(--surface2)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-0.5">Overdue Count</label>
                    <input
                      type="number"
                      value={editForm.overdueCount}
                      onChange={(e) => setEditForm({ ...editForm, overdueCount: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-border px-2.5 py-1.5 text-xs outline-none font-bold text-rose-400"
                      style={{ background: 'var(--surface2)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-0.5">Due Today Count</label>
                    <input
                      type="number"
                      value={editForm.dueTodayCount}
                      onChange={(e) => setEditForm({ ...editForm, dueTodayCount: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-border px-2.5 py-1.5 text-xs outline-none font-bold text-amber-400"
                      style={{ background: 'var(--surface2)' }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                {hasDeleteAccess && (
                  <button
                    type="button"
                    onClick={() => handleDeleteProperty(editingProperty.id, editingProperty.name)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Delete Property</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-white/[0.04]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
                    style={{ background: 'var(--primary)', color: '#121316' }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universal Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(propertyToDelete)}
        onClose={() => setPropertyToDelete(null)}
        onConfirm={confirmDeleteProperty}
        title="Confirm Deletion"
        itemIdentifier={propertyToDelete?.id}
        itemName={propertyToDelete?.name || 'Property'}
        registerName="properties portfolio"
        isDeleting={isDeletingProperty}
      />

      {/* Bulk Delete Properties Modal */}
      <ConfirmDeleteModal
        isOpen={showBulkDeletePropertiesModal}
        onClose={() => setShowBulkDeletePropertiesModal(false)}
        onConfirm={handleConfirmBulkDeleteProperties}
        title="Confirm Bulk Deletion"
        itemName={`${selectedPropertyIds.length} Selected Properties`}
        registerName="properties portfolio"
        customWarning={`Are you sure you want to permanently delete these ${selectedPropertyIds.length} selected properties? This action cannot be undone.`}
        confirmButtonText={`Delete ${selectedPropertyIds.length} Properties`}
        isDeleting={isBulkDeletingProperties}
      />
    </div>
  );
}
