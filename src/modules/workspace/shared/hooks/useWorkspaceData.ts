"use client";

import { useState, useEffect, useCallback } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { resolveWorkspaceFromRouteKey } from "@/modules/workspace/shared/services/resolveWorkspace";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { Workspace, WorkspaceTab } from "@/modules/workspace/shared/types/workspace.type";
import { getDefaultWorkspaceTab } from "@/modules/workspace/shared/utils/workspaceUtils";

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

  const handleWorkspaceUpdated = useCallback(
    (updatedWorkspace: Workspace) => {
      setWorkspace(updatedWorkspace);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCurrentWorkspace(updatedWorkspace as any);
    },
    [setCurrentWorkspace],
  );

  useEffect(() => {
    if (!workspaceKey) return;
    let isActive = true;
    setLoading(true);

    resolveWorkspaceFromRouteKey(workspaceKey)
      .then(async (nextWorkspace) => {
        let workspaceMembers = nextWorkspace.members ?? [];
        try {
          const membersResponse = await api.get(
            apiRoutes.WORKSPACES.MEMBERS(nextWorkspace._id),
          );
          workspaceMembers =
            membersResponse.data?.data ??
            membersResponse.data ??
            workspaceMembers;
        } catch {
          workspaceMembers = nextWorkspace.members ?? [];
        }

        const workspaceWithMembers = { ...nextWorkspace, members: workspaceMembers };
        if (!isActive) return;

        setWorkspace(workspaceWithMembers);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setCurrentWorkspace(workspaceWithMembers as any);
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
    setCurrentWorkspace,
    workspaceKey,
  ]);

  return { workspace, setWorkspace, loading, handleWorkspaceUpdated };
}
