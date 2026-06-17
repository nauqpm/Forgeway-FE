"use client";

import { useCurrentWorkspace } from "@/modules/workspace/shared/hooks/useWorkspaces";
import { useProjectsData } from "./useProjectsData";
import { useProjectsFilters } from "./useProjectsFilters";

export function useProjectsPage() {
  const { currentWorkspace } = useCurrentWorkspace();
  const { projects, loading, refetch } = useProjectsData();
  const { search, setSearch, view, setView, filtered } = useProjectsFilters(projects);

  return {
    currentWorkspace,
    projects,
    loading,
    refetch,
    search,
    setSearch,
    view,
    setView,
    filtered,
  };
}
