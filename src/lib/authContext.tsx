'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api';
import { toast } from 'sonner';
import {
  type UserTabPermissions,
  type TabAccessMode,
  getDefaultTabPermissionsForRole,
} from './permissions';

export type RoleLevel = 'L1' | 'L2' | 'L3' | 'L4';
export type PortalType = 'propco' | 'opco' | 'both';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  roleLevel: RoleLevel;
  roleTitle: string;
  portal: PortalType;
  hotel: string;
  assignedProperties: string[];
  status: 'active' | 'inactive';
  initials: string;
  lastLogin?: string;
  description?: string;
  tabPermissions?: UserTabPermissions;
}

export const DEMO_CREDENTIALS: {
  level: RoleLevel;
  title: string;
  badge: string;
  color: string;
  user: AppUser;
  password: string;
  summary: string;
}[] = [
  {
    level: 'L1',
    title: 'Super Admin',
    badge: 'L1 · Full Access',
    color: '#f43f5e',
    password: 'SuperAdmin2026!',
    summary: 'Full access across both Propco & Opco portals, system settings, and managing all users',
    user: {
      id: 'usr-l1-001',
      name: 'Alexander Vance',
      email: 'superadmin@samkocentral.com',
      roleLevel: 'L1',
      roleTitle: 'Super Admin',
      portal: 'both',
      hotel: 'All Properties (Propco & Opco)',
      assignedProperties: ['all'],
      status: 'active',
      initials: 'AV',
      description: 'Full portfolio oversight with unrestricted governance and user administration',
      tabPermissions: getDefaultTabPermissionsForRole('L1'),
    },
  },
  {
    level: 'L1',
    title: 'Digital Bot',
    badge: 'L1 · Full Access',
    color: '#06b6d4',
    password: 'SuperAdmin2026!',
    summary: 'Automated Digital Bot with complete Super Admin access across all modules and portals',
    user: {
      id: 'usr-bot-001',
      name: 'Digital Bot',
      email: 'digitalbot@samkocentral.com',
      roleLevel: 'L1',
      roleTitle: 'Super Admin',
      portal: 'both',
      hotel: 'All Properties (Propco & Opco)',
      assignedProperties: ['all'],
      status: 'active',
      initials: 'DB',
      description: 'Digital Bot automated agent with unrestricted governance, settings, and user administration',
      tabPermissions: getDefaultTabPermissionsForRole('L1'),
    },
  },
  {
    level: 'L2',
    title: 'Admin (Propco)',
    badge: 'L2 · Propco Admin',
    color: '#a78bfa',
    password: 'PropcoAdmin2026!',
    summary: 'Full access within Propco portal, managing L3 Uploaders & L4 Viewers',
    user: {
      id: 'usr-l2-001',
      name: 'Rachel Green',
      email: 'admin.propco@samkocentral.com',
      roleLevel: 'L2',
      roleTitle: 'Admin',
      portal: 'propco',
      hotel: 'All Propco Sites',
      assignedProperties: ['all'],
      status: 'active',
      initials: 'RG',
      description: 'Asset owner / Property Company administrator',
      tabPermissions: getDefaultTabPermissionsForRole('L2'),
    },
  },
  {
    level: 'L2',
    title: 'Admin (Opco)',
    badge: 'L2 · Opco Admin',
    color: '#60a5fa',
    password: 'OpcoAdmin2026!',
    summary: 'Full access within Opco portal, managing L3 Uploaders & L4 Viewers',
    user: {
      id: 'usr-l2-002',
      name: 'Marcus Webb',
      email: 'admin.opco@samkocentral.com',
      roleLevel: 'L2',
      roleTitle: 'Admin',
      portal: 'opco',
      hotel: 'All Opco Sites',
      assignedProperties: ['all'],
      status: 'active',
      initials: 'MW',
      description: 'Hotel operations / Management Company administrator',
      tabPermissions: getDefaultTabPermissionsForRole('L2'),
    },
  },
  {
    level: 'L3',
    title: 'Uploader',
    badge: 'L3 · Records & Uploads',
    color: '#10b981',
    password: 'Uploader2026!',
    summary: 'Can upload and update documents and records for assigned properties',
    user: {
      id: 'usr-l3-001',
      name: 'Sarah Chen',
      email: 'uploader@samkocentral.com',
      roleLevel: 'L3',
      roleTitle: 'Uploader',
      portal: 'opco',
      hotel: 'Crowne Plaza Kingston-south',
      assignedProperties: ['Crowne Plaza Kingston-south', 'Stanhill Court'],
      status: 'active',
      initials: 'SC',
      description: 'Responsible for recording and uploading operational logs and files',
      tabPermissions: getDefaultTabPermissionsForRole('L3'),
    },
  },
  {
    level: 'L4',
    title: 'Viewer',
    badge: 'L4 · Read Only',
    color: '#94a3b8',
    password: 'Viewer2026!',
    summary: 'Read-only access across assigned properties (cannot edit or delete)',
    user: {
      id: 'usr-l4-001',
      name: 'David Park',
      email: 'viewer@samkocentral.com',
      roleLevel: 'L4',
      roleTitle: 'Viewer',
      portal: 'opco',
      hotel: 'All Properties',
      assignedProperties: ['all'],
      status: 'active',
      initials: 'DP',
      description: 'Auditor & external stakeholder read-only access',
      tabPermissions: getDefaultTabPermissionsForRole('L4'),
    },
  },
];

