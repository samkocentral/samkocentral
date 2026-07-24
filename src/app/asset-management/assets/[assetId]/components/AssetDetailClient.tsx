'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Package, MapPin, Calendar, Wrench, FileText, Camera,
  QrCode, ClipboardCheck, AlertTriangle, CheckCircle2, Clock,
  User, Building2, Tag, Activity, ChevronRight, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { ASSETS, MAINTENANCE_RECORDS } from '@/lib/assetData';
import Icon from '@/components/ui/AppIcon';


type TabId = 'overview' | 'maintenance' | 'inspections' | 'documents' | 'photos' | 'audit';

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

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active: { bg: 'rgba(61,214,140,0.12)', color: '#3dd68c' },
  inactive: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
  'under-maintenance': { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  disposed: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e' },
  lost: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e' },
};

function InfoRow({ label, value, accent }: { label: string; value?: string | number; accent?: string }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground w-36 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-right" style={{ color: accent || 'var(--foreground)' }}>
        {value}
      </span>
    </div>
  );
}

// Simulated audit trail
const AUDIT_EVENTS = [
  { id: 1, action: 'Asset Created', user: 'System Import', date: '2024-01-01', detail: 'Asset record created from Excel import' },
  { id: 2, action: 'Inspection Completed', user: 'Marcus Webb', date: '2026-04-01', detail: 'Quarterly inspection passed — no issues found' },
  { id: 3, action: 'Status Updated', user: 'Marcus Webb', date: '2026-05-15', detail: 'Status changed from under-maintenance to active' },
  { id: 4, action: 'Maintenance Logged', user: 'Sarah Chen', date: '2026-06-01', detail: 'Annual service completed by approved contractor' },
  { id: 5, action: 'Record Updated', user: 'Group Admin', date: '2026-07-01', detail: 'Next inspection date updated' },
];

// Simulated documents
const MOCK_DOCUMENTS = [
  { id: 1, name: 'Purchase Invoice', type: 'PDF', size: '1.2 MB', date: '2024-01-01' },
  { id: 2, name: 'Warranty Certificate', type: 'PDF', size: '0.8 MB', date: '2024-01-15' },
  { id: 3, name: 'Maintenance Manual', type: 'PDF', size: '4.5 MB', date: '2024-02-01' },
  { id: 4, name: 'Last Inspection Report', type: 'PDF', size: '0.6 MB', date: '2026-06-01' },
];

