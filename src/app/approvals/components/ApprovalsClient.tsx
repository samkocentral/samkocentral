'use client';

import { api } from '@/lib/api';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ChevronDown,
  X,
  Check,
  Eye,
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
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/authContext';
import { ASSETS, HOTELS, ASSET_CATEGORIES, DEPARTMENTS, type Asset } from '@/lib/assetData';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import { useDeepPageCms, addDropdownOption, removeDropdownOptionByName } from '@/lib/deepPageCms';

export interface ApprovalSubmission extends Partial<Asset> {
  id: string;
  assetId: string;
  name: string;
  category: string;
  hotelId: string;
  hotelName: string;
  approvalStatus: 'pending' | 'hold' | 'approved';
  department?: string;
  location?: string;
  roomNumber?: string;
  condition?: any;
  status?: any;
  riskLevel?: any;
  isFixed?: boolean;
  purchaseCost?: number;
  installationDate?: string;
  warrantyExpiry?: string;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  serialNumber?: string;
  submittedBy?: string;
  submittedDate?: string;
  approvalNotes?: string;
  attachedDocName?: string;
  attachedDocUrl?: string;
  attachedDocSize?: string;
  attachedDocType?: string;
}

// Load from real asset database (samko_all_assets)
function loadRealSubmissions(): ApprovalSubmission[] {
  let raw: any[] = ASSETS;
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('samko_all_assets') || sessionStorage.getItem('samko_all_assets');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          raw = parsed;
        }
      }
    } catch (e) {}
  }

  // Load real attached asset documents if available
  const docsMap: Record<string, any> = {};
  if (typeof window !== 'undefined') {
    try {
      const savedDocs = localStorage.getItem('samko_asset_documents') || sessionStorage.getItem('samko_asset_documents');
      if (savedDocs) {
        const parsedDocs = JSON.parse(savedDocs);
        if (Array.isArray(parsedDocs)) {
          parsedDocs.forEach((d: any) => {
            if (d.assetId) docsMap[d.assetId] = d;
          });
        }
      }
    } catch (e) {}
  }

  return raw.map((a: any, idx: number) => {
    const doc = docsMap[a.assetId || a.id] || docsMap[a.id];
    const explicitApproval = a.approvalStatus;
    const approvalStatus: 'pending' | 'hold' | 'approved' =
      explicitApproval || (a.status === 'under-maintenance' ? 'pending' : 'approved');

    // Interconnection: If approved, status is active. If pending or hold, status is under-maintenance
    const status = approvalStatus === 'approved' ? 'active' : 'under-maintenance';

    const submittedBy =
      a.submittedBy ||
      (idx === 0
        ? 'Marcus Webb (Property Manager)'
        : idx === 1
        ? 'Sarah Chen (Lead Engineer)'
        : idx === 2
        ? 'Priya Sharma (Operations)'
        : 'Alexander Vance (Super Admin)');

    const submittedDate =
      a.submittedDate || (idx === 0 ? 'Today, 09:30' : idx === 1 ? 'Yesterday, 14:15' : idx === 2 ? '02 Nov 2026' : 'Archived');

    const cleanName = a.name || 'Equipment Asset';

    return {
      ...a,
      id: a.id || a.assetId,
      assetId: a.assetId || a.id,
      hotelName: a.hotelName || HOTELS.find((h) => h.id === a.hotelId)?.name || 'Crowne Plaza Kingston-south',
      approvalStatus,
      status,
      submittedBy,
      submittedDate,
      attachedDocName:
        a.attachedDocName ||
        doc?.fullName ||
        doc?.name ||
        (idx < 5 ? `${cleanName.replace(/[^a-zA-Z0-9]/g, '_')}_Compliance.pdf` : undefined),
      attachedDocUrl: a.attachedDocUrl || doc?.url || '',
      attachedDocSize: a.attachedDocSize || doc?.size || '2.4 MB',
      attachedDocType: a.attachedDocType || doc?.type || 'PDF',
      approvalNotes:
        a.approvalNotes ||
        (idx === 0
          ? 'Commissioning sign-off and safety audit submitted for Super Admin review.'
          : idx === 1
          ? 'Statutory inspection report and PPM sign-off completed by contractor.'
          : idx === 2
          ? 'Awaiting engineer re-test before final sign-off.'
          : 'Statutory sign-off verified and compliant.'),
    };
  });
}