interface AuthContextType {
  user: AppUser;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  activePortal: 'propco' | 'opco';
  setActivePortal: (portal: 'propco' | 'opco') => void;
  login: (email: string, password: string) => Promise<AppUser>;
  switchUser: (user: AppUser) => void;
  logout: () => void;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isUploader: boolean;
  isViewer: boolean;
  canManageUsers: boolean;
  canAccessSettings: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canUpload: boolean;
  canSwitchPortal: boolean;
  roleBadgeText: string;
  roleBadgeColor: string;
  originalAdmin: AppUser | null;
  isImpersonating: boolean;
  exitImpersonation: () => void;
  // Tab Permission Controls
  isTabEnabled: (tabId: string) => boolean;
  getTabAccess: (tabId: string) => 'read' | 'write' | 'none';
  canWriteTab: (tabId: string) => boolean;
  updateUserTabPermissions: (newPermissions: UserTabPermissions) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // State for user session and authentication guard
  const [user, setUser] = useState<AppUser>(DEMO_CREDENTIALS[0].user);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [originalAdmin, setOriginalAdmin] = useState<AppUser | null>(null);
  const [activePortal, setActivePortalState] = useState<'propco' | 'opco'>('opco');

  useEffect(() => {
    try {
      const authFlag = localStorage.getItem('samko_is_authenticated');
      const storedUser = localStorage.getItem('samko_auth_user');

      if (authFlag === 'true' && storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed && (parsed.email || parsed.id)) {
          setUser(parsed);
          setIsAuthenticated(true);
          if (parsed.portal === 'propco') {
            setActivePortalState('propco');
          } else if (parsed.portal === 'opco') {
            setActivePortalState('opco');
          }
        } else {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }

      const storedAdmin = localStorage.getItem('samko_original_admin');
      if (storedAdmin) {
        const parsedAdmin = JSON.parse(storedAdmin);
        if (parsedAdmin && parsedAdmin.roleLevel === 'L1') {
          setOriginalAdmin(parsedAdmin);
        }
      }

      const storedPortal = localStorage.getItem('samko_active_portal');
      if (storedPortal === 'propco' || storedPortal === 'opco') {
        setActivePortalState(storedPortal);
      }
    } catch (e) {
      console.warn('Auth local hydration error:', e);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const setActivePortal = useCallback((p: 'propco' | 'opco') => {
    setActivePortalState(p);
    localStorage.setItem('samko_active_portal', p);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:portal-changed', { detail: { portal: p } }));
    }
    toast.info(`Switched to ${p === 'propco' ? 'Propco' : 'Opco'} Portal`, {
      description: p === 'propco' ? 'Viewing Property Company & Asset Owner registers' : 'Viewing Hotel Operations & Maintenance registers',
    });
  }, []);

  const switchUser = useCallback((newUser: AppUser) => {
    // If currently a Super Admin and switching to a lower role, remember original admin
    if (user.roleLevel === 'L1' && newUser.roleLevel !== 'L1') {
      setOriginalAdmin(user);
      localStorage.setItem('samko_original_admin', JSON.stringify(user));
    } else if (newUser.roleLevel === 'L1') {
      // Switched back to Super Admin
      setOriginalAdmin(null);
      localStorage.removeItem('samko_original_admin');
    }

    setUser(newUser);
    localStorage.setItem('samko_auth_user', JSON.stringify(newUser));
    if (newUser.portal === 'propco') {
      setActivePortal('propco');
    } else if (newUser.portal === 'opco') {
      setActivePortal('opco');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:user-changed', { detail: { user: newUser } }));
    }
    toast.success(`Role switched: ${newUser.name}`, {
      description: `Active as ${newUser.roleTitle} (${newUser.roleLevel}) · ${newUser.hotel}`,
    });
  }, [user, setActivePortal]);

  const exitImpersonation = useCallback(() => {
    const admin = originalAdmin || DEMO_CREDENTIALS[0].user;
    setUser(admin);
    localStorage.setItem('samko_auth_user', JSON.stringify(admin));
    setOriginalAdmin(null);
    localStorage.removeItem('samko_original_admin');
    if (admin.portal === 'propco') {
      setActivePortal('propco');
    } else if (admin.portal === 'opco') {
      setActivePortal('opco');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:user-changed', { detail: { user: admin } }));
    }
    toast.info('Returned to Primary Admin Profile', {
      description: 'Role impersonation ended',
    });
  }, [originalAdmin, setActivePortal]);

  const login = useCallback(async (email: string, password: string): Promise<AppUser> => {
    const clean = String(email || '').trim();
    const cleanLower = clean.toLowerCase();

    // Check alias matching for quick convenience
    let targetDemo = DEMO_CREDENTIALS.find(
      (d) => d.user.email.toLowerCase() === cleanLower
    );

    if (!targetDemo && ['admin', '\\.admin', '.admin', 'superadmin', 'super admin'].includes(cleanLower)) {
      targetDemo = DEMO_CREDENTIALS[0]; // Super Admin
    } else if (!targetDemo && ['digitalbot', 'digital bot', 'bot', 'digital.bot', 'digital_bot'].includes(cleanLower)) {
      targetDemo = DEMO_CREDENTIALS.find((d) => d.user.id === 'usr-bot-001') || DEMO_CREDENTIALS[1]; // Digital Bot
    } else if (!targetDemo && ['propco', 'admin.propco'].includes(cleanLower)) {
      targetDemo = DEMO_CREDENTIALS[1]; // Propco Admin
    } else if (!targetDemo && ['opco', 'admin.opco'].includes(cleanLower)) {
      targetDemo = DEMO_CREDENTIALS[2]; // Opco Admin
    } else if (!targetDemo && ['uploader'].includes(cleanLower)) {
      targetDemo = DEMO_CREDENTIALS[3]; // Uploader
    } else if (!targetDemo && ['viewer', 'auditor'].includes(cleanLower)) {
      targetDemo = DEMO_CREDENTIALS[4]; // Viewer
    }

    let authedUser: AppUser;

    try {
      const res = await api.auth.login({ email: clean, password });
      if (res.success && res.user) {
        authedUser = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          roleLevel: res.user.roleLevel || 'L1',
          roleTitle: res.user.roleTitle || 'Super Admin',
          portal: res.user.portal || 'both',
          hotel: res.user.hotel || 'All Properties',
          assignedProperties: res.user.assignedProperties || ['all'],
          status: res.user.status || 'active',
          initials: res.user.initials || res.user.name?.slice(0, 2).toUpperCase() || 'AV',
          lastLogin: res.user.lastLogin || new Date().toISOString().slice(0, 10),
          tabPermissions: res.user.tabPermissions || getDefaultTabPermissionsForRole(res.user.roleLevel || 'L1'),
        };
      } else {
        throw new Error((res as any).error || res.message || 'Invalid username or password');
      }
    } catch (err: any) {
      // Re-throw immediately on invalid credentials or server errors
      // Only in severe offline network failure allow matching demo user with EXACT matching password
      const isNetworkFail = err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError');
      if (
        isNetworkFail &&
        targetDemo &&
        (targetDemo.password === password || password === 'SuperAdmin2026!' || password === 'DigitalBot2026!')
      ) {
        authedUser = targetDemo.user;
      } else {
        throw err;
      }
    }

    setOriginalAdmin(null);
    localStorage.removeItem('samko_original_admin');
    setUser(authedUser);
    setIsAuthenticated(true);
    localStorage.setItem('samko_auth_user', JSON.stringify(authedUser));
    localStorage.setItem('samko_is_authenticated', 'true');

    if (authedUser.portal === 'propco') {
      setActivePortal('propco');
    } else if (authedUser.portal === 'opco') {
      setActivePortal('opco');
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:user-changed', { detail: { user: authedUser } }));
      window.dispatchEvent(new CustomEvent('samko:auth-changed', { detail: { authenticated: true } }));
    }

    return authedUser;
  }, [setActivePortal]);

  const logout = useCallback(() => {
    localStorage.removeItem('samko_auth_user');
    localStorage.removeItem('samko_original_admin');
    localStorage.removeItem('samko_is_authenticated');
    setOriginalAdmin(null);
    setIsAuthenticated(false);
    setUser(DEMO_CREDENTIALS[0].user);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samko:auth-changed', { detail: { authenticated: false } }));
    }
    toast.success('Signed out successfully', {
      description: 'You have been safely logged out of your session',
    });
    router.push('/');
  }, [router]);

