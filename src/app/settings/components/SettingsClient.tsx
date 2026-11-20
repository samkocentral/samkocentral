'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Settings,
  Bell,
  Shield,
  Building2,
  Palette,
  Mail,
  Database,
  Save,
  ChevronRight,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  SlidersHorizontal,
  Sliders,
  LayoutDashboard,
  History,
  Upload,
  Users,
  Layers,
  ShieldAlert,
  Download,
  FileUp,
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { useAuth } from '@/lib/authContext';
import { toast } from 'sonner';
import CMSFieldManager from '@/components/settings/CMSFieldManager';
import CompleteAppCMS, { type AppCmsSectionKey } from '@/components/settings/CompleteAppCMS';
import DeepPageCMSEditor from '@/components/settings/DeepPageCMSEditor';
import PortalCMSEditor from '@/components/settings/PortalCMSEditor';
import PropertyOnboardingHub from '@/components/settings/PropertyOnboardingHub';

type SettingsTab =
  | 'general'
  | 'notifications'
  | 'security'
  | 'hotels'
  | 'appearance'
  | 'email'
  | 'data'
  | 'cms-pages'
  | 'cms-dashboard'
  | 'cms-propco'
  | 'cms-opco'
  | 'cms-recent-logs'
  | 'cms-import'
  | 'cms-users'
  | 'cms-navigation'
  | 'cms-forms'
  | 'cms-property-hub';

interface TabItem {
  id: SettingsTab;
  label: string;
  icon: React.ElementType;
}

interface CmsTabItem {
  id: SettingsTab;
  label: string;
  badgeText?: string;
  badgeColor?: string;
  icon: React.ElementType;
}

const BASE_TABS: TabItem[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'hotels', label: 'Properties & Sites', icon: Building2 },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'data', label: 'Data & Backup', icon: Database },
];

const CMS_NAV_ITEMS: CmsTabItem[] = [
  {
    id: 'cms-property-hub',
    label: 'Property Data & Setup CMS',
    icon: Building2,
    badgeText: 'CMS Hub',
    badgeColor: '#06b6d4',
  },
  {
    id: 'cms-opco',
    label: 'OpCo Portal',
    icon: Shield,
    badgeText: 'Operations',
    badgeColor: '#60a5fa',
  },
  {
    id: 'cms-propco',
    label: 'PropCo Portal',
    icon: Building2,
    badgeText: 'Asset Co',
    badgeColor: '#e8c97a',
  },
  {
    id: 'cms-navigation',
    label: 'Portal Navigation',
    icon: SlidersHorizontal,
    badgeText: 'Layout',
    badgeColor: '#f59e0b',
  },
];

function Toggle({
  checked = false,
  onChange,
}: {
  checked?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0"
      style={{ background: checked ? 'var(--primary)' : 'var(--surface3)' }}
    >
      <span
        className="inline-block h-3.5 w-3.5 transform rounded-full transition-transform"
        style={{
          background: checked ? '#000' : 'var(--text2)',
          transform: checked ? 'translateX(18px)' : 'translateX(3px)',
        }}
      />
    </button>
  );
}

