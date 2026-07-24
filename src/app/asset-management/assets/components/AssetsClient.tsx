'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ChevronDown, X, ExternalLink } from 'lucide-react';
import { ASSETS, HOTELS, ASSET_CATEGORIES, DEPARTMENTS, type Asset } from '@/lib/assetData';

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
  label, value, options, onChange,
}: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none text-xs font-medium pl-3 pr-7 py-2 rounded-lg border border-border outline-none cursor-pointer"
        style={{ background: 'var(--surface2)', color: value ? 'var(--foreground)' : 'var(--text2)' }}
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  );
}

export default function AssetsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialHotel = searchParams.get('hotel') || '';

  const [search, setSearch] = useState('');
  const [hotelFilter, setHotelFilter] = useState(initialHotel);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fixedFilter, setFixedFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'fixed' | 'non-fixed'>('all');

  const filtered = useMemo(() => {
    return ASSETS.filter((a) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        a.name.toLowerCase().includes(q) ||
        a.assetId.toLowerCase().includes(q) ||
        a.department.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        (a.manufacturer || '').toLowerCase().includes(q) ||
        (a.serialNumber || '').toLowerCase().includes(q);

      const matchHotel = !hotelFilter || a.hotelId === hotelFilter;
      const matchCategory = !categoryFilter || a.category === categoryFilter;
      const matchDept = !departmentFilter || a.department === departmentFilter;
      const matchStatus = !statusFilter || a.status === statusFilter;
      const matchFixed =
        activeTab === 'all' ? true : activeTab === 'fixed' ? a.isFixed : !a.isFixed;

      return matchSearch && matchHotel && matchCategory && matchDept && matchStatus && matchFixed;
    });
  }, [search, hotelFilter, categoryFilter, departmentFilter, statusFilter, activeTab]);

  const hasFilters = search || hotelFilter || categoryFilter || departmentFilter || statusFilter;

  const clearFilters = () => {
    setSearch('');
    setHotelFilter('');
    setCategoryFilter('');
    setDepartmentFilter('');
    setStatusFilter('');
  };

  const tabs = [
    { id: 'all', label: 'All Assets', count: ASSETS.length },
    { id: 'fixed', label: 'Fixed Assets', count: ASSETS.filter((a) => a.isFixed).length },
    { id: 'non-fixed', label: 'Non-Fixed Assets', count: ASSETS.filter((a) => !a.isFixed).length },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div
        className="flex items-center justify-between px-7 py-4 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div>
          <h1 className="font-head text-xl font-bold">Asset Register</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length} of {ASSETS.length} assets
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
          <Link
            href="/asset-management/import"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)' }}
          >
            Import Excel
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 px-7 pt-4 pb-0 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
        className="flex items-center gap-3 px-7 py-3 border-b border-border flex-shrink-0 flex-wrap"
        style={{ background: 'var(--surface)' }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border flex-1 min-w-48"
          style={{ background: 'var(--surface2)' }}
        >
          <Search size={14} className="text-muted-foreground flex-shrink-0" />
          <input
            className="bg-transparent text-sm outline-none flex-1"
            placeholder="Search assets, ID, location, serial…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ color: 'var(--foreground)' }}
          />
        </div>
        <FilterSelect
          label="All Hotels"
          value={hotelFilter}
          options={HOTELS.map((h) => h.id)}
          onChange={setHotelFilter}
        />
        <FilterSelect
          label="Category"
          value={categoryFilter}
          options={ASSET_CATEGORIES.map((c) => c.name)}
          onChange={setCategoryFilter}
        />
        <FilterSelect
          label="Department"
          value={departmentFilter}
          options={DEPARTMENTS}
          onChange={setDepartmentFilter}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          options={['active', 'inactive', 'under-maintenance', 'disposed', 'lost']}
          onChange={setStatusFilter}
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead
            className="sticky top-0 z-10"
            style={{ background: 'var(--surface)' }}
          >
            <tr>
              {['Asset ID', 'Asset Name', 'Category', 'Hotel', 'Department', 'Location', 'Qty', 'Condition', 'Risk', 'Next Inspection', 'Status', 'Actions'].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border whitespace-nowrap"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-16 text-muted-foreground text-sm">
                  No assets found matching your filters.
                </td>
              </tr>
            ) : (
              filtered.map((asset) => (
                <tr
                  key={asset.id}
                  className="border-b border-border transition-colors cursor-pointer"
                  onClick={() => router.push(`/asset-management/assets/${asset.id}`)}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--surface2)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                    {asset.assetId}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="font-medium text-sm"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {asset.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--surface3)', color: 'var(--text2)' }}>
                      {asset.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{asset.hotelName.split(' ').slice(0, 2).join(' ')}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{asset.department}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{asset.location}</td>
                  <td className="px-4 py-3 text-xs font-semibold">{asset.quantity}</td>
                  <td className="px-4 py-3">
                    <Badge label={asset.condition} style={CONDITION_STYLES[asset.condition] || CONDITION_STYLES.good} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={asset.riskLevel} style={RISK_STYLES[asset.riskLevel] || RISK_STYLES.low} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(asset.nextInspectionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                      style={{
                        background: asset.status === 'active' ? 'rgba(61,214,140,0.12)' : 'rgba(148,163,184,0.12)',
                        color: asset.status === 'active' ? '#3dd68c' : '#94a3b8',
                      }}
                    >
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/asset-management/assets/${asset.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                      style={{ background: 'rgba(232,201,122,0.12)', color: 'var(--primary)', border: '1px solid rgba(232,201,122,0.25)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(232,201,122,0.22)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(232,201,122,0.12)'; }}
                    >
                      <ExternalLink size={11} />
                      View Full Details
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
