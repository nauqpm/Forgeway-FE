"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  X,
  MoreHorizontal,
  Plus,
  Link as LinkIcon,
  FileText,
  ChevronDown,
  Settings,
  Zap,
  User,
  Archive,
  AlertTriangle,
  ArchiveRestore,
} from "lucide-react";
import Link from "next/link";
import { TaskDetailResponse } from "../types/task-detail.type";
import TaskSubtasks from "@/modules/admin/components/common/components/TaskSubtasks";
import TimeTrackingSidebar from "@/modules/admin/components/common/components/TimeTrackingSidebar";
import TaskDescription from "@/modules/admin/components/common/components/TaskDescription";
import TaskActivityHistory from "./TaskActivityHistory";
import TaskComments from "./TaskComments";
import TaskAttachmentsPanel from "./attachments/TaskAttachmentsPanel";
import TaskCoverBanner from "./covers/TaskCoverBanner";
import TaskLabelsField from "./labels/TaskLabelsField";
import type { TaskCover } from "../types/task-cover.type";
import { useAuth } from "@/context/AuthContext";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import { useTaskDetailRealtime } from "@/hooks/realtime/use-task-detail-realtime";
import { useTaskDetailRealtimeRoom } from "@/hooks/realtime/use-task-detail-realtime-room";
import CustomDatePicker from "@/common/components/CustomDatePicker";

interface TaskDetailModalProps {
  issue: TaskDetailResponse | any;
  workspaceId: string;
  workspaceMembers?: WorkspaceMember[];
  sprints?: SprintOption[];
  workspaceTemplate?: "kanban" | "scrum";
  onClose: () => void;
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

type WorkspaceMember = {
  userId?:
    | string
    | {
        _id?: string;
        id?: string;
        fullName?: string;
        name?: string;
        email?: string;
        avatar?: string;
        avatarUrl?: string;
        image?: string;
      };
  role?: string;
};

type SprintOption = {
  _id?: string;
  id?: string;
  name?: string;
};

const toDateInputValue = (value?: string | null) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const getIssueAssigneeId = (issue: any) => {
  if (issue?.assigneeId) return String(issue.assigneeId);
  if (typeof issue?.assignee === "string") return issue.assignee === "U" ? "" : issue.assignee;
  return issue?.assignee?._id || issue?.assignee?.id || "";
};

const mapMemberOptions = (members: WorkspaceMember[]) =>
  members
    .map((member) => {
      const user = member.userId;
      if (!user || typeof user === "string") {
        return user ? { id: user, label: user } : null;
      }

      const id = user._id || user.id;
      if (!id) return null;

      return {
        id,
        label: user.fullName || user.name || user.email || id,
        email: user.email,
      };
    })
    .filter(Boolean) as Array<{ id: string; label: string; email?: string }>;

export default function TaskDetailModal({
  issue,
  workspaceId,
  workspaceMembers: providedWorkspaceMembers = [],
  sprints = [],
  workspaceTemplate = "kanban",
  onClose,
  onUpdateIssue,
  onArchiveIssue,
}: TaskDetailModalProps) {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<"comments" | "history">("comments");
  const [localTitle, setLocalTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [timeLogged, setTimeLogged] = useState(0);
  const [localCover, setLocalCover] = useState<TaskCover | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState("");

  const { data: fetchedWorkspaceMembers = [] } = useQuery<WorkspaceMember[]>({
    queryKey: ["workspaceMembers", workspaceId],
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
      setSubtasks(issue.subtasks || []);
      setTimeLogged(issue.timeLogged || 0);
      setIsEditingTitle(false);
      setShowStatusDropdown(false);
      setShowActionMenu(false);
      setLocalCover(issue.cover ?? null);
      setEditingField(null);
      setDraftValue("");
    }
  }, [issue]);

  if (!issue) return null;

  const issueKey = issue.key;
  const timeEstimated = issue.timeEstimated || "1d 4h"; // Mock default
  const assigneeName =
    issue.assigneeDisplayName ||
    getUserDisplayName(issue.assignee, issue.assigneeId);
  const reporterName = getUserDisplayName(issue.reporter, issue.reporterId);
  const sprintLabel =
    issue.sprint?.name ||
    sprints.find((sprint) => (sprint._id || sprint.id) === issue.sprintId)?.name ||
    "None";
  const boardLabel = issue.board?.name || issue.boardId || "None";
  const showSprintField = workspaceTemplate === "scrum";
  const showBoardField = false;
  const storyPointsLabel =
    issue.storyPoints === null || issue.storyPoints === undefined
      ? "None"
      : String(issue.storyPoints);
  const memberOptions = mapMemberOptions(
    providedWorkspaceMembers.length > 0 ? providedWorkspaceMembers : fetchedWorkspaceMembers,
  );

  const startInlineEdit = (field: string, value?: string | number | null) => {
    if (issue.isArchived) return;
    setEditingField(field);
    setDraftValue(value === null || value === undefined ? "" : String(value));
  };

  const cancelInlineEdit = () => {
    setEditingField(null);
    setDraftValue("");
  };

  const saveInlineEdit = (field: string, nextDraftValue = draftValue) => {
    if (!onUpdateIssue || issue.isArchived) {
      cancelInlineEdit();
      return;
    }

    const value = nextDraftValue.trim();
    const updates: Record<string, unknown> = {};

    if (field === "storyPoints") {
      updates.storyPoints = value === "" ? null : Number(value);
    } else if (field === "startDate") {
      const dueDateValue = toDateInputValue(issue.dueDate);
      if (value && dueDateValue && value > dueDateValue) {
        toast.error("Start date cannot be after due date.");
        cancelInlineEdit();
        return;
      }
      updates.startDate = value || null;
    } else if (field === "dueDate") {
      const startDateValue = toDateInputValue(issue.startDate);
      if (value && startDateValue && value < startDateValue) {
        toast.error("Due date cannot be before start date.");
        cancelInlineEdit();
        return;
      }
      updates.dueDate = value || null;
    } else if (field === "assigneeId") {
      const selectedMember = memberOptions.find((member) => member.id === value);
      updates.assigneeId = value || null;
      updates.assignee = value || "U";
      updates.assigneeDisplayName = selectedMember?.label || (value ? value : "Unassigned");
    } else if (field === "sprintId") {
      updates[field] = value || null;
    } else {
      updates[field] = value;
    }

    onUpdateIssue({ ...issue, ...updates });
    cancelInlineEdit();
  };

  const handleInlineKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    field: string,
  ) => {
    if (event.key === "Enter") saveInlineEdit(field);
    if (event.key === "Escape") cancelInlineEdit();
  };

