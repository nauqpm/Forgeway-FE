import { getWorkspaceTemplate, Workspace, WorkspaceTab } from "@/modules/workspace/shared/types/workspace.type";
import { Issue } from "@/modules/workspace/shared/types/issue.type";

export const getRouteStateFromPath = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  const rawTabSegment = segments[2];
  const tabSegment =
    rawTabSegment === "key"
      ? undefined
      : (rawTabSegment as WorkspaceTab | undefined);
  const taskKey =
    rawTabSegment === "key"
      ? (segments[3] ?? null)
      : tabSegment && segments[3] === "key"
        ? (segments[4] ?? null)
        : null;
  return { tabSegment, taskKey };
};

export const getDefaultWorkspaceTab = (workspace: Workspace): WorkspaceTab =>
  getWorkspaceTemplate(workspace) === "scrum" ? "backlog" : "board";

export const isHiddenWorkspaceTab = (tabName: WorkspaceTab | null | undefined) => tabName === "summary";

export const clearOptimisticIssueOrder = (issue: Issue): Issue => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { optimisticOrder: _optimisticOrder, optimisticScope: _optimisticScope, ...rest } = issue;
  return rest;
};

export const normalizeRole = (role?: string | null) =>
  role?.trim().toLowerCase().replace(/[-\s]+/g, "_") ?? null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getUserObject = (member: any) =>
  member?.userId ?? member?.user ?? member?.member ?? member;

export const normalizeObjectId = (value: string) => {
  const trimmed = value.trim();
  const objectIdMatch = trimmed.match(/^ObjectId\(['"]?([a-f0-9]{24})['"]?\)$/i);
  return objectIdMatch?.[1] ?? trimmed;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getUserId = (value: any) => {
  if (!value) return "";
  if (typeof value === "string") return normalizeObjectId(value);
  const id = value._id ?? value.id ?? value.userId ?? value.$oid;
  if (id) return normalizeObjectId(String(id));
  const stringValue = value.toString?.();
  return stringValue && stringValue !== "[object Object]"
    ? normalizeObjectId(stringValue)
    : "";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getUserEmail = (value: any) => {
  if (!value || typeof value === "string") return "";
  return value.email ?? "";
};

export const sameNonEmpty = (left?: string | null, right?: string | null) =>
  Boolean(left && right && left === right);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isNoopReorderError = (error: any) => {
  const message = error?.response?.data?.message;
  return (
    error?.response?.status === 400 &&
    typeof message === "string" &&
    message.includes("Reorder did not change task position")
  );
};