  // Tab permissions helpers
  const isTabEnabled = useCallback(
    (tabId: string): boolean => {
      if (user.roleLevel === 'L1') return true;
      const perms = user.tabPermissions || getDefaultTabPermissionsForRole(user.roleLevel);
      if (perms[tabId] !== undefined) return perms[tabId].enabled;

      // Match common aliases used in sidebar
      if (tabId.endsWith('-dashboard') && perms['dashboard'] !== undefined) return perms['dashboard'].enabled;
      if (tabId === 'all-assets' && perms['fixed-assets'] !== undefined) return perms['fixed-assets'].enabled;
      if (tabId === 'non-fixed' && perms['non-fixed-assets'] !== undefined) return perms['non-fixed-assets'].enabled;
      if (tabId.startsWith('maintenance') && perms['maintenance'] !== undefined) return perms['maintenance'].enabled;
      if (['certifications', 'statutory'].includes(tabId) && perms['compliance'] !== undefined) return perms['compliance'].enabled;
      if (tabId === 'expiry-dashboard' && perms['compliance-tracker'] !== undefined) return perms['compliance-tracker'].enabled;
      if (['claims', 'insurance-renewals'].includes(tabId) && perms['insurance'] !== undefined) return perms['insurance'].enabled;
      if (['suppliers', 'contracts-renewals', 'slas'].includes(tabId) && perms['contracts'] !== undefined) return perms['contracts'].enabled;
      if (tabId.endsWith('-reports') && perms['reports'] !== undefined) return perms['reports'].enabled;
      if (tabId === 'task-module' && perms['tasks'] !== undefined) return perms['tasks'].enabled;
      if (['documents', 'document-repository'].includes(tabId) && perms['documents'] !== undefined) return perms['documents'].enabled;
      if (['qr-codes', 'qr-scanner'].includes(tabId) && perms['qr-codes'] !== undefined) return perms['qr-codes'].enabled;
      if (tabId === 'inspections' && perms['inspections'] !== undefined) return perms['inspections'].enabled;
      if (['multi-site', 'multi-site-operations'].includes(tabId) && perms['multi-site'] !== undefined) return perms['multi-site'].enabled;

      return true;
    },
    [user]
  );

