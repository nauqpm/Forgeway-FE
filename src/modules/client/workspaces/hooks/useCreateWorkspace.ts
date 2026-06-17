import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { queryKeys } from "@/shared/constants/queryKeys";
import type { Workspace } from "../types/workspace.type";

interface CreateWorkspaceInput {
  name: string;
  description?: string;
  avatar?: string;
  key?: string;
  type?: "kanban" | "scrum";
  access?: "private" | "public";
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: CreateWorkspaceInput) => {
      const res = await api.post(apiRoutes.WORKSPACES.BASE, {
        name: input.name,
        description: input.description || undefined,
        avatar: input.avatar || undefined,
        key: input.key || undefined,
        type: input.type || "kanban",
        access: input.access || "public",
      });
      return res.data?.data ?? res.data;
    },
    onSuccess: (data) => {
      toast.success(`Workspace "${data?.name ?? ""}" has been created`);
      
      const normalizedId = data?._id ?? data?.id;
      if (normalizedId) {
        queryClient.setQueryData<Workspace[]>(queryKeys.workspaces.list(), (prev = []) => {
          const alreadyInCache = prev.some(
            (w) => w._id === normalizedId || (w as { id?: string }).id === normalizedId
          );
          if (alreadyInCache) return prev;
          
          const normalizedWorkspace = { 
            ...data, 
            _id: normalizedId, 
            slug: data.slug ?? data.key 
          } as Workspace;
          
          return [normalizedWorkspace, ...prev];
        });
      }
      
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.list() });
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error?.response?.data?.message || "Workspace creation failed";
      toast.error(msg);
    },
  });

  const createWorkspace = async (input: CreateWorkspaceInput) => {
    try {
      return await mutation.mutateAsync(input);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error?.response?.data?.message || "Workspace creation failed";
      throw new Error(msg);
    }
  };

  return { createWorkspace, isLoading: mutation.isPending };
}
