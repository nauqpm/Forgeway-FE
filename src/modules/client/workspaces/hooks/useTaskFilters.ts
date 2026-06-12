"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Filters, TaskFilters } from "../types/filter.type";

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  inprogress: "In Progress",
  "in-progress": "In Progress",
  testing: "Testing",
  done: "Done",
};

const TYPE_LABELS: Record<string, string> = {
  task: "Task",
  bug: "Bug",
  story: "Story",
  epic: "Epic",
};

const PRIORITY_LABELS: Record<string, string> = {
  lowest: "Lowest",
  low: "Low",
  medium: "Medium",
  high: "High",
  highest: "Highest",
};

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "");
const csv = (value: string | null) => value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
const labelsFromParam = (value: string | null, labels: Record<string, string>) =>
  csv(value).map((item) => labels[normalize(item)] ?? item);
const queryValue = (value: string) => normalize(value);

const initialFiltersFromParams = (params: URLSearchParams, workspaceKey: string): Filters => ({
  search: params.get("search") || "",
  assigneeId: params.get("assigneeId"),
  reporterId: params.get("reporterId"),
  taskKey: params.get("taskKey"),
  workspaceKey,
  lastUpdated: params.get("lastUpdated"),
  priority: null,
  type: null,
  assignees: csv(params.get("assigneeId") || params.get("assignees")),
  types: labelsFromParam(params.get("type") || params.get("types"), TYPE_LABELS),
  statuses: labelsFromParam(params.get("status") || params.get("statuses"), STATUS_LABELS),
  priorities: labelsFromParam(params.get("priority") || params.get("priorities"), PRIORITY_LABELS),
  backlog: params.get("backlog") === "true",
  archived: params.get("archived") === "true",
});

export function useTaskFilters(workspaceKey: string) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() =>
    initialFiltersFromParams(new URLSearchParams(searchParams?.toString()), workspaceKey),
  );

  useEffect(() => {
    setFilters((prev) => ({ ...prev, workspaceKey }));
  }, [workspaceKey]);

  useEffect(() => {
    const handleExternalFilterChange = (event: Event) => {
      const detail = (event as CustomEvent<Partial<Filters>>).detail;
      if (!detail) return;
      setFilters((prev) => ({ ...prev, ...detail, workspaceKey }));
    };

    window.addEventListener("taskFiltersChanged", handleExternalFilterChange);
    return () => window.removeEventListener("taskFiltersChanged", handleExternalFilterChange);
  }, [workspaceKey]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const setOrDelete = (key: string, value?: string | null) => {
      if (value) params.set(key, value);
      else params.delete(key);
    };

    setOrDelete("search", filters.search.trim());
    setOrDelete("taskKey", filters.taskKey);
    setOrDelete("status", filters.statuses.map(queryValue).join(","));
    setOrDelete("type", filters.types.map(queryValue).join(","));
    setOrDelete("priority", filters.priorities.map(queryValue).join(","));
    setOrDelete("assigneeId", filters.assignees.join(",") || filters.assigneeId);
    setOrDelete("reporterId", filters.reporterId);
    setOrDelete("lastUpdated", filters.lastUpdated);

    params.delete("statuses");
    params.delete("types");
    params.delete("priorities");
    params.delete("assignees");

    if (filters.backlog) params.set("backlog", "true");
    else params.delete("backlog");

    if (filters.archived) params.set("archived", "true");
    else params.delete("archived");

    const query = params.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    if (window.location.pathname + window.location.search !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [filters, pathname]);

  const taskFilters = useMemo<TaskFilters>(() => {
    const assignees = filters.assignees.length > 0 ? filters.assignees : filters.assigneeId ? [filters.assigneeId] : [];

    return {
      search: filters.search.trim() || undefined,
      status: filters.statuses,
      type: filters.types.length <= 1 ? filters.types : undefined,
      priority: filters.priorities.length <= 1 ? filters.priorities : undefined,
      assigneeId: assignees.length === 1 && assignees[0] !== "U" ? assignees[0] : undefined,
      reporterId: filters.reporterId ?? undefined,
      backlog: filters.backlog,
      archived: filters.archived,
    };
  }, [filters]);

  return { filters, setFilters, taskFilters };
}
