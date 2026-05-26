"use client";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useState } from "react";
import { Filters } from "../../types/filter.type";
import { Issue } from "../../types/issue.type";
import { Workspace } from "../../types/workspace.type";
import { BoardColumn } from "../../types/board.type";
import { Sprint } from "../../types/sprint.type";
import DeleteColumnModal from "../DeleteColumnModal";
import BoardFilters from "../BoardFilters";

import { Search, Plus, Check, X, Trash2, PlayCircle } from "lucide-react";

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
    handleAddColumn: () => void;
    handleRenameColumn: (columnId: string, name: string) => void;
    handleDeleteColumn: (columnId: string, migrateTo?: string) => void;
    handleMoveColumn: (columnId: string, newOrder: number) => void;
  };

  refs: {
    columnsEndRef: React.RefObject<HTMLDivElement | null>;
  };

  permissions?: {
    canCreateTask: boolean;
    canMoveTask: boolean;
    canUpdateWorkspace: boolean;
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
    handleAddColumn,
    handleRenameColumn,
    handleDeleteColumn,
    handleMoveColumn,
  } = actions;
  const { columnsEndRef } = refs;
  const canCreateTask = permissions?.canCreateTask ?? true;
  const canMoveTask = permissions?.canMoveTask ?? true;
  const canUpdateWorkspace = permissions?.canUpdateWorkspace ?? true;

  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<BoardColumn | null>(null);

  const issueMatchesColumn = (issue: Issue, col: BoardColumn) => {
    return issue.columnId ? issue.columnId === col.id : col.mappedStatuses?.includes(issue.status);
  };
  if (workspace.type === "scrum" && !activeSprint) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
          <PlayCircle className="w-8 h-8 text-indigo-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Chưa có Sprint đang hoạt động
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Vui lòng bắt đầu một Sprint từ tab Backlog để xem board
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 relative">
      {filters.archived && (
        <div className="absolute top-0 right-[var(--workspace-surface-pad)] mt-2 bg-red-100 text-red-600 px-3 py-1 rounded-md text-xs font-bold z-10">
          Archived View - Read Only
        </div>
      )}

      {isFetching && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 z-40 flex items-center justify-center backdrop-blur-[1px]">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Quick Filters */}
      <BoardFilters 
        filters={filters} 
        setFilters={setFilters} 
        uniqueAssignees={uniqueAssignees} 
      />

      <DragDropContext onDragEnd={handleBoardDragEnd}>
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
                  isDragDisabled={!canUpdateWorkspace}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="workspace-column flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex flex-col max-h-full border border-gray-200 dark:border-gray-800 shadow-sm"
                    >
                      <div
<<<<<<< HEAD
                        {...(filters.archived ? {} : provided.dragHandleProps)}
                        className={`p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-100/50 dark:bg-gray-800/80 rounded-t-xl ${filters.archived ? "" : "cursor-grab active:cursor-grabbing"} group/header`}
=======
                        {...(canUpdateWorkspace ? provided.dragHandleProps : {})}
                        className={`p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-100/50 dark:bg-gray-800/80 rounded-t-xl group/header ${canUpdateWorkspace ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
>>>>>>> 7e256a0cdb96a8a435e2f88d287b72e00d5b72a9
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
                              {visibleIssues.filter((i) => issueMatchesColumn(i, column)).length}
                            </span>
                          </h3>
                        )}
<<<<<<< HEAD
                        {!filters.archived && (
                          <div className="flex gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
=======
                        <div className="flex gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                          {canUpdateWorkspace && (
>>>>>>> 7e256a0cdb96a8a435e2f88d287b72e00d5b72a9
                            <button
                              onClick={() => {
                                setColumnToDelete(column);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
<<<<<<< HEAD
=======
                          )}
                          {canCreateTask && (
>>>>>>> 7e256a0cdb96a8a435e2f88d287b72e00d5b72a9
                            <button
                              onClick={() => {
                                setNewIssueForm({ ...newIssueForm, status: column.name, columnId: column.id });
                                setShowCreateIssue(true);
                              }}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
<<<<<<< HEAD
                          </div>
                        )}
=======
                          )}
                        </div>
>>>>>>> 7e256a0cdb96a8a435e2f88d287b72e00d5b72a9
                      </div>

                      <Droppable droppableId={column.id} type="task">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`p-3 flex-1 overflow-y-auto space-y-3 min-h-[150px] transition-colors ${snapshot.isDraggingOver ? "bg-indigo-50/50 dark:bg-indigo-900/20" : ""}`}
                          >
                            {visibleIssues
                              .filter((i) => issueMatchesColumn(i, column))
                              .map((issue, issueIndex) => (
                                <Draggable
                                  key={issue.id}
                                  draggableId={issue.id}
                                  index={issueIndex}
                                  isDragDisabled={!canMoveTask}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
<<<<<<< HEAD
                                      {...(filters.archived ? {} : provided.draggableProps)}
                                      {...(filters.archived ? {} : provided.dragHandleProps)}
                                      onClick={() => {
                                        if (filters.archived) return;
                                        setSelectedIssue(issue);
                                      }}
                                      className={`bg-white dark:bg-gray-900 p-3.5 rounded-lg shadow-sm border ${snapshot.isDragging ? "border-indigo-500 shadow-lg rotate-2 z-50 relative" : "border-gray-200 dark:border-gray-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md"} transition-all ${filters.archived ? "" : "cursor-grab active:cursor-grabbing"} group`}
=======
                                      {...provided.draggableProps}
                                      {...(canMoveTask ? provided.dragHandleProps : {})}
                                      onClick={() => setSelectedIssue(issue)}
                                      className={`bg-white dark:bg-gray-900 p-3.5 rounded-lg shadow-sm border ${snapshot.isDragging ? "border-indigo-500 shadow-lg rotate-2 z-50 relative" : "border-gray-200 dark:border-gray-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md"} transition-all ${canMoveTask ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"} group`}
>>>>>>> 7e256a0cdb96a8a435e2f88d287b72e00d5b72a9
                                    >
                                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                        {issue.title}
                                      </p>
                                      <div className="flex flex-wrap gap-1.5 mb-3">
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
                                      </div>
                                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50 dark:border-gray-800">
                                        <span className="text-xs font-mono font-bold text-gray-400">
                                          {issue.key}
                                        </span>
                                        <div
                                          className={`w-6 h-6 rounded-full ${issue.color} text-white flex items-center justify-center text-[10px] font-bold shadow-sm ring-2 ring-white dark:ring-gray-900`}
                                        >
                                          {issue.assignee}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                            {provided.placeholder}
                            {visibleIssues.filter((i) => issueMatchesColumn(i, column))
                              .length === 0 &&
                              !snapshot.isDraggingOver && (
                                <div className="h-24 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center text-sm font-medium text-gray-400">
                                  {issues.filter((i) => issueMatchesColumn(i, column))
                                    .length === 0
                                    ? "Kéo thả issue vào đây"
                                    : "Không có issue phù hợp"}
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

              {/* Thêm cột mới */}
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
                      placeholder="Tên cột mới..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={handleAddColumn}
                        className="flex-1 bg-indigo-600 text-white text-xs font-medium py-1.5 rounded hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Thêm cột
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateColumn(false);
                          setNewColumnName("");
                        }}
                        className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Hủy
                      </button>
                    </div>
                  </div>
                ) : canUpdateWorkspace ? (
                  <button
                    onClick={() => setShowCreateColumn(true)}
                    className="flex items-center gap-2 w-full bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl p-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-all font-medium text-sm justify-center"
                  >
                    <Plus className="w-5 h-5" /> Thêm cột mới
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>

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
    </div>
  );
}
