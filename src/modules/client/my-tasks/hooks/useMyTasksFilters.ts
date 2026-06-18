"use client";

import { useMemo, useState } from "react";
import { Task, GroupBy, SortBy } from "../types/myTasks.type";
import { groupTasks, sortTasks } from "../utils/groupTasks";

interface UseMyTasksFiltersReturn {
  search: string;
  setSearch: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterType: string;
  setFilterType: (v: string) => void;
  filterPriority: string;
  setFilterPriority: (v: string) => void;
  sortBy: SortBy;
  setSortBy: (v: SortBy) => void;
  groupBy: GroupBy;
  setGroupBy: (v: GroupBy) => void;
  sorted: Task[];
  grouped: Record<string, Task[]>;
}

export function useMyTasksFilters(tasks: Task[]): UseMyTasksFiltersReturn {
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("status");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("priority");

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.key.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || t.status === filterStatus;
      const matchType = filterType === "all" || t.type === filterType;
      const matchPriority = filterPriority === "all" || t.priority === filterPriority;
      return matchSearch && matchStatus && matchType && matchPriority;
    });
  }, [tasks, search, filterStatus, filterType, filterPriority]);

  const sorted = useMemo(() => sortTasks(filtered, sortBy), [filtered, sortBy]);

  const grouped = useMemo(() => groupTasks(sorted, groupBy), [sorted, groupBy]);

  return {
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterType,
    setFilterType,
    filterPriority,
    setFilterPriority,
    sortBy,
    setSortBy,
    groupBy,
    setGroupBy,
    sorted,
    grouped,
  };
}
