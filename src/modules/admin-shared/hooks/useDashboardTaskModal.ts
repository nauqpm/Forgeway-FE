"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { queryKeys } from "@/shared/constants/queryKeys";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import { toast } from "react-hot-toast";
import { boardService } from "@/modules/workspace/shared/services/boardService";
import { taskService } from "@/modules/workspace/shared/services/taskService";
import { sprintService } from "@/modules/workspace/shared/services/sprintService";
import { enrichTaskDetailUsers } from "@/modules/workspace/shared/utils/taskDetailUsers";
import type { Sprint } from "@/modules/workspace/shared/types/sprint.type";
import type { BoardColumn } from "@/modules/workspace/shared/types/board.type";
import type { DashboardTask, ForYouWorkspace } from "../types/dashboard.types";
import { workspaceIdOf, workspaceRouteKeyOf } from "../utils/dashboard.utils";

export function useDashboardTaskModal(workspaces: ForYouWorkspace[], options?: { returnPath?: string }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedTask, setSelectedTask] = useState<DashboardTask | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [taskDetail, setTaskDetail] = useState<any>(null);
  const [boardColumns, setBoardColumns] = useState<BoardColumn[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const open = async (task: DashboardTask) => {
    setSelectedTask(task);
    setIsOpen(true);
    setIsLoading(true);

    try {
      const workspace = workspaces.find(w => workspaceRouteKeyOf(w) === task.workspaceKey);
      if (!workspace) throw new Error("Workspace not found");
      const workspaceId = workspaceIdOf(workspace);

      const [detail, boardData, sprintList, membersRes] = await Promise.all([
        taskService.getBoardTaskDetail(workspaceId, task.key),
        boardService.getBoardByWorkspace(workspaceId).catch(() => ({ boardId: "", columns: [] })),
        workspace.type === "scrum"
          ? sprintService.listSprints(workspaceId).catch(() => [])
          : Promise.resolve([] as Sprint[]),
        api.get(apiRoutes.WORKSPACES.MEMBERS(workspaceId)).catch(() => ({ data: [] })),
      ]);

      const members = membersRes?.data?.data ?? membersRes?.data ?? [];
      setTaskDetail(enrichTaskDetailUsers(detail, members));
      setWorkspaceMembers(members);
      setBoardColumns(boardData.columns ?? []);
      setSprints(sprintList);

      window.history.pushState(
        { ...window.history.state, as: `/workspaces/${task.workspaceKey}/board/key/${task.key}` },
        "",
        `/workspaces/${task.workspaceKey}/board/key/${task.key}`,
      );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      toast.error("Failed to load task details");
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const close = () => {
    setIsOpen(false);
    setSelectedTask(null);
    setTaskDetail(null);
    setBoardColumns([]);
    setSprints([]);
    setWorkspaceMembers([]);
    window.history.pushState(null, "", options?.returnPath ?? "/dashboard");
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const archive = async (issue: any) => {
    try {
      const workspace = workspaces.find(w => workspaceRouteKeyOf(w) === selectedTask?.workspaceKey);
      const workspaceId = workspace ? workspaceIdOf(workspace) : null;
      if (!workspaceId) return;

      await taskService.archiveBoardTask(workspaceId, issue.id);
      toast.success("Work item archived");
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboardForUser(user?.id ?? "anonymous") });
      close();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not archive work item");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update = async (updatedIssue: any) => {
    const workspace = workspaces.find(w => workspaceRouteKeyOf(w) === selectedTask?.workspaceKey);
    const wsId = workspace ? workspaceIdOf(workspace) : null;
    if (!wsId || !updatedIssue.id) return;

    await taskService.updateBoardTask(wsId, updatedIssue.id, updatedIssue);
    setTaskDetail((prev: unknown) => ({ ...(prev as object), ...updatedIssue }));
    await queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboardForUser(user?.id ?? "anonymous") });
  };

  return {
    selectedTask,
    taskDetail,
    boardColumns,
    sprints,
    workspaceMembers,
    isOpen,
    isLoading,
    open,
    close,
    archive,
    update,
  };
}
