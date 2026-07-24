'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone, AlertTriangle, CheckCircle, FileText, ClipboardList, ShieldCheck } from 'lucide-react';
import { SITES, DOCUMENTS, COMPLIANCE, TASKS, ALERTS, daysUntil, formatDateGB } from '@/lib/mockData';
import StatusBadge from '@/components/ui/StatusBadge';
import ComplianceRing from '@/components/ui/ComplianceRing';

interface SiteDetailClientProps {
  siteId: string;
}

type TabId = 'overview' | 'compliance' | 'documents' | 'tasks' | 'alerts';

export default function SiteDetailClient({ siteId }: SiteDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const site = SITES.find((s) => s.id === siteId);
  if (!site) return null;

  const siteDocs = DOCUMENTS.filter((d) => d.site === site.name);
  const siteCompliance = COMPLIANCE.filter((c) => c.site === site.name);
  const siteTasks = TASKS.filter((t) => t.site === site.name || t.site === 'All Sites');
  const siteAlerts = ALERTS.filter((a) => a.site === site.name);

  const compStats = {
    critical: siteCompliance.filter((c) => c.status === 'critical').length,
    warning: siteCompliance.filter((c) => c.status === 'warning').length,
    ok: siteCompliance.filter((c) => c.status === 'ok').length,
  };

  const docStats = {
    critical: siteDocs.filter((d) => d.status === 'critical').length,
    warning: siteDocs.filter((d) => d.status === 'warning').length,
    ok: siteDocs.filter((d) => d.status === 'ok').length,
  };

  const openTasks = siteTasks.filter((t) => t.status !== 'completed').length;
  const criticalAlerts = siteAlerts.filter((a) => a.type === 'critical').length;

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count?: number; countVariant?: 'critical' | 'warning' }[] = [
    { id: 'overview', label: 'Overview', icon: <ShieldCheck size={14} /> },
    { id: 'compliance', label: 'Compliance', icon: <CheckCircle size={14} />, count: compStats.critical, countVariant: 'critical' },
    { id: 'documents', label: 'Documents', icon: <FileText size={14} />, count: docStats.critical + docStats.warning, countVariant: docStats.critical > 0 ? 'critical' : 'warning' },
    { id: 'tasks', label: 'Tasks', icon: <ClipboardList size={14} />, count: openTasks },
    { id: 'alerts', label: 'Alerts', icon: <AlertTriangle size={14} />, count: criticalAlerts, countVariant: 'critical' },
  ];

  return (
    <div>
      {/* Back nav */}
      <div className="mb-5">
        <Link
          href="/multi-site-operations"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-150"
          style={{ fontSize: 13, textDecoration: 'none' }}
        >
          <ArrowLeft size={14} />
          Back to Multi-Site Operations
        </Link>
      </div>

      {/* Site header */}
      <div
        className="samko-card mb-5"
        style={{ padding: '22px 24px' }}
      >
        <div className="flex items-start gap-5">
          <ComplianceRing value={site.compliance} size={72} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <StatusBadge
                variant={site.status === 'operational' ? 'ok' : 'maintenance'}
                label={site.status === 'operational' ? 'Operational' : 'Maintenance'}
              />
              <span
                className="rounded"
                style={{ background: 'var(--surface3)', color: 'var(--text3)', fontSize: 10, fontWeight: 600, padding: '2px 8px' }}
              >
                {site.type}
              </span>
              <span
                className="rounded"
                style={{
                  background: site.risk === 'high' ? 'rgba(244,63,94,0.1)' : site.risk === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(61,214,140,0.1)',
                  color: site.risk === 'high' ? 'var(--critical)' : site.risk === 'medium' ? 'var(--warning)' : 'var(--ok)',
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                {site.risk.toUpperCase()} RISK
              </span>
            </div>
            <h2 className="font-head text-foreground" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
              {site.name}
            </h2>
            <div className="flex items-center gap-4 flex-wrap" style={{ fontSize: 12, color: 'var(--text2)' }}>
              <span className="flex items-center gap-1">
                <MapPin size={11} style={{ color: 'var(--text3)' }} />
                {site.address}
              </span>
              <span className="flex items-center gap-1">
                <Phone size={11} style={{ color: 'var(--text3)' }} />
                {site.phone}
              </span>
            </div>
          </div>

          {/* Quick KPIs */}
          <div className="flex gap-3 flex-shrink-0">
            {[
              { label: 'Open Issues', val: site.openIssues, color: site.openIssues > 5 ? 'var(--critical)' : site.openIssues > 2 ? 'var(--warning)' : 'var(--ok)' },
              { label: 'Documents', val: siteDocs.length, color: 'var(--info)' },
              { label: 'Open Tasks', val: openTasks, color: openTasks > 3 ? 'var(--warning)' : 'var(--ok)' },
              { label: 'Alerts', val: siteAlerts.length, color: criticalAlerts > 0 ? 'var(--critical)' : 'var(--text2)' },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-lg text-center"
                style={{ background: 'var(--surface2)', padding: '10px 14px', minWidth: 64 }}
              >
                <div className="font-head tabular-nums" style={{ fontSize: 22, fontWeight: 800, color: kpi.color, lineHeight: 1 }}>
                  {kpi.val}
                </div>
                <div className="text-muted-foreground" style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 4 }}>
                  {kpi.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manager row */}
        <div
          className="flex items-center gap-3 mt-4 pt-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div
            className="rounded-full flex items-center justify-center flex-shrink-0"
            style={{ width: 32, height: 32, background: 'rgba(232,201,122,0.15)', color: 'var(--primary)', fontSize: 11, fontWeight: 800 }}
          >
            {site.manager.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <div className="text-foreground font-medium" style={{ fontSize: 13 }}>{site.manager}</div>
            <div className="text-muted-foreground" style={{ fontSize: 11 }}>Site Manager</div>
          </div>
          <a
            href={`tel:${site.phone}`}
            className="flex items-center gap-1 rounded-lg ml-2"
            style={{ background: 'var(--surface3)', color: 'var(--text2)', padding: '5px 10px', fontSize: 11, textDecoration: 'none' }}
          >
            <Phone size={11} /> Call
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 rounded-t-lg transition-all duration-150"
            style={{
              padding: '9px 16px',
              fontSize: 13,
              fontWeight: 500,
              background: activeTab === tab.id ? 'var(--surface2)' : 'transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text2)',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                style={{
                  background: tab.countVariant === 'critical' ? 'var(--critical)' : tab.countVariant === 'warning' ? 'var(--warning)' : 'var(--surface3)',
                  color: tab.countVariant === 'warning' ? '#000' : '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 20,
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Compliance breakdown */}
          <div className="samko-card" style={{ padding: '18px 20px' }}>
            <div className="font-head text-muted-foreground mb-4" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Compliance Breakdown
            </div>
            <div className="flex gap-3 mb-4">
              {[
                { label: 'Critical', val: compStats.critical, color: 'var(--critical)', bg: 'rgba(244,63,94,0.1)' },
                { label: 'Warning', val: compStats.warning, color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)' },
                { label: 'Compliant', val: compStats.ok, color: 'var(--ok)', bg: 'rgba(61,214,140,0.1)' },
              ].map((s) => (
                <div key={s.label} className="flex-1 rounded-lg text-center" style={{ background: s.bg, padding: '10px 8px' }}>
                  <div className="font-head tabular-nums" style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: s.color, fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {siteCompliance.length === 0 ? (
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>No compliance items for this site.</p>
            ) : (
              siteCompliance.slice(0, 4).map((c) => (
                <div key={c.id} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13 }}>
                    {c.status === 'critical' ? '🔴' : c.status === 'warning' ? '🟡' : '🟢'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-foreground truncate" style={{ fontSize: 12, fontWeight: 500 }}>{c.item}</div>
                    <div className="text-muted-foreground" style={{ fontSize: 10 }}>{c.category} · Due {formatDateGB(c.dueDate)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Recent alerts */}
          <div className="samko-card" style={{ padding: '18px 20px' }}>
            <div className="font-head text-muted-foreground mb-4" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Site Alerts
            </div>
            {siteAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle size={28} style={{ color: 'var(--ok)', marginBottom: 8 }} />
                <p className="text-foreground font-medium" style={{ fontSize: 13 }}>All clear</p>
                <p className="text-muted-foreground" style={{ fontSize: 11, marginTop: 2 }}>No active alerts for this site</p>
              </div>
            ) : (
              siteAlerts.map((a) => (
                <div key={a.id} className="flex gap-3 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div
                    className="rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 30,
                      height: 30,
                      background: a.type === 'critical' ? 'rgba(244,63,94,0.12)' : a.type === 'warning' ? 'rgba(245,158,11,0.12)' : 'rgba(96,165,250,0.12)',
                      fontSize: 13,
                    }}
                  >
                    {a.type === 'critical' ? '🔴' : a.type === 'warning' ? '🟡' : '🔵'}
                  </div>
                  <div>
                    <div className="text-foreground" style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.4 }}>{a.message}</div>
                    <div className="text-muted-foreground" style={{ fontSize: 10, marginTop: 2 }}>{a.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Open tasks */}
          <div className="samko-card" style={{ padding: '18px 20px', gridColumn: '1 / -1' }}>
            <div className="font-head text-muted-foreground mb-4" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Open Tasks
            </div>
            {siteTasks.filter((t) => t.status !== 'completed').length === 0 ? (
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>No open tasks for this site.</p>
            ) : (
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {siteTasks.filter((t) => t.status !== 'completed').map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg"
                    style={{ background: 'var(--surface2)', padding: '10px 12px' }}
                  >
                    <span
                      className="rounded-full flex-shrink-0"
                      style={{
                        width: 8,
                        height: 8,
                        background: task.priority === 'urgent' ? 'var(--critical)' : task.priority === 'high' ? 'var(--warning)' : 'var(--info)',
                        display: 'block',
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-foreground truncate" style={{ fontSize: 12, fontWeight: 500 }}>{task.title}</div>
                      <div className="text-muted-foreground" style={{ fontSize: 10 }}>{task.assignee} · Due {formatDateGB(task.due)}</div>
                    </div>
                    <StatusBadge
                      variant={task.status === 'open' ? 'warning' : 'info'}
                      label={task.status}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="samko-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Compliance Item', 'Category', 'Due Date', 'Days Left', 'Status', 'Assignee'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {siteCompliance.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                    No compliance items for this site.
                  </td>
                </tr>
              ) : (
                siteCompliance.map((c) => {
                  const days = daysUntil(c.dueDate);
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>{c.item}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: 'var(--surface3)', color: 'var(--text2)', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4 }}>{c.category}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text2)' }}>{formatDateGB(c.dueDate)}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: days < 0 ? 'var(--critical)' : days < 30 ? 'var(--warning)' : 'var(--ok)', fontWeight: 600 }}>
                        {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <StatusBadge variant={c.status} label={c.status === 'ok' ? 'Compliant' : c.status === 'warning' ? 'Due Soon' : 'Overdue'} size="sm" />
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text2)' }}>{c.assignee}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="samko-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Document', 'Category', 'Expiry', 'Days Left', 'Status', 'Size', 'Version'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {siteDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                    No documents for this site.
                  </td>
                </tr>
              ) : (
                siteDocs.map((d) => {
                  const days = daysUntil(d.expiry);
                  return (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>
                        <span style={{ marginRight: 6 }}>📄</span>{d.name}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: 'var(--surface3)', color: 'var(--text2)', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4 }}>{d.category}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text2)' }}>{formatDateGB(d.expiry)}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: days < 0 ? 'var(--critical)' : days < 30 ? 'var(--warning)' : 'var(--ok)', fontWeight: 600 }}>
                        {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <StatusBadge variant={d.status} label={d.status === 'ok' ? 'Active' : d.status === 'warning' ? 'Due Soon' : 'Expired'} size="sm" />
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text3)' }}>{d.size}</td>
                      <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--text3)' }}>{d.version}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="samko-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Task', 'Category', 'Priority', 'Status', 'Assignee', 'Due'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {siteTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                    No tasks for this site.
                  </td>
                </tr>
              ) : (
                siteTasks.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div className="text-foreground" style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                      <div className="text-muted-foreground" style={{ fontSize: 10, marginTop: 2 }}>{t.description.slice(0, 60)}…</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: 'var(--surface3)', color: 'var(--text2)', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4 }}>{t.category}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge
                        variant={t.priority === 'urgent' ? 'critical' : t.priority === 'high' ? 'warning' : t.priority === 'medium' ? 'info' : 'ok'}
                        label={t.priority}
                        size="sm"
                      />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge
                        variant={t.status === 'open' ? 'warning' : t.status === 'in-progress' ? 'info' : 'ok'}
                        label={t.status}
                        size="sm"
                      />
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text2)' }}>{t.assignee}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text2)' }}>{formatDateGB(t.due)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="samko-card" style={{ padding: '18px 20px' }}>
          {siteAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle size={36} style={{ color: 'var(--ok)', marginBottom: 10 }} />
              <p className="font-head text-foreground" style={{ fontSize: 15, fontWeight: 700 }}>No active alerts</p>
              <p className="text-muted-foreground" style={{ fontSize: 12, marginTop: 4 }}>This site has no outstanding alerts at this time.</p>
            </div>
          ) : (
            siteAlerts.map((a) => (
              <div
                key={a.id}
                className="flex gap-4 rounded-lg mb-3"
                style={{
                  background: a.type === 'critical' ? 'rgba(244,63,94,0.06)' : a.type === 'warning' ? 'rgba(245,158,11,0.06)' : 'rgba(96,165,250,0.06)',
                  border: `1px solid ${a.type === 'critical' ? 'rgba(244,63,94,0.2)' : a.type === 'warning' ? 'rgba(245,158,11,0.2)' : 'rgba(96,165,250,0.2)'}`,
                  padding: '14px 16px',
                }}
              >
                <div
                  className="rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 36,
                    height: 36,
                    background: a.type === 'critical' ? 'rgba(244,63,94,0.15)' : a.type === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(96,165,250,0.15)',
                    fontSize: 16,
                  }}
                >
                  {a.type === 'critical' ? '🔴' : a.type === 'warning' ? '🟡' : '🔵'}
                </div>
                <div className="flex-1">
                  <div className="text-foreground" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{a.message}</div>
                  <div className="text-muted-foreground" style={{ fontSize: 11, marginTop: 4 }}>{a.time}</div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 20,
                    background: a.type === 'critical' ? 'var(--critical)' : a.type === 'warning' ? 'var(--warning)' : 'var(--info)',
                    color: a.type === 'warning' ? '#000' : '#fff',
                    alignSelf: 'flex-start',
                    textTransform: 'uppercase',
                  }}
                >
                  {a.type}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
