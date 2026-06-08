"use client";

import {
  FormEvent,
  KeyboardEvent,
  MouseEvent,
  use,
  useEffect,
  useState,
} from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Globe,
  Loader2,
  Lock,
  LogOut,
  Save,
  Settings,
  ShieldAlert,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import { useAuth } from "@/context/AuthContext";
import InviteModal from "@/modules/admin/components/common/components/InviteModal";
import LoadingSpinner from "@/modules/admin/components/common/components/LoadingSpinner";
import RoleChanger, {
  WorkspaceRoleValue,
} from "@/modules/client/workspaces/components/RoleChanger";
import {
  inviteService,
  PendingInvite,
} from "@/modules/client/workspaces/services/inviteService";
import { resolveWorkspaceFromRouteKey } from "@/modules/client/workspaces/services/resolveWorkspace";

type WorkspaceStatus = "active" | "archived";
type WorkspaceAccess = "public" | "private";
type InviteRole = WorkspaceRoleValue;

interface WorkspaceSettings {
  _id: string;
  name: string;
  key: string;
  description?: string;
  status?: WorkspaceStatus;
  access?: WorkspaceAccess;
  visibility?: WorkspaceAccess;
}

interface WorkspaceSettingsForm {
  name: string;
  description: string;
  status: WorkspaceStatus;
  access: WorkspaceAccess;
}

interface WorkspaceMember {
  userId: {
    _id: string;
    fullName?: string;
    email?: string;
    avatar?: string;
  };
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  workspace_admin: "Administrator",
  space_admin: "Administrator",
  member: "Member",
  viewer: "Viewer",
};

const normalizeWorkspace = (payload: any): WorkspaceSettings =>
  (payload?.data ?? payload) as WorkspaceSettings;

