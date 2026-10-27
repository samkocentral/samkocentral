'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  Download,
  Upload,
  AlertTriangle,
  Layers,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Tag,
  Palette,
  FileText,
  Sliders,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  getCMSForms,
  saveCMSForms,
  resetCMSForms,
  resetCMSForm,
  updateCMSField,
  addCMSField,
  deleteCMSField,
  addOptionToField,
  updateOptionInField,
  deleteOptionFromField,
  reorderOptionsInField,
  exportCMSConfigJSON,
  importCMSConfigJSON,
  type CMSForm,
  type CMSField,
  type CMSOption,
  type CMSFieldType,
} from '@/lib/cmsConfig';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { toast } from 'sonner';

const COLOR_PRESETS = [
  { label: 'None', value: '' },
  { label: 'Green', value: '#3dd68c' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Red / Rose', value: '#f43f5e' },
  { label: 'Sky Blue', value: '#38bdf8' },
  { label: 'Blue', value: '#60a5fa' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Gold', value: '#e8c97a' },
  { label: 'Slate', value: '#94a3b8' },
];

export default function CMSFieldManager() {
  const [forms, setForms] = useState<CMSForm[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('contracts');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  // Editing field label state
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [tempFieldLabel, setTempFieldLabel] = useState('');

  // Editing option state
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [tempOptionLabel, setTempOptionLabel] = useState('');

  // New option inline input state per field: { [fieldId]: { label: '', color: '' } }
  const [newOptionInputs, setNewOptionInputs] = useState<
    Record<string, { label: string; color: string }>
  >({});

  // Collapsed fields state
  const [collapsedFields, setCollapsedFields] = useState<Record<string, boolean>>({});

  // New Field Form Modal State
  const [newFieldForm, setNewFieldForm] = useState<{
    label: string;
    type: CMSFieldType;
    placeholder: string;
    required: boolean;
    initialOptions: string;
  }>({
    label: '',
    type: 'select',
    placeholder: '',
    required: false,
    initialOptions: '',
  });

  const loadForms = () => {
    const data = getCMSForms();
    setForms(data);
  };

  useEffect(() => {
    loadForms();

    const handleUpdate = () => {
      loadForms();
    };

    window.addEventListener('samko:cms-fields-updated', handleUpdate);
    return () => {
      window.removeEventListener('samko:cms-fields-updated', handleUpdate);
    };
  }, []);

  const currentForm = forms.find((f) => f.id === selectedFormId) || forms[0];

  // Filter fields based on search
  const filteredFields = (currentForm?.fields || []).filter((field) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const labelMatch = field.label.toLowerCase().includes(q);
    const idMatch = field.id.toLowerCase().includes(q);
    const optionsMatch = field.options?.some(
      (opt) => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q)
    );
    return labelMatch || idMatch || optionsMatch;
  });

  // Handle save field label
  const handleSaveFieldLabel = (fieldId: string) => {
    if (!tempFieldLabel.trim()) {
      toast.error('Field label cannot be empty');
      return;
    }
    updateCMSField(selectedFormId, fieldId, { label: tempFieldLabel.trim() });
    setEditingFieldId(null);
    toast.success('Field label updated');
    loadForms();
  };

  // Handle save option label
  const handleSaveOptionLabel = (fieldId: string, optionId: string) => {
    if (!tempOptionLabel.trim()) {
      toast.error('Option label cannot be empty');
      return;
    }
    updateOptionInField(selectedFormId, fieldId, optionId, {
      label: tempOptionLabel.trim(),
      value: tempOptionLabel.trim(),
    });
    setEditingOptionId(null);
    toast.success('Option updated');
    loadForms();
  };

  // Handle add option
  const handleAddOption = (fieldId: string) => {
    const input = newOptionInputs[fieldId];
    if (!input || !input.label.trim()) {
      toast.error('Please enter option text');
      return;
    }

    const created = addOptionToField(selectedFormId, fieldId, {
      label: input.label.trim(),
      value: input.label.trim(),
      color: input.color || undefined,
    });

    if (!created) {
      toast.error('Option already exists or could not be added');
      return;
    }

    setNewOptionInputs((prev) => ({
      ...prev,
      [fieldId]: { label: '', color: '' },
    }));

    toast.success(`Option "${input.label}" added`);
    loadForms();
  };

  // Handle delete option
  const handleDeleteOption = (fieldId: string, optionId: string, optionLabel: string) => {
    deleteOptionFromField(selectedFormId, fieldId, optionId);
    toast.success(`Option "${optionLabel}" removed`);
    loadForms();
  };

  // Handle change option color
  const handleChangeOptionColor = (
    fieldId: string,
    optionId: string,
    newColor: string
  ) => {
    updateOptionInField(selectedFormId, fieldId, optionId, { color: newColor || undefined });
    loadForms();
  };

  // Handle reorder options
  const handleMoveOption = (
    fieldId: string,
    fromIndex: number,
    direction: 'up' | 'down'
  ) => {
    const field = currentForm?.fields.find((f) => f.id === fieldId);
    if (!field?.options) return;

    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= field.options.length) return;

    reorderOptionsInField(selectedFormId, fieldId, fromIndex, toIndex);
    loadForms();
  };

  // Handle add new field
  const handleCreateField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldForm.label.trim()) {
      toast.error('Please enter a field label');
      return;
    }

    const fieldId = `custom_${newFieldForm.label
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36).slice(-4)}`;

    let initialOptionsArray: CMSOption[] | undefined = undefined;

    if (newFieldForm.type === 'select') {
      const splitOpts = newFieldForm.initialOptions
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      initialOptionsArray = (
        splitOpts.length > 0 ? splitOpts : ['Default Option 1', 'Default Option 2']
      ).map((opt, i) => ({
        id: `opt_${Date.now()}_${i}`,
        value: opt,
        label: opt,
      }));
    }

    const newField = addCMSField(selectedFormId, {
      id: fieldId,
      label: newFieldForm.label.trim(),
      type: newFieldForm.type,
      placeholder: newFieldForm.placeholder || undefined,
      required: newFieldForm.required,
      options: initialOptionsArray,
    });

    if (newField) {
      toast.success(`Field "${newField.label}" added to ${currentForm.title}`);
      setShowAddModal(false);
      setNewFieldForm({
        label: '',
        type: 'select',
        placeholder: '',
        required: false,
        initialOptions: '',
      });
      loadForms();
    } else {
      toast.error('Failed to create field');
    }
  };

  // Handle delete field
  const handleDeleteField = (fieldId: string, fieldLabel: string) => {
    if (confirm(`Are you sure you want to delete the field "${fieldLabel}"?`)) {
      deleteCMSField(selectedFormId, fieldId);
      toast.success(`Field "${fieldLabel}" deleted`);
      loadForms();
    }
  };

  // Handle reset form
  const handleResetForm = () => {
    if (
      confirm(
        `Reset all dropdowns and fields in "${currentForm.title}" back to system factory defaults?`
      )
    ) {
      resetCMSForm(selectedFormId);
      toast.success(`Form "${currentForm.title}" reset to factory defaults`);
      loadForms();
    }
  };

  // Handle export
  const handleExport = () => {
    const json = exportCMSConfigJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `samko_cms_form_config_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CMS configuration exported');
  };

  // Handle import
  const handleImport = () => {
    if (!importJsonText.trim()) {
      toast.error('Please paste JSON configuration');
      return;
    }
    const success = importCMSConfigJSON(importJsonText);
    if (success) {
      toast.success('CMS configuration imported successfully');
      setShowImportModal(false);
      setImportJsonText('');
      loadForms();
    } else {
      toast.error('Invalid CMS JSON format. Import failed.');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl pb-16">
      {/* CMS Header Banner */}
      <div
        className="rounded-2xl border p-6 relative overflow-hidden shadow-sm"
        style={{
          background: 'linear-gradient(135deg, rgba(232, 201, 122, 0.08) 0%, rgba(18, 19, 22, 0.95) 100%)',
          borderColor: 'rgba(232, 201, 122, 0.25)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
              style={{
                background: 'linear-gradient(135deg, #e8c97a 0%, #b89340 100%)',
                color: '#121316',
              }}
            >
              <SlidersHorizontal size={24} strokeWidth={2.3} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold font-head tracking-tight text-foreground">
                  Dynamic Form & Dropdown CMS
                </h2>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase"
                  style={{
                    background: 'rgba(232, 201, 122, 0.15)',
                    color: 'var(--primary)',
                    border: '1px solid rgba(232, 201, 122, 0.3)',
                  }}
                >
                  Super Admin Engine
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                Full CMS control over all forms across Samko Central. Edit any dropdown label, modify
                existing option texts, reorder choices, and add brand-new custom fields to any form.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer"
              style={{
                background: showPreview ? 'rgba(232, 201, 122, 0.15)' : 'var(--surface2)',
                borderColor: showPreview ? 'var(--primary)' : 'var(--border)',
                color: showPreview ? 'var(--primary)' : 'var(--text2)',
              }}
            >
              <Sparkles size={13} />
              {showPreview ? 'Hide Live Preview' : 'Interactive Preview'}
            </button>

            <button
              onClick={handleExport}
              title="Export Form Schemas to JSON"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border transition-colors hover:bg-white/[0.04] cursor-pointer"
              style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
            >
              <Download size={13} />
              Export
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              title="Import Form Schemas from JSON"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border transition-colors hover:bg-white/[0.04] cursor-pointer"
              style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
            >
              <Upload size={13} />
              Import
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              style={{ background: 'var(--primary)', color: '#121316' }}
            >
              <Plus size={14} strokeWidth={2.5} />
              Add New Field
            </button>
          </div>
        </div>
      </div>

      {/* Form Picker Tabs */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers size={13} /> Select Platform Page / Form to Configure
          </label>
          <span className="text-xs text-muted-foreground">
            {forms.length} System Forms Configured
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {forms.map((form) => {
            const isSelected = form.id === selectedFormId;
            const fieldCount = form.fields.length;
            const customCount = form.fields.filter((f) => f.isCustom).length;

            return (
              <button
                key={form.id}
                onClick={() => {
                  setSelectedFormId(form.id);
                  setSearchQuery('');
                }}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'ring-1 ring-primary shadow-md'
                    : 'hover:border-primary/40 hover:bg-surface2'
                }`}
                style={{
                  background: isSelected ? 'rgba(232, 201, 122, 0.1)' : 'var(--surface)',
                  borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                }}
              >
                <span
                  className="text-xs font-bold truncate w-full"
                  style={{ color: isSelected ? 'var(--primary)' : 'var(--foreground)' }}
                >
                  {form.title.replace(' Form & Dropdowns', '').replace(' Form', '')}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5 truncate w-full">
                  {form.category}
                </span>

                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-muted-foreground font-medium">
                    {fieldCount} {fieldCount === 1 ? 'field' : 'fields'}
                  </span>
                  {customCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                      +{customCount} custom
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Form Details Banner & Search */}
      <div
        className="rounded-xl border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <h3 className="font-head font-bold text-base text-foreground">
              {currentForm?.title}
            </h3>
            <Link
              href={currentForm?.pagePath || '#'}
              target="_blank"
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors underline"
            >
              <span>View live page</span>
              <ExternalLink size={11} />
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentForm?.description}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 min-w-[220px]"
            style={{ background: 'var(--surface2)' }}
          >
            <Search size={13} className="text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search fields or options..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs outline-none flex-1 text-foreground placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            onClick={handleResetForm}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground border border-border hover:bg-white/[0.04] transition-colors cursor-pointer"
            title="Reset this form back to factory defaults"
          >
            <RefreshCw size={12} />
            Reset Form
          </button>
        </div>
      </div>

      {/* Interactive Live Form Preview Drawer */}
      {showPreview && (
        <div
          className="rounded-2xl border p-5 relative shadow-inner animate-in fade-in duration-200"
          style={{
            background: 'rgba(232, 201, 122, 0.03)',
            borderColor: 'rgba(232, 201, 122, 0.3)',
          }}
        >
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <span className="font-head font-bold text-sm text-foreground">
                Live Interactive Form Preview
              </span>
              <span className="text-[11px] text-muted-foreground">
                (Test selecting dropdown options exactly as users will see them)
              </span>
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X size={15} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentForm?.fields.map((field) => (
              <div
                key={field.id}
                className="flex flex-col gap-1.5 p-3 rounded-xl border border-white/10"
                style={{ background: 'var(--surface2)' }}
              >
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>
                    {field.label} {field.required && <span className="text-rose-400">*</span>}
                  </span>
                  {field.isCustom && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                      Custom Field
                    </span>
                  )}
                </label>

                {field.type === 'select' ? (
                  <CustomDropdown
                    label={`Select ${field.label}`}
                    placeholder={`Choose ${field.label}...`}
                    value={previewValues[field.id] || ''}
                    options={
                      field.options?.map((opt) => ({
                        value: opt.value,
                        label: opt.label,
                        color: opt.color,
                      })) || []
                    }
                    onChange={(val) =>
                      setPreviewValues((prev) => ({ ...prev, [field.id]: val }))
                    }
                  />
                ) : field.type === 'textarea' ? (
                  <textarea
                    rows={2}
                    placeholder={field.placeholder || `Enter ${field.label}...`}
                    value={previewValues[field.id] || ''}
                    onChange={(e) =>
                      setPreviewValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                    }
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none resize-none"
                    style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
                  />
                ) : (
                  <input
                    type={field.type}
                    placeholder={field.placeholder || `Enter ${field.label}...`}
                    value={previewValues[field.id] || ''}
                    onChange={(e) =>
                      setPreviewValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                    }
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                    style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
                  />
                )}
                {field.helpText && (
                  <span className="text-[10px] text-muted-foreground">{field.helpText}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Field Cards List */}
      <div className="flex flex-col gap-4">
        {filteredFields.length === 0 ? (
          <div
            className="rounded-xl border border-dashed border-border p-8 text-center"
            style={{ background: 'var(--surface)' }}
          >
            <p className="text-sm text-muted-foreground">
              No fields match your search "{searchQuery}" in this form.
            </p>
          </div>
        ) : (
          filteredFields.map((field, fieldIdx) => {
            const isCollapsed = collapsedFields[field.id] || false;
            const isEditingLabel = editingFieldId === field.id;
            const currentOptionInput = newOptionInputs[field.id] || { label: '', color: '' };
            const options = field.options || [];

            return (
              <div
                key={field.id}
                className="rounded-xl border border-border overflow-hidden transition-all shadow-sm"
                style={{ background: 'var(--surface)' }}
              >
                {/* Field Card Header */}
                <div
                  className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-3 flex-wrap"
                  style={{ background: 'var(--surface2)' }}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
                    <span className="w-6 h-6 rounded-md bg-white/10 text-[11px] font-bold flex items-center justify-center text-muted-foreground flex-shrink-0">
                      #{fieldIdx + 1}
                    </span>

                    {/* Field Label Editable */}
                    {isEditingLabel ? (
                      <div className="flex items-center gap-1.5 flex-1 max-w-md">
                        <input
                          type="text"
                          value={tempFieldLabel}
                          onChange={(e) => setTempFieldLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveFieldLabel(field.id);
                            if (e.key === 'Escape') setEditingFieldId(null);
                          }}
                          autoFocus
                          className="px-2.5 py-1 rounded-md text-sm font-bold border border-primary outline-none flex-1 text-foreground"
                          style={{ background: 'var(--surface)' }}
                        />
                        <button
                          onClick={() => handleSaveFieldLabel(field.id)}
                          className="p-1 rounded text-emerald-400 hover:bg-emerald-400/10 cursor-pointer"
                          title="Save Label"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingFieldId(null)}
                          className="p-1 rounded text-muted-foreground hover:bg-white/10 cursor-pointer"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-head font-bold text-sm text-foreground">
                          {field.label}
                        </span>
                        <button
                          onClick={() => {
                            setEditingFieldId(field.id);
                            setTempFieldLabel(field.label);
                          }}
                          className="text-muted-foreground hover:text-primary transition-colors p-1"
                          title="Edit Field Label"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}

                    {/* Type Badge */}
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1"
                      style={{
                        background:
                          field.type === 'select'
                            ? 'rgba(232, 201, 122, 0.15)'
                            : 'rgba(255, 255, 255, 0.08)',
                        color:
                          field.type === 'select' ? 'var(--primary)' : 'var(--text2)',
                      }}
                    >
                      {field.type === 'select' ? (
                        <>
                          <Sliders size={10} />
                          Dropdown ({options.length} options)
                        </>
                      ) : (
                        <>
                          <Tag size={10} />
                          {field.type}
                        </>
                      )}
                    </span>

                    {field.isCustom && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Custom Added
                      </span>
                    )}

                    {field.required && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        Required
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {field.isCustom && (
                      <button
                        onClick={() => handleDeleteField(field.id, field.label)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
                        title="Delete this custom field"
                      >
                        <Trash2 size={12} />
                        Delete Field
                      </button>
                    )}

                    {field.type === 'select' && (
                      <button
                        onClick={() =>
                          setCollapsedFields((prev) => ({
                            ...prev,
                            [field.id]: !isCollapsed,
                          }))
                        }
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors cursor-pointer"
                      >
                        {isCollapsed ? (
                          <>
                            <span>Expand Options</span>
                            <ChevronDown size={14} />
                          </>
                        ) : (
                          <>
                            <span>Collapse</span>
                            <ChevronUp size={14} />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Field Body (Options Manager) */}
                {field.type === 'select' && !isCollapsed && (
                  <div className="p-5 flex flex-col gap-4">
                    {/* Add New Option Inline Bar */}
                    <div
                      className="p-3.5 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      style={{ background: 'rgba(255, 255, 255, 0.02)' }}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs font-semibold text-muted-foreground flex-shrink-0">
                          Add New Option:
                        </span>
                        <input
                          type="text"
                          placeholder={`Type new option for "${field.label}"...`}
                          value={currentOptionInput.label}
                          onChange={(e) =>
                            setNewOptionInputs((prev) => ({
                              ...prev,
                              [field.id]: {
                                ...currentOptionInput,
                                label: e.target.value,
                              },
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddOption(field.id);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-border text-xs outline-none flex-1 text-foreground placeholder:text-muted-foreground"
                          style={{ background: 'var(--surface2)' }}
                        />
                      </div>

                      <div className="flex items-center gap-2.5">
                        {/* Color Selector */}
                        <div className="flex items-center gap-1">
                          <Palette size={12} className="text-muted-foreground" />
                          <select
                            value={currentOptionInput.color}
                            onChange={(e) =>
                              setNewOptionInputs((prev) => ({
                                ...prev,
                                [field.id]: {
                                  ...currentOptionInput,
                                  color: e.target.value,
                                },
                              }))
                            }
                            className="text-xs rounded-lg border border-border px-2 py-1 outline-none text-foreground"
                            style={{ background: 'var(--surface2)' }}
                          >
                            {COLOR_PRESETS.map((col) => (
                              <option key={col.label} value={col.value}>
                                {col.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          onClick={() => handleAddOption(field.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                          style={{ background: 'var(--primary)', color: '#121316' }}
                        >
                          <Plus size={13} strokeWidth={2.5} />
                          Add Option
                        </button>
                      </div>
                    </div>

                    {/* Options List Grid */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-2">
                        <span>Current Choices ({options.length})</span>
                        <span>Actions & Color Tag</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {options.map((opt, optIdx) => {
                          const isEditingOpt = editingOptionId === opt.id;

                          return (
                            <div
                              key={opt.id}
                              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border/80 group hover:border-primary/40 transition-colors"
                              style={{ background: 'var(--surface2)' }}
                            >
                              {/* Left: Color Dot + Label */}
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                {/* Color dot */}
                                <div className="relative">
                                  <select
                                    value={opt.color || ''}
                                    onChange={(e) =>
                                      handleChangeOptionColor(field.id, opt.id, e.target.value)
                                    }
                                    title="Click to change color badge"
                                    className="opacity-0 absolute inset-0 cursor-pointer w-4 h-4 z-10"
                                  >
                                    {COLOR_PRESETS.map((col) => (
                                      <option key={col.label} value={col.value}>
                                        {col.label}
                                      </option>
                                    ))}
                                  </select>
                                  <div
                                    className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0 shadow-sm cursor-pointer hover:scale-125 transition-transform"
                                    style={{
                                      background: opt.color || 'var(--surface3)',
                                    }}
                                  />
                                </div>

                                {/* Option Text Inline Editable */}
                                {isEditingOpt ? (
                                  <div className="flex items-center gap-1 flex-1">
                                    <input
                                      type="text"
                                      value={tempOptionLabel}
                                      onChange={(e) => setTempOptionLabel(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter')
                                          handleSaveOptionLabel(field.id, opt.id);
                                        if (e.key === 'Escape') setEditingOptionId(null);
                                      }}
                                      autoFocus
                                      className="px-2 py-0.5 rounded text-xs border border-primary outline-none flex-1 text-foreground"
                                      style={{ background: 'var(--surface)' }}
                                    />
                                    <button
                                      onClick={() => handleSaveOptionLabel(field.id, opt.id)}
                                      className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer"
                                    >
                                      <Check size={12} />
                                    </button>
                                    <button
                                      onClick={() => setEditingOptionId(null)}
                                      className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <span className="text-xs font-medium text-foreground truncate">
                                      {opt.label}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setEditingOptionId(opt.id);
                                        setTempOptionLabel(opt.label);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity p-0.5"
                                      title="Edit option text"
                                    >
                                      <Edit2 size={11} />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Right: Reorder & Delete */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  disabled={optIdx === 0}
                                  onClick={() => handleMoveOption(field.id, optIdx, 'up')}
                                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 p-1 rounded hover:bg-white/[0.05] cursor-pointer"
                                  title="Move Up"
                                >
                                  <ArrowUp size={11} />
                                </button>
                                <button
                                  disabled={optIdx === options.length - 1}
                                  onClick={() => handleMoveOption(field.id, optIdx, 'down')}
                                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 p-1 rounded hover:bg-white/[0.05] cursor-pointer"
                                  title="Move Down"
                                >
                                  <ArrowDown size={11} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteOption(field.id, opt.id, opt.label)
                                  }
                                  className="text-muted-foreground hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 cursor-pointer transition-colors"
                                  title="Delete Option"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* For non-select fields */}
                {field.type !== 'select' && (
                  <div className="p-4 text-xs text-muted-foreground flex items-center justify-between">
                    <span>
                      Standard form input ({field.type}). To convert this into a dropdown with
                      selectable choices, you can add a new custom dropdown field.
                    </span>
                    {field.placeholder && (
                      <span className="italic">Placeholder: "{field.placeholder}"</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: ADD NEW FIELD / DROPDOWN */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="rounded-2xl border max-w-lg w-full overflow-hidden shadow-2xl"
            style={{ background: '#161a22', borderColor: 'rgba(232, 201, 122, 0.3)' }}
          >
            <div
              className="px-6 py-4 border-b border-border flex items-center justify-between"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--primary)', color: '#121316' }}
                >
                  <Plus size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-sm text-foreground">
                    Add New Field to Form
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Target: {currentForm?.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateField} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Field Label <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Risk Rating, Secondary Vendor, Approval Status"
                  value={newFieldForm.label}
                  onChange={(e) =>
                    setNewFieldForm({ ...newFieldForm, label: e.target.value })
                  }
                  className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Field Type</label>
                  <select
                    value={newFieldForm.type}
                    onChange={(e) =>
                      setNewFieldForm({
                        ...newFieldForm,
                        type: e.target.value as CMSFieldType,
                      })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <option value="select">Dropdown (Select Box)</option>
                    <option value="text">Single-Line Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date Picker</option>
                    <option value="textarea">Multi-Line Textarea</option>
                    <option value="checkbox">Checkbox (Yes/No)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Placeholder</label>
                  <input
                    type="text"
                    placeholder="e.g. Select an option..."
                    value={newFieldForm.placeholder}
                    onChange={(e) =>
                      setNewFieldForm({ ...newFieldForm, placeholder: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              {/* If dropdown, allow specifying initial choices */}
              {newFieldForm.type === 'select' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Initial Dropdown Options</span>
                    <span className="text-[10px] text-muted-foreground">
                      (One choice per line)
                    </span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    value={newFieldForm.initialOptions}
                    onChange={(e) =>
                      setNewFieldForm({ ...newFieldForm, initialOptions: e.target.value })
                    }
                    className="rounded-lg border border-border px-3 py-2 text-xs outline-none font-mono"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="reqCheck"
                  checked={newFieldForm.required}
                  onChange={(e) =>
                    setNewFieldForm({ ...newFieldForm, required: e.target.checked })
                  }
                  className="rounded"
                />
                <label
                  htmlFor="reqCheck"
                  className="text-xs font-medium text-foreground cursor-pointer"
                >
                  Mark this field as mandatory / required
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-border hover:bg-white/[0.05] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold transition-transform active:scale-95 shadow-md"
                  style={{ background: 'var(--primary)', color: '#121316' }}
                >
                  Create Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT CONFIGURATION */}
      {showImportModal && (
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
                <Upload size={16} className="text-primary" />
                <h3 className="font-head font-bold text-sm text-foreground">
                  Import CMS Form Configuration
                </h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                Paste your exported JSON backup below. This will overwrite existing CMS dropdowns
                and custom fields.
              </p>
              <textarea
                rows={8}
                placeholder="Paste JSON here..."
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                className="rounded-lg border border-border p-3 text-xs outline-none font-mono"
                style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-1">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-border hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  className="px-5 py-2 rounded-lg text-xs font-bold transition-transform active:scale-95"
                  style={{ background: 'var(--primary)', color: '#121316' }}
                >
                  Import Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
