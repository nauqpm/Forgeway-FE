import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryKeys } from "@/shared/constants/queryKeys";
import { workspaceService } from "../services/workspaceService";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import type { Workspace } from "../types/workspace.type";

export function useWorkspaces() {
  return useQuery<Workspace[]>({
    queryKey: queryKeys.workspaces.list(),
    queryFn: workspaceService.listMine,
    staleTime: 30_000,
  });
}

export function useCurrentWorkspace() {
  const currentWorkspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const setCurrentWorkspaceId = useWorkspaceStore((state) => state.setCurrentWorkspaceId);
  const workspacesQuery = useWorkspaces();
  const workspaces = workspacesQuery.data ?? [];
  const currentWorkspace =
    workspaces.find((workspace) => workspace._id === currentWorkspaceId) ??
    workspaces[0] ??
    null;

  useEffect(() => {
    if (!currentWorkspaceId && currentWorkspace?._id) {
      setCurrentWorkspaceId(currentWorkspace._id);
    }
  }, [currentWorkspace?._id, currentWorkspaceId, setCurrentWorkspaceId]);

  return {
    ...workspacesQuery,
    workspaces,
    currentWorkspace,
    currentWorkspaceId: currentWorkspace?._id ?? null,
    setCurrentWorkspaceId,
  };
}

export function findWorkspaceByRouteKey(workspaces: Workspace[], routeKey?: string | null) {
  if (!routeKey) return null;
  return (
    workspaces.find(
      (workspace) =>
        workspace._id === routeKey ||
        workspace.key === routeKey ||
        workspace.slug === routeKey,
    ) ?? null
  );
}
