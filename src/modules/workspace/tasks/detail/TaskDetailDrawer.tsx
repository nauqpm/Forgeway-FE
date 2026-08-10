"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  MoreHorizontal,
  FileText,
  Archive,
  Clock,
  Copy,
  Trash2,
  ImagePlus,
  ChevronRight,
} from "lucide-react";
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
import type { Issue } from "@/modules/workspace/shared/types/issue.type";
import {
  getUserDisplayName,
  formatDateTime,
  type WorkspaceMember,
  type SprintOption,
} from "./task-detail-shared";
import TaskDetailMainContent from "./TaskDetailMainContent";
import TaskDetailFields from "./TaskDetailFields";
import TimeTrackingModal from "./TimeTrackingModal";
import TaskHeaderTypePicker from "./TaskHeaderTypePicker";
import ConvertToSubtaskModal from "./ConvertToSubtaskModal";
import ConvertSubtaskConfirmModal from "./ConvertSubtaskConfirmModal";

interface TaskDetailDrawerProps {
  isOpen: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  issue: TaskDetailResponse | any;
  workspaceId: string;
  workspaceMembers?: WorkspaceMember[];
  sprints?: SprintOption[];
  boardColumns?: TaskStatusColumn[];
  workspaceTemplate?: "kanban" | "scrum";
  onClose: () => void;
  onUpdateIssue?: (updatedIssue: TaskDetailResponse) => void;
  onFieldUpdate?: (issueId: string, updates: Partial<Issue>) => void;
  onArchiveIssue?: (issue: TaskDetailResponse) => void;
  onDeleteIssue?: (issue: TaskDetailResponse) => void;
  onRestoreIssue?: (issue: TaskDetailResponse) => void;
  detailUrl?: string;
  /** Embedded in split list view: no overlay, no fixed positioning */
  embedded?: boolean;
}

