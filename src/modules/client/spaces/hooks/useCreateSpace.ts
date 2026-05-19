import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";

interface CreateSpaceInput {
  name: string;
  key: string;
  description?: string;
  template: "kanban" | "scrum";
  visibility: "public" | "private";
  workspaceId: string;
}

export function useCreateSpace() {
  const [isLoading, setIsLoading] = useState(false);

  const createSpace = async (input: CreateSpaceInput) => {
    setIsLoading(true);
    try {
      const res = await api.post(apiRoutes.SPACES.BASE, {
        name: input.name,
        key: input.key,
        description: input.description || undefined,
        template: input.template,
        visibility: input.visibility,
        workspaceId: input.workspaceId,
      });
      toast.success(`Space "${res.data.name}" đã được tạo`);
      return res.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error?.response?.data?.message || "Tạo Space thất bại";
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return { createSpace, isLoading };
}
