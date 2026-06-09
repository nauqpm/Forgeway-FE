import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Repeat,
  Columns,
  Lock,
  Globe,
  Settings,
  Plus,
} from "lucide-react";
import { getWorkspaceTemplate, Workspace } from "../../types/workspace.type";
import InviteModal from "@/modules/admin/components/common/components/InviteModal";

interface HeaderProps {
  workspace: Workspace;
  workspaceId: string;
  setShowCreateIssue: (value: boolean) => void;
  canCreateTask?: boolean;
  canUpdateWorkspace?: boolean;
}

const Header = ({
  workspace,
  workspaceId,
  setShowCreateIssue,
  canCreateTask = false,
  canUpdateWorkspace = false,
}: HeaderProps) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const template = getWorkspaceTemplate(workspace);

  return (
    <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <Link
          href="/workspaces"
          className="shrink-0 p-2 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[6px] transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-[#787774] dark:text-[#9B9A97] rotate-180" />
        </Link>
        <div
          className={`hidden h-14 w-14 shrink-0 rounded-[10px] sm:flex items-center justify-center ${
            template === "scrum"
              ? "bg-[#2563EB] dark:bg-[#3B82F6]"
              : "bg-[#2563EB] dark:bg-[#3B82F6]"
          }`}
        >
          {template === "scrum" ? (
            <Repeat className="w-7 h-7 text-white" />
          ) : (
            <Columns className="w-7 h-7 text-white" />
          )}
        </div>
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
    </div>
  );
};

export default Header;
