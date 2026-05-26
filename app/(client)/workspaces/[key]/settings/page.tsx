"use client";

import { FormEvent, MouseEvent, use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Globe,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Save,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import { useAuth } from "@/context/AuthContext";
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

  const [form, setForm] = useState<WorkspaceSettingsForm>({
    name: "",
    description: "",
    status: "active",
    access: "public",
  });
  const [deleteConfirm, setDeleteConfirm] = useState("");

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
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState("");
  const [leaving, setLeaving] = useState(false);

  const workspaceInviteId = workspace?._id ?? workspaceKey;

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
    setLoadingInvites(true);
    inviteService
      .listInvites(workspaceInviteId)
      .then(setInvites)
      .catch(() => toast.error("Không thể tải danh sách lời mời đang chờ."))
      .finally(() => setLoadingInvites(false));
  }, [activeTab, workspaceInviteId]);

  useEffect(() => {
    const closeMenu = () => setMemberMenu(null);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMemberMenu(null);
    };

    document.addEventListener("click", closeMenu);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("click", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

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

  const currentMember = members.find((m) => m.userId?._id === user?.id);
  const isOwner = currentMember?.role === "workspace_admin" || user?.role === "super_admin";

  const handleLeave = async () => {
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
              setForm={setForm}
              setDeleteConfirm={setDeleteConfirm}
              handleSave={handleSave}
              handleDelete={handleDelete}
              isOwner={isOwner}
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
              inviteEmail={inviteEmail}
              inviteRole={inviteRole}
              inviting={inviting}
              invites={invites}
              loadingInvites={loadingInvites}
              cancellingId={cancellingId}
              setInviteEmail={setInviteEmail}
              setInviteRole={setInviteRole}
              handleInvite={handleInvite}
              handleCancelInvite={handleCancelInvite}
              memberMenu={memberMenu}
              removingMemberId={removingMemberId}
              updatingMemberId={updatingMemberId}
              handleOpenMemberMenu={handleOpenMemberMenu}
              handleClickMember={handleClickMember}
              handleUpdateMemberRole={handleUpdateMemberRole}
              handleRemoveMember={handleRemoveMember}
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
  setForm,
  setDeleteConfirm,
  handleSave,
  handleDelete,
  isOwner,
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
  setForm: (form: WorkspaceSettingsForm) => void;
  setDeleteConfirm: (value: string) => void;
  handleSave: (event: FormEvent) => void;
  handleDelete: () => void;
  isOwner: boolean;
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
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Tên workspace
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
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
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </section>

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
            {isOwner
              ? "Bạn là owner của workspace. Bạn phải xóa workspace trước khi rời."
              : "Bạn sẽ mất quyền truy cập vào workspace này."}
          </p>
          <button
            type="button"
            onClick={() => setShowLeaveDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 rounded-lg text-sm font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Rời workspace
          </button>
        </div>

        {/* Delete workspace */}
        <div>
          <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
            Xóa workspace
          </p>
          <p className="text-sm text-red-600 dark:text-red-300 mb-4">
            Xóa workspace này cùng các board, backlog và nội dung liên quan. Hành
            động này không thể hoàn tác.
          </p>
          <label className="block text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            Nhập <span className="font-mono">delete</span> để xác nhận
          </label>
          <input
            type="text"
            value={deleteConfirm}
            onChange={(event) => setDeleteConfirm(event.target.value)}
            className="w-full mb-4 px-4 py-2 border border-red-200 dark:border-red-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="delete"
          />
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteConfirm !== "delete" || deleting}
            className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {deleting ? "Đang xóa..." : "Xóa workspace"}
          </button>
        </div>
      </section>

      {/* Leave dialog */}
      {showLeaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6">
            {isOwner ? (
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
  inviteEmail,
  inviteRole,
  inviting,
  invites,
  loadingInvites,
  cancellingId,
  setInviteEmail,
  setInviteRole,
  handleInvite,
  handleCancelInvite,
  memberMenu,
  removingMemberId,
  updatingMemberId,
  handleOpenMemberMenu,
  handleClickMember,
  handleUpdateMemberRole,
  handleRemoveMember,
}: {
  members: WorkspaceMember[];
  loadingMembers: boolean;
  inviteEmail: string;
  inviteRole: InviteRole;
  inviting: boolean;
  invites: PendingInvite[];
  loadingInvites: boolean;
  cancellingId: string | null;
  setInviteEmail: (value: string) => void;
  setInviteRole: (value: InviteRole) => void;
  handleInvite: (event: FormEvent) => void;
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
  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" /> Thành viên hiện tại
          </h2>
          {!loadingMembers && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {members.length} thành viên
            </span>
          )}
        </div>

        {loadingMembers ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải thành viên...
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-5 text-sm text-gray-500 dark:text-gray-400 text-center">
            Chưa có thành viên nào trong workspace này.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {members.map((member) => {
              const user = member.userId;
              const displayName = user?.fullName || user?.email || "Người dùng";
              const roleLabel = ROLE_LABELS[member.role] ?? member.role;
              const badgeClass = ROLE_BADGES[member.role] ?? ROLE_BADGES.member;

              return (
                <div
                  key={user?._id ?? `${displayName}-${member.role}`}
                  onClick={(event) => handleClickMember(event, member)}
                  onContextMenu={(event) => handleOpenMemberMenu(event, member)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/70"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={displayName}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <span className="w-10 h-10 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {getMemberInitials(member)}
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email || "Chưa có email"}
                    </p>
                  </div>

                  <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${badgeClass}`}>
                    {roleLabel}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {memberMenu && (
          <div
            className="fixed z-50 w-52 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-1 shadow-xl"
            style={{ left: memberMenu.x, top: memberMenu.y }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-gray-100 dark:border-gray-800 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Cấp quyền
              </p>
            </div>
            {MEMBER_ROLE_OPTIONS.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => handleUpdateMemberRole(memberMenu.member, role.value)}
                disabled={updatingMemberId === memberMenu.member.userId?._id}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 ${
                  memberMenu.member.role === role.value
                    ? "text-indigo-600 dark:text-indigo-300 font-semibold"
                    : "text-gray-700 dark:text-gray-200"
                }`}
              >
                {updatingMemberId === memberMenu.member.userId?._id ? (
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
              onClick={() => handleRemoveMember(memberMenu.member)}
              disabled={removingMemberId === memberMenu.member.userId?._id}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
            >
              {removingMemberId === memberMenu.member.userId?._id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Xóa khỏi workspace
            </button>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-indigo-600" /> Mời thành viên
        </h2>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            placeholder="email@example.com"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
          <select
            value={inviteRole}
            onChange={(event) => setInviteRole(event.target.value as InviteRole)}
            className="px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option value="workspace_admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="submit"
            disabled={inviting}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {inviting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {inviting ? "Đang gửi..." : "Gửi lời mời"}
          </button>
        </form>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Lời mời đang chờ
        </h3>

        {loadingInvites ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
          </div>
        ) : invites.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-4">
            Không có lời mời nào đang chờ.
          </p>
        ) : (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 w-28">Vai trò</th>
                  <th className="px-4 py-3 w-36">Hết hạn</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {invites.map((invite) => (
                  <tr
                    key={invite._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                      {invite.invitedEmail}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-semibold">
                        {ROLE_LABELS[invite.role] ?? invite.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {invite.expiresAt
                        ? new Date(invite.expiresAt).toLocaleDateString("vi-VN")
                        : "Không hết hạn"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleCancelInvite(invite._id)}
                        disabled={cancellingId === invite._id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                        title="Hủy lời mời"
                      >
                        {cancellingId === invite._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
