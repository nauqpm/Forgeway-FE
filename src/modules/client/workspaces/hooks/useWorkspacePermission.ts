"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import {
  WORKSPACE_ROLE_PERMISSIONS,
  WorkspacePermission,
} from "../constants/workspacePermissions";

type WorkspaceMember = {
  userId: string | { _id?: string; id?: string };
  role: string;
};

type WorkspacePermissionSource = {
  _id?: string;
  key?: string;
  slug?: string;
  ownerId?: string | { _id?: string; id?: string };
  members?: WorkspaceMember[];
};

const getId = (value: WorkspaceMember["userId"] | WorkspacePermissionSource["ownerId"]) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id ?? value.id ?? "";
};

export function useWorkspacePermission(
  workspaceKey: string,
  workspaceOverride?: WorkspacePermissionSource | null,
) {
  const { user } = useAuth();
  const { currentWorkspace, workspaces } = useWorkspaceStore();

  const workspace = useMemo(() => {
    if (workspaceOverride) return workspaceOverride;
    if (currentWorkspace?.slug === workspaceKey || currentWorkspace?._id === workspaceKey) {
      return currentWorkspace;
    }
    return workspaces.find(
      (item) =>
        item._id === workspaceKey ||
        item.slug === workspaceKey ||
        ("key" in item && item.key === workspaceKey),
    );
  }, [currentWorkspace, workspaceKey, workspaceOverride, workspaces]);

  const role = useMemo(() => {
    if (!user) return null;
    if (user.role === "super_admin") return "workspace_admin";
    if (!workspace) return null;
    if (getId(workspace.ownerId) === user.id) return "workspace_admin";
    return (
      workspace.members?.find((member) => getId(member.userId) === user.id)?.role ??
      null
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
