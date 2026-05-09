'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '../hooks/usePermission';
import { AUTH_ROUTES } from '../constants/auth-routes';
import { ShieldX } from 'lucide-react';

interface SpacePermissionGuardProps {
  /** The space ID to check permissions against */
  spaceId: string;
  /** Resource name, e.g. 'page', 'task' */
  resource: string;
  /** Action name, e.g. 'create', 'read', 'update', 'delete' */
  action: string;
  /** If true, redirects to access-denied page instead of showing inline fallback */
  redirect?: boolean;
  /** Custom fallback when permission denied */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * SpacePermissionGuard — enforces permissions scoped to a specific Space.
 * Can either render inline fallback or redirect to access-denied page.
 */
const SpacePermissionGuard: React.FC<SpacePermissionGuardProps> = ({
  spaceId,
  resource,
  action,
  redirect = false,
  fallback,
  children,
}) => {
  const router = useRouter();
  const { can } = usePermission();

  if (!can(resource, action, spaceId)) {
    if (redirect) {
      router.replace(AUTH_ROUTES.ACCESS_DENIED);
      return null;
    }

    return (
      <>
        {fallback ?? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ShieldX className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium">
              Bạn không có quyền truy cập nội dung này
            </p>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
};

export default SpacePermissionGuard;