"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckSquare, FolderKanban, Kanban, Search, SlidersHorizontal, Sparkles, Users } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { Filters, TaskFilters } from "../types/filter.type";
import { taskService } from "../services/taskService";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import RecentItem from "./RecentItem";
import TaskFilterPanel from "./TaskFilterPanel";

type SearchDropdownProps = {
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

const useDebouncedValue = <T,>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debouncedValue;
};

const toSuggestionTaskFilters = (filters: Filters, search: string): TaskFilters => ({
  status: filters.statuses,
  type: filters.types,
  priority: filters.priorities,
  assigneeId: filters.assignees.length > 0 ? filters.assignees : filters.assigneeId ?? undefined,
  reporterId: filters.reporterId ?? undefined,
  search: search.trim() || undefined,
  backlog: filters.backlog,
  archived: filters.archived,
  limit: 20,
});

const toFallbackTaskFilters = (filters: Filters): TaskFilters => ({
  status: filters.statuses,
  type: filters.types,
  priority: filters.priorities,
  assigneeId: filters.assignees.length > 0 ? filters.assignees : filters.assigneeId ?? undefined,
  reporterId: filters.reporterId ?? undefined,
  backlog: filters.backlog,
  archived: filters.archived,
  limit: 100,
});

const normalizeSearch = (value: string) => value.trim().toLowerCase();

const normalizeCompactSearch = (value: string) =>
  normalizeSearch(value).replace(/[^a-z0-9]/g, "");

