import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";

interface CreateWorkspaceInput {
  name: string;
  description?: string;
  key?: string;
  type?: "kanban" | "scrum";
  access?: "private" | "open";
}

export function useCreateWorkspace() {
  const [isLoading, setIsLoading] = useState(false);

  const createWorkspace = async (input: CreateWorkspaceInput) => {
    setIsLoading(true);
    try {
      const res = await api.post(apiRoutes.WORKSPACES.BASE, {
        name: input.name,
        description: input.description || undefined,
        key: input.key || undefined,
        type: input.type || "kanban",
        access: input.access || "open",
      });
      toast.success(`Workspace "${res.data.name}" đã được tạo`);
      return res.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error?.response?.data?.message || "Tạo Workspace thất bại";
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return { createWorkspace, isLoading };
}
