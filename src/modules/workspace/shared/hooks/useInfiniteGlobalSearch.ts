import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/constants/queryKeys";
import { globalSearchService, type GlobalSearchParams } from "../services/globalSearch.service";

export function useInfiniteGlobalSearch(params: Omit<GlobalSearchParams, "cursor">, enabled = true) {
  const normalized = {
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
    cursor: "",
  };

  return useInfiniteQuery({
    queryKey: queryKeys.search.global(normalized),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => globalSearchService.search({ ...params, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: enabled && normalized.q.length >= 2,
    staleTime: 20_000,
  });
}
