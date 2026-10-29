'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Building2, MapPin, Phone, User, Package, ChevronRight, ChevronDown, Search, Plus, X, Loader2, Edit2, Trash2, Sparkles } from 'lucide-react';
import { HOTELS, MAINTENANCE_RECORDS, ASSETS, getAssetStats, type Hotel } from '@/lib/assetData';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { toast } from 'sonner';
import { useDeepPageCms, updatePageItem, deletePageItem } from '@/lib/deepPageCms';
import PageCMSEditButton from '@/components/cms/PageCMSEditButton';
import CustomDropdown from '@/components/ui/CustomDropdown';
import LoadingPagination from '@/components/ui/LoadingPagination';
import { useLoadingPagination } from '@/hooks/useLoadingPagination';

export default function PropertiesClient() {
  const { isViewer, canEdit } = useAuth();
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
  const [properties, setProperties] = useState<Hotel[]>(HOTELS);
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
    setProperties((prev) =>
      prev.map((p) => (p.id === propertyId ? { ...p, ...editForm } : p))
    );

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

  const handleDeleteProperty = async (propertyId: string, propertyName: string) => {
    if (!confirm(`Are you sure you want to delete property "${propertyName}"?`)) return;

    deletePageItem('properties', propertyId);
    setProperties((prev) => prev.filter((p) => p.id !== propertyId));

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
        setProperties((prev) => [res.data, ...prev]);
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

  const effectiveProperties = cmsPropertiesList && cmsPropertiesList.length > 0 ? (cmsPropertiesList as any[]) : properties;

  const filtered = effectiveProperties?.filter((h) => {
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
  } = useLoadingPagination(filtered || [], 4);

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div>
          <h1 className="font-head text-xl font-bold">{cmsTitle || 'Properties'}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cmsSubtitle || `${properties?.length} properties managed ${loading ? ' (syncing...)' : ''}`}
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

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
            style={{ background: 'var(--primary)', color: '#000' }}
          >
            <Plus size={14} /> {(cmsPrimaryActionLabel || 'Add Property').replace(/^[\+\s]+/, '').trim()}
          </button>
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
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
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
                className="rounded-xl border border-border p-5 transition-all duration-150 hover:border-opacity-60"
                style={{ background: 'var(--surface)' }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(232,201,122,0.12)' }}
                    >
                      <Building2 size={18} style={{ color: '#e8c97a' }} />
                    </div>
                    <div>
                      <div className="font-head font-bold text-sm leading-tight">{hotel?.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{hotel?.city}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* Status Badge */}
                    {!canEdit || isViewer ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
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
                      <div className="relative inline-block">
                        <select
                          value={hotel?.status || 'active'}
                          onChange={(e) => handleStatusChange(hotel.id, e.target.value)}
                          className="appearance-none cursor-pointer pl-4 pr-2.5 py-0.5 rounded-full text-xs font-semibold outline-none transition-all"
                          title="Click to change status"
                          style={{
                            background: isActive ? 'rgba(61,214,140,0.12)' : 'rgba(245,158,11,0.12)',
                            color: isActive ? '#3dd68c' : '#f59e0b',
                            border: `1px solid ${isActive ? 'rgba(61,214,140,0.3)' : 'rgba(245,158,11,0.3)'}`,
                          }}
                        >
                          <option value="active" style={{ background: '#18181b', color: '#3dd68c' }}>Active</option>
                          <option value="inactive" style={{ background: '#18181b', color: '#f59e0b' }}>Inactive</option>
                        </select>
                        <span
                          className="w-1.5 h-1.5 rounded-full absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ background: isActive ? '#3dd68c' : '#f59e0b' }}
                        />
                      </div>
                    )}

                    {canEdit && (
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
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin size={12} />
                    <span className="truncate">{hotel?.address || 'Address not registered'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User size={12} />
                    <span>{hotel?.manager || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone size={12} />
                    <span>{hotel?.phone || 'N/A'}</span>
                  </div>
                </div>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div
                    className="rounded-lg p-2.5 text-center"
                    style={{ background: 'var(--surface2)' }}
                  >
                    <div className="font-head font-bold text-lg" style={{ color: '#e8c97a' }}>
                      {assetCount}
                    </div>
                    <div className="text-xs text-muted-foreground">{cmsCustomLabels.assetsStatLabel || 'Assets'}</div>
                  </div>
                  <div
                    className="rounded-lg p-2.5 text-center"
                    style={{ background: 'var(--surface2)' }}
                  >
                    <div
                      className="font-head font-bold text-lg"
                      style={{ color: overdueCount > 0 ? '#f43f5e' : '#3dd68c' }}
                    >
                      {overdueCount}
                    </div>
                    <div className="text-xs text-muted-foreground">{cmsCustomLabels.overdueStatLabel || 'Overdue'}</div>
                  </div>
                  <div
                    className="rounded-lg p-2.5 text-center"
                    style={{ background: 'var(--surface2)' }}
                  >
                    <div
                      className="font-head font-bold text-lg"
                      style={{ color: dueTodayCount > 0 ? '#f59e0b' : '#3dd68c' }}
                    >
                      {dueTodayCount}
                    </div>
                    <div className="text-xs text-muted-foreground">{cmsCustomLabels.dueTodayStatLabel || 'Due Today'}</div>
                  </div>
                </div>
                {/* Action */}
                <Link
                  href={`/asset-management/assets?hotel=${hotel?.id}`}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background: 'rgba(232,201,122,0.08)', color: '#e8c97a', border: '1px solid rgba(232,201,122,0.2)' }}
                >
                  <span className="flex items-center gap-1.5">
                    <Package size={13} />
                    {cmsCustomLabels.viewRegisterLabel || 'View Asset Register'}
                  </span>
                  <ChevronRight size={13} />
                </Link>
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
        pageSizeOptions={[6, 9, 12, 18]}
        onPageChange={changePage}
        onPageSizeChange={changePageSize}
        isLoading={loading || isPageLoading}
        recordName="properties"
      />

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
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
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
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
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
                <button
                  type="button"
                  onClick={() => handleDeleteProperty(editingProperty.id, editingProperty.name)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Delete Property</span>
                </button>

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
    </div>
  );
}
