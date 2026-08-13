"use client";

import React, { useRef, useCallback } from "react";

import { AlertTriangle, ArchiveRestore } from "lucide-react";
import TaskDescription from "@/modules/admin-shared/components/common/components/TaskDescription";
import TaskAttachmentsPanel from "@/modules/workspace/tasks/attachments/TaskAttachmentsPanel";
import TaskComments from "@/modules/workspace/shared/components/TaskComments";
import TaskActivityHistory from "@/modules/workspace/shared/components/TaskActivityHistory";
import { getIssueAssigneeId } from "./task-detail-shared";
import type { TaskStatusColumn } from "@/modules/workspace/shared/utils/taskStatusColumns";
import type { TaskDetailResponse } from "@/modules/workspace/shared/types/task-detail.type";
import TaskSubtasksPanel from "./TaskSubtasksPanel";
import { type WorkspaceMember } from "./task-detail-shared";

interface TaskDetailMainContentProps {
  issue: TaskDetailResponse;
  workspaceId: string;
  user?: { id?: string } | null;
  token?: string | null;
  canEditTask: boolean;
  localTitle: string;
  setLocalTitle: (v: string) => void;
  isEditingTitle: boolean;
  setIsEditingTitle: (v: boolean) => void;
  activeTab: "comments" | "history" | "work_log";
  setActiveTab: (v: "comments" | "history" | "work_log") => void;
  workspaceMembers: WorkspaceMember[];
  assigneeName: string;
  onSaveTitle: () => void;
  onSaveDescription: (desc: string) => void;
  /** "3xl" for modal (wide), "2xl" for drawer/list (narrower). Default: "3xl" */
  titleSize?: "2xl" | "3xl";
  /** Slot rendered between Title and Description — used by Drawer to inject Status + Details */
  afterTitle?: React.ReactNode;
  boardColumns?: TaskStatusColumn[];
  onRestoreIssue?: () => void;
  onUpdateIssue?: (updatedIssue: TaskDetailResponse) => void;
  onSubtaskClick?: (subtaskId: string) => void;
  /** Called when a new work log is created from an external source (e.g. Drawer toolbar) */
  onWorkLogCreated?: (cb: () => void) => void;
}

