"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  LayoutGrid,
  PanelRight,
  ChevronDown,
  ArrowDownWideNarrow,
  RotateCw,
  FileText,
  Columns,
} from "lucide-react";
import { Issue } from "@/modules/workspace/shared/types/issue.type";
import { Filters } from "@/modules/workspace/shared/types/filter.type";
import { VisibilityState } from "@tanstack/react-table";
import { Sprint } from "@/modules/workspace/shared/types/sprint.type";
import DataGridListView from "@/modules/admin-shared/components/common/components/DataGridListView";
import TaskDetailList from "@/modules/workspace/tasks/detail/TaskDetailList";
import BoardFilters from "@/modules/workspace/shared/components/BoardFilters";

type ListSplitSortField =
  | "created"
  | "key"
  | "lastViewed"
  | "priority"
  | "resolved"
  | "status"
  | "updated";

const LIST_SPLIT_SORT_OPTIONS: { id: ListSplitSortField; label: string }[] = [
  { id: "created", label: "Created" },
  { id: "key", label: "Key" },
  { id: "lastViewed", label: "Last viewed" },
  { id: "priority", label: "Priority" },
  { id: "resolved", label: "Resolved" },
  { id: "status", label: "Status" },
  { id: "updated", label: "Updated" },
];

type ListTabProps = {
  filteredIssues: Issue[];
  selectedIssue: Issue | null;
  workspaceId: string;
  sprints?: Sprint[];
  workspaceTemplate?: "kanban" | "scrum";
  listViewMode: "grid" | "split";
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uniqueAssignees: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  members?: any[];
  boardColumns?: { id: string; name: string; order: number; mappedStatuses?: string[]; isDone?: boolean }[];
  setSelectedIssue: (issue: Issue | null) => void;
  setListViewMode: (mode: "grid" | "split") => void;
  setListGridDrawerOpen: (open: boolean) => void;
  updateIssueDirectly: (issueId: string, updates: Partial<Issue>) => void;
  handleUpdateIssue: (updated: Issue) => void;
  onBulkUpdateIds?: (ids: string[], updates: Partial<Issue>) => Promise<void>;
  onBulkDeleteIds?: (ids: string[]) => void | Promise<void>;
  onCreateTask?: (task: { title: string; type?: string; assigneeId?: string | null; dueDate?: string | null }) => Promise<void>;
  canEditTask?: boolean;
  canDeleteTask?: boolean;
};

const COLUMN_LABELS: Record<string, string> = {
  key: "Key", title: "Work", type: "Type", status: "Status", priority: "Priority",
  assigneeId: "Assignee", storyPoints: "Story Points", startDate: "Start Date",
  dueDate: "Due Date", updatedAt: "Updated", labels: "Labels",
};

