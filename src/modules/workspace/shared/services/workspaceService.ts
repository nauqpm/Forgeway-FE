import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { Workspace } from "../types/workspace.type";
import type { WorkspaceSampleAvatar } from "../utils/workspaceAvatar";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalize = <T>(res: any): T => res?.data?.data ?? res?.data ?? res;

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
  avatar?: string;
  status?: string;
  access?: "private" | "public";
}

export interface WorkspacePreference {
  workspaceId: string;
  isStarred: boolean;
  position: number;
}

export const workspaceService = {
  listMine: async (): Promise<Workspace[]> => {
    const res = await api.get(apiRoutes.WORKSPACES.BASE);
    return normalize<Workspace[]>(res);
  },

  listStarred: async (): Promise<Workspace[]> => {
    const res = await api.get(apiRoutes.WORKSPACES.STARRED);
    return normalize<Workspace[]>(res);
  },

  setWorkspaceStar: async (
    workspaceId: string,
    isStarred: boolean,
  ): Promise<WorkspacePreference> => {
    const res = await api.put(apiRoutes.WORKSPACE_PREFERENCES.STAR(workspaceId), { isStarred });
    return normalize<WorkspacePreference>(res);
  },

  listAvatarSamples: async (): Promise<WorkspaceSampleAvatar[]> => {
    const res = await api.get(apiRoutes.WORKSPACES.AVATAR_SAMPLES);
    return normalize<{ avatars: WorkspaceSampleAvatar[] }>(res).avatars ?? [];
  },

  updateWorkspace: async (
    workspaceId: string,
    input: UpdateWorkspaceInput,
  ): Promise<Workspace> => {
    const res = await api.put(apiRoutes.WORKSPACES.UPDATE(workspaceId), input);
    return normalize<Workspace>(res);
  },

  updateWorkspaceOrder: async (
    order: string[],
  ): Promise<void> => {
    const res = await api.put(apiRoutes.WORKSPACE_PREFERENCES.ORDER, { workspaceIds: order });
    return normalize<void>(res);
  },
};
