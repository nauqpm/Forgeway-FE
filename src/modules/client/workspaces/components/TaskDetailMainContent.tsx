"use client";

import React from "react";
import { AlertTriangle, ArchiveRestore } from "lucide-react";
import TaskDescription from "@/modules/admin/components/common/components/TaskDescription";
import TaskAttachmentsPanel from "./attachments/TaskAttachmentsPanel";
import TaskComments from "./TaskComments";
import TaskActivityHistory from "./TaskActivityHistory";
import { getIssueAssigneeId } from "./task-detail-shared";
import type { TaskStatusColumn } from "../utils/taskStatusColumns";

interface TaskDetailMainContentProps {
  issue: any;
  workspaceId: string;
  user?: { id?: string } | null;
  token?: string | null;
  canEditTask: boolean;
  localTitle: string;
  setLocalTitle: (v: string) => void;
  isEditingTitle: boolean;
  setIsEditingTitle: (v: boolean) => void;
  activeTab: "comments" | "history";
  setActiveTab: (v: "comments" | "history") => void;
  workspaceMembers: any[];
  assigneeName: string;
  onSaveTitle: () => void;
  onSaveDescription: (desc: string) => void;
  /** "3xl" for modal (wide), "2xl" for drawer/list (narrower). Default: "3xl" */
  titleSize?: "2xl" | "3xl";
  /** Slot rendered between Title and Description — used by Drawer to inject Status + Details */
  afterTitle?: React.ReactNode;
  boardColumns?: TaskStatusColumn[];
}

export default function TaskDetailMainContent({
  issue,
  workspaceId,
  user,
  token,
  canEditTask,
  localTitle,
  setLocalTitle,
  isEditingTitle,
  setIsEditingTitle,
  activeTab,
  setActiveTab,
  workspaceMembers,
  assigneeName,
  onSaveTitle,
  onSaveDescription,
  titleSize = "3xl",
  afterTitle,
  boardColumns,
}: TaskDetailMainContentProps) {
  const titleTextClass =
    titleSize === "3xl"
      ? "text-3xl font-semibold text-[#111111] dark:text-[#E8E8E7] leading-tight mb-4"
      : "text-2xl font-semibold text-[#111111] dark:text-[#E8E8E7] leading-tight mb-4";

  return (
    <>
      {/* Archived Banner */}
      {issue.isArchived && (
        <div className="flex items-center justify-between bg-[#FBF3DB] dark:bg-[rgba(149,100,0,0.12)] border-l-4 border-[#956400]/40 dark:border-[#F59E0B]/40 p-4 rounded-[6px]">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-[#956400] dark:text-[#F59E0B] mr-2" />
            <span className="text-[#956400] dark:text-[#F59E0B] text-sm font-medium">
              This task was archived by {issue.archivedByUser?.fullName || "Unknown"} on{" "}
              {issue.archivedAt
                ? new Date(issue.archivedAt).toLocaleDateString()
                : "Unknown Date"}
              . It is currently read-only.
            </span>
          </div>
          <button
            onClick={() => {
              console.log("Restore triggered");
            }}
            className="flex items-center px-3 py-1.5 bg-[#FBF3DB] hover:bg-[#F7F6F3] dark:bg-[rgba(149,100,0,0.12)] dark:hover:bg-[#2E2E2E] text-[#956400] dark:text-[#F59E0B] text-sm font-semibold rounded-[6px] transition-colors"
          >
            <ArchiveRestore className="w-4 h-4 mr-1.5" />
            Restore
          </button>
        </div>
      )}

      {/* Title */}
      <div>
        {canEditTask && isEditingTitle && !issue.isArchived ? (
          <input
            autoFocus
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={onSaveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveTitle();
            }}
            className={`w-full ${titleTextClass} bg-[#F7F6F3] dark:bg-[#252525] border-2 border-[#2563EB] rounded-[6px] px-2 py-1 outline-none`}
          />
        ) : (
          <h1
            onClick={() => {
              if (canEditTask && !issue.isArchived) setIsEditingTitle(true);
            }}
            className={`${titleTextClass} p-2 -ml-2 rounded-[6px] transition-colors ${
              canEditTask && !issue.isArchived
                ? "hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] cursor-pointer"
                : "opacity-90"
            }`}
          >
            {localTitle}
          </h1>
        )}
      </div>

      {/* Slot for injecting Status + Details between Title and Description (used by Drawer) */}
      {afterTitle}

      {/* Description */}
      <div className="space-y-2">
        <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
          Description
        </h3>
        <TaskDescription
          initialContent={issue.description || ""}
          onSave={onSaveDescription}
        />
      </div>

      <TaskAttachmentsPanel
        workspaceId={workspaceId}
        taskId={issue.id}
        isArchived={!canEditTask || (issue.isArchived ?? false)}
        currentUserId={user?.id}
        accessToken={token}
      />

      {/* Activity */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
            Activity
          </h3>
          <div className="flex items-center gap-2 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
            <span>Show:</span>
            <button
              onClick={() => setActiveTab("comments")}
              className={`px-3 py-1 rounded-[4px] font-medium transition-colors ${
                activeTab === "comments"
                  ? "bg-[#F7F6F3] dark:bg-[#2A2A2A] text-[#111111] dark:text-[#E8E8E7]"
                  : "hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
              }`}
            >
              Comments
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1 rounded-[4px] transition-colors ${
                activeTab === "history"
                  ? "bg-[#F7F6F3] dark:bg-[#2A2A2A] text-[#111111] dark:text-[#E8E8E7]"
                  : "hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
              }`}
            >
              History
            </button>
          </div>
        </div>
        {activeTab === "comments" && (
          <TaskComments
            workspaceId={workspaceId}
            taskId={issue.id}
            isArchived={issue.isArchived ?? false}
            isDeleted={issue.isDeleted ?? false}
          />
        )}
        {activeTab === "history" && (
          <TaskActivityHistory
            workspaceId={workspaceId}
            taskId={issue.id}
            taskKey={issue.key}
            workspaceMembers={workspaceMembers}
            assigneeId={getIssueAssigneeId(issue)}
            assigneeName={assigneeName}
            assignee={issue.assignee}
            labels={issue.labels}
            boardColumns={boardColumns}
          />
        )}
      </div>
    </>
  );
}
