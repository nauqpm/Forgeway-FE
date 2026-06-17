"use client";

import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useProjectsData } from "./useProjectsData";
import { useProjectsFilters } from "./useProjectsFilters";

export function useProjectsPage() {
  const { currentWorkspace } = useWorkspaceStore();
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
