'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Package,
  Wrench,
  ShieldCheck,
  ScrollText,
  FileCheck,
  Zap,
  CheckSquare,
  FolderOpen,
  BarChart3,
  ClipboardCheck,
  Tag,
  Edit2,
  Check,
  X,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  History,
  QrCode,
  UploadCloud,
  LayoutDashboard,
  Calendar,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  getDeepCMSStore,
  saveDeepCMSStore,
  getPageConfig,
  updatePageConfig,
  updateColumnTitle,
  toggleColumnVisibility,
  updatePageItem,
  addPageItem,
  deletePageItem,
  resetPageConfig,
  updateTopKpi,
  updatePropcoTopKpi,
  updatePropcoKpi,
  updatePageKpi,
  addPageKpi,
  deletePageKpi,
  updateAlertItem,
  addAlertItem,
  deleteAlertItem,
  updateTaskItem,
  addTaskItem,
  deleteTaskItem,
  updateChartDataPoint,
  updatePageDropdown,
  addDropdownOption,
  removeDropdownOption,
  updatePageSection,
  updateCustomLabel,
  type DeepAppCMSStore,
  type DeepPageConfig,
  type DeepPageKpi,
  type DeepPageDropdown,
  type DeepPageSection,
  type DeepAlertItem,
  type DeepTaskItem,
  type DeepChartDataPoint,
} from '@/lib/deepPageCms';
import { HOTELS, ASSET_CATEGORIES } from '@/lib/assetData';
import { toast } from 'sonner';

const TAB_PAGES: Array<{ id: keyof DeepAppCMSStore; label: string; icon: React.ElementType; group: string; livePath: string }> = [
  { id: 'overview', label: 'Executive Dashboard', icon: LayoutDashboard, group: 'System Overview', livePath: '/' },
  { id: 'assetdashboard', label: 'Asset Overview Dashboard', icon: BarChart3, group: 'System Overview', livePath: '/asset-management' },
  { id: 'properties', label: 'Properties & Sites', icon: Building2, group: 'PropCo (Asset Co)', livePath: '/asset-management/properties' },
  { id: 'assets', label: 'Fixed Assets (Plant & Machinery)', icon: Package, group: 'PropCo (Asset Co)', livePath: '/asset-management/assets' },
  { id: 'nonfixed', label: 'Non-Fixed Assets (FF&E)', icon: Package, group: 'OpCo (Operations)', livePath: '/asset-management/assets?type=non-fixed' },
  { id: 'categories', label: 'Asset Categories', icon: Tag, group: 'PropCo (Asset Co)', livePath: '/asset-management/categories' },
  { id: 'compliance', label: 'Compliance Register', icon: ShieldCheck, group: 'PropCo (Asset Co)', livePath: '/compliance-register' },
  { id: 'compliancetracker', label: 'Compliance Expiry Tracker', icon: Calendar, group: 'PropCo (Asset Co)', livePath: '/compliance-tracker' },
  { id: 'contracts', label: 'Contracts Register', icon: ScrollText, group: 'PropCo (Asset Co)', livePath: '/contracts-register' },
  { id: 'insurance', label: 'Insurance Register', icon: FileCheck, group: 'PropCo (Asset Co)', livePath: '/insurance-register' },
  { id: 'utilities', label: 'Utilities Register', icon: Zap, group: 'PropCo (Asset Co)', livePath: '/utilities-register' },
  { id: 'documents', label: 'Document Repository', icon: FolderOpen, group: 'PropCo (Asset Co)', livePath: '/document-repository' },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, group: 'PropCo (Asset Co)', livePath: '/asset-management/reports' },
  { id: 'tasks', label: 'Tasks & Action List', icon: CheckSquare, group: 'OpCo (Operations)', livePath: '/tasks' },
  { id: 'maintenance', label: 'Maintenance PPM', icon: Wrench, group: 'OpCo (Operations)', livePath: '/asset-management/maintenance' },
  { id: 'inspections', label: 'Inspections & Audits', icon: ClipboardCheck, group: 'OpCo (Operations)', livePath: '/asset-management/inspections' },
  { id: 'multisite', label: 'Multi-Site Operations', icon: Building2, group: 'OpCo (Operations)', livePath: '/multi-site-operations' },
  { id: 'qr', label: 'QR Asset Scanner', icon: QrCode, group: 'OpCo (Operations)', livePath: '/asset-management/qr-scanner' },
  { id: 'recentlogs', label: 'Recent Logs & Audit Trail', icon: History, group: 'System Administration', livePath: '/recent-logs' },
  { id: 'users', label: 'User Management & Hierarchy', icon: Users, group: 'System Administration', livePath: '/users' },
  { id: 'import', label: 'Bulk Data Import', icon: UploadCloud, group: 'System Administration', livePath: '/asset-management/import' },
];

interface DeepPageCMSEditorProps {
  initialPage?: keyof DeepAppCMSStore;
  activePage?: keyof DeepAppCMSStore;
  hidePageGrid?: boolean;
  initialPortal?: 'propco' | 'opco';
}

