'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  Crown,
  Eye,
  Edit2,
  Key,
  Copy,
  Lock,
  Building2,
  UploadCloud,
  Check,
  X,
  AlertCircle,
  Loader2,
  Activity,
  Download,
  Filter,
  Clock,
  RefreshCw,
  FileSpreadsheet,
  Globe,
  Laptop,
  Layers,
  ArrowRight,
  FileText,
  AlertTriangle,
  SlidersHorizontal,
  LogIn,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth, type RoleLevel, type PortalType, type AppUser } from '@/lib/authContext';
import { getAppCmsConfig } from '@/lib/appCmsConfig';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';
import TabPermissionsEditor from '@/components/users/TabPermissionsEditor';
import { useDeepPageCms } from '@/lib/deepPageCms';
import PageCMSEditButton from '@/components/cms/PageCMSEditButton';
import LoadingPagination from '@/components/ui/LoadingPagination';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import { getLivePropertyNames } from '@/hooks/useLiveProperties';
import TableCheckbox from '@/components/ui/TableCheckbox';
import BulkActionBar from '@/components/ui/BulkActionBar';
import { useLoadingPagination } from '@/hooks/useLoadingPagination';
import {
  ALL_SYSTEM_TABS,
  type UserTabPermissions,
  type TabAccessMode,
  getDefaultTabPermissionsForRole,
  getRoleTabPermissions,
  saveRoleTabPermissions,
} from '@/lib/permissions';
import {
  type AuditLogEntry,
  INITIAL_AUDIT_LOGS,
  recordAuditLog,
  ACTION_STYLES,
  STATUS_STYLES,
  exportAuditLogsToCSV,
} from '@/data/auditLogsData';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password?: string;
  roleLevel: RoleLevel;
  roleTitle: string;
  portal: PortalType;
  hotel: string;
  assignedProperties?: string[];
  status: 'active' | 'inactive';
  lastLogin: string;
  initials: string;
  description?: string;
  tabPermissions?: UserTabPermissions;
}

export const ASSIGNED_PROPERTY_OPTIONS = [
  { value: 'All Properties', label: 'All Properties (Portfolio-wide)' },
  { value: 'Crowne Plaza Kingston-south', label: 'Crowne Plaza Kingston-south' },
  { value: 'Stanhill Court', label: 'Stanhill Court' },
  { value: 'Hampton 1 & 2', label: 'Hotel Hampton 1 & Hampton 2 Property' },
  { value: 'Ravens Ait Island', label: 'Ravens Ait Island' },
  { value: 'River Club', label: 'River Club' },
  { value: 'Warren House', label: 'Warren House' },
  { value: 'Gatwick Manor (Stanhill Court)', label: 'Gatwick Manor (Stanhill Court)' },
  { value: 'Sharnbrook', label: 'Sharnbrook' },
];

const BASE_ROLE_LEVEL_CONFIG: Record<
  RoleLevel,
  { label: string; title: string; color: string; badgeBg: string; desc: string }
> = {
  L1: {
    label: 'L1 – Super Admin',
    title: 'Super Admin',
    color: '#f43f5e',
    badgeBg: 'rgba(244,63,94,0.14)',
    desc: 'Full access across both the Propco and Opco portals, including system settings and managing all users',
  },
  L2: {
    label: 'L2 – Admin',
    title: 'Admin',
    color: '#a78bfa',
    badgeBg: 'rgba(167,139,250,0.14)',
    desc: 'Full access within their assigned portal, including adding and removing users at L3 and L4',
  },
  L3: {
    label: 'L3 – Uploader',
    title: 'Uploader',
    color: '#10b981',
    badgeBg: 'rgba(16,185,129,0.14)',
    desc: 'Can upload and update documents and records for their assigned properties',
  },
  L4: {
    label: 'L4 – Viewer',
    title: 'Viewer',
    color: '#94a3b8',
    badgeBg: 'rgba(148,163,184,0.14)',
    desc: 'Read-only access to their assigned properties (cannot edit or delete)',
  },
};

function getDynamicRoleConfig(level: RoleLevel) {
  const base = BASE_ROLE_LEVEL_CONFIG[level] || BASE_ROLE_LEVEL_CONFIG.L4;
  if (typeof window === 'undefined') return base;
  try {
    const cms = getAppCmsConfig();
    const cmsRole = cms?.roles?.find((r) => r.roleLevel === level);
    if (!cmsRole) return base;
    return {
      label: `${level} – ${cmsRole.title || base.title}`,
      title: cmsRole.title || base.title,
      color: cmsRole.badgeColor || base.color,
      badgeBg: cmsRole.badgeColor ? `${cmsRole.badgeColor}22` : base.badgeBg,
      desc: cmsRole.description || base.desc,
    };
  } catch {
    return base;
  }
}

const ROLE_LEVEL_CONFIG = new Proxy(BASE_ROLE_LEVEL_CONFIG as any, {
  get(target, prop: string) {
    if (prop === 'L1' || prop === 'L2' || prop === 'L3' || prop === 'L4') {
      return getDynamicRoleConfig(prop as RoleLevel);
    }
    return target[prop];
  },
}) as Record<
  RoleLevel,
  { label: string; title: string; color: string; badgeBg: string; desc: string }
>;

const PERMISSION_MATRIX: Record<RoleLevel, { label: string; allowed: boolean; detail: string }[]> =
  {
    L1: [
      {
        label: 'Propco Portal Access',
        allowed: true,
        detail: 'Full asset owner oversight & registers',
      },
      { label: 'Opco Portal Access', allowed: true, detail: 'Full hotel operations & facilities' },
      {
        label: 'System Configuration & Settings',
        allowed: true,
        detail: 'Access to /settings and platform controls',
      },
      {
        label: 'Manage All Users (L1 to L4)',
        allowed: true,
        detail: 'Can add, edit, or delete any tier',
      },
      {
        label: 'Upload & Update Records',
        allowed: true,
        detail: 'Assets, maintenance, compliance, bulk Excel',
      },
      { label: 'Delete Records', allowed: true, detail: 'Permitted across all collections' },
      { label: 'Export Reports & Data', allowed: true, detail: 'Excel, CSV, and summary exports' },
    ],
    L2: [
      {
        label: 'Assigned Portal Access',
        allowed: true,
        detail: 'Propco or Opco depending on assignment',
      },
      {
        label: 'Opposite Portal Access',
        allowed: false,
        detail: 'Restricted strictly to assigned portal',
      },
      {
        label: 'System Configuration & Settings',
        allowed: false,
        detail: 'Global settings reserved for Super Admin',
      },
      {
        label: 'Manage L3 Uploaders & L4 Viewers',
        allowed: true,
        detail: 'Can add/remove L3 and L4 within portal',
      },
      {
        label: 'Upload & Update Records',
        allowed: true,
        detail: 'Full edit rights within assigned portal',
      },
      {
        label: 'Delete Records',
        allowed: true,
        detail: 'Can delete operational records in portal',
      },
      { label: 'Export Reports & Data', allowed: true, detail: 'Full reporting export rights' },
    ],
    L3: [
      { label: 'Assigned Portal Access', allowed: true, detail: 'Limited to assigned properties' },
      {
        label: 'Upload Documents & Excel Files',
        allowed: true,
        detail: 'Drag & drop Excel import, certificates',
      },
      {
        label: 'Update Asset & Maintenance Records',
        allowed: true,
        detail: 'Record PPMs, update conditions',
      },
      { label: 'Delete Records', allowed: false, detail: 'Record deletion strictly prohibited' },
      { label: 'Manage Users & Roles', allowed: false, detail: 'No user administration rights' },
      { label: 'System Settings Access', allowed: false, detail: 'Settings menu hidden' },
      {
        label: 'Export Assigned Property Data',
        allowed: true,
        detail: 'Can download templates and exports',
      },
    ],
    L4: [
      {
        label: 'Read-Only View of Assigned Properties',
        allowed: true,
        detail: 'View assets, contracts, compliance',
      },
      {
        label: 'Upload Documents & Files',
        allowed: false,
        detail: 'Upload buttons hidden / restricted',
      },
      { label: 'Create or Edit Records', allowed: false, detail: 'Action buttons disabled' },
      { label: 'Delete Records', allowed: false, detail: 'No deletion privileges' },
      { label: 'Manage Users & Roles', allowed: false, detail: 'No access to user administration' },
      { label: 'System Settings Access', allowed: false, detail: 'Settings menu hidden' },
      { label: 'View Audit Logs & Reports', allowed: true, detail: 'Auditor inspection rights' },
    ],
  };

