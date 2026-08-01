import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { Issue } from "../types/issue.type";
import { TaskFilters } from "../types/filter.type";
import { TaskDetailResponse } from "../types/task-detail.type";
import { CreateTaskInput, TaskDto } from "./taskTypes";
import {
  toCreatePayload as normalizeCreatePayload,
  toIssue as normalizeTaskIssue,
  toTaskDetail as normalizeTaskDetail,
  toUpdatePayload as normalizeUpdatePayload,
} from "./taskNormalizer";

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

const toTaskComment = (comment: TaskComment): TaskComment => ({
  ...comment,
  id: comment.id || comment._id || "",
  authorId: comment.authorId || comment.author?.id || "",
});

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
    return tasks.map(normalizeTaskIssue);
  },

  async listBoardTasks(workspaceId: string, filters?: TaskFilters): Promise<Issue[]> {
    return taskService.getBoardTasks(workspaceId, filters);
  },

  async getBoardTaskDetail(workspaceId: string, taskKey: string): Promise<TaskDetailResponse> {
    const response = await api.get(apiRoutes.TASKS.BOARD_TASK_BY_KEY(workspaceId, taskKey));

    return normalizeTaskDetail(normalizeResponseData<TaskDto>(response));
  },

  async createBoardTask(workspaceId: string, input: CreateTaskInput): Promise<Issue> {
    const response = await api.post(apiRoutes.TASKS.BOARD(workspaceId), normalizeCreatePayload(input));

    return normalizeTaskIssue(normalizeResponseData<TaskDto>(response));
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
      return normalizeTaskIssue(normalizeResponseData<TaskDto>(response));
    }

    const response = await api.patch(apiRoutes.TASKS.BOARD_TASK(workspaceId, taskId), normalizeUpdatePayload(updates));

    return normalizeTaskIssue(normalizeResponseData<TaskDto>(response));
  },

  async moveBoardTask(workspaceId: string, taskId: string, input: { columnId: string }): Promise<Issue> {
    const response = await api.patch(apiRoutes.TASKS.BOARD_TASK_MOVE(workspaceId, taskId), input);

    return normalizeTaskIssue(normalizeResponseData<TaskDto>(response));
  },

  async reorderBoardTask(workspaceId: string, taskId: string, input: ReorderTaskInput): Promise<Issue> {
    const response = await api.patch(apiRoutes.TASKS.BOARD_TASK_REORDER(workspaceId, taskId), input);

    return normalizeTaskIssue(normalizeResponseData<TaskDto>(response));
  },

  async deleteBoardTask(workspaceId: string, taskId: string): Promise<void> {
    await api.delete(apiRoutes.TASKS.BOARD_TASK(workspaceId, taskId), {
      data: { confirmText: "delete" },
    });
  },

  async archiveBoardTask(workspaceId: string, taskId: string): Promise<Issue> {
    const response = await api.patch(apiRoutes.TASKS.BOARD_TASK_ARCHIVE(workspaceId, taskId));

    return normalizeTaskIssue(normalizeResponseData<TaskDto>(response));
  },

  async restoreBoardTask(workspaceId: string, taskId: string): Promise<Issue> {
    const response = await api.patch(apiRoutes.TASKS.BOARD_TASK_RESTORE(workspaceId, taskId));

    return normalizeTaskIssue(normalizeResponseData<TaskDto>(response));
  },

  async replaceTaskLabels(workspaceId: string, taskId: string, labelIds: string[]): Promise<Issue> {
    const response = await api.patch(apiRoutes.TASKS.BOARD_TASK_LABELS(workspaceId, taskId), { labelIds });

    return normalizeTaskIssue(normalizeResponseData<TaskDto>(response));
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
      tasks: raw.map(normalizeTaskIssue),
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
