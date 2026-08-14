"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Settings,
  Archive,
  Clock,
  Copy,
  Trash2,
  ImagePlus,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import { TaskDetailResponse } from "@/modules/workspace/shared/types/task-detail.type";
import type { Issue } from "@/modules/workspace/shared/types/issue.type";
import TaskCoverBanner from "@/modules/workspace/tasks/covers/TaskCoverBanner";
import TimeTrackingModal from "./TimeTrackingModal";
import StatusPicker from "@/shared/components/StatusPicker";
import type { TaskCover } from "@/modules/workspace/shared/types/task-cover.type";
import type { TaskStatusColumn } from "@/modules/workspace/shared/utils/taskStatusColumns";
import { useTaskCoverActions } from "@/modules/workspace/shared/hooks/useTaskCoverActions";
import TaskCoverPickerPortal from "@/modules/workspace/tasks/covers/TaskCoverPickerPortal";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import { toAssigneePickerUsers } from "@/shared/components/AssigneePicker";
import {
  getUserDisplayName,
  formatDateTime,
  getIssueAssigneeId,
  type SprintOption,
} from "./task-detail-shared";
import type { WorkspaceMember } from "@/modules/workspace/shared/types/workspace.type";
import TaskDetailMainContent from "./TaskDetailMainContent";
import TaskDetailFields from "./TaskDetailFields";

interface TaskDetailListProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  issue: TaskDetailResponse | any;
  workspaceId: string;
  workspaceMembers?: WorkspaceMember[];
  sprints?: SprintOption[];
  boardColumns?: TaskStatusColumn[];
  workspaceTemplate?: "kanban" | "scrum";
  onClose: () => void;
  showBackButton?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdateIssue?: (updatedIssue: any) => void;
  onFieldUpdate?: (issueId: string, updates: Partial<Issue>) => void;
  onArchiveIssue?: (issue: TaskDetailResponse) => void;
  onDeleteIssue?: (issue: TaskDetailResponse) => void;
  onRestoreIssue?: (issue: TaskDetailResponse) => void;
  detailUrl?: string;
  canEditTask?: boolean;
}

