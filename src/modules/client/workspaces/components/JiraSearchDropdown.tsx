"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckSquare, FolderKanban, Kanban, Search, SlidersHorizontal, Sparkles, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Filters, TaskFilters } from "../types/filter.type";
import { taskService } from "../services/taskService";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import RecentItem from "./RecentItem";
import TaskFilterPanel from "./TaskFilterPanel";

type JiraSearchDropdownProps = {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  projects?: { id: string; name: string; key: string }[];
  assignees?: { id: string; name: string; avatar?: string }[];
  workspaceKey: string;
  currentUserId?: string;
  currentUserName?: string;
  className?: string;
  inputClassName?: string;
};

const apps = ["Task", "Docs"];
const goToLinks = ["Boards", "Projects", "Filters", "Plans", "People"];
const TASK_KEY_PATTERN = /^[A-Z][A-Z0-9]*-\d+$/i;

const toSuggestionTaskFilters = (filters: Filters): TaskFilters => ({
  status: filters.statuses,
  type: filters.types,
  priority: filters.priorities,
  assigneeId: filters.assignees.length > 0 ? filters.assignees : filters.assigneeId ?? undefined,
  reporterId: filters.reporterId ?? undefined,
  backlog: filters.backlog,
  archived: filters.archived,
  limit: 100,
});

const compactSearchText = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

const matchesTaskSearch = (task: { key: string; title: string }, search: string) => {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  const compactQuery = compactSearchText(query);
  return (
    task.key.toLowerCase().includes(query) ||
    task.title.toLowerCase().includes(query) ||
    compactSearchText(task.key).includes(compactQuery) ||
    compactSearchText(task.title).includes(compactQuery)
  );
};

const matchesLastUpdated = (updatedAt: string | undefined, lastUpdated?: string | null) => {
  if (!lastUpdated || lastUpdated === "Any time") return true;
  if (!updatedAt) return false;

  const updated = new Date(updatedAt);
  if (Number.isNaN(updated.getTime())) return false;

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const startOfRange = (daysAgo: number) => {
    const start = new Date(startOfToday);
    start.setDate(start.getDate() - daysAgo);
    return start;
  };

  if (lastUpdated === "Today") return updated >= startOfToday && updated <= now;
  if (lastUpdated === "Yesterday") {
    return updated >= startOfYesterday && updated < startOfToday;
  }
  if (lastUpdated === "Past 7 days") return updated >= startOfRange(6) && updated <= now;
  if (lastUpdated === "Past 30 days") return updated >= startOfRange(29) && updated <= now;
  if (lastUpdated === "Past year") {
    const start = new Date(startOfToday);
    start.setFullYear(start.getFullYear() - 1);
    return updated >= start && updated <= now;
  }

  return true;
};

