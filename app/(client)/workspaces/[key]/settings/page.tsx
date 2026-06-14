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
  Loader2,
  Settings,
  ShieldAlert,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/modules/shared/components/common/components/LoadingSpinner";
import { inviteService, PendingInvite } from "@/modules/client/workspaces/services/inviteService";
import { resolveWorkspaceFromRouteKey } from "@/modules/client/workspaces/services/resolveWorkspace";

import GeneralSettings from "@/modules/client/workspaces/settings/components/GeneralSettings";
import MemberSettings from "@/modules/client/workspaces/settings/components/MemberSettings";
import {
  WorkspaceDeleteDialog,
  LeaveWorkspaceDialog,
} from "@/modules/client/workspaces/settings/components/Dialogs";

type WorkspaceStatus = "active" | "archived";
type WorkspaceAccess = "public" | "private";
type InviteRole = "admin" | "member" | "viewer";

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

const normalizeWorkspace = (payload: any): WorkspaceSettings =>
  (payload?.data ?? payload) as WorkspaceSettings;

const normalizeObjectId = (value?: string | null) => {
  if (!value) return "";
  const trimmed = value.trim();
  const objectIdMatch = trimmed.match(/^ObjectId\(['"]?([a-f0-9]{24})['"]?\)$/i);
  return objectIdMatch?.[1] ?? trimmed;
};

const getMemberUserId = (member: WorkspaceMember) => {
  const value = member.userId?._id;
  if (!value) return "";
  return normalizeObjectId(String(value));
};

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

  const [form, setForm] = useState<WorkspaceSettingsForm>({
    name: "",
    description: "",
    status: "active",
    access: "public",
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [memberMenu, setMemberMenu] = useState<{
    member: WorkspaceMember;
    x: number;
    y: number;
  } | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState("");
  const [leaving, setLeaving] = useState(false);

  const workspaceInviteId = workspace?._id ?? "";
  const workspaceApiId = workspace?._id ?? "";
  const currentUserId = normalizeObjectId(user?.id);
  const currentMember = members.find((m) => getMemberUserId(m) === currentUserId);
  const canManageWorkspace =
    currentMember?.role === "workspace_admin" ||
    currentMember?.role === "space_admin" ||
    user?.role === "super_admin";

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
      toast.error(error?.response?.data?.message || "Could not save workspace settings.");
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
      toast.error(error?.response?.data?.message || "Could not delete workspace.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setCancellingId(inviteId);
    try {
      await inviteService.cancelInvite(workspaceInviteId, inviteId);
      setInvites((prev) => prev.filter((invite) => invite._id !== inviteId));
      toast.success("Invitation canceled.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not cancel invitation.");
    } finally {
      setCancellingId(null);
    }
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
      await api.put(apiRoutes.WORKSPACES.UPDATE_MEMBER(workspaceApiId, userId), { role });
      setMembers((prev) =>
        prev.map((item) =>
          item.userId?._id === userId ? { ...item, role } : item,
        ),
      );
      setMemberMenu(null);
      toast.success("Member permissions updated.");
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
      if (!workspaceApiId) throw new Error("Missing workspace id");
      await api.delete(apiRoutes.WORKSPACES.REMOVE_MEMBER(workspaceApiId, userId));
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
      toast.error(error?.response?.data?.message || "Could not leave workspace.");
    } finally {
      setLeaving(false);
      setShowLeaveDialog(false);
    }
  };

  const handleDeleteConfirmKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !deleting) {
      event.preventDefault();
      void handleDelete();
    }
  };

  const handleLeaveConfirmKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !leaving) {
      event.preventDefault();
      void handleLeave();
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!workspace) {
    return (
      <div className="p-10 text-center text-[#787774] dark:text-[#9B9A97]">
        Workspace not found.
      </div>
    );
  }

  if (loadingMembers) return <LoadingSpinner />;

  if (!canManageWorkspace) {
    return (
      <div className="workspace-surface flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-[8px] border border-[#EAEAEA] bg-white p-6 dark:border-white/[0.06] dark:bg-[#202020]">
          <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-[#ABABAB] dark:text-[#6B6B6B]" />
          <h1 className="text-base font-semibold text-[#111111] dark:text-[#E8E8E7]">
            Workspace settings are restricted
          </h1>
          <p className="mt-1 text-sm text-[#787774] dark:text-[#9B9A97]">
            Only workspace admins can view or change settings.
          </p>
          <Link
            href={`/workspaces/${workspaceKey}`}
            className="mt-4 inline-flex items-center gap-2 rounded-[6px] bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to workspace
          </Link>
        </div>
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
              canManageWorkspace={canManageWorkspace}
              setForm={setForm}
              handleSave={handleSave}
              setShowDeleteDialog={setShowDeleteDialog}
              setShowLeaveDialog={setShowLeaveDialog}
            />
          ) : (
            <MemberSettings
              members={members}
              loadingMembers={loadingMembers}
              canManageWorkspace={canManageWorkspace}
              workspaceInviteId={workspaceInviteId}
              currentUserId={currentUserId}
            />
          )}
        </div>
      </div>

      {showDeleteDialog && (
        <WorkspaceDeleteDialog
          workspaceName={workspace.name}
          deleting={deleting}
          onDelete={handleDelete}
          onCancel={() => {
            setShowDeleteDialog(false);
            setDeleteConfirm("");
          }}
        />
      )}

      {showLeaveDialog && (
        <LeaveWorkspaceDialog
          workspaceName={workspace.name}
          isOwner={canManageWorkspace}
          leaving={leaving}
          onLeave={handleLeave}
          onCancel={() => {
            setShowLeaveDialog(false);
            setLeaveConfirm("");
          }}
          onGoToDelete={() => {
            setShowLeaveDialog(false);
            setDeleteConfirm("");
            setShowDeleteDialog(true);
          }}
        />
      )}
    </div>
  );
}
