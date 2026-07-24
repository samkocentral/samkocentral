'use client';

import React, { useState } from 'react';
import { Users, Shield, Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, Crown, Eye } from 'lucide-react';

type UserRole = 'super-admin' | 'admin' | 'hotel-manager' | 'engineering-manager' | 'housekeeping-manager' | 'maintenance-engineer' | 'read-only';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hotel: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  initials: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  'super-admin': 'Super Admin',
  'admin': 'Admin',
  'hotel-manager': 'Hotel Manager',
  'engineering-manager': 'Engineering Manager',
  'housekeeping-manager': 'Housekeeping Manager',
  'maintenance-engineer': 'Maintenance Engineer',
  'read-only': 'Read Only Auditor',
};

const ROLE_COLORS: Record<UserRole, string> = {
  'super-admin': '#f43f5e',
  'admin': '#a78bfa',
  'hotel-manager': '#60a5fa',
  'engineering-manager': '#f59e0b',
  'housekeeping-manager': '#3dd68c',
  'maintenance-engineer': '#e8c97a',
  'read-only': '#94a3b8',
};

const MOCK_USERS: User[] = [
  { id: '1', name: 'Group Admin', email: 'admin@samkocentral.com', role: 'super-admin', hotel: 'All Hotels', status: 'active', lastLogin: '2026-07-21', initials: 'GA' },
  { id: '2', name: 'Marcus Webb', email: 'm.webb@crowneplaza.com', role: 'hotel-manager', hotel: 'Crowne Plaza Kingston-south', status: 'active', lastLogin: '2026-07-20', initials: 'MW' },
  { id: '3', name: 'Tom Bradley', email: 't.bradley@stanhill.com', role: 'hotel-manager', hotel: 'Stanhill Court', status: 'active', lastLogin: '2026-07-19', initials: 'TB' },
  { id: '4', name: 'Priya Sharma', email: 'p.sharma@hampton.com', role: 'engineering-manager', hotel: 'Hampton 1 & 2', status: 'active', lastLogin: '2026-07-18', initials: 'PS' },
  { id: '5', name: 'James Okafor', email: 'j.okafor@ravents.com', role: 'maintenance-engineer', hotel: 'Ravents Ait Island', status: 'active', lastLogin: '2026-07-17', initials: 'JO' },
  { id: '6', name: 'Sarah Chen', email: 's.chen@riverclub.com', role: 'housekeeping-manager', hotel: 'River Club', status: 'active', lastLogin: '2026-07-16', initials: 'SC' },
  { id: '7', name: 'David Park', email: 'd.park@samkocentral.com', role: 'read-only', hotel: 'All Hotels', status: 'inactive', lastLogin: '2026-06-30', initials: 'DP' },
  { id: '8', name: 'Rachel Green', email: 'r.green@samkocentral.com', role: 'admin', hotel: 'All Hotels', status: 'active', lastLogin: '2026-07-20', initials: 'RG' },
];

const ROLE_PERMISSIONS: Record<UserRole, { label: string; allowed: boolean }[]> = {
  'super-admin': [
    { label: 'View all modules', allowed: true },
    { label: 'Create & edit assets', allowed: true },
    { label: 'Delete records', allowed: true },
    { label: 'Manage users & roles', allowed: true },
    { label: 'Access settings', allowed: true },
    { label: 'Export data', allowed: true },
    { label: 'Approve maintenance', allowed: true },
  ],
  'admin': [
    { label: 'View all modules', allowed: true },
    { label: 'Create & edit assets', allowed: true },
    { label: 'Delete records', allowed: true },
    { label: 'Manage users & roles', allowed: false },
    { label: 'Access settings', allowed: true },
    { label: 'Export data', allowed: true },
    { label: 'Approve maintenance', allowed: true },
  ],
  'hotel-manager': [
    { label: 'View all modules', allowed: true },
    { label: 'Create & edit assets', allowed: true },
    { label: 'Delete records', allowed: false },
    { label: 'Manage users & roles', allowed: false },
    { label: 'Access settings', allowed: false },
    { label: 'Export data', allowed: true },
    { label: 'Approve maintenance', allowed: true },
  ],
  'engineering-manager': [
    { label: 'View all modules', allowed: true },
    { label: 'Create & edit assets', allowed: true },
    { label: 'Delete records', allowed: false },
    { label: 'Manage users & roles', allowed: false },
    { label: 'Access settings', allowed: false },
    { label: 'Export data', allowed: true },
    { label: 'Approve maintenance', allowed: true },
  ],
  'housekeeping-manager': [
    { label: 'View all modules', allowed: true },
    { label: 'Create & edit assets', allowed: false },
    { label: 'Delete records', allowed: false },
    { label: 'Manage users & roles', allowed: false },
    { label: 'Access settings', allowed: false },
    { label: 'Export data', allowed: false },
    { label: 'Approve maintenance', allowed: false },
  ],
  'maintenance-engineer': [
    { label: 'View all modules', allowed: false },
    { label: 'Create & edit assets', allowed: false },
    { label: 'Delete records', allowed: false },
    { label: 'Manage users & roles', allowed: false },
    { label: 'Access settings', allowed: false },
    { label: 'Export data', allowed: false },
    { label: 'Approve maintenance', allowed: true },
  ],
  'read-only': [
    { label: 'View all modules', allowed: true },
    { label: 'Create & edit assets', allowed: false },
    { label: 'Delete records', allowed: false },
    { label: 'Manage users & roles', allowed: false },
    { label: 'Access settings', allowed: false },
    { label: 'Export data', allowed: false },
    { label: 'Approve maintenance', allowed: false },
  ],
};

