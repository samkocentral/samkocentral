'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SITES } from '@/lib/mockData';
import { ASSETS, MAINTENANCE_RECORDS } from '@/lib/assetData';
import StatusBadge from '@/components/ui/StatusBadge';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function DashboardSiteTable() {
  const [properties, setProperties] = useState<any[]>(SITES);
  const [assets, setAssets] = useState<any[]>(ASSETS);
  const [maintenance, setMaintenance] = useState<any[]>(MAINTENANCE_RECORDS);

  const fetchLiveTable = useCallback(async () => {
    try {
      const [propsRes, assetsRes, maintRes] = await Promise.allSettled([
        api.properties.getAll(),
        api.assets.getAll(),
        api.maintenance.getAll(),
      ]);

      if (propsRes.status === 'fulfilled' && propsRes.value.success && propsRes.value.data?.length > 0) {
        setProperties(propsRes.value.data);
      }
      if (assetsRes.status === 'fulfilled' && assetsRes.value.success && assetsRes.value.data?.length > 0) {
        setAssets(assetsRes.value.data);
      }
      if (maintRes.status === 'fulfilled' && maintRes.value.success && maintRes.value.data?.length > 0) {
        setMaintenance(maintRes.value.data);
      }
    } catch (e) {
      console.warn('Dashboard table fetch fallback:', e);
    }
  }, []);

  useEffect(() => {
    fetchLiveTable();
    const handleDataChanged = () => fetchLiveTable();
    window.addEventListener('samko:data-changed', handleDataChanged);
    return () => window.removeEventListener('samko:data-changed', handleDataChanged);
  }, [fetchLiveTable]);

  // Map site names to dynamic property asset/maintenance data
  const siteRows = properties.map((site) => {
    const siteName = site.name || site.propertyName || '';
    const siteFirstWord = siteName.toLowerCase().split(' ')[0];

    const siteAssets = assets.filter(
      (a: any) =>
        a.hotelId === site.id ||
        a.propertyId === site.id ||
        a.hotelName?.toLowerCase()?.includes(siteFirstWord) ||
        a.property?.toLowerCase()?.includes(siteFirstWord) ||
        siteName.toLowerCase().includes(a.hotelName?.toLowerCase()?.split(' ')[0] || '')
    );

    const siteMaint = maintenance.filter(
      (m: any) =>
        m.hotelId === site.id ||
        m.propertyId === site.id ||
        m.hotelName?.toLowerCase()?.includes(siteFirstWord) ||
        m.property?.toLowerCase()?.includes(siteFirstWord)
    );

    const overdueCount = siteMaint.filter((m: any) => m.status === 'overdue').length;
    const assetCount = siteAssets.length;
    const openIssues = site.openIssues ?? (overdueCount + (site.compliance < 80 ? 3 : 1));

    return {
      id: site.id,
      name: siteName,
      city: site.city || site.location || 'London',
      manager: site.manager || site.generalManager || 'Marcus Webb',
      status: site.status || 'operational',
      risk: site.risk || (overdueCount > 2 ? 'high' : overdueCount > 0 ? 'medium' : 'low'),
      compliance: site.compliance || (overdueCount > 2 ? 78 : overdueCount > 0 ? 86 : 94),
      assetCount,
      overdueCount,
      openIssues,
    };
  });

  return (
    <div className="samko-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        className="flex items-center justify-between"
        style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}
      >
        <h2
          className="font-head text-foreground"
          style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          Property Portfolio Overview
        </h2>
        <Link
          href="/asset-management/properties"
          style={{ fontSize: 11, color: 'var(--primary)', textDecoration: 'none' }}
        >
          View all properties →
        </Link>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 880, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Property', 'City', 'Manager', 'Status', 'Risk Level', 'Assets', 'Overdue Maint.', 'Open Issues', 'Compliance Score'].map(
                (h) => (
                  <th key={`th-${h}`} className="table-header-cell">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {siteRows.map((site) => (
              <tr key={site.id} className="table-row-hover">
                <td className="table-cell">
                  <span className="text-foreground font-medium" style={{ fontSize: 13 }}>
                    {site.name}
                  </span>
                </td>
                <td className="table-cell text-muted2" style={{ fontSize: 12 }}>
                  {site.city}
                </td>
                <td className="table-cell text-muted2" style={{ fontSize: 12 }}>
                  {site.manager}
                </td>
                <td className="table-cell">
                  <StatusBadge
                    variant={site.status === 'operational' ? 'ok' : 'maintenance'}
                    label={site.status === 'operational' ? 'Operational' : 'Maintenance'}
                  />
                </td>
                <td className="table-cell">
                  <StatusBadge
                    variant={site.risk === 'high' ? 'critical' : site.risk === 'medium' ? 'warning' : 'ok'}
                    label={site.risk.charAt(0).toUpperCase() + site.risk.slice(1)}
                  />
                </td>
                <td className="table-cell">
                  <span
                    className="font-head tabular-nums"
                    style={{ fontSize: 13, fontWeight: 700, color: 'var(--info)' }}
                  >
                    {site.assetCount}
                  </span>
                </td>
                <td className="table-cell">
                  <span
                    className="font-head tabular-nums"
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: site.overdueCount > 0 ? 'var(--critical)' : 'var(--ok)',
                    }}
                  >
                    {site.overdueCount}
                  </span>
                </td>
                <td className="table-cell">
                  <span
                    className="font-head tabular-nums"
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color:
                        site.openIssues > 5
                          ? 'var(--critical)'
                          : site.openIssues > 2
                          ? 'var(--warning)'
                          : 'var(--ok)',
                    }}
                  >
                    {site.openIssues}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className="comp-bar-track" style={{ width: 80 }}>
                      <div
                        className="comp-bar-fill"
                        style={{
                          width: `${site.compliance}%`,
                          background:
                            site.compliance >= 90
                              ? 'var(--ok)'
                              : site.compliance >= 70
                              ? 'var(--warning)'
                              : 'var(--critical)',
                        }}
                      />
                    </div>
                    <span
                      className="font-head tabular-nums"
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color:
                          site.compliance >= 90
                            ? 'var(--ok)'
                            : site.compliance >= 70
                            ? 'var(--warning)'
                            : 'var(--critical)',
                      }}
                    >
                      {site.compliance}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}