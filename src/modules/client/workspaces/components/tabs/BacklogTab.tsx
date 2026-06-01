"use client";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import FilterMenu from "../FilterMenu";
import { compareIssueRank } from "../../utils/dragUtils";
import { Sprint } from "../../types/sprint.type";

type BacklogTabProps = {
  data: {
    issues: any[];
    filteredIssues: any[];
    sprints: any[];
    uniqueAssignees: any[];
    selectedTaskIds: string[];
    workspace: any;
  };

  ui: {
    density: any;
    filters: any;
    isFilterOpen: boolean;
    newIssueForm: any;
  };

  actions: {
    handleBacklogDragEnd: any;
    handleBacklogDragStart?: any;

    setIssues: any;

    setDensity: any;
    setFilters: any;

    setIsFilterOpen: any;

    toggleTaskSelection: any;
    toggleSprintSelection: any;

    updateIssueDirectly: any;

    setSelectedIssue: any;

    setNewIssueForm: any;
    setShowCreateIssue: any;

    handleCreateSprint: any;

    setEditingSprint: any;
    setIsSprintModalOpen: any;

    handleStartSprint: (sprintId: string) => void;
    handleCompleteSprint: (sprintId: string) => void;
    handleEditSprint: (sprint: Sprint) => void;
    handleDeleteSprint: (sprintId: string) => void;
    handleQuickCreateTask: (title: string, sprintId: string | null) => void;
    isStarting?: boolean;
    isCompleting?: boolean;
  };

  permissions?: {
    canCreateTask: boolean;
    canEditTask: boolean;
    canMoveTask: boolean;
    canManageSprint: boolean;
  };
};

const statusSelectClasses = (status: string) => {
  const base =
    "px-2 py-1 rounded text-xs font-bold cursor-pointer outline-none border-none focus:ring-2 focus:ring-indigo-500 appearance-none disabled:cursor-not-allowed disabled:opacity-60";

  if (status === "Done") {
    return `${base} bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300`;
  }

  if (status === "In Progress") {
    return `${base} bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300`;
  }

  return `${base} bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300`;
};

const statusOptionClass = "bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-200";

