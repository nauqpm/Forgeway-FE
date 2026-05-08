'use client';

import React from 'react';
import { usePermission } from '../hooks/usePermission';

interface PermissionGuardProps {
  /** Resource name, e.g. 'task', 'project' */
  resource: string;
  /** Action name, e.g. 'create', 'read', 'update', 'delete' */
  action: string;
  /** Optional: specific space to check permission for */
  spaceId?: string;
  /** Content to show when permission is denied (defaults to null) */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * PermissionGuard — conditionally renders children based on RBAC permissions.
 * Use this to hide UI elements the user doesn't have access to.
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  resource,
  action,
  spaceId,
  fallback = null,
  children,
}) => {
  const { can } = usePermission();

  if (!can(resource, action, spaceId)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGuard;