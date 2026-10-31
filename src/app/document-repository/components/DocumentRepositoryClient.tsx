'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Upload, FileText, X, Download, Eye, Trash2, CloudUpload, ChevronDown, CheckCircle2 } from 'lucide-react';
import { DOCUMENTS, daysUntil, formatDateGB, type Document, type DocStatus } from '@/lib/mockData';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import PageCMSEditButton from '@/components/cms/PageCMSEditButton';
import LoadingPagination from '@/components/ui/LoadingPagination';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import { useLoadingPagination } from '@/hooks/useLoadingPagination';

const DEFAULT_CATEGORIES = ['All', ...Array.from(new Set(DOCUMENTS.map((d) => d.category))).sort()];
const DEFAULT_SITES = ['All Sites', ...Array.from(new Set(DOCUMENTS.map((d) => d.site))).sort()];
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
  const { isViewer, canUpload, canDelete } = useAuth();
  const [documents, setDocuments] = useState<Document[]>(DOCUMENTS);
  const [properties, setProperties] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [siteFilter, setSiteFilter] = useState('All Sites');
  const [statusFilter, setStatusFilter] = useState('All');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [uploadedFileObj, setUploadedFileObj] = useState<File | null>(null);
  const [sortCol, setSortCol] = useState<'name' | 'expiry' | 'days' | 'site'>('days');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const fetchDocuments = useCallback(async () => {
    try {
      const [docRes, propRes] = await Promise.allSettled([
        api.documents.getAll(),
        api.properties.getAll(),
      ]);
      if (docRes.status === 'fulfilled' && docRes.value.success && docRes.value.data?.length > 0) {
        setDocuments(docRes.value.data);
      }
      if (propRes.status === 'fulfilled' && propRes.value.success && propRes.value.data?.length > 0) {
        setProperties(propRes.value.data);
      }
    } catch (err) {
      console.warn('Documents live fetch fallback:', err);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    const handleDataChanged = () => fetchDocuments();
    window.addEventListener('samko:data-changed', handleDataChanged);
    return () => window.removeEventListener('samko:data-changed', handleDataChanged);
  }, [fetchDocuments]);

  const sitesList = useMemo(() => {
    if (properties.length === 0) return DEFAULT_SITES;
    const names = properties.map((p) => p.name);
    return ['All Sites', ...Array.from(new Set([...names, ...DEFAULT_SITES.filter(s => s !== 'All Sites')]))];
  }, [properties]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UploadFormValues>({
    defaultValues: {
      documentName: '',
      site: 'Crowne Plaza Kingston-south',
      category: 'Insurance',
      expiryDate: '',
      version: 'v1.0',
      notes: '',
    },
  });

  const filtered = useMemo(() => {
    let docs = [...documents];
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
  }, [documents, search, categoryFilter, siteFilter, statusFilter, sortCol, sortDir]);

  const {
    currentPage,
    pageSize,
    totalRecords,
    paginatedItems: paginatedDocs,
    isPageLoading,
    changePage,
    changePageSize,
  } = useLoadingPagination(filtered, 10);

  const handleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const handleStatusChange = async (id: string, newStatus: DocStatus) => {
    if (isViewer || !canUpload) {
      toast.error('Permission Denied', {
        description: 'L4 Viewers have read-only access. Status modifications are disabled.',
      });
      return;
    }
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
    );
    if (previewDoc && previewDoc.id === id) {
      setPreviewDoc((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'documents', id, status: newStatus },
        })
      );
    }
    try {
      await api.documents.update(id, { status: newStatus });
    } catch (e) {
      console.error('Failed to sync document status:', e);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (isViewer || !canDelete) {
      toast.error('Permission Denied', {
        description: 'L4 Viewers cannot delete repository documents.',
      });
      return;
    }
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (previewDoc && previewDoc.id === id) setPreviewDoc(null);
    toast.success('Document deleted successfully', { description: name });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'documents', id, action: 'delete' },
        })
      );
    }
    try {
      await api.documents.delete(id);
    } catch (e) {
      console.error('Failed to delete document from DB:', e);
    }
  };

  const handleDownload = (doc: Document) => {
    const content = `Samko Central UK - Document Repository\n\nTitle: ${doc.name}\nSite: ${doc.site}\nCategory: ${doc.category}\nExpiry: ${doc.expiry}\nVersion: ${doc.version}\nUploaded By: ${doc.uploadedBy}\nDate: ${new Date().toLocaleDateString('en-GB')}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.name.replace(/[^a-z0-9_-]/gi, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Download started', { description: doc.name });
  };

  const handleUpload = handleSubmit(async (data) => {
    const days = daysUntil(data.expiryDate);
    const status: DocStatus = days < 0 ? 'critical' : days <= 30 ? 'warning' : 'ok';
    const computedSize = uploadedFileObj
      ? uploadedFileObj.size > 1048576
        ? `${(uploadedFileObj.size / 1048576).toFixed(1)} MB`
        : `${Math.max(1, Math.round(uploadedFileObj.size / 1024))} KB`
      : '1.4 MB';

    const docPayload = {
      id: `doc-${Date.now()}`,
      name: data.documentName,
      site: data.site,
      category: data.category,
      expiry: data.expiryDate,
      status,
      version: data.version || 'v1.0',
      size: computedSize,
      uploaded: new Date().toISOString().slice(0, 10),
      uploadedBy: 'Marcus Webb',
    };

    setDocuments((prev) => [docPayload, ...prev]);
    toast.success('Document uploaded successfully', {
      description: `${data.documentName} added to ${data.site}`,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'documents', id: docPayload.id },
        })
      );
    }

    try {
      await api.documents.create(docPayload);
    } catch (e) {
      console.error('Failed to create document in DB:', e);
    }

    reset();
    setSelectedFile('');
    setUploadedFileObj(null);
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

  const critCount = documents.filter((d) => d.status === 'critical').length;
  const warnCount = documents.filter((d) => d.status === 'warning').length;
  const okCount = documents.filter((d) => d.status === 'ok').length;

  return (
    <>
      {/* Summary KPI row */}
      <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total Documents', val: documents.length, color: 'var(--info)', bg: 'var(--info-bg)', top: 'var(--info)' },
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
            placeholder="Search documents, properties, categories…"
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
          {sitesList.map((s) => (
            <option key={`site-opt-${s}`} value={s}>{s}</option>
          ))}
        </select>

        <div className="flex items-center gap-2 ml-auto">
          <PageCMSEditButton pageId="documents" pageName="Document Repository" />

          {canUpload ? (
            <button
              onClick={() => setUploadOpen(true)}
              className="samko-btn-primary flex items-center gap-2 transition-transform active:scale-95"
              style={{ padding: '8px 16px', fontSize: 12 }}
            >
              <Upload size={13} />
              Upload Document
            </button>
          ) : isViewer ? (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ml-auto"
            style={{ background: 'rgba(148,163,184,0.12)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.25)' }}
          >
            L4 · Read-Only Access
          </span>
        ) : null}
        </div>
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
        {DEFAULT_CATEGORIES.map((c) => (
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
          Showing <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{filtered.length}</span> of {documents.length} documents
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
            <table style={{ width: '100%', minWidth: 940, borderCollapse: 'collapse' }}>
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
                    Property {sortIndicator('site')}
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
                {paginatedDocs.map((doc) => {
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
                      <td className="table-cell" onClick={(e) => e.stopPropagation()}>
                        {isViewer || !canUpload ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold select-none"
                            style={{
                              background: doc.status === 'ok' ? 'rgba(61,214,140,0.12)' : doc.status === 'warning' ? 'rgba(245,158,11,0.12)' : 'rgba(244,63,94,0.12)',
                              color: doc.status === 'ok' ? '#3dd68c' : doc.status === 'warning' ? '#f59e0b' : '#f43f5e',
                              border: `1px solid ${doc.status === 'ok' ? '#3dd68c33' : doc.status === 'warning' ? '#f59e0b33' : '#f43f5e33'}`,
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: doc.status === 'ok' ? '#3dd68c' : doc.status === 'warning' ? '#f59e0b' : '#f43f5e' }} />
                            {doc.status === 'ok' ? 'Compliant' : doc.status === 'warning' ? 'Due Soon' : 'Overdue'}
                          </span>
                        ) : (
                          <div className="relative inline-block">
                            <select
                              value={doc.status}
                              onChange={(e) => handleStatusChange(doc.id, e.target.value as DocStatus)}
                              className="appearance-none cursor-pointer pl-4 pr-6 py-1 rounded-full text-xs font-semibold outline-none transition-all capitalize"
                              style={{
                                background: doc.status === 'ok' ? 'rgba(61,214,140,0.12)' : doc.status === 'warning' ? 'rgba(245,158,11,0.12)' : 'rgba(244,63,94,0.12)',
                                color: doc.status === 'ok' ? '#3dd68c' : doc.status === 'warning' ? '#f59e0b' : '#f43f5e',
                                border: `1px solid ${doc.status === 'ok' ? '#3dd68c33' : doc.status === 'warning' ? '#f59e0b33' : '#f43f5e33'}`,
                              }}
                            >
                              <option value="ok" style={{ background: '#18181b', color: '#3dd68c' }}>Compliant</option>
                              <option value="warning" style={{ background: '#18181b', color: '#f59e0b' }}>Due Soon</option>
                              <option value="critical" style={{ background: '#18181b', color: '#f43f5e' }}>Overdue</option>
                            </select>
                            <span
                              className="w-1.5 h-1.5 rounded-full absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
                              style={{ background: doc.status === 'ok' ? '#3dd68c' : doc.status === 'warning' ? '#f59e0b' : '#f43f5e' }}
                            />
                            <ChevronDown
                              size={11}
                              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-80"
                              style={{ color: doc.status === 'ok' ? '#3dd68c' : doc.status === 'warning' ? '#f59e0b' : '#f43f5e' }}
                            />
                          </div>
                        )}
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
                        <div className="flex items-center gap-1 opacity-100 transition-opacity">
                          <button
                            title="View document"
                            onClick={() => setPreviewDoc(doc)}
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
                              (e.currentTarget as HTMLElement).style.color = 'var(--info)';
                              (e.currentTarget as HTMLElement).style.borderColor = 'var(--info)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.color = 'var(--text2)';
                              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                            }}
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            title="Download document"
                            onClick={() => handleDownload(doc)}
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
                              (e.currentTarget as HTMLElement).style.color = 'var(--ok)';
                              (e.currentTarget as HTMLElement).style.borderColor = 'var(--ok)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.color = 'var(--text2)';
                              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                            }}
                          >
                            <Download size={13} />
                          </button>
                          {!isViewer && canDelete && (
                            <button
                              title="Delete document"
                              onClick={() => setDocToDelete(doc)}
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
                                (e.currentTarget as HTMLElement).style.color = 'var(--critical)';
                                (e.currentTarget as HTMLElement).style.borderColor = 'var(--critical)';
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.color = 'var(--text2)';
                                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <LoadingPagination
              currentPage={currentPage}
              totalRecords={totalRecords}
              pageSize={pageSize}
              pageSizeOptions={[5, 10, 15, 20, 50]}
              onPageChange={changePage}
              onPageSizeChange={changePageSize}
              isLoading={isPageLoading}
              recordName="documents"
            />
          </div>
        )}
      </div>

      {/* Document Detail Preview Modal */}
      {previewDoc && (
        <Modal
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.name}
          subtitle={`Details and metadata for ${previewDoc.site}`}
          width={520}
        >
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl" style={{ background: 'var(--surface2)' }}>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">Property</span>
                <span className="text-sm font-medium">{previewDoc.site}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">Category</span>
                <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: 'var(--surface3)', color: 'var(--text2)' }}>
                  {previewDoc.category}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">Expiry Date</span>
                <span className="text-sm font-medium">{formatDateGB(previewDoc.expiry)}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">Status</span>
                <div className="relative inline-block mt-0.5">
                  <select
                    value={previewDoc.status}
                    onChange={(e) => handleStatusChange(previewDoc.id, e.target.value as DocStatus)}
                    className="appearance-none cursor-pointer pl-4 pr-6 py-1 rounded-full text-xs font-semibold outline-none transition-all capitalize"
                    style={{
                      background: previewDoc.status === 'ok' ? 'rgba(61,214,140,0.12)' : previewDoc.status === 'warning' ? 'rgba(245,158,11,0.12)' : 'rgba(244,63,94,0.12)',
                      color: previewDoc.status === 'ok' ? '#3dd68c' : previewDoc.status === 'warning' ? '#f59e0b' : '#f43f5e',
                      border: `1px solid ${previewDoc.status === 'ok' ? '#3dd68c33' : previewDoc.status === 'warning' ? '#f59e0b33' : '#f43f5e33'}`,
                    }}
                  >
                    <option value="ok" style={{ background: '#18181b', color: '#3dd68c' }}>Compliant</option>
                    <option value="warning" style={{ background: '#18181b', color: '#f59e0b' }}>Due Soon</option>
                    <option value="critical" style={{ background: '#18181b', color: '#f43f5e' }}>Overdue</option>
                  </select>
                  <span
                    className="w-1.5 h-1.5 rounded-full absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ background: previewDoc.status === 'ok' ? '#3dd68c' : previewDoc.status === 'warning' ? '#f59e0b' : '#f43f5e' }}
                  />
                  <ChevronDown
                    size={11}
                    className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-80"
                    style={{ color: previewDoc.status === 'ok' ? '#3dd68c' : previewDoc.status === 'warning' ? '#f59e0b' : '#f43f5e' }}
                  />
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">Version</span>
                <span className="text-sm font-medium">{previewDoc.version}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">File Size</span>
                <span className="text-sm font-medium">{previewDoc.size}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">Uploaded By</span>
                <span className="text-sm font-medium">{previewDoc.uploadedBy}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">Uploaded Date</span>
                <span className="text-sm font-medium">{previewDoc.uploaded ? formatDateGB(previewDoc.uploaded) : 'Recently'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              {!isViewer && canDelete && (
                <button
                  type="button"
                  onClick={() => setDocToDelete(previewDoc)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20"
                >
                  <Trash2 size={13} /> Delete
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDownload(previewDoc)}
                className="samko-btn-primary flex items-center gap-2"
                style={{ fontSize: 13 }}
              >
                <Download size={13} /> Download
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Upload Modal */}
      <Modal
        open={uploadOpen}
        onClose={() => { setUploadOpen(false); reset(); setSelectedFile(''); setUploadedFileObj(null); }}
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
              if (file) {
                setSelectedFile(file.name);
                setUploadedFileObj(file);
              }
            }}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf,.doc,.docx,.jpg,.png';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  setSelectedFile(file.name);
                  setUploadedFileObj(file);
                }
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
                Property *
              </label>
              <select
                id="upload-site"
                className="samko-input"
                style={{ cursor: 'pointer' }}
                {...register('site', { required: 'Property is required' })}
              >
                {sitesList.filter((s) => s !== 'All Sites').map((s) => (
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
                {DEFAULT_CATEGORIES.filter((c) => c !== 'All').map((c) => (
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
              onClick={() => { setUploadOpen(false); reset(); setSelectedFile(''); setUploadedFileObj(null); }}
              className="samko-btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="samko-btn-primary flex items-center gap-2 transition-transform active:scale-95"
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
          
      {/* Universal Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(docToDelete)}
        onClose={() => setDocToDelete(null)}
        onConfirm={async () => {
          if (!docToDelete) return;
          setIsDeletingDoc(true);
          try {
            await handleDelete(docToDelete.id, docToDelete.name);
          } finally {
            setIsDeletingDoc(false);
            setDocToDelete(null);
          }
        }}
        title="Confirm Deletion"
        itemIdentifier={docToDelete?.id}
        itemName={docToDelete?.name || 'Document'}
        registerName="document repository"
        isDeleting={isDeletingDoc}
      />
    </div>
        </form>
      </Modal>
    </>
  );
}