export default function DeepPageCMSEditor({
  initialPage = 'properties',
  activePage,
  hidePageGrid = false,
  initialPortal,
}: DeepPageCMSEditorProps) {
  const [selectedPage, setSelectedPage] = useState<keyof DeepAppCMSStore>(activePage || initialPage);

  useEffect(() => {
    if (activePage && activePage !== selectedPage) {
      setSelectedPage(activePage);
      setEditingItemIndex(null);
      setEditingAsset(null);
      setEditingGenericItem(null);
      setAssetPage(1);
    }
  }, [activePage, selectedPage]);

  const [store, setStore] = useState<DeepAppCMSStore>(() => getDeepCMSStore());
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // Portal & search filters for 21-page directory
  const [portalFilter, setPortalFilter] = useState<'all' | 'opco' | 'propco' | 'system'>(
    initialPortal === 'propco' ? 'propco' : initialPortal === 'opco' ? 'opco' : 'all'
  );
  const [pageSearchQuery, setPageSearchQuery] = useState('');
  const [executivePortalKpiTab, setExecutivePortalKpiTab] = useState<'opco' | 'propco'>(
    initialPortal === 'propco' ? 'propco' : 'opco'
  );

  useEffect(() => {
    if (initialPortal) {
      setExecutivePortalKpiTab(initialPortal);
      setPortalFilter(initialPortal);
    }
  }, [initialPortal]);

  // Filter and pagination state for Assets
  const [assetSearch, setAssetSearch] = useState('');
  const [assetCategoryFilter, setAssetCategoryFilter] = useState('All');
  const [assetHotelFilter, setAssetHotelFilter] = useState('All');
  const [assetPage, setAssetPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Asset editing modal
  const [editingAsset, setEditingAsset] = useState<Record<string, any> | null>(null);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [newAssetForm, setNewAssetForm] = useState({
    assetId: '',
    name: '',
    category: 'Furniture & Joinery',
    department: 'Housekeeping',
    hotelName: 'Crowne Plaza Kingston-south',
    location: 'Guest Rooms',
    quantity: 1,
    condition: 'good',
    riskLevel: 'low',
    status: 'active',
    nextInspectionDate: '2026-08-01',
    notes: '',
  });

  // Generic item editing modal (for compliance, contracts, insurance, utilities, etc.)
  const [editingGenericItem, setEditingGenericItem] = useState<Record<string, any> | null>(null);
  const [showAddGenericModal, setShowAddGenericModal] = useState(false);
  const [newGenericForm, setNewGenericForm] = useState<Record<string, any>>({});

  // Property modal state
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [newPropertyForm, setNewPropertyForm] = useState({
    name: '',
    city: 'London',
    address: '',
    manager: '',
    phone: '',
    status: 'active',
    totalAssets: 0,
    overdueCount: 0,
    dueTodayCount: 0,
  });

  const currentPage = store[selectedPage];

  const hasKpis = Boolean(currentPage?.topKpis || (currentPage?.kpis && currentPage.kpis.length > 0 && selectedPage !== 'properties' && selectedPage !== 'assets' && selectedPage !== 'nonfixed' && selectedPage !== 'categories' && selectedPage !== 'import' && selectedPage !== 'qr'));
  const hasDropdowns = Boolean(currentPage?.dropdowns && currentPage.dropdowns.length > 0 && selectedPage !== 'properties' && selectedPage !== 'overview' && selectedPage !== 'categories' && selectedPage !== 'multisite' && selectedPage !== 'import' && selectedPage !== 'qr' && selectedPage !== 'reports' && selectedPage !== 'assetdashboard');
  const hasColumns = Boolean(currentPage?.columns && currentPage.columns.length > 0 && selectedPage !== 'properties' && selectedPage !== 'overview' && selectedPage !== 'categories' && selectedPage !== 'multisite' && selectedPage !== 'import' && selectedPage !== 'qr' && selectedPage !== 'assetdashboard');

  const dropdownSectionNum = 1 + (hasKpis ? 1 : 0) + 1;
  const columnSectionNum = 1 + (hasKpis ? 1 : 0) + (hasDropdowns ? 1 : 0) + 1;
  const recordsSectionNum = 1 + (hasKpis ? 1 : 0) + (hasDropdowns ? 1 : 0) + (hasColumns ? 1 : 0) + 1;

  const refresh = () => {
    setStore(getDeepCMSStore());
  };

  const handleUpdateHeader = (updates: Partial<DeepPageConfig>) => {
    updatePageConfig(selectedPage, updates);
    toast.success('Page header updated');
    refresh();
  };

  const handleUpdateColLabel = (colId: string, newLabel: string) => {
    updateColumnTitle(selectedPage, colId, newLabel);
    toast.success('Column title updated');
    refresh();
  };

  const handleToggleCol = (colId: string) => {
    toggleColumnVisibility(selectedPage, colId);
    refresh();
  };

  const handleUpdateKpi = (kpiId: string, updates: Partial<DeepPageKpi>) => {
    updatePageKpi(selectedPage, kpiId, updates);
    toast.success('KPI Metric updated');
    refresh();
  };

  const handleUpdateTopKpi = (kpiId: string, updates: Partial<DeepPageKpi>) => {
    updateTopKpi(selectedPage, kpiId, updates);
    toast.success('Top metric card updated');
    refresh();
  };

  const handleUpdatePropcoTopKpi = (kpiId: string, updates: Partial<DeepPageKpi>) => {
    updatePropcoTopKpi(selectedPage, kpiId, updates);
    toast.success('PropCo metric card updated');
    refresh();
  };

  const handleUpdatePropcoKpi = (kpiId: string, updates: Partial<DeepPageKpi>) => {
    updatePropcoKpi(selectedPage, kpiId, updates);
    toast.success('PropCo module card updated');
    refresh();
  };

  const handleUpdateChartPoint = (weekIdx: number, updates: Partial<DeepChartDataPoint>) => {
    updateChartDataPoint(selectedPage, weekIdx, updates);
    refresh();
  };

  const handleUpdateAlert = (alertId: string, updates: Partial<DeepAlertItem>) => {
    updateAlertItem(selectedPage, alertId, updates);
    toast.success('Alert updated');
    refresh();
  };

  const handleAddAlert = () => {
    addAlertItem(selectedPage, {
      type: 'warning',
      message: 'New statutory or maintenance alert',
      time: 'Action required',
    });
    toast.success('New alert added');
    refresh();
  };

  const handleDeleteAlert = (alertId: string) => {
    deleteAlertItem(selectedPage, alertId);
    toast.success('Alert removed');
    refresh();
  };

  const handleUpdateTask = (taskId: string, updates: Partial<DeepTaskItem>) => {
    updateTaskItem(selectedPage, taskId, updates);
    toast.success('Urgent task updated');
    refresh();
  };

  const handleAddTask = () => {
    addTaskItem(selectedPage, {
      title: 'New urgent inspection / certificate task',
      hotelName: 'Crowne Plaza Kingston-south',
      dueDate: 'Soon',
      priority: 'urgent',
    });
    toast.success('New task added');
    refresh();
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskItem(selectedPage, taskId);
    toast.success('Task removed');
    refresh();
  };

  const handleUpdateDropdownLabel = (dropdownId: string, label: string) => {
    updatePageDropdown(selectedPage, dropdownId, { label });
    refresh();
  };

  const handleAddDropdownOption = (dropdownId: string, option: string) => {
    addDropdownOption(selectedPage, dropdownId, option);
    toast.success(`Added option "${option}"`);
    refresh();
  };

  const handleRemoveDropdownOption = (dropdownId: string, optIdx: number) => {
    removeDropdownOption(selectedPage, dropdownId, optIdx);
    toast.success('Option removed');
    refresh();
  };

  const handleUpdateSection = (sectionKey: string, updates: Partial<DeepPageSection>) => {
    updatePageSection(selectedPage, sectionKey, updates);
    toast.success('Section updated');
    refresh();
  };

  const handleUpdateCustomLabel = (key: string, val: string) => {
    updateCustomLabel(selectedPage, key, val);
    refresh();
  };

  const handleSaveItemEdit = (itemId: string, updates: Record<string, any>) => {
    updatePageItem(selectedPage, itemId, updates);
    setEditingItemIndex(null);
    toast.success('Item updated');
    refresh();
  };

  const handleDeleteItem = (itemId: string, itemName: string) => {
    if (confirm(`Are you sure you want to delete "${itemName}"?`)) {
      deletePageItem(selectedPage, itemId);
      toast.success(`Deleted "${itemName}"`);
      refresh();
    }
  };

  // Property creation
  const handleCreateProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropertyForm.name.trim()) return;

    addPageItem('properties', {
      ...newPropertyForm,
      id: `prop_${Date.now()}`,
    });

    toast.success(`Property "${newPropertyForm.name}" created`);
    setShowAddPropertyModal(false);
    setNewPropertyForm({
      name: '',
      city: 'London',
      address: '',
      manager: '',
      phone: '',
      status: 'active',
      totalAssets: 0,
      overdueCount: 0,
      dueTodayCount: 0,
    });
    refresh();
  };

  // Asset creation
  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetForm.name.trim()) {
      toast.error('Asset name is required');
      return;
    }
    const cleanId = newAssetForm.assetId.trim() || `FA-${Date.now().toString().slice(-4)}`;
    addPageItem('assets', {
      ...newAssetForm,
      id: `a-${Date.now()}`,
      assetId: cleanId,
      quantity: Number(newAssetForm.quantity) || 1,
    });
    toast.success(`Asset "${newAssetForm.name}" created`);
    setShowAddAssetModal(false);
    setNewAssetForm({
      assetId: '',
      name: '',
      category: 'Furniture & Joinery',
      department: 'Housekeeping',
      hotelName: 'Crowne Plaza Kingston-south',
      location: 'Guest Rooms',
      quantity: 1,
      condition: 'good',
      riskLevel: 'low',
      status: 'active',
      nextInspectionDate: '2026-08-01',
      notes: '',
    });
    refresh();
  };

  // Asset save
  const handleSaveAssetEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    updatePageItem('assets', editingAsset.id, {
      ...editingAsset,
      quantity: Number(editingAsset.quantity) || 1,
    });
    toast.success(`Asset "${editingAsset.name}" updated`);
    setEditingAsset(null);
    refresh();
  };

  // Generic item save
  const handleSaveGenericItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGenericItem) return;
    updatePageItem(selectedPage, editingGenericItem.id, editingGenericItem);
    toast.success('Record updated');
    setEditingGenericItem(null);
    refresh();
  };

  // Generic item create
  const handleCreateGenericItem = (e: React.FormEvent) => {
    e.preventDefault();
    addPageItem(selectedPage, {
      ...newGenericForm,
      id: `item_${Date.now()}`,
    });
    toast.success('New record created');
    setShowAddGenericModal(false);
    setNewGenericForm({});
    refresh();
  };

  const handleReset = () => {
    if (confirm(`Reset all content and layout in "${currentPage.title}" to factory defaults?`)) {
      resetPageConfig(selectedPage);
      toast.success('Reset to factory defaults');
      refresh();
    }
  };

  // Filtered Assets logic
  const filteredAssets = useMemo(() => {
    if (selectedPage !== 'assets' || !currentPage.items) return [];
    return currentPage.items.filter((item: any) => {
      const matchSearch =
        !assetSearch ||
        (item.name || '').toLowerCase().includes(assetSearch.toLowerCase()) ||
        (item.assetId || '').toLowerCase().includes(assetSearch.toLowerCase()) ||
        (item.location || '').toLowerCase().includes(assetSearch.toLowerCase()) ||
        (item.hotelName || '').toLowerCase().includes(assetSearch.toLowerCase());

      const matchCat =
        assetCategoryFilter === 'All' || item.category === assetCategoryFilter;

      const matchHotel =
        assetHotelFilter === 'All' ||
        (item.hotelName || '').toLowerCase().includes(assetHotelFilter.toLowerCase());

      return matchSearch && matchCat && matchHotel;
    });
  }, [selectedPage, currentPage.items, assetSearch, assetCategoryFilter, assetHotelFilter]);

  const totalAssetPages = Math.ceil((filteredAssets.length || 1) / ITEMS_PER_PAGE);
  const paginatedAssets = useMemo(() => {
    const start = (assetPage - 1) * ITEMS_PER_PAGE;
    return filteredAssets.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAssets, assetPage]);

  return (
    <div className="flex flex-col gap-6 max-w-6xl pb-16">
      {!hidePageGrid ? (
        <>
          {/* Top Banner */}
          <div
            className="rounded-2xl border p-6 relative overflow-hidden shadow-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(232, 201, 122, 0.08) 0%, rgba(18, 19, 22, 0.95) 100%)',
              borderColor: 'rgba(232, 201, 122, 0.25)',
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                  style={{
                    background: 'linear-gradient(135deg, #e8c97a 0%, #b89340 100%)',
                    color: '#121316',
                  }}
                >
                  <Sparkles size={24} strokeWidth={2.3} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-bold font-head tracking-tight text-foreground">
                      Deep Page & Content CMS
                    </h2>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase"
                      style={{
                        background: 'rgba(232, 201, 122, 0.15)',
                        color: 'var(--primary)',
                        border: '1px solid rgba(232, 201, 122, 0.3)',
                      }}
                    >
                      Super Admin Granular CMS
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                    Every tab and page inside the application is 100% editable. Customize page titles, subtitles,
                    search placeholders, buttons, table columns, card stats, and every record in the table.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={TAB_PAGES.find((p) => p.id === selectedPage)?.livePath || '#'}
                  target="_blank"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-primary/40 hover:bg-primary/10 text-primary transition-colors"
                >
                  <span>View Live Page</span>
                  <ExternalLink size={12} />
                </Link>

                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                >
                  <RefreshCw size={12} /> Reset
                </button>
              </div>
            </div>
          </div>

          {/* ─── SYSTEMATIC PAGE DIRECTORY SELECTOR ─── */}
          <div className="flex flex-col gap-3 rounded-2xl border p-4 shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/70">
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-primary" />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Application Pages & Tabs Directory
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Select any page to customize its live hero text, KPI metric cards, filters, table columns, and all records
                  </p>
                </div>
              </div>

              {/* Live search input */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-black/20 sm:w-64">
                <Search size={13} className="text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter 21 pages..."
                  value={pageSearchQuery}
                  onChange={(e) => setPageSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-foreground flex-1"
                />
                {pageSearchQuery && (
                  <button onClick={() => setPageSearchQuery('')} className="text-muted-foreground hover:text-foreground">
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>

            {/* Systematic Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPortalFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  portalFilter === 'all'
                    ? 'bg-primary text-black font-bold shadow-sm'
                    : 'bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 border border-white/10'
                }`}
              >
                All Pages ({TAB_PAGES.length})
              </button>

              <button
                type="button"
                onClick={() => setPortalFilter('opco')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  portalFilter === 'opco'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 font-bold shadow-sm'
                    : 'bg-white/5 text-muted-foreground hover:text-blue-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                OpCo Operations ({TAB_PAGES.filter((p) => p.group === 'OpCo (Operations)').length})
              </button>

              <button
                type="button"
                onClick={() => setPortalFilter('propco')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  portalFilter === 'propco'
                    ? 'bg-amber-500/20 text-[#e8c97a] border border-[#e8c97a]/40 font-bold shadow-sm'
                    : 'bg-white/5 text-muted-foreground hover:text-amber-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                PropCo Asset Co ({TAB_PAGES.filter((p) => p.group === 'PropCo (Asset Co)').length})
              </button>

              <button
                type="button"
                onClick={() => setPortalFilter('system')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  portalFilter === 'system'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold shadow-sm'
                    : 'bg-white/5 text-muted-foreground hover:text-emerald-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                System & Admin ({TAB_PAGES.filter((p) => p.group.includes('System')).length})
              </button>
            </div>

            {/* Responsive Systematic Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
              {TAB_PAGES.filter((page) => {
                if (portalFilter === 'opco' && page.group !== 'OpCo (Operations)') return false;
                if (portalFilter === 'propco' && page.group !== 'PropCo (Asset Co)') return false;
                if (portalFilter === 'system' && !page.group.includes('System')) return false;
                if (pageSearchQuery.trim()) {
                  const q = pageSearchQuery.toLowerCase();
                  return page.label.toLowerCase().includes(q) || page.group.toLowerCase().includes(q);
                }
                return true;
              }).map((page) => {
                const Icon = page.icon;
                const isSelected = selectedPage === page.id;
                const isOpco = page.group === 'OpCo (Operations)';
                const isPropco = page.group === 'PropCo (Asset Co)';
                const badgeColor = isOpco ? '#60a5fa' : isPropco ? '#e8c97a' : '#34d399';

                return (
                  <button
                    key={page.id}
                    onClick={() => {
                      setSelectedPage(page.id);
                      setEditingItemIndex(null);
                      setEditingAsset(null);
                      setEditingGenericItem(null);
                      setAssetPage(1);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer group ${
                      isSelected
                        ? 'border-primary ring-1 ring-primary shadow-sm bg-primary/10'
                        : 'border-border hover:bg-surface2'
                    }`}
                    style={{
                      background: isSelected ? 'rgba(232, 201, 122, 0.12)' : 'var(--surface2)',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                      style={{
                        background: `${badgeColor}18`,
                        color: badgeColor,
                        border: `1px solid ${badgeColor}35`,
                      }}
                    >
                      <Icon size={16} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 justify-between">
                        <span
                          className="text-xs font-bold truncate block"
                          style={{ color: isSelected ? 'var(--primary)' : 'var(--foreground)' }}
                        >
                          {page.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider"
                          style={{
                            background: `${badgeColor}20`,
                            color: badgeColor,
                          }}
                        >
                          {isOpco ? 'OpCo' : isPropco ? 'PropCo' : 'System'}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate font-mono">
                          {page.livePath}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
              style={{
                background: 'linear-gradient(135deg, rgba(232, 201, 122, 0.25) 0%, rgba(232, 201, 122, 0.1) 100%)',
                color: 'var(--primary)',
                border: '1px solid rgba(232, 201, 122, 0.3)',
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-head font-bold text-base text-foreground">
                  {currentPage?.title || 'Module'} Content & Data CMS
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-primary/15 text-primary border border-primary/30 uppercase">
                  Live Page Editable
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Editing live layout, columns, labels, and all data records for this tab.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={TAB_PAGES.find((p) => p.id === selectedPage)?.livePath || '#'}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-primary/40 hover:bg-primary/10 text-primary transition-colors"
            >
              <span>View Live Page</span>
              <ExternalLink size={12} />
            </Link>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
            >
              <RefreshCw size={12} /> Reset Defaults
            </button>
          </div>
        </div>
      )}

      {/* ─── 1. PAGE HEADER & SEARCH LABELS ─── */}
      <div
        className="rounded-xl border p-5 flex flex-col gap-4 shadow-sm"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <span className="font-head font-bold text-sm text-foreground">
              1. Page Header, Subtitle & Action Labels
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Customize the prominent top heading, count summary, search bar placeholder and button texts
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Page Title</label>
            <input
              type="text"
              value={currentPage.title}
              onChange={(e) => handleUpdateHeader({ title: e.target.value })}
              className="rounded-lg border border-border px-3 py-2 text-xs outline-none focus:border-primary"
              style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Search Input Placeholder</label>
            <input
              type="text"
              value={currentPage.searchPlaceholder}
              onChange={(e) => handleUpdateHeader({ searchPlaceholder: e.target.value })}
              className="rounded-lg border border-border px-3 py-2 text-xs outline-none focus:border-primary"
              style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
            />
          </div>

          <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Subtitle / Summary Text</label>
            <input
              type="text"
              value={currentPage.subtitle}
              onChange={(e) => handleUpdateHeader({ subtitle: e.target.value })}
              className="rounded-lg border border-border px-3 py-2 text-xs outline-none focus:border-primary"
              style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Primary Action Button Text</label>
            <input
              type="text"
              value={currentPage.primaryActionLabel}
              onChange={(e) => handleUpdateHeader({ primaryActionLabel: e.target.value })}
              className="rounded-lg border border-border px-3 py-2 text-xs outline-none focus:border-primary"
              style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
            />
          </div>

          {currentPage.secondaryActionLabel !== undefined && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Secondary Action Button Text</label>
              <input
                type="text"
                value={currentPage.secondaryActionLabel}
                onChange={(e) => handleUpdateHeader({ secondaryActionLabel: e.target.value })}
                className="rounded-lg border border-border px-3 py-2 text-xs outline-none focus:border-primary"
                style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── 2A. TOP EXECUTIVE KEY METRIC CARDS (8 CARDS) ─── */}
      {currentPage.topKpis && currentPage.topKpis.length > 0 && (
        <div
          className="rounded-xl border p-5 flex flex-col gap-4 shadow-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div>
              <span className="font-head font-bold text-sm text-foreground flex items-center gap-2">
                <BarChart3 size={15} className="text-primary" />
                2A. Top Executive Key Metric Cards ({executivePortalKpiTab === 'propco' ? 'PropCo View' : 'OpCo View'} - 8 Cards)
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {executivePortalKpiTab === 'propco'
                  ? 'Customize the 8 top cards for the PropCo Asset Co dashboard view (Monitored Properties, Fixed Assets, Insurance, Contracts, etc.)'
                  : 'Customize the 8 top cards for the OpCo Operations dashboard view (Non-Fixed Assets, PPM, Alerts, Tasks, etc.)'}
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-lg border border-border bg-black/20 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setExecutivePortalKpiTab('opco')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  executivePortalKpiTab === 'opco'
                    ? 'bg-primary text-black shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                OpCo Cards (8)
              </button>
              <button
                type="button"
                onClick={() => setExecutivePortalKpiTab('propco')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  executivePortalKpiTab === 'propco'
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                PropCo Cards (8)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(executivePortalKpiTab === 'opco' ? currentPage.topKpis : (currentPage.propcoTopKpis || [])).map((kpi, kIdx) => (
              <div
                key={kpi.id || kIdx}
                className="p-3.5 rounded-xl border flex flex-col gap-2.5 transition-all"
                style={{
                  background: 'var(--surface2)',
                  borderColor: kpi.enabled !== false ? (kpi.color || 'var(--border)') : 'var(--border)',
                  opacity: kpi.enabled !== false ? 1 : 0.6,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {executivePortalKpiTab === 'opco' ? 'OpCo' : 'PropCo'} #{kIdx + 1}: {kpi.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (executivePortalKpiTab === 'opco') {
                        handleUpdateTopKpi(kpi.id, { enabled: kpi.enabled === false ? true : false });
                      } else {
                        handleUpdatePropcoTopKpi(kpi.id, { enabled: kpi.enabled === false ? true : false });
                      }
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                    title={kpi.enabled !== false ? 'Card Visible' : 'Card Hidden'}
                  >
                    {kpi.enabled !== false ? <Eye size={13} className="text-primary" /> : <EyeOff size={13} />}
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Card Label</label>
                  <input
                    type="text"
                    value={kpi.label}
                    onChange={(e) => {
                      if (executivePortalKpiTab === 'opco') {
                        handleUpdateTopKpi(kpi.id, { label: e.target.value });
                      } else {
                        handleUpdatePropcoTopKpi(kpi.id, { label: e.target.value });
                      }
                    }}
                    className="rounded border border-border px-2 py-1 text-xs outline-none font-bold"
                    style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Stat Value</label>
                  <input
                    type="text"
                    value={kpi.value}
                    onChange={(e) => {
                      if (executivePortalKpiTab === 'opco') {
                        handleUpdateTopKpi(kpi.id, { value: e.target.value });
                      } else {
                        handleUpdatePropcoTopKpi(kpi.id, { value: e.target.value });
                      }
                    }}
                    className="rounded border border-border px-2 py-1 text-xs outline-none font-bold"
                    style={{ background: 'var(--surface)', color: kpi.color || 'var(--primary)' }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Subtitle / Status Note</label>
                  <input
                    type="text"
                    value={kpi.subtitle}
                    onChange={(e) => {
                      if (executivePortalKpiTab === 'opco') {
                        handleUpdateTopKpi(kpi.id, { subtitle: e.target.value });
                      } else {
                        handleUpdatePropcoTopKpi(kpi.id, { subtitle: e.target.value });
                      }
                    }}
                    className="rounded border border-border px-2 py-1 text-[11px] outline-none text-muted-foreground"
                    style={{ background: 'var(--surface)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 2B. KPI STAT CARDS & RADAR METRICS ─── */}
      {(currentPage.topKpis ? true : (currentPage.kpis && currentPage.kpis.length > 0 && selectedPage !== 'properties' && selectedPage !== 'assets' && selectedPage !== 'nonfixed' && selectedPage !== 'categories')) && (
        <div
          className="rounded-xl border p-5 flex flex-col gap-4 shadow-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div>
              <span className="font-head font-bold text-sm text-foreground flex items-center gap-2">
                <BarChart3 size={15} className="text-primary" />
                {currentPage.topKpis
                  ? (executivePortalKpiTab === 'propco'
                      ? '2B. PropCo Module Overview (5 Cards)'
                      : '2B. Executive Operations Radar (5 Cards)')
                  : `2. KPI Stat Cards & Metrics (${(currentPage.kpis && currentPage.kpis.length > 0 ? currentPage.kpis : []).length} Cards)`}
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {currentPage.topKpis
                  ? (executivePortalKpiTab === 'propco'
                      ? 'Customize the 5 PropCo modules: Properties Portfolio, Fixed Assets, Insurance, Contracts, and PropCo Reports'
                      : 'Customize the 5 OpCo operational radar cards: Non-Fixed, Maintenance, Compliance, Tasks, and Utilities')
                  : 'Customize card headings, numeric values, subtitles and theme colors displayed on this page'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {(currentPage.topKpis && executivePortalKpiTab === 'propco'
              ? (currentPage.propcoKpis && currentPage.propcoKpis.length > 0 ? currentPage.propcoKpis : [])
              : (currentPage.kpis || [])
            ).map((kpi, kIdx) => (
            <div
              key={kpi.id || kIdx}
              className="p-3.5 rounded-xl border flex flex-col gap-2.5 transition-all"
              style={{
                background: 'var(--surface2)',
                borderColor: kpi.enabled !== false ? (kpi.color || 'var(--border)') : 'var(--border)',
                opacity: kpi.enabled !== false ? 1 : 0.6,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {currentPage.topKpis ? (executivePortalKpiTab === 'propco' ? 'PropCo' : 'OpCo') : 'Card'} #{kIdx + 1}: {kpi.label}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (currentPage.topKpis && executivePortalKpiTab === 'propco') {
                      handleUpdatePropcoKpi(kpi.id, { enabled: kpi.enabled === false ? true : false });
                    } else {
                      handleUpdateKpi(kpi.id, { enabled: kpi.enabled === false ? true : false });
                    }
                  }}
                  className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                  title={kpi.enabled !== false ? 'Card Visible' : 'Card Hidden'}
                >
                  {kpi.enabled !== false ? <Eye size={13} className="text-primary" /> : <EyeOff size={13} />}
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Card Heading</label>
                <input
                  type="text"
                  value={kpi.label}
                  onChange={(e) => {
                    if (currentPage.topKpis && executivePortalKpiTab === 'propco') {
                      handleUpdatePropcoKpi(kpi.id, { label: e.target.value });
                    } else {
                      handleUpdateKpi(kpi.id, { label: e.target.value });
                    }
                  }}
                  placeholder="Card Title"
                  className="rounded border border-border px-2 py-1 text-xs outline-none font-bold"
                  style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Stat Value</label>
                <input
                  type="text"
                  value={kpi.value}
                  onChange={(e) => {
                    if (currentPage.topKpis && executivePortalKpiTab === 'propco') {
                      handleUpdatePropcoKpi(kpi.id, { value: e.target.value });
                    } else {
                      handleUpdateKpi(kpi.id, { value: e.target.value });
                    }
                  }}
                  placeholder="e.g. 98 or £65M"
                  className="rounded border border-border px-2 py-1 text-xs outline-none font-bold"
                  style={{ background: 'var(--surface)', color: kpi.color || 'var(--primary)' }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Subtitle / Tagline</label>
                <input
                  type="text"
                  value={kpi.subtitle}
                  onChange={(e) => {
                    if (currentPage.topKpis && executivePortalKpiTab === 'propco') {
                      handleUpdatePropcoKpi(kpi.id, { subtitle: e.target.value });
                    } else {
                      handleUpdateKpi(kpi.id, { subtitle: e.target.value });
                    }
                  }}
                  placeholder="Supporting text"
                  className="rounded border border-border px-2 py-1 text-[11px] outline-none text-muted-foreground"
                  style={{ background: 'var(--surface)' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* ─── 2C. GROUP COMPLIANCE SCORE – 12 WEEK TREND CHART DATA ─── */}
      {currentPage.chartData && currentPage.chartData.length > 0 && (
        <div
          className="rounded-xl border p-5 flex flex-col gap-4 shadow-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <span className="font-head font-bold text-sm text-foreground flex items-center gap-2">
                <BarChart3 size={15} className="text-primary" />
                2C. Group Compliance Score – 12 Week Trend Chart Data ({currentPage.chartData.length} Weeks)
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Customize weekly compliance percentages and critical items counts rendered in the interactive trend line
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2.5">
            {currentPage.chartData.map((pt, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-border flex flex-col gap-2"
                style={{ background: 'var(--surface2)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-primary font-mono">{pt.week}</span>
                  <span className="text-[9px] text-muted-foreground uppercase font-bold">Week {idx + 1}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-semibold text-muted-foreground">Compliance %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={pt.compliance}
                    onChange={(e) => handleUpdateChartPoint(idx, { compliance: Number(e.target.value) || 0 })}
                    className="rounded border border-border px-2 py-1 text-xs outline-none font-bold"
                    style={{ background: 'var(--surface)', color: 'var(--primary)' }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-semibold text-muted-foreground">Critical Items</label>
                  <input
                    type="number"
                    min="0"
                    value={pt.critical}
                    onChange={(e) => handleUpdateChartPoint(idx, { critical: Number(e.target.value) || 0 })}
                    className="rounded border border-border px-2 py-1 text-xs outline-none font-bold"
                    style={{ background: 'var(--surface)', color: 'var(--critical)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 2D. LIVE ALERTS FEED ─── */}
      {currentPage.alerts && currentPage.alerts.length > 0 && (
        <div
          className="rounded-xl border p-5 flex flex-col gap-4 shadow-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div>
              <span className="font-head font-bold text-sm text-foreground flex items-center gap-2">
                <AlertCircle size={15} className="text-rose-400" />
                2D. Live Alerts Feed ({currentPage.alerts.length} Active Alerts)
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Customize operational and statutory alerts displayed in the Live Alerts card on the executive dashboard
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddAlert}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer self-start sm:self-auto"
            >
              <Plus size={13} strokeWidth={2.5} />
              + Add Alert
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {currentPage.alerts.map((alert, aIdx) => (
              <div
                key={alert.id || aIdx}
                className="p-4 rounded-xl border border-border flex flex-col gap-3 transition-all"
                style={{ background: 'var(--surface2)' }}
              >
                {/* Top Row: Alert Header, Badge & Delete Action */}
                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Alert #{aIdx + 1}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        alert.type === 'critical'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : alert.type === 'warning'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {alert.type}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 border border-border/80 transition-colors cursor-pointer"
                    title="Delete Alert"
                  >
                    <Trash2 size={12} />
                    <span className="text-[11px] font-semibold">Delete</span>
                  </button>
                </div>

                {/* Message Field (Full Width - no horizontal cramming) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Alert Message / Description</label>
                  <input
                    type="text"
                    value={alert.message}
                    onChange={(e) => handleUpdateAlert(alert.id, { message: e.target.value })}
                    className="w-full rounded border border-border px-3 py-1.5 text-xs outline-none text-foreground font-medium"
                    style={{ background: 'var(--surface)' }}
                  />
                </div>

                {/* Secondary Controls: Severity Level & Action / Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-muted-foreground">Severity Level</label>
                    <select
                      value={alert.type}
                      onChange={(e) => handleUpdateAlert(alert.id, { type: e.target.value as any })}
                      className="rounded border border-border px-2.5 py-1.5 text-xs outline-none"
                      style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
                    >
                      <option value="critical">Critical (Red)</option>
                      <option value="warning">Warning (Amber)</option>
                      <option value="info">Info (Blue)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-muted-foreground">Action / Time Text</label>
                    <input
                      type="text"
                      value={alert.time}
                      onChange={(e) => handleUpdateAlert(alert.id, { time: e.target.value })}
                      placeholder="e.g. Action required, Expires 2026-06-01"
                      className="rounded border border-border px-2.5 py-1.5 text-xs outline-none text-muted-foreground"
                      style={{ background: 'var(--surface)' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 2E. URGENT TASKS FEED ─── */}
      {currentPage.tasks && currentPage.tasks.length > 0 && (
        <div
          className="rounded-xl border p-5 flex flex-col gap-4 shadow-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div>
              <span className="font-head font-bold text-sm text-foreground flex items-center gap-2">
                <CheckSquare size={15} className="text-amber-400" />
                2E. Urgent Tasks Feed ({currentPage.tasks.length} High-Priority Tasks)
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Customize prioritized inspections, statutory certificate renewals, and action dates across properties
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddTask}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer self-start sm:self-auto"
            >
              <Plus size={13} strokeWidth={2.5} />
              + Add Task
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {currentPage.tasks.map((task, tIdx) => (
              <div
                key={task.id || tIdx}
                className="p-4 rounded-xl border border-border flex flex-col gap-3 transition-all"
                style={{ background: 'var(--surface2)' }}
              >
                {/* Top Row: Task Header, Priority Badge & Delete Action */}
                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Task #{tIdx + 1}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        task.priority === 'urgent'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : task.priority === 'high'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 border border-border/80 transition-colors cursor-pointer"
                    title="Delete Task"
                  >
                    <Trash2 size={12} />
                    <span className="text-[11px] font-semibold">Delete</span>
                  </button>
                </div>

                {/* Row 1: Task Title (Full Width) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Task Title</label>
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) => handleUpdateTask(task.id, { title: e.target.value })}
                    className="w-full rounded border border-border px-3 py-1.5 text-xs outline-none text-foreground font-medium"
                    style={{ background: 'var(--surface)' }}
                  />
                </div>

                {/* Row 2: Hotel/Property, Due Date, and Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-muted-foreground">Hotel / Property</label>
                    <input
                      type="text"
                      value={task.hotelName}
                      onChange={(e) => handleUpdateTask(task.id, { hotelName: e.target.value })}
                      className="rounded border border-border px-2.5 py-1.5 text-xs outline-none text-muted-foreground"
                      style={{ background: 'var(--surface)' }}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-muted-foreground">Due Date</label>
                    <input
                      type="text"
                      value={task.dueDate}
                      onChange={(e) => handleUpdateTask(task.id, { dueDate: e.target.value })}
                      placeholder="e.g. 16 Apr"
                      className="rounded border border-border px-2.5 py-1.5 text-xs outline-none text-muted-foreground"
                      style={{ background: 'var(--surface)' }}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-muted-foreground">Priority Level</label>
                    <select
                      value={task.priority}
                      onChange={(e) => handleUpdateTask(task.id, { priority: e.target.value as any })}
                      className="rounded border border-border px-2.5 py-1.5 text-xs outline-none"
                      style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 3. FILTER DROPDOWNS & SELECT OPTIONS ─── */}
      {hasDropdowns && currentPage.dropdowns && (
        <div
          className="rounded-xl border p-5 flex flex-col gap-4 shadow-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <span className="font-head font-bold text-sm text-foreground flex items-center gap-2">
                <Filter size={15} className="text-primary" />
                {dropdownSectionNum}. Filter Dropdowns, Select Options & Labels
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Customize filter dropdown labels and edit, add, or remove selectable dropdown options
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentPage.dropdowns.map((dropdown) => (
              <div
                key={dropdown.id}
                className="p-3.5 rounded-xl border border-border flex flex-col gap-2.5"
                style={{ background: 'var(--surface2)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Dropdown: {dropdown.id}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {dropdown.options.length} Options
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Dropdown Label Text</label>
                  <input
                    type="text"
                    value={dropdown.label}
                    onChange={(e) => handleUpdateDropdownLabel(dropdown.id, e.target.value)}
                    className="rounded border border-border px-2 py-1 text-xs outline-none font-bold"
                    style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground">Selectable Options</label>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded border border-border/60 bg-black/20">
                    {dropdown.options.map((opt, optIdx) => (
                      <span
                        key={optIdx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border border-border bg-surface text-foreground"
                      >
                        <span>{opt}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDropdownOption(dropdown.id, optIdx)}
                          className="text-muted-foreground hover:text-rose-400 p-0.5 cursor-pointer"
                          title="Remove option"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add new option input */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      id={`new_opt_${dropdown.id}`}
                      placeholder={`Add new option to ${dropdown.label}...`}
                      className="rounded border border-border px-2 py-1 text-xs outline-none flex-1"
                      style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) {
                            handleAddDropdownOption(dropdown.id, val);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById(`new_opt_${dropdown.id}`) as HTMLInputElement;
                        if (input && input.value.trim()) {
                          handleAddDropdownOption(dropdown.id, input.value.trim());
                          input.value = '';
                        }
                      }}
                      className="px-2.5 py-1 rounded text-xs font-bold border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 4. TABLE COLUMNS & HEADERS ─── */}
      {hasColumns && currentPage.columns && (
        <div
          className="rounded-xl border p-5 flex flex-col gap-4 shadow-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <span className="font-head font-bold text-sm text-foreground">
                {columnSectionNum}. Table Columns Configuration & Visibility ({currentPage.columns.length} Columns)
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Rename column headers or toggle column visibility on the live page
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {currentPage.columns.map((col) => (
              <div
                key={col.id}
                className="p-3 rounded-lg border border-border flex items-center justify-between gap-2"
                style={{ background: 'var(--surface2)' }}
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    Key: {col.id}
                  </span>
                  <input
                    type="text"
                    value={col.label}
                    onChange={(e) => handleUpdateColLabel(col.id, e.target.value)}
                    className="border-b border-border bg-transparent outline-none text-xs font-bold text-foreground py-0.5"
                  />
                </div>

                <button
                  onClick={() => handleToggleCol(col.id)}
                  className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                    col.visible ? 'text-primary' : 'text-muted-foreground opacity-40'
                  }`}
                  title={col.visible ? 'Visible' : 'Hidden'}
                >
                  {col.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 4. ASSET REGISTER DATA EDITOR (SHOWN FOR FIXED & NON-FIXED ASSETS) ─── */}
      {(selectedPage === 'assets' || selectedPage === 'nonfixed') && (
        <div
          className="rounded-xl border p-5 flex flex-col gap-4 shadow-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-border gap-3">
            <div>
              <span className="font-head font-bold text-sm text-foreground">
                4. Asset Register Records Editor ({filteredAssets.length} of {currentPage.items?.length || 0} Assets Loaded)
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Every asset row is 100% editable here. Changes update live across the entire application.
              </p>
            </div>

            <button
              onClick={() => setShowAddAssetModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-transform active:scale-95 shadow-sm cursor-pointer"
              style={{ background: 'var(--primary)', color: '#121316' }}
            >
              <Plus size={14} strokeWidth={2.5} />
              Add Asset Record
            </button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border flex-1 min-w-[220px]"
              style={{ background: 'var(--surface2)' }}
            >
              <Search size={14} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Search assets by ID, name, location..."
                value={assetSearch}
                onChange={(e) => {
                  setAssetSearch(e.target.value);
                  setAssetPage(1);
                }}
                className="bg-transparent border-none outline-none text-xs text-foreground flex-1"
              />
              {assetSearch && (
                <button onClick={() => setAssetSearch('')} className="text-muted-foreground hover:text-foreground">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              value={assetCategoryFilter}
              onChange={(e) => {
                setAssetCategoryFilter(e.target.value);
                setAssetPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-border text-xs outline-none cursor-pointer"
              style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
            >
              <option value="All">All Categories</option>
              {ASSET_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Hotel Filter */}
            <select
              value={assetHotelFilter}
              onChange={(e) => {
                setAssetHotelFilter(e.target.value);
                setAssetPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-border text-xs outline-none cursor-pointer"
              style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
            >
              <option value="All">All Properties</option>
              {HOTELS.map((hotel) => (
                <option key={hotel.id} value={hotel.name}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assets Data Table */}
          <div className="border border-border rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-black/20 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Asset ID</th>
                  <th className="py-2.5 px-3">Asset Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Property / Site</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Qty</th>
                  <th className="py-2.5 px-3">Condition</th>
                  <th className="py-2.5 px-3">Risk</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedAssets.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-muted-foreground">
                      No assets found matching filters.
                    </td>
                  </tr>
                ) : (
                  paginatedAssets.map((asset: any) => (
                    <tr key={asset.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-300">
                        {asset.assetId || asset.id}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-foreground">
                        {asset.name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 border border-white/10 text-muted-foreground">
                          {asset.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[150px]">
                        {asset.hotelName || 'Crowne Plaza'}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {asset.department || 'General'}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {asset.location || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-foreground">
                        {asset.quantity || 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="capitalize text-emerald-400 font-medium">
                          ● {asset.condition || 'Good'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="capitalize text-blue-400 font-medium">
                          ● {asset.riskLevel || 'Low'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {asset.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingAsset({ ...asset })}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            title="Edit Asset Details"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(asset.id, asset.name)}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Asset"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalAssetPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                Showing {paginatedAssets.length} of {filteredAssets.length} assets
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={assetPage <= 1}
                  onClick={() => setAssetPage((p) => p - 1)}
                  className="px-2.5 py-1 rounded border border-border text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-semibold px-2">
                  Page {assetPage} of {totalAssetPages}
                </span>
                <button
                  disabled={assetPage >= totalAssetPages}
                  onClick={() => setAssetPage((p) => p + 1)}
                  className="px-2.5 py-1 rounded border border-border text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 2. PROPERTIES CARDS (SHOWN FOR PROPERTIES TAB) ─── */}
      {selectedPage === 'properties' && currentPage.items && (
        <div
          className="rounded-xl border p-5 flex flex-col gap-4 shadow-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <span className="font-head font-bold text-sm text-foreground">
                2. Real Estate Hotel & Site Cards ({currentPage.items.length} Properties Active)
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Directly edit hotel titles, locations, addresses, general managers, phone numbers, and statuses
              </p>
            </div>

            <button
              onClick={() => setShowAddPropertyModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-transform active:scale-95 shadow-sm cursor-pointer"
              style={{ background: 'var(--primary)', color: '#121316' }}
            >
              <Plus size={14} strokeWidth={2.5} />
              Add Property Card
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentPage.items.map((hotel, idx) => {
              const isEditing = editingItemIndex === idx;

              return (
                <div
                  key={hotel.id || idx}
                  className="rounded-xl border border-border p-4 flex flex-col gap-3"
                  style={{ background: 'var(--surface2)' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(232,201,122,0.15)', color: '#e8c97a' }}
                      >
                        <Building2 size={16} />
                      </div>
                      <div>
                        <span className="font-head font-bold text-sm text-foreground">
                          {hotel.name}
                        </span>
                        <div className="text-[11px] text-muted-foreground">{hotel.city}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingItemIndex(isEditing ? null : idx)}
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary cursor-pointer"
                        title="Edit Card"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(hotel.id, hotel.name)}
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        title="Delete Card"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                      <div className="flex flex-col gap-1 col-span-2">
                        <label className="text-[10px] text-muted-foreground font-semibold">Hotel Name</label>
                        <input
                          type="text"
                          defaultValue={hotel.name}
                          id={`name_${hotel.id}`}
                          className="rounded border border-border px-2 py-1 text-xs outline-none"
                          style={{ background: 'var(--surface)' }}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-muted-foreground font-semibold">City</label>
                        <input
                          type="text"
                          defaultValue={hotel.city}
                          id={`city_${hotel.id}`}
                          className="rounded border border-border px-2 py-1 text-xs outline-none"
                          style={{ background: 'var(--surface)' }}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-muted-foreground font-semibold">General Manager</label>
                        <input
                          type="text"
                          defaultValue={hotel.manager}
                          id={`mgr_${hotel.id}`}
                          className="rounded border border-border px-2 py-1 text-xs outline-none"
                          style={{ background: 'var(--surface)' }}
                        />
                      </div>
                      <div className="flex flex-col gap-1 col-span-2">
                        <label className="text-[10px] text-muted-foreground font-semibold">Full Address</label>
                        <input
                          type="text"
                          defaultValue={hotel.address}
                          id={`addr_${hotel.id}`}
                          className="rounded border border-border px-2 py-1 text-xs outline-none"
                          style={{ background: 'var(--surface)' }}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-muted-foreground font-semibold">Telephone</label>
                        <input
                          type="text"
                          defaultValue={hotel.phone}
                          id={`phone_${hotel.id}`}
                          className="rounded border border-border px-2 py-1 text-xs outline-none"
                          style={{ background: 'var(--surface)' }}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-muted-foreground font-semibold">Status</label>
                        <select
                          defaultValue={hotel.status}
                          id={`status_${hotel.id}`}
                          className="rounded border border-border px-2 py-1 text-xs outline-none"
                          style={{ background: 'var(--surface)' }}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>

                      <div className="col-span-2 flex items-center justify-end gap-2 pt-2">
                        <button
                          onClick={() => setEditingItemIndex(null)}
                          className="px-3 py-1 rounded text-xs border border-border cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            const name = (document.getElementById(`name_${hotel.id}`) as HTMLInputElement)?.value;
                            const city = (document.getElementById(`city_${hotel.id}`) as HTMLInputElement)?.value;
                            const manager = (document.getElementById(`mgr_${hotel.id}`) as HTMLInputElement)?.value;
                            const address = (document.getElementById(`addr_${hotel.id}`) as HTMLInputElement)?.value;
                            const phone = (document.getElementById(`phone_${hotel.id}`) as HTMLInputElement)?.value;
                            const status = (document.getElementById(`status_${hotel.id}`) as HTMLSelectElement)?.value;

                            handleSaveItemEdit(hotel.id, {
                              name,
                              city,
                              manager,
                              address,
                              phone,
                              status,
                            });
                          }}
                          className="px-4 py-1 rounded text-xs font-bold cursor-pointer"
                          style={{ background: 'var(--primary)', color: '#121316' }}
                        >
                          Save Card
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                      <div className="truncate">{hotel.address}</div>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/80">
                        <span>GM: {hotel.manager}</span>
                        <span>{hotel.phone}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-border/80 text-center">
                        <div className="p-1 rounded bg-black/20">
                          <div className="font-bold text-foreground">{hotel.totalAssets || 0}</div>
                          <div className="text-[10px] text-muted-foreground">Assets</div>
                        </div>
                        <div className="p-1 rounded bg-black/20">
                          <div className="font-bold text-rose-400">{hotel.overdueCount || 0}</div>
                          <div className="text-[10px] text-muted-foreground">Overdue</div>
                        </div>
                        <div className="p-1 rounded bg-black/20">
                          <div className="font-bold text-amber-400">{hotel.dueTodayCount || 0}</div>
                          <div className="text-[10px] text-muted-foreground">Due Today</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 5. GENERIC DATA RECORDS (FOR COMPLIANCE, CONTRACTS, INSURANCE, UTILITIES, ETC.) ─── */}
      {selectedPage !== 'properties' && selectedPage !== 'assets' && selectedPage !== 'nonfixed' && selectedPage !== 'overview' && currentPage.items && currentPage.items.length > 0 && (
        <div
          className="rounded-xl border p-5 flex flex-col gap-4 shadow-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <span className="font-head font-bold text-sm text-foreground">
                {recordsSectionNum}. {currentPage.title} Live Data Records ({currentPage.items.length} Records)
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Edit individual records, dates, providers, values, and compliance statuses directly
              </p>
            </div>

            <button
              onClick={() => {
                const sample = currentPage.items?.[0] || {};
                const emptyForm: Record<string, any> = {};
                Object.keys(sample).forEach((k) => {
                  if (k !== 'id') emptyForm[k] = '';
                });
                setNewGenericForm(emptyForm);
                setShowAddGenericModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-transform active:scale-95 shadow-sm cursor-pointer"
              style={{ background: 'var(--primary)', color: '#121316' }}
            >
              <Plus size={14} strokeWidth={2.5} />
              Add New Record
            </button>
          </div>

          <div className="border border-border rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-black/20 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                  {Object.keys(currentPage.items[0] || {})
                    .filter((k) => k !== 'id')
                    .map((header) => {
                      const matchedCol = currentPage.columns?.find(
                        (c) => c.id.toLowerCase() === header.toLowerCase()
                      );
                      return (
                        <th key={header} className="py-2.5 px-3">
                          {matchedCol ? matchedCol.label : header.replace(/([A-Z])/g, ' $1')}
                        </th>
                      );
                    })}
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {currentPage.items.map((row: any, idx: number) => (
                  <tr key={row.id || idx} className="hover:bg-white/[0.02] transition-colors">
                    {Object.entries(row)
                      .filter(([k]) => k !== 'id')
                      .map(([key, val]) => (
                        <td key={key} className="py-2.5 px-3 text-foreground">
                          {key.toLowerCase().includes('status') ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              {String(val)}
                            </span>
                          ) : (
                            String(val)
                          )}
                        </td>
                      ))}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingGenericItem({ ...row })}
                          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                          title="Edit Record"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(row.id, row.name || row.item || row.title || 'Record')}
                          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT ASSET RECORD ─── */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="rounded-2xl border max-w-2xl w-full overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            style={{ background: '#161a22', borderColor: 'rgba(232, 201, 122, 0.4)' }}
          >
            <div
              className="px-6 py-4 border-b border-border flex items-center justify-between"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-2">
                <Edit2 size={16} className="text-primary" />
                <h3 className="font-head font-bold text-sm text-foreground">
                  Edit Asset Record: <span className="text-primary">{editingAsset.name}</span>
                </h3>
              </div>
              <button
                onClick={() => setEditingAsset(null)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAssetEdit} className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Asset ID</label>
                  <input
                    type="text"
                    value={editingAsset.assetId || editingAsset.id}
                    onChange={(e) => setEditingAsset({ ...editingAsset, assetId: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none font-mono"
                    style={{ background: 'var(--surface2)' }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Asset Name *</label>
                  <input
                    type="text"
                    required
                    value={editingAsset.name}
                    onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none font-bold"
                    style={{ background: 'var(--surface2)' }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Category</label>
                  <select
                    value={editingAsset.category}
                    onChange={(e) => setEditingAsset({ ...editingAsset, category: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                    style={{ background: 'var(--surface2)' }}
                  >
                    {ASSET_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Hotel / Property</label>
                  <select
                    value={editingAsset.hotelName}
                    onChange={(e) => setEditingAsset({ ...editingAsset, hotelName: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                    style={{ background: 'var(--surface2)' }}
                  >
                    {HOTELS.map((h) => (
                      <option key={h.id} value={h.name}>{h.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Department</label>
                  <input
                    type="text"
                    value={editingAsset.department || ''}
                    onChange={(e) => setEditingAsset({ ...editingAsset, department: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                    style={{ background: 'var(--surface2)' }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Location</label>
                  <input
                    type="text"
                    value={editingAsset.location || ''}
                    onChange={(e) => setEditingAsset({ ...editingAsset, location: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                    style={{ background: 'var(--surface2)' }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Quantity</label>
                  <input
                    type="number"
                    value={editingAsset.quantity || 1}
                    onChange={(e) => setEditingAsset({ ...editingAsset, quantity: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                    style={{ background: 'var(--surface2)' }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Condition</label>
                  <select
                    value={editingAsset.condition || 'good'}
                    onChange={(e) => setEditingAsset({ ...editingAsset, condition: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                    style={{ background: 'var(--surface2)' }}
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Risk Level</label>
                  <select
                    value={editingAsset.riskLevel || 'low'}
                    onChange={(e) => setEditingAsset({ ...editingAsset, riskLevel: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                    style={{ background: 'var(--surface2)' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Status</label>
                  <select
                    value={editingAsset.status || 'active'}
                    onChange={(e) => setEditingAsset({ ...editingAsset, status: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                    style={{ background: 'var(--surface2)' }}
                  >
                    <option value="active">Active</option>
                    <option value="under-maintenance">Under Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setEditingAsset(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-border hover:bg-white/[0.04] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold transition-transform active:scale-95 cursor-pointer"
                  style={{ background: 'var(--primary)', color: '#121316' }}
                >
                  Save Asset Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD ASSET RECORD ─── */}
      {showAddAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="rounded-2xl border max-w-2xl w-full overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            style={{ background: '#161a22', borderColor: 'rgba(232, 201, 122, 0.4)' }}
          >
            <div
              className="px-6 py-4 border-b border-border flex items-center justify-between"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-2">
                <Plus size={16} className="text-primary" />
                <h3 className="font-head font-bold text-sm text-foreground">
                  Add New Asset Record to Register
                </h3>
              </div>
              <button
                onClick={() => setShowAddAssetModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Asset ID (e.g. FA-099)</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if blank"
                    value={newAssetForm.assetId}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, assetId: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none font-mono"
                    style={{ background: 'var(--surface2)' }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Asset Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Split System Air Conditioner, Wardrobe"
                    value={newAssetForm.name}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, name: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none font-bold"
                    style={{ background: 'var(--surface2)' }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Category</label>
                  <select
                    value={newAssetForm.category}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, category: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                    style={{ background: 'var(--surface2)' }}
                  >
                    {ASSET_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Hotel / Property</label>
                  <select
                    value={newAssetForm.hotelName}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, hotelName: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                    style={{ background: 'var(--surface2)' }}
                  >
                    {HOTELS.map((h) => (
                      <option key={h.id} value={h.name}>{h.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Housekeeping, Maintenance"
                    value={newAssetForm.department}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, department: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                    style={{ background: 'var(--surface2)' }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Guest Rooms, Plant Room"
                    value={newAssetForm.location}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, location: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                    style={{ background: 'var(--surface2)' }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Quantity</label>
                  <input
                    type="number"
                    value={newAssetForm.quantity}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, quantity: Number(e.target.value) || 1 })}
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                    style={{ background: 'var(--surface2)' }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Condition</label>
                  <select
                    value={newAssetForm.condition}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, condition: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                    style={{ background: 'var(--surface2)' }}
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAssetModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-border hover:bg-white/[0.04] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold transition-transform active:scale-95 cursor-pointer"
                  style={{ background: 'var(--primary)', color: '#121316' }}
                >
                  Create Asset Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT GENERIC ITEM ─── */}
      {editingGenericItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="rounded-2xl border max-w-xl w-full overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            style={{ background: '#161a22', borderColor: 'rgba(232, 201, 122, 0.4)' }}
          >
            <div
              className="px-6 py-4 border-b border-border flex items-center justify-between"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-2">
                <Edit2 size={16} className="text-primary" />
                <h3 className="font-head font-bold text-sm text-foreground">
                  Edit {currentPage.title} Record
                </h3>
              </div>
              <button
                onClick={() => setEditingGenericItem(null)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveGenericItem} className="p-6 flex flex-col gap-3.5 overflow-y-auto">
              {Object.keys(editingGenericItem)
                .filter((k) => k !== 'id')
                .map((field) => (
                  <div key={field} className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground capitalize">
                      {field.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <input
                      type="text"
                      value={editingGenericItem[field] || ''}
                      onChange={(e) =>
                        setEditingGenericItem({ ...editingGenericItem, [field]: e.target.value })
                      }
                      className="rounded-lg border border-border px-3 py-2 text-xs outline-none focus:border-primary"
                      style={{ background: 'var(--surface2)' }}
                    />
                  </div>
                ))}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setEditingGenericItem(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-border hover:bg-white/[0.04] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold transition-transform active:scale-95 cursor-pointer"
                  style={{ background: 'var(--primary)', color: '#121316' }}
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD GENERIC ITEM ─── */}
      {showAddGenericModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="rounded-2xl border max-w-xl w-full overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            style={{ background: '#161a22', borderColor: 'rgba(232, 201, 122, 0.4)' }}
          >
            <div
              className="px-6 py-4 border-b border-border flex items-center justify-between"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-2">
                <Plus size={16} className="text-primary" />
                <h3 className="font-head font-bold text-sm text-foreground">
                  Add New Record to {currentPage.title}
                </h3>
              </div>
              <button
                onClick={() => setShowAddGenericModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateGenericItem} className="p-6 flex flex-col gap-3.5 overflow-y-auto">
              {Object.keys(newGenericForm).map((field) => (
                <div key={field} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground capitalize">
                    {field.replace(/([A-Z])/g, ' $1')}
                  </label>
                  <input
                    type="text"
                    value={newGenericForm[field] || ''}
                    onChange={(e) =>
                      setNewGenericForm({ ...newGenericForm, [field]: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none focus:border-primary"
                    style={{ background: 'var(--surface2)' }}
                  />
                </div>
              ))}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddGenericModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-border hover:bg-white/[0.04] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold transition-transform active:scale-95 cursor-pointer"
                  style={{ background: 'var(--primary)', color: '#121316' }}
                >
                  Create Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD PROPERTY ─── */}
      {showAddPropertyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="rounded-2xl border max-w-lg w-full overflow-hidden shadow-2xl"
            style={{ background: '#161a22', borderColor: 'rgba(232, 201, 122, 0.3)' }}
          >
            <div
              className="px-6 py-4 border-b border-border flex items-center justify-between"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-2">
                <Plus size={16} className="text-primary" />
                <h3 className="font-head font-bold text-sm text-foreground">
                  Add New Property Card to CMS
                </h3>
              </div>
              <button
                onClick={() => setShowAddPropertyModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Property Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grand Central Hotel London"
                  value={newPropertyForm.name}
                  onChange={(e) =>
                    setNewPropertyForm({ ...newPropertyForm, name: e.target.value })
                  }
                  className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">City / Region</label>
                  <input
                    type="text"
                    value={newPropertyForm.city}
                    onChange={(e) =>
                      setNewPropertyForm({ ...newPropertyForm, city: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">General Manager</label>
                  <input
                    type="text"
                    value={newPropertyForm.manager}
                    onChange={(e) =>
                      setNewPropertyForm({ ...newPropertyForm, manager: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Full Address</label>
                <input
                  type="text"
                  value={newPropertyForm.address}
                  onChange={(e) =>
                    setNewPropertyForm({ ...newPropertyForm, address: e.target.value })
                  }
                  className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Phone Number</label>
                  <input
                    type="text"
                    value={newPropertyForm.phone}
                    onChange={(e) =>
                      setNewPropertyForm({ ...newPropertyForm, phone: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Initial Status</label>
                  <select
                    value={newPropertyForm.status}
                    onChange={(e) =>
                      setNewPropertyForm({ ...newPropertyForm, status: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none cursor-pointer"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-1">
                <button
                  type="button"
                  onClick={() => setShowAddPropertyModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-border cursor-pointer hover:bg-white/[0.04]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold transition-transform active:scale-95 cursor-pointer"
                  style={{ background: 'var(--primary)', color: '#121316' }}
                >
                  Add Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
