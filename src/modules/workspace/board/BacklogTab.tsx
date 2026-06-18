"use client";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import { FileText, Pencil, Trash2 } from "lucide-react";
import AssigneePicker, { toAssigneePickerUsers } from "@/shared/components/AssigneePicker";
import { useMemo } from "react";
import FilterMenu from "@/modules/workspace/shared/components/FilterMenu";
import StatusPicker from "@/shared/components/StatusPicker";
import PriorityPicker from "@/shared/components/PriorityPicker";
import TypePicker from "@/shared/components/TypePicker";
import { compareIssueRank } from "@/modules/workspace/shared/utils/dragUtils";
import type { BoardColumn } from "@/modules/workspace/shared/types/board.type";
import { Sprint } from "@/modules/workspace/shared/types/sprint.type";
import type { Issue } from "@/modules/workspace/shared/types/issue.type";
import type { Workspace } from "@/modules/workspace/shared/types/workspace.type";
import type { Filters } from "@/modules/workspace/shared/types/filter.type";
import type { AssigneePickerUser } from "@/shared/components/AssigneePicker";

type BacklogTabProps = {
  data: {
    issues: Issue[];
    filteredIssues: Issue[];
    columns?: BoardColumn[];
    sprints: Sprint[];
    uniqueAssignees: AssigneePickerUser[];
    selectedTaskIds: string[];
    workspace: Workspace;
  };

  ui: {
    density: "compact" | "comfortable" | "spacious";
    filters: Filters;
    isFilterOpen: boolean;
    newIssueForm: { title: string; sprintId?: string | null };
  };

  actions: {
    handleBacklogDragEnd: () => void;
    handleBacklogDragStart?: () => void;

    setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;

    setDensity: React.Dispatch<React.SetStateAction<"compact" | "comfortable" | "spacious">>;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;

    setIsFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toggleTaskSelection: (taskId: string, e?: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toggleSprintSelection: (taskIds: string[], e?: any) => void;

    updateIssueDirectly: (issueId: string, updates: Partial<Issue>) => void;

    setSelectedIssue: (issue: Issue | null) => void;

    setNewIssueForm: React.Dispatch<React.SetStateAction<{ title: string; sprintId?: string | null }>>;
    setShowCreateIssue: React.Dispatch<React.SetStateAction<boolean>>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleCreateSprint: (name?: any) => void;

    setEditingSprint: React.Dispatch<React.SetStateAction<Sprint | null>>;
    setIsSprintModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

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

const getInitials = (value: string) =>
  (value ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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

type WorkspaceMemberUser =
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

type WorkspaceMemberItem = {
  userId: WorkspaceMemberUser;
  role?: string;
};

type AssigneeInfo = {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  initials: string;
};


export default function BacklogTab({ data, ui, actions, permissions }: BacklogTabProps) {
  const {
    filteredIssues,
    columns = [],
    sprints,
    uniqueAssignees,
    selectedTaskIds,
    workspace,
  } = data;

  const { density, filters, isFilterOpen, newIssueForm } = ui;

  const {
    handleBacklogDragEnd,
    handleBacklogDragStart,
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

  const workspaceMembers = useMemo(() => {
    const rolesByUserId = new Map<string, string | undefined>(
      (workspace.members ?? []).map((member: WorkspaceMemberItem) => [
        normalizeObjectId(member.userId),
        member.role,
      ]),
    );

    return toAssigneePickerUsers(workspace.members ?? []).map((member): AssigneeInfo => ({
      id: member.id,
      name: member.name || "Member",
      email: member.email ?? "",
      role: rolesByUserId.get(member.id),
      avatar: member.avatar,
      initials: member.initials ?? (getInitials(member.name || member.email || member.id || "?") || "?"),
    }));
  }, [workspace.members]);

  const filterAssignees = useMemo(() => {
    return uniqueAssignees.map((assignee) => {
      const member = workspaceMembers.find((item: AssigneeInfo) => item.id === assignee.id);

      return {
        ...assignee,
        name: member?.name ?? (assignee.id === "U" ? "Unassigned" : assignee.id),
        email: member?.email ?? "",
        role: member?.role,
        avatar: member?.avatar,
        initials: member?.initials ?? getInitials(assignee.id === "U" ? "Unassigned" : assignee.id),
      };
    });
  }, [uniqueAssignees, workspaceMembers]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getReadonlyAssignee = (issue: any): AssigneeInfo | null => {
    const assigneeId = normalizeObjectId(issue.assigneeId ?? issue.assignee);
    if (!assigneeId || assigneeId === "U") return null;

    const member = workspaceMembers.find((item: AssigneeInfo) => {
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
      initials: getInitials(displayName) || "?",
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderReadonlyAssignee = (issue: any) => {
    const assignee = getReadonlyAssignee(issue);

    if (!assignee) {
      return (
        <span className="text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">
          Unassigned
        </span>
      );
    }

    return (
      <div
        className="flex min-w-0 max-w-[10rem] items-center gap-1.5"
        title={assignee.email ? `${assignee.name} (${assignee.email})` : assignee.name}
      >
        <div className={`flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full text-[0.5625rem] font-bold ${assignee.avatar ? "" : "bg-[#2563EB] text-white"}`}>
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

  const issuesBySprintId = useMemo(() => {
    const assignedIssueIds = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        return issue.sprintId == null;
      })
      .sort(compareIssueRank);

    next.set(null, backlogIssues);
    return next;
  }, [filteredIssues, sprints]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          <div className="flex flex-col gap-3 rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7]">
              Showing {filteredIssues.length} results
            </div>
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#F7F6F3] dark:bg-[#2A2A2A] hover:bg-[#F0F0EE] dark:hover:bg-[#333333] text-[#111111] dark:text-[#E8E8E7] rounded-[6px] text-[0.8125rem] font-medium transition-colors"
              >
                Advanced filters{" "}
              </button>
              <FilterMenu
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                setFilters={setFilters}
                density={density}
                setDensity={setDensity}
                assignees={filterAssignees}
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
                key={sprint._id}
                className="bg-[#F9F9F8] dark:bg-[#252525] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] overflow-hidden group/sprint"
              >
                <div className="flex items-center justify-between gap-3 border-b border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] p-4">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => toggleSprintSelection(sprintTaskIds, e)}
                      onClick={(e) => e.stopPropagation()}
                      ref={(input) => {
                        if (input) input.indeterminate = isSomeSelected;
                      }}
                      className="w-4 h-4 rounded accent-[#2563EB] cursor-pointer shrink-0"
                    />
                    <h3
                      className="flex items-center gap-2 font-semibold text-[#111111] dark:text-[#E8E8E7] hover:underline cursor-pointer whitespace-nowrap"
                      onClick={() => {
                        if (sprint.status === "completed") return;
                        setEditingSprint(sprint);
                        setIsSprintModalOpen(true);
                      }}
                    >
                      {sprint.name}
                      {sprint.status === "active" && (
                        <span className="px-2 py-0.5 bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#1F6C9F] dark:text-[#93C5FD] text-[0.6875rem] font-semibold rounded-full uppercase tracking-wide">
                          Active
                        </span>
                      )}
                    </h3>
                    <div className="flex gap-1.5 items-center group relative cursor-help shrink-0">
                      <span className="w-6 h-6 rounded-full bg-[#F7F6F3] dark:bg-[#2A2A2A] text-[#787774] dark:text-[#9B9A97] text-[0.6875rem] font-bold flex items-center justify-center">
                        {sprintIssues.filter((i) => i.status === "To Do").length}
                      </span>
                      <span className="w-6 h-6 rounded-full bg-[#FBF3DB] dark:bg-[rgba(149,100,0,0.15)] text-[#956400] dark:text-[#F0C040] text-[0.6875rem] font-bold flex items-center justify-center">
                        {sprintIssues.filter((i) => i.status === "In Progress").length}
                      </span>
                      <span className="w-6 h-6 rounded-full bg-[#EDF3EC] dark:bg-[rgba(52,101,56,0.15)] text-[#346538] dark:text-[#6FCF7B] text-[0.6875rem] font-bold flex items-center justify-center">
                        {sprintIssues.filter((i) => i.status === "Done").length}
                      </span>
                      <div className="absolute top-full mt-2 left-0 bg-[#111111] dark:bg-[#2A2A2A] text-[#E8E8E7] text-[0.6875rem] px-3 py-2 rounded-[6px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                        Progress: {donePoints} / {totalPoints} story points
                      </div>
                    </div>
                    {canManageSprint && (
                      <button
                        onClick={() => handleEditSprint(sprint)}
                        disabled={sprint.status === "completed"}
                        className="p-1 text-[#ABABAB] hover:text-[#787774] dark:hover:text-[#9B9A97] rounded-[4px] transition-colors shrink-0"
                        title="Edit sprint"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canManageSprint && sprint.status === "planning" && (
                      <button
                        onClick={() => handleDeleteSprint(sprint._id)}
                        className="p-1 text-[#ABABAB] hover:text-[#9F2F2D] dark:hover:text-[#E07B79] rounded-[4px] transition-colors"
                        title="Delete sprint"
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
                        className="px-3 py-1.5 bg-[#F7F6F3] dark:bg-[#2A2A2A] text-[#111111] dark:text-[#E8E8E7] rounded-[6px] text-[0.8125rem] font-medium hover:bg-[#F0F0EE] dark:hover:bg-[#333333] transition-colors disabled:opacity-40"
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
                      className={`p-2 space-y-1 min-h-[3.125rem] transition-colors ${snapshot.isDraggingOver ? "bg-[#EFF6FF]/20 dark:bg-[rgba(37,99,235,0.06)]" : ""}`}
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
                              className={`flex flex-col gap-3 bg-white dark:bg-[#202020] lg:flex-row lg:items-center lg:justify-between ${density === "compact" ? "p-2" : "p-3"} rounded-[6px] border ${snapshot.isDragging ? "border-[#2563EB] rotate-1 z-50 relative" : "border-[#F0F0EE] dark:border-white/[0.04] hover:border-[#2563EB]/30 dark:hover:border-[#3B82F6]/30"} transition-colors group`}
                              style={{
                                ...provided.draggableProps.style,
                                ...(snapshot.isDragging
                                  ? { boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }
                                  : {}),
                              }}
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={selectedTaskIds.includes(issue.id)}
                                  onChange={(e) =>
                                    toggleTaskSelection(issue.id, e)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 rounded accent-[#2563EB] cursor-pointer"
                                />
                                <div
                                  className="flex min-w-0 flex-1 items-center gap-3"
                                  onClick={() => setSelectedIssue(issue)}
                                >
                                  <FileText
                                    className={`w-4 h-4 ${issue.type === "Bug" ? "text-[#9F2F2D]" : issue.type === "Story" ? "text-[#346538]" : "text-[#2563EB] dark:text-[#60A5FA]"}`}
                                  />
                                  <span className="text-[0.6875rem] font-mono font-medium text-[#ABABAB] dark:text-[#6B6B6B] w-16 hover:underline cursor-pointer">
                                    {issue.key}
                                  </span>
                                  <span className="min-w-0 break-words text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] cursor-pointer">
                                    {issue.title}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                                {canEditTask ? (
                                  <>
                                    <div className="relative group/pts">
                                      <input
                                        type="number"
                                        value={issue.storyPoints === 0 ? "" : issue.storyPoints}
                                        onChange={(e) =>
                                          updateIssueDirectly(issue.id, {
                                            storyPoints: parseInt(e.target.value) || 0,
                                          })
                                        }
                                        placeholder="-"
                                        className="w-8 h-6 text-center text-[0.6875rem] font-bold text-[#787774] dark:text-[#9B9A97] bg-[#F7F6F3] dark:bg-[#2A2A2A] hover:bg-[#F0F0EE] dark:hover:bg-[#333333] rounded-[4px] border border-transparent focus:bg-white dark:focus:bg-[#2A2A2A] focus:border-[#2563EB] outline-none transition-colors appearance-none"
                                        title="Story Points"
                                      />
                                    </div>
                                    <StatusPicker
                                      value={issue.status}
                                      columnId={issue.columnId}
                                      options={(columns || []).map(col => ({ id: col.id, name: col.name }))}
                                      variant="pill"
                                      size="sm"
                                      onChange={(status, option) =>
                                        updateIssueDirectly(issue.id, { columnId: option.id, status })
                                      }
                                    />
                                    <div onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
                                      <TypePicker
                                        value={issue.type ?? "Task"}
                                        onChange={(type) => updateIssueDirectly(issue.id, { type })}
                                        variant="pill"
                                        size="sm"
                                      />
                                    </div>
                                    <div onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
                                      <AssigneePicker
                                        users={workspaceMembers}
                                        value={normalizeObjectId(issue.assigneeId ?? issue.assignee) || null}
                                        onChange={uid => updateIssueDirectly(issue.id, {
                                          assigneeId: uid,
                                          assignee: uid ?? "U",
                                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                          assigneeDisplayName: uid ? workspaceMembers.find((m: any) => m.id === uid)?.name ?? uid : "Unassigned",
                                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                          assigneeAvatar: uid ? workspaceMembers.find((m: any) => m.id === uid)?.avatar : undefined,
                                        })}
                                        placement="auto"
                                        size="sm"
                                      />
                                    </div>
                                    <div onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
                                      <PriorityPicker
                                        value={issue.priority}
                                        onChange={p => updateIssueDirectly(issue.id, { priority: p })}
                                        variant="pill"
                                        size="sm"
                                      />
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-[0.6875rem] font-bold text-[#787774] dark:text-[#9B9A97]">{issue.storyPoints || "-"}</span>
                                    <span className="rounded-[4px] bg-[#F7F6F3] px-2 py-1 text-[0.6875rem] font-medium text-[#787774] dark:bg-[#2A2A2A] dark:text-[#9B9A97]">{issue.status}</span>
                                    <TypePicker value={issue.type ?? "Task"} variant="pill" size="sm" disabled />
                                    {renderReadonlyAssignee(issue)}
                                    {issue.priority && (
                                      <PriorityPicker value={issue.priority} variant="pill" size="sm" disabled />
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {sprintIssues.length === 0 &&
                        !snapshot.isDraggingOver && (
                          <div className="p-4 text-center text-[0.8125rem] text-[#ABABAB] dark:text-[#6B6B6B] border-2 border-dashed border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] mx-2 my-1">
                            Plan your sprint by dragging issues here
                          </div>
                        )}
                    </div>
                  )}
                </Droppable>
                {canCreateTask && sprint.status !== "completed" && (
                  <div className="flex flex-col gap-2 border-t border-[#F0F0EE] dark:border-white/[0.04] bg-[#F9F9F8]/50 dark:bg-[#252525] p-3 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      placeholder="What do you need to do next?"
                      className="flex-1 py-1.5 px-3 bg-white dark:bg-[#2A2A2A] text-[#111111] dark:text-[#E8E8E7] border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] text-[0.8125rem] focus:border-[#2563EB] outline-none transition-colors"
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
                      className="text-[0.8125rem] font-medium bg-[#F7F6F3] dark:bg-[#2A2A2A] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F0F0EE] dark:hover:bg-[#333333] hover:text-[#111111] dark:hover:text-[#E8E8E7] disabled:opacity-40 px-3 py-1.5 rounded-[6px] transition-colors whitespace-nowrap"
                    >
                      Open modal...
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Backlog Section */}
          <div className="bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[#EAEAEA] dark:border-white/[0.06] bg-[#F9F9F8] dark:bg-[#252525] p-4 sm:flex-row sm:items-center sm:justify-between">
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
                  className="w-4 h-4 rounded accent-[#2563EB] cursor-pointer"
                />
                <h3 className="font-semibold text-[#111111] dark:text-[#E8E8E7] flex items-center gap-2">
                  Backlog
                  <span className="text-[#ABABAB] dark:text-[#6B6B6B] font-normal text-[0.8125rem]">
                    ({backlogIssues.length}{" "}
                    issues)
                  </span>
                </h3>
              </div>
              {canManageSprint && (
              <button
                onClick={handleCreateSprint}
                className="px-3 py-1.5 bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#1F6C9F] dark:text-[#93C5FD] rounded-[6px] text-[0.8125rem] font-medium hover:bg-[#DBEAFE] dark:hover:bg-[rgba(37,99,235,0.18)] transition-colors"
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
                  className={`p-2 space-y-1 min-h-[6.25rem] transition-colors ${snapshot.isDraggingOver ? "bg-[#F9F9F8] dark:bg-[#252525]" : ""}`}
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
                            className={`flex flex-col gap-3 bg-white dark:bg-[#202020] lg:flex-row lg:items-center lg:justify-between ${density === "compact" ? "p-2" : "p-3"} rounded-[6px] border ${snapshot.isDragging ? "border-[#2563EB] rotate-1 z-50 relative" : "border-[#F0F0EE] dark:border-white/[0.04] hover:bg-[#F9F9F8] dark:hover:bg-[#2E2E2E]"} transition-colors group`}
                            style={{
                              ...provided.draggableProps.style,
                              ...(snapshot.isDragging
                                ? { boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }
                                : {}),
                            }}
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedTaskIds.includes(issue.id)}
                                onChange={(e) =>
                                  toggleTaskSelection(issue.id, e)
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 rounded accent-[#2563EB] cursor-pointer"
                              />
                              <div
                                className="flex min-w-0 flex-1 items-center gap-3"
                                onClick={() => setSelectedIssue(issue)}
                              >
                                <FileText
                                  className={`w-4 h-4 ${issue.type === "Bug" ? "text-[#9F2F2D]" : issue.type === "Story" ? "text-[#346538]" : "text-[#ABABAB] dark:text-[#6B6B6B]"}`}
                                />
                                <span className="text-[0.6875rem] font-mono font-medium text-[#ABABAB] dark:text-[#6B6B6B] w-16 hover:underline cursor-pointer">
                                  {issue.key}
                                </span>
                                <span className="min-w-0 break-words text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7] group-hover:text-[#2563EB] cursor-pointer">
                                  {issue.title}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                              {canEditTask ? (
                                <>
                                  <div className="relative group/pts">
                                    <input
                                      type="number"
                                      value={issue.storyPoints === 0 ? "" : issue.storyPoints}
                                      onChange={(e) =>
                                        updateIssueDirectly(issue.id, {
                                          storyPoints: parseInt(e.target.value) || 0,
                                        })
                                      }
                                      placeholder="-"
                                      className="w-8 h-6 text-center text-[0.6875rem] font-bold text-[#787774] dark:text-[#9B9A97] bg-[#F7F6F3] dark:bg-[#2A2A2A] hover:bg-[#F0F0EE] dark:hover:bg-[#333333] rounded-[4px] border border-transparent focus:bg-white dark:focus:bg-[#2A2A2A] focus:border-[#2563EB] outline-none transition-colors appearance-none"
                                      title="Story Points"
                                    />
                                  </div>
                                  <StatusPicker
                                    value={issue.status}
                                    columnId={issue.columnId}
                                    options={(columns || []).map(col => ({ id: col.id, name: col.name }))}
                                    variant="pill"
                                    size="sm"
                                    onChange={(status, option) =>
                                      updateIssueDirectly(issue.id, { columnId: option.id, status })
                                    }
                                  />
                                  <div onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
                                    <TypePicker
                                      value={issue.type ?? "Task"}
                                      onChange={(type) => updateIssueDirectly(issue.id, { type })}
                                      variant="pill"
                                      size="sm"
                                    />
                                  </div>
                                  <div onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
                                    <AssigneePicker
                                      users={workspaceMembers}
                                      value={normalizeObjectId(issue.assigneeId ?? issue.assignee) || null}
                                      onChange={uid => updateIssueDirectly(issue.id, {
                                        assigneeId: uid,
                                        assignee: uid ?? "U",
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        assigneeDisplayName: uid ? workspaceMembers.find((m: any) => m.id === uid)?.name ?? uid : "Unassigned",
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        assigneeAvatar: uid ? workspaceMembers.find((m: any) => m.id === uid)?.avatar : undefined,
                                      })}
                                      placement="bottom"
                                      size="sm"
                                    />
                                  </div>
                                  <div onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
                                    <PriorityPicker
                                      value={issue.priority}
                                      onChange={p => updateIssueDirectly(issue.id, { priority: p })}
                                      variant="pill"
                                      size="sm"
                                    />
                                  </div>
                                </>
                              ) : (
                                <>
                                  <span className="text-[0.6875rem] font-bold text-[#787774] dark:text-[#9B9A97]">{issue.storyPoints || "-"}</span>
                                  <span className="rounded-[4px] bg-[#F7F6F3] px-2 py-1 text-[0.6875rem] font-medium text-[#787774] dark:bg-[#2A2A2A] dark:text-[#9B9A97]">{issue.status}</span>
                                  <TypePicker value={issue.type ?? "Task"} variant="pill" size="sm" disabled />
                                  {renderReadonlyAssignee(issue)}
                                  {issue.priority && (
                                    <PriorityPicker value={issue.priority} variant="pill" size="sm" disabled />
                                  )}
                                </>
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
            {canCreateTask && (
            <div className="relative flex flex-col gap-2 border-t border-[#F0F0EE] dark:border-white/[0.04] bg-[#F9F9F8]/50 dark:bg-[#252525] p-3 sm:flex-row sm:items-center">
              <input
                type="text"
                placeholder="What do you need to do next?"
                className="flex-1 py-1.5 px-3 bg-white dark:bg-[#2A2A2A] text-[#111111] dark:text-[#E8E8E7] border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] text-[0.8125rem] focus:border-[#2563EB] outline-none transition-colors"
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
                className="text-[0.8125rem] font-medium bg-[#F7F6F3] dark:bg-[#2A2A2A] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F0F0EE] dark:hover:bg-[#333333] hover:text-[#111111] dark:hover:text-[#E8E8E7] disabled:opacity-40 px-3 py-1.5 rounded-[6px] transition-colors whitespace-nowrap"
              >
                Open modal...
              </button>
            </div>
            )}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}
