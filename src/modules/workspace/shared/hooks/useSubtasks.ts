import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { queryKeys } from "@/shared/constants/queryKeys";
import { Subtask, SubtaskProgress } from "../types/task-detail.type";
import { toUiLabel } from "../services/taskNormalizer";
import { taskService } from "../services/taskService";

interface CreateSubtaskInput {
  title: string;
  priority?: string;
  assigneeId?: string | null;
}

export interface SubtaskUpdateInput {
  title?: string;
  priority?: string;
  status?: string;
  columnId?: string;
  assigneeId?: string | null;
}

type SubtasksData = { subtasks: Subtask[]; progress: SubtaskProgress };

export function useSubtasks(workspaceId: string, parentId: string) {
  const queryClient = useQueryClient();

  const subtasksQuery = useQuery<{ subtasks: Subtask[]; progress: SubtaskProgress }>({
    queryKey: queryKeys.tasks.subtasks(workspaceId, parentId),
    queryFn: async () => {
      if (!parentId) return { subtasks: [], progress: { done: 0, total: 0 } };
      const { data } = await api.get(apiRoutes.TASKS.BOARD_TASK_SUBTASKS(workspaceId, parentId));
      const resData = data.data || data;
      if (resData.subtasks && Array.isArray(resData.subtasks)) {
        resData.subtasks = resData.subtasks.map((st: Subtask) => ({
          ...st,
          priority: toUiLabel(st.priority, "Medium"),
        }));
      }
      return resData;
    },
    enabled: !!parentId && !!workspaceId,
  });

  const createSubtask = useMutation({
    mutationFn: async (dto: CreateSubtaskInput) => {
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

  const updateSubtask = useMutation<
    Subtask,
    unknown,
    { subtaskId: string; updates: SubtaskUpdateInput },
    { previousData?: SubtasksData }
  >({
    mutationFn: async ({ subtaskId, updates }) => {
      const payload = { ...updates };
      if (payload.priority) payload.priority = payload.priority.toLowerCase();
      const { data } = await api.patch(apiRoutes.TASKS.BOARD_TASK_UPDATE(workspaceId, subtaskId), payload);
      return data.data || data;
    },
    onMutate: async ({ subtaskId, updates }) => {
      const queryKey = queryKeys.tasks.subtasks(workspaceId, parentId);
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<SubtasksData>(queryKey);

      if (previousData) {
        queryClient.setQueryData(queryKey, {
          ...previousData,
          subtasks: previousData.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, ...updates } : st
          ),
        });
      }

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.tasks.subtasks(workspaceId, parentId), context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.subtasks(workspaceId, parentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byWorkspace(workspaceId) });
    },
  });

  const deleteSubtask = useMutation({
    mutationFn: async (subtaskId: string) => {
      // Use direct board task deletion endpoint to avoid parent-relation mismatch errors
      await taskService.deleteBoardTask(workspaceId, subtaskId);
      return { success: true };
    },
    onSuccess: () => {
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
    deleteSubtask,
  };
}
