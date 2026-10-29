'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ALL_SYSTEM_TABS,
  type TabConfig,
  type UserTabPermissions,
  type TabAccessMode,
  type TabSectionLocation,
  DEFAULT_TAB_SECTIONS,
  getDefaultTabPermissionsForRole,
  getAllRoleTabTemplates,
  transferTabBetweenRoles,
  transferAllTabsBetweenRoles,
  getTabSectionMapping,
  saveTabSectionMapping,
  copyTabToSection,
  moveTabToSection,
} from '@/lib/permissions';
import { useAuth, type RoleLevel } from '@/lib/authContext';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';
import {
  Check,
  X,
  Eye,
  Edit3,
  Search,
  RotateCcw,
  ShieldCheck,
  Building2,
  Package,
  Wrench,
  Shield,
  FileSignature,
  Zap,
  BarChart3,
  Upload,
  Users,
  Settings,
  FolderArchive,
  CheckSquare,
  History,
  LayoutDashboard,
  Layers,
  Tag,
  AlertCircle,
  ArrowRightLeft,
  Copy,
  Globe,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';

const TAB_ICONS: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard size={14} className="text-amber-400" />,
  properties: <Building2 size={14} className="text-blue-400" />,
  tasks: <CheckSquare size={14} className="text-pink-400" />,
  'recent-logs': <History size={14} className="text-purple-400" />,
  'fixed-assets': <Package size={14} className="text-amber-400" />,
  'non-fixed-assets': <Layers size={14} className="text-cyan-400" />,
  categories: <Tag size={14} className="text-emerald-400" />,
  maintenance: <Wrench size={14} className="text-emerald-400" />,
  compliance: <ShieldCheck size={14} className="text-blue-400" />,
  'compliance-tracker': <AlertCircle size={14} className="text-amber-400" />,
  insurance: <Shield size={14} className="text-purple-400" />,
  contracts: <FileSignature size={14} className="text-teal-400" />,
  utilities: <Zap size={14} className="text-yellow-400" />,
  documents: <FolderArchive size={14} className="text-orange-400" />,
  reports: <BarChart3 size={14} className="text-indigo-400" />,
  import: <Upload size={14} className="text-emerald-400" />,
  users: <Users size={14} className="text-rose-400" />,
  settings: <Settings size={14} className="text-slate-400" />,
};

const ROLE_METADATA: Record<string, { label: string; title: string; color: string; badgeBg: string }> = {
  L1: { label: 'L1 – Super Admin', title: 'Super Admin', color: '#f43f5e', badgeBg: 'rgba(244,63,94,0.15)' },
  L2: { label: 'L2 – Admin', title: 'Admin', color: '#a78bfa', badgeBg: 'rgba(167,139,250,0.15)' },
  L3: { label: 'L3 – Uploader', title: 'Uploader', color: '#10b981', badgeBg: 'rgba(16,185,129,0.15)' },
  L4: { label: 'L4 – Viewer', title: 'Viewer', color: '#94a3b8', badgeBg: 'rgba(148,163,184,0.15)' },
};

