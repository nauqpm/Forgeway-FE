"use client";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Filters } from "../../types/filter.type";
import { Issue } from "../../types/issue.type";
import { Workspace } from "../../types/workspace.type";
import { BoardColumn } from "../../types/board.type";
import { Sprint } from "../../types/sprint.type";
import type { TaskCover } from "../../types/task-cover.type";
import DeleteColumnModal from "../DeleteColumnModal";
import BoardFilters from "../BoardFilters";
import BoardTaskActionMenu from "../covers/BoardTaskActionMenu";
import TaskLabelModal from "../labels/TaskLabelModal";
import { compareIssueRank } from "../../utils/dragUtils";

import {
  Check,
  MoreHorizontal,
  Plus,
  Trash2,
  X,
  PlayCircle,
  ArrowRight,
} from "lucide-react";
import AssigneePicker from "../../../../../common/components/AssigneePicker";

type BoardTabProps = {
  data: {
    columns: BoardColumn[];
    issues: Issue[];
    filteredIssues: Issue[];
    uniqueAssignees: any[];
    workspace: Workspace;
    activeSprint?: Sprint | null;
  };

  ui: {
    filters: Filters;
    newIssueForm: any;
    showCreateColumn: boolean;
    newColumnName: string;
    isFetching?: boolean;
  };

  actions: {
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    setColumns: React.Dispatch<React.SetStateAction<BoardColumn[]>>;
    setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;

    setSelectedIssue: (issue: Issue) => void;

    setNewIssueForm: any;
    setShowCreateIssue: any;

    setShowCreateColumn: any;
    setNewColumnName: any;

    handleBoardDragEnd: any;
    handleBoardDragStart?: any;
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
  const { filters, newIssueForm, showCreateColumn, newColumnName, isFetching } = ui;
  const {
    setFilters,
    setColumns,
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
    handleMoveColumn,
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
        const user = member.userId;
        const id = typeof user === "string" ? user : user._id ?? user.id ?? "";
        const name = typeof user === "string" ? user : user.fullName || user.name || user.email || id;
        const email = typeof user === "string" ? "" : user.email ?? "";
        const avatar = typeof user === "string" ? undefined : user.avatar || user.avatarUrl || user.image;

        return {
          id,
          name: name || "Member",
          email,
          role: member.role,
          avatar,
          initials: (name || email || id || "?")
            .split(/\s+/)
            .filter(Boolean)
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
        };
      })
      .filter((member) => member.id);
  }, [workspace.members]);


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
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
          <PlayCircle className="w-8 h-8 text-indigo-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No active sprint
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Start a sprint from the Backlog tab to view the board
        </p>
        <Link
          href={`/workspaces/${workspace.key}/backlog`}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
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
    <div className="flex flex-col gap-4 relative">
      {filters.archived && (
        <div className="absolute top-0 right-[var(--workspace-surface-pad)] mt-2 bg-red-100 text-red-600 px-3 py-1 rounded-md text-xs font-bold z-10">
          Archived View - Read Only
        </div>
      )}

      {isFetching && (
        <div className="pointer-events-none absolute inset-0 bg-white/50 dark:bg-gray-900/50 z-40 flex items-center justify-center backdrop-blur-[1px]">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
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
              className="workspace-board-height flex overflow-x-auto pb-[var(--workspace-surface-pad)] p-[var(--workspace-surface-pad)]"
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
                      className="workspace-column flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex flex-col max-h-full border border-gray-200 dark:border-gray-800 shadow-sm"
                    >
                      <div
                        {...(filters.archived ? {} : provided.dragHandleProps)}
                        className={`p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-100/50 dark:bg-gray-800/80 rounded-t-xl ${filters.archived ? "" : "cursor-grab active:cursor-grabbing"} group/header`}
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
                            className="w-full text-sm font-semibold px-2 py-1 border border-indigo-500 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        ) : (
                          <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide flex items-center gap-2">
                            {column.name}
                            <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center text-[10px] font-bold">
                              {getColumnIssues(column).length}
                            </span>
                          </h3>
                        )}
                        {!filters.archived && (
                          <div className="flex gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setColumnToDelete(column);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <Droppable droppableId={column.id} type="task">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`p-3 flex-1 overflow-visible space-y-3 min-h-[150px] transition-colors ${snapshot.isDraggingOver ? "bg-indigo-50/50 dark:bg-indigo-900/20" : ""}`}
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
                                      className={`relative overflow-visible rounded-lg border bg-white shadow-sm dark:bg-gray-900 ${snapshot.isDragging ? "border-indigo-500 shadow-lg rotate-2 z-50 relative" : "border-gray-200 dark:border-gray-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md"} transition-all ${filters.archived ? "" : "cursor-grab active:cursor-grabbing"} group`}
                                    >
                                      {issue.cover?.type === "image" && (
                                        <div className="h-28 w-full overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-800">
                                          <img
                                            src={issue.cover.imageUrl}
                                            alt=""
                                            className="h-full w-full object-cover"
                                          />
                                        </div>
                                      )}
                                      {issue.cover?.type === "color" && (
                                        <div
                                          className="h-7 w-full rounded-t-lg"
                                          style={{ background: issue.cover.color }}
                                        />
                                      )}

                                      {!filters.archived && (canEditTask || canArchiveTask || Boolean(onDeleteIssue)) && (
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
                                            className={`rounded-md bg-white/90 p-1 text-gray-500 opacity-0 shadow-sm transition-all hover:bg-gray-100 hover:text-gray-800 group-hover:opacity-100 dark:bg-gray-950/80 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100 ${
                                              actionMenuIssueId === issue.id ? "opacity-100" : ""
                                            }`}
                                            aria-label="Task actions"
                                            title="Task actions"
                                          >
                                            <MoreHorizontal className="h-4 w-4" />
                                          </button>
                                        </div>
                                      )}
                                      <div className="p-3.5">
                                        <p className="mb-2 text-sm font-medium leading-snug text-gray-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                                          {issue.title}
                                        </p>
                                        <div className="mb-3 flex flex-wrap gap-1.5">
                                          <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${issue.priority === "High" ? "bg-red-50 text-red-600" : issue.priority === "Medium" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}
                                          >
                                            {issue.priority}
                                          </span>
                                          <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-600`}
                                          >
                                            {issue.type}
                                          </span>
                                          {(issue.labels ?? []).slice(0, 3).map((label) => (
                                            <span
                                              key={label.id}
                                              title={label.name}
                                              className="max-w-[120px] truncate rounded bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                                            >
                                              {label.name}
                                            </span>
                                          ))}
                                          {(issue.labels?.length ?? 0) > 3 && (
                                            <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                              +{(issue.labels?.length ?? 0) - 3}
                                            </span>
                                          )}
                                        </div>
                                        <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-2 dark:border-gray-800">
                                          <span className="text-xs font-mono font-bold text-gray-400">
                                            {issue.key}
                                          </span>
                                          <div onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
                                            <AssigneePicker
                                              users={workspaceMembers}
                                              value={issue.assigneeId ?? issue.assignee ?? null}
                                              onChange={uid => updateIssueDirectly(issue.id, { assigneeId: uid, assignee: uid ?? "" })}
                                              placement="top"
                                              size="sm"
                                              disabled={!!(filters.archived || !canEditTask)}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                            {provided.placeholder}
                            {getColumnIssues(column).length === 0 &&
                              !snapshot.isDraggingOver && (
                                <div className="h-24 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center text-sm font-medium text-gray-400">
                                  {issues.filter((i) => issueMatchesColumn(i, column))
                                    .length === 0
                                    ? "Drag tasks here"
                                    : "No matching tasks"}
                                </div>
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
                className="workspace-column flex-shrink-0 bg-transparent flex flex-col"
                ref={columnsEndRef}
              >
                {canUpdateWorkspace && showCreateColumn ? (
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-indigo-200 dark:border-indigo-800 p-3 shadow-sm">
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={handleAddColumn}
                        className="flex-1 bg-indigo-600 text-white text-xs font-medium py-1.5 rounded hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Add column
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateColumn(false);
                          setNewColumnName("");
                        }}
                        className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : canUpdateWorkspace ? (
                  <button
                    onClick={() => setShowCreateColumn(true)}
                    className="flex items-center gap-2 w-full bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl p-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-all font-medium text-sm justify-center"
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
          onDeleteIssue={(issue) => {
            setIssueToDelete(issue);
            setDeleteConfirmText("");
          }}
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

      {/* Import explicitly if not using Next.js dynamic imports, or ensure it's in the component tree */}
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
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete work item
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This permanently deletes {issueToDelete.key}. Archive it instead if you may need it later.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDeleteIssueModal}
                className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="Close delete confirmation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 p-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Type <span className="font-mono font-semibold text-red-600">delete</span> to confirm
              </label>
              <input
                autoFocus
                value={deleteConfirmText}
                onChange={(event) => setDeleteConfirmText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") confirmDeleteIssue();
                  if (event.key === "Escape") closeDeleteIssueModal();
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-red-950"
                placeholder="delete"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-800">
              <button
                type="button"
                onClick={() => {
                  const issue = issueToDelete;
                  closeDeleteIssueModal();
                  onArchiveIssue?.(issue);
                }}
                disabled={!onArchiveIssue}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Archive
              </button>
              <button
                type="button"
                onClick={confirmDeleteIssue}
                disabled={deleteConfirmText !== "delete"}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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
