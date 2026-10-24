'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Building2, MapPin, Phone, User, Package, ChevronRight, Search } from 'lucide-react';
import { HOTELS, MAINTENANCE_RECORDS, getAssetStats } from '@/lib/assetData';

export default function HotelsClient() {
  const [search, setSearch] = useState('');
  const stats = getAssetStats();

  const filtered = HOTELS?.filter(
    (h) =>
      h?.name?.toLowerCase()?.includes(search?.toLowerCase()) ||
      h?.city?.toLowerCase()?.includes(search?.toLowerCase()) ||
      h?.manager?.toLowerCase()?.includes(search?.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div
        className="flex items-center justify-between px-7 py-4 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div>
          <h1 className="font-head text-xl font-bold">Properties</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{HOTELS?.length} properties managed</p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border"
          style={{ background: 'var(--surface2)' }}
        >
          <Search size={14} className="text-muted-foreground" />
          <input
            className="bg-transparent text-sm outline-none w-48"
            placeholder="Search properties…"
            value={search}
            onChange={(e) => setSearch(e?.target?.value)}
            style={{ color: 'var(--foreground)' }}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-7">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered?.map((hotel) => {
            const assetCount = stats?.byHotel?.[hotel?.name] || 0;
            const overdueCount = MAINTENANCE_RECORDS?.filter(
              (m) => m?.hotelId === hotel?.id && m?.status === 'overdue'
            )?.length;
            const dueTodayCount = MAINTENANCE_RECORDS?.filter(
              (m) => m?.hotelId === hotel?.id && m?.status === 'due-today'
            )?.length;

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
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                    style={{
                      background: hotel?.status === 'active' ? 'rgba(61,214,140,0.12)' : 'rgba(245,158,11,0.12)',
                      color: hotel?.status === 'active' ? '#3dd68c' : '#f59e0b',
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: hotel?.status === 'active' ? '#3dd68c' : '#f59e0b' }}
                    />
                    {hotel?.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin size={12} />
                    <span className="truncate">{hotel?.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User size={12} />
                    <span>{hotel?.manager}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone size={12} />
                    <span>{hotel?.phone}</span>
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
                    <div className="text-xs text-muted-foreground">Assets</div>
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
                    <div className="text-xs text-muted-foreground">Overdue</div>
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
                    <div className="text-xs text-muted-foreground">Due Today</div>
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
                    View Asset Register
                  </span>
                  <ChevronRight size={13} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
