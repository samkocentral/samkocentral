'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  AuditLogEntry,
  getRecentLogs,
  AUDIT_USERS,
  ACTION_STYLES,
  STATUS_STYLES,
  exportAuditLogsToCSV,
} from '@/data/auditLogsData';
import {
  History,
  Calendar,
  User,
  Filter,
  Search,
  Download,
  RotateCcw,
  Eye,
  X,
  Building2,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Laptop,
  MapPin,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { useAppCms } from '@/lib/appCmsConfig';
import { useDeepPageCms } from '@/lib/deepPageCms';
import PageCMSEditButton from '@/components/cms/PageCMSEditButton';

type PresetType = 'today' | '1week' | '30days' | '45days' | '90days' | 'all' | 'custom';

// Helper to format date as YYYY-MM-DD
function toDateInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function RecentLogsClient() {
  const deepCms = useDeepPageCms('recentlogs');
  const { recentLogs: cmsRecentLogs } = useAppCms();
  const [logs] = useState<AuditLogEntry[]>(() => getRecentLogs());
  
  // Requirement 2: Default view defaults to showing "Today's Logs"
  const [preset, setPreset] = useState<PresetType>('today');
  
  // Custom date picker states
  const todayStr = useMemo(() => toDateInputValue(new Date()), []);
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(todayStr);

  // Requirement 3: User filter ("Who made the logs")
  const [selectedUser, setSelectedUser] = useState<string>('ALL');

  // Additional smart filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected log for inspection modal
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedLog(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Preset selection
  const handlePresetChange = (newPreset: PresetType) => {
    setPreset(newPreset);
    const now = new Date();
    const today = toDateInputValue(now);

    if (newPreset === 'today') {
      setFromDate(today);
      setToDate(today);
      toast.info("Viewing Today's Logs");
    } else if (newPreset === '1week') {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setFromDate(toDateInputValue(past7));
      setToDate(today);
      toast.info('Viewing logs from the past 1 week');
    } else if (newPreset === '30days') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setFromDate(toDateInputValue(past30));
      setToDate(today);
      toast.info('Viewing logs from the past 30 days');
    } else if (newPreset === '45days') {
      const past45 = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
      setFromDate(toDateInputValue(past45));
      setToDate(today);
      toast.info('Viewing logs from the past 45 days');
    } else if (newPreset === '90days') {
      const past90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      setFromDate(toDateInputValue(past90));
      setToDate(today);
      toast.info('Viewing logs from the past 90 days');
    } else if (newPreset === 'all') {
      setFromDate('');
      setToDate('');
      toast.info('Viewing all recorded logs');
    }
  };

  // When user modifies custom date pickers
  const handleCustomDateChange = (from: string, to: string) => {
    setPreset('custom');
    setFromDate(from);
    setToDate(to);
  };

  // Reset all filters back to default ("Today's Logs")
  const handleResetFilters = () => {
    setPreset('today');
    setFromDate(todayStr);
    setToDate(todayStr);
    setSelectedUser('ALL');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
    toast.success("Filters reset to Today's Logs");
  };

  // Filter logs based on date, user, category, status, and search query
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Date filter
      const logDateOnly = log.timestamp.split(' ')[0]; // YYYY-MM-DD
      const logTime = new Date(log.timestamp.replace(' ', 'T')).getTime();
      const nowTime = new Date().getTime();

      if (preset === 'today') {
        if (logDateOnly !== todayStr) return false;
      } else if (preset === '1week') {
        const sevenDaysAgo = nowTime - 7 * 24 * 60 * 60 * 1000;
        if (logTime < sevenDaysAgo) return false;
      } else if (preset === '30days') {
        const thirtyDaysAgo = nowTime - 30 * 24 * 60 * 60 * 1000;
        if (logTime < thirtyDaysAgo) return false;
      } else if (preset === '45days') {
        const fortyFiveDaysAgo = nowTime - 45 * 24 * 60 * 60 * 1000;
        if (logTime < fortyFiveDaysAgo) return false;
      } else if (preset === '90days') {
        const ninetyDaysAgo = nowTime - 90 * 24 * 60 * 60 * 1000;
        if (logTime < ninetyDaysAgo) return false;
      } else if (preset === 'custom') {
        if (fromDate && logDateOnly < fromDate) return false;
        if (toDate && logDateOnly > toDate) return false;
      }

      // 2. User filter ("Who made the logs")
      if (selectedUser !== 'ALL' && log.actorEmail !== selectedUser) {
        return false;
      }

      // 3. Category / Module filter
      if (selectedCategory !== 'ALL' && log.category !== selectedCategory) {
        return false;
      }

      // 4. Status filter
      if (selectedStatus !== 'ALL' && log.status !== selectedStatus) {
        return false;
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const searchMatches =
          log.id.toLowerCase().includes(query) ||
          log.actorName.toLowerCase().includes(query) ||
          log.actorEmail.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query) ||
          log.actionLabel.toLowerCase().includes(query) ||
          log.categoryLabel.toLowerCase().includes(query) ||
          log.resource.toLowerCase().includes(query) ||
          (log.property && log.property.toLowerCase().includes(query)) ||
          log.details.toLowerCase().includes(query) ||
          log.ipAddress.toLowerCase().includes(query);

        if (!searchMatches) return false;
      }

      return true;
    });
  }, [logs, preset, todayStr, fromDate, toDate, selectedUser, selectedCategory, selectedStatus, searchQuery]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('No logs to export for the current filters');
      return;
    }
    exportAuditLogsToCSV(filteredLogs);
    toast.success(`Exported ${filteredLogs.length} audit logs to CSV`);
  };

  // Quick user filter from table
  const handleQuickUserFilter = (email: string, name: string) => {
    setSelectedUser(email);
    toast.info(`Filtered view by user: ${name}`);
  };

  // KPI Calculations
  const totalCount = filteredLogs.length;
  const alertCount = filteredLogs.filter((l) => l.status === 'alert').length;
  const warningCount = filteredLogs.filter((l) => l.status === 'warning').length;
  const uniqueUsersCount = new Set(filteredLogs.map((l) => l.actorEmail)).size;
  const complianceCount = filteredLogs.filter((l) => l.category === 'COMPLIANCE').length;

  return (
    <div className="space-y-5">
      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div
          className="rounded-xl p-4 flex items-center justify-between border"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {deepCms.kpis?.[0]?.label || (preset === 'today' ? "Today's Logs" : 'Filtered Logs')}
            </div>
            <div className="text-2xl font-bold mt-1 text-foreground flex items-center gap-2">
              {deepCms.kpis?.[0]?.value || totalCount}
              {preset === 'today' && (
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {deepCms.kpis?.[0]?.subtitle || (preset === 'today' ? 'Activity from today' : `Active preset: ${preset.toUpperCase()}`)}
            </div>
          </div>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(232,201,122,0.12)', color: 'var(--primary)' }}
          >
            <History size={20} />
          </div>
        </div>

        <div
          className="rounded-xl p-4 flex items-center justify-between border"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {deepCms.kpis?.[1]?.label || 'Active Users'}
            </div>
            <div className="text-2xl font-bold mt-1 text-foreground">
              {deepCms.kpis?.[1]?.value || uniqueUsersCount}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {deepCms.kpis?.[1]?.subtitle || 'Actors with recorded operations'}
            </div>
          </div>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}
          >
            <User size={20} />
          </div>
        </div>

        <div
          className="rounded-xl p-4 flex items-center justify-between border"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {deepCms.kpis?.[2]?.label || 'Compliance Sign-Offs'}
            </div>
            <div className="text-2xl font-bold mt-1 text-emerald-400">
              {deepCms.kpis?.[2]?.value || complianceCount}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {deepCms.kpis?.[2]?.subtitle || 'Inspections & certifications'}
            </div>
          </div>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}
          >
            <Shield size={20} />
          </div>
        </div>

        <div
          className="rounded-xl p-4 flex items-center justify-between border"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {deepCms.kpis?.[3]?.label || 'Security & Alerts'}
            </div>
            <div className="text-2xl font-bold mt-1" style={{ color: alertCount > 0 ? '#f43f5e' : '#fbbf24' }}>
              {deepCms.kpis?.[3]?.value || (alertCount + warningCount)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {deepCms.kpis?.[3]?.subtitle || `${alertCount} security alerts, ${warningCount} warnings`}
            </div>
          </div>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(244,63,94,0.12)', color: '#f43f5e' }}
          >
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* Advanced Filter Bar Container */}
      <div
        className="rounded-xl border p-4 space-y-4"
        style={{
          background: 'var(--card)',
          borderColor: 'var(--border)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        }}
      >
        {/* Row 1: Date Range Presets & Custom Pickers */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
          {/* Quick Preset Buttons */}
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1.5">
              <Calendar size={14} className="text-primary" />
              <span>Presets:</span>
            </span>

            {/* Today Preset (Default) */}
            <button
              type="button"
              onClick={() => handlePresetChange('today')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
              style={{
                background: preset === 'today' ? 'rgba(232,201,122,0.18)' : 'var(--surface2)',
                color: preset === 'today' ? 'var(--primary)' : 'var(--text2)',
                border: preset === 'today' ? '1px solid rgba(232,201,122,0.45)' : '1px solid var(--border)',
                boxShadow: preset === 'today' ? '0 0 10px rgba(232,201,122,0.2)' : 'none',
              }}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${preset === 'today' ? 'bg-amber-400 animate-pulse' : 'bg-transparent'}`} />
              Today
            </button>

            {/* 1 Week Preset */}
            <button
              type="button"
              onClick={() => handlePresetChange('1week')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: preset === '1week' ? 'rgba(232,201,122,0.18)' : 'var(--surface2)',
                color: preset === '1week' ? 'var(--primary)' : 'var(--text2)',
                border: preset === '1week' ? '1px solid rgba(232,201,122,0.45)' : '1px solid var(--border)',
                boxShadow: preset === '1week' ? '0 0 10px rgba(232,201,122,0.2)' : 'none',
              }}
            >
              1 Week
            </button>

            {/* 30 Days Preset */}
            <button
              type="button"
              onClick={() => handlePresetChange('30days')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: preset === '30days' ? 'rgba(232,201,122,0.18)' : 'var(--surface2)',
                color: preset === '30days' ? 'var(--primary)' : 'var(--text2)',
                border: preset === '30days' ? '1px solid rgba(232,201,122,0.45)' : '1px solid var(--border)',
                boxShadow: preset === '30days' ? '0 0 10px rgba(232,201,122,0.2)' : 'none',
              }}
            >
              30 Days
            </button>

            {/* 45 Days Preset */}
            <button
              type="button"
              onClick={() => handlePresetChange('45days')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: preset === '45days' ? 'rgba(232,201,122,0.18)' : 'var(--surface2)',
                color: preset === '45days' ? 'var(--primary)' : 'var(--text2)',
                border: preset === '45days' ? '1px solid rgba(232,201,122,0.45)' : '1px solid var(--border)',
                boxShadow: preset === '45days' ? '0 0 10px rgba(232,201,122,0.2)' : 'none',
              }}
            >
              45 Days
            </button>

            {/* 90 Days Preset */}
            <button
              type="button"
              onClick={() => handlePresetChange('90days')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: preset === '90days' ? 'rgba(232,201,122,0.18)' : 'var(--surface2)',
                color: preset === '90days' ? 'var(--primary)' : 'var(--text2)',
                border: preset === '90days' ? '1px solid rgba(232,201,122,0.45)' : '1px solid var(--border)',
                boxShadow: preset === '90days' ? '0 0 10px rgba(232,201,122,0.2)' : 'none',
              }}
            >
              90 Days
            </button>

            {/* All Logs */}
            <button
              type="button"
              onClick={() => handlePresetChange('all')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: preset === 'all' ? 'rgba(232,201,122,0.18)' : 'var(--surface2)',
                color: preset === 'all' ? 'var(--primary)' : 'var(--text2)',
                border: preset === 'all' ? '1px solid rgba(232,201,122,0.45)' : '1px solid var(--border)',
                boxShadow: preset === 'all' ? '0 0 10px rgba(232,201,122,0.2)' : 'none',
              }}
            >
              All Logs
            </button>
          </div>

          {/* Custom Date Pickers: "From Date" and "To Date" */}
          <div className="flex items-center flex-wrap gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-surface2 px-2.5 py-1.5 rounded-lg border border-border">
              <span className="font-medium text-foreground">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => handleCustomDateChange(e.target.value, toDate)}
                className="bg-transparent text-xs text-foreground outline-none cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-surface2 px-2.5 py-1.5 rounded-lg border border-border">
              <span className="font-medium text-foreground">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => handleCustomDateChange(fromDate, e.target.value)}
                className="bg-transparent text-xs text-foreground outline-none cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            {/* Export CSV Button */}
            {cmsRecentLogs?.allowExport !== false && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground transition-all hover:bg-surface3"
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                }}
                title="Export currently filtered audit logs to CSV"
              >
                <Download size={13} className="text-primary" />
                <span>Export CSV</span>
              </button>
            )}

            <PageCMSEditButton pageId="recentlogs" pageName="Recent Logs & Audit Trail" />

            {/* Reset Filter Button */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface2 transition-all border border-transparent hover:border-border"
              title="Reset to Today's logs and clear all filters"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Row 2: "Who Made The Logs" Dropdown + Category + Status + Search */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* User Selector Dropdown: "Who Made The Logs" */}
          <div className="md:col-span-4">
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User size={12} className="text-primary" />
              <span>Who Made The Logs:</span>
              {selectedUser !== 'ALL' && (
                <span className="text-[10px] text-amber-400 font-normal lowercase">(active filter)</span>
              )}
            </label>
            <CustomDropdown
              value={selectedUser}
              width="100%"
              options={[
                { value: 'ALL', label: 'All Users & System Actors' },
                ...AUDIT_USERS.map((u) => ({
                  value: u.email,
                  label: `${u.name} (${u.roleTitle} · ${u.roleLevel})`,
                })),
              ]}
              onChange={(val) => {
                setSelectedUser(val);
                const userObj = AUDIT_USERS.find((u) => u.email === val);
                if (userObj) {
                  toast.info(`Filtered by user: ${userObj.name}`);
                } else {
                  toast.info('Viewing logs from all users');
                }
              }}
            />
          </div>

          {/* Module / Category Filter */}
          <div className="md:col-span-2.5">
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Layers size={12} />
              <span>Module:</span>
            </label>
            <CustomDropdown
              value={selectedCategory}
              width="100%"
              options={[
                { value: 'ALL', label: 'All Modules' },
                { value: 'ASSET_REGISTER', label: 'Asset Register' },
                { value: 'COMPLIANCE', label: 'Compliance & Safety' },
                { value: 'MAINTENANCE', label: 'Maintenance' },
                { value: 'USER_MANAGEMENT', label: 'User Management' },
                { value: 'AUTH', label: 'Auth & Access' },
                { value: 'SECURITY', label: 'Security' },
              ]}
              onChange={setSelectedCategory}
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 size={12} />
              <span>Status:</span>
            </label>
            <CustomDropdown
              value={selectedStatus}
              width="100%"
              align="right"
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'success', label: 'Success', color: '#3dd68c' },
                { value: 'warning', label: 'Warning', color: '#f59e0b' },
                { value: 'alert', label: 'Security Alert', color: '#f43f5e' },
              ]}
              onChange={setSelectedStatus}
            />
          </div>

          {/* Search Query */}
          <div className="md:col-span-3.5">
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Search size={12} />
              <span>Search Logs:</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search action, asset, keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded-lg pl-8 pr-3 py-2 text-foreground outline-none border transition-all placeholder:text-muted-foreground"
                style={{
                  background: 'var(--surface2)',
                  borderColor: searchQuery ? 'rgba(232,201,122,0.5)' : 'var(--border)',
                }}
              />
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Filter Badges Bar */}
        {(selectedUser !== 'ALL' || selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || searchQuery || preset !== 'today') && (
          <div className="flex items-center flex-wrap gap-2 pt-2 border-t text-xs" style={{ borderColor: 'var(--border)' }}>
            <span className="text-muted-foreground text-[11px] font-medium">Active Filters:</span>
            
            {preset !== 'today' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Range: {preset.toUpperCase()}
                <button type="button" onClick={() => handlePresetChange('today')} className="hover:text-white">
                  <X size={10} />
                </button>
              </span>
            )}

            {selectedUser !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/30">
                User: {AUDIT_USERS.find((u) => u.email === selectedUser)?.name || selectedUser}
                <button type="button" onClick={() => setSelectedUser('ALL')} className="hover:text-white">
                  <X size={10} />
                </button>
              </span>
            )}

            {selectedCategory !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-purple-500/10 text-purple-400 border border-purple-500/30">
                Module: {selectedCategory}
                <button type="button" onClick={() => setSelectedCategory('ALL')} className="hover:text-white">
                  <X size={10} />
                </button>
              </span>
            )}

            {selectedStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Status: {selectedStatus}
                <button type="button" onClick={() => setSelectedStatus('ALL')} className="hover:text-white">
                  <X size={10} />
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-surface3 text-foreground border border-border">
                Search: "{searchQuery}"
                <button type="button" onClick={() => setSearchQuery('')} className="hover:text-white">
                  <X size={10} />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] text-primary hover:underline ml-auto font-medium"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Logs Table / List Layout */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          background: 'var(--card)',
          borderColor: 'var(--border)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className="border-b"
                style={{
                  background: 'var(--surface2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text2)',
                }}
              >
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">{deepCms.getColLabel('timestamp', 'Timestamp')}</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">{deepCms.getColLabel('actor', 'User (Actor)')}</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">{deepCms.getColLabel('action', 'Action & Module')}</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">{deepCms.getColLabel('resource', 'Affected Property & Target')}</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">{deepCms.getColLabel('ipAddress', 'Log Details')}</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">{deepCms.getColLabel('status', 'Status')}</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-surface2 flex items-center justify-center text-muted-foreground mb-1">
                        <History size={24} />
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        No logs match your filter criteria
                      </div>
                      <div className="text-xs text-muted-foreground max-w-sm">
                        Try switching to a wider preset (e.g. 1 Week or 30 Days) or clearing the user filter.
                      </div>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-3 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-primary transition-all hover:bg-surface2"
                        style={{ border: '1px solid rgba(232,201,122,0.4)' }}
                      >
                        Reset to Today's Logs
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const actionStyle = ACTION_STYLES[log.action] || {
                    bg: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    border: 'rgba(255,255,255,0.15)',
                  };
                  const statusStyle = STATUS_STYLES[log.status] || STATUS_STYLES.success;

                  // Find user badge color if available
                  const userDef = AUDIT_USERS.find((u) => u.email === log.actorEmail);
                  const avatarColor = userDef?.badgeColor || '#a78bfa';

                  return (
                    <tr
                      key={log.id}
                      className="transition-colors hover:bg-surface2/60 group"
                    >
                      {/* 1. Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-top">
                        <div className="font-medium text-foreground text-xs flex items-center gap-1.5">
                          <Clock size={12} className="text-muted-foreground" />
                          <span>{log.relativeTime}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                          {log.timestamp}
                        </div>
                      </td>

                      {/* 2. User ("Who made that" - prominent & clear) */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start gap-2.5">
                          {/* Circle Avatar */}
                          <div
                            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[11px] shadow-sm"
                            style={{
                              background: `${avatarColor}22`,
                              color: avatarColor,
                              border: `1.5px solid ${avatarColor}55`,
                            }}
                          >
                            {log.actorInitials}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleQuickUserFilter(log.actorEmail, log.actorName)}
                                className="font-semibold text-foreground hover:text-primary transition-colors text-xs truncate text-left"
                                title={`Click to filter logs by ${log.actorName}`}
                              >
                                {log.actorName}
                              </button>
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase"
                                style={{
                                  background: `${avatarColor}18`,
                                  color: avatarColor,
                                  border: `1px solid ${avatarColor}40`,
                                }}
                              >
                                {log.roleLevel}
                              </span>
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate font-mono">
                              {log.actorEmail}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Action & Module */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-top">
                        <div className="space-y-1">
                          <span
                            className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                            style={{
                              background: actionStyle.bg,
                              color: actionStyle.color,
                              border: `1px solid ${actionStyle.border}`,
                            }}
                          >
                            {log.actionLabel || log.action}
                          </span>
                          <div className="text-[11px] text-muted-foreground font-medium">
                            {log.categoryLabel}
                          </div>
                        </div>
                      </td>

                      {/* 4. Affected Property & Target Resource */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          {log.property && (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-surface3 text-amber-300 border border-border">
                              <Building2 size={11} className="text-amber-400 flex-shrink-0" />
                              <span className="truncate max-w-[190px]">{log.property}</span>
                            </div>
                          )}
                          <div className="text-xs font-semibold text-foreground truncate max-w-[260px]" title={log.resource}>
                            {log.resource}
                          </div>
                        </div>
                      </td>

                      {/* 5. Log Details & Payload changes */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="text-xs text-foreground/90 line-clamp-2 max-w-[320px]">
                          {log.details}
                        </div>
                        {log.diff && log.diff.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedLog(log)}
                            className="mt-1 inline-flex items-center gap-1 text-[10px] text-primary hover:underline font-medium"
                          >
                            <span>+{log.diff.length} field modifications</span>
                            <ArrowRight size={10} />
                          </button>
                        )}
                      </td>

                      {/* 6. Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-top">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                          style={{
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            border: `1px solid ${statusStyle.color}40`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: statusStyle.dotColor }}
                          />
                          {statusStyle.label}
                        </span>
                      </td>

                      {/* 7. Action / Inspect button */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right align-top">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface3 transition-all border border-transparent hover:border-border"
                          title="Inspect complete audit event and diff"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Summary */}
        <div
          className="p-3 border-t flex flex-wrap items-center justify-between text-xs text-muted-foreground"
          style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
        >
          <div>
            Showing <span className="font-semibold text-foreground">{filteredLogs.length}</span> entries of{' '}
            <span className="font-semibold text-foreground">{logs.length}</span> total logs recorded in system
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Real-time Audit Ledger Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Audit Detail & Diff Inspection Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all"
            style={{
              background: 'var(--card)',
              borderColor: 'var(--border-strong)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(232,201,122,0.15)', color: 'var(--primary)' }}
                >
                  <History size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">Audit Log Event: {selectedLog.id}</span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                      style={{
                        background: (ACTION_STYLES[selectedLog.action] || ACTION_STYLES.UPDATE).bg,
                        color: (ACTION_STYLES[selectedLog.action] || ACTION_STYLES.UPDATE).color,
                        border: `1px solid ${(ACTION_STYLES[selectedLog.action] || ACTION_STYLES.UPDATE).border}`,
                      }}
                    >
                      {selectedLog.actionLabel}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    Timestamp: {selectedLog.timestamp} ({selectedLog.relativeTime})
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface3 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Actor Details Card: "Who Made The Log" */}
              <div
                className="p-3.5 rounded-xl border flex items-center justify-between"
                style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shadow"
                    style={{
                      background: 'rgba(232,201,122,0.15)',
                      color: 'var(--primary)',
                      border: '1.5px solid rgba(232,201,122,0.4)',
                    }}
                  >
                    {selectedLog.actorInitials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">{selectedLog.actorName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {selectedLog.roleLevel}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">{selectedLog.actorEmail}</div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-muted-foreground space-y-0.5">
                  <div className="flex items-center justify-end gap-1">
                    <Globe size={11} className="text-primary" />
                    <span>IP: {selectedLog.ipAddress}</span>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <MapPin size={11} className="text-emerald-400" />
                    <span>{selectedLog.location}</span>
                  </div>
                </div>
              </div>

              {/* Resource & Property Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border bg-surface2/50 border-border">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Affected Property
                  </div>
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Building2 size={13} className="text-amber-400" />
                    <span>{selectedLog.property || 'Portfolio-wide'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-surface2/50 border-border">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Module / Category
                  </div>
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Layers size={13} className="text-blue-400" />
                    <span>{selectedLog.categoryLabel}</span>
                  </div>
                </div>
              </div>

              {/* Target Resource */}
              <div className="p-3 rounded-xl border bg-surface2/50 border-border">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Target Resource
                </div>
                <div className="text-xs font-mono font-medium text-foreground">
                  {selectedLog.resource}
                </div>
              </div>

              {/* Action Description */}
              <div className="p-3 rounded-xl border bg-surface2/50 border-border">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Event Description & Narrative
                </div>
                <div className="text-xs text-foreground leading-relaxed">
                  {selectedLog.details}
                </div>
              </div>

              {/* Diff Changes Table (if present) */}
              {selectedLog.diff && selectedLog.diff.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} className="text-primary" />
                    <span>Payload Diffs & Modified State:</span>
                  </div>

                  <div className="rounded-xl border overflow-hidden border-border bg-surface2">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-surface3 text-muted-foreground text-[10px] uppercase font-semibold">
                          <th className="py-2 px-3 text-left">Property Field</th>
                          <th className="py-2 px-3 text-left">Previous State</th>
                          <th className="py-2 px-3 text-left">New State</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border font-mono text-[11px]">
                        {selectedLog.diff.map((d, idx) => (
                          <tr key={idx} className="hover:bg-surface3/40">
                            <td className="py-2 px-3 text-foreground font-semibold">{d.field}</td>
                            <td className="py-2 px-3 text-rose-400 line-through opacity-85">
                              {d.previous}
                            </td>
                            <td className="py-2 px-3 text-emerald-400 font-medium">
                              {d.current}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* User Agent */}
              {selectedLog.userAgent && (
                <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 pt-1 border-t border-border font-mono">
                  <Laptop size={12} className="flex-shrink-0" />
                  <span className="truncate">{selectedLog.userAgent}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className="p-3 border-t flex items-center justify-between"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
            >
              <button
                type="button"
                onClick={() => {
                  handleQuickUserFilter(selectedLog.actorEmail, selectedLog.actorName);
                  setSelectedLog(null);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-surface3 transition-all border border-border"
              >
                Filter All Logs by {selectedLog.actorName}
              </button>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-surface3 hover:bg-surface2 transition-all border border-border"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
