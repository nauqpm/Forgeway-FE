import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { Workspace } from "../types/workspace.type";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeResponseData = <T>(payload: any): T => {
  return payload?.data?.data ?? payload?.data ?? payload;
};

export async function resolveWorkspaceFromRouteKey(routeKey: string): Promise<Workspace> {
  const response = await api.get(apiRoutes.WORKSPACES.BASE);
  const workspaces = normalizeResponseData<Workspace[]>(response);
  const workspace = workspaces.find((item) => item._id === routeKey || item.key === routeKey || item.slug === routeKey);

  if (!workspace) {
    throw new Error("Workspace not found for this route");
  }

  return workspace;
}
