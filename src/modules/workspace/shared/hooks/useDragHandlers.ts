"use client";

import { useCallback } from "react";
import { DropResult } from "@hello-pangea/dnd";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { taskService } from "@/modules/workspace/shared/services/taskService";
import { BoardColumn } from "@/modules/workspace/shared/types/board.type";
import { Issue } from "@/modules/workspace/shared/types/issue.type";
import {
  handleBoardDragEnd,
  handleBacklogDragEnd,
  compareIssueRank,
  TaskReorderSyncInput,
} from "@/modules/workspace/shared/utils/dragUtils";
import { isNoopReorderError } from "@/modules/workspace/shared/utils/workspaceUtils";
import { queryKeys } from "@/shared/constants/queryKeys";

interface UseDragHandlersParams {
  workspaceId: string | undefined;
  filteredIssues: Issue[];
  columns: BoardColumn[];
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  setColumns: React.Dispatch<React.SetStateAction<BoardColumn[]>>;
  syncTaskReorder: (input: TaskReorderSyncInput) => void;
  patchSelectedTaskView: (issue: Issue) => void;
  isDraggingIssueRef: React.MutableRefObject<boolean>;
  handleMoveColumn: (columnId: string, newOrder: number) => void;
  canMoveTask: boolean;
}

export function useDragHandlers({
  workspaceId,
  filteredIssues,
  columns,
  setIssues,
  setColumns,
  syncTaskReorder,
  patchSelectedTaskView,
  isDraggingIssueRef,
  handleMoveColumn,
  canMoveTask,
}: UseDragHandlersParams) {
  const queryClient = useQueryClient();

  const handleBoardDragEndWithSync = useCallback(
    (result: DropResult) => {
      if (!canMoveTask) return;
      handleBoardDragEnd({
        result,
        columns,
        issues: filteredIssues,
        setColumns,
        setIssues,
        handleMoveColumn,
        onTaskReorder: syncTaskReorder,
        onColumnChange: (taskId, columnId) => {
          if (workspaceId) {
            taskService
              .moveBoardTask(workspaceId, taskId, { columnId })
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .then((updatedTask: any) => {
                patchSelectedTaskView(updatedTask);
                // Sync board cache with API response
                queryClient.setQueriesData<Issue[]>(
                  { queryKey: queryKeys.tasks.byWorkspace(workspaceId) },
                  (current) =>
                    Array.isArray(current)
                      ? current.map((issue) =>
                          (issue.id || issue._id) === updatedTask.id
                            ? {
                                ...issue,
                                columnId: updatedTask.columnId,
                                status: updatedTask.status,
                                rank: updatedTask.rank,
                                version: updatedTask.version,
                              }
                            : issue,
                        )
                      : current,
                );
                queryClient.invalidateQueries({
                  queryKey: ["taskActivities", workspaceId, taskId],
                });
              })
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .catch((error: any) => {
                if (isNoopReorderError(error)) {
                  queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byWorkspace(workspaceId) });
                  return;
                }
                queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byWorkspace(workspaceId) });
                toast.error(error?.response?.data?.message || "Could not update task position");
              });
          }
        },
      });
      isDraggingIssueRef.current = false;
    },
    [
      canMoveTask,
      columns,
      filteredIssues,
      handleMoveColumn,
      isDraggingIssueRef,
      patchSelectedTaskView,
      queryClient,
      setColumns,
      setIssues,
      syncTaskReorder,
      workspaceId,
    ],
  );

  const handleBacklogDragEndWithSync = useCallback(
    (result: DropResult) => {
      handleBacklogDragEnd({
        result,
        issues: filteredIssues,
        setIssues,
        onTaskReorder: syncTaskReorder,
      });
      isDraggingIssueRef.current = false;
      setIssues((current) => [...current].sort(compareIssueRank));
    },
    [
      filteredIssues,
      isDraggingIssueRef,
      setIssues,
      syncTaskReorder,
    ],
  );

  const onBoardDragStart = useCallback(() => {
    isDraggingIssueRef.current = true;
  }, [isDraggingIssueRef]);

  const onBacklogDragStart = useCallback(() => {
    isDraggingIssueRef.current = true;
  }, [isDraggingIssueRef]);

  return {
    handleBoardDragEndWithSync,
    handleBacklogDragEndWithSync,
    onBoardDragStart,
    onBacklogDragStart,
  };
}
