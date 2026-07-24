'use client';

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Upload, FileText, X, Download, Eye, Trash2, CloudUpload } from 'lucide-react';
import { DOCUMENTS, daysUntil, formatDateGB } from '@/lib/mockData';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from 'sonner';

const CATEGORIES = ['All', ...Array.from(new Set(DOCUMENTS.map((d) => d.category))).sort()];
const SITES_LIST = ['All Sites', ...Array.from(new Set(DOCUMENTS.map((d) => d.site))).sort()];
const STATUS_FILTERS = ['All', 'critical', 'warning', 'ok'];

interface UploadFormValues {
  documentName: string;
  site: string;
  category: string;
  expiryDate: string;
  version: string;
  notes: string;
}

export default function DocumentRepositoryClient() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [siteFilter, setSiteFilter] = useState('All Sites');
  const [statusFilter, setStatusFilter] = useState('All');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [sortCol, setSortCol] = useState<'name' | 'expiry' | 'days' | 'site'>('days');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UploadFormValues>({
    defaultValues: {
      documentName: '',
      site: 'The Grand Meridian',
      category: 'Insurance',
      expiryDate: '',
      version: 'v1.0',
      notes: '',
    },
  });

  const filtered = useMemo(() => {
    let docs = [...DOCUMENTS];
    if (search) {
      const q = search.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.site.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'All') docs = docs.filter((d) => d.category === categoryFilter);
    if (siteFilter !== 'All Sites') docs = docs.filter((d) => d.site === siteFilter);
    if (statusFilter !== 'All') docs = docs.filter((d) => d.status === statusFilter);

    docs.sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortCol === 'site') cmp = a.site.localeCompare(b.site);
      else if (sortCol === 'expiry') cmp = a.expiry.localeCompare(b.expiry);
      else if (sortCol === 'days') cmp = daysUntil(a.expiry) - daysUntil(b.expiry);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return docs;
  }, [search, categoryFilter, siteFilter, statusFilter, sortCol, sortDir]);

  const handleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  // Backend integration point: replace with file upload API call
  const handleUpload = handleSubmit(async (data) => {
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Document uploaded successfully', {
      description: `${data.documentName} added to ${data.site}`,
    });
    reset();
    setSelectedFile('');
    setUploadOpen(false);
  });

  const daysColor = (days: number) => {
    if (days < 0) return 'var(--critical)';
    if (days < 30) return 'var(--warning)';
    if (days < 60) return 'var(--warning)';
    return 'var(--text2)';
  };

  const sortIndicator = (col: typeof sortCol) => {
    if (sortCol !== col) return <span style={{ color: 'var(--text3)', fontSize: 9 }}>↕</span>;
    return <span style={{ color: 'var(--primary)', fontSize: 9 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const critCount = DOCUMENTS.filter((d) => d.status === 'critical').length;
  const warnCount = DOCUMENTS.filter((d) => d.status === 'warning').length;
  const okCount = DOCUMENTS.filter((d) => d.status === 'ok').length;

  return (
    <>
      {/* Summary KPI row */}
      <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total Documents', val: DOCUMENTS.length, color: 'var(--info)', bg: 'var(--info-bg)', top: 'var(--info)' },
          { label: 'Overdue / Expired', val: critCount, color: 'var(--critical)', bg: 'var(--critical-bg)', top: 'var(--critical)' },
          { label: 'Expiring Soon', val: warnCount, color: 'var(--warning)', bg: 'var(--warning-bg)', top: 'var(--warning)' },
          { label: 'Compliant', val: okCount, color: 'var(--ok)', bg: 'var(--ok-bg)', top: 'var(--ok)' },
        ].map((kpi) => (
          <div
            key={`kpi-doc-${kpi.label}`}
            className="samko-card"
            style={{ padding: '16px 18px', borderTop: `3px solid ${kpi.top}` }}
          >
            <div className="text-muted-foreground font-head" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              {kpi.label}
            </div>
            <div className="font-head tabular-nums" style={{ fontSize: 30, fontWeight: 800, color: kpi.color, lineHeight: 1 }}>
              {kpi.val}
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter bar */}
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
            placeholder="Search documents, sites, categories…"
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
              minWidth: 0,
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

        {/* Site filter */}
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
          {SITES_LIST.map((s) => (
            <option key={`site-opt-${s}`} value={s}>{s}</option>
          ))}
        </select>

        <button
          onClick={() => setUploadOpen(true)}
          className="samko-btn-primary flex items-center gap-2 ml-auto"
          style={{ padding: '8px 16px', fontSize: 12 }}
        >
          <Upload size={13} />
          Upload Document
        </button>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_FILTERS.map((s) => (
          <button
            key={`status-chip-${s}`}
            onClick={() => setStatusFilter(s)}
            className={`filter-chip-btn ${statusFilter === s ? 'active-chip' : ''}`}
          >
            {s === 'All' ? 'All Status' : s === 'critical' ? '🔴 Overdue' : s === 'warning' ? '🟡 Due Soon' : '🟢 Compliant'}
          </button>
        ))}
        <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
        {CATEGORIES.map((c) => (
          <button
            key={`cat-chip-${c}`}
            onClick={() => setCategoryFilter(c)}
            className={`filter-chip-btn ${categoryFilter === c ? 'active-chip' : ''}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>
          Showing <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{filtered.length}</span> of {DOCUMENTS.length} documents
        </p>
        {(search || categoryFilter !== 'All' || siteFilter !== 'All Sites' || statusFilter !== 'All') && (
          <button
            onClick={() => { setSearch(''); setCategoryFilter('All'); setSiteFilter('All Sites'); setStatusFilter('All'); }}
            style={{ fontSize: 11, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="samko-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<FileText size={22} />}
            title="No documents match your filters"
            description="Try adjusting your search term, category, or status filter to find the document you're looking for."
            action={
              <button
                onClick={() => { setSearch(''); setCategoryFilter('All'); setSiteFilter('All Sites'); setStatusFilter('All'); }}
                className="samko-btn-ghost"
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th
                    className="table-header-cell"
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('name')}
                  >
                    Document {sortIndicator('name')}
                  </th>
                  <th
                    className="table-header-cell"
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('site')}
                  >
                    Site {sortIndicator('site')}
                  </th>
                  <th className="table-header-cell">Category</th>
                  <th
                    className="table-header-cell"
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('expiry')}
                  >
                    Expiry Date {sortIndicator('expiry')}
                  </th>
                  <th
                    className="table-header-cell"
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('days')}
                  >
                    Days Left {sortIndicator('days')}
                  </th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Version</th>
                  <th className="table-header-cell">Size</th>
                  <th className="table-header-cell">Uploaded By</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => {
                  const days = daysUntil(doc.expiry);
                  return (
                    <tr key={doc.id} className="table-row-hover">
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div
                            className="flex items-center justify-center rounded flex-shrink-0"
                            style={{ width: 26, height: 26, background: 'var(--surface3)' }}
                          >
                            <FileText size={12} style={{ color: 'var(--primary)' }} />
                          </div>
                          <span className="text-foreground font-medium" style={{ fontSize: 12.5 }}>
                            {doc.name}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell text-muted2" style={{ fontSize: 12 }}>
                        {doc.site}
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
                          {doc.category}
                        </span>
                      </td>
                      <td className="table-cell text-muted2" style={{ fontSize: 12 }}>
                        {formatDateGB(doc.expiry)}
                      </td>
                      <td className="table-cell">
                        <span
                          className="font-head tabular-nums"
                          style={{ fontSize: 13, fontWeight: 700, color: daysColor(days) }}
                        >
                          {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                        </span>
                      </td>
                      <td className="table-cell">
                        <StatusBadge
                          variant={doc.status}
                          label={doc.status === 'ok' ? 'Compliant' : doc.status === 'warning' ? 'Due Soon' : 'Overdue'}
                        />
                      </td>
                      <td className="table-cell text-muted2" style={{ fontSize: 11 }}>
                        {doc.version}
                      </td>
                      <td className="table-cell text-muted3" style={{ fontSize: 11 }}>
                        {doc.size}
                      </td>
                      <td className="table-cell text-muted2" style={{ fontSize: 12 }}>
                        {doc.uploadedBy}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ opacity: 1 }}>
                          {[
                            { icon: <Eye size={13} />, label: 'View document', color: 'var(--info)' },
                            { icon: <Download size={13} />, label: 'Download document', color: 'var(--ok)' },
                            { icon: <Trash2 size={13} />, label: 'Delete document — this cannot be undone', color: 'var(--critical)' },
                          ].map((action, ai) => (
                            <button
                              key={`doc-action-${doc.id}-${ai}`}
                              title={action.label}
                              onClick={() => {
                                if (ai === 2) {
                                  toast.error('Delete document', { description: 'Confirm deletion in the document detail view' });
                                } else if (ai === 1) {
                                  toast.success('Download started', { description: doc.name });
                                }
                              }}
                              className="flex items-center justify-center rounded transition-all duration-150"
                              style={{
                                width: 26,
                                height: 26,
                                background: 'var(--surface2)',
                                border: '1px solid var(--border)',
                                cursor: 'pointer',
                                color: 'var(--text2)',
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.color = action.color;
                                (e.currentTarget as HTMLElement).style.borderColor = action.color;
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.color = 'var(--text2)';
                                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                              }}
                            >
                              {action.icon}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        open={uploadOpen}
        onClose={() => { setUploadOpen(false); reset(); setSelectedFile(''); }}
        title="Upload Compliance Document"
        subtitle="Add a new document to the repository — all fields marked * are required"
        width={580}
      >
        <form onSubmit={handleUpload} noValidate>
          {/* Drag & Drop zone */}
          <div
            className="rounded-xl flex flex-col items-center justify-center gap-3 mb-5 transition-all duration-150"
            style={{
              border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border-strong)'}`,
              background: isDragging ? 'rgba(232,201,122,0.05)' : 'var(--surface2)',
              padding: '28px 20px',
              cursor: 'pointer',
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) setSelectedFile(file.name);
            }}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf,.doc,.docx,.jpg,.png';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) setSelectedFile(file.name);
              };
              input.click();
            }}
          >
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ width: 44, height: 44, background: 'rgba(232,201,122,0.10)' }}
            >
              <CloudUpload size={20} style={{ color: 'var(--primary)' }} />
            </div>
            {selectedFile ? (
              <div className="text-center">
                <p className="text-foreground font-medium" style={{ fontSize: 13 }}>{selectedFile}</p>
                <p className="text-muted-foreground" style={{ fontSize: 11, marginTop: 2 }}>Click to change file</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-foreground font-medium" style={{ fontSize: 13 }}>
                  Drop your file here or click to browse
                </p>
                <p className="text-muted-foreground" style={{ fontSize: 11, marginTop: 2 }}>
                  PDF, Word, JPG or PNG — max 25 MB
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="samko-label" htmlFor="upload-docname">
                Document name *
              </label>
              <input
                id="upload-docname"
                type="text"
                className="samko-input"
                placeholder="e.g. Gas Safety Certificate 2026"
                {...register('documentName', { required: 'Document name is required' })}
              />
              {errors.documentName && (
                <p style={{ fontSize: 11, color: 'var(--critical)', marginTop: 4 }}>{errors.documentName.message}</p>
              )}
            </div>

            <div>
              <label className="samko-label" htmlFor="upload-site">
                Site *
              </label>
              <select
                id="upload-site"
                className="samko-input"
                style={{ cursor: 'pointer' }}
                {...register('site', { required: 'Site is required' })}
              >
                {SITES_LIST.filter((s) => s !== 'All Sites').map((s) => (
                  <option key={`upload-site-${s}`} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="samko-label" htmlFor="upload-cat">
                Category *
              </label>
              <select
                id="upload-cat"
                className="samko-input"
                style={{ cursor: 'pointer' }}
                {...register('category', { required: 'Category is required' })}
              >
                {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={`upload-cat-${c}`} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="samko-label" htmlFor="upload-expiry">
                Expiry date *
              </label>
              <input
                id="upload-expiry"
                type="date"
                className="samko-input"
                {...register('expiryDate', { required: 'Expiry date is required' })}
              />
              {errors.expiryDate && (
                <p style={{ fontSize: 11, color: 'var(--critical)', marginTop: 4 }}>{errors.expiryDate.message}</p>
              )}
            </div>

            <div>
              <label className="samko-label" htmlFor="upload-version">
                Version
              </label>
              <input
                id="upload-version"
                type="text"
                className="samko-input"
                placeholder="e.g. v1.0"
                {...register('version')}
              />
              <p className="text-muted-foreground" style={{ fontSize: 11, marginTop: 4 }}>
                Use version numbers to track document revisions
              </p>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label className="samko-label" htmlFor="upload-notes">
                Notes
              </label>
              <textarea
                id="upload-notes"
                className="samko-input"
                placeholder="Any relevant notes about this document…"
                rows={3}
                style={{ resize: 'vertical' }}
                {...register('notes')}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-border">
            <button
              type="button"
              onClick={() => { setUploadOpen(false); reset(); setSelectedFile(''); }}
              className="samko-btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="samko-btn-primary flex items-center gap-2"
              style={{ minWidth: 140 }}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="rounded-full border-2 animate-spin"
                    style={{ width: 13, height: 13, borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000' }}
                  />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload size={13} />
                  Upload Document
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}