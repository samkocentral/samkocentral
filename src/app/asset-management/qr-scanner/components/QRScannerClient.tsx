'use client';

import React, { useState } from 'react';
import { QrCode, Search, Package, MapPin, Calendar, Wrench, ChevronRight, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { ASSETS, MAINTENANCE_RECORDS } from '@/lib/assetData';
import Link from 'next/link';
import { useDeepPageCms } from '@/lib/deepPageCms';
import PageCMSEditButton from '@/components/cms/PageCMSEditButton';

const RISK_COLORS: Record<string, string> = {
  low: '#3dd68c',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#f43f5e',
};

const CONDITION_COLORS: Record<string, string> = {
  excellent: '#3dd68c',
  good: '#60a5fa',
  fair: '#f59e0b',
  poor: '#f97316',
  critical: '#f43f5e',
};

function AssetResultCard({ assetId }: { assetId: string }) {
  const asset = ASSETS.find(
    (a) => a.assetId.toLowerCase() === assetId.toLowerCase() || a.id === assetId
  );

  if (!asset) {
    return (
      <div
        className="rounded-xl border p-6 text-center"
        style={{ background: 'var(--surface)', borderColor: 'rgba(244,63,94,0.3)' }}
      >
        <AlertTriangle size={32} className="mx-auto mb-3" style={{ color: '#f43f5e' }} />
        <div className="font-semibold text-sm mb-1">Asset Not Found</div>
        <div className="text-xs text-muted-foreground">
          No asset found with ID: <span className="font-mono font-bold">{assetId}</span>
        </div>
      </div>
    );
  }

  const maintenanceRecords = MAINTENANCE_RECORDS.filter((m) => m.assetId === asset.id);
  const lastMaintenance = maintenanceRecords.filter((m) => m.status === 'completed').sort((a, b) => new Date(b.completedDate || '').getTime() - new Date(a.completedDate || '').getTime())[0];
  const nextMaintenance = maintenanceRecords.filter((m) => m.status !== 'completed').sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0];
  const isOverdue = nextMaintenance?.status === 'overdue';
  const isDueToday = nextMaintenance?.status === 'due-today';

  return (
    <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--surface)' }}>
      {/* Asset Header */}
      <div
        className="px-5 py-4 border-b border-border"
        style={{ background: isOverdue ? 'rgba(244,63,94,0.06)' : isDueToday ? 'rgba(245,158,11,0.06)' : 'var(--surface2)' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="font-head font-bold text-base">{asset.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5 font-mono">{asset.assetId}</div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
              style={{
                background: `${CONDITION_COLORS[asset.condition]}18`,
                color: CONDITION_COLORS[asset.condition],
              }}
            >
              {asset.condition}
            </span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
              style={{
                background: `${RISK_COLORS[asset.riskLevel]}18`,
                color: RISK_COLORS[asset.riskLevel],
              }}
            >
              {asset.riskLevel} risk
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-5 grid grid-cols-2 gap-4">
        {[
          { icon: Package, label: 'Category', value: asset.category },
          { icon: MapPin, label: 'Location', value: `${asset.location}, ${asset.floor}` },
          { icon: Package, label: 'Hotel', value: asset.hotelName },
          { icon: Package, label: 'Department', value: asset.department },
          { icon: Package, label: 'Quantity', value: `${asset.quantity} ${asset.unit}` },
          { icon: Package, label: 'Responsible', value: asset.responsibleUser },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label}>
            <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
            <div className="text-sm font-medium">{value}</div>
          </div>
        ))}
      </div>

      {/* Maintenance Status */}
      <div className="px-5 pb-5 flex flex-col gap-2">
        {nextMaintenance && (
          <div
            className="flex items-center gap-3 p-3 rounded-lg"
            style={{
              background: isOverdue ? 'rgba(244,63,94,0.08)' : isDueToday ? 'rgba(245,158,11,0.08)' : 'var(--surface2)',
            }}
          >
            {isOverdue ? (
              <AlertTriangle size={16} style={{ color: '#f43f5e', flexShrink: 0 }} />
            ) : isDueToday ? (
              <Clock size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
            ) : (
              <Calendar size={16} style={{ color: '#60a5fa', flexShrink: 0 }} />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold" style={{ color: isOverdue ? '#f43f5e' : isDueToday ? '#f59e0b' : '#60a5fa' }}>
                {isOverdue ? 'Maintenance Overdue' : isDueToday ? 'Due Today' : 'Next Maintenance'}
              </div>
              <div className="text-xs text-muted-foreground truncate">{nextMaintenance.type}</div>
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(nextMaintenance.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </div>
          </div>
        )}

        {lastMaintenance && (
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>
            <CheckCircle2 size={16} style={{ color: '#3dd68c', flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold" style={{ color: '#3dd68c' }}>Last Completed</div>
              <div className="text-xs text-muted-foreground truncate">{lastMaintenance.type}</div>
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(lastMaintenance.completedDate || '').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex gap-2">
        <Link
          href={`/asset-management/assets/${asset.id}`}
          onClick={() => {
            try {
              sessionStorage.setItem('samko_last_clicked_asset', JSON.stringify(asset));
              sessionStorage.setItem(`samko_asset_${asset.id}`, JSON.stringify(asset));
              if (asset.assetId) sessionStorage.setItem(`samko_asset_${asset.assetId}`, JSON.stringify(asset));
            } catch {}
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--primary)', color: '#000' }}
        >
          View Full Details <ChevronRight size={14} />
        </Link>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-border"
          style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
        >
          <Wrench size={14} /> Log Work
        </button>
      </div>
    </div>
  );
}

export default function QRScannerClient() {
  const cms = useDeepPageCms('qr');
  const [manualId, setManualId] = useState('');
  const [searchedId, setSearchedId] = useState('');
  const [recentScans] = useState([
    { id: 'FA-001', name: 'Bed Bases', hotel: 'Crowne Plaza Kingston-south', time: '2 min ago' },
    { id: 'PE-003', name: 'Emergency Generator', hotel: 'Crowne Plaza Kingston-south', time: '1 hr ago' },
    { id: 'SC-014', name: 'Fire Alarm Panel', hotel: 'Stanhill Court', time: '3 hrs ago' },
    { id: 'RA-013', name: 'Fire Alarm Panel', hotel: 'Ravents Ait Island', time: 'Yesterday' },
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) setSearchedId(manualId.trim());
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div>
          <h1 className="font-head text-xl font-bold">{cms.title || 'QR Scanner'}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{cms.subtitle || 'Scan or search asset QR codes'}</p>
        </div>
        <div className="flex items-center gap-2">
          <PageCMSEditButton pageId="qr" pageName="QR Asset Scanner" />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-5">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          {/* Scanner Viewport */}
          <div
            className="rounded-2xl border border-border overflow-hidden"
            style={{ background: 'var(--surface)' }}
          >
            <div
              className="relative flex items-center justify-center"
              style={{ height: 260, background: 'var(--surface3)' }}
            >
              {/* Simulated scanner frame */}
              <div className="relative">
                <div
                  className="w-48 h-48 rounded-2xl flex items-center justify-center"
                  style={{ border: '2px solid var(--primary)', background: 'rgba(232,201,122,0.04)' }}
                >
                  <QrCode size={64} style={{ color: 'var(--primary)', opacity: 0.4 }} />
                </div>
                {/* Corner markers */}
                {[
                  'top-0 left-0 border-t-2 border-l-2 rounded-tl-lg',
                  'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg',
                  'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg',
                  'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg',
                ].map((cls, i) => (
                  <div
                    key={i}
                    className={`absolute w-6 h-6 ${cls}`}
                    style={{ borderColor: 'var(--primary)' }}
                  />
                ))}
              </div>
              <div
                className="absolute bottom-4 left-0 right-0 text-center text-xs font-medium"
                style={{ color: 'var(--text2)' }}
              >
                Camera access required for live scanning
              </div>
            </div>

            <div className="p-5">
              <div className="text-center text-xs text-muted-foreground mb-4">
                — or enter Asset ID manually —
              </div>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border flex-1"
                  style={{ background: 'var(--surface2)' }}
                >
                  <Search size={14} className="text-muted-foreground flex-shrink-0" />
                  <input
                    className="bg-transparent text-sm outline-none flex-1 font-mono"
                    placeholder="e.g. FA-001, PE-003, SC-014…"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    style={{ color: 'var(--foreground)' }}
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  Search
                </button>
              </form>
            </div>
          </div>

          {/* Search Result */}
          {searchedId && <AssetResultCard assetId={searchedId} />}

          {/* Recent Scans */}
          {!searchedId && (
            <div className="rounded-xl border border-border" style={{ background: 'var(--surface)' }}>
              <div className="px-5 py-4 border-b border-border">
                <div className="font-head font-bold text-sm">Recent Scans</div>
              </div>
              <div className="divide-y divide-border">
                {recentScans.map((scan) => (
                  <button
                    key={scan.id}
                    onClick={() => { setManualId(scan.id); setSearchedId(scan.id); }}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(232,201,122,0.1)' }}
                    >
                      <QrCode size={15} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{scan.name}</div>
                      <div className="text-xs text-muted-foreground">{scan.hotel}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{scan.id}</span>
                      <span className="text-xs text-muted-foreground">{scan.time}</span>
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Tips */}
          {!searchedId && (
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-3">How to use QR Scanner</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '📱', title: 'Scan QR Code', desc: 'Point camera at asset QR label' },
                  { icon: '🔍', title: 'Manual Search', desc: 'Enter Asset ID in the search box' },
                  { icon: '📋', title: 'View Details', desc: 'See full asset info and history' },
                  { icon: '🔧', title: 'Log Work', desc: 'Record maintenance or inspection' },
                ].map((tip) => (
                  <div key={tip.title} className="flex items-start gap-2.5 p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>
                    <span className="text-lg">{tip.icon}</span>
                    <div>
                      <div className="text-xs font-semibold">{tip.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{tip.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
