"use client";

import { Loader2, Trash2, UserPlus, Users, X } from "lucide-react";

import InviteModal from "@/modules/admin-shared/components/common/components/InviteModal";
import RoleChanger from "@/modules/workspace/shared/components/RoleChanger";
import { PendingInvite } from "@/modules/workspace/shared/services/inviteService";
import {
  WorkspaceMember,
  InviteRole,
  ROLE_LABELS,
  getMemberInitials,
} from "../types/workspaceSettings.type";

export interface MemberSettingsProps {
  members: WorkspaceMember[];
  loadingMembers: boolean;
  canManageWorkspace: boolean;
  workspaceInviteId: string;
  currentUserId?: string;
  memberSubTab: "list" | "invites";
  showInviteModal: boolean;
  invites: PendingInvite[];
  loadingInvites: boolean;
  cancellingId: string | null;
  removingMemberId: string | null;
  updatingMemberId: string | null;
  setMemberSubTab: (value: "list" | "invites") => void;
  setShowInviteModal: (value: boolean) => void;
  refreshInvites: () => Promise<void>;
  handleCancelInvite: (inviteId: string) => void;
  handleUpdateMemberRole: (member: WorkspaceMember, role: InviteRole) => void;
  handleRemoveMember: (member: WorkspaceMember) => void;
}

export default function MemberSettings({
  members,
  loadingMembers,
  canManageWorkspace,
  workspaceInviteId,
  currentUserId,
  memberSubTab,
  showInviteModal,
  invites,
  loadingInvites,
  cancellingId,
  removingMemberId,
  updatingMemberId,
  setMemberSubTab,
  setShowInviteModal,
  refreshInvites,
  handleCancelInvite,
  handleUpdateMemberRole,
  handleRemoveMember,
}: MemberSettingsProps) {
  const closeInviteModal = () => {
    setShowInviteModal(false);
    void refreshInvites();
  };

  const listTabClass =
    memberSubTab === "list"
      ? "bg-white text-[#111111] shadow-sm dark:bg-[#202020] dark:text-[#E8E8E7]"
      : "text-[#787774] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:text-[#E8E8E7]";

  const invitesTabClass =
    memberSubTab === "invites"
      ? "bg-white text-[#111111] shadow-sm dark:bg-[#202020] dark:text-[#E8E8E7]"
      : "text-[#787774] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:text-[#E8E8E7]";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#111111] dark:text-[#E8E8E7] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2563EB] dark:text-[#3B82F6]" /> Member
          </h2>
          <p className="mt-1 text-sm text-[#787774] dark:text-[#9B9A97]">
            Manage access permissions and pending invitations in this workspace.
          </p>
        </div>
        {canManageWorkspace && (
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#2563EB]/20 transition-colors hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB]"
          >
            <UserPlus className="h-4 w-4" />
            Invite member
          </button>
        )}
      </div>

      <div className="inline-flex rounded-[6px] border border-[#EAEAEA] bg-[#F9F9F8] p-1 dark:border-white/[0.06] dark:bg-[#252525]">
        <button
          type="button"
          onClick={() => setMemberSubTab("list")}
          className={"rounded-md px-3 py-1.5 text-sm font-semibold transition-colors " + listTabClass}
        >
          List ({members.length})
        </button>
        {canManageWorkspace && (
          <button
            type="button"
            onClick={() => setMemberSubTab("invites")}
            className={"rounded-md px-3 py-1.5 text-sm font-semibold transition-colors " + invitesTabClass}
          >
            Invitations ({invites.length})
          </button>
        )}
      </div>

      {memberSubTab === "list" || !canManageWorkspace ? (
        <section>
          {loadingMembers ? (
            <div className="flex items-center gap-2 py-8 text-sm text-[#ABABAB] dark:text-[#6B6B6B]">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading members...
            </div>
          ) : members.length === 0 ? (
            <div className="rounded-[6px] border border-dashed border-[#EAEAEA] p-6 text-center text-sm text-[#787774] dark:border-white/[0.08] dark:text-[#9B9A97]">
              There are no members in this workspace yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06]">
              <div className="divide-y divide-[#EAEAEA] dark:divide-white/[0.06]">
                {members.map((member) => {
                  const memberUser = member.userId;
                  const displayName = memberUser?.fullName || memberUser?.email || "User";
                  const memberId = memberUser?._id;
                  const isSelf = memberId === currentUserId;
                  const isBusy = updatingMemberId === memberId || removingMemberId === memberId;
                  const normalizedRole: InviteRole =
                    member.role === "space_admin" ? "workspace_admin" : (member.role as InviteRole);

                  return (
                    <div
                      key={memberId ?? displayName + "-" + member.role}
                      className="flex flex-col gap-3 bg-white p-4 dark:bg-[#202020] sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {memberUser?.avatar ? (
                          <img
                            src={memberUser.avatar}
                            alt={displayName}
                            className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-xs font-bold text-white">
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
                            {memberUser?.email || "No email"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:w-[20rem] sm:flex-row sm:items-end sm:justify-end">
                        <RoleChanger
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          value={normalizedRole as any}
                          onChange={(role) => handleUpdateMemberRole(member, role)}
                          disabled={!canManageWorkspace || isSelf || isBusy}
                          isLoading={updatingMemberId === memberId}
                          compact
                          className="w-full sm:w-[9rem]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member)}
                          disabled={!canManageWorkspace || isSelf || isBusy}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-[6px] border border-[#F5C6C7] px-3 text-sm font-semibold text-[#9F2F2D] transition-colors hover:bg-[#FDEBEC] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#9F2F2D]/40 dark:text-[#F87171] dark:hover:bg-[rgba(159,47,45,0.12)]"
                        >
                          {removingMemberId === memberId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      ) : (
        <section>
          {loadingInvites ? (
            <div className="flex items-center gap-2 py-8 text-sm text-[#ABABAB] dark:text-[#6B6B6B]">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading invitations...
            </div>
          ) : invites.length === 0 ? (
            <div className="rounded-[6px] border border-dashed border-[#EAEAEA] p-6 text-center text-sm text-[#787774] dark:border-white/[0.08] dark:text-[#9B9A97]">
              There are no pending invitations.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06]">
              <table className="w-full min-w-[38.75rem] text-left text-sm">
                <thead className="border-b border-[#EAEAEA] bg-[#F9F9F8] font-medium text-[#787774] dark:border-white/[0.06] dark:bg-[#252525] dark:text-[#9B9A97]">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3 w-36">Role</th>
                    <th className="px-4 py-3 w-40">Status</th>
                    <th className="px-4 py-3 w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA] dark:divide-white/[0.06]">
                  {invites.map((invite) => (
                    <tr
                      key={invite._id}
                      className="bg-white hover:bg-[#F7F6F3] dark:bg-[#202020] dark:hover:bg-[#2E2E2E]"
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
                          ? "Expires " + new Date(invite.expiresAt).toLocaleDateString("en-US")
                          : "Pending, no expiration"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleCancelInvite(invite._id)}
                          disabled={cancellingId === invite._id}
                          className="inline-flex items-center justify-center gap-2 rounded-[6px] px-3 py-1.5 text-sm font-semibold text-[#9F2F2D] transition-colors hover:bg-[#FDEBEC] disabled:opacity-50 dark:text-[#F87171] dark:hover:bg-[rgba(159,47,45,0.12)]"
                        >
                          {cancellingId === invite._id ? (
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

      {canManageWorkspace && (
        <InviteModal isOpen={showInviteModal} onClose={closeInviteModal} projectId={workspaceInviteId} />
      )}
    </div>
  );
}
