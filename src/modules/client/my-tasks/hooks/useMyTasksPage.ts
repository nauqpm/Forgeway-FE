"use client";

import { useMyTasksData } from "./useMyTasksData";
import { useMyTasksFilters } from "./useMyTasksFilters";

export function useMyTasksPage() {
  const data = useMyTasksData();
  const filters = useMyTasksFilters(data.tasks);
  return { ...data, ...filters };
}

export type MyTasksPageProps = ReturnType<typeof useMyTasksPage>;
