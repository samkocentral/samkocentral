'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Search, X, ClipboardList, Loader2, RefreshCw } from 'lucide-react';
import { TASKS, daysUntil, formatDateGB } from '@/lib/mockData';
import type { Task, TaskPriority, TaskStatus } from '@/lib/mockData';
import { getLiveProperties } from '@/hooks/useLiveProperties';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';

import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import StatusDropdown from '@/components/ui/StatusDropdown';
import LoadingPagination from '@/components/ui/LoadingPagination';
import { useLoadingPagination } from '@/hooks/useLoadingPagination';
import TableCheckbox from '@/components/ui/TableCheckbox';
import BulkActionBar from '@/components/ui/BulkActionBar';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import { toast } from 'sonner';
import { useDeepPageCms } from '@/lib/deepPageCms';
import CustomDropdown from '@/components/ui/CustomDropdown';

const PRIORITY_FILTERS = ['All', 'urgent', 'high', 'medium', 'low'] as const;
const STATUS_FILTERS_TASK = ['All', 'open', 'in-progress', 'completed'] as const;

interface TaskFormValues {
  title: string;
  site: string;
  priority: TaskPriority;
  due: string;
  assignee: string;
  category: string;
  description: string;
}

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  urgent: 'var(--critical)',
  high: 'var(--warning)',
  medium: 'var(--info)',
  low: 'var(--text3)',
};

const STATUS_VARIANT: Record<TaskStatus, 'ok' | 'warning' | 'info' | 'critical'> = {
  open: 'warning',
  'in-progress': 'info',
  completed: 'ok',
};

