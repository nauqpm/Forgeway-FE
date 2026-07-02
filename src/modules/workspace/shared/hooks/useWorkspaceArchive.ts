"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { taskService } from "@/modules/workspace/shared/services/taskService";
import { Issue } from "@/modules/workspace/shared/types/issue.type";
import { WorkspaceTab } from "@/modules/workspace/shared/types/workspace.type";
import { removeRestoredArchiveItem } from "@/modules/workspace/shared/utils/archiveListState";
import { queryKeys } from "@/shared/constants/queryKeys";

interface UseWorkspaceArchiveParams {
  workspaceId: string | undefined;
  activeTab: WorkspaceTab;
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  setSelectedIssue: React.Dispatch<React.SetStateAction<Issue | null>>;
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useWorkspaceArchive({
  workspaceId,
  activeTab,
  setIssues,
  setSelectedIssue,
  setSelectedTaskIds,
}: UseWorkspaceArchiveParams) {
  const queryClient = useQueryClient();
  const [archivePage, setArchivePage] = useState(1);
  const [archivedItems, setArchivedItems] = useState<Issue[]>([]);
  const [archiveTotal, setArchiveTotal] = useState(0);

  const { data: archivePageData, isFetching: isArchivedTasksFetching } = useQuery({
    queryKey: ["archivedTasks", workspaceId, archivePage],
    queryFn: () =>
      taskService.getArchivedTasks(workspaceId!, {
        page: archivePage,
        limit: 20,
        sortBy: "archivedAt",
        sortOrder: "desc",
      }),
    enabled: !!workspaceId && activeTab === "archive",
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!archivePageData) return;
    setArchiveTotal(archivePageData.total);
    setArchivedItems((prev) =>
      archivePage === 1 ? archivePageData.tasks : [...prev, ...archivePageData.tasks],
    );
  }, [archivePageData, archivePage]);

  const resetArchiveList = useCallback(() => {
    setArchivePage(1);
    setArchivedItems([]);
    setArchiveTotal(0);
  }, []);

  const handleLoadMoreArchive = useCallback(() => {
    setArchivePage((p) => p + 1);
  }, []);

  const handleArchiveIssue = async (issue: Issue) => {
    if (!workspaceId || !issue.id) {
      toast.error("Task ID not found");
      return;
    }
    try {
      await taskService.archiveBoardTask(workspaceId, issue.id);
      setIssues((current) => current.filter((item) => item.id !== issue.id));
      setSelectedIssue(null);
      resetArchiveList();
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
      toast.success("Work item archived");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not archive work item");
    }
  };

  const handleRestoreIssue = async (issue: Issue) => {
    if (!workspaceId || !issue.id) {
      toast.error("Task ID not found");
      return;
    }
    try {
      const restoredIssue = await taskService.restoreBoardTask(workspaceId, issue.id);
      setIssues((current) =>
        current.some((item) => item.id === restoredIssue.id)
          ? current.map((item) => (item.id === restoredIssue.id ? restoredIssue : item))
          : [...current, restoredIssue],
      );
      setSelectedIssue(restoredIssue);
      if (restoredIssue.key) {
        queryClient.setQueryData(queryKeys.tasks.detail(workspaceId, restoredIssue.key), restoredIssue);
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(workspaceId, restoredIssue.key) });
      }
      const nextArchive = removeRestoredArchiveItem({
        items: archivedItems,
        total: archiveTotal,
        restoredId: restoredIssue.id,
      });
      setArchivedItems(nextArchive.items);
      setArchiveTotal(nextArchive.total);
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
      toast.success("Work item restored");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not restore work item");
    }
  };

  const handleDeleteIssue = async (issue: Issue) => {
    if (!workspaceId || !issue.id) {
      toast.error("Task ID not found");
      return;
    }
    try {
      await taskService.deleteBoardTask(workspaceId, issue.id);
      setIssues((current) => current.filter((item) => item.id !== issue.id));
      setSelectedTaskIds((current) => current.filter((id) => id !== issue.id));
      setSelectedIssue((current) => (current?.id === issue.id ? null : current));
      resetArchiveList();
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
      toast.success("Work item deleted");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not delete work item");
    }
  };

  return {
    archivePage,
    archivedItems,
    setArchivedItems,
    archiveTotal,
    setArchiveTotal,
    isArchivedTasksFetching,
    resetArchiveList,
    handleLoadMoreArchive,
    handleArchiveIssue,
    handleRestoreIssue,
    handleDeleteIssue,
  };
}
