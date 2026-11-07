'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Upload, FileText, X, Download, Eye, Edit2, Trash2, CloudUpload, ChevronDown, CheckCircle2, Clock, Tag, RefreshCw, Printer } from 'lucide-react';
import { DOCUMENTS, daysUntil, formatDateGB, type Document, type DocStatus } from '@/lib/mockData';
import { DEPARTMENTS } from '@/lib/assetData';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import PageCMSEditButton from '@/components/cms/PageCMSEditButton';
import { useDeepPageCms, DEFAULT_DOCUMENT_CATEGORIES, addDropdownOption, removeDropdownOptionByName } from '@/lib/deepPageCms';
import LoadingPagination from '@/components/ui/LoadingPagination';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import { useLoadingPagination } from '@/hooks/useLoadingPagination';
import CustomDropdown from '@/components/ui/CustomDropdown';
import TableCheckbox from '@/components/ui/TableCheckbox';
import BulkActionBar from '@/components/ui/BulkActionBar';

const DEFAULT_CATEGORIES = ['All', ...Array.from(new Set(DOCUMENTS.map((d) => d.category))).sort()];
const DEFAULT_SITES = ['All Sites', ...Array.from(new Set(DOCUMENTS.map((d) => d.site))).sort()];
const STATUS_FILTERS = ['All', 'critical', 'warning', 'ok'];

interface UploadFormValues {
  documentName: string;
  site: string;
  category: string;
  department?: string;
  expiryDate: string;
  version: string;
  notes: string;
}


