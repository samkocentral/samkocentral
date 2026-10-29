export type NotificationType = 'critical' | 'warning' | 'info' | 'success';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  site?: string;
  source?: 'fire-alarm' | 'hvac' | 'compliance' | 'maintenance' | 'system' | 'security' | 'water' | 'electrical';
  timestamp: string; // ISO string
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'critical',
    title: 'Gas Safety CP12 EXPIRED',
    message: 'Commercial kitchen gas safety certificate expired yesterday.',
    site: 'Ravens Ait Island',
    source: 'compliance',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    read: false,
    actionUrl: '/compliance-register',
    actionLabel: 'View Compliance',
  },
  {
    id: 'notif-2',
    type: 'critical',
    title: 'Fire Alarm Panel Loop 2 Fault',
    message: 'Zone 3 sensor disconnected. Immediate inspection required.',
    site: 'Crowne Plaza Kingston-south',
    source: 'fire-alarm',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    read: false,
    actionUrl: '/asset-management/maintenance',
    actionLabel: 'View Asset',
  },
  {
    id: 'notif-3',
    type: 'critical',
    title: 'Legionella Assessment Overdue',
    message: 'Water system bi-annual statutory test is 5 days overdue.',
    site: 'Stanhill Court',
    source: 'compliance',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    read: false,
    actionUrl: '/compliance-register',
    actionLabel: 'View Register',
  },
  {
    id: 'notif-4',
    type: 'warning',
    title: 'Chiller Plant B Servicing Due',
    message: 'Daikin VRV Compressor PPM servicing due in 3 days.',
    site: 'River Club',
    source: 'hvac',
    timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
    read: false,
    actionUrl: '/asset-management/maintenance',
    actionLabel: 'PPM Schedule',
  },
  {
    id: 'notif-5',
    type: 'warning',
    title: 'EICR Electrical Inspection Expiring',
    message: 'Fixed wiring inspection expires in 28 days.',
    site: 'Hampton 1 & 2',
    source: 'electrical',
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    read: false,
    actionUrl: '/compliance-register',
    actionLabel: 'Renew Now',
  },
  {
    id: 'notif-7',
    type: 'warning',
    title: 'Water Temp Sensor Drift (Calorifier B)',
    message: 'Water temp recorded at 48°C (below statutory 50°C Legionella control threshold).',
    site: 'Crowne Plaza Kingston-south',
    source: 'water',
    timestamp: new Date(Date.now() - 360 * 60000).toISOString(),
    read: false,
    actionUrl: '/compliance-register',
    actionLabel: 'Check Calorifier',
  },
  {
    id: 'notif-6',
    type: 'info',
    title: 'Daily Auto-Backup Complete',
    message: 'All 5 hotel site asset databases securely backed up.',
    site: 'Central Cloud',
    source: 'system',
    timestamp: new Date(Date.now() - 48 * 3600000).toISOString(),
    read: true,
  },
];

