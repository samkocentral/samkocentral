'use client';

import { toast } from 'sonner';

export type { NotificationType, AppNotification } from './notificationsData';
export { INITIAL_NOTIFICATIONS } from './notificationsData';
import type { NotificationType, AppNotification } from './notificationsData';
import { INITIAL_NOTIFICATIONS } from './notificationsData';

const STORAGE_KEY = 'samko:live_notifications_v4';


export function playAlertChime(type: NotificationType = 'warning') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'critical') {
      // Two-tone urgent siren pulse
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } else {
      // Gentle chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.28);
    }
  } catch {
    // Audio autoplay might be blocked before first user interaction
  }
}

export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'Just now';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
}

export function getNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return INITIAL_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load notifications from storage:', e);
  }
  return INITIAL_NOTIFICATIONS;
}

export function saveNotifications(notifs: AppNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
    window.dispatchEvent(new CustomEvent('samko:notifications-updated', { detail: { notifications: notifs } }));
  } catch (e) {
    console.error('Failed to save notifications:', e);
  }
}

// Background sync with Firebase Firestore
if (typeof window !== 'undefined') {
  setTimeout(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
          window.dispatchEvent(new CustomEvent('samko:notifications-updated', { detail: { notifications: res.data } }));
        }
      })
      .catch((err) => console.warn('[notifications] Remote sync fallback:', err));
  }, 100);
}

export function addNotification(
  notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & {
    id?: string;
    timestamp?: string;
    read?: boolean;
    showToast?: boolean;
    playSound?: boolean;
  }
): AppNotification {
  const current = getNotifications();
  const newNotif: AppNotification = {
    id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    site: notif.site || 'Crowne Plaza Kingston-south',
    source: notif.source || 'system',
    timestamp: notif.timestamp || new Date().toISOString(),
    read: notif.read ?? false,
    actionUrl: notif.actionUrl,
    actionLabel: notif.actionLabel,
  };

  const updated = [newNotif, ...current];
  saveNotifications(updated);

  // Sync to Firebase Firestore
  if (typeof window !== 'undefined') {
    fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNotif),
    }).catch((err) => console.warn('[notifications] Remote persist fallback:', err));
  }

  if (notif.playSound !== false) {
    playAlertChime(newNotif.type);
  }

  if (notif.showToast !== false) {
    if (newNotif.type === 'critical') {
      toast.error(`🚨 CRITICAL ALARM: ${newNotif.title}`, {
        description: `${newNotif.site ? `[${newNotif.site}] ` : ''}${newNotif.message}`,
        duration: 6500,
      });
    } else if (newNotif.type === 'warning') {
      toast.warning(`⚠️ Warning: ${newNotif.title}`, {
        description: `${newNotif.site ? `[${newNotif.site}] ` : ''}${newNotif.message}`,
        duration: 5000,
      });
    } else {
      toast.info(newNotif.title, {
        description: newNotif.message,
        duration: 4000,
      });
    }
  }

  return newNotif;
}

export function markAsRead(id: string): void {
  const current = getNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(updated);
  if (typeof window !== 'undefined') {
    fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, read: true }),
    }).catch(() => {});
  }
}

export function markAsUnread(id: string): void {
  const current = getNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: false } : n));
  saveNotifications(updated);
  if (typeof window !== 'undefined') {
    fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, read: false }),
    }).catch(() => {});
  }
}

export function markAllAsRead(): void {
  const current = getNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveNotifications(updated);
  toast.success('All alarms and notifications marked as read');
  if (typeof window !== 'undefined') {
    fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    }).catch(() => {});
  }
}

export function deleteNotification(id: string): void {
  const current = getNotifications();
  const updated = current.filter((n) => n.id !== id);
  saveNotifications(updated);
  if (typeof window !== 'undefined') {
    fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(() => {});
  }
}

export function clearAllNotifications(): void {
  saveNotifications([]);
  toast.success('All notifications cleared');
  if (typeof window !== 'undefined') {
    fetch('/api/notifications?clearAll=true', {
      method: 'DELETE',
    }).catch(() => {});
  }
}

