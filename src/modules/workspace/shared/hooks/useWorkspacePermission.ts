"use client";

import { useMemo } from "react";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import { findWorkspaceByRouteKey, useCurrentWorkspace } from "./useWorkspaces";
import {
  WORKSPACE_ROLE_PERMISSIONS,
  WorkspacePermission,
} from "../constants/workspacePermissions";

type WorkspaceMember = {
  userId: string | { _id?: string; id?: string; email?: string; $oid?: string; toString?: () => string };
  role: string;
};

type WorkspacePermissionSource = {
  _id?: string;
  key?: string;
  slug?: string;
  ownerId?: string | { _id?: string; id?: string; $oid?: string; toString?: () => string };
  members?: WorkspaceMember[];
};

const normalizeObjectId = (value: string) => {
  const trimmed = value.trim();
  const objectIdMatch = trimmed.match(/^ObjectId\(['"]?([a-f0-9]{24})['"]?\)$/i);
  return objectIdMatch?.[1] ?? trimmed;
};

const getId = (value: WorkspaceMember["userId"] | WorkspacePermissionSource["ownerId"]) => {
  if (!value) return "";
  if (typeof value === "string") return normalizeObjectId(value);
  const id = value._id ?? value.id ?? value.$oid;
  if (id) return normalizeObjectId(String(id));
  const stringValue = value.toString?.();
  return stringValue && stringValue !== "[object Object]" ? normalizeObjectId(stringValue) : "";
};

const getEmail = (value: WorkspaceMember["userId"]) => {
  if (!value || typeof value === "string") return "";
  return value.email ?? "";
};

const sameNonEmpty = (left?: string | null, right?: string | null) =>
  Boolean(left && right && left === right);

const normalizeWorkspaceRole = (role?: string | null) => {
  if (!role) return null;

  const normalized = role.trim().toLowerCase().replace(/[-\s]+/g, "_");
  if (["workspace_admin", "space_admin", "admin", "owner"].includes(normalized)) {
    return "workspace_admin";
  }

  return normalized;
};

export function useWorkspacePermission(
  workspaceKey: string,
  workspaceOverride?: WorkspacePermissionSource | null,
) {
  const { user } = useAuth();
  const { currentWorkspace, workspaces } = useCurrentWorkspace();

  const workspace = useMemo(() => {
    if (workspaceOverride) return workspaceOverride;
    if (
      currentWorkspace?._id === workspaceKey ||
      currentWorkspace?.key === workspaceKey ||
      currentWorkspace?.slug === workspaceKey
    ) {
      return currentWorkspace;
    }
    return findWorkspaceByRouteKey(workspaces, workspaceKey);
  }, [currentWorkspace, workspaceKey, workspaceOverride, workspaces]);

  const role = useMemo(() => {
    if (!user) return null;
    if (user.role === "super_admin") return "workspace_admin";
    if (!workspace) return null;
    if (sameNonEmpty(getId(workspace.ownerId), user.id)) return "workspace_admin";
    return normalizeWorkspaceRole(
      workspace.members?.find((member) => {
        const memberId = getId(member.userId);
        const memberEmail = getEmail(member.userId);
        return (
          sameNonEmpty(memberId, user.id) ||
          sameNonEmpty(memberId, user.email) ||
          sameNonEmpty(memberEmail, user.email)
        );
      })?.role,
    );
  }, [user, workspace]);

  const permissions = useMemo<WorkspacePermission[]>(() => {
    if (!role) return [];
    return WORKSPACE_ROLE_PERMISSIONS[role] ?? [];
  }, [role]);

  const hasPermission = (permission: WorkspacePermission) =>
    user?.role === "super_admin" || permissions.includes(permission);

  const hasAllPermissions = (required: WorkspacePermission[]) =>
    user?.role === "super_admin" ||
    required.every((permission) => permissions.includes(permission));

  return {
    role,
    permissions,
    hasPermission,
    hasAllPermissions,
  };
}
