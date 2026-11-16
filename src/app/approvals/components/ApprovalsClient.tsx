'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ChevronDown,
  X,
  Check,
  Eye,
  Edit2,
  Clock,
  Trash2,
  CloudUpload,
  Download,
  Printer,
  FileText,
  AlertTriangle,
  Plus,
  Filter,
  CheckCircle2,
  Building2,
  FolderOpen,
  ShieldAlert,
  Tag,
  RefreshCw,
  Lock,
  ExternalLink,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/authContext';
import { DOCUMENTS, daysUntil, formatDateGB, type Document, type DocStatus } from '@/lib/mockData';
import { HOTELS, DEPARTMENTS } from '@/lib/assetData';
import { useLiveProperties } from '@/hooks/useLiveProperties';
import CustomDropdown from '@/components/ui/CustomDropdown';
import Modal from '@/components/ui/Modal';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import { useDeepPageCms, DEFAULT_DOCUMENT_CATEGORIES } from '@/lib/deepPageCms';
import LoadingPagination from '@/components/ui/LoadingPagination';
import { useLoadingPagination } from '@/hooks/useLoadingPagination';
import TableCheckbox from '@/components/ui/TableCheckbox';
import BulkActionBar from '@/components/ui/BulkActionBar';

export type ApprovalStatus = 'pending' | 'hold' | 'approved';

export interface DocumentSubmission extends Document {
  department: string;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedDate?: string;
  approvalNotes?: string;
}

// Seed document submissions enriched with departments and approval statuses
function getSeedSubmissions(): DocumentSubmission[] {
  return [
    {
      id: 'doc-001',
      name: 'Building & Plant Insurance Policy',
      site: 'Stanhill Court',
      category: 'Insurance',
      department: 'Finance',
      expiry: '2027-06-30',
      status: 'ok',
      size: '1.8 MB',
      uploaded: '2025-07-01',
      uploadedBy: 'Marcus Webb',
      version: 'v1.0',
      approvalStatus: 'approved',
      approvedBy: 'Alexander Vance (Super Admin)',
      approvedDate: '2025-07-02',
      approvalNotes: 'Comprehensive insurance policy verified and active.',
    },
    {
      id: 'doc-002',
      name: 'Food Hygiene Certificate – Level 5',
      site: 'Crowne Plaza Kingston-south',
      category: 'Food Hygiene',
      department: 'Kitchen',
      expiry: '2028-03-22',
      status: 'ok',
      size: '0.6 MB',
      uploaded: '2025-03-20',
      uploadedBy: 'Marcus Webb',
      version: 'v2.2',
      approvalStatus: 'pending',
      approvalNotes: 'Local authority 5-star rating inspection certificate uploaded for review.',
    },
    {
      id: 'doc-003',
      name: 'Commercial Gas Safety Record CP12',
      site: 'Stanhill Court',
      category: 'Gas Safety',
      department: 'Maintenance',
      expiry: '2026-03-01',
      status: 'warning',
      size: '0.9 MB',
      uploaded: '2025-03-01',
      uploadedBy: 'Sarah Chen',
      version: 'v1.0',
      approvalStatus: 'hold',
      approvalNotes: 'Placed on hold by Super Admin — awaiting remedial burner flue test report.',
    },
  ];
}

// Load real document submissions from samko_repository_documents
function loadDocumentSubmissions(): DocumentSubmission[] {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('samko_repository_documents');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.length <= 3) {
          const seeds = getSeedSubmissions();
          const seedMap = new Map(seeds.map((s) => [s.id, s]));
          const nameMap = new Map(seeds.map((s) => [s.name?.toLowerCase().trim(), s]));

          const enriched: DocumentSubmission[] = parsed.map((doc: any) => {
            const seed = seedMap.get(doc.id) || nameMap.get(doc.name?.toLowerCase().trim());
            const isFood =
              (doc.name && doc.name.toLowerCase().includes('food')) ||
              (doc.category && doc.category.toLowerCase().includes('food'));
            const isUserUpload =
              String(doc.id).startsWith('doc-17') || String(doc.id).startsWith('doc-food') || !seed;

            let finalStatus: ApprovalStatus = doc.approvalStatus;
            if (!finalStatus) {
              if (isFood || isUserUpload) {
                finalStatus = 'pending';
              } else if (seed?.approvalStatus) {
                finalStatus = seed.approvalStatus;
              } else {
                finalStatus = 'pending';
              }
            }

            const dept = doc.department || seed?.department || (isFood ? 'Kitchen' : 'Maintenance');

            return {
              ...doc,
              department: dept,
              approvalStatus: finalStatus,
              approvedBy:
                doc.approvedBy ||
                (finalStatus === 'approved'
                  ? seed?.approvedBy || 'Alexander Vance (Super Admin)'
                  : undefined),
              approvedDate:
                doc.approvedDate ||
                (finalStatus === 'approved' ? seed?.approvedDate || '2025-08-11' : undefined),
              approvalNotes:
                doc.approvalNotes ||
                seed?.approvalNotes ||
                (finalStatus === 'pending'
                  ? `Uploaded compliance document awaiting Super Admin or Digital Bot approval before dispatching to ${dept}.`
                  : ''),
            };
          });

          // Sync pending count to localStorage
          try {
            const pendingCount = enriched.filter(
              (d) => d.approvalStatus === 'pending' || d.approvalStatus === 'hold'
            ).length;
            localStorage.setItem('samko_approvals_count', String(pendingCount));
          } catch {}

          return enriched;
        }
      }
    } catch (e) {}
  }
  try {
    localStorage.removeItem('samko_repository_documents');
    localStorage.setItem('samko_approvals_count', '1');
  } catch {}
  return getSeedSubmissions();
}

