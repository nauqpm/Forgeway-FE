"use client";

import React, { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

interface PermissionGuardProps {
  resource: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  resource,
  action,
  children,
  fallback = null,
}) => {
  const { hasPermission, user } = useAuth();

  // If no user is logged in, show fallback
  if (!user) {
    return <>{fallback}</>;
  }

  // Check permission and render accordingly
  return hasPermission(resource, action) ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGuard;
