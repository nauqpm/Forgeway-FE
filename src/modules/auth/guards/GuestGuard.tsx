'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../shared/stores/authStore';
import { AUTH_ROUTES } from '../shared/constants/auth-routes';
import { Loader2 } from 'lucide-react';

interface GuestGuardProps {
  children: React.ReactNode;
}

const isSafeCallbackUrl = (url: string) =>
  url.startsWith('/') && !url.startsWith('//') && !url.includes('\\');

/**
 * GuestGuard protects routes intended only for guests who are not signed in.
 * 
 * Purpose:
 * - Used on pages such as /login, /register, and /forgot-password.
 * - If signed-in users intentionally revisit these pages, the system automatically 
 *   redirects them to the main dashboard to avoid logic errors.
 * 
 * How it works:
 * 1. Read sign-in state from `useAuthStore`.
 * 2. Use `useEffect` to check whether initialization is complete and users are authenticated.
 *    Then immediately redirect to the dashboard.
 * 3. Show a spinner while the app is initializing.
 * 4. Return null if already signed in.
 * 5. Render `children` only for actual guests.
 */
const GuestGuard: React.FC<GuestGuardProps> = ({ children }) => {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuthStore();

  // Step 2: check and redirect if already signed in
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get('callbackUrl');
      const destination = callbackUrl && isSafeCallbackUrl(callbackUrl) ? callbackUrl : AUTH_ROUTES.DASHBOARD;
      router.replace(destination);
    }
  }, [isInitialized, isAuthenticated, router]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default GuestGuard;
