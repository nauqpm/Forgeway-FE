"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { BoardColumn } from "@/modules/client/workspaces/types/board.type";
import { Issue } from "@/modules/client/workspaces/types/issue.type";

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
  payload: Record<string, any>;
  version?: number;
  occurredAt: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5512";

const getSocketUrl = () => {
  try {
    const url = new URL(API_URL);
    return `${url.origin}/realtime`;
  } catch {
    return "http://localhost:5512/realtime";
  }
};

const sortColumns = (columns: BoardColumn[]) =>
  [...columns].sort((a, b) => a.order - b.order);

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

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const socket: Socket = io(getSocketUrl(), {
      transports: ["websocket"],
      withCredentials: true,
      auth: token ? { token } : undefined,
      extraHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5_000,
    });

    const joinWorkspace = () => {
      socket.emit("workspace:join", { workspaceId });
    };

    const invalidateWorkspaceQueries = () => {
      queryClient.invalidateQueries({ queryKey: ["board", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
    };

    const handleReconnect = () => {
      joinWorkspace();
      invalidateWorkspaceQueries();
    };

    const applyDelta = (delta: BoardDelta) => {
      if (delta.workspaceId !== workspaceId) return;

      // Realtime deltas patch TanStack cache in-place, avoiding a refetch storm
      // when many users are editing the same workspace board.
      queryClient.setQueryData<BoardCacheData>(["board", workspaceId], (current) => {
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

      queryClient.setQueriesData<Issue[]>({ queryKey: ["tasks", workspaceId] }, (current) => {
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

    socket.on("connect", joinWorkspace);
    socket.on("board:delta", applyDelta);
    socket.io.on("reconnect", handleReconnect);

    return () => {
      socket.emit("workspace:leave", { workspaceId });
      socket.off("connect", joinWorkspace);
      socket.off("board:delta", applyDelta);
      socket.io.off("reconnect", handleReconnect);
      socket.disconnect();
    };
  }, [queryClient, workspaceId]);
}
