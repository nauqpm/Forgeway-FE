import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { taskCoverService } from "../services/taskCoverService";
import type { TaskCover } from "../types/task-cover.type";
import { extractApiError } from "@/shared/utils/apiError";
import { queryKeys } from "@/shared/constants/queryKeys";

type CoverableIssue = {
  id: string;
  key?: string;
  isArchived?: boolean;
  cover?: TaskCover | null;
};

type UseTaskCoverActionsProps<TIssue extends CoverableIssue> = {
  workspaceId: string;
  issue: TIssue;
  onCoverChange: (cover: TaskCover | null) => void;
  onSettledCover?: (cover: TaskCover | null) => void;
};

export function useTaskCoverActions<TIssue extends CoverableIssue>({
  workspaceId,
  issue,
  onCoverChange,
  onSettledCover,
}: UseTaskCoverActionsProps<TIssue>) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const invalidateCoverCaches = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byWorkspace(workspaceId) });
    if (issue.key) {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(workspaceId, issue.key) });
    }
  }, [issue.key, queryClient, workspaceId]);

  const applyCover = useCallback(
    async (cover: TaskCover) => {
      if (issue.isArchived) return;
      const previousCover = issue.cover ?? null;

      onCoverChange(cover);
      setSaving(true);

      try {
        const savedCover = await taskCoverService.updateCover(workspaceId, issue.id, cover);
        onCoverChange(savedCover ?? cover);
        onSettledCover?.(savedCover ?? cover);
        invalidateCoverCaches();
      } catch (error) {
        onCoverChange(previousCover);
        toast.error(extractApiError(error, "Could not update task cover"));
      } finally {
        setSaving(false);
      }
    },
    [invalidateCoverCaches, issue, onCoverChange, onSettledCover, workspaceId],
  );

  const removeCover = useCallback(async () => {
    if (issue.isArchived) return;
    const previousCover = issue.cover ?? null;

    onCoverChange(null);
    setSaving(true);

    try {
      await taskCoverService.removeCover(workspaceId, issue.id);
      onSettledCover?.(null);
      invalidateCoverCaches();
    } catch (error) {
      onCoverChange(previousCover);
      toast.error(extractApiError(error, "Could not remove task cover"));
    } finally {
      setSaving(false);
    }
  }, [invalidateCoverCaches, issue, onCoverChange, onSettledCover, workspaceId]);

  return {
    saving,
    applyCover,
    removeCover,
  };
}
