'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { COMPLIANCE_TREND } from '@/lib/mockData';
import { useDeepPageCms } from '@/lib/deepPageCms';

const ComplianceTrendChart = dynamic(() => import('./ComplianceTrendChart'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse rounded-xl" style={{ height: 220, background: 'var(--surface2)' }} />
  ),
});

export default function DashboardComplianceChart() {
  const cms = useDeepPageCms('overview');
  const title = cms.sections?.complianceChart?.title || 'Group Compliance Score – 12 Week Trend';
  const subtitle = cms.sections?.complianceChart?.subtitle || 'Average compliance % across all 5 properties — declining trend requires attention';

  const chartData = (cms.chartData && cms.chartData.length > 0)
    ? cms.chartData.map((pt) => ({
        week: pt.week,
        score: pt.compliance,
        critical: pt.critical,
        warnings: 0,
      }))
    : COMPLIANCE_TREND;

  return (
    <div className="samko-card mb-5" style={{ padding: '18px 20px' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            className="font-head text-foreground"
            style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            {title}
          </h2>
          <p className="text-muted-foreground" style={{ fontSize: 11, marginTop: 2 }}>
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {[
            { color: 'var(--primary)', label: 'Compliance %' },
            { color: 'var(--critical)', label: 'Critical items' },
          ]?.map((leg) => (
            <div key={`legend-${leg?.label}`} className="flex items-center gap-1.5">
              <span
                className="rounded-full"
                style={{ width: 8, height: 8, background: leg?.color, display: 'inline-block' }}
              />
              <span className="text-muted-foreground" style={{ fontSize: 11 }}>
                {leg?.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      <ComplianceTrendChart data={chartData} />
    </div>
  );
}