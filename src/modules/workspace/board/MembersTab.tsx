"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MailPlus, Trash2, Users, X } from "lucide-react";
import toast from "react-hot-toast";
import api from '@/lib/axiosIns';
import { apiRoutes } from "@/config/apiRoutes";
import RoleChanger, {
  WorkspaceRoleValue,
} from "@/modules/workspace/shared/components/RoleChanger";
import InviteModal from "@/modules/admin-shared/components/common/components/InviteModal";
import {
  inviteService,
  PendingInvite,
} from "@/modules/workspace/shared/services/inviteService";
import { extractApiError } from "@/shared/utils/apiError";
import { queryKeys } from "@/shared/constants/queryKeys";

interface MemberUser {
  _id: string;
  fullName?: string;
  email?: string;
  avatar?: string;
}

interface WorkspaceMember {
  userId: MemberUser;
  role: string;
}

interface MembersTabProps {
  workspaceId: string;
  currentUserId?: string;
  isAdmin: boolean;
}

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  workspace_admin: {
    label: "Admin",
    cls: "bg-[#E1F3FE] text-[#1F6C9F] border-[#B9DDF3] dark:bg-[rgba(31,108,159,0.18)] dark:text-[#93C5FD] dark:border-[#1F6C9F]/35",
  },
  member: {
    label: "Member",
    cls: "bg-[#EDF3EC] text-[#346538] border-[#C8DDC6] dark:bg-[rgba(52,101,56,0.18)] dark:text-[#86EFAC] dark:border-[#346538]/35",
  },
  viewer: {
    label: "Viewer",
    cls: "bg-[#F7F6F3] text-[#787774] border-[#EAEAEA] dark:bg-[#252525] dark:text-[#B8B7B3] dark:border-white/[0.08]",
  },
};

