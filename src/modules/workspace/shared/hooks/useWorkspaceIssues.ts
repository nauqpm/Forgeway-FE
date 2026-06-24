"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { boardService } from "@/modules/workspace/shared/services/boardService";
import { sprintService } from "@/modules/workspace/shared/services/sprintService";
import { taskService } from "@/modules/workspace/shared/services/taskService";
import { BoardColumn } from "@/modules/workspace/shared/types/board.type";
import { Issue } from "@/modules/workspace/shared/types/issue.type";
import { Sprint } from "@/modules/workspace/shared/types/sprint.type";
import { Workspace } from "@/modules/workspace/shared/types/workspace.type";
import { TaskFilters, Filters } from "@/modules/workspace/shared/types/filter.type";
import { filterTasks } from "@/modules/workspace/shared/utils/filterTasks";
import { enrichTaskDetailUsers } from "@/modules/workspace/shared/utils/taskDetailUsers";
import { TaskReorderSyncInput } from "@/modules/workspace/shared/utils/dragUtils";
import { useWorkspaceRealtime } from "@/modules/workspace/shared/hooks/useWorkspaceRealtime";
import { sortIssuesByRank, taskIdOf } from "@/lib/realtime/utils/task-realtime-cache.utils";
import { clearOptimisticIssueOrder, isNoopReorderError } from "@/modules/workspace/shared/utils/workspaceUtils";
import { queryKeys } from "@/shared/constants/queryKeys";

