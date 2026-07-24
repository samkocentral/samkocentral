'use client';

import React, { useState, useMemo } from 'react';
import { ClipboardCheck, Clock, CheckCircle2, AlertTriangle, Search, ChevronDown, Calendar, User, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { MAINTENANCE_RECORDS, ASSETS, HOTELS } from '@/lib/assetData';
import Icon from '@/components/ui/AppIcon';


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

// Build inspection records from maintenance + assets
function buildInspections(): InspectionRecord[] {
  return MAINTENANCE_RECORDS.map((m) => {
    const asset = ASSETS.find((a) => a.id === m.assetId);
    let status: 'pending' | 'in-progress' | 'completed' = 'pending';
    if (m.status === 'completed') status = 'completed';
    else if (m.status === 'due-today' || m.status === 'overdue') status = 'in-progress';
    return {
      id: m.id,
      assetId: m.assetId,
      assetName: m.assetName,
      hotelId: m.hotelId,
      hotelName: m.hotelName,
      scheduledDate: m.scheduledDate,
      completedDate: m.completedDate,
      status,
      type: m.type,
      assignedTo: m.assignedTo,
      result: m.result as 'pass' | 'fail' | 'pending' | undefined,
      notes: m.notes,
      category: asset?.category || 'Other',
      riskLevel: asset?.riskLevel || 'low',
    };
  });
}

const INSPECTIONS = buildInspections();

const RISK_COLORS: Record<string, string> = {
  low: '#3dd68c',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#f43f5e',
};

const RESULT_CONFIG = {
  pass: { icon: ThumbsUp, color: '#3dd68c', bg: 'rgba(61,214,140,0.12)', label: 'Pass' },
  fail: { icon: ThumbsDown, color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', label: 'Fail' },
  pending: { icon: Minus, color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: 'Pending' },
};

function ResultBadge({ result }: { result?: 'pass' | 'fail' | 'pending' }) {
  const cfg = RESULT_CONFIG[result || 'pending'];
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

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

  const counts = useMemo(() => ({
    pending: INSPECTIONS.filter((i) => i.status === 'pending').length,
    'in-progress': INSPECTIONS.filter((i) => i.status === 'in-progress').length,
    completed: INSPECTIONS.filter((i) => i.status === 'completed').length,
  }), []);

  const filtered = useMemo(() => {
    return INSPECTIONS.filter((i) => {
      const matchTab = i.status === activeTab;
      const matchSearch =
        !search ||
        i.assetName.toLowerCase().includes(search.toLowerCase()) ||
        i.type.toLowerCase().includes(search.toLowerCase()) ||
        i.hotelName.toLowerCase().includes(search.toLowerCase()) ||
        i.assignedTo.toLowerCase().includes(search.toLowerCase());
      const matchHotel = !hotelFilter || i.hotelId === hotelFilter;
      return matchTab && matchSearch && matchHotel;
    });
  }, [activeTab, search, hotelFilter]);

  const selected = selectedId ? INSPECTIONS.find((i) => i.id === selectedId) : null;

  const tabs: { id: TabId; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'pending', label: 'Pending', icon: Clock, color: '#60a5fa' },
    { id: 'in-progress', label: 'In Progress', icon: AlertTriangle, color: '#f59e0b' },
    { id: 'completed', label: 'Completed', icon: CheckCircle2, color: '#3dd68c' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-7 py-4 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div>
          <h1 className="font-head text-xl font-bold">Inspections</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Asset inspection records and scheduling</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--primary)', color: '#000' }}
        >
          <ClipboardCheck size={15} /> New Inspection
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4 px-7 py-4 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <StatCard label="Pending Inspections" value={counts.pending} color="#60a5fa" icon={Clock} />
        <StatCard label="In Progress" value={counts['in-progress']} color="#f59e0b" icon={AlertTriangle} />
        <StatCard label="Completed" value={counts.completed} color="#3dd68c" icon={CheckCircle2} />
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 px-7 border-b border-border flex-shrink-0"
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
        className="flex items-center gap-3 px-7 py-3 border-b border-border flex-shrink-0"
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
            <option value="">All Hotels</option>
            {HOTELS.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto flex">
        {/* List */}
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <ClipboardCheck size={32} className="mb-3 opacity-30" />
              <p className="text-sm">No inspections found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 z-10" style={{ background: 'var(--surface)' }}>
                <tr>
                  {['Asset', 'Hotel', 'Type', 'Category', 'Risk', 'Assigned To', 'Scheduled', 'Result', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border whitespace-nowrap"
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
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{insp.assetName}</div>
                      <div className="text-xs text-muted-foreground">{insp.assetId}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {insp.hotelName.split(' ').slice(0, 2).join(' ')}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ maxWidth: 180 }}>
                      <span className="truncate block">{insp.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'var(--surface3)', color: 'var(--text2)' }}
                      >
                        {insp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-semibold capitalize"
                        style={{ color: RISK_COLORS[insp.riskLevel] }}
                      >
                        {insp.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User size={11} />
                        {insp.assignedTo}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar size={11} />
                        {new Date(insp.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ResultBadge result={insp.result} />
                    </td>
                    <td className="px-4 py-3">
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
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ color: 'var(--text2)' }}
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
                  <div className="text-xs text-muted-foreground mb-0.5">Hotel</div>
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
                  <ResultBadge result={selected.result} />
                </div>
                {selected.notes && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Notes</div>
                    <div className="text-sm text-muted-foreground">{selected.notes}</div>
                  </div>
                )}

                <div className="pt-3 border-t border-border flex flex-col gap-2">
                  <button
                    className="w-full py-2 rounded-lg text-sm font-semibold"
                    style={{ background: 'var(--primary)', color: '#000' }}
                  >
                    {selected.status === 'completed' ? 'View Full Report' : 'Complete Inspection'}
                  </button>
                  <button
                    className="w-full py-2 rounded-lg text-sm font-medium border border-border"
                    style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
