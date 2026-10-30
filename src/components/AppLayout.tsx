'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { useAuth } from '@/lib/authContext';
import { Eye, LogOut, Loader2 } from 'lucide-react';
import LoginPageClient from '@/app/login/components/LoginPageClient';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPath?: string | null;
}

export default function AppLayout({ children, currentPath }: AppLayoutProps) {
  const pathname = usePathname();
  const resolvedPath = currentPath ?? pathname ?? '/';
  const { user, isImpersonating, exitImpersonation, isAuthenticated, isLoadingAuth } = useAuth();

  // If still checking authentication from local session, show a sleek brand splash
  if (isLoadingAuth) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
        <img
          src="/assets/images/samko_logo.png?v=6"
          alt="SAMKO Logo"
          className="w-20 h-20 object-contain animate-pulse mb-3"
        />
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Loader2 size={14} className="animate-spin text-primary" />
          <span>Verifying authentication...</span>
        </div>
      </div>
    );
  }

  // Before login: DO NOT allow access to the dashboard or any page. Show login screen!
  if (!isAuthenticated) {
    return <LoginPageClient />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar currentPath={resolvedPath} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Super Admin Preview Banner */}
        {isImpersonating && (
          <div
            className="flex items-center justify-between px-5 py-2 text-xs flex-shrink-0 border-b z-30"
            style={{
              background: 'linear-gradient(90deg, rgba(245,158,11,0.18) 0%, rgba(232,201,122,0.18) 100%)',
              borderColor: 'rgba(245,158,11,0.4)',
              color: '#fef3c7',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <Eye size={14} className="text-amber-400" />
              <span>
                <strong>Super Admin Preview Mode:</strong> You are seeing the platform through the eyes of{' '}
                <strong>{user.name}</strong> ({user.roleLevel} · {user.roleTitle})
              </span>
            </div>
            <button
              type="button"
              onClick={exitImpersonation}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold text-black transition-all hover:brightness-110 cursor-pointer shadow-sm"
              style={{ background: 'var(--primary)' }}
            >
              <LogOut size={12} />
              Exit Preview & Return to Super Admin
            </button>
          </div>
        )}
        {/* Main Content Area: dynamically fills remaining viewport space */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );
}