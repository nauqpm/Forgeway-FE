"use client";

import { useProjectDetailData } from "./useProjectDetailData";
import { useProjectDetailActions } from "./useProjectDetailActions";

export function useProjectDetailPage(projectId: string) {
  const { project, board, tasks, loading, setTasks, refetch } = useProjectDetailData(projectId);

  const actions = useProjectDetailActions({
    projectId,
    board,
    tasks,
    setTasks,
    refetch,
  });

  return {
    project,
    board,
    loading,
    ...actions,
  };
}
