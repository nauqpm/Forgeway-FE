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

export const workspaceService = {
  listMine: async (): Promise<Workspace[]> => {
    const res = await api.get(apiRoutes.WORKSPACES.BASE);
    return normalize<Workspace[]>(res);
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
};
