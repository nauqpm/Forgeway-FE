"use client";

import { useState, useEffect, useCallback, MouseEvent } from "react";
import { Users, UserPlus, Search, X, Loader2, ChevronDown, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/config/api";
import { apiRoutes } from "@/config/apiRoutes";
import { useAuth } from "@/context/AuthContext";
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
  space_admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  workspace_admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  super_admin: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  viewer: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  member: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
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
    ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? "?";

  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.fullName}
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <span className="w-9 h-9 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
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

  const validateEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

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
      toast.success(`Đã gửi lời mời tới ${email}.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? "Không thể gửi lời mời.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-4 mb-4 shadow-sm dark:shadow-none">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
          Invite to workspace
        </p>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
            className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
              emailError
                ? "border-red-400 dark:border-red-600"
                : "border-gray-300 dark:border-gray-700"
            }`}
          />
          {emailError && (
            <p className="text-xs text-red-500 mt-1">{emailError}</p>
          )}
        </div>

        <div className="relative flex-shrink-0">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="appearance-none w-full sm:w-32 px-3 py-2 pr-7 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
        </div>

        <button
          type="submit"
          disabled={submitting || !email}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-900/50 disabled:cursor-not-allowed rounded-lg transition-colors flex-shrink-0"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : null}
          {submitting ? "Sending…" : "Send invite"}
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
  const { user: authUser } = useAuth();
  const { hasPermission } = useWorkspacePermission(workspaceId);
  const canManageMembers = hasPermission(WORKSPACE_PERMISSIONS.WORKSPACE_UPDATE);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    member: WorkspaceMember;
    x: number;
    y: number;
  } | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  const fetchMembers = useCallback(() => {
    if (!workspaceId) return;
    setLoading(true);
    api
      .get(apiRoutes.WORKSPACES.MEMBERS(workspaceId))
      .then((res) => setMembers(res.data?.data ?? res.data ?? []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

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

  const handleOpenContextMenu = (
    event: MouseEvent<HTMLDivElement>,
    member: WorkspaceMember,
  ) => {
    event.preventDefault();
    if (!canManageMembers || member.userId?._id === authUser?.id) return;
    setContextMenu({
      member,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleOpenMemberMenu = (
    event: MouseEvent<HTMLDivElement>,
    member: WorkspaceMember,
  ) => {
    if (!canManageMembers || member.userId?._id === authUser?.id) return;
    setContextMenu({
      member,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleUpdateMemberRole = async (
    member: WorkspaceMember,
    role: string,
  ) => {
    const userId = member.userId?._id;
    if (!userId || member.role === role) {
      setContextMenu(null);
      return;
    }

    setUpdatingMemberId(userId);
    try {
      await api.put(apiRoutes.WORKSPACES.UPDATE_MEMBER(workspaceId, userId), { role });
      setMembers((prev) =>
        prev.map((item) =>
          item.userId?._id === userId ? { ...item, role } : item,
        ),
      );
      setContextMenu(null);
      toast.success("Đã cập nhật quyền thành viên.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể cập nhật quyền thành viên.");
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = async (member: WorkspaceMember) => {
    const userId = member.userId?._id;
    if (!userId) return;

    setRemovingMemberId(userId);
    try {
      await api.delete(apiRoutes.WORKSPACES.REMOVE_MEMBER(workspaceMongoId ?? workspaceId, userId));
      setMembers((prev) => prev.filter((item) => item.userId?._id !== userId));
      setContextMenu(null);
      toast.success("Đã xóa thành viên khỏi workspace.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể xóa thành viên.");
    } finally {
      setRemovingMemberId(null);
    }
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
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Members</h3>
          {!loading && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({members.length})
            </span>
          )}
        </div>
        <button
          onClick={() => setShowInvite((v) => !v)}
          disabled={!canManageMembers}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <InviteForm
          workspaceId={workspaceId}
          workspaceMongoId={workspaceMongoId}
          onClose={() => setShowInvite(false)}
          onSuccess={fetchMembers}
        />
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members…"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Members list */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-4">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          Loading members…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-300 dark:border-gray-700 p-5 text-sm text-gray-500 dark:text-gray-400 text-center">
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
                className={`flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors ${canManageMembers && user._id !== authUser?.id ? "cursor-pointer" : ""}`}
              >
                <MemberAvatar user={user} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.fullName || user.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${badgeClass}`}
                >
                  {roleLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {contextMenu && (
        <div
          className="fixed z-50 w-52 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-1 shadow-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="border-b border-gray-100 dark:border-gray-800 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Cấp quyền
            </p>
          </div>
          {ROLES.map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => handleUpdateMemberRole(contextMenu.member, role.value)}
              disabled={updatingMemberId === contextMenu.member.userId?._id}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 ${
                contextMenu.member.role === role.value
                  ? "text-indigo-600 dark:text-indigo-300 font-semibold"
                  : "text-gray-700 dark:text-gray-200"
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
          <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
          <button
            type="button"
            onClick={() => handleRemoveMember(contextMenu.member)}
            disabled={removingMemberId === contextMenu.member.userId?._id}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
          >
            {removingMemberId === contextMenu.member.userId?._id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Xóa khỏi workspace
          </button>
        </div>
      )}
    </div>
  );
}