export default function UsersClient() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const filtered = MOCK_USERS.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.hotel.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-7 py-4 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <div>
          <h1 className="font-head text-xl font-bold">Users & Roles</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage platform users and configure role permissions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#000' }}>
          <Plus size={14} /> Add User
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-7 pt-4 pb-0 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        {(['users', 'roles'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors"
            style={{
              borderColor: activeTab === tab ? 'var(--primary)' : 'transparent',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text2)',
              marginBottom: -1,
            }}
          >
            {tab === 'users' ? 'Users' : 'Roles & Permissions'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-7">
        {activeTab === 'users' && (
          <div className="flex flex-col gap-5">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: MOCK_USERS.length, color: '#e8c97a' },
                { label: 'Active', value: MOCK_USERS.filter((u) => u.status === 'active').length, color: '#3dd68c' },
                { label: 'Inactive', value: MOCK_USERS.filter((u) => u.status === 'inactive').length, color: '#94a3b8' },
                { label: 'Roles', value: Object.keys(ROLE_LABELS).length, color: '#60a5fa' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border p-4 relative overflow-hidden" style={{ background: 'var(--surface)' }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: stat.color }} />
                  <div className="font-head text-2xl font-extrabold" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-xs font-semibold mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm"
                  style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--surface)' }}>
              <table className="w-full">
                <thead style={{ background: 'var(--surface2)' }}>
                  <tr>
                    {['User', 'Role', 'Hotel / Site', 'Last Login', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-3 border-b border-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr key={user.id} className="border-b border-border" onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs" style={{ background: ROLE_COLORS[user.role] + '22', color: ROLE_COLORS[user.role] }}>
                            {user.initials}
                          </div>
                          <div>
                            <div className="font-medium text-sm flex items-center gap-1">
                              {user.name}
                              {user.role === 'super-admin' && <Crown size={11} style={{ color: '#f43f5e' }} />}
                            </div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: ROLE_COLORS[user.role] + '18', color: ROLE_COLORS[user.role] }}>
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.hotel}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{user.lastLogin}</td>
                      <td className="px-4 py-3">
                        {user.status === 'active' ? (
                          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#3dd68c' }}><CheckCircle2 size={12} /> Active</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#94a3b8' }}><XCircle size={12} /> Inactive</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text2)' }} title="View">
                            <Eye size={13} />
                          </button>
                          <button className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text2)' }} title="Edit">
                            <Edit2 size={13} />
                          </button>
                          {user.role !== 'super-admin' && (
                            <button className="p-1.5 rounded-lg transition-colors" style={{ color: '#f43f5e' }} title="Delete">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="grid gap-5" style={{ gridTemplateColumns: '260px 1fr' }}>
            {/* Role list */}
            <div className="flex flex-col gap-2">
              {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => {
                const count = MOCK_USERS.filter((u) => u.role === role).length;
                return (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                    style={{
                      background: selectedRole === role ? 'rgba(232,201,122,0.08)' : 'var(--surface)',
                      borderColor: selectedRole === role ? 'var(--primary)' : 'var(--border)',
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: ROLE_COLORS[role] + '18' }}>
                      <Shield size={14} style={{ color: ROLE_COLORS[role] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{ROLE_LABELS[role]}</div>
                      <div className="text-xs text-muted-foreground">{count} user{count !== 1 ? 's' : ''}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Permissions panel */}
            {selectedRole ? (
              <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--surface)' }}>
                <div className="px-5 py-4 border-b border-border flex items-center gap-3" style={{ background: 'var(--surface2)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: ROLE_COLORS[selectedRole] + '18' }}>
                    <Shield size={15} style={{ color: ROLE_COLORS[selectedRole] }} />
                  </div>
                  <div>
                    <div className="font-head font-bold text-sm">{ROLE_LABELS[selectedRole]}</div>
                    <div className="text-xs text-muted-foreground">{MOCK_USERS.filter((u) => u.role === selectedRole).length} users assigned</div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Permissions</div>
                  <div className="flex flex-col gap-2">
                    {ROLE_PERMISSIONS[selectedRole].map((perm) => (
                      <div key={perm.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <span className="text-sm">{perm.label}</span>
                        {perm.allowed ? (
                          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#3dd68c' }}><CheckCircle2 size={13} /> Allowed</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#94a3b8' }}><XCircle size={13} /> Denied</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Users with this role</div>
                    <div className="flex flex-wrap gap-2">
                      {MOCK_USERS.filter((u) => u.role === selectedRole).map((u) => (
                        <div key={u.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-xs" style={{ background: 'var(--surface2)' }}>
                          <div className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: ROLE_COLORS[selectedRole] + '22', color: ROLE_COLORS[selectedRole], fontSize: 8 }}>
                            {u.initials}
                          </div>
                          {u.name}
                        </div>
                      ))}
                      {MOCK_USERS.filter((u) => u.role === selectedRole).length === 0 && (
                        <span className="text-xs text-muted-foreground">No users assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border flex items-center justify-center" style={{ background: 'var(--surface)', minHeight: 300 }}>
                <div className="text-center">
                  <Shield size={32} className="mx-auto mb-3 text-muted-foreground" />
                  <div className="text-sm font-medium">Select a role to view permissions</div>
                  <div className="text-xs text-muted-foreground mt-1">Click any role on the left</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
