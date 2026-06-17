import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/common/constants/queryKeys";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import type { Project } from "@/stores/workspaceStore";

export function useProjects(workspaceId?: string) {
  return useQuery<Project[]>({
    queryKey: queryKeys.projects.list(workspaceId),
    queryFn: async () => {
      if (!workspaceId) return [];
      const res = await api.get(`${apiRoutes.PROJECTS.BASE}?workspaceId=${workspaceId}`);
      return res.data?.data ?? res.data ?? [];
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

export function useCurrentProject(workspaceId?: string) {
  const currentProjectId = useWorkspaceStore((state) => state.currentProjectId);
  const setCurrentProjectId = useWorkspaceStore((state) => state.setCurrentProjectId);
  const projectsQuery = useProjects(workspaceId);
  const projects = projectsQuery.data ?? [];
  const currentProject =
    projects.find((project) => project._id === currentProjectId) ??
    projects[0] ??
    null;

  return {
    ...projectsQuery,
    projects,
    currentProject,
    currentProjectId: currentProject?._id ?? null,
    setCurrentProjectId,
  };
}
