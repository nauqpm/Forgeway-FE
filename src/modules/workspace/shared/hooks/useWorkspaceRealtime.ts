"use client";

import { useCallback } from "react";
import { Issue } from "@/modules/workspace/shared/types/issue.type";
import { Sprint } from "@/modules/workspace/shared/types/sprint.type";
import { useWorkspaceSocket } from "@/modules/workspace/shared/hooks/useWorkspaceSocket";
import { useTaskRealtime } from "@/lib/realtime/hooks/use-task-realtime";
import { useSprintRealtime } from "@/lib/realtime/hooks/use-sprint-realtime";
import { sprintIdOf } from "@/lib/realtime/utils/sprint-realtime-cache.utils";
import { sortIssuesByRank, taskIdOf } from "@/lib/realtime/utils/task-realtime-cache.utils";

interface UseWorkspaceRealtimeParams {
  workspaceId: string | undefined;
  isDraggingIssueRef: React.MutableRefObject<boolean>;
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  setSprints: React.Dispatch<React.SetStateAction<Sprint[]>>;
  setSelectedIssue: React.Dispatch<React.SetStateAction<Issue | null>>;
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
  patchSelectedTaskView: (issue: Issue) => void;
}

export function useWorkspaceRealtime({
  workspaceId,
  isDraggingIssueRef,
  setIssues,
  setSprints,
  setSelectedIssue,
  setSelectedTaskIds,
  patchSelectedTaskView,
}: UseWorkspaceRealtimeParams) {
  const handleRealtimeTaskUpserted = useCallback(
    (issue: Issue) => {
      const nextIssueId = taskIdOf(issue);
      setIssues((current) => {
        const next = current.some((item) => taskIdOf(item) === nextIssueId)
          ? current.map((item) => (taskIdOf(item) === nextIssueId ? { ...item, ...issue } : item))
          : [...current, issue];
        return isDraggingIssueRef.current ? next : sortIssuesByRank(next);
      });
      patchSelectedTaskView(issue);
    },
    [isDraggingIssueRef, patchSelectedTaskView, setIssues],
  );

  const handleRealtimeTaskRemoved = useCallback(
    (taskId: string) => {
      setIssues((current) => current.filter((issue) => issue.id !== taskId && issue._id !== taskId));
      setSelectedIssue((current) =>
        current && (current.id === taskId || current._id === taskId) ? null : current);
      setSelectedTaskIds((current) => current.filter((id) => id !== taskId));
    },
    [setSelectedIssue, setSelectedTaskIds, setIssues],
  );

  const handleRealtimeSprintCreated = useCallback((sprint: Sprint) => {
    const nextSprintId = sprintIdOf(sprint);
    setSprints((current) => {
      const exists = current.some((item) => sprintIdOf(item) === nextSprintId);
      if (exists) {
        return current.map((item) => (sprintIdOf(item) === nextSprintId ? { ...item, ...sprint } : item));
      }
      return [...current, sprint];
    });
  }, [setSprints]);

  const handleRealtimeSprintDeleted = useCallback((sprintId: string) => {
    setSprints((current) => current.filter((sprint) => sprintIdOf(sprint) !== sprintId));
  }, [setSprints]);

  useWorkspaceSocket(workspaceId);
  useTaskRealtime(workspaceId, {
    onTaskRemoved: handleRealtimeTaskRemoved,
    onTaskUpserted: handleRealtimeTaskUpserted,
  });
  useSprintRealtime(workspaceId, {
    onSprintCreated: handleRealtimeSprintCreated,
    onSprintUpdated: handleRealtimeSprintCreated,
    onSprintStarted: handleRealtimeSprintCreated,
    onSprintDeleted: handleRealtimeSprintDeleted,
  });
}