export default function ListTab({
  filteredIssues,
  selectedIssue,
  workspaceId,
  sprints = [],
  workspaceTemplate = "kanban",
  listViewMode,
  filters,
  setFilters,
  uniqueAssignees,
  members,
  boardColumns,
  setSelectedIssue,
  setListViewMode,
  setListGridDrawerOpen,
  updateIssueDirectly,
  handleUpdateIssue,
  onBulkUpdateIds,
  onBulkDeleteIds,
  onCreateTask,
  canEditTask = true,
  canDeleteTask = true,
}: ListTabProps) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("list_visible_columns");
      if (saved) return JSON.parse(saved);
    }
    return { key: true, title: true, type: true, status: true, priority: true, assigneeId: true, storyPoints: true, dueDate: true, updatedAt: true, labels: true };
  });
  useEffect(() => {
    localStorage.setItem("list_visible_columns", JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node))
        setShowColumnMenu(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const columnsButton = (
    <div className="relative" ref={columnMenuRef}>
      <button
        type="button"
        onClick={() => setShowColumnMenu(o => !o)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border text-[0.8125rem] bg-white dark:bg-[#252525] border-[#EAEAEA] dark:border-white/[0.08] text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] transition-colors"
      >
        <Columns className="w-4 h-4" />
        Columns
      </button>
      {showColumnMenu && (
        <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] z-50 p-2" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}>
          <div className="text-[0.6875rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] mb-2 px-2 uppercase tracking-wider">Show / Hide</div>
          {Object.keys(COLUMN_LABELS).map(id => (
            <label key={id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[4px] cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-[#2563EB] cursor-pointer"
                checked={columnVisibility[id] !== false}
                onChange={() =>
                  setColumnVisibility(prev => ({ ...prev, [id]: prev[id] === false }))
                }
              />
              <span className="text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7]">{COLUMN_LABELS[id]}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );

  const [listSplitSortBy, setListSplitSortBy] = useState<ListSplitSortField>("key");
  const [listSplitSortDir, setListSplitSortDir] = useState<"asc" | "desc">("asc");
  const [listSplitOrderOpen, setListSplitOrderOpen] = useState(false);
  const listSplitToolbarRef = useRef<HTMLDivElement>(null);
  const splitJustActivatedRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!workspaceId) return;
    try {
      const saved = localStorage.getItem(`list_view_mode_${workspaceId}`);
      if (mountedRef.current) {
        setListViewMode(saved === "split" ? "split" : "grid");
      }
    } catch {
      /* ignore */
    }
  }, [workspaceId, setListViewMode]);

  useEffect(() => {
    const handle = (event: MouseEvent) => {
      if (
        listSplitOrderOpen &&
        listSplitToolbarRef.current &&
        !listSplitToolbarRef.current.contains(event.target as Node)
      ) {
        setListSplitOrderOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [listSplitOrderOpen]);

  useEffect(() => {
    if (listViewMode !== "split") return;
    if (splitJustActivatedRef.current) {
      splitJustActivatedRef.current = false;
      const first = splitSortedIssues[0];
      if (first) setSelectedIssue(first);
      return;
    }
    if (splitSortedIssues.length === 0) {
      setSelectedIssue(null);
      return;
    }
    if (!selectedIssue || !splitSortedIssues.some((i) => i.id === selectedIssue.id)) {
      setSelectedIssue(splitSortedIssues[0]);
    }
    // splitSortedIssues intentionally excluded — we only want to react to mode/sort changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listViewMode, listSplitSortBy, listSplitSortDir]);

  const splitSortedIssues = useMemo(() => {
    const arr = [...filteredIssues];
    const mul = listSplitSortDir === "asc" ? 1 : -1;
    const priorityRank = (p?: string) =>
      p === "High" ? 3 : p === "Medium" ? 2 : p === "Low" ? 1 : 0;
    const statusRank = (s?: string) =>
      s === "To Do" ? 1 : s === "In Progress" ? 2 : s === "Done" ? 3 : 0;
    const keyNum = (issue: Issue) => {
      const match = issue.key.match(/-(\d+)$/);
      return match ? Number(match[1]) : 0;
    };

    arr.sort((a, b) => {
      let cmp = 0;
      switch (listSplitSortBy) {
        case "created":
          cmp =
            new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
        case "key":
          cmp = keyNum(a) - keyNum(b);
          break;
        case "lastViewed":
          cmp =
            new Date(a.updatedAt || a.createdAt || 0).getTime() -
            new Date(b.updatedAt || b.createdAt || 0).getTime();
          break;
        case "priority":
          cmp = priorityRank(a.priority) - priorityRank(b.priority);
          break;
        case "resolved":
          cmp = (a.status === "Done" ? 1 : 0) - (b.status === "Done" ? 1 : 0);
          break;
        case "status":
          cmp = statusRank(a.status) - statusRank(b.status);
          break;
        case "updated":
          cmp =
            new Date(a.updatedAt || a.createdAt || 0).getTime() -
            new Date(b.updatedAt || b.createdAt || 0).getTime();
          break;
        default:
          cmp = String(a.title || "").localeCompare(String(b.title || ""));
      }
      return mul * cmp;
    });
    return arr;
  }, [filteredIssues, listSplitSortBy, listSplitSortDir]);

  const setListViewModePersisted = (mode: "grid" | "split") => {
    if (mode === "grid") {
      setListGridDrawerOpen(false);
      setSelectedIssue(null);
    }
    setListViewMode(mode);
    try {
      localStorage.setItem(`list_view_mode_${workspaceId}`, mode);
    } catch {
      /* ignore */
    }
  };

  const viewToggle = (
    <div className="ml-auto inline-flex items-center rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] overflow-hidden shrink-0">
      <button
        type="button"
        onClick={() => setListViewModePersisted("grid")}
        title="Table view"
        className={`p-1.5 transition-colors ${
          listViewMode === "grid"
            ? "bg-[#2563EB] dark:bg-[#3B82F6] text-white"
            : "text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          splitJustActivatedRef.current = true;
          setListGridDrawerOpen(false);
          setListViewModePersisted("split");
        }}
        title="Split view"
        className={`p-1.5 transition-colors border-l border-[#EAEAEA] dark:border-white/[0.06] ${
          listViewMode === "split"
            ? "bg-[#2563EB] dark:bg-[#3B82F6] text-white"
            : "text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
        }`}
      >
        <PanelRight className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="workspace-panel bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] transition-all duration-200">
      <BoardFilters
        filters={filters}
        setFilters={setFilters}
        uniqueAssignees={uniqueAssignees}
        extraActions={<>{columnsButton}{viewToggle}</>}
      />

      {listViewMode === "grid" ? (
        selectedIssue ? (
          <div className="workspace-list-height overflow-hidden rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] transition-all duration-200">
            <TaskDetailList
              issue={selectedIssue}
              workspaceId={workspaceId}
              workspaceMembers={members}
              sprints={sprints}
              boardColumns={boardColumns}
              workspaceTemplate={workspaceTemplate}
              showBackButton
              onClose={() => {
                setSelectedIssue(null);
                setListGridDrawerOpen(false);
              }}
              onUpdateIssue={canEditTask ? handleUpdateIssue : undefined}
              onFieldUpdate={canEditTask ? updateIssueDirectly : undefined}
              canEditTask={canEditTask}
            />
          </div>
        ) : (
          <div className="flex w-full overflow-hidden workspace-list-height transition-all duration-200">
            <div className="flex-1 overflow-x-auto min-w-0">
            <DataGridListView
              issues={filteredIssues}
              workspaceId={workspaceId}
              members={members}
              boardColumns={boardColumns}
              columnVisibility={columnVisibility}
              setColumnVisibility={setColumnVisibility}
              onClickTask={(issue) => setSelectedIssue(issue)}
              onUpdateIssue={canEditTask ? (id, updates) => updateIssueDirectly(id, updates) : undefined}
              onCreateTask={onCreateTask}
              onBulkUpdate={canEditTask ? onBulkUpdateIds : undefined}
              onBulkDelete={canDeleteTask && onBulkDeleteIds ? async (ids) => onBulkDeleteIds(ids) : undefined}
              hideCreate={!onCreateTask}
              canEditTask={canEditTask}
              canDeleteTask={canDeleteTask}
            />
            </div>
          </div>
        )
      ) : (
        <div className="workspace-list-height flex flex-col lg:grid lg:grid-cols-[var(--workspace-list-sidebar-w)_minmax(0,1fr)] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] overflow-hidden">
          <aside className="flex flex-col border-b lg:border-b-0 lg:border-r border-[#EAEAEA] dark:border-white/[0.06] bg-[#F9F9F8] dark:bg-[#252525] shrink-0 max-h-[45vh] lg:max-h-none min-h-0">
            <div
              ref={listSplitToolbarRef}
              className="flex items-center gap-1.5 px-2 py-2 border-b border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] shrink-0"
            >
              <div className="relative flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setListSplitOrderOpen((o) => !o)}
                  title={`Order work items by: ${LIST_SPLIT_SORT_OPTIONS.find((o) => o.id === listSplitSortBy)?.label ?? listSplitSortBy} (${listSplitSortDir})`}
                  className={`flex w-full items-center justify-between gap-2 rounded-[6px] border bg-white dark:bg-[#202020] px-2.5 py-1.5 text-left text-[0.8125rem] font-medium transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] ${
                    listSplitOrderOpen
                      ? "border-[#2563EB] dark:border-[#3B82F6] text-[#2563EB] dark:text-[#3B82F6]"
                      : "border-[#EAEAEA] dark:border-white/[0.08] text-[#111111] dark:text-[#E8E8E7]"
                  }`}
                >
                  <span className="truncate">Custom field</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 ${listSplitOrderOpen ? "text-[#2563EB] dark:text-[#3B82F6]" : "text-[#ABABAB] dark:text-[#6B6B6B]"}`}
                  />
                </button>
                {listSplitOrderOpen && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] py-1" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}>
                    <div className="px-3 py-2 text-[0.6875rem] font-semibold uppercase tracking-wide text-[#ABABAB] dark:text-[#6B6B6B]">
                      Order work items by
                    </div>
                    {LIST_SPLIT_SORT_OPTIONS.map((opt) => (
                      <label
                        key={opt.id}
                        className="flex cursor-pointer items-center gap-2 px-3 py-2 text-[0.8125rem] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
                      >
                        <input
                          type="radio"
                          name="list-split-sort"
                          checked={listSplitSortBy === opt.id}
                          onChange={() => {
                            setListSplitSortBy(opt.id);
                            setListSplitOrderOpen(false);
                          }}
                          className="accent-[#2563EB]"
                        />
                        <span className="text-[#111111] dark:text-[#E8E8E7]">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                title={listSplitSortDir === "asc" ? "Sort ascending" : "Sort descending"}
                onClick={() =>
                  setListSplitSortDir((d) => (d === "asc" ? "desc" : "asc"))
                }
                className="shrink-0 rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.08] bg-[#F9F9F8] dark:bg-[#252525] p-2 text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
              >
                <ArrowDownWideNarrow
                  className={`h-4 w-4 ${listSplitSortDir === "asc" ? "rotate-180" : ""}`}
                />
              </button>
              <button
                type="button"
                title="Reset sort"
                onClick={() => {
                  setListSplitSortBy("key");
                  setListSplitSortDir("asc");
                }}
                className="shrink-0 rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.08] bg-white dark:bg-[#202020] p-2 text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {splitSortedIssues.length === 0 ? (
                <p className="p-4 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                  No tasks match the current filter.
                </p>
              ) : (
                <>
                  <ul className="flex-1 space-y-1 overflow-y-auto p-2">
                    {splitSortedIssues.map((issue) => {
                      const active = selectedIssue?.id === issue.id;
                      const issueKey = issue.key;
                      const resolvedCol = boardColumns?.find(c => c.id === issue.status || c.name === issue.status);
                      const statusName = resolvedCol?.name ?? issue.status;
                      return (
                        <li key={issue.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedIssue(issue)}
                            className={`w-full rounded-[6px] border px-3 py-2.5 text-left transition-colors ${
                              active
                                ? "border-[#2563EB]/30 bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.08)]"
                                : "border-transparent bg-white dark:bg-[#202020] hover:border-[#EAEAEA] dark:hover:border-white/[0.08] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <FileText
                                className={`h-4 w-4 shrink-0 ${
                                  issue.type === "Bug"
                                    ? "text-red-500"
                                    : issue.type === "Story"
                                      ? "text-emerald-500"
                                      : "text-blue-500"
                                }`}
                              />
                              <span className="shrink-0 font-mono text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">
                                {issueKey}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7]">
                              {issue.title}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span
                                className={`rounded-[4px] px-1.5 py-0.5 text-[0.625rem] font-semibold ${
                                  resolvedCol?.isDone || statusName.toLowerCase().includes("done")
                                    ? "bg-[#EDF3EC] dark:bg-[rgba(52,101,56,0.12)] text-[#346538] dark:text-[#4ADE80]"
                                    : statusName.toLowerCase().includes("progress")
                                      ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#1F6C9F] dark:text-[#93C5FD]"
                                      : "bg-[#F7F6F3] dark:bg-[#252525] text-[#787774] dark:text-[#9B9A97]"
                                }`}
                              >
                                {statusName}
                              </span>
                              {issue.priority && (
                                <span className="rounded-[4px] bg-[#FBF3DB] dark:bg-[rgba(149,100,0,0.12)] px-1.5 py-0.5 text-[0.625rem] font-semibold text-[#956400] dark:text-[#F59E0B]">
                                  {issue.priority}
                                </span>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="shrink-0 border-t border-[#EAEAEA] dark:border-white/[0.06] bg-[#F9F9F8] dark:bg-[#252525] px-3 py-2 text-center text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">
                    {splitSortedIssues.length} of {splitSortedIssues.length}
                  </div>
                </>
              )}
            </div>
          </aside>

          <section className="flex min-h-80 flex-col overflow-hidden bg-white dark:bg-[#202020] lg:min-h-0">
            {!selectedIssue ? (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                Select a task in the left column to view details.
              </div>
            ) : splitSortedIssues.some((i) => i.id === selectedIssue.id) ? (
              <TaskDetailList
                issue={selectedIssue}
                workspaceId={workspaceId}
                workspaceMembers={members}
                sprints={sprints}
                boardColumns={boardColumns}
                workspaceTemplate={workspaceTemplate}
                showBackButton={false}
                onClose={() => {
                  setSelectedIssue(null);
                  setListGridDrawerOpen(false);
                }}
                onUpdateIssue={canEditTask ? handleUpdateIssue : undefined}
                onFieldUpdate={canEditTask ? updateIssueDirectly : undefined}
                canEditTask={canEditTask}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                The selected task is no longer in the filtered list.{" "}
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="ml-1 font-medium text-[#2563EB] dark:text-[#3B82F6] hover:underline"
                >
                  Clear selection
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
