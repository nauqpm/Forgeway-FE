"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  LayoutGrid,
  PanelRight,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ArrowDownWideNarrow,
  RotateCw,
  FileText,
} from "lucide-react";
import { Issue } from "../../types/issue.type";
import DataGridListView from "@/modules/admin/components/common/components/DataGridListView";
import TaskDetailList from "../TaskDetailList";

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
  listViewMode: "grid" | "split";
  setSelectedIssue: (issue: Issue | null) => void;
  setListViewMode: (mode: "grid" | "split") => void;
  setListGridDrawerOpen: (open: boolean) => void;
  updateIssueDirectly: (issueId: string, updates: Partial<Issue>) => void;
  handleUpdateIssue: (updated: Issue) => void;
  onBulkDeleteIds?: (ids: string[]) => void;
};

export default function ListTab({
  filteredIssues,
  selectedIssue,
  workspaceId,
  listViewMode,
  setSelectedIssue,
  setListViewMode,
  setListGridDrawerOpen,
  updateIssueDirectly,
  handleUpdateIssue,
  onBulkDeleteIds,
}: ListTabProps) {
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

  const listToolbar = (
    <div className="flex items-center gap-2 mb-3 px-1">
      {/* Left: Search + Filter */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search issues..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-1 focus:ring-[#0052CC] focus:border-[#0052CC] transition-colors"
          />
        </div>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md transition-colors">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter
        </button>
      </div>

      {/* Right: Table / Split icon-only toggle */}
      <div className="inline-flex items-center rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0">
        <button
          type="button"
          onClick={() => setListViewModePersisted("grid")}
          title="Table view"
          className={`p-1.5 transition-colors ${
            listViewMode === "grid"
              ? "bg-[#0052CC] text-white"
              : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
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
          className={`p-1.5 transition-colors border-l border-gray-200 dark:border-gray-700 ${
            listViewMode === "split"
              ? "bg-[#0052CC] text-white"
              : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <PanelRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="workspace-panel bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-200">
      {(listViewMode === "split" || !selectedIssue) && listToolbar}

      {listViewMode === "grid" ? (
        selectedIssue ? (
          <div className="workspace-list-height overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 transition-all duration-200">
            <TaskDetailList
              issue={selectedIssue}
              workspaceId={workspaceId}
              showBackButton
              onClose={() => {
                setSelectedIssue(null);
                setListGridDrawerOpen(false);
              }}
              onUpdateIssue={handleUpdateIssue}
            />
          </div>
        ) : (
          <div className="flex w-full overflow-hidden workspace-list-height transition-all duration-200">
            <div className="flex-1 overflow-x-auto min-w-0">
            <DataGridListView
              issues={filteredIssues}
              onClickTask={(issue) => setSelectedIssue(issue)}
              onUpdateIssue={(id, updates) => updateIssueDirectly(id, updates)}
              onBulkUpdate={async (ids, updates) => ids.forEach(id => updateIssueDirectly(id, updates))}
              onBulkDelete={onBulkDeleteIds ? async (ids) => onBulkDeleteIds(ids) : undefined}
            />
            </div>
          </div>
        )
      ) : (
        <div className="workspace-list-height flex flex-col lg:grid lg:grid-cols-[var(--workspace-list-sidebar-w)_minmax(0,1fr)] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <aside className="flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 shrink-0 max-h-[45vh] lg:max-h-none min-h-0">
            <div
              ref={listSplitToolbarRef}
              className="flex items-center gap-1.5 px-2 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0"
            >
              <div className="relative flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setListSplitOrderOpen((o) => !o)}
                  title={`Order work items by: ${LIST_SPLIT_SORT_OPTIONS.find((o) => o.id === listSplitSortBy)?.label ?? listSplitSortBy} (${listSplitSortDir})`}
                  className={`flex w-full items-center justify-between gap-2 rounded-md border bg-white dark:bg-gray-900 px-2.5 py-1.5 text-left text-sm font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    listSplitOrderOpen
                      ? "border-blue-500 dark:border-blue-500 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-900"
                      : "border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  <span className="truncate">Custom field</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 ${listSplitOrderOpen ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}
                  />
                </button>
                {listSplitOrderOpen && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-1 shadow-lg">
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Order work items by
                    </div>
                    {LIST_SPLIT_SORT_OPTIONS.map((opt) => (
                      <label
                        key={opt.id}
                        className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <input
                          type="radio"
                          name="list-split-sort"
                          checked={listSplitSortBy === opt.id}
                          onChange={() => {
                            setListSplitSortBy(opt.id);
                            setListSplitOrderOpen(false);
                          }}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>{opt.label}</span>
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
                className="shrink-0 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                className="shrink-0 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {splitSortedIssues.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                  Không có issue trong bộ lọc hiện tại.
                </p>
              ) : (
                <>
                  <ul className="flex-1 space-y-1 overflow-y-auto p-2">
                    {splitSortedIssues.map((issue) => {
                      const active = selectedIssue?.id === issue.id;
                      const issueKey = issue.key;
                      return (
                        <li key={issue.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedIssue(issue)}
                            className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                              active
                                ? "border-indigo-400 bg-white dark:bg-gray-800 shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-800"
                                : "border-transparent bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                              <span className="shrink-0 font-mono text-xs text-gray-500 dark:text-gray-400">
                                {issueKey}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                              {issue.title}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                  issue.status === "Done"
                                    ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                    : issue.status === "In Progress"
                                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {issue.status}
                              </span>
                              {issue.priority && (
                                <span className="rounded bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-400">
                                  {issue.priority}
                                </span>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-center text-xs text-gray-600 dark:text-gray-400">
                    {splitSortedIssues.length} of {splitSortedIssues.length}
                  </div>
                </>
              )}
            </div>
          </aside>

          <section className="flex min-h-[320px] flex-col overflow-hidden bg-white dark:bg-gray-900 lg:min-h-0">
            {!selectedIssue ? (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Chọn một issue ở cột trái để xem chi tiết.
              </div>
            ) : splitSortedIssues.some((i) => i.id === selectedIssue.id) ? (
              <TaskDetailList
                issue={selectedIssue}
                workspaceId={workspaceId}
                showBackButton={false}
                onClose={() => {
                  setSelectedIssue(null);
                  setListGridDrawerOpen(false);
                }}
                onUpdateIssue={handleUpdateIssue}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Issue đang chọn không còn trong danh sách sau khi lọc.{" "}
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="ml-1 font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Bỏ chọn
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
