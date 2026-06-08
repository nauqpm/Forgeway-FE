'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../shared/stores/authStore';
import { AUTH_ROUTES } from '../shared/constants/auth-routes';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * AuthGuard protects routes that require sign-in.
 * 
 * Purpose: 
 * - Ensure only authenticated users can access protected pages.
 * - Redirect unauthenticated users to the sign-in page.
 * 
 * How it works:
 * 1. Read state from `useAuthStore`.
 * 2. Use `useEffect` to check whether the app has initialized, loading is finished, and the user is not authenticated.
 *    Then use `router.replace` to send users to the login page.
 * 3. Show a loading state while initial authentication is pending.
 * 4. Return null when not signed in to avoid rendering protected UI.
 * 5. Render `children` when valid.
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, isInitialized } = useAuthStore();

  // Step 2: check and redirect if not signed in
  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated) {
      router.replace(AUTH_ROUTES.LOGIN);
    }
  }, [isInitialized, isLoading, isAuthenticated, router]);

  // Still initializing — show loading spinner
  if (!isInitialized || isLoading) {
    return (
      fallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA] dark:bg-[#1A1A1A]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#2563EB] dark:text-[#3B82F6]" />
            <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">Verifying...</p>
          </div>
        </div>
      )
    );
  }

  // Not authenticated — redirect to login
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
