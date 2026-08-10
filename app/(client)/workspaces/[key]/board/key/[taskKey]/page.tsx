"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import TaskDetailModal from "@/modules/workspace/tasks/detail/TaskDetailModal";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { resolveWorkspaceFromRouteKey } from "@/modules/workspace/shared/services/resolveWorkspace";
import { boardService } from "@/modules/workspace/shared/services/boardService";
import { taskService } from "@/modules/workspace/shared/services/taskService";
import { TaskDetailResponse } from "@/modules/workspace/shared/types/task-detail.type";
import { getWorkspaceTemplate } from "@/modules/workspace/shared/types/workspace.type";
import { enrichTaskDetailUsers } from "@/modules/workspace/shared/utils/taskDetailUsers";
import { Issue } from "@/modules/workspace/shared/types/issue.type";
import type { BoardColumn } from "@/modules/workspace/shared/types/board.type";
import { queryKeys } from "@/shared/constants/queryKeys";

export default function TaskDetailDeepLinkPage() {
  usePageTitle("Task Detail");
  const params = useParams();
  const router = useRouter();

  const workspaceKey = Array.isArray(params.key) ? params.key[0] : params.key;
  const taskKey = Array.isArray(params.taskKey) ? params.taskKey[0] : params.taskKey;
  const queryClient = useQueryClient();

  const backToBoard = useCallback(() => {
    router.push(`/workspaces/${workspaceKey}/board`);
  }, [router, workspaceKey]);

  const taskDetailQuery = useQuery({
    queryKey: queryKeys.tasks.detail(workspaceKey ?? "", taskKey ?? ""),
    queryFn: async () => {
      const nextWorkspace = await resolveWorkspaceFromRouteKey(workspaceKey!);
      let members = nextWorkspace.members ?? [];

      try {
        const membersResponse = await api.get(apiRoutes.WORKSPACES.MEMBERS(nextWorkspace._id));
        members = membersResponse.data?.data ?? membersResponse.data ?? members;
      } catch {
        members = nextWorkspace.members ?? [];
      }

      const workspaceWithMembers = { ...nextWorkspace, members };
      const [taskDetail, boardData] = await Promise.all([
        taskService.getBoardTaskDetail(nextWorkspace._id, taskKey!),
        boardService.getBoardByWorkspace(nextWorkspace._id).catch(() => ({ columns: [] })),
      ]);
      return {
        workspace: workspaceWithMembers,
        issue: enrichTaskDetailUsers(taskDetail, members),
        columns: boardData.columns as BoardColumn[],
      };
    },
    enabled: !!workspaceKey && !!taskKey,
    staleTime: 30_000,
  });

  const updateIssueMutation = useMutation({
    mutationFn: async (updatedIssue: TaskDetailResponse) => {
      if (!taskDetailQuery.data?.workspace || !updatedIssue.id) return null;
      const workspace = taskDetailQuery.data.workspace;
      const originalIssue = taskDetailQuery.data.issue;
      type IssueUpdates = Partial<Issue> & { startDate?: string | null; dueDate?: string | null; assigneeId?: string | null };
      const updates: IssueUpdates = {};

      if (originalIssue) {
        if (updatedIssue.title !== originalIssue.title) updates.title = updatedIssue.title;
        if (updatedIssue.description !== originalIssue.description) updates.description = updatedIssue.description ?? undefined;
        if (updatedIssue.status !== originalIssue.status) updates.status = updatedIssue.status;
        if (updatedIssue.priority !== originalIssue.priority) updates.priority = updatedIssue.priority;
        if (updatedIssue.type !== originalIssue.type) updates.type = updatedIssue.type;
        if (updatedIssue.columnId !== originalIssue.columnId) updates.columnId = updatedIssue.columnId;
        if (updatedIssue.sprintId !== originalIssue.sprintId) updates.sprintId = updatedIssue.sprintId ?? null;
        if (updatedIssue.storyPoints !== originalIssue.storyPoints) updates.storyPoints = updatedIssue.storyPoints ?? undefined;
        if (updatedIssue.startDate !== originalIssue.startDate) updates.startDate = updatedIssue.startDate ?? null;
        if (updatedIssue.dueDate !== originalIssue.dueDate) updates.dueDate = updatedIssue.dueDate ?? null;
        if (updatedIssue.assigneeId !== originalIssue.assigneeId) updates.assigneeId = updatedIssue.assigneeId ?? null;
      }

      if (Object.keys(updates).length === 0) return originalIssue;

      await taskService.updateBoardTask(workspace._id, updatedIssue.id, updates as Partial<Issue>);
      const refreshedIssue = await taskService.getBoardTaskDetail(workspace._id, updatedIssue.key);
      return enrichTaskDetailUsers(refreshedIssue, workspace.members);
    },
    onSuccess: (refreshedIssue) => {
      if (!refreshedIssue || !workspaceKey || !taskKey) return;
      queryClient.setQueryData(queryKeys.tasks.detail(workspaceKey, taskKey), (current: typeof taskDetailQuery.data) =>
        current ? { ...current, issue: refreshedIssue } : current,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
    },
  });

  const handleUpdateIssue = async (updatedIssue: TaskDetailResponse) => {
    await updateIssueMutation.mutateAsync(updatedIssue);
  };

  if (taskDetailQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBFBFA] dark:bg-[#1A1A1A]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563EB] dark:border-[#3B82F6] border-t-transparent" />
      </div>
    );
  }

  const status = (taskDetailQuery.error as { response?: { status?: number } } | null)?.response?.status;
  const error =
    status === 404
      ? "Task not found"
      : status === 403
        ? "You do not have permission to access this task"
        : taskDetailQuery.error
          ? "Could not load task details"
          : null;
  const workspace = taskDetailQuery.data?.workspace ?? null;
  const issue = taskDetailQuery.data?.issue ?? null;
  const columns = taskDetailQuery.data?.columns ?? [];

  if (error || !issue || !workspace) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FBFBFA] dark:bg-[#1A1A1A] p-6 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[8px] bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)]">
          <AlertCircle className="h-6 w-6 text-[#9F2F2D] dark:text-[#F87171]" />
        </div>
        <h1 className="mb-2 text-lg font-semibold text-[#111111] dark:text-[#E8E8E7]">{error ?? "Task not found"}</h1>
        <p className="mb-6 max-w-sm text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
          The task may have been deleted, archived, or the workspace is no longer available.
        </p>
        <button
          type="button"
          onClick={backToBoard}
          className="inline-flex items-center gap-2 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-4 py-2 text-[0.8125rem] font-medium text-white transition-colors hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to board
        </button>
      </div>
    );
  }

  return (
    <TaskDetailModal
      issue={issue}
      workspaceId={workspace._id}
      workspaceMembers={workspace.members}
      boardColumns={columns}
      workspaceTemplate={getWorkspaceTemplate(workspace)}
      onClose={backToBoard}
      onUpdateIssue={handleUpdateIssue}
    />
  );
}
