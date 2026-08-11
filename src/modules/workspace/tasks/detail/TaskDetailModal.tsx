"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X, MoreHorizontal, FileText, ChevronDown, Archive, Clock, Copy, Trash2, ImagePlus, ChevronRight } from "lucide-react";
import { createPortal } from "react-dom";
import { useRef } from "react";
import toast from "react-hot-toast";
import { TaskDetailResponse } from "@/modules/workspace/shared/types/task-detail.type";
import TaskCoverBanner from "@/modules/workspace/tasks/covers/TaskCoverBanner";
import StatusPicker from "@/shared/components/StatusPicker";
import type { TaskCover } from "@/modules/workspace/shared/types/task-cover.type";
import type { TaskStatusColumn } from "@/modules/workspace/shared/utils/taskStatusColumns";
import { useTaskCoverActions } from "@/modules/workspace/shared/hooks/useTaskCoverActions";
import TaskCoverPickerPortal from "@/modules/workspace/tasks/covers/TaskCoverPickerPortal";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { queryKeys } from "@/shared/constants/queryKeys";
import { useTaskDetailRealtime } from "@/lib/realtime/hooks/use-task-detail-realtime";
import { useTaskDetailRealtimeRoom } from "@/lib/realtime/hooks/use-task-detail-realtime-room";
import { getUserDisplayName, formatDateTime, type WorkspaceMember, type SprintOption } from "./task-detail-shared";
import TaskDetailMainContent from "./TaskDetailMainContent";
import TaskDetailFields from "./TaskDetailFields";
import TimeTrackingModal from "./TimeTrackingModal";
import { useEscapeStack } from "@/shared/hooks/useEscapeStack";
import TaskHeaderTypePicker from "./TaskHeaderTypePicker";
import ConvertToSubtaskModal from "./ConvertToSubtaskModal";
import ConvertSubtaskConfirmModal from "./ConvertSubtaskConfirmModal";

interface TaskDetailModalProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  issue: TaskDetailResponse | any;
  workspaceId: string;
  workspaceMembers?: WorkspaceMember[];
  sprints?: SprintOption[];
  boardColumns?: TaskStatusColumn[];
  workspaceTemplate?: "kanban" | "scrum";
  onClose: () => void;
  onUpdateIssue?: (updatedIssue: TaskDetailResponse) => void;
  onArchiveIssue?: (issue: TaskDetailResponse) => void;
  onDeleteIssue?: (issue: TaskDetailResponse) => void;
  onRestoreIssue?: (issue: TaskDetailResponse) => void;
  onSubtaskClick?: (subtaskId: string) => void;
  detailUrl?: string;
}