export default function TaskManagerClient() {
  const { isViewer, canEdit, canDelete, canWriteTab, isPropertyAccessible } = useAuth();
  const hasWriteAccess = !isViewer && canEdit && canWriteTab('tasks');
  const hasDeleteAccess = !isViewer && canDelete && canWriteTab('tasks');
  const { columns: cmsColumns } = useDeepPageCms('tasks');

  const activeColumns = useMemo(() => {
    if (cmsColumns && cmsColumns.length > 0) {
      return [...cmsColumns].sort((a, b) => a.order - b.order).filter((c) => c.visible !== false);
    }
    return [
      { id: 'priority', label: 'Priority', visible: true, order: 1 },
      { id: 'title', label: 'Task', visible: true, order: 2 },
      { id: 'property', label: 'Site', visible: true, order: 3 },
      { id: 'category', label: 'Category', visible: true, order: 4 },
      { id: 'assignee', label: 'Assignee', visible: true, order: 5 },
      { id: 'status', label: 'Status', visible: true, order: 6 },
      { id: 'dueDate', label: 'Due Date', visible: true, order: 7 },
      { id: 'daysLeft', label: 'Days Left', visible: true, order: 8 },
    ];
  }, [cmsColumns]);

  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('samko_cache_tasks');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch { }
    }
    return TASKS;
  });
  const [propertyList, setPropertyList] = useState<string[]>(() => {
    return getLiveProperties().map((p) => p.name).filter(Boolean);
  });
  const [loading, setLoading] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<typeof PRIORITY_FILTERS[number]>('All');
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_FILTERS_TASK[number]>('All');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus>>({});
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const [tasksRes, propsRes] = await Promise.allSettled([
        api.tasks.getAll(),
        api.properties.getAll(),
      ]);

      if (tasksRes.status === 'fulfilled' && tasksRes.value.success && tasksRes.value.data && tasksRes.value.data.length > 0) {
        setTasks(tasksRes.value.data);
        try {
          sessionStorage.setItem('samko_cache_tasks', JSON.stringify(tasksRes.value.data));
        } catch { }
      }
      if (propsRes.status === 'fulfilled' && propsRes.value.success && propsRes.value.data && propsRes.value.data.length > 0) {
        setPropertyList(propsRes.value.data.map((p: any) => p.name));
      }
    } catch (err) {
      console.warn('Using local fallback task data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const handleDataChanged = () => fetchTasks();
    window.addEventListener('samko:data-changed', handleDataChanged);
    return () => window.removeEventListener('samko:data-changed', handleDataChanged);
  }, [fetchTasks]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    defaultValues: {
      title: '',
      site: 'Crowne Plaza Kingston-south',
      priority: 'medium',
      due: '',
      assignee: '',
      category: 'H&S',
      description: '',
    },
  });

  const getTaskStatus = (task: Task): TaskStatus => {
    return taskStatuses[task.id] ?? task.status;
  };

  const accessibleTasks = useMemo(() => {
    return tasks.filter((t) => isPropertyAccessible(t.site || (t as any).property || (t as any).hotel));
  }, [tasks, isPropertyAccessible]);

  const filtered = useMemo(() => {
    let result = accessibleTasks;
    if (priorityFilter !== 'All') result = result.filter((t) => t.priority === priorityFilter);
    if (statusFilter !== 'All') result = result.filter((t) => getTaskStatus(t) === statusFilter);
    if (search) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (t) =>
          (t.title || '').toLowerCase().includes(q) ||
          (t.site || (t as any).property || (t as any).hotel || '').toLowerCase().includes(q) ||
          (t.assignee || '').toLowerCase().includes(q)
      );
    }
    // Sort by priority then due date
    const pOrder: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    result.sort((a, b) => {
      const pDiff = pOrder[a.priority] - pOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return daysUntil(a.due) - daysUntil(b.due);
    });
    return result;
  }, [priorityFilter, statusFilter, search, taskStatuses, accessibleTasks]);

  const {
    currentPage,
    pageSize,
    totalRecords,
    paginatedItems: paginatedTasks,
    isPageLoading,
    changePage,
    changePageSize,
  } = useLoadingPagination(filtered, 10);

  // Multi-select Tasks State
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isBulkDeletingTasks, setIsBulkDeletingTasks] = useState(false);
  const [showBulkDeleteTasksModal, setShowBulkDeleteTasksModal] = useState(false);
  const [selectedTaskTypeFilter, setSelectedTaskTypeFilter] = useState('');

  const isAllTasksPageSelected =
    paginatedTasks.length > 0 && paginatedTasks.every((t) => selectedTaskIds.includes(t.id));
  const isSomeTasksPageSelected =
    paginatedTasks.some((t) => selectedTaskIds.includes(t.id)) && !isAllTasksPageSelected;

  const handleToggleSelectAllTasksPage = () => {
    if (isAllTasksPageSelected) {
      const pageIds = new Set(paginatedTasks.map((t) => t.id));
      setSelectedTaskIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = paginatedTasks.map((t) => t.id);
      setSelectedTaskIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleTaskSelect = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFilteredTasks = () => {
    setSelectedTaskIds(filtered.map((t) => t.id));
  };

  const handleClearTaskSelection = () => {
    setSelectedTaskIds([]);
    setSelectedTaskTypeFilter('');
  };

  const taskTypeOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((t) => {
      counts[`prio:${t.priority}`] = (counts[`prio:${t.priority}`] || 0) + 1;
      const st = getTaskStatus(t);
      counts[`status:${st}`] = (counts[`status:${st}`] || 0) + 1;
      if (t.site) counts[`site:${t.site}`] = (counts[`site:${t.site}`] || 0) + 1;
      if (t.category) counts[`cat:${t.category}`] = (counts[`cat:${t.category}`] || 0) + 1;
    });

    const opts: { label: string; value: string; count: number }[] = [];
    ['urgent', 'high', 'medium', 'low'].forEach((p) => {
      if (counts[`prio:${p}`]) opts.push({ label: `Priority: ${p}`, value: `prio:${p}`, count: counts[`prio:${p}`] });
    });
    ['open', 'in-progress', 'completed'].forEach((s) => {
      if (counts[`status:${s}`]) opts.push({ label: `Status: ${s}`, value: `status:${s}`, count: counts[`status:${s}`] });
    });
    propertyList.forEach((site) => {
      if (counts[`site:${site}`]) opts.push({ label: `Property: ${site}`, value: `site:${site}`, count: counts[`site:${site}`] });
    });
    const uniqueCategories = Array.from(new Set(tasks.map((t) => t.category).filter(Boolean)));
    uniqueCategories.forEach((cat) => {
      if (counts[`cat:${cat}`]) opts.push({ label: `Category: ${cat}`, value: `cat:${cat}`, count: counts[`cat:${cat}`] });
    });

    return opts;
  }, [filtered, propertyList, tasks, taskStatuses]);

  const handleSelectTaskByType = (typeKey: string) => {
    setSelectedTaskTypeFilter(typeKey);
    if (!typeKey) {
      setSelectedTaskIds([]);
      return;
    }
    const [kind, val] = typeKey.split(':');
    const matched = filtered.filter((t) => {
      if (kind === 'prio') return t.priority === val;
      if (kind === 'status') return getTaskStatus(t) === val;
      if (kind === 'site') return t.site === val;
      if (kind === 'cat') return t.category === val;
      return false;
    });
    setSelectedTaskIds(matched.map((t) => t.id));
    toast.info(`Selected ${matched.length} tasks matching ${typeKey.replace(':', ': ')}`);
  };

  const handleConfirmBulkDeleteTasks = async () => {
    if (selectedTaskIds.length === 0) return;
    setIsBulkDeletingTasks(true);
    try {
      const ids = [...selectedTaskIds];
      const count = ids.length;
      setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
      setSelectedTaskIds([]);
      setSelectedTaskTypeFilter('');
      setShowBulkDeleteTasksModal(false);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'tasks' } }));
      }
      await Promise.allSettled(ids.map((id) => api.tasks.delete(id)));
      toast.success(`Deleted ${count} tasks successfully!`);
    } catch (err: any) {
      toast.error('Failed to bulk delete tasks');
    } finally {
      setIsBulkDeletingTasks(false);
    }
  };

  const taskCounts = useMemo(() => ({
    urgent: accessibleTasks.filter((t) => t.priority === 'urgent').length,
    open: accessibleTasks.filter((t) => getTaskStatus(t) === 'open').length,
    inProgress: accessibleTasks.filter((t) => getTaskStatus(t) === 'in-progress').length,
    completed: accessibleTasks.filter((t) => getTaskStatus(t) === 'completed').length,
  }), [taskStatuses, accessibleTasks]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setTaskStatuses((prev) => ({ ...prev, [taskId]: newStatus }));
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    setOpenStatusDropdown(null);
    toast.success('Task status updated', {
      description: `Status changed to ${newStatus}`,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:data-changed', {
          detail: { type: 'task', id: taskId, status: newStatus },
        })
      );
    }

    try {
      await api.tasks.update(taskId, { status: newStatus });
    } catch (e) {
      console.error('Failed to sync task status:', e);
    }
  };

  const handleCreate = handleSubmit(async (data) => {
    try {
      const created = await api.tasks.create({
        ...data,
        status: 'open',
      });
      if (created.success && created.data) {
        setTasks((prev) => [created.data, ...prev]);
      }
      toast.success('Task created successfully', {
        description: `"${data.title}" assigned to ${data.assignee || 'unassigned'}`,
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'task-created' } }));
      }
      reset();
      setCreateOpen(false);
    } catch (e: any) {
      toast.error('Failed to create task', { description: e?.message });
    }
  });

  return (
    <>
      {/* KPI summary */}
      <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Urgent Tasks', val: taskCounts.urgent, color: 'var(--critical)', bg: 'var(--critical-bg)', top: 'var(--critical)' },
          { label: 'Open', val: taskCounts.open, color: 'var(--warning)', bg: 'var(--warning-bg)', top: 'var(--warning)' },
          { label: 'In Progress', val: taskCounts.inProgress, color: 'var(--info)', bg: 'var(--info-bg)', top: 'var(--info)' },
          { label: 'Completed', val: taskCounts.completed, color: 'var(--ok)', bg: 'var(--ok-bg)', top: 'var(--ok)' },
        ].map((kpi) => (
          <div
            key={`task-kpi-${kpi.label}`}
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

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div
          className="flex items-center gap-2 rounded-lg"
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border-strong)',
            padding: '8px 14px',
            minWidth: 240,
          }}
        >
          <Search size={14} style={{ color: 'var(--text3)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search tasks, sites, assignees…"
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

        {hasWriteAccess ? (
          <button
            onClick={() => setCreateOpen(true)}
            className="samko-btn-primary flex items-center gap-2 ml-auto"
            style={{ padding: '8px 16px', fontSize: 12 }}
          >
            <Plus size={13} />
            Create Task
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

      {/* Priority chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-muted-foreground" style={{ fontSize: 12, alignSelf: 'center' }}>Priority:</span>
        {PRIORITY_FILTERS.map((p) => (
          <button
            key={`priority-chip-${p}`}
            onClick={() => setPriorityFilter(p)}
            className={`filter-chip-btn ${priorityFilter === p ? 'active-chip' : ''}`}
          >
            {p === 'urgent' ? '🔴' : p === 'high' ? '🟡' : p === 'medium' ? '🔵' : p === 'low' ? '⚪' : ''}
            {' '}{p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
        <span className="text-muted-foreground" style={{ fontSize: 12, alignSelf: 'center' }}>Status:</span>
        {STATUS_FILTERS_TASK.map((s) => (
          <button
            key={`status-task-chip-${s}`}
            onClick={() => setStatusFilter(s)}
            className={`filter-chip-btn ${statusFilter === s ? 'active-chip' : ''}`}
          >
            {s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}

        <p className="text-muted-foreground ml-auto" style={{ fontSize: 12, alignSelf: 'center' }}>
          <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{filtered.length}</span> tasks
        </p>
      </div>

      {/* Task table */}
      <div className="samko-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={22} />}
            title="No tasks match your filters"
            description="Adjust the priority or status filters, or create a new task to get started."
            action={
              canEdit && !isViewer ? (
                <button
                  onClick={() => setCreateOpen(true)}
                  className="samko-btn-primary flex items-center gap-2"
                  style={{ padding: '8px 16px', fontSize: 13 }}
                >
                  <Plus size={13} />
                  Create Task
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 860, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {hasDeleteAccess && (
                    <th className="table-header-cell" style={{ width: 44, textAlign: 'center' }}>
                      <TableCheckbox
                        checked={isAllTasksPageSelected}
                        indeterminate={isSomeTasksPageSelected}
                        onChange={handleToggleSelectAllTasksPage}
                        title="Select all on this page"
                      />
                    </th>
                  )}
                  {activeColumns.map((col) => (
                    <th key={`task-th-${col.id}`} className="table-header-cell">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedTasks.map((task) => {
                  const days = daysUntil(task.due);
                  const currentStatus = getTaskStatus(task);
                  const isDropdownOpen = openStatusDropdown === task.id;

                  return (
                    <tr
                      key={task.id}
                      className={`table-row-hover ${selectedTaskIds.includes(task.id) ? 'bg-[#e8c97a]/5' : ''}`}
                    >
                      {hasDeleteAccess && (
                        <td className="table-cell" style={{ textAlign: 'center', width: 44 }} onClick={(e) => e.stopPropagation()}>
                          <TableCheckbox
                            checked={selectedTaskIds.includes(task.id)}
                            onChange={() => handleToggleTaskSelect(task.id)}
                            title={`Select ${task.title}`}
                          />
                        </td>
                      )}
                      {activeColumns.map((col) => {
                        const colKey = col.id.toLowerCase();
                        if (colKey === 'priority') {
                          return (
                            <td key={col.id} className="table-cell">
                              <div className="flex items-center gap-2">
                                <span
                                  className="rounded"
                                  style={{
                                    background: 'var(--surface3)',
                                    color: 'var(--text2)',
                                    fontSize: 10,
                                    fontWeight: 600,
                                    padding: '2px 8px',
                                    display: 'inline-block',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {task.category}
                                </span>
                              </div>
                            </td>
                            );
                          }
                          if (colKey === 'assignee') {
                            return (
                              <td key={col.id} className="table-cell">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{
                                      width: 22,
                                      height: 22,
                                      background: 'var(--surface3)',
                                      color: 'var(--text2)',
                                      fontSize: 8,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {task.assignee.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                                  </div>
                                  <span className="text-muted2 whitespace-nowrap" style={{ fontSize: 12 }}>
                                    {task.assignee}
                                  </span>
                                </div>
                              </td>
                            );
                          }
                          if (colKey === 'status') {
                            return (
                              <td key={col.id} className="table-cell">
                                <StatusDropdown
                                  value={currentStatus}
                                  disabled={isViewer}
                                  title={isViewer ? 'Read-only access (L4 Viewer)' : 'Change task status'}
                                  options={[
                                    { value: 'open', label: 'Open', color: '#f59e0b', bg: 'var(--warning-bg)' },
                                    { value: 'in-progress', label: 'In Progress', color: '#60a5fa', bg: 'var(--info-bg)' },
                                    { value: 'completed', label: 'Completed', color: '#3dd68c', bg: 'var(--ok-bg)' },
                                  ]}
                                  onChange={(val) => handleStatusChange(task.id, val as TaskStatus)}
                                />
                              </td>
                            );
                          }
                          if (colKey === 'duedate' || colKey === 'due') {
                            return (
                              <td key={col.id} className="table-cell text-muted2" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                                {formatDateGB(task.due).split(' ').slice(0, 2).join(' ')}
                              </td>
                            );
                          }
                          if (colKey === 'daysleft') {
                            return (
                              <td key={col.id} className="table-cell">
                                <span
                                  className="font-head tabular-nums"
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color:
                                      days < 0
                                        ? 'var(--critical)'
                                        : days <= 7
                                          ? 'var(--critical)'
                                          : days <= 30
                                            ? 'var(--warning)'
                                            : 'var(--text2)',
                                  }}
                                >
                                  {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                                </span>
                              </td>
                            );
                          }

                          // Dynamic custom columns
                          const val = (task as any)[col.id] ?? (task as any)[colKey];
                          return (
                            <td key={col.id} className="table-cell text-muted2" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                              {val !== undefined && val !== null && String(val).trim() !== '' ? String(val) : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <LoadingPagination
              currentPage={currentPage}
              totalRecords={totalRecords}
              pageSize={pageSize}
              pageSizeOptions={[5, 10, 15, 20, 50]}
              onPageChange={changePage}
              onPageSizeChange={changePageSize}
              isLoading={isPageLoading}
              recordName="tasks"
            />

            {/* Floating Bulk Action Bar (Only shown for authorized delete users) */}
            {hasDeleteAccess && (
              <div className="mt-4">
                <BulkActionBar
                  selectedCount={selectedTaskIds.length}
                  totalCount={filtered.length}
                  onClearSelection={handleClearTaskSelection}
                  onSelectAll={handleSelectAllFilteredTasks}
                  onDeleteSelected={() => setShowBulkDeleteTasksModal(true)}
                  typeOptions={taskTypeOptions}
                  onSelectByType={handleSelectTaskByType}
                  selectedTypeValue={selectedTaskTypeFilter}
                  typePlaceholder="Select all of type (Priority, Status, Property)..."
                  recordName="tasks"
                  isDeleting={isBulkDeletingTasks}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Task Modal */}
      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); reset(); }}
        title="Create Compliance Task"
        subtitle="Assign a new action item to a site manager or team member"
        width={560}
      >
        <form onSubmit={handleCreate} noValidate>
          <div className="flex flex-col gap-4">
            <div>
              <label className="samko-label" htmlFor="task-title">
                Task title *
              </label>
              <input
                id="task-title"
                type="text"
                className="samko-input"
                placeholder="e.g. Renew gas safety certificate"
                {...register('title', { required: 'Task title is required' })}
              />
              {errors.title && (
                <p style={{ fontSize: 11, color: 'var(--critical)', marginTop: 4 }}>{errors.title.message}</p>
              )}
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label className="samko-label" htmlFor="task-site">
                  Site *
                </label>
                <CustomDropdown
                  id="task-site"
                  value={watch('site')}
                  onChange={(val) => setValue('site', val)}
                  options={[
                    ...propertyList.map((propName) => ({ value: propName, label: propName })),
                    { value: 'All Sites', label: 'All Sites' }
                  ]}
                  variant="form"
                  width="100%"
                  searchable
                />
              </div>

              <div>
                <label className="samko-label" htmlFor="task-priority">
                  Priority *
                </label>
                <CustomDropdown
                  id="task-priority"
                  value={watch('priority')}
                  onChange={(val) => setValue('priority', val as TaskPriority)}
                  options={[
                    { value: 'urgent', label: 'Urgent', color: '#f43f5e' },
                    { value: 'high', label: 'High', color: '#f97316' },
                    { value: 'medium', label: 'Medium', color: '#3b82f6' },
                    { value: 'low', label: 'Low', color: '#94a3b8' }
                  ]}
                  variant="form"
                  width="100%"
                />
              </div>

              <div>
                <label className="samko-label" htmlFor="task-due">
                  Due date *
                </label>
                <input
                  id="task-due"
                  type="date"
                  className="samko-input"
                  {...register('due', { required: 'Due date is required' })}
                />
                {errors.due && (
                  <p style={{ fontSize: 11, color: 'var(--critical)', marginTop: 4 }}>{errors.due.message}</p>
                )}
              </div>

              <div>
                <label className="samko-label" htmlFor="task-category">
                  Category
                </label>
                <CustomDropdown
                  id="task-category"
                  value={watch('category')}
                  onChange={(val) => setValue('category', val)}
                  options={['H&S', 'Fire Safety', 'Gas Safety', 'Electrical', 'Insurance', 'Food Hygiene', 'Licenses', 'Vehicle', 'HR', 'Lease'].map((c) => ({
                    value: c,
                    label: c
                  }))}
                  variant="form"
                  width="100%"
                  searchable
                />
              </div>
            </div>

            <div>
              <label className="samko-label" htmlFor="task-assignee">
                Assignee
              </label>
              <input
                id="task-assignee"
                type="text"
                className="samko-input"
                placeholder="e.g. Tom Bradley"
                {...register('assignee')}
              />
              <p className="text-muted-foreground" style={{ fontSize: 11, marginTop: 4 }}>
                Enter the name of the person responsible for completing this task
              </p>
            </div>

            <div>
              <label className="samko-label" htmlFor="task-description">
                Description
              </label>
              <textarea
                id="task-description"
                className="samko-input"
                placeholder="Describe what needs to be done and any important context…"
                rows={3}
                style={{ resize: 'vertical' }}
                {...register('description')}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-border">
            <button
              type="button"
              onClick={() => { setCreateOpen(false); reset(); }}
              className="samko-btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="samko-btn-primary flex items-center gap-2"
              style={{ minWidth: 130 }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Plus size={13} />
                  Create Task
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Click outside handler for status dropdown */}
      {openStatusDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpenStatusDropdown(null)}
        />
      )}

      {/* Bulk Delete Tasks Modal */}
      <ConfirmDeleteModal
        isOpen={showBulkDeleteTasksModal}
        onClose={() => setShowBulkDeleteTasksModal(false)}
        onConfirm={handleConfirmBulkDeleteTasks}
        title="Confirm Bulk Deletion"
        itemName={`${selectedTaskIds.length} Selected Tasks`}
        registerName="tasks register"
        customWarning={`Are you sure you want to permanently delete these ${selectedTaskIds.length} selected tasks? This action cannot be undone.`}
        confirmButtonText={`Delete ${selectedTaskIds.length} Tasks`}
        isDeleting={isBulkDeletingTasks}
      />
    </>
  );
}