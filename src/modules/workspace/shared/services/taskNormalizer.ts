// Task Normalizers - Transform API responses to domain types
import { Issue } from "../types/issue.type";
import { TaskDetailResponse } from "../types/task-detail.type";
import type { TaskLabel } from "../types/label.type";
import { toTaskDateKey } from "../utils/taskDateKey";
import type {
  TaskDto,
  TaskComment,
  CreateTaskInput,
} from "./taskTypes";

// Constants
const COLUMN_BY_STATUS: Record<string, string> = {
  "To Do": "todo",
  "In Progress": "inprogress",
  Testing: "testing",
  Done: "done",
  todo: "todo",
  inprogress: "inprogress",
  testing: "testing",
  done: "done",
};

const STATUS_BY_COLUMN: Record<string, string> = {
  todo: "To Do",
  inprogress: "In Progress",
  "in-progress": "In Progress",
  testing: "Testing",
  done: "Done",
};

// Helper functions
export const normalizeResponseData = <T>(payload: unknown): T => {
  const res = payload as { data?: { data?: T } | T };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((res?.data as any)?.data ?? res?.data ?? payload) as T;
};

export const normalizeValue = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  return value.trim().toLowerCase().replace(/\s+/g, "");
};

export const toArray = (value?: string | string[] | null): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const normalizeArray = (value?: string | string[] | null): string[] => {
  return toArray(value)
    .map((item) => normalizeValue(item))
    .filter(Boolean) as string[];
};

export const toColumnId = (status?: string): string | undefined => {
  if (!status) return undefined;
  return COLUMN_BY_STATUS[status] ?? normalizeValue(status);
};

