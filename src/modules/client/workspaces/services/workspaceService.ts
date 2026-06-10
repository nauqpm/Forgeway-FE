import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { Workspace } from "../types/workspace.type";

const normalize = <T>(res: any): T => res?.data?.data ?? res?.data ?? res;

export const workspaceService = {
  listMine: async (): Promise<Workspace[]> => {
    const res = await api.get(apiRoutes.WORKSPACES.BASE);
    return normalize<Workspace[]>(res);
  },
};
