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
  async listSprints(workspaceKey: string): Promise<Sprint[]> {
    const res = await api.get(apiRoutes.WORKSPACES.SPRINTS(workspaceKey));
    const data = normalize<any[]>(res);
    return (Array.isArray(data) ? data : []).map(toSprint);
  },

  async createSprint(workspaceKey: string, input: CreateSprintInput): Promise<Sprint> {
    const res = await api.post(apiRoutes.WORKSPACES.SPRINTS(workspaceKey), input);
    return toSprint(normalize(res));
  },

  async updateSprint(workspaceKey: string, sprintId: string, input: UpdateSprintInput): Promise<Sprint> {
    const res = await api.patch(apiRoutes.WORKSPACES.SPRINT(workspaceKey, sprintId), input);
    return toSprint(normalize(res));
  },

  async deleteSprint(workspaceKey: string, sprintId: string): Promise<void> {
    await api.delete(apiRoutes.WORKSPACES.SPRINT(workspaceKey, sprintId));
  },

  async startSprint(
    workspaceKey: string,
    sprintId: string,
    input: StartSprintInput,
  ): Promise<Sprint> {
    const res = await api.post(
      apiRoutes.WORKSPACES.SPRINT_START(workspaceKey, sprintId),
      input,
    );
    return toSprint(normalize(res));
  },

  async completeSprint(
    workspaceKey: string,
    sprintId: string,
    input: { moveToSprintId?: string } = {},
  ): Promise<Sprint> {
    const res = await api.post(
      apiRoutes.WORKSPACES.SPRINT_COMPLETE(workspaceKey, sprintId),
      input,
    );
    return toSprint(normalize(res));
  },

  async getActiveSprint(workspaceKey: string): Promise<Sprint | null> {
    try {
      const res = await api.get(apiRoutes.WORKSPACES.ACTIVE_SPRINT(workspaceKey));
      const data = normalize<any>(res);
      return data ? toSprint(data) : null;
    } catch {
      return null;
    }
  },
};