function SettingRow({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div className="flex-1 min-w-0 pr-4">
        <div className="text-sm font-medium">{label}</div>
        {desc && <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border border-border overflow-hidden mb-5"
      style={{ background: 'var(--surface)' }}
    >
      <div className="px-5 py-3 border-b border-border" style={{ background: 'var(--surface2)' }}>
        <span className="font-head font-bold text-sm">{title}</span>
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

export default function SettingsClient() {
  const { isSuperAdmin, isDigitalBot, canAccessSettings, user } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = (searchParams?.get('tab') as SettingsTab) || 'general';
  const initialPage = (searchParams?.get('page') as any) || 'properties';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  useEffect(() => {
    const tabParam = searchParams?.get('tab') as SettingsTab;
    if (tabParam) {
      if ((tabParam.startsWith('cms-') || tabParam === 'data') && !isDigitalBot) {
        setActiveTab('general');
      } else {
        setActiveTab((prev) => (prev !== tabParam ? tabParam : prev));
      }
    }
  }, [searchParams, isDigitalBot]);

  // Automatically close the main sidebar when opening this page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:collapse-sidebar', { detail: { collapsed: true } })
      );
    }
  }, []);

  const [saved, setSaved] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('samko_theme');
      if (saved) return saved === 'dark';
      return !document.documentElement.classList.contains('light');
    }
    return true;
  });

  useEffect(() => {
    const handleThemeSync = () => {
      try {
        const saved = localStorage.getItem('samko_theme');
        if (saved) setIsDarkMode(saved === 'dark');
        else setIsDarkMode(!document.documentElement.classList.contains('light'));
      } catch {}
    };
    window.addEventListener('samko:theme-changed', handleThemeSync);
    window.addEventListener('storage', handleThemeSync);
    return () => {
      window.removeEventListener('samko:theme-changed', handleThemeSync);
      window.removeEventListener('storage', handleThemeSync);
    };
  }, []);

  const handleToggleTheme = (enableDark: boolean) => {
    setIsDarkMode(enableDark);
    if (typeof window !== 'undefined') {
      const mode = enableDark ? 'dark' : 'light';
      localStorage.setItem('samko_theme', mode);
      if (enableDark) {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.documentElement.setAttribute('data-theme', 'light');
      }
      window.dispatchEvent(new CustomEvent('samko:theme-changed', { detail: { theme: mode } }));
      toast.success(enableDark ? 'Dark Mode activated' : 'Pure White Mode activated', {
        description: enableDark ? 'Platform theme set to Dark' : 'Platform theme set to Pure White',
      });
    }
  };
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<any | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const checkStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setApiStatus(data);
    } catch (e: any) {
      setApiStatus({ error: e.message });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    setSeedLoading(true);
    setSeedResult(null);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSeedResult('Successfully seeded all collections to Firestore database!');
        checkStatus();
      } else {
        setSeedResult(data.message || 'Error seeding database');
      }
    } catch (e: any) {
      setSeedResult(`Failed to seed: ${e.message}`);
    } finally {
      setSeedLoading(false);
    }
  };

  const [backupLoading, setBackupLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const restoreInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleDownloadBackup = () => {
    try {
      setBackupLoading(true);
      window.location.href = '/api/backup?download=true';
      toast.success('Database backup initiated! Your backup file is downloading.');
    } catch (err: any) {
      toast.error('Failed to download backup', { description: err?.message });
    } finally {
      setTimeout(() => setBackupLoading(false), 1500);
    }
  };

  const handleExportCompliance = async () => {
    try {
      const res = await fetch('/api/compliance');
      const data = await res.json();
      const items = data.data || [];
      const headers = [
        'Compliance ID',
        'Regulation Title',
        'Section',
        'Category',
        'Check Type',
        'Standard / Authority',
        'Contractor',
        'Responsible Person',
        'Frequency',
        'Last Inspection',
        'Expiry Date',
        'Status',
        'Risk Rating',
        'Property',
        'Department',
        'Area',
        'Certificate Ref',
        'Notes',
      ];
      const rows = items.map((c: any) => [
        `"${c.complianceId || c.id || ''}"`,
        `"${(c.name || c.title || c.item || '').replace(/"/g, '""')}"`,
        `"${c.complianceType || c.section || 'OpCo'}"`,
        `"${c.category || ''}"`,
        `"${c.type || 'Statutory'}"`,
        `"${(c.standard || c.regulatoryAuthority || '').replace(/"/g, '""')}"`,
        `"${(c.contractor || '').replace(/"/g, '""')}"`,
        `"${(c.responsiblePerson || c.assignee || '').replace(/"/g, '""')}"`,
        `"${c.frequency || c.inspectionFrequency || ''}"`,
        `"${c.lastInspection || c.issueDate || ''}"`,
        `"${c.expiryDate || c.dueDate || ''}"`,
        `"${c.status || ''}"`,
        `"${c.riskRating || ''}"`,
        `"${c.hotel || c.property || ''}"`,
        `"${c.department || ''}"`,
        `"${c.area || ''}"`,
        `"${c.certificateNumber || c.certificateRef || ''}"`,
        `"${(c.notes || '').replace(/"/g, '""')}"`,
      ]);
      const csvContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'compliance_register.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${items.length} compliance records!`);
    } catch (err: any) {
      toast.error('Failed to export compliance register', { description: err?.message });
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setRestoring(true);
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Database restored successfully!', {
          description: `Restored ${data.restoredCount} records across ${data.restoredCollections?.length} collections.`,
        });
        checkStatus();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'all' } }));
        }
      } else {
        toast.error(data.error || 'Failed to restore backup');
      }
    } catch (err: any) {
      toast.error('Failed to parse or restore backup', { description: err?.message });
    } finally {
      setRestoring(false);
      if (e.target) e.target.value = '';
    }
  };

  const [notifs, setNotifs] = useState({
    maintenanceDue: true,
    overdueAlerts: true,
    warrantyExpiry: true,
    complianceExpiry: true,
    insuranceRenewal: true,
    contractRenewal: true,
    emailDigest: false,
    pushNotifications: true,
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: '60',
    passwordExpiry: '90',
    auditLog: true,
    ipRestriction: false,
  });

  const [generalSettings, setGeneralSettings] = useState({
    currency: 'GBP (£)',
    dateFormat: 'DD/MM/YYYY',
    timeZone: 'Europe/London (GMT+0)',
    inspectionFreq: 'Yearly',
    backupRetention: '30 days',
  });

  const handleSave = () => {
    setSaved(true);
    toast.success('All settings and CMS configurations saved successfully!');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:app-cms-updated'));
      window.dispatchEvent(new CustomEvent('samko:deep-page-cms-updated'));
      window.dispatchEvent(new CustomEvent('samko:data-changed'));
    }
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isSuperAdmin && !isDigitalBot && !canAccessSettings) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full p-8 text-center"
        style={{ minHeight: '65vh' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(244,63,94,0.12)', color: '#f43f5e' }}
        >
          <ShieldAlert size={28} />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Access Restricted</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
          System Settings and Platform Configuration controls are restricted to administrators. You
          do not have permission to view or edit system configurations.
        </p>
        <Link
          href="/"
          className="px-4 py-2 rounded-lg text-xs font-semibold"
          style={{ background: 'var(--primary)', color: '#000' }}
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-7 py-4 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div>
          <h1 className="font-head text-xl font-bold">Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your platform configuration and preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          className="samko-btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer"
          style={saved ? { background: '#10b981', color: '#ffffff' } : undefined}
        >
          <Save size={14} />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar tabs */}
        <div
          className="w-60 flex-shrink-0 border-r border-border overflow-y-auto"
          style={{ background: 'var(--surface)', padding: '12px 8px' }}
        >
          {/* Section 1: Standard Settings */}
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            System Settings
          </div>
          {BASE_TABS.filter((tab) => tab.id !== 'data' || isDigitalBot).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg mb-0.5 text-left transition-colors cursor-pointer"
                style={{
                  background: active ? 'rgba(232,201,122,0.12)' : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--text2)',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                }}
              >
                <Icon size={14} />
                <span className="flex-1 truncate">{tab.label}</span>
                {tab.id === 'hotels' && isDigitalBot && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-400/20 text-[#38bdf8] border border-[#38bdf8]/30 font-bold">
                    BOT HUB
                  </span>
                )}
                {tab.id === 'data' && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-400/20 text-[#38bdf8] border border-[#38bdf8]/30 font-bold">
                    BOT
                  </span>
                )}
                {active && <ChevronRight size={11} />}
              </button>
            );
          })}

          {/* Section 2: Complete Application CMS (Digital Bot Only) */}
          {isDigitalBot && (
            <div className="pt-3 mt-3 border-t border-border">
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#38bdf8] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal size={11} />
                  Application CMS
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-400/20 text-[#38bdf8] border border-[#38bdf8]/30 font-bold">
                  BOT ONLY
                </span>
              </div>

              {CMS_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg mb-0.5 text-left transition-colors cursor-pointer group"
                    style={{
                      background: active ? 'rgba(232,201,122,0.12)' : 'transparent',
                      color: active ? 'var(--primary)' : 'var(--text2)',
                      fontSize: 12.5,
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <Icon
                      size={14}
                      className={
                        active
                          ? 'text-primary'
                          : 'text-muted-foreground group-hover:text-foreground'
                      }
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badgeText && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.2 rounded tracking-wider uppercase flex-shrink-0"
                        style={{
                          background: item.badgeColor
                            ? `${item.badgeColor}22`
                            : 'rgba(255,255,255,0.08)',
                          color: item.badgeColor || 'var(--text2)',
                          border: item.badgeColor
                            ? `1px solid ${item.badgeColor}40`
                            : '1px solid var(--border)',
                        }}
                      >
                        {item.badgeText}
                      </span>
                    )}
                    {active && <ChevronRight size={11} className="text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content */}
        <div
          className={`flex-1 ${
            activeTab === 'cms-opco' || activeTab === 'cms-propco'
              ? 'overflow-hidden flex flex-col p-6 h-full min-h-0'
              : 'overflow-y-auto p-6 md:p-8 h-full'
          }`}
          style={{ scrollbarWidth: 'thin' }}
        >
          {activeTab === 'general' && (
            <div>
              <SectionCard title="Organisation">
                <SettingRow label="Organisation Name" desc="Your company or group name">
                  <input
                    className="rounded-lg border border-border px-3 py-1.5 text-sm"
                    style={{
                      background: 'var(--surface2)',
                      color: 'var(--foreground)',
                      width: 220,
                    }}
                    defaultValue="Samko Central"
                  />
                </SettingRow>
                <SettingRow label="Default Currency" desc="Currency used across the platform">
                  <CustomDropdown
                    value={generalSettings.currency}
                    onChange={(val) => setGeneralSettings({ ...generalSettings, currency: val })}
                    options={[
                      { value: 'GBP (£)', label: 'GBP (£)' },
                      { value: 'USD ($)', label: 'USD ($)' },
                      { value: 'EUR (€)', label: 'EUR (€)' },
                    ]}
                    variant="form"
                    width={220}
                  />
                </SettingRow>
                <SettingRow label="Date Format" desc="How dates are displayed">
                  <CustomDropdown
                    value={generalSettings.dateFormat}
                    onChange={(val) => setGeneralSettings({ ...generalSettings, dateFormat: val })}
                    options={[
                      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                    ]}
                    variant="form"
                    width={220}
                  />
                </SettingRow>
                <SettingRow label="Time Zone" desc="Platform time zone">
                  <CustomDropdown
                    value={generalSettings.timeZone}
                    onChange={(val) => setGeneralSettings({ ...generalSettings, timeZone: val })}
                    options={[
                      { value: 'Europe/London (GMT+0)', label: 'Europe/London (GMT+0)' },
                      { value: 'America/New_York (GMT-5)', label: 'America/New_York (GMT-5)' },
                      { value: 'Asia/Dubai (GMT+4)', label: 'Asia/Dubai (GMT+4)' },
                    ]}
                    variant="form"
                    width={220}
                  />
                </SettingRow>
              </SectionCard>
              <SectionCard title="Asset Management">
                <SettingRow label="Default Inspection Frequency" desc="Applied to new assets">
                  <CustomDropdown
                    value={generalSettings.inspectionFreq}
                    onChange={(val) =>
                      setGeneralSettings({ ...generalSettings, inspectionFreq: val })
                    }
                    options={[
                      { value: 'Yearly', label: 'Yearly' },
                      { value: '6-Monthly', label: '6-Monthly' },
                      { value: 'Quarterly', label: 'Quarterly' },
                      { value: 'Monthly', label: 'Monthly' },
                    ]}
                    variant="form"
                    width={220}
                  />
                </SettingRow>
                <SettingRow
                  label="Auto-generate Asset IDs"
                  desc="Automatically assign IDs to new assets"
                >
                  <Toggle checked onChange={() => {}} />
                </SettingRow>
                <SettingRow
                  label="Require Photos on Inspection"
                  desc="Enforce photo upload during inspections"
                >
                  <Toggle onChange={() => {}} />
                </SettingRow>
              </SectionCard>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <SectionCard title="Maintenance Alerts">
                <SettingRow
                  label="Maintenance Due Reminders"
                  desc="Notify when maintenance is due in 7 days"
                >
                  <Toggle
                    checked={notifs.maintenanceDue}
                    onChange={(v) => setNotifs({ ...notifs, maintenanceDue: v })}
                  />
                </SettingRow>
                <SettingRow
                  label="Overdue Maintenance Alerts"
                  desc="Alert when maintenance becomes overdue"
                >
                  <Toggle
                    checked={notifs.overdueAlerts}
                    onChange={(v) => setNotifs({ ...notifs, overdueAlerts: v })}
                  />
                </SettingRow>
                <SettingRow
                  label="Warranty Expiry Reminders"
                  desc="Notify 30 days before warranty expires"
                >
                  <Toggle
                    checked={notifs.warrantyExpiry}
                    onChange={(v) => setNotifs({ ...notifs, warrantyExpiry: v })}
                  />
                </SettingRow>
              </SectionCard>
              <SectionCard title="Compliance & Legal">
                <SettingRow
                  label="Compliance Expiry Alerts"
                  desc="Notify when compliance items are expiring"
                >
                  <Toggle
                    checked={notifs.complianceExpiry}
                    onChange={(v) => setNotifs({ ...notifs, complianceExpiry: v })}
                  />
                </SettingRow>
                <SettingRow
                  label="Insurance Renewal Reminders"
                  desc="Alert 60 days before policy renewal"
                >
                  <Toggle
                    checked={notifs.insuranceRenewal}
                    onChange={(v) => setNotifs({ ...notifs, insuranceRenewal: v })}
                  />
                </SettingRow>
                <SettingRow
                  label="Contract Renewal Reminders"
                  desc="Alert when contracts are due for renewal"
                >
                  <Toggle
                    checked={notifs.contractRenewal}
                    onChange={(v) => setNotifs({ ...notifs, contractRenewal: v })}
                  />
                </SettingRow>
              </SectionCard>
              <SectionCard title="Delivery">
                <SettingRow label="Daily Email Digest" desc="Receive a daily summary of all alerts">
                  <Toggle
                    checked={notifs.emailDigest}
                    onChange={(v) => setNotifs({ ...notifs, emailDigest: v })}
                  />
                </SettingRow>
                <SettingRow
                  label="Push Notifications"
                  desc="Browser push notifications for critical alerts"
                >
                  <Toggle
                    checked={notifs.pushNotifications}
                    onChange={(v) => setNotifs({ ...notifs, pushNotifications: v })}
                  />
                </SettingRow>
              </SectionCard>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <SectionCard title="Authentication">
                <SettingRow label="Two-Factor Authentication" desc="Require 2FA for all users">
                  <Toggle
                    checked={security.twoFactor}
                    onChange={(v) => setSecurity({ ...security, twoFactor: v })}
                  />
                </SettingRow>
                <SettingRow label="Session Timeout" desc="Auto-logout after inactivity (minutes)">
                  <CustomDropdown
                    value={security.sessionTimeout}
                    onChange={(val) => setSecurity({ ...security, sessionTimeout: val })}
                    options={[
                      { value: '30', label: '30 minutes' },
                      { value: '60', label: '60 minutes' },
                      { value: '120', label: '2 hours' },
                      { value: '480', label: '8 hours' },
                    ]}
                    variant="form"
                    width={220}
                  />
                </SettingRow>
                <SettingRow label="Password Expiry" desc="Force password reset after (days)">
                  <CustomDropdown
                    value={security.passwordExpiry}
                    onChange={(val) => setSecurity({ ...security, passwordExpiry: val })}
                    options={[
                      { value: '30', label: '30 days' },
                      { value: '60', label: '60 days' },
                      { value: '90', label: '90 days' },
                      { value: 'never', label: 'Never' },
                    ]}
                    variant="form"
                    width={220}
                  />
                </SettingRow>
              </SectionCard>
              <SectionCard title="Audit & Access">
                <SettingRow label="Audit Log" desc="Record all user actions and changes">
                  <div className="flex items-center gap-3">
                    <Link
                      href="/users?tab=audit"
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      View Live Audit Log →
                    </Link>
                    <Toggle
                      checked={security.auditLog}
                      onChange={(v) => setSecurity({ ...security, auditLog: v })}
                    />
                  </div>
                </SettingRow>
                <SettingRow label="IP Restriction" desc="Restrict access to specific IP ranges">
                  <Toggle
                    checked={security.ipRestriction}
                    onChange={(v) => setSecurity({ ...security, ipRestriction: v })}
                  />
                </SettingRow>
              </SectionCard>
            </div>
          )}

          {activeTab === 'hotels' && <PropertyOnboardingHub />}

          {activeTab === 'appearance' && (
            <div>
              <SectionCard title="Theme">
                <SettingRow
                  label="Dark Mode"
                  desc={
                    isDarkMode
                      ? 'Dark theme is active across the platform. Turn off for Pure White theme.'
                      : 'Pure White theme is active across the platform. Turn on for Dark theme.'
                  }
                >
                  <Toggle checked={isDarkMode} onChange={handleToggleTheme} />
                </SettingRow>
                <SettingRow label="Compact Mode" desc="Reduce spacing for denser layouts">
                  <Toggle onChange={() => {}} />
                </SettingRow>
                <SettingRow
                  label="Sidebar Collapsed by Default"
                  desc="Start with sidebar collapsed"
                >
                  <Toggle onChange={() => {}} />
                </SettingRow>
              </SectionCard>
              <SectionCard title="Dashboard">
                <SettingRow
                  label="Show Alert Banner"
                  desc="Display critical alert banner in sidebar"
                >
                  <Toggle checked onChange={() => {}} />
                </SettingRow>
                <SettingRow
                  label="Animate Badge Counts"
                  desc="Pulse animation on critical badge counts"
                >
                  <Toggle checked onChange={() => {}} />
                </SettingRow>
              </SectionCard>
            </div>
          )}

          {activeTab === 'email' && (
            <div>
              <SectionCard title="Email Configuration">
                <SettingRow label="From Name" desc="Sender name for outgoing emails">
                  <input
                    className="rounded-lg border border-border px-3 py-1.5 text-sm"
                    style={{
                      background: 'var(--surface2)',
                      color: 'var(--foreground)',
                      width: 220,
                    }}
                    defaultValue="Samko Central"
                  />
                </SettingRow>
                <SettingRow label="From Email" desc="Sender email address">
                  <input
                    className="rounded-lg border border-border px-3 py-1.5 text-sm"
                    style={{
                      background: 'var(--surface2)',
                      color: 'var(--foreground)',
                      width: 220,
                    }}
                    defaultValue="noreply@samkocentral.com"
                  />
                </SettingRow>
                <SettingRow label="Reply-To Email" desc="Email address for replies">
                  <input
                    className="rounded-lg border border-border px-3 py-1.5 text-sm"
                    style={{
                      background: 'var(--surface2)',
                      color: 'var(--foreground)',
                      width: 220,
                    }}
                    defaultValue="admin@samkocentral.com"
                  />
                </SettingRow>
              </SectionCard>
              <SectionCard title="Email Templates">
                {[
                  'Maintenance Due Reminder',
                  'Compliance Expiry Alert',
                  'Insurance Renewal',
                  'Contract Renewal',
                  'Welcome Email',
                ].map((template) => (
                  <SettingRow
                    key={template}
                    label={template}
                    desc="Customise email content and layout"
                  >
                    <button
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border"
                      style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                    >
                      Edit Template
                    </button>
                  </SettingRow>
                ))}
              </SectionCard>
            </div>
          )}

          {activeTab === 'data' && isDigitalBot && (
            <div className="space-y-6">
              {/* Hidden file input for one-click JSON backup restore */}
              <input
                type="file"
                ref={restoreInputRef}
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
              />

              {/* ── TOP HERO CARD: DATABASE BACKUP & RESTORE ── */}
              <div
                className="rounded-2xl border border-amber-500/40 p-5 shadow-xl relative overflow-hidden"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(15,23,42,0.95) 100%)',
                }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/20 text-amber-400 border border-amber-500/40 flex-shrink-0 shadow-inner">
                      <Database size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-head font-bold text-base text-foreground">
                          Full Database Backup &amp; Disaster Recovery
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          312 Records Protected
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                        Instantaneous master JSON backup containing all 13 collections (Properties,
                        Assets, Contracts, Insurance, Tasks, Utilities, Documents, Users, and Audit
                        Logs). Download your full archive before pruning or editing database
                        records.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadBackup}
                      disabled={backupLoading}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 transition-all shadow-md cursor-pointer"
                    >
                      <Download size={15} className={backupLoading ? 'animate-bounce' : ''} />
                      {backupLoading ? 'Exporting Backup...' : 'Download Full Backup (.json)'}
                    </button>

                    <button
                      type="button"
                      onClick={() => restoreInputRef.current?.click()}
                      disabled={restoring}
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-cyan-500/40 text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all cursor-pointer"
                    >
                      <FileUp size={15} className={restoring ? 'animate-spin' : ''} />
                      {restoring ? 'Restoring...' : 'Restore Database (.json)'}
                    </button>
                  </div>
                </div>
              </div>

              <SectionCard title="Firebase & Firestore Backend">
                <div className="mb-4 text-xs text-muted-foreground leading-relaxed">
                  SamkoCentral is integrated with Firebase Firestore and Next.js REST API routes.
                  When your Firebase credentials are added to{' '}
                  <code className="text-amber-400">.env</code>, operations directly synchronize with
                  Firestore in real-time.
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <button
                    onClick={checkStatus}
                    disabled={statusLoading}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-border"
                    style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  >
                    <RefreshCw size={13} className={statusLoading ? 'animate-spin' : ''} />
                    {statusLoading ? 'Checking...' : 'Check Firebase Status'}
                  </button>

                  <button
                    onClick={handleSeedDatabase}
                    disabled={seedLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
                    style={{ background: 'var(--primary)', color: '#000' }}
                  >
                    <Sparkles size={14} className={seedLoading ? 'animate-spin' : ''} />
                    {seedLoading ? 'Seeding Firestore...' : 'Seed Firestore Database'}
                  </button>

                  <button
                    onClick={handleDownloadBackup}
                    disabled={backupLoading}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm border border-amber-500/40 text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 cursor-pointer"
                  >
                    <Download size={13} className={backupLoading ? 'animate-bounce' : ''} />
                    {backupLoading ? 'Exporting...' : 'Download Full Backup (.json)'}
                  </button>

                  <button
                    onClick={() => restoreInputRef.current?.click()}
                    disabled={restoring}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-cyan-500/40 text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all cursor-pointer"
                  >
                    <FileUp size={13} className={restoring ? 'animate-spin' : ''} />
                    {restoring ? 'Restoring...' : 'Restore from Backup (.json)'}
                  </button>
                </div>

                {seedResult && (
                  <div
                    className="p-3 mb-4 rounded-lg text-xs flex items-center gap-2 border"
                    style={{
                      background: seedResult.includes('Successfully')
                        ? 'rgba(61,214,140,0.1)'
                        : 'rgba(245,158,11,0.1)',
                      borderColor: seedResult.includes('Successfully') ? '#3dd68c' : '#f59e0b',
                      color: seedResult.includes('Successfully') ? '#3dd68c' : '#f59e0b',
                    }}
                  >
                    {seedResult.includes('Successfully') ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <AlertCircle size={14} />
                    )}
                    {seedResult}
                  </div>
                )}

                {apiStatus && (
                  <div
                    className="p-3 rounded-lg border border-border mb-4 text-xs font-mono"
                    style={{ background: 'var(--surface2)' }}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                      <span className="font-bold font-sans">Firebase Status:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-sans font-semibold ${apiStatus.firebaseAdminConfigured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}
                      >
                        {apiStatus.firebaseAdminConfigured
                          ? 'Firestore Admin Connected'
                          : 'Fallback Mode (Ready for Credentials)'}
                      </span>
                    </div>
                    <div>Project ID: {apiStatus.projectId || 'Not set in .env yet'}</div>
                    <div className="mt-1 text-muted-foreground font-sans">
                      Active Records by Collection:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 font-sans">
                      {apiStatus.counts &&
                        Object.entries(apiStatus.counts).map(([col, cnt]) => (
                          <div key={col} className="p-2 rounded bg-black/20 text-center">
                            <div className="font-bold text-amber-300 text-sm">{cnt as any}</div>
                            <div className="text-[11px] text-muted-foreground capitalize">
                              {col}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div
                  className="rounded-lg p-3 border border-border text-xs"
                  style={{ background: 'var(--surface2)' }}
                >
                  <div className="font-bold mb-1 text-foreground flex items-center gap-1.5">
                    <Server size={13} className="text-amber-400" />
                    Available REST API Endpoints:
                  </div>
                  <div className="text-muted-foreground grid grid-cols-1 md:grid-cols-2 gap-1 mt-2 font-mono text-[11px]">
                    <div>
                      GET/POST <span className="text-foreground">/api/properties</span>
                    </div>
                    <div>
                      GET/PUT/DELETE <span className="text-foreground">/api/properties/[id]</span>
                    </div>
                    <div>
                      GET/POST <span className="text-foreground">/api/assets</span>
                    </div>
                    <div>
                      GET/PUT/DELETE <span className="text-foreground">/api/assets/[id]</span>
                    </div>
                    <div>
                      GET/POST <span className="text-foreground">/api/maintenance</span>
                    </div>
                    <div>
                      GET/PUT/DELETE <span className="text-foreground">/api/maintenance/[id]</span>
                    </div>
                    <div>
                      GET/POST <span className="text-foreground">/api/compliance</span>
                    </div>
                    <div>
                      GET/POST <span className="text-foreground">/api/insurance</span>
                    </div>
                    <div>
                      GET/POST <span className="text-foreground">/api/contracts</span>
                    </div>
                    <div>
                      GET/POST <span className="text-foreground">/api/utilities</span>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Data Export">
                <SettingRow
                  label="Export All Assets"
                  desc="Download complete asset register as Excel"
                >
                  <button
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: 'var(--primary)', color: '#000' }}
                  >
                    Export Excel
                  </button>
                </SettingRow>
                <SettingRow
                  label="Export Compliance Register"
                  desc="Download all compliance records"
                >
                  <button
                    type="button"
                    onClick={handleExportCompliance}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                    style={{ background: 'var(--primary)', color: '#000' }}
                  >
                    Export Excel
                  </button>
                </SettingRow>
                <SettingRow
                  label="Export Maintenance History"
                  desc="Download full maintenance history"
                >
                  <button
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: 'var(--primary)', color: '#000' }}
                  >
                    Export Excel
                  </button>
                </SettingRow>
              </SectionCard>
              <SectionCard title="Database Backup & Restore">
                <input
                  type="file"
                  ref={restoreInputRef}
                  accept=".json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />

                <SettingRow
                  label="Download Full Database Backup"
                  desc="Download complete JSON archive of all 13 collections (Properties, Assets, Contracts, Insurance, Tasks, Users, Documents, etc.)"
                >
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    disabled={backupLoading}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                    style={{ background: 'var(--primary)', color: '#000' }}
                  >
                    <Download size={13} className={backupLoading ? 'animate-bounce' : ''} />
                    {backupLoading ? 'Exporting...' : 'Download Full Backup (.json)'}
                  </button>
                </SettingRow>

                <SettingRow
                  label="Restore Database from Backup"
                  desc="Upload a previously exported .json database file to safely restore all collections"
                >
                  <button
                    type="button"
                    onClick={() => restoreInputRef.current?.click()}
                    disabled={restoring}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border border-cyan-500/40 text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all cursor-pointer"
                  >
                    <FileUp size={13} className={restoring ? 'animate-spin' : ''} />
                    {restoring ? 'Restoring...' : 'Restore from Backup (.json)'}
                  </button>
                </SettingRow>

                <SettingRow label="Automatic Backups" desc="Daily automated data backups">
                  <Toggle checked onChange={() => {}} />
                </SettingRow>
                <SettingRow label="Backup Retention" desc="How long to keep backups">
                  <CustomDropdown
                    value={generalSettings.backupRetention}
                    onChange={(val) =>
                      setGeneralSettings({ ...generalSettings, backupRetention: val })
                    }
                    options={[
                      { value: '30 days', label: '30 days' },
                      { value: '60 days', label: '60 days' },
                      { value: '90 days', label: '90 days' },
                    ]}
                    variant="form"
                    width={220}
                  />
                </SettingRow>
              </SectionCard>
            </div>
          )}

          {/* Application CMS Active Panels (Restricted strictly to Digital Bot) */}
          {isDigitalBot && (
            <>
              {activeTab === 'cms-property-hub' && <PropertyOnboardingHub />}
              {activeTab === 'cms-opco' && (
                <PortalCMSEditor portal="opco" initialTabId={initialPage} />
              )}
              {activeTab === 'cms-propco' && (
                <PortalCMSEditor portal="propco" initialTabId={initialPage} />
              )}
              {activeTab === 'cms-pages' && (
                <DeepPageCMSEditor
                  initialPage={(initialPage as any) || 'properties'}
                  hidePageGrid={false}
                />
              )}
              {activeTab === 'cms-dashboard' && <CompleteAppCMS activeSection="dashboard" />}
              {activeTab === 'cms-recent-logs' && (
                <PortalCMSEditor portal="opco" initialTabId="recent-logs" />
              )}
              {activeTab === 'cms-import' && (
                <PortalCMSEditor portal="opco" initialTabId="import" />
              )}
              {activeTab === 'cms-users' && <PortalCMSEditor portal="opco" initialTabId="users" />}
              {activeTab === 'cms-navigation' && <CompleteAppCMS activeSection="navigation" />}
              {activeTab === 'cms-forms' && <CMSFieldManager />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