export const toUiLabel = (value?: string, fallback = ""): string => {
  if (!value) return fallback;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const toStatusLabel = (task: TaskDto): string => {
  const column = task.columnId ?? task.boardColumnId ?? task.status;
  return STATUS_BY_COLUMN[column ?? ""] ?? task.status ?? "To Do";
};

export const toTaskLabel = (
  raw: TaskLabel | string | { _id?: string; id?: string; name?: string }
): TaskLabel => {
  if (typeof raw === "string") {
    return { id: raw, name: raw };
  }
  const id = raw.id ?? raw._id ?? "";
  return {
    ...raw,
    id,
    name: raw.name ?? id,
  };
};

export const toTaskLabels = (task: TaskDto): TaskLabel[] => {
  if (Array.isArray(task.labels)) {
    return task.labels.map(toTaskLabel).filter((label) => label.id);
  }
  return (task.labelIds ?? []).map((id) => ({ id, name: id }));
};

export const requireTaskKey = (task: TaskDto): string => {
  if (!task.key) {
    throw new Error("Task key is missing from backend response");
  }
  return task.key;
};

export const requireTaskId = (task: TaskDto): string => {
  const id = task.id ?? task._id;
  if (!id) {
    throw new Error("Task id is missing from backend response");
  }
  return id;
};

export const toIssue = (task: TaskDto): Issue => {
  const assignee = task.assigneeId || "U";
  const id = requireTaskId(task);

  return {
    id,
    _id: task._id,
    key: requireTaskKey(task),
    title: task.title,
    description: task.description ?? "",
    columnId: task.columnId ?? task.boardColumnId ?? toColumnId(task.status) ?? "todo",
    status: toStatusLabel(task),
    rank: task.rank,
    priority: toUiLabel(task.priority, "Medium"),
    type: toUiLabel(task.type, "Task"),
    assignee,
    assigneeId: task.assigneeId,
    assigneeDisplayName: task.assignee?.fullName ?? task.assignee?.email ?? undefined,
    assigneeAvatar: task.assignee?.avatar ?? undefined,
    color: "bg-[#2563EB]",
    sprintId: task.sprintId ?? null,
    storyPoints: task.storyPoints ?? 0,
    startDate: toTaskDateKey(task.startDate),
    dueDate: toTaskDateKey(task.dueDate),
    isArchived: task.isArchived,
    archivedAt: task.archivedAt ?? null,
    archivedBy: task.archivedBy ?? null,
    archivedByUser: task.archivedByUser ?? null,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    version: task.version,
    cover: task.cover ?? null,
    labels: toTaskLabels(task),
    labelIds: task.labelIds ?? toTaskLabels(task).map((label) => label.id),
  };
};

export const formatAssignee = (task: TaskDto): string =>
  task.assignee?.fullName || task.assignee?.email || task.assigneeId || "U";

export const toTaskDetail = (task: TaskDto): TaskDetailResponse => {
  const issue = toIssue(task);

  return {
    ...issue,
    workspaceId: task.workspaceId ?? "",
    description: task.description ?? "",
    type: toUiLabel(task.type, "Task"),
    priority: toUiLabel(task.priority, "Medium"),
    status: toStatusLabel(task),
    rank: task.rank ?? "",
    assignee: task.assignee ?? null,
    assigneeDisplayName: formatAssignee(task),
    reporterId: task.reporterId ?? null,
    reporter: task.reporter ?? null,
    sprint: task.sprint ?? undefined,
    boardId: task.boardId,
    board: task.board ?? undefined,
    dueDate: toTaskDateKey(task.dueDate) ?? null,
    isArchived: task.isArchived ?? false,
    isDeleted: task.isDeleted ?? false,
    createdAt: task.createdAt ?? "",
    updatedAt: task.updatedAt ?? "",
    version: task.version,
    cover: task.cover ?? null,
    labels: toTaskLabels(task),
    labelIds: task.labelIds ?? toTaskLabels(task).map((label) => label.id),
  };
};

export const toCreatePayload = (input: CreateTaskInput) => ({
  title: input.title,
  type: normalizeValue(input.type),
  priority: normalizeValue(input.priority),
  columnId: input.columnId || toColumnId(input.status),
  status: toColumnId(input.status),
  sprintId: input.sprintId || undefined,
  assigneeId: input.assigneeId || undefined,
  startDate: input.startDate || undefined,
  dueDate: input.dueDate || undefined,
});

export const toTaskComment = (comment: TaskComment): TaskComment => ({
  ...comment,
  id: comment.id || comment._id || "",
  authorId: comment.authorId || comment.author?.id || "",
});

export const toUpdatePayload = (updates: Partial<Issue>) => {
  const {
    assignee,
    assigneeId,
    columnId,
    description,
    startDate,
    dueDate,
    priority,
    sprintId,
    status,
    storyPoints,
    title,
    type,
    timeLogged,
    timeEstimated,
  } = updates;

  const payload: Record<string, unknown> = {};

  if (title !== undefined) payload.title = title;
  if (description !== undefined) payload.description = description;
  if (storyPoints !== undefined) payload.storyPoints = storyPoints;
  if (columnId !== undefined) {
    payload.columnId = columnId;
  }
  if (startDate !== undefined) payload.startDate = startDate || null;
  if (dueDate !== undefined) payload.dueDate = dueDate || null;
  if (assigneeId !== undefined) {
    payload.assigneeId = assigneeId || null;
  } else if (typeof assignee === "string" && assignee !== "U") {
    payload.assigneeId = assignee;
  }
  if (type !== undefined) payload.type = normalizeValue(type);
  if (priority !== undefined) payload.priority = normalizeValue(priority);
  if (status !== undefined) {
    const normalizedStatus = toColumnId(status);
    if (columnId === undefined) payload.columnId = normalizedStatus;
    payload.status = normalizedStatus;
  }
  if (sprintId !== undefined) payload.sprintId = sprintId || undefined;
  if (timeLogged !== undefined) payload.timeLogged = timeLogged;
  if (timeEstimated !== undefined) payload.timeEstimated = timeEstimated;

  return payload;
};
