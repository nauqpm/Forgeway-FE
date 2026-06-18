"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, MoreHorizontal, Mail, Shield, Trash2, ChevronDown } from "lucide-react";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { queryKeys } from "@/shared/constants/queryKeys";
import LoadingSpinner from "@/modules/admin-shared/components/common/components/LoadingSpinner";
import type { Workspace } from "@/stores/workspaceStore";
import { useCurrentWorkspace } from "@/modules/workspace/shared/hooks/useWorkspaces";
import { workspaceService } from "@/modules/workspace/shared/services/workspaceService";

interface User {
  _id: string;
  email: string;
  fullName?: string;
  avatar?: string;
  role: string;
  status: string;
  createdAt: string;
}

interface WorkspaceMember {
  userId: string;
  email: string;
  fullName?: string;
  avatar?: string;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: string;
  status?: string;
}

export interface AdminUsersProps {
  className?: string;
}

const roleColors: Record<string, string> = {
  owner: "bg-[#FBF3DB] dark:bg-[rgba(149,100,0,0.12)] text-[#956400] dark:text-[#F59E0B]",
  admin: "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#1F6C9F] dark:text-[#93C5FD]",
  member: "bg-[#EDF3EC] dark:bg-[rgba(52,101,56,0.12)] text-[#346538] dark:text-[#4ADE80]",
  viewer: "bg-[#F7F6F3] dark:bg-[#252525] text-[#787774] dark:text-[#9B9A97]",
};

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Administrator",
  member: "Member",
  viewer: "Viewer",
};