function createSamplePdfBlob(submission: ApprovalSubmission): { url: string; filename: string } {
  if (submission.attachedDocUrl) {
    return {
      url: submission.attachedDocUrl,
      filename: submission.attachedDocName || `${submission.assetId}_Document.pdf`,
    };
  }

  const safeName = (submission.name || 'Equipment Asset').replace(/[()]/g, '');
  const safeProp = (submission.hotelName || 'Crowne Plaza').replace(/[()]/g, '');
  const safeSubmitter = (submission.submittedBy || 'Administrator').replace(/[()]/g, '');
  const safeDate = submission.submittedDate || new Date().toLocaleDateString('en-GB');
  const safeNotes = (submission.approvalNotes || 'Statutory review and compliance attached.').replace(/[()]/g, '');

  const streamContent = `BT\n/F1 18 Tf\n50 720 Td\n(SAMKO CENTRAL UK - STATUTORY APPROVAL SUBMISSION) Tj\n/F1 13 Tf\n0 -36 Td\n(Asset ID: ${submission.assetId}) Tj\n/F1 12 Tf\n0 -24 Td\n(Asset Name: ${safeName}) Tj\n0 -20 Td\n(Property / Site: ${safeProp}) Tj\n0 -20 Td\n(Category: ${submission.category}) Tj\n0 -20 Td\n(Submitted By: ${safeSubmitter}) Tj\n0 -20 Td\n(Submission Date: ${safeDate}) Tj\n0 -20 Td\n(Approval Status: ${submission.approvalStatus.toUpperCase()}) Tj\n0 -28 Td\n(Notes: ${safeNotes.slice(0, 75)}) Tj\n0 -35 Td\n(COMPLIANCE VALIDATION: READY FOR SUPER ADMIN SIGN-OFF) Tj\nET`;

  const streamLength = streamContent.length;
  const pdfSource = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000224 00000 n \n0000000500 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n600\n%%EOF`;

  const blob = new Blob([pdfSource], { type: 'application/pdf' });
  return {
    url: URL.createObjectURL(blob),
    filename: submission.attachedDocName || `${submission.assetId}_SignOff.pdf`,
  };
}

export default function ApprovalsClient() {
  const router = useRouter();
  const { user, isViewer, canEdit, canUpload, canDelete } = useAuth();
  const isSuperAdminOrBot =
    user.roleLevel === 'L1' ||
    user.id === 'usr-bot-001' ||
    user.name?.toLowerCase().includes('digital bot');

  // Load submissions directly from real asset database
  const [submissions, setSubmissions] = useState<ApprovalSubmission[]>(() => {
    return loadRealSubmissions();
  });

  // Keep synced with external changes and fetch live assets
  useEffect(() => {
    let mounted = true;
    const handleSync = () => {
      setSubmissions(loadRealSubmissions());
    };
    window.addEventListener('samko:assets-changed', handleSync);
    window.addEventListener('samko:data-changed', handleSync);
    window.addEventListener('storage', handleSync);

    api.assets.getAll().then((res) => {
      if (mounted && res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setSubmissions((prev) => {
          const map = new Map(prev.map((p) => [p.id || p.assetId, p]));
          const merged: ApprovalSubmission[] = res.data.map((item: any) => {
            const existing = map.get(item.id || item.assetId);
            const approvalStatus: 'pending' | 'hold' | 'approved' =
              existing?.approvalStatus || item.approvalStatus || (item.status === 'under-maintenance' ? 'pending' : 'approved');
            const status = approvalStatus === 'approved' ? 'active' : 'under-maintenance';
            return {
              ...item,
              ...(existing || {}),
              id: item.id || item.assetId,
              assetId: item.assetId || item.id,
              hotelName: item.hotelName || HOTELS.find((h) => h.id === item.hotelId)?.name || 'Crowne Plaza Kingston-south',
              approvalStatus,
              status,
              submittedBy: existing?.submittedBy || item.submittedBy || 'Alexander Vance (Super Admin)',
              submittedDate: existing?.submittedDate || item.submittedDate || 'Today, 09:30',
            };
          });
          try {
            localStorage.setItem('samko_all_assets', JSON.stringify(merged));
            sessionStorage.setItem('samko_all_assets', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    }).catch(() => {});

    return () => {
      mounted = false;
      window.removeEventListener('samko:assets-changed', handleSync);
      window.removeEventListener('samko:data-changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const saveSubmissions = (newList: ApprovalSubmission[]) => {
    setSubmissions(newList);
    if (typeof window !== 'undefined') {
      try {
        let mergedAll: any[] = [...newList];
        const cached = localStorage.getItem('samko_all_assets') || sessionStorage.getItem('samko_all_assets');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            const newMap = new Map(newList.map((item) => [item.id || item.assetId, item]));
            mergedAll = parsed.map((item: any) => {
              const match = newMap.get(item.id || item.assetId);
              return match ? { ...item, ...match } : item;
            });
            newList.forEach((item) => {
              const k = item.id || item.assetId;
              if (!mergedAll.some((x: any) => (x.id || x.assetId) === k)) {
                mergedAll.unshift(item);
              }
            });
          }
        }
        sessionStorage.setItem('samko_all_assets', JSON.stringify(mergedAll));
        localStorage.setItem('samko_all_assets', JSON.stringify(mergedAll));
        sessionStorage.removeItem('samko_approvals_submissions');
        localStorage.removeItem('samko_approvals_submissions');
        window.dispatchEvent(new CustomEvent('samko:approvals-changed', { detail: { submissions: newList } }));
        window.dispatchEvent(new CustomEvent('samko:assets-changed', { detail: { assets: mergedAll } }));
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'assets' } }));
      } catch (e) {}
    }
  };

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'hold' | 'approved'>('pending');
  const [filterProperty, setFilterProperty] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');

  // Dynamic asset categories synced with deepPageCms and localStorage
  const { dropdowns: cmsDropdowns } = useDeepPageCms('assets');
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('samko_asset_categories');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  const categoryDropdown = (cmsDropdowns || []).find((d) => d.id === 'category' || d.id === 'asset-cat');
  const allCategories = useMemo(() => {
    const cmsOptions = categoryDropdown?.options || [];
    const deleted = new Set((categoryDropdown?.deletedOptions || []).map((o) => o.toLowerCase()));
    const merged = new Set<string>();

    cmsOptions.forEach((o) => {
      const clean = o.trim();
      if (clean && !clean.toLowerCase().startsWith('all ') && !deleted.has(clean.toLowerCase())) {
        merged.add(clean);
      }
    });

    ASSET_CATEGORIES.forEach((c) => {
      const clean = c.name.trim();
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

  useEffect(() => {
    const handleCategorySync = () => {
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('samko_asset_categories');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) setCustomCategories(parsed);
          }
        } catch {}
      }
    };
    window.addEventListener('samko:categories_updated', handleCategorySync);
    window.addEventListener('samko:deep-cms-updated', handleCategorySync);
    window.addEventListener('samko:data-changed', handleCategorySync);
    return () => {
      window.removeEventListener('samko:categories_updated', handleCategorySync);
      window.removeEventListener('samko:deep-cms-updated', handleCategorySync);
      window.removeEventListener('samko:data-changed', handleCategorySync);
    };
  }, []);

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const c = newCatName.trim();
    if (!c) return;
    addDropdownOption('assets', 'asset-cat', c);
    addDropdownOption('assets', 'category', c);
    addDropdownOption('nonfixed', 'asset-cat', c);
    addDropdownOption('nonfixed', 'category', c);
    if (!customCategories.includes(c)) {
      const updated = [...customCategories, c];
      setCustomCategories(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('samko_asset_categories', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('samko:categories_updated', { detail: { categories: updated } }));
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'category', name: c } }));
      }
    }
    toast.success('Category Created', { description: `Added "${c}" to categories` });
    setNewCatName('');
  };

  const handleDeleteCategory = (catName: string) => {
    removeDropdownOptionByName('assets', 'asset-cat', catName);
    removeDropdownOptionByName('assets', 'category', catName);
    removeDropdownOptionByName('nonfixed', 'asset-cat', catName);
    removeDropdownOptionByName('nonfixed', 'category', catName);
    const updated = customCategories.filter((c) => c.toLowerCase() !== catName.toLowerCase());
    setCustomCategories(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('samko_asset_categories', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('samko:categories_updated', { detail: { categories: updated } }));
      window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'category_deleted', name: catName } }));
    }
    setFilterCategory((prev) => (prev === catName ? 'all' : prev));
    toast.success(`Removed category "${catName}"`);
  };

  // Preview & Delete states
  const [previewSubmission, setPreviewSubmission] = useState<ApprovalSubmission | null>(null);
  const [submissionToDelete, setSubmissionToDelete] = useState<ApprovalSubmission | null>(null);
  const [docToDelete, setDocToDelete] = useState<ApprovalSubmission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Replace Document file input ref
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);
  const [replacingSubmissionId, setReplacingSubmissionId] = useState<string | null>(null);

  // New Submission Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newForm, setNewForm] = useState({
    name: '',
    category: 'HVAC',
    hotelId: 'hotel-001',
    hotelName: 'Crowne Plaza Kingston-south',
    department: 'Engineering',
    location: '',
    purchaseCost: 0,
    notes: '',
    fileName: '',
    fileSize: '',
    fileUrl: '',
  });

  // Calculate stats
  const pendingCount = useMemo(() => submissions.filter((s) => s.approvalStatus === 'pending').length, [submissions]);
  const holdCount = useMemo(() => submissions.filter((s) => s.approvalStatus === 'hold').length, [submissions]);
  const approvedCount = useMemo(() => submissions.filter((s) => s.approvalStatus === 'approved').length, [submissions]);

  // Filtered list
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (filterStatus !== 'all' && s.approvalStatus !== filterStatus) return false;
      if (filterProperty !== 'all' && s.hotelId !== filterProperty) return false;
      if (filterCategory !== 'all' && s.category !== filterCategory) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          s.assetId.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          (s.submittedBy || '').toLowerCase().includes(q) ||
          (s.hotelName || '').toLowerCase().includes(q) ||
          (s.category || '').toLowerCase().includes(q) ||
          (s.attachedDocName || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [submissions, filterStatus, filterProperty, filterCategory, search]);

  // Handle status update
  const handleUpdateStatus = async (id: string, newStatus: 'pending' | 'hold' | 'approved') => {
    const updatedStatus = newStatus === 'approved' ? 'active' : 'under-maintenance';
    const updated = submissions.map((s) => {
      if (s.id === id || s.assetId === id) {
        return {
          ...s,
          approvalStatus: newStatus,
          // Interconnection: when approved -> active! when pending or hold -> under-maintenance
          status: updatedStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });
    saveSubmissions(updated);

    if (previewSubmission && (previewSubmission.id === id || previewSubmission.assetId === id)) {
      setPreviewSubmission((prev) => (prev ? {
        ...prev,
        approvalStatus: newStatus,
        status: updatedStatus
      } : null));
    }

    const changedItem = updated.find((s) => s.id === id || s.assetId === id);
    const dept = changedItem?.department || 'Relevant Department';

    const label =
      newStatus === 'approved'
        ? `Approved & Moved to Active in ${dept}`
        : newStatus === 'hold'
        ? `Placed on Hold in ${dept} (Under Maintenance)`
        : `Pending Review for ${dept} (Under Maintenance)`;
    toast.success(label, {
      description: `Asset ${changedItem?.name || id} is now ${newStatus === 'approved' ? 'ACTIVE' : 'UNDER MAINTENANCE'} in ${dept}`,
    });

    try {
      await api.assets.update(id, {
        approvalStatus: newStatus,
        status: updatedStatus,
      });
    } catch (err) {
      console.warn('Failed to sync asset update to API:', err);
    }
  };

  // Handle document file replace
  const handleFilePickedForReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingSubmissionId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      const updated = submissions.map((s) => {
        if (s.id === replacingSubmissionId || s.assetId === replacingSubmissionId) {
          const next = {
            ...s,
            attachedDocName: file.name,
            attachedDocSize: sizeStr,
            attachedDocType: file.name.split('.').pop()?.toUpperCase() || 'PDF',
            attachedDocUrl: dataUrl,
          };
          if (previewSubmission && (previewSubmission.id === s.id || previewSubmission.assetId === s.id)) {
            setPreviewSubmission(next);
          }
          return next;
        }
        return s;
      });

      saveSubmissions(updated);
      toast.success('Document Replaced Successfully', {
        description: `New file: ${file.name} (${sizeStr})`,
      });
    };
    reader.readAsDataURL(file);

    e.target.value = '';
    setReplacingSubmissionId(null);
  };

  // Handle document detachment / deletion
  const handleDeleteDocument = (id: string) => {
    const updated = submissions.map((s) => {
      if (s.id === id || s.assetId === id) {
        const next = {
          ...s,
          attachedDocName: undefined,
          attachedDocUrl: undefined,
          attachedDocSize: undefined,
          attachedDocType: undefined,
        };
        if (previewSubmission && (previewSubmission.id === s.id || previewSubmission.assetId === s.id)) {
          setPreviewSubmission(next);
        }
        return next;
      }
      return s;
    });
    saveSubmissions(updated);
    toast.success('Attached Document Deleted', {
      description: 'Document record removed from this submission.',
    });
  };

  // Handle asset deletion
  const handleDeleteSubmission = (id: string) => {
    const updated = submissions.filter((s) => s.id !== id && s.assetId !== id);
    saveSubmissions(updated);
    if (previewSubmission && (previewSubmission.id === id || previewSubmission.assetId === id)) {
      setPreviewSubmission(null);
    }
    toast.success('Submission Deleted', {
      description: 'Record permanently removed from database.',
    });
  };

  // Handle creating new submission (saves to real assets register!)
  const handleCreateSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name) {
      toast.error('Asset Name is required');
      return;
    }

    const newId = `AST-${Date.now().toString().slice(-4)}`;
    const newSubmission: ApprovalSubmission = {
      id: newId,
      assetId: newId,
      name: newForm.name,
      category: newForm.category,
      hotelId: newForm.hotelId,
      hotelName: HOTELS.find((h) => h.id === newForm.hotelId)?.name || 'Crowne Plaza Kingston-south',
      department: newForm.department,
      location: newForm.location || 'Site Location',
      roomNumber: 'Main Area',
      condition: 'excellent',
      status: 'active',
      isFixed: true,
      purchaseCost: Number(newForm.purchaseCost) || 0,
      approvalStatus: 'pending',
      submittedBy: 'Property / PropCo Admin',
      submittedDate: 'Just now',
      approvalNotes: newForm.notes || 'Newly added asset submitted for Super Admin review and statutory approval.',
      attachedDocName: newForm.fileName || `${newForm.name.replace(/[^a-zA-Z0-9]/g, '_')}_Certificate.pdf`,
      attachedDocUrl: newForm.fileUrl || '',
      attachedDocSize: newForm.fileSize || '1.5 MB',
      attachedDocType: 'PDF',
    };

    saveSubmissions([newSubmission, ...submissions]);
    setShowAddModal(false);
    setNewForm({
      name: '',
      category: 'HVAC',
      hotelId: 'hotel-001',
      hotelName: 'Crowne Plaza Kingston-south',
      department: 'Engineering',
      location: '',
      purchaseCost: 0,
      notes: '',
      fileName: '',
      fileSize: '',
      fileUrl: '',
    });

    toast.success('Asset Submission Logged for Approval', {
      description: `${newId} - ${newSubmission.name} saved to live asset database in Pending Review`,
    });
  };

  if (!isSuperAdminOrBot) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-bold font-head text-foreground mb-2">Access Restricted</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          The Approvals Register is restricted exclusively to Super Admin (L1) and Digital Bot. Other users (PropCo Admin, OpCo Admin, Uploader, Viewer) do not have permission to view or approve submissions.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Hidden file input for Replace Document */}
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
          style={{ background: 'var(--surface)', borderColor: 'rgba(245,158,11,0.25)' }}
        >
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Pending Review
            </span>
            <div className="text-2xl font-bold font-head text-amber-400 mt-1">{pendingCount}</div>
            <span className="text-[11px] text-muted-foreground">Awaiting Admin Sign-Off</span>
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
              On Hold
            </span>
            <div className="text-2xl font-bold font-head text-rose-400 mt-1">{holdCount}</div>
            <span className="text-[11px] text-muted-foreground">Requires Clarification / Docs</span>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/15 text-rose-400">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div
          className="p-4 rounded-xl border flex items-center justify-between"
          style={{ background: 'var(--surface)', borderColor: 'rgba(61,214,140,0.25)' }}
        >
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Approved
            </span>
            <div className="text-2xl font-bold font-head text-emerald-400 mt-1">{approvedCount}</div>
            <span className="text-[11px] text-muted-foreground">Active on Live Register</span>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div
          className="p-4 rounded-xl border border-border flex items-center justify-between"
          style={{ background: 'var(--surface)' }}
        >
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Total Assets in Register
            </span>
            <div className="text-2xl font-bold font-head text-foreground mt-1">{submissions.length}</div>
            <span className="text-[11px] text-muted-foreground">Across All Sites</span>
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
        {/* Action Bar */}
        <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border flex-1 min-w-64 max-w-md" style={{ background: 'var(--surface2)' }}>
            <Search size={15} className="text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by asset ID, name, submitter, property..."
              className="bg-transparent text-xs text-foreground outline-none w-full"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Property Filter */}
            <select
              value={filterProperty}
              onChange={(e) => setFilterProperty(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border text-xs outline-none cursor-pointer"
              style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
            >
              <option value="all">All Properties</option>
              {HOTELS.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border text-xs outline-none cursor-pointer"
              style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
            >
              <option value="all">All Categories</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border text-xs outline-none cursor-pointer"
              style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
            >
              <option value="all">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* Add Category Button */}
            {canUpload && (
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-border transition-colors hover:border-primary cursor-pointer"
                style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
              >
                <Tag size={13} style={{ color: 'var(--primary)' }} />
                Add Category
              </button>
            )}

            {/* Add Submission Button */}
            {canUpload && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="samko-btn-primary flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                <Plus size={14} /> Add Submission
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-black/10 overflow-x-auto">
          {[
            { id: 'pending', label: 'Pending Review', count: pendingCount, color: '#f59e0b' },
            { id: 'hold', label: 'On Hold', count: holdCount, color: '#f43f5e' },
            { id: 'approved', label: 'Approved', count: approvedCount, color: '#3dd68c' },
            { id: 'all', label: 'All Assets', count: submissions.length },
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

        {/* Submissions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider" style={{ background: 'var(--surface2)' }}>
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Asset Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Property / Site</th>
                <th className="py-3 px-4">Submitted By</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Attached Document</th>
                <th className="py-3 px-4">Approval Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <p className="font-medium">No assets found in this approvals view.</p>
                    <p className="text-[11px] mt-1">Try switching tabs or adjusting search filters.</p>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => {
                  const isApproved = sub.approvalStatus === 'approved';
                  const isPending = sub.approvalStatus === 'pending';
                  const isHold = sub.approvalStatus === 'hold';

                  const badgeBg = isApproved
                    ? 'rgba(61,214,140,0.14)'
                    : isHold
                    ? 'rgba(244,63,94,0.14)'
                    : 'rgba(245,158,11,0.14)';
                  const badgeColor = isApproved ? '#3dd68c' : isHold ? '#f43f5e' : '#f59e0b';
                  const badgeBorder = isApproved
                    ? '1px solid rgba(61,214,140,0.35)'
                    : isHold
                    ? '1px solid rgba(244,63,94,0.35)'
                    : '1px solid rgba(245,158,11,0.35)';

                  return (
                    <tr
                      key={sub.id || sub.assetId}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Asset ID */}
                      <td className="py-3 px-4 font-mono font-semibold text-primary">
                        {sub.assetId || sub.id}
                      </td>

                      {/* Asset Name */}
                      <td className="py-3 px-4 font-medium text-foreground max-w-xs truncate">
                        {sub.name}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--surface3)', color: 'var(--text2)' }}>
                          {sub.category}
                        </span>
                      </td>

                      {/* Property & Department */}
                      <td className="py-3 px-4 truncate max-w-[180px]">
                        <div className="text-foreground font-medium truncate">{sub.hotelName}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          <span className="font-medium text-primary/80">{sub.department || 'Operations'}</span>
                        </div>
                      </td>

                      {/* Submitted By */}
                      <td className="py-3 px-4 text-foreground font-medium truncate max-w-[150px]">
                        {sub.submittedBy || 'Alexander Vance (Super Admin)'}
                      </td>

                      {/* Submission Date */}
                      <td className="py-3 px-4 text-muted-foreground text-[11px]">
                        {sub.submittedDate || 'Recent'}
                      </td>

                      {/* Attached Document with Eye View Button */}
                      <td className="py-3 px-4">
                        {sub.attachedDocName ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewSubmission(sub)}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border hover:border-primary transition-colors text-[11px] cursor-pointer"
                              style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                              title="Click to view attached document"
                            >
                              <Eye size={12} className="text-primary flex-shrink-0" />
                              <span className="truncate max-w-[130px] font-mono">{sub.attachedDocName}</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px] italic">No document</span>
                        )}
                      </td>

                      {/* Approval Status Dropdown */}
                      <td className="py-3 px-4">
                        <div className="relative inline-block">
                          <select
                            value={sub.approvalStatus}
                            onChange={(e) => handleUpdateStatus(sub.id || sub.assetId, e.target.value as any)}
                            disabled={isViewer}
                            className="appearance-none cursor-pointer pl-6 pr-6 py-1 rounded-full text-xs font-semibold outline-none transition-all disabled:opacity-60"
                            style={{
                              background: badgeBg,
                              color: badgeColor,
                              border: badgeBorder,
                            }}
                          >
                            <option value="pending" style={{ background: '#18181b', color: '#f59e0b' }}>Pending</option>
                            <option value="approved" style={{ background: '#18181b', color: '#3dd68c' }}>Approved</option>
                            <option value="hold" style={{ background: '#18181b', color: '#f43f5e' }}>Hold</option>
                          </select>
                          <span
                            className="w-1.5 h-1.5 rounded-full absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ background: badgeColor }}
                          />
                          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Approve Button */}
                          {!isApproved && canEdit && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(sub.id || sub.assetId, 'approved')}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors cursor-pointer"
                              title="Approve Asset and activate in register"
                            >
                              <Check size={12} /> Approve
                            </button>
                          )}

                          {/* Quick Hold Button */}
                          {!isHold && canEdit && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(sub.id || sub.assetId, 'hold')}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-colors cursor-pointer"
                              title="Place on Hold"
                            >
                              <Clock size={12} /> Hold
                            </button>
                          )}

                          {/* Preview Details Button */}
                          <button
                            type="button"
                            onClick={() => setPreviewSubmission(sub)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-white/[0.06] transition-colors cursor-pointer"
                            title="View Document & Submission Details"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Delete Submission Button */}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setSubmissionToDelete(sub)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Submission"
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
      </div>

      {/* ── LIVE DOCUMENT PREVIEW MODAL ── */}
      {previewSubmission && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
          onClick={() => setPreviewSubmission(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[92vh] rounded-2xl border border-border overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border" style={{ background: 'var(--surface2)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/15 text-primary">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base text-foreground">
                    {previewSubmission.attachedDocName || `${previewSubmission.name} - Document`}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {previewSubmission.assetId} &bull; {previewSubmission.hotelName} &bull; {previewSubmission.category}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSubmission(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Submission Meta Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-xl border border-border" style={{ background: 'var(--surface2)' }}>
                <div>
                  <span className="text-[11px] text-muted-foreground block uppercase font-semibold">Submitted By</span>
                  <span className="text-xs font-medium text-foreground">{previewSubmission.submittedBy || 'Property Admin'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block uppercase font-semibold">Date Submitted</span>
                  <span className="text-xs font-medium text-foreground">{previewSubmission.submittedDate || 'Recent'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block uppercase font-semibold">Approval Status</span>
                  <span
                    className="inline-block mt-0.5 text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: previewSubmission.approvalStatus === 'approved' ? 'rgba(61,214,140,0.15)' : previewSubmission.approvalStatus === 'hold' ? 'rgba(244,63,94,0.15)' : 'rgba(245,158,11,0.15)',
                      color: previewSubmission.approvalStatus === 'approved' ? '#3dd68c' : previewSubmission.approvalStatus === 'hold' ? '#f43f5e' : '#f59e0b',
                    }}
                  >
                    {previewSubmission.approvalStatus.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block uppercase font-semibold">File Details</span>
                  <span className="text-xs font-medium text-foreground font-mono">
                    {previewSubmission.attachedDocSize || '2.4 MB'} ({previewSubmission.attachedDocType || 'PDF'})
                  </span>
                </div>
              </div>

              {previewSubmission.approvalNotes && (
                <div className="p-3 rounded-xl border border-border/80 bg-white/[0.02]">
                  <span className="text-[11px] text-muted-foreground font-semibold block uppercase mb-1">
                    Submission Notes & Justification
                  </span>
                  <p className="text-xs text-foreground leading-relaxed">{previewSubmission.approvalNotes}</p>
                </div>
              )}

              {/* Document Live Viewer Surface */}
              <div className="rounded-xl border border-border overflow-hidden bg-black/40 min-h-[360px] flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface3 text-xs">
                  <span className="font-mono text-foreground font-semibold truncate max-w-md">
                    {previewSubmission.attachedDocName || 'Statutory_Compliance_SignOff.pdf'}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primary/20 text-primary">
                    Live PDF Document
                  </span>
                </div>

                <iframe
                  src={createSamplePdfBlob(previewSubmission).url}
                  title={previewSubmission.name}
                  className="w-full h-[380px] border-0"
                />
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-between flex-wrap gap-2" style={{ background: 'var(--surface2)' }}>
              <div className="flex items-center gap-2">
                {/* Replace Document Button */}
                {canUpload && (
                  <button
                    type="button"
                    onClick={() => {
                      setReplacingSubmissionId(previewSubmission.id || previewSubmission.assetId);
                      replaceFileInputRef.current?.click();
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-border hover:border-primary transition-colors cursor-pointer"
                    style={{ background: 'var(--surface3)', color: 'var(--foreground)' }}
                  >
                    <CloudUpload size={14} className="text-primary" /> Replace Document
                  </button>
                )}

                {/* Delete Document Button */}
                {canDelete && previewSubmission.attachedDocName && (
                  <button
                    type="button"
                    onClick={() => {
                      setDocToDelete(previewSubmission);
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
                        `<html><head><title>${previewSubmission.attachedDocName || previewSubmission.name}</title></head><body style="font-family:sans-serif;padding:30px;"><h2>${previewSubmission.name}</h2><p>Asset ID: ${previewSubmission.assetId}</p><p>Property: ${previewSubmission.hotelName}</p><p>Category: ${previewSubmission.category}</p><p>Approval Status: ${previewSubmission.approvalStatus.toUpperCase()}</p><p>Submitted by: ${previewSubmission.submittedBy}</p></body></html>`
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
                    const { url, filename } = createSamplePdfBlob(previewSubmission);
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

      {/* ── ADD SUBMISSION MODAL ── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border" style={{ background: 'var(--surface2)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/20 text-primary">
                  <Plus size={16} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base text-foreground">Add Real Asset Submission</h3>
                  <p className="text-xs text-muted-foreground">Saves directly to live system register in Pending Review</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmission} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                  Asset Name / Equipment Description *
                </label>
                <input
                  type="text"
                  required
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  placeholder="e.g. Daikin Inverter Split Unit 5kW"
                  className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                    Category *
                  </label>
                  <select
                    value={newForm.category}
                    onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {ASSET_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                    Property / Hotel *
                  </label>
                  <select
                    value={newForm.hotelId}
                    onChange={(e) => setNewForm({ ...newForm, hotelId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {HOTELS.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                    Department
                  </label>
                  <select
                    value={newForm.department}
                    onChange={(e) => setNewForm({ ...newForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                    Location / Room
                  </label>
                  <input
                    type="text"
                    value={newForm.location}
                    onChange={(e) => setNewForm({ ...newForm, location: e.target.value })}
                    placeholder="e.g. Plant Room 2"
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                  Attach Compliance / Verification Document
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
                          setNewForm({
                            ...newForm,
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
                  <CloudUpload size={24} className="mx-auto text-primary mb-1.5 opacity-80" />
                  <p className="text-xs font-medium text-foreground">
                    {newForm.fileName ? newForm.fileName : 'Click to select PDF or drag & drop'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">PDF, DOC, XLS, PNG (Max 25MB)</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                  Submission Notes / Justification
                </label>
                <textarea
                  rows={2}
                  value={newForm.notes}
                  onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                  placeholder="Provide context or testing certificate references for Super Admin approval..."
                  className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none resize-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-white/[0.05] transition-colors"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="samko-btn-primary flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
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
            handleDeleteDocument(docToDelete.id || docToDelete.assetId);
          } finally {
            setIsDeleting(false);
            setDocToDelete(null);
          }
        }}
        title="Delete Attached Document"
        itemIdentifier={docToDelete?.attachedDocName}
        itemName={docToDelete?.attachedDocName || 'Attached Document'}
        registerName="Approvals Register"
        customWarning="Are you sure you want to delete this document from the submission? This action cannot be undone."
        isDeleting={isDeleting}
        confirmButtonText="Delete Document"
      />

      {/* ── DELETE SUBMISSION CONFIRMATION MODAL ── */}
      <ConfirmDeleteModal
        isOpen={Boolean(submissionToDelete)}
        onClose={() => setSubmissionToDelete(null)}
        onConfirm={async () => {
          if (!submissionToDelete) return;
          setIsDeleting(true);
          try {
            handleDeleteSubmission(submissionToDelete.id || submissionToDelete.assetId);
          } finally {
            setIsDeleting(false);
            setSubmissionToDelete(null);
          }
        }}
        title="Delete Approval Submission"
        itemIdentifier={submissionToDelete?.assetId}
        itemName={submissionToDelete?.name || 'Submission'}
        registerName="Approvals Register"
        customWarning="Are you sure you want to delete this asset from the database? It will be removed from all registers and review queues."
        isDeleting={isDeleting}
        confirmButtonText="Delete Asset"
      />
    </div>
  );
}