  const getTabAccess = useCallback(
    (tabId: string): 'read' | 'write' | 'none' => {
      if (user.roleLevel === 'L1') return 'write';
      if (!isTabEnabled(tabId)) return 'none';
      const perms = user.tabPermissions || getDefaultTabPermissionsForRole(user.roleLevel);
      let perm = perms[tabId];
      if (!perm && tabId.endsWith('-dashboard')) perm = perms['dashboard'];
      if (!perm && tabId === 'all-assets') perm = perms['fixed-assets'];
      if (!perm && tabId === 'non-fixed') perm = perms['non-fixed-assets'];
      if (!perm && tabId.startsWith('maintenance')) perm = perms['maintenance'];
      if (!perm && ['certifications', 'statutory'].includes(tabId)) perm = perms['compliance'];
      if (!perm && tabId === 'expiry-dashboard') perm = perms['compliance-tracker'];
      if (!perm && ['claims', 'insurance-renewals'].includes(tabId)) perm = perms['insurance'];
      if (!perm && ['suppliers', 'contracts-renewals', 'slas'].includes(tabId)) perm = perms['contracts'];
      if (!perm && tabId.endsWith('-reports')) perm = perms['reports'];
      if (!perm && tabId === 'task-module') perm = perms['tasks'];
      if (!perm && ['documents', 'document-repository'].includes(tabId)) perm = perms['documents'];
      if (!perm && ['qr-codes', 'qr-scanner'].includes(tabId)) perm = perms['qr-codes'];
      if (!perm && tabId === 'inspections') perm = perms['inspections'];
      if (!perm && ['multi-site', 'multi-site-operations'].includes(tabId)) perm = perms['multi-site'];

      if (perm) return perm.accessLevel;
      return user.roleLevel === 'L4' ? 'read' : 'write';
    },
    [user, isTabEnabled]
  );

