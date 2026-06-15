// Task Queries - API calls for fetching data
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import type { TaskFilters } from "../types/filter.type";
import { Issue } from "../types/issue.type";
import type { TaskDetailResponse } from "../types/task-detail.type";
import {
  normalizeResponseData,
  toIssue,
  toTaskDetail,
  toTaskComment,
} from "./taskNormalizer";
import type { TaskDto, TaskComment, TaskActivity, PaginatedActivitiesResponse, PaginatedTasksResponse } from "./taskTypes";

/**
 * Build query string from filters
 */
export const buildTaskQuery = (filters?: TaskFilters): string => {
  if (!filters) return "";
  
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
  
  const normalizeValue = (value?: string | null): string | undefined => {
    if (!value) return undefined;
    return value.trim().toLowerCase().replace(/\s+/g, "");
  };

  const toArray = (value?: string | string[] | null): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return String(value).split(",").map((item) => item.trim()).filter(Boolean);
  };

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
  addArray("type", toArray(activeFilters.type).map(normalizeValue).filter(Boolean) as string[]);
  addArray("priority", toArray(activeFilters.priority).map(normalizeValue).filter(Boolean) as string[]);
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

/**
 * Get all board tasks with optional filters
 */
export async function getBoardTasks(
  workspaceId: string,
  filters?: TaskFilters,
): Promise<Issue[]> {
  const response = await api.get(
    `${apiRoutes.TASKS.BOARD(workspaceId)}${buildTaskQuery(filters)}`,
  );
  const payload = normalizeResponseData<{ tasks?: TaskDto[] } | TaskDto[]>(response);
  const tasks: TaskDto[] = Array.isArray(payload) 
    ? payload 
    : (payload?.tasks ?? []);
  return tasks.map(toIssue);
}

/**
 * Get board task detail by key
 */
export async function getBoardTaskDetail(
  workspaceId: string,
  taskKey: string,
): Promise<TaskDetailResponse> {
  const response = await api.get(
    apiRoutes.TASKS.BOARD_TASK_BY_KEY(workspaceId, taskKey),
  );
  return toTaskDetail(normalizeResponseData<TaskDto>(response));
}

/**
 * Get task activities (history)
 */
export async function getTaskActivities(
  workspaceId: string,
  taskId: string,
  page = 1,
  limit = 20,
): Promise<PaginatedActivitiesResponse> {
  const response = await api.get(
    `${apiRoutes.TASKS.BOARD_TASK_ACTIVITIES(workspaceId, taskId)}?page=${page}&limit=${limit}`,
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
}

/**
 * Get archived tasks
 */
export async function getArchivedTasks(
  workspaceId: string,
  filters?: Pick<TaskFilters, "page" | "limit" | "sortBy" | "sortOrder">,
): Promise<PaginatedTasksResponse> {
  const query = buildTaskQuery(filters);
  const response = await api.get(
    `${apiRoutes.TASKS.BOARD_ARCHIVES(workspaceId)}${query}`,
  );
  const payload = normalizeResponseData<{ tasks?: TaskDto[] } | TaskDto[]>(response);
  const raw: TaskDto[] = Array.isArray(payload)
    ? payload
    : ((payload?.tasks ?? []) as TaskDto[]);
  return {
    tasks: raw.map(toIssue),
    total: typeof payload === 'object' && payload !== null && 'total' in payload ? (payload as { total: number }).total : raw.length,
    page: typeof payload === 'object' && payload !== null && 'page' in payload ? (payload as { page: number }).page : (filters?.page ?? 1),
    limit: typeof payload === 'object' && payload !== null && 'limit' in payload ? (payload as { limit: number }).limit : (filters?.limit ?? 20),
  };
}

/**
 * Get task comments
 */
export async function getComments(
  workspaceId: string,
  taskId: string,
): Promise<TaskComment[]> {
  const response = await api.get(
    apiRoutes.TASKS.BOARD_TASK_COMMENTS(workspaceId, taskId),
  );
  const payload = normalizeResponseData<unknown>(response);
  return (Array.isArray(payload) ? payload : []).map((comment) =>
    toTaskComment(comment as TaskComment),
  );
}
