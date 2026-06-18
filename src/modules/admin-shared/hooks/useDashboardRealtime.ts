"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { realtimeSocketClient } from "@/lib/socket/socket.client";
import { TASK_EVENTS } from "@/lib/socket/socket.events";
import type { RealtimeEnvelope } from "@/lib/socket/socket.types";
import { queryKeys } from "@/shared/constants/queryKeys";

type TaskUpdatedData = {
  taskId: string;
  changes: Array<{ field: string; from?: string | null; to?: string | null }>;
};

export function useDashboardRealtime(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = realtimeSocketClient.getSocket();
    if (!socket || !userId) return;

    const handleTaskUpdated = (envelope: RealtimeEnvelope<TaskUpdatedData>) => {
      const assigneeChange = envelope.data?.changes?.find(c => c.field === "assigneeId");
      if (!assigneeChange) return;
      if (assigneeChange.from === userId && assigneeChange.to !== userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.dashboardForUser(userId),
        });
      }
    };

    socket.on(TASK_EVENTS.UPDATED, handleTaskUpdated);
    return () => {
      socket.off(TASK_EVENTS.UPDATED, handleTaskUpdated);
    };
  }, [queryClient, userId]);
}
