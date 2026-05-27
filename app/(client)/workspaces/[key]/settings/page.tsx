"use client";

import { FormEvent, MouseEvent, use, useEffect, useState } from "react";
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
import {
  inviteService,
  PendingInvite,
} from "@/modules/client/workspaces/services/inviteService";

type WorkspaceStatus = "active" | "archived";
type WorkspaceAccess = "public" | "private";
type InviteRole = "workspace_admin" | "member" | "viewer";

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
  workspace_admin: "Quản trị viên",
  space_admin: "Quản trị viên",
  member: "Thành viên",
  viewer: "Người xem",
};

const ROLE_BADGES: Record<string, string> = {
  workspace_admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  space_admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  member: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  viewer: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const MEMBER_ROLE_OPTIONS: { value: InviteRole; label: string }[] = [
  { value: "workspace_admin", label: "Quản trị viên" },
  { value: "member", label: "Thành viên" },
  { value: "viewer", label: "Người xem" },
];

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

  const workspaceInviteId = workspace?._id ?? workspaceKey;
  const currentMember = members.find((m) => m.userId?._id === user?.id);
  const canManageWorkspace =
    currentMember?.role === "workspace_admin" || user?.role === "super_admin";

  useEffect(() => {
    if (!workspaceKey) return;

    setLoading(true);
    api
      .get(apiRoutes.WORKSPACES.BY_KEY(workspaceKey))
      .then((res) => {
        const nextWorkspace = normalizeWorkspace(res.data);
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
        toast.error("Không thể tải cài đặt workspace.");
      })
      .finally(() => setLoading(false));
  }, [workspaceKey]);

  useEffect(() => {
    if (!workspaceKey) return;
    setLoadingMembers(true);
    api
      .get(apiRoutes.WORKSPACES.MEMBERS(workspaceKey))
      .then((res) => setMembers(res.data?.data ?? res.data ?? []))
      .catch(() => setMembers([]))
      .finally(() => setLoadingMembers(false));
  }, [workspaceKey]);

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
      toast.error("Tên workspace là bắt buộc.");
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

      const res = await api.put(apiRoutes.WORKSPACES.UPDATE(workspaceKey), payload);
      const updatedWorkspace = normalizeWorkspace(res.data);
      setWorkspace(updatedWorkspace);
      setForm({
        name: updatedWorkspace.name || "",
        description: updatedWorkspace.description || "",
        status: updatedWorkspace.status || "active",
        access: updatedWorkspace.access || "public",
      });
      toast.success("Đã lưu cài đặt workspace.");
    } catch (error: any) {
      console.error("Save failed", error);
      toast.error(error?.response?.data?.message || "Không thể lưu cài đặt workspace.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== "delete") {
      toast.error('Nhập "delete" để xác nhận.');
      return;
    }

    setDeleting(true);
    try {
      await api.delete(apiRoutes.WORKSPACES.BY_KEY(workspaceKey));
      toast.success("Đã xóa workspace.");
      setShowDeleteDialog(false);
      router.push("/workspaces");
    } catch (error: any) {
      console.error("Delete failed", error);
      toast.error(error?.response?.data?.message || "Không thể xóa workspace.");
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
      toast.success(`Đã gửi lời mời tới ${email}.`);
      setInviteEmail("");
      const updated = await inviteService.listInvites(workspaceInviteId);
      setInvites(updated);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể gửi lời mời.");
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setCancellingId(inviteId);
    try {
      await inviteService.cancelInvite(workspaceInviteId, inviteId);
      setInvites((prev) => prev.filter((invite) => invite._id !== inviteId));
      toast.success("Đã hủy lời mời.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể hủy lời mời.");
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
      await api.put(apiRoutes.WORKSPACES.UPDATE_MEMBER(workspaceKey, userId), { role });
      setMembers((prev) =>
        prev.map((item) =>
          item.userId?._id === userId ? { ...item, role } : item,
        ),
      );
      setMemberMenu(null);
      toast.success("Đã cập nhật quyền thành viên.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể cập nhật quyền thành viên.");
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = async (member: WorkspaceMember) => {
    const userId = member.userId?._id;
    if (!userId) return;

    setRemovingMemberId(userId);
    try {
      await api.delete(apiRoutes.WORKSPACES.REMOVE_MEMBER(workspaceKey, userId));
      setMembers((prev) => prev.filter((item) => item.userId?._id !== userId));
      setMemberMenu(null);
      toast.success("Đã xóa thành viên khỏi workspace.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể xóa thành viên.");
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleLeave = async () => {
    if (leaveConfirm !== "leave") {
      toast.error('Nhập "leave" để xác nhận.');
      return;
    }

    setLeaving(true);
    try {
      await api.delete(apiRoutes.WORKSPACES.LEAVE(workspaceKey));
      toast.success("Đã rời khỏi workspace.");
      router.push("/workspaces");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể rời khỏi workspace.");
    } finally {
      setLeaving(false);
      setShowLeaveDialog(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!workspace) {
    return (
      <div className="p-10 text-center text-gray-500 dark:text-gray-400">
        Không tìm thấy workspace.
      </div>
    );
  }

  return (
    <div className="workspace-surface max-w-[min(100%,64rem)] pb-12">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/workspaces/${workspaceKey}`}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cài đặt workspace
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {workspace.name}
            <span className="text-gray-400 dark:text-gray-500 mx-1">-</span>
            {workspace.key}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col md:flex-row min-h-[max(500px,var(--app-board-h))]">
        <div className="w-full md:w-[var(--workspace-settings-nav-w)] bg-gray-50 dark:bg-gray-800 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 p-[var(--workspace-surface-pad)]">
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "general"
                  ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Settings className="w-4 h-4" /> Tổng quan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "members"
                  ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Users className="w-4 h-4" /> Thành viên
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
}) {
  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-[min(100%,42rem)]">
      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Thông tin cơ bản
        </h2>
        {!canManageWorkspace && (
          <p className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-300">
            Bạn có thể xem thông tin workspace. Chỉ quản trị viên mới có quyền chỉnh sửa.
          </p>
        )}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Tên workspace
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              disabled={!canManageWorkspace}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Mô tả
            </label>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              disabled={!canManageWorkspace}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Mã workspace
            </label>
            <input
              type="text"
              value={workspace.key}
              disabled
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 font-mono cursor-not-allowed"
            />
          </div>
        </div>
      </section>

      <hr className="border-gray-100 dark:border-gray-800" />

      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Quyền truy cập
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { value: "public", label: "Công khai", icon: Globe },
            { value: "private", label: "Riêng tư", icon: Lock },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                form.access === option.value
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
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
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex items-center gap-2">
                <option.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {option.label}
                </span>
              </div>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Trạng thái
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { value: "active", label: "Đang hoạt động" },
            { value: "archived", label: "Đã lưu trữ" },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                form.status === option.value
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
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
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
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
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Lưu thay đổi
            </>
          )}
        </button>
      </div>
      )}

      <section className="mt-12 p-5 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 rounded-lg space-y-6">
        <h3 className="text-red-800 dark:text-red-200 font-bold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" /> Vùng nguy hiểm
        </h3>

        {/* Leave workspace */}
        <div className="pb-6 border-b border-red-200 dark:border-red-800">
          <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
            Rời khỏi workspace
          </p>
          <p className="text-sm text-red-600 dark:text-red-300 mb-3">
            {canManageWorkspace
              ? "Bạn là owner của workspace. Bạn phải xóa workspace trước khi rời."
              : "Bạn sẽ mất quyền truy cập vào workspace này."}
          </p>
          <button
            type="button"
            onClick={() => setShowLeaveDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-lg text-sm font-semibold transition-colors shadow-sm shadow-amber-600/20"
          >
            <LogOut className="w-4 h-4" />
            Rời workspace
          </button>
        </div>

        {/* Delete workspace */}
        {canManageWorkspace && (
        <div>
          <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
            Xóa workspace
          </p>
          <p className="text-sm text-red-600 dark:text-red-300 mb-4">
            Xóa workspace này cùng các board, backlog và nội dung liên quan. Hành động nay không thể hoàn tác.
          </p>
          <button
            type="button"
            onClick={() => {
              setDeleteConfirm("");
              setShowDeleteDialog(true);
            }}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm shadow-red-600/20"
          >
            <Trash2 className="w-4 h-4" />
            Xóa workspace
          </button>
        </div>
        )}
      </section>

      {/* Delete dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Xóa workspace
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Hành động nay sẽ xóa workspace <span className="font-semibold text-gray-900 dark:text-white">{workspace.name}</span> và không thể hoàn tác. Nhập <span className="font-mono font-semibold">delete</span> để xác nhận.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(event) => setDeleteConfirm(event.target.value)}
              placeholder="delete"
              className="w-full mb-4 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirm("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteConfirm !== "delete" || deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleting ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave dialog */}
      {showLeaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6">
            {canManageWorkspace ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                    <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Bạn là owner của workspace này
                  </h2>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Bạn có muốn xóa workspace <span className="font-semibold text-gray-900 dark:text-white">{workspace.name}</span> hiện tại không? Hành động này sẽ xóa toàn bộ dữ liệu và không thể hoàn tác.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowLeaveDialog(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLeaveDialog(false);
                      setDeleteConfirm("");
                      document.querySelector<HTMLInputElement>('input[placeholder="delete"]')?.focus();
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Đi tới xóa workspace
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                    <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Rời khỏi workspace
                  </h2>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Bạn sẽ mất quyền truy cập vào workspace <span className="font-semibold text-gray-900 dark:text-white">{workspace.name}</span>. Nhập <span className="font-mono font-semibold">leave</span> để xác nhận.
                </p>
                <input
                  type="text"
                  value={leaveConfirm}
                  onChange={(e) => setLeaveConfirm(e.target.value)}
                  placeholder="leave"
                  className="w-full mb-4 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  autoFocus
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowLeaveDialog(false); setLeaveConfirm(""); }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleLeave}
                    disabled={leaveConfirm !== "leave" || leaving}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                  >
                    {leaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {leaving ? "Đang rời..." : "Xác nhận rời"}
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

  const listTabClass = memberSubTab === "list"
    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white";
  const invitesTabClass = memberSubTab === "invites"
    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" /> Thành viên
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý quyền truy cập và các lời mời đang chờ trong workspace.
          </p>
        </div>
        {canManageWorkspace && (
        <button
          type="button"
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition-colors hover:bg-indigo-700"
        >
          <UserPlus className="h-4 w-4" />
          Mời thành viên
        </button>
        )}
      </div>

      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
        <button
          type="button"
          onClick={() => setMemberSubTab("list")}
          className={"rounded-md px-3 py-1.5 text-sm font-semibold transition-colors " + listTabClass}
        >
          Danh sách ({members.length})
        </button>
        {canManageWorkspace && (
        <button
          type="button"
          onClick={() => setMemberSubTab("invites")}
          className={"rounded-md px-3 py-1.5 text-sm font-semibold transition-colors " + invitesTabClass}
        >
          Lời mời ({invites.length})
        </button>
        )}
      </div>

      {memberSubTab === "list" || !canManageWorkspace ? (
        <section>
          {loadingMembers ? (
            <div className="flex items-center gap-2 py-8 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Dang tai thanh vien...
            </div>
          ) : members.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Chưa có thành viên nào trong workspace này.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {members.map((member) => {
                  const memberUser = member.userId;
                  const displayName = memberUser?.fullName || memberUser?.email || "Người dùng";
                  const roleLabel = ROLE_LABELS[member.role] ?? member.role;
                  const badgeClass = ROLE_BADGES[member.role] ?? ROLE_BADGES.member;
                  const memberId = memberUser?._id;
                  const isSelf = memberId === currentUserId;
                  const isBusy = updatingMemberId === memberId || removingMemberId === memberId;

                  return (
                    <div
                      key={memberId ?? displayName + "-" + member.role}
                      className="flex flex-col gap-3 bg-white p-4 dark:bg-gray-900 sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {memberUser?.avatar ? (
                          <img
                            src={memberUser.avatar}
                            alt={displayName}
                            className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                            {getMemberInitials(member)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {displayName}
                            </p>
                            {isSelf && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                Bạn
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {memberUser?.email || "Chưa có email"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:w-60 sm:flex-row sm:items-center sm:justify-end">
                        
                        <select
                          value={member.role === "space_admin" ? "workspace_admin" : member.role}
                          onChange={(event) => handleUpdateMemberRole(member, event.target.value as InviteRole)}
                          disabled={!canManageWorkspace || isSelf || isBusy}
                          className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        >
                          {MEMBER_ROLE_OPTIONS.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member)}
                          disabled={!canManageWorkspace || isSelf || isBusy}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-900/20"
                        >
                          {removingMemberId === memberId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Kick
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
            <div className="flex items-center gap-2 py-8 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải lời mời...
            </div>
          ) : invites.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Không có lời mời nào đang chờ.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3 w-36">Vai trò</th>
                    <th className="px-4 py-3 w-40">Trạng thái</th>
                    <th className="px-4 py-3 w-24 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {invites.map((invite) => (
                    <tr key={invite._id} className="bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/60">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {invite.invitedEmail}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                          {ROLE_LABELS[invite.role] ?? invite.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {invite.expiresAt
                          ? "Hết hạn " + new Date(invite.expiresAt).toLocaleDateString("vi-VN")
                          : "Đang chờ, không hết hạn"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleCancelInvite(invite._id)}
                          disabled={cancellingId === invite._id}
                          className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-900/20"
                        >
                          {cancellingId === invite._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          Hủy
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

