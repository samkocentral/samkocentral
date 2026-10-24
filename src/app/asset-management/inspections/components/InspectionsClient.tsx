'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ClipboardCheck, Clock, CheckCircle2, AlertTriangle, Search, ChevronDown, Calendar, User, ThumbsUp, ThumbsDown, Minus, Plus, Loader2, X } from 'lucide-react';
import { MAINTENANCE_RECORDS, ASSETS, HOTELS } from '@/lib/assetData';
import { api } from '@/lib/api';

type TabId = 'pending' | 'in-progress' | 'completed';

interface InspectionRecord {
  id: string;
  assetId: string;
  assetName: string;
  hotelId: string;
  hotelName: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'pending' | 'in-progress' | 'completed';
  type: string;
  assignedTo: string;
  result?: 'pass' | 'fail' | 'pending';
  notes?: string;
  category: string;
  riskLevel: string;
}

const RISK_COLORS: Record<string, string> = {
  low: '#3dd68c',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#f43f5e',
};

const RESULT_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  pass: { icon: ThumbsUp, color: '#3dd68c', bg: 'rgba(61,214,140,0.12)', label: 'Pass' },
  fail: { icon: ThumbsDown, color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', label: 'Fail' },
  pending: { icon: Minus, color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: 'Pending' },
};

