import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Lock,
  Globe,
  Settings,
  Plus,
  Camera,
  X,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import { Workspace } from "@/modules/workspace/shared/types/workspace.type";
import InviteModal from "@/modules/admin-shared/components/common/components/InviteModal";
import { workspaceService } from "@/modules/workspace/shared/services/workspaceService";
import type { WorkspaceSampleAvatar } from "@/modules/workspace/shared/utils/workspaceAvatar";
import WorkspaceAvatar from "./WorkspaceAvatar";
import WorkspaceAvatarPicker from "./WorkspaceAvatarPicker";
import { useChatChannels } from "@/modules/client/chat/hooks/useChatQueries";

interface HeaderProps {
  workspace: Workspace;
  workspaceId: string;
  setShowCreateIssue: (value: boolean) => void;
  canCreateTask?: boolean;
  canUpdateWorkspace?: boolean;
  onWorkspaceUpdated?: (workspace: Workspace) => void;
}

const Header = ({
  workspace,
  workspaceId,
  setShowCreateIssue,
  canCreateTask = false,
  canUpdateWorkspace = false,
  onWorkspaceUpdated,
}: HeaderProps) => {
  const { data: channels = [] } = useChatChannels();

  const workspaceUnreadCount = React.useMemo(() => {
    const wsId = workspace._id || workspaceId;
    const ch = channels.find(
      (c) => c.type === "workspace" && String(c.workspaceId) === String(wsId)
    );
    return ch ? ch.unreadCount || 0 : 0;
  }, [channels, workspace._id, workspaceId]);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [avatarSamples, setAvatarSamples] = useState<WorkspaceSampleAvatar[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(workspace.avatar);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const openAvatarPicker = async () => {
    if (!canUpdateWorkspace) return;
    setSelectedAvatar(workspace.avatar);
    setIsAvatarPickerOpen(true);
    if (avatarSamples.length > 0) return;

    setLoadingAvatars(true);
    try {
      const samples = await workspaceService.listAvatarSamples();
      setAvatarSamples(samples);
      setSelectedAvatar(workspace.avatar || samples[0]?.url);
    } catch {
      toast.error("Unable to load workspace avatars.");
    } finally {
      setLoadingAvatars(false);
    }
  };

  const handleSaveAvatar = async () => {
    if (!selectedAvatar) return;
    setSavingAvatar(true);
    try {
      const updatedWorkspace = await workspaceService.updateWorkspace(workspace._id, {
        avatar: selectedAvatar,
      });
      onWorkspaceUpdated?.({ ...workspace, ...updatedWorkspace });
      setIsAvatarPickerOpen(false);
      toast.success("Workspace avatar updated.");
    } catch {
      toast.error("Unable to update workspace avatar.");
    } finally {
      setSavingAvatar(false);
    }
  };

  return (
    <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <Link
          href="/workspaces"
          className="shrink-0 p-2 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[6px] transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-[#787774] dark:text-[#9B9A97] rotate-180" />
        </Link>
        {canUpdateWorkspace ? (
          <button
            type="button"
            onClick={openAvatarPicker}
            className="group relative hidden shrink-0 rounded-[10px] sm:inline-flex"
          >
            <WorkspaceAvatar workspace={workspace} size="xl" />
            <span className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-5 w-5 text-white" />
            </span>
          </button>
        ) : (
          <WorkspaceAvatar workspace={workspace} size="xl" className="hidden sm:inline-flex" />
        )}
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 bg-[#F7F6F3] dark:bg-[#252525] text-[#787774] dark:text-[#9B9A97] rounded-[4px] text-[0.6875rem] font-mono font-bold">
              {workspace.key}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[0.625rem] font-medium ${
                workspace.visibility === "private"
                  ? "bg-[#FBF3DB] dark:bg-[rgba(149,100,0,0.12)] text-[#956400] dark:text-[#F59E0B]"
                  : "bg-[#EDF3EC] dark:bg-[rgba(52,101,56,0.12)] text-[#346538] dark:text-[#4ADE80]"
              }`}
            >
              {workspace.visibility === "private" ? (
                <>
                  <Lock className="w-3 h-3" /> Private
                </>
              ) : (
                <>
                  <Globe className="w-3 h-3" /> Public
                </>
              )}
            </span>
          </div>
          <h1 className="flex min-w-0 flex-wrap items-center gap-3 text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
            <span className="min-w-0 break-words">{workspace.name}</span>
            {canUpdateWorkspace && (
              <Link
                href={`/workspaces/${workspaceId}/settings`}
                className="shrink-0 p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[6px] transition-colors text-[#ABABAB] hover:text-[#787774] dark:hover:text-[#9B9A97]"
              >
                <Settings className="w-5 h-5" />
              </Link>
            )}
          </h1>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        <Link
          href={`/chat?workspaceId=${workspace._id}`}
          className="inline-flex items-center gap-2 bg-white dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] text-[#111111] dark:text-[#E8E8E7] px-4 py-2 rounded-[6px] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] font-medium text-[0.8125rem] transition-colors shadow-sm"
        >
          <MessageSquare className="w-4 h-4 text-[#787774] dark:text-[#9B9A97]" />
          <span>Chat</span>
          {workspaceUnreadCount > 0 && (
            <span className="flex items-center justify-center min-w-[16px] h-4 px-1 bg-[#EF4444] text-white text-[9px] font-bold rounded-full leading-none shrink-0">
              {workspaceUnreadCount > 99 ? "99+" : workspaceUnreadCount}
            </span>
          )}
        </Link>
        {canUpdateWorkspace && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-2 bg-white dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] text-[#111111] dark:text-[#E8E8E7] px-4 py-2 rounded-[6px] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] font-medium text-[0.8125rem] transition-colors"
          >
            Invite members
          </button>
        )}
        {canCreateTask && (
          <button
            onClick={() => setShowCreateIssue(true)}
            className="inline-flex items-center gap-2 bg-[#2563EB] dark:bg-[#3B82F6] text-white px-4 py-2 rounded-[6px] hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] font-medium text-[0.8125rem] transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Task
          </button>
        )}
      </div>

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        projectId={workspace._id ?? workspaceId}
      />

      {isAvatarPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[10px] border border-[#EAEAEA] bg-white p-5 shadow-2xl dark:border-white/[0.08] dark:bg-[#202020]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <WorkspaceAvatar workspace={{ ...workspace, avatar: selectedAvatar }} size="lg" />
                <h2 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
                  Workspace avatar
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarPickerOpen(false)}
                className="rounded-[6px] p-1.5 text-[#787774] transition-colors hover:bg-[#F7F6F3] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:bg-[#2E2E2E] dark:hover:text-[#E8E8E7]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <WorkspaceAvatarPicker
              avatars={avatarSamples}
              selectedAvatar={selectedAvatar}
              isLoading={loadingAvatars}
              onSelect={setSelectedAvatar}
            />
            <div className="mt-5 flex justify-end gap-3 border-t border-[#EAEAEA] pt-4 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setIsAvatarPickerOpen(false)}
                className="rounded-[6px] border border-[#EAEAEA] px-4 py-2 text-sm font-medium text-[#111111] transition-colors hover:bg-[#F7F6F3] dark:border-white/[0.08] dark:text-[#E8E8E7] dark:hover:bg-[#2E2E2E]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAvatar}
                disabled={!selectedAvatar || savingAvatar}
                className="rounded-[6px] bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-50 dark:bg-[#3B82F6] dark:hover:bg-[#2563EB]"
              >
                {savingAvatar ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
