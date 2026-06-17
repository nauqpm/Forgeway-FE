"use client";

import { useState, useEffect, MouseEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/constants/queryKeys";
import { Users, UserPlus, Search, X, Loader2, ChevronDown, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import { WORKSPACE_PERMISSIONS } from "../constants/workspacePermissions";
import { useWorkspacePermission } from "../hooks/useWorkspacePermission";

type WorkspaceMember = {
  userId: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: string;
  };
  role: string;
};

const ROLES = [
  { value: "workspace_admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

const ROLE_BADGE: Record<string, string> = {
  space_admin: "bg-[#EFF6FF] text-[#1F6C9F] dark:bg-[rgba(37,99,235,0.12)] dark:text-[#93C5FD]",
  workspace_admin: "bg-[#EFF6FF] text-[#1F6C9F] dark:bg-[rgba(37,99,235,0.12)] dark:text-[#93C5FD]",
  super_admin: "bg-[#FDEBEC] text-[#9F2F2D] dark:bg-[rgba(159,47,45,0.12)] dark:text-[#F87171]",
  viewer: "bg-[#F7F6F3] text-[#787774] dark:bg-[#252525] dark:text-[#9B9A97]",
  member: "bg-[#EDF3EC] text-[#346538] dark:bg-[rgba(52,101,56,0.12)] dark:text-[#4ADE80]",
};

const ROLE_LABEL: Record<string, string> = {
  space_admin: "Admin",
  workspace_admin: "Admin",
  super_admin: "Super Admin",
  viewer: "Viewer",
  member: "Member",
};

function MemberAvatar({ user }: { user: WorkspaceMember["userId"] }) {
  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : (user.email?.[0]?.toUpperCase() ?? "?");

  if (user.avatar) {
    return <img src={user.avatar} alt={user.fullName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />;
  }
  return (
    <span className="w-9 h-9 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white text-[0.6875rem] font-bold flex items-center justify-center flex-shrink-0">
      {initials}
    </span>
  );
}

type InviteFormProps = {
  workspaceId: string;
  workspaceMongoId?: string;
  onClose: () => void;
  onSuccess: () => void;
};

function InviteForm({ workspaceId, workspaceMongoId, onClose, onSuccess }: InviteFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setEmailError("Invalid email address");
      return;
    }
    setEmailError("");
    setSubmitting(true);
    try {
      await api.post(apiRoutes.WORKSPACES.INVITES(workspaceMongoId ?? workspaceId), { email, role });
      toast.success(`Invitation sent to ${email}.`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "User is already a member of this workspace.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-[#2563EB]/20 dark:border-[#3B82F6]/20 bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.06)] rounded-[8px] p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[0.8125rem] font-semibold text-[#1F6C9F] dark:text-[#93C5FD]">Invite to workspace</p>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-[4px] text-[#ABABAB] hover:text-[#787774] dark:hover:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError("");
            }}
            placeholder="user@email.com"
            autoFocus
            className={`w-full px-3 py-2 text-[0.8125rem] rounded-[6px] border bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] focus:outline-none transition-colors ${
              emailError
                ? "border-[#9F2F2D] focus:border-[#9F2F2D]"
                : "border-[#EAEAEA] dark:border-white/[0.08] focus:border-[#2563EB] dark:focus:border-[#3B82F6]"
            }`}
          />
          {emailError && <p className="text-[0.6875rem] text-[#9F2F2D] mt-1">{emailError}</p>}
        </div>

        <div className="relative flex-shrink-0">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="appearance-none w-full sm:w-32 px-3 py-2 pr-7 text-[0.8125rem] rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.08] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] focus:outline-none focus:border-[#2563EB] transition-colors"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#ABABAB]" />
        </div>

        <button
          type="submit"
          disabled={submitting || !email}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-[0.8125rem] font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] disabled:opacity-40 disabled:cursor-not-allowed rounded-[6px] transition-colors flex-shrink-0"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? "Sending..." : "Send invite"}
        </button>
      </form>
    </div>
  );
}

type WorkspaceMembersPanelProps = {
  workspaceId: string;
  workspaceMongoId?: string;
};

export default function WorkspaceMembersPanel({ workspaceId, workspaceMongoId }: WorkspaceMembersPanelProps) {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const { hasPermission } = useWorkspacePermission(workspaceId);
  const canManageMembers = hasPermission(WORKSPACE_PERMISSIONS.WORKSPACE_UPDATE);
  
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    member: WorkspaceMember;
    x: number;
    y: number;
  } | null>(null);

  const { data: members = [], isLoading: loading } = useQuery<WorkspaceMember[]>({
    queryKey: queryKeys.workspaces.members(workspaceId),
    queryFn: async () => {
      const res = await api.get(apiRoutes.WORKSPACES.MEMBERS(workspaceId));
      return res.data?.data ?? res.data ?? [];
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await api.put(apiRoutes.WORKSPACES.UPDATE_MEMBER(workspaceId, userId), { role });
      return { userId, role };
    },
    onSuccess: ({ userId, role }) => {
      queryClient.setQueryData<WorkspaceMember[]>(
        queryKeys.workspaces.members(workspaceId),
        (current = []) => current.map((item) => (item.userId?._id === userId ? { ...item, role } : item))
      );
      toast.success("Member permissions updated.");
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Could not update member permissions.");
    },
    onSettled: () => {
      setContextMenu(null);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(apiRoutes.WORKSPACES.REMOVE_MEMBER(workspaceMongoId ?? workspaceId, userId));
      return userId;
    },
    onSuccess: (userId) => {
      queryClient.setQueryData<WorkspaceMember[]>(
        queryKeys.workspaces.members(workspaceId),
        (current = []) => current.filter((item) => item.userId?._id !== userId)
      );
      toast.success("Member removed from workspace.");
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Could not remove member.");
    },
    onSettled: () => {
      setContextMenu(null);
    },
  });

  const updatingMemberId = updateRoleMutation.isPending ? updateRoleMutation.variables?.userId : null;
  const removingMemberId = removeMemberMutation.isPending ? removeMemberMutation.variables : null;

  const handleInviteSuccess = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.members(workspaceId) });
  };

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setContextMenu(null);
    };

    document.addEventListener("click", closeMenu);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("click", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const handleOpenContextMenu = (event: MouseEvent<HTMLDivElement>, member: WorkspaceMember) => {
    event.preventDefault();
    if (!canManageMembers || member.userId?._id === authUser?.id) return;
    setContextMenu({
      member,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleOpenMemberMenu = (event: MouseEvent<HTMLDivElement>, member: WorkspaceMember) => {
    if (!canManageMembers || member.userId?._id === authUser?.id) return;
    setContextMenu({
      member,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleUpdateMemberRole = (member: WorkspaceMember, role: string) => {
    const userId = member.userId?._id;
    if (!userId || member.role === role) {
      setContextMenu(null);
      return;
    }
    updateRoleMutation.mutate({ userId, role });
  };

  const handleRemoveMember = (member: WorkspaceMember) => {
    const userId = member.userId?._id;
    if (!userId) return;
    removeMemberMutation.mutate(userId);
  };

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    if (!q) return true;
    const user = m.userId;
    if (!user) return false;
    return (
      user.fullName?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      m.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#787774] dark:text-[#9B9A97]" />
          <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Members</h3>
          {!loading && <span className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">({members.length})</span>}
        </div>
        <button
          onClick={() => setShowInvite((v) => !v)}
          disabled={!canManageMembers}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[0.8125rem] font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] disabled:opacity-40 disabled:cursor-not-allowed rounded-[6px] transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {showInvite && (
        <InviteForm
          workspaceId={workspaceId}
          workspaceMongoId={workspaceMongoId}
          onClose={() => setShowInvite(false)}
          onSuccess={handleInviteSuccess}
        />
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#ABABAB] pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="w-full pl-9 pr-3 py-2 text-[0.8125rem] rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.08] bg-[#F9F9F8] dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-[3px] text-[#ABABAB] hover:text-[#787774] dark:hover:text-[#9B9A97] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] py-4">
          <div className="w-4 h-4 border-2 border-[#EAEAEA] border-t-[#2563EB] rounded-full animate-spin" />
          Loading members...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[6px] border border-dashed border-[#EAEAEA] dark:border-white/[0.08] p-5 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] text-center">
          {search ? "No members match your search." : "No members yet."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((m) => {
            const user = m.userId;
            if (!user) return null;
            const roleLabel = ROLE_LABEL[m.role] ?? m.role;
            const badgeClass = ROLE_BADGE[m.role] ?? ROLE_BADGE.member;
            return (
              <div
                key={user._id}
                onClick={(event) => handleOpenMemberMenu(event, m)}
                onContextMenu={(event) => handleOpenContextMenu(event, m)}
                className={`flex items-center gap-3 p-3 rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] hover:bg-[#F7F6F3] dark:hover:bg-white/4 transition-colors ${canManageMembers && user._id !== authUser?.id ? "cursor-pointer" : ""}`}
              >
                <MemberAvatar user={user} />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7] truncate">
                    {user.fullName || user.email}
                  </p>
                  <p className="text-[0.6875rem] text-[#787774] dark:text-[#9B9A97] truncate">{user.email}</p>
                </div>
                <span className={`text-[0.6875rem] font-medium px-2 py-0.5 rounded-[4px] flex-shrink-0 ${badgeClass}`}>
                  {roleLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {contextMenu && (
        <div
          className="fixed z-50 w-52 rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] py-1"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="border-b border-[#EAEAEA] dark:border-white/[0.06] px-3 py-2">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[#ABABAB] dark:text-[#6B6B6B]">
              Grant permission
            </p>
          </div>
          {ROLES.map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => handleUpdateMemberRole(contextMenu.member, role.value)}
              disabled={updatingMemberId === contextMenu.member.userId?._id}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[0.8125rem] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] disabled:opacity-50 transition-colors ${
                contextMenu.member.role === role.value
                  ? "text-[#2563EB] dark:text-[#3B82F6] font-semibold"
                  : "text-[#787774] dark:text-[#9B9A97]"
              }`}
            >
              {updatingMemberId === contextMenu.member.userId?._id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              {role.label}
            </button>
          ))}
          <div className="my-1 border-t border-[#EAEAEA] dark:border-white/[0.06]" />
          <button
            type="button"
            onClick={() => handleRemoveMember(contextMenu.member)}
            disabled={removingMemberId === contextMenu.member.userId?._id}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-[0.8125rem] text-[#9F2F2D] hover:bg-[#FDEBEC] dark:hover:bg-[rgba(159,47,45,0.12)] disabled:opacity-50 transition-colors"
          >
            {removingMemberId === contextMenu.member.userId?._id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Remove from workspace
          </button>
        </div>
      )}
    </div>
  );
}
