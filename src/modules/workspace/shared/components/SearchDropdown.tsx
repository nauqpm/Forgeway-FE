"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CheckSquare, FileText, Filter, FolderKanban, Kanban, Search, Sparkles, Users, UserRound } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Filters, TaskFilters } from "../types/filter.type";
import { taskService } from "../services/taskService";
import { useCurrentWorkspace } from "../hooks/useWorkspaces";
import { queryKeys } from "@/shared/constants/queryKeys";
import RecentItem from "./RecentItem";
import TaskFilterPanel from "./TaskFilterPanel";
import { useGlobalSearch } from "../hooks/useGlobalSearch";
import type { GlobalSearchItem, GlobalSearchType } from "../services/globalSearch.service";
import { pagesService } from "@/modules/docs/services/pages.service";

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

const apps = ["Work", "Docs"];
const documentSearchTypes: GlobalSearchType[] = ["page", "comment"];
const taskSearchTypes: GlobalSearchType[] = ["task", "workspace", "board", "sprint", "user"];

const taskStatusValues: Record<string, string> = {
  "To Do": "todo",
  "In Progress": "inprogress",
  Testing: "testing",
  Done: "done",
};

const getUpdatedRange = (lastUpdated?: string | null) => {
  if (!lastUpdated || lastUpdated === "Any time") return {};

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const toIso = (date: Date) => date.toISOString();

  if (lastUpdated === "Today") return { updatedAfter: toIso(startOfToday) };
  if (lastUpdated === "Yesterday") {
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    return { updatedAfter: toIso(startOfYesterday), updatedBefore: toIso(startOfToday) };
  }
  if (lastUpdated === "Past 7 days") {
    const start = new Date(startOfToday);
    start.setDate(start.getDate() - 6);
    return { updatedAfter: toIso(start) };
  }
  if (lastUpdated === "Past 30 days") {
    const start = new Date(startOfToday);
    start.setDate(start.getDate() - 29);
    return { updatedAfter: toIso(start) };
  }
  if (lastUpdated === "Past year") {
    const start = new Date(startOfToday);
    start.setFullYear(start.getFullYear() - 1);
    return { updatedAfter: toIso(start) };
  }
  return {};
};

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
  assigneeId: filters.assignees.length > 0 ? filters.assignees : (filters.assigneeId ?? undefined),
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
  assigneeId: filters.assignees.length > 0 ? filters.assignees : (filters.assigneeId ?? undefined),
  reporterId: filters.reporterId ?? undefined,
  backlog: filters.backlog,
  archived: filters.archived,
  limit: 100,
});

const normalizeSearch = (value: string) => value.trim().toLowerCase();

const normalizeCompactSearch = (value: string) => normalizeSearch(value).replace(/[^a-z0-9]/g, "");

