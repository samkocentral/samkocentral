'use client';

import React, { useState } from 'react';
import { Settings, Bell, Shield, Building2, Palette, Mail, Database, Save, ChevronRight } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


type SettingsTab = 'general' | 'notifications' | 'security' | 'hotels' | 'appearance' | 'email' | 'data';

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'hotels', label: 'Hotels & Sites', icon: Building2 },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'data', label: 'Data & Backup', icon: Database },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
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
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saved, setSaved] = useState(false);

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
        <div className="w-52 flex-shrink-0 border-r border-border overflow-y-auto" style={{ background: 'var(--surface)', padding: '12px 8px' }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg mb-0.5 text-left transition-colors"
                style={{
                  background: active ? 'rgba(232,201,122,0.12)' : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--text2)',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                }}
              >
                <Icon size={15} />
                <span className="flex-1">{tab.label}</span>
                {active && <ChevronRight size={12} />}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-7">
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
                  <Toggle checked={security.auditLog} onChange={(v) => setSecurity({ ...security, auditLog: v })} />
                </SettingRow>
                <SettingRow label="IP Restriction" desc="Restrict access to specific IP ranges">
                  <Toggle checked={security.ipRestriction} onChange={(v) => setSecurity({ ...security, ipRestriction: v })} />
                </SettingRow>
              </SectionCard>
            </div>
          )}

          {activeTab === 'hotels' && (
            <div>
              <SectionCard title="Registered Hotels">
                {['Crowne Plaza Kingston-south', 'Stanhill Court', 'Hampton 1 & 2', 'Ravents Ait Island', 'River Club'].map((hotel) => (
                  <SettingRow key={hotel} label={hotel} desc="London, UK">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(61,214,140,0.12)', color: '#3dd68c' }}>Active</span>
                  </SettingRow>
                ))}
              </SectionCard>
              <SectionCard title="Hotel Settings">
                <SettingRow label="Allow Cross-Hotel Asset Transfer" desc="Enable moving assets between hotels">
                  <Toggle checked onChange={() => {}} />
                </SettingRow>
                <SettingRow label="Hotel-Level Reporting" desc="Generate separate reports per hotel">
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
            <div>
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
        </div>
      </div>
    </div>
  );
}
