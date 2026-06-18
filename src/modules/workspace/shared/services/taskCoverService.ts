import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import type { TaskCover, UpdateTaskCoverPayload, UpdateTaskCoverResponse } from "../types/task-cover.type";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeResponseData = <T>(payload: any): T => {
  return payload?.data?.data ?? payload?.data ?? payload;
};

export const taskCoverService = {
  async getCover(workspaceId: string, taskId: string): Promise<TaskCover | null> {
    const response = await api.get(apiRoutes.TASKS.BOARD_TASK_COVER(workspaceId, taskId));
    return normalizeResponseData<TaskCover | null>(response);
  },

  async updateCover(workspaceId: string, taskId: string, payload: UpdateTaskCoverPayload): Promise<TaskCover | null> {
    const response = await api.patch(apiRoutes.TASKS.BOARD_TASK_COVER(workspaceId, taskId), payload);
    return normalizeResponseData<UpdateTaskCoverResponse>(response).cover;
  },

  async removeCover(workspaceId: string, taskId: string): Promise<void> {
    await api.delete(apiRoutes.TASKS.BOARD_TASK_COVER(workspaceId, taskId));
  },
};
