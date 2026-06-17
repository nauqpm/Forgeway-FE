"use client";

import { useRef, useState } from "react";
import { getMemberUserId, normalizeObjectId } from "../types/workspaceSettings.type";
import { useWorkspaceSettings, UseWorkspaceSettingsReturn } from "./useWorkspaceSettings";
import { useWorkspaceMembers, UseWorkspaceMembersReturn } from "./useWorkspaceMembers";

export type SettingsTab = "general" | "members";

export interface UseWorkspaceSettingsPageReturn
  extends UseWorkspaceSettingsReturn,
    UseWorkspaceMembersReturn {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
  currentUserId: string;
  canManageWorkspace: boolean;
}

interface CurrentUser {
  id?: string;
  role?: string;
}

export function useWorkspaceSettingsPage(
  workspaceKey: string,
  currentUser: CurrentUser | null,
): UseWorkspaceSettingsPageReturn {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const settings = useWorkspaceSettings(workspaceKey);

  const workspaceId = settings.workspace?._id ?? "";
  const currentUserId = normalizeObjectId(currentUser?.id);
  const superAdminBypass = currentUser?.role === "super_admin";

  // Use a ref to carry canManageWorkspace across renders without adding a dep cycle.
  // On render N: members load → canManageRef.current becomes true for admins.
  // On render N+1: useWorkspaceMembers receives canManage=true → invite fetch fires.
  const canManageRef = useRef(superAdminBypass);

  const membersHook = useWorkspaceMembers(
    workspaceId,
    canManageRef.current,
    activeTab === "members",
  );

  const currentMember = membersHook.members.find(
    (m) => getMemberUserId(m) === currentUserId,
  );

  const canManageWorkspace =
    currentMember?.role === "workspace_admin" ||
    currentMember?.role === "space_admin" ||
    superAdminBypass;

  // Keep the ref in sync so the next render passes the updated value.
  canManageRef.current = canManageWorkspace;

  return {
    ...settings,
    ...membersHook,
    activeTab,
    setActiveTab,
    currentUserId,
    canManageWorkspace,
  };
}
