import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import { Issue } from "../types/issue.type";
import { TaskFilters } from "../types/filter.type";

type TaskDto = {
  id: string;
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
};

type CreateTaskInput = {
  title: string;
  type: string;
  priority: string;
  status: string;
  sprintId: string | null;
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

const toIssue = (task: TaskDto): Issue => {
  const assignee = task.assigneeId || "U";

  return {
    id: task.id,
    key: requireTaskKey(task),
    title: task.title,
    columnId: task.columnId ?? task.boardColumnId ?? toColumnId(task.status) ?? "todo",
    status: toStatusLabel(task),
    priority: toUiLabel(task.priority, "Medium"),
    type: toUiLabel(task.type, "Task"),
    assignee,
    color: "bg-indigo-600",
    sprintId: task.sprintId ?? null,
    storyPoints: task.storyPoints ?? 0,
    startDate: task.createdAt?.split("T")[0],
    endDate: task.dueDate?.split("T")[0],
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
});

const toUpdatePayload = (updates: Partial<Issue>) => ({
  ...updates,
  type: normalizeValue(updates.type),
  priority: normalizeValue(updates.priority),
  ...(updates.status && {
    columnId: toColumnId(updates.status),
    status: toColumnId(updates.status),
  }),
  sprintId: updates.sprintId || undefined,
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
    workspaceId: string,
    filters?: TaskFilters,
  ): Promise<Issue[]> {
    const response = await api.get(
      `${apiRoutes.TASKS.BOARD(workspaceId)}${buildTaskQuery(filters)}`,
    );
    return normalizeResponseData<TaskDto[]>(response).map(toIssue);
  },

  async listBoardTasks(
    workspaceId: string,
    filters?: TaskFilters,
  ): Promise<Issue[]> {
    return taskService.getBoardTasks(workspaceId, filters);
  },

  async createBoardTask(
    workspaceId: string,
    input: CreateTaskInput,
  ): Promise<Issue> {
    const response = await api.post(
      apiRoutes.TASKS.BOARD(workspaceId),
      toCreatePayload(input),
    );

    return toIssue(normalizeResponseData<TaskDto>(response));
  },

  async updateBoardTask(
    workspaceId: string,
    taskId: string,
    updates: Partial<Issue>,
  ): Promise<Issue> {
    const response = await api.patch(
      apiRoutes.TASKS.BOARD_TASK(workspaceId, taskId),
      toUpdatePayload(updates),
    );

    return toIssue(normalizeResponseData<TaskDto>(response));
  },

  async deleteBoardTask(
    workspaceId: string,
    taskId: string,
  ): Promise<void> {
    await api.delete(apiRoutes.TASKS.BOARD_TASK(workspaceId, taskId), {
      data: { confirmText: "delete" },
    });
  },
};
