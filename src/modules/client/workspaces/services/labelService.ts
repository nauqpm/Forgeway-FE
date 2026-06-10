import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import type { TaskLabel } from "../types/label.type";

const normalizeResponseData = <T>(payload: any): T => {
  return payload?.data?.data ?? payload?.data ?? payload;
};

const toLabel = (raw: any): TaskLabel => ({
  id: raw.id ?? raw._id ?? "",
  _id: raw._id,
  workspaceId: raw.workspaceId,
  name: raw.name ?? "",
  createdBy: raw.createdBy,
  isDeleted: raw.isDeleted,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

export const labelService = {
  async listLabels(workspaceId: string): Promise<TaskLabel[]> {
    const response = await api.get(apiRoutes.WORKSPACES.LABELS(workspaceId));
    const payload = normalizeResponseData<any>(response);
    const labels: any[] = Array.isArray(payload) ? payload : (payload?.labels ?? []);
    return labels.map(toLabel).filter((label: TaskLabel) => label.id && !label.isDeleted);
  },

  async createLabel(workspaceId: string, name: string): Promise<TaskLabel> {
    const response = await api.post(apiRoutes.WORKSPACES.LABELS(workspaceId), { name });
    return toLabel(normalizeResponseData<any>(response));
  },

  async updateLabel(workspaceId: string, labelId: string, name: string): Promise<TaskLabel> {
    const response = await api.patch(apiRoutes.WORKSPACES.LABEL(workspaceId, labelId), { name });
    return toLabel(normalizeResponseData<any>(response));
  },

  async deleteLabel(workspaceId: string, labelId: string): Promise<void> {
    await api.delete(apiRoutes.WORKSPACES.LABEL(workspaceId, labelId));
  },
};
