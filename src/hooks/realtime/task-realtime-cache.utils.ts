import type { QueryKey } from '@tanstack/react-query';
import type { Issue } from '@/modules/client/workspaces/types/issue.type';

export type TaskCacheQuery = [QueryKey, Issue[] | undefined];

export const taskIdOf = (issue: Issue) => issue.id || issue._id;

const compareRank = (a?: string, b?: string) => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
};

export const sortIssuesByRank = (issues: Issue[]) => {
  return [...issues].sort((a, b) => {
    if (a.columnId !== b.columnId) return 0;
    const rankCompare = compareRank(a.rank, b.rank);
    if (rankCompare !== 0) return rankCompare;
    return a.key.localeCompare(b.key);
  });
};

export const shouldApplyEvent = (
  currentIssue: Issue | undefined,
  incomingVersion: number | undefined,
  actorId: string | undefined,
  currentUserId: string | undefined,
) => {
  if (!currentIssue || !incomingVersion || !currentIssue.version) {
    return { apply: true, refetch: false };
  }

  if (incomingVersion > currentIssue.version) {
    return { apply: true, refetch: false };
  }

  if (incomingVersion === currentIssue.version) {
    const ownEvent = actorId === currentUserId;
    if (ownEvent) return { apply: false, refetch: false };
    return { apply: false, refetch: true };
  }

  return { apply: false, refetch: false };
};

export const shouldApplyReorderEvent = (
  currentIssue: Issue | undefined,
  incomingVersion: number | undefined,
  actorId: string | undefined,
  currentUserId: string | undefined,
) => {
  if (!currentIssue || !incomingVersion || !currentIssue.version) {
    return { apply: true, refetch: false };
  }

  const ownEvent = actorId === currentUserId;

  if (incomingVersion > currentIssue.version) {
    return { apply: true, refetch: false };
  }

  if (incomingVersion <= currentIssue.version) {
    if (ownEvent) return { apply: false, refetch: false };
    return { apply: false, refetch: true };
  }

  return { apply: false, refetch: false };
};
export const upsertTask = (
  current: Issue[] | undefined,
  issue: Issue,
) => {
  const list = current ?? [];
  const existing = list.find((item) => taskIdOf(item) === issue.id);
  const next = existing
    ? list.map((item) => (taskIdOf(item) === issue.id ? { ...item, ...issue } : item))
    : [issue, ...list];

  return sortIssuesByRank(next);
};

export const removeTask = (
  current: Issue[] | undefined,
  taskId: string | undefined,
) => {
  if (!taskId) return current;
  return (current ?? []).filter((issue) => taskIdOf(issue) !== taskId);
};

export const findTaskInCache = (
  cachedQueries: TaskCacheQuery[],
  taskId?: string,
) => {
  if (!taskId) return undefined;

  return cachedQueries
    .flatMap(([, data]) => data ?? [])
    .find((issue) => taskIdOf(issue) === taskId);
};

export const getAffectedTaskQueries = (
  cachedQueries: TaskCacheQuery[],
  taskId?: string,
): TaskCacheQuery[] => {
  if (!taskId) return [];

  return cachedQueries.filter(([, tasks]) =>
    tasks?.some((task) => taskIdOf(task) === taskId),
  );
};

