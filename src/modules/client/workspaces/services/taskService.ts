import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { Issue } from "../types/issue.type";
import { TaskFilters } from "../types/filter.type";
import { TaskDetailResponse } from "../types/task-detail.type";
import type { TaskLabel } from "../types/label.type";
import { toTaskDateKey } from "../utils/taskDateKey";
import { CreateTaskInput, TaskDto } from "./taskTypes";

// Re-export types
export type {
  TaskDto,
  TaskUserDto,
  TaskSprintDto,
  TaskBoardDto,
  CreateTaskInput
} from "./taskTypes";

// Re-export normalizer utilities
export {
  normalizeResponseData,
  normalizeValue,
  toArray,
  normalizeArray,
  toColumnId,
  toUiLabel,
  toTaskLabel,
  toTaskLabels,
  requireTaskKey,
  requireTaskId,
  toIssue,
  toTaskDetail,
  formatAssignee,
  toCreatePayload,
  toUpdatePayload,
} from "./taskNormalizer";

// Re-export query functions
export {
  getBoardTasks,
  getBoardTaskDetail,
  getTaskActivities,
  getArchivedTasks,
  getComments,
} from "./taskQueries";

// Re-export mutation functions
export {
  createBoardTask,
  updateBoardTask,
  moveBoardTask,
  reorderBoardTask,
  deleteBoardTask,
  archiveBoardTask,
  restoreBoardTask,
  replaceTaskLabels,
  createComment,
  updateComment,
  deleteComment,
} from "./taskMutations";

// Legacy re-export for backward compatibility
// Components importing from taskService.ts will still work
export * from "./taskQueries";
export * from "./taskMutations";

export type ReorderTaskInput = {
  columnId?: string;
  status?: string;
  sprintId?: string | null;
  rankScope?: "board" | "sprint";
  beforeTaskId?: string;
  afterTaskId?: string;
};

