"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { realtimeSocketClient } from "@/lib/socket/socket.client";
import { TASK_EVENTS } from "@/lib/socket/socket.events";
import type { RealtimeEnvelope } from "@/lib/socket/socket.types";
import { queryKeys } from "@/shared/constants/queryKeys";

type TaskSummary = {
  assigneeId?: string | null;
};

type TaskCreatedData = {
  taskId: string;
  task: TaskSummary;
};

type TaskUpdatedData = {
  taskId: string;
  task: TaskSummary;
  changes: Array<{ field: string; from?: string | null; to?: string | null }>;
};

type TaskRemovedData = {
  taskId: string;
  task: TaskSummary;
};

export function useDashboardRealtime(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = realtimeSocketClient.getSocket();
    if (!socket || !userId) return;

    const invalidate = () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboardForUser(userId) });

    const handleTaskCreated = (envelope: RealtimeEnvelope<TaskCreatedData>) => {
      if (envelope.data?.task?.assigneeId === userId) invalidate();
    };

    const handleTaskUpdated = (envelope: RealtimeEnvelope<TaskUpdatedData>) => {
      const assigneeChange = envelope.data?.changes?.find(c => c.field === "assigneeId");
      if (!assigneeChange) return;
      const { from, to } = assigneeChange;
      if (to === userId || from === userId) invalidate();
    };

    const handleTaskRemoved = (envelope: RealtimeEnvelope<TaskRemovedData>) => {
      if (envelope.data?.task?.assigneeId === userId) invalidate();
    };

    socket.on(TASK_EVENTS.CREATED, handleTaskCreated);
    socket.on(TASK_EVENTS.UPDATED, handleTaskUpdated);
    socket.on(TASK_EVENTS.ARCHIVED, handleTaskRemoved);
    socket.on(TASK_EVENTS.DELETED, handleTaskRemoved);

    return () => {
      socket.off(TASK_EVENTS.CREATED, handleTaskCreated);
      socket.off(TASK_EVENTS.UPDATED, handleTaskUpdated);
      socket.off(TASK_EVENTS.ARCHIVED, handleTaskRemoved);
      socket.off(TASK_EVENTS.DELETED, handleTaskRemoved);
    };
  }, [queryClient, userId]);
}
