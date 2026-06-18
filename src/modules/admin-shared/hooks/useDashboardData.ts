"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { queryKeys } from "@/shared/constants/queryKeys";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import { boardService } from "@/modules/workspace/shared/services/boardService";
import { taskService } from "@/modules/workspace/shared/services/taskService";
import type { Issue } from "@/modules/workspace/shared/types/issue.type";
import type { BoardColumn } from "@/modules/workspace/shared/types/board.type";
import type { DashboardData, ForYouWorkspace, UserDashboardStats } from "../types/dashboard.types";
import {
  normalizePayload,
  workspaceIdOf,
  extractWorkspaces,
  getDoneColumnIds,
  isDoneIssue,
  toDashboardTask,
  sortByDueDateAsc,
} from "../utils/dashboard.utils";

export function useDashboardData() {
  const { user } = useAuth();

  return useQuery<DashboardData>({
    queryKey: queryKeys.admin.dashboardForUser(user?.id ?? "anonymous"),
    queryFn: async () => {
      const [forYouResponse, userDashboardResponse] = await Promise.all([
        api.get(apiRoutes.FOR_YOU).catch(() => ({ data: [] as ForYouWorkspace[] })),
        api.get(apiRoutes.DASHBOARD.USER).catch(() => ({ data: {} })),
      ]);

      const workspaces: ForYouWorkspace[] = extractWorkspaces(
        normalizePayload<ForYouWorkspace[]>(forYouResponse),
      );
      const userStats = normalizePayload<UserDashboardStats>(userDashboardResponse) ?? null;

      if (!user?.id || workspaces.length === 0) {
        return { workspaces, userStats, assignedTasks: [], completedAssignedTasks: [] };
      }

      const workspaceDataList = await Promise.all(
        workspaces.slice(0, 6).map(async (workspace) => {
          const workspaceId = workspaceIdOf(workspace);
          if (!workspaceId) {
            return { tasks: [] as Issue[], columnMap: {} as Record<string, string>, doneColumnIds: new Set<string>(), workspace };
          }

          const [tasks, boardData] = await Promise.all([
            taskService
              .getBoardTasks(workspaceId, { assigneeId: user.id, page: 1, limit: 20, sortBy: "dueDate", sortOrder: "asc" })
              .catch(() => [] as Issue[]),
            boardService.getBoardByWorkspace(workspaceId).catch(() => ({ columns: [] })),
          ]);

          const columnMap: Record<string, string> = {};
          for (const col of boardData.columns ?? []) {
            if (col.id) columnMap[col.id] = col.name;
            const mongoId = (col as BoardColumn & { _id?: string })._id;
            if (mongoId) columnMap[mongoId] = col.name;
          }

          return { tasks, columnMap, doneColumnIds: getDoneColumnIds(boardData.columns), workspace };
        }),
      );

      const globalColumnMap: Record<string, string> = {};
      for (const { columnMap } of workspaceDataList) Object.assign(globalColumnMap, columnMap);

      const assignedTasks = sortByDueDateAsc(
        workspaceDataList
          .flatMap(({ tasks, workspace }) =>
            (tasks as Issue[]).map((task) => toDashboardTask(task, workspace, "assigned", globalColumnMap)),
          ),
      );

      const completedAssignedTasks = workspaceDataList.flatMap(
        ({ tasks, workspace, columnMap, doneColumnIds }) =>
          (tasks as Issue[])
            .filter((task) => isDoneIssue(task, columnMap, doneColumnIds))
            .map((task) => toDashboardTask(task, workspace, "worked", globalColumnMap)),
      );

      return { workspaces, userStats, assignedTasks, completedAssignedTasks };
    },
  });
}
