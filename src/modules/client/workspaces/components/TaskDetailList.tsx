"use client";

import React, { useState, useEffect } from "react";
import {
  MoreHorizontal, Plus, Link as LinkIcon,
  ChevronDown, ChevronRight, Settings,
  Zap, User, Archive, AlertTriangle, ArchiveRestore,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { TaskDetailResponse } from "../types/task-detail.type";
import TaskSubtasks from "@/modules/admin/components/common/components/TaskSubtasks";
import TaskDescription from "@/modules/admin/components/common/components/TaskDescription";
import TaskActivityHistory from "./TaskActivityHistory";
import TaskComments from "./TaskComments";
import TaskAttachmentsPanel from "./attachments/TaskAttachmentsPanel";
import TaskCoverBanner from "./covers/TaskCoverBanner";
import TaskLabelsField from "./labels/TaskLabelsField";
import type { TaskCover } from "../types/task-cover.type";
import { resolveTaskStatusColumn, type TaskStatusColumn } from "../utils/taskStatusColumns";
import { useAuth } from "@/context/AuthContext";
import CustomDatePicker from "@/common/components/CustomDatePicker";

interface TaskDetailListProps {
  issue: TaskDetailResponse | any;
  workspaceId: string;
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

const formatDateTime = (value?: string | null) => {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const PRIORITY_COLORS: Record<string, string> = {
  High: "text-red-500",
  Medium: "text-orange-400",
  Low: "text-blue-400",
  Highest: "text-red-600",
  Lowest: "text-blue-300",
};

type SprintOption = {
  _id?: string;
  id?: string;
  name?: string;
};

export default function TaskDetailList({
  issue,
  workspaceId,
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
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [localCover, setLocalCover] = useState<TaskCover | null>(null);

  useEffect(() => {
    if (issue) {
      setLocalTitle(issue.title);
      setSubtasks(issue.subtasks || []);
      setIsEditingTitle(false);
      setShowStatusDropdown(false);
      setShowActionMenu(false);
      setLocalCover(issue.cover ?? null);
    }
  }, [issue]);

  if (!issue) return null;

  const issueKey = issue.key;
  const { statusColumns, currentColumn, displayName: statusDisplayName } =
    resolveTaskStatusColumn(boardColumns, issue);
  const assigneeName =
    issue.assigneeDisplayName || getUserDisplayName(issue.assignee, issue.assigneeId);
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
  const priorityColor = PRIORITY_COLORS[issue.priority] || "text-gray-500";

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (localTitle !== issue.title && onUpdateIssue) {
      onUpdateIssue({ ...issue, title: localTitle });
    }
  };

  const handleStatusChange = (column: TaskStatusColumn) => {
    setShowStatusDropdown(false);
    if ((column.id !== issue.columnId || column.name !== issue.status) && onUpdateIssue) {
      onUpdateIssue({ ...issue, columnId: column.id, status: column.name });
    }
  };

  const handleDateChange = (field: "startDate" | "dueDate", nextValue: string | null) => {
    if (!onUpdateIssue || issue.isArchived) return;
    onUpdateIssue({ ...issue, [field]: nextValue });
  };

  const handleAddSubtask = (title: string) => {
    if (issue.isArchived) return;
    const newSubtask = { id: `sub-${Date.now()}`, title, status: "To Do", priority: "Medium" };
    const updated = [...subtasks, newSubtask];
    setSubtasks(updated);
    onUpdateIssue?.({ ...issue, subtasks: updated });
  };

  const handleUpdateSubtaskStatus = (id: string, newStatus: string) => {
    if (issue.isArchived) return;
    const updated = subtasks.map((t) => (t.id === id ? { ...t, status: newStatus } : t));
    setSubtasks(updated);
    onUpdateIssue?.({ ...issue, subtasks: updated });
  };

  // Helper: each detail row in the sidebar — label on left (fixed), value on right
  const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-start gap-3 py-1.5">
      <span className="text-sm text-gray-500 dark:text-gray-400 w-28 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#1D2125] text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* ── TOP TOOLBAR ── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1D2125]">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm font-medium min-w-0">
          {showBackButton && (
            <>
              <button
                onClick={onClose}
                className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <span className="text-gray-400 dark:text-gray-600 shrink-0">/</span>
            </>
          )}
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer transition-colors shrink-0">
            <div className="w-4 h-4 bg-[#0052CC] text-white flex items-center justify-center rounded-sm">
              <span className="text-[9px] font-bold">✓</span>
            </div>
            <span>{issueKey}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-0.5">
            <button className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><ChevronRight className="w-3.5 h-3.5 text-gray-400" /></button>
            <button className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><ChevronDown className="w-3.5 h-3.5 text-gray-400" /></button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0 ml-2">
          <div className="relative">
            <button
              onClick={() => setShowActionMenu((o) => !o)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 rounded transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showActionMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-1 shadow-xl">
                <button
                  onClick={() => { setShowActionMenu(false); onArchiveIssue?.(issue); }}
                  disabled={!onArchiveIssue || issue.isArchived}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
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
        colorHeightClass="h-[72px]"
        onIssueCoverChange={setLocalCover}
      />

      {/* ── BODY: LEFT MAIN + RIGHT SIDEBAR ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT COLUMN: Main content ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 border-r border-gray-200 dark:border-gray-700">

          {/* Archived Banner */}
          {issue.isArchived && (
            <div className="flex items-center justify-between bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-md">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-yellow-700 text-sm">
                  Archived by {issue.archivedByUser?.fullName || "Unknown"} on {issue.archivedAt ? new Date(issue.archivedAt).toLocaleDateString() : "Unknown Date"}. Read-only.
                </span>
              </div>
              <button className="flex items-center gap-1 px-2.5 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs font-semibold rounded transition-colors">
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
              className="w-full text-2xl font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 border-2 border-[#0052CC] rounded px-2 py-1 outline-none"
            />
          ) : (
            <h1
              onClick={() => { if (!issue.isArchived) setIsEditingTitle(true); }}
              className={`text-2xl font-semibold text-gray-900 dark:text-white leading-snug rounded px-1 -ml-1 transition-colors ${issue.isArchived ? "opacity-80" : "hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"}`}
            >
              {localTitle}
            </h1>
          )}

          {/* Description */}
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Description</h2>
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

          {/* Subtasks */}
          <div>
            {/*<h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Subtasks</h2>*/}
            <TaskSubtasks
              subtasks={subtasks}
              onAdd={handleAddSubtask}
              onUpdateStatus={handleUpdateSubtaskStatus}
            />
          </div>

          {/* Linked Work Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Linked work items</h2>
              <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                <Plus className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No linked items yet</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/docs/create?issueId=${issue.id}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0052CC] hover:bg-[#357BFF] text-white text-sm font-medium rounded transition-colors ${issue.isArchived ? "pointer-events-none opacity-50" : ""}`}
                >
                  <Plus className="w-3.5 h-3.5" /> Create Document
                </Link>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded transition-colors">
                  <LinkIcon className="w-3.5 h-3.5" /> Link item
                </button>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Activity</h2>
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <span>Show:</span>
                {(["comments", "history"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded transition-colors capitalize ${activeTab === tab
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
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
        <div className="w-72 shrink-0 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-[#22272B] p-4 space-y-5">

          {/* Status + Automations + Improve Task */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <button
                onClick={() => { if (!issue.isArchived) setShowStatusDropdown(!showStatusDropdown); }}
                disabled={issue.isArchived}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-semibold rounded transition-colors ${issue.isArchived ? "opacity-70 cursor-not-allowed" : "hover:bg-gray-300 dark:hover:bg-gray-600"}`}
              >
                {statusDisplayName}
                {!issue.isArchived && <ChevronDown className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />}
              </button>
              {showStatusDropdown && (
                <div className="absolute top-full mt-1 left-0 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden z-10 py-1">
                  {statusColumns.map((column) => (
                    <button
                      key={column.id}
                      onClick={() => handleStatusChange(column)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${column.id === currentColumn?.id
                          ? "bg-gray-100 dark:bg-gray-700 text-[#0052CC] font-medium border-l-2 border-[#0052CC]"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                    >
                      {column.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Details collapsible */}
          <div>
            <button
              onClick={() => setDetailsOpen((o) => !o)}
              className="w-full flex items-center justify-between py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <div className="flex items-center gap-1.5">
                {detailsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span>Details</span>
              </div>
              <Settings className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {detailsOpen && (
              <div className="mt-1 space-y-0.5">

                {/* Assignee */}
                <DetailRow label="Assignee">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 p-1 -ml-1 rounded cursor-pointer transition-colors">
                      <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center shrink-0">
                        <User className="w-3 h-3 text-gray-500 dark:text-gray-300" />
                      </div>
                      <span className="truncate">{assigneeName}</span>
                    </div>
                    <a href="#" className="text-xs text-[#0052CC] hover:underline block px-1">Assign to me</a>
                  </div>
                </DetailRow>

                {/* Priority */}
                <DetailRow label="Priority">
                  <div className={`flex items-center gap-1.5 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 p-1 -ml-1 rounded cursor-pointer transition-colors ${priorityColor}`}>
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-current opacity-80" />
                    {issue.priority}
                  </div>
                </DetailRow>

                {/* Parent */}
                <DetailRow label="Parent">
                  <div className="text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 p-1 -ml-1 rounded cursor-pointer transition-colors">None</div>
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
                    <div className="text-sm text-gray-900 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 p-1 -ml-1 rounded cursor-pointer transition-colors">{sprintLabel}</div>
                  </DetailRow>
                )}

                {/* Story point estimate */}
                <DetailRow label="Story point estimate">
                  <div className="text-sm text-gray-900 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 p-1 -ml-1 rounded cursor-pointer transition-colors">{storyPointsLabel}</div>
                </DetailRow>

                {/* Reporter */}
                <DetailRow label="Reporter">
                  <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 p-1 -ml-1 rounded cursor-pointer transition-colors">
                    <div className="w-5 h-5 rounded-full bg-[#0052CC] flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                      {reporterName.substring(0, 1).toUpperCase()}
                    </div>
                    <span className="truncate">{reporterName}</span>
                  </div>
                </DetailRow>

              </div>
            )}
          </div>

          {/* Meta */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 text-xs text-gray-400 dark:text-gray-500 space-y-1">
            <p>Created {formatDateTime(issue.createdAt)}</p>
            <p>Updated {formatDateTime(issue.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