export type TaskActivity = {
  id: string;
  workspaceId?: string;
  taskId: string;
  taskKey?: string;
  actorId?: string;
  actor?: {
    id?: string;
    fullName?: string;
    email?: string;
    avatar?: string;
  } | null;
  type: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

export type TaskComment = {
  id: string;
  _id?: string;
  workspaceId: string;
  content: string;
  authorId: string;
  author: {
    id?: string;
    fullName?: string;
    email?: string;
    avatar?: string;
  } | null;
  targetType: string;
  targetId: string;
  parentId: string | null;
  mentions: string[];
  isDeleted: boolean;
  editedAt: string | null;
  createdAt: string;
};

export type PaginatedActivitiesResponse = {
  activities: TaskActivity[];
  total: number;
  page: number;
  limit: number;
};

export type PaginatedTasksResponse = {
  tasks: Issue[];
  total: number;
  page: number;
  limit: number;
};

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeResponseData = <T>(payload: any): T => {
  return payload?.data?.data ?? payload?.data ?? payload;
};

const normalizeValue = (value?: string | null) => {
  if (!value) return undefined;
  return value.trim().toLowerCase().replace(/\s+/g, "");
};

const toArray = (value?: string | string[] | null) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value;
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeArray = (value?: string | string[] | null) => {
  return toArray(value)
    .map((item) => normalizeValue(item))
    .filter(Boolean) as string[];
};

const toColumnId = (status?: string) => {
  if (!status) return undefined;
  return COLUMN_BY_STATUS[status] ?? normalizeValue(status);
};

const toUiLabel = (value?: string, fallback = "") => {
  if (!value) return fallback;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const toStatusLabel = (task: TaskDto) => {
  const column = task.columnId ?? task.boardColumnId ?? task.status;
  return STATUS_BY_COLUMN[column ?? ""] ?? task.status ?? "To Do";
};

const toTaskLabel = (raw: TaskLabel | string | { _id?: string; id?: string; name?: string }): TaskLabel => {
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

const toTaskLabels = (task: TaskDto): TaskLabel[] => {
  if (Array.isArray(task.labels)) {
    return task.labels.map(toTaskLabel).filter((label) => label.id);
  }

  return (task.labelIds ?? []).map((id) => ({ id, name: id }));
};

const requireTaskKey = (task: TaskDto) => {
  if (!task.key) {
    throw new Error("Task key is missing from backend response");
  }

  return task.key;
};

const requireTaskId = (task: TaskDto) => {
  const id = task.id ?? task._id;
  if (!id) {
    throw new Error("Task id is missing from backend response");
  }

  return id;
};

const toIssue = (task: TaskDto): Issue => {
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

const formatAssignee = (task: TaskDto) => task.assignee?.fullName || task.assignee?.email || task.assigneeId || "U";

const toTaskDetail = (task: TaskDto): TaskDetailResponse => {
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

const toCreatePayload = (input: CreateTaskInput) => ({
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

const toTaskComment = (comment: TaskComment): TaskComment => ({
  ...comment,
  id: comment.id || comment._id || "",
  authorId: comment.authorId || comment.author?.id || "",
});

const toUpdatePayload = (updates: Partial<Issue>) => {
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
  } = updates;

  const payload: Record<string, unknown> = {};

  if (title !== undefined) payload.title = title;
  if (description !== undefined) payload.description = description;
  if (storyPoints !== undefined) payload.storyPoints = storyPoints;
  if (columnId !== undefined) {
    payload.columnId = columnId;
  }
  if (startDate !== undefined) payload.startDate = startDate || undefined;
  if (dueDate !== undefined) payload.dueDate = dueDate || undefined;
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

  return payload;
};

export const buildTaskQuery = (filters?: TaskFilters) => {
  if (!filters) return "";
  const activeFilters = filters;

  const params: string[] = [];
  const addValue = (key: string, value?: string | number | boolean | null) => {
    if (value === undefined || value === null || value === "" || value === false) return;
    params.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  };
  const addArray = (key: string, value?: string | string[] | null) => {
    const values = toArray(value).filter(Boolean);
    if (values.length === 0) return;
    params.push(`${encodeURIComponent(key)}=${values.map((item) => encodeURIComponent(item)).join(",")}`);
  };
  const normalizedStatus = toArray(activeFilters.status)
    .map((status) => COLUMN_BY_STATUS[status] ?? normalizeValue(status))
    .filter(Boolean) as string[];

  addArray("status", normalizedStatus);
  addValue("columnId", activeFilters.columnId);
  addValue("sprintId", activeFilters.sprintId);
  addArray("assigneeId", activeFilters.assigneeId);
  addArray("reporterId", activeFilters.reporterId);
  addArray("type", normalizeArray(activeFilters.type));
  addArray("priority", normalizeArray(activeFilters.priority));
  addArray("labelIds", activeFilters.labelIds);
  addValue("taskKey", activeFilters.taskKey);
  addValue("search", activeFilters.search?.trim());
  addValue("backlog", activeFilters.backlog === true ? "true" : undefined);
  addValue("archived", activeFilters.archived === true ? "true" : undefined);
  addValue("page", activeFilters.page);
  addValue("limit", activeFilters.limit);
  addValue("sortBy", activeFilters.sortBy);
  addValue("sortOrder", activeFilters.sortOrder);

  return params.length > 0 ? `?${params.join("&")}` : "";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const taskService: any = {
  async getBoardTasks(workspaceId: string, filters?: TaskFilters): Promise<Issue[]> {
    const response = await api.get(`${apiRoutes.TASKS.BOARD(workspaceId)}${buildTaskQuery(filters)}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = normalizeResponseData<any>(response);
    const tasks: TaskDto[] = Array.isArray(payload) ? payload : (payload?.tasks ?? []);
    return tasks.map(toIssue);
  },

  async listBoardTasks(workspaceId: string, filters?: TaskFilters): Promise<Issue[]> {
    return taskService.getBoardTasks(workspaceId, filters);
  },

  async getBoardTaskDetail(workspaceId: string, taskKey: string): Promise<TaskDetailResponse> {
    const response = await api.get(apiRoutes.TASKS.BOARD_TASK_BY_KEY(workspaceId, taskKey));

    return toTaskDetail(normalizeResponseData<TaskDto>(response));
  },

  async createBoardTask(workspaceId: string, input: CreateTaskInput): Promise<Issue> {
    const response = await api.post(apiRoutes.TASKS.BOARD(workspaceId), toCreatePayload(input));

    return toIssue(normalizeResponseData<TaskDto>(response));
  },

  async updateBoardTask(workspaceId: string, taskId: string, updates: Partial<Issue>): Promise<Issue> {
    const hasContentUpdate =
      updates.title !== undefined ||
      updates.description !== undefined ||
      updates.storyPoints !== undefined ||
      updates.startDate !== undefined ||
      updates.dueDate !== undefined ||
      updates.assigneeId !== undefined ||
      updates.assignee !== undefined ||
      updates.type !== undefined ||
      updates.priority !== undefined;
    const isMoveUpdate =
      !hasContentUpdate &&
      (updates.status !== undefined || updates.columnId !== undefined || updates.sprintId !== undefined);

    if (isMoveUpdate) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = {};
      if (updates.columnId !== undefined) {
        payload.columnId = updates.columnId;
        if (updates.status !== undefined) payload.status = toColumnId(updates.status) ?? updates.status;
      } else if (updates.status !== undefined) {
        payload.status = toColumnId(updates.status);
        payload.columnId = toColumnId(updates.status);
      }
      if (updates.sprintId !== undefined) {
        payload.sprintId = updates.sprintId;
      }

      const response = await api.patch(apiRoutes.TASKS.BOARD_TASK_MOVE(workspaceId, taskId), payload);
      return toIssue(normalizeResponseData<TaskDto>(response));
    }

    const response = await api.patch(apiRoutes.TASKS.BOARD_TASK(workspaceId, taskId), toUpdatePayload(updates));

    return toIssue(normalizeResponseData<TaskDto>(response));
  },

  async moveBoardTask(workspaceId: string, taskId: string, input: { columnId: string }): Promise<Issue> {
    const response = await api.patch(apiRoutes.TASKS.BOARD_TASK_MOVE(workspaceId, taskId), input);

    return toIssue(normalizeResponseData<TaskDto>(response));
  },

  async reorderBoardTask(workspaceId: string, taskId: string, input: ReorderTaskInput): Promise<Issue> {
    const response = await api.patch(apiRoutes.TASKS.BOARD_TASK_REORDER(workspaceId, taskId), input);

    return toIssue(normalizeResponseData<TaskDto>(response));
  },

  async deleteBoardTask(workspaceId: string, taskId: string): Promise<void> {
    await api.delete(apiRoutes.TASKS.BOARD_TASK(workspaceId, taskId), {
      data: { confirmText: "delete" },
    });
  },

  async archiveBoardTask(workspaceId: string, taskId: string): Promise<Issue> {
    const response = await api.patch(apiRoutes.TASKS.BOARD_TASK_ARCHIVE(workspaceId, taskId));

    return toIssue(normalizeResponseData<TaskDto>(response));
  },

  async restoreBoardTask(workspaceId: string, taskId: string): Promise<Issue> {
    const response = await api.patch(apiRoutes.TASKS.BOARD_TASK_RESTORE(workspaceId, taskId));

    return toIssue(normalizeResponseData<TaskDto>(response));
  },

  async replaceTaskLabels(workspaceId: string, taskId: string, labelIds: string[]): Promise<Issue> {
    const response = await api.patch(apiRoutes.TASKS.BOARD_TASK_LABELS(workspaceId, taskId), { labelIds });

    return toIssue(normalizeResponseData<TaskDto>(response));
  },

  async getTaskActivities(
    workspaceId: string,
    taskId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedActivitiesResponse> {
    const response = await api.get(
      `${apiRoutes.TASKS.BOARD_TASK_ACTIVITIES(workspaceId, taskId)}?page=${page}&limit=${limit}`
    );
    const payload = normalizeResponseData<Record<string, unknown>>(response);
    const activities: TaskActivity[] = Array.isArray(payload)
      ? (payload as TaskActivity[])
      : ((payload?.activities ?? []) as TaskActivity[]);
    return {
      activities,
      total: typeof payload?.total === "number" ? payload.total : activities.length,
      page: typeof payload?.page === "number" ? payload.page : page,
      limit: typeof payload?.limit === "number" ? payload.limit : limit,
    };
  },

  async getArchivedTasks(
    workspaceId: string,
    filters?: Pick<TaskFilters, "page" | "limit" | "sortBy" | "sortOrder">
  ): Promise<PaginatedTasksResponse> {
    const query = buildTaskQuery(filters);
    const response = await api.get(`${apiRoutes.TASKS.BOARD_ARCHIVES(workspaceId)}${query}`);
    const payload = normalizeResponseData<Record<string, unknown>>(response);
    const raw: TaskDto[] = Array.isArray(payload) ? (payload as TaskDto[]) : ((payload?.tasks ?? []) as TaskDto[]);
    return {
      tasks: raw.map(toIssue),
      total: typeof payload?.total === "number" ? payload.total : raw.length,
      page: typeof payload?.page === "number" ? payload.page : (filters?.page ?? 1),
      limit: typeof payload?.limit === "number" ? payload.limit : (filters?.limit ?? 20),
    };
  },

  async getComments(workspaceId: string, taskId: string): Promise<TaskComment[]> {
    const response = await api.get(apiRoutes.TASKS.BOARD_TASK_COMMENTS(workspaceId, taskId));
    const payload = normalizeResponseData<unknown>(response);
    return (Array.isArray(payload) ? payload : []).map((comment) => toTaskComment(comment as TaskComment));
  },

  async createComment(
    workspaceId: string,
    taskId: string,
    content: string,
    parentId?: string | null,
    mentions?: string[]
  ): Promise<TaskComment> {
    const body: Record<string, unknown> = { content };
    if (parentId) body.parentId = parentId;
    if (mentions?.length) body.mentions = mentions;
    const response = await api.post(apiRoutes.TASKS.BOARD_TASK_COMMENTS(workspaceId, taskId), body);
    return toTaskComment(normalizeResponseData<TaskComment>(response));
  },

  async updateComment(workspaceId: string, taskId: string, commentId: string, content: string): Promise<TaskComment> {
    const response = await api.patch(apiRoutes.TASKS.BOARD_TASK_COMMENT(workspaceId, taskId, commentId), { content });
    return toTaskComment(normalizeResponseData<TaskComment>(response));
  },

  async deleteComment(workspaceId: string, taskId: string, commentId: string): Promise<void> {
    await api.delete(apiRoutes.TASKS.BOARD_TASK_COMMENT(workspaceId, taskId, commentId));
  },
// Task service object (legacy interface for components using taskService.xxx)
// import * as taskQueries from "./taskQueries";
// import * as taskMutations from "./taskMutations";

// export const taskService = {
//   // Board tasks
//   getBoardTasks: taskQueries.getBoardTasks,
//   listBoardTasks: taskQueries.getBoardTasks,
//   getBoardTaskDetail: taskQueries.getBoardTaskDetail,
//   createBoardTask: taskMutations.createBoardTask,
//   updateBoardTask: taskMutations.updateBoardTask,
//   moveBoardTask: taskMutations.moveBoardTask,
//   reorderBoardTask: taskMutations.reorderBoardTask,
//   deleteBoardTask: taskMutations.deleteBoardTask,
//   archiveBoardTask: taskMutations.archiveBoardTask,
//   restoreBoardTask: taskMutations.restoreBoardTask,
  
//   // Labels
//   replaceTaskLabels: taskMutations.replaceTaskLabels,
  
//   // Activities
//   getTaskActivities: taskQueries.getTaskActivities,
  
//   // Archived tasks
//   getArchivedTasks: taskQueries.getArchivedTasks,
  
//   // Comments
//   getComments: taskQueries.getComments,
//   createComment: taskMutations.createComment,
//   updateComment: taskMutations.updateComment,
//   deleteComment: taskMutations.deleteComment,
  
//   // Utility
//   buildTaskQuery: taskQueries.buildTaskQuery,
};