const matchesFallbackSearch = (
  task: { key: string; title: string; description?: string },
  search: string,
) => {
  const query = normalizeSearch(search);
  if (!query) return true;

  const compactQuery = normalizeCompactSearch(query);
  const exactKey = /^[a-z][a-z0-9]*-\d+$/i.test(query);
  const key = normalizeSearch(task.key);
  const title = normalizeSearch(task.title);
  const description = normalizeSearch(task.description ?? "");

  if (exactKey) return key === query;

  if (query.length === 1) {
    return (
      key.includes(query) ||
      title.includes(query) ||
      normalizeCompactSearch(task.key).includes(compactQuery) ||
      normalizeCompactSearch(task.title).includes(compactQuery)
    );
  }

  return (
    key.includes(query) ||
    title.includes(query) ||
    description.includes(query) ||
    normalizeCompactSearch(task.key).includes(compactQuery) ||
    normalizeCompactSearch(task.title).includes(compactQuery) ||
    normalizeCompactSearch(task.description ?? "").includes(compactQuery)
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

export default function SearchDropdown({
  filters,
  setFilters,
  projects = [],
  assignees = [],
  workspaceKey,
  currentUserId,
  currentUserName,
  className = "px-[var(--workspace-surface-pad)] pt-[var(--workspace-surface-pad)]",
  inputClassName = "h-12 text-base",
}: SearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeApp, setActiveApp] = useState("Jira");
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const inputWrapRef = useRef<HTMLDivElement>(null);
  const activeWorkspaceKey = filters.workspaceKey || workspaceKey;
  const activeWorkspaceKeys =
    Array.isArray(filters.workspaceKeys)
      ? filters.workspaceKeys
      : [activeWorkspaceKey].filter(Boolean);
  const { currentWorkspace } = useWorkspaceStore();
  const workspaceTargets = activeWorkspaceKeys
    .map((key) => {
      const project = projects.find((item) => item.key === key);
      const id =
        project?.id ||
        (currentWorkspace?.key === key || currentWorkspace?.slug === key
          ? currentWorkspace?._id
          : "");
      return id ? { id, key } : null;
    })
    .filter(Boolean) as { id: string; key: string }[];
  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const suggestionTaskFilters = toSuggestionTaskFilters(filters, debouncedSearch);
  const fallbackTaskFilters = toFallbackTaskFilters(filters);

  const searchQueries = useQueries({
    queries: workspaceTargets.map((target) => ({
      queryKey: ["search-dropdown-tasks", target.id, suggestionTaskFilters],
      queryFn: () => taskService.getBoardTasks(target.id, suggestionTaskFilters),
      enabled: isOpen,
      staleTime: 15_000,
    })),
  });
  const searchTasks = searchQueries.flatMap((query) => query.data ?? []);
  const isFetchingTasks = searchQueries.some((query) => query.isFetching);

  const shouldUseFallbackSearch =
    isOpen &&
    workspaceTargets.length > 0 &&
    Boolean(debouncedSearch.trim()) &&
    !isFetchingTasks &&
    searchTasks.length === 0;

  const fallbackQueries = useQueries({
    queries: workspaceTargets.map((target) => ({
      queryKey: ["search-dropdown-fallback-tasks", target.id, fallbackTaskFilters],
      queryFn: () => taskService.getBoardTasks(target.id, fallbackTaskFilters),
      enabled: shouldUseFallbackSearch,
      staleTime: 15_000,
    })),
  });
  const fallbackTasks = fallbackQueries.flatMap((query) => query.data ?? []);
  const isFetchingFallbackTasks = fallbackQueries.some((query) => query.isFetching);

  const taskResults = shouldUseFallbackSearch
    ? fallbackTasks.filter((task) => matchesFallbackSearch(task, debouncedSearch))
    : searchTasks;

  const visibleTasks = taskResults
    .filter((task) => matchesLastUpdated(task.updatedAt, filters.lastUpdated))
    .slice(0, 8);
  const isLoadingTasks = isFetchingTasks || isFetchingFallbackTasks;

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
    setFilters((prev) => ({
      ...prev,
      search: value,
      taskKey: null,
    }));
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div ref={inputWrapRef} className="relative w-full">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ABABAB] dark:text-[#6B6B6B]" />
          <input
            value={filters.search}
            onFocus={() => setIsOpen(true)}
            onClick={() => setIsOpen(true)}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search"
            className={`${inputClassName} w-full rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#2A2A2A] pl-10 pr-11 font-medium text-[#111111] dark:text-[#E8E8E7] outline-none transition-colors focus:border-[#2563EB] dark:focus:border-[#3B82F6] placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B]`}
          />
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[4px] text-[#ABABAB] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
            aria-label="Open task filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
      </div>

      {isOpen && (
        <div
          style={{ ...dropdownStyle, boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
          className="overflow-hidden rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#252525]"
        >
          <div className="grid h-[min(76vh,640px)] grid-cols-1 overflow-hidden lg:grid-cols-[minmax(320px,0.95fr)_minmax(340px,1.05fr)]">
            <div className="min-h-0 overflow-y-auto border-b border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#252525] p-4 lg:border-b-0 lg:border-r">
              <div className="mb-4 flex rounded-[6px] bg-[#F9F9F8] dark:bg-[#252525] p-1">
                {apps.map((app) => (
                  <button
                    key={app}
                    type="button"
                    onClick={() => setActiveApp(app)}
                    className={`flex-1 rounded-[4px] px-3 py-2 text-[13px] font-medium transition-colors ${
                      activeApp === app
                        ? "bg-white dark:bg-[#252525] text-[#2563EB] dark:text-[#3B82F6]"
                        : "text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-white/5"
                    }`}
                  >
                    {app}
                  </button>
                ))}
              </div>

              <div className="space-y-5">
                <section>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#ABABAB] dark:text-[#6B6B6B]">Recently viewed</h3>
                  {isLoadingTasks && (
                    <p className="px-2 py-2 text-[13px] text-[#787774] dark:text-[#9B9A97]">Loading work items...</p>
                  )}
                  {!isLoadingTasks && workspaceTargets.length === 0 && (
                    <p className="px-2 py-2 text-[13px] text-[#787774] dark:text-[#9B9A97]">Select a workspace to search work items.</p>
                  )}
                  {!isLoadingTasks && workspaceTargets.length > 0 && visibleTasks.length === 0 && (
                    <p className="px-2 py-2 text-[13px] text-[#787774] dark:text-[#9B9A97]">No work items match these filters.</p>
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
                          taskKey: null,
                        }));
                        setIsOpen(false);
                      }}
                    />
                  ))}
                </section>

                <section>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#ABABAB] dark:text-[#6B6B6B]">Recent boards, projects, filters and plans</h3>
                  {(projects.length > 0 ? projects : [{ id: activeWorkspaceKey, name: `${activeWorkspaceKey} board`, key: activeWorkspaceKey }])
                    .slice(0, 6)
                    .map((project, index) => (
                      <RecentItem
                        key={project.id || project.key || `${project.name}-${index}`}
                        icon={project.key === activeWorkspaceKey ? Kanban : FolderKanban}
                        title={project.key === activeWorkspaceKey ? `${project.key} board` : `${project.name} (${project.key})`}
                        meta={project.key === activeWorkspaceKey ? "Board" : "Project"}
                        tone={project.key === activeWorkspaceKey ? "red" : "gray"}
                      />
                    ))}
                  <RecentItem icon={Sparkles} title="Open issues" meta="Filter" />
                </section>
              </div>

              <div className="mt-5 border-t border-[#EAEAEA] dark:border-white/8 pt-4">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#ABABAB] dark:text-[#6B6B6B]">Go to all</div>
                <div className="flex flex-wrap gap-2">
                  {goToLinks.map((item) => (
                    <button key={item} type="button" className="rounded-[4px] border border-[#EAEAEA] dark:border-white/10 px-2.5 py-1.5 text-[13px] font-medium text-[#787774] dark:text-[#9B9A97] hover:border-[#2563EB]/30 hover:bg-[#EFF6FF] dark:hover:bg-[rgba(37,99,235,0.08)] hover:text-[#1F6C9F] dark:hover:text-[#93C5FD] transition-colors">
                      {item}
                    </button>
                  ))}
                </div>
                <button type="button" className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] dark:text-[#3B82F6] transition-colors">
                  <Search className="h-4 w-4" /> View all work items
                </button>
              </div>
            </div>

            <div className="min-h-0 overflow-y-auto bg-[#F9F9F8] dark:bg-[#252525] p-4">
              <TaskFilterPanel
                filters={filters}
                setFilters={setFilters}
                projects={projects}
                assignees={assignees}
                workspaceKey={workspaceKey}
                selectedWorkspaceKey={activeWorkspaceKey}
                selectedWorkspaceKeys={activeWorkspaceKeys}
                onSelectWorkspace={(nextWorkspaceKey) => {
                  setFilters((prev) => ({
                    ...prev,
                    workspaceKey: nextWorkspaceKey,
                    workspaceKeys: [nextWorkspaceKey],
                  }));
                }}
                onToggleWorkspace={(nextWorkspaceKey) => {
                  setFilters((prev) => {
                    const current = Array.isArray(prev.workspaceKeys)
                      ? prev.workspaceKeys
                      : [activeWorkspaceKey].filter(Boolean);
                    const next = current.includes(nextWorkspaceKey)
                      ? current.filter((key) => key !== nextWorkspaceKey)
                      : [...current, nextWorkspaceKey];

                    return {
                      ...prev,
                      workspaceKey: next[0] ?? null,
                      workspaceKeys: next,
                    };
                  });
                }}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
              />
              <div className="mt-4 flex items-center gap-2 rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#252525] px-3 py-2 text-[11px] text-[#787774] dark:text-[#9B9A97]">
                <Users className="h-4 w-4 text-[#2563EB] dark:text-[#3B82F6]" />
                Filters apply to workspace tasks when you are inside a workspace.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
