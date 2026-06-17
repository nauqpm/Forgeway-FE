"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { inviteService, PendingInvite } from "@/modules/workspace/shared/services/inviteService";
import {
  WorkspaceMember,
  InviteRole,
} from "../types/workspaceSettings.type";

export interface UseWorkspaceMembersReturn {
  members: WorkspaceMember[];
  loadingMembers: boolean;
  invites: PendingInvite[];
  loadingInvites: boolean;
  cancellingId: string | null;
  removingMemberId: string | null;
  updatingMemberId: string | null;
  memberSubTab: "list" | "invites";
  showInviteModal: boolean;
  setMemberSubTab: (value: "list" | "invites") => void;
  setShowInviteModal: (value: boolean) => void;
  refreshInvites: () => Promise<void>;
  handleCancelInvite: (inviteId: string) => Promise<void>;
  handleUpdateMemberRole: (member: WorkspaceMember, role: InviteRole) => Promise<void>;
  handleRemoveMember: (member: WorkspaceMember) => Promise<void>;
}

export function useWorkspaceMembers(
  workspaceId: string,
  canManage: boolean,
  isActiveTab: boolean,
): UseWorkspaceMembersReturn {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [memberSubTab, setMemberSubTab] = useState<"list" | "invites">("list");
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;

    setLoadingMembers(true);
    api
      .get(apiRoutes.WORKSPACES.MEMBERS(workspaceId))
      .then((res) => setMembers(res.data?.data ?? res.data ?? []))
      .catch(() => setMembers([]))
      .finally(() => setLoadingMembers(false));
  }, [workspaceId]);

  useEffect(() => {
    if (!isActiveTab || !workspaceId) return;
    if (!canManage) {
      setInvites([]);
      setLoadingInvites(false);
      return;
    }

    setLoadingInvites(true);
    inviteService
      .listInvites(workspaceId)
      .then(setInvites)
      .catch(() => setInvites([]))
      .finally(() => setLoadingInvites(false));
  }, [isActiveTab, canManage, workspaceId]);

  const refreshInvites = async () => {
    if (!workspaceId) return;
    try {
      const updated = await inviteService.listInvites(workspaceId);
      setInvites(updated);
    } catch {
      // silently ignore refresh failures
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setCancellingId(inviteId);
    try {
      await inviteService.cancelInvite(workspaceId, inviteId);
      setInvites((prev) => prev.filter((invite) => invite._id !== inviteId));
      toast.success("Invitation canceled.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not cancel invitation.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleUpdateMemberRole = async (member: WorkspaceMember, role: InviteRole) => {
    const userId = member.userId?._id;
    if (!userId || member.role === role) return;

    setUpdatingMemberId(userId);
    try {
      if (!workspaceId) throw new Error("Missing workspace id");

      await api.put(apiRoutes.WORKSPACES.UPDATE_MEMBER(workspaceId, userId), { role });
      setMembers((prev) =>
        prev.map((item) => (item.userId?._id === userId ? { ...item, role } : item)),
      );
      toast.success("Member permissions updated.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not update member permissions.");
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = async (member: WorkspaceMember) => {
    const userId = member.userId?._id;
    if (!userId) return;

    setRemovingMemberId(userId);
    try {
      if (!workspaceId) throw new Error("Missing workspace id");

      await api.delete(apiRoutes.WORKSPACES.REMOVE_MEMBER(workspaceId, userId));
      setMembers((prev) => prev.filter((item) => item.userId?._id !== userId));
      toast.success("Member removed from workspace.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not remove member.");
    } finally {
      setRemovingMemberId(null);
    }
  };

  return {
    members,
    loadingMembers,
    invites,
    loadingInvites,
    cancellingId,
    removingMemberId,
    updatingMemberId,
    memberSubTab,
    showInviteModal,
    setMemberSubTab,
    setShowInviteModal,
    refreshInvites,
    handleCancelInvite,
    handleUpdateMemberRole,
    handleRemoveMember,
  };
}
