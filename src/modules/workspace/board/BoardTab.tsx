"use client";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Filters } from "@/modules/workspace/shared/types/filter.type";
import { Issue } from "@/modules/workspace/shared/types/issue.type";
import { Workspace } from "@/modules/workspace/shared/types/workspace.type";
import { BoardColumn } from "@/modules/workspace/shared/types/board.type";
import { Sprint } from "@/modules/workspace/shared/types/sprint.type";
import type { TaskCover } from "@/modules/workspace/shared/types/task-cover.type";
import DeleteColumnModal from "@/modules/workspace/shared/components/DeleteColumnModal";
import BoardFilters from "@/modules/workspace/shared/components/BoardFilters";
import BoardTaskActionMenu from "@/modules/workspace/tasks/covers/BoardTaskActionMenu";
import TaskLabelModal from "@/modules/workspace/tasks/labels/TaskLabelModal";
import { compareIssueRank } from "@/modules/workspace/shared/utils/dragUtils";

import {
  Check,
  MoreHorizontal,
  Plus,
  Trash2,
  X,
  PlayCircle,
} from "lucide-react";
import AssigneePicker from "@/shared/components/AssigneePicker";
import type { AssigneePickerUser } from "@/shared/components/AssigneePicker";

const normalizeObjectId = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") {
    const objectIdMatch = value.match(/^ObjectId\(['"]?(.+?)['"]?\)$/);
    return objectIdMatch?.[1] ?? value;
  }
  if (typeof value === "object") {
    const obj = value as { _id?: unknown; id?: unknown; $oid?: unknown; toString?: () => string };
    if (obj.$oid) return normalizeObjectId(obj.$oid);
    if (obj._id) return normalizeObjectId(obj._id);
    if (obj.id) return normalizeObjectId(obj.id);
    const stringValue = obj.toString?.();
    if (stringValue && stringValue !== "[object Object]") return normalizeObjectId(stringValue);
  }
  return "";
};

const getInitials = (value: string) =>
  (value || "?")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

type BoardTabProps = {
  data: {
    columns: BoardColumn[];
    issues: Issue[];
    filteredIssues: Issue[];
    uniqueAssignees: AssigneePickerUser[];
    workspace: Workspace;
    activeSprint?: Sprint | null;
  };

  ui: {
    filters: Filters;
    newIssueForm: { title: string; status?: string; columnId?: string; sprintId?: string | null };
    showCreateColumn: boolean;
    newColumnName: string;
    isFetching?: boolean;
  };

  actions: {
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    setColumns: React.Dispatch<React.SetStateAction<BoardColumn[]>>;
    setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;

    setSelectedIssue: (issue: Issue | null) => void;

    setNewIssueForm: React.Dispatch<React.SetStateAction<{ title: string; status?: string; columnId?: string; sprintId?: string | null }>>;
    setShowCreateIssue: React.Dispatch<React.SetStateAction<boolean>>;

    setShowCreateColumn: React.Dispatch<React.SetStateAction<boolean>>;
    setNewColumnName: React.Dispatch<React.SetStateAction<string>>;

    handleBoardDragEnd: () => void;
    handleBoardDragStart?: () => void;
    handleAddColumn: () => void;
    handleRenameColumn: (columnId: string, name: string) => void;
    handleDeleteColumn: (columnId: string, migrateTo?: string) => void;
    handleMoveColumn: (columnId: string, newOrder: number) => void;
    updateIssueDirectly: (issueId: string, updates: Partial<Issue>) => void;
    onArchiveIssue?: (issue: Issue) => void;
    onDeleteIssue?: (issue: Issue) => void;
  };

  refs: {
    columnsEndRef: React.RefObject<HTMLDivElement | null>;
  };

  permissions?: {
    canCreateTask: boolean;
    canEditTask?: boolean;
    canMoveTask: boolean;
    canUpdateWorkspace: boolean;
    canArchiveTask?: boolean;
  };
};

export default function BoardTab({ data, ui, actions, refs, permissions }: BoardTabProps) {
  const { columns, issues, filteredIssues, uniqueAssignees, workspace, activeSprint } = data;

  const visibleIssues = workspace.type === "scrum" && activeSprint
    ? filteredIssues.filter(i => i.sprintId === activeSprint._id)
    : filteredIssues;
  const { filters, newIssueForm, showCreateColumn, newColumnName } = ui;
  const {
    setFilters,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setColumns: _setColumns,
    setIssues,
    setSelectedIssue,

    setNewIssueForm,
    setShowCreateIssue,

    setShowCreateColumn,
    setNewColumnName,

    handleBoardDragEnd,
    handleBoardDragStart,
    handleAddColumn,
    handleRenameColumn,
    handleDeleteColumn,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleMoveColumn: _handleMoveColumn,
    updateIssueDirectly,
    onArchiveIssue,
    onDeleteIssue,
  } = actions;
  const { columnsEndRef } = refs;
  const canCreateTask = permissions?.canCreateTask ?? true;
  const canEditTask = permissions?.canEditTask ?? true;
  const canMoveTask = permissions?.canMoveTask ?? true;
  const canUpdateWorkspace = permissions?.canUpdateWorkspace ?? true;
  const canArchiveTask = permissions?.canArchiveTask ?? true;

  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<BoardColumn | null>(null);
  const [actionMenuIssueId, setActionMenuIssueId] = useState<string | null>(null);
  const [actionMenuAnchorRect, setActionMenuAnchorRect] = useState<DOMRect | null>(null);
  const [labelModalIssue, setLabelModalIssue] = useState<Issue | null>(null);
  const [issueToDelete, setIssueToDelete] = useState<Issue | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const actionMenuRef = useRef<HTMLDivElement>(null);

  const workspaceMembers = useMemo(() => {
    return (workspace.members ?? [])
      .map((member) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = member.userId as any;
        const id = typeof user === "string" ? normalizeObjectId(user) : normalizeObjectId(user);
        const email = typeof user === "string" ? "" : user?.email ?? "";
        const name = typeof user === "string" ? id : user?.fullName || user?.name || email || id;
        const avatar = typeof user === "string" ? undefined : user?.avatar || user?.avatarUrl || user?.image;

        return {
          id,
          name: name || "Member",
          email,
          role: member.role,
          avatar,
          initials: getInitials(name || email || id || "?"),
        };
      })
      .filter((member) => member.id);
  }, [workspace.members]);

  const getReadonlyAssignee = (issue: Issue) => {
    const assigneeId = normalizeObjectId(issue.assigneeId ?? issue.assignee);
    if (!assigneeId || assigneeId === "U") return null;

    const member = workspaceMembers.find((item) => {
      return item.id === assigneeId || item.email === assigneeId;
    });

    if (member) return member;

    const displayName = issue.assigneeDisplayName && issue.assigneeDisplayName !== assigneeId
      ? issue.assigneeDisplayName
      : assigneeId;

    return {
      id: assigneeId,
      name: displayName,
      email: "",
      avatar: issue.assigneeAvatar,
      initials: getInitials(displayName),
    };
  };

  const renderReadonlyAssignee = (issue: Issue) => {
    const assignee = getReadonlyAssignee(issue);

    if (!assignee) {
      return (
        <span className="max-w-[8rem] truncate text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">
          Unassigned
        </span>
      );
    }

    return (
      <div
        className="flex min-w-0 max-w-[9rem] items-center gap-1.5"
        title={assignee.email ? `${assignee.name} (${assignee.email})` : assignee.name}
      >
        <div className={`h-5 w-5 shrink-0 overflow-hidden rounded-full ${assignee.avatar ? "" : "bg-[#2563EB] text-white"} flex items-center justify-center text-[0.5625rem] font-bold`}>
          {assignee.avatar ? (
            <img src={assignee.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            assignee.initials
          )}
        </div>
        <span className="truncate text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">
          {assignee.name}
        </span>
      </div>
    );
  };


  const patchIssueCover = (issueId: string, cover: TaskCover | null) => {
    setIssues((current) =>
      current.map((item) => (item.id === issueId ? { ...item, cover } : item)),
    );
  };

  const issueMatchesColumn = (issue: Issue, col: BoardColumn) => {
    return issue.columnId ? issue.columnId === col.id : col.mappedStatuses?.includes(issue.status);
  };


  const issuesByColumnId = useMemo(() => {
    const assignedIssueIds = new Set<string>();
    const next = new Map<string, Issue[]>();

    columns.forEach((column) => {
      const columnIssues = visibleIssues
        .filter((issue) => {
          if (assignedIssueIds.has(issue.id)) return false;
          if (!issueMatchesColumn(issue, column)) return false;
          assignedIssueIds.add(issue.id);
          return true;
        })
        .sort(compareIssueRank);

      next.set(column.id, columnIssues);
    });

    return next;
  }, [columns, visibleIssues]);

  const getColumnIssues = (column: BoardColumn) => issuesByColumnId.get(column.id) ?? [];

  const closeDeleteIssueModal = () => {
    setIssueToDelete(null);
    setDeleteConfirmText("");
  };

  const confirmDeleteIssue = () => {
    if (!issueToDelete || deleteConfirmText !== "delete") return;
    onDeleteIssue?.(issueToDelete);
    closeDeleteIssueModal();
  };

  const handleLabelSaved = (updatedIssue: Issue) => {
    setIssues((current) =>
      current.map((item) => (item.id === updatedIssue.id ? updatedIssue : item)),
    );
  };

  if (workspace.type === "scrum" && !activeSprint) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] rounded-full flex items-center justify-center mb-4">
          <PlayCircle className="w-8 h-8 text-[#2563EB] dark:text-[#60A5FA]" />
        </div>
        <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7] mb-2">
          No active sprint
        </h3>
        <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
          Start a sprint from the Backlog tab to view the board
        </p>
        <Link
          href={`/workspaces/${workspace.key}/backlog`}
          className="mt-5 inline-flex items-center gap-2 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 dark:focus:ring-offset-[#202020]"
        >
          Go to backlog

        </Link>
      </div>
    );
  }

  const activeActionIssue = actionMenuIssueId
    ? issues.find((item) => item.id === actionMenuIssueId) ?? null
    : null;

  return (
    <div className="flex flex-col gap-0.5 relative">
      {filters.archived && (
        <div className="absolute top-0 right-[var(--workspace-surface-pad)] mt-2 bg-[#FDEBEC] text-[#9F2F2D] px-3 py-1 rounded-[4px] text-[0.6875rem] font-bold z-10">
          Archived View - Read Only
        </div>
      )}

      {/* Quick Filters */}
      <BoardFilters
        filters={filters}
        setFilters={setFilters}
        uniqueAssignees={uniqueAssignees}
      />

      <DragDropContext onBeforeDragStart={handleBoardDragStart} onDragEnd={handleBoardDragEnd}>
        <Droppable
          droppableId="board-columns"
          direction="horizontal"
          type="column"
        >
          {(provided) => (
            <div
              className="workspace-board-height flex overflow-x-auto pt-2 px-[var(--workspace-surface-pad)] pb-[var(--workspace-surface-pad)]"
              style={{ gap: "var(--workspace-board-gap)" }}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {columns.map((column, index) => (
                <Draggable
                  key={column.id}
                  draggableId={`col-${column.id}`}
                  index={index}
                  isDragDisabled={filters.archived || !canUpdateWorkspace}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="workspace-column flex-shrink-0 bg-[#F9F9F8] dark:bg-[#252525] rounded-[8px] flex flex-col max-h-full border border-[#EAEAEA] dark:border-white/[0.06] group/column overflow-hidden"
                    >
                      <div
                        {...(filters.archived ? {} : provided.dragHandleProps)}
                        className={`p-3 border-b border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-between bg-[#F7F6F3] dark:bg-[#2A2A2A] rounded-t-[8px] ${filters.archived ? "" : "cursor-grab active:cursor-grabbing"} group/header`}
                        onDoubleClick={() => {
                          if (filters.archived) return;
                          setEditingColumnId(column.id);
                          setEditingName(column.name);
                        }}
                      >
                        {editingColumnId === column.id ? (
                          <input
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleRenameColumn(column.id, editingName);
                                setEditingColumnId(null);
                              }
                              if (e.key === "Escape") setEditingColumnId(null);
                            }}
                            onBlur={() => setEditingColumnId(null)}
                            className="w-full text-[0.8125rem] font-semibold px-2 py-1 border border-[#2563EB] rounded-[4px] bg-white dark:bg-[#2A2A2A] text-[#111111] dark:text-[#E8E8E7] outline-none"
                          />
                        ) : (
                          <h3 className="font-semibold text-[#787774] dark:text-[#9B9A97] text-[0.6875rem] uppercase tracking-[0.06em] flex items-center gap-2">
                            {column.name}
                            <span className="w-4 h-4 rounded-full bg-[#EAEAEA] dark:bg-[#2A2A2A] text-[#787774] dark:text-[#9B9A97] flex items-center justify-center text-[0.625rem] font-bold">
                              {getColumnIssues(column).length}
                            </span>
                          </h3>
                        )}
                        {!filters.archived && (canUpdateWorkspace || canCreateTask) && (
                          <div className="flex gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                            {canUpdateWorkspace && (
                              <button
                                onClick={() => {
                                  setColumnToDelete(column);
                                  setDeleteModalOpen(true);
                                }}
                                className="p-1 hover:bg-[#FDEBEC] dark:hover:bg-[rgba(159,47,45,0.15)] text-[#9F2F2D] rounded-[4px] transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            
                          </div>
                        )}
                      </div>

                      <Droppable droppableId={column.id} type="task">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`p-3 flex-1 overflow-y-auto space-y-3 min-h-[9.375rem] transition-colors ${snapshot.isDraggingOver ? "bg-[#EFF6FF]/40 dark:bg-[rgba(37,99,235,0.08)]" : ""}`}
                          >
                            {getColumnIssues(column)
                              .map((issue, issueIndex) => (
                                <Draggable
                                  key={issue.id}
                                  draggableId={issue.id}
                                  index={issueIndex}
                                  isDragDisabled={filters.archived || !canMoveTask}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...(filters.archived ? {} : provided.draggableProps)}
                                      {...(filters.archived ? {} : provided.dragHandleProps)}
                                      onClick={() => {
                                        if (filters.archived) return;
                                        setSelectedIssue(issue);
                                      }}
                                      className={`relative overflow-visible rounded-[8px] border bg-white dark:bg-[#202020] ${snapshot.isDragging ? "border-[#2563EB] rotate-1 z-50 relative" : "border-[#EAEAEA] dark:border-white/[0.06] hover:border-[#2563EB]/50 dark:hover:border-[#3B82F6]/40"} transition-colors ${filters.archived ? "" : "cursor-grab active:cursor-grabbing"} group`}
                                      style={
                                        filters.archived
                                          ? undefined
                                          : {
                                            ...provided.draggableProps.style,
                                            ...(snapshot.isDragging
                                              ? { boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }
                                              : {}),
                                          }
                                      }
                                    >
                                      {issue.cover?.type === "image" && (
                                        <div className="h-28 w-full overflow-hidden rounded-t-[8px] bg-[#F7F6F3] dark:bg-[#252525]">
                                          <img
                                            src={issue.cover.imageUrl}
                                            alt=""
                                            className="h-full w-full object-cover"
                                          />
                                        </div>
                                      )}
                                      {issue.cover?.type === "color" && (
                                        <div
                                          className="h-7 w-full rounded-t-[8px]"
                                          style={{ background: issue.cover.color }}
                                        />
                                      )}

                                      {!filters.archived && (
                                        <div
                                          className="absolute right-2 top-2 z-20"
                                          ref={actionMenuIssueId === issue.id ? actionMenuRef : undefined}
                                        >
                                          <button
                                            type="button"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              setActionMenuAnchorRect(event.currentTarget.getBoundingClientRect());
                                              setActionMenuIssueId((current) => current === issue.id ? null : issue.id);
                                            }}
                                            onMouseDown={(event) => event.stopPropagation()}
                                            className={`rounded-[6px] bg-white/90 dark:bg-[#202020]/80 p-1 text-[#787774] dark:text-[#9B9A97] opacity-0 transition-all hover:bg-[#F7F6F3] dark:hover:bg-[#2A2A2A] hover:text-[#111111] dark:hover:text-[#E8E8E7] group-hover:opacity-100 ${actionMenuIssueId === issue.id ? "opacity-100" : ""
                                              }`}
                                            aria-label="Task actions"
                                            title="Task actions"
                                          >
                                            <MoreHorizontal className="h-4 w-4" />
                                          </button>
                                        </div>
                                      )}
                                      <div className="p-3.5">
                                        <p className="mb-2 text-[0.8125rem] font-medium leading-snug text-[#111111] group-hover:text-[#2563EB] dark:text-[#E8E8E7] dark:group-hover:text-[#60A5FA]">
                                          {issue.title}
                                        </p>
                                        <div className="mb-3 flex flex-wrap gap-1.5">
                                          <span
                                            className={`px-2 py-0.5 rounded-[4px] text-[0.625rem] font-semibold ${issue.priority === "High" || issue.priority === "Highest" ? "bg-[#FDEBEC] text-[#9F2F2D]" : issue.priority === "Medium" ? "bg-[#FBF3DB] text-[#956400]" : "bg-[#EDF3EC] text-[#346538]"}`}
                                          >
                                            {issue.priority}
                                          </span>
                                          <span className="px-2 py-0.5 rounded-[4px] text-[0.625rem] font-semibold bg-[#EFF6FF] text-[#1F6C9F] dark:bg-[rgba(37,99,235,0.12)] dark:text-[#93C5FD]">
                                            {issue.type}
                                          </span>
                                          {(issue.labels ?? []).slice(0, 3).map((label) => (
                                            <span
                                              key={label.id}
                                              title={label.name}
                                              className="max-w-[7.5rem] truncate rounded-[4px] bg-[#EFF6FF] px-2 py-0.5 text-[0.625rem] font-semibold text-[#1F6C9F] dark:bg-[rgba(37,99,235,0.12)] dark:text-[#93C5FD]"
                                            >
                                              {label.name}
                                            </span>
                                          ))}
                                          {(issue.labels?.length ?? 0) > 3 && (
                                            <span className="rounded-[4px] bg-[#F7F6F3] px-2 py-0.5 text-[0.625rem] font-semibold text-[#787774] dark:bg-[#2A2A2A] dark:text-[#9B9A97]">
                                              +{(issue.labels?.length ?? 0) - 3}
                                            </span>
                                          )}
                                        </div>
                                        <div className="mt-auto flex items-center justify-between border-t border-[#F0F0EE] dark:border-white/[0.04] pt-2">
                                          <span className="text-[0.6875rem] font-mono font-bold text-[#ABABAB] dark:text-[#6B6B6B]">
                                            {issue.key}
                                          </span>

                                          {canEditTask && !filters.archived ? (
                                            <div onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
                                              <AssigneePicker
                                                users={workspaceMembers}
                                                value={issue.assigneeId ?? issue.assignee ?? null}
                                                onChange={uid => updateIssueDirectly(issue.id, { assigneeId: uid, assignee: uid ?? "" })}
                                                placement="auto"
                                                size="sm"
                                              />
                                            </div>
                                          ) : (
                                            renderReadonlyAssignee(issue)
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                            {provided.placeholder}
                            {!filters.archived && canCreateTask && (
                              <button
                                onClick={() => {
                                  setNewIssueForm({
                                    ...newIssueForm,
                                    status: column.name,
                                    columnId: column.id,
                                    sprintId: activeSprint?._id ?? null,
                                  });
                                  setShowCreateIssue(true);
                                }}
                                className="w-full mt-2 flex items-center gap-2 py-2 px-3 hover:bg-[#F0F0EE] dark:hover:bg-[#2E2E2E] rounded-[6px] text-[#ABABAB] hover:text-[#787774] dark:text-[#6B6B6B] dark:hover:text-[#9B9A97] transition-all duration-200 opacity-0 group-hover/column:opacity-100 text-[0.8125rem] font-medium justify-center"
                              >
                                <Plus className="w-4 h-4" /> Add new task
                              </button>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              {/* Add new column */}
              <div
                className="workspace-column flex-shrink-0 bg-transparent flex flex-col group/new-col"
                ref={columnsEndRef}
              >
                {canUpdateWorkspace && showCreateColumn ? (
                  <div className="bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] p-3">
                    <input
                      type="text"
                      autoFocus
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddColumn();
                        if (e.key === "Escape") {
                          setShowCreateColumn(false);
                          setNewColumnName("");
                        }
                      }}
                      placeholder="New column name..."
                      className="w-full px-3 py-2 border border-[#EAEAEA] dark:border-white/[0.08] bg-white dark:bg-[#2A2A2A] text-[#111111] dark:text-[#E8E8E7] rounded-[6px] text-[0.8125rem] focus:border-[#2563EB] outline-none transition-colors"
                    />
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={handleAddColumn}
                        className="flex-1 bg-[#2563EB] dark:bg-[#3B82F6] text-white text-[0.6875rem] font-medium py-1.5 rounded-[4px] hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Add column
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateColumn(false);
                          setNewColumnName("");
                        }}
                        className="flex-1 bg-[#F7F6F3] dark:bg-[#2A2A2A] text-[#787774] dark:text-[#9B9A97] text-[0.6875rem] font-medium py-1.5 rounded-[4px] hover:bg-[#F0F0EE] dark:hover:bg-[#333333] transition-colors flex items-center justify-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : canUpdateWorkspace ? (
                  <button
                    onClick={() => setShowCreateColumn(true)}
                    className="flex items-center gap-2 w-full bg-transparent hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] border-2 border-dashed border-[#EAEAEA] dark:border-white/[0.08] hover:border-[#C8C7C4] dark:hover:border-white/[0.12] rounded-[8px] p-4 text-[#ABABAB] dark:text-[#6B6B6B] hover:text-[#787774] dark:hover:text-[#9B9A97] transition-all duration-200 opacity-0 group-hover/new-col:opacity-100 text-[0.8125rem] justify-center"
                  >
                    <Plus className="w-5 h-5" /> Add new column
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {activeActionIssue && (
        <BoardTaskActionMenu
          workspaceId={workspace._id}
          workspaceKey={workspace.key}
          issue={activeActionIssue}
          columns={columns}
          anchorRect={actionMenuAnchorRect}
          canArchiveTask={canArchiveTask}
          canEditTask={canEditTask}
          onClose={() => {
            setActionMenuIssueId(null);
            setActionMenuAnchorRect(null);
          }}
          onArchiveIssue={onArchiveIssue}
          onDeleteIssue={onDeleteIssue ? (issue) => {
            setIssueToDelete(issue);
            setDeleteConfirmText("");
          } : undefined}
          onOpenLabels={(issue) => setLabelModalIssue(issue)}
          onUpdateIssue={updateIssueDirectly}
          onCoverChange={patchIssueCover}
        />
      )}

      {labelModalIssue && (
        <TaskLabelModal
          isOpen={!!labelModalIssue}
          workspaceId={workspace._id}
          issue={labelModalIssue}
          onClose={() => setLabelModalIssue(null)}
          onSaved={handleLabelSaved}
        />
      )}

      {deleteModalOpen && columnToDelete && (
        <DeleteColumnModal
          isOpen={deleteModalOpen}
          column={columnToDelete}
          columns={columns}
          hasTasks={issues.some(i => issueMatchesColumn(i, columnToDelete))}
          onClose={() => {
            setDeleteModalOpen(false);
            setColumnToDelete(null);
          }}
          onConfirm={(migrateTo) => {
            handleDeleteColumn(columnToDelete.id, migrateTo);
            setDeleteModalOpen(false);
            setColumnToDelete(null);
          }}
        />
      )}

      {issueToDelete && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/30 p-4">
          <div
            className="w-full max-w-md rounded-[10px] border border-[#EAEAEA] bg-white dark:border-white/[0.06] dark:bg-[#202020]"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#EAEAEA] dark:border-white/[0.06] p-5">
              <div>
                <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
                  Delete work item
                </h3>
                <p className="mt-1 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                  This permanently deletes {issueToDelete.key}. Archive it instead if you may need it later.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDeleteIssueModal}
                className="rounded-[6px] p-1.5 text-[#ABABAB] transition-colors hover:bg-[#F7F6F3] hover:text-[#787774] dark:hover:bg-[#2E2E2E] dark:hover:text-[#9B9A97]"
                aria-label="Close delete confirmation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 p-5">
              <label className="block text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97]">
                Type <span className="font-mono font-semibold text-[#9F2F2D]">delete</span> to confirm
              </label>
              <input
                autoFocus
                value={deleteConfirmText}
                onChange={(event) => setDeleteConfirmText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") confirmDeleteIssue();
                  if (event.key === "Escape") closeDeleteIssueModal();
                }}
                className="w-full rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.08] bg-white dark:bg-[#202020] px-3 py-2 text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] outline-none focus:border-[#9F2F2D] transition-colors"
                placeholder="delete"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-[#EAEAEA] dark:border-white/[0.06] p-4">
              <button
                type="button"
                onClick={() => {
                  const issue = issueToDelete;
                  closeDeleteIssueModal();
                  onArchiveIssue?.(issue);
                }}
                disabled={!onArchiveIssue}
                className="rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.08] bg-white dark:bg-[#252525] px-4 py-2 text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] disabled:opacity-40"
              >
                Archive
              </button>
              <button
                type="button"
                onClick={confirmDeleteIssue}
                disabled={deleteConfirmText !== "delete"}
                className="rounded-[6px] bg-[#9F2F2D] px-4 py-2 text-[0.8125rem] font-medium text-white transition-colors hover:bg-[#8A2826] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