  const editableTextClass =
    "text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 -ml-1.5 rounded cursor-pointer transition-colors";

  const renderDateInput = (field: "startDate" | "dueDate", rawValue?: string | null) => (
    <CustomDatePicker
      value={rawValue}
      onChange={(nextValue) => saveInlineEdit(field, nextValue ?? "")}
      disabled={issue.isArchived}
      inputClassName="h-8 bg-transparent dark:bg-transparent"
      ariaLabel={field === "startDate" ? "Task start date" : "Task due date"}
    />
  );

  const renderInlineInput = (
    field: string,
    displayValue: string,
    rawValue?: string | number | null,
    type: "text" | "date" | "number" = "text",
  ) =>
    editingField === field ? (
      <input
        autoFocus
        type={type}
        value={draftValue}
        onChange={(event) => setDraftValue(event.target.value)}
        onBlur={() => saveInlineEdit(field)}
        onKeyDown={(event) => handleInlineKeyDown(event, field)}
        className="w-full rounded border border-[#0052CC] bg-white px-2 py-1 text-sm text-gray-900 outline-none dark:bg-gray-900 dark:text-white"
      />
    ) : (
      <div
        onDoubleClick={() => startInlineEdit(field, rawValue ?? displayValue)}
        title="Double click to edit"
        className={editableTextClass}
      >
        {displayValue}
      </div>
    );

  const renderInlineSelect = (
    field: string,
    value: string,
    options: string[],
  ) =>
    editingField === field ? (
      <select
        autoFocus
        value={draftValue}
        onChange={(event) => setDraftValue(event.target.value)}
        onBlur={() => saveInlineEdit(field)}
        onKeyDown={(event) => handleInlineKeyDown(event, field)}
        className="w-full rounded border border-[#0052CC] bg-white px-2 py-1 text-sm text-gray-900 outline-none dark:bg-gray-900 dark:text-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    ) : (
      <div
        onDoubleClick={() => startInlineEdit(field, value)}
        title="Double click to edit"
        className={editableTextClass}
      >
        {value}
      </div>
    );

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (localTitle !== issue.title && onUpdateIssue) {
      onUpdateIssue({ ...issue, title: localTitle });
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setShowStatusDropdown(false);
    if (newStatus !== issue.status && onUpdateIssue) {
      onUpdateIssue({ ...issue, status: newStatus });
    }
  };

  const handleAddSubtask = (title: string) => {
    if (issue.isArchived) return;
    const newSubtask = {
      id: `sub-${Date.now()}`,
      title,
      status: "To Do",
      priority: "Medium",
    };
    const updatedSubtasks = [...subtasks, newSubtask];
    setSubtasks(updatedSubtasks);
    if (onUpdateIssue) {
      onUpdateIssue({ ...issue, subtasks: updatedSubtasks });
    }
  };

