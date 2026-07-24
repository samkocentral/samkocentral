'use client';

import React, { useState, useMemo } from 'react';
import { Wrench, AlertTriangle, Clock, CheckCircle2, Calendar, Search } from 'lucide-react';
import { MAINTENANCE_RECORDS, HOTELS, type MaintenanceRecord } from '@/lib/assetData';
import Icon from '@/components/ui/AppIcon';


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

function StatCard({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-border p-4 relative overflow-hidden" style={{ background: 'var(--surface)' }}>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <div className="font-head text-2xl font-extrabold" style={{ color }}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

export default function MaintenanceClient() {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [hotelFilter, setHotelFilter] = useState('');

  const counts = useMemo(() => ({
    all: MAINTENANCE_RECORDS.length,
    scheduled: MAINTENANCE_RECORDS.filter((m) => m.status === 'scheduled').length,
    'due-today': MAINTENANCE_RECORDS.filter((m) => m.status === 'due-today').length,
    overdue: MAINTENANCE_RECORDS.filter((m) => m.status === 'overdue').length,
    completed: MAINTENANCE_RECORDS.filter((m) => m.status === 'completed').length,
  }), []);

  const filtered = useMemo(() => {
    return MAINTENANCE_RECORDS.filter((m) => {
      const matchTab = activeTab === 'all' || m.status === activeTab;
      const matchSearch = !search || m.assetName.toLowerCase().includes(search.toLowerCase()) || m.type.toLowerCase().includes(search.toLowerCase()) || m.hotelName.toLowerCase().includes(search.toLowerCase());
      const matchHotel = !hotelFilter || m.hotelId === hotelFilter;
      return matchTab && matchSearch && matchHotel;
    });
  }, [activeTab, search, hotelFilter]);

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
      <div className="flex items-center justify-between px-7 py-4 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <div>
          <h1 className="font-head text-xl font-bold">Maintenance</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Preventive Maintenance Management</p>
        </div>
        <div className="flex items-center gap-3">
          {counts.overdue > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(244,63,94,0.12)', color: '#f43f5e' }}>
              <AlertTriangle size={13} />
              {counts.overdue} Overdue
            </span>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4 px-7 py-5 border-b border-border flex-shrink-0" style={{ background: 'var(--background)' }}>
        <StatCard label="Scheduled" value={counts.scheduled} color="#60a5fa" icon={Calendar} />
        <StatCard label="Due Today" value={counts['due-today']} color="#f59e0b" icon={Clock} />
        <StatCard label="Overdue" value={counts.overdue} color="#f43f5e" icon={AlertTriangle} />
        <StatCard label="Completed" value={counts.completed} color="#3dd68c" icon={CheckCircle2} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-7 pt-4 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
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
      <div className="flex items-center gap-3 px-7 py-3 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border flex-1 max-w-sm" style={{ background: 'var(--surface2)' }}>
          <Search size={14} className="text-muted-foreground" />
          <input
            className="bg-transparent text-sm outline-none flex-1"
            placeholder="Search asset, type, hotel…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ color: 'var(--foreground)' }}
          />
        </div>
        <select
          value={hotelFilter}
          onChange={(e) => setHotelFilter(e.target.value)}
          className="text-xs font-medium px-3 py-2 rounded-lg border border-border outline-none"
          style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
        >
          <option value="">All Hotels</option>
          {HOTELS.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10" style={{ background: 'var(--surface)' }}>
            <tr>
              {['Asset', 'Hotel', 'Type', 'Frequency', 'Scheduled Date', 'Assigned To', 'Status', 'Next Due'].map((h) => (
                <th key={h} className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16 text-muted-foreground text-sm">
                  No maintenance records found.
                </td>
              </tr>
            ) : (
              filtered.map((m) => {
                const s = STATUS_STYLES[m.status] || STATUS_STYLES.scheduled;
                return (
                  <tr
                    key={m.id}
                    className="border-b border-border"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{m.assetName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{m.assetId}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-36">
                      <div className="truncate">{m.hotelName}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{m.type}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize"
                        style={{ background: `${FREQ_STYLES[m.frequency] || '#6b7280'}18`, color: FREQ_STYLES[m.frequency] || '#6b7280' }}
                      >
                        {m.frequency}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(m.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-sm">{m.assignedTo}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: s.bg, color: s.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(m.nextDueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
