import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import {
  Sprint,
  CreateSprintInput,
  UpdateSprintInput,
  StartSprintInput,
} from "../types/sprint.type";

const normalize = <T>(payload: any): T =>
  payload?.data?.data ?? payload?.data ?? payload;

const toSprint = (raw: any): Sprint => ({
  ...raw,
  _id: raw._id,
  id: raw._id,
});

export const sprintService = {
  async listSprints(workspaceId: string): Promise<Sprint[]> {
    const res = await api.get(apiRoutes.WORKSPACES.SPRINTS(workspaceId));
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

  async startSprint(
    workspaceId: string,
    sprintId: string,
    input: StartSprintInput,
  ): Promise<Sprint> {
    const res = await api.post(
      apiRoutes.WORKSPACES.SPRINT_START(workspaceId, sprintId),
      input,
    );
    return toSprint(normalize(res));
  },

  async completeSprint(
    workspaceId: string,
    sprintId: string,
    input: { moveToSprintId?: string } = {},
  ): Promise<Sprint> {
    const res = await api.post(
      apiRoutes.WORKSPACES.SPRINT_COMPLETE(workspaceId, sprintId),
      input,
    );
    return toSprint(normalize(res));
  },

  async getActiveSprint(workspaceId: string): Promise<Sprint | null> {
    try {
      const res = await api.get(apiRoutes.WORKSPACES.ACTIVE_SPRINT(workspaceId));
      const data = normalize<any>(res);
      return data ? toSprint(data) : null;
    } catch {
      return null;
    }
  },
};
