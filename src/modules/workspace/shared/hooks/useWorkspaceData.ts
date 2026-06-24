"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { resolveWorkspaceFromRouteKey } from "@/modules/workspace/shared/services/resolveWorkspace";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import {
  Workspace,
  WorkspaceMember,
  WorkspaceTab,
} from "@/modules/workspace/shared/types/workspace.type";
import { getDefaultWorkspaceTab } from "@/modules/workspace/shared/utils/workspaceUtils";
import { queryKeys } from "@/shared/constants/queryKeys";

interface UseWorkspaceDataParams {
  workspaceKey: string;
  initialTab: WorkspaceTab | null;
  initialTaskKey: string | null;
  getWorkspaceTabUrl: (tab: WorkspaceTab) => string;
  getTaskDetailUrl: (tab: WorkspaceTab, taskKey: string) => string;
  setActiveTab: (tab: WorkspaceTab) => void;
}

export function useWorkspaceData({
  workspaceKey,
  initialTab,
  initialTaskKey,
  getWorkspaceTabUrl,
  getTaskDetailUrl,
  setActiveTab,
}: UseWorkspaceDataParams) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const { setCurrentWorkspace } = useWorkspaceStore();
  const workspaceId = workspace?._id;

  const { data: members } = useQuery<WorkspaceMember[]>({
    queryKey: queryKeys.workspaces.members(workspaceId ?? "pending"),
    queryFn: async () => {
      const response = await api.get(apiRoutes.WORKSPACES.MEMBERS(workspaceId!));
      return response.data?.data ?? response.data ?? [];
    },
    enabled: Boolean(workspaceId),
    placeholderData: (previousMembers) =>
      previousMembers ?? workspace?.members ?? [],
    staleTime: 30_000,
  });

  const handleWorkspaceUpdated = useCallback(
    (updatedWorkspace: Workspace) => {
      setWorkspace((current) => ({
        ...updatedWorkspace,
        members: updatedWorkspace.members ?? current?.members ?? [],
      }));
    },
    [],
  );

  useEffect(() => {
    if (!workspaceId) return;

    setWorkspace((current) => {
      if (!current || current._id !== workspaceId || !members) return current;
      if (current.members === members) return current;
      return { ...current, members };
    });
    setCurrentWorkspace({ _id: workspaceId });
  }, [members, setCurrentWorkspace, workspaceId]);

  useEffect(() => {
    if (!workspaceKey) return;
    let isActive = true;
    setLoading(true);

    resolveWorkspaceFromRouteKey(workspaceKey)
      .then((nextWorkspace) => {
        if (!isActive) return;

        setWorkspace(nextWorkspace);
        if (!initialTab) {
          const defaultTab = getDefaultWorkspaceTab(nextWorkspace);
          setActiveTab(defaultTab);
          const nextUrl = initialTaskKey
            ? getTaskDetailUrl(defaultTab, initialTaskKey)
            : getWorkspaceTabUrl(defaultTab);
          window.history.replaceState(null, "", nextUrl);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [
    getTaskDetailUrl,
    getWorkspaceTabUrl,
    initialTab,
    initialTaskKey,
    setActiveTab,
    workspaceKey,
  ]);

  return { workspace, setWorkspace, loading, handleWorkspaceUpdated };
}
