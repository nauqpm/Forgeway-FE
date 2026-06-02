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
          className="shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-gray-500 dark:text-gray-400 rotate-180" />
        </Link>
        <div
          className={`hidden h-14 w-14 shrink-0 rounded-2xl sm:flex items-center justify-center shadow-inner ${template === "scrum" ? "bg-gradient-to-br from-blue-500 to-indigo-600" : "bg-gradient-to-br from-emerald-500 to-teal-600"}`}
        >
          {template === "scrum" ? (
            <Repeat className="w-7 h-7 text-white" />
          ) : (
            <Columns className="w-7 h-7 text-white" />
          )}
        </div>
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs font-mono font-bold">
              {workspace.key}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                workspace.visibility === "private"
                  ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500"
                  : "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-500"
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
          <h1 className="flex min-w-0 flex-wrap items-center gap-3 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
            <span className="min-w-0 break-words">{workspace.name}</span>
            <Link
              href={`/workspaces/${workspaceId}/settings`}
              className="shrink-0 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </h1>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        {canUpdateWorkspace && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors shadow-sm"
          >
            Invite members
          </button>
        )}
        {canCreateTask && (
          <button
            onClick={() => setShowCreateIssue(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors shadow-sm"
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