import TaskWorkLogs from "@/modules/workspace/shared/components/TaskWorkLogs";

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
  onRestoreIssue,
  onUpdateIssue,
  onSubtaskClick,
  onWorkLogCreated,
}: TaskDetailMainContentProps) {
  const workLogRefreshRef = useRef<(() => void) | null>(null);

  const handleWorkLogRefresh = useCallback((refetch: () => void) => {
    workLogRefreshRef.current = refetch;
    if (onWorkLogCreated) {
      onWorkLogCreated(() => refetch());
    }
  }, [onWorkLogCreated]);
  const titleTextClass =
    titleSize === "3xl"
      ? "text-3xl font-semibold text-[#111111] dark:text-[#E8E8E7] leading-tight mb-4"
      : "text-2xl font-semibold text-[#111111] dark:text-[#E8E8E7] leading-tight mb-4";

  return (
    <div className="flex flex-col w-full min-w-0 gap-6">
      {/* Archived Banner */}
      {issue.isArchived && (
        <div className="order-1 flex items-center justify-between bg-[#FBF3DB] dark:bg-[rgba(149,100,0,0.12)] border-l-4 border-[#956400]/40 dark:border-[#F59E0B]/40 p-4 rounded-[6px]">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-[#956400] dark:text-[#F59E0B] mr-2" />
            <span className="text-[#956400] dark:text-[#F59E0B] text-sm font-medium">
              This task was archived by {issue.archivedByUser?.fullName || "Unknown"} on{" "}
              {issue.archivedAt ? new Date(issue.archivedAt).toLocaleDateString() : "Unknown Date"}. It is currently
              read-only.
            </span>
          </div>
          <button
            onClick={() => {
              if (onRestoreIssue) onRestoreIssue();
            }}
            className="flex items-center px-3 py-1.5 bg-[#FBF3DB] hover:bg-[#F7F6F3] dark:bg-[rgba(149,100,0,0.12)] dark:hover:bg-[#2E2E2E] text-[#956400] dark:text-[#F59E0B] text-sm font-semibold rounded-[6px] transition-colors"
          >
            <ArchiveRestore className="w-4 h-4 mr-1.5" />
            Restore
          </button>
        </div>
      )}

      {/* Title */}
      <div className="order-2 min-w-0 max-w-full">
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
            className={`w-full min-w-0 max-w-full break-words ${titleTextClass} bg-[#F7F6F3] dark:bg-[#252525] border-2 border-[#2563EB] rounded-[6px] px-2 py-1 outline-none`}
          />
        ) : (
          <h1
            onClick={() => {
              if (canEditTask && !issue.isArchived) setIsEditingTitle(true);
            }}
            className={`min-w-0 max-w-full break-words [overflow-wrap:anywhere] [word-break:break-word] ${titleTextClass} p-2 -ml-2 rounded-[6px] transition-colors ${
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
      <div className="order-3">{afterTitle}</div>

      {/* Description */}
      <div className="order-4 space-y-2">
        <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Description</h3>
        <TaskDescription initialContent={issue.description || ""} onSave={onSaveDescription} />
      </div>

      {issue.type?.toLowerCase() !== "subtask" && issue.type?.toLowerCase() !== "epic" && (
        <div className="order-5 w-full pt-4">
          <TaskSubtasksPanel
            issue={issue}
            workspaceId={workspaceId}
            workspaceMembers={workspaceMembers}
            boardColumns={boardColumns || []}
            canEditTask={canEditTask}
            onSubtaskClick={onSubtaskClick || ((subtaskId) => {
              const currentPath = window.location.pathname;
              const newPath = currentPath.includes("/key/")
                ? currentPath.replace(/\/key\/[^/]+$/, `/key/${subtaskId}`)
                : `${currentPath}/key/${subtaskId}`;
              window.history.pushState(null, "", newPath);
              window.dispatchEvent(new Event("popstate"));
            })}
          />
        </div>
      )}

      <div className="order-6 w-full pt-4">
        <TaskAttachmentsPanel
          workspaceId={workspaceId}
          taskId={issue.id}
          isArchived={!canEditTask || (issue.isArchived ?? false)}
          currentUserId={user?.id}
          accessToken={token}
        />
      </div>

      {/* Activity */}
      <div className="order-7 space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Activity</h3>
          <div className="flex items-center gap-2 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
            <span>Show:</span>
            <button
              onClick={() => setActiveTab("comments")}
              className={`px-3 py-1 rounded-[4px] font-medium transition-colors ${activeTab === "comments"
                ? "bg-[#F7F6F3] dark:bg-[#2A2A2A] text-[#111111] dark:text-[#E8E8E7]"
                : "hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
                }`}
            >
              Comments
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1 rounded-[4px] font-medium transition-colors ${activeTab === "history"
                ? "bg-[#F7F6F3] dark:bg-[#2A2A2A] text-[#111111] dark:text-[#E8E8E7]"
                : "hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
                }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab("work_log")}
              className={`px-3 py-1 rounded-[4px] font-medium transition-colors ${activeTab === "work_log"
                ? "bg-[#F7F6F3] dark:bg-[#2A2A2A] text-[#111111] dark:text-[#E8E8E7]"
                : "hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
                }`}
            >
              Work log
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
        {activeTab === "work_log" && (
          <TaskWorkLogs
            workspaceId={workspaceId}
            taskId={issue.id}
            workspaceMembers={workspaceMembers}
            issue={issue}
            onUpdateIssue={onUpdateIssue}
            canEdit={canEditTask}
            onRefresh={handleWorkLogRefresh}
          />
        )}
      </div>
    </div>
  );
}
