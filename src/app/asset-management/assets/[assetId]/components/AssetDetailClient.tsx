'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Package, MapPin, Calendar, Wrench, FileText, Camera,
  QrCode, ClipboardCheck, AlertTriangle, CheckCircle2, Clock,
  User, Building2, Tag, Activity, ChevronRight, ChevronDown, Plus,
  Trash2, Eye, Download, X, Upload, Loader2, Maximize2, Printer, ShieldCheck, ExternalLink,
  Edit2, Check
} from 'lucide-react';
import { ASSETS, MAINTENANCE_RECORDS, type Asset, type MaintenanceRecord } from '@/lib/assetData';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { toast } from 'sonner';

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

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: 'rgba(61,214,140,0.12)', color: '#3dd68c', label: 'Active' },
  inactive: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', label: 'Inactive' },
  'under-maintenance': { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Under Maintenance' },
  disposed: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e', label: 'Disposed' },
  lost: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e', label: 'Lost' },
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

export interface AuditEvent {
  id: string | number;
  action: string;
  user: string;
  role: string;
  initials?: string;
  date: string;
  detail: string;
  type?: 'registration' | 'compliance' | 'maintenance' | 'status' | 'document' | 'photo' | 'deletion';
}

// Initial realistic audit trail linked to asset context
const getInitialAuditEvents = (
  targetAsset: Asset | null,
  currentUserName: string,
  currentUserRole: string
): AuditEvent[] => {
  const assetName = targetAsset?.name || 'Carrier Rooftop Air Handler 20kW';
  const assetCode = targetAsset?.assetId || 'AST-BULK-001';
  const hotel = targetAsset?.hotelName || (targetAsset as any)?.propertyName || 'Crowne Plaza Kingston-south';
  const location = targetAsset?.location || 'Roof Level B';
  const statusLabel = targetAsset?.status ? targetAsset.status.replace(/-/g, ' ').toUpperCase() : 'UNDER MAINTENANCE';

  return [
    {
      id: 1,
      action: 'Operational Status Audited',
      user: currentUserName,
      role: `${currentUserRole} · Group Compliance`,
      initials: 'AV',
      date: '2026-10-23T16:45:00',
      detail: `Equipment operational status audited at ${hotel} (${location}). Status verified as ${statusLabel} for ongoing summer ventilation cycle.`,
      type: 'status',
    },
    {
      id: 2,
      action: 'Preventive Maintenance Service Audited',
      user: 'Sarah Chen',
      role: 'Head of Engineering · Regional Operations',
      initials: 'SC',
      date: '2026-06-01T11:00:00',
      detail: `Quarterly compressor filter replacement and electrical run-test passed. Approved contractor HVAC Solutions UK sign-off received.`,
      type: 'maintenance',
    },
    {
      id: 3,
      action: 'Statutory Safety & F-Gas Audit Completed',
      user: 'Marcus Webb',
      role: 'Lead Compliance Auditor · UK Health & Safety',
      initials: 'MW',
      date: '2026-04-01T14:15:00',
      detail: `Statutory F-Gas refrigerant leak test and LOLER/BS EN 378 compliance verification passed with zero non-conformances.`,
      type: 'compliance',
    },
    {
      id: 4,
      action: 'Asset Registered into Central Inventory',
      user: 'Alexander Vance',
      role: 'Super Admin · Portfolio Governance',
      initials: 'AV',
      date: '2024-01-01T09:30:00',
      detail: `Asset ${assetCode} (${assetName}) officially onboarded into Samko Central Fixed Asset Register under Crowne Plaza Kingston-south.`,
      type: 'registration',
    },
  ];
};

export interface AssetDocument {
  id: string;
  name: string;
  fullName?: string;
  type: string;
  size: string;
  date: string;
  uploadedBy?: string;
  url?: string;
}

// Initial documents
const INITIAL_DOCUMENTS: AssetDocument[] = [
  {
    id: 'doc-1',
    name: 'Purchase Invoice',
    fullName: 'Purchase_Invoice_AST001.pdf',
    type: 'PDF',
    size: '1.2 MB',
    date: '2024-01-01',
    uploadedBy: 'Alexander Vance',
    url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'doc-2',
    name: 'Warranty Certificate',
    fullName: 'Warranty_Carrier_HVAC_2024.pdf',
    type: 'PDF',
    size: '0.8 MB',
    date: '2024-01-15',
    uploadedBy: 'Marcus Webb',
    url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'doc-3',
    name: 'Maintenance Manual',
    fullName: 'Carrier_20kW_Maintenance_Manual.pdf',
    type: 'PDF',
    size: '4.5 MB',
    date: '2024-02-01',
    uploadedBy: 'Sarah Chen',
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'doc-4',
    name: 'Last Inspection Report',
    fullName: 'Statutory_Inspection_Q2_2026.pdf',
    type: 'PDF',
    size: '0.6 MB',
    date: '2026-06-01',
    uploadedBy: 'Marcus Webb',
    url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
  },
];

interface AssetPhoto {
  id: string;
  url: string;
  name: string;
  date: string;
  size: string;
}

function getInitialAsset(id: string): Asset | null {
  // 1. Static mock fallback
  const staticFound = ASSETS.find((a) => a.id === id || a.assetId === id);
  if (staticFound) return staticFound;

  // 2. Browser sessionStorage cache (instant 0ms retrieval)
  if (typeof window !== 'undefined') {
    try {
      const single = sessionStorage.getItem(`samko_asset_${id}`) || sessionStorage.getItem('samko_last_clicked_asset');
      if (single) {
        const parsed = JSON.parse(single);
        if (parsed && (parsed.id === id || parsed.assetId === id)) {
          return parsed;
        }
      }
      const all = sessionStorage.getItem('samko_all_assets');
      if (all) {
        const parsedAll = JSON.parse(all);
        if (Array.isArray(parsedAll)) {
          const found = parsedAll.find((a: any) => a.id === id || a.assetId === id);
          if (found) return found;
        }
      }
    } catch {
      // Ignore storage errors
    }
  }
  return null;
}

export default function AssetDetailClient({ assetId }: { assetId: string }) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const [asset, setAsset] = useState<Asset | null>(() => getInitialAsset(assetId));
  const [loading, setLoading] = useState<boolean>(!asset);

  // Dynamic maintenance records for this asset
  const [mRecords, setMRecords] = useState<MaintenanceRecord[]>(() => {
    const initial = getInitialAsset(assetId);
    return MAINTENANCE_RECORDS.filter(
      (m) => m.assetId === initial?.id || m.assetId === initial?.assetId || m.assetId === assetId
    );
  });

  const { user } = useAuth();
  const currentUserName = user?.name || 'Alexander Vance';
  const currentUserRole = user?.roleTitle || 'Super Admin';
  const currentUserInitials = user?.initials || 'AV';

  // Dynamic photos and documents
  const [photos, setPhotos] = useState<AssetPhoto[]>(() => {
    const initial = getInitialAsset(assetId);
    return (
      ((initial as any)?.photos as AssetPhoto[]) || [
        {
          id: 'photo-default-1',
          url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
          name: 'Front View & Nameplate.jpg',
          date: '2026-05-10',
          size: '1.4 MB',
        },
        {
          id: 'photo-default-2',
          url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
          name: 'Inspection Check Area.jpg',
          date: '2026-06-01',
          size: '2.1 MB',
        },
      ]
    );
  });

  const [documents, setDocuments] = useState<AssetDocument[]>(() => {
    const initial = getInitialAsset(assetId);
    return ((initial as any)?.documents as AssetDocument[]) || INITIAL_DOCUMENTS;
  });

  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(() =>
    getInitialAuditEvents(getInitialAsset(assetId), currentUserName, currentUserRole)
  );

  // Document preview state & Delete confirmation state
  const [previewDoc, setPreviewDoc] = useState<AssetDocument | null>(null);
  const [docViewMode, setDocViewMode] = useState<'real' | 'certificate'>('real');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'document' | 'photo';
    id: string;
    name: string;
  } | null>(null);

  const attachDocFileInputRef = useRef<HTMLInputElement>(null);

  // Modals & inputs
  const [previewPhoto, setPreviewPhoto] = useState<AssetPhoto | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    type: 'Preventive Maintenance Check',
    frequency: 'quarterly',
    assignedTo: 'Marcus Webb',
    scheduledDate: new Date().toISOString().split('T')[0],
    nextDueDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    status: 'scheduled',
    notes: '',
  });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Asset>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [showDeleteAssetModal, setShowDeleteAssetModal] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState(false);

  // Fetch asset and maintenance records dynamically
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [assetRes, mRes] = await Promise.allSettled([
        api.assets.getById(assetId),
        api.maintenance.getAll(),
      ]);

      if (assetRes.status === 'fulfilled' && assetRes.value.success && assetRes.value.data) {
        setAsset(assetRes.value.data);
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(`samko_asset_${assetId}`, JSON.stringify(assetRes.value.data));
            sessionStorage.setItem('samko_last_clicked_asset', JSON.stringify(assetRes.value.data));
          } catch {}
        }
        if (assetRes.value.data.photos && assetRes.value.data.photos.length > 0) {
          setPhotos(assetRes.value.data.photos);
        }
        if (assetRes.value.data.documents && assetRes.value.data.documents.length > 0) {
          setDocuments(assetRes.value.data.documents);
        }
      }

      if (mRes.status === 'fulfilled' && mRes.value.success && mRes.value.data) {
        const targetId = asset?.id || assetId;
        const targetCode = asset?.assetId || assetId;
        const matched = mRes.value.data.filter(
          (m: any) => m.assetId === targetId || m.assetId === targetCode || m.assetName === asset?.name
        );
        if (matched.length > 0) {
          setMRecords(matched);
        }
      }
    } catch (e) {
      console.warn('Error loading dynamic asset detail:', e);
    } finally {
      setLoading(false);
    }
  }, [assetId, asset?.id, asset?.assetId, asset?.name]);

  useEffect(() => {
    loadData();
    const handleDataChanged = () => {
      loadData();
    };
    window.addEventListener('samko:data-changed', handleDataChanged);
    return () => window.removeEventListener('samko:data-changed', handleDataChanged);
  }, [loadData]);

  if (loading && !asset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={36} className="animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Loading asset details…</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
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

  const completedMaintenance = mRecords.filter((m) => m.status === 'completed');
  const pendingMaintenance = mRecords.filter((m) => m.status !== 'completed');
  const condStyle = CONDITION_COLORS[asset.condition] || '#60a5fa';
  const riskStyle = RISK_COLORS[asset.riskLevel] || '#3dd68c';
  const statusStyle = STATUS_COLORS[asset.status] || STATUS_COLORS.active;

  // Handle status update dynamically
  const handleStatusChange = async (newStatus: string) => {
    const updated = { ...asset, status: newStatus as any };
    setAsset(updated);
    setAuditEvents((prev) => [
      {
        id: Date.now(),
        action: 'Asset Status Updated',
        user: currentUserName,
        role: currentUserRole,
        initials: currentUserInitials,
        date: new Date().toISOString(),
        detail: `Status changed from ${(asset.status || 'active').replace(/-/g, ' ')} to ${(newStatus || 'active').replace(/-/g, ' ')}`,
        type: 'status',
      },
      ...prev,
    ]);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'asset', id: asset.id, status: newStatus } }));
    }

    toast.success('Asset Status Updated', {
      description: `Status changed to ${(newStatus || 'active').replace('-', ' ').toUpperCase()}`,
    });

    try {
      await api.assets.update(asset.id, { status: newStatus });
    } catch (err) {
      console.error('Failed to sync asset status:', err);
      toast.error('Failed to update status');
    }
  };

  // Handle condition update dynamically
  const handleConditionChange = async (newCondition: string) => {
    const updated = { ...asset, condition: newCondition as any };
    setAsset(updated);
    setAuditEvents((prev) => [
      {
        id: Date.now(),
        action: 'Condition Rating Updated',
        user: currentUserName,
        role: currentUserRole,
        initials: currentUserInitials,
        date: new Date().toISOString(),
        detail: `Condition re-assessed to ${newCondition.toUpperCase()}`,
        type: 'compliance',
      },
      ...prev,
    ]);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'asset', id: asset.id, condition: newCondition } }));
    }

    toast.success('Asset Condition Updated', {
      description: `Condition rating set to ${newCondition.toUpperCase()}`,
    });

    try {
      await api.assets.update(asset.id, { condition: newCondition });
    } catch (err) {
      console.error('Failed to sync asset condition:', err);
      toast.error('Failed to update condition');
    }
  };

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        const newPhoto: AssetPhoto = {
          id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          url: dataUrl,
          name: file.name,
          date: new Date().toISOString().split('T')[0],
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        };

        setPhotos((prev) => {
          const updated = [newPhoto, ...prev];
          api.assets.update(asset.id, { photos: updated }).catch((err) => console.error('Error saving photo:', err));
          return updated;
        });

        setAuditEvents((prev) => [
          {
            id: Date.now(),
            action: 'Condition Photo Uploaded',
            user: currentUserName,
            role: currentUserRole,
            initials: currentUserInitials,
            date: new Date().toISOString(),
            detail: `Uploaded new asset condition photo: "${file.name}"`,
            type: 'photo',
          },
          ...prev,
        ]);
        toast.success('Photo Uploaded', {
          description: `${file.name} saved to asset gallery`,
        });
      };
      reader.readAsDataURL(file);
    });

    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  // Handle Document Upload
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
        const newDoc: AssetDocument = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          fullName: file.name,
          type: ext,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          date: new Date().toISOString().split('T')[0],
          uploadedBy: currentUserName,
          url: dataUrl,
        };

        setDocuments((prev) => {
          const updated = [newDoc, ...prev];
          api.assets.update(asset.id, { documents: updated }).catch((err) => console.error('Error saving document:', err));
          return updated;
        });

        setAuditEvents((prev) => [
          {
            id: Date.now(),
            action: 'Document Uploaded & Archived',
            user: currentUserName,
            role: currentUserRole,
            initials: currentUserInitials,
            date: new Date().toISOString(),
            detail: `Uploaded compliance document: "${file.name}"`,
            type: 'document',
          },
          ...prev,
        ]);

        toast.success('Document Attached', {
          description: `${file.name} added to asset documents`,
        });
      };
      reader.readAsDataURL(file);
    });

    if (docInputRef.current) docInputRef.current.value = '';
  };

  // Handle direct file attachment to an existing document record
  const handleAttachFileToCurrentDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !previewDoc) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const ext = file.name.split('.').pop()?.toUpperCase() || previewDoc.type;

      const updatedDoc: AssetDocument = {
        ...previewDoc,
        url: dataUrl,
        fullName: file.name,
        type: ext,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      };

      setPreviewDoc(updatedDoc);
      setDocuments((prev) => {
        const updated = prev.map((d) => (d.id === previewDoc.id ? updatedDoc : d));
        api.assets.update(asset.id, { documents: updated }).catch((err) => console.error('Error updating doc file:', err));
        return updated;
      });

      toast.success('File Attached Successfully', {
        description: `${file.name} linked to "${previewDoc.name}"`,
      });
    };
    reader.readAsDataURL(file);
    if (attachDocFileInputRef.current) attachDocFileInputRef.current.value = '';
  };

  // Execute deletion after modal confirmation
  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'document') {
      const docId = deleteConfirm.id;
      const docName = deleteConfirm.name;
      setDocuments((prev) => {
        const updated = prev.filter((d) => d.id !== docId);
        api.assets.update(asset.id, { documents: updated }).catch((err) => console.error('Error deleting doc:', err));
        return updated;
      });

      setAuditEvents((prev) => [
        {
          id: Date.now(),
          action: 'Document Deleted & Purged',
          user: currentUserName,
          role: currentUserRole,
          initials: currentUserInitials,
          date: new Date().toISOString(),
          detail: `Permanently removed document: "${docName}" from compliance vault.`,
          type: 'deletion',
        },
        ...prev,
      ]);

      toast.success('Document Deleted Successfully', {
        description: `"${docName}" was purged from asset records.`,
      });
    } else if (deleteConfirm.type === 'photo') {
      const photoId = deleteConfirm.id;
      const photoName = deleteConfirm.name;
      setPhotos((prev) => {
        const updated = prev.filter((p) => p.id !== photoId);
        api.assets.update(asset.id, { photos: updated }).catch((err) => console.error('Error removing photo:', err));
        return updated;
      });

      setAuditEvents((prev) => [
        {
          id: Date.now(),
          action: 'Asset Photo Deleted',
          user: currentUserName,
          role: currentUserRole,
          initials: currentUserInitials,
          date: new Date().toISOString(),
          detail: `Removed photograph: "${photoName}" from asset gallery.`,
          type: 'deletion',
        },
        ...prev,
      ]);

      toast.success('Photo Deleted Successfully', {
        description: `"${photoName}" was removed from asset gallery.`,
      });
    }

    setDeleteConfirm(null);
  };

  // Handle Log Maintenance Submit
  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: any = {
      assetId: asset.id,
      assetName: asset.name,
      hotelId: asset.hotelId || (asset as any).propertyId || 'prop-1',
      hotelName: asset.hotelName || (asset as any).propertyName || 'Property',
      type: logForm.type,
      frequency: logForm.frequency,
      assignedTo: logForm.assignedTo,
      scheduledDate: logForm.scheduledDate,
      nextDueDate: logForm.nextDueDate,
      status: logForm.status,
      notes: logForm.notes,
    };

    try {
      const res = await api.maintenance.create(newRecord);
      const created = res.data || { ...newRecord, id: `m-${Date.now()}` };
      setMRecords((prev) => [created, ...prev]);
      setShowLogModal(false);
      toast.success('Maintenance Scheduled', {
        description: `${logForm.type.toUpperCase()} record scheduled for ${logForm.scheduledDate}`,
      });

      setAuditEvents((prev) => [
        {
          id: Date.now(),
          action: 'Maintenance Scheduled',
          user: currentUserName,
          role: currentUserRole,
          initials: currentUserInitials,
          date: new Date().toISOString(),
          detail: `Scheduled ${logForm.type} assigned to ${logForm.assignedTo}`,
          type: 'maintenance',
        },
        ...prev,
      ]);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'maintenance' } }));
      }
    } catch (err: any) {
      alert(`Error logging maintenance: ${err.message}`);
    }
  };

  const handleOpenEdit = () => {
    setEditFormData({
      name: asset.name,
      category: asset.category,
      hotelName: asset.hotelName || (asset as any).propertyName || 'Crowne Plaza Kingston-south',
      department: asset.department || '',
      location: asset.location || '',
      floor: asset.floor || '',
      serialNumber: asset.serialNumber || '',
      condition: asset.condition,
      status: asset.status,
      riskLevel: (asset.riskLevel || (asset as any).risk || 'low') as any,
      responsibleUser: asset.responsibleUser || '',
      notes: (asset as any).notes || '',
      isFixed: asset.isFixed ?? true,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const updated = {
        ...asset,
        ...editFormData,
        updatedAt: new Date().toISOString(),
      };
      setAsset(updated as Asset);
      await api.assets.update(asset.id, updated);
      toast.success('Asset Updated', { description: `${updated.name} updated successfully` });
      setShowEditModal(false);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`samko_asset_${asset.id}`, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'assets', id: asset.id } }));
      }
    } catch (err: any) {
      toast.error('Failed to update asset');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteAsset = async () => {
    setDeletingAsset(true);
    try {
      await api.assets.delete(asset.id);
      toast.success('Asset Deleted', { description: `${asset.name} removed successfully` });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'assets', id: asset.id } }));
      }
      router.push('/asset-management/assets');
    } catch (err: any) {
      toast.error('Failed to delete asset');
      setDeletingAsset(false);
      setShowDeleteAssetModal(false);
    }
  };

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
      {/* Hidden file inputs for dynamic uploads */}
      <input
        type="file"
        ref={photoInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={docInputRef}
        onChange={handleDocUpload}
        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={attachDocFileInputRef}
        onChange={handleAttachFileToCurrentDoc}
        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
        className="hidden"
      />

      {/* Header */}
      <div
        className="flex items-start gap-4 px-6 py-4 border-b border-border flex-shrink-0"
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

            {/* Interactive Status Dropdown in Header */}
            <div className="relative inline-block">
              <select
                value={asset.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="appearance-none cursor-pointer pl-4 pr-6 py-1 rounded-full text-xs font-semibold outline-none transition-all capitalize"
                style={{
                  background: statusStyle.bg,
                  color: statusStyle.color,
                  border: `1px solid ${statusStyle.color}33`,
                }}
              >
                <option value="active" style={{ background: '#18181b', color: '#3dd68c' }}>Active</option>
                <option value="under-maintenance" style={{ background: '#18181b', color: '#f59e0b' }}>Under Maintenance</option>
                <option value="inactive" style={{ background: '#18181b', color: '#94a3b8' }}>Inactive</option>
                <option value="disposed" style={{ background: '#18181b', color: '#f43f5e' }}>Disposed</option>
                <option value="lost" style={{ background: '#18181b', color: '#f43f5e' }}>Lost</option>
              </select>
              <span
                className="w-1.5 h-1.5 rounded-full absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ background: statusStyle.color }}
              />
              <ChevronDown
                size={11}
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-80"
                style={{ color: statusStyle.color }}
              />
            </div>

            {/* Interactive Condition Dropdown in Header */}
            <div className="relative inline-block">
              <select
                value={asset.condition}
                onChange={(e) => handleConditionChange(e.target.value)}
                className="appearance-none cursor-pointer pl-4 pr-6 py-1 rounded-full text-xs font-semibold outline-none transition-all capitalize"
                style={{
                  background: `${condStyle}18`,
                  color: condStyle,
                  border: `1px solid ${condStyle}33`,
                }}
              >
                <option value="excellent" style={{ background: '#18181b', color: '#3dd68c' }}>Excellent</option>
                <option value="good" style={{ background: '#18181b', color: '#60a5fa' }}>Good</option>
                <option value="fair" style={{ background: '#18181b', color: '#f59e0b' }}>Fair</option>
                <option value="poor" style={{ background: '#18181b', color: '#f97316' }}>Poor</option>
                <option value="critical" style={{ background: '#18181b', color: '#f43f5e' }}>Critical</option>
              </select>
              <span
                className="w-1.5 h-1.5 rounded-full absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ background: condStyle }}
              />
              <ChevronDown
                size={11}
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-80"
                style={{ color: condStyle }}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Building2 size={11} /> {asset.hotelName || (asset as any).propertyName || 'Property'}</span>
            <span className="flex items-center gap-1"><MapPin size={11} /> {asset.location}, {asset.floor}</span>
            <span className="flex items-center gap-1"><Tag size={11} /> {asset.category}</span>
            <span className="flex items-center gap-1"><User size={11} /> {asset.responsibleUser || 'Unassigned'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleOpenEdit}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-surface2 transition-colors text-foreground"
            style={{ background: 'var(--surface2)' }}
            title="Edit Asset Details"
          >
            <Edit2 size={13} /> Edit Asset
          </button>
          <button
            onClick={() => setShowDeleteAssetModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-rose-500/30 hover:bg-rose-500/15 text-rose-400 transition-colors"
            title="Delete Asset Permanently"
          >
            <Trash2 size={13} /> Delete
          </button>
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95"
            style={{ background: 'var(--primary)', color: '#000' }}
          >
            <Wrench size={14} /> Log Maintenance
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-0 px-6 border-b border-border flex-shrink-0 overflow-x-auto"
        style={{ background: 'var(--surface)' }}
      >
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
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
              <IconComponent size={14} />
              {tab.label}
              {tab.id === 'photos' && photos.length > 0 && (
                <span className="px-1.5 py-0.2 rounded text-xs font-bold" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
                  {photos.length}
                </span>
              )}
              {tab.id === 'documents' && documents.length > 0 && (
                <span className="px-1.5 py-0.2 rounded text-xs font-bold" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
                  {documents.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto px-6 py-5">
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
              <InfoRow label="Property" value={asset.hotelName || (asset as any).propertyName} />
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
                      {asset.nextInspectionDate ? new Date(asset.nextInspectionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
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
                    {(asset.responsibleUser || 'Unassigned')
                      .split(' ')
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || 'UN'}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{asset.responsibleUser || 'Unassigned'}</div>
                    <div className="text-xs text-muted-foreground">{asset.responsibleRole || 'Staff Member'}</div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="rounded-xl border border-border p-4" style={{ background: 'var(--surface)' }}>
                <div className="font-head font-bold text-xs mb-3 uppercase tracking-wide text-muted-foreground">Maintenance Stats</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Total Records', value: mRecords.length, color: '#60a5fa' },
                    { label: 'Completed', value: completedMaintenance.length, color: '#3dd68c' },
                    { label: 'Pending', value: pendingMaintenance.length, color: '#f59e0b' },
                    { label: 'Overdue', value: mRecords.filter((m) => m.status === 'overdue').length, color: '#f43f5e' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg p-2.5" style={{ background: 'var(--surface2)' }}>
                      <div className="font-head font-extrabold text-lg" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MAINTENANCE HISTORY ── */}
        {activeTab === 'maintenance' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="font-head font-bold text-sm">{mRecords.length} Maintenance Records</div>
              <button
                onClick={() => setShowLogModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--primary)', color: '#000' }}
              >
                <Wrench size={14} /> Log New Maintenance
              </button>
            </div>

            {mRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Wrench size={32} className="mb-3 opacity-30" />
                <p className="text-sm">No maintenance records yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {mRecords.map((record) => {
                  const isCompleted = record.status === 'completed';
                  const isOverdue = record.status === 'overdue';
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

                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            Scheduled: {new Date(record.scheduledDate).toLocaleDateString('en-GB')}
                          </span>
                          <span
                            className="text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize"
                            style={{
                              background: isCompleted ? 'rgba(61,214,140,0.12)' : isOverdue ? 'rgba(244,63,94,0.12)' : 'rgba(96,165,250,0.12)',
                              color: isCompleted ? '#3dd68c' : isOverdue ? '#f43f5e' : '#60a5fa',
                            }}
                          >
                            {record.status}
                          </span>
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
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-3">Inspection Schedule</div>
              <InfoRow label="Frequency" value={asset.inspectionFrequency} />
              <InfoRow label="Next Due" value={asset.nextInspectionDate ? new Date(asset.nextInspectionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
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

        {/* ── DOCUMENTS (DYNAMIC UPLOAD, VIEW & MANAGEMENT) ── */}
        {activeTab === 'documents' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-head font-bold text-sm">{documents.length} Documents Registered</div>
                <p className="text-xs text-muted-foreground mt-0.5">Statutory certificates, purchase invoices, and maintenance manuals</p>
              </div>
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
                style={{ background: 'var(--primary)', color: '#000' }}
              >
                <Upload size={14} /> Upload Document
              </button>
            </div>

            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-xl border border-border p-4 flex items-start gap-3 transition-all hover:border-primary/50 group"
                  style={{ background: 'var(--surface)' }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer transition-transform group-hover:scale-105"
                    style={{ background: 'rgba(244,63,94,0.1)' }}
                    onClick={() => {
                      setDocViewMode('real');
                      setPreviewDoc(doc);
                    }}
                    title="Click to preview document"
                  >
                    <FileText size={18} style={{ color: '#f43f5e' }} />
                  </div>
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      setDocViewMode('real');
                      setPreviewDoc(doc);
                    }}
                    title="Click to preview document"
                  >
                    <div className="font-semibold text-sm truncate group-hover:text-primary transition-colors" title={doc.fullName || doc.name}>
                      {doc.fullName || doc.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{doc.type} · {doc.size}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(doc.date).toLocaleDateString('en-GB')}
                      {doc.uploadedBy && ` · By ${doc.uploadedBy}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setDocViewMode('real');
                        setPreviewDoc(doc);
                      }}
                      title="View document"
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/25 transition-all flex items-center gap-1"
                    >
                      <Eye size={12} />
                      <span>View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ type: 'document', id: doc.id, name: doc.name })}
                      title="Delete document"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PHOTOS (DYNAMIC IMAGE UPLOAD, GALLERY & LIGHTBOX) ── */}
        {activeTab === 'photos' && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-head font-bold text-sm">{photos.length} Asset Photos Uploaded</div>
                <p className="text-xs text-muted-foreground mt-0.5">High-resolution condition logs and nameplate records</p>
              </div>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95 shadow-sm"
                style={{ background: 'var(--primary)', color: '#000' }}
              >
                <Camera size={14} /> Upload Photos
              </button>
            </div>

            {photos.length === 0 ? (
              <div
                onClick={() => photoInputRef.current?.click()}
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
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold mt-2"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  <Upload size={14} /> Choose Image Files
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative rounded-xl border border-border overflow-hidden flex flex-col"
                    style={{ background: 'var(--surface)' }}
                  >
                    <div className="relative h-44 w-full bg-black/40 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';
                        }}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => setPreviewPhoto(photo)}
                          className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                          title="View Full Size"
                        >
                          <Maximize2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm({ type: 'photo', id: photo.id, name: photo.name })}
                          className="w-9 h-9 rounded-full bg-red-500/30 backdrop-blur-md flex items-center justify-center text-red-300 hover:bg-red-500/50 transition-colors"
                          title="Delete Photo"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-semibold truncate" title={photo.name}>{photo.name}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(photo.date).toLocaleDateString('en-GB')} · {photo.size}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewPhoto(photo)}
                        className="p-1.5 rounded-lg text-primary hover:bg-surface2 transition-colors flex-shrink-0"
                        title="View photo"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── AUDIT TRAIL (VERIFIED AUDITORS & COMPREHENSIVE LOGS) ── */}
        {activeTab === 'audit' && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-head font-bold text-base">Verified Audit Trail ({auditEvents.length} Events)</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Statutory compliance audit log showing who audited each equipment lifecycle event
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck size={13} />
                  <span>Tamper-Evident Ledger</span>
                </span>
              </div>
            </div>

            <div className="relative pl-6 sm:pl-8">
              {/* Timeline spine */}
              <div
                className="absolute left-3 sm:left-4 top-4 bottom-4 w-0.5"
                style={{ background: 'linear-gradient(180deg, var(--primary) 0%, rgba(232,201,122,0.15) 100%)' }}
              />

              <div className="flex flex-col gap-4">
                {auditEvents.map((event, idx) => {
                  const typeColors: Record<string, { bg: string; text: string; border: string }> = {
                    status: { bg: 'rgba(232,201,122,0.12)', text: 'var(--primary)', border: 'rgba(232,201,122,0.3)' },
                    compliance: { bg: 'rgba(61,214,140,0.12)', text: '#3dd68c', border: 'rgba(61,214,140,0.3)' },
                    maintenance: { bg: 'rgba(96,165,250,0.12)', text: '#60a5fa', border: 'rgba(96,165,250,0.3)' },
                    registration: { bg: 'rgba(168,85,247,0.12)', text: '#c084fc', border: 'rgba(168,85,247,0.3)' },
                    document: { bg: 'rgba(244,63,94,0.12)', text: '#f43f5e', border: 'rgba(244,63,94,0.3)' },
                    photo: { bg: 'rgba(45,212,191,0.12)', text: '#2dd4bf', border: 'rgba(45,212,191,0.3)' },
                    deletion: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', border: 'rgba(239,68,68,0.35)' },
                  };
                  const badge = typeColors[event.type || 'status'] || typeColors.status;
                  const formattedDate = new Date(event.date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const formattedTime = new Date(event.date).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div key={event.id} className="relative group">
                      {/* Timeline dot */}
                      <div
                        className="absolute -left-6 sm:-left-8 top-4 w-6 h-6 rounded-full flex items-center justify-center -translate-x-1/2 z-10 shadow-md"
                        style={{
                          background: idx === 0 ? 'var(--primary)' : '#1a202c',
                          border: idx === 0 ? '2px solid #000' : '2px solid var(--border)',
                        }}
                      >
                        <Activity size={12} style={{ color: idx === 0 ? '#000' : 'var(--text2)' }} />
                      </div>

                      {/* Card Content */}
                      <div
                        className="rounded-2xl border p-4 sm:p-5 transition-all hover:border-primary/40 shadow-sm"
                        style={{
                          background: 'var(--surface)',
                          borderColor: idx === 0 ? 'rgba(232,201,122,0.35)' : 'var(--border)',
                        }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-head font-bold text-sm text-foreground">{event.action}</span>
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                              style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}
                            >
                              {event.type || 'Audit'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                            <Clock size={12} />
                            <span>{formattedDate} {formattedTime !== '00:00' && formattedTime !== 'Invalid Date' ? `· ${formattedTime}` : ''}</span>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed mb-3.5">
                          {event.detail}
                        </p>

                        {/* Dedicated WHO AUDITED Section */}
                        <div
                          className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border"
                          style={{
                            background: 'var(--surface2)',
                            borderColor: 'rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm"
                              style={{ background: 'var(--primary)', color: '#000' }}
                            >
                              {event.initials ||
                                event.user
                                  .split(' ')
                                  .filter(Boolean)
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase() ||
                                'AU'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                  Audited by:
                                </span>
                                <span className="text-xs font-bold text-foreground">
                                  {event.user}
                                </span>
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {event.role || 'Super Admin · Operations Compliance'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                            <CheckCircle2 size={13} className="text-emerald-400" />
                            <span>Verified Entry</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Photo Lightbox Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-border overflow-hidden"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="text-sm font-semibold truncate">{previewPhoto.name}</div>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>
            <div className="overflow-auto p-4 flex items-center justify-center bg-black/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPhoto.url}
                alt={previewPhoto.name}
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>
            <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>Uploaded on {new Date(previewPhoto.date).toLocaleDateString('en-GB')}</span>
              <span>{previewPhoto.size}</span>
            </div>
          </div>
        </div>
      )}

      {/* Log Maintenance Modal */}
      {showLogModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowLogModal(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-border p-6 overflow-hidden"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <div>
                <h2 className="font-head font-bold text-lg">Log Maintenance</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Record for {asset.name} ({asset.assetId})</p>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateMaintenance} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Maintenance Type</label>
                <input
                  type="text"
                  required
                  value={logForm.type}
                  onChange={(e) => setLogForm({ ...logForm, type: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-border outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  placeholder="e.g. Quarterly PPM, Fire Safety Check, Filter Replacement"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Frequency</label>
                  <select
                    value={logForm.frequency}
                    onChange={(e) => setLogForm({ ...logForm, frequency: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-border outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="6-monthly">6-Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Assigned To</label>
                  <input
                    type="text"
                    required
                    value={logForm.assignedTo}
                    onChange={(e) => setLogForm({ ...logForm, assignedTo: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-border outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    required
                    value={logForm.scheduledDate}
                    onChange={(e) => setLogForm({ ...logForm, scheduledDate: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-border outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Initial Status</label>
                  <select
                    value={logForm.status}
                    onChange={(e) => setLogForm({ ...logForm, status: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-border outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="due-today">Due Today</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Notes / Instructions</label>
                <textarea
                  rows={3}
                  value={logForm.notes}
                  onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                  placeholder="Add inspection notes or contractor requirements..."
                  className="w-full text-sm px-3 py-2 rounded-lg border border-border outline-none resize-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold border border-border"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (() => {
        const isImageDoc =
          previewDoc.url?.startsWith('data:image/') ||
          ['JPEG', 'JPG', 'PNG', 'WEBP', 'GIF', 'SVG'].includes((previewDoc.type || '').toUpperCase()) ||
          /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(previewDoc.url || '') ||
          /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(previewDoc.fullName || previewDoc.name || '');

        const isPdfDoc =
          previewDoc.url?.startsWith('data:application/pdf') ||
          (previewDoc.type || '').toUpperCase() === 'PDF' ||
          /\.pdf$/i.test(previewDoc.url || '') ||
          /\.pdf$/i.test(previewDoc.fullName || previewDoc.name || '');

        const handleDownload = () => {
          if (previewDoc.url) {
            const a = document.createElement('a');
            a.href = previewDoc.url;
            a.download = previewDoc.fullName || `${previewDoc.name}.${(previewDoc.type || 'file').toLowerCase()}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast.success('Document Download Started', {
              description: `Downloading ${previewDoc.fullName || previewDoc.name}`,
            });
          } else {
            toast.info('No binary file attached yet to download');
          }
        };

        const handlePrint = () => {
          if (previewDoc.url && isImageDoc) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(`
                <html>
                  <head><title>Print ${previewDoc.name}</title></head>
                  <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff;">
                    <img src="${previewDoc.url}" style="max-width:100%;max-height:100vh;object-fit:contain;" onload="window.print();window.close();" />
                  </body>
                </html>
              `);
              printWindow.document.close();
            }
          } else {
            window.print();
          }
        };

        return (
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
            onClick={() => setPreviewDoc(null)}
          >
            <div
              className="relative w-full max-w-4xl max-h-[94vh] flex flex-col rounded-2xl border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150"
              style={{ background: '#12161f', borderColor: 'rgba(232, 201, 122, 0.35)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-border bg-surface2/70">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/15 border border-red-500/30 text-red-500 flex-shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-head font-bold text-sm truncate text-foreground" title={previewDoc.fullName || previewDoc.name}>
                        {previewDoc.fullName || previewDoc.name}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 uppercase">
                        {previewDoc.type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {previewDoc.size} &bull; Registered on {new Date(previewDoc.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {previewDoc.uploadedBy ? ` &bull; By ${previewDoc.uploadedBy}` : ''}
                    </p>
                  </div>
                </div>

                {/* View Switcher Pills */}
                <div className="flex items-center bg-surface border border-border rounded-xl p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setDocViewMode('real')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      docViewMode === 'real'
                        ? 'bg-primary text-black shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Real Document
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocViewMode('certificate')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      docViewMode === 'certificate'
                        ? 'bg-primary text-black shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Compliance Details
                  </button>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-2">
                  {previewDoc.url && (
                    <>
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface3 border border-border hover:border-primary/40 transition-all text-foreground"
                        title="Download Document"
                      >
                        <Download size={13} />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface3 border border-border hover:border-primary/40 transition-all text-foreground"
                        title="Print Document"
                      >
                        <Printer size={13} />
                        <span className="hidden sm:inline">Print</span>
                      </button>
                    </>
                  )}
                  {!previewDoc.url && (
                    <button
                      type="button"
                      onClick={() => attachDocFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-black hover:opacity-90 transition-all"
                      title="Attach Real File"
                    >
                      <Upload size={13} />
                      <span>Attach File</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface3 transition-all ml-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Document Body */}
              {docViewMode === 'real' ? (
                previewDoc.url ? (
                  <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col items-center justify-center bg-[#07090d] min-h-[460px] max-h-[75vh]">
                    {isImageDoc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewDoc.url}
                        alt={previewDoc.name}
                        className="max-h-[68vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
                      />
                    ) : isPdfDoc ? (
                      previewDoc.url.startsWith('data:application/pdf') || previewDoc.url.endsWith('.pdf') ? (
                        <iframe
                          src={previewDoc.url}
                          title={previewDoc.name}
                          className="w-full h-[70vh] rounded-xl border border-border bg-white"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewDoc.url}
                          alt={previewDoc.name}
                          className="max-h-[68vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
                        />
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <FileText size={48} className="text-primary" />
                        <p className="text-sm font-semibold">{previewDoc.fullName || previewDoc.name}</p>
                        <button
                          type="button"
                          onClick={handleDownload}
                          className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-black flex items-center gap-1.5"
                        >
                          <Download size={13} /> Download File
                        </button>
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5 text-xs text-muted-foreground bg-surface2/80 px-4 py-1.5 rounded-full border border-border/60">
                      <span className="font-semibold text-primary">Original Uploaded Document</span>
                      <span>&bull;</span>
                      <span className="text-foreground font-mono">{previewDoc.fullName || `${previewDoc.name}.${(previewDoc.type || 'file').toLowerCase()}`}</span>
                      <span>&bull;</span>
                      <span>{previewDoc.size}</span>
                      <button
                        type="button"
                        onClick={() => attachDocFileInputRef.current?.click()}
                        className="text-xs text-primary hover:underline ml-2 font-medium"
                      >
                        Replace File
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 p-8 sm:p-12 flex flex-col items-center justify-center text-center gap-4 bg-[#090b10] min-h-[420px]">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <FileText size={32} />
                    </div>
                    <div>
                      <h4 className="font-head font-bold text-lg text-foreground">Attach Real File for "{previewDoc.name}"</h4>
                      <p className="text-xs text-muted-foreground mt-1.5 max-w-md mx-auto leading-relaxed">
                        This document record was saved without an attached file binary. Click below to select and attach your real document file (<span className="font-semibold text-primary">{previewDoc.type}</span>) to view it directly.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => attachDocFileInputRef.current?.click()}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs shadow-lg transition-transform active:scale-95 mt-2"
                      style={{ background: 'var(--primary)', color: '#000' }}
                    >
                      <Upload size={15} /> Attach "{previewDoc.name}.{(previewDoc.type || 'jpeg').toLowerCase()}" Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocViewMode('certificate')}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors underline mt-1"
                    >
                      View Generated Compliance Certificate instead
                    </button>
                  </div>
                )
              ) : (
                /* Compliance Certificate View */
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div
                    className="rounded-xl border p-7 shadow-inner space-y-6"
                    style={{
                      background: 'linear-gradient(180deg, #181d27 0%, #131720 100%)',
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    {/* Letterhead */}
                    <div className="flex items-start justify-between border-b border-border pb-5">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-primary text-black font-extrabold flex items-center justify-center text-xs">
                            S
                          </div>
                          <span className="font-head font-extrabold text-base tracking-wide text-primary">
                            SAMKO CENTRAL UK
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Operations, Governance & Asset Assurance Documentation Vault
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface3 text-muted-foreground border border-border">
                          DOC REF: #{previewDoc.id.toUpperCase()}
                        </span>
                        <p className="text-[11px] text-muted-foreground mt-1.5">
                          Issued: {new Date(previewDoc.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Document Main Heading */}
                    <div className="text-center py-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                        Certified Asset Documentation
                      </span>
                      <h2 className="font-head font-extrabold text-xl text-foreground mt-1">
                        {previewDoc.fullName || previewDoc.name}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        Document associated with registered equipment asset {asset.assetId}
                      </p>
                    </div>

                    {/* Asset Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-border/60 bg-surface/50 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Asset ID</span>
                        <span className="font-mono font-semibold text-primary">{asset.assetId}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Asset Name</span>
                        <span className="font-semibold text-foreground truncate block">{asset.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Category</span>
                        <span className="font-semibold text-foreground">{asset.category}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Property</span>
                        <span className="font-semibold text-foreground truncate block">{asset.hotelName || 'Property'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Location</span>
                        <span className="font-semibold text-foreground">{asset.location}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Department</span>
                        <span className="font-semibold text-foreground">{asset.department}</span>
                      </div>
                    </div>

                    {/* Audit & Compliance Stamp Box */}
                    <div className="p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5 flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs space-y-1">
                        <div className="font-bold text-emerald-300">
                          Compliance Assurance & Verification Status: PASSED
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          This document has been verified against UK statutory safety, health, and equipment inspection protocols. Archived by authorized compliance officer for audit inspections.
                        </p>
                        <div className="text-[11px] text-muted-foreground pt-1 flex items-center gap-2">
                          <span>Audited By:</span>
                          <span className="font-semibold text-foreground">{previewDoc.uploadedBy || currentUserName}</span>
                          <span>&bull;</span>
                          <span className="text-primary font-mono">HASH: SHA256-SAMKO-VALIDATED</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-6 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-surface2/40">
                <span>Samko Central Operations &bull; Certified Asset Document</span>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border hover:bg-surface2 transition-all text-foreground"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirmation Modal in the Middle of Screen */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-center"
            style={{
              background: '#161a22',
              borderColor: 'rgba(244, 63, 94, 0.35)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(244, 63, 94, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4 bg-red-500/15 border border-red-500/30 text-red-500">
              <Trash2 size={26} className="animate-pulse" />
            </div>

            <h3 className="font-head font-bold text-lg mb-2 text-foreground">
              Delete {deleteConfirm.type === 'document' ? 'Document' : 'Photo'}?
            </h3>

            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-foreground">"{deleteConfirm.name}"</span>?
              This item will be permanently removed from this asset's vault. This action cannot be undone.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-surface2 hover:text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-950/40 flex items-center justify-center gap-1.5"
              >
                <Trash2 size={13} />
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl border border-border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border" style={{ background: 'var(--surface2)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}>
                  <Edit2 size={16} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base text-foreground">Edit Asset: {asset.name}</h3>
                  <p className="text-xs text-muted-foreground">{asset.assetId} · Update asset details dynamically</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Asset Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Category *
                  </label>
                  <select
                    value={editFormData.category || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {[
                      'HVAC & Climate Control',
                      'Electrical & Power',
                      'Fire & Life Safety',
                      'Plumbing & Water Systems',
                      'Kitchen & Catering Equipment',
                      'Lifts & Escalators',
                      'IT & AV Equipment',
                      'Building Fabric & Security',
                      'Furniture & Fixtures',
                      'Vehicles & Machinery',
                    ].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Property *
                  </label>
                  <select
                    value={editFormData.hotelName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, hotelName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    {[
                      'Crowne Plaza Kingston-south',
                      'Holiday Inn Express London',
                      'Voco Grand Hotel',
                      'Hilton London Syon Park',
                      'The Tower Hotel London',
                    ].map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editFormData.department || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Location / Room
                  </label>
                  <input
                    type="text"
                    value={editFormData.location || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Floor
                  </label>
                  <input
                    type="text"
                    value={editFormData.floor || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, floor: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Status
                  </label>
                  <select
                    value={editFormData.status || 'active'}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="active">Active</option>
                    <option value="under-maintenance">Under Maintenance</option>
                    <option value="inactive">Inactive</option>
                    <option value="disposed">Disposed</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Condition
                  </label>
                  <select
                    value={editFormData.condition || 'good'}
                    onChange={(e) => setEditFormData({ ...editFormData, condition: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Risk Level
                  </label>
                  <select
                    value={editFormData.riskLevel || 'low'}
                    onChange={(e) => setEditFormData({ ...editFormData, riskLevel: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                    <option value="critical">Critical Risk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Serial Number / Barcode
                  </label>
                  <input
                    type="text"
                    value={editFormData.serialNumber || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Responsible Person
                  </label>
                  <input
                    type="text"
                    value={editFormData.responsibleUser || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, responsibleUser: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="detail-edit-is-fixed"
                  checked={editFormData.isFixed ?? true}
                  onChange={(e) => setEditFormData({ ...editFormData, isFixed: e.target.checked })}
                  className="rounded cursor-pointer"
                />
                <label htmlFor="detail-edit-is-fixed" className="text-xs text-foreground cursor-pointer">
                  Fixed Asset (affects balance sheet & fixed asset register)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border"
                  style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--primary)', color: '#000' }}
                >
                  {savingEdit ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Check size={13} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Asset Dialog */}
      {showDeleteAssetModal && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowDeleteAssetModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-center"
            style={{
              background: '#161a22',
              borderColor: 'rgba(244, 63, 94, 0.35)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(244, 63, 94, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4 bg-red-500/15 border border-red-500/30 text-red-500">
              <Trash2 size={26} className="animate-pulse" />
            </div>

            <h3 className="font-head font-bold text-lg mb-2 text-foreground">
              Delete Entire Asset?
            </h3>

            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
              Are you sure you want to permanently delete <strong className="text-foreground">"{asset.name}" ({asset.assetId})</strong>? All maintenance records, inspection histories, uploaded photos and documents associated with this asset will be permanently erased. This action cannot be undone.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteAssetModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-surface2 hover:text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingAsset}
                onClick={handleDeleteAsset}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-950/40 flex items-center justify-center gap-1.5"
              >
                {deletingAsset ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={13} /> Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
