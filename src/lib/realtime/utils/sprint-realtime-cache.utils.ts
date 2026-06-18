import type { RealtimeEnvelope } from '@/lib/socket/socket.types';
import type { Sprint } from '@/modules/workspace/shared/types/sprint.type';

export type SprintSummaryPayload = Partial<Sprint> & {
  id?: string;
  _id?: string;
  workspaceId: string;
  name: string;
  status: Sprint['status'];
};

export type SprintCreatedEventData = {
  workspaceId: string;
  sprintId: string;
  actorId?: string;
  version?: number;
  sprint?: SprintSummaryPayload;
};

export type SprintUpdatedEventData = SprintCreatedEventData;
export type SprintStartedEventData = SprintCreatedEventData;

export type SprintDeletedEventData = {
  workspaceId: string;
  sprintId: string;
  actorId?: string;
  version?: number;
  sprint?: SprintSummaryPayload;
};

export type SprintCompletedEventData = SprintCreatedEventData & {
  incompleteTasksMovedTo?: string | null;
};

export type SprintRealtimeEventData =
  | SprintCreatedEventData
  | SprintUpdatedEventData
  | SprintDeletedEventData
  | SprintStartedEventData
  | SprintCompletedEventData;

export type SprintRealtimeEnvelope = RealtimeEnvelope<SprintRealtimeEventData>;

export const sprintIdOf = (sprint: Sprint): string => sprint.id ?? sprint._id;

export const isSameSprint = (a: Sprint, b: Sprint): boolean => {
  const aId = sprintIdOf(a);
  const bId = sprintIdOf(b);
  return Boolean(aId && bId && aId === bId);
};

export const mapSprintPayload = (
  payload?: SprintSummaryPayload,
): Sprint | null => {
  if (!payload) return null;

  const id = payload.id ?? payload._id;
  if (!id || !payload.workspaceId || !payload.name || !payload.status) {
    return null;
  }

  return {
    ...payload,
    id,
    _id: id,
    workspaceId: payload.workspaceId,
    name: payload.name,
    status: payload.status,
  };
};

export const upsertSprint = (
  current: Sprint[] | undefined,
  sprint: Sprint,
): Sprint[] => {
  const sprints = current ?? [];
  const exists = sprints.some((item) => isSameSprint(item, sprint));

  if (exists) {
    return sprints.map((item) =>
      isSameSprint(item, sprint) ? { ...item, ...sprint } : item,
    );
  }

  return [...sprints, sprint];
};

export const removeSprint = (
  current: Sprint[] | undefined,
  sprintId: string,
): Sprint[] => {
  const sprints = current ?? [];
  return sprints.filter((item) => sprintIdOf(item) !== sprintId);
};

export const isActiveSprint = (
  sprints: Sprint[] | undefined,
  sprintId: string,
): boolean => {
  const sprint = (sprints ?? []).find((item) => sprintIdOf(item) === sprintId);
  return sprint?.status === 'active';
};
