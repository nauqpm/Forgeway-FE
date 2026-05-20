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
import { Workspace } from "../../types/workspace.type";
import InviteModal from "@/modules/admin/components/common/components/InviteModal";

interface HeaderProps {
  workspace: Workspace;
  workspaceId: string;
  setShowCreateIssue: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header = ({ workspace, workspaceId, setShowCreateIssue }: HeaderProps) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Link
          href="/workspaces"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-gray-500 dark:text-gray-400 rotate-180" />
        </Link>
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${workspace.template === "scrum" ? "bg-gradient-to-br from-blue-500 to-indigo-600" : "bg-gradient-to-br from-emerald-500 to-teal-600"}`}
        >
          {workspace.template === "scrum" ? (
            <Repeat className="w-7 h-7 text-white" />
          ) : (
            <Columns className="w-7 h-7 text-white" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            {workspace.name}
            <Link
              href={`/workspaces/${workspaceId}/settings`}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </h1>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors shadow-sm"
        >
          Mời thành viên
        </button>
        <button
          onClick={() => setShowCreateIssue(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tạo Issue
        </button>
      </div>

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        projectId={workspaceId}
      />
    </div>
  );
};

export default Header;
