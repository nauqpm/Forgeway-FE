import api from '@/config/api';
import { apiRoutes } from '@/config/apiRoutes';
import { Issue } from '../types/issue.type';

export type DependencyType = 'blocks' | 'is_blocked_by' | 'relates_to';

export interface TaskDependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  workspaceId: string;
  type: DependencyType;
  createdAt: string;
}

export interface TimelineHierarchy {
  /** Tasks with type === 'epic' */
  epics: Issue[];
  /** Tasks that reference an epic via epicId */
  children: Issue[];
  /** Tasks without an epic and without a sprint */
  standalones: Issue[];
}

function normalizePayload<T>(payload: unknown): T {
  const p = payload as any;
  return (p?.data?.data ?? p?.data ?? p) as T;
}

export const timelineService = {
  /**
   * Fetch all tasks in an epic-child hierarchy.
   * Used to pre-populate the Timeline tab with grouped data.
   */
  async getTimelineHierarchy(workspaceId: string): Promise<TimelineHierarchy> {
    const response = await api.get(apiRoutes.TASKS.TIMELINE(workspaceId));
    return normalizePayload<TimelineHierarchy>(response);
  },

  /**
   * Fetch all dependency links for the workspace.
   * Used to render arrows on the Gantt chart.
   */
  async getWorkspaceDependencies(workspaceId: string): Promise<TaskDependency[]> {
    const response = await api.get(
      apiRoutes.TASKS.WORKSPACE_DEPENDENCIES(workspaceId),
    );
    const raw = normalizePayload<TaskDependency[] | { items: TaskDependency[] }>(response);
    return Array.isArray(raw) ? raw : (raw as any).items ?? [];
  },

  /**
   * Create a directional dependency between two tasks.
   * @param fromTaskId - the task that "blocks"
   * @param toTaskId   - the task that is "blocked by"
   */
  async createDependency(
    workspaceId: string,
    fromTaskId: string,
    toTaskId: string,
    type: DependencyType = 'blocks',
  ): Promise<TaskDependency> {
    const response = await api.post(
      apiRoutes.TASKS.TASK_DEPENDENCIES(workspaceId, fromTaskId),
      { toTaskId, type },
    );
    return normalizePayload<TaskDependency>(response);
  },

  /**
   * Delete a dependency by its ID.
   */
  async deleteDependency(
    workspaceId: string,
    taskId: string,
    depId: string,
  ): Promise<void> {
    await api.delete(apiRoutes.TASKS.TASK_DEPENDENCY(workspaceId, taskId, depId));
  },
};
