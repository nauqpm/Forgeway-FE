import type { Issue } from "@/modules/workspace/shared/types/issue.type";
import type { BoardColumn } from "@/modules/workspace/shared/types/board.type";
import type {
  DashboardTask,
  DashboardWorkspaceCard,
  ForYouWorkspace,
  ForYouResponse,
} from "../types/dashboard.types";

export const normalizePayload = <T,>(payload: { data?: { data?: T } | T }): T =>
  (payload?.data as { data?: T })?.data ?? (payload?.data as T);

export const workspaceIdOf = (workspace: ForYouWorkspace) =>
  workspace.id || workspace._id || "";

export const workspaceRouteKeyOf = (workspace: ForYouWorkspace) =>
  workspace.key || workspace.slug || workspaceIdOf(workspace);

export const toWorkspaceCard = (workspace: ForYouWorkspace): DashboardWorkspaceCard => ({
  ...workspace,
  routeKey: workspaceRouteKeyOf(workspace),
  description:
    workspace.ownershipLabel || workspace.relationship || workspace.role || workspace.type || "Workspace",
});

export const extractWorkspaces = (
  payload: ForYouResponse | ForYouWorkspace[] | undefined,
): ForYouWorkspace[] =>
  Array.isArray(payload) ? payload : (payload?.workspaces ?? []);

const isIdLike = (s?: string) =>
  /^[0-9a-f]{24}$/i.test(s ?? "") ||
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s ?? "");

const normalizeStatusKey = (value?: string | null) =>
  (value ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");

export const isDoneStatusKey = (value?: string | null) => {
  const normalized = normalizeStatusKey(value);
  return normalized === "done" || normalized === "completed" || normalized === "complete";
};

export const resolveStatusLabel = (
  issue: Issue,
  columnMap: Record<string, string> = {},
): string => {
  if (issue.status && columnMap[issue.status]) return columnMap[issue.status];
  if (issue.columnId && columnMap[issue.columnId]) return columnMap[issue.columnId];
  if (issue.status && !isIdLike(issue.status)) return issue.status;
  if (issue.columnId && !isIdLike(issue.columnId)) return issue.columnId;
  return "No status";
};

export const getDoneColumnIds = (columns: BoardColumn[] = []): Set<string> => {
  const doneColumnIds = new Set<string>();
  for (const column of columns) {
    const mongoId = (column as BoardColumn & { _id?: string })._id;
    const isDone =
      column.isDone ||
      isDoneStatusKey(column.name) ||
      column.mappedStatuses?.some(isDoneStatusKey);
    if (!isDone) continue;
    if (column.id) doneColumnIds.add(column.id);
    if (mongoId) doneColumnIds.add(mongoId);
  }
  return doneColumnIds;
};

export const isDoneIssue = (
  issue: Issue,
  columnMap: Record<string, string> = {},
  doneColumnIds: Set<string> = new Set(),
): boolean => {
  if (isDoneStatusKey(issue.status) || isDoneStatusKey(issue.columnId)) return true;
  if (issue.status && doneColumnIds.has(issue.status)) return true;
  if (issue.columnId && doneColumnIds.has(issue.columnId)) return true;
  if (issue.status && isDoneStatusKey(columnMap[issue.status])) return true;
  if (issue.columnId && isDoneStatusKey(columnMap[issue.columnId])) return true;
  return false;
};

export const toDashboardTask = (
  issue: Issue,
  workspace: ForYouWorkspace,
  type: "assigned" | "worked",
  columnMap: Record<string, string> = {},
): DashboardTask => {
  const workspaceId = workspaceIdOf(workspace);
  const workspaceKey = workspaceRouteKeyOf(workspace);
  const wsName =
    (workspace as ForYouWorkspace & { title?: string; label?: string }).name ??
    (workspace as { title?: string }).title ??
    (workspace as { label?: string }).label ??
    "Workspace";
  return {
    id: `${workspaceId}-${issue.id}`,
    key: issue.key,
    title: issue.title,
    type,
    workspaceKey,
    meta: `${issue.key} - ${wsName} - ${resolveStatusLabel(issue, columnMap)}`,
    dueDate: issue.dueDate,
  };
};

export const sortByDueDateAsc = (tasks: DashboardTask[]): DashboardTask[] =>
  [...tasks].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
