'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Tag, X, Check } from 'lucide-react';
import { ASSET_CATEGORIES, ASSETS, type AssetCategory } from '@/lib/assetData';
import { api } from '@/lib/api';

const PRESET_COLORS = [
  '#e8c97a', '#60a5fa', '#a78bfa', '#34d399', '#f43f5e',
  '#38bdf8', '#fb923c', '#f472b6', '#94a3b8', '#67e8f9',
  '#4ade80', '#c084fc', '#6b7280', '#fbbf24', '#f87171',
];

function ColorDot({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <span
      className="inline-block rounded-full flex-shrink-0"
      style={{ width: size, height: size, background: color }}
    />
  );
}

interface CategoryFormProps {
  initial?: AssetCategory;
  onSave: (cat: Omit<AssetCategory, 'id'>) => void;
  onCancel: () => void;
}

function CategoryForm({ initial, onSave, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name || '');
  const [color, setColor] = useState(initial?.color || PRESET_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
          Category Name
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bathroom Equipment"
          className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none"
          style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
          required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Colour
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full border-2 transition-all"
              style={{
                background: c,
                borderColor: color === c ? 'var(--foreground)' : 'transparent',
                transform: color === c ? 'scale(1.2)' : 'scale(1)',
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <ColorDot color={color} size={16} />
          <span className="text-xs text-muted-foreground">Selected: {color}</span>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent"
            title="Custom colour"
          />
          <span className="text-xs text-muted-foreground">or pick custom</span>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--primary)', color: '#000' }}
        >
          <Check size={14} />
          {initial ? 'Save Changes' : 'Add Category'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border"
          style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
        >
          <X size={14} /> Cancel
        </button>
      </div>
    </form>
  );
}

export default function CategoriesClient() {
  const [categories, setCategories] = useState<AssetCategory[]>(ASSET_CATEGORIES);
  const [liveAssets, setLiveAssets] = useState<any[]>(ASSETS);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, assetRes] = await Promise.all([
          api.categories.getAll(),
          api.assets.getAll(),
        ]);
        if (catRes.success && catRes.data && catRes.data.length > 0) {
          setCategories(catRes.data);
        }
        if (assetRes.success && assetRes.data && assetRes.data.length > 0) {
          setLiveAssets(assetRes.data);
        }
      } catch (e) {
        console.warn('Using fallback category data:', e);
      }
    }
    loadData();
  }, []);

  const assetCountByCategory = (catName: string) =>
    liveAssets.filter((a) => a.category === catName).length;

  const handleAdd = async (data: Omit<AssetCategory, 'id'>) => {
    const tempId = `cat-${Date.now()}`;
    const newCat: AssetCategory = { id: tempId, ...data };
    setCategories((prev) => [...prev, newCat]);
    setShowAdd(false);

    try {
      const res = await api.categories.create(data);
      if (res.success && res.data) {
        setCategories((prev) => prev.map((c) => (c.id === tempId ? res.data : c)));
      }
    } catch (e) {
      console.warn('Category created locally:', e);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'categories' } }));
    }
  };

  const handleEdit = async (id: string, data: Omit<AssetCategory, 'id'>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    );
    setEditingId(null);

    try {
      await api.categories.update(id, data);
    } catch (e) {
      console.warn('Category updated locally:', e);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'categories', id } }));
    }
  };

  const handleDelete = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirm(null);

    try {
      await api.categories.delete(id);
    } catch (e) {
      console.warn('Category deleted locally:', e);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'categories', id, action: 'delete' } }));
    }
  };

  const totalAssets = liveAssets.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div>
          <h1 className="font-head text-xl font-bold">Asset Categories</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {categories.length} categories · {totalAssets} total assets
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--primary)', color: '#000' }}
        >
          <Plus size={15} /> Add Category
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-5">
        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 340px' }}>
          {/* Category Grid */}
          <div>
            {/* Add form inline */}
            {showAdd && (
              <div
                className="rounded-xl border border-border p-5 mb-5"
                style={{ background: 'var(--surface)', borderColor: 'var(--primary)' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Plus size={15} style={{ color: 'var(--primary)' }} />
                  <span className="font-head font-bold text-sm">New Category</span>
                </div>
                <CategoryForm onSave={handleAdd} onCancel={() => setShowAdd(false)} />
              </div>
            )}

            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {categories.map((cat) => {
                const count = assetCountByCategory(cat.name);
                const pct = totalAssets > 0 ? Math.round((count / totalAssets) * 100) : 0;
                const isEditing = editingId === cat.id;
                const isDeleting = deleteConfirm === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="rounded-xl border border-border p-4 transition-all"
                    style={{
                      background: 'var(--surface)',
                      borderColor: isEditing ? cat.color : undefined,
                    }}
                  >
                    {isEditing ? (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <ColorDot color={cat.color} size={10} />
                          <span className="font-head font-bold text-sm">Edit Category</span>
                        </div>
                        <CategoryForm
                          initial={cat}
                          onSave={(data) => handleEdit(cat.id, data)}
                          onCancel={() => setEditingId(null)}
                        />
                      </>
                    ) : isDeleting ? (
                      <div className="flex flex-col gap-3">
                        <p className="text-sm font-medium">
                          Delete <span style={{ color: cat.color }}>{cat.name}</span>?
                        </p>
                        {count > 0 && (
                          <p className="text-xs text-muted-foreground">
                            ⚠️ {count} asset{count !== 1 ? 's' : ''} use this category.
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: 'rgba(244,63,94,0.15)', color: '#f43f5e' }}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border"
                            style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: `${cat.color}18` }}
                            >
                              <Tag size={16} style={{ color: cat.color }} />
                            </div>
                            <div>
                              <div className="font-semibold text-sm leading-tight">{cat.name}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {count} asset{count !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setEditingId(cat.id); setShowAdd(false); }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                              style={{ color: 'var(--text2)' }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(cat.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                              style={{ color: 'var(--text2)' }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(244,63,94,0.1)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface3)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: cat.color }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs text-muted-foreground">{pct}% of total assets</span>
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Panel */}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-4 uppercase tracking-wide text-muted-foreground">
                Category Breakdown
              </div>
              <div className="flex flex-col gap-2.5">
                {[...categories]
                  .sort((a, b) => assetCountByCategory(b.name) - assetCountByCategory(a.name))
                  .map((cat) => {
                    const count = assetCountByCategory(cat.name);
                    const pct = totalAssets > 0 ? Math.round((count / totalAssets) * 100) : 0;
                    return (
                      <div key={cat.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <ColorDot color={cat.color} size={8} />
                            <span className="text-xs font-medium truncate" style={{ maxWidth: 160 }}>{cat.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface3)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: cat.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <div className="font-head font-bold text-sm mb-3 uppercase tracking-wide text-muted-foreground">
                Quick Stats
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Categories', value: categories.length, color: '#60a5fa' },
                  { label: 'Total Assets', value: totalAssets, color: '#e8c97a' },
                  { label: 'Largest Category', value: [...categories].sort((a, b) => assetCountByCategory(b.name) - assetCountByCategory(a.name))[0]?.name.split(' ')[0] || '—', color: '#3dd68c' },
                  { label: 'Empty Categories', value: categories.filter((c) => assetCountByCategory(c.name) === 0).length, color: '#f59e0b' },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg p-3" style={{ background: 'var(--surface2)' }}>
                    <div className="font-head font-extrabold text-lg" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
