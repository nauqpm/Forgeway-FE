"use client";

import React, { useState, useEffect } from "react";
import {
  MoreHorizontal, Plus, Link as LinkIcon,
  ChevronDown, ChevronRight, Settings,
  Zap, Archive, AlertTriangle, ArchiveRestore,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { TaskDetailResponse } from "../types/task-detail.type";
import TaskDescription from "@/modules/admin/components/common/components/TaskDescription";
import TaskActivityHistory from "./TaskActivityHistory";
import TaskComments from "./TaskComments";
import TaskAttachmentsPanel from "./attachments/TaskAttachmentsPanel";
import TaskCoverBanner from "./covers/TaskCoverBanner";
import TaskLabelsField from "./labels/TaskLabelsField";
import TaskStatusChanger from "./TaskStatusChanger";
import type { TaskCover } from "../types/task-cover.type";
import type { TaskStatusColumn } from "../utils/taskStatusColumns";
import { useAuth } from "@/context/AuthContext";
import CustomDatePicker from "@/common/components/CustomDatePicker";
import AssigneePicker, {
  toAssigneePickerUsers,
  type AssigneePickerUser,
} from "@/common/components/AssigneePicker";

interface TaskDetailListProps {
  issue: TaskDetailResponse | any;
  workspaceId: string;
  workspaceMembers?: any[];
  sprints?: SprintOption[];
  boardColumns?: TaskStatusColumn[];
  workspaceTemplate?: "kanban" | "scrum";
  onClose: () => void;
  showBackButton?: boolean;
  onUpdateIssue?: (updatedIssue: any) => void;
  onArchiveIssue?: (issue: any) => void;
  detailUrl?: string;
}

const getUserDisplayName = (user: any, fallback?: string | null) => {
  if (typeof user === "string") return user;
  return user?.fullName || user?.email || fallback || "Unassigned";
};

const getIssueAssigneeId = (issue: any) => {
  if (issue?.assigneeId) return String(issue.assigneeId);
  if (typeof issue?.assignee === "string") return issue.assignee === "U" ? "" : issue.assignee;
  return issue?.assignee?._id || issue?.assignee?.id || "";
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const PRIORITY_COLORS: Record<string, string> = {
  High: "text-[#9F2F2D] dark:text-[#F87171]",
  Medium: "text-[#956400] dark:text-[#F59E0B]",
  Low: "text-[#1F6C9F] dark:text-[#93C5FD]",
  Highest: "text-[#9F2F2D] dark:text-[#F87171]",
  Lowest: "text-[#1F6C9F] dark:text-[#93C5FD]",
};

type SprintOption = {
  _id?: string;
  id?: string;
  name?: string;
};

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
  onArchiveIssue,
}: TaskDetailListProps) {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<"comments" | "history">("comments");
  const [localTitle, setLocalTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [localCover, setLocalCover] = useState<TaskCover | null>(null);

  useEffect(() => {
    if (issue) {
      setLocalTitle(issue.title);
      setIsEditingTitle(false);
      setShowActionMenu(false);
      setLocalCover(issue.cover ?? null);
    }
  }, [issue]);

  if (!issue) return null;

  const issueKey = issue.key;
  const reporterName = getUserDisplayName(issue.reporter, issue.reporterId);
  const sprintLabel =
    issue.sprint?.name ||
    sprints.find((sprint) => (sprint._id || sprint.id) === issue.sprintId)?.name ||
    "None";
  const showSprintField = workspaceTemplate === "scrum";
  const storyPointsLabel =
    issue.storyPoints === null || issue.storyPoints === undefined
      ? "None"
      : String(issue.storyPoints);
  const priorityColor = PRIORITY_COLORS[issue.priority] || "text-[#787774] dark:text-[#9B9A97]";
  const assigneeUsers = toAssigneePickerUsers(workspaceMembers);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (localTitle !== issue.title && onUpdateIssue) {
      onUpdateIssue({ ...issue, title: localTitle });
    }
  };

  const handleDateChange = (field: "startDate" | "dueDate", nextValue: string | null) => {
    if (!onUpdateIssue || issue.isArchived) return;
    onUpdateIssue({ ...issue, [field]: nextValue });
  };

  const handleAssigneeChange = (uid: string | null) => {
    if (!onUpdateIssue || issue.isArchived) return;

    const selectedUser: AssigneePickerUser | undefined = assigneeUsers.find(
      (candidate) => candidate.id === uid,
    );

    onUpdateIssue({
      ...issue,
      assigneeId: uid,
      assignee: uid ?? "U",
      assigneeDisplayName: uid ? selectedUser?.name ?? uid : "Unassigned",
      assigneeAvatar: uid ? selectedUser?.avatar : undefined,
    });
  };


  // Helper: each detail row in the sidebar — label on left (fixed), value on right
  const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-start gap-3 py-1.5">
      <span className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] w-28 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );

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
            <span>{issueKey}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-0.5">
            <button className="p-0.5 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[4px]"><ChevronRight className="w-3.5 h-3.5 text-[#ABABAB] dark:text-[#6B6B6B]" /></button>
            <button className="p-0.5 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[4px]"><ChevronDown className="w-3.5 h-3.5 text-[#ABABAB] dark:text-[#6B6B6B]" /></button>
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
              <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] py-1" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}>
                <button
                  onClick={() => { setShowActionMenu(false); onArchiveIssue?.(issue); }}
                  disabled={!onArchiveIssue || issue.isArchived}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] disabled:opacity-50"
                >
                  <Archive className="h-4 w-4" /> Archive
                </button>
              </div>
            )}
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
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 border-r border-[#EAEAEA] dark:border-white/[0.06]">

          {/* Archived Banner */}
          {issue.isArchived && (
            <div className="flex items-center justify-between bg-[#FBF3DB] dark:bg-[rgba(149,100,0,0.12)] border-l-4 border-[#956400]/40 dark:border-[#F59E0B]/40 p-3 rounded-[6px]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#956400] dark:text-[#F59E0B]" />
                <span className="text-[#956400] dark:text-[#F59E0B] text-sm">
                  Archived by {issue.archivedByUser?.fullName || "Unknown"} on {issue.archivedAt ? new Date(issue.archivedAt).toLocaleDateString() : "Unknown Date"}. Read-only.
                </span>
              </div>
              <button className="flex items-center gap-1 px-2.5 py-1 bg-[#FBF3DB] hover:bg-[#F7F6F3] dark:bg-[rgba(149,100,0,0.12)] dark:hover:bg-[#2E2E2E] text-[#956400] dark:text-[#F59E0B] text-xs font-semibold rounded-[6px] transition-colors">
                <ArchiveRestore className="w-3 h-3" /> Restore
              </button>
            </div>
          )}

          {/* Title */}
          {isEditingTitle && !issue.isArchived ? (
            <input
              autoFocus
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => { if (e.key === "Enter") handleTitleBlur(); }}
              className="w-full text-2xl font-semibold text-[#111111] dark:text-[#E8E8E7] bg-[#F7F6F3] dark:bg-[#252525] border-2 border-[#2563EB] rounded-[6px] px-2 py-1 outline-none"
            />
          ) : (
            <h1
              onClick={() => { if (!issue.isArchived) setIsEditingTitle(true); }}
              className={`text-2xl font-semibold text-[#111111] dark:text-[#E8E8E7] leading-snug rounded-[6px] px-1 -ml-1 transition-colors ${issue.isArchived ? "opacity-80" : "hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] cursor-pointer"}`}
            >
              {localTitle}
            </h1>
          )}

          {/* Description */}
          <div>
            <h2 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7] mb-2">Description</h2>
            <TaskDescription
              initialContent={issue.description || ""}
              onSave={(newDesc: string) => {
                if (onUpdateIssue && !issue.isArchived) {
                  onUpdateIssue({ ...issue, description: newDesc });
                }
              }}
            />
          </div>

          <TaskAttachmentsPanel
            workspaceId={workspaceId}
            taskId={issue.id}
            isArchived={issue.isArchived ?? false}
            currentUserId={user?.id}
            accessToken={token}
          />

          {/* Subtasks — hidden until backend supports */}

          {/* Linked Work Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Linked work items</h2>
              <button className="p-1 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[4px] transition-colors">
                <Plus className="w-4 h-4 text-[#787774] dark:text-[#9B9A97]" />
              </button>
            </div>
            <div className="bg-[#F9F9F8] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] p-4">
              <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] mb-3">No linked items yet</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/docs/create?issueId=${issue.id}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] dark:bg-[#3B82F6] hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] text-white text-[0.8125rem] font-medium rounded-[6px] transition-colors ${issue.isArchived ? "pointer-events-none opacity-50" : ""}`}
                >
                  <Plus className="w-3.5 h-3.5" /> Create Document
                </Link>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#EAEAEA] dark:border-white/[0.08] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] text-[#111111] dark:text-[#E8E8E7] text-[0.8125rem] font-medium rounded-[6px] transition-colors">
                  <LinkIcon className="w-3.5 h-3.5" /> Link item
                </button>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="border-t border-[#EAEAEA] dark:border-white/[0.06] pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Activity</h2>
              <div className="flex items-center gap-1 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                <span>Show:</span>
                {(["comments", "history"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-[4px] transition-colors capitalize ${activeTab === tab
                        ? "bg-[#F7F6F3] dark:bg-[#2A2A2A] text-[#111111] dark:text-[#E8E8E7] font-medium"
                        : "hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] text-[#787774] dark:text-[#9B9A97]"
                      }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
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
              <TaskActivityHistory workspaceId={workspaceId} taskId={issue.id} taskKey={issue.key} />
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Sidebar ── */}
        <div className="w-72 shrink-0 overflow-y-auto custom-scrollbar bg-[#F9F9F8] dark:bg-[#252525] p-4 space-y-5">

          {/* Status + Automations + Improve Task */}
          <div className="flex items-center gap-2 flex-wrap">
            <TaskStatusChanger
              issue={issue}
              boardColumns={boardColumns}
              disabled={issue.isArchived}
              onChange={({ columnId, status }) =>
                onUpdateIssue?.({ ...issue, columnId, status })
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
                {detailsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span>Details</span>
              </div>
              <Settings className="w-3.5 h-3.5 text-[#ABABAB] dark:text-[#6B6B6B]" />
            </button>

            {detailsOpen && (
              <div className="mt-1 space-y-0.5">

                {/* Assignee */}
                <DetailRow label="Assignee">
                  <AssigneePicker
                    users={assigneeUsers}
                    value={getIssueAssigneeId(issue) || null}
                    onChange={handleAssigneeChange}
                    placement="auto"
                    size="md"
                    disabled={issue.isArchived}
                  />
                </DetailRow>

                {/* Priority */}
                <DetailRow label="Priority">
                  <div className={`flex items-center gap-1.5 text-[0.8125rem] font-medium hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] p-1 -ml-1 rounded-[6px] cursor-pointer transition-colors ${priorityColor}`}>
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-current opacity-80" />
                    {issue.priority}
                  </div>
                </DetailRow>

                {/* Parent */}
                <DetailRow label="Parent">
                  <div className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] p-1 -ml-1 rounded-[6px] cursor-pointer transition-colors">None</div>
                </DetailRow>

                {/* Due date */}
                <DetailRow label="Start date">
                  <CustomDatePicker
                    value={issue.startDate}
                    onChange={(nextValue) => handleDateChange("startDate", nextValue)}
                    disabled={issue.isArchived}
                    inputClassName="h-8 bg-transparent dark:bg-transparent"
                    ariaLabel="Task start date"
                  />
                </DetailRow>

                <DetailRow label="Due date">
                  <CustomDatePicker
                    value={issue.dueDate}
                    onChange={(nextValue) => handleDateChange("dueDate", nextValue)}
                    disabled={issue.isArchived}
                    inputClassName="h-8 bg-transparent dark:bg-transparent"
                    ariaLabel="Task due date"
                  />
                </DetailRow>

                {/* Labels */}
                <DetailRow label="Labels">
                  <TaskLabelsField
                    workspaceId={workspaceId}
                    issue={issue}
                    disabled={issue.isArchived}
                    compact
                  />
                </DetailRow>

                {showSprintField && (
                  <DetailRow label="Sprint">
                    <div className="text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] p-1 -ml-1 rounded-[6px] cursor-pointer transition-colors">{sprintLabel}</div>
                  </DetailRow>
                )}

                {/* Story point estimate */}
                <DetailRow label="Story point estimate">
                  <div className="text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] p-1 -ml-1 rounded-[6px] cursor-pointer transition-colors">{storyPointsLabel}</div>
                </DetailRow>

                {/* Reporter */}
                <DetailRow label="Reporter">
                  <div className="flex items-center gap-2 text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] p-1 -ml-1 rounded-[6px] cursor-pointer transition-colors">
                    <div className="w-5 h-5 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white font-bold text-[0.625rem] shrink-0">
                      {reporterName.substring(0, 1).toUpperCase()}
                    </div>
                    <span className="truncate">{reporterName}</span>
                  </div>
                </DetailRow>

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
    </div>
  );
}
