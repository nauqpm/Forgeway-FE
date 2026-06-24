import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";

export type GlobalSearchType = "task" | "page" | "comment" | "workspace" | "board" | "sprint" | "user";

export type GlobalSearchItem = {
  id: string;
  type: GlobalSearchType;
  title: string;
  description?: string;
  key?: string;
  url: string;
  workspaceId?: string;
  workspaceName?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type GlobalSearchResponse = {
  items: GlobalSearchItem[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
};

export type GlobalSearchParams = {
  q: string;
  types?: GlobalSearchType[];
  workspaceIds?: string[];
  assigneeIds?: string[];
  authorIds?: string[];
  reporterId?: string;
  status?: string[];
  taskType?: string[];
  priority?: string[];
  updatedAfter?: string;
  updatedBefore?: string;
  cursor?: string;
  limit?: number;
};

const unwrap = <T>(payload: unknown): T => {
  const value = payload as { data?: { data?: T } | T };
  return (value?.data && typeof value.data === "object" && "data" in value.data ? value.data.data : value.data) as T;
};

export const globalSearchService = {
  async search(params: GlobalSearchParams): Promise<GlobalSearchResponse> {
    const searchParams = new URLSearchParams({ q: params.q.trim() });
    if (params.types?.length) searchParams.set("types", params.types.join(","));
    if (params.workspaceIds?.length) searchParams.set("workspaceIds", params.workspaceIds.join(","));
    if (params.assigneeIds?.length) searchParams.set("assigneeIds", params.assigneeIds.join(","));
    if (params.authorIds?.length) searchParams.set("authorIds", params.authorIds.join(","));
    if (params.reporterId) searchParams.set("reporterId", params.reporterId);
    if (params.status?.length) searchParams.set("status", params.status.join(","));
    if (params.taskType?.length) searchParams.set("taskType", params.taskType.join(","));
    if (params.priority?.length) searchParams.set("priority", params.priority.join(","));
    if (params.updatedAfter) searchParams.set("updatedAfter", params.updatedAfter);
    if (params.updatedBefore) searchParams.set("updatedBefore", params.updatedBefore);
    if (params.cursor) searchParams.set("cursor", params.cursor);
    if (params.limit) searchParams.set("limit", String(params.limit));
    const response = await api.get(`${apiRoutes.SEARCH.GLOBAL}?${searchParams.toString()}`);
    return unwrap<GlobalSearchResponse>(response);
  },
};
