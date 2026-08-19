import { useQuery } from "@tanstack/react-query";

import { apiRoutes } from "@/config/apiRoutes";
import api from "@/lib/axiosIns";
import { queryKeys } from "@/shared/constants/queryKeys";
import type { WorkspaceMember } from "../types/workspace.type";

export const fetchWorkspaceMembers = async (workspaceId: string): Promise<WorkspaceMember[]> => {
  const response = await api.get(apiRoutes.WORKSPACES.MEMBERS(workspaceId));
  const payload = response.data?.data ?? response.data;
  return Array.isArray(payload) ? payload : [];
};

export function useWorkspaceMembers(workspaceId?: string | null) {
  return useQuery<WorkspaceMember[]>({
    queryKey: queryKeys.workspaces.members(workspaceId ?? "pending"),
    queryFn: () => {
      if (!workspaceId) return [];
      return fetchWorkspaceMembers(workspaceId);
    },
    enabled: Boolean(workspaceId),
    staleTime: 60_000,
  });
}