export default function AssetDetailClient({ assetId }: { assetId: string }) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const asset = ASSETS.find((a) => a.id === assetId || a.assetId === assetId);

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertTriangle size={40} style={{ color: '#f43f5e' }} />
        <div className="font-head font-bold text-lg">Asset Not Found</div>
        <p className="text-sm text-muted-foreground">No asset found with ID: {assetId}</p>
        <Link
          href="/asset-management/assets"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--primary)', color: '#000' }}
        >
          <ArrowLeft size={14} /> Back to Assets
        </Link>
      </div>
    );
  }

  const maintenanceRecords = MAINTENANCE_RECORDS.filter((m) => m.assetId === asset.id);
  const completedMaintenance = maintenanceRecords.filter((m) => m.status === 'completed');
  const pendingMaintenance = maintenanceRecords.filter((m) => m.status !== 'completed');
  const condStyle = CONDITION_COLORS[asset.condition];
  const riskStyle = RISK_COLORS[asset.riskLevel];
  const statusStyle = STATUS_COLORS[asset.status] || STATUS_COLORS.active;

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Package },
    { id: 'maintenance', label: 'Maintenance History', icon: Wrench },
    { id: 'inspections', label: 'Inspections', icon: ClipboardCheck },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'audit', label: 'Audit Trail', icon: Activity },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-start gap-4 px-7 py-4 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <Link
          href="/asset-management/assets"
          className="flex items-center gap-1.5 text-xs font-medium mt-1 flex-shrink-0"
          style={{ color: 'var(--text2)' }}
        >
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-head text-xl font-bold">{asset.name}</h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'var(--surface3)', color: 'var(--text2)' }}>
              {asset.assetId}
            </span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
              style={{ background: statusStyle.bg, color: statusStyle.color }}
            >
              {asset.status.replace('-', ' ')}
            </span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
              style={{ background: `${condStyle}18`, color: condStyle }}
            >
              {asset.condition}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Building2 size={11} /> {asset.hotelName}</span>
            <span className="flex items-center gap-1"><MapPin size={11} /> {asset.location}, {asset.floor}</span>
            <span className="flex items-center gap-1"><Tag size={11} /> {asset.category}</span>
            <span className="flex items-center gap-1"><User size={11} /> {asset.responsibleUser}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-border"
            style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
          >
            <QrCode size={13} /> QR Code
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--primary)', color: '#000' }}
          >
            <Wrench size={14} /> Log Maintenance
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-0 px-7 border-b border-border flex-shrink-0 overflow-x-auto"
        style={{ background: 'var(--surface)' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap"
              style={{
                borderColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text2)',
                background: 'transparent',
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-7">
        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr 320px' }}>
            {/* Asset Details */}
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-3 uppercase tracking-wide text-muted-foreground">Asset Details</div>
              <InfoRow label="Asset ID" value={asset.assetId} />
              <InfoRow label="Name" value={asset.name} />
              <InfoRow label="Category" value={asset.category} />
              <InfoRow label="Department" value={asset.department} />
              <InfoRow label="Hotel" value={asset.hotelName} />
              <InfoRow label="Location" value={asset.location} />
              <InfoRow label="Floor" value={asset.floor} />
              {asset.roomNumber && <InfoRow label="Room Number" value={asset.roomNumber} />}
              <InfoRow label="Quantity" value={`${asset.quantity} ${asset.unit}`} />
              <InfoRow label="Asset Type" value={asset.isFixed ? 'Fixed Asset' : 'Non-Fixed Asset'} />
            </div>

            {/* Technical Details */}
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-3 uppercase tracking-wide text-muted-foreground">Technical Details</div>
              {asset.manufacturer && <InfoRow label="Manufacturer" value={asset.manufacturer} />}
              {asset.model && <InfoRow label="Model" value={asset.model} />}
              {asset.serialNumber && <InfoRow label="Serial Number" value={asset.serialNumber} />}
              {asset.purchaseDate && <InfoRow label="Purchase Date" value={new Date(asset.purchaseDate).toLocaleDateString('en-GB')} />}
              {asset.warrantyExpiry && <InfoRow label="Warranty Expiry" value={new Date(asset.warrantyExpiry).toLocaleDateString('en-GB')} />}
              {asset.replacementDate && <InfoRow label="Replacement Date" value={new Date(asset.replacementDate).toLocaleDateString('en-GB')} />}
              {asset.purchaseCost && <InfoRow label="Purchase Cost" value={`£${asset.purchaseCost.toLocaleString()}`} />}
              {asset.currentValue && <InfoRow label="Current Value" value={`£${asset.currentValue.toLocaleString()}`} />}
              <InfoRow label="Condition" value={asset.condition} accent={condStyle} />
              <InfoRow label="Risk Level" value={asset.riskLevel} accent={riskStyle} />
            </div>

            {/* Right Panel */}
            <div className="flex flex-col gap-4">
              {/* Maintenance Schedule */}
              <div className="rounded-xl border border-border p-4" style={{ background: 'var(--surface)' }}>
                <div className="font-head font-bold text-xs mb-3 uppercase tracking-wide text-muted-foreground">Maintenance Schedule</div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Frequency</span>
                    <span className="text-xs font-semibold capitalize">{asset.maintenanceSchedule}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Next Inspection</span>
                    <span className="text-xs font-semibold">
                      {new Date(asset.nextInspectionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </span>
                  </div>
                  {asset.lastInspectionDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Last Inspection</span>
                      <span className="text-xs font-semibold">
                        {new Date(asset.lastInspectionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Responsible */}
              <div className="rounded-xl border border-border p-4" style={{ background: 'var(--surface)' }}>
                <div className="font-head font-bold text-xs mb-3 uppercase tracking-wide text-muted-foreground">Responsible</div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: 'var(--primary)', color: '#000' }}
                  >
                    {asset.responsibleUser.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{asset.responsibleUser}</div>
                    <div className="text-xs text-muted-foreground">{asset.responsibleRole}</div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="rounded-xl border border-border p-4" style={{ background: 'var(--surface)' }}>
                <div className="font-head font-bold text-xs mb-3 uppercase tracking-wide text-muted-foreground">Maintenance Stats</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Total Records', value: maintenanceRecords.length, color: '#60a5fa' },
                    { label: 'Completed', value: completedMaintenance.length, color: '#3dd68c' },
                    { label: 'Pending', value: pendingMaintenance.length, color: '#f59e0b' },
                    { label: 'Overdue', value: maintenanceRecords.filter((m) => m.status === 'overdue').length, color: '#f43f5e' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg p-2.5" style={{ background: 'var(--surface2)' }}>
                      <div className="font-head font-extrabold text-lg" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {asset.notes && (
                <div className="rounded-xl border border-border p-4" style={{ background: 'var(--surface)' }}>
                  <div className="font-head font-bold text-xs mb-2 uppercase tracking-wide text-muted-foreground">Notes</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{asset.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MAINTENANCE HISTORY ── */}
        {activeTab === 'maintenance' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="font-head font-bold text-sm">{maintenanceRecords.length} Maintenance Records</div>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--primary)', color: '#000' }}
              >
                <Wrench size={14} /> Log New
              </button>
            </div>

            {maintenanceRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Wrench size={32} className="mb-3 opacity-30" />
                <p className="text-sm">No maintenance records yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {maintenanceRecords.map((record) => {
                  const isCompleted = record.status === 'completed';
                  const isOverdue = record.status === 'overdue';
                  const isDueToday = record.status === 'due-today';
                  return (
                    <div
                      key={record.id}
                      className="rounded-xl border border-border p-4"
                      style={{ background: 'var(--surface)' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{
                              background: isCompleted ? 'rgba(61,214,140,0.12)' : isOverdue ? 'rgba(244,63,94,0.12)' : 'rgba(245,158,11,0.12)',
                            }}
                          >
                            {isCompleted ? (
                              <CheckCircle2 size={16} style={{ color: '#3dd68c' }} />
                            ) : isOverdue ? (
                              <AlertTriangle size={16} style={{ color: '#f43f5e' }} />
                            ) : (
                              <Clock size={16} style={{ color: '#f59e0b' }} />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{record.type}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Assigned to {record.assignedTo} · {record.frequency}
                            </div>
                            {record.notes && (
                              <div className="text-xs text-muted-foreground mt-1">{record.notes}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                            style={{
                              background: isCompleted ? 'rgba(61,214,140,0.12)' : isOverdue ? 'rgba(244,63,94,0.12)' : isDueToday ? 'rgba(245,158,11,0.12)' : 'rgba(96,165,250,0.12)',
                              color: isCompleted ? '#3dd68c' : isOverdue ? '#f43f5e' : isDueToday ? '#f59e0b' : '#60a5fa',
                            }}
                          >
                            {record.status.replace('-', ' ')}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar size={10} />
                            {isCompleted && record.completedDate
                              ? new Date(record.completedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
                              : new Date(record.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </div>
                          {record.result && (
                            <span
                              className="flex items-center gap-1 text-xs font-semibold"
                              style={{ color: record.result === 'pass' ? '#3dd68c' : '#f43f5e' }}
                            >
                              {record.result === 'pass' ? <ThumbsUp size={11} /> : <ThumbsDown size={11} />}
                              {record.result}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── INSPECTIONS ── */}
        {activeTab === 'inspections' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="font-head font-bold text-sm">Inspection Records</div>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--primary)', color: '#000' }}
              >
                <ClipboardCheck size={14} /> New Inspection
              </button>
            </div>
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-xs mb-3 uppercase tracking-wide text-muted-foreground">Inspection Schedule</div>
              <InfoRow label="Frequency" value={asset.inspectionFrequency} />
              <InfoRow label="Next Due" value={new Date(asset.nextInspectionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
              {asset.lastInspectionDate && (
                <InfoRow label="Last Completed" value={new Date(asset.lastInspectionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
              )}
            </div>
            {completedMaintenance.length > 0 ? (
              <div className="flex flex-col gap-3">
                {completedMaintenance.map((record) => (
                  <div key={record.id} className="rounded-xl border border-border p-4 flex items-center gap-4" style={{ background: 'var(--surface)' }}>
                    <CheckCircle2 size={18} style={{ color: '#3dd68c', flexShrink: 0 }} />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{record.type}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">By {record.assignedTo}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {record.completedDate && new Date(record.completedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </div>
                    {record.result && (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: record.result === 'pass' ? 'rgba(61,214,140,0.12)' : 'rgba(244,63,94,0.12)',
                          color: record.result === 'pass' ? '#3dd68c' : '#f43f5e',
                        }}
                      >
                        {record.result}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ClipboardCheck size={32} className="mb-3 opacity-30" />
                <p className="text-sm">No completed inspections yet</p>
              </div>
            )}
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {activeTab === 'documents' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="font-head font-bold text-sm">{MOCK_DOCUMENTS.length} Documents</div>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--primary)', color: '#000' }}
              >
                <FileText size={14} /> Upload Document
              </button>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {MOCK_DOCUMENTS.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-xl border border-border p-4 flex items-start gap-3 cursor-pointer transition-colors"
                  style={{ background: 'var(--surface)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(244,63,94,0.1)' }}
                  >
                    <FileText size={18} style={{ color: '#f43f5e' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{doc.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{doc.type} · {doc.size}</div>
                    <div className="text-xs text-muted-foreground">{new Date(doc.date).toLocaleDateString('en-GB')}</div>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground flex-shrink-0 mt-1" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PHOTOS ── */}
        {activeTab === 'photos' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="font-head font-bold text-sm">Asset Photos</div>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--primary)', color: '#000' }}
              >
                <Camera size={14} /> Upload Photo
              </button>
            </div>
            <div
              className="rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center py-16 gap-3 cursor-pointer transition-colors"
              style={{ background: 'var(--surface)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(232,201,122,0.1)' }}
              >
                <Camera size={24} style={{ color: 'var(--primary)' }} />
              </div>
              <div className="text-sm font-semibold">No photos uploaded yet</div>
              <div className="text-xs text-muted-foreground">Click to upload or drag and drop photos here</div>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold mt-2"
                style={{ background: 'var(--primary)', color: '#000' }}
              >
                <Camera size={14} /> Upload Photos
              </button>
            </div>
          </div>
        )}

        {/* ── AUDIT TRAIL ── */}
        {activeTab === 'audit' && (
          <div className="flex flex-col gap-4">
            <div className="font-head font-bold text-sm">Audit Trail</div>
            <div className="relative">
              {/* Timeline line */}
              <div
                className="absolute left-4 top-4 bottom-4 w-px"
                style={{ background: 'var(--border)' }}
              />
              <div className="flex flex-col gap-4">
                {AUDIT_EVENTS.map((event, idx) => (
                  <div key={event.id} className="flex items-start gap-4 relative">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                      style={{
                        background: idx === 0 ? 'var(--primary)' : 'var(--surface2)',
                        border: '2px solid var(--border)',
                      }}
                    >
                      <Activity size={13} style={{ color: idx === 0 ? '#000' : 'var(--text2)' }} />
                    </div>
                    <div
                      className="flex-1 rounded-xl border border-border p-4"
                      style={{ background: 'var(--surface)' }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-sm">{event.action}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">{event.detail}</div>
                      <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: 'var(--primary)' }}>
                        <User size={10} /> {event.user}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
