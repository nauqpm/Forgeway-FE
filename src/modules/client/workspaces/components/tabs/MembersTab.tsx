"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import RoleChanger, {
  WorkspaceRoleValue,
} from "@/modules/client/workspaces/components/RoleChanger";

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
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: members = [], isLoading } = useQuery<WorkspaceMember[]>({
    queryKey: ["members", workspaceId],
    queryFn: async () => {
      const res = await api.get(apiRoutes.WORKSPACES.MEMBERS(workspaceId));
      return res.data?.data ?? res.data ?? [];
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });

  const handleUpdateRole = async (
    member: WorkspaceMember,
    role: WorkspaceRoleValue,
  ) => {
    const userId = member.userId?._id;
    if (!userId || member.role === role) return;

    setUpdatingId(userId);
    try {
      await api.put(apiRoutes.WORKSPACES.UPDATE_MEMBER(workspaceId, userId), {
        role,
      });
      queryClient.setQueryData<WorkspaceMember[]>(
        ["members", workspaceId],
        (prev) =>
          (prev ?? []).map((m) =>
            m.userId?._id === userId ? { ...m, role } : m,
          ),
      );
      toast.success("Member permissions updated.");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Could not update member permissions.",
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
      await api.delete(
        apiRoutes.WORKSPACES.REMOVE_MEMBER(workspaceId, userId),
      );
      queryClient.setQueryData<WorkspaceMember[]>(
        ["members", workspaceId],
        (prev) => (prev ?? []).filter((m) => m.userId?._id !== userId),
      );
      toast.success("Member removed from workspace.");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Could not remove member.",
      );
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-[#ABABAB] dark:text-[#6B6B6B]">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading members...
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-[#787774] dark:text-[#9B9A97]" />
        <span className="text-sm font-semibold text-[#111111] dark:text-[#E8E8E7]">
          {members.length} member{members.length !== 1 ? "s" : ""}
        </span>
      </div>

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
                          className="flex-1 sm:flex-none sm:w-auto"
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
    </div>
  );
}
