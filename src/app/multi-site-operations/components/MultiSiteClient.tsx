'use client';

import React, { useState, useMemo } from 'react';
import { Phone, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SITES, COMPLIANCE, TASKS } from '@/lib/mockData';
import StatusBadge from '@/components/ui/StatusBadge';
import ComplianceRing from '@/components/ui/ComplianceRing';
import EmptyState from '@/components/ui/EmptyState';
import { Building2 } from 'lucide-react';

type TypeFilter = 'All' | 'Hotel' | 'Restaurant';
type RiskFilter = 'All' | 'high' | 'medium' | 'low';

export default function MultiSiteClient() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('All');
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const router = useRouter();

  const filtered = useMemo(() => {
    let sites = [...SITES];
    if (typeFilter !== 'All') sites = sites.filter((s) => s.type === typeFilter);
    if (riskFilter !== 'All') sites = sites.filter((s) => s.risk === riskFilter);
    return sites;
  }, [typeFilter, riskFilter]);

  const getSiteCompliance = (siteName: string) => {
    const items = COMPLIANCE.filter((c) => c.site === siteName);
    return {
      critical: items.filter((c) => c.status === 'critical').length,
      warning: items.filter((c) => c.status === 'warning').length,
      ok: items.filter((c) => c.status === 'ok').length,
      total: items.length,
    };
  };

  const getSiteTasks = (siteName: string) => {
    return TASKS.filter((t) => t.site === siteName || t.site === 'All Sites');
  };

  const groupStats = {
    totalSites: SITES.length,
    operational: SITES.filter((s) => s.status === 'operational').length,
    highRisk: SITES.filter((s) => s.risk === 'high').length,
    avgCompliance: Math.round(SITES.reduce((a, s) => a + s.compliance, 0) / SITES.length),
  };

  return (
    <>
      {/* Group summary strip */}
      <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total Sites', val: groupStats.totalSites, color: 'var(--info)', sub: 'Hotels & restaurants' },
          { label: 'Operational', val: groupStats.operational, color: 'var(--ok)', sub: 'Fully trading sites' },
          { label: 'High Risk', val: groupStats.highRisk, color: 'var(--critical)', sub: 'Compliance below 70%' },
          { label: 'Group Avg Compliance', val: `${groupStats.avgCompliance}%`, color: groupStats.avgCompliance >= 80 ? 'var(--warning)' : 'var(--critical)', sub: 'Across all sites' },
        ].map((s) => (
          <div
            key={`gs-${s.label}`}
            className="samko-card"
            style={{ padding: '16px 18px' }}
          >
            <div className="text-muted-foreground font-head" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              {s.label}
            </div>
            <div className="font-head tabular-nums" style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 4 }}>
              {s.val}
            </div>
            <div className="text-muted-foreground" style={{ fontSize: 11 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-2">
          <span className="text-muted-foreground" style={{ fontSize: 12, alignSelf: 'center' }}>Type:</span>
          {(['All', 'Hotel', 'Restaurant'] as TypeFilter[]).map((f) => (
            <button
              key={`type-${f}`}
              onClick={() => setTypeFilter(f)}
              className={`filter-chip-btn ${typeFilter === f ? 'active-chip' : ''}`}
            >
              {f === 'Hotel' ? '🏨' : f === 'Restaurant' ? '🍽️' : ''} {f}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <span className="text-muted-foreground" style={{ fontSize: 12, alignSelf: 'center' }}>Risk:</span>
          {(['All', 'high', 'medium', 'low'] as RiskFilter[]).map((r) => (
            <button
              key={`risk-${r}`}
              onClick={() => setRiskFilter(r)}
              className={`filter-chip-btn ${riskFilter === r ? 'active-chip' : ''}`}
            >
              {r === 'high' ? '🔴' : r === 'medium' ? '🟡' : r === 'low' ? '🟢' : ''} {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-muted-foreground ml-auto" style={{ fontSize: 12 }}>
          Showing <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{filtered.length}</span> of {SITES.length} sites
        </p>
      </div>

      {/* Site cards grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 size={22} />}
          title="No sites match your filters"
          description="Try changing the type or risk level filter to see sites in this group."
          action={
            <button
              onClick={() => { setTypeFilter('All'); setRiskFilter('All'); }}
              className="samko-btn-ghost"
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
        >
          {filtered.map((site) => {
            const compData = getSiteCompliance(site.name);
            const siteTasks = getSiteTasks(site.name).filter((t) => t.status !== 'completed');
            const isSelected = selectedSite === site.id;

            return (
              <div
                key={site.id}
                className="samko-card transition-all duration-150 cursor-pointer"
                style={{
                  padding: '18px 20px',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  boxShadow: isSelected ? '0 8px 24px rgba(0,0,0,0.3)' : 'none',
                }}
                onClick={() => setSelectedSite(isSelected ? null : site.id)}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                  }
                }}
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge
                        variant={site.status === 'operational' ? 'ok' : 'maintenance'}
                        label={site.status === 'operational' ? 'Operational' : 'Maintenance'}
                        size="sm"
                      />
                      <span
                        className="rounded"
                        style={{
                          background: 'var(--surface3)',
                          color: 'var(--text3)',
                          fontSize: 9,
                          fontWeight: 600,
                          padding: '2px 6px',
                        }}
                      >
                        {site.type}
                      </span>
                    </div>
                    <h3
                      className="font-head text-foreground"
                      style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.25, marginBottom: 2 }}
                    >
                      {site.name}
                    </h3>
                    <div className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: 11 }}>
                      <MapPin size={10} />
                      {site.city}
                    </div>
                  </div>
                  <ComplianceRing value={site.compliance} size={60} />
                </div>

                {/* Risk + issue stats */}
                <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div
                    className="rounded-lg"
                    style={{ background: 'var(--surface2)', padding: '10px 12px' }}
                  >
                    <div
                      className="font-head text-muted-foreground"
                      style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}
                    >
                      Open Issues
                    </div>
                    <div
                      className="font-head tabular-nums"
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color:
                          site.openIssues > 5
                            ? 'var(--critical)'
                            : site.openIssues > 2
                            ? 'var(--warning)'
                            : 'var(--ok)',
                        lineHeight: 1,
                      }}
                    >
                      {site.openIssues}
                    </div>
                  </div>
                  <div
                    className="rounded-lg"
                    style={{ background: 'var(--surface2)', padding: '10px 12px' }}
                  >
                    <div
                      className="font-head text-muted-foreground"
                      style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}
                    >
                      Risk Level
                    </div>
                    <StatusBadge
                      variant={site.risk === 'high' ? 'critical' : site.risk === 'medium' ? 'warning' : 'ok'}
                      label={site.risk.charAt(0).toUpperCase() + site.risk.slice(1)}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Compliance breakdown mini-bar */}
                {compData.total > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-muted-foreground" style={{ fontSize: 10 }}>Compliance items</span>
                      <span className="text-muted-foreground" style={{ fontSize: 10 }}>{compData.total} total</span>
                    </div>
                    <div className="flex rounded-full overflow-hidden" style={{ height: 5 }}>
                      {compData.critical > 0 && (
                        <div
                          style={{ flex: compData.critical, background: 'var(--critical)' }}
                          title={`${compData.critical} critical`}
                        />
                      )}
                      {compData.warning > 0 && (
                        <div
                          style={{ flex: compData.warning, background: 'var(--warning)' }}
                          title={`${compData.warning} warning`}
                        />
                      )}
                      {compData.ok > 0 && (
                        <div
                          style={{ flex: compData.ok, background: 'var(--ok)' }}
                          title={`${compData.ok} ok`}
                        />
                      )}
                    </div>
                    <div className="flex gap-3 mt-1.5">
                      {compData.critical > 0 && (
                        <span style={{ fontSize: 10, color: 'var(--critical)' }}>🔴 {compData.critical}</span>
                      )}
                      {compData.warning > 0 && (
                        <span style={{ fontSize: 10, color: 'var(--warning)' }}>🟡 {compData.warning}</span>
                      )}
                      {compData.ok > 0 && (
                        <span style={{ fontSize: 10, color: 'var(--ok)' }}>🟢 {compData.ok}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Manager contact */}
                <div
                  className="flex items-center gap-2 pt-3"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <div
                    className="rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 26,
                      height: 26,
                      background: 'rgba(232,201,122,0.12)',
                      color: 'var(--primary)',
                      fontSize: 9,
                      fontWeight: 800,
                    }}
                  >
                    {site.manager.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-foreground font-medium truncate" style={{ fontSize: 12 }}>
                      {site.manager}
                    </div>
                    <div className="text-muted-foreground truncate" style={{ fontSize: 10 }}>
                      Site Manager
                    </div>
                  </div>
                  <a
                    href={`tel:${site.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center rounded transition-all duration-150"
                    style={{
                      width: 26,
                      height: 26,
                      background: 'var(--surface3)',
                      color: 'var(--text2)',
                      textDecoration: 'none',
                    }}
                    title={site.phone}
                  >
                    <Phone size={11} />
                  </a>
                </div>

                {/* Expanded tasks list */}
                {isSelected && siteTasks.length > 0 && (
                  <div
                    className="mt-4 rounded-lg"
                    style={{
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      padding: '10px 12px',
                    }}
                  >
                    <div
                      className="font-head text-muted-foreground mb-2"
                      style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase' }}
                    >
                      Open Tasks ({siteTasks.length})
                    </div>
                    {siteTasks.slice(0, 3).map((task) => (
                      <div
                        key={`site-task-${task.id}`}
                        className="flex items-center gap-2"
                        style={{ padding: '5px 0', borderBottom: '1px solid var(--border)' }}
                      >
                        <span
                          className="rounded-full flex-shrink-0"
                          style={{
                            width: 6,
                            height: 6,
                            background:
                              task.priority === 'urgent' ?'var(--critical)'
                                : task.priority === 'high' ?'var(--warning)' :'var(--info)',
                            display: 'block',
                          }}
                        />
                        <span className="text-foreground truncate" style={{ fontSize: 11, flex: 1 }}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                    {siteTasks.length > 3 && (
                      <p className="text-muted-foreground mt-2" style={{ fontSize: 10 }}>
                        +{siteTasks.length - 3} more tasks
                      </p>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/multi-site-operations/${site.id}`); }}
                      className="mt-3 w-full rounded-lg text-center"
                      style={{
                        background: 'rgba(232,201,122,0.1)',
                        border: '1px solid rgba(232,201,122,0.2)',
                        color: 'var(--primary)',
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '6px 0',
                        cursor: 'pointer',
                      }}
                    >
                      View Full Site Details →
                    </button>
                  </div>
                )}

                {isSelected && siteTasks.length === 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/multi-site-operations/${site.id}`); }}
                    className="mt-3 w-full rounded-lg text-center"
                    style={{
                      background: 'rgba(232,201,122,0.1)',
                      border: '1px solid rgba(232,201,122,0.2)',
                      color: 'var(--primary)',
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '6px 0',
                      cursor: 'pointer',
                    }}
                  >
                    View Full Site Details →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}