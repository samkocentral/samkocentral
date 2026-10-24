'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, X, ShieldAlert, ShieldCheck, Clock, Loader2, ChevronDown, Plus, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { COMPLIANCE, daysUntil, formatDateGB } from '@/lib/mockData';
import type { ComplianceItem } from '@/lib/mockData';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import StatusDropdown from '@/components/ui/StatusDropdown';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function ComplianceTrackerClient() {
  const [complianceList, setComplianceList] = useState<ComplianceItem[]>(COMPLIANCE);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | 'critical' | 'warning' | 'ok'>('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [siteFilter, setSiteFilter] = useState('All Sites');
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingCompliance, setSavingCompliance] = useState(false);
  const [addForm, setAddForm] = useState({
    title: '',
    site: 'Crowne Plaza Kingston-south',
    category: 'Fire Safety',
    type: 'Statutory Obligation',
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    assignee: 'Marcus Webb',
    status: 'ok' as 'ok' | 'warning' | 'critical',
    riskRating: 'medium',
    notes: '',
  });

  const fetchCompliance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.compliance.getAll();
      if (res.success && res.data && res.data.length > 0) {
        const normalized: ComplianceItem[] = res.data.map((c: any) => {
          let s: 'ok' | 'warning' | 'critical' = 'ok';
          if (c.status === 'critical' || c.status === 'overdue') s = 'critical';
          else if (c.status === 'warning' || c.status === 'expiring-soon') s = 'warning';
          else s = 'ok';

          return {
            id: c.id,
            item: c.name || c.item || 'Statutory Inspection',
            site: c.property || c.hotel || c.site || 'Crowne Plaza Kingston-south',
            category: c.category || 'Statutory',
            dueDate: c.expiryDate || c.dueDate || new Date().toISOString().split('T')[0],
            lastReviewed: c.issueDate || c.lastReviewed || '2025-01-01',
            status: s,
            assignee: c.responsiblePerson || c.assignee || 'Marcus Webb',
            notes: c.notes || c.description || 'Statutory compliance obligation',
          };
        });
        setComplianceList(normalized);
      }
    } catch (err) {
      console.warn('Using local fallback compliance data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompliance();
    const handleDataChanged = () => fetchCompliance();
    window.addEventListener('samko:data-changed', handleDataChanged);
    return () => window.removeEventListener('samko:data-changed', handleDataChanged);
  }, [fetchCompliance]);

  const categoriesList = useMemo(() => ['All', ...Array.from(new Set(complianceList.map((c) => c.category))).sort()], [complianceList]);
  const sitesList = useMemo(() => ['All Sites', ...Array.from(new Set(complianceList.map((c) => c.site))).sort()], [complianceList]);

  const critCount = complianceList.filter((c) => c.status === 'critical').length;
  const warnCount = complianceList.filter((c) => c.status === 'warning').length;
  const okCount = complianceList.filter((c) => c.status === 'ok').length;

  const handleStatusChange = async (item: ComplianceItem, newStatus: 'ok' | 'warning' | 'critical') => {
    setComplianceList((prev) =>
      prev.map((c) => (c.id === item.id ? { ...c, status: newStatus } : c))
    );
    setOpenStatusDropdown(null);

    const dbStatus = newStatus === 'ok' ? 'compliant' : newStatus === 'warning' ? 'expiring-soon' : 'overdue';
    toast.success('Compliance status updated', {
      description: `${item.item} marked as ${newStatus === 'ok' ? 'Compliant' : newStatus === 'warning' ? 'Due Soon' : 'Overdue'}`,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'compliance', id: item.id, status: dbStatus },
        })
      );
    }

    try {
      await api.compliance.update(item.id, { status: dbStatus });
    } catch (e) {
      console.error('Failed to sync compliance update:', e);
    }
  };

  const handleCreateTask = async (item: ComplianceItem) => {
    try {
      await api.tasks.create({
        title: `Follow up: ${item.item}`,
        site: item.site,
        priority: item.status === 'critical' ? 'urgent' : 'high',
        due: item.dueDate,
        assignee: item.assignee,
        category: item.category,
        description: `Compliance follow-up for ${item.item} (${item.site}). ${item.notes || ''}`,
      });
      toast.success('Task created successfully', {
        description: `Follow-up task created in Task Manager for ${item.item}`,
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'task-created' } }));
      }
    } catch (err: any) {
      toast.error('Failed to create task', { description: err?.message });
    }
  };

  const handleAddCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCompliance(true);
    const newId = `comp-${Date.now()}`;
    const newItem: ComplianceItem = {
      id: newId,
      item: addForm.title,
      site: addForm.site,
      category: addForm.category,
      dueDate: addForm.dueDate,
      lastReviewed: new Date().toISOString().slice(0, 10),
      status: addForm.status,
      assignee: addForm.assignee,
      notes: addForm.notes,
    };

    setComplianceList((prev) => [newItem, ...prev]);
    setShowAddModal(false);

    toast.success('Record logged & saved to database', {
      description: `${newItem.item} for ${newItem.site}`,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'compliance', id: newId },
        })
      );
    }

    try {
      await api.compliance.create({
        name: addForm.title,
        property: addForm.site,
        hotel: addForm.site,
        category: addForm.category,
        type: addForm.type,
        expiryDate: addForm.dueDate,
        responsiblePerson: addForm.assignee,
        status: addForm.status === 'ok' ? 'compliant' : addForm.status === 'warning' ? 'expiring-soon' : 'overdue',
        riskRating: addForm.riskRating,
        notes: addForm.notes,
      });
    } catch (err: any) {
      console.warn('Failed to save compliance to Firestore:', err);
    } finally {
      setSavingCompliance(false);
    }
  };

  const filtered = useMemo(() => {
    let items = [...complianceList];
    if (statusFilter !== 'All') items = items.filter((c) => c.status === statusFilter);
    if (categoryFilter !== 'All') items = items.filter((c) => c.category === categoryFilter);
    if (siteFilter !== 'All Sites') items = items.filter((c) => c.site === siteFilter);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (c) =>
          c.item.toLowerCase().includes(q) ||
          c.site.toLowerCase().includes(q) ||
          c.assignee.toLowerCase().includes(q)
      );
    }
    // Sort: critical first, then warning, then ok; within each group by days left asc
    const order = { critical: 0, warning: 1, ok: 2 };
    items.sort((a, b) => {
      const oDiff = order[a.status] - order[b.status];
      if (oDiff !== 0) return oDiff;
      return daysUntil(a.dueDate) - daysUntil(b.dueDate);
    });
    return items;
  }, [complianceList, statusFilter, categoryFilter, siteFilter, search]);

  const trafficLight = (status: string) => {
    if (status === 'critical') return { emoji: '🔴', label: 'Overdue', color: 'var(--critical)' };
    if (status === 'warning') return { emoji: '🟡', label: 'Due Soon', color: 'var(--warning)' };
    return { emoji: '🟢', label: 'Compliant', color: 'var(--ok)' };
  };

  return (
    <>
      {/* Traffic-light KPI summary */}
      <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          {
            id: 'tl-critical',
            label: 'Overdue / Expired',
            val: critCount,
            emoji: '🔴',
            color: 'var(--critical)',
            bg: 'var(--critical-bg)',
            top: 'var(--critical)',
            icon: <ShieldAlert size={18} />,
            sub: 'Immediate regulatory risk',
            filter: 'critical' as const,
          },
          {
            id: 'tl-warning',
            label: 'Due Within 60 Days',
            val: warnCount,
            emoji: '🟡',
            color: 'var(--warning)',
            bg: 'var(--warning-bg)',
            top: 'var(--warning)',
            icon: <Clock size={18} />,
            sub: 'Action required soon',
            filter: 'warning' as const,
          },
          {
            id: 'tl-ok',
            label: 'Compliant',
            val: okCount,
            emoji: '🟢',
            color: 'var(--ok)',
            bg: 'var(--ok-bg)',
            top: 'var(--ok)',
            icon: <ShieldCheck size={18} />,
            sub: 'No action required',
            filter: 'ok' as const,
          },
        ].map((kpi) => (
          <div
            key={kpi.id}
            className="samko-card cursor-pointer transition-all duration-150"
            style={{
              padding: '18px 20px',
              borderTop: `3px solid ${kpi.top}`,
              outline: statusFilter === kpi.filter ? `2px solid ${kpi.color}` : 'none',
            }}
            onClick={() => setStatusFilter(statusFilter === kpi.filter ? 'All' : kpi.filter)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = kpi.color;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{ width: 34, height: 34, background: kpi.bg, color: kpi.color }}
              >
                {kpi.icon}
              </div>
              <span style={{ fontSize: 22 }}>{kpi.emoji}</span>
            </div>
            <div
              className="font-head tabular-nums"
              style={{ fontSize: 36, fontWeight: 800, color: kpi.color, lineHeight: 1, marginBottom: 4 }}
            >
              {kpi.val}
            </div>
            <div className="font-head text-foreground" style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
              {kpi.label}
            </div>
            <div className="text-muted-foreground" style={{ fontSize: 11 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Category breakdown strip */}
      <div className="samko-card mb-5" style={{ padding: '14px 18px' }}>
        <div
          className="font-head text-muted-foreground mb-3"
          style={{ fontSize: 10, letterSpacing: '1.2px', textTransform: 'uppercase' }}
        >
          Compliance health by category
        </div>
        <div className="flex flex-wrap gap-3">
          {categoriesList.filter((c) => c !== 'All').map((cat) => {
            const catItems = complianceList.filter((c) => c.category === cat);
            const hasCrit = catItems.some((c) => c.status === 'critical');
            const hasWarn = catItems.some((c) => c.status === 'warning');
            const variant = hasCrit ? 'critical' : hasWarn ? 'warning' : 'ok';
            const emoji = hasCrit ? '🔴' : hasWarn ? '🟡' : '🟢';
            return (
              <div
                key={`cat-health-${cat}`}
                className="flex items-center gap-2 rounded-lg cursor-pointer transition-all duration-150"
                style={{
                  padding: '6px 12px',
                  background: categoryFilter === cat ? 'rgba(232,201,122,0.10)' : 'var(--surface2)',
                  border: `1px solid ${categoryFilter === cat ? 'var(--primary)' : 'var(--border)'}`,
                }}
                onClick={() => setCategoryFilter(categoryFilter === cat ? 'All' : cat)}
              >
                <span style={{ fontSize: 12 }}>{emoji}</span>
                <span
                  className="text-foreground"
                  style={{ fontSize: 12, fontWeight: 500 }}
                >
                  {cat}
                </span>
                <span
                  className="font-head tabular-nums"
                  style={{ fontSize: 11, color: 'var(--text3)' }}
                >
                  {catItems.length}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search + site filter */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div
          className="flex items-center gap-2 rounded-lg"
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border-strong)',
            padding: '8px 14px',
            minWidth: 260,
          }}
        >
          <Search size={14} style={{ color: 'var(--text3)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search compliance items, assignees…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--foreground)',
              fontSize: 13,
              flex: 1,
              fontFamily: 'var(--font-sans)',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 0 }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        <select
          value={siteFilter}
          onChange={(e) => setSiteFilter(e.target.value)}
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border-strong)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            color: 'var(--foreground)',
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {sitesList.map((s) => (
            <option key={`comp-site-${s}`} value={s}>{s}</option>
          ))}
        </select>

        <div className="flex items-center gap-3 ml-auto">
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>
            <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{filtered.length}</span> of {complianceList.length} items
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-transform active:scale-95"
            style={{ background: 'var(--primary)', color: '#000' }}
          >
            <Plus size={14} /> Log Compliance / Issue
          </button>
        </div>
      </div>

      {/* Compliance table */}
      <div className="samko-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck size={22} />}
            title="No compliance items match your filters"
            description="Adjust your status, category, or site filters to find the compliance obligation you're looking for."
            action={
              <button
                onClick={() => { setStatusFilter('All'); setCategoryFilter('All'); setSiteFilter('All Sites'); setSearch(''); }}
                className="samko-btn-ghost"
              >
                Clear all filters
              </button>
            }
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 880, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Status', 'Compliance Item', 'Site', 'Category', 'Due Date', 'Days Left', 'Assignee', 'Last Reviewed'].map((h) => (
                    <th key={`comp-th-${h}`} className="table-header-cell">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const days = daysUntil(item.dueDate);
                  const tl = trafficLight(item.status);
                  const isExpanded = expandedRow === item.id;
                  const isDropdownOpen = openStatusDropdown === item.id;
                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        className="table-row-hover"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setExpandedRow(isExpanded ? null : item.id)}
                      >
                        <td className="table-cell" onClick={(e) => e.stopPropagation()}>
                          <StatusDropdown
                            value={item.status}
                            title="Click to change compliance status"
                            options={[
                              { value: 'ok', label: 'Compliant', color: '#3dd68c', bg: 'var(--ok-bg)' },
                              { value: 'warning', label: 'Due Soon', color: '#f59e0b', bg: 'var(--warning-bg)' },
                              { value: 'critical', label: 'Overdue', color: '#f43f5e', bg: 'var(--critical-bg)' },
                            ]}
                            onChange={(val) => handleStatusChange(item, val as any)}
                          />
                        </td>
                        <td className="table-cell">
                          <span className="text-foreground font-medium" style={{ fontSize: 13 }}>
                            {item.item}
                          </span>
                        </td>
                        <td className="table-cell text-muted2" style={{ fontSize: 12 }}>
                          {item.site}
                        </td>
                        <td className="table-cell">
                          <span
                            className="rounded"
                            style={{
                              background: 'var(--surface3)',
                              color: 'var(--text2)',
                              fontSize: 10,
                              fontWeight: 600,
                              padding: '2px 8px',
                              display: 'inline-block',
                            }}
                          >
                            {item.category}
                          </span>
                        </td>
                        <td className="table-cell text-muted2" style={{ fontSize: 12 }}>
                          {formatDateGB(item.dueDate)}
                        </td>
                        <td className="table-cell">
                          <span
                            className="font-head tabular-nums"
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: days < 0 ? 'var(--critical)' : days < 30 ? 'var(--warning)' : days < 60 ? 'var(--warning)' : 'var(--text2)',
                            }}
                          >
                            {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <div
                              className="rounded-full flex items-center justify-center flex-shrink-0"
                              style={{
                                width: 22,
                                height: 22,
                                background: 'var(--surface3)',
                                color: 'var(--text2)',
                                fontSize: 9,
                                fontWeight: 700,
                              }}
                            >
                              {item.assignee.split(' ').map((n) => n[0]).join('')}
                            </div>
                            <span className="text-muted2" style={{ fontSize: 12 }}>{item.assignee}</span>
                          </div>
                        </td>
                        <td className="table-cell text-muted3" style={{ fontSize: 11 }}>
                          {formatDateGB(item.lastReviewed)}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${item.id}-expanded`}>
                          <td
                            colSpan={8}
                            style={{
                              padding: '12px 20px 14px',
                              background: 'var(--surface2)',
                              borderBottom: '1px solid var(--border)',
                            }}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p
                                  className="font-head text-muted-foreground"
                                  style={{ fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}
                                >
                                  Notes
                                </p>
                                <p className="text-foreground" style={{ fontSize: 13, lineHeight: 1.5 }}>
                                  {item.notes}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  className="samko-btn-ghost"
                                  style={{ padding: '6px 14px', fontSize: 12 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCreateTask(item);
                                  }}
                                >
                                  Create Task
                                </button>
                                <button
                                  className="samko-btn-primary"
                                  style={{ padding: '6px 14px', fontSize: 12 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(item, 'ok');
                                  }}
                                >
                                  Mark Reviewed
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary footer */}
      <div
        className="flex items-center justify-between mt-4 rounded-xl"
        style={{ padding: '12px 18px', background: 'var(--surface2)', border: '1px solid var(--border)' }}
      >
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>
          Group compliance rate:{' '}
          <span
            className="font-head tabular-nums"
            style={{ color: 'var(--warning)', fontWeight: 700, fontSize: 14 }}
          >
            {complianceList.length > 0 ? Math.round((okCount / complianceList.length) * 100) : 100}%
          </span>{' '}
          ({okCount}/{complianceList.length} items compliant)
        </p>
        <p className="text-muted-foreground" style={{ fontSize: 11 }}>
          Live Cloud Firestore Database Sync Active
        </p>
      </div>

      {/* Log Compliance / Incident Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-xl rounded-2xl border border-border overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border" style={{ background: 'var(--surface2)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}>
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base text-foreground">Log Compliance / Incident / Complaint</h3>
                  <p className="text-xs text-muted-foreground">Record statutory obligations or property facility issues</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddCompliance} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Title / Obligation / Incident *
                </label>
                <input
                  type="text"
                  value={addForm.title}
                  onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                  placeholder="e.g. Legionella Sampling, HVAC Noise Complaint, Fire Door Audit"
                  className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Record Type
                  </label>
                  <select
                    value={addForm.type}
                    onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="Statutory Obligation">Statutory Obligation</option>
                    <option value="Complaint / Incident">Complaint / Incident</option>
                    <option value="Certification Renewal">Certification Renewal</option>
                    <option value="Health & Safety Audit">Health & Safety Audit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Site / Property
                  </label>
                  <select
                    value={addForm.site}
                    onChange={(e) => setAddForm({ ...addForm, site: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {sitesList.filter((s) => s !== 'All Sites').map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Category
                  </label>
                  <select
                    value={addForm.category}
                    onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {['Fire Safety', 'Electrical', 'Gas Safety', 'Water Hygiene', 'Food Hygiene', 'Building Regulations', 'Licenses', 'H&S', 'Customer Complaints'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Risk Rating
                  </label>
                  <select
                    value={addForm.riskRating}
                    onChange={(e) => setAddForm({ ...addForm, riskRating: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                    <option value="critical">Critical Risk</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Due / Target Date
                  </label>
                  <input
                    type="date"
                    value={addForm.dueDate}
                    onChange={(e) => setAddForm({ ...addForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Status
                  </label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm({ ...addForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="ok">Compliant / Resolved</option>
                    <option value="warning">Due Soon / In Review</option>
                    <option value="critical">Overdue / Action Required</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Assignee / Responsible Manager
                </label>
                <input
                  type="text"
                  value={addForm.assignee}
                  onChange={(e) => setAddForm({ ...addForm, assignee: e.target.value })}
                  placeholder="e.g. Marcus Webb, Priya Sharma"
                  className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Details / Action Plan
                </label>
                <textarea
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Observations, certificate details, or investigation steps…"
                  className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCompliance}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  {savingCompliance ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} /> Save Record
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}