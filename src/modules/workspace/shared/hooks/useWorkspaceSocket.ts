"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BoardColumn } from "@/modules/workspace/shared/types/board.type";
import { Issue } from "@/modules/workspace/shared/types/issue.type";
import { realtimeSocketClient } from "@/lib/socket/socket.client";
import { LEGACY_EVENTS } from "@/lib/socket/socket.events";
import { queryKeys } from "@/shared/constants/queryKeys";

type BoardCacheData = {
  boardId: string;
  columns: BoardColumn[];
};

type BoardDeltaAction =
  | "board:columns-replaced"
  | "column:created"
  | "column:updated"
  | "column:deleted"
  | "column:moved"
  | "task:created"
  | "task:updated"
  | "task:deleted"
  | "task:moved";

type BoardDelta = {
  workspaceId: string;
  action: BoardDeltaAction;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>;
  version?: number;
  occurredAt: string;
};

const sortColumns = (columns: BoardColumn[]) =>
  [...columns].sort((a, b) => a.order - b.order);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toIssue = (task: any): Issue | undefined => {
  if (!task) return undefined;
  const id = task.id ?? task._id;
  if (!id || !task.key) return undefined;

  return {
    id,
    _id: task._id,
    key: task.key,
    title: task.title,
    description: task.description,
    columnId: task.columnId ?? task.status ?? "todo",
    status: task.status ?? task.columnId ?? "todo",
    rank: task.rank,
    priority: task.priority ?? "Medium",
    type: task.type ?? "Task",
    assignee: task.assigneeId ?? "U",
    assigneeId: task.assigneeId,
    color: "bg-indigo-600",
    sprintId: task.sprintId ?? null,
    storyPoints: task.storyPoints ?? 0,
    dueDate: task.dueDate?.split?.("T")?.[0],
    isArchived: task.isArchived,
    archivedAt: task.archivedAt ?? null,
    archivedBy: task.archivedBy ?? null,
    archivedByUser: task.archivedByUser ?? null,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    version: task.version,
  };
};

const upsertIssue = (issues: Issue[] | undefined, issue?: Issue) => {
  if (!issue) return issues ?? [];
  const current = issues ?? [];
  return current.some((item) => item.id === issue.id)
    ? current.map((item) => (item.id === issue.id ? { ...item, ...issue } : item))
    : [issue, ...current];
};

const removeIssue = (issues: Issue[] | undefined, taskId?: string) => {
  if (!taskId) return issues ?? [];
  return (issues ?? []).filter((item) => item.id !== taskId && item._id !== taskId);
};

export function useWorkspaceSocket(workspaceId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;

    const socket = realtimeSocketClient.connect();
    if (!socket) return;

    realtimeSocketClient.switchWorkspace(workspaceId);

    const invalidateWorkspaceQueries = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board.byWorkspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byWorkspace(workspaceId) });
    };

    const unsubscribeReconnect = realtimeSocketClient.onReconnect(() => {
      realtimeSocketClient.switchWorkspace(workspaceId);
      invalidateWorkspaceQueries();
    });

    const applyDelta = (delta: BoardDelta) => {
      if (delta.workspaceId !== workspaceId) return;

      queryClient.setQueryData<BoardCacheData>(queryKeys.board.byWorkspace(workspaceId), (current) => {
        if (!current) return current;

        switch (delta.action) {
          case "board:columns-replaced":
            return { ...current, columns: sortColumns(delta.payload.columns ?? current.columns) };
          case "column:created":
            return {
              ...current,
              columns: sortColumns([...current.columns, delta.payload.column]),
            };
          case "column:updated":
            return {
              ...current,
              columns: current.columns.map((column) =>
                column.id === delta.payload.columnId
                  ? { ...column, ...(delta.payload.column ?? delta.payload.patch ?? {}) }
                  : column,
              ),
            };
          case "column:deleted":
            return {
              ...current,
              columns: current.columns.filter((column) => column.id !== delta.payload.columnId),
            };
          case "column:moved": {
            const columns = [...current.columns];
            const fromIndex = columns.findIndex((column) => column.id === delta.payload.columnId);
            if (fromIndex === -1) return current;
            const [moved] = columns.splice(fromIndex, 1);
            columns.splice(delta.payload.targetIndex, 0, moved);
            return {
              ...current,
              columns: columns.map((column, order) => ({ ...column, order })),
            };
          }
          default:
            return current;
        }
      });

      queryClient.setQueriesData<Issue[]>({ queryKey: queryKeys.tasks.byWorkspace(workspaceId) }, (current) => {
        switch (delta.action) {
          case "task:created":
          case "task:updated":
          case "task:moved":
            return upsertIssue(current, toIssue(delta.payload.task));
          case "task:deleted":
            return removeIssue(current, delta.payload.taskId);
          default:
            return current;
        }
      });
    };

    socket.on(LEGACY_EVENTS.BOARD_DELTA, applyDelta);

    return () => {
      socket.off(LEGACY_EVENTS.BOARD_DELTA, applyDelta);
      unsubscribeReconnect();
    };
  }, [queryClient, workspaceId]);
}