interface UseWorkspaceIssuesParams {
  workspaceId: string | undefined;
  workspaceType: string | undefined;
  taskFilters: TaskFilters;
  filters: Filters;
  workspace: Workspace | null;
  selectedIssue: Issue | null;
  selectedTaskKey: string | null;
  setSelectedIssue: React.Dispatch<React.SetStateAction<Issue | null>>;
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useWorkspaceIssues({
  workspaceId,
  workspaceType,
  taskFilters,
  filters,
  workspace,
  selectedIssue,
  selectedTaskKey,
  setSelectedIssue,
  setSelectedTaskIds,
}: UseWorkspaceIssuesParams) {
  const queryClient = useQueryClient();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const isDraggingIssueRef = useRef(false);
  const reorderInFlightRef = useRef(new Set<string>());
  const pendingReorderRef = useRef(new Map<string, TaskReorderSyncInput>());

  const { data: boardData, isLoading: isBoardLoading } = useQuery({
    queryKey: ["board", workspaceId],
    queryFn: () => boardService.getBoardByWorkspace(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 30_000,
  });

  const { data: sprintsData } = useQuery({
    queryKey: ["sprints", workspaceId],
    queryFn: () => sprintService.listSprints(workspaceId!),
    enabled: !!workspaceId && workspaceType === "scrum",
    staleTime: 30_000,
  });

  const fallbackTaskFilters = useMemo(() => ({ ...taskFilters, search: undefined }), [taskFilters]);

  const { data: tasksData, error: tasksError, isFetching: isTasksFetching } = useQuery({
    queryKey: ["tasks", workspaceId, taskFilters],
    queryFn: () => taskService.getBoardTasks(workspaceId!, taskFilters),
    enabled: !!workspaceId,
    staleTime: 30_000,
  });

  const shouldUseFallbackTaskSearch =
    !!workspaceId && Boolean(filters.search.trim()) && !isTasksFetching &&
    Array.isArray(tasksData) && tasksData.length === 0;

  const { data: fallbackTasksData, isFetching: isFallbackTasksFetching } = useQuery({
    queryKey: ["tasks-fallback-search", workspaceId, fallbackTaskFilters],
    queryFn: () => taskService.getBoardTasks(workspaceId!, fallbackTaskFilters),
    enabled: shouldUseFallbackTaskSearch,
    staleTime: 30_000,
  });

  const isTaskBoardFetching = isTasksFetching || isFallbackTasksFetching;

  const { data: selectedTaskDetail } = useQuery({
    queryKey: queryKeys.tasks.detail(workspaceId ?? "", selectedTaskKey ?? ""),
    queryFn: () => taskService.getBoardTaskDetail(workspaceId!, selectedTaskKey!),
    enabled: !!workspaceId && !!selectedTaskKey,
    staleTime: 30_000,
  });

  const activeIssueDetail = useMemo(() => {
    if (selectedTaskDetail && workspace) return enrichTaskDetailUsers(selectedTaskDetail, workspace.members);
    return selectedTaskDetail ?? selectedIssue;
  }, [selectedIssue, selectedTaskDetail, workspace]);

  const filteredIssues = useMemo(() => filterTasks(issues, filters, workspace), [issues, filters, workspace]);

  const patchSelectedTaskView = useCallback(
    (issue: Issue) => {
      const nextIssueId = taskIdOf(issue);
      setSelectedIssue((current) =>
        current && taskIdOf(current) === nextIssueId ? { ...current, ...issue } : current);
      if (!workspaceId || !issue.key) return;
      queryClient.setQueryData(
        queryKeys.tasks.detail(workspaceId, issue.key),
        (current: Issue | undefined) => (current ? { ...current, ...issue } : current),
      );
    },
    [queryClient, setSelectedIssue, workspaceId],
  );

  useWorkspaceRealtime({
    workspaceId, isDraggingIssueRef, setIssues, setSprints,
    setSelectedIssue, setSelectedTaskIds, patchSelectedTaskView,
  });

  useEffect(() => { if (boardData?.columns) setColumns(boardData.columns); }, [boardData]);
  useEffect(() => { if (sprintsData) setSprints(sprintsData); }, [sprintsData]);

  useEffect(() => {
    const nextTasksData = shouldUseFallbackTaskSearch && fallbackTasksData ? fallbackTasksData : tasksData;
    if (!nextTasksData || isDraggingIssueRef.current) return;
    setIssues(nextTasksData);
    if (selectedTaskKey && !selectedIssue) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matchingIssue = nextTasksData.find((issue: any) => issue.key === selectedTaskKey);
      if (matchingIssue) setSelectedIssue(matchingIssue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallbackTasksData, selectedTaskKey, shouldUseFallbackTaskSearch, tasksData]);

  const syncTaskReorder = useCallback(
    (input: TaskReorderSyncInput) => {
      if (!workspaceId) return;
      const { taskId, columnId, status, sprintId, rankScope, beforeTaskId, afterTaskId } = input;
      if (reorderInFlightRef.current.has(taskId)) {
        pendingReorderRef.current.set(taskId, input);
        return;
      }
      reorderInFlightRef.current.add(taskId);

      taskService
        .reorderBoardTask(workspaceId, taskId, { columnId, status, sprintId, rankScope, beforeTaskId, afterTaskId })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((updatedTask: any) => {
          const hasQueuedReorder = pendingReorderRef.current.has(taskId);
          patchSelectedTaskView(updatedTask);
          if (!hasQueuedReorder) {
            setIssues((current) =>
              sortIssuesByRank(current.map((issue) =>
                issue.id === updatedTask.id ? updatedTask : clearOptimisticIssueOrder(issue))),
            );
            queryClient.setQueriesData<Issue[]>({ queryKey: ["tasks", workspaceId] }, (current) =>
              Array.isArray(current)
                ? sortIssuesByRank(current.map((issue) =>
                    issue.id === updatedTask.id ? updatedTask : clearOptimisticIssueOrder(issue)))
                : current,
            );
          }
          queryClient.invalidateQueries({ queryKey: ["taskActivities", workspaceId, taskId] });
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .catch((error: any) => {
          setIssues((current) => current.map(clearOptimisticIssueOrder));
          queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
          if (!isNoopReorderError(error)) {
            toast.error(error?.response?.data?.message || "Could not update task position");
          }
        })
        .finally(() => {
          reorderInFlightRef.current.delete(taskId);
          const queuedReorder = pendingReorderRef.current.get(taskId);
          if (queuedReorder) {
            pendingReorderRef.current.delete(taskId);
            window.setTimeout(() => syncTaskReorder(queuedReorder), 0);
          }
        });
    },
    [patchSelectedTaskView, queryClient, workspaceId],
  );

  return {
    issues, setIssues, sprints, setSprints, columns, setColumns, filteredIssues,
    isTaskBoardFetching, isBoardLoading, boardData, tasksError, activeIssueDetail,
    syncTaskReorder, patchSelectedTaskView, isDraggingIssueRef,
  };
}