function getMemberInitials(member: WorkspaceMember) {
  const displayName = member.userId?.fullName || member.userId?.email || "?";
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  usePageTitle("Workspace Settings");
  const { key: workspaceKey } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [workspace, setWorkspace] = useState<WorkspaceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "members">("general");
  const [memberSubTab, setMemberSubTab] = useState<"list" | "invites">("list");

  const [form, setForm] = useState<WorkspaceSettingsForm>({
    name: "",
    description: "",
    status: "active",
    access: "public",
  });
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberMenu, setMemberMenu] = useState<{
    member: WorkspaceMember;
    x: number;
    y: number;
  } | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InviteRole>("member");
  const [inviting, setInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState("");
  const [leaving, setLeaving] = useState(false);

  const workspaceInviteId = workspace?._id ?? "";
  const workspaceApiId = workspace?._id ?? "";
  const currentMember = members.find((m) => m.userId?._id === user?.id);
  const canManageWorkspace =
    currentMember?.role === "workspace_admin" || user?.role === "super_admin";

  useEffect(() => {
    if (!workspaceKey) return;

    setLoading(true);
    resolveWorkspaceFromRouteKey(workspaceKey)
      .then((resolvedWorkspace) => {
        const nextWorkspace = normalizeWorkspace(resolvedWorkspace);
        setWorkspace(nextWorkspace);
        setForm({
          name: nextWorkspace.name || "",
          description: nextWorkspace.description || "",
          status: nextWorkspace.status || "active",
          access: nextWorkspace.access || nextWorkspace.visibility || "public",
        });
      })
      .catch(() => {
        setWorkspace(null);
        toast.error("Could not load workspace settings.");
      })
      .finally(() => setLoading(false));
  }, [workspaceKey]);

  useEffect(() => {
    if (!workspaceApiId) return;
    setLoadingMembers(true);
    api
      .get(apiRoutes.WORKSPACES.MEMBERS(workspaceApiId))
      .then((res) => setMembers(res.data?.data ?? res.data ?? []))
      .catch(() => setMembers([]))
      .finally(() => setLoadingMembers(false));
  }, [workspaceApiId]);

  useEffect(() => {
    if (activeTab !== "members" || !workspaceInviteId) return;
    if (!canManageWorkspace) {
      setInvites([]);
      setLoadingInvites(false);
      return;
    }

    setLoadingInvites(true);
    inviteService
      .listInvites(workspaceInviteId)
      .then(setInvites)
      .catch(() => setInvites([]))
      .finally(() => setLoadingInvites(false));
  }, [activeTab, canManageWorkspace, workspaceInviteId]);

  const refreshInvites = async () => {
    if (!workspaceInviteId || !canManageWorkspace) return;
    setLoadingInvites(true);
    try {
      const updated = await inviteService.listInvites(workspaceInviteId);
      setInvites(updated);
    } catch {
      setInvites([]);
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Workspace name is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
        access: form.access,
      };

      if (!workspaceApiId) throw new Error("Missing workspace id");

      const res = await api.put(
        apiRoutes.WORKSPACES.UPDATE(workspaceApiId),
        payload,
      );
      const updatedWorkspace = normalizeWorkspace(res.data);
      setWorkspace(updatedWorkspace);
      setForm({
        name: updatedWorkspace.name || "",
        description: updatedWorkspace.description || "",
        status: updatedWorkspace.status || "active",
        access: updatedWorkspace.access || "public",
      });
      toast.success("Workspace settings saved.");
    } catch (error: any) {
      console.error("Save failed", error);
      toast.error(
        error?.response?.data?.message || "Could not save workspace settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== "delete") {
      toast.error('Enter "delete" to confirm.');
      return;
    }

    setDeleting(true);
    try {
      if (!workspaceApiId) throw new Error("Missing workspace id");

      await api.delete(apiRoutes.WORKSPACES.BY_ID(workspaceApiId));
      toast.success("Workspace deleted.");
      setShowDeleteDialog(false);
      router.push("/workspaces");
    } catch (error: any) {
      console.error("Delete failed", error);
      toast.error(
        error?.response?.data?.message || "Could not delete workspace.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleInvite = async (event: FormEvent) => {
    event.preventDefault();
    const email = inviteEmail.trim();
    if (!email) return;

    setInviting(true);
    try {
      await inviteService.sendInvite(workspaceInviteId, {
        email,
        role: inviteRole,
      });
      toast.success(`Invitation sent to ${email}.`);
      setInviteEmail("");
      const updated = await inviteService.listInvites(workspaceInviteId);
      setInvites(updated);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "User is already a member of this workspace.",
      );
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setCancellingId(inviteId);
    try {
      await inviteService.cancelInvite(workspaceInviteId, inviteId);
      setInvites((prev) => prev.filter((invite) => invite._id !== inviteId));
      toast.success("Invitation canceled.");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Could not cancel invitation.",
      );
    } finally {
      setCancellingId(null);
    }
  };

  const handleOpenMemberMenu = (
    event: MouseEvent<HTMLDivElement>,
    member: WorkspaceMember,
  ) => {
    if (member.userId?._id === user?.id) return;
    event.preventDefault();
    setMemberMenu({
      member,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleClickMember = (
    event: MouseEvent<HTMLDivElement>,
    member: WorkspaceMember,
  ) => {
    if (member.userId?._id === user?.id) return;
    setMemberMenu({
      member,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleUpdateMemberRole = async (
    member: WorkspaceMember,
    role: InviteRole,
  ) => {
    const userId = member.userId?._id;
    if (!userId || member.role === role) {
      setMemberMenu(null);
      return;
    }

    setUpdatingMemberId(userId);
    try {
      if (!workspaceApiId) throw new Error("Missing workspace id");

      await api.put(
        apiRoutes.WORKSPACES.UPDATE_MEMBER(workspaceApiId, userId),
        { role },
      );
      setMembers((prev) =>
        prev.map((item) =>
          item.userId?._id === userId ? { ...item, role } : item,
        ),
      );
      setMemberMenu(null);
      toast.success("Member permissions updated.");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Could not update member permissions.",
      );
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = async (member: WorkspaceMember) => {
    const userId = member.userId?._id;
    if (!userId) return;

    setRemovingMemberId(userId);
    try {
      if (!workspaceApiId) throw new Error("Missing workspace id");

      await api.delete(
        apiRoutes.WORKSPACES.REMOVE_MEMBER(workspaceApiId, userId),
      );
      setMembers((prev) => prev.filter((item) => item.userId?._id !== userId));
      setMemberMenu(null);
      toast.success("Member removed from workspace.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not remove member.");
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleLeave = async () => {
    if (leaveConfirm !== "leave") {
      toast.error('Enter "leave" to confirm.');
      return;
    }

    setLeaving(true);
    try {
      if (!workspaceApiId) throw new Error("Missing workspace id");

      await api.delete(apiRoutes.WORKSPACES.LEAVE(workspaceApiId));
      toast.success("Left workspace.");
      router.push("/workspaces");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Could not leave workspace.",
      );
    } finally {
      setLeaving(false);
      setShowLeaveDialog(false);
    }
  };

  const handleDeleteConfirmKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key !== "Enter" || deleting) return;

    event.preventDefault();
    void handleDelete();
  };

  const handleLeaveConfirmKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key !== "Enter" || leaving) return;

    event.preventDefault();
    void handleLeave();
  };

  if (loading) return <LoadingSpinner />;

  if (!workspace) {
    return (
      <div className="p-10 text-center text-[#787774] dark:text-[#9B9A97]">
        Workspace not found.
      </div>
    );
  }

  return (
    <div className="workspace-surface max-w-[min(100%,64rem)] pb-12">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/workspaces/${workspaceKey}`}
          className="p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[6px] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#787774] dark:text-[#9B9A97]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#111111] dark:text-[#E8E8E7]">
            Workspace settings
          </h1>
          <p className="text-[#787774] dark:text-[#9B9A97] text-sm mt-0.5">
            {workspace.name}
            <span className="text-[#ABABAB] dark:text-[#6B6B6B] mx-1">-</span>
            {workspace.key}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] overflow-hidden flex flex-col md:flex-row min-h-[max(500px,var(--app-board-h))]">
        <div className="w-full md:w-[var(--workspace-settings-nav-w)] bg-[#F9F9F8] dark:bg-[#252525] border-b md:border-b-0 md:border-r border-[#EAEAEA] dark:border-white/[0.06] p-[var(--workspace-surface-pad)]">
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "general"
                  ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6]"
                  : "text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
              }`}
            >
              <Settings className="w-4 h-4" /> Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "members"
                  ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6]"
                  : "text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
              }`}
            >
              <Users className="w-4 h-4" /> Member
            </button>
          </nav>
        </div>

        <div className="flex-1 p-[var(--workspace-surface-pad)] md:p-[clamp(24px,2vw,32px)]">
          {activeTab === "general" ? (
            <GeneralSettings
              form={form}
              workspace={workspace}
              saving={saving}
              deleting={deleting}
              deleteConfirm={deleteConfirm}
              showDeleteDialog={showDeleteDialog}
              setForm={setForm}
              setDeleteConfirm={setDeleteConfirm}
              setShowDeleteDialog={setShowDeleteDialog}
              handleSave={handleSave}
              handleDelete={handleDelete}
              canManageWorkspace={canManageWorkspace}
              leaving={leaving}
              leaveConfirm={leaveConfirm}
              setLeaveConfirm={setLeaveConfirm}
              showLeaveDialog={showLeaveDialog}
              setShowLeaveDialog={setShowLeaveDialog}
              handleLeave={handleLeave}
              handleDeleteConfirmKeyDown={handleDeleteConfirmKeyDown}
              handleLeaveConfirmKeyDown={handleLeaveConfirmKeyDown}
            />
          ) : (
            <MemberSettings
              members={members}
              loadingMembers={loadingMembers}
              memberSubTab={memberSubTab}
              setMemberSubTab={setMemberSubTab}
              showInviteModal={showInviteModal}
              setShowInviteModal={setShowInviteModal}
              workspaceInviteId={workspaceInviteId}
              currentUserId={user?.id}
              inviteEmail={inviteEmail}
              inviteRole={inviteRole}
              inviting={inviting}
              invites={invites}
              loadingInvites={loadingInvites}
              cancellingId={cancellingId}
              setInviteEmail={setInviteEmail}
              setInviteRole={setInviteRole}
              handleInvite={handleInvite}
              refreshInvites={refreshInvites}
              handleCancelInvite={handleCancelInvite}
              memberMenu={memberMenu}
              removingMemberId={removingMemberId}
              updatingMemberId={updatingMemberId}
              handleOpenMemberMenu={handleOpenMemberMenu}
              handleClickMember={handleClickMember}
              handleUpdateMemberRole={handleUpdateMemberRole}
              handleRemoveMember={handleRemoveMember}
              canManageWorkspace={canManageWorkspace}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function GeneralSettings({
  form,
  workspace,
  saving,
  deleting,
  deleteConfirm,
  showDeleteDialog,
  setForm,
  setDeleteConfirm,
  setShowDeleteDialog,
  handleSave,
  handleDelete,
  canManageWorkspace,
  leaving,
  leaveConfirm,
  setLeaveConfirm,
  showLeaveDialog,
  setShowLeaveDialog,
  handleLeave,
  handleDeleteConfirmKeyDown,
  handleLeaveConfirmKeyDown,
}: {
  form: WorkspaceSettingsForm;
  workspace: WorkspaceSettings;
  saving: boolean;
  deleting: boolean;
  deleteConfirm: string;
  showDeleteDialog: boolean;
  setForm: (form: WorkspaceSettingsForm) => void;
  setDeleteConfirm: (value: string) => void;
  setShowDeleteDialog: (value: boolean) => void;
  handleSave: (event: FormEvent) => void;
  handleDelete: () => void;
  canManageWorkspace: boolean;
  leaving: boolean;
  leaveConfirm: string;
  setLeaveConfirm: (value: string) => void;
  showLeaveDialog: boolean;
  setShowLeaveDialog: (value: boolean) => void;
  handleLeave: () => void;
  handleDeleteConfirmKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  handleLeaveConfirmKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-[min(100%,42rem)]">
      <section>
        <h2 className="text-lg font-bold text-[#111111] dark:text-[#E8E8E7] mb-4">
          Basic information
        </h2>
        {!canManageWorkspace && (
          <p className="mb-4 rounded-[6px] border border-[#EAEAEA] bg-[#F9F9F8] px-4 py-3 text-sm text-[#787774] dark:border-white/[0.06] dark:bg-[#252525] dark:text-[#9B9A97]">
            You can view workspace information. Only administrators can edit it.
          </p>
        )}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#787774] dark:text-[#9B9A97] mb-1.5">
              Workspace name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              disabled={!canManageWorkspace}
              className="w-full px-4 py-2 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#787774] dark:text-[#9B9A97] mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              disabled={!canManageWorkspace}
              className="w-full px-4 py-2 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#787774] dark:text-[#9B9A97] mb-1.5">
              Workspace key
            </label>
            <input
              type="text"
              value={workspace.key}
              disabled
              className="w-full px-4 py-2 bg-[#F9F9F8] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[6px] text-[#787774] dark:text-[#9B9A97] font-mono cursor-not-allowed"
            />
          </div>
        </div>
      </section>

      <hr className="border-[#EAEAEA] dark:border-white/[0.06]" />

      <section>
        <h2 className="text-lg font-bold text-[#111111] dark:text-[#E8E8E7] mb-4">
          Access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { value: "public", label: "Public", icon: Globe },
            { value: "private", label: "Private", icon: Lock },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                form.access === option.value
                  ? "border-[#2563EB] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)]"
                  : "border-[#EAEAEA] dark:border-white/[0.06] hover:border-[#2563EB]/30 dark:hover:border-[#3B82F6]/40"
              }`}
            >
              <input
                type="radio"
                name="access"
                value={option.value}
                checked={form.access === option.value}
                onChange={() =>
                  setForm({ ...form, access: option.value as WorkspaceAccess })
                }
                disabled={!canManageWorkspace}
                className="text-[#2563EB] focus:ring-[#2563EB]"
              />
              <div className="flex items-center gap-2">
                <option.icon className="w-4 h-4 text-[#787774] dark:text-[#9B9A97]" />
                <span className="text-sm font-medium text-[#111111] dark:text-[#E8E8E7]">
                  {option.label}
                </span>
              </div>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#111111] dark:text-[#E8E8E7] mb-4">
          Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { value: "active", label: "Active" },
            { value: "archived", label: "Archived" },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                form.status === option.value
                  ? "border-[#2563EB] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)]"
                  : "border-[#EAEAEA] dark:border-white/[0.06] hover:border-[#2563EB]/30 dark:hover:border-[#3B82F6]/40"
              }`}
            >
              <input
                type="radio"
                name="status"
                value={option.value}
                checked={form.status === option.value}
                onChange={() =>
                  setForm({ ...form, status: option.value as WorkspaceStatus })
                }
                disabled={!canManageWorkspace}
                className="text-[#2563EB] focus:ring-[#2563EB]"
              />
              <span className="text-sm font-medium text-[#111111] dark:text-[#E8E8E7]">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </section>

      {canManageWorkspace && (
        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] text-sm font-medium hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save changes
              </>
            )}
          </button>
        </div>
      )}

      <section className="mt-12 p-5 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 rounded-lg space-y-6">
        <h3 className="text-red-800 dark:text-red-200 font-bold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" /> Danger zone
        </h3>

        {/* Leave workspace */}
        <div className="pb-6 border-b border-red-200 dark:border-red-800">
          <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
            Leave workspace
          </p>
          <p className="text-sm text-red-600 dark:text-red-300 mb-3">
            {canManageWorkspace
              ? "You are the workspace owner. You must delete the workspace before leaving."
              : "You will lose access to this workspace."}
          </p>
          <button
            type="button"
            onClick={() => setShowLeaveDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-[6px] text-sm font-semibold transition-colors shadow-sm shadow-amber-600/20"
          >
            <LogOut className="w-4 h-4" />
            Leave workspace
          </button>
        </div>

        {/* Delete workspace */}
        {canManageWorkspace && (
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
              Delete workspace
            </p>
            <p className="text-sm text-red-600 dark:text-red-300 mb-4">
              Delete this workspace along with its boards, backlog, and related
              content. This action cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => {
                setDeleteConfirm("");
                setShowDeleteDialog(true);
              }}
              className="px-4 py-2 bg-[#9F2F2D] text-white hover:bg-[#8F2927] rounded-[6px] text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm shadow-[#9F2F2D]/20"
            >
              <Trash2 className="w-4 h-4" />
              Delete workspace
            </button>
          </div>
        )}
      </section>

      {/* Delete dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#202020] rounded-[10px] border border-[#EAEAEA] dark:border-white/[0.06] shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)] flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-[#9F2F2D] dark:text-[#F87171]" />
              </div>
              <h2 className="text-lg font-bold text-[#111111] dark:text-[#E8E8E7]">
                Delete workspace
              </h2>
            </div>
            <p className="text-sm text-[#787774] dark:text-[#9B9A97] mb-4">
              This action will delete workspace{" "}
              <span className="font-semibold text-[#111111] dark:text-[#E8E8E7]">
                {workspace.name}
              </span>{" "}
              and cannot be undone. Enter{" "}
              <span className="font-mono font-semibold">delete</span> to
              confirm.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(event) => setDeleteConfirm(event.target.value)}
              onKeyDown={handleDeleteConfirmKeyDown}
              placeholder="delete"
              className="w-full mb-4 px-4 py-2 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] outline-none focus:border-[#9F2F2D]"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirm("");
                }}
                className="px-4 py-2 text-sm font-medium text-[#111111] dark:text-[#E8E8E7] bg-[#F9F9F8] dark:bg-[#252525] hover:bg-[#F0F0EE] dark:hover:bg-[#2E2E2E] rounded-[6px] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteConfirm !== "delete" || deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-[#9F2F2D] hover:bg-[#8F2927] disabled:bg-[#F5C6C7] disabled:cursor-not-allowed rounded-[6px] transition-colors flex items-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleting ? "Deleting..." : "Confirm delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave dialog */}
      {showLeaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#202020] rounded-[10px] border border-[#EAEAEA] dark:border-white/[0.06] shadow-2xl p-6">
            {canManageWorkspace ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
                    <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h2 className="text-lg font-bold text-[#111111] dark:text-[#E8E8E7]">
                    You are the owner of this workspace
                  </h2>
                </div>
                <p className="text-sm text-[#787774] dark:text-[#9B9A97] mb-6">
                  Do you want to delete workspace{" "}
                  <span className="font-semibold text-[#111111] dark:text-[#E8E8E7]">
                    {workspace.name}
                  </span>{" "}
                  now? This action will delete all data and cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowLeaveDialog(false)}
                    className="px-4 py-2 text-sm font-medium text-[#111111] dark:text-[#E8E8E7] bg-[#F9F9F8] dark:bg-[#252525] hover:bg-[#F0F0EE] dark:hover:bg-[#2E2E2E] rounded-[6px] transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLeaveDialog(false);
                      setDeleteConfirm("");
                      setShowDeleteDialog(true);
                      window.setTimeout(() => {
                        document
                          .querySelector<HTMLInputElement>(
                            'input[placeholder="delete"]',
                          )
                          ?.focus();
                      }, 0);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#9F2F2D] hover:bg-[#8F2927] rounded-[6px] transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Go to delete workspace
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)] flex items-center justify-center flex-shrink-0">
                    <LogOut className="w-5 h-5 text-[#9F2F2D] dark:text-[#F87171]" />
                  </div>
                  <h2 className="text-lg font-bold text-[#111111] dark:text-[#E8E8E7]">
                    Leave workspace
                  </h2>
                </div>
                <p className="text-sm text-[#787774] dark:text-[#9B9A97] mb-4">
                  You will lose access to workspace{" "}
                  <span className="font-semibold text-[#111111] dark:text-[#E8E8E7]">
                    {workspace.name}
                  </span>
                  . Enter <span className="font-mono font-semibold">leave</span>{" "}
                  to confirm.
                </p>
                <input
                  type="text"
                  value={leaveConfirm}
                  onChange={(e) => setLeaveConfirm(e.target.value)}
                  onKeyDown={handleLeaveConfirmKeyDown}
                  placeholder="leave"
                  className="w-full mb-4 px-4 py-2 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] outline-none focus:border-[#9F2F2D]"
                  autoFocus
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLeaveDialog(false);
                      setLeaveConfirm("");
                    }}
                    className="px-4 py-2 text-sm font-medium text-[#111111] dark:text-[#E8E8E7] bg-[#F9F9F8] dark:bg-[#252525] hover:bg-[#F0F0EE] dark:hover:bg-[#2E2E2E] rounded-[6px] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleLeave}
                    disabled={leaveConfirm !== "leave" || leaving}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#9F2F2D] hover:bg-[#8F2927] disabled:bg-[#F5C6C7] disabled:cursor-not-allowed rounded-[6px] transition-colors flex items-center gap-2"
                  >
                    {leaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {leaving ? "Leaving..." : "Confirm leave"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </form>
  );
}

function MemberSettings({
  members,
  loadingMembers,
  memberSubTab,
  setMemberSubTab,
  canManageWorkspace,
  showInviteModal,
  setShowInviteModal,
  workspaceInviteId,
  currentUserId,
  invites,
  loadingInvites,
  cancellingId,
  refreshInvites,
  handleCancelInvite,
  removingMemberId,
  updatingMemberId,
  handleUpdateMemberRole,
  handleRemoveMember,
}: {
  members: WorkspaceMember[];
  loadingMembers: boolean;
  memberSubTab: "list" | "invites";
  setMemberSubTab: (value: "list" | "invites") => void;
  canManageWorkspace: boolean;
  showInviteModal: boolean;
  setShowInviteModal: (value: boolean) => void;
  workspaceInviteId: string;
  currentUserId?: string;
  inviteEmail: string;
  inviteRole: InviteRole;
  inviting: boolean;
  invites: PendingInvite[];
  loadingInvites: boolean;
  cancellingId: string | null;
  setInviteEmail: (value: string) => void;
  setInviteRole: (value: InviteRole) => void;
  handleInvite: (event: FormEvent) => void;
  refreshInvites: () => Promise<void>;
  handleCancelInvite: (inviteId: string) => void;
  memberMenu: { member: WorkspaceMember; x: number; y: number } | null;
  removingMemberId: string | null;
  updatingMemberId: string | null;
  handleOpenMemberMenu: (
    event: MouseEvent<HTMLDivElement>,
    member: WorkspaceMember,
  ) => void;
  handleClickMember: (
    event: MouseEvent<HTMLDivElement>,
    member: WorkspaceMember,
  ) => void;
  handleUpdateMemberRole: (member: WorkspaceMember, role: InviteRole) => void;
  handleRemoveMember: (member: WorkspaceMember) => void;
}) {
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
          className={
            "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors " +
            listTabClass
          }
        >
          List ({members.length})
        </button>
        {canManageWorkspace && (
          <button
            type="button"
            onClick={() => setMemberSubTab("invites")}
            className={
              "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors " +
              invitesTabClass
            }
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
                  const displayName =
                    memberUser?.fullName || memberUser?.email || "User";
                  const memberId = memberUser?._id;
                  const isSelf = memberId === currentUserId;
                  const isBusy =
                    updatingMemberId === memberId ||
                    removingMemberId === memberId;
                  const normalizedRole: InviteRole =
                    member.role === "space_admin"
                      ? "workspace_admin"
                      : (member.role as InviteRole);

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
                          value={normalizedRole}
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
              <Loader2 className="h-4 w-4 animate-spin" /> Loading
              invitations...
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
                          ? "Expires " +
                            new Date(invite.expiresAt).toLocaleDateString(
                              "en-US",
                            )
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
        <InviteModal
          isOpen={showInviteModal}
          onClose={closeInviteModal}
          projectId={workspaceInviteId}
        />
      )}
    </div>
  );
}