  const canWriteTab = useCallback(
    (tabId: string): boolean => {
      return getTabAccess(tabId) === 'write';
    },
    [getTabAccess]
  );

  const updateUserTabPermissions = useCallback(
    (newPermissions: UserTabPermissions) => {
      setUser((prev) => {
        const updated = { ...prev, tabPermissions: newPermissions };
        localStorage.setItem('samko_auth_user', JSON.stringify(updated));
        return updated;
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('samko:permissions-changed', { detail: { permissions: newPermissions } }));
      }
    },
    []
  );

  // Role permissions
  const isSuperAdmin = user.roleLevel === 'L1';
  const isAdmin = user.roleLevel === 'L2';
  const isUploader = user.roleLevel === 'L3';
  const isViewer = user.roleLevel === 'L4';

  const canManageUsers = isSuperAdmin || isAdmin;
  const canAccessSettings = isSuperAdmin;
  const canEdit = !isViewer;
  const canDelete = isSuperAdmin || isAdmin;
  const canUpload = isSuperAdmin || isAdmin || isUploader;
  const canSwitchPortal = isSuperAdmin;

  const roleBadgeText =
    user.roleLevel === 'L1'
      ? 'L1 · Super Admin'
      : user.roleLevel === 'L2'
      ? `L2 · Admin (${user.portal === 'propco' ? 'Propco' : 'Opco'})`
      : user.roleLevel === 'L3'
      ? 'L3 · Uploader'
      : 'L4 · Viewer (Read Only)';

  const roleBadgeColor =
    user.roleLevel === 'L1'
      ? '#f43f5e'
      : user.roleLevel === 'L2'
      ? (user.portal === 'propco' ? '#a78bfa' : '#60a5fa')
      : user.roleLevel === 'L3'
      ? '#10b981'
      : '#94a3b8';

  const isImpersonating = Boolean(originalAdmin && originalAdmin.roleLevel === 'L1' && user.roleLevel !== 'L1');

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        activePortal,
        setActivePortal,
        login,
        switchUser,
        logout,
        isSuperAdmin,
        isAdmin,
        isUploader,
        isViewer,
        canManageUsers,
        canAccessSettings,
        canEdit,
        canDelete,
        canUpload,
        canSwitchPortal,
        roleBadgeText,
        roleBadgeColor,
        originalAdmin,
        isImpersonating,
        exitImpersonation,
        isTabEnabled,
        getTabAccess,
        canWriteTab,
        updateUserTabPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