export default function TaskDetailModal({
  issue,
  workspaceId,
  workspaceMembers: providedWorkspaceMembers = [],
  sprints = [],
  boardColumns = [],
  workspaceTemplate = "kanban",
  onClose,
  onUpdateIssue,
  onArchiveIssue,
  onDeleteIssue,
  onRestoreIssue,
  onSubtaskClick,
  detailUrl,
}: TaskDetailModalProps) {
  useEscapeStack(onClose, Boolean(issue));
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"comments" | "history" | "work_log">("comments");
  const [localTitle, setLocalTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isLogWorkOpen, setIsLogWorkOpen] = useState(false);
  const [isConvertToSubtaskOpen, setIsConvertToSubtaskOpen] = useState(false);
  const [isConvertToTaskOpen, setIsConvertToTaskOpen] = useState(false);
  const [localCover, setLocalCover] = useState<TaskCover | null>(null);
  const [mounted, setMounted] = useState(false);
  const [coverAnchorRect, setCoverAnchorRect] = useState<DOMRect | null>(null);
  const coverRowRef = useRef<HTMLButtonElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleConvertToTask = async () => {
    try {
      await api.post(apiRoutes.TASKS.BOARD_SUBTASK_CONVERT_TO_TASK(workspaceId, issue.id));
      toast.success(`Successfully converted ${issue.key} to standalone task`);
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, "subtasks", workspaceId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byWorkspace(workspaceId) });
      setIsConvertToTaskOpen(false);
      if (onClose) onClose();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to convert to task";
      toast.error(message);
    }
  };

  const handleCoverMouseEnter = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    if (coverRowRef.current) setCoverAnchorRect(coverRowRef.current.getBoundingClientRect());
  };

  const handleCoverMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setCoverAnchorRect(null);
    }, 150);
  };

  const { saving, applyCover, removeCover } = useTaskCoverActions({
    workspaceId,
    issue,
    onCoverChange: setLocalCover,
  });

  useEffect(() => {
    setMounted(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isConvertToSubtaskOpen && !isConvertToTaskOpen && !isLogWorkOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isConvertToSubtaskOpen, isConvertToTaskOpen, isLogWorkOpen]);

  const { data: fetchedWorkspaceMembers = [] } = useQuery<WorkspaceMember[]>({
    queryKey: queryKeys.workspaces.members(workspaceId),
    queryFn: async () => {
      const response = await api.get(apiRoutes.WORKSPACES.MEMBERS(workspaceId));
      return response.data?.data ?? response.data ?? [];
    },
    enabled: Boolean(workspaceId) && providedWorkspaceMembers.length === 0,
    staleTime: 60_000,
  });

  useTaskDetailRealtimeRoom({
    workspaceId,
    taskId: issue?.id,
    enabled: Boolean(issue?.id),
  });

  useTaskDetailRealtime({
    workspaceId,
    taskId: issue?.id,
    taskKey: issue?.key,
    enabled: Boolean(issue?.id),
  });

  useEffect(() => {
    if (issue) {
      setLocalTitle(issue.title);
      setIsEditingTitle(false);
      setShowActionMenu(false);
      setLocalCover(issue.cover ?? null);
    }
  }, [issue]);

  if (!issue) return null;

  const detailWorkspaceMembers =
    providedWorkspaceMembers.length > 0 ? providedWorkspaceMembers : fetchedWorkspaceMembers;
  const canEditTask = Boolean(onUpdateIssue);
  const showSprintField = workspaceTemplate === "scrum";

  const assigneeName = issue.assigneeDisplayName || getUserDisplayName(issue.assignee, issue.assigneeId);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (canEditTask && localTitle !== issue.title && onUpdateIssue) {
      onUpdateIssue({ ...issue, title: localTitle });
    }
  };

  if (!issue || !mounted) return null;

  return createPortal (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 p-4 md:p-8 animate-in fade-in duration-200">
      <div
        className="w-full max-w-[min(100%,var(--app-content-max))] h-full max-h-[90vh] bg-white dark:bg-[#202020] text-[#787774] dark:text-[#9B9A97] flex flex-col rounded-[10px] overflow-hidden border border-[#EAEAEA] dark:border-white/[0.06]"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="app-header border-b border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-between shrink-0 bg-[#F9F9F8] dark:bg-[#252525]">
          <div className="flex items-center gap-2 text-[0.8125rem] font-medium">
            {/* <div className="flex items-center gap-2 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] px-2 py-1 rounded-[6px] cursor-pointer transition-colors">
              <div className="w-5 h-5 bg-[#2563EB] dark:bg-[#3B82F6] rounded-[4px] text-white flex items-center justify-center">
                <FileText className="w-3 h-3" />
              </div>
              <span className="text-[#787774] dark:text-[#9B9A97]">Add epic</span>
            </div> */}
            {issue.type?.toLowerCase() === 'subtask' && issue.parent && (
              <>
                <span className="text-[#ABABAB] dark:text-[#6B6B6B]">/</span>
                <div
                  className="flex items-center gap-2 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] px-2 py-1 rounded-[6px] cursor-pointer transition-colors"
                  title={issue.parent.title}
                  onClick={() => {
                    const parentKey = issue.parent?.key;
                    if (!parentKey) return;
                    const currentPath = window.location.pathname;
                    const newPath = currentPath.includes("/key/")
                      ? currentPath.replace(/\/key\/[^/]+$/, `/key/${parentKey}`)
                      : `${currentPath}/key/${parentKey}`;
                    window.history.pushState(null, "", newPath);
                    window.dispatchEvent(new Event("popstate"));
                  }}
                >
                  <span className="text-[#111111] dark:text-[#E8E8E7]">{issue.parent.key}</span>
                </div>
              </>
            )}
            <span className="text-[#ABABAB] dark:text-[#6B6B6B]">/</span>
            <div className="flex items-center gap-2 px-2 py-1 rounded-[6px] transition-colors">
              <TaskHeaderTypePicker
                type={issue.type}
                isSubtask={issue.type?.toLowerCase() === 'subtask'}
                disabled={!canEditTask || issue.isArchived}
                onUpdateType={(newType) => {
                  if (canEditTask && onUpdateIssue && !issue.isArchived) {
                    onUpdateIssue({ ...issue, type: newType });
                  }
                }}
              />
              <span className="text-[#111111] dark:text-[#E8E8E7] cursor-pointer hover:underline" onClick={() => {
                navigator.clipboard.writeText(issue.key);
                toast.success("Task key copied");
              }}>{issue.key}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowActionMenu((open) => !open)}
                  className="p-2 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] rounded-[6px] transition-colors"
                  aria-label="Task actions"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showActionMenu && (
                  <div
                    className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] py-1"
                    style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowActionMenu(false);
                        setIsLogWorkOpen(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
                    >
                      <Clock className="h-4 w-4 text-[#787774] dark:text-[#9B9A97]" />
                      Log work
                    </button>
                    {onUpdateIssue && (
                      <button
                        ref={coverRowRef}
                        type="button"
                        onMouseEnter={handleCoverMouseEnter}
                        onMouseLeave={handleCoverMouseLeave}
                        onClick={handleCoverMouseEnter}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[0.8125rem] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
                      >
                        <span className="flex items-center gap-2">
                          <ImagePlus className="h-4 w-4 text-[#787774] dark:text-[#9B9A97]" />
                          Select cover
                        </span>
                        <ChevronRight className="h-4 w-4 text-[#ABABAB] dark:text-[#6B6B6B]" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowActionMenu(false);
                        const wKey = issue.key ? issue.key.substring(0, issue.key.lastIndexOf('-')) : workspaceId;
                        const taskLink = detailUrl 
                          ? `${window.location.origin}${detailUrl}`
                          : `${window.location.origin}/workspaces/${wKey}/board?issue=${issue.key}`;
                        navigator.clipboard.writeText(taskLink);
                        toast.success("Task link copied");
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
                    >
                      <Copy className="h-4 w-4 text-[#787774] dark:text-[#9B9A97]" />
                      Copy link
                    </button>
                    {issue.type?.toLowerCase() === 'subtask' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowActionMenu(false);
                          setIsConvertToTaskOpen(true);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
                      >
                        <FileText className="h-4 w-4 text-[#787774] dark:text-[#9B9A97]" />
                        Convert to Task
                      </button>
                    ) : issue.type?.toLowerCase() !== 'epic' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowActionMenu(false);
                          setIsConvertToSubtaskOpen(true);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
                      >
                        <FileText className="h-4 w-4 text-[#787774] dark:text-[#9B9A97]" />
                        Convert to Subtask
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setShowActionMenu(false);
                        navigator.clipboard.writeText(issue.key);
                        toast.success("Task key copied");
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
                    >
                      <Copy className="h-4 w-4 text-[#787774] dark:text-[#9B9A97]" />
                      Copy key
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowActionMenu(false);
                        onArchiveIssue?.(issue);
                      }}
                      disabled={!onArchiveIssue || issue.isArchived}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] disabled:cursor-not-allowed disabled:opacity-50 border-t border-[#EAEAEA] dark:border-white/[0.06]"
                    >
                      <Archive className="h-4 w-4" />
                      Archive
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowActionMenu(false);
                        onDeleteIssue?.(issue);
                      }}
                      disabled={!onDeleteIssue}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-[rgba(239,68,68,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                )}
                
                <TaskCoverPickerPortal
                  anchorRect={coverAnchorRect}
                  cover={localCover}
                  disabled={issue.isArchived}
                  saving={saving}
                  onApplyCover={(cover) => {
                    applyCover(cover);
                    setCoverAnchorRect(null);
                    setShowActionMenu(false);
                  }}
                  onRemoveCover={() => {
                    removeCover();
                    setCoverAnchorRect(null);
                    setShowActionMenu(false);
                  }}
                  onRequestClose={() => setCoverAnchorRect(null)}
                  onMouseEnter={handleCoverMouseEnter}
                  onMouseLeave={handleCoverMouseLeave}
                />
              </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] rounded-[6px] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <TaskCoverBanner
          workspaceId={workspaceId}
          issue={{ ...issue, cover: localCover }}
          maxHeightClass="h-40"
          colorHeightClass="h-20"
          onIssueCoverChange={setLocalCover}
        />

        {/* Content Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left Column (Main) */}
          <div className="min-w-0 flex-1 h-full overflow-y-auto order-2 md:order-1 p-[var(--workspace-surface-pad)] md:p-[clamp(24px,2vw,40px)] md:border-r border-[#EAEAEA] dark:border-white/[0.06] space-y-8 scrollbar-thin scrollbar-thumb-[#DFE1E6] scrollbar-track-transparent">
            <TaskDetailMainContent
              issue={issue}
              workspaceId={workspaceId}
              user={user}
              token={token}
              canEditTask={canEditTask}
              localTitle={localTitle}
              setLocalTitle={setLocalTitle}
              isEditingTitle={isEditingTitle}
              setIsEditingTitle={setIsEditingTitle}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              workspaceMembers={detailWorkspaceMembers}
              assigneeName={assigneeName}
              onSubtaskClick={onSubtaskClick}
              onSaveTitle={handleTitleBlur}
              onSaveDescription={(newDesc) => {
                if (canEditTask && onUpdateIssue && !issue.isArchived) {
                  onUpdateIssue({ ...issue, description: newDesc });
                }
              }}
              titleSize="3xl"
              boardColumns={boardColumns}
              onRestoreIssue={() => onRestoreIssue && onRestoreIssue(issue)}
              onUpdateIssue={onUpdateIssue}
            />
          </div>

          {/* Right Column (Sidebar) */}
          <div className="w-full md:w-[360px] h-full overflow-y-auto order-1 md:order-2 workspace-detail-panel bg-[#F9F9F8] dark:bg-[#252525] p-[var(--workspace-surface-pad)] scrollbar-thin scrollbar-thumb-[#DFE1E6] scrollbar-track-transparent">
            <div className="flex items-center gap-2 mb-6">
              <StatusPicker
                value={issue.status}
                columnId={issue.columnId}
                options={boardColumns.map((col) => ({ id: col.id, name: col.name }))}
                disabled={!canEditTask || issue.isArchived}
                onChange={(status, option) => onUpdateIssue?.({ ...issue, columnId: option.id, status })}
              />
            </div>

            <div className="space-y-6">
              <div className="border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] rounded-[8px]">
                <button className="w-full flex items-center justify-between p-3 text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-t-[8px] transition-colors">
                  Details <ChevronDown className="w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B]" />
                </button>
                <div className="p-4 border-t border-[#EAEAEA] dark:border-white/[0.06]">
                  <TaskDetailFields
                    issue={issue}
                    workspaceId={workspaceId}
                    canEditTask={canEditTask}
                    sprints={sprints}
                    showSprintField={showSprintField}
                    workspaceMembers={detailWorkspaceMembers}
                    onUpdate={(updates) => onUpdateIssue?.({ ...issue, ...updates })}
                  />
                </div>
              </div>

              {/* Meta information */}
              <div className="text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B] space-y-1">
                <p>Created {formatDateTime(issue.createdAt)}</p>
                <p>Updated {formatDateTime(issue.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <TimeTrackingModal
        isOpen={isLogWorkOpen}
        onClose={() => setIsLogWorkOpen(false)}
        issue={issue}
        workspaceId={workspaceId}
        onUpdateIssue={onUpdateIssue}
      />
      <ConvertToSubtaskModal
        isOpen={isConvertToSubtaskOpen}
        onClose={() => setIsConvertToSubtaskOpen(false)}
        workspaceId={workspaceId}
        issueKey={issue.key}
        issueId={issue.id}
        onSuccess={() => {
          if (onClose) onClose();
        }}
      />
      <ConvertSubtaskConfirmModal
        isOpen={isConvertToTaskOpen}
        onClose={() => setIsConvertToTaskOpen(false)}
        onConfirm={handleConvertToTask}
        subtaskTitle={issue.title}
      />
    </div>,
    document.body
  );
}
