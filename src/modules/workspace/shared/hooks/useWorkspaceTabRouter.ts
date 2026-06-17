"use client";

import { useState, useCallback, useEffect } from "react";
import { WorkspaceTab, Workspace } from "@/modules/workspace/shared/types/workspace.type";
import { Issue } from "@/modules/workspace/shared/types/issue.type";
import {
  getRouteStateFromPath,
  getDefaultWorkspaceTab,
  isHiddenWorkspaceTab,
} from "@/modules/workspace/shared/utils/workspaceUtils";

interface UseWorkspaceTabRouterParams {
  workspaceKey: string;
  tab: string[] | undefined;
  // Accept a ref so the popstate handler always sees the latest workspace value
  // without requiring re-registration of the event listener on every workspace change.
  workspace: React.RefObject<Workspace | null>;
  onSelectIssue: (issue: Issue | null) => void;
  onSelectTaskKey: (key: string | null) => void;
  onSetListGridDrawerOpen: (open: boolean) => void;
}

export function useWorkspaceTabRouter({
  workspaceKey,
  tab,
  workspace,
  onSelectIssue,
  onSelectTaskKey,
  onSetListGridDrawerOpen,
}: UseWorkspaceTabRouterParams) {
  const tabFromUrl = tab?.[0];
  const routeInitialTab = tabFromUrl === "key" ? null : (tabFromUrl as WorkspaceTab) || null;
  const initialTab = isHiddenWorkspaceTab(routeInitialTab) ? null : routeInitialTab;

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab || "board");

  const getWorkspaceTabUrl = useCallback(
    (tabName: WorkspaceTab) => `/workspaces/${workspaceKey}/${tabName}`,
    [workspaceKey],
  );

  const getTaskDetailUrl = useCallback(
    (tabName: WorkspaceTab, taskKey: string) => `${getWorkspaceTabUrl(tabName)}/key/${taskKey}`,
    [getWorkspaceTabUrl],
  );

  const handleTabChange = useCallback(
    (newTab: WorkspaceTab) => {
      setActiveTab(newTab);
      onSelectIssue(null);
      onSelectTaskKey(null);
      onSetListGridDrawerOpen(false);
      window.history.pushState(null, "", getWorkspaceTabUrl(newTab));
    },
    [getWorkspaceTabUrl, onSelectIssue, onSelectTaskKey, onSetListGridDrawerOpen],
  );

  useEffect(() => {
    const handlePopState = () => {
      const { tabSegment, taskKey } = getRouteStateFromPath(window.location.pathname);
      const currentWorkspace = workspace.current;
      if (isHiddenWorkspaceTab(tabSegment)) {
        const defaultTab = currentWorkspace ? getDefaultWorkspaceTab(currentWorkspace) : "board";
        setActiveTab(defaultTab);
        window.history.replaceState(null, "", getWorkspaceTabUrl(defaultTab));
      } else if (tabSegment) {
        setActiveTab(tabSegment as WorkspaceTab);
      } else if (currentWorkspace) {
        setActiveTab(getDefaultWorkspaceTab(currentWorkspace));
      }
      onSelectTaskKey(taskKey);
      if (!taskKey) {
        onSelectIssue(null);
        onSetListGridDrawerOpen(false);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
    // workspace is a ref — stable identity, no need in dep array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getWorkspaceTabUrl, onSelectIssue, onSelectTaskKey, onSetListGridDrawerOpen]);

  return {
    activeTab,
    setActiveTab,
    initialTab,
    getWorkspaceTabUrl,
    getTaskDetailUrl,
    handleTabChange,
  };
}