// Real downloadable and viewable PDF blob generator
function createDocumentPdfBlob(doc: DocumentSubmission): { url: string; filename: string } {
  if (doc.fileUrl) {
    return {
      url: doc.fileUrl,
      filename: doc.fileName || `${doc.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
    };
  }

  const safeName = (doc.name || 'Compliance Document').replace(/[()]/g, '');
  const safeSite = (doc.site || 'Samko Property').replace(/[()]/g, '');
  const safeDept = (doc.department || 'Maintenance').replace(/[()]/g, '');
  const safeCat = (doc.category || 'General').replace(/[()]/g, '');
  const safeSubmitter = (doc.uploadedBy || 'Administrator').replace(/[()]/g, '');
  const safeDate = doc.uploaded || new Date().toLocaleDateString('en-GB');
  const safeExpiry = doc.expiry || 'N/A';
  const safeStatus = (doc.approvalStatus || 'PENDING').toUpperCase();
  const safeApprovedBy = (doc.approvedBy || 'Pending Super Admin Sign-Off').replace(/[()]/g, '');
  const safeNotes = (
    doc.approvalNotes || 'Statutory compliance document submitted for review.'
  ).replace(/[()]/g, '');

  const streamContent = `BT\n/F1 18 Tf\n50 720 Td\n(SAMKO CENTRAL UK - COMPLIANCE DOCUMENT APPROVAL) Tj\n/F1 14 Tf\n0 -36 Td\n(Document: ${safeName}) Tj\n/F1 11 Tf\n0 -26 Td\n(Property / Site: ${safeSite}) Tj\n0 -20 Td\n(Target Department: ${safeDept}) Tj\n0 -20 Td\n(Category: ${safeCat}) Tj\n0 -20 Td\n(Version: ${doc.version || 'v1.0'}) Tj\n0 -20 Td\n(Expiry Date: ${safeExpiry}) Tj\n0 -20 Td\n(Submitted By: ${safeSubmitter} on ${safeDate}) Tj\n0 -28 Td\n(APPROVAL STATUS: ${safeStatus}) Tj\n0 -20 Td\n(Approved By: ${safeApprovedBy}) Tj\n0 -28 Td\n(Notes: ${safeNotes.slice(0, 75)}) Tj\n0 -36 Td\n(AUTHORIZATION: Super Admin & Digital Bot Controlled Gate) Tj\nET`;

  const streamLength = streamContent.length;
  const pdfSource = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000224 00000 n \n0000000500 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n600\n%%EOF`;

  const blob = new Blob([pdfSource], { type: 'application/pdf' });
  return {
    url: URL.createObjectURL(blob),
    filename: doc.fileName || `${doc.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Approved.pdf`,
  };
}

export default function ApprovalsClient() {
  const router = useRouter();
  const { user, isPropertyAccessible } = useAuth();

  // Strict Super Admin or Digital Bot permission check
  const isSuperAdminOrBot =
    user?.roleLevel === 'L1' ||
    user?.id === 'usr-bot-001' ||
    user?.name?.toLowerCase().includes('digital bot') ||
    user?.roleTitle?.toLowerCase().includes('digital bot') ||
    user?.roleTitle?.toLowerCase().includes('super admin');

  // Load document submissions
  const [documents, setDocuments] = useState<DocumentSubmission[]>(() => {
    return loadDocumentSubmissions();
  });

  // Listen to external document updates and uploads
  useEffect(() => {
    const handleSync = () => {
      setDocuments(loadDocumentSubmissions());
    };
    window.addEventListener('samko:doc_uploaded', handleSync);
    window.addEventListener('samko:doc_approved', handleSync);
    window.addEventListener('samko:data-changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('samko:doc_uploaded', handleSync);
      window.removeEventListener('samko:doc_approved', handleSync);
      window.removeEventListener('samko:data-changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Save documents back to samko_repository_documents and sync across tabs
  const saveDocuments = (newList: DocumentSubmission[]) => {
    setDocuments(newList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('samko_repository_documents', JSON.stringify(newList));
        const pendingTotal = newList.filter(
          (d) => d.approvalStatus === 'pending' || d.approvalStatus === 'hold'
        ).length;
        localStorage.setItem('samko_approvals_count', String(pendingTotal));
        window.dispatchEvent(
          new CustomEvent('samko:doc_approved', { detail: { documents: newList } })
        );
        window.dispatchEvent(
          new CustomEvent('samko:data-changed', { detail: { type: 'documents' } })
        );
        window.dispatchEvent(
          new CustomEvent('samko:approvals-changed', { detail: { count: pendingTotal } })
        );
      } catch (e) {}
    }
  };

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'hold' | 'approved'>(
    'pending'
  );
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Preview & Action States
  const [previewDoc, setPreviewDoc] = useState<DocumentSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [editingDoc, setEditingDoc] = useState<DocumentSubmission | null>(null);
  const [editName, setEditName] = useState('');
  const [editSite, setEditSite] = useState('');
  const [editDept, setEditDept] = useState('Kitchen');
  const [editCategory, setEditCategory] = useState('Food Hygiene');
  const [editExpiry, setEditExpiry] = useState('');
  const [editVersion, setEditVersion] = useState('v1.0');
  const [editNotes, setEditNotes] = useState('');
  const [editApprovalStatus, setEditApprovalStatus] = useState<ApprovalStatus>('pending');

  const handleOpenEditDoc = (doc: DocumentSubmission) => {
    setEditingDoc(doc);
    setEditName(doc.name);
    setEditSite(doc.site);
    setEditDept(doc.department || 'Kitchen');
    setEditCategory(doc.category || 'Food Hygiene');
    setEditExpiry(doc.expiry || '');
    setEditVersion(doc.version || 'v1.0');
    setEditNotes(doc.approvalNotes || '');
    setEditApprovalStatus(doc.approvalStatus || 'pending');
  };

  const handleSaveEditDoc = (e: React.FormEvent) => {
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
          approvalStatus: editApprovalStatus,
          approvalNotes: editNotes.trim() || d.approvalNotes,
        };
      }
      return d;
    });

    saveDocuments(updated);
    toast.success('Document updated successfully', {
      description: `"${editName.trim()}" details have been updated.`,
    });
    setEditingDoc(null);
  };

  const [docToDelete, setDocToDelete] = useState<DocumentSubmission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dynamic live properties from DB / cache
  const { properties: liveProperties } = useLiveProperties();

  // Dynamic property options computed from liveProperties + document properties
  const propertyOptions = useMemo(() => {
    const map = new Map<string, string>();
    liveProperties.forEach((h: any) => {
      const name = h.name || h.propertyName;
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

  // New Document Upload for Approval Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadSite, setUploadSite] = useState(HOTELS[0]?.name || 'Crowne Plaza Kingston-south');
  const [uploadDept, setUploadDept] = useState('Maintenance');
  const [uploadCategory, setUploadCategory] = useState(
    DEFAULT_DOCUMENT_CATEGORIES[0] || 'Statutory Certificates'
  );
  const [uploadExpiry, setUploadExpiry] = useState('');
  const [uploadVersion, setUploadVersion] = useState('v1.0');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileDataUrl, setUploadedFileDataUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Accessible scoped documents
  const accessibleDocuments = useMemo(() => {
    return documents.filter((d) =>
      isPropertyAccessible(d.site || (d as any).property || (d as any).hotel)
    );
  }, [documents, isPropertyAccessible]);

  // KPI Counts
  const pendingCount = useMemo(
    () => accessibleDocuments.filter((d) => d.approvalStatus === 'pending').length,
    [accessibleDocuments]
  );
  const holdCount = useMemo(
    () => accessibleDocuments.filter((d) => d.approvalStatus === 'hold').length,
    [accessibleDocuments]
  );
  const approvedCount = useMemo(
    () => accessibleDocuments.filter((d) => d.approvalStatus === 'approved').length,
    [accessibleDocuments]
  );
  const totalCount = accessibleDocuments.length;

  // Filtered List
  const filtered = useMemo(() => {
    return accessibleDocuments.filter((d) => {
      if (statusFilter !== 'all' && d.approvalStatus !== statusFilter) return false;
      if (propertyFilter !== 'all' && d.site.toLowerCase() !== propertyFilter.toLowerCase())
        return false;
      if (
        departmentFilter !== 'all' &&
        (d.department || '').toLowerCase() !== departmentFilter.toLowerCase()
      )
        return false;
      if (categoryFilter !== 'all' && d.category.toLowerCase() !== categoryFilter.toLowerCase())
        return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = d.name.toLowerCase().includes(q);
        const matchSite = d.site.toLowerCase().includes(q);
        const matchDept = (d.department || '').toLowerCase().includes(q);
        const matchCat = d.category.toLowerCase().includes(q);
        const matchBy = (d.uploadedBy || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSite && !matchDept && !matchCat && !matchBy) return false;
      }
      return true;
    });
  }, [accessibleDocuments, statusFilter, propertyFilter, departmentFilter, categoryFilter, search]);

  const {
    currentPage,
    pageSize,
    totalRecords,
    paginatedItems: paginatedDocs,
    isPageLoading,
    changePage,
    changePageSize,
  } = useLoadingPagination(filtered, 10);

  // Multi-select & Bulk Deletion State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');

  const isAllPageSelected =
    paginatedDocs.length > 0 && paginatedDocs.every((d) => selectedIds.includes(d.id));
  const isSomePageSelected =
    paginatedDocs.some((d) => selectedIds.includes(d.id)) && !isAllPageSelected;

  const handleToggleSelectAllPage = () => {
    if (isAllPageSelected) {
      const pageIds = new Set(paginatedDocs.map((d) => d.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = paginatedDocs.map((d) => d.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(filtered.map((d) => d.id));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
    setSelectedTypeFilter('');
  };

  const approvalTypeOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((d) => {
      counts[`dept:${d.department}`] = (counts[`dept:${d.department}`] || 0) + 1;
      counts[`status:${d.approvalStatus}`] = (counts[`status:${d.approvalStatus}`] || 0) + 1;
      counts[`site:${d.site}`] = (counts[`site:${d.site}`] || 0) + 1;
      counts[`cat:${d.category}`] = (counts[`cat:${d.category}`] || 0) + 1;
    });

    const opts: { label: string; value: string; count: number }[] = [];
    DEPARTMENTS.forEach((dept) => {
      if (counts[`dept:${dept}`]) {
        opts.push({
          label: `Department: ${dept}`,
          value: `dept:${dept}`,
          count: counts[`dept:${dept}`],
        });
      }
    });
    if (counts['status:pending'])
      opts.push({
        label: 'Status: Pending Review',
        value: 'status:pending',
        count: counts['status:pending'],
      });
    if (counts['status:hold'])
      opts.push({ label: 'Status: On Hold', value: 'status:hold', count: counts['status:hold'] });
    if (counts['status:approved'])
      opts.push({
        label: 'Status: Approved',
        value: 'status:approved',
        count: counts['status:approved'],
      });
    HOTELS.forEach((h) => {
      if (counts[`site:${h.name}`]) {
        opts.push({
          label: `Property: ${h.name}`,
          value: `site:${h.name}`,
          count: counts[`site:${h.name}`],
        });
      }
    });
    return opts;
  }, [filtered]);

  const handleSelectByType = (typeKey: string) => {
    setSelectedTypeFilter(typeKey);
    if (!typeKey) {
      setSelectedIds([]);
      return;
    }
    const [kind, val] = typeKey.split(':');
    const matched = filtered.filter((d) => {
      if (kind === 'dept') return d.department === val;
      if (kind === 'status') return d.approvalStatus === val;
      if (kind === 'site') return d.site === val;
      if (kind === 'cat') return d.category === val;
      return false;
    });
    setSelectedIds(matched.map((d) => d.id));
    toast.info(`Selected ${matched.length} documents matching ${typeKey.replace(':', ': ')}`);
  };

  const handleConfirmBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const count = selectedIds.length;
      const updated = documents.filter((d) => !selectedIds.includes(d.id));
      saveDocuments(updated);
      setSelectedIds([]);
      setSelectedTypeFilter('');
      setShowBulkDeleteModal(false);
      toast.success(`Deleted ${count} document submission${count > 1 ? 's' : ''}`);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Handle Approval Update (Restricted to Super Admin or Digital Bot)
  const handleUpdateStatus = (id: string, newStatus: ApprovalStatus) => {
    if (!isSuperAdminOrBot) {
      toast.error('Permission Denied', {
        description:
          'Only a Super Admin or Digital Bot has authority to approve or place documents on hold.',
      });
      return;
    }

    const approvedBy = isSuperAdminOrBot
      ? user?.name || (user?.roleLevel === 'L1' ? 'Alexander Vance (Super Admin)' : 'Digital Bot')
      : 'Super Admin';
    const approvedDate = new Date().toISOString();

    const updated = documents.map((d) => {
      if (d.id === id) {
        return {
          ...d,
          approvalStatus: newStatus,
          approvedBy: newStatus === 'approved' ? approvedBy : undefined,
          approvedDate: newStatus === 'approved' ? approvedDate : undefined,
          approvalNotes:
            reviewNotes.trim() ||
            d.approvalNotes ||
            (newStatus === 'approved'
              ? `Approved by ${approvedBy} and dispatched to ${d.department}.`
              : d.approvalNotes),
        };
      }
      return d;
    });

    saveDocuments(updated);

    const changedDoc = updated.find((d) => d.id === id);
    if (previewDoc && previewDoc.id === id) {
      setPreviewDoc(changedDoc || null);
    }
    setReviewNotes('');

    if (newStatus === 'approved') {
      toast.success('Document Approved & Dispatched!', {
        description: `"${changedDoc?.name}" has been approved by ${approvedBy} and dispatched to ${changedDoc?.department} department at ${changedDoc?.site}.`,
      });
    } else if (newStatus === 'hold') {
      toast.warning('Document Placed on Hold', {
        description: `"${changedDoc?.name}" is on hold awaiting contractor revision. It remains in the Approvals tab.`,
      });
    } else {
      toast.info('Document Returned to Pending', {
        description: `"${changedDoc?.name}" is now pending review in the Approvals queue.`,
      });
    }
  };

  // Submit new document for approval
  const handleCreateDocumentForApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim()) {
      toast.error('Document title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const days = uploadExpiry ? daysUntil(uploadExpiry) : 365;
      const status: DocStatus = days < 0 ? 'critical' : days <= 30 ? 'warning' : 'ok';
      const sizeStr = uploadedFile
        ? uploadedFile.size > 1048576
          ? `${(uploadedFile.size / 1048576).toFixed(1)} MB`
          : `${Math.max(1, Math.round(uploadedFile.size / 1024))} KB`
        : '1.8 MB';

      const newDoc: DocumentSubmission = {
        id: `doc-${Date.now()}`,
        name: uploadName.trim(),
        site: uploadSite,
        department: uploadDept,
        category: uploadCategory,
        expiry: uploadExpiry || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
        status,
        size: sizeStr,
        uploaded: new Date().toISOString().slice(0, 10),
        uploadedBy: user?.name || 'Property Manager',
        version: uploadVersion.trim() || 'v1.0',
        approvalStatus: 'pending',
        approvalNotes:
          uploadNotes.trim() ||
          'Newly uploaded compliance document submitted for Super Admin review.',
        fileName: uploadedFile?.name || `${uploadName.trim()}.pdf`,
        fileType: uploadedFile?.type || 'application/pdf',
        fileUrl: uploadedFileDataUrl || undefined,
      };

      const updated = [newDoc, ...documents];
      saveDocuments(updated);

      toast.success('Document Submitted for Approval!', {
        description: `"${newDoc.name}" has entered the Approvals queue. It will remain in Approvals until approved by Super Admin or Digital Bot before dispatching to ${newDoc.department}.`,
      });

      // Reset form
      setUploadName('');
      setUploadExpiry('');
      setUploadNotes('');
      setUploadedFile(null);
      setUploadedFileDataUrl('');
      setShowUploadModal(false);
    } catch (err) {
      toast.error('Failed to submit document');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete document
  const handleConfirmDelete = () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      const updated = documents.filter((d) => d.id !== docToDelete.id);
      saveDocuments(updated);
      toast.success(`Deleted "${docToDelete.name}"`);
      setDocToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Download PDF
  const handleDownloadPdf = (doc: DocumentSubmission) => {
    const { url, filename } = createDocumentPdfBlob(doc);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Download started', { description: filename });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      {/* Top Banner / Permission Notice */}
      <div
        className="rounded-2xl p-4 border flex items-center justify-between gap-4 flex-wrap"
        style={{
          background: isSuperAdminOrBot
            ? 'linear-gradient(135deg, rgba(61,214,140,0.08) 0%, rgba(232,201,122,0.06) 100%)'
            : 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(255,255,255,0.02) 100%)',
          borderColor: isSuperAdminOrBot ? 'rgba(61,214,140,0.25)' : 'rgba(245,158,11,0.25)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: isSuperAdminOrBot ? 'rgba(61,214,140,0.15)' : 'rgba(245,158,11,0.15)',
              color: isSuperAdminOrBot ? '#3dd68c' : '#f59e0b',
            }}
          >
            {isSuperAdminOrBot ? <ShieldCheck size={20} /> : <Lock size={20} />}
          </div>
          <div>
            <h4 className="font-head font-bold text-sm text-foreground">
              {isSuperAdminOrBot
                ? 'Super Admin / Digital Bot Authorization Active'
                : 'Document Approval Authorization Gate'}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isSuperAdminOrBot
                ? 'You have authority to sign off on uploaded documents and dispatch them to their target department.'
                : 'Uploaded documents stay in the Approvals queue until reviewed and approved by Super Admin or Digital Bot.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary text-black hover:opacity-95 transition-all shadow-sm cursor-pointer"
          >
            <CloudUpload size={14} />
            <span>Upload Document for Approval</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Card */}
        <div
          onClick={() => setStatusFilter('pending')}
          className="rounded-2xl p-4 border transition-all cursor-pointer hover:border-primary/50 relative overflow-hidden group"
          style={{
            background: 'var(--surface)',
            borderColor: statusFilter === 'pending' ? 'var(--primary)' : 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Approval
            </span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/10 text-amber-400">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-head text-foreground mb-1">{pendingCount}</div>
          <p className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Awaiting Super Admin / Bot Sign-off
          </p>
        </div>

        {/* On Hold Card */}
        <div
          onClick={() => setStatusFilter('hold')}
          className="rounded-2xl p-4 border transition-all cursor-pointer hover:border-primary/50 relative overflow-hidden group"
          style={{
            background: 'var(--surface)',
            borderColor: statusFilter === 'hold' ? 'var(--primary)' : 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Placed on Hold
            </span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-500/10 text-rose-400">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-head text-foreground mb-1">{holdCount}</div>
          <p className="text-[11px] text-muted-foreground">Awaiting remedial revision</p>
        </div>

        {/* Approved Card */}
        <div
          onClick={() => setStatusFilter('approved')}
          className="rounded-2xl p-4 border transition-all cursor-pointer hover:border-primary/50 relative overflow-hidden group"
          style={{
            background: 'var(--surface)',
            borderColor: statusFilter === 'approved' ? 'var(--primary)' : 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Approved & Dispatched
            </span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-head text-foreground mb-1">{approvedCount}</div>
          <p className="text-[11px] text-emerald-400 font-medium">
            Active in designated departments
          </p>
        </div>

        {/* Total Documents Card */}
        <div
          onClick={() => setStatusFilter('all')}
          className="rounded-2xl p-4 border transition-all cursor-pointer hover:border-primary/50 relative overflow-hidden group"
          style={{
            background: 'var(--surface)',
            borderColor: statusFilter === 'all' ? 'var(--primary)' : 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Uploaded Docs
            </span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-400">
              <FileText size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-head text-foreground mb-1">{totalCount}</div>
          <p className="text-[11px] text-muted-foreground">Across all sites & departments</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="rounded-2xl p-4 border border-border flex flex-wrap items-center justify-between gap-3 shadow-sm"
        style={{ background: 'var(--surface)' }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search by document title, property, department, category, or submitter…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border text-xs outline-none focus:border-primary transition-colors bg-surface2 text-foreground"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Tabs Filter */}
          <div className="flex items-center p-1 rounded-xl border border-border bg-surface2">
            {(['pending', 'hold', 'approved', 'all'] as const).map((st) => {
              const active = statusFilter === st;
              const label =
                st === 'pending'
                  ? `Pending (${pendingCount})`
                  : st === 'hold'
                    ? `Hold (${holdCount})`
                    : st === 'approved'
                      ? `Approved (${approvedCount})`
                      : 'All';
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-primary text-black shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Property Dropdown */}
          <CustomDropdown
            size="sm"
            variant="filter"
            value={propertyFilter}
            onChange={(val) => setPropertyFilter(val)}
            options={[
              { value: 'all', label: `All Properties (${propertyOptions.length})` },
              ...propertyOptions.map((name) => ({ value: name, label: name })),
            ]}
          />

          {/* Department Dropdown */}
          <CustomDropdown
            size="sm"
            variant="filter"
            value={departmentFilter}
            onChange={(val) => setDepartmentFilter(val)}
            options={[
              { value: 'all', label: 'All Departments' },
              ...DEPARTMENTS.map((dept) => ({ value: dept, label: dept })),
            ]}
          />

          {/* Category Dropdown */}
          <CustomDropdown
            size="sm"
            variant="filter"
            value={categoryFilter}
            onChange={(val) => setCategoryFilter(val)}
            options={[
              { value: 'all', label: 'All Categories' },
              ...DEFAULT_DOCUMENT_CATEGORIES.map((cat) => ({ value: cat, label: cat })),
            ]}
          />
        </div>
      </div>

      {/* Main Table */}
      <div
        className="rounded-2xl border border-border overflow-hidden shadow-sm"
        style={{ background: 'var(--surface)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ minWidth: 1040 }}>
            <thead>
              <tr className="border-b border-border bg-surface2">
                <th className="py-3 px-3 w-10 text-center">
                  <TableCheckbox
                    checked={isAllPageSelected}
                    indeterminate={isSomePageSelected}
                    onChange={handleToggleSelectAllPage}
                    title="Select all on this page"
                  />
                </th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Doc Ref
                </th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Document Title
                </th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Property
                </th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Target Department
                </th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Category
                </th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Submitted By
                </th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Attached File
                </th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Approval Status
                </th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground text-xs">
                    No documents found matching the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedDocs.map((doc) => {
                  const isPending = doc.approvalStatus === 'pending';
                  const isHold = doc.approvalStatus === 'hold';
                  const isApproved = doc.approvalStatus === 'approved';

                  return (
                    <tr
                      key={doc.id}
                      className={`border-b border-border/60 hover:bg-surface2/60 transition-colors group cursor-pointer ${
                        selectedIds.includes(doc.id) ? 'bg-[#e8c97a]/5' : ''
                      }`}
                      onClick={() => setPreviewDoc(doc)}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <TableCheckbox
                          checked={selectedIds.includes(doc.id)}
                          onChange={() => handleToggleSelect(doc.id)}
                          title={`Select ${doc.name}`}
                        />
                      </td>

                      {/* Doc Ref */}
                      <td className="py-3 px-4 font-mono font-semibold text-xs text-primary whitespace-nowrap">
                        {doc.id.toUpperCase()}
                      </td>

                      {/* Title & Version */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary">
                            <FileText size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-foreground truncate">
                              {doc.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {doc.version || 'v1.0'} · {doc.size || '1.5 MB'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Property */}
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={13} className="text-muted-foreground flex-shrink-0" />
                          <span className="truncate max-w-[160px]">{doc.site}</span>
                        </div>
                      </td>

                      {/* Target Department */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border"
                          style={{
                            background: isApproved
                              ? 'rgba(61,214,140,0.08)'
                              : 'rgba(232,201,122,0.08)',
                            borderColor: isApproved
                              ? 'rgba(61,214,140,0.25)'
                              : 'rgba(232,201,122,0.25)',
                            color: isApproved ? '#3dd68c' : 'var(--primary)',
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: isApproved ? '#3dd68c' : 'var(--primary)' }}
                          />
                          {doc.department}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] border border-border bg-surface2 font-medium">
                          {doc.category}
                        </span>
                      </td>

                      {/* Submitted By */}
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        <div>
                          <p className="text-foreground font-medium truncate max-w-[140px]">
                            {doc.uploadedBy || 'Property Manager'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {doc.uploaded || 'Recent'}
                          </p>
                        </div>
                      </td>

                      {/* Attached File Preview / Download */}
                      <td
                        className="py-3 px-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs border border-border hover:border-primary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                            style={{ background: 'var(--surface2)' }}
                            title="Preview file"
                          >
                            <Eye size={12} className="text-primary" />
                            <span>Preview</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(doc)}
                            className="p-1 rounded-md border border-border hover:border-primary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                            style={{ background: 'var(--surface2)' }}
                            title="Download document PDF"
                          >
                            <Download size={12} />
                          </button>
                        </div>
                      </td>

                      {/* Approval Status Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Pending Review
                          </span>
                        )}
                        {isHold && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25">
                            <AlertTriangle size={11} />
                            On Hold
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                            <CheckCircle2 size={11} />
                            Approved
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve Button */}
                          <button
                            type="button"
                            disabled={!isSuperAdminOrBot || isApproved}
                            onClick={() => handleUpdateStatus(doc.id, 'approved')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                              isApproved
                                ? 'opacity-40 cursor-not-allowed bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : isSuperAdminOrBot
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm active:scale-95'
                                  : 'opacity-40 cursor-not-allowed bg-surface2 text-muted-foreground border border-border'
                            }`}
                            title={
                              !isSuperAdminOrBot
                                ? 'Only Super Admin or Digital Bot can approve'
                                : isApproved
                                  ? 'Already approved & dispatched'
                                  : `Approve and dispatch to ${doc.department}`
                            }
                          >
                            <Check size={12} />
                            <span>{isApproved ? 'Approved' : 'Approve'}</span>
                          </button>

                          {/* Eye / View Details Button */}
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 rounded-lg border border-border hover:border-primary text-muted-foreground hover:text-primary transition-all cursor-pointer bg-surface2"
                            title="View Document Details & Sign-off"
                          >
                            <Eye size={13} />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditDoc(doc)}
                            className="p-1.5 rounded-lg border border-border hover:border-primary text-muted-foreground hover:text-primary transition-all cursor-pointer bg-surface2"
                            title="Edit Document"
                          >
                            <Edit2 size={13} />
                          </button>

                          {/* Hold Button */}
                          <button
                            type="button"
                            disabled={!isSuperAdminOrBot || isHold}
                            onClick={() => handleUpdateStatus(doc.id, 'hold')}
                            className={`p-1.5 rounded-lg border text-xs transition-all ${
                              isHold
                                ? 'opacity-40 cursor-not-allowed border-rose-500/30 text-rose-400'
                                : isSuperAdminOrBot
                                  ? 'border-border hover:border-amber-500/40 text-muted-foreground hover:text-amber-400 cursor-pointer bg-surface2'
                                  : 'opacity-40 cursor-not-allowed border-border text-muted-foreground'
                            }`}
                            title={
                              !isSuperAdminOrBot
                                ? 'Only Super Admin or Bot can put on hold'
                                : 'Place on hold'
                            }
                          >
                            <Clock size={13} />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDocToDelete(doc)}
                            className="p-1.5 rounded-lg border border-border hover:border-rose-500/40 text-muted-foreground hover:text-rose-400 transition-all cursor-pointer bg-surface2"
                            title="Delete document"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border">
          <LoadingPagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalRecords={totalRecords}
            onPageChange={changePage}
            onPageSizeChange={changePageSize}
            isLoading={isPageLoading}
          />
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      <div className="mt-4">
        <BulkActionBar
          selectedCount={selectedIds.length}
          totalCount={filtered.length}
          onClearSelection={handleClearSelection}
          onSelectAll={handleSelectAllFiltered}
          onDeleteSelected={() => setShowBulkDeleteModal(true)}
          typeOptions={approvalTypeOptions}
          onSelectByType={handleSelectByType}
          selectedTypeValue={selectedTypeFilter}
          typePlaceholder="Select all of type (Department, Status, Property)..."
          recordName="approval items"
          isDeleting={isBulkDeleting}
        />
      </div>

      {/* Preview & Super Admin Approval Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-3xl rounded-2xl border border-border overflow-hidden shadow-2xl bg-surface animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base text-foreground">
                    {previewDoc.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    REF: {previewDoc.id.toUpperCase()} · {previewDoc.site}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-border bg-surface2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    Target Department
                  </span>
                  <p className="text-xs font-semibold text-primary mt-0.5">
                    {previewDoc.department}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    Category
                  </span>
                  <p className="text-xs font-semibold text-foreground mt-0.5">
                    {previewDoc.category}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    Expiry Date
                  </span>
                  <p className="text-xs font-semibold text-foreground mt-0.5">
                    {previewDoc.expiry || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    Version & Size
                  </span>
                  <p className="text-xs font-semibold text-foreground mt-0.5">
                    {previewDoc.version} · {previewDoc.size}
                  </p>
                </div>
              </div>

              {/* Status Banner */}
              <div
                className="p-4 rounded-xl border flex items-center justify-between flex-wrap gap-3"
                style={{
                  background:
                    previewDoc.approvalStatus === 'approved'
                      ? 'rgba(61,214,140,0.1)'
                      : previewDoc.approvalStatus === 'hold'
                        ? 'rgba(244,63,94,0.1)'
                        : 'rgba(245,158,11,0.1)',
                  borderColor:
                    previewDoc.approvalStatus === 'approved'
                      ? 'rgba(61,214,140,0.3)'
                      : previewDoc.approvalStatus === 'hold'
                        ? 'rgba(244,63,94,0.3)'
                        : 'rgba(245,158,11,0.3)',
                }}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Current Workflow State
                  </span>
                  <h4 className="text-sm font-bold text-foreground mt-0.5">
                    {previewDoc.approvalStatus === 'approved'
                      ? `Approved & Dispatched to ${previewDoc.department}`
                      : previewDoc.approvalStatus === 'hold'
                        ? 'Placed on Hold (In Approvals Queue)'
                        : 'Pending Super Admin or Digital Bot Sign-off (In Approvals Queue)'}
                  </h4>
                  {previewDoc.approvedBy && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Signed off by{' '}
                      <strong className="text-foreground">{previewDoc.approvedBy}</strong> on{' '}
                      {new Date(previewDoc.approvedDate || Date.now()).toLocaleDateString('en-GB')}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadPdf(previewDoc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold bg-surface hover:border-primary text-foreground cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download Document PDF</span>
                </button>
              </div>

              {/* Review / Audit Notes */}
              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
                  Submission & Review Notes
                </label>
                <div className="p-3.5 rounded-xl border border-border bg-surface2 text-xs text-foreground leading-relaxed">
                  {previewDoc.approvalNotes || 'No specific notes entered.'}
                </div>
              </div>

              {/* Super Admin Review Controls */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Super Admin / Digital Bot Decision
                  </label>
                  {!isSuperAdminOrBot && (
                    <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                      <Lock size={12} /> View Only (Sign-off Restricted to L1 / Bot)
                    </span>
                  )}
                </div>

                {isSuperAdminOrBot ? (
                  <div className="space-y-3">
                    <textarea
                      rows={2}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Enter optional sign-off remarks or reasons for hold/approval…"
                      className="w-full p-3 rounded-xl border border-border text-xs outline-none focus:border-primary bg-surface2 text-foreground"
                    />

                    <div className="flex items-center justify-end gap-2 pt-2">
                      {previewDoc.approvalStatus !== 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(previewDoc.id, 'pending')}
                          className="px-3 py-2 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:text-foreground cursor-pointer bg-surface2"
                        >
                          Reset to Pending
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(previewDoc.id, 'hold')}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 cursor-pointer"
                      >
                        <Clock size={13} />
                        <span>Place on Hold</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(previewDoc.id, 'approved')}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md"
                      >
                        <Check size={14} />
                        <span>Approve & Dispatch to {previewDoc.department}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-muted-foreground leading-relaxed">
                    This document is currently in the Approvals queue. A Super Admin or Digital Bot
                    must approve it before it is dispatched as an active compliance document for the{' '}
                    {previewDoc.department} department.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl border border-border overflow-hidden shadow-2xl bg-surface animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/15 text-primary">
                  <CloudUpload size={16} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base text-foreground">
                    Upload Document for Approval
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Document enters Approvals queue awaiting Super Admin or Bot sign-off
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDocumentForApproval} className="p-6 space-y-4">
              {/* Drag & Drop / File Input */}
              <div
                className="p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/60 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer bg-surface2"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
                  input.onchange = (e) => {
                    const f = (e.target as HTMLInputElement).files?.[0];
                    if (f) {
                      setUploadedFile(f);
                      if (!uploadName) {
                        setUploadName(f.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
                      }
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setUploadedFileDataUrl(ev.target?.result as string);
                      };
                      reader.readAsDataURL(f);
                    }
                  };
                  input.click();
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                  <CloudUpload size={20} />
                </div>
                {uploadedFile ? (
                  <div className="text-center">
                    <p className="text-xs font-bold text-foreground">{uploadedFile.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {(uploadedFile.size / 1024).toFixed(0)} KB · Ready to submit
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">
                      Click to browse or drop compliance file
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      PDF, Word, JPG, or PNG (up to 25 MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Gas Safety Certificate 2026"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border text-xs outline-none focus:border-primary bg-surface2 text-foreground"
                />
              </div>

              {/* Property & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
                    Property / Site *
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={uploadSite}
                    onChange={(val) => setUploadSite(val)}
                    options={propertyOptions.map((name) => ({ value: name, label: name }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
                    Target Department *
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={uploadDept}
                    onChange={(val) => setUploadDept(val)}
                    options={DEPARTMENTS.map((dept) => ({ value: dept, label: dept }))}
                  />
                </div>
              </div>

              {/* Category & Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
                    Category *
                  </label>
                  <CustomDropdown
                    variant="form"
                    width="100%"
                    value={uploadCategory}
                    onChange={(val) => setUploadCategory(val)}
                    options={DEFAULT_DOCUMENT_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={uploadExpiry}
                    onChange={(e) => setUploadExpiry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-xs outline-none bg-surface2 text-foreground"
                  />
                </div>
              </div>

              {/* Version & Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
                  Submission Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes for Super Admin / Digital Bot reviewers…"
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border text-xs outline-none bg-surface2 text-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:text-foreground cursor-pointer bg-surface2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !uploadName.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-primary text-black hover:opacity-95 cursor-pointer disabled:opacity-50"
                >
                  <Send size={13} />
                  <span>Submit to Approvals</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {editingDoc && (
        <Modal
          open={Boolean(editingDoc)}
          onClose={() => setEditingDoc(null)}
          title={`Edit Document: ${editingDoc.name}`}
          subtitle={`REF: ${editingDoc.id.toUpperCase()} · Update document metadata and departmental routing`}
          width={650}
        >
          <form onSubmit={handleSaveEditDoc} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Document Title *
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border text-xs outline-none focus:border-primary bg-surface2 text-foreground"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Property / Site *
                </label>
                <CustomDropdown
                  variant="form"
                  width="100%"
                  value={editSite}
                  onChange={(val) => setEditSite(val)}
                  options={propertyOptions.map((name) => ({ value: name, label: name }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Target Department *
                </label>
                <CustomDropdown
                  variant="form"
                  width="100%"
                  value={editDept}
                  onChange={(val) => setEditDept(val)}
                  options={[
                    'Kitchen',
                    'Maintenance',
                    'Housekeeping',
                    'Front Office',
                    'F&B',
                    'Finance',
                    'Engineering',
                    'HR & People',
                    'Legal & Compliance',
                    'Operations',
                    'Plant Room',
                    'Reception',
                    'Public Areas',
                  ].map((dept) => ({ value: dept, label: dept }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Category *
                </label>
                <CustomDropdown
                  variant="form"
                  width="100%"
                  value={editCategory}
                  onChange={(val) => setEditCategory(val)}
                  options={DEFAULT_DOCUMENT_CATEGORIES.map((c) => ({ value: c, label: c }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={editExpiry}
                  onChange={(e) => setEditExpiry(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border text-xs outline-none focus:border-primary bg-surface2 text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={editVersion}
                  onChange={(e) => setEditVersion(e.target.value)}
                  placeholder="e.g. v1.0"
                  className="w-full px-3 py-2 rounded-xl border border-border text-xs outline-none focus:border-primary bg-surface2 text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Approval Status
                </label>
                <CustomDropdown
                  variant="form"
                  width="100%"
                  value={editApprovalStatus}
                  onChange={(val) => setEditApprovalStatus(val as ApprovalStatus)}
                  options={[
                    { value: 'pending', label: 'Pending Review', color: '#f59e0b' },
                    { value: 'hold', label: 'On Hold', color: '#ef4444' },
                    { value: 'approved', label: 'Approved & Dispatched', color: '#10b981' },
                  ]}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Notes & Instructions
              </label>
              <textarea
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Any special remarks for review or department team…"
                className="w-full px-3 py-2 rounded-xl border border-border text-xs outline-none focus:border-primary bg-surface2 text-foreground"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground bg-surface2 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="samko-btn-primary px-5 py-2 text-xs font-semibold flex items-center gap-1.5"
              >
                <Check size={13} />
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(docToDelete)}
        onClose={() => setDocToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Confirm Document Deletion"
        itemIdentifier={docToDelete?.id}
        itemName={docToDelete?.name || 'Document'}
        registerName="Approvals Register"
        isDeleting={isDeleting}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Confirm Bulk Deletion"
        itemName={`${selectedIds.length} Selected Documents`}
        registerName="approvals queue"
        customWarning={`Are you sure you want to permanently delete these ${selectedIds.length} selected documents from the approvals queue? This action cannot be undone.`}
        confirmButtonText={`Delete ${selectedIds.length} Documents`}
        isDeleting={isBulkDeleting}
      />
    </div>
  );
}
