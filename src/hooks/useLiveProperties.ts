'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { HOTELS, type Hotel } from '@/lib/assetData';
import { api } from '@/lib/api';

const CACHE_KEY = 'samko_cached_properties';

/**
 * Synchronously retrieves live properties from localStorage cache if available,
 * falling back to the static HOTELS array.
 * This guarantees instantaneous rendering with zero glitch / flash on initial load.
 */
export function getLiveProperties(): Hotel[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
  }
  return HOTELS;
}

/**
 * Saves live properties into local cache and notifies all listeners across the app.
 */
export function saveLivePropertiesToCache(properties: Hotel[]) {
  if (typeof window === 'undefined' || !Array.isArray(properties) || properties.length === 0) return;
  try {
    const serialized = JSON.stringify(properties);
    const existing = localStorage.getItem(CACHE_KEY);
    if (existing === serialized) {
      // Content is identical — do not re-save or dispatch duplicate events
      return;
    }
    localStorage.setItem(CACHE_KEY, serialized);
    window.dispatchEvent(new CustomEvent('samko:property-changed', { detail: { properties } }));
  } catch (err) {
    console.warn('[useLiveProperties] Failed to cache properties:', err);
  }
}

/**
 * Convenience helper to get list of unique property names synchronously.
 */
export function getLivePropertyNames(): string[] {
  const props = getLiveProperties();
  const names = props.map((p) => p.name || (p as any).propertyName).filter(Boolean);
  return Array.from(new Set(names));
}

/**
 * React hook that provides live, synced properties across the entire application.
 * - Initializes immediately from cache (no blank flash or 8-to-10 jump)
 * - Fetches latest data in background from `/api/properties` (database)
 * - Subscribes to dynamic property creation, edits, and deletions
 */
export function useLiveProperties() {
  const [properties, setProperties] = useState<Hotel[]>(() => getLiveProperties());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.properties.getAll();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setProperties((prev) => {
          if (
            prev.length === res.data.length &&
            prev.every((p, i) => p.id === res.data[i]?.id && p.name === res.data[i]?.name && p.status === res.data[i]?.status)
          ) {
            return prev;
          }
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(CACHE_KEY, JSON.stringify(res.data));
            } catch {}
          }
          return res.data;
        });
      }
    } catch (err) {
      console.warn('[useLiveProperties] Background refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial background fetch once on mount
    refresh();

    // Listen to property changes triggered locally or in other tabs
    const handlePropertyChange = () => {
      const cached = getLiveProperties();
      if (cached && cached.length > 0) {
        setProperties((prev) => {
          if (
            prev.length === cached.length &&
            prev.every((p, i) => p.id === cached[i]?.id && p.name === cached[i]?.name)
          ) {
            return prev;
          }
          return cached;
        });
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CACHE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProperties(parsed);
          }
        } catch {}
      }
    };

    window.addEventListener('samko:property-changed', handlePropertyChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('samko:property-changed', handlePropertyChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refresh]);

  const propertyOptions = useMemo(() => {
    return properties.map((p) => ({
      value: p.name,
      label: p.name,
      id: p.id,
      city: p.city,
      status: p.status,
    }));
  }, [properties]);

  return {
    properties,
    propertyOptions,
    loading,
    refresh,
    count: properties.length,
  };
}