function StatCard({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-border p-4 relative overflow-hidden" style={{ background: 'var(--surface)' }}>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${color}18` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div className="font-head text-2xl font-extrabold" style={{ color }}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

export default function InspectionsClient() {
  const [activeTab, setActiveTab] = useState<TabId>('pending');
  const [search, setSearch] = useState('');
  const [hotelFilter, setHotelFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>(MAINTENANCE_RECORDS);
  const [assets, setAssets] = useState<any[]>(ASSETS);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);

  const [newForm, setNewForm] = useState({
    assetId: '',
    assetName: '',
    hotelId: 'h-01',
    hotelName: 'Crowne Plaza Kingston-south',
    type: 'Fire Safety Inspection',
    scheduledDate: new Date().toISOString().slice(0, 10),
    assignedTo: 'Marcus Webb',
    frequency: 'monthly',
    notes: '',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [mRes, aRes, pRes] = await Promise.all([
        api.maintenance.getAll().catch(() => ({ success: false, data: [] })),
        api.assets.getAll().catch(() => ({ success: false, data: [] })),
        api.properties.getAll().catch(() => ({ success: false, data: [] })),
      ]);
      if (mRes.success && mRes.data && mRes.data.length > 0) {
        setMaintenanceRecords(mRes.data);
      }
      if (aRes.success && aRes.data && aRes.data.length > 0) {
        setAssets(aRes.data);
      }
      if (pRes.success && pRes.data && pRes.data.length > 0) {
        setProperties(pRes.data);
      }
    } catch (err) {
      console.warn('Inspections fallback data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleDataChanged = (e: any) => {
      if (e.detail?.type === 'maintenance' || e.detail?.type === 'assets' || e.detail?.type === 'properties') {
        fetchData();
      }
    };
    window.addEventListener('samko:data-changed', handleDataChanged);
    return () => window.removeEventListener('samko:data-changed', handleDataChanged);
  }, [fetchData]);

  // Transform maintenance records into inspection items
  const inspections: InspectionRecord[] = useMemo(() => {
    return maintenanceRecords.map((m) => {
      const asset = assets.find((a) => a.id === m.assetId);
      let status: 'pending' | 'in-progress' | 'completed' = 'pending';
      if (m.status === 'completed') status = 'completed';
      else if (m.status === 'due-today' || m.status === 'overdue' || m.status === 'in-progress') status = 'in-progress';
      return {
        id: m.id,
        assetId: m.assetId,
        assetName: m.assetName,
        hotelId: m.hotelId || 'h-01',
        hotelName: m.hotelName || 'Crowne Plaza Kingston-south',
        scheduledDate: m.scheduledDate,
        completedDate: m.completedDate,
        status,
        type: m.type,
        assignedTo: m.assignedTo,
        result: (m.result as 'pass' | 'fail' | 'pending') || (m.status === 'completed' ? 'pass' : 'pending'),
        notes: m.notes,
        category: asset?.category || 'General',
        riskLevel: asset?.riskLevel || 'low',
      };
    });
  }, [maintenanceRecords, assets]);

  const counts = useMemo(() => ({
    pending: inspections.filter((i) => i.status === 'pending').length,
    'in-progress': inspections.filter((i) => i.status === 'in-progress').length,
    completed: inspections.filter((i) => i.status === 'completed').length,
  }), [inspections]);

  const filtered = useMemo(() => {
    return inspections.filter((i) => {
      const matchTab = i.status === activeTab;
      const matchSearch =
        !search ||
        i.assetName.toLowerCase().includes(search.toLowerCase()) ||
        i.type.toLowerCase().includes(search.toLowerCase()) ||
        i.hotelName.toLowerCase().includes(search.toLowerCase()) ||
        i.assignedTo.toLowerCase().includes(search.toLowerCase());
      const matchHotel = !hotelFilter || i.hotelId === hotelFilter || i.hotelName.toLowerCase().includes(hotelFilter.toLowerCase());
      return matchTab && matchSearch && matchHotel;
    });
  }, [inspections, activeTab, search, hotelFilter]);

  const selected = selectedId ? inspections.find((i) => i.id === selectedId) : null;

  const handleResultChange = async (id: string, newResult: 'pass' | 'fail' | 'pending') => {
    setMaintenanceRecords((prev) =>
      prev.map((m) => (m.id === id ? { ...m, result: newResult, status: newResult === 'pass' ? 'completed' : m.status } : m))
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'maintenance', id, result: newResult },
        })
      );
    }
    try {
      await api.maintenance.update(id, {
        result: newResult,
        ...(newResult === 'pass' ? { status: 'completed', completedDate: new Date().toISOString().slice(0, 10) } : {}),
      });
    } catch (e) {
      console.warn('Inspection result updated locally:', e);
    }
  };

  const handleCompleteInspection = async (insp: InspectionRecord) => {
    const today = new Date().toISOString().slice(0, 10);
    setMaintenanceRecords((prev) =>
      prev.map((m) => (m.id === insp.id ? { ...m, status: 'completed', result: 'pass', completedDate: today } : m))
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'maintenance', id: insp.id, status: 'completed' },
        })
      );
    }
    try {
      await api.maintenance.update(insp.id, {
        status: 'completed',
        result: 'pass',
        completedDate: today,
      });
    } catch (e) {
      console.warn('Inspection completed locally:', e);
    }
  };

  const handleCreateInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempId = `m-${Date.now()}`;
    const payload = {
      ...newForm,
      id: tempId,
      status: 'scheduled',
      result: 'pending',
    };
    try {
      const res = await api.maintenance.create(payload);
      const created = res.data || payload;
      setMaintenanceRecords((prev) => [created, ...prev]);
      setShowNewModal(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', {
            detail: { type: 'maintenance', id: created.id },
          })
        );
      }
    } catch (err) {
      console.warn('Created inspection locally:', err);
      setMaintenanceRecords((prev) => [payload, ...prev]);
      setShowNewModal(false);
    }
  };

  const propertyOptions = properties.length > 0
    ? properties.map((p) => ({ id: p.id, name: p.name }))
    : HOTELS;

  const tabs: { id: TabId; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'pending', label: 'Pending', icon: Clock, color: '#60a5fa' },
    { id: 'in-progress', label: 'In Progress', icon: AlertTriangle, color: '#f59e0b' },
    { id: 'completed', label: 'Completed', icon: CheckCircle2, color: '#3dd68c' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-head text-xl font-bold">Inspections</h1>
            {loading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Asset inspection records and scheduling — {inspections.length} total inspections</p>
        </div>
        <button
          onClick={() => {
            if (assets.length > 0) {
              setNewForm((prev) => ({
                ...prev,
                assetId: assets[0].id,
                assetName: assets[0].name,
                hotelId: assets[0].hotelId,
                hotelName: assets[0].hotelName,
              }));
            }
            setShowNewModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95"
          style={{ background: 'var(--primary)', color: '#000' }}
        >
          <ClipboardCheck size={15} /> New Inspection
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <StatCard label="Pending Inspections" value={counts.pending} color="#60a5fa" icon={Clock} />
        <StatCard label="In Progress" value={counts['in-progress']} color="#f59e0b" icon={AlertTriangle} />
        <StatCard label="Completed" value={counts.completed} color="#3dd68c" icon={CheckCircle2} />
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 px-6 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors"
              style={{
                borderColor: activeTab === tab.id ? tab.color : 'transparent',
                color: activeTab === tab.id ? tab.color : 'var(--text2)',
                background: 'transparent',
              }}
            >
              <Icon size={14} />
              {tab.label}
              <span
                className="px-1.5 py-0.5 rounded text-xs font-bold"
                style={{
                  background: activeTab === tab.id ? `${tab.color}18` : 'var(--surface2)',
                  color: activeTab === tab.id ? tab.color : 'var(--text2)',
                }}
              >
                {counts[tab.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div
        className="flex items-center gap-3 px-6 py-2.5 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border flex-1 min-w-48"
          style={{ background: 'var(--surface2)' }}
        >
          <Search size={14} className="text-muted-foreground flex-shrink-0" />
          <input
            className="bg-transparent text-sm outline-none flex-1"
            placeholder="Search inspections…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ color: 'var(--foreground)' }}
          />
        </div>
        <div className="relative">
          <select
            value={hotelFilter}
            onChange={(e) => setHotelFilter(e.target.value)}
            className="appearance-none text-xs font-medium pl-3 pr-7 py-2 rounded-lg border border-border outline-none cursor-pointer"
            style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
          >
            <option value="">All Properties</option>
            {propertyOptions.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto flex">
        {/* List */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <ClipboardCheck size={32} className="mb-3 opacity-30" />
              <p className="text-sm">No inspections found</p>
            </div>
          ) : (
            <table className="w-full min-w-[780px]">
              <thead className="sticky top-0 z-10" style={{ background: 'var(--surface)' }}>
                <tr>
                  {['Asset', 'Property', 'Type', 'Category', 'Risk', 'Assigned To', 'Scheduled', 'Result', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-3.5 py-3 border-b border-border whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((insp) => (
                  <tr
                    key={insp.id}
                    onClick={() => setSelectedId(selectedId === insp.id ? null : insp.id)}
                    className="cursor-pointer transition-colors border-b border-border"
                    style={{
                      background: selectedId === insp.id ? 'rgba(232,201,122,0.06)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedId !== insp.id)
                        (e.currentTarget as HTMLElement).style.background = 'var(--surface2)';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedId !== insp.id)
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <td className="px-3.5 py-2.5">
                      <div className="font-medium text-sm">{insp.assetName}</div>
                      <div className="text-xs text-muted-foreground">{insp.assetId}</div>
                    </td>
                    <td className="px-3.5 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {insp.hotelName.split(' ').slice(0, 2).join(' ')}
                    </td>
                    <td className="px-3.5 py-2.5 text-xs" style={{ maxWidth: 180 }}>
                      <span className="truncate block">{insp.type}</span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'var(--surface3)', color: 'var(--text2)' }}
                      >
                        {insp.category}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span
                        className="text-xs font-semibold capitalize"
                        style={{ color: RISK_COLORS[insp.riskLevel] }}
                      >
                        {insp.riskLevel}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User size={11} />
                        {insp.assignedTo}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar size={11} />
                        {new Date(insp.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block">
                        <select
                          value={insp.result || 'pending'}
                          onChange={(e) => handleResultChange(insp.id, e.target.value as 'pass' | 'fail' | 'pending')}
                          className="appearance-none cursor-pointer pl-4 pr-6 py-1 rounded-full text-xs font-semibold outline-none transition-all capitalize"
                          style={{
                            background: RESULT_CONFIG[insp.result || 'pending'].bg,
                            color: RESULT_CONFIG[insp.result || 'pending'].color,
                            border: `1px solid ${RESULT_CONFIG[insp.result || 'pending'].color}33`,
                          }}
                        >
                          <option value="pass" style={{ background: '#18181b', color: '#3dd68c' }}>Pass</option>
                          <option value="fail" style={{ background: '#18181b', color: '#f43f5e' }}>Fail</option>
                          <option value="pending" style={{ background: '#18181b', color: '#94a3b8' }}>Pending</option>
                        </select>
                        <span
                          className="w-1.5 h-1.5 rounded-full absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ background: RESULT_CONFIG[insp.result || 'pending'].color }}
                        />
                        <ChevronDown
                          size={11}
                          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-80"
                          style={{ color: RESULT_CONFIG[insp.result || 'pending'].color }}
                        />
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <button
                        className="text-xs font-medium px-2.5 py-1 rounded-lg border border-border"
                        style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                        onClick={(e) => { e.stopPropagation(); setSelectedId(insp.id); }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div
            className="w-80 border-l border-border flex-shrink-0 overflow-auto"
            style={{ background: 'var(--surface)' }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="font-head font-bold text-sm">Inspection Detail</span>
                <button
                  onClick={() => setSelectedId(null)}
                  className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Asset</div>
                  <div className="font-semibold text-sm">{selected.assetName}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Property</div>
                  <div className="text-sm">{selected.hotelName}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Inspection Type</div>
                  <div className="text-sm">{selected.type}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Category</div>
                  <div className="text-sm">{selected.category}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Risk Level</div>
                  <span className="text-sm font-semibold capitalize" style={{ color: RISK_COLORS[selected.riskLevel] }}>
                    {selected.riskLevel}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Assigned To</div>
                  <div className="text-sm">{selected.assignedTo}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Scheduled Date</div>
                  <div className="text-sm">
                    {new Date(selected.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                {selected.completedDate && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Completed Date</div>
                    <div className="text-sm">
                      {new Date(selected.completedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Result</div>
                  <div className="relative inline-block">
                    <select
                      value={selected.result || 'pending'}
                      onChange={(e) => handleResultChange(selected.id, e.target.value as 'pass' | 'fail' | 'pending')}
                      className="appearance-none cursor-pointer pl-4 pr-6 py-1 rounded-full text-xs font-semibold outline-none transition-all capitalize"
                      style={{
                        background: RESULT_CONFIG[selected.result || 'pending'].bg,
                        color: RESULT_CONFIG[selected.result || 'pending'].color,
                        border: `1px solid ${RESULT_CONFIG[selected.result || 'pending'].color}33`,
                      }}
                    >
                      <option value="pass" style={{ background: '#18181b', color: '#3dd68c' }}>Pass</option>
                      <option value="fail" style={{ background: '#18181b', color: '#f43f5e' }}>Fail</option>
                      <option value="pending" style={{ background: '#18181b', color: '#94a3b8' }}>Pending</option>
                    </select>
                    <span
                      className="w-1.5 h-1.5 rounded-full absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ background: RESULT_CONFIG[selected.result || 'pending'].color }}
                    />
                    <ChevronDown
                      size={11}
                      className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-80"
                      style={{ color: RESULT_CONFIG[selected.result || 'pending'].color }}
                    />
                  </div>
                </div>
                {selected.notes && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Notes</div>
                    <div className="text-sm text-muted-foreground">{selected.notes}</div>
                  </div>
                )}

                <div className="pt-3 border-t border-border flex flex-col gap-2">
                  {selected.status !== 'completed' && (
                    <button
                      onClick={() => handleCompleteInspection(selected)}
                      className="w-full py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95"
                      style={{ background: 'var(--primary)', color: '#000' }}
                    >
                      Complete Inspection
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
                      api.maintenance.update(selected.id, { scheduledDate: nextWeek });
                      setMaintenanceRecords((prev) =>
                        prev.map((m) => (m.id === selected.id ? { ...m, scheduledDate: nextWeek } : m))
                      );
                    }}
                    className="w-full py-2 rounded-lg text-sm font-medium border border-border"
                    style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                  >
                    Reschedule (+7 Days)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Inspection Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowNewModal(false)}>
          <div className="rounded-2xl border border-border w-full max-w-lg overflow-hidden" style={{ background: 'var(--surface)' }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreateInspection}>
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="font-head font-bold text-base">Schedule New Inspection</h3>
                <button type="button" onClick={() => setShowNewModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={16} />
                </button>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Asset *</label>
                  <select
                    value={newForm.assetId}
                    onChange={(e) => {
                      const asset = assets.find((a) => a.id === e.target.value);
                      if (asset) {
                        setNewForm({
                          ...newForm,
                          assetId: asset.id,
                          assetName: asset.name,
                          hotelId: asset.hotelId,
                          hotelName: asset.hotelName,
                        });
                      }
                    }}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.assetId || a.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Inspection Type *</label>
                  <input
                    type="text"
                    required
                    value={newForm.type}
                    onChange={(e) => setNewForm({ ...newForm, type: e.target.value })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Scheduled Date *</label>
                    <input
                      type="date"
                      required
                      value={newForm.scheduledDate}
                      onChange={(e) => setNewForm({ ...newForm, scheduledDate: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
                      style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Assigned Inspector *</label>
                    <input
                      type="text"
                      required
                      value={newForm.assignedTo}
                      onChange={(e) => setNewForm({ ...newForm, assignedTo: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
                      style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Frequency</label>
                  <select
                    value={newForm.frequency}
                    onChange={(e) => setNewForm({ ...newForm, frequency: e.target.value })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="6-monthly">6-Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={newForm.notes}
                    onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none resize-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-border"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  Schedule Inspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
