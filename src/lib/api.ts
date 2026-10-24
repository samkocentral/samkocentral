// ─── CLIENT API SERVICE FOR SAMKOCENTRAL ─────────────────────────────
// Interacts with /api/... endpoints backed by Firebase Firestore

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

function buildQuery(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      searchParams.append(key, String(val));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  // ── Auth ──────────────────────────────────────────────
  auth: {
    login: (credentials: { email: string; password: string }) =>
      fetchJson<{ success: boolean; message: string; user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
  },

  // ── Status & Database Tools ───────────────────────────
  status: {
    get: () => fetchJson<{
      status: string;
      firebaseClientConfigured: boolean;
      firebaseAdminConfigured: boolean;
      projectId: string | null;
      counts: Record<string, number>;
      timestamp: string;
    }>('/api/status'),
  },

  seed: {
    run: () => fetchJson<{ success: boolean; counts: Record<string, number>; message: string }>('/api/seed', {
      method: 'POST',
    }),
  },

  // ── Universal Bulk Import ─────────────────────────────
  bulkImport: (collection: string, items: any[]) =>
    fetchJson<{ success: boolean; collection: string; count: number; data: any[]; message: string }>('/api/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ collection, items }),
    }),

  // ── Categories ─────────────────────────────────────────
  categories: {
    getAll: () =>
      fetchJson<{ success: boolean; count: number; data: any[] }>('/api/categories'),
    getById: (id: string) =>
      fetchJson<{ success: boolean; data: any }>(`/api/categories/${encodeURIComponent(id)}`),
    create: (data: any) =>
      fetchJson<{ success: boolean; data: any }>('/api/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchJson<{ success: boolean; data: any }>(`/api/categories/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<{ success: boolean; message: string }>(`/api/categories/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
  },

  // ── Properties (formerly Hotels) ───────────────────────
  properties: {
    getAll: (params?: { search?: string; city?: string }) =>
      fetchJson<{ success: boolean; count: number; data: any[] }>(`/api/properties${buildQuery(params)}`),
    getById: (id: string) =>
      fetchJson<{ success: boolean; data: any }>(`/api/properties/${encodeURIComponent(id)}`),
    create: (data: any) =>
      fetchJson<{ success: boolean; data: any }>('/api/properties', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchJson<{ success: boolean; data: any }>(`/api/properties/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<{ success: boolean; message: string }>(`/api/properties/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
  },

  // ── Assets ─────────────────────────────────────────────
  assets: {
    getAll: (params?: { search?: string; property?: string; category?: string; department?: string; status?: string; type?: 'fixed' | 'non-fixed' }) =>
      fetchJson<{ success: boolean; total: number; data: any[] }>(`/api/assets${buildQuery(params)}`),
    getById: (id: string) =>
      fetchJson<{ success: boolean; data: any }>(`/api/assets/${encodeURIComponent(id)}`),
    create: (data: any) =>
      fetchJson<{ success: boolean; data: any }>('/api/assets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchJson<{ success: boolean; data: any }>(`/api/assets/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<{ success: boolean; message: string }>(`/api/assets/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    bulkCreate: (items: any[]) =>
      fetchJson<{ success: boolean; count: number; data: any[]; message: string }>('/api/assets/bulk', {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
  },

  // ── Maintenance Records ────────────────────────────────
  maintenance: {
    getAll: (params?: { search?: string; property?: string; status?: string }) =>
      fetchJson<{ success: boolean; total: number; data: any[] }>(`/api/maintenance${buildQuery(params)}`),
    getById: (id: string) =>
      fetchJson<{ success: boolean; data: any }>(`/api/maintenance/${encodeURIComponent(id)}`),
    create: (data: any) =>
      fetchJson<{ success: boolean; data: any }>('/api/maintenance', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchJson<{ success: boolean; data: any }>(`/api/maintenance/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<{ success: boolean; message: string }>(`/api/maintenance/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
  },

  // ── Compliance ─────────────────────────────────────────
  compliance: {
    getAll: (params?: { search?: string; property?: string; category?: string; status?: string }) =>
      fetchJson<{ success: boolean; total: number; data: any[] }>(`/api/compliance${buildQuery(params)}`),
    getById: (id: string) =>
      fetchJson<{ success: boolean; data: any }>(`/api/compliance/${encodeURIComponent(id)}`),
    create: (data: any) =>
      fetchJson<{ success: boolean; data: any }>('/api/compliance', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchJson<{ success: boolean; data: any }>(`/api/compliance/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<{ success: boolean; message: string }>(`/api/compliance/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
  },

  // ── Insurance ──────────────────────────────────────────
  insurance: {
    getAll: (params?: { search?: string; property?: string; status?: string }) =>
      fetchJson<{ success: boolean; total: number; data: any[] }>(`/api/insurance${buildQuery(params)}`),
    getById: (id: string) =>
      fetchJson<{ success: boolean; data: any }>(`/api/insurance/${encodeURIComponent(id)}`),
    create: (data: any) =>
      fetchJson<{ success: boolean; data: any }>('/api/insurance', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchJson<{ success: boolean; data: any }>(`/api/insurance/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<{ success: boolean; message: string }>(`/api/insurance/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
  },

  // ── Claims ──────────────────────────────────────────────
  claims: {
    getAll: (params?: { search?: string; property?: string; status?: string }) =>
      fetchJson<{ success: boolean; total: number; data: any[] }>(`/api/claims${buildQuery(params)}`),
    getById: (id: string) =>
      fetchJson<{ success: boolean; data: any }>(`/api/claims/${encodeURIComponent(id)}`),
    create: (data: any) =>
      fetchJson<{ success: boolean; data: any }>('/api/claims', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchJson<{ success: boolean; data: any }>(`/api/claims/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<{ success: boolean; message: string }>(`/api/claims/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
  },

  // ── Contracts ──────────────────────────────────────────
  contracts: {
    getAll: (params?: { search?: string; property?: string; category?: string; status?: string }) =>
      fetchJson<{ success: boolean; total: number; data: any[] }>(`/api/contracts${buildQuery(params)}`),
    getById: (id: string) =>
      fetchJson<{ success: boolean; data: any }>(`/api/contracts/${encodeURIComponent(id)}`),
    create: (data: any) =>
      fetchJson<{ success: boolean; data: any }>('/api/contracts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchJson<{ success: boolean; data: any }>(`/api/contracts/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<{ success: boolean; message: string }>(`/api/contracts/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
  },

  // ── Utilities ──────────────────────────────────────────
  utilities: {
    getAll: (params?: { search?: string; property?: string; type?: string; status?: string }) =>
      fetchJson<{ success: boolean; total: number; data: any[] }>(`/api/utilities${buildQuery(params)}`),
    getById: (id: string) =>
      fetchJson<{ success: boolean; data: any }>(`/api/utilities/${encodeURIComponent(id)}`),
    create: (data: any) =>
      fetchJson<{ success: boolean; data: any }>('/api/utilities', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchJson<{ success: boolean; data: any }>(`/api/utilities/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<{ success: boolean; message: string }>(`/api/utilities/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
  },

  // ── Tasks ──────────────────────────────────────────────
  tasks: {
    getAll: (params?: { search?: string; site?: string; priority?: string; status?: string }) =>
      fetchJson<{ success: boolean; total: number; data: any[] }>(`/api/tasks${buildQuery(params)}`),
    getById: (id: string) =>
      fetchJson<{ success: boolean; data: any }>(`/api/tasks/${encodeURIComponent(id)}`),
    create: (data: any) =>
      fetchJson<{ success: boolean; data: any }>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchJson<{ success: boolean; data: any }>(`/api/tasks/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<{ success: boolean; message: string }>(`/api/tasks/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
  },

  // ── Documents ──────────────────────────────────────────
  documents: {
    getAll: (params?: { search?: string; site?: string; category?: string; status?: string }) =>
      fetchJson<{ success: boolean; total: number; data: any[] }>(`/api/documents${buildQuery(params)}`),
    getById: (id: string) =>
      fetchJson<{ success: boolean; data: any }>(`/api/documents/${encodeURIComponent(id)}`),
    create: (data: any) =>
      fetchJson<{ success: boolean; data: any }>('/api/documents', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchJson<{ success: boolean; data: any }>(`/api/documents/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<{ success: boolean; message: string }>(`/api/documents/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
  },

  // ── Users ──────────────────────────────────────────────
  users: {
    getAll: (params?: { search?: string; role?: string; status?: string }) =>
      fetchJson<{ success: boolean; total: number; data: any[] }>(`/api/users${buildQuery(params)}`),
    getById: (id: string) =>
      fetchJson<{ success: boolean; data: any }>(`/api/users/${encodeURIComponent(id)}`),
    create: (data: any) =>
      fetchJson<{ success: boolean; data: any; message?: string; error?: string }>('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchJson<{ success: boolean; data: any }>(`/api/users/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<{ success: boolean; message: string }>(`/api/users/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
  },
};

export default api;
