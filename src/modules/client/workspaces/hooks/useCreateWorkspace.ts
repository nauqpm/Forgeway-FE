import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";

interface CreateWorkspaceInput {
  name: string;
  description?: string;
  key?: string;
  type?: "kanban" | "scrum";
  access?: "private" | "public";
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
        access: input.access || "public",
      });
      toast.success(`Workspace "${res.data.name}" has been created`);
      return res.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error?.response?.data?.message || "Workspace creation failed";
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return { createWorkspace, isLoading };
}