const matchesFallbackSearch = (task: { key: string; title: string; description?: string }, search: string) => {
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
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<GlobalSearchType[]>(documentSearchTypes);
  const [documentLastUpdated, setDocumentLastUpdated] = useState<string | null>(null);
  const [documentAuthorIds, setDocumentAuthorIds] = useState<string[]>([]);
  const [activeApp, setActiveApp] = useState("Work");
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputWrapRef = useRef<HTMLDivElement>(null);
  const activeWorkspaceKey = filters.workspaceKey || workspaceKey;
  const activeWorkspaceKeys = Array.isArray(filters.workspaceKeys)
    ? filters.workspaceKeys
    : [activeWorkspaceKey].filter(Boolean);
  const { currentWorkspace } = useCurrentWorkspace();
  const workspaceTargets = activeWorkspaceKeys
    .map((key) => {
      const project = projects.find((item) => item.key === key);
      const id =
        project?.id || (currentWorkspace?.key === key || currentWorkspace?.slug === key ? currentWorkspace?._id : "");
      return id ? { id, key } : null;
    })
    .filter(Boolean) as { id: string; key: string }[];
  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const globalSearchEnabled = process.env.NEXT_PUBLIC_GLOBAL_SEARCH_ENABLED !== "false";
  const assigneeIds = filters.assignees.length > 0
    ? filters.assignees
    : filters.assigneeId
      ? [filters.assigneeId]
      : [];
  const workSearchFilters = {
    assigneeIds,
    reporterId: filters.reporterId ?? undefined,
    status: filters.statuses.map((status) => taskStatusValues[status] ?? status.toLowerCase()),
    taskType: filters.types.map((type) => type.toLowerCase()),
    priority: filters.priorities.map((priority) => priority.toLowerCase()),
    ...getUpdatedRange(filters.lastUpdated),
  };
  const hasTaskSpecificFilters =
    workSearchFilters.assigneeIds.length > 0 ||
    Boolean(workSearchFilters.reporterId) ||
    workSearchFilters.status.length > 0 ||
    workSearchFilters.taskType.length > 0 ||
    workSearchFilters.priority.length > 0 ||
    Boolean(workSearchFilters.updatedAfter);
  const documentSearchFilters = {
    authorIds: documentAuthorIds,
    ...getUpdatedRange(documentLastUpdated),
  };
  const globalSearchTypes: GlobalSearchType[] = activeApp === "Docs"
    ? documentTypes
    : hasTaskSpecificFilters
      ? ["task"]
      : taskSearchTypes;
  const isTaskWorkspaceScopeEmpty = activeApp === "Work" && workspaceTargets.length === 0;
  const globalSearch = useGlobalSearch(
    {
      q: debouncedSearch,
      types: globalSearchTypes,
      // Documents are shared across every workspace the current user can access.
      // Task search continues to honor the workspace filter in the right panel.
      workspaceIds: activeApp === "Docs" ? undefined : workspaceTargets.map((target) => target.id),
      ...(activeApp === "Work" ? workSearchFilters : {}),
      ...(activeApp === "Docs" ? documentSearchFilters : {}),
      limit: 24,
    },
    isOpen && globalSearchEnabled && !isTaskWorkspaceScopeEmpty
  );
  const suggestionTaskFilters = toSuggestionTaskFilters(filters, debouncedSearch);
  const fallbackTaskFilters = toFallbackTaskFilters(filters);

  const searchQueries = useQueries({
    queries: workspaceTargets.map((target) => ({
      queryKey: queryKeys.tasks.searchDropdown(target.id, suggestionTaskFilters as unknown as Record<string, unknown>),
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
      queryKey: queryKeys.tasks.searchDropdownFallback(
        target.id,
        fallbackTaskFilters as unknown as Record<string, unknown>
      ),
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

  const docsQueries = useQueries({
    queries: workspaceTargets.map((target) => ({
      queryKey: queryKeys.docs.list(target.id),
      queryFn: () => pagesService.getWorkspacePages(target.id),
      enabled: isOpen && activeApp === "Docs",
      staleTime: 15_000,
    })),
  });

  const allDocs = docsQueries.flatMap((query, index) =>
    (query.data ?? []).map((doc) => ({
      ...doc,
      workspaceKey: workspaceTargets[index]?.key ?? activeWorkspaceKey,
    }))
  );

  const visibleDocs = allDocs
    .filter((doc) => {
      const matchesAuthor = documentAuthorIds.length === 0 || documentAuthorIds.includes(doc.authorId);
      const matchesUpdate = matchesLastUpdated(doc.updatedAt, documentLastUpdated);
      return matchesAuthor && matchesUpdate;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  const isFetchingDocs = docsQueries.some((query) => query.isFetching);

  const isLoadingTasks =
    globalSearchEnabled && debouncedSearch.trim().length >= 2
      ? globalSearch.isFetching
      : activeApp === "Docs"
        ? isFetchingDocs
        : isFetchingTasks || isFetchingFallbackTasks;
  const globalItems = globalSearch.data?.items ?? [];
  const visibleGlobalItems = globalItems.slice(0, 10);
  const isGlobalSearchActive = globalSearchEnabled && debouncedSearch.trim().length >= 2 && !isTaskWorkspaceScopeEmpty;
  const globalResultCount = globalSearch.data?.total ?? 0;
  const hasSearchInput = filters.search.trim().length > 0;
  const showEmptyStateSuggestions = !hasSearchInput;

  const resultIcon = (item: GlobalSearchItem) => {
    if (item.type === "page") return FileText;
    if (item.type === "comment") return Sparkles;
    if (item.type === "user") return UserRound;
    if (item.type === "workspace" || item.type === "board") return Kanban;
    if (item.type === "sprint") return Sparkles;
    return CheckSquare;
  };

  const openGlobalResult = (item: GlobalSearchItem) => {
    setIsOpen(false);
    router.push(item.url);
  };

  const openDocResult = (doc: { slug: string; workspaceKey?: string }) => {
    const targetWorkspaceKey = doc.workspaceKey || activeWorkspaceKey;
    if (!targetWorkspaceKey) return;

    setIsOpen(false);
    router.push(
      `/workspaces/${encodeURIComponent(targetWorkspaceKey)}/pages/${encodeURIComponent(doc.slug)}`
    );
  };

  const keyboardResults = isGlobalSearchActive
    ? visibleGlobalItems
    : activeApp === "Docs"
      ? visibleDocs
      : visibleTasks;

  const selectKeyboardResult = () => {
    const result = keyboardResults[activeResultIndex];
    if (!result) return;
    if (isGlobalSearchActive) {
      openGlobalResult(result as GlobalSearchItem);
      return;
    }
    if (activeApp === "Docs") {
      openDocResult(result as (typeof visibleDocs)[number]);
      return;
    }
    const task = result as (typeof visibleTasks)[number];
    setFilters((prev) => ({ ...prev, search: task.key, taskKey: null }));
    setIsOpen(false);
  };

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFilterPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const updatePosition = useCallback(() => {
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
  }, []);

  const handleOpen = useCallback(() => {
    updatePosition();
    setIsOpen(true);
  }, [updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  const handleSearchChange = (value: string) => {
    setActiveResultIndex(-1);
    setFilters((prev) => ({
      ...prev,
      search: value,
      taskKey: null,
    }));
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      setIsFilterPanelOpen(false);
      setActiveResultIndex(-1);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!keyboardResults.length) return;
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveResultIndex((current) => (current + direction + keyboardResults.length) % keyboardResults.length);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (activeResultIndex >= 0) {
        selectKeyboardResult();
      } else {
        const query = filters.search.trim();
        if (query.length >= 2) {
          setIsOpen(false);
          router.push(`/search?q=${encodeURIComponent(query)}`);
        }
      }
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div ref={inputWrapRef} className="relative w-full">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ABABAB] dark:text-[#6B6B6B]" />
        <input
          value={filters.search}
          maxLength={256}
          onFocus={handleOpen}
          onClick={handleOpen}
          onChange={(event) => handleSearchChange(event.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search"
          className={`${inputClassName} w-full rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#2A2A2A] pl-10 pr-11 font-medium text-[#111111] dark:text-[#E8E8E7] outline-none transition-colors focus:border-[#2563EB] dark:focus:border-[#3B82F6] placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B]`}
        />
        <button
          type="button"
          onClick={() => {
            if (!isOpen) handleOpen();
            setIsFilterPanelOpen((current) => !current);
          }}
          className={`absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[4px] transition-colors ${
            isFilterPanelOpen
              ? "bg-[#DBEAFE] text-[#1D4ED8] dark:bg-[#1E3A5F] dark:text-[#BFDBFE]"
              : "text-[#ABABAB] hover:bg-[#F7F6F3] hover:text-[#2563EB] dark:hover:bg-[#2E2E2E] dark:hover:text-[#3B82F6]"
          }`}
          aria-label="Toggle filters"
          aria-expanded={isFilterPanelOpen}
          title="Filters"
        >
          <Filter className="h-4 w-4" />
        </button>
      </div>

      {isOpen && (
        <div
          style={{ ...dropdownStyle, boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
          className="overflow-hidden rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#252525]"
        >
          <div className="relative h-[min(76vh,640px)] overflow-hidden">
            <div className="h-full overflow-y-auto bg-white p-4 dark:bg-[#252525]">
              <div className="mb-4 flex rounded-[6px] bg-[#F9F9F8] dark:bg-[#252525] p-1">
                {apps.map((app) => (
                  <button
                    key={app}
                    type="button"
                    onClick={() => {
                      setActiveApp(app);
                      setActiveResultIndex(-1);
                    }}
                    className={`relative flex-1 rounded-[4px] px-3 py-2 text-[0.8125rem] transition-colors ${
                      activeApp === app
                        ? "bg-[#DBEAFE] font-semibold text-[#1D4ED8] shadow-sm after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[#2563EB] dark:bg-[#1E3A5F] dark:text-[#BFDBFE] dark:after:bg-[#60A5FA]"
                        : "font-medium text-[#787774]/70 dark:text-[#9B9A97]/70 hover:bg-[#F7F6F3] hover:text-[#111111] dark:hover:bg-[#2E2E2E] dark:hover:text-[#E8E8E7]"
                    }`}
                  >
                    {app}
                  </button>
                ))}
              </div>

              <div className="space-y-5">
                <section>
                  <h3 className="mb-2 text-[0.6875rem] font-semibold tracking-wider text-[#ABABAB] dark:text-[#6B6B6B]">
                    {isGlobalSearchActive
                      ? `Results for “${debouncedSearch.trim()}”${globalSearch.isFetching ? "" : ` (${globalResultCount})`}`
                      : isTaskWorkspaceScopeEmpty && hasSearchInput
                        ? "SELECT A WORKSPACE TO SEARCH TASKS"
                      : hasSearchInput
                        ? "KEEP TYPING TO SEARCH"
                        : "RECENTLY VIEWED"}
                  </h3>
                  {isLoadingTasks && (
                    <p className="px-2 py-2 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                      {activeApp === "Docs" ? "Loading docs..." : "Loading work items..."}
                    </p>
                  )}
                  {!globalSearchEnabled && !isLoadingTasks && workspaceTargets.length === 0 && (
                    <p className="px-2 py-2 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                      {activeApp === "Docs" ? "Select a workspace to search docs." : "Select a workspace to search work items."}
                    </p>
                  )}
                  {isTaskWorkspaceScopeEmpty && debouncedSearch.trim().length >= 2 && (
                    <p className="px-2 py-2 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                      Select at least one workspace to search tasks.
                    </p>
                  )}
                  {isGlobalSearchActive &&
                    !isLoadingTasks &&
                    visibleGlobalItems.length === 0 && (
                      <p className="px-2 py-2 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                        No accessible results found.
                      </p>
                    )}
                  {activeApp === "Docs" && !globalSearchEnabled &&
                    !isLoadingTasks &&
                    workspaceTargets.length > 0 &&
                    visibleDocs.length === 0 && (
                      <p className="px-2 py-2 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                        No docs match these filters.
                      </p>
                    )}
                  {activeApp === "Work" && !globalSearchEnabled &&
                    !isLoadingTasks &&
                    workspaceTargets.length > 0 &&
                    visibleTasks.length === 0 && (
                      <p className="px-2 py-2 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                        No work items match these filters.
                      </p>
                    )}
                  {isGlobalSearchActive &&
                    visibleGlobalItems.map((item, index) => (
                      <RecentItem
                        key={`${item.type}-${item.id}`}
                        icon={resultIcon(item)}
                        title={activeApp === "Docs" ? item.title : item.key ? `${item.key} ${item.title}` : item.title}
                        meta={[item.type, item.workspaceName, item.description].filter(Boolean).join(" · ")}
                        tone={item.type === "task" ? "red" : "gray"}
                        active={activeResultIndex === index}
                        onClick={() => openGlobalResult(item)}
                      />
                    ))}
                  {activeApp === "Docs" && (!globalSearchEnabled || debouncedSearch.trim().length < 2) &&
                    visibleDocs.map((doc, index) => (
                      <RecentItem
                        key={doc.id}
                        icon={FileText}
                        title={doc.title}
                        meta={`Page · v${doc.version} · ${new Date(doc.updatedAt).toLocaleDateString()}`}
                        tone="gray"
                        active={activeResultIndex === index}
                        onClick={() => openDocResult(doc)}
                      />
                    ))}
                  {activeApp === "Work" && (!globalSearchEnabled || debouncedSearch.trim().length < 2) &&
                    visibleTasks.map((task, index) => (
                      <RecentItem
                        key={task.id}
                        icon={CheckSquare}
                        title={`${task.key} ${task.title}`}
                        meta={`${task.type} · ${task.status} · ${task.priority}`}
                        tone="red"
                        active={activeResultIndex === index}
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

                {showEmptyStateSuggestions && (
                <section>
                  <h3 className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-[#ABABAB] dark:text-[#6B6B6B]">Recent boards, workspaces,filters and plans</h3>
                  {(projects.length > 0 ? projects : [{ id: activeWorkspaceKey, name: `${activeWorkspaceKey} board`, key: activeWorkspaceKey }])
                    .slice(0, 6)
                    .map((project, index) => (
                      <RecentItem
                        key={project.id || project.key || `${project.name}-${index}`}
                        icon={project.key === activeWorkspaceKey ? Kanban : FolderKanban}
                        title={
                          project.key === activeWorkspaceKey
                            ? `${project.key} board`
                            : `${project.name} (${project.key})`
                        }
                        meta={project.key === activeWorkspaceKey ? "Board" : "Project"}
                        tone={project.key === activeWorkspaceKey ? "red" : "gray"}
                      />
                  ))}
                  <RecentItem icon={Sparkles} title="Open issues" meta="Filter" />
                </section>
                )}
              </div>

            </div>

            {isFilterPanelOpen && (
            <aside className="absolute inset-y-0 right-0 z-10 w-full max-w-[360px] overflow-y-auto border-l border-[#EAEAEA] bg-[#F9F9F8] p-4 shadow-[-12px_0_24px_rgba(0,0,0,0.12)] dark:border-white/[0.06] dark:bg-[#252525] lg:w-[42%]">
              <TaskFilterPanel
                filters={filters}
                setFilters={setFilters}
                workspaces={projects}
                assignees={assignees}
                workspaceKey={workspaceKey}
                selectedWorkspaceKey={activeWorkspaceKey}
                selectedWorkspaceKeys={activeWorkspaceKeys}
                onSetWorkspaceKeys={(workspaceKeys) => {
                  setFilters((prev) => ({
                    ...prev,
                    workspaceKey: workspaceKeys[0] ?? null,
                    workspaceKeys,
                  }));
                }}
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
                activeTab={activeApp as "Work" | "Docs"}
                documentTypes={documentTypes}
                onDocumentTypesChange={setDocumentTypes}
                documentLastUpdated={documentLastUpdated}
                onDocumentLastUpdatedChange={setDocumentLastUpdated}
                documentAuthorIds={documentAuthorIds}
                onDocumentAuthorIdsChange={setDocumentAuthorIds}
              />
              <div className="mt-4 flex items-center gap-2 rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#252525] px-3 py-2 text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">
                <Users className="h-4 w-4 text-[#2563EB] dark:text-[#3B82F6]" />
                Filters apply to workspace tasks when you are inside a workspace.
              </div>
            </aside>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
