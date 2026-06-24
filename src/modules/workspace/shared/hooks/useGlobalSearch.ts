import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/constants/queryKeys";
import { globalSearchService, type GlobalSearchParams } from "../services/globalSearch.service";

export function useGlobalSearch(params: GlobalSearchParams, enabled = true) {
  const normalized = {
    ...params,
    q: params.q.trim(),
    types: params.types ?? [],
    workspaceIds: params.workspaceIds ?? [],
    assigneeIds: params.assigneeIds ?? [],
    authorIds: params.authorIds ?? [],
    reporterId: params.reporterId ?? "",
    status: params.status ?? [],
    taskType: params.taskType ?? [],
    priority: params.priority ?? [],
    updatedAfter: params.updatedAfter ?? "",
    updatedBefore: params.updatedBefore ?? "",
    cursor: params.cursor ?? "",
  };

  return useQuery({
    queryKey: queryKeys.search.global(normalized),
    queryFn: () => globalSearchService.search(params),
    enabled: enabled && normalized.q.length >= 2,
    staleTime: 20_000,
  });
}
