"use client";

import { ReactNode } from "react";
import { WorkspacePermission } from "../constants/workspacePermissions";
import { useWorkspacePermission } from "../hooks/useWorkspacePermission";

type PermissionGuardProps = {
  workspaceKey: string;
  allowedPermissions: WorkspacePermission[];
  fallback?: ReactNode;
  children: ReactNode;
};

export default function PermissionGuard({
  workspaceKey,
  allowedPermissions,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { hasAllPermissions } = useWorkspacePermission(workspaceKey);

  if (!hasAllPermissions(allowedPermissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
