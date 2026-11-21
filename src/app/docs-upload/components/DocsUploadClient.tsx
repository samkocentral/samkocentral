'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ChevronDown,
  X,
  Eye,
  Trash2,
  CloudUpload,
  Download,
  Printer,
  FileText,
  AlertTriangle,
  Plus,
  Filter,
  CheckCircle2,
  Tag,
  Building2,
  Clock,
  ShieldCheck,
  FolderOpen,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';
import { openDocumentInNewTab } from '@/components/ui/DocumentUploadField';
import { toast } from 'sonner';
import { useAuth } from '@/lib/authContext';
import { DOCUMENTS, type Document, type DocStatus } from '@/lib/mockData';
import { HOTELS } from '@/lib/assetData';
import { useLiveProperties } from '@/hooks/useLiveProperties';
import LoadingPagination from '@/components/ui/LoadingPagination';
import { useLoadingPagination } from '@/hooks/useLoadingPagination';
import {
  useDeepPageCms,
  DEFAULT_DOCUMENT_CATEGORIES,
  addDropdownOption,
  removeDropdownOptionByName,
} from '@/lib/deepPageCms';
import CustomDropdown from '@/components/ui/CustomDropdown';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import { api } from '@/lib/api';

// Load directly from real document repository
function loadRealDocuments(): Document[] {
  if (typeof window !== 'undefined') {
    try {
      const saved =
        localStorage.getItem('samko_repository_documents') ||
        sessionStorage.getItem('samko_repository_documents');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
  }
  return DOCUMENTS;
}

function createRealDocumentBlob(doc: Document): { url: string; filename: string } {
  if (doc.fileUrl) {
    return {
      url: doc.fileUrl,
      filename: doc.fileName || `${doc.name.replace(/[^a-z0-9_-]/gi, '_')}.pdf`,
    };
  }

  const safeName = (doc.name || 'Compliance Document').replace(/[()]/g, '');
  const safeSite = (doc.site || 'Crowne Plaza').replace(/[()]/g, '');
  const safeCat = (doc.category || 'General').replace(/[()]/g, '');
  const safeExpiry = (doc.expiry || '').replace(/[()]/g, '');
  const safeBy = (doc.uploadedBy || 'Marcus Webb').replace(/[()]/g, '');
  const safeDate = new Date().toLocaleDateString('en-GB');

  const streamContent = `BT\n/F1 18 Tf\n50 720 Td\n(SAMKO CENTRAL UK - STATUTORY COMPLIANCE ARCHIVE) Tj\n/F1 13 Tf\n0 -36 Td\n(Document Title: ${safeName}) Tj\n/F1 12 Tf\n0 -24 Td\n(Property / Site: ${safeSite}) Tj\n0 -20 Td\n(Category: ${safeCat}) Tj\n0 -20 Td\n(Version: ${doc.version || 'v1.0'}) Tj\n0 -20 Td\n(Verified By: ${safeBy}) Tj\n0 -20 Td\n(Archive Date: ${safeDate}) Tj\n0 -20 Td\n(Statutory Expiry: ${safeExpiry}) Tj\n0 -20 Td\n(Compliance Status: ${doc.status.toUpperCase()}) Tj\n0 -32 Td\n(STATUTORY AUDIT CERTIFICATE: ARCHIVED & COMPLIANT) Tj\nET`;

  const streamLength = streamContent.length;
  const pdfSource = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000224 00000 n \n0000000500 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n600\n%%EOF`;

  const blob = new Blob([pdfSource], { type: 'application/pdf' });
  return {
    url: URL.createObjectURL(blob),
    filename: `${doc.name.replace(/[^a-z0-9_-]/gi, '_')}.pdf`,
  };
}

export default function DocsUploadClient() {
  const router = useRouter();
  const { user, isViewer, isUploader, canUpload, canDelete, isPropertyAccessible } = useAuth();
  const { dropdowns: cmsDropdowns } = useDeepPageCms('documents');

  // Real Documents state synchronized with Document Repository
  const [documents, setDocuments] = useState<Document[]>(() => {
    return loadRealDocuments();
  });

  // Sync with real storage changes
  useEffect(() => {
    const handleSync = () => {
      setDocuments(loadRealDocuments());
    };
    window.addEventListener('samko:data-changed', handleSync);
    window.addEventListener('samko:approvals-changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('samko:data-changed', handleSync);
      window.removeEventListener('samko:approvals-changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const saveDocuments = (newList: Document[]) => {
    setDocuments(newList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('samko_repository_documents', JSON.stringify(newList));
        sessionStorage.setItem('samko_repository_documents', JSON.stringify(newList));
        // Remove legacy dummy keys
        sessionStorage.removeItem('samko_vault_documents');
        localStorage.removeItem('samko_vault_documents');

        // Calculate pending approvals count:
        const pendingCount = newList.filter((d: any) => {
          const status =
            d.approvalStatus ||
            (String(d.id).startsWith('doc-17') || String(d.id).startsWith('doc-food')
              ? 'pending'
              : 'approved');
          return status === 'pending' || status === 'hold';
        }).length;

        localStorage.setItem('samko_approvals_count', String(pendingCount));

        // Dispatch events so Approvals badges update in real-time in Topbar, Sidebar, and Approvals page
        window.dispatchEvent(
          new CustomEvent('samko:approvals-changed', { detail: { count: pendingCount } })
        );
        window.dispatchEvent(
          new CustomEvent('samko:doc_uploaded', { detail: { count: pendingCount, documents: newList } })
        );
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', { detail: { type: 'documents' } })
        );
      } catch (e) {}
    }
  };

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterProperty, setFilterProperty] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'ok' | 'warning' | 'critical'>('all');

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Replace Document file input ref
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null);

  // Upload Form state
  const [uploadForm, setUploadForm] = useState({
    name: '',
    property: 'Crowne Plaza Kingston-south',
    category: 'Gas Safety',
    version: 'v1.0',
    expiryDate: '',
    notes: '',
    fileName: '',
    fileSize: '',
    fileUrl: '',
  });

  // Dynamic Categories from deepPageCms & defaults
  const categoryDropdown = (cmsDropdowns || []).find((d) => d.id === 'category');
  const allCategories = useMemo(() => {
    const cmsOptions = categoryDropdown?.options || [];
    const deleted = new Set((categoryDropdown?.deletedOptions || []).map((o) => o.toLowerCase()));
    const merged = new Set<string>();

    cmsOptions.forEach((c) => {
      const clean = c.trim();
      if (
        clean &&
        !clean.toLowerCase().startsWith('all ') &&
        clean.toLowerCase() !== 'all' &&
        !deleted.has(clean.toLowerCase())
      ) {
        merged.add(clean);
      }
    });

    DEFAULT_DOCUMENT_CATEGORIES.forEach((c) => {
      const clean = c.trim();
      if (!deleted.has(clean.toLowerCase())) {
        merged.add(clean);
      }
    });

    documents.forEach((d) => {
      if (d.category && !deleted.has(d.category.toLowerCase())) {
        merged.add(d.category);
      }
    });

    return Array.from(merged).sort();
  }, [categoryDropdown, documents]);

  // Handle Add Category
  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.error('Category name is required');
      return;
    }
    addDropdownOption('documents', 'category', trimmed);
    toast.success(`Category "${trimmed}" added successfully`);
    setNewCategoryName('');
  };

  // Handle Delete Category
  const handleDeleteCategory = (catName: string) => {
    removeDropdownOptionByName('documents', 'category', catName);
    if (filterCategory === catName) setFilterCategory('all');
    toast.success(`Category "${catName}" removed`);
  };

  // Live dynamic properties from DB
  const { properties: liveProperties } = useLiveProperties();

  // Dynamic property options computed from liveProperties + document properties
  const propertyOptions = useMemo(() => {
    const map = new Map<string, string>();
    liveProperties.forEach((h: any) => {
      const name = h.name || (h as any).propertyName;
      if (name && isPropertyAccessible(name || h.id)) {
        map.set(name.toLowerCase(), name);
      }
    });
    documents.forEach((d) => {
      const s = d.site || (d as any).property || (d as any).hotel;
      if (s && isPropertyAccessible(s)) {
        if (!map.has(s.toLowerCase())) {
          map.set(s.toLowerCase(), s);
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [liveProperties, documents, isPropertyAccessible]);

  // Scoped documents by assigned property
  const accessibleDocuments = useMemo(() => {
    return documents.filter((doc) => isPropertyAccessible(doc.site));
  }, [documents, isPropertyAccessible]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return accessibleDocuments.filter((doc) => {
      if (filterStatus !== 'all' && doc.status !== filterStatus) return false;
      if (filterCategory !== 'all' && doc.category !== filterCategory) return false;
      if (
        filterProperty.length > 0 &&
        !filterProperty.some(
          (p) => !p || p.toLowerCase() === 'all' || p.toLowerCase() === 'all properties'
        )
      ) {
        if (!filterProperty.includes(doc.site)) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          doc.name.toLowerCase().includes(q) ||
          (doc.fileName || '').toLowerCase().includes(q) ||
          doc.site.toLowerCase().includes(q) ||
          doc.category.toLowerCase().includes(q) ||
          (doc.uploadedBy || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [accessibleDocuments, filterStatus, filterCategory, filterProperty, search]);

  // Pagination for documents table
  const {
    currentPage: docsCurrentPage,
    pageSize: docsPageSize,
    totalRecords: docsTotalRecords,
    paginatedItems: paginatedDocuments,
    isPageLoading: isDocsLoading,
    changePage: changeDocsPage,
    changePageSize: changeDocsPageSize,
  } = useLoadingPagination(filteredDocuments, 10);

  // Stats calculation
  const compliantCount = useMemo(
    () => accessibleDocuments.filter((d) => d.status === 'ok').length,
    [accessibleDocuments]
  );
  const dueSoonCount = useMemo(
    () => accessibleDocuments.filter((d) => d.status === 'warning').length,
    [accessibleDocuments]
  );
  const overdueCount = useMemo(
    () => accessibleDocuments.filter((d) => d.status === 'critical').length,
    [accessibleDocuments]
  );

  // Handle file replacement
  const handleFilePickedForReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingDocId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      const updated = documents.map((d) => {
        if (d.id === replacingDocId) {
          const next = {
            ...d,
            fileName: file.name,
            size: sizeStr,
            fileUrl: dataUrl,
          };
          if (previewDoc && previewDoc.id === d.id) {
            setPreviewDoc(next);
          }
          return next;
        }
        return d;
      });

      saveDocuments(updated);
      toast.success('Document Replaced Successfully', {
        description: `New file: ${file.name} (${sizeStr})`,
      });
    };
    reader.readAsDataURL(file);

    e.target.value = '';
    setReplacingDocId(null);
  };

  // Handle save new document
  const handleSaveUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.name) {
      toast.error('Document Name is required');
      return;
    }

    const expDate = uploadForm.expiryDate || '2027-12-31';
    const daysRem = Math.ceil((new Date(expDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const status: DocStatus = daysRem <= 0 ? 'critical' : daysRem <= 90 ? 'warning' : 'ok';

    const newDoc: any = {
      id: `doc-${Date.now()}`,
      name: uploadForm.name,
      fileName: uploadForm.fileName || `${uploadForm.name.replace(/[^a-z0-9_-]/gi, '_')}.pdf`,
      site: uploadForm.property,
      category: uploadForm.category,
      department:
        uploadForm.category?.toLowerCase().includes('food') ||
        uploadForm.category?.toLowerCase().includes('hygiene')
          ? 'Kitchen'
          : 'Maintenance',
      version: uploadForm.version || 'v1.0',
      uploaded: new Date().toISOString().split('T')[0],
      uploadedBy: user?.name || (isUploader ? 'Uploader (L3)' : 'Current Administrator'),
      expiry: expDate,
      approvalStatus: 'pending',
      status,
      size: uploadForm.fileSize || '1.8 MB',
      fileUrl: uploadForm.fileUrl || '',
      notes: uploadForm.notes,
    };

    saveDocuments([newDoc, ...documents]);
    setShowUploadModal(false);
    setUploadForm({
      name: '',
      property: 'Crowne Plaza Kingston-south',
      category: allCategories[0] || 'Gas Safety',
      version: 'v1.0',
      expiryDate: '',
      notes: '',
      fileName: '',
      fileSize: '',
      fileUrl: '',
    });

    toast.success('Document Uploaded Successfully', {
      description: `${newDoc.name} is now archived in live vault`,
    });
  };

  // Handle delete document
  const handleDeleteDocument = (id: string) => {
    try {
      const raw = localStorage.getItem('samko_deleted_doc_ids');
      const set = raw ? new Set(JSON.parse(raw)) : new Set();
      set.add(id);
      localStorage.setItem('samko_deleted_doc_ids', JSON.stringify(Array.from(set)));
    } catch {}
    const updated = documents.filter((d) => d.id !== id);
    saveDocuments(updated);
    if (previewDoc && previewDoc.id === id) {
      setPreviewDoc(null);
    }
    toast.success('Document Deleted', {
      description: 'Record permanently removed from repository.',
    });
    api.documents.delete(id).catch(() => {});
  };

  if (user.roleLevel === 'L4') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-bold font-head text-foreground mb-2">
          Upload Vault Restricted
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          The Document Upload Vault is restricted for Viewers (L4). Viewers have read-only access to
          published documents in the Document Repository.
        </p>
        <button
          onClick={() => router.push('/document-repository')}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-colors"
        >
          Go to Document Repository
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Hidden file input for document replacement */}
      <input
        type="file"
        ref={replaceFileInputRef}
        onChange={handleFilePickedForReplace}
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
      />

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          className="p-4 rounded-xl border flex items-center justify-between"
          style={{ background: 'var(--surface)', borderColor: 'rgba(61,214,140,0.25)' }}
        >
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Compliant Documents
            </span>
            <div className="text-2xl font-bold font-head text-emerald-400 mt-1">
              {compliantCount}
            </div>
            <span className="text-[11px] text-muted-foreground">Valid & Certified</span>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div
          className="p-4 rounded-xl border flex items-center justify-between"
          style={{ background: 'var(--surface)', borderColor: 'rgba(245,158,11,0.25)' }}
        >
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Expiring Soon
            </span>
            <div className="text-2xl font-bold font-head text-amber-400 mt-1">{dueSoonCount}</div>
            <span className="text-[11px] text-muted-foreground">Renewal Within 90 Days</span>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/15 text-amber-400">
            <Clock size={20} />
          </div>
        </div>

        <div
          className="p-4 rounded-xl border flex items-center justify-between"
          style={{ background: 'var(--surface)', borderColor: 'rgba(244,63,94,0.25)' }}
        >
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Expired / Overdue
            </span>
            <div className="text-2xl font-bold font-head text-rose-400 mt-1">{overdueCount}</div>
            <span className="text-[11px] text-muted-foreground">Immediate Re-audit Needed</span>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/15 text-rose-400">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div
          className="p-4 rounded-xl border border-border flex items-center justify-between"
          style={{ background: 'var(--surface)' }}
        >
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Total Real Documents
            </span>
            <div className="text-2xl font-bold font-head text-foreground mt-1">
              {documents.length}
            </div>
            <span className="text-[11px] text-muted-foreground">
              Across All {liveProperties.length} Sites
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.05] text-primary">
            <FolderOpen size={20} />
          </div>
        </div>
      </div>

      {/* Main Filter & Action Surface */}
      <div
        className="rounded-2xl border border-border overflow-hidden"
        style={{ background: 'var(--surface)' }}
      >
        {/* Action Header */}
        <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          {/* Search Bar */}
          <div
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border flex-1 min-w-64 max-w-md"
            style={{ background: 'var(--surface2)' }}
          >
            <Search size={15} className="text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents by name, property, category..."
              className="bg-transparent text-xs text-foreground outline-none w-full"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Action & Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Property Filter */}
            <CustomDropdown
              value={filterProperty}
              onChange={setFilterProperty}
              options={propertyOptions.map((name) => ({ value: name, label: name }))}
              placeholder="All Properties"
              label="All Properties"
              size="sm"
              variant="filter"
              multiple
            />

            {/* Category Filter */}
            <CustomDropdown
              value={filterCategory}
              onChange={setFilterCategory}
              options={allCategories.map((c) => ({ value: c, label: c }))}
              placeholder="All Categories"
              allLabel="All Categories"
              size="sm"
              variant="filter"
            />

            {/* Manage / Add Category Button */}
            <button
              type="button"
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:border-primary text-xs font-semibold transition-all cursor-pointer"
              style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
            >
              <Tag size={13} className="text-primary" /> Manage Categories
            </button>

            {/* Upload Document Button */}
            {canUpload && (
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="samko-btn-primary flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                <Plus size={14} /> Upload Document
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-black/10 overflow-x-auto">
          {[
            { id: 'all', label: 'All Documents', count: documents.length },
            { id: 'ok', label: 'Compliant', count: compliantCount, color: '#3dd68c' },
            { id: 'warning', label: 'Due Soon', count: dueSoonCount, color: '#f59e0b' },
            { id: 'critical', label: 'Overdue', count: overdueCount, color: '#f43f5e' },
          ].map((tab) => {
            const isActive = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-black font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-muted-foreground'
                  }`}
                  style={!isActive && tab.color ? { color: tab.color } : {}}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Documents Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className="border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider"
                style={{ background: 'var(--surface2)' }}
              >
                <th className="py-3 px-4">Document Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Property / Site</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Uploaded Date</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <p className="font-medium">No documents found in this view.</p>
                    <p className="text-[11px] mt-1">
                      Try adjusting your filters or upload a new certificate.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedDocuments.map((doc) => {
                  const isCompliant = doc.status === 'ok';
                  const isDueSoon = doc.status === 'warning';
                  const isOverdue = doc.status === 'critical';

                  const badgeBg = isCompliant
                    ? 'rgba(61,214,140,0.14)'
                    : isDueSoon
                      ? 'rgba(245,158,11,0.14)'
                      : 'rgba(244,63,94,0.14)';
                  const badgeColor = isCompliant ? '#3dd68c' : isDueSoon ? '#f59e0b' : '#f43f5e';
                  const label = isCompliant ? 'Compliant' : isDueSoon ? 'Due Soon' : 'Overdue';

                  return (
                    <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* Document Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/10 text-primary flex-shrink-0">
                            <FileText size={14} />
                          </div>
                          <div>
                            <span className="font-medium text-foreground block truncate max-w-xs">
                              {doc.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono block mt-0.5">
                              {doc.fileName || `${doc.name}.pdf`} &bull; {doc.size || '2.1 MB'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'var(--surface3)', color: 'var(--text2)' }}
                        >
                          {doc.category}
                        </span>
                      </td>

                      {/* Property */}
                      <td className="py-3 px-4 text-muted-foreground truncate max-w-[180px]">
                        {doc.site}
                      </td>

                      {/* Version */}
                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                        {doc.version}
                      </td>

                      {/* Uploaded Date */}
                      <td className="py-3 px-4 text-muted-foreground text-[11px]">
                        <div>{doc.uploaded || 'Recently'}</div>
                        <div className="text-[10px] opacity-75 truncate max-w-[110px]">
                          {doc.uploadedBy || 'Administrator'}
                        </div>
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                        {doc.expiry}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5"
                          style={{
                            background: badgeBg,
                            color: badgeColor,
                            border: `1px solid ${badgeColor}33`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: badgeColor }}
                          />
                          {label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Eye View Button */}
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-white/[0.06] transition-colors cursor-pointer"
                            title="View Document Preview"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Replace Document Button */}
                          {canUpload && (
                            <button
                              type="button"
                              onClick={() => {
                                setReplacingDocId(doc.id);
                                replaceFileInputRef.current?.click();
                              }}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-white/[0.06] transition-colors cursor-pointer"
                              title="Replace Document File"
                            >
                              <CloudUpload size={14} />
                            </button>
                          )}

                          {/* Real Download Button */}
                          <button
                            type="button"
                            onClick={() => {
                              const { url, filename } = createRealDocumentBlob(doc);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = filename;
                              a.click();
                              toast.success('Download Initiated', { description: filename });
                            }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors cursor-pointer"
                            title="Download PDF File"
                          >
                            <Download size={14} />
                          </button>

                          {/* Delete Document Button */}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDocToDelete(doc)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Document"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Loading Pagination Bar */}
        <LoadingPagination
          currentPage={docsCurrentPage}
          totalRecords={docsTotalRecords}
          pageSize={docsPageSize}
          onPageChange={changeDocsPage}
          onPageSizeChange={changeDocsPageSize}
          isLoading={isDocsLoading}
          recordName="documents"
        />
      </div>

      {/* ── LIVE DOCUMENT PREVIEW MODAL ── */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[92vh] rounded-2xl border border-border overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-border"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/15 text-primary">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base text-foreground">
                    {previewDoc.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {previewDoc.fileName || `${previewDoc.name}.pdf`} &bull; {previewDoc.site}{' '}
                    &bull; {previewDoc.category}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Meta Grid */}
              <div
                className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-xl border border-border"
                style={{ background: 'var(--surface2)' }}
              >
                <div>
                  <span className="text-[11px] text-muted-foreground block uppercase font-semibold">
                    Uploaded By
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {previewDoc.uploadedBy || 'Administrator'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block uppercase font-semibold">
                    Date Uploaded
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {previewDoc.uploaded || 'Recently'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block uppercase font-semibold">
                    Statutory Expiry
                  </span>
                  <span className="text-xs font-medium text-foreground font-mono">
                    {previewDoc.expiry}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block uppercase font-semibold">
                    Compliance Status
                  </span>
                  <span
                    className="inline-block mt-0.5 text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background:
                        previewDoc.status === 'ok'
                          ? 'rgba(61,214,140,0.15)'
                          : previewDoc.status === 'warning'
                            ? 'rgba(245,158,11,0.15)'
                            : 'rgba(244,63,94,0.15)',
                      color:
                        previewDoc.status === 'ok'
                          ? '#3dd68c'
                          : previewDoc.status === 'warning'
                            ? '#f59e0b'
                            : '#f43f5e',
                    }}
                  >
                    {previewDoc.status === 'ok'
                      ? 'COMPLIANT'
                      : previewDoc.status === 'warning'
                        ? 'DUE SOON'
                        : 'EXPIRED'}
                  </span>
                </div>
              </div>

              {/* Document Live Viewer Surface */}
              <div className="rounded-xl border border-border overflow-hidden bg-black/40 min-h-[360px] flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface3 text-xs flex-wrap gap-2">
                  <span className="font-mono text-foreground font-semibold truncate max-w-xs sm:max-w-md">
                    {previewDoc.fileName || `${previewDoc.name}.pdf`}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const blob = createRealDocumentBlob(previewDoc);
                        openDocumentInNewTab(blob.url, previewDoc.name);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary text-black hover:bg-primary/90 transition-all cursor-pointer shadow-sm active:scale-95"
                      title="Open full document in a new browser tab"
                    >
                      <ExternalLink size={12} />
                      <span>Open in New Tab</span>
                    </button>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primary/20 text-primary">
                      Live PDF Document
                    </span>
                  </div>
                </div>

                <iframe
                  src={createRealDocumentBlob(previewDoc).url}
                  title={previewDoc.name}
                  className="w-full h-[380px] border-0"
                />
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div
              className="px-6 py-4 border-t border-border flex items-center justify-between flex-wrap gap-2"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-2">
                {/* Replace Document Button */}
                {canUpload && (
                  <button
                    type="button"
                    onClick={() => {
                      setReplacingDocId(previewDoc.id);
                      replaceFileInputRef.current?.click();
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-border hover:border-primary transition-colors cursor-pointer"
                    style={{ background: 'var(--surface3)', color: 'var(--foreground)' }}
                  >
                    <CloudUpload size={14} className="text-primary" /> Replace Document
                  </button>
                )}

                {/* Delete Document Button */}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = previewDoc;
                      setPreviewDoc(null);
                      setDocToDelete(target);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} /> Delete Document
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Print Button */}
                <button
                  type="button"
                  onClick={() => {
                    const printWin = window.open('', '_blank');
                    if (printWin) {
                      printWin.document.write(
                        `<html><head><title>${previewDoc.name}</title></head><body style="font-family:sans-serif;padding:30px;"><h2>${previewDoc.name}</h2><p>Property: ${previewDoc.site}</p><p>Category: ${previewDoc.category}</p><p>Status: ${previewDoc.status}</p><p>Expiry: ${previewDoc.expiry}</p><p>Uploaded by: ${previewDoc.uploadedBy}</p></body></html>`
                      );
                      printWin.document.close();
                      printWin.focus();
                      printWin.print();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-white/[0.05] transition-colors cursor-pointer"
                  style={{ background: 'var(--surface3)', color: 'var(--foreground)' }}
                >
                  <Printer size={14} /> Print
                </button>

                {/* Real Download Button */}
                <button
                  type="button"
                  onClick={() => {
                    const { url, filename } = createRealDocumentBlob(previewDoc);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.click();
                    toast.success('Document Download Started', { description: filename });
                  }}
                  className="samko-btn-primary flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Download size={14} /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── UPLOAD DOCUMENT MODAL ── */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }}
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-border"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/20 text-primary">
                  <CloudUpload size={16} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base text-foreground">
                    Upload Compliance Document
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Saves directly to live document vault across portfolio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveUpload} className="p-6 space-y-4">
              {/* Document File Dropzone with Live Instant Preview */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Select Document File *
                </label>
                <div
                  className="border-2 border-dashed border-border rounded-xl p-5 text-center cursor-pointer hover:border-primary transition-colors"
                  style={{ background: 'var(--surface2)' }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg';
                    input.onchange = (e) => {
                      const f = (e.target as HTMLInputElement).files?.[0];
                      if (f) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setUploadForm({
                            ...uploadForm,
                            name:
                              uploadForm.name || f.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
                            fileName: f.name,
                            fileSize: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
                            fileUrl: ev.target?.result as string,
                          });
                        };
                        reader.readAsDataURL(f);
                      }
                    };
                    input.click();
                  }}
                >
                  <CloudUpload size={26} className="mx-auto text-primary mb-1.5 opacity-80" />
                  <p className="text-xs font-medium text-foreground">
                    {uploadForm.fileName
                      ? uploadForm.fileName
                      : 'Click to select PDF or drag & drop file here'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {uploadForm.fileSize
                      ? `Size: ${uploadForm.fileSize}`
                      : 'PDF, DOC, XLS, PNG, JPG (Max 25MB)'}
                  </p>
                </div>
              </div>

              {/* Document Name */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                  Document Name *
                </label>
                <input
                  type="text"
                  required
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  placeholder="e.g. Gas Safety Inspection Certificate 2026"
                  className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>

              {/* Property & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                    Property *
                  </label>
                  <CustomDropdown
                    value={uploadForm.property}
                    onChange={(val) => setUploadForm({ ...uploadForm, property: val })}
                    options={propertyOptions.map((name) => ({ value: name, label: name }))}
                    placeholder="Select Property"
                    variant="form"
                    width="100%"
                    searchable
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                    Category *
                  </label>
                  <CustomDropdown
                    value={uploadForm.category}
                    onChange={(val) => setUploadForm({ ...uploadForm, category: val })}
                    options={allCategories.map((c) => ({ value: c, label: c }))}
                    placeholder="Select Category"
                    variant="form"
                    width="100%"
                    searchable
                  />
                </div>
              </div>

              {/* Expiry Date & Version */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={uploadForm.expiryDate}
                    onChange={(e) => setUploadForm({ ...uploadForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                    Version
                  </label>
                  <input
                    type="text"
                    value={uploadForm.version}
                    onChange={(e) => setUploadForm({ ...uploadForm, version: e.target.value })}
                    placeholder="e.g. v1.0"
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-white/[0.05] transition-colors"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="samko-btn-primary flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold"
                >
                  Save & Archive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MANAGE CATEGORIES MODAL (WITH × CHIP DELETE & ADD CATEGORY) ── */}
      {showCategoryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }}
          onClick={() => setShowCategoryModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-border"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/20 text-primary">
                  <Tag size={16} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base text-foreground">
                    Manage Document Categories
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Add new categories or delete obsolete options across the app
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Existing Categories with × delete chips */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  Active Categories ({allCategories.length})
                </label>
                <div
                  className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 rounded-xl border border-border/70"
                  style={{ background: 'var(--surface2)' }}
                >
                  {allCategories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-border"
                      style={{ background: 'var(--surface3)', color: 'var(--foreground)' }}
                    >
                      <span>{cat}</span>
                      <button
                        type="button"
                        onClick={() => setCategoryToDelete(cat)}
                        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-400 text-muted-foreground transition-colors cursor-pointer"
                        title={`Delete "${cat}"`}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Add New Category Input */}
              <div className="pt-2 border-t border-border">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Add New Category
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                    placeholder="e.g. Energy Performance (EPC)"
                    className="flex-1 px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="samko-btn-primary flex items-center gap-1 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-white/[0.05] transition-colors"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE DOCUMENT CONFIRMATION MODAL ── */}
      <ConfirmDeleteModal
        isOpen={Boolean(docToDelete)}
        onClose={() => setDocToDelete(null)}
        onConfirm={async () => {
          if (!docToDelete) return;
          setIsDeleting(true);
          try {
            handleDeleteDocument(docToDelete.id);
          } finally {
            setIsDeleting(false);
            setDocToDelete(null);
          }
        }}
        title="Delete Document"
        itemIdentifier={docToDelete?.fileName || docToDelete?.name}
        itemName={docToDelete?.name || 'Document'}
        registerName="Docs Upload Vault"
        customWarning="Are you sure you want to permanently delete this document from the vault? This cannot be undone."
        isDeleting={isDeleting}
        confirmButtonText="Delete Document"
      />

      {/* ── DELETE CATEGORY CONFIRMATION MODAL ── */}
      <ConfirmDeleteModal
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (!categoryToDelete) return;
          handleDeleteCategory(categoryToDelete);
          setCategoryToDelete(null);
        }}
        title="Delete Category"
        itemName={categoryToDelete || 'Category'}
        registerName="document categories"
        confirmButtonText="Delete Category"
        customWarning={`Are you sure you want to delete the category "${categoryToDelete}"? All existing documents with this category will safely stay in the database. Only this category option will be removed from the dropdown list.`}
      />
    </div>
  );
}
