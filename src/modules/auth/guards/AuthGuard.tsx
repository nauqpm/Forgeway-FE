'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';
import { AUTH_ROUTES } from '../constants/auth-routes';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, isInitialized } = useAuthStore();

  // Still initializing — show loading spinner
  if (!isInitialized || isLoading) {
    return (
      fallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm text-gray-500">Đang xác thực...</p>
          </div>
        </div>
      )
    );
  }

  // Not authenticated — redirect to login
  if (!isAuthenticated) {
    router.replace(AUTH_ROUTES.LOGIN);
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;