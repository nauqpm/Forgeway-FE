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

export const taskService = {
  async listBoardTasks(
    workspaceKey: string,
    filters?: import("../types/filter.type").BoardTaskFilters,
  ): Promise<Issue[]> {
    const params = new URLSearchParams();

    const appendString = (key: string, value?: string | null) => {
      if (!value) return;
      params.append(key, value);
    };

    const appendBoolean = (key: string, value?: boolean) => {
      if (value === true) {
        params.append(key, "true");
      }
    };

    const appendNumber = (key: string, value?: number) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    };

    const appendStatus = (value?: string | string[] | null) => {
      const normalized = toArray(value)
        .map((status) => COLUMN_BY_STATUS[status] ?? normalizeValue(status))
        .filter(Boolean) as string[];

      if (normalized.length > 0) {
        params.append("status", normalized.join(","));
      }
    };

    const selectedTypes = normalizeArray(filters?.type as string | string[]);
    const selectedPriorities = normalizeArray(filters?.priority as string | string[]);
    const selectedAssignees = toArray(filters?.assigneeId as string | string[]);

    if (filters) {
      appendStatus(filters.status);

      appendString("columnId", filters.columnId);
      appendString("sprintId", filters.sprintId);
      appendString("reporterId", Array.isArray(filters.reporterId) ? filters.reporterId[0] : filters.reporterId);

      // Không gửi type / priority / assigneeId lên BE khi multi vì BE đang trả 400.
      // Sẽ filter lại ở FE sau khi lấy data.

      appendString("search", filters.search?.trim());

      appendBoolean("backlog", filters.backlog);
      appendBoolean("archived", filters.archived);

      appendNumber("page", filters.page);
      appendNumber("limit", filters.limit);
    }

    const queryString = params.toString();
    const url = queryString
      ? `${apiRoutes.TASKS.BOARD(workspaceKey)}?${queryString}`
      : apiRoutes.TASKS.BOARD(workspaceKey);

    const response = await api.get(url);
    const tasks = normalizeResponseData<TaskDto[]>(response);

    let issues = tasks.map(toIssue);

    if (selectedTypes.length > 0) {
      issues = issues.filter((issue) => {
        const issueType = normalizeValue(issue.type);
        return issueType ? selectedTypes.includes(issueType) : false;
      });
    }

    if (selectedPriorities.length > 0) {
      issues = issues.filter((issue) => {
        const issuePriority = normalizeValue(issue.priority);
        return issuePriority ? selectedPriorities.includes(issuePriority) : false;
      });
    }

    if (selectedAssignees.length > 0) {
      issues = issues.filter((issue) => {
        return selectedAssignees.includes(issue.assignee);
      });
    }

    return issues;
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

  async deleteBoardTask(
    workspaceKey: string,
    taskId: string,
  ): Promise<void> {
    await api.delete(apiRoutes.TASKS.BOARD_TASK(workspaceKey, taskId), {
      data: { confirmText: "delete" },
    });
  },
};