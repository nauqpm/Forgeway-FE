import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import { Issue } from "../types/issue.type";

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
  Done: "done",
};

const STATUS_BY_COLUMN: Record<string, string> = {
  todo: "To Do",
  inprogress: "In Progress",
  "in-progress": "In Progress",
  done: "Done",
};

const normalizeResponseData = <T>(payload: any): T => {
  return payload?.data?.data ?? payload?.data ?? payload;
};

const toColumnId = (status?: string) => {
  if (!status) return undefined;
  return COLUMN_BY_STATUS[status] ?? status;
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
  type: input.type.toLowerCase(),
  priority: input.priority.toLowerCase(),
  columnId: toColumnId(input.status),
  status: toColumnId(input.status),
  sprintId: input.sprintId || undefined,
});

const toUpdatePayload = (updates: Partial<Issue>) => ({
  ...updates,
  type: updates.type?.toLowerCase(),
  priority: updates.priority?.toLowerCase(),
  ...(updates.status && {
    columnId: toColumnId(updates.status),
    status: toColumnId(updates.status),
  }),
  sprintId: updates.sprintId || undefined,
});

export const taskService = {
  async listBoardTasks(workspaceKey: string): Promise<Issue[]> {
    const response = await api.get(apiRoutes.TASKS.BOARD(workspaceKey));
    const tasks = normalizeResponseData<TaskDto[]>(response);
    return tasks.map(toIssue);
  },

  async createBoardTask(workspaceKey: string, input: CreateTaskInput): Promise<Issue> {
    const response = await api.post(
      apiRoutes.TASKS.BOARD(workspaceKey),
      toCreatePayload(input),
    );
    return toIssue(normalizeResponseData<TaskDto>(response));
  },

  async updateBoardTask(
    workspaceKey: string,
    taskKey: string,
    updates: Partial<Issue>,
  ): Promise<Issue> {
    const response = await api.patch(
      apiRoutes.TASKS.BOARD_TASK(workspaceKey, taskKey),
      toUpdatePayload(updates),
    );
    return toIssue(normalizeResponseData<TaskDto>(response));
  },

  async deleteBoardTask(workspaceKey: string, taskKey: string): Promise<void> {
    await api.delete(apiRoutes.TASKS.BOARD_TASK(workspaceKey, taskKey), {
      data: { confirmText: "delete" },
    });
  },
};
