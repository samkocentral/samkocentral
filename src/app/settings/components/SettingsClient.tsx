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
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/lib/authContext';
import { toast } from 'sonner';
import CMSFieldManager from '@/components/settings/CMSFieldManager';
import CompleteAppCMS, { type AppCmsSectionKey } from '@/components/settings/CompleteAppCMS';
import DeepPageCMSEditor from '@/components/settings/DeepPageCMSEditor';
import PortalCMSEditor from '@/components/settings/PortalCMSEditor';

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
  | 'cms-forms';

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
  { id: 'cms-opco', label: 'OpCo Portal', icon: Shield, badgeText: 'Operations', badgeColor: '#60a5fa' },
  { id: 'cms-propco', label: 'PropCo Portal', icon: Building2, badgeText: 'Asset Co', badgeColor: '#e8c97a' },
  { id: 'cms-navigation', label: 'Portal Navigation', icon: SlidersHorizontal, badgeText: 'Layout', badgeColor: '#f59e0b' },
];

function Toggle({ checked = false, onChange }: { checked?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0"
      style={{ background: checked ? 'var(--primary)' : 'var(--surface3)' }}
    >
      <span
        className="inline-block h-3.5 w-3.5 transform rounded-full transition-transform"
        style={{ background: checked ? '#000' : 'var(--text2)', transform: checked ? 'translateX(18px)' : 'translateX(3px)' }}
      />
    </button>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
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
    <div className="rounded-xl border border-border overflow-hidden mb-5" style={{ background: 'var(--surface)' }}>
      <div className="px-5 py-3 border-b border-border" style={{ background: 'var(--surface2)' }}>
        <span className="font-head font-bold text-sm">{title}</span>
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

export default function SettingsClient() {
  const { isSuperAdmin, user } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = ((searchParams?.get('tab')) as SettingsTab) || 'general';
  const initialPage = (searchParams?.get('page') as any) || 'properties';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  useEffect(() => {
    const tabParam = searchParams?.get('tab') as SettingsTab;
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Automatically close the main sidebar when opening this page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:collapse-sidebar', { detail: { collapsed: true } }));
    }
  }, []);

  const [saved, setSaved] = useState(false);
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-7 py-4 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <div>
          <h1 className="font-head text-xl font-bold">Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your platform configuration and preferences</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ background: saved ? '#3dd68c' : 'var(--primary)', color: '#000' }}
        >
          <Save size={14} />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar tabs */}
        <div className="w-60 flex-shrink-0 border-r border-border overflow-y-auto" style={{ background: 'var(--surface)', padding: '12px 8px' }}>
          {/* Section 1: Standard Settings */}
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            System Settings
          </div>
          {BASE_TABS.map((tab) => {
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
                {active && <ChevronRight size={11} />}
              </button>
            );
          })}

          {/* Section 2: Complete Application CMS (Super Admin) - Streamlined */}
          {(isSuperAdmin || user?.roleLevel === 'L1') && (
            <div className="pt-3 mt-3 border-t border-border">
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#e8c97a] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal size={11} />
                  Application CMS
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-[#e8c97a] border border-[#e8c97a]/30 font-bold">
                  L1
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
                      className={active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badgeText && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.2 rounded tracking-wider uppercase flex-shrink-0"
                        style={{
                          background: item.badgeColor ? `${item.badgeColor}22` : 'rgba(255,255,255,0.08)',
                          color: item.badgeColor || 'var(--text2)',
                          border: item.badgeColor ? `1px solid ${item.badgeColor}40` : '1px solid var(--border)',
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
                  <input className="rounded-lg border border-border px-3 py-1.5 text-sm" style={{ background: 'var(--surface2)', color: 'var(--foreground)', width: 220 }} defaultValue="Samko Central" />
                </SettingRow>
                <SettingRow label="Default Currency" desc="Currency used across the platform">
                  <select className="rounded-lg border border-border px-3 py-1.5 text-sm" style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}>
                    <option>GBP (£)</option>
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                  </select>
                </SettingRow>
                <SettingRow label="Date Format" desc="How dates are displayed">
                  <select className="rounded-lg border border-border px-3 py-1.5 text-sm" style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}>
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </SettingRow>
                <SettingRow label="Time Zone" desc="Platform time zone">
                  <select className="rounded-lg border border-border px-3 py-1.5 text-sm" style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}>
                    <option>Europe/London (GMT+0)</option>
                    <option>America/New_York (GMT-5)</option>
                    <option>Asia/Dubai (GMT+4)</option>
                  </select>
                </SettingRow>
              </SectionCard>
              <SectionCard title="Asset Management">
                <SettingRow label="Default Inspection Frequency" desc="Applied to new assets">
                  <select className="rounded-lg border border-border px-3 py-1.5 text-sm" style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}>
                    <option>Yearly</option>
                    <option>6-Monthly</option>
                    <option>Quarterly</option>
                    <option>Monthly</option>
                  </select>
                </SettingRow>
                <SettingRow label="Auto-generate Asset IDs" desc="Automatically assign IDs to new assets">
                  <Toggle checked onChange={() => {}} />
                </SettingRow>
                <SettingRow label="Require Photos on Inspection" desc="Enforce photo upload during inspections">
                  <Toggle onChange={() => {}} />
                </SettingRow>
              </SectionCard>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <SectionCard title="Maintenance Alerts">
                <SettingRow label="Maintenance Due Reminders" desc="Notify when maintenance is due in 7 days">
                  <Toggle checked={notifs.maintenanceDue} onChange={(v) => setNotifs({ ...notifs, maintenanceDue: v })} />
                </SettingRow>
                <SettingRow label="Overdue Maintenance Alerts" desc="Alert when maintenance becomes overdue">
                  <Toggle checked={notifs.overdueAlerts} onChange={(v) => setNotifs({ ...notifs, overdueAlerts: v })} />
                </SettingRow>
                <SettingRow label="Warranty Expiry Reminders" desc="Notify 30 days before warranty expires">
                  <Toggle checked={notifs.warrantyExpiry} onChange={(v) => setNotifs({ ...notifs, warrantyExpiry: v })} />
                </SettingRow>
              </SectionCard>
              <SectionCard title="Compliance & Legal">
                <SettingRow label="Compliance Expiry Alerts" desc="Notify when compliance items are expiring">
                  <Toggle checked={notifs.complianceExpiry} onChange={(v) => setNotifs({ ...notifs, complianceExpiry: v })} />
                </SettingRow>
                <SettingRow label="Insurance Renewal Reminders" desc="Alert 60 days before policy renewal">
                  <Toggle checked={notifs.insuranceRenewal} onChange={(v) => setNotifs({ ...notifs, insuranceRenewal: v })} />
                </SettingRow>
                <SettingRow label="Contract Renewal Reminders" desc="Alert when contracts are due for renewal">
                  <Toggle checked={notifs.contractRenewal} onChange={(v) => setNotifs({ ...notifs, contractRenewal: v })} />
                </SettingRow>
              </SectionCard>
              <SectionCard title="Delivery">
                <SettingRow label="Daily Email Digest" desc="Receive a daily summary of all alerts">
                  <Toggle checked={notifs.emailDigest} onChange={(v) => setNotifs({ ...notifs, emailDigest: v })} />
                </SettingRow>
                <SettingRow label="Push Notifications" desc="Browser push notifications for critical alerts">
                  <Toggle checked={notifs.pushNotifications} onChange={(v) => setNotifs({ ...notifs, pushNotifications: v })} />
                </SettingRow>
              </SectionCard>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <SectionCard title="Authentication">
                <SettingRow label="Two-Factor Authentication" desc="Require 2FA for all users">
                  <Toggle checked={security.twoFactor} onChange={(v) => setSecurity({ ...security, twoFactor: v })} />
                </SettingRow>
                <SettingRow label="Session Timeout" desc="Auto-logout after inactivity (minutes)">
                  <select className="rounded-lg border border-border px-3 py-1.5 text-sm" style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                    value={security.sessionTimeout} onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}>
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="120">2 hours</option>
                    <option value="480">8 hours</option>
                  </select>
                </SettingRow>
                <SettingRow label="Password Expiry" desc="Force password reset after (days)">
                  <select className="rounded-lg border border-border px-3 py-1.5 text-sm" style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                    value={security.passwordExpiry} onChange={(e) => setSecurity({ ...security, passwordExpiry: e.target.value })}>
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                    <option value="never">Never</option>
                  </select>
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
                    <Toggle checked={security.auditLog} onChange={(v) => setSecurity({ ...security, auditLog: v })} />
                  </div>
                </SettingRow>
                <SettingRow label="IP Restriction" desc="Restrict access to specific IP ranges">
                  <Toggle checked={security.ipRestriction} onChange={(v) => setSecurity({ ...security, ipRestriction: v })} />
                </SettingRow>
              </SectionCard>
            </div>
          )}

          {activeTab === 'hotels' && (
            <div>
              <SectionCard title="Registered Properties">
                {['Crowne Plaza Kingston-south', 'Stanhill Court', 'Hampton 1 & 2', 'Ravents Ait Island', 'River Club'].map((hotel) => (
                  <SettingRow key={hotel} label={hotel} desc="London, UK">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(61,214,140,0.12)', color: '#3dd68c' }}>Active</span>
                  </SettingRow>
                ))}
              </SectionCard>
              <SectionCard title="Property Settings">
                <SettingRow label="Allow Cross-Property Asset Transfer" desc="Enable moving assets between properties">
                  <Toggle checked onChange={() => {}} />
                </SettingRow>
                <SettingRow label="Property-Level Reporting" desc="Generate separate reports per property">
                  <Toggle checked onChange={() => {}} />
                </SettingRow>
              </SectionCard>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div>
              <SectionCard title="Theme">
                <SettingRow label="Dark Mode" desc="Use dark theme across the platform">
                  <Toggle checked onChange={() => {}} />
                </SettingRow>
                <SettingRow label="Compact Mode" desc="Reduce spacing for denser layouts">
                  <Toggle onChange={() => {}} />
                </SettingRow>
                <SettingRow label="Sidebar Collapsed by Default" desc="Start with sidebar collapsed">
                  <Toggle onChange={() => {}} />
                </SettingRow>
              </SectionCard>
              <SectionCard title="Dashboard">
                <SettingRow label="Show Alert Banner" desc="Display critical alert banner in sidebar">
                  <Toggle checked onChange={() => {}} />
                </SettingRow>
                <SettingRow label="Animate Badge Counts" desc="Pulse animation on critical badge counts">
                  <Toggle checked onChange={() => {}} />
                </SettingRow>
              </SectionCard>
            </div>
          )}

          {activeTab === 'email' && (
            <div>
              <SectionCard title="Email Configuration">
                <SettingRow label="From Name" desc="Sender name for outgoing emails">
                  <input className="rounded-lg border border-border px-3 py-1.5 text-sm" style={{ background: 'var(--surface2)', color: 'var(--foreground)', width: 220 }} defaultValue="Samko Central" />
                </SettingRow>
                <SettingRow label="From Email" desc="Sender email address">
                  <input className="rounded-lg border border-border px-3 py-1.5 text-sm" style={{ background: 'var(--surface2)', color: 'var(--foreground)', width: 220 }} defaultValue="noreply@samkocentral.com" />
                </SettingRow>
                <SettingRow label="Reply-To Email" desc="Email address for replies">
                  <input className="rounded-lg border border-border px-3 py-1.5 text-sm" style={{ background: 'var(--surface2)', color: 'var(--foreground)', width: 220 }} defaultValue="admin@samkocentral.com" />
                </SettingRow>
              </SectionCard>
              <SectionCard title="Email Templates">
                {['Maintenance Due Reminder', 'Compliance Expiry Alert', 'Insurance Renewal', 'Contract Renewal', 'Welcome Email'].map((template) => (
                  <SettingRow key={template} label={template} desc="Customise email content and layout">
                    <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>Edit Template</button>
                  </SettingRow>
                ))}
              </SectionCard>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <SectionCard title="Firebase & Firestore Backend">
                <div className="mb-4 text-xs text-muted-foreground leading-relaxed">
                  SamkoCentral is integrated with Firebase Firestore and Next.js REST API routes. When your Firebase credentials are added to <code className="text-amber-400">.env</code>, operations directly synchronize with Firestore in real-time.
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
                </div>

                {seedResult && (
                  <div
                    className="p-3 mb-4 rounded-lg text-xs flex items-center gap-2 border"
                    style={{
                      background: seedResult.includes('Successfully') ? 'rgba(61,214,140,0.1)' : 'rgba(245,158,11,0.1)',
                      borderColor: seedResult.includes('Successfully') ? '#3dd68c' : '#f59e0b',
                      color: seedResult.includes('Successfully') ? '#3dd68c' : '#f59e0b',
                    }}
                  >
                    {seedResult.includes('Successfully') ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {seedResult}
                  </div>
                )}

                {apiStatus && (
                  <div className="p-3 rounded-lg border border-border mb-4 text-xs font-mono" style={{ background: 'var(--surface2)' }}>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                      <span className="font-bold font-sans">Firebase Status:</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-sans font-semibold ${apiStatus.firebaseAdminConfigured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {apiStatus.firebaseAdminConfigured ? 'Firestore Admin Connected' : 'Fallback Mode (Ready for Credentials)'}
                      </span>
                    </div>
                    <div>Project ID: {apiStatus.projectId || 'Not set in .env yet'}</div>
                    <div className="mt-1 text-muted-foreground font-sans">Active Records by Collection:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 font-sans">
                      {apiStatus.counts && Object.entries(apiStatus.counts).map(([col, cnt]) => (
                        <div key={col} className="p-2 rounded bg-black/20 text-center">
                          <div className="font-bold text-amber-300 text-sm">{cnt as any}</div>
                          <div className="text-[11px] text-muted-foreground capitalize">{col}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-lg p-3 border border-border text-xs" style={{ background: 'var(--surface2)' }}>
                  <div className="font-bold mb-1 text-foreground flex items-center gap-1.5">
                    <Server size={13} className="text-amber-400" />
                    Available REST API Endpoints:
                  </div>
                  <div className="text-muted-foreground grid grid-cols-1 md:grid-cols-2 gap-1 mt-2 font-mono text-[11px]">
                    <div>GET/POST <span className="text-foreground">/api/properties</span></div>
                    <div>GET/PUT/DELETE <span className="text-foreground">/api/properties/[id]</span></div>
                    <div>GET/POST <span className="text-foreground">/api/assets</span></div>
                    <div>GET/PUT/DELETE <span className="text-foreground">/api/assets/[id]</span></div>
                    <div>GET/POST <span className="text-foreground">/api/maintenance</span></div>
                    <div>GET/PUT/DELETE <span className="text-foreground">/api/maintenance/[id]</span></div>
                    <div>GET/POST <span className="text-foreground">/api/compliance</span></div>
                    <div>GET/POST <span className="text-foreground">/api/insurance</span></div>
                    <div>GET/POST <span className="text-foreground">/api/contracts</span></div>
                    <div>GET/POST <span className="text-foreground">/api/utilities</span></div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Data Export">
                <SettingRow label="Export All Assets" desc="Download complete asset register as Excel">
                  <button className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'var(--primary)', color: '#000' }}>Export Excel</button>
                </SettingRow>
                <SettingRow label="Export Compliance Register" desc="Download all compliance records">
                  <button className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'var(--primary)', color: '#000' }}>Export Excel</button>
                </SettingRow>
                <SettingRow label="Export Maintenance History" desc="Download full maintenance history">
                  <button className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'var(--primary)', color: '#000' }}>Export Excel</button>
                </SettingRow>
              </SectionCard>
              <SectionCard title="Backup">
                <SettingRow label="Automatic Backups" desc="Daily automated data backups">
                  <Toggle checked onChange={() => {}} />
                </SettingRow>
                <SettingRow label="Backup Retention" desc="How long to keep backups">
                  <select className="rounded-lg border border-border px-3 py-1.5 text-sm" style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}>
                    <option>30 days</option>
                    <option>60 days</option>
                    <option>90 days</option>
                  </select>
                </SettingRow>
              </SectionCard>
            </div>
          )}

          {/* Application CMS Active Panels */}
          {activeTab === 'cms-opco' && <PortalCMSEditor portal="opco" initialTabId={initialPage} />}
          {activeTab === 'cms-propco' && <PortalCMSEditor portal="propco" initialTabId={initialPage} />}
          {activeTab === 'cms-pages' && (
            <DeepPageCMSEditor
              initialPage={(initialPage as any) || 'properties'}
              hidePageGrid={false}
            />
          )}
          {activeTab === 'cms-dashboard' && <CompleteAppCMS activeSection="dashboard" />}
          {activeTab === 'cms-recent-logs' && <PortalCMSEditor portal="opco" initialTabId="recent-logs" />}
          {activeTab === 'cms-import' && <PortalCMSEditor portal="opco" initialTabId="import" />}
          {activeTab === 'cms-users' && <PortalCMSEditor portal="opco" initialTabId="users" />}
          {activeTab === 'cms-navigation' && <CompleteAppCMS activeSection="navigation" />}
          {activeTab === 'cms-forms' && <CMSFieldManager />}
        </div>
      </div>
    </div>
  );
}
