import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { queryKeys } from "@/shared/constants/queryKeys";
import { Subtask, SubtaskProgress } from "../types/task-detail.type";
import { toUiLabel } from "../services/taskNormalizer";

export function useSubtasks(workspaceId: string, parentId: string) {
  const queryClient = useQueryClient();

  const subtasksQuery = useQuery<{ subtasks: Subtask[]; progress: SubtaskProgress }>({
    queryKey: queryKeys.tasks.subtasks(workspaceId, parentId),
    queryFn: async () => {
      if (!parentId) return { subtasks: [], progress: { done: 0, total: 0 } };
      const { data } = await api.get(apiRoutes.TASKS.BOARD_TASK_SUBTASKS(workspaceId, parentId));
      const resData = data.data || data;
      if (resData.subtasks && Array.isArray(resData.subtasks)) {
        resData.subtasks = resData.subtasks.map((st: any) => ({
          ...st,
          priority: toUiLabel(st.priority, "Medium"),
        }));
      }
      return resData;
    },
    enabled: !!parentId && !!workspaceId,
  });

  const createSubtask = useMutation({
    mutationFn: async (dto: any) => {
      const payload = { ...dto };
      if (payload.priority) payload.priority = payload.priority.toLowerCase();
      const { data } = await api.post(apiRoutes.TASKS.BOARD_TASK_SUBTASKS(workspaceId, parentId), payload);
      return data.data || data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.subtasks(workspaceId, parentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byWorkspace(workspaceId) });
    },
  });

  const convertToTask = useMutation({
    mutationFn: async (subtaskId: string) => {
      const { data } = await api.post(apiRoutes.TASKS.BOARD_SUBTASK_CONVERT_TO_TASK(workspaceId, subtaskId));
      return data.data || data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.subtasks(workspaceId, parentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byWorkspace(workspaceId) });
    },
  });

  const updateSubtask = useMutation({
    mutationFn: async ({ subtaskId, updates }: { subtaskId: string; updates: any }) => {
      const payload = { ...updates };
      if (payload.priority) payload.priority = payload.priority.toLowerCase();
      const { data } = await api.patch(apiRoutes.TASKS.BOARD_TASK_UPDATE(workspaceId, subtaskId), payload);
      return data.data || data;
    },
    onMutate: async ({ subtaskId, updates }) => {
      const queryKey = queryKeys.tasks.subtasks(workspaceId, parentId);
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<{ subtasks: Subtask[]; progress: SubtaskProgress }>(queryKey);

      if (previousData) {
        queryClient.setQueryData(queryKey, {
          ...previousData,
          subtasks: previousData.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, ...(updates as any) } : st
          ),
        });
      }

      return { previousData };
    },
    onError: (_err: unknown, _vars: unknown, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.tasks.subtasks(workspaceId, parentId), context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.subtasks(workspaceId, parentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byWorkspace(workspaceId) });
    },
  });

  return {
    subtasks: subtasksQuery.data?.subtasks || [],
    isLoading: subtasksQuery.isLoading,
    progress: subtasksQuery.data?.progress || { done: 0, total: 0 },
    createSubtask,
    convertToTask,
    updateSubtask,
  };
}
