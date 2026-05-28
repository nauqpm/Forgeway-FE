import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import { Issue } from "../types/issue.type";
import { TaskFilters } from "../types/filter.type";

type TaskDto = {
  _id?: string;
  id?: string;
  key: string;
  title: string;
  description?: string;
  type?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  reporterId?: string;
  sprintId?: string;
  columnId?: string;
  boardColumnId?: string;
  storyPoints?: number;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  isArchived?: boolean;
  archivedAt?: string | null;
  archivedBy?: string | null;
  archivedByUser?: {
    id?: string;
    fullName?: string;
    email?: string;
    avatar?: string;
  } | null;
};

type CreateTaskInput = {
  title: string;
  type: string;
  priority: string;
  status: string;
  sprintId: string | null;
  assigneeId?: string | null;
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
  metadata?: Record<string, any>;
  createdAt?: string;
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
    columnId: task.columnId ?? task.boardColumnId ?? toColumnId(task.status) ?? "todo",
    status: toStatusLabel(task),
    priority: toUiLabel(task.priority, "Medium"),
    type: toUiLabel(task.type, "Task"),
    assignee,
    assigneeId: task.assigneeId,
    color: "bg-indigo-600",
    sprintId: task.sprintId ?? null,
    storyPoints: task.storyPoints ?? 0,
    startDate: task.createdAt?.split("T")[0],
    endDate: task.dueDate?.split("T")[0],
    isArchived: task.isArchived,
    archivedAt: task.archivedAt ?? null,
    archivedBy: task.archivedBy ?? null,
    archivedByUser: task.archivedByUser ?? null,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
};

const toCreatePayload = (input: CreateTaskInput) => ({
  title: input.title,
  type: normalizeValue(input.type),
  priority: normalizeValue(input.priority),
  columnId: toColumnId(input.status),
  status: toColumnId(input.status),
  sprintId: input.sprintId || undefined,
  assigneeId: input.assigneeId || undefined,
});

const toUpdatePayload = (updates: Partial<Issue>) => {
  const {
    assignee,
    assigneeId,
    columnId,
    description,
    endDate,
    priority,
    sprintId,
    status,
    storyPoints,
    title,
    type,
  } = updates;

  const nextAssigneeId = assigneeId ?? (assignee && assignee !== "U" ? assignee : undefined);
  const payload: Record<string, unknown> = {};

  if (title !== undefined) payload.title = title;
  if (description !== undefined) payload.description = description;
  if (storyPoints !== undefined) payload.storyPoints = storyPoints;
  if (columnId !== undefined) {
    payload.columnId = columnId;
  }
  if (endDate !== undefined) payload.dueDate = endDate || undefined;
  if (nextAssigneeId !== undefined) payload.assigneeId = nextAssigneeId;
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
  addValue("taskKey", activeFilters.taskKey);
  addValue("search", activeFilters.search?.trim());
  addValue("backlog", activeFilters.backlog === true ? "true" : undefined);
  addValue("archived", activeFilters.archived === true ? "true" : undefined);
  addValue("page", activeFilters.page);
  addValue("limit", activeFilters.limit);

  return params.length > 0 ? `?${params.join("&")}` : "";
};

export const taskService = {
  async getBoardTasks(
    workspaceKey: string,
    filters?: TaskFilters,
  ): Promise<Issue[]> {
    const response = await api.get(
      `${apiRoutes.TASKS.BOARD(workspaceKey)}${buildTaskQuery(filters)}`,
    );
    return normalizeResponseData<TaskDto[]>(response).map(toIssue);
  },

  async listBoardTasks(
    workspaceKey: string,
    filters?: TaskFilters,
  ): Promise<Issue[]> {
    return taskService.getBoardTasks(workspaceKey, filters);
  },

  async createBoardTask(
    workspaceKey: string,
    input: CreateTaskInput,
  ): Promise<Issue> {
    const response = await api.post(
      apiRoutes.TASKS.BOARD(workspaceKey),
      toCreatePayload(input),
    );

    return toIssue(normalizeResponseData<TaskDto>(response));
  },

  async updateBoardTask(
    workspaceKey: string,
    taskId: string,
    updates: Partial<Issue>,
  ): Promise<Issue> {
    const isMoveUpdate =
      updates.status !== undefined ||
      updates.columnId !== undefined ||
      updates.sprintId !== undefined;

    if (isMoveUpdate) {
      const payload: Record<string, any> = {};
      if (updates.status !== undefined) {
        payload.status = toColumnId(updates.status);
        payload.columnId = toColumnId(updates.status);
      } else if (updates.columnId !== undefined) {
        payload.columnId = updates.columnId;
      }
      if (updates.sprintId !== undefined) {
        payload.sprintId = updates.sprintId;
      }

      const response = await api.patch(
        apiRoutes.TASKS.BOARD_TASK_MOVE(workspaceKey, taskId),
        payload,
      );
      return toIssue(normalizeResponseData<TaskDto>(response));
    }

    const response = await api.patch(
      apiRoutes.TASKS.BOARD_TASK(workspaceKey, taskId),
      toUpdatePayload(updates),
    );

    return toIssue(normalizeResponseData<TaskDto>(response));
  },

  async moveBoardTask(
    workspaceKey: string,
    taskId: string,
    input: { columnId: string },
  ): Promise<Issue> {
    const response = await api.patch(
      apiRoutes.TASKS.BOARD_TASK_MOVE(workspaceKey, taskId),
      input,
    );

    return toIssue(normalizeResponseData<TaskDto>(response));
  },

  async deleteBoardTask(
    workspaceKey: string,
    taskId: string,
  ): Promise<void> {
    await api.delete(apiRoutes.TASKS.BOARD_TASK(workspaceKey, taskId), {
      data: { confirmText: "delete" },
    });
  },

  async archiveBoardTask(
    workspaceKey: string,
    taskId: string,
  ): Promise<Issue> {
    const response = await api.patch(
      apiRoutes.TASKS.BOARD_TASK_ARCHIVE(workspaceKey, taskId),
    );

    return toIssue(normalizeResponseData<TaskDto>(response));
  },

  async restoreBoardTask(
    workspaceKey: string,
    taskId: string,
  ): Promise<Issue> {
    const response = await api.patch(
      apiRoutes.TASKS.BOARD_TASK_RESTORE(workspaceKey, taskId),
    );

    return toIssue(normalizeResponseData<TaskDto>(response));
  },

  async getTaskActivities(
    workspaceKey: string,
    taskId: string,
  ): Promise<TaskActivity[]> {
    const response = await api.get(
      apiRoutes.TASKS.BOARD_TASK_ACTIVITIES(workspaceKey, taskId),
    );

    return normalizeResponseData<TaskActivity[]>(response);
  },
};

