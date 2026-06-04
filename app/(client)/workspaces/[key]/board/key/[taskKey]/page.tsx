"use client";

import { useCallback, useEffect, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import TaskDetailModal from "@/modules/client/workspaces/components/TaskDetailModal";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import { resolveWorkspaceFromRouteKey } from "@/modules/client/workspaces/services/resolveWorkspace";
import { taskService } from "@/modules/client/workspaces/services/taskService";
import { TaskDetailResponse } from "@/modules/client/workspaces/types/task-detail.type";
import { Workspace } from "@/modules/client/workspaces/types/workspace.type";
import { enrichTaskDetailUsers } from "@/modules/client/workspaces/utils/taskDetailUsers";
import { Issue } from "@/modules/client/workspaces/types/issue.type";

export default function TaskDetailDeepLinkPage() {
  usePageTitle('Task Detail');
  const params = useParams();
  const router = useRouter();

  const workspaceKey = Array.isArray(params.key) ? params.key[0] : params.key;
  const taskKey = Array.isArray(params.taskKey) ? params.taskKey[0] : params.taskKey;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [issue, setIssue] = useState<TaskDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backToBoard = useCallback(() => {
    router.push(`/workspaces/${workspaceKey}/board`);
  }, [router, workspaceKey]);

  useEffect(() => {
    if (!workspaceKey || !taskKey) return;

    let isActive = true;
    setLoading(true);
    setError(null);

    resolveWorkspaceFromRouteKey(workspaceKey)
      .then(async (nextWorkspace) => {
        let members = nextWorkspace.members ?? [];

        try {
          const membersResponse = await api.get(apiRoutes.WORKSPACES.MEMBERS(nextWorkspace._id));
          members = membersResponse.data?.data ?? membersResponse.data ?? members;
        } catch {
          members = nextWorkspace.members ?? [];
        }

        const workspaceWithMembers = { ...nextWorkspace, members };
        const taskDetail = await taskService.getBoardTaskDetail(nextWorkspace._id, taskKey);
        if (!isActive) return;

        setWorkspace(workspaceWithMembers);
        setIssue(enrichTaskDetailUsers(taskDetail, members));
      })
      .catch((err) => {
        if (!isActive) return;

        const status = err?.response?.status;
        if (status === 404) setError("Task not found");
        else if (status === 403) setError("Ban khong co quyen truy cap task nay");
        else setError("Khong tai duoc chi tiet task");
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [workspaceKey, taskKey]);

  const handleUpdateIssue = async (updatedIssue: TaskDetailResponse) => {
    if (!workspace || !updatedIssue.id) return;

    const updates: Partial<Issue> = {
      title: updatedIssue.title,
      description: updatedIssue.description,
      status: updatedIssue.status,
      priority: updatedIssue.priority,
      type: updatedIssue.type,
      columnId: updatedIssue.columnId,
      sprintId: updatedIssue.sprintId ?? null,
      storyPoints: updatedIssue.storyPoints ?? undefined,
      dueDate: updatedIssue.dueDate ?? undefined,
      assigneeId: updatedIssue.assigneeId ?? undefined,
    };

    await taskService.updateBoardTask(workspace._id, updatedIssue.id, updates);
    const refreshedIssue = await taskService.getBoardTaskDetail(workspace._id, updatedIssue.key);
    setIssue(enrichTaskDetailUsers(refreshedIssue, workspace.members));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0052CC] border-t-transparent" />
      </div>
    );
  }

  if (error || !issue || !workspace) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center dark:bg-gray-950">
        <h1 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
          {error ?? "Khong tim thay task"}
        </h1>
        <p className="mb-6 max-w-md text-sm text-gray-500 dark:text-gray-400">
          Task co the da bi xoa, bi archive, hoac workspace khong con kha dung.
        </p>
        <button
          type="button"
          onClick={backToBoard}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0052CC] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0065FF]"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lai board
        </button>
      </div>
    );
  }

  return (
    <TaskDetailModal
      issue={issue}
      workspaceId={workspace._id}
      onClose={backToBoard}
      onUpdateIssue={handleUpdateIssue}
    />
  );
}
