'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  TaskItem,
  getInitialTasks,
  TASK_PROPERTIES,
  TASK_ASSIGNEES,
} from '@/data/tasksData';
import AddItemModal from './AddItemModal';
import UploadDocumentModal from './UploadDocumentModal';
import {
  CheckSquare,
  Square,
  Plus,
  UploadCloud,
  Building2,
  User,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  Search,
  X,
  Trash2,
  Filter,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/authContext';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { api } from '@/lib/api';

type StatusTab = 'all' | 'open' | 'urgent' | 'completed';

export default function TasksClient() {
  const { canWriteTab } = useAuth();
  const canWrite = canWriteTab('tasks');

  const [tasks, setTasks] = useState<TaskItem[]>(() => getInitialTasks());

  const fetchTasks = React.useCallback(async () => {
    try {
      const res = await api.tasks.getAll();
      if (res.success && res.data && res.data.length > 0) {
        setTasks(res.data);
      }
    } catch (e) {
      console.warn('Tasks live fetch fallback:', e);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const handleDataChanged = () => fetchTasks();
    window.addEventListener('samko:data-changed', handleDataChanged);
    return () => window.removeEventListener('samko:data-changed', handleDataChanged);
  }, [fetchTasks]);

  // Requirement 1: Header Global Filters
  const [selectedProperty, setSelectedProperty] = useState<string>('ALL');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('ALL');
  const [insightsEnabled, setInsightsEnabled] = useState<boolean>(false);

  // Status Tabs & Search
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [groupByProperty, setGroupByProperty] = useState<boolean>(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);

  // Close delete confirmation on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTaskToDelete(null);
    };
    if (taskToDelete) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [taskToDelete]);

  // Toggle task completion
  const handleToggleComplete = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    const nextStatus = task?.status === 'completed' ? 'open' : 'completed';
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          if (nextStatus === 'completed') {
            toast.success('Task marked as completed', {
              description: `"${t.title}" is now marked complete.`,
            });
          } else {
            toast.info('Task reopened', {
              description: `"${t.title}" is marked as open.`,
            });
          }
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'tasks', id: taskId } }));
    }

    try {
      await api.tasks.update(taskId, { status: nextStatus });
    } catch (e) {
      console.error('Failed to sync task status with database:', e);
    }
  };

  // Confirm and delete task
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    const { id, title } = taskToDelete;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setTaskToDelete(null);
    toast.error('Task deleted successfully', {
      description: `"${title}" has been permanently removed.`,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'tasks', id } }));
    }

    try {
      await api.tasks.delete(id);
    } catch (e) {
      console.error('Failed to delete task from database:', e);
    }
  };

  // Add new task from AddItemModal
  const handleTaskCreated = async (newTask: TaskItem) => {
    setTasks((prev) => [newTask, ...prev]);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'tasks' } }));
    }

    try {
      await api.tasks.create(newTask);
    } catch (e) {
      console.error('Failed to persist new task to database:', e);
    }
  };

  // Filter tasks based on property, assignee, status tab, and search
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Property filter
      if (selectedProperty !== 'ALL' && t.property !== selectedProperty) {
        return false;
      }

      // Assignee filter
      if (selectedAssignee !== 'ALL' && t.assignee !== selectedAssignee) {
        return false;
      }

      // Status Tab filter
      if (activeTab === 'open' && t.status === 'completed') return false;
      if (activeTab === 'completed' && t.status !== 'completed') return false;
      if (activeTab === 'urgent' && (t.priority !== 'urgent' || t.status === 'completed')) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          t.title.toLowerCase().includes(q) ||
          t.property.toLowerCase().includes(q) ||
          t.assignee.toLowerCase().includes(q) ||
          t.type.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [tasks, selectedProperty, selectedAssignee, activeTab, searchQuery]);

  // Summary Metrics calculations (across selected properties)
  const scopedTasks = useMemo(() => {
    if (selectedProperty === 'ALL') return tasks;
    return tasks.filter((t) => t.property === selectedProperty);
  }, [tasks, selectedProperty]);

  const openCount = scopedTasks.filter((t) => t.status !== 'completed').length;
  const overdueCount = scopedTasks.filter(
    (t) => t.dueInDays < 0 && t.status !== 'completed'
  ).length;
  const urgentCount = scopedTasks.filter(
    (t) => t.priority === 'urgent' && t.status !== 'completed'
  ).length;
  const completedCount = scopedTasks.filter((t) => t.status === 'completed').length;
  const totalScoped = scopedTasks.length;
  const completionRate = totalScoped > 0 ? Math.round((completedCount / totalScoped) * 100) : 0;

  // Group tasks by Property if requested
  const tasksByProperty = useMemo(() => {
    const groups: Record<string, TaskItem[]> = {};
    filteredTasks.forEach((task) => {
      if (!groups[task.property]) {
        groups[task.property] = [];
      }
      groups[task.property].push(task);
    });
    return groups;
  }, [filteredTasks]);

  return (
    <div className="space-y-5">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. Header with Global Filters & Action Buttons */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-4.5 transition-all"
        style={{
          background: 'var(--card)',
          borderColor: 'var(--border)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Global Dropdowns & Insights Switch */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Property Selector */}
            <CustomDropdown
              icon={<Building2 size={14} className="text-primary" />}
              value={selectedProperty}
              options={[
                { value: 'ALL', label: `All Properties (${TASK_PROPERTIES.length})` },
                ...TASK_PROPERTIES.map((p) => ({ value: p, label: p })),
              ]}
              onChange={setSelectedProperty}
            />

            {/* Role / User Selector */}
            <CustomDropdown
              icon={<User size={14} className="text-blue-400" />}
              value={selectedAssignee}
              options={[
                { value: 'ALL', label: 'All Roles & Users' },
                ...TASK_ASSIGNEES.map((a) => ({ value: a.name, label: `${a.name} (${a.role})`, color: a.color })),
              ]}
              onChange={setSelectedAssignee}
            />

            {/* "Insights" Toggle Switch */}
            <div
              onClick={() => setInsightsEnabled((prev) => !prev)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer select-none transition-all hover:bg-surface2"
              style={{
                background: insightsEnabled ? 'rgba(232,201,122,0.12)' : 'var(--surface2)',
                borderColor: insightsEnabled ? 'rgba(232,201,122,0.45)' : 'var(--border)',
              }}
              title="Toggle insights & analytics panel"
            >
              <Sparkles
                size={14}
                className={insightsEnabled ? 'text-primary' : 'text-muted-foreground'}
              />
              <span
                className="text-xs font-bold"
                style={{ color: insightsEnabled ? 'var(--primary)' : 'var(--text2)' }}
              >
                Insights
              </span>
              {/* iOS-style toggle switch */}
              <div
                className="w-8 h-4.5 rounded-full p-0.5 transition-colors relative flex items-center"
                style={{
                  background: insightsEnabled ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
                }}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full bg-black transition-transform duration-200 shadow-sm"
                  style={{
                    transform: insightsEnabled ? 'translateX(14px)' : 'translateX(0px)',
                  }}
                />
              </div>
            </div>

            {(selectedProperty !== 'ALL' || selectedAssignee !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedProperty('ALL');
                  setSelectedAssignee('ALL');
                }}
                className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <X size={12} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Right Action Buttons: "Upload document" & "Add item" */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {canWrite ? (
              <>
                {/* "Upload document" Button */}
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="samko-btn-ghost flex items-center gap-1.5"
                  style={{ padding: '7px 14px', fontSize: 12 }}
                  title="Upload proof or document for a task"
                >
                  <UploadCloud size={13} style={{ color: 'var(--primary)' }} />
                  <span>Upload Document</span>
                </button>

                {/* "Add item" Button (Samko Brand Primary Gold) */}
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="samko-btn-primary flex items-center gap-1.5"
                  style={{
                    padding: '7px 16px',
                    fontSize: 12,
                    fontWeight: 700,
                    boxShadow: '0 2px 10px rgba(232,201,122,0.25)',
                  }}
                >
                  <Plus size={14} />
                  <span>Add Item</span>
                </button>
              </>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  background: 'rgba(148,163,184,0.12)',
                  color: '#94a3b8',
                  border: '1px solid rgba(148,163,184,0.25)',
                }}
                title="Your permissions for this tab are set to Read-Only (Viewing)"
              >
                <Eye size={13} className="text-primary" />
                <span>Read-Only Mode</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. Summary Metric Cards */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Open Tasks Count */}
        <div
          className="rounded-xl p-4 border flex items-center justify-between"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Open Tasks
            </div>
            <div className="text-2xl font-extrabold mt-1 text-foreground flex items-center gap-2">
              {openCount}
              <span className="text-[11px] font-normal text-muted-foreground">
                / {totalScoped} total
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Across {selectedProperty === 'ALL' ? 'all properties' : selectedProperty}
            </div>
          </div>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(232,201,122,0.12)', color: 'var(--primary)' }}
          >
            <CheckSquare size={20} />
          </div>
        </div>

        {/* Overdue Tasks Count (Highlighted in Red) */}
        <div
          className="rounded-xl p-4 border flex items-center justify-between relative overflow-hidden"
          style={{
            background: overdueCount > 0 ? 'rgba(244,63,94,0.06)' : 'var(--card)',
            borderColor: overdueCount > 0 ? 'rgba(244,63,94,0.35)' : 'var(--border)',
          }}
        >
          {overdueCount > 0 && (
            <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
          )}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              {overdueCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
              )}
              <span>Overdue Tasks</span>
            </div>
            <div className="text-2xl font-extrabold mt-1 text-rose-400">
              {overdueCount}
            </div>
            <div className="text-[11px] text-rose-300/80 mt-0.5">
              {overdueCount > 0 ? 'Immediate action required' : 'All deadlines on track'}
            </div>
          </div>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(244,63,94,0.15)', color: '#f43f5e' }}
          >
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* Urgent Tasks */}
        <div
          className="rounded-xl p-4 border flex items-center justify-between"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Urgent / High Priority
            </div>
            <div className="text-2xl font-extrabold mt-1 text-amber-400">
              {urgentCount}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Due within 24 to 72 hours
            </div>
          </div>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}
          >
            <Clock size={20} />
          </div>
        </div>

        {/* Completed Rate */}
        <div
          className="rounded-xl p-4 border flex items-center justify-between"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Completed Tasks
            </div>
            <div className="text-2xl font-extrabold mt-1 text-emerald-400 flex items-center gap-2">
              {completedCount}
              <span className="text-xs font-semibold text-emerald-500/80">({completionRate}%)</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Closed out and verified
            </div>
          </div>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}
          >
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. "Insights" Panel (Collapsible Toggle) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {insightsEnabled && (
        <div
          className="rounded-2xl border p-5 space-y-4 animate-fadeIn"
          style={{
            background: 'linear-gradient(180deg, rgba(24,28,36,0.95) 0%, rgba(17,19,24,0.95) 100%)',
            borderColor: 'rgba(232,201,122,0.3)',
          }}
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-foreground">Operational Action Insights</h3>
            </div>
            <span className="text-xs text-muted-foreground">Real-time Task Velocity</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Urgency Distribution */}
            <div className="p-3.5 rounded-xl bg-surface2/60 border border-border space-y-2.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Urgency Breakdown
              </span>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-rose-400 font-semibold">Urgent</span>
                    <span className="text-foreground font-mono">{urgentCount}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface3 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${(urgentCount / (totalScoped || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-blue-400 font-semibold">Medium</span>
                    <span className="text-foreground font-mono">
                      {scopedTasks.filter((t) => t.priority === 'medium').length}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface3 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${(scopedTasks.filter((t) => t.priority === 'medium').length / (totalScoped || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 font-semibold">Low / Routine</span>
                    <span className="text-foreground font-mono">
                      {scopedTasks.filter((t) => t.priority === 'low').length}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface3 overflow-hidden">
                    <div
                      className="h-full bg-slate-500 rounded-full"
                      style={{
                        width: `${(scopedTasks.filter((t) => t.priority === 'low').length / (totalScoped || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Workload by Property */}
            <div className="p-3.5 rounded-xl bg-surface2/60 border border-border space-y-2.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Property Workload
              </span>
              <div className="space-y-2">
                {TASK_PROPERTIES.slice(0, 3).map((prop) => {
                  const propTasks = tasks.filter((t) => t.property === prop && t.status !== 'completed');
                  return (
                    <div key={prop} className="text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="text-foreground truncate max-w-[180px]">{prop}</span>
                        <span className="text-amber-400 font-mono">{propTasks.length} open</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface3 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${(propTasks.length / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Deadlines schedule */}
            <div className="p-3.5 rounded-xl bg-surface2/60 border border-border space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Deadline Schedule
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface3 border border-rose-500/20">
                  <span className="text-rose-400 font-semibold">Past Due (Overdue)</span>
                  <span className="font-bold text-rose-400 font-mono">{overdueCount}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface3 border border-amber-500/20">
                  <span className="text-amber-400 font-semibold">Due in Next 48 Hours</span>
                  <span className="font-bold text-amber-400 font-mono">
                    {scopedTasks.filter((t) => t.dueInDays >= 0 && t.dueInDays <= 2 && t.status !== 'completed').length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface3 border border-border">
                  <span className="text-muted-foreground font-medium">Due in Next 7 Days</span>
                  <span className="font-bold text-foreground font-mono">
                    {scopedTasks.filter((t) => t.dueInDays > 2 && t.dueInDays <= 7 && t.status !== 'completed').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. Filter Toolbar & Search */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 bg-surface2 p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-primary text-black font-bold shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Tasks ({scopedTasks.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('open')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'open'
                ? 'bg-primary text-black font-bold shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Open ({openCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('urgent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'urgent'
                ? 'bg-rose-500 text-white font-bold shadow-sm'
                : 'text-muted-foreground hover:text-rose-400'
            }`}
          >
            Urgent ({urgentCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'completed'
                ? 'bg-emerald-500 text-white font-bold shadow-sm'
                : 'text-muted-foreground hover:text-emerald-400'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Search & View Mode Switch */}
        <div className="flex items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search tasks, properties, assignees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 md:w-72 text-xs rounded-xl pl-8 pr-3 py-2 bg-surface2 text-foreground border border-border focus:border-primary outline-none transition-all placeholder:text-muted-foreground"
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

          {/* Group by Property Toggle */}
          <button
            type="button"
            onClick={() => setGroupByProperty((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground bg-surface2 border border-border transition-all"
            title="Toggle between property grouping and single chronological feed"
          >
            <Layers size={13} className={groupByProperty ? 'text-primary' : ''} />
            <span>{groupByProperty ? 'Grouped' : 'List Feed'}</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. Action List / Task Feed */}
      {/* ───────────────────────────────────────────────────────────── */}
      {filteredTasks.length === 0 ? (
        <div
          className="rounded-2xl border p-12 text-center"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="w-12 h-12 rounded-full bg-surface2 flex items-center justify-center text-muted-foreground mx-auto mb-3">
            <CheckSquare size={24} />
          </div>
          <h3 className="text-sm font-bold text-foreground">No tasks found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            No action items match the selected property, assignee, or filter criteria.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedProperty('ALL');
              setSelectedAssignee('ALL');
              setActiveTab('all');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-primary border border-primary/30 hover:bg-surface2 transition-all"
          >
            Clear All Filters
          </button>
        </div>
      ) : groupByProperty && selectedProperty === 'ALL' ? (
        /* Grouped by Property Feed */
        <div className="space-y-6">
          {Object.entries(tasksByProperty).map(([propertyName, propertyTasks]) => (
            <div key={propertyName} className="space-y-2.5">
              {/* Property Group Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Building2 size={15} className="text-primary" />
                  <h4 className="text-xs font-bold text-foreground tracking-wide uppercase">
                    {propertyName}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface2 text-muted-foreground border border-border">
                    {propertyTasks.length} {propertyTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
              </div>

              {/* Task Cards in this Property */}
              <div
                className="rounded-xl border divide-y divide-border overflow-hidden"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                {propertyTasks.map((task) => (
                  <TaskCardRow
                    key={task.id}
                    task={task}
                    canWrite={canWrite}
                    onToggleComplete={handleToggleComplete}
                    onDelete={() => setTaskToDelete(task)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Single Unified Chronological Task Feed */
        <div
          className="rounded-2xl border divide-y divide-border overflow-hidden"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          {filteredTasks.map((task) => (
            <TaskCardRow
              key={task.id}
              task={task}
              canWrite={canWrite}
              onToggleComplete={handleToggleComplete}
              onDelete={() => setTaskToDelete(task)}
            />
          ))}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Modals */}
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. "Add item" Modal Component */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onTaskCreated={handleTaskCreated}
        defaultProperty={selectedProperty}
      />

      {/* 2. "Upload document" Modal */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        defaultProperty={selectedProperty}
      />

      {/* 3. Delete Confirmation Dialog in Middle */}
      {taskToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setTaskToDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all text-foreground"
            style={{
              background: 'var(--card)',
              borderColor: 'var(--border-strong)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Content */}
            <div className="p-6 text-center space-y-4">
              {/* Warning Icon Badge */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-inner"
                style={{
                  background: 'rgba(244,63,94,0.14)',
                  color: 'var(--critical)',
                  border: '1.5px solid rgba(244,63,94,0.35)',
                }}
              >
                <AlertTriangle size={28} className="animate-pulse" />
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground">
                  Delete Action Item?
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Are you sure you want to delete this task? This action cannot be undone and will be recorded in the system audit logs.
                </p>
              </div>

              {/* Task Details Card preview */}
              <div
                className="p-3.5 rounded-xl border text-left space-y-1.5"
                style={{
                  background: 'var(--surface2)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Target Task
                </div>
                <div className="text-xs font-semibold text-foreground leading-snug">
                  {taskToDelete.title}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 text-amber-400">
                    <Building2 size={11} />
                    <span>{taskToDelete.property}</span>
                  </span>
                  <span>•</span>
                  <span>Assignee: {taskToDelete.assignee}</span>
                </div>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div
              className="p-4 border-t flex items-center justify-end gap-2.5"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
            >
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="samko-btn-ghost flex-1 sm:flex-none"
                style={{ padding: '8px 18px', fontSize: 12 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-lg px-5 py-2 text-xs font-bold text-white transition-all shadow-md"
                style={{
                  background: 'var(--critical)',
                  boxShadow: '0 2px 10px rgba(244,63,94,0.3)',
                }}
              >
                <Trash2 size={14} />
                <span>Delete Task</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Task Card Row Component
// ─────────────────────────────────────────────────────────────────
interface TaskCardRowProps {
  task: TaskItem;
  onToggleComplete: (id: string) => void;
  onDelete: () => void;
  canWrite?: boolean;
}

function TaskCardRow({ task, onToggleComplete, onDelete, canWrite = true }: TaskCardRowProps) {
  const isCompleted = task.status === 'completed';
  const isOverdue = task.dueInDays < 0 && !isCompleted;

  // Format Due Date indicator
  const renderDueIndicator = () => {
    if (isCompleted) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
          <CheckCircle2 size={12} />
          <span>Completed</span>
        </span>
      );
    }

    if (task.dueInDays < 0) {
      const daysOver = Math.abs(task.dueInDays);
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <AlertTriangle size={12} className="animate-pulse" />
          <span>Overdue by {daysOver} {daysOver === 1 ? 'day' : 'days'}</span>
        </span>
      );
    }

    if (task.dueInDays === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <Clock size={12} />
          <span>Due Today</span>
        </span>
      );
    }

    if (task.dueInDays === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <Clock size={12} />
          <span>due in 1 day</span>
        </span>
      );
    }

    if (task.dueInDays <= 4) {
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium"
          style={{
            background: 'var(--surface3)',
            color: 'var(--text2)',
            border: '1px solid var(--border)',
          }}
        >
          <Clock size={12} />
          <span>due in {task.dueInDays} days</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <Calendar size={12} />
        <span>due in {task.dueInDays} days ({task.dueDate})</span>
      </span>
    );
  };

  // Urgency status badge
  const renderPriorityBadge = () => {
    if (task.priority === 'urgent') {
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: 'var(--critical-bg)',
            color: 'var(--critical)',
            border: '1px solid rgba(244,63,94,0.3)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Urgent
        </span>
      );
    }

    if (task.priority === 'high') {
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: 'var(--warning-bg)',
            color: 'var(--warning)',
            border: '1px solid rgba(245,158,11,0.3)',
          }}
        >
          High
        </span>
      );
    }

    if (task.priority === 'medium') {
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: 'rgba(232,201,122,0.12)',
            color: 'var(--primary)',
            border: '1px solid rgba(232,201,122,0.25)',
          }}
        >
          Medium
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
        style={{
          background: 'var(--surface3)',
          color: 'var(--text3)',
          border: '1px solid var(--border)',
        }}
      >
        Low
      </span>
    );
  };

  return (
    <div
      className={`p-4 transition-all hover:bg-surface2/60 flex items-start gap-3.5 group ${
        isCompleted ? 'opacity-65' : ''
      }`}
    >
      {/* Checkbox */}
      <button
        type="button"
        disabled={!canWrite}
        onClick={() => canWrite && onToggleComplete(task.id)}
        className={`mt-0.5 transition-colors flex-shrink-0 ${
          canWrite
            ? 'text-muted-foreground hover:text-emerald-400 cursor-pointer'
            : 'text-muted-foreground/40 cursor-default'
        }`}
        title={!canWrite ? 'Read-only access (status changes restricted)' : (isCompleted ? 'Mark as Open' : 'Mark as Completed')}
      >
        {isCompleted ? (
          <CheckSquare size={19} className="text-emerald-400" />
        ) : (
          <Square size={19} />
        )}
      </button>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {/* Priority Badge */}
          {renderPriorityBadge()}

          {/* Type Badge */}
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface3 text-muted-foreground border border-border">
            {task.type}
          </span>

          {/* Property Badge */}
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
            style={{
              background: 'rgba(232,201,122,0.10)',
              color: 'var(--primary)',
              border: '1px solid rgba(232,201,122,0.22)',
            }}
          >
            <Building2 size={10} style={{ color: 'var(--primary)' }} className="flex-shrink-0" />
            <span className="truncate max-w-[200px]">{task.property}</span>
          </span>
        </div>

        {/* Title */}
        <h3
          className={`text-sm font-semibold text-foreground leading-snug transition-all ${
            isCompleted ? 'line-through text-muted-foreground' : ''
          }`}
        >
          {task.title}
        </h3>

        {/* Description (if present) */}
        {task.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-2xl">
            {task.description}
          </p>
        )}

        {/* Footer info: Assignee + Due Date Indicator */}
        <div className="flex flex-wrap items-center gap-4 mt-2.5 pt-2 border-t border-border/60">
          {/* Assignee Details */}
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] shadow-sm flex-shrink-0"
              style={{
                background: `${task.assigneeColor}22`,
                color: task.assigneeColor,
                border: `1.5px solid ${task.assigneeColor}60`,
              }}
            >
              {task.assigneeInitials}
            </div>
            <span className="text-xs font-medium text-foreground">{task.assignee}</span>
            <span className="text-[11px] text-muted-foreground">({task.assigneeRole})</span>
          </div>

          <span className="text-border text-xs hidden sm:inline">•</span>

          {/* Due date indicator */}
          <div className="flex items-center gap-1.5">{renderDueIndicator()}</div>
        </div>
      </div>

      {/* Action Buttons: Delete (Only rendered if user has write access) */}
      {canWrite && (
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-surface3 transition-all cursor-pointer"
            title="Delete task"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
