'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SITES } from '@/lib/mockData';
import { ASSETS, MAINTENANCE_RECORDS } from '@/lib/assetData';
import StatusBadge from '@/components/ui/StatusBadge';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useDeepPageCms } from '@/lib/deepPageCms';
import { useLoadingPagination } from '@/hooks/useLoadingPagination';
import LoadingPagination from '@/components/ui/LoadingPagination';

export default function DashboardSiteTable() {
  const cms = useDeepPageCms('overview');
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
  const fallbackRows = properties.map((site) => {
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
      status: (site.status || 'operational').toLowerCase(),
      risk: (site.risk || (overdueCount > 2 ? 'high' : overdueCount > 0 ? 'medium' : 'low')).toLowerCase(),
      compliance: site.compliance || (overdueCount > 2 ? 78 : overdueCount > 0 ? 86 : 94),
      assetCount,
      overdueCount,
      openIssues,
    };
  });

  // Merge live database metrics with CMS overrides so live data and CMS edits sync seamlessly
  const siteRows = fallbackRows.map((site) => {
    const cmsItem = cms.items?.find((it: any) => it.id === site.id || it.name === site.name);
    if (!cmsItem) return site;
    return {
      ...site,
      name: cmsItem.name || site.name,
      city: cmsItem.city || site.city,
      manager: cmsItem.manager || site.manager,
      status: (cmsItem.status || site.status).toLowerCase(),
      risk: (cmsItem.risk || site.risk).toLowerCase(),
    };
  });

  const {
    currentPage,
    pageSize,
    totalRecords,
    paginatedItems,
    isPageLoading,
    changePage,
    changePageSize,
  } = useLoadingPagination(siteRows, 4);

  // Active columns configured via CMS
  const activeColumns = cms.columns && cms.columns.length > 0
    ? cms.columns.filter((c) => c.visible)
    : [
        { id: 'name', label: 'Property' },
        { id: 'city', label: 'City' },
        { id: 'manager', label: 'Manager' },
        { id: 'status', label: 'Status' },
        { id: 'risk', label: 'Risk Level' },
        { id: 'assetCount', label: 'Assets' },
        { id: 'overdueCount', label: 'Overdue Maint.' },
        { id: 'openIssues', label: 'Open Issues' },
        { id: 'compliance', label: 'Compliance Score' },
      ];

  const renderCell = (site: any, colId: string) => {
    switch (colId) {
      case 'name':
        return (
          <span className="text-foreground font-medium" style={{ fontSize: 13 }}>
            {site.name}
          </span>
        );
      case 'city':
        return <span className="text-muted2" style={{ fontSize: 12 }}>{site.city}</span>;
      case 'manager':
        return <span className="text-muted2" style={{ fontSize: 12 }}>{site.manager}</span>;
      case 'status':
        return (
          <StatusBadge
            variant={site.status.includes('oper') ? 'ok' : 'maintenance'}
            label={site.status.includes('oper') ? 'Operational' : 'Maintenance'}
          />
        );
      case 'risk':
        return (
          <StatusBadge
            variant={site.risk === 'high' ? 'critical' : site.risk === 'medium' ? 'warning' : 'ok'}
            label={site.risk.charAt(0).toUpperCase() + site.risk.slice(1)}
          />
        );
      case 'assetCount':
        return (
          <span className="font-head tabular-nums" style={{ fontSize: 13, fontWeight: 700, color: 'var(--info)' }}>
            {site.assetCount}
          </span>
        );
      case 'overdueCount':
        return (
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
        );
      case 'openIssues':
        return (
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
        );
      case 'compliance':
        return (
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
        );
      default:
        return <span className="text-foreground">{String(site[colId] || '')}</span>;
    }
  };

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
          {cms.sections?.propertyTable?.title || 'Property Portfolio Overview'}
        </h2>
        <Link
          href="/asset-management/properties"
          style={{ fontSize: 11, color: 'var(--primary)', textDecoration: 'none' }}
        >
          {cms.customLabels?.viewAllProperties || 'View all properties →'}
        </Link>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 880, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {activeColumns.map((col) => (
                <th key={`th-${col.id}`} className="table-header-cell">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((site: any) => (
              <tr key={site.id} className="table-row-hover">
                {activeColumns.map((col) => (
                  <td key={`${site.id}-${col.id}`} className="table-cell">
                    {renderCell(site, col.id)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <LoadingPagination
        currentPage={currentPage}
        totalRecords={totalRecords}
        pageSize={pageSize}
        pageSizeOptions={[5, 7, 10]}
        onPageChange={changePage}
        onPageSizeChange={changePageSize}
        isLoading={isPageLoading}
        recordName="properties"
      />
    </div>
  );
}