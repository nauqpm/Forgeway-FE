import type { QueryKey } from '@tanstack/react-query';
import type { Issue } from '@/modules/workspace/shared/types/issue.type';

export type TaskCacheQuery = [QueryKey, Issue[] | undefined];

export const taskIdOf = (issue: Issue) => issue.id || issue._id;

const RANK_ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const MIN_RANK_DIGIT = 0;

const getRankDigit = (rank: string, index: number, fallback: number) => {
  if (index >= rank.length) return fallback;

  const digit = RANK_ALPHABET.indexOf(rank[index]);
  return digit === -1 ? fallback : digit;
};

const compareRank = (left?: string, right?: string) => {
  if (left && !right) return -1;
  if (!left && right) return 1;
  if (!left && !right) return 0;

  const leftRank = left!;
  const rightRank = right!;
  const maxLength = Math.max(leftRank.length, rightRank.length);

  for (let index = 0; index < maxLength; index += 1) {
    const diff =
      getRankDigit(leftRank, index, MIN_RANK_DIGIT) -
      getRankDigit(rightRank, index, MIN_RANK_DIGIT);

    if (diff !== 0) return diff;
  }

  return leftRank.length - rightRank.length;
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

export const hasReorderStateChanged = (
  currentIssue: Issue | undefined,
  nextIssue: Issue,
) => {
  if (!currentIssue) return true;

  return (
    currentIssue.columnId !== nextIssue.columnId ||
    currentIssue.status !== nextIssue.status ||
    currentIssue.sprintId !== nextIssue.sprintId ||
    currentIssue.rank !== nextIssue.rank ||
    currentIssue.version !== nextIssue.version
  );
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

export const mergeReorderedTask = (
  current: Issue[] | undefined,
  issue: Issue,
) => {
  const taskId = taskIdOf(issue);
  const list = current ?? [];
  const existing = list.find((item) => taskIdOf(item) === taskId);
  const merged = existing ? { ...existing, ...issue } : issue;
  const withoutMovedTask = list.filter((item) => taskIdOf(item) !== taskId);

  return sortIssuesByRank([merged, ...withoutMovedTask]);
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

