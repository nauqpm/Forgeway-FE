'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';
import { AUTH_ROUTES } from '../constants/auth-routes';
import { Loader2 } from 'lucide-react';

interface GuestGuardProps {
  children: React.ReactNode;
}

/**
 * GuestGuard — only renders children for unauthenticated users.
 * Used on /login, /register, /forgot-password pages.
 * If user is already logged in, redirects to dashboard.
 */
const GuestGuard: React.FC<GuestGuardProps> = ({ children }) => {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    router.replace(AUTH_ROUTES.DASHBOARD);
    return null;
  }

  return <>{children}</>;
};

export default GuestGuard;