function createRealDocumentBlob(doc: Document): { url: string; filename: string } {
  if (doc.fileUrl) {
    return {
      url: doc.fileUrl,
      filename: doc.fileName || `${doc.name.replace(/[^a-z0-9_-]/gi, '_')}.pdf`,
    };
  }

  const safeName = (doc.name || 'Compliance_Document').replace(/[()]/g, '');
  const safeSite = (doc.site || 'Samko Property').replace(/[()]/g, '');
  const safeCat = (doc.category || 'General').replace(/[()]/g, '');
  const safeExpiry = (doc.expiry || '').replace(/[()]/g, '');
  const safeBy = (doc.uploadedBy || 'Marcus Webb').replace(/[()]/g, '');
  const safeDate = new Date().toLocaleDateString('en-GB');

  const streamContent = `BT\n/F1 18 Tf\n50 720 Td\n(SAMKO CENTRAL UK - STATUTORY COMPLIANCE) Tj\n/F1 14 Tf\n0 -36 Td\n(Title: ${safeName}) Tj\n/F1 11 Tf\n0 -26 Td\n(Property / Site: ${safeSite}) Tj\n0 -20 Td\n(Category: ${safeCat}) Tj\n0 -20 Td\n(Document Version: ${doc.version || 'v1.0'}) Tj\n0 -20 Td\n(Expiry Date: ${safeExpiry}) Tj\n0 -20 Td\n(Verified By: ${safeBy}) Tj\n0 -20 Td\n(Archive Verified Date: ${safeDate}) Tj\n0 -32 Td\n(Status: STATUTORY AUDIT VERIFIED AND COMPLIANT) Tj\nET`;

  const streamLength = streamContent.length;
  const pdfSource = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000224 00000 n \n0000000500 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n600\n%%EOF`;

  const blob = new Blob([pdfSource], { type: 'application/pdf' });
  return {
    url: URL.createObjectURL(blob),
    filename: `${doc.name.replace(/[^a-z0-9_-]/gi, '_')}.pdf`,
  };
}

export default function DocumentRepositoryClient() {
  const { isViewer, canEdit, canUpload, canDelete, canWriteTab, isPropertyAccessible } = useAuth();
  const hasWriteAccess = !isViewer && canEdit && canWriteTab('documents');
  const hasDeleteAccess = !isViewer && canDelete && canWriteTab('documents');
  const { dropdowns: cmsDropdowns } = useDeepPageCms('documents');
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('samko_repository_documents');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDocuments(parsed);
          }
        }
      } catch { }
    };
    window.addEventListener('samko:doc_approved', handleSync);
    window.addEventListener('samko:approvals-changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('samko:doc_approved', handleSync);
      window.removeEventListener('samko:approvals-changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const [documents, setDocuments] = useState<Document[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('samko_repository_documents');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const enriched = parsed.map((doc: any) => {
              const isFood =
                (doc.name && doc.name.toLowerCase().includes('food')) ||
                (doc.category && doc.category.toLowerCase().includes('food'));
              const isUserUpload =
                String(doc.id).startsWith('doc-17') ||
                String(doc.id).startsWith('doc-food');
              const status = doc.approvalStatus || (isFood || isUserUpload ? 'pending' : 'approved');
              return {
                ...doc,
                department: doc.department || (isFood ? 'Kitchen' : 'Maintenance'),
                approvalStatus: status,
              };
            });
            try {
              localStorage.setItem('samko_repository_documents', JSON.stringify(enriched));
              const pendingCount = enriched.filter((d: any) => d.approvalStatus === 'pending' || d.approvalStatus === 'hold').length;
              localStorage.setItem('samko_approvals_count', String(pendingCount));
            } catch { }
            return enriched;
          }
        }
      } catch { }
    }
    return DOCUMENTS;
  });
  const [properties, setProperties] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [siteFilter, setSiteFilter] = useState('All Sites');
  const [statusFilter, setStatusFilter] = useState('All');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [editName, setEditName] = useState('');
  const [editSite, setEditSite] = useState('');
  const [editDept, setEditDept] = useState('Kitchen');
  const [editCategory, setEditCategory] = useState('Food Hygiene');
  const [editExpiry, setEditExpiry] = useState('');
  const [editVersion, setEditVersion] = useState('v1.0');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<DocStatus>('ok');
  const [editApprovalStatus, setEditApprovalStatus] = useState<'pending' | 'hold' | 'approved'>('pending');

  const handleOpenEditDoc = (doc: Document) => {
    setEditingDoc(doc);
    setEditName(doc.name);
    setEditSite(doc.site);
    setEditDept(doc.department || 'Kitchen');
    setEditCategory(doc.category || 'Food Hygiene');
    setEditExpiry(doc.expiry || '');
    setEditVersion(doc.version || 'v1.0');
    setEditNotes(doc.approvalNotes || doc.notes || '');
    setEditStatus(doc.status || 'ok');
    setEditApprovalStatus(doc.approvalStatus || 'pending');
  };

  const handleSaveEditDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    if (!editName.trim()) {
      toast.error('Document title is required');
      return;
    }

    const updated = documents.map((d) => {
      if (d.id === editingDoc.id) {
        return {
          ...d,
          name: editName.trim(),
          site: editSite || d.site,
          department: editDept || d.department,
          category: editCategory || d.category,
          expiry: editExpiry || d.expiry,
          version: editVersion.trim() || d.version || 'v1.0',
          status: editStatus,
          approvalStatus: editApprovalStatus,
          approvalNotes: editNotes.trim() || d.approvalNotes,
        };
      }
      return d;
    });

    setDocuments(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('samko_repository_documents', JSON.stringify(updated));
        const pendingCount = updated.filter((d: any) => d.approvalStatus === 'pending' || d.approvalStatus === 'hold').length;
        localStorage.setItem('samko_approvals_count', String(pendingCount));
        window.dispatchEvent(new CustomEvent('samko:doc_approved', { detail: { documents: updated } }));
        window.dispatchEvent(new CustomEvent('samko:approvals-changed', { detail: { count: pendingCount } }));
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'documents' } }));
      } catch { }
    }

    toast.success('Document updated successfully', {
      description: `"${editName.trim()}" details updated.`,
    });
    setEditingDoc(null);
  };

  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  const [catToDelete, setCatToDelete] = useState<string | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isBulkDeletingDocs, setIsBulkDeletingDocs] = useState(false);
  const [showBulkDeleteDocsModal, setShowBulkDeleteDocsModal] = useState(false);
  const [selectedDocTypeFilter, setSelectedDocTypeFilter] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [uploadedFileObj, setUploadedFileObj] = useState<File | null>(null);
  const [uploadedFileDataUrl, setUploadedFileDataUrl] = useState<string>('');
  const [filePreviewModalOpen, setFilePreviewModalOpen] = useState(false);
  const [sortCol, setSortCol] = useState<'name' | 'expiry' | 'days' | 'site'>('days');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('samko_document_categories');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch { }
    }
    return [];
  });

  const categoryDropdown = (cmsDropdowns || []).find((d) => d.id === 'category');
  const allCategories = useMemo(() => {
    const cmsOptions = categoryDropdown?.options || [];
    const deleted = new Set((categoryDropdown?.deletedOptions || []).map((o) => o.toLowerCase()));
    const merged = new Set<string>();

    cmsOptions.forEach((c) => {
      const clean = c.trim();
      if (clean && !clean.toLowerCase().startsWith('all ') && clean.toLowerCase() !== 'all' && !deleted.has(clean.toLowerCase())) {
        merged.add(clean);
      }
    });

    DEFAULT_DOCUMENT_CATEGORIES.forEach((c) => {
      const clean = c.trim();
      if (!deleted.has(clean.toLowerCase())) {
        merged.add(clean);
      }
    });

    customCategories.forEach((c) => {
      const clean = c.trim();
      if (!deleted.has(clean.toLowerCase())) {
        merged.add(clean);
      }
    });

    return Array.from(merged).sort();
  }, [categoryDropdown, customCategories]);

  const filterCategories = useMemo(() => {
    return ['All', ...allCategories];
  }, [allCategories]);

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#e8c97a');

  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null);

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    addDropdownOption('documents', 'category', trimmed);
    if (!customCategories.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('samko_document_categories', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'document_category', name: trimmed } }));
      }
    }
    toast.success('Category created', { description: `Added "${trimmed}" to document categories` });
    setNewCatName('');
  };

  const handleDeleteCategory = (catName: string) => {
    removeDropdownOptionByName('documents', 'category', catName);
    const updated = customCategories.filter((c) => c.toLowerCase() !== catName.toLowerCase());
    setCustomCategories(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('samko_document_categories', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'document_category_deleted', name: catName } }));
    }
    if (categoryFilter === catName) setCategoryFilter('All');
    toast.success(`Removed category "${catName}"`);
  };

  const handleReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingDocId) return;
    const computedSize = file.size > 1048576
      ? `${(file.size / 1048576).toFixed(1)} MB`
      : `${Math.max(1, Math.round(file.size / 1024))} KB`;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setDocuments((prev) => {
        const updated = prev.map((d) => {
          if (d.id !== replacingDocId) return d;
          const vMatch = d.version?.match(/v?(\d+)(\.(\d+))?/i);
          let nextVer = 'v1.1';
          if (vMatch) {
            const major = parseInt(vMatch[1] || '1', 10);
            const minor = parseInt(vMatch[3] || '0', 10) + 1;
            nextVer = `v${major}.${minor}`;
          }
          const upDoc: Document = {
            ...d,
            fileName: file.name,
            fileUrl: dataUrl,
            fileType: file.type || 'application/pdf',
            size: computedSize,
            version: nextVer,
            uploaded: new Date().toISOString().slice(0, 10),
          };
          if (previewDoc && previewDoc.id === d.id) {
            setPreviewDoc(upDoc);
          }
          return upDoc;
        });
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('samko_repository_documents', JSON.stringify(updated));
          } catch { }
        }
        return updated;
      });
      toast.success('Document Replaced Successfully', { description: `New file: ${file.name}` });
      setReplacingDocId(null);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };


  const fetchDocuments = useCallback(async () => {
    try {
      const [docRes, propRes] = await Promise.allSettled([
        api.documents.getAll(),
        api.properties.getAll(),
      ]);
      if (docRes.status === 'fulfilled' && docRes.value.success && docRes.value.data?.length > 0) {
        if (typeof window !== 'undefined') {
          try {
            const saved = localStorage.getItem('samko_repository_documents');
            if (saved) {
              const parsed = JSON.parse(saved);
              const customOnly = parsed.filter((p: any) => p.fileUrl || p.id?.startsWith('doc-17'));
              const merged = [...customOnly, ...docRes.value.data.filter((d: any) => !customOnly.some((c: any) => c.id === d.id))];
              setDocuments(merged);
              return;
            }
          } catch { }
        }
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
    const raw = properties.length === 0 ? DEFAULT_SITES : ['All Sites', ...Array.from(new Set([...properties.map((p) => p.name), ...DEFAULT_SITES.filter(s => s !== 'All Sites')]))];
    return raw.filter((s) => s === 'All Sites' || isPropertyAccessible(s));
  }, [properties, isPropertyAccessible]);

  const accessibleDocuments = useMemo(() => {
    return documents.filter((d) => isPropertyAccessible(d.site || (d as any).property || (d as any).hotel));
  }, [documents, isPropertyAccessible]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
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
    let docs = accessibleDocuments;
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
    if (departmentFilter !== 'All Departments') docs = docs.filter((d) => (d.department || 'Maintenance') === departmentFilter);
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
  }, [accessibleDocuments, search, categoryFilter, siteFilter, statusFilter, sortCol, sortDir]);

  const {
    currentPage,
    pageSize,
    totalRecords,
    paginatedItems: paginatedDocs,
    isPageLoading,
    changePage,
    changePageSize,
  } = useLoadingPagination(filtered, 10);

  const isAllDocsPageSelected =
    paginatedDocs.length > 0 && paginatedDocs.every((d) => selectedDocIds.includes(d.id));
  const isSomeDocsPageSelected =
    paginatedDocs.some((d) => selectedDocIds.includes(d.id)) && !isAllDocsPageSelected;

  const handleToggleSelectAllDocsPage = () => {
    if (isAllDocsPageSelected) {
      const pageIds = new Set(paginatedDocs.map((d) => d.id));
      setSelectedDocIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = paginatedDocs.map((d) => d.id);
      setSelectedDocIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleDocSelect = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleSelectAllFilteredDocs = () => {
    setSelectedDocIds(filtered.map((d) => d.id));
  };

  const handleClearDocSelection = () => {
    setSelectedDocIds([]);
    setSelectedDocTypeFilter('');
  };

  const docTypeOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((d) => {
      counts[`cat:${d.category}`] = (counts[`cat:${d.category}`] || 0) + 1;
      counts[`site:${d.site}`] = (counts[`site:${d.site}`] || 0) + 1;
      counts[`status:${d.status}`] = (counts[`status:${d.status}`] || 0) + 1;
    });

    const opts: { label: string; value: string; count: number }[] = [];
    allCategories.forEach((cat) => {
      if (counts[`cat:${cat}`]) {
        opts.push({ label: `Category: ${cat}`, value: `cat:${cat}`, count: counts[`cat:${cat}`] });
      }
    });
    sitesList.filter((s) => s !== 'All Sites').forEach((site) => {
      if (counts[`site:${site}`]) {
        opts.push({ label: `Property: ${site}`, value: `site:${site}`, count: counts[`site:${site}`] });
      }
    });
    if (counts['status:critical']) opts.push({ label: 'Status: Overdue', value: 'status:critical', count: counts['status:critical'] });
    if (counts['status:warning']) opts.push({ label: 'Status: Due Soon', value: 'status:warning', count: counts['status:warning'] });
    if (counts['status:ok']) opts.push({ label: 'Status: Compliant', value: 'status:ok', count: counts['status:ok'] });

    return opts;
  }, [filtered, allCategories, sitesList]);

  const handleSelectDocByType = (typeKey: string) => {
    setSelectedDocTypeFilter(typeKey);
    if (!typeKey) {
      setSelectedDocIds([]);
      return;
    }
    const [kind, val] = typeKey.split(':');
    const matched = filtered.filter((d) => {
      if (kind === 'cat') return d.category === val;
      if (kind === 'site') return d.site === val;
      if (kind === 'status') return d.status === val;
      return false;
    });
    setSelectedDocIds(matched.map((d) => d.id));
    toast.info(`Selected ${matched.length} documents matching ${typeKey.replace(':', ': ')}`);
  };

  const handleConfirmBulkDeleteDocs = async () => {
    if (selectedDocIds.length === 0) return;
    setIsBulkDeletingDocs(true);
    try {
      const ids = [...selectedDocIds];
      const count = ids.length;

      setDocuments((prev) => prev.filter((d) => !ids.includes(d.id)));
      setSelectedDocIds([]);
      setSelectedDocTypeFilter('');
      setShowBulkDeleteDocsModal(false);

      await Promise.allSettled(ids.map((id) => api.documents.delete(id)));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'documents' } }));
      }

      toast.success(`Deleted ${count} documents successfully!`);
    } catch (err: any) {
      toast.error('Bulk delete encountered an issue', { description: err?.message });
    } finally {
      setIsBulkDeletingDocs(false);
    }
  };

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
    const { url, filename } = createRealDocumentBlob(doc);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started', { description: filename });
  };

  const handleUpload = handleSubmit(async (data) => {
    const days = daysUntil(data.expiryDate);
    const status: DocStatus = days < 0 ? 'critical' : days <= 30 ? 'warning' : 'ok';
    const computedSize = uploadedFileObj
      ? uploadedFileObj.size > 1048576
        ? `${(uploadedFileObj.size / 1048576).toFixed(1)} MB`
        : `${Math.max(1, Math.round(uploadedFileObj.size / 1024))} KB`
      : '1.4 MB';

    const targetDept = data.department || (data.category?.toLowerCase().includes('food') || data.documentName?.toLowerCase().includes('food') ? 'Kitchen' : 'Maintenance');

    const docPayload: Document = {
      id: `doc-${Date.now()}`,
      name: data.documentName,
      site: data.site,
      department: targetDept,
      category: data.category,
      expiry: data.expiryDate,
      status,
      version: data.version || 'v1.0',
      size: computedSize,
      uploaded: new Date().toISOString().slice(0, 10),
      uploadedBy: 'Marcus Webb',
      fileUrl: uploadedFileDataUrl || undefined,
      fileName: uploadedFileObj?.name || `${data.documentName}.pdf`,
      fileType: uploadedFileObj?.type || 'application/pdf',
      approvalStatus: 'pending',
      approvalNotes: data.notes || `Uploaded document awaiting Super Admin or Digital Bot approval before dispatching to ${targetDept}.`,
    };

    setDocuments((prev) => {
      const updated = [docPayload, ...prev];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('samko_repository_documents', JSON.stringify(updated));
          const pendingCount = updated.filter((d: any) => d.approvalStatus === 'pending' || d.approvalStatus === 'hold').length;
          localStorage.setItem('samko_approvals_count', String(pendingCount));
        } catch { }
      }
      return updated;
    });

    toast.success('Document uploaded & sent to Approvals', {
      description: `${data.documentName} added to ${data.site} · Pending Super Admin / Digital Bot approval.`,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:doc_uploaded', {
          detail: { document: docPayload },
        })
      );
      window.dispatchEvent(
        new CustomEvent('samko:approvals-changed', {
          detail: { type: 'upload', doc: docPayload },
        })
      );
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
    setUploadedFileDataUrl('');
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

  const critCount = accessibleDocuments.filter((d) => d.status === 'critical').length;
  const warnCount = accessibleDocuments.filter((d) => d.status === 'warning').length;
  const okCount = accessibleDocuments.filter((d) => d.status === 'ok').length;

  return (
    <>
      {/* Summary KPI row */}
      <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total Documents', val: accessibleDocuments.length, color: 'var(--info)', bg: 'var(--info-bg)', top: 'var(--info)' },
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
        <CustomDropdown
          size="sm"
          variant="filter"
          value={siteFilter}
          onChange={(val) => setSiteFilter(val)}
          options={sitesList.map((s) => ({ value: s, label: s }))}
        />

        <div className="flex items-center gap-2 ml-auto">
          <PageCMSEditButton pageId="documents" pageName="Document Repository" />

          {canUpload && (
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border border-border transition-colors hover:border-primary"
              style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
            >
              <Tag size={13} style={{ color: 'var(--primary)' }} />
              Add Category
            </button>
          )}

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
        {filterCategories.map((c) => (
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
          Showing <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{filtered.length}</span> of {accessibleDocuments.length} documents
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
                  {hasDeleteAccess && (
                    <th className="table-header-cell" style={{ width: 44, textAlign: 'center' }}>
                      <TableCheckbox
                        checked={isAllDocsPageSelected}
                        indeterminate={isSomeDocsPageSelected}
                        onChange={handleToggleSelectAllDocsPage}
                        title="Select all documents on current page"
                      />
                    </th>
                  )}
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
                  <th className="table-header-cell">Department</th>
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
                  <th className="table-header-cell">Compliance</th>
                  <th className="table-header-cell">Approval Status</th>
                  <th className="table-header-cell">Version</th>
                  <th className="table-header-cell">Size</th>
                  <th className="table-header-cell">Uploaded By</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDocs.map((doc) => {
                  const days = daysUntil(doc.expiry);
                  const isFood = (doc.name && doc.name.toLowerCase().includes('food')) || (doc.category && doc.category.toLowerCase().includes('food'));
                  const dept = doc.department || (isFood ? 'Kitchen' : 'Maintenance');
                  return (
                    <tr
                      key={doc.id}
                      className={`table-row-hover ${selectedDocIds.includes(doc.id) ? 'bg-[#e8c97a]/5' : ''}`}
                    >
                      {hasDeleteAccess && (
                        <td className="table-cell" style={{ textAlign: 'center', width: 44 }}>
                          <TableCheckbox
                            checked={selectedDocIds.includes(doc.id)}
                            onChange={() => handleToggleDocSelect(doc.id)}
                            title={`Select ${doc.name}`}
                          />
                        </td>
                      )}
                      {/* 1. Document */}
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

                      {/* 2. Property */}
                      <td className="table-cell text-muted2" style={{ fontSize: 12 }}>
                        {doc.site}
                      </td>

                      {/* 3. Department */}
                      <td className="table-cell">
                        <span
                          className="rounded font-semibold"
                          style={{
                            background: 'rgba(232, 201, 122, 0.10)',
                            color: 'var(--primary)',
                            border: '1px solid rgba(232, 201, 122, 0.25)',
                            fontSize: 10.5,
                            padding: '2px 8px',
                            display: 'inline-block',
                          }}
                        >
                          {dept}
                        </span>
                      </td>

                      {/* 4. Category */}
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

                      {/* 5. Expiry Date */}
                      <td className="table-cell text-muted2" style={{ fontSize: 12 }}>
                        {formatDateGB(doc.expiry)}
                      </td>

                      {/* 6. Days Left */}
                      <td className="table-cell">
                        <span
                          className="font-head tabular-nums"
                          style={{ fontSize: 13, fontWeight: 700, color: daysColor(days) }}
                        >
                          {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                        </span>
                      </td>

                      {/* 7. Compliance */}
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
                          <CustomDropdown
                            size="sm"
                            variant="pill"
                            value={doc.status}
                            onChange={(val) => handleStatusChange(doc.id, val as DocStatus)}
                            options={[
                              { value: 'ok', label: 'Compliant', color: '#3dd68c' },
                              { value: 'warning', label: 'Due Soon', color: '#f59e0b' },
                              { value: 'critical', label: 'Overdue', color: '#f43f5e' },
                            ]}
                            style={{
                              background: doc.status === 'ok' ? 'rgba(61,214,140,0.12)' : doc.status === 'warning' ? 'rgba(245,158,11,0.12)' : 'rgba(244,63,94,0.12)',
                              color: doc.status === 'ok' ? '#3dd68c' : doc.status === 'warning' ? '#f59e0b' : '#f43f5e',
                              border: `1px solid ${doc.status === 'ok' ? '#3dd68c33' : doc.status === 'warning' ? '#f59e0b33' : '#f43f5e33'}`,
                            }}
                          />
                        )}
                      </td>

                      {/* 8. Approval Status */}
                      <td className="table-cell">
                        {doc.approvalStatus === 'approved' ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                            style={{
                              background: 'rgba(61,214,140,0.12)',
                              color: '#3dd68c',
                              border: '1px solid rgba(61,214,140,0.25)',
                            }}
                          >
                            <CheckCircle2 size={11} />
                            Approved
                          </span>
                        ) : doc.approvalStatus === 'hold' ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                            style={{
                              background: 'rgba(244,63,94,0.12)',
                              color: '#f43f5e',
                              border: '1px solid rgba(244,63,94,0.25)',
                            }}
                          >
                            <Clock size={11} />
                            On Hold
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                            style={{
                              background: 'rgba(245,158,11,0.12)',
                              color: '#f59e0b',
                              border: '1px solid rgba(245,158,11,0.25)',
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Pending Approval
                          </span>
                        )}
                      </td>

                      {/* 9. Version */}
                      <td className="table-cell text-muted2" style={{ fontSize: 11 }}>
                        {doc.version}
                      </td>

                      {/* 10. Size */}
                      <td className="table-cell text-muted3" style={{ fontSize: 11 }}>
                        {doc.size}
                      </td>

                      {/* 11. Uploaded By */}
                      <td className="table-cell text-muted2" style={{ fontSize: 12 }}>
                        {doc.uploadedBy}
                      </td>

                      {/* 12. Actions */}
                      <td className="table-cell">
                        <div className="flex items-center gap-1 opacity-100 transition-opacity">
                          <button
                            title="View document"
                            onClick={() => setPreviewDoc(doc)}
                            className="flex items-center justify-center rounded-lg transition-all"
                            style={{
                              width: 28,
                              height: 28,
                              background: 'rgba(232,201,122,0.12)',
                              border: '1px solid rgba(232,201,122,0.3)',
                              cursor: 'pointer',
                              color: 'var(--primary)',
                            }}
                          >
                            <Eye size={14} />
                          </button>
                          {hasWriteAccess && (
                            <button
                              title="Edit document"
                              onClick={() => handleOpenEditDoc(doc)}
                              className="flex items-center justify-center rounded-lg transition-all"
                              style={{
                                width: 28,
                                height: 28,
                                background: 'rgba(232,201,122,0.12)',
                                border: '1px solid rgba(232,201,122,0.3)',
                                cursor: 'pointer',
                                color: 'var(--primary)',
                              }}
                            >
                              <Edit2 size={13} />
                            </button>
                          )}
                          <button
                            title="Download real document"
                            onClick={() => handleDownload(doc)}
                            className="flex items-center justify-center rounded-lg transition-all"
                            style={{
                              width: 28,
                              height: 28,
                              background: 'rgba(61,214,140,0.12)',
                              border: '1px solid rgba(61,214,140,0.3)',
                              cursor: 'pointer',
                              color: '#3dd68c',
                            }}
                          >
                            <Download size={14} />
                          </button>
                          {hasDeleteAccess && (
                            <button
                              title="Delete document"
                              onClick={() => setDocToDelete(doc)}
                              className="flex items-center justify-center rounded-lg transition-all"
                              style={{
                                width: 28,
                                height: 28,
                                background: 'rgba(244,63,94,0.12)',
                                border: '1px solid rgba(244,63,94,0.3)',
                                cursor: 'pointer',
                                color: '#f43f5e',
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}</tbody>
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

      {/* Floating Bulk Action Bar (Only shown for authorized delete users) */}
      {hasDeleteAccess && (
        <div className="mt-4">
          <BulkActionBar
            selectedCount={selectedDocIds.length}
            totalCount={filtered.length}
            onClearSelection={handleClearDocSelection}
            onSelectAll={handleSelectAllFilteredDocs}
            onDeleteSelected={() => setShowBulkDeleteDocsModal(true)}
            typeOptions={docTypeOptions}
            onSelectByType={handleSelectDocByType}
            selectedTypeValue={selectedDocTypeFilter}
            typePlaceholder="Select all of type (Category, Property, Status)..."
            recordName="documents"
            isDeleting={isBulkDeletingDocs}
          />
        </div>
      )}

      {/* Document Detail Preview Modal */}
      {previewDoc && (
        <Modal
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.name}
          subtitle={`Details and visual document preview for ${previewDoc.site}`}
          width={780}
        >
          <div className="flex flex-col gap-4">
            {/* Visual Document Viewer Surface */}
            <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--surface2)' }}>
              {previewDoc.fileUrl ? (
                previewDoc.fileUrl.startsWith('data:image/') ||
                  ['.JPEG', '.JPG', '.PNG', '.WEBP', '.GIF', '.SVG'].some((ext) => (previewDoc.fileName || previewDoc.name || '').toUpperCase().endsWith(ext)) ? (
                  <div className="p-4 flex items-center justify-center bg-black/40 min-h-[300px]">
                    <img
                      src={previewDoc.fileUrl}
                      alt={previewDoc.name}
                      className="max-h-[420px] w-auto max-w-full object-contain rounded-lg shadow-md"
                    />
                  </div>
                ) : (
                  <div className="h-[430px] w-full bg-zinc-950 flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface3 text-xs">
                      <span className="font-mono text-foreground font-semibold truncate max-w-md">
                        {previewDoc.fileName || `${previewDoc.name}.pdf`}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primary/20 text-primary">
                        Live PDF Document Preview
                      </span>
                    </div>
                    <iframe
                      src={`${previewDoc.fileUrl}#toolbar=0`}
                      title={previewDoc.name}
                      className="w-full flex-1 border-0"
                    />
                  </div>
                )
              ) : (
                /* Fallback stylized official compliance certificate preview canvas */
                <div className="p-8 flex flex-col items-center justify-center text-center relative overflow-hidden" style={{ minHeight: 290, background: 'radial-gradient(ellipse at top, rgba(232,201,122,0.10) 0%, rgba(20,20,25,0.98) 75%)' }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}>
                    <FileText size={32} />
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2 border border-primary/30" style={{ background: 'rgba(232,201,122,0.10)', color: 'var(--primary)' }}>
                    Official Samko Statutory Compliance Certificate
                  </div>
                  <h3 className="font-head font-bold text-lg text-foreground max-w-lg">
                    {previewDoc.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    {previewDoc.site} · {previewDoc.category} · Valid through {formatDateGB(previewDoc.expiry)}
                  </p>
                  <div className="mt-5 flex items-center gap-4 text-[11px] text-muted-foreground border-t border-border/60 pt-3">
                    <span>Doc Ref: #{previewDoc.id.toUpperCase()}</span>
                    <span>•</span>
                    <span>Version: {previewDoc.version}</span>
                    <span>•</span>
                    <span>Audited by: {previewDoc.uploadedBy}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-xl border border-border" style={{ background: 'var(--surface2)' }}>
              <div>
                <span className="text-[11px] text-muted-foreground block mb-0.5">Property</span>
                <span className="text-xs font-medium text-foreground truncate block">{previewDoc.site}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block mb-0.5">Category</span>
                <span className="text-xs px-2 py-0.5 rounded font-semibold inline-block" style={{ background: 'var(--surface3)', color: 'var(--text2)' }}>
                  {previewDoc.category}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block mb-0.5">Expiry Date</span>
                <span className="text-xs font-medium text-foreground">{formatDateGB(previewDoc.expiry)}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block mb-0.5">Status</span>
                <div className="mt-0.5">
                  <CustomDropdown
                    size="sm"
                    variant="pill"
                    value={previewDoc.status}
                    onChange={(val) => handleStatusChange(previewDoc.id, val as DocStatus)}
                    options={[
                      { value: 'ok', label: 'Compliant', color: '#3dd68c' },
                      { value: 'warning', label: 'Due Soon', color: '#f59e0b' },
                      { value: 'critical', label: 'Overdue', color: '#f43f5e' },
                    ]}
                    style={{
                      background: previewDoc.status === 'ok' ? 'rgba(61,214,140,0.12)' : previewDoc.status === 'warning' ? 'rgba(245,158,11,0.12)' : 'rgba(244,63,94,0.12)',
                      color: previewDoc.status === 'ok' ? '#3dd68c' : previewDoc.status === 'warning' ? '#f59e0b' : '#f43f5e',
                      border: `1px solid ${previewDoc.status === 'ok' ? '#3dd68c33' : previewDoc.status === 'warning' ? '#f59e0b33' : '#f43f5e33'}`,
                    }}
                  />
                </div>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block mb-0.5">Version</span>
                <span className="text-xs font-medium text-foreground">{previewDoc.version}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block mb-0.5">File Size</span>
                <span className="text-xs font-medium text-foreground">{previewDoc.size}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block mb-0.5">Uploaded By</span>
                <span className="text-xs font-medium text-foreground">{previewDoc.uploadedBy}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block mb-0.5">Uploaded Date</span>
                <span className="text-xs font-medium text-foreground">{previewDoc.uploaded ? formatDateGB(previewDoc.uploaded) : 'Recently'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {hasWriteAccess && canUpload && (
                  <button
                    type="button"
                    onClick={() => {
                      setReplacingDocId(previewDoc.id);
                      replaceFileInputRef.current?.click();
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border hover:border-primary transition-colors cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <CloudUpload size={13} style={{ color: 'var(--primary)' }} /> Replace Document
                  </button>
                )}
                {hasDeleteAccess && (
                  <button
                    type="button"
                    onClick={() => setDocToDelete(previewDoc)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 cursor-pointer"
                  >
                    <Trash2 size={13} /> Delete Document
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const printWin = window.open('', '_blank');
                    if (printWin) {
                      printWin.document.write(`<html><head><title>${previewDoc.name}</title></head><body style="font-family:sans-serif;padding:30px;"><h2>${previewDoc.name}</h2><p>Property: ${previewDoc.site}</p><p>Category: ${previewDoc.category}</p><p>Expiry: ${previewDoc.expiry}</p><p>Uploaded by: ${previewDoc.uploadedBy}</p></body></html>`);
                      printWin.document.close();
                      printWin.focus();
                      printWin.print();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-white/[0.05] transition-colors cursor-pointer"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                >
                  <Printer size={13} /> Print
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(previewDoc)}
                  className="samko-btn-primary flex items-center gap-2 cursor-pointer"
                  style={{ fontSize: 13 }}
                >
                  <Download size={13} /> Download Document
                </button>
              </div>
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
              padding: selectedFile ? '14px 16px' : '26px 20px',
              cursor: selectedFile ? 'default' : 'pointer',
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
                const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
                const curName = (document.getElementById('upload-docname') as HTMLInputElement)?.value;
                if (!curName || curName.trim() === '') {
                  setValue('documentName', cleanName);
                }
                const reader = new FileReader();
                reader.onload = (ev) => {
                  setUploadedFileDataUrl(ev.target?.result as string);
                };
                reader.readAsDataURL(file);
              }
            }}
            onClick={() => {
              if (selectedFile) return;
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  setSelectedFile(file.name);
                  setUploadedFileObj(file);
                  const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
                  const curName = (document.getElementById('upload-docname') as HTMLInputElement)?.value;
                  if (!curName || curName.trim() === '') {
                    setValue('documentName', cleanName);
                  }
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    setUploadedFileDataUrl(ev.target?.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              };
              input.click();
            }}
          >
            {selectedFile ? (
              <div className="w-full flex items-center justify-between p-3 rounded-xl border border-primary/30" style={{ background: 'rgba(232,201,122,0.08)' }}>
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(232,201,122,0.20)', color: 'var(--primary)' }}>
                    <FileText size={20} />
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="text-foreground font-semibold text-sm truncate max-w-[280px]" title={selectedFile}>
                      {selectedFile}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {uploadedFileObj ? `${(uploadedFileObj.size / 1024).toFixed(0)} KB · Ready to attach` : 'File ready'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Eye preview button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (uploadedFileDataUrl) {
                        setFilePreviewModalOpen(true);
                      } else {
                        toast.info('Preview ready', { description: selectedFile });
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border hover:border-primary text-xs font-semibold text-muted-foreground hover:text-primary transition-all cursor-pointer"
                    style={{ background: 'var(--surface)' }}
                    title="Preview uploaded document"
                  >
                    <Eye size={13} />
                    <span>Preview</span>
                  </button>

                  {/* Change file button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
                      input.onchange = (ev) => {
                        const file = (ev.target as HTMLInputElement).files?.[0];
                        if (file) {
                          setSelectedFile(file.name);
                          setUploadedFileObj(file);
                          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
                          const curName = (document.getElementById('upload-docname') as HTMLInputElement)?.value;
                          if (!curName || curName.trim() === '') {
                            setValue('documentName', cleanName);
                          }
                          const reader = new FileReader();
                          reader.onload = (loadEv) => {
                            setUploadedFileDataUrl(loadEv.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                    className="p-1.5 rounded-lg border border-border hover:border-border-strong text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    style={{ background: 'var(--surface)' }}
                    title="Change file"
                  >
                    <CloudUpload size={14} />
                  </button>

                  {/* Delete / Clear file button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile('');
                      setUploadedFileObj(null);
                      setUploadedFileDataUrl('');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-500/25 hover:bg-rose-500/10 text-xs font-semibold text-rose-400 transition-all cursor-pointer"
                    style={{ background: 'var(--surface)' }}
                    title="Remove selected file"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div
                  className="flex items-center justify-center rounded-xl mx-auto mb-2"
                  style={{ width: 44, height: 44, background: 'rgba(232,201,122,0.10)' }}
                >
                  <CloudUpload size={20} style={{ color: 'var(--primary)' }} />
                </div>
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
              <CustomDropdown
                id="upload-site"
                variant="form"
                width="100%"
                value={watch('site') || sitesList.filter((s) => s !== 'All Sites')[0]}
                onChange={(val) => setValue('site', val)}
                options={sitesList.filter((s) => s !== 'All Sites').map((s) => ({ value: s, label: s }))}
              />
            </div>

            <div>
              <label className="samko-label" htmlFor="upload-cat">
                Category *
              </label>
              <CustomDropdown
                id="upload-cat"
                variant="form"
                width="100%"
                value={watch('category') || allCategories[0]}
                onChange={(val) => setValue('category', val)}
                options={allCategories.map((c) => ({ value: c, label: c }))}
              />
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

            {/* Edit Document Modal */}
            {editingDoc && (
              <Modal
                open={Boolean(editingDoc)}
                onClose={() => setEditingDoc(null)}
                title={`Edit Document: ${editingDoc.name}`}
                subtitle={`REF: ${editingDoc.id.toUpperCase()} · Update document metadata and settings`}
                width={650}
              >
                <form onSubmit={handleSaveEditDoc} className="space-y-4">
                  <div>
                    <label className="samko-label" htmlFor="edit-doc-name">
                      Document Title *
                    </label>
                    <input
                      id="edit-doc-name"
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="samko-input"
                    />
                  </div>

                  <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div>
                      <label className="samko-label" htmlFor="edit-doc-site">
                        Property / Site *
                      </label>
                      <CustomDropdown
                        id="edit-doc-site"
                        variant="form"
                        width="100%"
                        value={editSite}
                        onChange={(val) => setEditSite(val)}
                        options={sitesList.filter((s) => s !== 'All Sites').map((s) => ({ value: s, label: s }))}
                      />
                    </div>

                    <div>
                      <label className="samko-label" htmlFor="edit-doc-dept">
                        Target Department *
                      </label>
                      <CustomDropdown
                        id="edit-doc-dept"
                        variant="form"
                        width="100%"
                        value={editDept}
                        onChange={(val) => setEditDept(val)}
                        options={['Kitchen', 'Maintenance', 'Housekeeping', 'Front Office', 'F&B', 'Finance', 'Engineering', 'HR & People', 'Legal & Compliance', 'Operations', 'Plant Room', 'Reception', 'Public Areas'].map((dept) => ({ value: dept, label: dept }))}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div>
                      <label className="samko-label" htmlFor="edit-doc-cat">
                        Category *
                      </label>
                      <CustomDropdown
                        id="edit-doc-cat"
                        variant="form"
                        width="100%"
                        value={editCategory}
                        onChange={(val) => setEditCategory(val)}
                        options={allCategories.map((c) => ({ value: c, label: c }))}
                      />
                    </div>

                    <div>
                      <label className="samko-label" htmlFor="edit-doc-expiry">
                        Expiry Date
                      </label>
                      <input
                        id="edit-doc-expiry"
                        type="date"
                        value={editExpiry}
                        onChange={(e) => setEditExpiry(e.target.value)}
                        className="samko-input"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div>
                      <label className="samko-label" htmlFor="edit-doc-ver">
                        Version
                      </label>
                      <input
                        id="edit-doc-ver"
                        type="text"
                        value={editVersion}
                        onChange={(e) => setEditVersion(e.target.value)}
                        placeholder="e.g. v1.0"
                        className="samko-input"
                      />
                    </div>

                    <div>
                      <label className="samko-label" htmlFor="edit-doc-approval">
                        Approval Status
                      </label>
                      <CustomDropdown
                        id="edit-doc-approval"
                        variant="form"
                        width="100%"
                        value={editApprovalStatus}
                        onChange={(val) => setEditApprovalStatus(val as any)}
                        options={[
                          { value: 'pending', label: 'Pending Approval', color: '#f59e0b' },
                          { value: 'hold', label: 'On Hold', color: '#ef4444' },
                          { value: 'approved', label: 'Approved', color: '#10b981' },
                        ]}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="samko-label" htmlFor="edit-doc-notes">
                      Notes
                    </label>
                    <textarea
                      id="edit-doc-notes"
                      rows={2}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="samko-input"
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setEditingDoc(null)}
                      className="samko-btn-ghost"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="samko-btn-primary flex items-center gap-2"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </Modal>
            )}

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

            {/* Bulk Delete Confirmation Modal */}
            <ConfirmDeleteModal
              isOpen={showBulkDeleteDocsModal}
              onClose={() => setShowBulkDeleteDocsModal(false)}
              onConfirm={handleConfirmBulkDeleteDocs}
              title="Confirm Bulk Deletion"
              itemName={`${selectedDocIds.length} Selected Documents`}
              registerName="document repository"
              customWarning={`Are you sure you want to permanently delete these ${selectedDocIds.length} selected documents? This action cannot be undone.`}
              confirmButtonText={`Delete ${selectedDocIds.length} Documents`}
              isDeleting={isBulkDeletingDocs}
            />

            {/* Category Delete Confirmation Modal */}
            <ConfirmDeleteModal
              isOpen={Boolean(catToDelete)}
              onClose={() => setCatToDelete(null)}
              onConfirm={() => {
                if (!catToDelete) return;
                handleDeleteCategory(catToDelete);
                setCatToDelete(null);
              }}
              title="Delete Category"
              itemName={catToDelete || 'Category'}
              registerName="document categories"
              confirmButtonText="Delete Category"
              customWarning={`Are you sure you want to delete the category "${catToDelete}"? All existing documents with this category will safely stay in the database. Only this category option will be removed from the dropdown list.`}
            />
          </div>
        </form>
      </Modal>
      {/* Hidden File Input for Replace Document */}
      <input
        type="file"
        ref={replaceFileInputRef}
        onChange={handleReplaceFile}
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
      />

      {/* Modal for Previewing Selected File in Upload Dialog */}
      {filePreviewModalOpen && uploadedFileDataUrl && (
        <Modal
          open={filePreviewModalOpen}
          onClose={() => setFilePreviewModalOpen(false)}
          title={`Document Preview: ${selectedFile}`}
          subtitle="Preview of selected file before upload"
          width={750}
        >
          <div className="flex flex-col gap-3">
            <div className="rounded-xl overflow-hidden border border-border bg-black/60 flex items-center justify-center" style={{ minHeight: 400 }}>
              {uploadedFileDataUrl.startsWith('data:image/') ? (
                <img
                  src={uploadedFileDataUrl}
                  alt={selectedFile}
                  className="max-h-[440px] w-auto max-w-full object-contain"
                />
              ) : (
                <iframe
                  src={`${uploadedFileDataUrl}#toolbar=0`}
                  title={selectedFile}
                  className="w-full h-[450px] border-0"
                />
              )}
            </div>
            <div className="flex items-center justify-end pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setFilePreviewModalOpen(false)}
                className="samko-btn-primary"
              >
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <Modal
          open={showAddCategoryModal}
          onClose={() => setShowAddCategoryModal(false)}
          title="Manage Document Categories"
          subtitle="Add new document categories or delete existing categories"
          width={500}
        >
          <div className="flex flex-col gap-4">
            <form onSubmit={handleSaveCategory} className="flex flex-col gap-3">
              <div>
                <label className="samko-label" htmlFor="new-cat-name">
                  Category Name
                </label>
                <div className="flex gap-2">
                  <input
                    id="new-cat-name"
                    type="text"
                    className="samko-input flex-1"
                    placeholder="e.g. Legal & Licensing, Health & Safety, Lease Agreements"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!newCatName.trim()}
                    className="samko-btn-primary flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    <Tag size={13} /> Add
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Active Categories ({allCategories.length})
                </label>
                <span className="text-[10px] text-muted-foreground">Click × to delete</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto custom-scrollbar p-2.5 rounded-xl border border-border/60 bg-black/25">
                {allCategories.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border border-border bg-surface text-foreground font-medium"
                  >
                    <span className="truncate max-w-[200px]">{c}</span>
                    <button
                      type="button"
                      onClick={() => setCatToDelete(c)}
                      className="text-muted-foreground hover:text-rose-400 p-0.5 cursor-pointer rounded transition-colors"
                      title={`Remove "${c}"`}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="samko-btn-ghost cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}