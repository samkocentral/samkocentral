'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Building2, Package, AlertTriangle, CheckCircle2, Clock, TrendingUp, BarChart3, Activity, ChevronRight, ArrowUpRight } from 'lucide-react';
import { HOTELS, ASSETS, MAINTENANCE_RECORDS, ASSET_CATEGORIES, getAssetStats } from '@/lib/assetData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Icon from '@/components/ui/AppIcon';
import { useDeepPageCms } from '@/lib/deepPageCms';
import PageCMSEditButton from '@/components/cms/PageCMSEditButton';


const CONDITION_COLORS: Record<string, string> = {
  excellent: '#3dd68c',
  good: '#60a5fa',
  fair: '#f59e0b',
  poor: '#f97316',
  critical: '#f43f5e',
};

const RISK_COLORS: Record<string, string> = {
  low: '#3dd68c',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#f43f5e',
};

function StatCard({
  label, value, sub, color, icon: Icon,
}: {
  label: string; value: string | number; sub?: string; color: string; icon: React.ElementType;
}) {
  return (
    <div
      className="rounded-xl border border-border p-5 relative overflow-hidden"
      style={{ background: 'var(--surface)' }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon size={17} style={{ color }} />
        </div>
      </div>
      <div
        className="font-head text-3xl font-extrabold leading-none mb-1"
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-1">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function MaintenanceBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    overdue: { label: 'Overdue', bg: 'rgba(244,63,94,0.12)', color: '#f43f5e' },
    'due-today': { label: 'Due Today', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    scheduled: { label: 'Scheduled', bg: 'rgba(96,165,250,0.12)', color: '#60a5fa' },
    completed: { label: 'Completed', bg: 'rgba(61,214,140,0.12)', color: '#3dd68c' },
    'in-progress': { label: 'In Progress', bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
  };
  const s = map[status] || map['scheduled'];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

export default function AssetDashboardClient() {
  const cms = useDeepPageCms('assetdashboard');
  const stats = getAssetStats();

  const categoryChartData = ASSET_CATEGORIES
    .map((c) => ({ name: c.name.replace(' & ', ' & '), value: stats.byCategory[c.name] || 0, color: c.color }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const hotelChartData = HOTELS.map((h) => ({
    name: h.name.split(' ').slice(0, 2).join(' '),
    assets: stats.byHotel[h.name] || 0,
  }));

  const recentMaintenance = MAINTENANCE_RECORDS.slice(0, 6);

  const riskData = [
    { name: 'Low', value: ASSETS.filter((a) => a.riskLevel === 'low').length, color: '#3dd68c' },
    { name: 'Medium', value: ASSETS.filter((a) => a.riskLevel === 'medium').length, color: '#f59e0b' },
    { name: 'High', value: ASSETS.filter((a) => a.riskLevel === 'high').length, color: '#f97316' },
    { name: 'Critical', value: ASSETS.filter((a) => a.riskLevel === 'critical').length, color: '#f43f5e' },
  ].filter((d) => d.value > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div>
          <h1 className="font-head text-xl font-bold">{cms.title || 'Asset Management Dashboard'}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{cms.subtitle || 'Hotel Asset Register & Preventive Maintenance'}</p>
        </div>
        <div className="flex items-center gap-3">
          <PageCMSEditButton pageId="assetdashboard" pageName="Asset Management Dashboard" />
          {stats.overdueMaintenance > 0 && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(244,63,94,0.12)', color: '#f43f5e' }}
            >
              <AlertTriangle size={13} />
              {stats.overdueMaintenance} Overdue
            </span>
          )}
          <Link
            href="/asset-management/assets"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: 'var(--primary)', color: '#000' }}
          >
            <Package size={15} />
            {cms.primaryActionLabel || 'All Assets'}
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
          <StatCard label="Total Assets" value={stats.total} sub="Across all hotels" color="#60a5fa" icon={Package} />
          <StatCard label="Fixed Assets" value={stats.fixed} sub="Permanently installed" color="#a78bfa" icon={Building2} />
          <StatCard label="Non-Fixed Assets" value={stats.nonFixed} sub="Moveable items" color="#e8c97a" icon={Package} />
          <StatCard label="Critical Assets" value={stats.criticalAssets} sub="Require priority attention" color="#f43f5e" icon={AlertTriangle} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
          <StatCard label="Overdue Maintenance" value={stats.overdueMaintenance} sub="Past scheduled date" color="#f43f5e" icon={AlertTriangle} />
          <StatCard label="Due Today" value={stats.dueToday} sub="Scheduled for today" color="#f59e0b" icon={Clock} />
          <StatCard
            label="Maintenance Complete"
            value={`${stats.maintenanceCompletion}%`}
            sub="Completion rate"
            color="#3dd68c"
            icon={CheckCircle2}
          />
          <StatCard label="Properties Managed" value={HOTELS.length} sub="Active properties" color="#34d399" icon={Building2} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-5 mb-6 lg:grid-cols-3">
          {/* Assets by Property */}
          <div
            className="lg:col-span-2 rounded-xl border border-border p-5"
            style={{ background: 'var(--surface)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-head text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Assets by Property
              </h3>
              <BarChart3 size={15} className="text-muted-foreground" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hotelChartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#8892a4', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8892a4', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#eef0f5' }}
                />
                <Bar dataKey="assets" fill="#e8c97a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Distribution */}
          <div
            className="rounded-xl border border-border p-5"
            style={{ background: 'var(--surface)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-head text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Risk Distribution
              </h3>
              <Activity size={15} className="text-muted-foreground" />
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={riskData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2">
              {riskData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Chart + Maintenance */}
        <div className="grid grid-cols-1 gap-5 mb-6 lg:grid-cols-2">
          {/* Assets by Category */}
          <div
            className="rounded-xl border border-border p-5"
            style={{ background: 'var(--surface)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-head text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Assets by Category
              </h3>
              <TrendingUp size={15} className="text-muted-foreground" />
            </div>
            <div className="space-y-2.5">
              {categoryChartData.map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{cat.name}</span>
                    <span className="text-xs text-muted-foreground">{cat.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'var(--surface3)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min((cat.value / stats.total) * 100 * 3, 100)}%`,
                        background: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Maintenance */}
          <div
            className="rounded-xl border border-border p-5"
            style={{ background: 'var(--surface)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-head text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Maintenance Activity
              </h3>
              <Link
                href="/asset-management/maintenance"
                className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: 'var(--primary)' }}
              >
                View All <ChevronRight size={13} />
              </Link>
            </div>
            <div className="space-y-0">
              {recentMaintenance.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{m.assetName}</div>
                    <div className="text-xs text-muted-foreground truncate">{m.hotelName} · {m.type}</div>
                  </div>
                  <MaintenanceBadge status={m.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Properties Overview */}
        <div
          className="rounded-xl border border-border p-5"
          style={{ background: 'var(--surface)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-head text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Properties Overview
            </h3>
            <Link
              href="/asset-management/properties"
              className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: 'var(--primary)' }}
            >
              Manage Properties <ChevronRight size={13} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead>
                <tr>
                  {['Property', 'City', 'Manager', 'Total Assets', 'Status', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground pb-3 pr-4"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOTELS.map((hotel) => (
                  <tr key={hotel.id} className="border-t border-border group">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-sm">{hotel.name}</div>
                      <div className="text-xs text-muted-foreground">{hotel.address}</div>
                    </td>
                    <td className="py-3 pr-4 text-sm text-muted-foreground">{hotel.city}</td>
                    <td className="py-3 pr-4 text-sm">{hotel.manager}</td>
                    <td className="py-3 pr-4">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: 'rgba(232,201,122,0.12)', color: '#e8c97a' }}
                      >
                        {stats.byHotel[hotel.name] || 0} assets
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: hotel.status === 'active' ? 'rgba(61,214,140,0.12)' : 'rgba(245,158,11,0.12)',
                          color: hotel.status === 'active' ? '#3dd68c' : '#f59e0b',
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: hotel.status === 'active' ? '#3dd68c' : '#f59e0b' }}
                        />
                        {hotel.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/asset-management/assets?hotel=${hotel.id}`}
                        className="flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--primary)' }}
                      >
                        View Assets <ArrowUpRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
