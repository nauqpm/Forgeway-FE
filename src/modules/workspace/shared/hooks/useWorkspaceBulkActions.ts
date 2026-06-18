"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { taskService } from "@/modules/workspace/shared/services/taskService";
import { Issue } from "@/modules/workspace/shared/types/issue.type";
import { Workspace, WorkspaceMember } from "@/modules/workspace/shared/types/workspace.type";

interface UseWorkspaceBulkActionsParams {
  workspaceId: string | undefined;
  workspace: Workspace | null;
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  setSelectedIssue: React.Dispatch<React.SetStateAction<Issue | null>>;
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
  resetArchiveList: () => void;
}

export function useWorkspaceBulkActions({
  workspaceId,
  workspace,
  setIssues,
  setSelectedIssue,
  setSelectedTaskIds,
  resetArchiveList,
}: UseWorkspaceBulkActionsParams) {
  const queryClient = useQueryClient();

  const handleListBulkDelete = async (ids: string[]) => {
    if (!workspaceId || ids.length === 0) return;
    const idsToDelete = new Set(ids);
    const removeDeleted = (current: Issue[] | undefined) =>
      Array.isArray(current) ? current.filter((issue) => !idsToDelete.has(issue.id)) : current;

    setIssues((current) => removeDeleted(current) ?? []);
    setSelectedTaskIds((current) => current.filter((id) => !idsToDelete.has(id)));
    setSelectedIssue((current) => (current && idsToDelete.has(current.id) ? null : current));
    queryClient.setQueriesData<Issue[]>({ queryKey: ["tasks", workspaceId] }, removeDeleted);
    queryClient.setQueriesData<Issue[]>({ queryKey: ["tasks-fallback-search", workspaceId] }, removeDeleted);

    const results = await Promise.allSettled(
      ids.map((taskId) => taskService.deleteBoardTask(workspaceId, taskId)),
    );
    const failedCount = results.filter((r) => r.status === "rejected").length;
    resetArchiveList();
    queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
    queryClient.invalidateQueries({ queryKey: ["tasks-fallback-search", workspaceId] });

    if (failedCount > 0) {
      toast.error(`Could not delete ${failedCount} work item${failedCount > 1 ? "s" : ""}`);
      return;
    }
    toast.success(ids.length === 1 ? "Work item deleted" : "Work items deleted");
  };

  const handleListBulkUpdate = async (ids: string[], updates: Partial<Issue>) => {
    if (!workspaceId || ids.length === 0) return;
    const idsToUpdate = new Set(ids);
    const assigneeId = Object.prototype.hasOwnProperty.call(updates, "assigneeId")
      ? updates.assigneeId ?? null
      : undefined;
    const selectedMember = assigneeId
      ? (workspace?.members ?? []).find((member: WorkspaceMember) => {
          const userId = member.userId;
          const id = typeof userId === "string" ? userId : userId?._id ?? userId?.id ?? "";
          return id === assigneeId;
        })
      : null;
    const selectedMemberUser =
      selectedMember && typeof selectedMember.userId !== "string" ? selectedMember.userId : null;
    const assigneeName =
      assigneeId && selectedMemberUser && typeof selectedMemberUser !== "string"
        ? selectedMemberUser.fullName || selectedMemberUser.name || selectedMemberUser.email || assigneeId
        : assigneeId
          ? assigneeId
          : "Unassigned";
    const assigneeAvatar =
      assigneeId && selectedMemberUser && typeof selectedMemberUser !== "string"
        ? selectedMemberUser.avatar || selectedMemberUser.avatarUrl || selectedMemberUser.image
        : undefined;

    const normalizedUpdates: Partial<Issue> =
      assigneeId !== undefined
        ? { ...updates, assigneeId, assignee: assigneeId ?? "U", assigneeDisplayName: assigneeName, assigneeAvatar }
        : updates;

    const applyUpdates = (current: Issue[] | undefined) =>
      Array.isArray(current)
        ? current.map((issue) => (idsToUpdate.has(issue.id) ? { ...issue, ...normalizedUpdates } : issue))
        : current;

    setIssues((current) => applyUpdates(current) ?? []);
    setSelectedIssue((current) =>
      current && idsToUpdate.has(current.id) ? { ...current, ...normalizedUpdates } : current);
    queryClient.setQueriesData<Issue[]>({ queryKey: ["tasks", workspaceId] }, applyUpdates);
    queryClient.setQueriesData<Issue[]>({ queryKey: ["tasks-fallback-search", workspaceId] }, applyUpdates);

    const results = await Promise.allSettled(
      ids.map((taskId) => taskService.updateBoardTask(workspaceId, taskId, normalizedUpdates)),
    );
    const failedCount = results.filter((r) => r.status === "rejected").length;
    const savedIssues = results
      .filter((r): r is PromiseFulfilledResult<Issue> => r.status === "fulfilled")
      .map((r) => r.value);

    if (savedIssues.length > 0) {
      const savedById = new Map(savedIssues.map((issue) => [issue.id, issue]));
      const mergeSaved = (current: Issue[] | undefined) =>
        Array.isArray(current) ? current.map((issue) => savedById.get(issue.id) ?? issue) : current;
      setIssues((current) => mergeSaved(current) ?? []);
      setSelectedIssue((current) => (current ? savedById.get(current.id) ?? current : current));
      queryClient.setQueriesData<Issue[]>({ queryKey: ["tasks", workspaceId] }, mergeSaved);
      queryClient.setQueriesData<Issue[]>({ queryKey: ["tasks-fallback-search", workspaceId] }, mergeSaved);
    }

    if (failedCount > 0) {
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["tasks-fallback-search", workspaceId] });
      toast.error(`Could not update ${failedCount} work item${failedCount > 1 ? "s" : ""}`);
    }
  };

  return { handleListBulkDelete, handleListBulkUpdate };
}
