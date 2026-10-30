'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Shield,
  Building2,
  Calendar,
  Clock,
  AlertCircle,
  User,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import {
  TaskItem,
  TaskPriority,
  TaskType,
  TASK_PROPERTIES,
  TASK_ASSIGNEES,
  getDateWithOffset,
} from '@/data/tasksData';
import { toast } from 'sonner';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: (task: TaskItem) => void;
  defaultProperty?: string;
}

export default function AddItemModal({
  isOpen,
  onClose,
  onTaskCreated,
  defaultProperty,
}: AddItemModalProps) {
  const [type, setType] = useState<TaskType>('Task');
  const [title, setTitle] = useState('');
  const [property, setProperty] = useState<string>(
    defaultProperty && defaultProperty !== 'ALL' ? defaultProperty : 'Crowne Plaza Kingston-South'
  );
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueInDays, setDueInDays] = useState<number>(7);
  const [assigneeName, setAssigneeName] = useState<string>('Jamie Clarke');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update property if defaultProperty changes
  useEffect(() => {
    if (defaultProperty && defaultProperty !== 'ALL') {
      setProperty(defaultProperty);
    }
  }, [defaultProperty]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const targetDateInfo = getDateWithOffset(Number(dueInDays) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    setIsSubmitting(true);

    const selectedAssignee =
      TASK_ASSIGNEES.find((a) => a.name === assigneeName) || TASK_ASSIGNEES[0];

    const newTask: TaskItem = {
      id: `TSK-${Date.now().toString().slice(-4)}`,
      title: title.trim(),
      type,
      property,
      priority,
      dueInDays: Number(dueInDays) || 7,
      dueDate: targetDateInfo.formatted,
      status: 'open',
      assignee: selectedAssignee.name,
      assigneeRole: selectedAssignee.role,
      assigneeInitials: selectedAssignee.initials,
      assigneeColor: selectedAssignee.color,
      description: description.trim(),
      createdAt: new Date().toISOString().split('T')[0],
    };

    setTimeout(() => {
      onTaskCreated(newTask);
      setIsSubmitting(false);
      toast.success('Task created successfully', {
        description: `"${newTask.title}" added to ${newTask.property}`,
      });
      // Reset form
      setTitle('');
      setDescription('');
      setDueInDays(7);
      setPriority('medium');
      setType('Task');
      onClose();
    }, 200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all text-foreground"
        style={{
          background: 'var(--card)',
          borderColor: 'var(--border-strong)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="p-5 border-b flex items-center justify-between"
          style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border"
              style={{
                background: 'rgba(232,201,122,0.15)',
                color: 'var(--primary)',
                borderColor: 'rgba(232,201,122,0.3)',
              }}
            >
              <Plus size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Create Operational Task</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Create a trackable operational task with deadline and hotel assignment
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface3 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Field 1: Type */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag size={13} className="text-primary" />
                <span>Type</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className="w-full text-xs rounded-lg px-3.5 py-2.5 bg-surface2 text-foreground border border-border focus:border-primary outline-none transition-all cursor-pointer"
              >
                <option value="Task">Task (Standard Operational Action)</option>
                <option value="Inspection">Inspection (Technical PPM / Visual)</option>
                <option value="Maintenance">Maintenance (Repair / Refurbishment)</option>
                <option value="Compliance">Compliance (Statutory Obligation)</option>
                <option value="Audit Action">Audit Action (Audit Non-Conformance)</option>
              </select>
            </div>

            {/* Field 2: Title */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-primary" />
                <span>Title</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Replace emergency lighting batteries"
                className="w-full text-xs rounded-lg px-3.5 py-2.5 bg-surface2 text-foreground border border-border focus:border-primary outline-none transition-all placeholder:text-muted-foreground"
              />
            </div>

            {/* Field 3: Property */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 size={13} className="text-primary" />
                <span>Property / Hotel</span>
              </label>
              <select
                value={property}
                onChange={(e) => setProperty(e.target.value)}
                className="w-full text-xs rounded-lg px-3.5 py-2.5 bg-surface2 text-foreground border border-border focus:border-primary outline-none transition-all cursor-pointer"
              >
                {TASK_PROPERTIES.map((prop) => (
                  <option key={prop} value={prop}>
                    {prop}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 4 & 5: Priority and Due in (days) */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <AlertCircle size={13} className="text-primary" />
                  <span>Priority</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full text-xs rounded-lg px-3.5 py-2.5 bg-surface2 text-foreground border border-border focus:border-primary outline-none transition-all cursor-pointer"
                >
                  <option value="low">Low (Routine)</option>
                  <option value="medium">Medium (Standard)</option>
                  <option value="urgent">Urgent / High (Critical)</option>
                </select>
              </div>

              {/* Due in (days) */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Clock size={13} className="text-primary" />
                  <span>Due in (days)</span>
                </label>
                <div className="flex items-center rounded-lg bg-surface2 border border-border focus-within:border-primary transition-all overflow-hidden">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={dueInDays}
                    onChange={(e) => setDueInDays(Number(e.target.value))}
                    className="flex-1 min-w-0 bg-transparent text-xs text-foreground px-3.5 py-2.5 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="px-3 py-2.5 text-xs text-muted-foreground bg-surface3/60 border-l border-border select-none font-medium">
                    days
                  </span>
                </div>
                <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                  <Calendar size={10} />
                  <span>Target: {targetDateInfo.full}</span>
                </p>
              </div>
            </div>

            {/* Field 6: Assignee */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User size={13} className="text-primary" />
                <span>Assignee (Role / User)</span>
              </label>
              <select
                value={assigneeName}
                onChange={(e) => setAssigneeName(e.target.value)}
                className="w-full text-xs rounded-lg px-3.5 py-2.5 bg-surface2 text-foreground border border-border focus:border-primary outline-none transition-all cursor-pointer"
              >
                {TASK_ASSIGNEES.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name} ({a.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Description */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Description / Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any specific context or instructions for the on-site team..."
                className="w-full text-xs rounded-lg px-3.5 py-2 bg-surface2 text-foreground border border-border focus:border-primary outline-none transition-all placeholder:text-muted-foreground resize-none"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div
            className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
          >
            {/* Required Footer Note */}
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Shield size={13} className="text-primary flex-shrink-0" />
              <span>Saved instantly and recorded in the change log against your name.</span>
            </div>

            {/* Action buttons: Cancel and Create (Samko Brand Primary Gold) */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="samko-btn-ghost"
                style={{ padding: '7px 16px', fontSize: 12 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="samko-btn-primary flex items-center gap-1.5"
                style={{
                  padding: '7px 20px',
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: '0 2px 10px rgba(232,201,122,0.25)',
                }}
              >
                <Plus size={14} />
                <span>{isSubmitting ? 'Creating...' : 'Create'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
