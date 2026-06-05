"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  X,
  MoreHorizontal, Plus, Link as LinkIcon,
  FileText, ChevronDown, Settings,
  Zap, User, Archive, AlertTriangle, ArchiveRestore
} from 'lucide-react';
import Link from 'next/link';
import { TaskDetailResponse } from '../types/task-detail.type';
import TaskDescription from "@/modules/admin/components/common/components/TaskDescription";
import TaskActivityHistory from "./TaskActivityHistory";
import TaskComments from "./TaskComments";
import TaskAttachmentsPanel from "./attachments/TaskAttachmentsPanel";
import TaskCoverBanner from "./covers/TaskCoverBanner";
import TaskLabelsField from "./labels/TaskLabelsField";
import type { TaskCover } from "../types/task-cover.type";
import { resolveTaskStatusColumn, type TaskStatusColumn } from "../utils/taskStatusColumns";
import { useAuth } from "@/context/AuthContext";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import CustomDatePicker from "@/common/components/CustomDatePicker";

interface TaskDetailDrawerProps {
  isOpen: boolean;
  issue: TaskDetailResponse | any;
  workspaceId: string;
  workspaceMembers?: WorkspaceMember[];
  sprints?: SprintOption[];
  boardColumns?: TaskStatusColumn[];
  workspaceTemplate?: "kanban" | "scrum";
  onClose: () => void;
  onUpdateIssue?: (updatedIssue: any) => void;
  onArchiveIssue?: (issue: any) => void;
  detailUrl?: string;
  /** Embedded in split list view: no overlay, no fixed positioning */
  embedded?: boolean;
}