  const handleUpdateSubtaskStatus = (id: string, newStatus: string) => {
    if (issue.isArchived) return;
    const updatedSubtasks = subtasks.map((t) =>
      t.id === id ? { ...t, status: newStatus } : t,
    );
    setSubtasks(updatedSubtasks);
    if (onUpdateIssue) {
      onUpdateIssue({ ...issue, subtasks: updatedSubtasks });
    }
  };

  const handleLogWork = (minutes: number, description: string) => {
    if (issue.isArchived) return;
    const newLogged = timeLogged + minutes;
    setTimeLogged(newLogged);
    if (onUpdateIssue) {
      onUpdateIssue({ ...issue, timeLogged: newLogged });
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
      <div
        className="w-full max-w-[min(100%,var(--app-content-max))] h-full max-h-[90vh] bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 flex flex-col rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="app-header border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0 bg-gray-100 dark:bg-gray-800">
          <div className="flex items-center gap-2 text-sm font-medium">
            <div className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded cursor-pointer transition-colors">
              <div className="w-5 h-5 bg-[#0052CC] rounded text-white flex items-center justify-center">
                <FileText className="w-3 h-3" />
              </div>
              <span className="text-gray-500 dark:text-gray-400">Add epic</span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">/</span>
            <div className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded cursor-pointer transition-colors">
              <div className="w-4 h-4 bg-[#0052CC] text-white flex items-center justify-center rounded-sm">
                <span className="text-[10px]">✓</span>
              </div>
              <span className="text-gray-900 dark:text-white">{issueKey}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowActionMenu((open) => !open)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded transition-colors"
                aria-label="Task actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showActionMenu && (
                <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionMenu(false);
                      onArchiveIssue?.(issue);
                    }}
                    disabled={!onArchiveIssue || issue.isArchived}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <Archive className="h-4 w-4" />
                    Archive
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded transition-colors"
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
        <div className="flex flex-1 overflow-hidden">
          {/* Left Column (Main) */}
          <div className="flex-1 overflow-y-auto p-[var(--workspace-surface-pad)] md:p-[clamp(24px,2vw,40px)] border-r border-gray-200 dark:border-gray-700 space-y-8 scrollbar-thin scrollbar-thumb-[#DFE1E6] scrollbar-track-transparent">
            
            {/* Archived Banner */}
            {issue.isArchived && (
              <div className="flex items-center justify-between bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-yellow-700 text-sm font-medium">
                    This task was archived by {issue.archivedByUser?.fullName || 'Unknown'} on {issue.archivedAt ? new Date(issue.archivedAt).toLocaleDateString() : 'Unknown Date'}. It is currently read-only.
                  </span>
                </div>
                <button 
                  onClick={() => { console.log("Restore triggered") }}
                  className="flex items-center px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-sm font-semibold rounded transition-colors"
                >
                  <ArchiveRestore className="w-4 h-4 mr-1.5" />
                  Restore
                </button>
              </div>
            )}