export default function JiraSearchDropdown({
  filters,
  setFilters,
  projects = [],
  assignees = [],
  workspaceKey,
  currentUserId,
  currentUserName,
  className = "px-[var(--workspace-surface-pad)] pt-[var(--workspace-surface-pad)]",
  inputClassName = "h-12 text-base",
}: JiraSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeApp, setActiveApp] = useState("Jira");
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const inputWrapRef = useRef<HTMLDivElement>(null);
  const activeWorkspaceKey = filters.workspaceKey || workspaceKey;
  const { currentWorkspace } = useWorkspaceStore();
  const workspaceId = currentWorkspace?._id ?? "";
  const suggestionTaskFilters = toSuggestionTaskFilters(filters);

  const { data: searchTasks = [], isFetching: isFetchingTasks } = useQuery({
    queryKey: ["jira-search-tasks", workspaceId, suggestionTaskFilters],
    queryFn: () => taskService.getBoardTasks(workspaceId, suggestionTaskFilters),
    enabled: isOpen && Boolean(workspaceId),
    staleTime: 15_000,
  });

  const visibleTasks = searchTasks
    .filter((task) => matchesTaskSearch(task, filters.search))
    .filter((task) => matchesLastUpdated(task.updatedAt, filters.lastUpdated))
    .slice(0, 8);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    const updatePosition = () => {
      const rect = inputWrapRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportPadding = 24;
      const left = Math.max(16, rect.left);
      const availableWidth = window.innerWidth - left - viewportPadding;
      const width = Math.min(900, Math.max(320, availableWidth));

      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left,
        width,
        zIndex: 9999,
      });
    };

    if (!isOpen) return;

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  const handleSearchChange = (value: string) => {
    const trimmed = value.trim();
    setFilters((prev) => ({
      ...prev,
      search: value,
      taskKey: TASK_KEY_PATTERN.test(trimmed) ? trimmed.toUpperCase() : null,
    }));
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div ref={inputWrapRef} className="relative w-full">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={filters.search}
            onFocus={() => setIsOpen(true)}
            onClick={() => setIsOpen(true)}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search"
            className={`${inputClassName} w-full rounded-[10px] border border-gray-300 bg-white pl-10 pr-11 font-medium text-gray-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-500`}
          />
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
            aria-label="Open task filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
      </div>

      {isOpen && (
        <div
          style={dropdownStyle}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="grid h-[min(76vh,640px)] grid-cols-1 overflow-hidden lg:grid-cols-[minmax(320px,0.95fr)_minmax(340px,1.05fr)]">
            <div className="min-h-0 overflow-y-auto border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 lg:border-b-0 lg:border-r">
              <div className="mb-4 flex rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
                {apps.map((app) => (
                  <button
                    key={app}
                    type="button"
                    onClick={() => setActiveApp(app)}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                      activeApp === app
                        ? "bg-white text-indigo-600 shadow-sm dark:bg-gray-800 dark:text-indigo-400"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                    }`}
                  >
                    {app}
                  </button>
                ))}
              </div>

              <div className="space-y-5">
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Recently viewed</h3>
                  {isFetchingTasks && (
                    <p className="px-2 py-2 text-sm text-gray-500 dark:text-gray-400">Loading work items...</p>
                  )}
                  {!isFetchingTasks && visibleTasks.length === 0 && (
                    <p className="px-2 py-2 text-sm text-gray-500 dark:text-gray-400">No work items match these filters.</p>
                  )}
                  {visibleTasks.map((task) => (
                    <RecentItem
                      key={task.id}
                      icon={CheckSquare}
                      title={`${task.key} ${task.title}`}
                      meta={`${task.type} · ${task.status} · ${task.priority}`}
                      tone="red"
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          search: task.key,
                          taskKey: task.key,
                        }));
                        setIsOpen(false);
                      }}
                    />
                  ))}
                </section>

                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Recent boards, projects, filters and plans</h3>
                  {(projects.length > 0 ? projects : [{ id: activeWorkspaceKey, name: `${activeWorkspaceKey} board`, key: activeWorkspaceKey }])
                    .slice(0, 6)
                    .map((project) => (
                      <RecentItem
                        key={project.id}
                        icon={project.key === activeWorkspaceKey ? Kanban : FolderKanban}
                        title={project.key === activeWorkspaceKey ? `${project.key} board` : `${project.name} (${project.key})`}
                        meta={project.key === activeWorkspaceKey ? "Board" : "Project"}
                        tone={project.key === activeWorkspaceKey ? "red" : "gray"}
                      />
                    ))}
                  <RecentItem icon={Sparkles} title="Open issues" meta="Filter" />
                </section>
              </div>

              <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-700">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Go to all</div>
                <div className="flex flex-wrap gap-2">
                  {goToLinks.map((item) => (
                    <button key={item} type="button" className="rounded-md border border-gray-200 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-gray-800 dark:text-gray-300 dark:hover:border-indigo-900 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300">
                      {item}
                    </button>
                  ))}
                </div>
                <button type="button" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                  <Search className="h-4 w-4" /> View all work items
                </button>
              </div>
            </div>

            <div className="min-h-0 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-800/60">
              <TaskFilterPanel
                filters={filters}
                setFilters={setFilters}
                projects={projects}
                assignees={assignees}
                workspaceKey={workspaceKey}
                selectedWorkspaceKey={activeWorkspaceKey}
                onSelectWorkspace={(nextWorkspaceKey) => {
                  setFilters((prev) => ({
                    ...prev,
                    workspaceKey: nextWorkspaceKey,
                  }));
                }}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
              />
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                <Users className="h-4 w-4 text-indigo-500" />
                Filters apply to workspace tasks when you are inside a workspace.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