export default function TaskDetailDrawer({
  isOpen,
  issue,
  workspaceId,
  workspaceMembers: providedWorkspaceMembers = [],
  sprints = [],
  boardColumns = [],
  workspaceTemplate = "kanban",
  onClose,
  onUpdateIssue,
  onFieldUpdate,
  onArchiveIssue,
  onDeleteIssue,
  onRestoreIssue,
  detailUrl,
  embedded = false,
}: TaskDetailDrawerProps) {
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

  const { data: fetchedWorkspaceMembers = [] } = useQuery<WorkspaceMember[]>({
    queryKey: queryKeys.workspaces.members(workspaceId),
    queryFn: async () => {
      const response = await api.get(apiRoutes.WORKSPACES.MEMBERS(workspaceId));
      return response.data?.data ?? response.data ?? [];
    },
    enabled: Boolean(workspaceId) && providedWorkspaceMembers.length === 0,
    staleTime: 60_000,
  });

  // Resize state
  const [drawerWidth, setDrawerWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [coverAnchorRect, setCoverAnchorRect] = useState<DOMRect | null>(null);
  const coverRowRef = useRef<HTMLButtonElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    if (embedded) return;

    const syncDrawerWidth = () => {
      setDrawerWidth((currentWidth) => Math.min(currentWidth, window.innerWidth));
    };

    syncDrawerWidth();
    window.addEventListener("resize", syncDrawerWidth);
    return () => window.removeEventListener("resize", syncDrawerWidth);
  }, [embedded]);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = window.innerWidth - e.clientX;
      const isMobileViewport = window.innerWidth < 640;
      const maxWidth = isMobileViewport ? window.innerWidth : window.innerWidth * 0.5;
      const minWidth = Math.min(300, maxWidth);
      if (newWidth < minWidth) newWidth = minWidth;
      if (newWidth > maxWidth) newWidth = maxWidth;
      setDrawerWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

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
  const canEditTask = Boolean(onUpdateIssue || onFieldUpdate);
  const showSprintField = workspaceTemplate === "scrum";

  const assigneeName =
    issue.assigneeDisplayName ||
    getUserDisplayName(issue.assignee, issue.assigneeId);

  const updateIssueFields = (updates: Partial<Issue> | Record<string, unknown>) => {
    if (issue.isArchived) return;
    if (onFieldUpdate) {
      onFieldUpdate(issue.id, updates as Partial<Issue>);
      return;
    }
    onUpdateIssue?.({ ...issue, ...updates });
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (canEditTask && localTitle !== issue.title && onUpdateIssue) {
      onUpdateIssue({ ...issue, title: localTitle });
    }
  };

  const panelClasses = embedded
    ? "relative z-0 flex flex-col h-full min-h-0 w-full max-w-none bg-white dark:bg-[#202020] text-[#787774] dark:text-[#9B9A97] shadow-none border-0 rounded-none overflow-hidden"
    : `fixed top-0 right-0 bottom-0 z-[99999] bg-white dark:bg-[#202020] text-[#787774] dark:text-[#9B9A97] flex flex-col border-l border-[#EAEAEA] dark:border-white/[0.06] transform ${isResizing ? "" : "transition-transform duration-300 ease-in-out"} ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`;

  return (
    <>
      {!embedded && (
        <div
          className={`fixed inset-0 z-[99998] bg-transparent transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          onClick={onClose}
        />
      )}

      <div className={panelClasses} style={{ width: embedded ? "100%" : `${drawerWidth}px`, maxWidth: embedded ? undefined : "100vw" }}>
        {!embedded && (
          <div
            className={`absolute top-0 left-0 bottom-0 z-[100000] hidden w-1.5 -ml-[3px] cursor-col-resize transition-colors hover:bg-[#2563EB]/30 sm:block ${isResizing ? "bg-[#2563EB]/50" : "bg-transparent"}`}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
            }}
          />
        )}

        {/* Top Header */}
        <div className="app-header border-b border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-between shrink-0 bg-[#F7F6F3] dark:bg-[#252525]">
          <div className="flex min-w-0 items-center gap-2 text-[0.8125rem] font-medium">
            {/* <div className="hidden items-center gap-2 hover:bg-[#F0F0EE] dark:hover:bg-[#2E2E2E] px-2 py-1 rounded-[4px] cursor-pointer transition-colors sm:flex">
              <div className="w-5 h-5 bg-[#2563EB] dark:bg-[#3B82F6] rounded-[4px] text-white flex items-center justify-center">
                <FileText className="w-3 h-3" />
              </div>
              <span className="text-[#787774] dark:text-[#9B9A97]">Add epic</span>
            </div> */}
            
            {issue.type?.toLowerCase() === 'subtask' && issue.parent && (
              <>
                <span className="hidden text-[#ABABAB] dark:text-[#6B6B6B] sm:inline">/</span>
                <div
                  className="flex min-w-0 items-center gap-2 hover:bg-[#F0F0EE] dark:hover:bg-[#2E2E2E] px-2 py-1 rounded-[4px] cursor-pointer transition-colors"
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
                  <span className="truncate text-[#111111] dark:text-[#E8E8E7]">{issue.parent.key}</span>
                </div>
              </>
            )}

            <span className="hidden text-[#ABABAB] dark:text-[#6B6B6B] sm:inline">/</span>
            <div className="flex min-w-0 items-center gap-2 px-2 py-1 rounded-[4px] transition-colors">
              <TaskHeaderTypePicker
                type={issue.type}
                isSubtask={issue.type?.toLowerCase() === 'subtask'}
                disabled={!canEditTask || issue.isArchived}
                onUpdateType={(newType) => updateIssueFields({ type: newType })}
              />
              <span className="truncate text-[#111111] dark:text-[#E8E8E7] cursor-pointer hover:underline" onClick={() => {
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
                  className="p-2 hover:bg-[#F0F0EE] dark:hover:bg-[#2E2E2E] text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] rounded-[6px] transition-colors"
                  aria-label="Task actions"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showActionMenu && (
                  <div
                    className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] py-1"
                    style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)" }}
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
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] disabled:cursor-not-allowed disabled:opacity-40 border-t border-[#EAEAEA] dark:border-white/[0.06]"
                    >
                      <Archive className="h-4 w-4 text-[#787774]" />
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
              className="p-2 hover:bg-[#F0F0EE] dark:hover:bg-[#2E2E2E] text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] rounded-[6px] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <TaskCoverBanner
          workspaceId={workspaceId}
          issue={{ ...issue, cover: localCover }}
          maxHeightClass="h-32"
          colorHeightClass="h-16"
          onIssueCoverChange={setLocalCover}
        />

        {/* Content Body — single scrollable column */}
          <div className="min-w-0 flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-[#202020]">
            <div className="min-w-0 p-4 md:p-6 space-y-8">
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
              onSaveTitle={handleTitleBlur}
              onSaveDescription={(newDesc) => {
                if (canEditTask && !issue.isArchived) {
                  updateIssueFields({ description: newDesc });
                }
              }}
              titleSize="2xl"
              boardColumns={boardColumns}
              onRestoreIssue={() => onRestoreIssue && onRestoreIssue(issue)}
              afterTitle={
                <div className="space-y-6">
                  {/* Status */}
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusPicker
                      value={issue.status}
                      columnId={issue.columnId}
                      options={boardColumns.map((col) => ({ id: col.id, name: col.name }))}
                      disabled={!canEditTask || issue.isArchived}
                      onChange={(status, option) =>
                        updateIssueFields({ columnId: option.id, status })
                      }
                    />
                  </div>

                  {/* Details */}
                  <div className="border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] bg-white dark:bg-[#202020] overflow-hidden">
                    <div className="w-full flex items-center justify-between p-3 text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7] bg-[#F9F9F8] dark:bg-[#252525] border-b border-[#EAEAEA] dark:border-white/[0.06]">
                      Details
                    </div>
                    <div className="p-4">
                      <TaskDetailFields
                        issue={issue}
                        workspaceId={workspaceId}
                        canEditTask={canEditTask}
                        sprints={sprints}
                        showSprintField={showSprintField}
                        workspaceMembers={detailWorkspaceMembers}
                        onUpdate={updateIssueFields}
                      />
                    </div>
                  </div>
                </div>
              }
            />

            {/* Meta */}
            <div className="text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B] flex items-center justify-center gap-4 pb-8">
              <span>Created: {formatDateTime(issue.createdAt)}</span>
              <span>•</span>
              <span>Updated: {formatDateTime(issue.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <TimeTrackingModal
        isOpen={isLogWorkOpen}
        onClose={() => setIsLogWorkOpen(false)}
        issue={issue}
        workspaceId={workspaceId}
        onUpdateIssue={updateIssueFields as never}
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

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #EAEAEA; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #C8C7C4; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `,
        }}
      />
    </>
  );
}