            {/* Title */}
            <div>
              {isEditingTitle && !issue.isArchived ? (
                <input
                  autoFocus
                  type="text"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTitleBlur();
                  }}
                  className="w-full text-3xl font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 border-2 border-[#0052CC] rounded px-2 py-1 outline-none mb-4"
                />
              ) : (
                <h1
                  onClick={() => { if (!issue.isArchived) setIsEditingTitle(true); }}
                  className={`text-3xl font-semibold text-gray-900 dark:text-white leading-tight mb-4 p-2 -ml-2 rounded transition-colors ${issue.isArchived ? 'opacity-90' : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'}`}
                >
                  {localTitle}
                </h1>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Description
              </h3>
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
            {/* <TaskSubtasks
              subtasks={subtasks}
              onAdd={handleAddSubtask}
              onUpdateStatus={handleUpdateSubtaskStatus}
            /> */}

            {/* Activity */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Activity
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>Show:</span>
                  <button
                    onClick={() => setActiveTab("comments")}
                    className={`px-3 py-1 rounded font-medium transition-colors ${activeTab === "comments" ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white" : "hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                  >
                    Comments
                  </button>
                  <button
                    onClick={() => setActiveTab("history")}
                    className={`px-3 py-1 rounded transition-colors ${activeTab === "history" ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white" : "hover:bg-gray-100 dark:hover:bg-gray-700"}`}
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
                <TaskActivityHistory workspaceId={workspaceId} taskId={issue.id} taskKey={issue.key} />
              )}
            </div>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="workspace-detail-panel bg-gray-100 dark:bg-gray-800/50 p-[var(--workspace-surface-pad)] overflow-y-auto scrollbar-thin scrollbar-thumb-[#DFE1E6] scrollbar-track-transparent">
            <div className="flex items-center gap-2 mb-6">
              <div className="relative">
                <button
                  onClick={() => { if (!issue.isArchived) setShowStatusDropdown(!showStatusDropdown); }}
                  disabled={issue.isArchived}
                  className={`flex items-center gap-2 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-semibold rounded transition-colors ${issue.isArchived ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                  {issue.status} {!issue.isArchived && <ChevronDown className="w-4 h-4" />}
                </button>
                {showStatusDropdown && (
                  <div className="absolute top-full mt-1 left-0 w-40 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden z-10 py-1">
                    {["To Do", "In Progress", "Done"].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${s === issue.status ? "bg-gray-200 dark:bg-gray-700 text-[#0052CC] font-medium border-l-2 border-[#0052CC]" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg">
                <button className="w-full flex items-center justify-between p-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition-colors">
                  Details <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                  {/* Assignee */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400 pt-1">Assignee</div>
                    <div className="col-span-2 space-y-2">
                      <div
                        onDoubleClick={() => startInlineEdit("assigneeId", getIssueAssigneeId(issue))}
                        title="Double click to edit"
                        className="flex items-center gap-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 -ml-1.5 rounded cursor-pointer transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                          <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                        </div>
                        {editingField === "assigneeId" ? (
                          <select
                            autoFocus
                            value={draftValue}
                            onChange={(event) => {
                              setDraftValue(event.target.value);
                              saveInlineEdit("assigneeId", event.target.value);
                            }}
                            onBlur={cancelInlineEdit}
                            onKeyDown={(event) => handleInlineKeyDown(event, "assigneeId")}
                            className="min-w-0 flex-1 rounded border border-[#0052CC] bg-white px-2 py-1 text-sm text-gray-900 outline-none dark:bg-gray-900 dark:text-white"
                          >
                            <option value="">Unassigned</option>
                            {memberOptions.map((member) => (
                              <option key={member.id} value={member.id}>
                                {member.email ? `${member.label} (${member.email})` : member.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          assigneeName
                        )}
                      </div>
                      <a
                        href="#"
                        className="text-sm text-[#0052CC] hover:underline font-medium block"
                      >
                        Assign to me
                      </a>
                    </div>
                  </div>

                  {/* Type */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400 pt-1.5">Type</div>
                    <div className="col-span-2">
                      {renderInlineSelect("type", issue.type, ["Task", "Story", "Bug", "Epic"])}
                    </div>
                  </div>

                  {/* Reporter */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400 pt-1.5">Reporter</div>
                    <div className="col-span-2">
                      <div className="text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 -ml-1.5 rounded cursor-pointer transition-colors">
                        {reporterName}
                      </div>
                    </div>
                  </div>

                  {/* Due date */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400 pt-1.5">
                      Start date
                    </div>
                    <div className="col-span-2">
                      {renderDateInput("startDate", toDateInputValue(issue.startDate))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400 pt-1.5">
                      Due date
                    </div>
                    <div className="col-span-2">
                      {renderDateInput("dueDate", toDateInputValue(issue.dueDate))}
                    </div>
                  </div>

                  {/* Story points */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400 pt-1.5">
                      Story points
                    </div>
                    <div className="col-span-2">
                      {renderInlineInput("storyPoints", storyPointsLabel, issue.storyPoints, "number")}
                    </div>
                  </div>

                  {/* Labels */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400 pt-1.5">
                      Labels
                    </div>
                    <div className="col-span-2">
                      <TaskLabelsField
                        workspaceId={workspaceId}
                        issue={issue}
                        disabled={issue.isArchived}
                      />
                    </div>
                  </div>

                  {showSprintField && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-sm text-gray-500 dark:text-gray-400 pt-1.5">
                        Sprint
                      </div>
                      <div className="col-span-2">
                        {renderInlineInput("sprintId", sprintLabel, issue.sprintId)}
                      </div>
                    </div>
                  )}

                  {showBoardField && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-sm text-gray-500 dark:text-gray-400 pt-1.5">
                        Board
                      </div>
                      <div className="col-span-2">
                        <div className="text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 -ml-1.5 rounded cursor-pointer transition-colors">
                          {boardLabel}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Priority */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400 pt-1.5">
                      Priority
                    </div>
                    <div className="col-span-2">
                      {renderInlineSelect("priority", issue.priority, ["Lowest", "Low", "Medium", "High", "Highest"])}
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Tracking */}
              {/* <TimeTrackingSidebar
                timeEstimated={timeEstimated}
                timeLogged={timeLogged}
                onLogWork={handleLogWork}
              /> */}

              {/* Meta information */}
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>Created {formatDateTime(issue.createdAt)}</p>
                <p>Updated {formatDateTime(issue.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
