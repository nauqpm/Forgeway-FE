"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Settings, ShieldAlert, Users } from "lucide-react";

import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import LoadingSpinner from "@/modules/admin-shared/components/common/components/LoadingSpinner";

import { useWorkspaceSettingsPage } from "@/modules/workspace/settings/hooks/useWorkspaceSettingsPage";
import GeneralSettings from "@/modules/workspace/settings/components/GeneralSettings";
import MemberSettings from "@/modules/workspace/settings/components/MemberSettings";

export default function WorkspaceSettingsPage({ params }: { params: Promise<{ key: string }> }) {
  usePageTitle("Workspace Settings");
  const { key: workspaceKey } = use(params);
  const { user } = useAuth();

  const page = useWorkspaceSettingsPage(workspaceKey, user);

  if (page.loading) return <LoadingSpinner />;
  if (!page.workspace) {
    return <div className="p-10 text-center text-[#787774] dark:text-[#9B9A97]">Workspace not found.</div>;
  }
  if (page.loadingMembers) return <LoadingSpinner />;

  if (!page.canManageWorkspace) {
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
    <div className="flex-1 overflow-y-auto p-[var(--workspace-surface-pad)]">
      <div className="workspace-surface max-w-[min(100%,64rem)] pb-12">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/workspaces/${workspaceKey}`}
            className="p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[6px] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#787774] dark:text-[#9B9A97]" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#111111] dark:text-[#E8E8E7]">Workspace settings</h1>
            <p className="text-[#787774] dark:text-[#9B9A97] text-sm mt-0.5">
              {page.workspace.name}
              <span className="text-[#ABABAB] dark:text-[#6B6B6B] mx-1">-</span>
              {page.workspace.key}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] overflow-hidden flex flex-col md:flex-row min-h-[max(500px,var(--app-board-h))]">
          <div className="w-full md:w-[var(--workspace-settings-nav-w)] bg-[#F9F9F8] dark:bg-[#252525] border-b md:border-b-0 md:border-r border-[#EAEAEA] dark:border-white/[0.06] p-[var(--workspace-surface-pad)]">
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => page.setActiveTab("general")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  page.activeTab === "general"
                    ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6]"
                    : "text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
                }`}
              >
                <Settings className="w-4 h-4" /> Overview
              </button>
              <button
                type="button"
                onClick={() => page.setActiveTab("members")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  page.activeTab === "members"
                    ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6]"
                    : "text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
                }`}
              >
                <Users className="w-4 h-4" /> Member
              </button>
            </nav>
          </div>

          <div className="flex-1 p-[var(--workspace-surface-pad)] md:p-[clamp(24px,2vw,32px)]">
            {page.activeTab === "general" ? (
              <GeneralSettings
                form={page.form}
                workspace={page.workspace}
                saving={page.saving}
                canManageWorkspace={page.canManageWorkspace}
                setForm={page.setForm}
                handleSave={page.handleSave}
                showDeleteDialog={page.showDeleteDialog}
                setShowDeleteDialog={page.setShowDeleteDialog}
                deleteConfirm={page.deleteConfirm}
                setDeleteConfirm={page.setDeleteConfirm}
                deleting={page.deleting}
                handleDelete={page.handleDelete}
                showLeaveDialog={page.showLeaveDialog}
                setShowLeaveDialog={page.setShowLeaveDialog}
                leaveConfirm={page.leaveConfirm}
                setLeaveConfirm={page.setLeaveConfirm}
                leaving={page.leaving}
                handleLeave={page.handleLeave}
                handleDeleteConfirmKeyDown={page.handleDeleteConfirmKeyDown}
                handleLeaveConfirmKeyDown={page.handleLeaveConfirmKeyDown}
              />
            ) : (
              <MemberSettings
                members={page.members}
                loadingMembers={page.loadingMembers}
                canManageWorkspace={page.canManageWorkspace}
                workspaceInviteId={page.workspace._id}
                currentUserId={page.currentUserId}
                memberSubTab={page.memberSubTab}
                showInviteModal={page.showInviteModal}
                invites={page.invites}
                loadingInvites={page.loadingInvites}
                cancellingId={page.cancellingId}
                removingMemberId={page.removingMemberId}
                updatingMemberId={page.updatingMemberId}
                setMemberSubTab={page.setMemberSubTab}
                setShowInviteModal={page.setShowInviteModal}
                refreshInvites={page.refreshInvites}
                handleCancelInvite={page.handleCancelInvite}
                handleUpdateMemberRole={page.handleUpdateMemberRole}
                handleRemoveMember={page.handleRemoveMember}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
