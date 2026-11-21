'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import {
  Folder,
  FolderPlus,
  FolderOpen,
  FolderTree,
  Upload,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileCode,
  File,
  FilePlus,
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  Download,
  Trash2,
  Edit2,
  ArrowRightLeft,
  RefreshCw,
  Eye,
  X,
  Check,
  ArrowUp,
  LayoutGrid,
  List,
  HardDrive,
  Inbox,
  ExternalLink,
  ChevronsDownUp,
  ChevronsUpDown,
} from 'lucide-react';
import { AcquisitionFolder, AcquisitionFile, AcquisitionFileType } from '@/types/acquisition';
import {
  INITIAL_ACQUISITION_FOLDERS,
  INITIAL_ACQUISITION_FILES,
  resolveFileType,
  formatFileSize,
} from '@/data/acquisitionData';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import CustomDropdown from '@/components/ui/CustomDropdown';
import TableCheckbox from '@/components/ui/TableCheckbox';
import { openDocumentInNewTab } from '@/components/ui/DocumentUploadField';
import { useAuth } from '@/lib/authContext';
import { toast } from 'sonner';
import { api } from '@/lib/api';

const VSCodeCollapseIcon = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M5 2h8a1 1 0 0 1 1 1v8h-1V3H5V2z" />
    <path d="M2 5h9a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm0 1v7h9V6H2z" />
    <path d="M4.5 9h4v1.5h-4V9z" />
  </svg>
);

const VSCodeExpandIcon = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M5 2h8a1 1 0 0 1 1 1v8h-1V3H5V2z" />
    <path d="M2 5h9a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm0 1v7h9V6H2z" />
    <path d="M4.5 9h4v1.5h-4V9z" />
    <path d="M5.75 7.5h1.5v4.5h-1.5V7.5z" />
  </svg>
);

