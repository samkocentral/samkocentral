'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Wrench, AlertTriangle, Clock, CheckCircle2, Calendar, Search, ChevronDown, Loader2, Plus, X, Building2, Edit2, Trash2 } from 'lucide-react';
import { MAINTENANCE_RECORDS, HOTELS, ASSETS, type MaintenanceRecord, type Hotel } from '@/lib/assetData';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';
import CustomDropdown from '@/components/ui/CustomDropdown';
import StatusDropdown from '@/components/ui/StatusDropdown';
import { useDeepPageCms } from '@/lib/deepPageCms';
import PageCMSEditButton from '@/components/cms/PageCMSEditButton';

type TabId = 'all' | 'scheduled' | 'due-today' | 'overdue' | 'completed';

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  overdue: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e', label: 'Overdue' },
  'due-today': { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Due Today' },
  scheduled: { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa', label: 'Scheduled' },
  completed: { bg: 'rgba(61,214,140,0.12)', color: '#3dd68c', label: 'Completed' },
  'in-progress': { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa', label: 'In Progress' },
};

const FREQ_STYLES: Record<string, string> = {
  monthly: '#f43f5e',
  quarterly: '#f59e0b',
  '6-monthly': '#60a5fa',
  yearly: '#3dd68c',
  custom: '#a78bfa',
};

function StatCard({ label, value, color, icon: IconComponent }: { label: string; value: number; color: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-border p-4 relative overflow-hidden" style={{ background: 'var(--surface)' }}>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <IconComponent size={15} style={{ color }} />
        </div>
      </div>
      <div className="font-head text-2xl font-extrabold" style={{ color }}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

export default function MaintenanceClient() {
  const { isViewer, canEdit } = useAuth();
  const {
    title: cmsTitle,
    subtitle: cmsSubtitle,
    searchPlaceholder: cmsSearchPlaceholder,
    primaryActionLabel: cmsPrimaryActionLabel,
  } = useDeepPageCms('maintenance');

  const [records, setRecords] = useState<MaintenanceRecord[]>(MAINTENANCE_RECORDS);
  const [properties, setProperties] = useState<Hotel[]>(HOTELS);
  const [liveAssets, setLiveAssets] = useState<any[]>(ASSETS);
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [propertyFilter, setPropertyFilter] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingNew, setSavingNew] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<MaintenanceRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState(false);

  const [addForm, setAddForm] = useState({
    assetId: ASSETS[0]?.id || 'AST-001',
    assetName: ASSETS[0]?.name || 'Daikin AC Unit',
    hotelId: ASSETS[0]?.hotelId || 'h-01',
    hotelName: HOTELS[0]?.name || 'Crowne Plaza Kingston-south',
    type: 'Preventive Maintenance Inspection',
    frequency: 'quarterly' as MaintenanceRecord['frequency'],
    scheduledDate: new Date().toISOString().slice(0, 10),
    nextDueDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
    assignedTo: 'Marcus Webb',
    status: 'scheduled' as MaintenanceRecord['status'],
    notes: '',
  });

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const [mRes, pRes, aRes] = await Promise.allSettled([
        api.maintenance.getAll(),
        api.properties.getAll(),
        api.assets.getAll(),
      ]);

      if (mRes.status === 'fulfilled' && mRes.value.success && mRes.value.data && mRes.value.data.length > 0) {
        setRecords(mRes.value.data);
      }
      if (pRes.status === 'fulfilled' && pRes.value.success && pRes.value.data && pRes.value.data.length > 0) {
        setProperties(pRes.value.data);
      }
      if (aRes.status === 'fulfilled' && aRes.value.success && aRes.value.data && aRes.value.data.length > 0) {
        setLiveAssets(aRes.value.data);
      }
    } catch (err) {
      console.warn('Using local fallback maintenance data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
    const handleDataChanged = () => {
      fetchRecords();
    };
    window.addEventListener('samko:data-changed', handleDataChanged);
    return () => window.removeEventListener('samko:data-changed', handleDataChanged);
  }, [fetchRecords]);

  const counts = useMemo(() => ({
    all: records.length,
    scheduled: records.filter((m) => m.status === 'scheduled').length,
    'due-today': records.filter((m) => m.status === 'due-today').length,
    overdue: records.filter((m) => m.status === 'overdue').length,
    completed: records.filter((m) => m.status === 'completed').length,
  }), [records]);

  const filtered = useMemo(() => {
    return records.filter((m) => {
      const matchTab = activeTab === 'all' || m.status === activeTab;
      const hotelOrProp = (m.hotelName || (m as any).propertyName || '').toLowerCase();
      const matchSearch =
        !search ||
        m.assetName.toLowerCase().includes(search.toLowerCase()) ||
        m.type.toLowerCase().includes(search.toLowerCase()) ||
        hotelOrProp.includes(search.toLowerCase());
      const matchHotel =
        propertyFilter.length === 0 ||
        propertyFilter.includes(m.hotelId) ||
        propertyFilter.includes((m as any).propertyId);
      return matchTab && matchSearch && matchHotel;
    });
  }, [records, activeTab, search, propertyFilter]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    const completedDate = newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined;

    // Optimistically update
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            status: newStatus as any,
            ...(completedDate ? { completedDate } : {}),
          };
        }
        return r;
      })
    );

    // Notify listeners across app (Sidebar badges, Properties stats)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'maintenance', id, status: newStatus },
        })
      );
    }

    const statusLabel = newStatus.replace('-', ' ').toUpperCase();
    toast.success('Maintenance Status Updated', {
      description: `Task marked as ${statusLabel}`,
    });

    try {
      await api.maintenance.update(id, {
        status: newStatus,
        ...(completedDate ? { completedDate } : {}),
      });
    } catch (err: any) {
      console.error('Failed to sync status to server:', err);
      toast.error('Failed to update maintenance status', { description: err?.message || 'Server error' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSelectAsset = (assetId: string) => {
    const asset = liveAssets.find((a) => (a.id || a.assetId) === assetId);
    if (asset) {
      setAddForm((prev) => ({
        ...prev,
        assetId: asset.id || asset.assetId,
        assetName: asset.name,
        hotelId: asset.hotelId || 'h-01',
        hotelName: asset.hotelName || asset.property || 'Crowne Plaza Kingston-south',
      }));
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNew(true);
    const newId = `maint-${Date.now()}`;
    const newRecord: MaintenanceRecord = {
      ...addForm,
      id: newId,
    };

    setRecords((prev) => [newRecord, ...prev]);
    setShowAddModal(false);

    toast.success('Maintenance logged & scheduled', {
      description: `${newRecord.type} for ${newRecord.assetName}`,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'maintenance', id: newId },
        })
      );
    }

    try {
      await api.maintenance.create(newRecord);
    } catch (err: any) {
      console.warn('Failed to persist maintenance to Firestore:', err);
    } finally {
      setSavingNew(false);
    }
  };

  const handleOpenEdit = (m: MaintenanceRecord) => {
    setEditingRecord({ ...m });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setSavingEdit(true);
    try {
      const updated = { ...editingRecord };
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setShowEditModal(false);
      toast.success('Maintenance record updated', { description: `${updated.type} for ${updated.assetName}` });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'maintenance', id: updated.id } }));
      }
      await api.maintenance.update(updated.id, updated);
    } catch (err: any) {
      toast.error('Failed to update maintenance record');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    const id = recordToDelete.id;
    setDeletingRecord(true);
    try {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      toast.success('Maintenance record deleted', { description: `${recordToDelete.type} removed` });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'maintenance', id } }));
      }
      await api.maintenance.delete(id);
    } catch (err: any) {
      toast.error('Failed to delete maintenance record');
    } finally {
      setDeletingRecord(false);
      setRecordToDelete(null);
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'all', label: 'All', icon: Wrench, color: '#60a5fa' },
    { id: 'scheduled', label: 'Scheduled', icon: Calendar, color: '#60a5fa' },
    { id: 'due-today', label: 'Due Today', icon: Clock, color: '#f59e0b' },
    { id: 'overdue', label: 'Overdue', icon: AlertTriangle, color: '#f43f5e' },
    { id: 'completed', label: 'Completed', icon: CheckCircle2, color: '#3dd68c' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-head text-xl font-bold">{cmsTitle || 'Maintenance'}</h1>
            {loading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{cmsSubtitle || 'Preventive Maintenance Management'}</p>
        </div>
        <div className="flex items-center gap-3">
          {counts.overdue > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(244,63,94,0.12)', color: '#f43f5e' }}>
              <AlertTriangle size={13} />
              {counts.overdue} Overdue
            </span>
          )}

          <PageCMSEditButton pageId="maintenance" pageName="Planned Maintenance (PPM)" />

          {canEdit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-transform active:scale-95"
              style={{ background: 'var(--primary)', color: '#000' }}
            >
              <Plus size={14} /> {cmsPrimaryActionLabel || 'Schedule Maintenance'}
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

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-border flex-shrink-0" style={{ background: 'var(--background)' }}>
        <StatCard label="Scheduled" value={counts.scheduled} color="#60a5fa" icon={Calendar} />
        <StatCard label="Due Today" value={counts['due-today']} color="#f59e0b" icon={Clock} />
        <StatCard label="Overdue" value={counts.overdue} color="#f43f5e" icon={AlertTriangle} />
        <StatCard label="Completed" value={counts.completed} color="#3dd68c" icon={CheckCircle2} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-6 pt-3 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors"
            style={{
              borderColor: activeTab === tab.id ? tab.color : 'transparent',
              color: activeTab === tab.id ? tab.color : 'var(--text2)',
              background: 'transparent',
            }}
          >
            <tab.icon size={14} />
            {tab.label}
            <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
              {counts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-2.5 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border flex-1 max-w-sm" style={{ background: 'var(--surface2)' }}>
          <Search size={14} className="text-muted-foreground" />
          <input
            className="bg-transparent text-sm outline-none flex-1"
            placeholder="Search asset, type, property…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ color: 'var(--foreground)' }}
          />
        </div>
        <CustomDropdown
          label="All Properties"
          value={propertyFilter}
          options={properties.map((h) => ({ value: h.id, label: h.name }))}
          onChange={setPropertyFilter}
          multiple
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full min-w-[880px]">
          <thead className="sticky top-0 z-10" style={{ background: 'var(--surface)' }}>
            <tr>
              {['Asset', 'Property', 'Type', 'Frequency', 'Scheduled Date', 'Assigned To', 'Status', 'Next Due', ''].map((h, i) => (
                <th key={i} className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-3.5 py-3 border-b border-border whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-16 text-muted-foreground text-sm">
                  No maintenance records found.
                </td>
              </tr>
            ) : (
              filtered.map((m) => {
                const s = STATUS_STYLES[m.status] || STATUS_STYLES.scheduled;
                const propDisplayName = m.hotelName || (m as any).propertyName || 'Property';
                const isItemUpdating = updatingId === m.id;

                return (
                  <tr
                    key={m.id}
                    className="border-b border-border transition-colors"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <td className="px-3.5 py-2.5">
                      <div className="text-sm font-medium">{m.assetName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{m.assetId}</div>
                    </td>
                    <td className="px-3.5 py-2.5 text-xs text-muted-foreground max-w-36">
                      <div className="truncate" title={propDisplayName}>{propDisplayName}</div>
                    </td>
                    <td className="px-3.5 py-2.5 text-sm">{m.type}</td>
                    <td className="px-3.5 py-2.5">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize"
                        style={{ background: `${FREQ_STYLES[m.frequency] || '#6b7280'}18`, color: FREQ_STYLES[m.frequency] || '#6b7280' }}
                      >
                        {m.frequency}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(m.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-3.5 py-2.5 text-sm">{m.assignedTo}</td>
                    <td className="px-3.5 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <StatusDropdown
                        value={m.status}
                        disabled={isItemUpdating || isViewer || !canEdit}
                        options={[
                          { value: 'scheduled', label: 'Scheduled', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
                          { value: 'due-today', label: 'Due Today', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
                          { value: 'overdue', label: 'Overdue', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
                          { value: 'in-progress', label: 'In Progress', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
                          { value: 'completed', label: 'Completed', color: '#3dd68c', bg: 'rgba(61,214,140,0.12)' },
                        ]}
                        onChange={(val) => handleStatusChange(m.id, val)}
                      />
                    </td>
                    <td className="px-3.5 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(m.nextDueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-3.5 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="p-1.5 rounded-lg border border-border hover:bg-surface2 text-muted-foreground hover:text-primary transition-colors"
                          title="Edit Maintenance Record"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => setRecordToDelete(m)}
                          className="p-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/15 text-rose-400 transition-colors"
                          title="Delete Maintenance Record"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Schedule Maintenance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-xl rounded-2xl border border-border overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border" style={{ background: 'var(--surface2)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}>
                  <Wrench size={16} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base text-foreground">Schedule Maintenance Record</h3>
                  <p className="text-xs text-muted-foreground">Create a PPM or reactive service task for any asset</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Asset Selection */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Select Asset *
                </label>
                <select
                  value={addForm.assetId}
                  onChange={(e) => handleSelectAsset(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-xs outline-none cursor-pointer"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  required
                >
                  {liveAssets.map((a) => (
                    <option key={a.id || a.assetId} value={a.id || a.assetId}>
                      {a.assetId || a.id} — {a.name} ({a.hotelName || a.property || 'Property'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Maintenance Type & Property */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Maintenance Type / Title *
                  </label>
                  <input
                    type="text"
                    value={addForm.type}
                    onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                    placeholder="e.g. Quarterly Filter PPM"
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Property
                  </label>
                  <select
                    value={addForm.hotelName}
                    onChange={(e) => {
                      const p = properties.find((pr) => pr.name === e.target.value);
                      setAddForm({ ...addForm, hotelName: e.target.value, hotelId: p ? p.id : 'h-01' });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Frequency & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Frequency
                  </label>
                  <select
                    value={addForm.frequency}
                    onChange={(e) => setAddForm({ ...addForm, frequency: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="6-monthly">6-Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom / Ad-hoc</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Initial Status
                  </label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm({ ...addForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="due-today">Due Today</option>
                    <option value="in-progress">In Progress</option>
                    <option value="overdue">Overdue</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={addForm.scheduledDate}
                    onChange={(e) => setAddForm({ ...addForm, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Next Due Date
                  </label>
                  <input
                    type="date"
                    value={addForm.nextDueDate}
                    onChange={(e) => setAddForm({ ...addForm, nextDueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                    required
                  />
                </div>
              </div>

              {/* Assigned To & Notes */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Assigned Engineer / Contractor
                </label>
                <input
                  type="text"
                  value={addForm.assignedTo}
                  onChange={(e) => setAddForm({ ...addForm, assignedTo: e.target.value })}
                  placeholder="e.g. Marcus Webb, Chubb Fire, Otis UK"
                  className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Work Notes / Scope of Service
                </label>
                <textarea
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Details of inspection, parts required, or vendor references…"
                  className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
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
                  disabled={savingNew}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  {savingNew ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} /> Save & Schedule
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Maintenance Modal */}
      {showEditModal && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-xl rounded-2xl border border-border overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border" style={{ background: 'var(--surface2)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}>
                  <Edit2 size={16} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base text-foreground">Edit Maintenance Record</h3>
                  <p className="text-xs text-muted-foreground">{editingRecord.assetName} · Update record dynamically</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Maintenance Task / Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingRecord.type}
                    onChange={(e) => setEditingRecord({ ...editingRecord, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Frequency
                  </label>
                  <select
                    value={editingRecord.frequency}
                    onChange={(e) => setEditingRecord({ ...editingRecord, frequency: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="6-monthly">6-Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Status
                  </label>
                  <select
                    value={editingRecord.status}
                    onChange={(e) => setEditingRecord({ ...editingRecord, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="due-today">Due Today</option>
                    <option value="overdue">Overdue</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editingRecord.scheduledDate}
                    onChange={(e) => setEditingRecord({ ...editingRecord, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Next Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editingRecord.nextDueDate}
                    onChange={(e) => setEditingRecord({ ...editingRecord, nextDueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Assigned Engineer / Contractor
                  </label>
                  <input
                    type="text"
                    required
                    value={editingRecord.assignedTo}
                    onChange={(e) => setEditingRecord({ ...editingRecord, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Work Notes / Scope of Service
                </label>
                <textarea
                  value={editingRecord.notes || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  {savingEdit ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/20 text-rose-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-head font-bold text-base text-foreground">Confirm Deletion</h3>
                <p className="text-xs text-muted-foreground">{recordToDelete.assetName}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground mb-5">
              Are you sure you want to permanently delete the <strong className="text-foreground">{recordToDelete.type}</strong> maintenance task for <strong className="text-foreground">{recordToDelete.assetName}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-surface2 transition-colors"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingRecord}
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                {deletingRecord ? (
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