export default function UsersClient() {
  const cms = useDeepPageCms('users');
  const {
    user: currentAuthUser,
    isSuperAdmin,
    isAdmin,
    canManageUsers,
    updateUserTabPermissions,
    isDigitalBot,
    isViewer,
    switchUser,
  } = useAuth();

  const isBotAccount = useCallback(
    (u: any) =>
      Boolean(
        u &&
        (u.id === 'usr-bot-001' ||
          u.email?.toLowerCase() === 'digitalbot@samkocentral.com' ||
          u.name?.toLowerCase().includes('digital bot'))
      ),
    []
  );

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'permissions' | 'roles' | 'audit'>('users');
  const [search, setSearch] = useState('');
  const [userToDelete, setUserToDelete] = useState<UserRecord | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [selectedRoleLevel, setSelectedRoleLevel] = useState<RoleLevel>('L1');
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  // Quick Tab Permissions Modal State
  const [permissionsModalUser, setPermissionsModalUser] = useState<UserRecord | null>(null);
  const [tempModalPermissions, setTempModalPermissions] = useState<UserTabPermissions>({});
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Quick Property Assignment Modal State
  const [propertyModalUser, setPropertyModalUser] = useState<UserRecord | null>(null);
  const [tempAssignedProperties, setTempAssignedProperties] = useState<string[]>([]);
  const [propertyRemovalConfirm, setPropertyRemovalConfirm] = useState<{
    user: UserRecord;
    property: string;
    onConfirmOverride?: () => void;
  } | null>(null);
  const [newCustomPropertyInput, setNewCustomPropertyInput] = useState('');
  const [newEditCustomPropertyInput, setNewEditCustomPropertyInput] = useState('');
  const [newAddCustomPropertyInput, setNewAddCustomPropertyInput] = useState('');
  const [savingUserProperties, setSavingUserProperties] = useState(false);
  const recentlyUpdatedUsers = useRef<Map<string, { user: UserRecord; timestamp: number }>>(
    new Map()
  );
  const [systemProperties, setSystemProperties] = useState<string[]>(() => getLivePropertyNames());
  const [customProperties, setCustomProperties] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('samko_custom_properties');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  // Dedicated Tab Matrix Selected User ID
  const [matrixSelectedUserId, setMatrixSelectedUserId] = useState<string>('');

  // Role Tab Permissions View Mode & Sync State
  const [roleViewMode, setRoleViewMode] = useState<'tabs' | 'capabilities'>('tabs');
  const [applyingRoleToUsers, setApplyingRoleToUsers] = useState<boolean>(false);

  const handleSyncUsersInRole = async (targetRole: string, perms: UserTabPermissions) => {
    const matching = users.filter((u) => u.roleLevel === targetRole);
    setUsers((prev) =>
      prev.map((u) => (u.roleLevel === targetRole ? { ...u, tabPermissions: perms } : u))
    );
    if (currentAuthUser.roleLevel === targetRole) {
      updateUserTabPermissions(perms);
    }
    if (matching.length > 0) {
      await Promise.allSettled(
        matching.map((u) => api.users.update(u.id, { tabPermissions: perms }))
      );
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('samko:permissions-changed', { detail: { permissions: perms } })
      );
    }
  };

  const handleAssignTabToAllUsers = async (tabId: string, accessLevel: TabAccessMode) => {
    setUsers((prev) =>
      prev.map((u) => {
        const existing = u.tabPermissions || getDefaultTabPermissionsForRole(u.roleLevel);
        return {
          ...u,
          tabPermissions: { ...existing, [tabId]: { enabled: true, accessLevel } },
        };
      })
    );
    if (currentAuthUser) {
      const existing =
        currentAuthUser.tabPermissions ||
        getDefaultTabPermissionsForRole(currentAuthUser.roleLevel);
      updateUserTabPermissions({ ...existing, [tabId]: { enabled: true, accessLevel } });
    }
    await Promise.allSettled(
      users.map((u) => {
        const existing = u.tabPermissions || getDefaultTabPermissionsForRole(u.roleLevel);
        return api.users.update(u.id, {
          tabPermissions: { ...existing, [tabId]: { enabled: true, accessLevel } },
        });
      })
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:permissions-changed'));
    }
  };

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategory, setAuditCategory] = useState<string>('ALL');
  const [auditRoleFilter, setAuditRoleFilter] = useState<string>('ALL');
  const [auditStatusFilter, setAuditStatusFilter] = useState<string>('ALL');
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogEntry | null>(null);
  const [refreshingAudit, setRefreshingAudit] = useState(false);

  // Support direct deep link via ?tab=permissions, ?tab=audit, or ?tab=roles
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'permissions' || tabParam === 'matrix') {
        setActiveTab('permissions');
      } else if (tabParam === 'audit' || tabParam === 'logs') {
        setActiveTab('audit');
      } else if (tabParam === 'roles') {
        setActiveTab('roles');
      }
    }
  }, []);

  // View modal state
  const [viewingUser, setViewingUser] = useState<UserRecord | null>(null);

  // Edit modal state
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string;
    email: string;
    password: string;
    roleLevel: RoleLevel;
    portal: PortalType;
    hotel: string;
    assignedProperties: string[];
    status: 'active' | 'inactive';
    tabPermissions?: UserTabPermissions;
  }>({
    name: '',
    email: '',
    password: '',
    roleLevel: 'L3',
    portal: 'opco',
    hotel: 'Crowne Plaza Kingston-south',
    assignedProperties: ['Crowne Plaza Kingston-south'],
    status: 'active',
    tabPermissions: getDefaultTabPermissionsForRole('L3'),
  });

  // New user form state
  const [newUser, setNewUser] = useState<{
    name: string;
    email: string;
    password: string;
    roleLevel: RoleLevel;
    portal: PortalType;
    hotel: string;
    assignedProperties: string[];
    tabPermissions?: UserTabPermissions;
  }>({
    name: '',
    email: '',
    password: 'User2026!',
    roleLevel: isSuperAdmin ? 'L2' : 'L3',
    portal: currentAuthUser.portal === 'propco' ? 'propco' : 'opco',
    hotel: 'Crowne Plaza Kingston-south',
    assignedProperties: ['Crowne Plaza Kingston-south'],
    tabPermissions: getDefaultTabPermissionsForRole(isSuperAdmin ? 'L2' : 'L3'),
  });

  const saveCustomProperty = useCallback((propName: string) => {
    const clean = propName.trim();
    if (!clean || clean.toLowerCase().startsWith('all')) return;
    setCustomProperties((prev) => {
      if (prev.some((p) => p.toLowerCase() === clean.toLowerCase())) return prev;
      const updated = [...prev, clean];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('samko_custom_properties', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  }, []);

  const dynamicPropertyOptions = useMemo(() => {
    const set = new Set<string>();

    ASSIGNED_PROPERTY_OPTIONS.forEach((opt) => {
      if (opt.value && !opt.value.toLowerCase().startsWith('all')) {
        set.add(opt.value.trim());
      }
    });

    systemProperties.forEach((p) => {
      if (p && !p.toLowerCase().startsWith('all')) {
        set.add(p.trim());
      }
    });

    customProperties.forEach((p) => {
      if (p && !p.toLowerCase().startsWith('all')) {
        set.add(p.trim());
      }
    });

    users.forEach((u) => {
      (u.assignedProperties || []).forEach((p) => {
        if (p && !p.toLowerCase().startsWith('all') && p !== 'No Property Assigned') {
          set.add(p.trim());
        }
      });
    });

    const items = Array.from(set)
      .sort()
      .map((name) => ({
        value: name,
        label: name,
      }));

    return [{ value: 'All Properties', label: 'All Properties (Portfolio-wide)' }, ...items];
  }, [systemProperties, customProperties, users]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const [res, propsRes] = await Promise.allSettled([
        api.users.getAll(),
        api.properties.getAll(),
      ]);

      if (
        propsRes.status === 'fulfilled' &&
        propsRes.value.success &&
        Array.isArray(propsRes.value.data)
      ) {
        const propNames = propsRes.value.data
          .map((p: any) => p.name || p.propertyName || p.hotelName)
          .filter(Boolean);
        setSystemProperties(propNames);
      }

      if (
        res.status === 'fulfilled' &&
        res.value.success &&
        res.value.data &&
        res.value.data.length > 0
      ) {
        // Normalize role levels and tab permissions
        const normalized: UserRecord[] = res.value.data.map((u: any) => {
          let roleLevel: RoleLevel = u.roleLevel;
          if (!roleLevel) {
            if (u.role === 'super-admin') roleLevel = 'L1';
            else if (u.role === 'admin') roleLevel = 'L2';
            else if (u.role === 'read-only') roleLevel = 'L4';
            else roleLevel = 'L3';
          }
          const roleTitle = u.roleTitle || ROLE_LEVEL_CONFIG[roleLevel].title;

          let assignedProps: string[] = [];
          if (Array.isArray(u.assignedProperties)) {
            assignedProps = u.assignedProperties.filter(
              (p: string) => p && p !== 'No Property Assigned'
            );
          } else if (u.hotel && u.hotel !== 'No Property Assigned') {
            assignedProps = u.hotel.includes(',')
              ? u.hotel
                  .split(',')
                  .map((s: string) => s.trim())
                  .filter(Boolean)
              : [u.hotel.trim()];
          } else {
            assignedProps = [];
          }

          const finalHotel =
            assignedProps.length === 0
              ? 'No Property Assigned'
              : assignedProps.includes('all') || assignedProps.includes('All Properties')
                ? 'All Properties'
                : assignedProps.join(', ');

          const rawUser: UserRecord = {
            id:
              u.id ||
              (u.email
                ? `usr-${u.email.split('@')[0]}`
                : `usr-${Math.random().toString(36).slice(2, 8)}`),
            name: u.name || 'Unnamed User',
            email: u.email,
            password: u.password || `${roleTitle.replace(/\s+/g, '')}2026!`,
            roleLevel,
            roleTitle,
            portal: u.portal || (roleLevel === 'L1' ? 'both' : 'opco'),
            hotel: finalHotel,
            assignedProperties: assignedProps,
            status: u.status || 'active',
            lastLogin: u.lastLogin || '2026-07-21',
            initials: u.initials || u.name?.slice(0, 2).toUpperCase() || 'US',
            description: u.description || ROLE_LEVEL_CONFIG[roleLevel].desc,
            tabPermissions: u.tabPermissions || getDefaultTabPermissionsForRole(roleLevel),
          };

          // Protect recent optimistic updates from being overwritten by stale re-fetches
          const recent =
            (rawUser.id ? recentlyUpdatedUsers.current.get(rawUser.id) : null) ||
            (rawUser.email
              ? recentlyUpdatedUsers.current.get(rawUser.email.toLowerCase().trim())
              : null);

          if (recent && Date.now() - recent.timestamp < 20000) {
            return {
              ...rawUser,
              hotel: recent.user.hotel,
              assignedProperties: recent.user.assignedProperties,
            };
          }

          return rawUser;
        });
        const visible = isDigitalBot ? normalized : normalized.filter((u) => !isBotAccount(u));
        setUsers(visible);
        if (!matrixSelectedUserId && visible.length > 0) {
          setMatrixSelectedUserId(visible[0].id);
        } else if (!isDigitalBot && isBotAccount({ id: matrixSelectedUserId })) {
          setMatrixSelectedUserId(visible[0]?.id || '');
        }
      }
    } catch (e) {
      console.warn('Users live fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [matrixSelectedUserId, isDigitalBot, isBotAccount]);

  useEffect(() => {
    fetchUsers();
    const handleDataChanged = () => fetchUsers();
    window.addEventListener('samko:data-changed', handleDataChanged);
    return () => window.removeEventListener('samko:data-changed', handleDataChanged);
  }, [fetchUsers]);

  const handleToggleStatus = async (targetUser: UserRecord) => {
    if (isBotAccount(targetUser) && !isDigitalBot) {
      toast.error('Permission denied', {
        description: 'Super Admin cannot modify the Digital Bot account',
      });
      return;
    }
    // Permission check: L2 Admin cannot modify L1 Super Admin
    if (targetUser.roleLevel === 'L1' && !isSuperAdmin && !isDigitalBot) {
      toast.error('Permission denied', { description: 'Only Super Admins can modify L1 users' });
      return;
    }

    const newStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, status: newStatus } : u)));
    toast.success(`User set to ${newStatus}`, { description: targetUser.name });

    try {
      await api.users.update(targetUser.id, { status: newStatus });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'users' } }));
      }
    } catch (e) {
      console.error('Failed to sync user status:', e);
    }
  };

  const openPropertyModal = (targetUser: UserRecord) => {
    const liveUser = users.find((u) => u.id === targetUser.id) || targetUser;
    const current = Array.isArray(liveUser.assignedProperties)
      ? liveUser.assignedProperties.filter((p) => p && p !== 'No Property Assigned')
      : liveUser.hotel && liveUser.hotel !== 'No Property Assigned'
        ? liveUser.hotel.includes(',')
          ? liveUser.hotel
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [liveUser.hotel.trim()]
        : [];
    setPropertyModalUser(liveUser);
    setTempAssignedProperties(current);
    setNewCustomPropertyInput('');
  };

  const handleUpdateUserProperties = async (targetUser: UserRecord, newProperties: string[]) => {
    if (isBotAccount(targetUser) && !isDigitalBot) {
      toast.error('Permission denied', { description: 'Cannot modify the Digital Bot account' });
      return;
    }
    if (targetUser.roleLevel === 'L1' && !isSuperAdmin && !isDigitalBot) {
      toast.error('Permission denied', { description: 'Only Super Admins can edit L1 accounts' });
      return;
    }
    if (targetUser.roleLevel === 'L2' && !isSuperAdmin && !isDigitalBot) {
      toast.error('Permission denied', { description: 'Only Super Admins can edit L2 accounts' });
      return;
    }

    setSavingUserProperties(true);
    const finalAssigned = newProperties.filter(Boolean).filter((p) => p !== 'No Property Assigned');
    const finalHotel =
      finalAssigned.length === 0
        ? 'No Property Assigned'
        : finalAssigned.includes('all') || finalAssigned.includes('All Properties')
          ? 'All Properties'
          : finalAssigned.join(', ');

    const updatedUser: UserRecord = {
      ...targetUser,
      hotel: finalHotel,
      assignedProperties: finalAssigned,
    };

    // Keep in recent cache to prevent stale re-fetches from reverting
    if (targetUser.id) {
      recentlyUpdatedUsers.current.set(targetUser.id, { user: updatedUser, timestamp: Date.now() });
    }
    if (targetUser.email) {
      recentlyUpdatedUsers.current.set(targetUser.email.toLowerCase().trim(), {
        user: updatedUser,
        timestamp: Date.now(),
      });
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetUser.id ||
        (u.email && targetUser.email && u.email.toLowerCase() === targetUser.email.toLowerCase())
          ? updatedUser
          : u
      )
    );
    toast.success(`Updated properties for ${targetUser.name}`, {
      description: `Assigned: ${finalHotel}`,
    });

    try {
      const stored = localStorage.getItem('samko_auth_user');
      const isCurrentSessionUser =
        targetUser.id === currentAuthUser.id ||
        targetUser.email?.toLowerCase().trim() === currentAuthUser.email?.toLowerCase().trim() ||
        (stored &&
          (JSON.parse(stored).id === targetUser.id ||
            JSON.parse(stored).email?.toLowerCase().trim() ===
              targetUser.email?.toLowerCase().trim()));

      if (isCurrentSessionUser) {
        const fullAuthUser = {
          ...currentAuthUser,
          ...updatedUser,
          hotel: finalHotel,
          assignedProperties: finalAssigned,
        };
        localStorage.setItem('samko_auth_user', JSON.stringify(fullAuthUser));
        window.dispatchEvent(
          new CustomEvent('samko:user-changed', { detail: { user: fullAuthUser } })
        );
      }
      localStorage.setItem('samko_last_user_update', String(Date.now()));
    } catch {}

    // Append to live audit logs
    const auditEvent: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      relativeTime: 'Just now',
      actorName: currentAuthUser.name || 'Administrator',
      actorEmail: currentAuthUser.email || 'info@samko.co.uk',
      actorInitials: currentAuthUser.initials || 'AS',
      roleLevel: currentAuthUser.roleLevel || 'L1',
      action: 'UPDATE',
      actionLabel: 'Property Assignment Updated',
      category: 'USER_MANAGEMENT',
      categoryLabel: 'User Management',
      resource: `User: ${targetUser.email}`,
      ipAddress: '86.154.21.90',
      location: 'London, UK (Active Session)',
      status: 'success',
      details: `Updated assigned properties for ${targetUser.name} to "${finalHotel}".`,
    };
    setAuditLogs((prev) => [auditEvent, ...prev]);
    try {
      recordAuditLog(auditEvent);
    } catch {}

    try {
      await api.users.update(targetUser.id || targetUser.email, updatedUser);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'users' } }));
      }
    } catch (err) {
      console.error('Failed to sync updated user properties:', err);
    } finally {
      setSavingUserProperties(false);
    }
  };

  const handleRemovePropertyFromUser = (targetUser: UserRecord, propertyToRemove: string) => {
    const liveUser = users.find((u) => u.id === targetUser.id) || targetUser;
    const currentProps = Array.isArray(liveUser.assignedProperties)
      ? liveUser.assignedProperties.filter((p) => p && p !== 'No Property Assigned')
      : liveUser.hotel && liveUser.hotel !== 'No Property Assigned'
        ? liveUser.hotel.includes(',')
          ? liveUser.hotel
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [liveUser.hotel.trim()]
        : [];

    const updatedProps = currentProps.filter(
      (p) => p !== propertyToRemove && p.toLowerCase() !== propertyToRemove.toLowerCase()
    );
    handleUpdateUserProperties(liveUser, updatedProps);
  };

  const handleAddPropertyToUser = (targetUser: UserRecord, propertyToAdd: string) => {
    const clean = propertyToAdd.trim();
    if (!clean) return;
    saveCustomProperty(clean);

    const liveUser = users.find((u) => u.id === targetUser.id) || targetUser;
    const currentProps = Array.isArray(liveUser.assignedProperties)
      ? liveUser.assignedProperties.filter((p) => p && p !== 'No Property Assigned')
      : liveUser.hotel && liveUser.hotel !== 'No Property Assigned'
        ? liveUser.hotel.includes(',')
          ? liveUser.hotel
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [liveUser.hotel.trim()]
        : [];
    targetUser.assignedProperties && targetUser.assignedProperties.length > 0
      ? targetUser.assignedProperties.filter(
          (p) => !p.toLowerCase().startsWith('all') && p !== 'No Property Assigned'
        )
      : targetUser.hotel &&
          !targetUser.hotel.toLowerCase().startsWith('all') &&
          targetUser.hotel !== 'No Property Assigned'
        ? targetUser.hotel.includes(',')
          ? targetUser.hotel.split(',').map((s) => s.trim())
          : [targetUser.hotel]
        : [];

    if (currentProps.some((p) => p.toLowerCase() === clean.toLowerCase())) {
      toast.info(`"${clean}" is already assigned to ${targetUser.name}`);
      return;
    }

    const updatedProps = [...currentProps, clean];
    handleUpdateUserProperties(targetUser, updatedProps);
  };

  const handleDeleteUser = async (targetUser: UserRecord) => {
    if (isBotAccount(targetUser)) {
      toast.error('Permission denied', {
        description: 'The Digital Bot account is protected and cannot be deleted',
      });
      return;
    }
    // Permission check
    if (targetUser.roleLevel === 'L1' && !isDigitalBot) {
      toast.error('Cannot delete Super Admin account', {
        description: 'Only Digital Bot has master authority to remove Super Admin accounts.',
      });
      return;
    }
    if (targetUser.roleLevel === 'L2' && !isSuperAdmin && !isDigitalBot) {
      toast.error('Permission denied', { description: 'Only Super Admins can remove L2 Admins' });
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
    toast.success('User deleted', { description: targetUser.name });

    // Append to live audit logs
    const auditEvent: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      relativeTime: 'Just now',
      actorName: currentAuthUser.name || 'Administrator',
      actorEmail: currentAuthUser.email || 'info@samko.co.uk',
      actorInitials: currentAuthUser.initials || 'AS',
      roleLevel: currentAuthUser.roleLevel || 'L1',
      action: 'DELETE',
      actionLabel: 'User Deleted',
      category: 'USER_MANAGEMENT',
      categoryLabel: 'User Management',
      resource: `User: ${targetUser.email} (${targetUser.name})`,
      ipAddress: '86.154.21.90',
      location: 'London, UK (Active Session)',
      status: 'warning',
      details: `Permanently removed account ${targetUser.name} (${targetUser.roleLevel} - ${targetUser.roleTitle}) from directory.`,
    };
    setAuditLogs((prev) => [auditEvent, ...prev]);
    try {
      recordAuditLog(auditEvent);
    } catch {}

    try {
      await api.users.delete(targetUser.id);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'users' } }));
      }
    } catch (e) {
      console.error('Failed to delete user:', e);
    }
  };

  const handleStartEdit = (user: UserRecord) => {
    if (isBotAccount(user) && !isDigitalBot) {
      toast.error('Permission denied', {
        description: 'Super Admin cannot edit the Digital Bot account',
      });
      return;
    }
    // Permission guard: L2 cannot edit L1
    if (user.roleLevel === 'L1' && !isSuperAdmin && !isDigitalBot) {
      toast.error('Permission denied', { description: 'Only Super Admins can edit L1 accounts' });
      return;
    }
    if (user.roleLevel === 'L2' && !isSuperAdmin && !isDigitalBot) {
      toast.error('Permission denied', {
        description: 'Only Super Admins can edit L2 Admin accounts',
      });
      return;
    }

    const userAssigned = Array.isArray(user.assignedProperties)
      ? user.assignedProperties.filter((p) => p && p !== 'No Property Assigned')
      : user.hotel && user.hotel !== 'No Property Assigned'
        ? user.hotel.includes(',')
          ? user.hotel
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [user.hotel.trim()]
        : [];

    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      password: user.password || 'User2026!',
      roleLevel: user.roleLevel,
      portal: user.portal,
      hotel: user.hotel,
      assignedProperties: userAssigned,
      status: user.status,
      tabPermissions: user.tabPermissions || getDefaultTabPermissionsForRole(user.roleLevel),
    });
  };

  const handleOpenPermissionsModal = (user: UserRecord) => {
    setPermissionsModalUser(user);
    setTempModalPermissions(user.tabPermissions || getDefaultTabPermissionsForRole(user.roleLevel));
  };

  const handleSaveModalPermissions = async () => {
    if (!isSuperAdmin && !isDigitalBot) {
      toast.error('Permission Denied', {
        description: 'Only Super Admins (L1) or Digital Bot can modify tab permissions',
      });
      return;
    }
    if (!permissionsModalUser) return;
    setSavingPermissions(true);

    const updatedUser: UserRecord = {
      ...permissionsModalUser,
      tabPermissions: tempModalPermissions,
    };

    setUsers((prev) => prev.map((u) => (u.id === permissionsModalUser.id ? updatedUser : u)));
    toast.success(`Tab permissions updated for ${permissionsModalUser.name}!`, {
      description: 'Tab access levels & visibility updated across the platform',
    });

    if (permissionsModalUser.id === currentAuthUser.id) {
      updateUserTabPermissions(tempModalPermissions);
    }

    // Append to live audit logs
    const auditEvent: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      relativeTime: 'Just now',
      actorName: currentAuthUser.name || 'Administrator',
      actorEmail: currentAuthUser.email || 'info@samko.co.uk',
      actorInitials: currentAuthUser.initials || 'AS',
      roleLevel: currentAuthUser.roleLevel || 'L1',
      action: 'UPDATE',
      actionLabel: 'Tab Permissions Updated',
      category: 'USER_MANAGEMENT',
      categoryLabel: 'User Management',
      resource: `User: ${permissionsModalUser.email}`,
      ipAddress: '86.154.21.90',
      location: 'London, UK (Active Session)',
      status: 'success',
      details: `Updated tab-level enable/disable switches and access levels (Read Only vs Edit & Write) for ${permissionsModalUser.name}.`,
    };
    setAuditLogs((prev) => [auditEvent, ...prev]);
    try {
      recordAuditLog(auditEvent);
    } catch {}

    try {
      await api.users.update(permissionsModalUser.id, { tabPermissions: tempModalPermissions });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'users' } }));
        window.dispatchEvent(
          new CustomEvent('samko:permissions-changed', {
            detail: { permissions: tempModalPermissions },
          })
        );
      }
    } catch (e) {
      console.error('Failed to sync permissions:', e);
    } finally {
      setSavingPermissions(false);
      setPermissionsModalUser(null);
    }
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editForm.name.trim() || !editForm.email.trim()) {
      toast.error('Please enter name and email');
      return;
    }

    setSavingEdit(true);
    const roleConfig = ROLE_LEVEL_CONFIG[editForm.roleLevel];
    const initials =
      editForm.name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'US';

    const tabPerms =
      editForm.tabPermissions ||
      editingUser.tabPermissions ||
      getDefaultTabPermissionsForRole(editForm.roleLevel);

    const finalAssigned =
      editForm.assignedProperties && editForm.assignedProperties.length > 0
        ? editForm.assignedProperties
        : editForm.hotel && editForm.hotel !== 'No Property Assigned'
          ? [editForm.hotel]
          : [];
    const finalHotel =
      finalAssigned.length === 0
        ? 'No Property Assigned'
        : finalAssigned.includes('all') || finalAssigned.includes('All Properties')
          ? 'All Properties'
          : finalAssigned.join(', ');

    const updatedUser: UserRecord = {
      ...editingUser,
      name: editForm.name.trim(),
      email: editForm.email.trim().toLowerCase(),
      password: editForm.password,
      roleLevel: editForm.roleLevel,
      roleTitle: roleConfig.title,
      portal: editForm.portal,
      hotel: finalHotel,
      assignedProperties: finalAssigned,
      status: editForm.status,
      initials: initials || editingUser.initials,
      description: roleConfig.desc,
      tabPermissions: tabPerms,
    };

    setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updatedUser : u)));
    toast.success(`User ${updatedUser.name} updated!`);
    setEditingUser(null);
    setSavingEdit(false);

    try {
      const stored = localStorage.getItem('samko_auth_user');
      const isCurrentSessionUser =
        editingUser.id === currentAuthUser.id ||
        editingUser.email?.toLowerCase().trim() === currentAuthUser.email?.toLowerCase().trim() ||
        (stored &&
          (JSON.parse(stored).id === editingUser.id ||
            JSON.parse(stored).email?.toLowerCase().trim() ===
              editingUser.email?.toLowerCase().trim()));

      if (isCurrentSessionUser) {
        updateUserTabPermissions(tabPerms);
        const fullAuthUser = {
          ...currentAuthUser,
          hotel: finalHotel,
          assignedProperties: finalAssigned,
          tabPermissions: tabPerms,
        };
        localStorage.setItem('samko_auth_user', JSON.stringify(fullAuthUser));
        window.dispatchEvent(
          new CustomEvent('samko:user-changed', { detail: { user: fullAuthUser } })
        );
      }
      localStorage.setItem('samko_last_user_update', String(Date.now()));
    } catch {}

    // Append to live audit logs
    const auditEvent: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      relativeTime: 'Just now',
      actorName: currentAuthUser.name || 'Administrator',
      actorEmail: currentAuthUser.email || 'info@samko.co.uk',
      actorInitials: currentAuthUser.initials || 'AS',
      roleLevel: currentAuthUser.roleLevel || 'L1',
      action: 'UPDATE',
      actionLabel: 'User Updated',
      category: 'USER_MANAGEMENT',
      categoryLabel: 'User Management',
      resource: `User: ${editingUser.email}`,
      ipAddress: '86.154.21.90',
      location: 'London, UK (Active Session)',
      status: 'success',
      details: `Updated profile attributes, role tier, property assignment, and tab permissions for ${editForm.name}.`,
      diff: [
        { field: 'roleLevel', previous: editingUser.roleLevel, current: editForm.roleLevel },
        { field: 'status', previous: editingUser.status, current: editForm.status },
        { field: 'hotel', previous: editingUser.hotel, current: editForm.hotel },
      ],
    };
    setAuditLogs((prev) => [auditEvent, ...prev]);
    try {
      recordAuditLog(auditEvent);
    } catch {}

    try {
      await api.users.update(editingUser.id, updatedUser);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'users' } }));
        window.dispatchEvent(
          new CustomEvent('samko:permissions-changed', { detail: { permissions: tabPerms } })
        );
      }
    } catch (err) {
      console.error('Failed to sync updated user:', err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) {
      toast.error('Please enter name and email');
      return;
    }
    if (
      newUser.email.trim().toLowerCase() === 'digitalbot@samkocentral.com' ||
      newUser.name.trim().toLowerCase().includes('digital bot')
    ) {
      toast.error('Reserved identifier', {
        description: 'Cannot create an account with Digital Bot credentials',
      });
      return;
    }

    // Permission guard
    if (newUser.roleLevel === 'L1' && !isSuperAdmin && !isDigitalBot) {
      toast.error('Permission denied', { description: 'Only Super Admins can create L1 accounts' });
      return;
    }
    if (newUser.roleLevel === 'L2' && !isSuperAdmin && !isDigitalBot) {
      toast.error('Permission denied', {
        description: 'Only Super Admins can create L2 Admin accounts',
      });
      return;
    }

    setSavingUser(true);
    const roleConfig = ROLE_LEVEL_CONFIG[newUser.roleLevel];
    const password = newUser.password || `${roleConfig.title.replace(/\s+/g, '')}2026!`;

    const finalAssigned =
      newUser.assignedProperties && newUser.assignedProperties.length > 0
        ? newUser.assignedProperties
        : newUser.hotel && newUser.hotel !== 'No Property Assigned'
          ? [newUser.hotel]
          : [];
    const finalHotel =
      finalAssigned.length === 0
        ? 'No Property Assigned'
        : finalAssigned.includes('all') || finalAssigned.includes('All Properties')
          ? 'All Properties'
          : finalAssigned.join(', ');

    const payload = {
      name: newUser.name.trim(),
      email: newUser.email.trim().toLowerCase(),
      password,
      roleLevel: newUser.roleLevel,
      roleTitle: roleConfig.title,
      portal: newUser.portal,
      hotel: finalHotel,
      assignedProperties: finalAssigned,
      status: 'active' as const,
      initials: newUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      lastLogin: new Date().toISOString().slice(0, 10),
      description: roleConfig.desc,
      tabPermissions: newUser.tabPermissions || getDefaultTabPermissionsForRole(newUser.roleLevel),
    };

    try {
      const res = await api.users.create(payload);
      const created = res.data || { ...payload, id: `usr-${Date.now()}` };

      setUsers((prev) => [created, ...prev]);
      toast.success(`User ${created.name} created!`, {
        description: `Role: ${created.roleLevel} · ${created.roleTitle}. Password: ${password}`,
      });
      setShowAddModal(false);

      // Append to live audit logs
      const auditEvent: AuditLogEntry = {
        id: `AUD-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        relativeTime: 'Just now',
        actorName: currentAuthUser.name || 'Administrator',
        actorEmail: currentAuthUser.email || 'info@samko.co.uk',
        actorInitials: currentAuthUser.initials || 'AS',
        roleLevel: currentAuthUser.roleLevel || 'L1',
        action: 'CREATE',
        actionLabel: 'Account Created',
        category: 'USER_MANAGEMENT',
        categoryLabel: 'User Management',
        resource: `User: ${newUser.email}`,
        ipAddress: '86.154.21.90',
        location: 'London, UK (Active Session)',
        status: 'success',
        details: `Provisioned dynamic user account for ${newUser.name} with ${newUser.roleLevel} privileges assigned to ${finalHotel}.`,
      };
      setAuditLogs((prev) => [auditEvent, ...prev]);
      try {
        recordAuditLog(auditEvent);
      } catch {}
      setNewUser({
        name: '',
        email: '',
        password: 'User2026!',
        roleLevel: isSuperAdmin ? 'L2' : 'L3',
        portal: currentAuthUser.portal === 'propco' ? 'propco' : 'opco',
        hotel: 'Crowne Plaza Kingston-south',
        assignedProperties: ['Crowne Plaza Kingston-south'],
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'users' } }));
      }
    } catch (err: any) {
      toast.error('Failed to create user', { description: err?.message });
    } finally {
      setSavingUser(false);
    }
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (!isDigitalBot && isBotAccount(u)) return false;
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.hotel.toLowerCase().includes(q) ||
        u.roleTitle.toLowerCase().includes(q) ||
        u.roleLevel.toLowerCase().includes(q);

      // If L2 Admin is logged in, only show their portal's users
      if (isAdmin && currentAuthUser.portal !== 'both') {
        const matchPortal = u.portal === currentAuthUser.portal || u.portal === 'both';
        return matchSearch && matchPortal;
      }

      return matchSearch;
    });
  }, [users, search, isAdmin, currentAuthUser.portal, isDigitalBot, isBotAccount]);

  const {
    currentPage,
    pageSize,
    totalRecords,
    paginatedItems: paginatedUsers,
    isPageLoading,
    changePage,
    changePageSize,
  } = useLoadingPagination(filtered, 10);

  const deletableUsers = useMemo(() => {
    return filtered.filter((u) => u.roleLevel !== 'L1' || isDigitalBot);
  }, [filtered, isDigitalBot]);

  const deletablePaginatedUsers = useMemo(() => {
    return paginatedUsers.filter((u) => u.roleLevel !== 'L1' || isDigitalBot);
  }, [paginatedUsers, isDigitalBot]);

  const isAllPageSelected =
    deletablePaginatedUsers.length > 0 &&
    deletablePaginatedUsers.every((u) => selectedUserIds.includes(u.id));

  const isSomePageSelected =
    deletablePaginatedUsers.some((u) => selectedUserIds.includes(u.id)) && !isAllPageSelected;

  const handleToggleSelectAllPage = () => {
    if (isAllPageSelected) {
      const pageIds = new Set(deletablePaginatedUsers.map((u) => u.id));
      setSelectedUserIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = deletablePaginatedUsers.map((u) => u.id);
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleUserSelect = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllFiltered = () => {
    setSelectedUserIds(deletableUsers.map((u) => u.id));
  };

  const handleClearSelection = () => {
    setSelectedUserIds([]);
    setSelectedTypeFilter('');
  };

  const userTypeOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    deletableUsers.forEach((u) => {
      counts[`role:${u.roleLevel}`] = (counts[`role:${u.roleLevel}`] || 0) + 1;
      counts[`status:${u.status}`] = (counts[`status:${u.status}`] || 0) + 1;
      counts[`portal:${u.portal}`] = (counts[`portal:${u.portal}`] || 0) + 1;
    });

    const opts: { label: string; value: string; count: number }[] = [
      { label: 'Role: L2 Admin', value: 'role:L2', count: counts['role:L2'] || 0 },
      { label: 'Role: L3 Uploader', value: 'role:L3', count: counts['role:L3'] || 0 },
      { label: 'Role: L4 Viewer', value: 'role:L4', count: counts['role:L4'] || 0 },
      { label: 'Status: Active', value: 'status:active', count: counts['status:active'] || 0 },
      {
        label: 'Status: Inactive',
        value: 'status:inactive',
        count: counts['status:inactive'] || 0,
      },
      { label: 'Portal: PropCo', value: 'portal:propco', count: counts['portal:propco'] || 0 },
      { label: 'Portal: OpCo', value: 'portal:opco', count: counts['portal:opco'] || 0 },
    ];
    return opts.filter((o) => o.count > 0);
  }, [deletableUsers]);

  const handleSelectByType = (typeKey: string) => {
    setSelectedTypeFilter(typeKey);
    if (!typeKey) {
      setSelectedUserIds([]);
      return;
    }
    const [kind, val] = typeKey.split(':');
    const matched = deletableUsers.filter((u) => {
      if (kind === 'role') return u.roleLevel === val;
      if (kind === 'status') return u.status === val;
      if (kind === 'portal') return u.portal === val;
      return false;
    });
    setSelectedUserIds(matched.map((u) => u.id));
    toast.info(`Selected ${matched.length} users`, {
      description: `All users matching ${typeKey.replace(':', ': ')} are now marked for batch action.`,
    });
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const idsToDelete = [...selectedUserIds];
      const count = idsToDelete.length;

      setUsers((prev) => prev.filter((u) => !idsToDelete.includes(u.id)));
      setSelectedUserIds([]);
      setSelectedTypeFilter('');
      setShowBulkDeleteModal(false);

      await Promise.allSettled(idsToDelete.map((id) => api.users.delete(id)));

      const auditEvent: AuditLogEntry = {
        id: `AUD-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        relativeTime: 'Just now',
        actorName: currentAuthUser.name || 'Administrator',
        actorEmail: currentAuthUser.email || 'info@samko.co.uk',
        actorInitials: currentAuthUser.initials || 'AS',
        roleLevel: currentAuthUser.roleLevel || 'L1',
        action: 'DELETE',
        actionLabel: 'Bulk Users Deleted',
        category: 'USER_MANAGEMENT',
        categoryLabel: 'User Management',
        resource: `${count} User Accounts`,
        ipAddress: '86.154.21.90',
        location: 'London, UK (Active Session)',
        status: 'warning',
        details: `Bulk deleted ${count} user accounts from directory.`,
      };
      setAuditLogs((prev) => [auditEvent, ...prev]);
      try {
        recordAuditLog(auditEvent);
      } catch {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:data-changed', { detail: { type: 'users' } }));
      }

      toast.success(`Successfully deleted ${count} users!`, {
        description: 'Selected user accounts have been permanently removed.',
      });
    } catch (err: any) {
      toast.error('Bulk deletion encountered an issue', { description: err?.message });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const countsByLevel = useMemo(() => {
    const pool = isDigitalBot ? users : users.filter((u) => !isBotAccount(u));
    return {
      L1: pool.filter((u) => u.roleLevel === 'L1').length,
      L2: users.filter((u) => u.roleLevel === 'L2').length,
      L3: users.filter((u) => u.roleLevel === 'L3').length,
      L4: users.filter((u) => u.roleLevel === 'L4').length,
    };
  }, [users, isDigitalBot, isBotAccount]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = auditSearch.toLowerCase();
      const matchSearch =
        !auditSearch ||
        log.id.toLowerCase().includes(q) ||
        log.actorName.toLowerCase().includes(q) ||
        log.actorEmail.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.actionLabel.toLowerCase().includes(q) ||
        log.categoryLabel.toLowerCase().includes(q) ||
        log.resource.toLowerCase().includes(q) ||
        log.ipAddress.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q);

      const matchCategory = auditCategory === 'ALL' || log.category === auditCategory;
      const matchRole = auditRoleFilter === 'ALL' || log.roleLevel === auditRoleFilter;
      const matchStatus = auditStatusFilter === 'ALL' || log.status === auditStatusFilter;

      return matchSearch && matchCategory && matchRole && matchStatus;
    });
  }, [auditLogs, auditSearch, auditCategory, auditRoleFilter, auditStatusFilter]);

  const auditStats = useMemo(() => {
    return {
      total: auditLogs.length,
      auth: auditLogs.filter((l) => l.category === 'AUTH' || l.category === 'SECURITY').length,
      ops: auditLogs.filter((l) => l.category === 'ASSET_REGISTER' || l.category === 'MAINTENANCE')
        .length,
      comp: auditLogs.filter((l) => l.category === 'COMPLIANCE' || l.category === 'USER_MANAGEMENT')
        .length,
    };
  }, [auditLogs]);

  if (!canManageUsers) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full p-8 text-center"
        style={{ minHeight: '65vh' }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(244,63,94,0.12)', color: 'var(--critical)' }}
        >
          <Lock size={30} />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Access Restricted</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
          User Management and Role Hierarchy controls are restricted to administrators. You do not
          have permission to access or view platform accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top Header */}
      <div
        className="flex items-center justify-between px-6 py-3.5 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-head text-lg font-bold">
              {cms.title || 'User Management & Role Hierarchy'}
            </h1>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase"
              style={{
                background: isSuperAdmin
                  ? 'rgba(244,63,94,0.18)'
                  : isAdmin
                    ? 'rgba(167,139,250,0.18)'
                    : 'rgba(56,189,248,0.18)',
                color: isSuperAdmin ? '#f43f5e' : isAdmin ? '#a78bfa' : '#38bdf8',
              }}
            >
              Current Access:{' '}
              {isSuperAdmin
                ? 'L1 Super Admin'
                : isAdmin
                  ? 'L2 Portal Admin'
                  : 'L4 External Auditor (Read-Only)'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cms.subtitle ||
              (isSuperAdmin
                ? 'Full authority over Propco & Opco users, role permissions, audit trails, and platform credentials'
                : isAdmin
                  ? 'Authorized to create, configure, and manage L3 Uploaders and L4 Viewers within your portal'
                  : 'Auditor inspection rights enabled — read-only access to users, permission matrix, and full system audit trails')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PageCMSEditButton pageId="users" pageName="User Management & Role Hierarchy" />
          {(isSuperAdmin || isAdmin) && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-md transition-transform active:scale-95"
              style={{ background: 'var(--primary)', color: '#000' }}
            >
              <Plus size={14} />{' '}
              {(cms.primaryActionLabel || 'Add User Account').replace(/^[\+\s]+/, '').trim()}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 px-6 pt-3 border-b border-border flex-shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        {[
          { id: 'users' as const, label: `Active Users (${users.length})`, icon: Users },
          {
            id: 'permissions' as const,
            label: 'Tab Permissions & Access Matrix (Super Admin)',
            icon: SlidersHorizontal,
          },
          { id: 'roles' as const, label: 'Hierarchy & Permission Matrix (L1 – L4)', icon: Shield },
          { id: 'audit' as const, label: `Audit Logs (${auditLogs.length})`, icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer"
              style={{
                borderColor: isSelected ? 'var(--primary)' : 'transparent',
                color: isSelected ? 'var(--primary)' : 'var(--text2)',
                marginBottom: -1,
              }}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {activeTab === 'users' && (
          <div className="flex flex-col gap-4">
            {/* 4 Role Level KPI Summary */}
            <div className="grid grid-cols-4 gap-3">
              {(['L1', 'L2', 'L3', 'L4'] as RoleLevel[]).map((level) => {
                const conf = ROLE_LEVEL_CONFIG[level];
                return (
                  <div
                    key={level}
                    className="rounded-xl border border-border p-3 relative overflow-hidden"
                    style={{ background: 'var(--surface)' }}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-0.5"
                      style={{ background: conf.color }}
                    />
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className="px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase"
                        style={{ background: conf.badgeBg, color: conf.color }}
                      >
                        {level}
                      </span>
                      <span
                        className="font-head text-xl font-extrabold"
                        style={{ color: conf.color }}
                      >
                        {countsByLevel[level]}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-foreground">{conf.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-1">
                      {conf.desc}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Search and Quick Select by Type */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="relative flex-1 max-w-sm">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border text-xs outline-none"
                  style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
                  placeholder="Search by name, email, role, or property..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Quick Select by Type / Role */}
              <div className="flex items-center gap-2">
                <BulkActionBar
                  selectedCount={0}
                  totalCount={deletableUsers.length}
                  onClearSelection={handleClearSelection}
                  onDeleteSelected={() => setShowBulkDeleteModal(true)}
                  typeOptions={userTypeOptions}
                  onSelectByType={handleSelectByType}
                  selectedTypeValue={selectedTypeFilter}
                  typePlaceholder="Select all of type (Role, Status)..."
                  recordName="users"
                />
              </div>
            </div>

            {/* User Table */}
            <div
              className="rounded-xl border border-border overflow-x-auto shadow-sm"
              style={{ background: 'var(--surface)' }}
            >
              <table className="w-full text-left border-collapse" style={{ minWidth: 920 }}>
                <thead style={{ background: 'var(--surface2)' }}>
                  <tr>
                    {canManageUsers && (
                      <th className="px-3 py-2.5 border-b border-border w-10 text-center">
                        <TableCheckbox
                          checked={isAllPageSelected}
                          indeterminate={isSomePageSelected}
                          onChange={handleToggleSelectAllPage}
                          title="Select/Deselect All on this page"
                        />
                      </th>
                    )}
                    {[
                      { label: 'User & Contact', align: 'left', width: '24%' },
                      { label: 'Role', align: 'left', width: '13%' },
                      { label: 'Portal', align: 'left', width: '13%' },
                      { label: 'Hotel / Site', align: 'left', width: '16%' },
                      { label: 'Tab Permissions', align: 'left', width: '15%' },
                      { label: 'Status', align: 'left', width: '8%' },
                      { label: 'Actions', align: 'right', width: '11%' },
                    ].map((h) => (
                      <th
                        key={h.label}
                        className={`text-${h.align} text-xs font-bold uppercase tracking-wide text-muted-foreground px-3 py-2.5 border-b border-border whitespace-nowrap`}
                        style={{ width: h.width }}
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => {
                    const conf = ROLE_LEVEL_CONFIG[user.roleLevel] || ROLE_LEVEL_CONFIG.L3;
                    return (
                      <tr
                        key={user.id}
                        className={`border-b border-border transition-colors ${
                          selectedUserIds.includes(user.id)
                            ? 'bg-[#e8c97a]/10 hover:bg-[#e8c97a]/15'
                            : 'hover:bg-surface2'
                        }`}
                      >
                        {/* Checkbox Column */}
                        {canManageUsers && (
                          <td className="px-3 py-2.5 text-center">
                            <TableCheckbox
                              checked={selectedUserIds.includes(user.id)}
                              disabled={user.roleLevel === 'L1' && !isDigitalBot}
                              onChange={() => handleToggleUserSelect(user.id)}
                              title={
                                user.roleLevel === 'L1' && !isDigitalBot
                                  ? 'Super Admin cannot be deleted'
                                  : `Select ${user.name}`
                              }
                            />
                          </td>
                        )}
                        {/* User name & email */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[11px]"
                              style={{ background: `${conf.color}22`, color: conf.color }}
                            >
                              {user.initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-xs flex items-center gap-1 text-foreground">
                                <span className="truncate max-w-[150px]">{user.name}</span>
                                {user.roleLevel === 'L1' && (
                                  <Crown
                                    size={11}
                                    className="flex-shrink-0"
                                    style={{ color: '#f43f5e' }}
                                  />
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground font-mono truncate max-w-[160px]">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role level badge */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                            style={{ background: conf.badgeBg, color: conf.color }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: conf.color }}
                            />
                            {user.roleLevel} · {user.roleTitle}
                          </span>
                        </td>

                        {/* Portal Access */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold"
                            style={{
                              background:
                                user.portal === 'both'
                                  ? 'rgba(232,201,122,0.15)'
                                  : user.portal === 'propco'
                                    ? 'rgba(167,139,250,0.15)'
                                    : 'rgba(96,165,250,0.15)',
                              color:
                                user.portal === 'both'
                                  ? '#e8c97a'
                                  : user.portal === 'propco'
                                    ? '#a78bfa'
                                    : '#60a5fa',
                            }}
                          >
                            <Building2 size={11} />
                            {user.portal === 'both'
                              ? 'Propco & Opco'
                              : user.portal === 'propco'
                                ? 'Propco'
                                : 'Opco'}
                          </span>
                        </td>

                        {/* Assigned Property */}
                        <td
                          className="px-3 py-2.5 text-xs text-muted-foreground max-w-[220px]"
                          title={user.hotel}
                        >
                          {(() => {
                            const canEditUser =
                              (isSuperAdmin || isAdmin || isDigitalBot) &&
                              !(user.roleLevel === 'L1' && !isSuperAdmin && !isDigitalBot) &&
                              !(user.roleLevel === 'L2' && !isSuperAdmin && !isDigitalBot) &&
                              !(isBotAccount(user) && !isDigitalBot);

                            const assigned = Array.isArray(user.assignedProperties)
                              ? user.assignedProperties.filter(
                                  (p) => p && p !== 'No Property Assigned'
                                )
                              : user.hotel && user.hotel !== 'No Property Assigned'
                                ? user.hotel.includes(',')
                                  ? user.hotel
                                      .split(',')
                                      .map((s) => s.trim())
                                      .filter(Boolean)
                                  : [user.hotel.trim()]
                                : [];

                            const isAll =
                              assigned.includes('all') || assigned.includes('All Properties');
                            const isNone =
                              assigned.length === 0 || assigned.includes('No Property Assigned');

                            return (
                              <div className="flex flex-wrap items-center gap-1.5 min-w-[200px]">
                                {isAll ? (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border"
                                    style={{
                                      background: 'rgba(255, 255, 255, 0.04)',
                                      borderColor: 'rgba(255, 255, 255, 0.15)',
                                      color: 'var(--text2)',
                                    }}
                                  >
                                    All Properties
                                  </span>
                                ) : isNone ? (
                                  <span className="text-[11px] text-amber-400/80 italic font-medium">
                                    No Property Assigned
                                  </span>
                                ) : (
                                  assigned.map((p) => (
                                    <span
                                      key={p}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors"
                                      style={{
                                        background: 'rgba(232, 201, 122, 0.08)',
                                        borderColor: 'rgba(232, 201, 122, 0.25)',
                                        color: '#e8c97a',
                                      }}
                                    >
                                      <span className="truncate max-w-[130px]">{p}</span>
                                      {canEditUser && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setPropertyRemovalConfirm({ user, property: p });
                                          }}
                                          className="text-[#e8c97a]/60 hover:text-rose-400 hover:bg-rose-500/20 rounded p-0.5 transition-colors cursor-pointer"
                                          title={`Remove "${p}" from ${user.name}`}
                                        >
                                          <X size={10} />
                                        </button>
                                      )}
                                    </span>
                                  ))
                                )}

                                {canEditUser && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openPropertyModal(user);
                                    }}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-dashed border-[#e8c97a]/40 hover:border-[#e8c97a] text-[#e8c97a]/80 hover:text-[#e8c97a] hover:bg-[#e8c97a]/10 transition-all cursor-pointer whitespace-nowrap"
                                    title={`Assign additional property or remove existing for ${user.name}`}
                                  >
                                    <Plus size={10} /> Assign
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* Tab Permissions Badge */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {(() => {
                            const perms =
                              user.tabPermissions ||
                              getDefaultTabPermissionsForRole(user.roleLevel);
                            const enabled = Object.values(perms).filter((p) => p.enabled).length;
                            const writeCount = Object.values(perms).filter(
                              (p) => p.enabled && p.accessLevel === 'write'
                            ).length;
                            const isAllWrite =
                              writeCount === enabled && enabled === ALL_SYSTEM_TABS.length;
                            const isAllRead = writeCount === 0 && enabled > 0;

                            return (
                              <button
                                type="button"
                                onClick={() => handleOpenPermissionsModal(user)}
                                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all hover:border-primary cursor-pointer group"
                                style={{
                                  background: isAllWrite
                                    ? 'rgba(61,214,140,0.08)'
                                    : isAllRead
                                      ? 'rgba(96,165,250,0.08)'
                                      : 'var(--surface2)',
                                  borderColor: isAllWrite
                                    ? 'rgba(61,214,140,0.3)'
                                    : isAllRead
                                      ? 'rgba(96,165,250,0.3)'
                                      : 'var(--border)',
                                  color: isAllWrite
                                    ? '#3dd68c'
                                    : isAllRead
                                      ? '#60a5fa'
                                      : 'var(--foreground)',
                                }}
                                title="Configure Tab-Level Permissions (Read-Only vs Edit & Write)"
                              >
                                <SlidersHorizontal
                                  size={11}
                                  className="group-hover:text-primary transition-colors flex-shrink-0"
                                />
                                <span>
                                  {enabled}/{ALL_SYSTEM_TABS.length} Tabs
                                </span>
                                <span className="text-[10px] text-muted-foreground font-normal">
                                  (
                                  {isAllWrite
                                    ? 'Edit/Write'
                                    : isAllRead
                                      ? 'Read-Only'
                                      : `${writeCount} Write`}
                                  )
                                </span>
                              </button>
                            );
                          })()}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            className="cursor-pointer border-none bg-transparent"
                            title="Click to toggle status"
                          >
                            {user.status === 'active' ? (
                              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                                <CheckCircle2 size={11} /> Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                                <XCircle size={11} /> Inactive
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {canManageUsers && (
                              <button
                                type="button"
                                onClick={() => handleOpenPermissionsModal(user)}
                                className="p-1 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                                title="Configure Tab Permissions & Access Levels"
                              >
                                <SlidersHorizontal size={13} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (isBotAccount(user) && !isDigitalBot) {
                                  toast.error('Access Denied', {
                                    description: 'Super Admin cannot view the Digital Bot account',
                                  });
                                  return;
                                }
                                setViewingUser(user);
                              }}
                              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface3 transition-colors"
                              title="View User Details"
                            >
                              <Eye size={13} />
                            </button>
                            {!isViewer && canManageUsers && (
                              <>
                                {user.id !== currentAuthUser.id && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isBotAccount(user) && !isDigitalBot) {
                                        toast.error('Access Denied', {
                                          description: 'Cannot switch into Digital Bot account',
                                        });
                                        return;
                                      }
                                      switchUser(user as any);
                                      toast.success(`Switched Session to ${user.name}`, {
                                        description: `Now previewing as ${user.roleTitle} (${user.roleLevel})`,
                                      });
                                    }}
                                    className="p-1 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                                    title={`Preview & test platform as ${user.name} (${user.roleLevel})`}
                                  >
                                    <LogIn size={13} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(user)}
                                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface3 transition-colors"
                                  title="Edit User"
                                >
                                  <Edit2 size={13} />
                                </button>
                                {user.roleLevel !== 'L1' ? (
                                  <button
                                    type="button"
                                    onClick={() => setUserToDelete(user)}
                                    className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                                    title="Delete User"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                ) : (
                                  <div className="w-[21px]" />
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <LoadingPagination
                currentPage={currentPage}
                totalRecords={totalRecords}
                pageSize={pageSize}
                pageSizeOptions={[5, 10, 15, 20, 50]}
                onPageChange={changePage}
                onPageSizeChange={changePageSize}
                isLoading={isPageLoading}
                recordName="users"
              />
            </div>

            {/* Floating Bulk Action Bar (Only shown for authorized delete users) */}
            {canManageUsers && (
              <BulkActionBar
                selectedCount={selectedUserIds.length}
                totalCount={deletableUsers.length}
                onClearSelection={handleClearSelection}
                onSelectAll={handleSelectAllFiltered}
                onDeleteSelected={() => setShowBulkDeleteModal(true)}
                typeOptions={userTypeOptions}
                onSelectByType={handleSelectByType}
                selectedTypeValue={selectedTypeFilter}
                typePlaceholder="Select all of type (Role, Status)..."
                recordName="users"
                isDeleting={isBulkDeleting}
              />
            )}
          </div>
        )}

        {/* ── TAB PERMISSIONS & ACCESS MATRIX TAB (SUPER ADMIN) ── */}
        {activeTab === 'permissions' && (
          <div className="flex flex-col gap-4">
            {/* User Selector Header */}
            <div
              className="p-4 rounded-xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-4"
              style={{ background: 'var(--surface)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                  style={{ background: 'rgba(232,201,122,0.12)', color: 'var(--primary)' }}
                >
                  <SlidersHorizontal size={20} />
                </div>
                <div>
                  <h3 className="font-head font-bold text-base text-foreground">
                    Tab-Level Permissions & Access Matrix
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Super Admin controls: Enable/disable tabs and assign Read Only vs Edit &amp;
                    Write access for any user
                  </p>
                </div>
              </div>

              {/* User Selector & Actions */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs text-muted-foreground font-medium">Select User:</span>
                <CustomDropdown
                  size="sm"
                  variant="surface"
                  value={matrixSelectedUserId || users[0]?.id || ''}
                  onChange={(val) => setMatrixSelectedUserId(val)}
                  options={users
                    .filter((u) => !isBotAccount(u) || isDigitalBot)
                    .map((u) => ({
                      value: u.id,
                      label: `${u.name} (${u.roleLevel} · ${u.roleTitle}) — ${u.email}`,
                    }))}
                />

                {(() => {
                  const targetUser = users.find((u) => u.id === matrixSelectedUserId) || users[0];
                  if (!targetUser) return null;
                  if (!isSuperAdmin) {
                    return (
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{
                          background: 'rgba(148,163,184,0.12)',
                          color: '#94a3b8',
                          border: '1px solid rgba(148,163,184,0.25)',
                        }}
                      >
                        <Eye size={12} className="text-primary" />
                        <span>Read-Only Matrix</span>
                      </span>
                    );
                  }
                  return (
                    <button
                      type="button"
                      disabled={savingPermissions}
                      onClick={async () => {
                        setSavingPermissions(true);
                        try {
                          await api.users.update(targetUser.id, {
                            tabPermissions:
                              targetUser.tabPermissions ||
                              getDefaultTabPermissionsForRole(targetUser.roleLevel),
                          });
                          toast.success(`Tab permissions saved for ${targetUser.name}!`, {
                            description: 'All 18 tabs updated across the platform database',
                          });
                        } catch (e: any) {
                          toast.error('Failed to sync permissions', { description: e.message });
                        } finally {
                          setSavingPermissions(false);
                        }
                      }}
                      className="samko-btn-primary flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      {savingPermissions ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Check size={13} />
                      )}
                      Save Permissions for {targetUser.name.split(' ')[0]}
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* Editor for Selected User */}
            {(() => {
              const targetUser = users.find((u) => u.id === matrixSelectedUserId) || users[0];
              if (!targetUser) {
                return (
                  <div className="p-8 text-center text-muted-foreground border border-border rounded-xl">
                    No users found
                  </div>
                );
              }

              return (
                <div
                  className="rounded-xl border border-border p-5"
                  style={{ background: 'var(--surface)' }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border mb-4 gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs"
                        style={{
                          background: `${ROLE_LEVEL_CONFIG[targetUser.roleLevel]?.color || '#a78bfa'}22`,
                          color: ROLE_LEVEL_CONFIG[targetUser.roleLevel]?.color || '#a78bfa',
                        }}
                      >
                        {targetUser.initials}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground flex items-center gap-2">
                          <span>{targetUser.name}</span>
                          <span
                            className="px-2 py-0.2 rounded-full text-[10px] font-bold"
                            style={{
                              background: ROLE_LEVEL_CONFIG[targetUser.roleLevel]?.badgeBg,
                              color: ROLE_LEVEL_CONFIG[targetUser.roleLevel]?.color,
                            }}
                          >
                            {targetUser.roleLevel} · {targetUser.roleTitle}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {targetUser.email} · Assigned Property: {targetUser.hotel}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] text-muted-foreground">
                      {isSuperAdmin
                        ? 'Changes made below save instantly and update user access in real time.'
                        : 'Read-only view of tab permissions matrix. Super Admin (L1) privileges required to edit.'}
                    </span>
                  </div>

                  <TabPermissionsEditor
                    permissions={
                      targetUser.tabPermissions ||
                      getDefaultTabPermissionsForRole(targetUser.roleLevel)
                    }
                    readOnly={!isSuperAdmin}
                    onChange={async (newPerms) => {
                      if (!isSuperAdmin) return;
                      setUsers((prev) =>
                        prev.map((u) =>
                          u.id === targetUser.id ? { ...u, tabPermissions: newPerms } : u
                        )
                      );
                      if (targetUser.id === currentAuthUser.id) {
                        updateUserTabPermissions(newPerms);
                      }
                      try {
                        await api.users.update(targetUser.id, { tabPermissions: newPerms });
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(
                            new CustomEvent('samko:permissions-changed', {
                              detail: { permissions: newPerms },
                            })
                          );
                        }
                      } catch (err) {
                        console.error('Auto-save permissions error:', err);
                      }
                    }}
                    roleLevel={targetUser.roleLevel}
                    userName={targetUser.name}
                    onSyncUsersInRole={handleSyncUsersInRole}
                    onAssignToAllUsers={handleAssignTabToAllUsers}
                  />
                </div>
              );
            })()}
          </div>
        )}

        {/* Roles & Permissions Breakdown Tab */}
        {activeTab === 'roles' && (
          <div className="grid gap-6" style={{ gridTemplateColumns: '300px 1fr' }}>
            {/* Left list of 4 levels */}
            <div className="flex flex-col gap-2.5">
              {(['L1', 'L2', 'L3', 'L4'] as RoleLevel[]).map((level) => {
                const conf = ROLE_LEVEL_CONFIG[level];
                const count = countsByLevel[level];
                const isSelected = selectedRoleLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSelectedRoleLevel(level)}
                    className="flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer"
                    style={{
                      background: isSelected ? 'rgba(232,201,122,0.08)' : 'var(--surface)',
                      borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 font-extrabold text-xs"
                      style={{ background: `${conf.color}22`, color: conf.color }}
                    >
                      {level}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-foreground flex items-center justify-between">
                        <span>{conf.title}</span>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {count} users
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1 leading-snug">
                        {conf.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right permission detail panel */}
            <div
              className="rounded-xl border border-border overflow-hidden"
              style={{ background: 'var(--surface)' }}
            >
              <div
                className="px-5 py-4 border-b border-border flex items-center justify-between"
                style={{ background: 'var(--surface2)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                    style={{
                      background: `${ROLE_LEVEL_CONFIG[selectedRoleLevel].color}22`,
                      color: ROLE_LEVEL_CONFIG[selectedRoleLevel].color,
                    }}
                  >
                    {selectedRoleLevel}
                  </div>
                  <div>
                    <h3 className="font-head font-bold text-base text-foreground">
                      {ROLE_LEVEL_CONFIG[selectedRoleLevel].label}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_LEVEL_CONFIG[selectedRoleLevel].desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* View Mode Toggle: Tab Permissions vs General Rights */}
                  <div
                    className="flex items-center gap-1 p-0.5 rounded-lg border border-border"
                    style={{ background: 'var(--surface)' }}
                  >
                    <button
                      type="button"
                      onClick={() => setRoleViewMode('tabs')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer"
                      style={{
                        background: roleViewMode === 'tabs' ? 'var(--primary)' : 'transparent',
                        color: roleViewMode === 'tabs' ? '#000' : 'var(--muted-foreground)',
                      }}
                    >
                      <SlidersHorizontal size={11} />
                      <span>Tab Permissions</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleViewMode('capabilities')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer"
                      style={{
                        background:
                          roleViewMode === 'capabilities' ? 'var(--primary)' : 'transparent',
                        color: roleViewMode === 'capabilities' ? '#000' : 'var(--muted-foreground)',
                      }}
                    >
                      <ShieldCheck size={11} />
                      <span>Capabilities</span>
                    </button>
                  </div>

                  <span
                    className="px-2.5 py-1 rounded text-xs font-bold"
                    style={{
                      background: ROLE_LEVEL_CONFIG[selectedRoleLevel].badgeBg,
                      color: ROLE_LEVEL_CONFIG[selectedRoleLevel].color,
                    }}
                  >
                    {countsByLevel[selectedRoleLevel]} Assigned Users
                  </span>
                </div>
              </div>

              {/* View 1: Tab Permissions Matrix for this Role Level */}
              {roleViewMode === 'tabs' ? (
                <div className="p-5 space-y-4">
                  {/* Super Admin Action Bar for this Role */}
                  <div
                    className="p-3.5 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    style={{ background: 'var(--surface2)' }}
                  >
                    <div>
                      <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                        <SlidersHorizontal size={13} className="text-primary" />
                        <span>
                          Role Tab Template · {ROLE_LEVEL_CONFIG[selectedRoleLevel].title} (
                          {selectedRoleLevel})
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {isSuperAdmin
                          ? 'Copy or move tabs to/from this role, or apply this tab template to all assigned users anytime.'
                          : 'Read-only inspection of role tab access. Super Admin privileges required to edit.'}
                      </p>
                    </div>

                    {isSuperAdmin && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          disabled={applyingRoleToUsers || countsByLevel[selectedRoleLevel] === 0}
                          onClick={async () => {
                            setApplyingRoleToUsers(true);
                            try {
                              const perms = getRoleTabPermissions(selectedRoleLevel);
                              await handleSyncUsersInRole(selectedRoleLevel, perms);
                              toast.success(
                                `Applied ${selectedRoleLevel} tab permissions to all ${countsByLevel[selectedRoleLevel]} assigned users!`,
                                {
                                  description:
                                    'Database and active session permissions successfully synchronized.',
                                }
                              );
                            } catch (e: any) {
                              toast.error('Failed to sync users', { description: e.message });
                            } finally {
                              setApplyingRoleToUsers(false);
                            }
                          }}
                          className="samko-btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title={`Apply this role's configured tabs to all ${countsByLevel[selectedRoleLevel]} assigned users in database`}
                        >
                          {applyingRoleToUsers ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Users size={12} />
                          )}
                          <span>Apply to All {countsByLevel[selectedRoleLevel]} Users</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* TabPermissionsEditor for this Role */}
                  <TabPermissionsEditor
                    key={`role-${selectedRoleLevel}`}
                    permissions={getRoleTabPermissions(selectedRoleLevel)}
                    roleLevel={selectedRoleLevel}
                    readOnly={!isSuperAdmin}
                    onChange={(newPerms) => {
                      if (!isSuperAdmin) return;
                      saveRoleTabPermissions(selectedRoleLevel, newPerms);
                      toast.success(`Updated ${selectedRoleLevel} role tab template!`, {
                        description: 'Saved as the active template for this tier.',
                      });
                    }}
                    onSyncUsersInRole={handleSyncUsersInRole}
                    onAssignToAllUsers={handleAssignTabToAllUsers}
                  />

                  {/* Assigned Users in this Role */}
                  <div className="pt-4 border-t border-border">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                      Users Currently Assigned to {ROLE_LEVEL_CONFIG[selectedRoleLevel].title} (
                      {countsByLevel[selectedRoleLevel]})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {users
                        .filter((u) => u.roleLevel === selectedRoleLevel)
                        .map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs"
                            style={{ background: 'var(--surface2)' }}
                          >
                            <span
                              className="w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px]"
                              style={{
                                background: ROLE_LEVEL_CONFIG[selectedRoleLevel].color,
                                color: '#000',
                              }}
                            >
                              {u.initials}
                            </span>
                            <span className="font-semibold text-foreground">{u.name}</span>
                            <span className="text-muted-foreground text-[10px]">({u.email})</span>
                          </div>
                        ))}
                      {countsByLevel[selectedRoleLevel] === 0 && (
                        <span className="text-xs text-muted-foreground italic">
                          No users currently assigned
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* View 2: Static Capability Matrix */
                <div className="p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Authorization &amp; Capability Rights
                  </div>

                  <div className="space-y-2">
                    {PERMISSION_MATRIX[selectedRoleLevel].map((perm) => (
                      <div
                        key={perm.label}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                        style={{ background: 'var(--surface2)' }}
                      >
                        <div>
                          <div className="text-sm font-semibold text-foreground">{perm.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{perm.detail}</div>
                        </div>

                        {perm.allowed ? (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400">
                            <CheckCircle2 size={13} /> Granted
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-rose-500/10 text-rose-400">
                            <XCircle size={13} /> Denied
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Assigned Users in this Role */}
                  <div className="mt-5 pt-4 border-t border-border">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                      Users Currently Assigned to {ROLE_LEVEL_CONFIG[selectedRoleLevel].title}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {users
                        .filter((u) => u.roleLevel === selectedRoleLevel)
                        .map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs"
                            style={{ background: 'var(--surface2)' }}
                          >
                            <span
                              className="w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px]"
                              style={{
                                background: ROLE_LEVEL_CONFIG[selectedRoleLevel].color,
                                color: '#000',
                              }}
                            >
                              {u.initials}
                            </span>
                            <span className="font-semibold text-foreground">{u.name}</span>
                            <span className="text-muted-foreground text-[10px]">({u.email})</span>
                          </div>
                        ))}
                      {countsByLevel[selectedRoleLevel] === 0 && (
                        <span className="text-xs text-muted-foreground italic">
                          No users currently assigned
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SYSTEM AUDIT LOGS TAB ── */}
        {activeTab === 'audit' && (
          <div className="flex flex-col gap-4">
            {/* Top Audit KPI Cards */}
            <div className="grid grid-cols-4 gap-3">
              <div
                className="rounded-xl border border-border p-3.5 relative overflow-hidden"
                style={{ background: 'var(--surface)' }}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Activity size={12} className="text-primary" /> Total Events
                  </span>
                  <span className="font-head text-xl font-extrabold text-foreground">
                    {auditStats.total}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Immutable platform system activity log
                </div>
              </div>

              <div
                className="rounded-xl border border-border p-3.5 relative overflow-hidden"
                style={{ background: 'var(--surface)' }}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-rose-500" />
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Shield size={12} className="text-rose-400" /> Auth & Security
                  </span>
                  <span className="font-head text-xl font-extrabold text-rose-400">
                    {auditStats.auth}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Logins, role switches & security alerts
                </div>
              </div>

              <div
                className="rounded-xl border border-border p-3.5 relative overflow-hidden"
                style={{ background: 'var(--surface)' }}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500" />
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Layers size={12} className="text-blue-400" /> Operations & Assets
                  </span>
                  <span className="font-head text-xl font-extrabold text-blue-400">
                    {auditStats.ops}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Fixed assets, maintenance & work orders
                </div>
              </div>

              <div
                className="rounded-xl border border-border p-3.5 relative overflow-hidden"
                style={{ background: 'var(--surface)' }}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-400" /> Governance & Users
                  </span>
                  <span className="font-head text-xl font-extrabold text-emerald-400">
                    {auditStats.comp}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Statutory sign-offs & user administration
                </div>
              </div>
            </div>

            {/* Audit Toolbar & Filters */}
            <div
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border flex-wrap"
              style={{ background: 'var(--surface)' }}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border flex-1 max-w-sm"
                  style={{ background: 'var(--surface2)' }}
                >
                  <Search size={14} className="text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Search events by actor, action, resource, or IP..."
                    className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-full"
                  />
                  {auditSearch && (
                    <button
                      onClick={() => setAuditSearch('')}
                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <CustomDropdown
                  size="sm"
                  variant="filter"
                  value={auditCategory}
                  onChange={(val) => setAuditCategory(val)}
                  options={[
                    { value: 'ALL', label: 'All Categories' },
                    { value: 'AUTH', label: 'Auth & Access' },
                    { value: 'USER_MANAGEMENT', label: 'User Management' },
                    { value: 'ASSET_REGISTER', label: 'Asset Register' },
                    { value: 'COMPLIANCE', label: 'Compliance & Safety' },
                    { value: 'MAINTENANCE', label: 'Maintenance' },
                    { value: 'SECURITY', label: 'Security' },
                  ]}
                />

                {/* Role Filter */}
                <CustomDropdown
                  size="sm"
                  variant="filter"
                  value={auditRoleFilter}
                  onChange={(val) => setAuditRoleFilter(val)}
                  options={[
                    { value: 'ALL', label: 'All Roles' },
                    { value: 'L1', label: 'L1 – Super Admin' },
                    { value: 'L2', label: 'L2 – Portal Admin' },
                    { value: 'L3', label: 'L3 – Uploader' },
                    { value: 'L4', label: 'L4 – Viewer / Auditor' },
                  ]}
                />

                {/* Status Filter */}
                <CustomDropdown
                  size="sm"
                  variant="filter"
                  value={auditStatusFilter}
                  onChange={(val) => setAuditStatusFilter(val)}
                  options={[
                    { value: 'ALL', label: 'All Statuses' },
                    { value: 'success', label: 'Success', color: '#10b981' },
                    { value: 'warning', label: 'Warning', color: '#f59e0b' },
                    { value: 'alert', label: 'Security Alert', color: '#ef4444' },
                  ]}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRefreshingAudit(true);
                    setTimeout(() => {
                      setRefreshingAudit(false);
                      toast.success('Audit logs synchronized', {
                        description: `${auditLogs.length} events up to date`,
                      });
                    }, 400);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface2 transition-colors cursor-pointer"
                  title="Refresh Logs"
                >
                  <RefreshCw size={13} className={refreshingAudit ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportAuditLogsToCSV(filteredAuditLogs)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  title="Export filtered audit logs to CSV"
                >
                  <Download size={13} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Audit Logs Table (100% Viewport Compliant with overflow-x-auto) */}
            <div
              className="rounded-xl border border-border overflow-x-auto shadow-sm"
              style={{ background: 'var(--surface)' }}
            >
              <table className="w-full text-left border-collapse min-w-[960px]">
                <thead>
                  <tr
                    className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                    style={{ background: 'var(--surface2)' }}
                  >
                    <th className="px-3.5 py-3 w-[190px]">Event ID & Time</th>
                    <th className="px-3.5 py-3 w-[210px]">Actor / User</th>
                    <th className="px-3.5 py-3 w-[130px]">Action</th>
                    <th className="px-3.5 py-3 w-[130px]">Module</th>
                    <th className="px-3.5 py-3 w-[200px]">Target Resource</th>
                    <th className="px-3.5 py-3 w-[140px]">Network & IP</th>
                    <th className="px-3.5 py-3 w-[95px]">Status</th>
                    <th className="px-3.5 py-3 w-[70px] text-center">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                        <Activity size={24} className="mx-auto mb-2 opacity-30" />
                        <div className="font-semibold text-foreground">
                          No audit events match your filter
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Try adjusting search terms or resetting the module filters.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => {
                      const actionStyle = ACTION_STYLES[log.action] || {
                        bg: 'rgba(255,255,255,0.08)',
                        color: 'var(--foreground)',
                        border: 'var(--border)',
                      };
                      const statusStyle = STATUS_STYLES[log.status] || STATUS_STYLES.success;
                      const roleConf =
                        ROLE_LEVEL_CONFIG[log.roleLevel as RoleLevel] || ROLE_LEVEL_CONFIG.L1;

                      return (
                        <tr
                          key={log.id}
                          className="hover:bg-surface2/60 transition-colors group cursor-default"
                        >
                          {/* Event ID & Time */}
                          <td className="px-3.5 py-2.5">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-foreground font-semibold">
                              <span>{log.id}</span>
                              <span
                                className="px-1.5 py-0.2 rounded text-[9px] font-medium"
                                style={{ background: 'var(--surface3)', color: 'var(--text2)' }}
                              >
                                {log.relativeTime}
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Clock size={10} />
                              <span>{log.timestamp}</span>
                            </div>
                          </td>

                          {/* Actor */}
                          <td className="px-3.5 py-2.5">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-[10px] flex-shrink-0"
                                style={{ background: roleConf.color, color: '#000' }}
                              >
                                {log.actorInitials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold text-foreground truncate flex items-center gap-1.5">
                                  <span>{log.actorName}</span>
                                  <span
                                    className="px-1 py-0.2 rounded text-[9px] font-extrabold"
                                    style={{ background: roleConf.badgeBg, color: roleConf.color }}
                                  >
                                    {log.roleLevel}
                                  </span>
                                </div>
                                <div className="text-[10px] text-muted-foreground truncate">
                                  {log.actorEmail}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Action */}
                          <td className="px-3.5 py-2.5">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border"
                              style={{
                                background: actionStyle.bg,
                                color: actionStyle.color,
                                borderColor: actionStyle.border,
                              }}
                            >
                              {log.actionLabel}
                            </span>
                          </td>

                          {/* Module */}
                          <td className="px-3.5 py-2.5">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-semibold"
                              style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                            >
                              {log.categoryLabel}
                            </span>
                          </td>

                          {/* Target Resource */}
                          <td className="px-3.5 py-2.5">
                            <div
                              className="text-xs font-medium text-foreground truncate max-w-[220px]"
                              title={log.resource}
                            >
                              {log.resource}
                            </div>
                            <div
                              className="text-[10px] text-muted-foreground truncate max-w-[220px]"
                              title={log.details}
                            >
                              {log.details}
                            </div>
                          </td>

                          {/* Network & IP */}
                          <td className="px-3.5 py-2.5">
                            <div className="font-mono text-[11px] text-foreground">
                              {log.ipAddress}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                              <Globe size={9} />
                              <span className="truncate">{log.location}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-3.5 py-2.5">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold"
                              style={{ background: statusStyle.bg, color: statusStyle.color }}
                            >
                              {log.status === 'success' && <CheckCircle2 size={10} />}
                              {log.status === 'warning' && <AlertTriangle size={10} />}
                              {log.status === 'alert' && <Shield size={10} />}
                              <span>{statusStyle.label}</span>
                            </span>
                          </td>

                          {/* View details */}
                          <td className="px-3.5 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedAuditLog(log)}
                              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface3 transition-colors cursor-pointer inline-flex items-center justify-center"
                              title="View Event Details & Payload Diff"
                            >
                              <Eye size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add New User Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New User Account"
        subtitle="Provision a dynamic account with dedicated portal assignment and credentials"
        width={500}
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="samko-label" htmlFor="user-name">
              Full Name *
            </label>
            <input
              id="user-name"
              type="text"
              required
              className="samko-input"
              placeholder="e.g. Liam Gallagher"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
          </div>

          <div>
            <label className="samko-label" htmlFor="user-email">
              Email Address *
            </label>
            <input
              id="user-email"
              type="email"
              required
              className="samko-input"
              placeholder="e.g. l.gallagher@samkocentral.com"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            />
          </div>

          <div>
            <label className="samko-label" htmlFor="user-password">
              Account Password (for testing login) *
            </label>
            <input
              id="user-password"
              type="text"
              required
              className="samko-input font-mono"
              placeholder="e.g. User2026!"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              This password will be immediately usable to sign in at the login screen.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="samko-label" htmlFor="user-role-level">
                Role Tier (Level) *
              </label>
              <CustomDropdown
                id="user-role-level"
                variant="form"
                width="100%"
                value={newUser.roleLevel}
                onChange={(val) => {
                  const role = val as RoleLevel;
                  setNewUser({
                    ...newUser,
                    roleLevel: role,
                    tabPermissions: getDefaultTabPermissionsForRole(role),
                  });
                }}
                options={[
                  ...(isSuperAdmin ? [{ value: 'L1', label: 'L1 – Super Admin' }] : []),
                  ...(isSuperAdmin ? [{ value: 'L2', label: 'L2 – Admin' }] : []),
                  { value: 'L3', label: 'L3 – Uploader' },
                  { value: 'L4', label: 'L4 – Viewer (Read-only)' },
                ]}
              />
            </div>

            <div>
              <label className="samko-label" htmlFor="user-portal">
                Portal Assignment *
              </label>
              <CustomDropdown
                id="user-portal"
                variant="form"
                width="100%"
                value={newUser.portal}
                onChange={(val) => setNewUser({ ...newUser, portal: val as PortalType })}
                options={[
                  ...(isSuperAdmin ? [{ value: 'both', label: 'Both (Propco & Opco)' }] : []),
                  { value: 'propco', label: 'Propco Portal' },
                  { value: 'opco', label: 'Opco Portal' },
                ]}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="samko-label mb-0" htmlFor="user-hotel">
                Assigned Properties *{' '}
                <span className="text-[11px] font-normal text-muted-foreground">
                  (Select 1 or multiple)
                </span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setNewUser({
                      ...newUser,
                      assignedProperties: ['All Properties'],
                      hotel: 'All Properties',
                    })
                  }
                  className="text-[11px] text-[#e8c97a] hover:underline cursor-pointer"
                >
                  All Properties
                </button>
                <span className="text-white/20">|</span>
                <button
                  type="button"
                  onClick={() =>
                    setNewUser({
                      ...newUser,
                      assignedProperties: [],
                      hotel: '',
                    })
                  }
                  className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
            <CustomDropdown
              id="user-hotel"
              variant="form"
              width="100%"
              multiple
              placeholder="Select assigned properties..."
              value={newUser.assignedProperties}
              onChange={(vals: string[]) => {
                setNewUser({
                  ...newUser,
                  assignedProperties: vals,
                  hotel:
                    vals.length > 0
                      ? vals.includes('all') || vals.includes('All Properties')
                        ? 'All Properties'
                        : vals.join(', ')
                      : 'No Property Assigned',
                });
              }}
              options={dynamicPropertyOptions}
            />

            {/* Selected Property Tags with Remove X */}
            {newUser.assignedProperties.length > 0 &&
              !newUser.assignedProperties.includes('all') &&
              !newUser.assignedProperties.includes('All Properties') && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {newUser.assignedProperties.map((prop) => (
                    <span
                      key={prop}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border"
                      style={{
                        background: 'rgba(232, 201, 122, 0.12)',
                        borderColor: '#e8c97a',
                        color: '#e8c97a',
                      }}
                    >
                      <span>{prop}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = newUser.assignedProperties.filter((p) => p !== prop);
                          setNewUser({
                            ...newUser,
                            assignedProperties: next,
                            hotel: next.length > 0 ? next.join(', ') : 'No Property Assigned',
                          });
                        }}
                        className="hover:text-rose-400 p-0.5 transition-colors cursor-pointer"
                        title={`Remove ${prop}`}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

            {/* Direct Quick-Toggle Property Buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2.5 max-h-36 overflow-y-auto pr-1">
              {dynamicPropertyOptions.map((opt) => {
                const isAllOpt = opt.value.toLowerCase().startsWith('all');
                const isSelected = isAllOpt
                  ? newUser.assignedProperties.some((p) => p.toLowerCase().startsWith('all'))
                  : newUser.assignedProperties.includes(opt.value);

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      if (isAllOpt) {
                        setNewUser({
                          ...newUser,
                          assignedProperties: ['All Properties'],
                          hotel: 'All Properties',
                        });
                      } else {
                        const withoutAll = newUser.assignedProperties.filter(
                          (p) => !p.toLowerCase().startsWith('all')
                        );
                        let next: string[];
                        if (withoutAll.includes(opt.value)) {
                          next = withoutAll.filter((p) => p !== opt.value);
                        } else {
                          next = [...withoutAll, opt.value];
                        }
                        setNewUser({
                          ...newUser,
                          assignedProperties: next,
                          hotel: next.length > 0 ? next.join(', ') : 'No Property Assigned',
                        });
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#e8c97a]/20 border-[#e8c97a] text-[#e8c97a] shadow-sm font-semibold'
                        : 'bg-white/[0.04] border-white/10 text-muted-foreground hover:border-white/30 hover:text-foreground'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-[3px] flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-[#e8c97a] text-[#121316]'
                          : 'border border-white/30 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check size={10} strokeWidth={3.5} />}
                    </div>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Add New Custom Property On-the-Fly */}
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
              <input
                type="text"
                placeholder="Add another new property..."
                value={newAddCustomPropertyInput}
                onChange={(e) => setNewAddCustomPropertyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = newAddCustomPropertyInput.trim();
                    if (val) {
                      saveCustomProperty(val);
                      const withoutAll = newUser.assignedProperties.filter(
                        (p) => !p.toLowerCase().startsWith('all')
                      );
                      const next = withoutAll.includes(val) ? withoutAll : [...withoutAll, val];
                      setNewUser({ ...newUser, assignedProperties: next, hotel: next.join(', ') });
                      setNewAddCustomPropertyInput('');
                      toast.success(`Assigned "${val}" to new user`);
                    }
                  }
                }}
                className="samko-input text-xs flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  const val = newAddCustomPropertyInput.trim();
                  if (!val) return;
                  saveCustomProperty(val);
                  const withoutAll = newUser.assignedProperties.filter(
                    (p) => !p.toLowerCase().startsWith('all')
                  );
                  const next = withoutAll.includes(val) ? withoutAll : [...withoutAll, val];
                  setNewUser({ ...newUser, assignedProperties: next, hotel: next.join(', ') });
                  setNewAddCustomPropertyInput('');
                  toast.success(`Assigned "${val}" to new user`);
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-primary/40 text-primary hover:bg-primary hover:text-black transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus size={11} className="inline mr-1" /> Add
              </button>
            </div>
          </div>

          {/* Tab-Level Permissions Configuration */}
          <div
            className="rounded-xl border border-border p-3.5 mt-2"
            style={{ background: 'var(--surface2)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-head text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <SlidersHorizontal size={13} className="text-primary" /> Tab Permissions &amp;
                Access Controls
              </span>
              <span className="text-[10px] text-muted-foreground">
                Configured according to {newUser.roleLevel} role
              </span>
            </div>
            <TabPermissionsEditor
              permissions={
                newUser.tabPermissions || getDefaultTabPermissionsForRole(newUser.roleLevel)
              }
              onChange={(newPerms) => setNewUser({ ...newUser, tabPermissions: newPerms })}
              roleLevel={newUser.roleLevel}
              userName={newUser.name}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-3">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="samko-btn-ghost text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingUser}
              className="samko-btn-primary flex items-center gap-1.5 text-xs font-semibold"
            >
              {savingUser ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Create & Persist User
            </button>
          </div>
        </form>
      </Modal>

      {/* View User Details Modal */}
      <Modal
        open={!!viewingUser}
        onClose={() => setViewingUser(null)}
        title="User Account Details"
        subtitle="Comprehensive profile, role permissions, and portal credentials"
        width={680}
      >
        {viewingUser && (
          <div className="space-y-4">
            {/* User Header Profile Card */}
            <div
              className="p-4 rounded-xl border border-border flex items-center justify-between"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0"
                  style={{
                    background: `${ROLE_LEVEL_CONFIG[viewingUser.roleLevel]?.color || '#a78bfa'}22`,
                    color: ROLE_LEVEL_CONFIG[viewingUser.roleLevel]?.color || '#a78bfa',
                    border: `1px solid ${ROLE_LEVEL_CONFIG[viewingUser.roleLevel]?.color || '#a78bfa'}44`,
                  }}
                >
                  {viewingUser.initials}
                </div>
                <div>
                  <div className="font-bold text-base text-foreground flex items-center gap-1.5">
                    {viewingUser.name}
                    {viewingUser.roleLevel === 'L1' && (
                      <Crown size={14} style={{ color: '#f43f5e' }} />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">{viewingUser.email}</div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                  style={{
                    background: ROLE_LEVEL_CONFIG[viewingUser.roleLevel]?.badgeBg,
                    color: ROLE_LEVEL_CONFIG[viewingUser.roleLevel]?.color,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: ROLE_LEVEL_CONFIG[viewingUser.roleLevel]?.color }}
                  />
                  {viewingUser.roleLevel} · {viewingUser.roleTitle}
                </span>
                {viewingUser.status === 'active' ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle2 size={11} /> Active Account
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    <XCircle size={11} /> Inactive
                  </span>
                )}
              </div>
            </div>

            {/* Grid of Attributes */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div
                className="p-3 rounded-lg border border-border/60"
                style={{ background: 'var(--surface)' }}
              >
                <span className="text-muted-foreground font-medium block mb-1">Portal Access</span>
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Building2 size={13} className="text-primary" />
                  {viewingUser.portal === 'both'
                    ? 'Both (Propco & Opco)'
                    : viewingUser.portal === 'propco'
                      ? 'Propco Portal Only'
                      : 'Opco Portal Only'}
                </span>
              </div>

              <div
                className="p-3 rounded-lg border border-border/60"
                style={{ background: 'var(--surface)' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground font-medium">Assigned Properties</span>
                  <button
                    type="button"
                    onClick={() => {
                      const u = viewingUser;
                      setViewingUser(null);
                      openPropertyModal(u);
                    }}
                    className="text-[11px] text-[#e8c97a] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={10} /> Manage Properties
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {viewingUser.assignedProperties &&
                  viewingUser.assignedProperties.length > 0 &&
                  !viewingUser.assignedProperties.includes('all') &&
                  !viewingUser.assignedProperties.includes('All Properties') ? (
                    viewingUser.assignedProperties.map((p) => (
                      <span
                        key={p}
                        className="px-1.5 py-0.5 rounded text-[11px] font-medium border"
                        style={{
                          background: 'rgba(232, 201, 122, 0.1)',
                          borderColor: 'rgba(232, 201, 122, 0.25)',
                          color: '#e8c97a',
                        }}
                      >
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="font-semibold text-foreground">
                      {viewingUser.hotel || 'All Properties'}
                    </span>
                  )}
                </div>
              </div>

              <div
                className="p-3 rounded-lg border border-border/60"
                style={{ background: 'var(--surface)' }}
              >
                <span className="text-muted-foreground font-medium block mb-1">
                  Last Platform Sign-in
                </span>
                <span className="font-mono text-foreground">
                  {viewingUser.lastLogin || 'Never'}
                </span>
              </div>

              <div
                className="p-3 rounded-lg border border-border/60"
                style={{ background: 'var(--surface)' }}
              >
                <span className="text-muted-foreground font-medium block mb-1">Account Status</span>
                <span className="font-semibold text-xs capitalize text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} /> {viewingUser.status}
                </span>
              </div>
            </div>

            {/* Role Permissions Capability Checklist */}
            <div
              className="rounded-lg border border-border/60 p-3"
              style={{ background: 'var(--surface)' }}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Permission Rights ({viewingUser.roleLevel} · {viewingUser.roleTitle})
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {PERMISSION_MATRIX[viewingUser.roleLevel]?.map((perm) => (
                  <div
                    key={perm.label}
                    className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0"
                  >
                    <span className="text-foreground">{perm.label}</span>
                    {perm.allowed ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                        <CheckCircle2 size={11} /> Allowed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                        <XCircle size={11} /> Restricted
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tab-Level Permissions Summary (Read-Only) */}
            <div
              className="rounded-xl border border-border p-3.5"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-head text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <SlidersHorizontal size={13} className="text-primary" /> Tab Permissions &amp;
                  Access Controls
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Current configuration for {viewingUser.roleLevel}
                </span>
              </div>
              <TabPermissionsEditor
                permissions={
                  viewingUser.tabPermissions ||
                  getDefaultTabPermissionsForRole(viewingUser.roleLevel)
                }
                roleLevel={viewingUser.roleLevel}
                userName={viewingUser.name}
                readOnly={true}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="samko-btn-ghost text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = viewingUser;
                  setViewingUser(null);
                  handleStartEdit(target);
                }}
                className="samko-btn-primary flex items-center gap-1.5 text-xs font-semibold"
              >
                <Edit2 size={13} /> Edit User Account
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit User Modal */}
      <Modal
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit User Account"
        subtitle={
          editingUser
            ? `Update credentials, role permissions, and portal for ${editingUser.name}`
            : ''
        }
        width={680}
      >
        {editingUser && (
          <form onSubmit={handleSaveEditUser} className="space-y-4">
            <div>
              <label className="samko-label" htmlFor="edit-user-name">
                Full Name *
              </label>
              <input
                id="edit-user-name"
                type="text"
                required
                className="samko-input"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div>
              <label className="samko-label" htmlFor="edit-user-email">
                Email Address *
              </label>
              <input
                id="edit-user-email"
                type="email"
                required
                className="samko-input"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>

            <div>
              <label className="samko-label" htmlFor="edit-user-password">
                Testing Password *
              </label>
              <input
                id="edit-user-password"
                type="text"
                required
                className="samko-input font-mono"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="samko-label" htmlFor="edit-user-role-level">
                  Role Tier (Level) *
                </label>
                <CustomDropdown
                  id="edit-user-role-level"
                  variant="form"
                  width="100%"
                  value={editForm.roleLevel}
                  onChange={(val) => setEditForm({ ...editForm, roleLevel: val as RoleLevel })}
                  disabled={editingUser.roleLevel === 'L1' && !isSuperAdmin}
                  options={[
                    ...(isSuperAdmin ? [{ value: 'L1', label: 'L1 – Super Admin' }] : []),
                    ...(isSuperAdmin ? [{ value: 'L2', label: 'L2 – Admin' }] : []),
                    { value: 'L3', label: 'L3 – Uploader' },
                    { value: 'L4', label: 'L4 – Viewer (Read-only)' },
                  ]}
                />
              </div>

              <div>
                <label className="samko-label" htmlFor="edit-user-portal">
                  Portal Assignment *
                </label>
                <CustomDropdown
                  id="edit-user-portal"
                  variant="form"
                  width="100%"
                  value={editForm.portal}
                  onChange={(val) => setEditForm({ ...editForm, portal: val as PortalType })}
                  options={[
                    ...(isSuperAdmin ? [{ value: 'both', label: 'Both (Propco & Opco)' }] : []),
                    { value: 'propco', label: 'Propco Portal' },
                    { value: 'opco', label: 'Opco Portal' },
                  ]}
                />
              </div>

              <div>
                <label className="samko-label" htmlFor="edit-user-status">
                  Account Status *
                </label>
                <CustomDropdown
                  id="edit-user-status"
                  variant="form"
                  width="100%"
                  value={editForm.status}
                  onChange={(val) =>
                    setEditForm({ ...editForm, status: val as 'active' | 'inactive' })
                  }
                  options={[
                    { value: 'active', label: 'Active', color: '#10b981' },
                    { value: 'inactive', label: 'Inactive', color: '#ef4444' },
                  ]}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="samko-label mb-0" htmlFor="edit-user-hotel">
                  Assigned Properties *{' '}
                  <span className="text-[11px] font-normal text-muted-foreground">
                    (Select 1 or multiple)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        assignedProperties: ['All Properties'],
                        hotel: 'All Properties',
                      })
                    }
                    className="text-[11px] text-[#e8c97a] hover:underline cursor-pointer"
                  >
                    All Properties
                  </button>
                  <span className="text-white/20">|</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        assignedProperties: [],
                        hotel: '',
                      })
                    }
                    className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <CustomDropdown
                id="edit-user-hotel"
                variant="form"
                width="100%"
                multiple
                placeholder="Select assigned properties..."
                value={editForm.assignedProperties}
                onChange={(vals: string[]) => {
                  setEditForm({
                    ...editForm,
                    assignedProperties: vals,
                    hotel:
                      vals.length > 0
                        ? vals.includes('all') || vals.includes('All Properties')
                          ? 'All Properties'
                          : vals.join(', ')
                        : 'No Property Assigned',
                  });
                }}
                options={dynamicPropertyOptions}
              />

              {/* Selected Property Tags with Remove X */}
              {editForm.assignedProperties.length > 0 &&
                !editForm.assignedProperties.includes('all') &&
                !editForm.assignedProperties.includes('All Properties') && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {editForm.assignedProperties.map((prop) => (
                      <span
                        key={prop}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border"
                        style={{
                          background: 'rgba(232, 201, 122, 0.12)',
                          borderColor: '#e8c97a',
                          color: '#e8c97a',
                        }}
                      >
                        <span>{prop}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (editingUser) {
                              setPropertyRemovalConfirm({
                                user: editingUser,
                                property: prop,
                                onConfirmOverride: () => {
                                  const next = editForm.assignedProperties.filter(
                                    (p) => p !== prop
                                  );
                                  setEditForm({
                                    ...editForm,
                                    assignedProperties: next,
                                    hotel:
                                      next.length > 0 ? next.join(', ') : 'No Property Assigned',
                                  });
                                },
                              });
                            } else {
                              const next = editForm.assignedProperties.filter((p) => p !== prop);
                              setEditForm({
                                ...editForm,
                                assignedProperties: next,
                                hotel: next.length > 0 ? next.join(', ') : 'No Property Assigned',
                              });
                            }
                          }}
                          className="hover:text-rose-400 p-0.5 transition-colors cursor-pointer"
                          title={`Remove ${prop}`}
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

              {/* Direct Quick-Toggle Property Buttons */}
              <div className="flex flex-wrap gap-1.5 mt-2.5 max-h-36 overflow-y-auto pr-1">
                {dynamicPropertyOptions.map((opt) => {
                  const isAllOpt = opt.value.toLowerCase().startsWith('all');
                  const isSelected = isAllOpt
                    ? editForm.assignedProperties.some((p) => p.toLowerCase().startsWith('all'))
                    : editForm.assignedProperties.includes(opt.value);

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        if (isAllOpt) {
                          setEditForm({
                            ...editForm,
                            assignedProperties: ['All Properties'],
                            hotel: 'All Properties',
                          });
                        } else {
                          const withoutAll = editForm.assignedProperties.filter(
                            (p) => !p.toLowerCase().startsWith('all')
                          );
                          let next: string[];
                          if (withoutAll.includes(opt.value)) {
                            next = withoutAll.filter((p) => p !== opt.value);
                          } else {
                            next = [...withoutAll, opt.value];
                          }
                          setEditForm({
                            ...editForm,
                            assignedProperties: next,
                            hotel: next.length > 0 ? next.join(', ') : 'No Property Assigned',
                          });
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#e8c97a]/20 border-[#e8c97a] text-[#e8c97a] shadow-sm font-semibold'
                          : 'bg-white/[0.04] border-white/10 text-muted-foreground hover:border-white/30 hover:text-foreground'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-[3px] flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-[#e8c97a] text-[#121316]'
                            : 'border border-white/30 bg-transparent'
                        }`}
                      >
                        {isSelected && <Check size={10} strokeWidth={3.5} />}
                      </div>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Add New Custom Property On-the-Fly */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                <input
                  type="text"
                  placeholder="Add another new property..."
                  value={newEditCustomPropertyInput}
                  onChange={(e) => setNewEditCustomPropertyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = newEditCustomPropertyInput.trim();
                      if (val) {
                        saveCustomProperty(val);
                        const withoutAll = editForm.assignedProperties.filter(
                          (p) => !p.toLowerCase().startsWith('all')
                        );
                        const next = withoutAll.includes(val) ? withoutAll : [...withoutAll, val];
                        setEditForm({
                          ...editForm,
                          assignedProperties: next,
                          hotel: next.join(', '),
                        });
                        setNewEditCustomPropertyInput('');
                        toast.success(`Assigned "${val}" to ${editForm.name}`);
                      }
                    }
                  }}
                  className="samko-input text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = newEditCustomPropertyInput.trim();
                    if (!val) return;
                    saveCustomProperty(val);
                    const withoutAll = editForm.assignedProperties.filter(
                      (p) => !p.toLowerCase().startsWith('all')
                    );
                    const next = withoutAll.includes(val) ? withoutAll : [...withoutAll, val];
                    setEditForm({ ...editForm, assignedProperties: next, hotel: next.join(', ') });
                    setNewEditCustomPropertyInput('');
                    toast.success(`Assigned "${val}" to ${editForm.name}`);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-primary/40 text-primary hover:bg-primary hover:text-black transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus size={11} className="inline mr-1" /> Add
                </button>
              </div>
            </div>

            {/* Tab-Level Permissions Configuration */}
            <div
              className="rounded-xl border border-border p-3.5 mt-2"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-head text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <SlidersHorizontal size={13} className="text-primary" /> Tab Permissions &amp;
                  Access Controls
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Configured according to {editForm.roleLevel} role
                </span>
              </div>
              <TabPermissionsEditor
                permissions={
                  editForm.tabPermissions || getDefaultTabPermissionsForRole(editForm.roleLevel)
                }
                onChange={(newPerms) => setEditForm({ ...editForm, tabPermissions: newPerms })}
                roleLevel={editForm.roleLevel}
                userName={editForm.name}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-3">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="samko-btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="samko-btn-primary flex items-center gap-1.5 text-xs font-semibold"
              >
                {savingEdit ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Quick Tab Permissions Modal (Super Admin Control) */}
      <Modal
        open={!!permissionsModalUser}
        onClose={() => setPermissionsModalUser(null)}
        title={
          permissionsModalUser
            ? `Configure Tab Permissions · ${permissionsModalUser.name}`
            : 'Configure Tab Permissions'
        }
        subtitle={
          permissionsModalUser
            ? `Enable/Disable tabs and select Read Only (viewing) vs Edit & Write access levels for ${permissionsModalUser.email} (${permissionsModalUser.roleLevel})`
            : ''
        }
        width={720}
      >
        {permissionsModalUser && (
          <div className="space-y-4">
            <div
              className="p-3 rounded-lg border border-border flex items-center justify-between"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs"
                  style={{
                    background: `${ROLE_LEVEL_CONFIG[permissionsModalUser.roleLevel]?.color || '#a78bfa'}22`,
                    color: ROLE_LEVEL_CONFIG[permissionsModalUser.roleLevel]?.color || '#a78bfa',
                    border: `1px solid ${ROLE_LEVEL_CONFIG[permissionsModalUser.roleLevel]?.color || '#a78bfa'}44`,
                  }}
                >
                  {permissionsModalUser.initials}
                </div>
                <div>
                  <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    {permissionsModalUser.name}
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold"
                      style={{
                        background: ROLE_LEVEL_CONFIG[permissionsModalUser.roleLevel]?.badgeBg,
                        color: ROLE_LEVEL_CONFIG[permissionsModalUser.roleLevel]?.color,
                      }}
                    >
                      {permissionsModalUser.roleLevel} · {permissionsModalUser.roleTitle}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {permissionsModalUser.email}
                  </div>
                </div>
              </div>
              <div className="text-right text-[11px] text-muted-foreground">
                Assigned:{' '}
                <span className="font-medium text-foreground">{permissionsModalUser.hotel}</span>
              </div>
            </div>

            <TabPermissionsEditor
              permissions={tempModalPermissions}
              readOnly={!isSuperAdmin}
              onChange={(newPerms) => isSuperAdmin && setTempModalPermissions(newPerms)}
              roleLevel={permissionsModalUser.roleLevel}
              userName={permissionsModalUser.name}
              onSyncUsersInRole={handleSyncUsersInRole}
              onAssignToAllUsers={handleAssignTabToAllUsers}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-3">
              <button
                type="button"
                onClick={() => setPermissionsModalUser(null)}
                className="samko-btn-ghost text-xs"
              >
                {isSuperAdmin ? 'Cancel' : 'Close'}
              </button>
              {isSuperAdmin && (
                <button
                  type="button"
                  disabled={savingPermissions}
                  onClick={handleSaveModalPermissions}
                  className="samko-btn-primary flex items-center gap-1.5 text-xs font-semibold"
                >
                  {savingPermissions ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Check size={13} />
                  )}
                  Save &amp; Apply Permissions
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Audit Event Details Modal */}
      <Modal
        open={!!selectedAuditLog}
        onClose={() => setSelectedAuditLog(null)}
        title="Audit Event Details"
        subtitle={`System Event ${selectedAuditLog?.id} · Verified Ledger Entry`}
        width={600}
      >
        {selectedAuditLog && (
          <div className="space-y-4">
            {/* Header Status & Action Bar */}
            <div
              className="flex items-center justify-between p-3.5 rounded-xl border border-border"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="px-2.5 py-1 rounded text-xs font-bold border"
                  style={{
                    background: ACTION_STYLES[selectedAuditLog.action]?.bg || 'transparent',
                    color: ACTION_STYLES[selectedAuditLog.action]?.color || 'inherit',
                    borderColor: ACTION_STYLES[selectedAuditLog.action]?.border || 'transparent',
                  }}
                >
                  {selectedAuditLog.actionLabel}
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[11px] font-semibold"
                  style={{ background: 'var(--surface3)', color: 'var(--text2)' }}
                >
                  {selectedAuditLog.categoryLabel}
                </span>
              </div>

              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold"
                style={{
                  background: STATUS_STYLES[selectedAuditLog.status]?.bg,
                  color: STATUS_STYLES[selectedAuditLog.status]?.color,
                }}
              >
                {selectedAuditLog.status === 'success' && <CheckCircle2 size={12} />}
                {selectedAuditLog.status === 'warning' && <AlertTriangle size={12} />}
                {selectedAuditLog.status === 'alert' && <Shield size={12} />}
                <span>{STATUS_STYLES[selectedAuditLog.status]?.label}</span>
              </span>
            </div>

            {/* Actor Card */}
            <div
              className="rounded-xl border border-border p-3.5"
              style={{ background: 'var(--surface)' }}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                <Users size={11} /> Actor Profile
              </div>
              <div className="flex items-center justify-between">
                {(() => {
                  const roleConf =
                    ROLE_LEVEL_CONFIG[selectedAuditLog.roleLevel as RoleLevel] ||
                    ROLE_LEVEL_CONFIG.L1;
                  return (
                    <>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs"
                          style={{
                            background: roleConf.color,
                            color: '#000',
                          }}
                        >
                          {selectedAuditLog.actorInitials}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-foreground flex items-center gap-2">
                            <span>{selectedAuditLog.actorName}</span>
                            <span
                              className="px-1.5 py-0.2 rounded text-[10px] font-extrabold"
                              style={{
                                background: roleConf.badgeBg,
                                color: roleConf.color,
                              }}
                            >
                              {selectedAuditLog.roleLevel}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {selectedAuditLog.actorEmail}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-semibold text-foreground">
                          {roleConf.title}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Certified Role Authority
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Event Description & Resource */}
            <div
              className="rounded-xl border border-border p-3.5"
              style={{ background: 'var(--surface)' }}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <FileText size={11} /> Impact & Target Resource
              </div>
              <div className="text-xs font-semibold text-primary mb-1">
                {selectedAuditLog.resource}
              </div>
              <p className="text-xs text-foreground leading-relaxed">{selectedAuditLog.details}</p>
            </div>

            {/* Metadata Diff (Previous vs Current) */}
            {selectedAuditLog.diff && selectedAuditLog.diff.length > 0 && (
              <div
                className="rounded-xl border border-border p-3.5"
                style={{ background: 'var(--surface)' }}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                  <Layers size={11} /> State Transition & Field Diffs
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border text-[10px] font-bold uppercase text-muted-foreground">
                        <th className="py-1 px-2">Field</th>
                        <th className="py-1 px-2">Previous State</th>
                        <th className="py-1 px-2"></th>
                        <th className="py-1 px-2">New State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {selectedAuditLog.diff.map((d, i) => (
                        <tr key={i} className="font-mono text-[11px]">
                          <td className="py-1.5 px-2 text-foreground font-semibold">{d.field}</td>
                          <td className="py-1.5 px-2 text-rose-400 bg-rose-500/10 rounded line-through">
                            {d.previous}
                          </td>
                          <td className="py-1.5 px-1 text-center text-muted-foreground">→</td>
                          <td className="py-1.5 px-2 text-emerald-400 bg-emerald-500/10 rounded font-bold">
                            {d.current}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Network & Origin Details */}
            <div
              className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-border text-xs"
              style={{ background: 'var(--surface2)' }}
            >
              <div>
                <div className="text-[10px] font-bold uppercase text-muted-foreground">
                  Client IP Address
                </div>
                <div className="font-mono text-xs text-foreground mt-0.5">
                  {selectedAuditLog.ipAddress}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-muted-foreground">
                  Geographic Origin
                </div>
                <div className="text-xs text-foreground mt-0.5 flex items-center gap-1">
                  <Globe size={11} className="text-muted-foreground" />
                  <span>{selectedAuditLog.location}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-muted-foreground">
                  Timestamp (UTC)
                </div>
                <div className="text-xs text-foreground mt-0.5 font-mono">
                  {selectedAuditLog.timestamp}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-muted-foreground">
                  Device & User Agent
                </div>
                <div
                  className="text-[10px] text-muted-foreground mt-0.5 truncate"
                  title={selectedAuditLog.userAgent || 'Web Browser'}
                >
                  {selectedAuditLog.userAgent || 'Enterprise Browser Client'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedAuditLog(null)}
                className="samko-btn-primary text-xs font-semibold px-4 py-1.5"
              >
                Close Audit Inspection
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Quick Property Assignment Modal */}
      <Modal
        open={Boolean(propertyModalUser)}
        onClose={() => setPropertyModalUser(null)}
        title="Manage Assigned Properties"
        subtitle={
          propertyModalUser
            ? `Assign or remove property access for ${propertyModalUser.name} (${propertyModalUser.roleLevel} · ${propertyModalUser.roleTitle})`
            : ''
        }
        width={580}
      >
        {propertyModalUser && (
          <div className="space-y-4">
            {/* User Profile Summary */}
            <div
              className="flex items-center justify-between p-3 rounded-xl border border-border"
              style={{ background: 'var(--surface2)' }}
            >
              <div>
                <div className="font-semibold text-sm text-foreground">
                  {propertyModalUser.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {propertyModalUser.email} · {propertyModalUser.roleTitle}
                </div>
              </div>
              <span
                className="px-2 py-0.5 rounded text-[11px] font-bold"
                style={{
                  background: ROLE_LEVEL_CONFIG[propertyModalUser.roleLevel]?.badgeBg,
                  color: ROLE_LEVEL_CONFIG[propertyModalUser.roleLevel]?.color,
                }}
              >
                {propertyModalUser.roleLevel}
              </span>
            </div>

            {/* Currently Assigned Properties Header & Chips */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="samko-label mb-0">
                  Currently Assigned Properties (
                  {tempAssignedProperties.filter((p) => !p.toLowerCase().startsWith('all')).length})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTempAssignedProperties(['All Properties'])}
                    className="text-[11px] text-[#e8c97a] hover:underline cursor-pointer"
                  >
                    All Properties
                  </button>
                  <span className="text-white/20">|</span>
                  <button
                    type="button"
                    onClick={() => setTempAssignedProperties([])}
                    className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {tempAssignedProperties.includes('all') ||
              tempAssignedProperties.includes('All Properties') ? (
                <div className="p-3 rounded-lg border border-border/60 bg-white/[0.02] flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <Globe size={13} className="text-primary" /> Full Portfolio Oversight (All
                    Properties Assigned)
                  </span>
                  <button
                    type="button"
                    onClick={() => setTempAssignedProperties([])}
                    className="text-xs text-rose-400 hover:underline cursor-pointer"
                  >
                    Remove All Access
                  </button>
                </div>
              ) : tempAssignedProperties.length === 0 ? (
                <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>
                    No properties assigned. This user will have restricted access until a property
                    is assigned.
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-border/60 bg-white/[0.02] min-h-[46px] items-center">
                  {tempAssignedProperties.map((prop) => (
                    <span
                      key={prop}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
                      style={{
                        background: 'rgba(232, 201, 122, 0.15)',
                        borderColor: '#e8c97a',
                        color: '#e8c97a',
                      }}
                    >
                      <Building2 size={12} />
                      <span>{prop}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (propertyModalUser) {
                            setPropertyRemovalConfirm({
                              user: propertyModalUser,
                              property: prop,
                              onConfirmOverride: () => {
                                setTempAssignedProperties((prev) => prev.filter((p) => p !== prop));
                              },
                            });
                          } else {
                            setTempAssignedProperties((prev) => prev.filter((p) => p !== prop));
                          }
                        }}
                        className="hover:bg-rose-500/20 hover:text-rose-400 rounded p-0.5 transition-colors cursor-pointer"
                        title={`Remove ${prop}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Toggle Available Properties */}
            <div>
              <label className="samko-label mb-1.5">Select Properties to Assign or Remove</label>
              <div
                className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1 p-2 rounded-xl border border-border"
                style={{ background: 'var(--surface)' }}
              >
                {dynamicPropertyOptions.map((opt) => {
                  const isAllOpt = opt.value.toLowerCase().startsWith('all');
                  const isSelected = isAllOpt
                    ? tempAssignedProperties.some((p) => p.toLowerCase().startsWith('all'))
                    : tempAssignedProperties.includes(opt.value);

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        if (isAllOpt) {
                          setTempAssignedProperties(['All Properties']);
                        } else {
                          const withoutAll = tempAssignedProperties.filter(
                            (p) => !p.toLowerCase().startsWith('all')
                          );
                          if (withoutAll.includes(opt.value)) {
                            setTempAssignedProperties(withoutAll.filter((p) => p !== opt.value));
                          } else {
                            setTempAssignedProperties([...withoutAll, opt.value]);
                          }
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#e8c97a]/20 border-[#e8c97a] text-[#e8c97a] font-semibold'
                          : 'bg-white/[0.04] border-white/10 text-muted-foreground hover:border-white/30 hover:text-foreground'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-[3px] flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-[#e8c97a] text-black font-bold'
                            : 'border border-white/30'
                        }`}
                      >
                        {isSelected && <Check size={10} className="stroke-[3]" />}
                      </div>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add New Custom Property On-the-Fly */}
            <div className="pt-2 border-t border-border">
              <label className="samko-label mb-1">Add &amp; Assign a New Property</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter new property or hotel name..."
                  value={newCustomPropertyInput}
                  onChange={(e) => setNewCustomPropertyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = newCustomPropertyInput.trim();
                      if (val) {
                        saveCustomProperty(val);
                        const withoutAll = tempAssignedProperties.filter(
                          (p) => !p.toLowerCase().startsWith('all')
                        );
                        if (!withoutAll.includes(val)) {
                          setTempAssignedProperties([...withoutAll, val]);
                        }
                        setNewCustomPropertyInput('');
                        toast.success(`Added & assigned "${val}"`);
                      }
                    }
                  }}
                  className="samko-input text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = newCustomPropertyInput.trim();
                    if (!val) return;
                    saveCustomProperty(val);
                    const withoutAll = tempAssignedProperties.filter(
                      (p) => !p.toLowerCase().startsWith('all')
                    );
                    if (!withoutAll.includes(val)) {
                      setTempAssignedProperties([...withoutAll, val]);
                    }
                    setNewCustomPropertyInput('');
                    toast.success(`Added & assigned "${val}"`);
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-semibold border border-primary/40 text-primary hover:bg-primary hover:text-black transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus size={12} className="inline mr-1" /> Add &amp; Assign
                </button>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-3">
              <button
                type="button"
                onClick={() => setPropertyModalUser(null)}
                className="samko-btn-ghost text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingUserProperties}
                onClick={async () => {
                  if (!propertyModalUser) return;
                  const target = propertyModalUser;
                  const propsToSave = [...tempAssignedProperties];
                  setPropertyModalUser(null);
                  await handleUpdateUserProperties(target, propsToSave);
                }}
                className="samko-btn-primary flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                {savingUserProperties ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                Save Property Assignments
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Universal Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={async () => {
          if (!userToDelete) return;
          setIsDeletingUser(true);
          try {
            await handleDeleteUser(userToDelete);
          } finally {
            setIsDeletingUser(false);
            setUserToDelete(null);
          }
        }}
        title="Confirm Deletion"
        itemIdentifier={userToDelete?.id}
        itemName={userToDelete?.name || 'User Account'}
        registerName="user directory"
        isDeleting={isDeletingUser}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Confirm Bulk Deletion"
        itemName={`${selectedUserIds.length} Selected Users`}
        registerName="user directory"
        customWarning={`Are you sure you want to permanently delete these ${selectedUserIds.length} selected user accounts? They will immediately lose access and this action cannot be undone.`}
        confirmButtonText={`Delete ${selectedUserIds.length} Users`}
        isDeleting={isBulkDeleting}
      />

      {/* Property Removal Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(propertyRemovalConfirm)}
        onClose={() => setPropertyRemovalConfirm(null)}
        onConfirm={() => {
          if (!propertyRemovalConfirm) return;
          if (propertyRemovalConfirm.onConfirmOverride) {
            propertyRemovalConfirm.onConfirmOverride();
          } else {
            handleRemovePropertyFromUser(
              propertyRemovalConfirm.user,
              propertyRemovalConfirm.property
            );
          }
          setPropertyRemovalConfirm(null);
        }}
        title="Remove Assigned Property"
        itemName={propertyRemovalConfirm?.property || 'Property'}
        confirmButtonText="Remove Property Assignment"
        customWarning={`Are you sure you want to remove "${propertyRemovalConfirm?.property}" from ${propertyRemovalConfirm?.user?.name}? All property records, assets, documents, and operational data will safely stay in the database. Only this user's viewing assignment will be removed.`}
      />
    </div>
  );
}