const FOLDER_COLORS = [
  { label: 'Gold', value: '#e8c97a' },
  { label: 'Blue', value: '#60a5fa' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Amber', value: '#f59e0b' },
];

export default function AcquisitionClient() {
  const { user, activePortal } = useAuth();
  const isViewer = user?.roleLevel === 'L4';
  const searchParams = useSearchParams();
  const portalParam = searchParams?.get('portal');
  const isOpCo = portalParam === 'opco' || (!portalParam && activePortal === 'opco');
  const currentPortal: 'propco' | 'opco' = isOpCo ? 'opco' : 'propco';

  // ── 1. MAIN STATE (SEPARATE PROPCO & OPCO - SERVER-SIDE DYNAMIC) ──
  const [folders, setFolders] = useState<AcquisitionFolder[]>([]);
  const [files, setFiles] = useState<AcquisitionFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Current active folder: null = Root "Acquisition Vault"
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Set of folder IDs that are currently expanded in the tree
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());

  // View Mode: details (table) vs grid (tiles)
  const [viewMode, setViewMode] = useState<'details' | 'grid'>('details');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Multi-select for bulk operations
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

  // Drag over target folder
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | undefined>(undefined);

  // ── 2. MODAL STATES ──
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [editFolderModal, setEditFolderModal] = useState<AcquisitionFolder | null>(null);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [reuploadFileModal, setReuploadFileModal] = useState<AcquisitionFile | null>(null);

  // Preview file modal (Document Viewer)
  const [previewFileModal, setPreviewFileModal] = useState<AcquisitionFile | null>(null);
  const [activeSpreadsheetTab, setActiveSpreadsheetTab] = useState<string>('');
  const [spreadsheetSearch, setSpreadsheetSearch] = useState<string>('');

  // Move Modal (for single file, bulk files, or folder)
  const [moveModalState, setMoveModalState] = useState<{
    isOpen: boolean;
    itemType: 'file' | 'folder';
    itemIds: string[];
    itemNames: string[];
    currentParentId: string | null;
  }>({
    isOpen: false,
    itemType: 'file',
    itemIds: [],
    itemNames: [],
    currentParentId: null,
  });

  // Delete Confirm Modal
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    itemType: 'file' | 'folder' | 'bulk_files';
    ids: string[];
    names: string[];
  }>({
    isOpen: false,
    itemType: 'file',
    ids: [],
    names: [],
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Forms
  const [folderForm, setFolderForm] = useState({
    name: '',
    parentId: null as string | null,
    property: 'Portfolio-wide',
    description: '',
    color: '#e8c97a',
  });

  const [uploadForm, setUploadForm] = useState({
    targetFolderId: null as string | null,
    property: 'Portfolio-wide',
    notes: '',
    pendingFiles: [] as Array<{
      file: globalThis.File;
      name: string;
      size: string;
      sizeBytes: number;
      type: AcquisitionFileType;
      extension: string;
      dataUrl?: string;
    }>,
  });

  const [reuploadPendingFile, setReuploadPendingFile] = useState<{
    file: globalThis.File;
    name: string;
    size: string;
    sizeBytes: number;
    type: AcquisitionFileType;
    extension: string;
    dataUrl?: string;
  } | null>(null);

  // ── 3. DYNAMIC SERVER-SIDE PORTAL DATA (NO LOCAL STORAGE) ──
  // Purely dynamic: load folders & files directly from the server database
  useEffect(() => {
    setCurrentFolderId(null);
    setExpandedFolderIds(new Set());
    setSelectedFileIds(new Set());
    setIsLoading(true);

    // Clean up any legacy localStorage keys to ensure zero browser storage usage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('samko_acquisition_folders_clean_v4');
        localStorage.removeItem('samko_acquisition_files_clean_v4');
        localStorage.removeItem('samko_acquisition_folders_propco_v1');
        localStorage.removeItem('samko_acquisition_files_propco_v1');
        localStorage.removeItem('samko_acquisition_folders_opco_v1');
        localStorage.removeItem('samko_acquisition_files_opco_v1');
      } catch {}
    }

    let isCancelled = false;
    api.acquisition
      .getAll({ portal: currentPortal })
      .then((res) => {
        if (isCancelled) return;
        if (res && res.success) {
          setFolders(res.folders || []);
          setFiles(res.files || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load acquisition from server:', err);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentPortal]);

  // Filter folders and files strictly by current portal
  const portalFolders = useMemo(() => {
    return folders.filter((f) => !f.portal || f.portal === currentPortal);
  }, [folders, currentPortal]);

  const portalFiles = useMemo(() => {
    return files.filter((f) => !f.portal || f.portal === currentPortal);
  }, [files, currentPortal]);

  // Current folder object
  const currentFolder = useMemo(() => {
    if (!currentFolderId) return null;
    return portalFolders.find((f) => f.id === currentFolderId) || null;
  }, [currentFolderId, portalFolders]);

  // Breadcrumbs navigation path
  const breadcrumbs = useMemo(() => {
    if (!currentFolderId) return [];
    const crumbs: AcquisitionFolder[] = [];
    let cur: AcquisitionFolder | undefined = portalFolders.find((f) => f.id === currentFolderId);
    while (cur) {
      crumbs.unshift(cur);
      cur = cur.parentId ? portalFolders.find((f) => f.id === cur?.parentId) : undefined;
    }
    return crumbs;
  }, [currentFolderId, portalFolders]);

  // Subfolders of the active directory
  const currentSubfolders = useMemo(() => {
    return portalFolders
      .filter((f) => f.parentId === currentFolderId)
      .filter((f) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return f.name.toLowerCase().includes(q) || (f.description || '').toLowerCase().includes(q);
      });
  }, [portalFolders, currentFolderId, searchQuery]);

  // Files of the active directory
  const currentFiles = useMemo(() => {
    return portalFiles
      .filter((f) => f.folderId === currentFolderId)
      .filter((f) => {
        if (typeFilter !== 'all' && f.fileType !== typeFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return f.name.toLowerCase().includes(q) || (f.notes || '').toLowerCase().includes(q);
        }
        return true;
      });
  }, [portalFiles, currentFolderId, typeFilter, searchQuery]);

  // Toggle folder tree expansion
  const toggleFolderExpansion = (folderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const expandAllFolders = () => {
    setExpandedFolderIds(new Set(portalFolders.map((f) => f.id)));
    toast.success('All folders expanded in Explorer');
  };

  const collapseAllFolders = () => {
    setExpandedFolderIds(new Set());
    toast.success('All folders collapsed in Explorer');
  };

  const selectFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSelectedFileIds(new Set());
  };

  // ── 4. PARSED SPREADSHEET FOR PREVIEW MODAL ──
  const parsedSpreadsheet = useMemo(() => {
    if (!previewFileModal || !previewFileModal.dataUrl) return null;
    const isSpreadsheet =
      previewFileModal.fileType === 'excel' ||
      ['xlsx', 'xls', 'csv'].includes(previewFileModal.extension.toLowerCase());
    if (!isSpreadsheet) return null;

    try {
      const base64 = previewFileModal.dataUrl.includes(',')
        ? previewFileModal.dataUrl.split(',')[1]
        : previewFileModal.dataUrl;
      const workbook = XLSX.read(base64, { type: 'base64' });
      const sheetNames = workbook.SheetNames || [];
      const sheetsData: Record<string, any[][]> = {};

      sheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
        sheetsData[sheetName] = rows;
      });

      return {
        sheetNames,
        sheetsData,
      };
    } catch (err) {
      console.warn('Failed to parse spreadsheet with XLSX:', err);
      return null;
    }
  }, [previewFileModal]);

  // Set default spreadsheet tab when modal opens
  useEffect(() => {
    if (parsedSpreadsheet && parsedSpreadsheet.sheetNames.length > 0) {
      setActiveSpreadsheetTab(parsedSpreadsheet.sheetNames[0]);
    } else {
      setActiveSpreadsheetTab('');
    }
    setSpreadsheetSearch('');
  }, [parsedSpreadsheet]);

  // Text content reader
  const parsedTextContent = useMemo(() => {
    if (!previewFileModal || !previewFileModal.dataUrl) return null;
    const ext = previewFileModal.extension.toLowerCase();
    if (['txt', 'csv', 'json', 'md', 'log'].includes(ext)) {
      try {
        const base64 = previewFileModal.dataUrl.includes(',')
          ? previewFileModal.dataUrl.split(',')[1]
          : previewFileModal.dataUrl;
        if (typeof window !== 'undefined') {
          return decodeURIComponent(escape(window.atob(base64)));
        }
      } catch {}
    }
    return null;
  }, [previewFileModal]);

  // ── 5. HANDLERS ──
  const handleOpenCreateFolder = (targetParentId?: string | null) => {
    const parent = targetParentId !== undefined ? targetParentId : currentFolderId;
    const parentObj = parent ? folders.find((f) => f.id === parent) : null;
    setFolderForm({
      name: '',
      parentId: parent,
      property: parentObj?.property || 'Portfolio-wide',
      description: '',
      color: '#e8c97a',
    });
    setCreateFolderModalOpen(true);
  };

  const handleSaveCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderForm.name.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    const newFolder: AcquisitionFolder = {
      id: `fld-${Date.now()}`,
      name: folderForm.name.trim(),
      parentId: folderForm.parentId,
      portal: currentPortal,
      property: folderForm.property,
      description: folderForm.description.trim(),
      color: folderForm.color,
      createdAt: new Date().toISOString(),
    };

    setFolders((prev) => [...prev, newFolder]);
    if (folderForm.parentId) {
      setExpandedFolderIds((prev) => new Set(prev).add(folderForm.parentId!));
    }
    setCreateFolderModalOpen(false);
    toast.success(`Folder "${newFolder.name}" created`);

    // Server-side persistence
    api.acquisition.createFolder(newFolder).catch((err) => {
      console.error('Failed to create folder on server:', err);
      toast.error('Failed to save folder to database');
    });
  };

  const handleSaveEditFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFolderModal || !folderForm.name.trim()) return;

    const targetFolderId = editFolderModal.id;
    const updateData = {
      name: folderForm.name.trim(),
      description: folderForm.description.trim(),
      property: folderForm.property,
      color: folderForm.color,
      updatedAt: new Date().toISOString(),
    };

    setFolders((prev) =>
      prev.map((f) => (f.id === targetFolderId ? { ...f, ...updateData } : f))
    );
    setEditFolderModal(null);
    toast.success('Folder renamed');

    // Server-side persistence
    api.acquisition.editFolder(targetFolderId, updateData).catch((err) => {
      console.error('Failed to edit folder on server:', err);
      toast.error('Failed to save folder changes to database');
    });
  };

  const processFileList = (fileList: FileList | globalThis.File[]) => {
    const list = Array.from(fileList);
    const mapped: Array<{
      file: globalThis.File;
      name: string;
      size: string;
      sizeBytes: number;
      type: AcquisitionFileType;
      extension: string;
      dataUrl?: string;
    }> = [];

    list.forEach((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      const fType = resolveFileType(f.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        mapped.push({
          file: f,
          name: f.name,
          size: formatFileSize(f.size),
          sizeBytes: f.size,
          type: fType,
          extension: ext,
          dataUrl: event.target?.result as string,
        });

        if (mapped.length === list.length) {
          setUploadForm((prev) => ({
            ...prev,
            pendingFiles: [...prev.pendingFiles, ...mapped],
          }));
        }
      };
      reader.readAsDataURL(f);
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFileList(e.target.files);
    }
  };

  const handleSaveUploadFiles = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadForm.pendingFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    const newFiles: AcquisitionFile[] = uploadForm.pendingFiles.map((pf, idx) => ({
      id: `file-${Date.now()}-${idx}`,
      name: pf.name,
      folderId: uploadForm.targetFolderId,
      portal: currentPortal,
      fileType: pf.type,
      extension: pf.extension,
      size: pf.size,
      sizeBytes: pf.sizeBytes,
      dataUrl: pf.dataUrl,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user?.name || 'Super Admin',
      property: uploadForm.property,
      version: 'v1.0',
      notes: uploadForm.notes,
    }));

    setFiles((prev) => [...newFiles, ...prev]);
    // Auto-expand folder where files were added
    if (uploadForm.targetFolderId) {
      setExpandedFolderIds((prev) => new Set(prev).add(uploadForm.targetFolderId!));
    }
    setUploadModalOpen(false);
    setUploadForm({
      targetFolderId: currentFolderId,
      property: 'Portfolio-wide',
      notes: '',
      pendingFiles: [],
    });
    toast.success(`${newFiles.length} file(s) uploaded successfully`);

    // Server-side persistence
    api.acquisition.bulkUploadFiles(newFiles).catch((err) => {
      console.error('Failed to save files on server:', err);
      toast.error('Failed to save uploaded file(s) to database');
    });
  };

  const handleSaveReupload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reuploadFileModal || !reuploadPendingFile) {
      toast.error('Please choose a replacement file');
      return;
    }

    const curVerNum = parseFloat(reuploadFileModal.version.replace(/[^0-9.]/g, '')) || 1.0;
    const nextVer = `v${(curVerNum + 1.0).toFixed(1)}`;
    const targetFileId = reuploadFileModal.id;
    const reuploadData = {
      name: reuploadPendingFile.name,
      extension: reuploadPendingFile.extension,
      fileType: reuploadPendingFile.type,
      size: reuploadPendingFile.size,
      sizeBytes: reuploadPendingFile.sizeBytes,
      dataUrl: reuploadPendingFile.dataUrl,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user?.name || 'Super Admin',
      version: nextVer,
    };

    setFiles((prev) =>
      prev.map((f) => (f.id === targetFileId ? { ...f, ...reuploadData } : f))
    );

    setReuploadFileModal(null);
    setReuploadPendingFile(null);
    toast.success(`Updated to version ${nextVer}`);

    // Server-side persistence
    api.acquisition.reuploadFile(targetFileId, reuploadData).catch((err) => {
      console.error('Failed to update file on server:', err);
      toast.error('Failed to save replacement file to database');
    });
  };

  const handleExecuteMove = (targetFolderId: string | null) => {
    if (moveModalState.itemType === 'folder') {
      const folderId = moveModalState.itemIds[0];
      if (targetFolderId === folderId) {
        toast.error('Cannot move folder into itself');
        return;
      }
      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, parentId: targetFolderId } : f))
      );
      if (targetFolderId) {
        setExpandedFolderIds((prev) => new Set(prev).add(targetFolderId));
      }
      toast.success('Folder moved');

      // Server-side persistence
      api.acquisition.moveFolder(folderId, targetFolderId).catch((err) => {
        console.error('Failed to move folder on server:', err);
      });
    } else {
      const movedIds = moveModalState.itemIds;
      setFiles((prev) =>
        prev.map((f) => (movedIds.includes(f.id) ? { ...f, folderId: targetFolderId } : f))
      );
      setSelectedFileIds(new Set());
      toast.success(
        `${movedIds.length} file(s) moved to ${
          targetFolderId
            ? folders.find((f) => f.id === targetFolderId)?.name
            : currentPortal === 'propco'
            ? 'PropCo'
            : 'OpCo'
        }`
      );

      // Server-side persistence
      api.acquisition.moveFiles(movedIds, targetFolderId).catch((err) => {
        console.error('Failed to move files on server:', err);
      });
    }
    setMoveModalState({
      isOpen: false,
      itemType: 'file',
      itemIds: [],
      itemNames: [],
      currentParentId: null,
    });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteModalState.itemType === 'folder') {
        const folderId = deleteModalState.ids[0];
        const toDeleteFolders = new Set<string>([folderId]);
        let changed = true;
        while (changed) {
          changed = false;
          folders.forEach((f) => {
            if (f.parentId && toDeleteFolders.has(f.parentId) && !toDeleteFolders.has(f.id)) {
              toDeleteFolders.add(f.id);
              changed = true;
            }
          });
        }
        setFolders((prev) => prev.filter((f) => !toDeleteFolders.has(f.id)));
        setFiles((prev) => prev.filter((f) => !f.folderId || !toDeleteFolders.has(f.folderId)));
        if (currentFolderId && toDeleteFolders.has(currentFolderId)) {
          setCurrentFolderId(null);
        }
        toast.success(`Folder deleted`);

        // Server-side persistence
        await api.acquisition.deleteFolder(folderId).catch((err) => {
          console.error('Failed to delete folder on server:', err);
        });
      } else {
        const fileIds = deleteModalState.ids;
        setFiles((prev) => prev.filter((f) => !fileIds.includes(f.id)));
        setSelectedFileIds((prev) => {
          const next = new Set(prev);
          fileIds.forEach((id) => next.delete(id));
          return next;
        });
        toast.success(`${fileIds.length} file(s) deleted`);

        // Server-side persistence
        await api.acquisition.deleteFiles(fileIds).catch((err) => {
          console.error('Failed to delete files on server:', err);
        });
      }
    } finally {
      setIsDeleting(false);
      setDeleteModalState({ isOpen: false, itemType: 'file', ids: [], names: [] });
    }
  };

  const handleDownloadFile = (file: AcquisitionFile) => {
    if (file.dataUrl) {
      const a = document.createElement('a');
      a.href = file.dataUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const blob = new Blob([`Document: ${file.name}\nVersion: ${file.version}`], {
        type: 'text/plain',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    toast.success(`Downloading ${file.name}`);
  };

  const renderFileTypeIcon = (type: AcquisitionFileType, size = 15) => {
    switch (type) {
      case 'pdf':
        return <FileText size={size} className="text-rose-400" />;
      case 'excel':
        return <FileSpreadsheet size={size} className="text-emerald-400" />;
      case 'image':
        return <FileImage size={size} className="text-purple-400" />;
      case 'doc':
        return <FileCode size={size} className="text-sky-400" />;
      default:
        return <File size={size} className="text-amber-400" />;
    }
  };

  // ── 6. RECURSIVE VS CODE-STYLE EXPLORER TREE NODE ──
  // Contains both subfolders AND uploaded files directly under each folder!
  const renderVSCodeTreeNode = (folder: AcquisitionFolder, level = 0) => {
    const childFolders = portalFolders.filter((f) => f.parentId === folder.id);
    const childFiles = portalFiles.filter((f) => f.folderId === folder.id);
    const hasItems = childFolders.length > 0 || childFiles.length > 0;
    const isExpanded = expandedFolderIds.has(folder.id);
    const isSelected = currentFolderId === folder.id;

    return (
      <div key={folder.id} className="select-none">
        {/* Folder Header Row */}
        <div
          onClick={() => {
            selectFolder(folder.id);
            if (hasItems) {
              toggleFolderExpansion(folder.id);
            }
          }}
          className={`group relative flex items-center justify-between px-2 h-8 rounded-lg text-xs cursor-pointer transition-colors border ${
            isSelected
              ? 'bg-[#e8c97a]/15 text-[#e8c97a] font-semibold border-[#e8c97a]/30 shadow-sm'
              : 'border-transparent text-muted-foreground hover:bg-surface2 hover:text-foreground'
          }`}
          style={{ paddingLeft: `${Math.max(6, level * 14 + 6)}px` }}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-24">
            {/* Chevron toggle: click to hide/reveal contents with smooth rotation */}
            {hasItems ? (
              <button
                type="button"
                onClick={(e) => toggleFolderExpansion(folder.id, e)}
                className="w-3.5 h-3.5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                title={isExpanded ? 'Collapse folder' : 'Expand folder'}
              >
                <ChevronRight
                  size={12}
                  className={`transform transition-transform duration-200 ease-out flex-shrink-0 ${
                    isExpanded ? 'rotate-90 text-primary' : 'rotate-0 text-muted-foreground'
                  }`}
                />
              </button>
            ) : (
              <span className="w-3.5 flex-shrink-0" />
            )}

            {/* Folder Icon */}
            <span className="flex-shrink-0" style={{ color: folder.color || '#e8c97a' }}>
              {isExpanded ? (
                <FolderOpen size={15} fill="currentColor" fillOpacity={0.2} />
              ) : (
                <Folder size={15} fill="currentColor" fillOpacity={0.2} />
              )}
            </span>

            {/* Folder Name */}
            <span className="truncate text-xs font-medium" title={folder.name}>
              {folder.name}
            </span>
          </div>

          {/* Quick inline VS Code actions on hover - absolute overlay so row layout NEVER shifts or dances */}
          {!isViewer && (
            <div
              className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-150 flex items-center gap-0.5 bg-surface2/95 backdrop-blur-sm px-1 py-0.5 rounded shadow-sm border border-border/60 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* + File directly into this folder */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadForm({
                    targetFolderId: folder.id,
                    property: folder.property || 'Portfolio-wide',
                    notes: '',
                    pendingFiles: [],
                  });
                  setUploadModalOpen(true);
                }}
                className="p-1 rounded hover:bg-surface3 text-muted-foreground hover:text-sky-400 transition-colors"
                title="New File"
              >
                <FilePlus size={12} />
              </button>

              {/* + Subfolder */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCreateFolder(folder.id);
                }}
                className="p-1 rounded hover:bg-surface3 text-muted-foreground hover:text-primary transition-colors"
                title="New Subfolder"
              >
                <FolderPlus size={12} />
              </button>

              {/* Rename */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFolderForm({
                    name: folder.name,
                    parentId: folder.parentId,
                    property: folder.property || 'Portfolio-wide',
                    description: folder.description || '',
                    color: folder.color || '#e8c97a',
                  });
                  setEditFolderModal(folder);
                }}
                className="p-1 rounded hover:bg-surface3 text-muted-foreground hover:text-foreground transition-colors"
                title="Rename folder"
              >
                <Edit2 size={11} />
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteModalState({
                    isOpen: true,
                    itemType: 'folder',
                    ids: [folder.id],
                    names: [folder.name],
                  });
                }}
                className="p-1 rounded hover:bg-surface3 text-muted-foreground hover:text-rose-400 transition-colors"
                title="Delete folder"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>

        {/* ── EXPANDED CONTENTS: Subfolders AND Uploaded Documents with Ultra-Smooth Animation ── */}
        {hasItems && (
          <div
            className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
              isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
            }`}
          >
            <div className="overflow-hidden">
              <div className="relative border-l border-border/40 ml-[12px] my-0.5 space-y-0.5">
                {/* 1. Subfolders */}
                {childFolders.map((child) => renderVSCodeTreeNode(child, level + 1))}

                {/* 2. Uploaded documents directly under this folder (Just like VS Code!) */}
                {childFiles.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => setPreviewFileModal(file)}
                    className="group relative flex items-center justify-between px-2 h-7 rounded-lg text-xs cursor-pointer text-muted-foreground hover:bg-surface2 hover:text-foreground transition-colors border border-transparent"
                    style={{ paddingLeft: `${Math.max(14, (level + 1) * 14 + 6)}px` }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-16">
                      {renderFileTypeIcon(file.fileType, 13)}
                      <span className="truncate text-xs" title={file.name}>
                        {file.name}
                      </span>
                    </div>

                    <div
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-150 flex items-center gap-1 bg-surface2/95 backdrop-blur-sm px-1 py-0.5 rounded shadow-sm border border-border/60 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewFileModal(file);
                        }}
                        className="p-0.5 rounded text-muted-foreground hover:text-primary transition-colors"
                        title="View file"
                      >
                        <Eye size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadFile(file);
                        }}
                        className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Download file"
                      >
                        <Download size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const rootFolders = portalFolders.filter((f) => f.parentId === null);
  const rootFiles = portalFiles.filter((f) => f.folderId === null);
  const totalItemsInView = currentSubfolders.length + currentFiles.length;

  return (
    <div className="space-y-3 animate-in fade-in">
      {/* ── VS CODE STYLE EXPLORER LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch min-h-[calc(100vh-175px)]">
        {/* ════════════════════════════════════════════════════════════
            LEFT SIDEBAR: VS CODE EXPLORER TREE
           ════════════════════════════════════════════════════════════ */}
        <div
          className="lg:col-span-5 xl:col-span-4 rounded-2xl border border-border bg-surface overflow-hidden flex flex-col shadow-sm h-full"
          style={{ background: 'var(--surface, #11141a)', backgroundColor: '#11141a' }}
        >
          {/* Header */}
          <div className="px-3 py-2.5 border-b border-border bg-surface2/60 flex items-center justify-between gap-1 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-foreground font-semibold text-xs uppercase tracking-wider min-w-0">
              <FolderTree size={14} className="text-primary flex-shrink-0" />
              <span className="truncate">Explorer</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider flex-shrink-0 ${
                  currentPortal === 'propco'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                }`}
              >
                {currentPortal}
              </span>
            </div>

            {/* VS Code toolbar icons */}
            <div className="flex items-center gap-0.5 flex-shrink-0 ml-auto">
              {!isViewer && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadForm({
                        targetFolderId: currentFolderId,
                        property: currentFolder?.property || 'Portfolio-wide',
                        notes: '',
                        pendingFiles: [],
                      });
                      setUploadModalOpen(true);
                    }}
                    className="p-1.5 rounded text-muted-foreground hover:text-sky-400 hover:bg-surface3 transition-colors flex-shrink-0 cursor-pointer"
                    title="New File"
                    aria-label="New File"
                  >
                    <FilePlus size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCreateFolder(currentFolderId)}
                    className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-surface3 transition-colors flex-shrink-0 cursor-pointer"
                    title="New Folder"
                    aria-label="New Folder"
                  >
                    <FolderPlus size={14} />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  toast.success('Explorer refreshed');
                }}
                className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-surface3 transition-colors flex-shrink-0 cursor-pointer"
                title="Refresh Explorer"
                aria-label="Refresh Explorer"
              >
                <RefreshCw size={13} />
              </button>
              <button
                type="button"
                onClick={collapseAllFolders}
                className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-surface3 transition-colors flex-shrink-0 cursor-pointer"
                title="Collapse Folders in Explorer"
                aria-label="Collapse Folders in Explorer"
              >
                <VSCodeCollapseIcon size={14} />
              </button>
              <button
                type="button"
                onClick={expandAllFolders}
                className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-surface3 transition-colors flex-shrink-0 cursor-pointer"
                title="Expand All Folders"
                aria-label="Expand All Folders"
              >
                <VSCodeExpandIcon size={14} />
              </button>
            </div>
          </div>

          {/* Tree Body */}
          <div className="p-2.5 flex-1 overflow-y-auto space-y-1 min-h-[450px]">
            {/* Root "Acquisition Vault" node */}
            <div
              onClick={() => selectFolder(null)}
              className={`flex items-center justify-between px-3 h-9 rounded-xl text-xs cursor-pointer transition-colors border ${
                currentFolderId === null
                  ? 'bg-primary/15 text-primary font-bold border-primary/30 shadow-sm'
                  : 'border-transparent text-muted-foreground hover:bg-surface2 hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <HardDrive
                  size={15}
                  className={currentFolderId === null ? 'text-primary' : 'text-sky-400'}
                />
                <span className="font-semibold text-xs tracking-wide">
                  {currentPortal === 'propco' ? 'PropCo' : 'OpCo'}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                {rootFolders.length} folders
              </span>
            </div>

            <div className="border-t border-border/40 my-1.5" />

            {/* Tree Nodes (Folders + Files under folders) */}
            {rootFolders.length === 0 && rootFiles.length === 0 ? (
              <div className="text-center py-16 px-3 text-muted-foreground">
                <Folder size={28} className="mx-auto mb-2 text-muted-foreground/30" />
                <div className="text-xs font-semibold text-foreground/80 mb-0.5">No items yet</div>
                <div className="text-[11px] text-muted-foreground/70 mb-3">
                  Click + above to create a folder or upload documents
                </div>
              </div>
            ) : (
              <>
                {rootFolders.map((rf) => renderVSCodeTreeNode(rf, 0))}

                {/* Root level files */}
                {rootFiles.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => setPreviewFileModal(file)}
                    className="group relative flex items-center justify-between px-2.5 h-7 rounded-lg text-xs cursor-pointer text-muted-foreground hover:bg-surface2 hover:text-foreground transition-colors border border-transparent ml-1"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-16">
                      {renderFileTypeIcon(file.fileType, 13)}
                      <span className="truncate text-xs" title={file.name}>
                        {file.name}
                      </span>
                    </div>
                    <div
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-150 flex items-center gap-1 bg-surface2/95 backdrop-blur-sm px-1 py-0.5 rounded shadow-sm border border-border/60 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewFileModal(file);
                        }}
                        className="p-0.5 rounded text-muted-foreground hover:text-primary transition-colors"
                        title="View file"
                      >
                        <Eye size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadFile(file);
                        }}
                        className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Download file"
                      >
                        <Download size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            RIGHT WORKSPACE: ACTIVE FOLDER / DOCUMENT VIEWER
           ════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-2.5 h-full min-h-[580px]">
          {/* ── TOP ADDRESS BAR & ACTION TOOLS ── */}
          <div
            className="p-2.5 rounded-2xl border border-border bg-surface flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm"
            style={{ background: 'var(--surface)' }}
          >
            {/* Breadcrumb address path */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => {
                  if (currentFolder) selectFolder(currentFolder.parentId);
                  else selectFolder(null);
                }}
                disabled={currentFolderId === null}
                className="p-1.5 rounded-lg bg-surface2 border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex-shrink-0"
                title="Up one level"
              >
                <ArrowUp size={13} />
              </button>

              <div className="flex-1 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface2/80 border border-border overflow-x-auto text-xs min-h-[34px] custom-scrollbar">
                <button
                  type="button"
                  onClick={() => selectFolder(null)}
                  className={`font-semibold hover:text-primary transition-colors flex-shrink-0 cursor-pointer ${
                    currentFolderId === null ? 'text-primary font-bold' : 'text-muted-foreground'
                  }`}
                >
                  {currentPortal === 'propco' ? 'PropCo' : 'OpCo'}
                </button>

                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={crumb.id}>
                      <ChevronRight size={12} className="text-muted-foreground/50 flex-shrink-0" />
                      <button
                        type="button"
                        onClick={() => selectFolder(crumb.id)}
                        className={`font-semibold hover:text-primary transition-colors truncate max-w-[200px] flex-shrink-0 cursor-pointer ${
                          isLast ? 'text-primary font-bold' : 'text-muted-foreground'
                        }`}
                        title={crumb.name}
                      >
                        {crumb.name}
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Right Action Tools */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
              {/* Search */}
              <div className="relative w-40 sm:w-48 flex-shrink-0">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in folder…"
                  className="w-full pl-7 pr-6 py-1.5 rounded-lg text-xs bg-surface2 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-[10px] cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <button
                type="button"
                onClick={collapseAllFolders}
                className="samko-btn-ghost flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                title="Collapse Folders in Explorer"
              >
                <VSCodeCollapseIcon size={13} className="text-muted-foreground" />
                <span>Collapse All</span>
              </button>

              <button
                type="button"
                onClick={expandAllFolders}
                className="samko-btn-ghost flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                title="Expand All Folders"
              >
                <VSCodeExpandIcon size={13} className="text-primary" />
                <span>Expand All</span>
              </button>

              {!isViewer && (
                <>
                  <button
                    type="button"
                    onClick={() => handleOpenCreateFolder(currentFolderId)}
                    className="samko-btn-ghost flex items-center gap-1 px-2.5 py-1 text-xs font-semibold"
                  >
                    <FolderPlus size={13} className="text-primary" />
                    <span>New Folder</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUploadForm({
                        targetFolderId: currentFolderId,
                        property: currentFolder?.property || 'Portfolio-wide',
                        notes: '',
                        pendingFiles: [],
                      });
                      setUploadModalOpen(true);
                    }}
                    className="samko-btn-primary flex items-center gap-1.5 px-3 py-1 text-xs font-bold"
                  >
                    <Upload size={13} />
                    <span>Upload</span>
                  </button>
                </>
              )}

              {/* View switchers */}
              <div className="flex items-center rounded-lg p-0.5 bg-surface2 border border-border">
                <button
                  type="button"
                  onClick={() => setViewMode('details')}
                  className={`p-1 rounded transition-colors ${
                    viewMode === 'details'
                      ? 'bg-primary text-black font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Details view"
                >
                  <List size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary text-black font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedFileIds.size > 0 && (
            <div className="flex items-center justify-between p-2 px-3 bg-surface2 border border-border rounded-xl text-xs">
              <span className="font-semibold text-primary">{selectedFileIds.size} file(s) selected</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const selFiles = files.filter((f) => selectedFileIds.has(f.id));
                    setMoveModalState({
                      isOpen: true,
                      itemType: 'file',
                      itemIds: Array.from(selectedFileIds),
                      itemNames: selFiles.map((f) => f.name),
                      currentParentId: currentFolderId,
                    });
                  }}
                  className="px-2 py-1 rounded bg-surface3 hover:bg-surface border border-border font-semibold text-foreground flex items-center gap-1"
                >
                  <ArrowRightLeft size={11} />
                  <span>Move</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const selFiles = files.filter((f) => selectedFileIds.has(f.id));
                    setDeleteModalState({
                      isOpen: true,
                      itemType: 'bulk_files',
                      ids: Array.from(selectedFileIds),
                      names: selFiles.map((f) => f.name),
                    });
                  }}
                  className="px-2 py-1 rounded bg-surface3 hover:bg-surface border border-border font-semibold text-rose-400 flex items-center gap-1"
                >
                  <Trash2 size={11} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}

          {/* ── WORKSPACE CONTENT (FOLDERS & FILES LIST) ── */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverFolderId(currentFolderId);
            }}
            onDragLeave={() => setDragOverFolderId(undefined)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverFolderId(undefined);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processFileList(e.dataTransfer.files);
                setUploadForm((prev) => ({ ...prev, targetFolderId: currentFolderId }));
                setUploadModalOpen(true);
              }
            }}
            className={`rounded-2xl border transition-all bg-surface overflow-hidden shadow-sm flex-1 flex flex-col min-h-[500px] ${
              dragOverFolderId !== undefined
                ? 'border-primary ring-2 ring-primary/20 bg-surface2/50'
                : 'border-border'
            }`}
            style={{ background: 'var(--surface, #11141a)', backgroundColor: '#11141a' }}
          >
            {totalItemsInView === 0 ? (
              /* Minimalist Empty State */
              <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-surface2 border border-border flex items-center justify-center text-muted-foreground/40 mb-3 shadow-inner">
                  <Inbox size={26} />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">This folder is empty</h3>
                <p className="text-xs text-muted-foreground max-w-sm mb-5 leading-relaxed">
                  Drag and drop files here, or use the buttons below to create folders and upload documents.
                </p>
                {!isViewer && (
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenCreateFolder(currentFolderId)}
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 text-xs font-semibold rounded-xl border border-border bg-surface2 hover:bg-surface3 text-foreground transition-all shadow-sm active:scale-[0.98]"
                    >
                      <FolderPlus size={15} className="text-primary" />
                      <span>New Folder</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadForm({
                          targetFolderId: currentFolderId,
                          property: currentFolder?.property || 'Portfolio-wide',
                          notes: '',
                          pendingFiles: [],
                        });
                        setUploadModalOpen(true);
                      }}
                      className="inline-flex items-center justify-center gap-2 h-10 px-5 text-xs font-bold rounded-xl bg-primary text-black hover:brightness-110 transition-all shadow-sm active:scale-[0.98]"
                    >
                      <Upload size={15} />
                      <span>Upload Documents</span>
                    </button>
                  </div>
                )}
              </div>
            ) : viewMode === 'details' ? (
              /* ── CLEAN DETAILS VIEW TABLE ── */
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface2/60 text-muted-foreground text-[11px] font-semibold">
                      <th className="py-2 px-3 w-8">
                        <TableCheckbox
                          checked={
                            currentFiles.length > 0 && selectedFileIds.size === currentFiles.length
                          }
                          indeterminate={
                            selectedFileIds.size > 0 && selectedFileIds.size < currentFiles.length
                          }
                          onChange={() => {
                            if (selectedFileIds.size === currentFiles.length) {
                              setSelectedFileIds(new Set());
                            } else {
                              setSelectedFileIds(new Set(currentFiles.map((f) => f.id)));
                            }
                          }}
                        />
                      </th>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Size</th>
                      <th className="py-2 px-3">Version</th>
                      <th className="py-2 px-3">Date Modified</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {/* Subfolders */}
                    {currentSubfolders.map((folder) => (
                      <tr
                        key={folder.id}
                        onDoubleClick={() => selectFolder(folder.id)}
                        className="group hover:bg-surface2/60 transition-colors cursor-pointer"
                      >
                        <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                          <span className="w-4 h-4 block" />
                        </td>
                        <td className="py-2 px-3" onClick={() => selectFolder(folder.id)}>
                          <div className="flex items-center gap-2 font-semibold text-foreground group-hover:text-primary transition-colors">
                            <Folder size={16} style={{ color: folder.color || '#e8c97a' }} />
                            <span>{folder.name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground text-[11px]">Folder</td>
                        <td className="py-2 px-3 text-muted-foreground text-[11px]">—</td>
                        <td className="py-2 px-3 text-muted-foreground text-[11px]">—</td>
                        <td className="py-2 px-3 text-muted-foreground text-[11px]">
                          {new Date(folder.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => {
                                setFolderForm({
                                  name: folder.name,
                                  parentId: folder.parentId,
                                  property: folder.property || 'Portfolio-wide',
                                  description: folder.description || '',
                                  color: folder.color || '#e8c97a',
                                });
                                setEditFolderModal(folder);
                              }}
                              className="p-1 rounded text-muted-foreground hover:text-foreground"
                              title="Rename"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMoveModalState({
                                  isOpen: true,
                                  itemType: 'folder',
                                  itemIds: [folder.id],
                                  itemNames: [folder.name],
                                  currentParentId: folder.parentId,
                                });
                              }}
                              className="p-1 rounded text-muted-foreground hover:text-primary"
                              title="Move"
                            >
                              <ArrowRightLeft size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteModalState({
                                  isOpen: true,
                                  itemType: 'folder',
                                  ids: [folder.id],
                                  names: [folder.name],
                                });
                              }}
                              className="p-1 rounded text-muted-foreground hover:text-rose-400"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Files */}
                    {currentFiles.map((file) => {
                      const isSelected = selectedFileIds.has(file.id);

                      return (
                        <tr
                          key={file.id}
                          className={`group hover:bg-surface2/60 transition-colors ${
                            isSelected ? 'bg-primary/10' : ''
                          }`}
                        >
                          <td className="py-2 px-3">
                            <TableCheckbox
                              checked={isSelected}
                              onChange={() => {
                                setSelectedFileIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(file.id)) next.delete(file.id);
                                  else next.add(file.id);
                                  return next;
                                });
                              }}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <div
                              onClick={() => setPreviewFileModal(file)}
                              className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                            >
                              {renderFileTypeIcon(file.fileType, 16)}
                              <span className="truncate max-w-[280px]" title={file.name}>
                                {file.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-muted-foreground uppercase text-[10.5px]">
                            {file.extension || file.fileType}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground text-[11px]">
                            {file.size}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/15 text-primary border border-primary/30">
                              {file.version}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-muted-foreground text-[11px]">
                            {new Date(file.uploadedAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setPreviewFileModal(file)}
                                className="p-1 rounded text-muted-foreground hover:text-primary"
                                title="View document"
                              >
                                <Eye size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(file)}
                                className="p-1 rounded text-muted-foreground hover:text-foreground"
                                title="Download"
                              >
                                <Download size={12} />
                              </button>
                              {!isViewer && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReuploadFileModal(file);
                                      setReuploadPendingFile(null);
                                    }}
                                    className="p-1 rounded text-muted-foreground hover:text-amber-400"
                                    title="Re-upload replacement"
                                  >
                                    <RefreshCw size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMoveModalState({
                                        isOpen: true,
                                        itemType: 'file',
                                        itemIds: [file.id],
                                        itemNames: [file.name],
                                        currentParentId: file.folderId,
                                      });
                                    }}
                                    className="p-1 rounded text-muted-foreground hover:text-sky-400"
                                    title="Move"
                                  >
                                    <ArrowRightLeft size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteModalState({
                                        isOpen: true,
                                        itemType: 'file',
                                        ids: [file.id],
                                        names: [file.name],
                                      });
                                    }}
                                    className="p-1 rounded text-muted-foreground hover:text-rose-400"
                                    title="Delete"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* ── CLEAN GRID / TILES VIEW ── */
              <div className="p-4 flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 content-start">
                {currentSubfolders.map((folder) => (
                  <div
                    key={folder.id}
                    onClick={() => selectFolder(folder.id)}
                    className="p-3 rounded-xl border border-border bg-surface2/60 hover:bg-surface2 hover:border-primary/50 transition-all cursor-pointer flex flex-col items-center text-center group"
                  >
                    <Folder
                      size={36}
                      style={{ color: folder.color || '#e8c97a' }}
                      fill="currentColor"
                      fillOpacity={0.15}
                      className="mb-2"
                    />
                    <div
                      className="font-semibold text-xs text-foreground truncate w-full group-hover:text-primary transition-colors"
                      title={folder.name}
                    >
                      {folder.name}
                    </div>
                  </div>
                ))}

                {currentFiles.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => setPreviewFileModal(file)}
                    className="p-3 rounded-xl border border-border bg-surface2/60 hover:bg-surface2 hover:border-primary/50 transition-all cursor-pointer flex flex-col items-center text-center group relative"
                  >
                    <div className="mb-2">{renderFileTypeIcon(file.fileType, 36)}</div>
                    <div
                      className="font-semibold text-xs text-foreground truncate w-full group-hover:text-primary transition-colors"
                      title={file.name}
                    >
                      {file.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{file.size}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          FULL DOCUMENT VIEWER MODAL (REAL EXCEL, PDF, IMAGE & TEXT)
         ════════════════════════════════════════════════════════════ */}
      {previewFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 md:p-6 animate-in fade-in">
          <div
            className="w-full max-w-5xl rounded-2xl border border-border p-5 shadow-2xl space-y-3 max-h-[92vh] flex flex-col"
            style={{ background: 'var(--card, #ffffff)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                {renderFileTypeIcon(previewFileModal.fileType, 18)}
                <span className="font-bold text-sm text-foreground truncate max-w-md" title={previewFileModal.name}>
                  {previewFileModal.name}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                  {previewFileModal.version}
                </span>
                <span className="text-[11px] text-muted-foreground">({previewFileModal.size})</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openDocumentInNewTab(previewFileModal.dataUrl, previewFileModal.name)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-black hover:bg-primary/90 transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Open full document in a new browser tab"
                >
                  <ExternalLink size={13} />
                  <span>Open in New Tab</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadFile(previewFileModal)}
                  className="samko-btn-ghost border border-border flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
                >
                  <Download size={13} />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFileModal(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface2"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Document Viewer Body */}
            <div className="flex-1 min-h-[350px] max-h-[650px] overflow-auto rounded-xl bg-surface2/60 border border-border flex flex-col">
              {/* 1. SPREADSHEET VIEWER (EXCEL XLSX, XLS, CSV) */}
              {parsedSpreadsheet && parsedSpreadsheet.sheetNames.length > 0 ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Sheet Tabs & Search */}
                  <div className="p-2 border-b border-border bg-surface2 flex items-center justify-between gap-2 flex-wrap flex-shrink-0">
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      {parsedSpreadsheet.sheetNames.map((sheetName) => (
                        <button
                          key={sheetName}
                          type="button"
                          onClick={() => setActiveSpreadsheetTab(sheetName)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            activeSpreadsheetTab === sheetName
                              ? 'bg-emerald-500 text-black shadow-sm font-bold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-surface3'
                          }`}
                        >
                          {sheetName}
                        </button>
                      ))}
                    </div>

                    <div className="relative w-44">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={spreadsheetSearch}
                        onChange={(e) => setSpreadsheetSearch(e.target.value)}
                        placeholder="Filter rows…"
                        className="w-full pl-7 pr-3 py-1 text-xs rounded-lg bg-surface3 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Spreadsheet Grid Table */}
                  <div className="flex-1 overflow-auto p-2">
                    {(() => {
                      const currentRows = parsedSpreadsheet.sheetsData[activeSpreadsheetTab] || [];
                      if (currentRows.length === 0) {
                        return (
                          <div className="text-center py-16 text-xs text-muted-foreground">
                            This worksheet contains no data rows.
                          </div>
                        );
                      }

                      const headers = currentRows[0] || [];
                      let dataRows = currentRows.slice(1);

                      if (spreadsheetSearch.trim()) {
                        const q = spreadsheetSearch.toLowerCase();
                        dataRows = dataRows.filter((row) =>
                          row.some((cell) => String(cell || '').toLowerCase().includes(q))
                        );
                      }

                      return (
                        <div className="border border-border/80 rounded-lg overflow-x-auto bg-surface">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-surface2/90 border-b border-border text-foreground font-bold">
                                <th className="py-2 px-2.5 w-10 text-center font-mono text-muted-foreground border-r border-border/60 bg-surface3/40">
                                  #
                                </th>
                                {headers.map((h, hIdx) => (
                                  <th
                                    key={hIdx}
                                    className="py-2 px-3 border-r border-border/60 font-bold whitespace-nowrap min-w-[120px]"
                                  >
                                    {String(h || `Column ${hIdx + 1}`)}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {dataRows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-surface2/40 transition-colors">
                                  <td className="py-1.5 px-2.5 text-center font-mono text-[10.5px] text-muted-foreground border-r border-border/60 bg-surface3/20">
                                    {rIdx + 1}
                                  </td>
                                  {headers.map((_, cIdx) => (
                                    <td
                                      key={cIdx}
                                      className="py-1.5 px-3 border-r border-border/40 whitespace-nowrap text-foreground"
                                    >
                                      {String(row[cIdx] !== undefined ? row[cIdx] : '')}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (previewFileModal.fileType === 'pdf' || previewFileModal.extension?.toLowerCase() === 'pdf' || previewFileModal.name?.toLowerCase().endsWith('.pdf')) && previewFileModal.dataUrl ? (
                /* 2. PDF VIEWER */
                <iframe
                  src={previewFileModal.dataUrl}
                  title={previewFileModal.name}
                  className="w-full h-full min-h-[520px] rounded-lg border-none bg-white"
                />
              ) : (previewFileModal.fileType === 'image' || ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp'].includes(previewFileModal.extension?.toLowerCase()) || previewFileModal.dataUrl?.startsWith('data:image/')) && previewFileModal.dataUrl ? (
                /* 3. IMAGE VIEWER */
                <div className="flex-1 flex items-center justify-center p-4 bg-black/20 rounded-lg">
                  <img
                    src={previewFileModal.dataUrl}
                    alt={previewFileModal.name}
                    className="max-w-full max-h-[550px] object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : parsedTextContent !== null ? (
                /* 4. TEXT CONTENT VIEWER */
                <div className="p-4 overflow-auto font-mono text-xs whitespace-pre-wrap leading-relaxed text-foreground bg-surface">
                  {parsedTextContent}
                </div>
              ) : (
                /* 5. FALLBACK DOWNLOAD / OVERVIEW */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-surface2 border border-border flex items-center justify-center mb-3">
                    {renderFileTypeIcon(previewFileModal.fileType, 32)}
                  </div>
                  <h4 className="font-bold text-foreground text-sm mb-1">{previewFileModal.name}</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Size: {previewFileModal.size} · Uploaded on{' '}
                    {new Date(previewFileModal.uploadedAt).toLocaleString()}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDownloadFile(previewFileModal)}
                    className="samko-btn-primary px-4 py-2 text-xs"
                  >
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE FOLDER MODAL ── */}
      {createFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div
            className="w-full max-w-sm rounded-2xl border border-border p-5 shadow-2xl space-y-4"
            style={{ background: 'var(--card, #ffffff)' }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-head text-sm font-bold text-foreground flex items-center gap-2">
                <FolderPlus size={16} className="text-primary" />
                <span>New Folder</span>
              </h3>
              <button
                type="button"
                onClick={() => setCreateFolderModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveCreateFolder} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Folder Name *
                </label>
                <input
                  type="text"
                  required
                  value={folderForm.name}
                  onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                  placeholder="e.g. Legal Contracts"
                  className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-foreground focus:outline-none focus:border-primary"
                  style={{ background: 'var(--surface2, #181c24)', backgroundColor: '#181c24' }}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Color
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFolderForm({ ...folderForm, color: c.value })}
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: c.value,
                        borderColor: folderForm.color === c.value ? '#ffffff' : 'transparent',
                      }}
                    >
                      {folderForm.color === c.value && <Check size={10} className="text-black" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setCreateFolderModalOpen(false)}
                  className="samko-btn-ghost px-3 py-1.5"
                >
                  Cancel
                </button>
                <button type="submit" className="samko-btn-primary px-3.5 py-1.5">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RENAME FOLDER MODAL ── */}
      {editFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div
            className="w-full max-w-sm rounded-2xl border border-border p-5 shadow-2xl space-y-4"
            style={{ background: 'var(--card, #ffffff)' }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-head text-sm font-bold text-foreground flex items-center gap-2">
                <Edit2 size={16} className="text-primary" />
                <span>Rename Folder</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditFolderModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveEditFolder} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Folder Name *
                </label>
                <input
                  type="text"
                  required
                  value={folderForm.name}
                  onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-foreground focus:outline-none focus:border-primary"
                  style={{ background: 'var(--surface2, #181c24)', backgroundColor: '#181c24' }}
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditFolderModal(null)}
                  className="samko-btn-ghost px-3 py-1.5"
                >
                  Cancel
                </button>
                <button type="submit" className="samko-btn-primary px-3.5 py-1.5">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── UPLOAD DOCUMENTS MODAL ── */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div
            className="w-full max-w-md rounded-2xl border border-border p-5 shadow-2xl space-y-4"
            style={{ background: 'var(--card, #ffffff)' }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-head text-sm font-bold text-foreground flex items-center gap-2">
                <Upload size={16} className="text-primary" />
                <span>Upload Documents</span>
              </h3>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveUploadFiles} className="space-y-3 text-xs">
              <div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-all"
                style={{ background: 'var(--surface2, #181c24)', backgroundColor: '#181c24' }}
              >
                <input
                  type="file"
                  multiple
                  id="acquisition-clean-upload"
                  onChange={handleFileInputChange}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv,.txt"
                  className="hidden"
                />
                <label htmlFor="acquisition-clean-upload" className="cursor-pointer flex flex-col items-center">
                  <Upload size={24} className="text-primary mb-2" />
                  <span className="font-bold text-foreground mb-0.5">Click to browse or drag & drop</span>
                  <span className="text-[11px] text-muted-foreground">PDF, Excel, Word, Images, Text</span>
                </label>
              </div>

              {uploadForm.pendingFiles.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {uploadForm.pendingFiles.map((pf, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 rounded-lg border border-border text-xs"
                      style={{ background: 'var(--surface2, #181c24)', backgroundColor: '#181c24' }}
                    >
                      <span className="truncate max-w-[240px]">{pf.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setUploadForm((prev) => ({
                            ...prev,
                            pendingFiles: prev.pendingFiles.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-muted-foreground hover:text-rose-400"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="samko-btn-ghost px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadForm.pendingFiles.length === 0}
                  className="samko-btn-primary px-3.5 py-1.5 disabled:opacity-50"
                >
                  Upload {uploadForm.pendingFiles.length > 0 && `(${uploadForm.pendingFiles.length})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── REUPLOAD MODAL ── */}
      {reuploadFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div
            className="w-full max-w-sm rounded-2xl border border-border p-5 shadow-2xl space-y-4"
            style={{ background: 'var(--card, #ffffff)' }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-head text-sm font-bold text-foreground flex items-center gap-2">
                <RefreshCw size={16} className="text-amber-400" />
                <span>Update File Version</span>
              </h3>
              <button
                type="button"
                onClick={() => setReuploadFileModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={15} />
              </button>
            </div>

            <div className="text-xs text-muted-foreground">
              Current: <span className="font-bold text-foreground">{reuploadFileModal.name}</span> ({reuploadFileModal.version})
            </div>

            <form onSubmit={handleSaveReupload} className="space-y-3 text-xs">
              <div
                className="border-2 border-dashed border-border rounded-xl p-5 text-center"
                style={{ background: 'var(--surface2)' }}
              >
                <input
                  type="file"
                  id="reupload-clean-input"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const ext = f.name.split('.').pop()?.toLowerCase() || '';
                    const fType = resolveFileType(f.name);
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setReuploadPendingFile({
                        file: f,
                        name: f.name,
                        size: formatFileSize(f.size),
                        sizeBytes: f.size,
                        type: fType,
                        extension: ext,
                        dataUrl: ev.target?.result as string,
                      });
                    };
                    reader.readAsDataURL(f);
                  }}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv,.txt"
                  className="hidden"
                />
                <label htmlFor="reupload-clean-input" className="cursor-pointer flex flex-col items-center">
                  <RefreshCw size={22} className="text-amber-400 mb-1.5" />
                  <span className="font-bold text-foreground">
                    {reuploadPendingFile ? reuploadPendingFile.name : 'Select Replacement File'}
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setReuploadFileModal(null)}
                  className="samko-btn-ghost px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!reuploadPendingFile}
                  className="samko-btn-primary px-3.5 py-1.5 disabled:opacity-50"
                >
                  Update Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MOVE MODAL ── */}
      {moveModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div
            className="w-full max-w-sm rounded-2xl border border-border p-5 shadow-2xl space-y-4"
            style={{ background: 'var(--card, #ffffff)' }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-head text-sm font-bold text-foreground flex items-center gap-2">
                <ArrowRightLeft size={16} className="text-primary" />
                <span>Move to Destination</span>
              </h3>
              <button
                type="button"
                onClick={() =>
                  setMoveModalState({
                    isOpen: false,
                    itemType: 'file',
                    itemIds: [],
                    itemNames: [],
                    currentParentId: null,
                  })
                }
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={15} />
              </button>
            </div>

            <div
              className="max-h-56 overflow-y-auto space-y-1 p-2 rounded-xl border border-border text-xs"
              style={{ background: 'var(--surface2, #181c24)', backgroundColor: '#181c24' }}
            >
              <div
                onClick={() => handleExecuteMove(null)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface3 cursor-pointer font-semibold"
              >
                <HardDrive size={14} className="text-primary" />
                <span>{currentPortal === 'propco' ? 'PropCo (Root)' : 'OpCo (Root)'}</span>
              </div>

              {folders.map((f) => {
                if (moveModalState.itemType === 'folder' && moveModalState.itemIds.includes(f.id)) {
                  return null;
                }
                return (
                  <div
                    key={f.id}
                    onClick={() => handleExecuteMove(f.id)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface3 cursor-pointer"
                    style={{ paddingLeft: `${f.parentId ? 20 : 8}px` }}
                  >
                    <Folder size={13} style={{ color: f.color || '#e8c97a' }} />
                    <span className="truncate">{f.name}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                type="button"
                onClick={() =>
                  setMoveModalState({
                    isOpen: false,
                    itemType: 'file',
                    itemIds: [],
                    itemNames: [],
                    currentParentId: null,
                  })
                }
                className="samko-btn-ghost px-3 py-1.5 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM DELETE MODAL ── */}
      <ConfirmDeleteModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, itemType: 'file', ids: [], names: [] })}
        onConfirm={handleConfirmDelete}
        title={
          deleteModalState.itemType === 'folder'
            ? 'Delete Folder & Contents?'
            : deleteModalState.itemType === 'bulk_files'
            ? `Delete ${deleteModalState.ids.length} Files Permanently?`
            : 'Delete File Permanently?'
        }
        itemName={deleteModalState.names.join(', ') || 'Selected Item'}
        registerName="Acquisition"
        customWarning={
          deleteModalState.itemType === 'folder'
            ? `Any subfolders and files inside "${deleteModalState.names[0]}" will also be permanently deleted.`
            : 'This file will be permanently removed from Acquisition.'
        }
        confirmButtonText={
          deleteModalState.itemType === 'folder' ? 'Delete Folder' : 'Delete File(s)'
        }
        isDeleting={isDeleting}
      />
    </div>
  );
}