const getUserDisplayName = (user: any, fallback?: string | null) => {
  if (typeof user === 'string') return user;
  return user?.fullName || user?.email || fallback || 'Unassigned';
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
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
  onArchiveIssue,
  embedded = false,
}: TaskDetailDrawerProps) {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
  const [localTitle, setLocalTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
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

  // Resize state
  const [drawerWidth, setDrawerWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = window.innerWidth - e.clientX;
      const maxWidth = window.innerWidth * 0.5;
      if (newWidth < 300) newWidth = 300;
      if (newWidth > maxWidth) newWidth = maxWidth;
      setDrawerWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    if (issue) {
      setLocalTitle(issue.title);
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
  const { statusColumns, currentColumn, displayName: statusDisplayName } =
    resolveTaskStatusColumn(boardColumns, issue);
  const assigneeName =
    issue.assigneeDisplayName ||
    getUserDisplayName(issue.assignee, issue.assigneeId);
  const reporterName = getUserDisplayName(issue.reporter, issue.reporterId);
  const sprintLabel =
    issue.sprint?.name ||
    sprints.find((sprint) => (sprint._id || sprint.id) === issue.sprintId)?.name ||
    'None';
  const showSprintField = workspaceTemplate === "scrum";
  const storyPointsLabel =
    issue.storyPoints === null || issue.storyPoints === undefined
      ? 'None'
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
    "text-[13px] text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] p-1 -ml-1 rounded-[4px] cursor-pointer transition-colors";

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
        className="w-full rounded-[4px] border border-[#2563EB] bg-white dark:bg-[#2A2A2A] px-2 py-1 text-[13px] text-[#111111] dark:text-[#E8E8E7] outline-none"
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
        className="w-full rounded-[4px] border border-[#2563EB] bg-white dark:bg-[#2A2A2A] px-2 py-1 text-[13px] text-[#111111] dark:text-[#E8E8E7] outline-none"
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

  const handleStatusChange = (column: TaskStatusColumn) => {
    setShowStatusDropdown(false);
    if ((column.id !== issue.columnId || column.name !== issue.status) && onUpdateIssue) {
      onUpdateIssue({ ...issue, columnId: column.id, status: column.name });
    }
  };


  const panelClasses = embedded
    ? "relative z-0 flex flex-col h-full min-h-0 w-full max-w-none bg-white dark:bg-[#202020] text-[#787774] dark:text-[#9B9A97] shadow-none border-0 rounded-none overflow-hidden"
    : `fixed top-0 right-0 bottom-0 z-[99999] bg-white dark:bg-[#202020] text-[#787774] dark:text-[#9B9A97] flex flex-col border-l border-[#EAEAEA] dark:border-white/[0.06] transform ${isResizing ? '' : 'transition-transform duration-300 ease-in-out'} ${
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

      <div className={panelClasses} style={{ width: embedded ? '100%' : `${drawerWidth}px` }}>
        {!embedded && (
          <div
            className={`absolute top-0 left-0 bottom-0 w-1.5 -ml-[3px] cursor-col-resize z-[100000] hover:bg-[#2563EB]/30 transition-colors ${isResizing ? 'bg-[#2563EB]/50' : 'bg-transparent'}`}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
            }}
          />
        )}

        {/* Top Header */}
        <div className="app-header border-b border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-between shrink-0 bg-[#F7F6F3] dark:bg-[#252525]">
          <div className="flex items-center gap-2 text-[13px] font-medium">
            <div className="flex items-center gap-2 hover:bg-[#F0F0EE] dark:hover:bg-[#2E2E2E] px-2 py-1 rounded-[4px] cursor-pointer transition-colors">
              <div className="w-5 h-5 bg-[#2563EB] dark:bg-[#3B82F6] rounded-[4px] text-white flex items-center justify-center">
                <FileText className="w-3 h-3" />
              </div>
              <span className="text-[#787774] dark:text-[#9B9A97]">Add epic</span>
            </div>
            <span className="text-[#ABABAB] dark:text-[#6B6B6B]">/</span>
            <div className="flex items-center gap-2 hover:bg-[#F0F0EE] dark:hover:bg-[#2E2E2E] px-2 py-1 rounded-[4px] cursor-pointer transition-colors">
              <div className="w-4 h-4 bg-[#2563EB] dark:bg-[#3B82F6] text-white flex items-center justify-center rounded-[3px]">
                <span className="text-[10px]">✓</span>
              </div>
              <span className="text-[#111111] dark:text-[#E8E8E7]">{issueKey}</span>
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
                      onArchiveIssue?.(issue);
                    }}
                    disabled={!onArchiveIssue || issue.isArchived}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[#111111] dark:text-[#E8E8E7] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Archive className="h-4 w-4 text-[#787774]" />
                    Archive
                  </button>
                </div>
              )}
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-[#202020]">
          <div className="p-4 md:p-6 space-y-8">

            {/* Archived Banner */}
            {issue.isArchived && (
              <div className="flex items-center justify-between bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-[6px]">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-yellow-700 text-[13px] font-medium">
                    This task was archived by {issue.archivedByUser?.fullName || 'Unknown'} on {issue.archivedAt ? new Date(issue.archivedAt).toLocaleDateString() : 'Unknown Date'}. It is currently read-only.
                  </span>
                </div>
                <button
                  onClick={() => { console.log("Restore triggered") }}
                  className="flex items-center px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-[13px] font-semibold rounded-[6px] transition-colors"
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
                  onKeyDown={(e) => { if (e.key === 'Enter') handleTitleBlur(); }}
                  className="w-full text-2xl font-semibold text-[#111111] dark:text-[#E8E8E7] bg-[#F7F6F3] dark:bg-[#2A2A2A] border-2 border-[#2563EB] rounded-[6px] px-2 py-1 outline-none mb-4"
                />
              ) : (
                <h1
                  onClick={() => { if (!issue.isArchived) setIsEditingTitle(true); }}
                  className={`text-2xl font-semibold text-[#111111] dark:text-[#E8E8E7] leading-tight mb-4 p-2 -ml-2 rounded-[6px] transition-colors ${issue.isArchived ? 'opacity-90' : 'hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] cursor-pointer'}`}
                >
                  {localTitle}
                </h1>
              )}
            </div>

            {/* Status */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => { if (!issue.isArchived) setShowStatusDropdown(!showStatusDropdown); }}
                  disabled={issue.isArchived}
                  className={`flex items-center gap-2 px-4 py-2 bg-[#F7F6F3] dark:bg-[#2A2A2A] text-[#111111] dark:text-[#E8E8E7] text-[13px] font-semibold rounded-[6px] transition-colors ${issue.isArchived ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#F0F0EE] dark:hover:bg-[#333333]'}`}
                >
                  {statusDisplayName} {!issue.isArchived && <ChevronDown className="w-4 h-4 text-[#ABABAB]" />}
                </button>
                {showStatusDropdown && (
                  <div
                    className="absolute top-full mt-1 left-0 w-40 bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] overflow-hidden z-10 py-1"
                    style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)" }}
                  >
                    {statusColumns.map((column) => (
                      <button
                        key={column.id}
                        onClick={() => handleStatusChange(column)}
                        className={`w-full text-left px-4 py-2 text-[13px] transition-colors ${column.id === currentColumn?.id ? 'bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] font-medium border-l-2 border-[#2563EB]' : 'text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]'}`}
                      >
                        {column.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] bg-white dark:bg-[#202020] overflow-hidden">
              <div className="w-full flex items-center justify-between p-3 text-[13px] font-semibold text-[#111111] dark:text-[#E8E8E7] bg-[#F9F9F8] dark:bg-[#252525] border-b border-[#EAEAEA] dark:border-white/[0.06]">
                Details
              </div>
              <div className="p-4 flex flex-col space-y-2">
                {/* Assignee */}
                <div className="flex items-center min-h-[32px]">
                  <div className="text-[13px] font-medium text-[#787774] dark:text-[#9B9A97] w-32 shrink-0">Assignee</div>
                  <div
                    onDoubleClick={() => startInlineEdit("assigneeId", getIssueAssigneeId(issue))}
                    title="Double click to edit"
                    className="flex min-w-0 flex-1 items-center gap-2 text-[13px] text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] p-1 -ml-1 rounded-[4px] cursor-pointer transition-colors"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#EAEAEA] dark:bg-[#2A2A2A] flex items-center justify-center">
                      <User className="w-3 h-3 text-[#787774] dark:text-[#9B9A97]" />
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
                        className="min-w-0 flex-1 rounded-[4px] border border-[#2563EB] bg-white dark:bg-[#2A2A2A] px-2 py-1 text-[13px] text-[#111111] dark:text-[#E8E8E7] outline-none"
                      >
                        <option value="">Unassigned</option>
                        {memberOptions.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.email ? `${member.label} (${member.email})` : member.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="truncate">{assigneeName}</span>
                    )}
                  </div>
                </div>

                {/* Reporter */}
                <div className="flex items-center min-h-[32px]">
                  <div className="text-[13px] font-medium text-[#787774] dark:text-[#9B9A97] w-32 shrink-0">Reporter</div>
                  <div className="flex items-center gap-2 text-[13px] text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] p-1 -ml-1 rounded-[4px] cursor-pointer transition-colors">
                    <div className="w-5 h-5 rounded-full bg-orange-200 dark:bg-orange-800 flex items-center justify-center text-orange-700 dark:text-orange-300 font-bold text-[10px]">
                      {reporterName.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="truncate">{reporterName}</span>
                  </div>
                </div>

                {/* Type */}
                <div className="flex items-center min-h-[32px]">
                  <div className="text-[13px] font-medium text-[#787774] dark:text-[#9B9A97] w-32 shrink-0">Type</div>
                  <div className="min-w-0 flex-1">
                    {renderInlineSelect("type", issue.type, ["Task", "Story", "Bug", "Epic"])}
                  </div>
                </div>

                {/* Priority */}
                <div className="flex items-center min-h-[32px]">
                  <div className="text-[13px] font-medium text-[#787774] dark:text-[#9B9A97] w-32 shrink-0">Priority</div>
                  <div className="min-w-0 flex-1">
                    {renderInlineSelect("priority", issue.priority, ["Lowest", "Low", "Medium", "High", "Highest"])}
                  </div>
                </div>

                {/* Labels */}
                <div className="flex items-start min-h-[32px]">
                  <div className="text-[13px] font-medium text-[#787774] dark:text-[#9B9A97] w-32 shrink-0 pt-1.5">Labels</div>
                  <div className="min-w-0 flex-1">
                    <TaskLabelsField
                      workspaceId={workspaceId}
                      issue={issue}
                      disabled={issue.isArchived}
                    />
                  </div>
                </div>

                {/* Start date */}
                <div className="flex items-center min-h-[32px]">
                  <div className="text-[13px] font-medium text-[#787774] dark:text-[#9B9A97] w-32 shrink-0">Start date</div>
                  <div className="min-w-0 flex-1">
                    {renderDateInput("startDate", toDateInputValue(issue.startDate))}
                  </div>
                </div>

                {/* Due date */}
                <div className="flex items-center min-h-[32px]">
                  <div className="text-[13px] font-medium text-[#787774] dark:text-[#9B9A97] w-32 shrink-0">Due date</div>
                  <div className="min-w-0 flex-1">
                    {renderDateInput("dueDate", toDateInputValue(issue.dueDate))}
                  </div>
                </div>

                {showSprintField && (
                  <div className="flex items-center min-h-[32px]">
                    <div className="text-[13px] font-medium text-[#787774] dark:text-[#9B9A97] w-32 shrink-0">Sprint</div>
                    <div className="min-w-0 flex-1">
                      {renderInlineInput("sprintId", sprintLabel, issue.sprintId)}
                    </div>
                  </div>
                )}

                {/* Story points */}
                <div className="flex items-center min-h-[32px]">
                  <div className="text-[13px] font-medium text-[#787774] dark:text-[#9B9A97] w-32 shrink-0">Story points</div>
                  <div className="min-w-0 flex-1">
                    {renderInlineInput("storyPoints", storyPointsLabel, issue.storyPoints, "number")}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-[13px] font-semibold text-[#111111] dark:text-[#E8E8E7]">Description</h3>
              <div className="pl-1">
                <TaskDescription
                  initialContent={issue.description || ''}
                  onSave={(newDesc: string) => {
                    if (onUpdateIssue && !issue.isArchived) {
                      onUpdateIssue({ ...issue, description: newDesc });
                    }
                  }}
                />
              </div>
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
            <div className="space-y-3 pt-2">
              <h3 className="text-[13px] font-semibold text-[#111111] dark:text-[#E8E8E7]">Linked work items</h3>
              <div className="bg-[#F9F9F8] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[13px] text-[#787774] dark:text-[#9B9A97]">No linked items yet</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/docs/create?issueId=${issue.id}`}
                    className={`inline-flex items-center gap-2 px-3 py-2 bg-[#2563EB] dark:bg-[#3B82F6] hover:bg-[#1D4ED8] text-white text-[13px] font-semibold rounded-[6px] transition-colors ${issue.isArchived ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    <Plus className="w-4 h-4" /> Create Document
                  </Link>
                  <button className="inline-flex items-center gap-2 px-3 py-2 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] text-[#111111] dark:text-[#E8E8E7] text-[13px] font-medium rounded-[6px] transition-colors">
                    <LinkIcon className="w-4 h-4 text-[#787774]" /> Link item
                  </button>
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className="space-y-4 pt-6 border-t border-[#EAEAEA] dark:border-white/[0.06]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-[13px] font-semibold text-[#111111] dark:text-[#E8E8E7]">Activity</h3>
                <div className="flex items-center gap-1 text-[13px] bg-[#F7F6F3] dark:bg-white/5 p-1 rounded-[6px]">
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`px-4 py-1.5 rounded-[4px] font-medium transition-colors ${activeTab === 'comments' ? 'bg-white dark:bg-[#2A2A2A] text-[#111111] dark:text-[#E8E8E7]' : 'text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7]'}`}
                  >Comments</button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-1.5 rounded-[4px] font-medium transition-colors ${activeTab === 'history' ? 'bg-white dark:bg-[#2A2A2A] text-[#111111] dark:text-[#E8E8E7]' : 'text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7]'}`}
                  >History</button>
                </div>
              </div>

              <div className="pt-2">
                {activeTab === 'comments' && (
                  <TaskComments
                    workspaceId={workspaceId}
                    taskId={issue.id}
                    isArchived={issue.isArchived ?? false}
                    isDeleted={issue.isDeleted ?? false}
                  />
                )}
                {activeTab === 'history' && (
                  <TaskActivityHistory workspaceId={workspaceId} taskId={issue.id} taskKey={issue.key} />
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="text-[11px] text-[#ABABAB] dark:text-[#6B6B6B] flex items-center justify-center gap-4 pt-4 pb-8">
              <span>Created: {formatDateTime(issue.createdAt)}</span>
              <span>•</span>
              <span>Updated: {formatDateTime(issue.updatedAt)}</span>
            </div>

          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #EAEAEA; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #C8C7C4; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}} />
    </>
  );
}
