import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import {
  Sprint,
  CreateSprintInput,
  UpdateSprintInput,
  StartSprintInput,
  CompleteSprintResult,
} from "../types/sprint.type";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalize = <T>(payload: any): T => payload?.data?.data ?? payload?.data ?? payload;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toSprint = (raw: any): Sprint => ({
  ...raw,
  _id: raw._id,
  id: raw._id,
});

export const sprintService = {
  async listSprints(workspaceId: string): Promise<Sprint[]> {
    const res = await api.get(apiRoutes.WORKSPACES.SPRINTS(workspaceId));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = normalize<any[]>(res);
    return (Array.isArray(data) ? data : []).map(toSprint);
  },

  async createSprint(workspaceId: string, input: CreateSprintInput): Promise<Sprint> {
    const res = await api.post(apiRoutes.WORKSPACES.SPRINTS(workspaceId), input);
    return toSprint(normalize(res));
  },

  async updateSprint(workspaceId: string, sprintId: string, input: UpdateSprintInput): Promise<Sprint> {
    const res = await api.patch(apiRoutes.WORKSPACES.SPRINT(workspaceId, sprintId), input);
    return toSprint(normalize(res));
  },

  async deleteSprint(workspaceId: string, sprintId: string): Promise<void> {
    await api.delete(apiRoutes.WORKSPACES.SPRINT(workspaceId, sprintId));
  },

  async startSprint(workspaceId: string, sprintId: string, input: StartSprintInput): Promise<Sprint> {
    const res = await api.post(apiRoutes.WORKSPACES.SPRINT_START(workspaceId, sprintId), input);
    return toSprint(normalize(res));
  },

  async completeSprint(
    workspaceId: string,
    sprintId: string,
    input: { moveToSprintId?: string } = {}
  ): Promise<CompleteSprintResult> {
    const res = await api.post(apiRoutes.WORKSPACES.SPRINT_COMPLETE(workspaceId, sprintId), input);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = normalize<any>(res);
    return {
      ...data,
      _id: data._id,
      id: data._id,
    };
  },

  async getCompleteSprintPreview(
    workspaceId: string,
    sprintId: string
  ): Promise<{
    sprintId: string;
    sprintName: string;
    totalTasks: number;
    completedTasks: number;
    incompleteTasks: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    incompleteTaskList: any[];
  }> {
    const res = await api.get(apiRoutes.WORKSPACES.SPRINT_COMPLETE_PREVIEW(workspaceId, sprintId));
    return normalize(res);
  },

  async getActiveSprint(workspaceId: string): Promise<Sprint | null> {
    try {
      const res = await api.get(apiRoutes.WORKSPACES.ACTIVE_SPRINT(workspaceId));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = normalize<any>(res);
      return data ? toSprint(data) : null;
    } catch {
      return null;
    }
  },
};
