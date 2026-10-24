'use client';

import React, { useState, useMemo } from 'react';
import {
  ALL_SYSTEM_TABS,
  type TabConfig,
  type UserTabPermissions,
  type TabAccessMode,
  getDefaultTabPermissionsForRole,
} from '@/lib/permissions';
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

interface TabPermissionsEditorProps {
  permissions: UserTabPermissions;
  onChange?: (newPerms: UserTabPermissions) => void;
  roleLevel?: string;
  userName?: string;
  readOnly?: boolean;
}

export default function TabPermissionsEditor({
  permissions,
  onChange,
  roleLevel = 'L2',
  userName,
  readOnly = false,
}: TabPermissionsEditorProps) {
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>('ALL');

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
        enabled: true, // auto-enable if setting access level
        accessLevel,
      },
    };
    onChange(updated);
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

      {/* Quick Action Presets & Search Bar */}
      {!readOnly && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-border" style={{ background: 'var(--surface)' }}>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
              Presets:
            </span>
            <button
              type="button"
              onClick={handleEnableAllWrite}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
            >
              <Edit3 size={11} /> Enable All (Edit & Write)
            </button>
            <button
              type="button"
              onClick={handleEnableAllRead}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-sky-500/30 text-sky-400 hover:bg-sky-500/10 transition-colors"
            >
              <Eye size={11} /> Enable All (Read Only)
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-border text-muted-foreground hover:text-foreground transition-colors"
              title={`Reset to standard ${roleLevel} role defaults`}
            >
              <RotateCcw size={11} /> Reset to Defaults ({roleLevel})
            </button>
            <button
              type="button"
              onClick={handleDisableAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-border text-slate-400 hover:text-rose-400 transition-colors"
            >
              <X size={11} /> Disable All
            </button>
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
          className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border"
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
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border"
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
      <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
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

                return (
                  <div
                    key={tab.id}
                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Left: Tab info */}
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="p-1.5 rounded-lg flex-shrink-0 mt-0.5" style={{ background: 'var(--surface2)' }}>
                        {icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-xs">{tab.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground truncate hidden md:inline">
                            {tab.path}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                          {tab.description}
                        </p>
                      </div>
                    </div>

                    {/* Right: Controls (Enable/Disable & Read/Write Mode) */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Enable / Disable Button */}
                      {!readOnly ? (
                        <button
                          type="button"
                          onClick={() => handleToggleTab(tab.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all"
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
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all disabled:cursor-default"
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
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all disabled:cursor-default"
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
    </div>
  );
}
