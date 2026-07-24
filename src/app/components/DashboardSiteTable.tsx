import React from 'react';
import { SITES } from '@/lib/mockData';
import { ASSETS, MAINTENANCE_RECORDS } from '@/lib/assetData';
import StatusBadge from '@/components/ui/StatusBadge';
import Link from 'next/link';

export default function DashboardSiteTable() {
  // Map site names to hotel asset/maintenance data
  const siteRows = SITES?.map((site) => {
    const siteAssets = ASSETS?.filter(
      (a) =>
        a?.hotelName?.toLowerCase()?.includes(site?.name?.toLowerCase()?.split(' ')?.[0]) ||
        site?.name?.toLowerCase()?.includes(a?.hotelName?.toLowerCase()?.split(' ')?.[0])
    );
    const siteMaint = MAINTENANCE_RECORDS?.filter(
      (m) =>
        m?.hotelName?.toLowerCase()?.includes(site?.name?.toLowerCase()?.split(' ')?.[0]) ||
        site?.name?.toLowerCase()?.includes(m?.hotelName?.toLowerCase()?.split(' ')?.[0])
    );
    const overdueCount = siteMaint?.filter((m) => m?.status === 'overdue')?.length;
    const assetCount = siteAssets?.length;
    return { ...site, assetCount, overdueCount };
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
          Hotel Portfolio Overview
        </h2>
        <Link
          href="/asset-management/hotels"
          style={{ fontSize: 11, color: 'var(--primary)', textDecoration: 'none' }}
        >
          View all hotels →
        </Link>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Hotel', 'City', 'Manager', 'Status', 'Risk Level', 'Assets', 'Overdue Maint.', 'Open Issues', 'Compliance Score']?.map(
                (h) => (
                  <th key={`th-${h}`} className="table-header-cell">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {siteRows?.map((site) => (
              <tr key={site?.id} className="table-row-hover">
                <td className="table-cell">
                  <span className="text-foreground font-medium" style={{ fontSize: 13 }}>
                    {site?.name}
                  </span>
                </td>
                <td className="table-cell text-muted2" style={{ fontSize: 12 }}>
                  {site?.city}
                </td>
                <td className="table-cell text-muted2" style={{ fontSize: 12 }}>
                  {site?.manager}
                </td>
                <td className="table-cell">
                  <StatusBadge
                    variant={site?.status === 'operational' ? 'ok' : 'maintenance'}
                    label={site?.status === 'operational' ? 'Operational' : 'Maintenance'}
                  />
                </td>
                <td className="table-cell">
                  <StatusBadge
                    variant={site?.risk === 'high' ? 'critical' : site?.risk === 'medium' ? 'warning' : 'ok'}
                    label={site?.risk?.charAt(0)?.toUpperCase() + site?.risk?.slice(1)}
                  />
                </td>
                <td className="table-cell">
                  <span
                    className="font-head tabular-nums"
                    style={{ fontSize: 13, fontWeight: 700, color: 'var(--info)' }}
                  >
                    {site?.assetCount}
                  </span>
                </td>
                <td className="table-cell">
                  <span
                    className="font-head tabular-nums"
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: site?.overdueCount > 0 ? 'var(--critical)' : 'var(--ok)',
                    }}
                  >
                    {site?.overdueCount}
                  </span>
                </td>
                <td className="table-cell">
                  <span
                    className="font-head tabular-nums"
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color:
                        site?.openIssues > 5
                          ? 'var(--critical)'
                          : site?.openIssues > 2
                          ? 'var(--warning)'
                          : 'var(--ok)',
                    }}
                  >
                    {site?.openIssues}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className="comp-bar-track" style={{ width: 80 }}>
                      <div
                        className="comp-bar-fill"
                        style={{
                          width: `${site?.compliance}%`,
                          background:
                            site?.compliance >= 90
                              ? 'var(--ok)'
                              : site?.compliance >= 70
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
                          site?.compliance >= 90
                            ? 'var(--ok)'
                            : site?.compliance >= 70
                            ? 'var(--warning)'
                            : 'var(--critical)',
                      }}
                    >
                      {site?.compliance}%
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