export const ALARM_SIMULATION_POOL: Array<Omit<AppNotification, 'id' | 'timestamp' | 'read'>> = [
  {
    type: 'critical',
    title: 'Plant Room B High Temp Exceeded (38.5°C)',
    message: 'High heat threshold alarm triggered on main HVAC plant room controller.',
    site: 'Crowne Plaza Kingston-south',
    source: 'hvac',
    actionUrl: '/asset-management/maintenance',
    actionLabel: 'Inspect Plant',
  },
  {
    type: 'critical',
    title: 'Fire Shutter System Fault Detected',
    message: 'Ground floor kitchen fire suppression shutter link failure.',
    site: 'Hampton 1 & 2',
    source: 'fire-alarm',
    actionUrl: '/compliance-register',
    actionLabel: 'View Status',
  },
  {
    type: 'critical',
    title: 'Lift 2 LOLER Statutory Certificate Overdue',
    message: 'Guest passenger elevator 6-month safety inspection deadline exceeded.',
    site: 'River Club',
    source: 'compliance',
    actionUrl: '/compliance-register',
    actionLabel: 'Book Inspector',
  },
  {
    type: 'critical',
    title: 'Main Gas Solenoid Interlock Trip',
    message: 'Commercial kitchen gas solenoid valve tripped due to ventilation interlock.',
    site: 'Stanhill Court',
    source: 'compliance',
    actionUrl: '/compliance-register',
    actionLabel: 'Check Valve',
  },
  {
    type: 'warning',
    title: 'Kitchen Cold Storage Water Leak Sensor Alert',
    message: 'Moisture detected under Walk-in Freezer Line A condenser pan.',
    site: 'Stanhill Court',
    source: 'water',
    actionUrl: '/asset-management/maintenance',
    actionLabel: 'Check Leak',
  },
  {
    type: 'warning',
    title: 'Emergency Generator Auto-Test Failed',
    message: 'Weekly automated emergency backup power test failed to start.',
    site: 'Ravents Ait Island',
    source: 'system',
    actionUrl: '/asset-management/maintenance',
    actionLabel: 'View Work Order',
  },
  {
    type: 'warning',
    title: 'Commercial Gas Meter High Flow Anomaly',
    message: 'Gas flow meter reading 34% above expected operational baseline.',
    site: 'Crowne Plaza Kingston-south',
    source: 'system',
    actionUrl: '/utilities-register',
    actionLabel: 'View Utilities',
  },
  {
    type: 'warning',
    title: 'Emergency Lighting 3-Hour Discharge Due',
    message: 'Annual full discharge battery test is due within 7 days.',
    site: 'Hampton 1 & 2',
    source: 'electrical',
    actionUrl: '/compliance-register',
    actionLabel: 'Schedule Test',
  },
  {
    type: 'info',
    title: 'Scheduled PPM Contractor Check-in',
    message: 'KONE Lift Senior Engineer signed in on-site for quarterly service.',
    site: 'Stanhill Court',
    source: 'maintenance',
    actionUrl: '/asset-management/maintenance',
    actionLabel: 'View PPM',
  },
  {
    type: 'info',
    title: 'Water Sample Lab Analysis Uploaded',
    message: 'Monthly microbiology lab results marked compliant (Zero CFU).',
    site: 'River Club',
    source: 'compliance',
    actionUrl: '/compliance-register',
    actionLabel: 'View Report',
  },
];

let lastSimIndex = -1;

export function triggerSimulatedAlarm(): AppNotification {
  let randomIndex = Math.floor(Math.random() * ALARM_SIMULATION_POOL.length);
  if (randomIndex === lastSimIndex) {
    randomIndex = (randomIndex + 1) % ALARM_SIMULATION_POOL.length;
  }
  lastSimIndex = randomIndex;
  const sample = ALARM_SIMULATION_POOL[randomIndex];

  return addNotification({
    ...sample,
    timestamp: new Date().toISOString(),
    showToast: true,
    playSound: true,
  });
}
