import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface CreateWorkspaceInput {
  name: string;
  description?: string;
  avatar?: string;
  key?: string;
  type?: "kanban" | "scrum";
  access?: "private" | "public";
}

export function useCreateWorkspace() {
  const [isLoading, setIsLoading] = useState(false);
  const { workspaces, setWorkspaces } = useWorkspaceStore();

  const createWorkspace = async (input: CreateWorkspaceInput) => {
    setIsLoading(true);
    try {
      const res = await api.post(apiRoutes.WORKSPACES.BASE, {
        name: input.name,
        description: input.description || undefined,
        avatar: input.avatar || undefined,
        key: input.key || undefined,
        type: input.type || "kanban",
        access: input.access || "public",
      });

      // Normalize response — backend wraps in { data: ... } via TransformInterceptor
      const raw = res.data;
      const created = raw?.data ?? raw;

      toast.success(`Workspace "${created.name}" has been created`);

      // Immediately upsert into store so sidebar and other consumers
      // get the correct avatar without waiting for a socket event or page reload
      const normalizedId = created._id ?? created.id;
      if (normalizedId) {
        const alreadyInStore = workspaces.some(
          (w) => w._id === normalizedId || (w as { id?: string }).id === normalizedId,
        );
        if (!alreadyInStore) {
          setWorkspaces([{ ...created, _id: normalizedId, slug: created.slug ?? created.key }, ...workspaces]);
        }
      }

      return created;
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