export default function AdminUsers({ className = "" }: AdminUsersProps) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useCurrentWorkspace();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"workspace" | "all">("workspace");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const workspacesQuery = useQuery<Workspace[]>({
    queryKey: queryKeys.workspaces.list(),
    queryFn: workspaceService.listMine,
  });

  const activeWorkspace = currentWorkspace ?? workspacesQuery.data?.[0] ?? null;

  const usersQuery = useQuery<User[]>({
    queryKey: queryKeys.admin.users(),
    queryFn: async () => {
      const res = await api.get(apiRoutes.USERS.BASE);
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const membersQuery = useQuery<WorkspaceMember[]>({
    queryKey: queryKeys.workspaces.members(activeWorkspace?._id ?? "none"),
    queryFn: async () => {
      const res = await api.get(apiRoutes.WORKSPACES.MEMBERS(activeWorkspace!._id));
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!activeWorkspace?._id,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!activeWorkspace?._id) return;
      await api.post(apiRoutes.WORKSPACES.ADD_MEMBER(activeWorkspace._id), {
        email: inviteEmail,
        role: inviteRole,
      });
    },
    onSuccess: async () => {
      if (activeWorkspace?._id) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.members(activeWorkspace._id) });
      }
      setInviteEmail("");
      setShowInvite(false);
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ memberUserId, newRole }: { memberUserId: string; newRole: string }) => {
      if (!activeWorkspace?._id) return;
      await api.put(apiRoutes.WORKSPACES.UPDATE_MEMBER(activeWorkspace._id, memberUserId), { role: newRole });
      return { memberUserId, newRole };
    },
    onSuccess: (result) => {
      if (!result || !activeWorkspace?._id) return;
      const { memberUserId, newRole } = result;
      queryClient.setQueryData<WorkspaceMember[]>(queryKeys.workspaces.members(activeWorkspace._id), (current = []) =>
        current.map((member) =>
          member.userId === memberUserId ? { ...member, role: newRole as WorkspaceMember["role"] } : member,
        ),
      );
      setOpenMenu(null);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberUserId: string) => {
      if (!activeWorkspace?._id) return;
      await api.delete(apiRoutes.WORKSPACES.REMOVE_MEMBER(activeWorkspace._id, memberUserId));
      return memberUserId;
    },
    onSuccess: (memberUserId) => {
      if (!activeWorkspace?._id) return;
      queryClient.setQueryData<WorkspaceMember[]>(queryKeys.workspaces.members(activeWorkspace._id), (current = []) =>
        current.filter((member) => member.userId !== memberUserId),
      );
    },
  });

  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  const filteredMembers = useMemo(
    () =>
      members.filter(
        (user) =>
          (user.email || "").toLowerCase().includes(search.toLowerCase()) ||
          (user.fullName || "").toLowerCase().includes(search.toLowerCase()),
      ),
    [members, search],
  );

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.email.toLowerCase().includes(search.toLowerCase()) ||
          (user.fullName || "").toLowerCase().includes(search.toLowerCase()),
      ),
    [search, users],
  );

  if (workspacesQuery.isLoading || usersQuery.isLoading || membersQuery.isLoading) {
    return <LoadingSpinner />;
  }

  const displayItems = tab === "workspace" ? filteredMembers : filteredUsers;

  return (
    <div className={`app-page-wide ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111111] dark:text-[#E8E8E7]">User Management</h1>
          <p className="text-[#787774] dark:text-[#9B9A97] text-sm mt-0.5">Manage members and access permissions</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          disabled={!activeWorkspace}
          className="inline-flex items-center gap-2 bg-[#2563EB] text-white px-4 py-2 rounded-[6px] hover:bg-[#1D4ED8] font-medium text-sm transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Invite Member
        </button>
      </div>

      {showInvite && (
        <div className="fixed inset-0 bg-[#111111]/40 z-50 flex items-center justify-center p-[var(--app-page-pad)]">
          <div
            className="bg-white dark:bg-[#202020] rounded-[10px] w-full max-w-[min(100%,var(--app-popover-w))]"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center justify-between p-5 border-b border-[#EAEAEA] dark:border-white/8">
              <h3 className="font-semibold text-[#111111] dark:text-[#E8E8E7]">Invite Member</h3>
              <button
                onClick={() => setShowInvite(false)}
                className="p-1 hover:bg-[#F7F6F3] dark:hover:bg-white/8 rounded-[6px]"
              >
                <MoreHorizontal className="w-5 h-5 text-[#ABABAB] dark:text-[#6B6B6B]" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!inviteEmail.trim() || !activeWorkspace?._id) return;
                inviteMutation.mutate();
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-[#787774] dark:text-[#9B9A97] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B]" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    placeholder="colleague@company.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-[#EAEAEA] dark:border-white/10 rounded-[6px] text-sm bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#787774] dark:text-[#9B9A97] mb-1.5">Role</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B]" />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-[#EAEAEA] dark:border-white/10 rounded-[6px] text-sm bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] appearance-none"
                  >
                    <option value="viewer">Viewer - View only</option>
                    <option value="member">Member - Can create and edit</option>
                    <option value="admin">Administrator - Full access</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B] pointer-events-none" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="flex-1 px-4 py-2.5 border border-[#EAEAEA] dark:border-white/10 rounded-[6px] text-sm font-medium text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/8 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-[#2563EB] text-white rounded-[6px] text-sm font-medium hover:bg-[#1D4ED8] transition-colors disabled:opacity-50"
                >
                  {inviteMutation.isPending ? "Sending..." : "Send invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex w-full flex-wrap items-center gap-1 mb-6 bg-[#F7F6F3] dark:bg-[#252525] p-1 rounded-[8px] sm:w-fit">
        <button
          onClick={() => setTab("workspace")}
          className={`px-4 py-2 rounded-[6px] text-sm font-medium transition-colors ${tab === "workspace" ? "bg-white dark:bg-[#2A2A2A] text-[#111111] dark:text-[#E8E8E7] " : "text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7]"}`}
        >
          Member Workspace ({members.length})
        </button>
        <button
          onClick={() => setTab("all")}
          className={`px-4 py-2 rounded-[6px] text-sm font-medium transition-colors ${tab === "all" ? "bg-white dark:bg-[#2A2A2A] text-[#111111] dark:text-[#E8E8E7] " : "text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7]"}`}
        >
          All Users ({users.length})
        </button>
      </div>

      <div className="bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/8 overflow-hidden">
        <div className="p-4 border-b border-[#EAEAEA] dark:border-white/8">
          <div className="relative max-w-[min(100%,28rem)]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${tab === "workspace" ? "members" : "users"}...`}
              className="w-full pl-10 pr-4 py-2 border border-[#EAEAEA] dark:border-white/10 rounded-[6px] text-sm bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] placeholder-[#ABABAB] dark:placeholder-[#6B6B6B] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full app-table-min">
            <thead className="bg-[#F9F9F8] dark:bg-[#252525] border-b border-[#EAEAEA] dark:border-white/8">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#787774] dark:text-[#9B9A97] uppercase tracking-wide">
                  Member
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#787774] dark:text-[#9B9A97] uppercase tracking-wide">
                  Role
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#787774] dark:text-[#9B9A97] uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#787774] dark:text-[#9B9A97] uppercase tracking-wide">
                  Joined date
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#787774] dark:text-[#9B9A97] uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA] dark:divide-white/8">
              {displayItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[#ABABAB] dark:text-[#6B6B6B] text-sm">
                    No {tab === "workspace" ? "members" : "users"} found
                  </td>
                </tr>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              displayItems.map((item: any) => (
                  <tr
                    key={item._id || item.email}
                    className="hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6] flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {item.avatar ? (
                            <img src={item.avatar} className="w-full h-full rounded-full object-cover" alt="" />
                          ) : (
                            (item.fullName || item.email).charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#111111] dark:text-[#E8E8E7] truncate">
                            {item.fullName || "-"}
                          </p>
                          <p className="text-xs text-[#ABABAB] dark:text-[#6B6B6B] truncate">{item.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {tab === "workspace" ? (
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenu(openMenu === item.userId ? null : item.userId)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium ${roleColors[item.role] || roleColors.member} hover:opacity-80 transition-opacity`}
                          >
                            {roleLabels[item.role] || item.role}
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          {openMenu === item.userId && item.role !== "owner" && (
                            <div
                              className="absolute top-full left-0 mt-1 bg-white dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/10 rounded-[8px] z-10 py-1 min-w-40"
                              style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}
                            >
                              {["admin", "member", "viewer"].map((role) => (
                                <button
                                  key={role}
                                  onClick={() => changeRoleMutation.mutate({ memberUserId: item.userId, newRole: role })}
                                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-[#F7F6F3] dark:hover:bg-white/8 ${item.role === role ? "text-[#2563EB] dark:text-[#3B82F6] font-medium" : "text-[#787774] dark:text-[#9B9A97]"}`}
                                >
                                  {roleLabels[role]}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-medium ${roleColors[item.role] || roleColors.member}`}
                        >
                          {roleLabels[item.role] || item.role}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-[4px] text-xs font-medium ${item.status === "active" ? "bg-[#EDF3EC] dark:bg-[rgba(52,101,56,0.12)] text-[#346538] dark:text-[#4ADE80]" : "bg-[#F7F6F3] dark:bg-[#252525] text-[#787774] dark:text-[#9B9A97]"}`}
                      >
                        {item.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#787774] dark:text-[#9B9A97]">
                      {new Date(item.createdAt || item.joinedAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {tab === "workspace" && item.role !== "owner" && (
                        <button
                          onClick={() => removeMemberMutation.mutate(item.userId)}
                          className="p-1.5 text-[#ABABAB] dark:text-[#6B6B6B] hover:text-[#9F2F2D] dark:hover:text-[#F87171] hover:bg-[#FDEBEC] dark:hover:bg-[rgba(159,47,45,0.12)] rounded-[6px] transition-colors"
                          title="Remove from workspace"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
