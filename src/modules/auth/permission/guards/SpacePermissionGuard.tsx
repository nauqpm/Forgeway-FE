'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '../hooks/usePermission';
import { AUTH_ROUTES } from '../../shared/constants/auth-routes';
import { ShieldX } from 'lucide-react';

interface SpacePermissionGuardProps {
  resource: string;
  action: string;
  redirect?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const SpacePermissionGuard: React.FC<SpacePermissionGuardProps> = ({
  resource,
  action,
  redirect = false,
  fallback,
  children,
}) => {
  const router = useRouter();
  const { can } = usePermission();

  if (!can(resource, action)) {
    if (redirect) {
      router.replace(AUTH_ROUTES.ACCESS_DENIED);
      return null;
    }

    return (
      <>
        {fallback ?? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ShieldX className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium">You do not have permission to access this content</p>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
};

export default SpacePermissionGuard;