export default function TaskDetailList({
  issue,
  workspaceId,
  workspaceMembers = [],
  sprints = [],
  workspaceTemplate = "kanban",
  boardColumns = [],
  onClose,
  showBackButton = true,
  onUpdateIssue,
  onFieldUpdate,
  onArchiveIssue,
  onDeleteIssue,
  onRestoreIssue,
  detailUrl,
  canEditTask = true,
}: TaskDetailListProps) {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<"comments" | "history" | "work_log">("comments");
  const [localTitle, setLocalTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const workLogRefreshRef = useRef<(() => void) | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isLogWorkOpen, setIsLogWorkOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [localCover, setLocalCover] = useState<TaskCover | null>(null);
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
    if (issue) {
      setLocalTitle(issue.title);
      setIsEditingTitle(false);
      setShowActionMenu(false);
      setLocalCover(issue.cover ?? null);
    }
  }, [issue]);

  if (!issue) return null;

  const showSprintField = workspaceTemplate === "scrum";
  const canUpdateTask = canEditTask && Boolean(onUpdateIssue || onFieldUpdate);

  const assigneeUsers = toAssigneePickerUsers(workspaceMembers);
  const currentAssigneeId = getIssueAssigneeId(issue);
  const currentAssigneeName =
    issue.assigneeDisplayName ||
    assigneeUsers.find((c) => c.id === currentAssigneeId)?.name ||
    getUserDisplayName(issue.assignee, null);

  const updateIssueFields = (updates: Partial<Issue> | Record<string, unknown>) => {
    if (!canUpdateTask || issue.isArchived) return;
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

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#202020] text-[#111111] dark:text-[#E8E8E7] overflow-hidden">
      {/* ── TOP TOOLBAR ── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020]">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[0.8125rem] font-medium min-w-0">
          {showBackButton && (
            <>
              <button
                onClick={onClose}
                className="flex items-center gap-1 text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <span className="text-[#ABABAB] dark:text-[#6B6B6B] shrink-0">/</span>
            </>
          )}
          <div className="flex items-center gap-1.5 text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] cursor-pointer transition-colors shrink-0">
            <div className="w-4 h-4 bg-[#2563EB] dark:bg-[#3B82F6] text-white flex items-center justify-center rounded-[4px]">
              <span className="text-[0.5625rem] font-bold">✓</span>
            </div>
            <span>{issue.key}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-0.5">
            <button className="p-0.5 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[4px]">
              <ChevronRight className="w-3.5 h-3.5 text-[#ABABAB] dark:text-[#6B6B6B]" />
            </button>
            <button className="p-0.5 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[4px]">
              <ChevronDown className="w-3.5 h-3.5 text-[#ABABAB] dark:text-[#6B6B6B]" />
            </button>
          </div>
        </div>

        {/* Actions */}
          <div className="flex items-center gap-0.5 shrink-0 ml-2">
            <div className="relative">
              <button
                onClick={() => setShowActionMenu((o) => !o)}
                className="p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] text-[#787774] dark:text-[#9B9A97] rounded-[6px] transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showActionMenu && (
                <div
                  className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] py-1"
                  style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
                >
                  <button
                    onClick={() => {
                      setShowActionMenu(false);
                      setIsLogWorkOpen(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
                  >
                    <Clock className="h-4 w-4 text-[#787774] dark:text-[#9B9A97]" /> Log work
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
                    onClick={() => {
                      setShowActionMenu(false);
                      onArchiveIssue?.(issue);
                    }}
                    disabled={!onArchiveIssue || issue.isArchived}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] disabled:opacity-50 border-t border-[#EAEAEA] dark:border-white/[0.06]"
                  >
                    <Archive className="h-4 w-4" /> Archive
                  </button>
                  <button
                    onClick={() => {
                      setShowActionMenu(false);
                      onDeleteIssue?.(issue);
                    }}
                    disabled={!onDeleteIssue}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-[rgba(239,68,68,0.12)] disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
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
          </div>
      </div>

      <TaskCoverBanner
        workspaceId={workspaceId}
        issue={{ ...issue, cover: localCover }}
        maxHeightClass="h-36"
        colorHeightClass="h-18"
        onIssueCoverChange={setLocalCover}
      />

      {/* ── BODY: LEFT MAIN + RIGHT SIDEBAR ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT COLUMN: Main content ── */}
        <div className="min-w-0 flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 border-r border-[#EAEAEA] dark:border-white/[0.06]">
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
            workspaceMembers={workspaceMembers}
            assigneeName={currentAssigneeName}
            onSaveTitle={handleTitleBlur}
            onSaveDescription={(newDesc) => {
              if (canEditTask && onUpdateIssue && !issue.isArchived) {
                onUpdateIssue({ ...issue, description: newDesc });
              }
            }}
            titleSize="2xl"
            boardColumns={boardColumns}
            onRestoreIssue={() => onRestoreIssue && onRestoreIssue(issue)}
            onWorkLogCreated={(cb) => { workLogRefreshRef.current = cb; }}
          />
        </div>

        {/* ── RIGHT COLUMN: Sidebar ── */}
        <div className="w-72 shrink-0 overflow-y-auto custom-scrollbar bg-[#F9F9F8] dark:bg-[#252525] p-4 space-y-5">
          {/* Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusPicker
              value={issue.status}
              columnId={issue.columnId}
              options={boardColumns.map((col) => ({ id: col.id, name: col.name }))}
              disabled={!canUpdateTask || issue.isArchived}
              onChange={(status, option) =>
                updateIssueFields({ columnId: option.id, status })
              }
            />
          </div>

          {/* Details collapsible */}
          <div>
            <button
              onClick={() => setDetailsOpen((o) => !o)}
              className="w-full flex items-center justify-between py-1.5 text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
            >
              <div className="flex items-center gap-1.5">
                {detailsOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span>Details</span>
              </div>
              <Settings className="w-3.5 h-3.5 text-[#ABABAB] dark:text-[#6B6B6B]" />
            </button>

            {detailsOpen && (
              <div className="mt-1">
                <TaskDetailFields
                  issue={issue}
                  workspaceId={workspaceId}
                  canEditTask={canUpdateTask}
                  sprints={sprints}
                  showSprintField={showSprintField}
                  workspaceMembers={workspaceMembers}
                  onUpdate={updateIssueFields}
                />
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="border-t border-[#EAEAEA] dark:border-white/[0.06] pt-4 text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B] space-y-1">
            <p>Created {formatDateTime(issue.createdAt)}</p>
            <p>Updated {formatDateTime(issue.updatedAt)}</p>
          </div>
        </div>
      </div>
      <TimeTrackingModal
        isOpen={isLogWorkOpen}
        onClose={() => setIsLogWorkOpen(false)}
        issue={issue}
        workspaceId={workspaceId}
        onUpdateIssue={(updatedIssue) => {
          if (onUpdateIssue) onUpdateIssue(updatedIssue);
          if (workLogRefreshRef.current) workLogRefreshRef.current();
        }}
      />
    </div>
  );
}