const SECTION_METADATA: Record<TabSectionLocation, { label: string; badgeBg: string; color: string }> = {
  propco: { label: 'PROPCO', badgeBg: 'rgba(232,201,122,0.15)', color: '#e8c97a' },
  opco: { label: 'OPCO', badgeBg: 'rgba(96,165,250,0.15)', color: '#60a5fa' },
  both: { label: 'PROPCO & OPCO', badgeBg: 'rgba(61,214,140,0.15)', color: '#3dd68c' },
  bottom: { label: 'BOTTOM', badgeBg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
};

interface TabPermissionsEditorProps {
  permissions: UserTabPermissions;
  onChange?: (newPerms: UserTabPermissions) => void;
  roleLevel?: string;
  userName?: string;
  readOnly?: boolean;
  onSyncUsersInRole?: (targetRole: string, perms: UserTabPermissions) => Promise<void> | void;
  onAssignToAllUsers?: (tabId: string, accessLevel: TabAccessMode) => Promise<void> | void;
}

export default function TabPermissionsEditor({
  permissions,
  onChange,
  roleLevel = 'L2',
  userName,
  readOnly = false,
  onSyncUsersInRole,
  onAssignToAllUsers,
}: TabPermissionsEditorProps) {
  const { isSuperAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>('ALL');

  // Role templates state
  const [roleTemplates, setRoleTemplates] = useState<Record<string, UserTabPermissions>>(() =>
    getAllRoleTabTemplates()
  );

  // Section Mapping State (PropCo vs OpCo vs Both)
  const [sectionMapping, setSectionMapping] = useState<Record<string, TabSectionLocation>>(() =>
    getTabSectionMapping()
  );

  useEffect(() => {
    const handleTemplateChange = () => {
      setRoleTemplates(getAllRoleTabTemplates());
    };
    const handleSectionChange = () => {
      setSectionMapping(getTabSectionMapping());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('samko:role-templates-changed', handleTemplateChange);
      window.addEventListener('samko:sections-changed', handleSectionChange);
      return () => {
        window.removeEventListener('samko:role-templates-changed', handleTemplateChange);
        window.removeEventListener('samko:sections-changed', handleSectionChange);
      };
    }
  }, []);

  // Single Tab Transfer Modal State
  const [singleTabModalTab, setSingleTabModalTab] = useState<TabConfig | null>(null);
  const [singleActionType, setSingleActionType] = useState<'copy' | 'move' | 'everyone'>('copy');
  const [singleTargetRole, setSingleTargetRole] = useState<RoleLevel | 'ALL'>('L3');
  const [singleAccessLevel, setSingleAccessLevel] = useState<TabAccessMode>('write');
  const [singleSyncUsers, setSingleSyncUsers] = useState<boolean>(true);
  const [singleProcessing, setSingleProcessing] = useState<boolean>(false);

  // Single Tab Section Options (PropCo / OpCo / Both)
  const [singleSectionTarget, setSingleSectionTarget] = useState<TabSectionLocation>('both');
  const [singleSectionMode, setSingleSectionMode] = useState<'copy' | 'move'>('copy');
  const [singleSectionChanged, setSingleSectionChanged] = useState<boolean>(false);

  // Bulk Role Transfer Modal State
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkSourceRole, setBulkSourceRole] = useState<RoleLevel>((roleLevel as RoleLevel) || 'L2');
  const [bulkTargetRole, setBulkTargetRole] = useState<RoleLevel | 'ALL'>('L3');
  const [bulkMode, setBulkMode] = useState<'copy' | 'move'>('copy');
  const [bulkAccessLevel, setBulkAccessLevel] = useState<'keep' | 'write' | 'read'>('keep');
  const [bulkSyncUsers, setBulkSyncUsers] = useState<boolean>(true);
  const [bulkProcessing, setBulkProcessing] = useState<boolean>(false);

  // Ensure every tab in ALL_SYSTEM_TABS has an entry
  const fullPermissions: UserTabPermissions = useMemo(() => {
    const merged: UserTabPermissions = {};
    const defaults = getDefaultTabPermissionsForRole(roleLevel);

    ALL_SYSTEM_TABS.forEach((tab) => {
      if (permissions && permissions[tab.id] !== undefined) {
        merged[tab.id] = { ...permissions[tab.id] };
      } else if (defaults[tab.id]) {
        merged[tab.id] = { ...defaults[tab.id] };
      } else {
        merged[tab.id] = { enabled: true, accessLevel: 'write' };
      }
    });

    return merged;
  }, [permissions, roleLevel]);

  // Counts
  const stats = useMemo(() => {
    const total = ALL_SYSTEM_TABS.length;
    let enabledCount = 0;
    let writeCount = 0;
    let readCount = 0;

    ALL_SYSTEM_TABS.forEach((tab) => {
      const p = fullPermissions[tab.id];
      if (p?.enabled) {
        enabledCount++;
        if (p.accessLevel === 'write') writeCount++;
        else readCount++;
      }
    });

    return { total, enabledCount, writeCount, readCount, disabledCount: total - enabledCount };
  }, [fullPermissions]);

  // Presets
  const handleEnableAllWrite = () => {
    if (readOnly || !onChange) return;
    const updated: UserTabPermissions = {};
    ALL_SYSTEM_TABS.forEach((tab) => {
      updated[tab.id] = { enabled: true, accessLevel: 'write' };
    });
    onChange(updated);
  };

  const handleEnableAllRead = () => {
    if (readOnly || !onChange) return;
    const updated: UserTabPermissions = {};
    ALL_SYSTEM_TABS.forEach((tab) => {
      updated[tab.id] = { enabled: true, accessLevel: 'read' };
    });
    onChange(updated);
  };

  const handleResetDefaults = () => {
    if (readOnly || !onChange) return;
    const defaults = getDefaultTabPermissionsForRole(roleLevel);
    onChange(defaults);
  };

  const handleDisableAll = () => {
    if (readOnly || !onChange) return;
    const updated: UserTabPermissions = {};
    ALL_SYSTEM_TABS.forEach((tab) => {
      updated[tab.id] = { enabled: false, accessLevel: 'read' };
    });
    onChange(updated);
  };

  // Toggle single tab enabled/disabled
  const handleToggleTab = (tabId: string) => {
    if (readOnly || !onChange) return;
    const current = fullPermissions[tabId] || { enabled: true, accessLevel: 'write' };
    const updated: UserTabPermissions = {
      ...fullPermissions,
      [tabId]: {
        ...current,
        enabled: !current.enabled,
      },
    };
    onChange(updated);
  };

  // Set single tab access level (read vs write)
  const handleSetAccess = (tabId: string, accessLevel: TabAccessMode) => {
    if (readOnly || !onChange) return;
    const current = fullPermissions[tabId] || { enabled: true, accessLevel: 'write' };
    const updated: UserTabPermissions = {
      ...fullPermissions,
      [tabId]: {
        ...current,
        enabled: true,
        accessLevel,
      },
    };
    onChange(updated);
  };

  // Handle single tab transfer confirmation
  const handleConfirmSingleTransfer = async () => {
    if (!isSuperAdmin || !singleTabModalTab) return;
    setSingleProcessing(true);

    try {
      // 1. Process Section Placement (PropCo / OpCo / Both / Bottom)
      if (singleSectionChanged && singleSectionTarget) {
        let updatedSecs: Record<string, TabSectionLocation>;
        if (singleSectionMode === 'copy') {
          updatedSecs = copyTabToSection(singleTabModalTab.id, singleSectionTarget as any);
        } else {
          updatedSecs = moveTabToSection(singleTabModalTab.id, singleSectionTarget);
        }
        setSectionMapping(updatedSecs);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('samko:sections-changed', { detail: { mapping: updatedSecs } }));
          window.dispatchEvent(new CustomEvent('samko:app-cms-updated', { detail: { mapping: updatedSecs } }));
        }
      }

      // 2. Process Role & User Permission Transfer
      if (singleActionType === 'everyone') {
        const updatedTemplates = transferTabBetweenRoles({
          tabId: singleTabModalTab.id,
          fromRole: roleLevel,
          toRole: 'ALL',
          mode: 'copy',
          accessLevel: singleAccessLevel,
        });
        setRoleTemplates(updatedTemplates);

        if (onChange) {
          onChange({
            ...fullPermissions,
            [singleTabModalTab.id]: { enabled: true, accessLevel: singleAccessLevel },
          });
        }

        if (onAssignToAllUsers) {
          await onAssignToAllUsers(singleTabModalTab.id, singleAccessLevel);
        }

        toast.success(`Assigned "${singleTabModalTab.name}" to Everyone!`, {
          description: `All roles and users now have access. Section set to ${SECTION_METADATA[singleSectionTarget]?.label || 'updated'}.`,
        });
      } else {
        const updatedTemplates = transferTabBetweenRoles({
          tabId: singleTabModalTab.id,
          fromRole: roleLevel,
          toRole: singleTargetRole,
          mode: singleActionType,
          accessLevel: singleAccessLevel,
        });
        setRoleTemplates(updatedTemplates);

        if (onChange) {
          if (singleActionType === 'move' && singleTargetRole !== roleLevel) {
            onChange({
              ...fullPermissions,
              [singleTabModalTab.id]: { enabled: false, accessLevel: singleAccessLevel },
            });
          } else if (singleTargetRole === roleLevel || singleActionType === 'copy') {
            onChange({
              ...fullPermissions,
              [singleTabModalTab.id]: { enabled: true, accessLevel: singleAccessLevel },
            });
          }
        }

        if (singleSyncUsers && onSyncUsersInRole && singleTargetRole !== 'ALL') {
          await onSyncUsersInRole(singleTargetRole, updatedTemplates[singleTargetRole]);
        }

        const actionText = singleActionType === 'copy' ? 'Copied' : 'Moved';
        const targetLabel = singleTargetRole === 'ALL' ? 'All Roles' : ROLE_METADATA[singleTargetRole]?.title || singleTargetRole;
        toast.success(`Successfully ${actionText.toLowerCase()} "${singleTabModalTab.name}" to ${targetLabel}!`, {
          description: `Access set to ${singleAccessLevel === 'write' ? 'Edit & Write' : 'Read Only'}${
            singleSectionChanged ? ` · Section: ${SECTION_METADATA[singleSectionTarget]?.label}` : ''
          }.`,
        });
      }

      setSingleTabModalTab(null);
    } catch (err: any) {
      toast.error('Failed to complete tab transfer', { description: err?.message || 'Unknown error' });
    } finally {
      setSingleProcessing(false);
    }
  };

  // Handle bulk transfer confirmation
  const handleConfirmBulkTransfer = async () => {
    if (!isSuperAdmin) return;
    setBulkProcessing(true);

    try {
      const updatedTemplates = transferAllTabsBetweenRoles({
        fromRole: bulkSourceRole,
        toRole: bulkTargetRole,
        mode: bulkMode,
        forceAccessLevel: bulkAccessLevel === 'keep' ? undefined : bulkAccessLevel,
      });
      setRoleTemplates(updatedTemplates);

      if ((bulkTargetRole === 'ALL' || bulkTargetRole === roleLevel) && onChange) {
        onChange(updatedTemplates[roleLevel]);
      } else if (bulkMode === 'move' && bulkSourceRole === roleLevel && onChange) {
        onChange(updatedTemplates[roleLevel]);
      }

      if (bulkSyncUsers && onSyncUsersInRole) {
        if (bulkTargetRole === 'ALL') {
          for (const r of ['L1', 'L2', 'L3', 'L4'] as RoleLevel[]) {
            await onSyncUsersInRole(r, updatedTemplates[r]);
          }
        } else {
          await onSyncUsersInRole(bulkTargetRole, updatedTemplates[bulkTargetRole]);
        }
      }

      const modeWord = bulkMode === 'copy' ? 'copied' : 'moved';
      const targetLabel = bulkTargetRole === 'ALL' ? 'All Roles' : ROLE_METADATA[bulkTargetRole]?.title || bulkTargetRole;
      toast.success(`Tabs ${modeWord} from ${ROLE_METADATA[bulkSourceRole]?.title} to ${targetLabel}!`, {
        description: `Templates updated${bulkSyncUsers ? ' and synced to active accounts.' : '.'}`,
      });

      setShowBulkModal(false);
    } catch (err: any) {
      toast.error('Failed to execute bulk tab transfer', { description: err?.message || 'Unknown error' });
    } finally {
      setBulkProcessing(false);
    }
  };

  // Filter tabs
  const filteredTabs = useMemo(() => {
    return ALL_SYSTEM_TABS.filter((tab) => {
      const matchSearch =
        tab.name.toLowerCase().includes(search.toLowerCase()) ||
        tab.description.toLowerCase().includes(search.toLowerCase()) ||
        tab.path.toLowerCase().includes(search.toLowerCase());
      const matchGroup = activeGroup === 'ALL' || tab.group === activeGroup;
      return matchSearch && matchGroup;
    });
  }, [search, activeGroup]);

  // Group filtered tabs
  const groups = useMemo(() => {
    const list: { groupName: string; tabs: TabConfig[] }[] = [];
    filteredTabs.forEach((tab) => {
      let g = list.find((x) => x.groupName === tab.group);
      if (!g) {
        g = { groupName: tab.group, tabs: [] };
        list.push(g);
      }
      g.tabs.push(tab);
    });
    return list;
  }, [filteredTabs]);

  const allGroups = useMemo(() => {
    const set = new Set<string>();
    ALL_SYSTEM_TABS.forEach((t) => set.add(t.group));
    return Array.from(set);
  }, []);

  return (
    <div className="space-y-4 text-xs">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded-xl border border-border" style={{ background: 'var(--surface2)' }}>
          <div className="text-[11px] text-muted-foreground font-medium">Enabled Tabs</div>
          <div className="text-lg font-bold text-emerald-400 mt-0.5">
            {stats.enabledCount} <span className="text-xs text-muted-foreground font-normal">/ {stats.total}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl border border-border" style={{ background: 'var(--surface2)' }}>
          <div className="text-[11px] text-muted-foreground font-medium">Edit & Write (Full)</div>
          <div className="text-lg font-bold text-primary mt-0.5">{stats.writeCount}</div>
        </div>

        <div className="p-2.5 rounded-xl border border-border" style={{ background: 'var(--surface2)' }}>
          <div className="text-[11px] text-muted-foreground font-medium">Read Only (View)</div>
          <div className="text-lg font-bold text-sky-400 mt-0.5">{stats.readCount}</div>
        </div>

        <div className="p-2.5 rounded-xl border border-border" style={{ background: 'var(--surface2)' }}>
          <div className="text-[11px] text-muted-foreground font-medium">Disabled / Hidden</div>
          <div className="text-lg font-bold text-slate-400 mt-0.5">{stats.disabledCount}</div>
        </div>
      </div>

      {/* Quick Action Presets & Role Transfer Bar */}
      {!readOnly && (
        <div
          className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 p-3 rounded-xl border border-border"
          style={{ background: 'var(--surface)' }}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
              Presets:
            </span>
            <button
              type="button"
              onClick={handleEnableAllWrite}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-primary/30 text-primary hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <Edit3 size={11} /> Enable All (Edit & Write)
            </button>
            <button
              type="button"
              onClick={handleEnableAllRead}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-sky-500/30 text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
            >
              <Eye size={11} /> Enable All (Read Only)
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title={`Reset to standard ${roleLevel} role defaults`}
            >
              <RotateCcw size={11} /> Reset Defaults ({roleLevel})
            </button>
            <button
              type="button"
              onClick={handleDisableAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-border text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <X size={11} /> Disable All
            </button>

            {/* Super Admin Role-to-Role Bulk Transfer Button */}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => {
                  setBulkSourceRole((roleLevel as RoleLevel) || 'L2');
                  setShowBulkModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ml-1"
                style={{
                  background: 'rgba(232,201,122,0.12)',
                  borderColor: 'rgba(232,201,122,0.4)',
                  color: 'var(--primary)',
                }}
                title="Super Admin: Copy or move entire tab collections between roles"
              >
                <ArrowRightLeft size={12} />
                <span>Role-to-Role Transfer</span>
              </button>
            )}
          </div>

          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tabs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-2.5 py-1 text-xs rounded-lg border border-border outline-none w-44"
              style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
            />
          </div>
        </div>
      )}

      {/* Group Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActiveGroup('ALL')}
          className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border cursor-pointer"
          style={{
            background: activeGroup === 'ALL' ? 'var(--primary)' : 'var(--surface2)',
            color: activeGroup === 'ALL' ? '#000' : 'var(--muted-foreground)',
            borderColor: activeGroup === 'ALL' ? 'var(--primary)' : 'var(--border)',
          }}
        >
          All Modules ({ALL_SYSTEM_TABS.length})
        </button>
        {allGroups.map((g) => {
          const isSelected = activeGroup === g;
          const count = ALL_SYSTEM_TABS.filter((t) => t.group === g).length;
          return (
            <button
              key={g}
              type="button"
              onClick={() => setActiveGroup(g)}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border cursor-pointer"
              style={{
                background: isSelected ? 'var(--primary)' : 'var(--surface2)',
                color: isSelected ? '#000' : 'var(--muted-foreground)',
                borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
              }}
            >
              {g} ({count})
            </button>
          );
        })}
      </div>

      {/* Tabs Table / List by Group */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
        {groups.map(({ groupName, tabs }) => (
          <div key={groupName} className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--surface)' }}>
            <div className="px-4 py-2 border-b border-border flex items-center justify-between" style={{ background: 'var(--surface2)' }}>
              <span className="font-head text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {groupName}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {tabs.filter((t) => fullPermissions[t.id]?.enabled).length} of {tabs.length} Enabled
              </span>
            </div>

            <div className="divide-y divide-border/40">
              {tabs.map((tab) => {
                const perm = fullPermissions[tab.id] || { enabled: true, accessLevel: 'write' };
                const isEnabled = perm.enabled;
                const isWrite = perm.accessLevel === 'write';
                const icon = TAB_ICONS[tab.id] || <Building2 size={14} />;

                // Check role templates access for this tab
                const roleAccess = (['L1', 'L2', 'L3', 'L4'] as RoleLevel[]).map((r) => {
                  const rPerm = roleTemplates[r]?.[tab.id] || getDefaultTabPermissionsForRole(r)[tab.id];
                  return {
                    role: r,
                    enabled: !!rPerm?.enabled,
                    accessLevel: rPerm?.accessLevel || 'read',
                  };
                });

                // Section location (PropCo / OpCo / Both / Bottom)
                const secLoc = sectionMapping[tab.id] || DEFAULT_TAB_SECTIONS[tab.id] || 'propco';
                const secMeta = SECTION_METADATA[secLoc] || SECTION_METADATA.propco;

                return (
                  <div
                    key={tab.id}
                    className="p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Left: Tab info */}
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="p-1.5 rounded-lg flex-shrink-0 mt-0.5" style={{ background: 'var(--surface2)' }}>
                        {icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-xs">{tab.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground truncate hidden md:inline">
                            {tab.path}
                          </span>

                          {/* Section Placement Badge */}
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-extrabold uppercase tracking-wider border"
                            style={{
                              background: secMeta.badgeBg,
                              color: secMeta.color,
                              borderColor: `${secMeta.color}44`,
                            }}
                            title={`Sidebar Section Placement: ${secMeta.label}`}
                          >
                            {secLoc === 'both' ? 'PropCo & OpCo' : secMeta.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                          {tab.description}
                        </p>

                        {/* Interactive Role Badges (Super Admin View) */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-[9.5px] uppercase tracking-wider text-muted-foreground font-bold mr-1">
                            Role Access:
                          </span>
                          {roleAccess.map(({ role, enabled, accessLevel }) => {
                            const meta = ROLE_METADATA[role];
                            return (
                              <button
                                key={role}
                                type="button"
                                disabled={!isSuperAdmin}
                                onClick={() => {
                                  if (!isSuperAdmin) return;
                                  setSingleTabModalTab(tab);
                                  setSingleTargetRole(role);
                                  setSingleActionType(enabled ? 'move' : 'copy');
                                  setSingleAccessLevel(accessLevel);
                                  setSingleSectionTarget(secLoc);
                                  setSingleSectionChanged(false);
                                }}
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-extrabold transition-all border ${
                                  isSuperAdmin ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                                }`}
                                style={{
                                  background: enabled ? meta.badgeBg : 'transparent',
                                  color: enabled ? meta.color : 'var(--muted-foreground)',
                                  borderColor: enabled ? `${meta.color}55` : 'var(--border)',
                                  opacity: enabled ? 1 : 0.45,
                                }}
                                title={
                                  isSuperAdmin
                                    ? `${meta.title}: ${enabled ? `Enabled (${accessLevel === 'write' ? 'Edit & Write' : 'Read Only'})` : 'Disabled'} — Click to transfer/assign`
                                    : `${meta.title}: ${enabled ? 'Enabled' : 'Disabled'}`
                                }
                              >
                                <span>{role}</span>
                                {enabled && (
                                  <span className="text-[8px] opacity-75 font-normal">
                                    {accessLevel === 'write' ? 'W' : 'R'}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right: Controls (Enable/Disable, Read/Write, and Super Admin Copy/Move) */}
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      {/* Enable / Disable Button */}
                      {!readOnly ? (
                        <button
                          type="button"
                          onClick={() => handleToggleTab(tab.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
                          style={{
                            background: isEnabled ? 'rgba(61,214,140,0.12)' : 'var(--surface2)',
                            borderColor: isEnabled ? '#3dd68c' : 'var(--border)',
                            color: isEnabled ? '#3dd68c' : 'var(--muted-foreground)',
                          }}
                          title={isEnabled ? 'Click to disable tab' : 'Click to enable tab'}
                        >
                          {isEnabled ? <Check size={12} /> : <X size={12} />}
                          <span>{isEnabled ? 'Enabled' : 'Disabled'}</span>
                        </button>
                      ) : (
                        <span
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border"
                          style={{
                            background: isEnabled ? 'rgba(61,214,140,0.1)' : 'var(--surface2)',
                            borderColor: isEnabled ? '#3dd68c' : 'var(--border)',
                            color: isEnabled ? '#3dd68c' : 'var(--muted-foreground)',
                          }}
                        >
                          {isEnabled ? <Check size={11} /> : <X size={11} />}
                          {isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      )}

                      {/* Access Level Selector (Read Only vs Edit & Write) */}
                      {isEnabled ? (
                        <div className="flex items-center rounded-lg border border-border p-0.5" style={{ background: 'var(--surface2)' }}>
                          <button
                            type="button"
                            disabled={readOnly}
                            onClick={() => handleSetAccess(tab.id, 'read')}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer disabled:cursor-default"
                            style={{
                              background: !isWrite ? 'rgba(96,165,250,0.2)' : 'transparent',
                              color: !isWrite ? '#60a5fa' : 'var(--muted-foreground)',
                            }}
                            title="Read Only: User can view records but cannot edit or delete"
                          >
                            <Eye size={11} />
                            <span>Read Only</span>
                          </button>

                          <button
                            type="button"
                            disabled={readOnly}
                            onClick={() => handleSetAccess(tab.id, 'write')}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer disabled:cursor-default"
                            style={{
                              background: isWrite ? 'rgba(232,201,122,0.2)' : 'transparent',
                              color: isWrite ? 'var(--primary)' : 'var(--muted-foreground)',
                            }}
                            title="Edit & Write: Full operational access to add, edit, and delete records"
                          >
                            <Edit3 size={11} />
                            <span>Edit & Write</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground px-2 py-1 italic">
                          No Access
                        </span>
                      )}

                      {/* Super Admin Single-Tab Copy / Move / Assign Action */}
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setSingleTabModalTab(tab);
                            setSingleActionType('copy');
                            setSingleTargetRole('L3');
                            setSingleAccessLevel(isWrite ? 'write' : 'read');
                            setSingleSyncUsers(true);
                            setSingleSectionTarget(secLoc);
                            setSingleSectionChanged(false);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer hover:border-primary/50 text-muted-foreground hover:text-foreground"
                          style={{
                            background: 'var(--surface2)',
                            borderColor: 'var(--border)',
                          }}
                          title="Super Admin: Copy or move this tab to another role, or assign to PropCo/OpCo sections"
                        >
                          <ArrowRightLeft size={11} className="text-primary" />
                          <span>Copy / Move</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {groups.length === 0 && (
          <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl">
            No tabs match query &quot;{search}&quot;
          </div>
        )}
      </div>

      {/* ── SINGLE TAB COPY / MOVE / ASSIGN MODAL (SUPER ADMIN ONLY) ── */}
      {singleTabModalTab && (
        <Modal
          open={!!singleTabModalTab}
          onClose={() => setSingleTabModalTab(null)}
          title={`Copy / Move Tab · ${singleTabModalTab.name}`}
          subtitle={
            userName
              ? `Manage "${singleTabModalTab.name}" for ${userName} (${roleLevel}), or transfer across roles & sidebar sections.`
              : `Assign, copy, or move "${singleTabModalTab.name}" across roles or to PROPCO / OPCO sections.`
          }
          width={600}
        >
          <div className="space-y-4 text-xs">
            {/* Tab Banner */}
            <div
              className="p-3 rounded-xl border border-border flex items-center gap-3"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="p-2 rounded-lg bg-surface border border-border">
                {TAB_ICONS[singleTabModalTab.id] || <Building2 size={16} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-foreground">{singleTabModalTab.name}</div>
                <div className="text-[11px] text-muted-foreground font-mono">{singleTabModalTab.path}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                  {singleTabModalTab.description}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: `${ROLE_METADATA[roleLevel]?.color || '#a78bfa'}22`,
                    color: ROLE_METADATA[roleLevel]?.color || '#a78bfa',
                  }}
                >
                  Role: {roleLevel}
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase tracking-wider border"
                  style={{
                    background: SECTION_METADATA[sectionMapping[singleTabModalTab.id] || 'propco']?.badgeBg,
                    color: SECTION_METADATA[sectionMapping[singleTabModalTab.id] || 'propco']?.color,
                    borderColor: `${SECTION_METADATA[sectionMapping[singleTabModalTab.id] || 'propco']?.color}44`,
                  }}
                >
                  Section: {sectionMapping[singleTabModalTab.id] === 'both' ? 'PropCo & OpCo' : SECTION_METADATA[sectionMapping[singleTabModalTab.id] || 'propco']?.label}
                </span>
              </div>
            </div>

            {/* 1. Sidebar Section Placement (PropCo / OpCo / Both) */}
            <div className="p-3 rounded-xl border border-border" style={{ background: 'var(--surface)' }}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <SlidersHorizontal size={12} className="text-primary" />
                  <span>Sidebar Section: PROPCO &amp; OPCO</span>
                </label>
                <span className="text-[10px] text-muted-foreground">
                  Current: <strong className="text-foreground uppercase">{sectionMapping[singleTabModalTab.id] === 'both' ? 'PropCo & OpCo' : sectionMapping[singleTabModalTab.id] || 'propco'}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSingleSectionChanged(true);
                    setSingleSectionTarget('propco');
                    setSingleSectionMode('move');
                  }}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer"
                  style={{
                    background: (singleSectionChanged ? singleSectionTarget === 'propco' : (sectionMapping[singleTabModalTab.id] || 'propco') === 'propco') ? 'rgba(232,201,122,0.15)' : 'var(--surface2)',
                    borderColor: (singleSectionChanged ? singleSectionTarget === 'propco' : (sectionMapping[singleTabModalTab.id] || 'propco') === 'propco') ? 'var(--primary)' : 'var(--border)',
                    color: (singleSectionChanged ? singleSectionTarget === 'propco' : (sectionMapping[singleTabModalTab.id] || 'propco') === 'propco') ? 'var(--primary)' : 'var(--foreground)',
                  }}
                >
                  <Building2 size={14} className="mb-1 text-amber-400" />
                  <span className="font-bold text-[11px]">PROPCO</span>
                  <span className="text-[9px] text-muted-foreground">Asset Co</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSingleSectionChanged(true);
                    setSingleSectionTarget('opco');
                    setSingleSectionMode('move');
                  }}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer"
                  style={{
                    background: (singleSectionChanged ? singleSectionTarget === 'opco' : (sectionMapping[singleTabModalTab.id] || 'propco') === 'opco') ? 'rgba(96,165,250,0.15)' : 'var(--surface2)',
                    borderColor: (singleSectionChanged ? singleSectionTarget === 'opco' : (sectionMapping[singleTabModalTab.id] || 'propco') === 'opco') ? '#60a5fa' : 'var(--border)',
                    color: (singleSectionChanged ? singleSectionTarget === 'opco' : (sectionMapping[singleTabModalTab.id] || 'propco') === 'opco') ? '#60a5fa' : 'var(--foreground)',
                  }}
                >
                  <ShieldCheck size={14} className="mb-1 text-blue-400" />
                  <span className="font-bold text-[11px]">OPCO</span>
                  <span className="text-[9px] text-muted-foreground">Operations</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSingleSectionChanged(true);
                    setSingleSectionTarget('both');
                    setSingleSectionMode('copy');
                  }}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer"
                  style={{
                    background: (singleSectionChanged ? singleSectionTarget === 'both' : (sectionMapping[singleTabModalTab.id] || 'propco') === 'both') ? 'rgba(61,214,140,0.15)' : 'var(--surface2)',
                    borderColor: (singleSectionChanged ? singleSectionTarget === 'both' : (sectionMapping[singleTabModalTab.id] || 'propco') === 'both') ? '#3dd68c' : 'var(--border)',
                    color: (singleSectionChanged ? singleSectionTarget === 'both' : (sectionMapping[singleTabModalTab.id] || 'propco') === 'both') ? '#3dd68c' : 'var(--foreground)',
                  }}
                  title="Copy to both PropCo and OpCo sections so it exists in both places"
                >
                  <Layers size={14} className="mb-1 text-emerald-400" />
                  <span className="font-bold text-[11px]">BOTH SECTIONS</span>
                  <span className="text-[9px] text-muted-foreground">PropCo &amp; OpCo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSingleSectionChanged(true);
                    setSingleSectionTarget('bottom');
                    setSingleSectionMode('move');
                  }}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer"
                  style={{
                    background: (singleSectionChanged ? singleSectionTarget === 'bottom' : (sectionMapping[singleTabModalTab.id] || 'propco') === 'bottom') ? 'rgba(148,163,184,0.15)' : 'var(--surface2)',
                    borderColor: (singleSectionChanged ? singleSectionTarget === 'bottom' : (sectionMapping[singleTabModalTab.id] || 'propco') === 'bottom') ? '#94a3b8' : 'var(--border)',
                    color: (singleSectionChanged ? singleSectionTarget === 'bottom' : (sectionMapping[singleTabModalTab.id] || 'propco') === 'bottom') ? '#94a3b8' : 'var(--foreground)',
                  }}
                >
                  <Settings size={14} className="mb-1 text-slate-400" />
                  <span className="font-bold text-[11px]">BOTTOM NAV</span>
                  <span className="text-[9px] text-muted-foreground">Root footer</span>
                </button>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-muted-foreground">
                  💡 Tip: Choosing <strong>BOTH SECTIONS</strong> copies this tab to appear in both PropCo and OpCo without removing it from either.
                </span>
              </div>
            </div>

            {/* 2. Action Mode Choice for Roles */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Role Assignment Action
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSingleActionType('copy')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center cursor-pointer"
                  style={{
                    background: singleActionType === 'copy' ? 'rgba(232,201,122,0.12)' : 'var(--surface2)',
                    borderColor: singleActionType === 'copy' ? 'var(--primary)' : 'var(--border)',
                    color: singleActionType === 'copy' ? 'var(--primary)' : 'var(--foreground)',
                  }}
                >
                  <Copy size={16} className="mb-1" />
                  <span className="font-bold">Copy to Role</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Keep here &amp; add to role</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSingleActionType('move')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center cursor-pointer"
                  style={{
                    background: singleActionType === 'move' ? 'rgba(167,139,250,0.15)' : 'var(--surface2)',
                    borderColor: singleActionType === 'move' ? '#a78bfa' : 'var(--border)',
                    color: singleActionType === 'move' ? '#a78bfa' : 'var(--foreground)',
                  }}
                >
                  <ArrowRightLeft size={16} className="mb-1" />
                  <span className="font-bold">Move to Role</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Transfer away from {roleLevel}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSingleActionType('everyone')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center cursor-pointer"
                  style={{
                    background: singleActionType === 'everyone' ? 'rgba(61,214,140,0.12)' : 'var(--surface2)',
                    borderColor: singleActionType === 'everyone' ? '#3dd68c' : 'var(--border)',
                    color: singleActionType === 'everyone' ? '#3dd68c' : 'var(--foreground)',
                  }}
                >
                  <Globe size={16} className="mb-1" />
                  <span className="font-bold">Assign to Everyone</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Enable for all roles &amp; users</span>
                </button>
              </div>
            </div>

            {/* Target Role Selector (if not everyone) */}
            {singleActionType !== 'everyone' && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Destination Role
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['L1', 'L2', 'L3', 'L4'] as RoleLevel[]).map((r) => {
                    const meta = ROLE_METADATA[r];
                    const isSelected = singleTargetRole === r;
                    const isCurrent = r === roleLevel;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSingleTargetRole(r)}
                        className="flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer"
                        style={{
                          background: isSelected ? meta.badgeBg : 'var(--surface2)',
                          borderColor: isSelected ? meta.color : 'var(--border)',
                          color: isSelected ? meta.color : 'var(--foreground)',
                        }}
                      >
                        <span
                          className="w-6 h-6 rounded-md flex items-center justify-center font-extrabold text-[11px]"
                          style={{ background: `${meta.color}22`, color: meta.color }}
                        >
                          {r}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs truncate">{meta.title}</div>
                          {isCurrent && (
                            <span className="text-[9px] text-muted-foreground italic">Current Role</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Access Mode Level */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Access Level in Destination
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSingleAccessLevel('write')}
                  className="flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer"
                  style={{
                    background: singleAccessLevel === 'write' ? 'rgba(232,201,122,0.12)' : 'var(--surface2)',
                    borderColor: singleAccessLevel === 'write' ? 'var(--primary)' : 'var(--border)',
                    color: singleAccessLevel === 'write' ? 'var(--primary)' : 'var(--foreground)',
                  }}
                >
                  <Edit3 size={14} />
                  <div>
                    <div className="font-bold">Edit &amp; Write</div>
                    <div className="text-[10px] text-muted-foreground">Full permission to create, edit, update</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSingleAccessLevel('read')}
                  className="flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer"
                  style={{
                    background: singleAccessLevel === 'read' ? 'rgba(96,165,250,0.15)' : 'var(--surface2)',
                    borderColor: singleAccessLevel === 'read' ? '#60a5fa' : 'var(--border)',
                    color: singleAccessLevel === 'read' ? '#60a5fa' : 'var(--foreground)',
                  }}
                >
                  <Eye size={14} />
                  <div>
                    <div className="font-bold">Read Only</div>
                    <div className="text-[10px] text-muted-foreground">Strictly viewing without edit access</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Scope Checkbox */}
            <div className="p-3 rounded-xl border border-border/60" style={{ background: 'var(--surface2)' }}>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={singleSyncUsers}
                  onChange={(e) => setSingleSyncUsers(e.target.checked)}
                  className="mt-0.5 rounded border-border"
                />
                <div>
                  <div className="font-semibold text-foreground">
                    Instantly update all existing users in target role
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Saves tab access immediately to all user records in the database, without requiring manual edits per user.
                  </div>
                </div>
              </label>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setSingleTabModalTab(null)}
                className="samko-btn-ghost text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={singleProcessing}
                onClick={handleConfirmSingleTransfer}
                className="samko-btn-primary flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                {singleProcessing ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Confirm &amp; Apply Transfer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── BULK ROLE-TO-ROLE TRANSFER MODAL (SUPER ADMIN ONLY) ── */}
      {showBulkModal && (
        <Modal
          open={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          title="Role-to-Role Tab Transfer & Assignment"
          subtitle="Super Admin tool: Clone or transfer entire tab sets from one role to another with instant synchronization."
          width={600}
        >
          <div className="space-y-4 text-xs">
            {/* Source Role -> Target Role Selection */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-border" style={{ background: 'var(--surface2)' }}>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Source Role (Copy From)
                </label>
                <select
                  value={bulkSourceRole}
                  onChange={(e) => setBulkSourceRole(e.target.value as RoleLevel)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-xs font-semibold outline-none cursor-pointer"
                  style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
                >
                  {(['L1', 'L2', 'L3', 'L4'] as RoleLevel[]).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_METADATA[r].label}
                    </option>
                  ))}
                </select>
                <div className="text-[10px] text-muted-foreground mt-1">
                  Active tabs in this role will be transferred
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Destination Role (Assign To)
                </label>
                <select
                  value={bulkTargetRole}
                  onChange={(e) => setBulkTargetRole(e.target.value as RoleLevel | 'ALL')}
                  className="w-full px-3 py-2 rounded-lg border border-border text-xs font-semibold outline-none cursor-pointer"
                  style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
                >
                  <option value="ALL">All Roles (L1, L2, L3, L4)</option>
                  {(['L1', 'L2', 'L3', 'L4'] as RoleLevel[]).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_METADATA[r].label}
                    </option>
                  ))}
                </select>
                <div className="text-[10px] text-muted-foreground mt-1">
                  Destination that receives the transferred tabs
                </div>
              </div>
            </div>

            {/* Mode: Copy vs Move */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Transfer Mode
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setBulkMode('copy')}
                  className="flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer"
                  style={{
                    background: bulkMode === 'copy' ? 'rgba(232,201,122,0.12)' : 'var(--surface2)',
                    borderColor: bulkMode === 'copy' ? 'var(--primary)' : 'var(--border)',
                    color: bulkMode === 'copy' ? 'var(--primary)' : 'var(--foreground)',
                  }}
                >
                  <Copy size={16} />
                  <div>
                    <div className="font-bold">Copy All Tabs (Clone)</div>
                    <div className="text-[10px] text-muted-foreground">Keep tabs in source role and replicate to target</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkMode('move')}
                  className="flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer"
                  style={{
                    background: bulkMode === 'move' ? 'rgba(167,139,250,0.15)' : 'var(--surface2)',
                    borderColor: bulkMode === 'move' ? '#a78bfa' : 'var(--border)',
                    color: bulkMode === 'move' ? '#a78bfa' : 'var(--foreground)',
                  }}
                >
                  <ArrowRightLeft size={16} />
                  <div>
                    <div className="font-bold">Move Tabs (Transfer)</div>
                    <div className="text-[10px] text-muted-foreground">Transfer to target and disable in source role</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Access Mode Override */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Target Access Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBulkAccessLevel('keep')}
                  className="p-2.5 rounded-lg border text-center transition-all cursor-pointer"
                  style={{
                    background: bulkAccessLevel === 'keep' ? 'rgba(232,201,122,0.12)' : 'var(--surface2)',
                    borderColor: bulkAccessLevel === 'keep' ? 'var(--primary)' : 'var(--border)',
                    color: bulkAccessLevel === 'keep' ? 'var(--primary)' : 'var(--foreground)',
                  }}
                >
                  <div className="font-bold">Keep Source Mode</div>
                  <div className="text-[9.5px] text-muted-foreground">Preserve Write/Read</div>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkAccessLevel('write')}
                  className="p-2.5 rounded-lg border text-center transition-all cursor-pointer"
                  style={{
                    background: bulkAccessLevel === 'write' ? 'rgba(232,201,122,0.12)' : 'var(--surface2)',
                    borderColor: bulkAccessLevel === 'write' ? 'var(--primary)' : 'var(--border)',
                    color: bulkAccessLevel === 'write' ? 'var(--primary)' : 'var(--foreground)',
                  }}
                >
                  <div className="font-bold">Force Edit &amp; Write</div>
                  <div className="text-[9.5px] text-muted-foreground">Full CRUD rights</div>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkAccessLevel('read')}
                  className="p-2.5 rounded-lg border text-center transition-all cursor-pointer"
                  style={{
                    background: bulkAccessLevel === 'read' ? 'rgba(96,165,250,0.15)' : 'var(--surface2)',
                    borderColor: bulkAccessLevel === 'read' ? '#60a5fa' : 'var(--border)',
                    color: bulkAccessLevel === 'read' ? '#60a5fa' : 'var(--foreground)',
                  }}
                >
                  <div className="font-bold">Force Read Only</div>
                  <div className="text-[9.5px] text-muted-foreground">Viewing only</div>
                </button>
              </div>
            </div>

            {/* Sync Checkbox */}
            <div className="p-3 rounded-xl border border-border/60" style={{ background: 'var(--surface2)' }}>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bulkSyncUsers}
                  onChange={(e) => setBulkSyncUsers(e.target.checked)}
                  className="mt-0.5 rounded border-border"
                />
                <div>
                  <div className="font-semibold text-foreground">
                    Update all existing users assigned to target role
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Automatically syncs all accounts matching target role with this new tab configuration.
                  </div>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="samko-btn-ghost text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkProcessing}
                onClick={handleConfirmBulkTransfer}
                className="samko-btn-primary flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                {bulkProcessing ? <Loader2 size={13} className="animate-spin" /> : <ArrowRightLeft size={13} />}
                Execute Transfer &amp; Sync
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