export default function BacklogTab({ data, ui, actions, permissions }: BacklogTabProps) {
  const {
    issues,
    filteredIssues,
    sprints,
    uniqueAssignees,
    selectedTaskIds,
    workspace,
  } = data;

  const { density, filters, isFilterOpen, newIssueForm } = ui;

  const {
    handleBacklogDragEnd,
    handleBacklogDragStart,
    setIssues,
    setDensity,
    setFilters,
    setIsFilterOpen,
    toggleTaskSelection,
    toggleSprintSelection,
    updateIssueDirectly,
    setSelectedIssue,
    setNewIssueForm,
    setShowCreateIssue,
    handleCreateSprint,
    setEditingSprint,
    setIsSprintModalOpen,
    handleStartSprint,
    handleCompleteSprint,
    handleEditSprint,
    handleDeleteSprint,
    handleQuickCreateTask,
    isStarting = false,
    isCompleting = false,
  } = actions;
  const canCreateTask = permissions?.canCreateTask ?? true;
  const canEditTask = permissions?.canEditTask ?? true;
  const canMoveTask = permissions?.canMoveTask ?? true;
  const canManageSprint = permissions?.canManageSprint ?? true;


  const issuesBySprintId = useMemo(() => {
    const assignedIssueIds = new Set<string>();
    const next = new Map<string | null, any[]>();

    sprints.forEach((sprint) => {
      const sprintId = sprint.id ?? sprint._id;
      const sprintIssues = filteredIssues
        .filter((issue) => {
          if (assignedIssueIds.has(issue.id)) return false;
          if (issue.sprintId !== sprintId) return false;
          assignedIssueIds.add(issue.id);
          return true;
        })
        .sort(compareIssueRank);

      next.set(sprintId, sprintIssues);
    });

    const backlogIssues = filteredIssues
      .filter((issue) => {
        if (assignedIssueIds.has(issue.id)) return false;
        return issue.sprintId === null;
      })
      .sort(compareIssueRank);

    next.set(null, backlogIssues);
    return next;
  }, [filteredIssues, sprints]);

  const getSprintIssues = (sprint: any) => issuesBySprintId.get(sprint.id ?? sprint._id) ?? [];
  const backlogIssues = issuesBySprintId.get(null) ?? [];

  return (
    <div>
      <DragDropContext
        onBeforeDragStart={handleBacklogDragStart}
        onDragEnd={canMoveTask ? handleBacklogDragEnd : () => undefined}
      >
        <div className="workspace-surface max-w-[min(100%,72rem)] space-y-6 py-[var(--workspace-surface-pad)]">
          {/* Backlog Top Bar with Filter */}
          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Hiển thị {filteredIssues.length} kết quả
            </div>
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                Bộ lọc nâng cao{" "}
                <span className="bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded text-xs text-gray-500 dark:text-gray-400 shadow-sm border border-gray-200 dark:border-gray-700">
                  Shift+F
                </span>
              </button>
              <FilterMenu
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                setFilters={setFilters}
                density={density}
                setDensity={setDensity}
                assignees={uniqueAssignees}
              />
            </div>
          </div>

          {/* Sprints Mapping */}
          {sprints.map((sprint) => {
            const sprintIssues = getSprintIssues(sprint);
            const totalPoints = sprintIssues.reduce(
              (sum, i) => sum + (i.storyPoints || 0),
              0,
            );
            const donePoints = sprintIssues
              .filter((i) => i.status === "Done")
              .reduce((sum, i) => sum + (i.storyPoints || 0), 0);
            const sprintTaskIds = sprintIssues.map((i) => i.id);
            const isAllSelected =
              sprintTaskIds.length > 0 &&
              sprintTaskIds.every((id) => selectedTaskIds.includes(id));
            const isSomeSelected =
              sprintTaskIds.length > 0 &&
              sprintTaskIds.some((id) => selectedTaskIds.includes(id)) &&
              !isAllSelected;

            return (
              <div
                key={sprint.id}
                className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm group/sprint"
              >
                <div className="flex flex-col gap-3 border-b border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => toggleSprintSelection(sprintTaskIds, e)}
                      onClick={(e) => e.stopPropagation()}
                      ref={(input) => {
                        if (input) input.indeterminate = isSomeSelected;
                      }}
                      className="w-4 h-4 rounded accent-indigo-500 dark:accent-indigo-400 cursor-pointer"
                    />
                    <h3
                      className="flex min-w-0 flex-wrap items-center gap-2 font-bold text-gray-900 hover:underline dark:text-white cursor-pointer"
                      onClick={() => {
                        if (sprint.status === "completed") return;
                        setEditingSprint(sprint);
                        setIsSprintModalOpen(true);
                      }}
                    >
                      {sprint.name}
                      {sprint.status === "active" && (
                        <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-semibold rounded-full uppercase tracking-wide">
                          Active
                        </span>
                      )}
                    </h3>
                    <p className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {sprint.startDate
                          ? `${new Date(sprint.startDate).toLocaleDateString('vi-VN')} - ${new Date(sprint.endDate!).toLocaleDateString('vi-VN')}`
                          : "Chưa có ngày"}
                      </span>
                      <span>&middot;</span>
                      <span>{sprintIssues.length} issues</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                    <div className="flex gap-2 items-center group relative cursor-help">
                      <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold flex items-center justify-center">
                        {
                          sprintIssues.filter((i) => i.status === "To Do")
                            .length
                        }
                      </span>
                      <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold flex items-center justify-center">
                        {
                          sprintIssues.filter((i) => i.status === "In Progress")
                            .length
                        }
                      </span>
                      <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold flex items-center justify-center">
                        {sprintIssues.filter((i) => i.status === "Done").length}
                      </span>

                      {/* Tooltip for Story Points */}
                      <div className="absolute top-full mt-2 right-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                        Tiến độ: {donePoints} / {totalPoints} story points
                      </div>
                    </div>
                    {canManageSprint && (
                    <button
                      onClick={() => handleEditSprint(sprint)}
                      disabled={sprint.status === "completed"}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                      title="Chỉnh sửa sprint"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    )}
                    {canManageSprint && sprint.status === "planning" && (
                      <button
                        onClick={() => handleDeleteSprint(sprint._id)}
                        className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
                        title="Xóa sprint"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {canManageSprint && (
                    <button
                      onClick={() =>
                        sprint.status === "active"
                          ? handleCompleteSprint(sprint._id)
                          : handleStartSprint(sprint._id)
                      }
                      disabled={isStarting || isCompleting || sprint.status === "completed" || sprint._id.startsWith("temp-")}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {sprint.status === "active"
                        ? "Complete Sprint"
                        : sprint.status === "completed"
                          ? "Completed"
                          : "Start Sprint"}
                    </button>
                    )}
                  </div>
                </div>

                <Droppable
                  droppableId={`sprint-${sprint.id}`}
                  type="backlog-issue"
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-2 space-y-1 min-h-[50px] transition-colors ${snapshot.isDraggingOver ? "bg-indigo-50/30 dark:bg-indigo-900/10" : ""}`}
                    >
                      {sprintIssues.map((issue, index) => (
                        <Draggable
                          key={issue.id}
                          draggableId={issue.id}
                          index={index}
                          isDragDisabled={!canMoveTask}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...(canMoveTask ? provided.dragHandleProps : {})}
                              className={`flex flex-col gap-3 bg-white dark:bg-gray-900 lg:flex-row lg:items-center lg:justify-between ${density === "compact" ? "p-2" : "p-3"} rounded-lg border ${snapshot.isDragging ? "border-indigo-400 shadow-md rotate-1 z-50 relative" : "border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-500"} transition-all group shadow-sm`}
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={selectedTaskIds.includes(issue.id)}
                                  onChange={(e) =>
                                    toggleTaskSelection(issue.id, e)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 rounded accent-indigo-500 dark:accent-indigo-400 cursor-pointer"
                                />
                                <div
                                  className="flex min-w-0 flex-1 items-center gap-3"
                                  onClick={() => setSelectedIssue(issue)}
                                >
                                  <FileText
                                    className={`w-4 h-4 ${issue.type === "Bug" ? "text-red-500" : issue.type === "Story" ? "text-emerald-500" : "text-indigo-500"}`}
                                  />
                                  <span className="text-xs font-mono font-medium text-gray-500 w-16 hover:underline cursor-pointer">
                                    {issue.key}
                                  </span>
                                  <span className="min-w-0 break-words text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 cursor-pointer">
                                    {issue.title}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                                {/* Editable Story Points */}
                                <div className="relative group/pts">
                                  <input
                                    type="number"
                                    value={
                                      issue.storyPoints === 0
                                        ? ""
                                        : issue.storyPoints
                                    }
                                    onChange={(e) =>
                                      updateIssueDirectly(issue.id, {
                                        storyPoints:
                                          parseInt(e.target.value) || 0,
                                      })
                                    }
                                    disabled={!canEditTask}
                                    placeholder="-"
                                    className="w-8 h-6 text-center text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-500 outline-none transition-colors appearance-none"
                                    title="Story Points"
                                  />
                                </div>

                                {/* Editable Status */}
                                <select
                                  value={issue.status}
                                  onChange={(e) =>
                                    updateIssueDirectly(issue.id, {
                                      status: e.target.value,
                                    })
                                  }
                                  disabled={!canEditTask}
                                  className={statusSelectClasses(issue.status)}
                                >
                                  <option
                                    value="To Do"
                                    className={statusOptionClass}
                                  >
                                    To Do
                                  </option>
                                  <option
                                    value="In Progress"
                                    className={statusOptionClass}
                                  >
                                    In Progress
                                  </option>
                                  <option
                                    value="Done"
                                    className={statusOptionClass}
                                  >
                                    Done
                                  </option>
                                </select>

                                {/* Assignee */}
                                {issue.assignee && issue.assignee !== "U" ? (
                                  <div
                                    className={`w-6 h-6 rounded-full ${issue.color} text-white flex items-center justify-center text-[10px] font-bold cursor-pointer ring-2 ring-transparent hover:ring-indigo-200 dark:hover:ring-indigo-800 transition-all`}
                                  >
                                    {issue.assignee}
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-500 text-gray-400 dark:text-gray-500 transition-colors">
                                    <Plus className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {sprintIssues.length === 0 &&
                        !snapshot.isDraggingOver && (
                          <div className="p-4 text-center text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg mx-2 my-1">
                            Plan your sprint by dragging issues here
                          </div>
                        )}
                    </div>
                  )}
                </Droppable>
                {sprint.status !== "completed" && (
                  <div className="px-3 pb-3 flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Tạo task nhanh... (Enter để lưu)"
                      className="w-full py-1.5 px-3 text-sm bg-transparent border border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 placeholder-gray-400 focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-400 outline-none transition-all"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          const title = e.currentTarget.value.trim();
                          e.currentTarget.value = "";
                          if (canCreateTask) handleQuickCreateTask(title, sprint.id);
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        setNewIssueForm({
                          ...newIssueForm,
                          sprintId: sprint.id,
                        });
                        setShowCreateIssue(true);
                      }}
                      disabled={!canCreateTask}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 disabled:opacity-50 disabled:hover:bg-transparent p-1.5 px-3 rounded-lg flex items-center gap-1 transition-colors w-fit"
                    >
                      <Plus className="w-4 h-4" /> Create issue (full form)
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Backlog Section */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/50 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={
                    backlogIssues.length > 0 &&
                    backlogIssues
                      .map((i) => i.id)
                      .every((id) => selectedTaskIds.includes(id))
                  }
                  onChange={(e) =>
                    toggleSprintSelection(
                      backlogIssues.map((i) => i.id),
                      e,
                    )
                  }
                  onClick={(e) => e.stopPropagation()}
                  ref={(input) => {
                    if (input) {
                      const backlogIds = backlogIssues.map((i) => i.id);
                      const isAll =
                        backlogIds.length > 0 &&
                        backlogIds.every((id) => selectedTaskIds.includes(id));
                      const isSome =
                        backlogIds.length > 0 &&
                        backlogIds.some((id) => selectedTaskIds.includes(id)) &&
                        !isAll;
                      input.indeterminate = isSome;
                    }
                  }}
                  className="w-4 h-4 rounded accent-indigo-500 dark:accent-indigo-400 cursor-pointer"
                />
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Backlog
                  <span className="text-gray-400 dark:text-gray-500 font-normal text-sm">
                    ({backlogIssues.length}{" "}
                    issues)
                  </span>
                </h3>
              </div>
              {canManageSprint && (
              <button
                onClick={handleCreateSprint}
                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              >
                Create Sprint
              </button>
              )}
            </div>

            <Droppable droppableId="backlog" type="backlog-issue">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`p-2 space-y-1 min-h-[100px] transition-colors ${snapshot.isDraggingOver ? "bg-gray-50/80 dark:bg-gray-800/80" : ""}`}
                >
                  {backlogIssues
                    .map((issue, index) => (
                        <Draggable
                        key={issue.id}
                        draggableId={issue.id}
                        index={index}
                        isDragDisabled={!canMoveTask}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...(canMoveTask ? provided.dragHandleProps : {})}
                            className={`flex flex-col gap-3 bg-white dark:bg-gray-900 lg:flex-row lg:items-center lg:justify-between ${density === "compact" ? "p-2" : "p-3"} rounded-lg border ${snapshot.isDragging ? "border-indigo-400 shadow-md rotate-1 z-50 relative" : "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"} transition-all group`}
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedTaskIds.includes(issue.id)}
                                onChange={(e) =>
                                  toggleTaskSelection(issue.id, e)
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 rounded accent-indigo-500 dark:accent-indigo-400 cursor-pointer"
                              />
                              <div
                                className="flex min-w-0 flex-1 items-center gap-3"
                                onClick={() => setSelectedIssue(issue)}
                              >
                                <FileText
                                  className={`w-4 h-4 ${issue.type === "Bug" ? "text-red-500" : issue.type === "Story" ? "text-emerald-500" : "text-gray-400"}`}
                                />
                                <span className="text-xs font-mono font-medium text-gray-400 w-16 hover:underline cursor-pointer">
                                  {issue.key}
                                </span>
                                <span className="min-w-0 break-words text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white cursor-pointer">
                                  {issue.title}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                              {/* Editable Story Points */}
                              <div className="relative group/pts">
                                <input
                                  type="number"
                                  value={
                                    issue.storyPoints === 0
                                      ? ""
                                      : issue.storyPoints
                                  }
                                  onChange={(e) =>
                                    updateIssueDirectly(issue.id, {
                                      storyPoints:
                                        parseInt(e.target.value) || 0,
                                    })
                                  }
                                  disabled={!canEditTask}
                                  placeholder="-"
                                  className="w-8 h-6 text-center text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-500 outline-none transition-colors appearance-none"
                                  title="Story Points"
                                />
                              </div>

                              {/* Editable Status */}
                              <select
                                value={issue.status}
                                onChange={(e) =>
                                  updateIssueDirectly(issue.id, {
                                    status: e.target.value,
                                  })
                                }
                                disabled={!canEditTask}
                                className={statusSelectClasses(issue.status)}
                              >
                                <option value="To Do" className={statusOptionClass}>
                                  To Do
                                </option>
                                <option value="In Progress" className={statusOptionClass}>
                                  In Progress
                                </option>
                                <option value="Done" className={statusOptionClass}>
                                  Done
                                </option>
                              </select>

                              {/* Assignee */}
                              {issue.assignee && issue.assignee !== "U" ? (
                                <div
                                  className={`w-6 h-6 rounded-full ${issue.color} text-white flex items-center justify-center text-[10px] font-bold cursor-pointer ring-2 ring-transparent hover:ring-indigo-200 dark:hover:ring-indigo-800 transition-all`}
                                >
                                  {issue.assignee}
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-indigo-500 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors cursor-pointer">
                                  <Plus className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            <div className="relative flex flex-col gap-2 border-t border-gray-100 bg-gray-50/30 p-3 dark:border-gray-800 dark:bg-gray-800/30 sm:flex-row sm:items-center">
              <input
                type="text"
                placeholder="Bạn cần làm gì tiếp theo?"
                className="flex-1 py-1.5 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    const title = e.currentTarget.value.trim();
                    e.currentTarget.value = "";
                    if (canCreateTask) handleQuickCreateTask(title, null);
                  }
                }}
              />
              <button
                onClick={() => {
                  setNewIssueForm({ ...newIssueForm, sprintId: null });
                  setShowCreateIssue(true);
                }}
                disabled={!canCreateTask}
                className="text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100 disabled:opacity-50 px-3 py-1.5 rounded transition-colors whitespace-nowrap"
              >
                Mở modal...
              </button>
            </div>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}
