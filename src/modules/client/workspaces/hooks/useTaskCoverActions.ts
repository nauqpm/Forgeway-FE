import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { taskCoverService } from "../services/taskCoverService";
import type { TaskCover } from "../types/task-cover.type";

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
    queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
    if (issue.key) {
      queryClient.invalidateQueries({ queryKey: ["taskDetail", workspaceId, issue.key] });
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
      } catch (error: any) {
        onCoverChange(previousCover);
        toast.error(error?.response?.data?.message || "Could not update task cover");
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
    } catch (error: any) {
      onCoverChange(previousCover);
      toast.error(error?.response?.data?.message || "Could not remove task cover");
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