const ROLE_LABELS: Record<string, string> = {
  workspace_admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

function getMemberInitials(member: WorkspaceMember) {
  const displayName = member.userId?.fullName || member.userId?.email || "?";
  return displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function MembersTab({
  workspaceId,
  currentUserId,
  isAdmin,
}: MembersTabProps) {
  const queryClient = useQueryClient();
  const [memberSubTab, setMemberSubTab] = useState<"list" | "invites">("list");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const { data: members = [], isLoading } = useQuery<WorkspaceMember[]>({
    queryKey: queryKeys.workspaces.members(workspaceId),
    queryFn: async () => {
      const res = await api.get(apiRoutes.WORKSPACES.MEMBERS(workspaceId));
      return res.data?.data ?? res.data ?? [];
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });

  const { data: pendingInvites = [], isLoading: isLoadingInvites } = useQuery<PendingInvite[]>({
    queryKey: queryKeys.workspaces.invites(workspaceId),
    queryFn: () => inviteService.listInvites(workspaceId),
    enabled: !!workspaceId && isAdmin,
    staleTime: 30_000,
  });

  const activePendingInvites = pendingInvites.filter((i) => i.status === "pending");

  const handleUpdateRole = async (
    member: WorkspaceMember,
    role: WorkspaceRoleValue,
  ) => {
    const userId = member.userId?._id;
    if (!userId || member.role === role) return;

    setUpdatingId(userId);
    try {
      await api.put(apiRoutes.WORKSPACES.UPDATE_MEMBER(workspaceId, userId), { role });
      queryClient.setQueryData<WorkspaceMember[]>(
        ["members", workspaceId],
        (prev) => (prev ?? []).map((m) =>
          m.userId?._id === userId ? { ...m, role } : m,
        ),
      );
      toast.success("Member permissions updated.");
    } catch (error) {
      toast.error(
        extractApiError(error, "Could not update member permissions."),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (member: WorkspaceMember) => {
    const userId = member.userId?._id;
    if (!userId) return;

    setRemovingId(userId);
    try {
      await api.delete(apiRoutes.WORKSPACES.REMOVE_MEMBER(workspaceId, userId));
      queryClient.setQueryData<WorkspaceMember[]>(
        ["members", workspaceId],
        (prev) => (prev ?? []).filter((m) => m.userId?._id !== userId),
      );
      toast.success("Member removed from workspace.");
    } catch (error) {
      toast.error(
        extractApiError(error, "Could not remove member."),
      );
    } finally {
      setRemovingId(null);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setCancelingId(inviteId);
    try {
      await inviteService.cancelInvite(workspaceId, inviteId);
      queryClient.setQueryData<PendingInvite[]>(
        ["invites", workspaceId],
        (prev) => (prev ?? []).filter((i) => i._id !== inviteId),
      );
      toast.success("Invitation cancelled.");
    } catch (error) {
      toast.error(
        extractApiError(error, "Could not cancel invitation."),
      );
    } finally {
      setCancelingId(null);
    }
  };

  const subTabCls = (active: boolean) =>
    "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors " +
    (active
      ? "bg-white text-[#111111] shadow-sm dark:bg-[#202020] dark:text-[#E8E8E7]"
      : "text-[#787774] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:text-[#E8E8E7]");

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-[#ABABAB] dark:text-[#6B6B6B]">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading members...
      </div>
    );
  }

  return (
    <>
      {isAdmin && (
        <InviteModal
          isOpen={isInviteOpen}
          onClose={() => {
            setIsInviteOpen(false);
            queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.invites(workspaceId) });
          }}
          projectId={workspaceId}
        />
      )}

      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#787774] dark:text-[#9B9A97]" />
            <span className="text-sm font-semibold text-[#111111] dark:text-[#E8E8E7]">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </span>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsInviteOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB]"
            >
              <MailPlus className="h-3.5 w-3.5" />
              Invite
            </button>
          )}
        </div>

        {/* Sub-tabs — admin only */}
        {isAdmin && (
          <div className="inline-flex rounded-[6px] border border-[#EAEAEA] bg-[#F9F9F8] p-1 dark:border-white/[0.06] dark:bg-[#252525]">
            <button
              type="button"
              onClick={() => setMemberSubTab("list")}
              className={subTabCls(memberSubTab === "list")}
            >
              List ({members.length})
            </button>
            <button
              type="button"
              onClick={() => setMemberSubTab("invites")}
              className={subTabCls(memberSubTab === "invites")}
            >
              Invitations ({activePendingInvites.length})
            </button>
          </div>
        )}

        {/* List tab — shown for admin when tab === "list", always shown for non-admin */}
        {(memberSubTab === "list" || !isAdmin) && (
          <section>
            {members.length === 0 ? (
              <div className="rounded-[6px] border border-dashed border-[#EAEAEA] p-6 text-center text-sm text-[#787774] dark:border-white/[0.08] dark:text-[#9B9A97]">
                No members in this workspace.
              </div>
            ) : (
              <div className="overflow-hidden rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06]">
                <div className="divide-y divide-[#EAEAEA] dark:divide-white/[0.06]">
                  {members.map((member) => {
                    const memberUser = member.userId;
                    const displayName =
                      memberUser?.fullName || memberUser?.email || "User";
                    const memberId = memberUser?._id;
                    const isSelf = memberId === currentUserId;
                    const isBusy = updatingId === memberId || removingId === memberId;
                    const normalizedRole: WorkspaceRoleValue =
                      member.role === "space_admin"
                        ? "workspace_admin"
                        : (member.role as WorkspaceRoleValue);
                    const badge = ROLE_BADGE[normalizedRole] ?? ROLE_BADGE.viewer;

                    return (
                      <div
                        key={memberId ?? displayName + member.role}
                        className="flex flex-col gap-3 bg-white p-4 dark:bg-transparent sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          {memberUser?.avatar ? (
                            <img
                              src={memberUser.avatar}
                              alt={displayName}
                              className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-xs font-bold text-white">
                              {getMemberInitials(member)}
                            </span>
                          )}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold text-[#111111] dark:text-[#E8E8E7]">
                                {displayName}
                              </p>
                              {isSelf && (
                                <span className="rounded-full bg-[#F7F6F3] px-2 py-0.5 text-xs font-semibold text-[#787774] dark:bg-[#252525] dark:text-[#9B9A97]">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="truncate text-xs text-[#787774] dark:text-[#9B9A97]">
                              {memberUser?.email || ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-end gap-2">
                          {isAdmin ? (
                            <>
                              <RoleChanger
                                value={normalizedRole}
                                onChange={(role) => handleUpdateRole(member, role)}
                                disabled={isSelf || isBusy}
                                isLoading={updatingId === memberId}
                                compact
                                className="flex-1 sm:w-auto sm:flex-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemove(member)}
                                disabled={isSelf || isBusy}
                                className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[6px] border border-[#F5C6C7] px-3 text-sm font-semibold text-[#9F2F2D] transition-colors hover:bg-[#FDEBEC] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#9F2F2D]/40 dark:text-[#F87171] dark:hover:bg-[rgba(159,47,45,0.12)]"
                              >
                                {removingId === memberId ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                Remove
                              </button>
                            </>
                          ) : (
                            <span
                              className={`inline-flex items-center rounded-[6px] border px-2.5 py-1 text-xs font-semibold ${badge.cls}`}
                            >
                              {badge.label}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Invitations tab — admin only */}
        {isAdmin && memberSubTab === "invites" && (
          <section>
            {isLoadingInvites ? (
              <div className="flex items-center gap-2 py-8 text-sm text-[#ABABAB] dark:text-[#6B6B6B]">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading invitations...
              </div>
            ) : activePendingInvites.length === 0 ? (
              <div className="rounded-[6px] border border-dashed border-[#EAEAEA] p-6 text-center text-sm text-[#787774] dark:border-white/[0.08] dark:text-[#9B9A97]">
                There are no pending invitations.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06]">
                <table className="w-full min-w-[38.75rem] text-left text-sm">
                  <thead className="border-b border-[#EAEAEA] bg-[#F9F9F8] font-medium text-[#787774] dark:border-white/[0.06] dark:bg-[#252525] dark:text-[#9B9A97]">
                    <tr>
                      <th className="px-4 py-3">Email</th>
                      <th className="w-36 px-4 py-3">Role</th>
                      <th className="w-40 px-4 py-3">Status</th>
                      <th className="w-24 px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEAEA] dark:divide-white/[0.06]">
                    {activePendingInvites.map((invite) => (
                      <tr
                        key={invite._id}
                        className="bg-white hover:bg-[#F7F6F3] dark:bg-transparent dark:hover:bg-[#2E2E2E]"
                      >
                        <td className="px-4 py-3 font-medium text-[#111111] dark:text-[#E8E8E7]">
                          {invite.invitedEmail}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-[#EFF6FF] px-2 py-0.5 text-xs font-semibold text-[#1F6C9F] dark:bg-[rgba(37,99,235,0.12)] dark:text-[#93C5FD]">
                            {ROLE_LABELS[invite.role] ?? invite.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#787774] dark:text-[#9B9A97]">
                          {invite.expiresAt
                            ? "Expires " +
                              new Date(invite.expiresAt).toLocaleDateString("en-US")
                            : "Pending, no expiration"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleCancelInvite(invite._id)}
                            disabled={cancelingId === invite._id}
                            className="inline-flex items-center justify-center gap-1.5 rounded-[6px] px-3 py-1.5 text-sm font-semibold text-[#9F2F2D] transition-colors hover:bg-[#FDEBEC] disabled:opacity-50 dark:text-[#F87171] dark:hover:bg-[rgba(159,47,45,0.12)]"
                          >
                            {cancelingId === invite._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}
