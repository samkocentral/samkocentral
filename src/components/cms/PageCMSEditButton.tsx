'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, X, Save, Eye, EyeOff, ExternalLink, RefreshCw, Settings, Sliders } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import {
  useDeepPageCms,
  updatePageConfig,
  updateColumnTitle,
  toggleColumnVisibility,
  resetPageConfig,
  type DeepAppCMSStore,
  type DeepPageConfig,
} from '@/lib/deepPageCms';
import { toast } from 'sonner';

interface PageCMSEditButtonProps {
  pageId: keyof DeepAppCMSStore;
  pageName?: string;
  className?: string;
}

export default function PageCMSEditButton({ pageId, pageName, className = '' }: PageCMSEditButtonProps) {
  const { user, isSuperAdmin } = useAuth();
  const isAllowed = Boolean(isSuperAdmin || user?.roleLevel === 'L1');

  const [isOpen, setIsOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'headers' | 'columns' | 'labels'>('headers');

  const pageConfig = useDeepPageCms(pageId);

  // Form local state when modal opens
  const [form, setForm] = useState({
    title: pageConfig.title,
    subtitle: pageConfig.subtitle,
    searchPlaceholder: pageConfig.searchPlaceholder,
    primaryActionLabel: pageConfig.primaryActionLabel,
    secondaryActionLabel: pageConfig.secondaryActionLabel || '',
  });

  const [customLabels, setCustomLabels] = useState<Record<string, string>>(
    pageConfig.customLabels || {}
  );

  const handleOpen = () => {
    setForm({
      title: pageConfig.title,
      subtitle: pageConfig.subtitle,
      searchPlaceholder: pageConfig.searchPlaceholder,
      primaryActionLabel: pageConfig.primaryActionLabel,
      secondaryActionLabel: pageConfig.secondaryActionLabel || '',
    });
    setCustomLabels(pageConfig.customLabels || {});
    setIsOpen(true);
  };

  const handleSaveHeaders = (e: React.FormEvent) => {
    e.preventDefault();
    updatePageConfig(pageId, {
      title: form.title,
      subtitle: form.subtitle,
      searchPlaceholder: form.searchPlaceholder,
      primaryActionLabel: form.primaryActionLabel,
      secondaryActionLabel: form.secondaryActionLabel || undefined,
      customLabels,
    });
    toast.success('Page CMS Updated', {
      description: `Changes to "${form.title}" saved and live across the app`,
    });
    setIsOpen(false);
  };

  const handleUpdateColumnLabel = (colId: string, newLabel: string) => {
    updateColumnTitle(pageId, colId, newLabel);
    toast.success('Column label updated');
  };

  const handleToggleColumn = (colId: string) => {
    toggleColumnVisibility(pageId, colId);
  };

  const handleReset = () => {
    if (confirm(`Reset all content and columns for "${pageName || pageId}" to system defaults?`)) {
      resetPageConfig(pageId);
      toast.success('Reset to factory defaults');
      setIsOpen(false);
    }
  };

  // Hide "Edit in CMS" for other roles; only Super Admin (L1) has CMS editing access
  if (!isAllowed) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${className}`}
        style={{
          background: 'rgba(232, 201, 122, 0.12)',
          color: '#e8c97a',
          border: '1px solid rgba(232, 201, 122, 0.35)',
        }}
        title="Super Admin: Edit this page's titles, columns, and content"
      >
        <Sparkles size={13} className="text-amber-400" />
        <span>Edit in CMS</span>
      </button>

      {/* MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="rounded-2xl border max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            style={{ background: '#14171f', borderColor: 'rgba(232, 201, 122, 0.35)' }}
          >
            {/* Modal Header */}
            <div
              className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #e8c97a 0%, #b89340 100%)', color: '#121316' }}
                >
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-head font-bold text-sm text-foreground">
                      CMS Editor: {pageName || pageConfig.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Super Admin
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Customize titles, button labels, search text, and table columns for this page
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg border border-border"
              >
                <X size={15} />
              </button>
            </div>

            {/* Sub Tabs */}
            <div className="flex items-center justify-between gap-2 px-6 pt-3 pb-2 border-b border-border flex-shrink-0 bg-black/20 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setActiveSubTab('headers')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeSubTab === 'headers'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Headers & Action Buttons
                </button>
                {pageConfig.columns && pageConfig.columns.length > 0 && (
                  <button
                    onClick={() => setActiveSubTab('columns')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeSubTab === 'columns'
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Table Columns ({pageConfig.columns.length})
                  </button>
                )}
                {pageConfig.customLabels && Object.keys(pageConfig.customLabels).length > 0 && (
                  <button
                    onClick={() => setActiveSubTab('labels')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeSubTab === 'labels'
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Custom Labels
                  </button>
                )}
              </div>

              <Link
                href={`/settings?tab=cms-pages&page=${pageId}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-colors"
                title="Open the full CMS table editor with every single record editable"
              >
                <Sparkles size={12} />
                <span>Open Full Page CMS & Records ({pageConfig.items?.length || 0})</span>
              </Link>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeSubTab === 'headers' && (
                <form id="cms-page-form" onSubmit={handleSaveHeaders} className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-foreground">Page Title</label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="rounded-lg border border-border px-3 py-2 text-xs outline-none font-bold"
                      style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-foreground">Subtitle / Managed Description</label>
                    <input
                      type="text"
                      value={form.subtitle}
                      onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                      className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                      style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-foreground">Search Bar Placeholder</label>
                    <input
                      type="text"
                      value={form.searchPlaceholder}
                      onChange={(e) => setForm({ ...form, searchPlaceholder: e.target.value })}
                      className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                      style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-foreground">Primary Action Button</label>
                      <input
                        type="text"
                        value={form.primaryActionLabel}
                        onChange={(e) => setForm({ ...form, primaryActionLabel: e.target.value })}
                        className="rounded-lg border border-border px-3 py-2 text-xs outline-none text-amber-400 font-bold"
                        style={{ background: 'var(--surface2)' }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-foreground">Secondary Button (optional)</label>
                      <input
                        type="text"
                        value={form.secondaryActionLabel}
                        onChange={(e) => setForm({ ...form, secondaryActionLabel: e.target.value })}
                        className="rounded-lg border border-border px-3 py-2 text-xs outline-none"
                        style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                      />
                    </div>
                  </div>
                </form>
              )}

              {activeSubTab === 'columns' && pageConfig.columns && (
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground pb-2">
                    Rename column labels or toggle their visibility in the table:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {pageConfig.columns.map((col) => (
                      <div
                        key={col.id}
                        className="p-3 rounded-xl border border-border flex items-center justify-between gap-2"
                        style={{ background: 'var(--surface2)' }}
                      >
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-[10px] text-muted-foreground uppercase font-mono">
                            {col.id}
                          </span>
                          <input
                            type="text"
                            value={col.label}
                            onChange={(e) => handleUpdateColumnLabel(col.id, e.target.value)}
                            className="bg-transparent border-b border-border/60 text-xs font-bold text-foreground py-0.5 outline-none focus:border-amber-400"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleColumn(col.id)}
                          className={`p-2 rounded-lg border transition-colors ${
                            col.visible
                              ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                              : 'border-border text-muted-foreground opacity-40'
                          }`}
                          title={col.visible ? 'Column Visible' : 'Column Hidden'}
                        >
                          {col.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSubTab === 'labels' && (
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground pb-2">
                    Customize labels shown on property cards or summary statistics:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(customLabels).map(([key, val]) => (
                      <div key={key} className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </label>
                        <input
                          type="text"
                          value={val}
                          onChange={(e) =>
                            setCustomLabels({ ...customLabels, [key]: e.target.value })
                          }
                          className="rounded-lg border border-border px-3 py-1.5 text-xs outline-none"
                          style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="px-6 py-3.5 border-t border-border flex items-center justify-between flex-shrink-0"
              style={{ background: 'var(--surface2)' }}
            >
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-rose-400 transition-colors"
              >
                <RefreshCw size={12} />
                <span>Reset to Factory Default</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-white/[0.04]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSaveHeaders(e)}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
                  style={{ background: 'var(--primary)', color: '#121316' }}
                >
                  <Save size={13} />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
