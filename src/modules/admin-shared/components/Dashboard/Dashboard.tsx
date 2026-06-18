"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { BookOpen, CheckCircle2, Loader2 } from "lucide-react";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { queryKeys } from "@/shared/constants/queryKeys";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import { toast } from "react-hot-toast";
import TaskDetailModal from "@/modules/workspace/tasks/detail/TaskDetailModal";
import WorkspaceAvatar from "@/modules/workspace/shared/components/WorkspaceAvatar";
import { boardService } from "@/modules/workspace/shared/services/boardService";
import { taskService } from "@/modules/workspace/shared/services/taskService";
import { sprintService } from "@/modules/workspace/shared/services/sprintService";
import type { Issue } from "@/modules/workspace/shared/types/issue.type";
import type { Sprint } from "@/modules/workspace/shared/types/sprint.type";
import type { BoardColumn } from "@/modules/workspace/shared/types/board.type";
import { enrichTaskDetailUsers } from "@/modules/workspace/shared/utils/taskDetailUsers";


export interface AdminDashboardProps {
  className?: string;
}

type ForYouWorkspace = {
  id?: string;
  _id?: string;
  name: string;
  slug?: string;
  key?: string;
  type?: string;
  role?: string;
  relationship?: string;
  ownershipLabel?: string;
  updatedAt?: string;
  avatar?: string | null;
};

type ForYouResponse = {
  success?: boolean;
  workspaces?: ForYouWorkspace[];
};

type UserDashboardStats = {
  tasksAssigned?: number;
  tasksByStatus?: Record<string, number>;
  tasksByPriority?: Record<string, number>;
  recentlyCompleted?: DashboardActivity[];
  recentActivity?: DashboardActivity[];
};

type DashboardActivity = {
  _id?: string;
  id?: string;
  key?: string;
  title?: string;
  columnId?: string;
  status?: string;
  workspaceId?: string | { _id?: string; id?: string };
};

type WorkspaceNameSource = ForYouWorkspace & {
  title?: string;
  label?: string;
};

type DashboardTask = {
  id: string;
  key: string;
  title: string;
  type: "assigned" | "worked";
  workspaceKey: string;
  meta: string;
};

const normalizePayload = <T,>(payload: { data?: { data?: T } | T }): T =>
  (payload?.data as { data?: T })?.data ?? (payload?.data as T);

const workspaceIdOf = (workspace: ForYouWorkspace) => workspace.id || workspace._id || "";

const workspaceRouteKeyOf = (workspace: ForYouWorkspace) => workspace.key || workspace.slug || workspaceIdOf(workspace);

const toWorkspaceCard = (workspace: ForYouWorkspace) => ({
  ...workspace,
  id: workspaceIdOf(workspace),
  routeKey: workspaceRouteKeyOf(workspace),
  description: workspace.ownershipLabel || workspace.relationship || workspace.role || workspace.type || "Workspace",
});

const isIdLike = (s?: string) =>
  /^[0-9a-f]{24}$/i.test(s ?? "") || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s ?? "");

const resolveStatusLabel = (issue: Issue, columnMap: Record<string, string> = {}): string => {
  if (issue.status && columnMap[issue.status]) return columnMap[issue.status];
  if (issue.columnId && columnMap[issue.columnId]) return columnMap[issue.columnId];
  if (issue.status && !isIdLike(issue.status)) return issue.status;
  if (issue.columnId && !isIdLike(issue.columnId)) return issue.columnId;
  return "No status";
};

const normalizeStatusKey = (value?: string | null) =>
  (value ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");

const isDoneStatusKey = (value?: string | null) => {
  const normalized = normalizeStatusKey(value);
  return normalized === "done" || normalized === "completed" || normalized === "complete";
};

const getDoneColumnIds = (columns: BoardColumn[] = []) => {
  const doneColumnIds = new Set<string>();

  for (const column of columns) {
    const mongoId = (column as BoardColumn & { _id?: string })._id;
    const isDoneColumn =
      column.isDone ||
      isDoneStatusKey(column.name) ||
      column.mappedStatuses?.some(isDoneStatusKey);

    if (!isDoneColumn) continue;
    if (column.id) doneColumnIds.add(column.id);
    if (mongoId) doneColumnIds.add(mongoId);
  }

  return doneColumnIds;
};

const isDoneIssue = (
  issue: Issue,
  columnMap: Record<string, string> = {},
  doneColumnIds: Set<string> = new Set(),
) => {
  if (isDoneStatusKey(issue.status) || isDoneStatusKey(issue.columnId)) return true;
  if (issue.status && doneColumnIds.has(issue.status)) return true;
  if (issue.columnId && doneColumnIds.has(issue.columnId)) return true;
  if (issue.status && isDoneStatusKey(columnMap[issue.status])) return true;
  if (issue.columnId && isDoneStatusKey(columnMap[issue.columnId])) return true;
  return false;
};

const toDashboardTask = (
  issue: Issue,
  workspace: ForYouWorkspace,
  type: "assigned" | "worked",
  columnMap: Record<string, string> = {}
): DashboardTask => {
  const workspaceId = workspaceIdOf(workspace);
  const workspaceKey = workspaceRouteKeyOf(workspace);
  const workspaceName = workspace as WorkspaceNameSource;
  const wsName = workspaceName.name ?? workspaceName.title ?? workspaceName.label ?? "Workspace";
  const statusLabel = resolveStatusLabel(issue, columnMap);

  return {
    id: `${workspaceId}-${issue.id}`,
    key: issue.key,
    title: issue.title,
    type,
    workspaceKey,
    meta: `${issue.key} - ${wsName} - ${statusLabel}`,
  };
};

export default function AdminDashboard({ className = "" }: AdminDashboardProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedDashboardTask, setSelectedDashboardTask] = useState<DashboardTask | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<any>(null);
  const [selectedBoardColumns, setSelectedBoardColumns] = useState<BoardColumn[]>([]);
  const [selectedSprints, setSelectedSprints] = useState<Sprint[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedWorkspaceMembers, setSelectedWorkspaceMembers] = useState<any[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const dashboardQuery = useQuery({
    queryKey: queryKeys.admin.dashboardForUser(user?.id ?? "anonymous"),
    queryFn: async () => {
      const [forYouResponse, userDashboardResponse] = await Promise.all([
        api.get(apiRoutes.FOR_YOU).catch(() => ({ data: { workspaces: [] } })),
        api.get(apiRoutes.DASHBOARD.USER).catch(() => ({ data: {} })),
      ]);

      const forYouPayload = normalizePayload<ForYouResponse | ForYouWorkspace[]>(forYouResponse);
      const workspaces: ForYouWorkspace[] = Array.isArray(forYouPayload)
        ? forYouPayload
        : (forYouPayload?.workspaces ?? []);
      const userStats = normalizePayload<UserDashboardStats>(userDashboardResponse) ?? null;

      if (!user?.id || workspaces.length === 0) {
        return {
          workspaces,
          userStats,
          assignedTasks: [] as DashboardTask[],
          completedAssignedTasks: [] as DashboardTask[],
        };
      }

      const workspaceDataList = await Promise.all(
        workspaces.slice(0, 6).map(async (workspace) => {
          const workspaceId = workspaceIdOf(workspace);
          if (!workspaceId) {
            return {
              tasks: [] as Issue[],
              columnMap: {} as Record<string, string>,
              doneColumnIds: new Set<string>(),
              workspace,
            };
          }

          const [tasks, boardData] = await Promise.all([
            taskService
              .getBoardTasks(workspaceId, {
                assigneeId: user.id,
                page: 1,
                limit: 100,
                sortBy: "updatedAt",
                sortOrder: "desc",
              })
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
      for (const { columnMap } of workspaceDataList) {
        Object.assign(globalColumnMap, columnMap);
      }

      const assignedTasks = workspaceDataList
        .map(({ tasks, workspace }) =>
          (tasks as Issue[]).map((task) => toDashboardTask(task, workspace, "assigned", globalColumnMap)),
        )
        .flat()
        .slice(0, 10);

      const completedAssignedTasks = workspaceDataList
        .map(({ tasks, workspace, columnMap, doneColumnIds }) =>
          (tasks as Issue[])
            .filter((task) => isDoneIssue(task, columnMap, doneColumnIds))
            .map((task) => toDashboardTask(task, workspace, "worked", globalColumnMap)),
        )
        .flat();

      return {
        workspaces,
        userStats,
        assignedTasks,
        completedAssignedTasks,
      };
    },
  });


  const workspaces = useMemo(() => dashboardQuery.data?.workspaces ?? [], [dashboardQuery.data?.workspaces]);
  const assignedTasks = useMemo(() => dashboardQuery.data?.assignedTasks ?? [], [dashboardQuery.data?.assignedTasks]);
  const completedAssignedTasks = useMemo(
    () => dashboardQuery.data?.completedAssignedTasks ?? [],
    [dashboardQuery.data?.completedAssignedTasks],
  );

  const displayWorkspaces = useMemo(() => workspaces.slice(0, 4).map(toWorkspaceCard), [workspaces]);

  const handleOpenTask = async (task: DashboardTask) => {
    setSelectedDashboardTask(task);
    setIsTaskModalOpen(true);
    setModalLoading(true);

    try {
      const workspace = workspaces.find(w => workspaceRouteKeyOf(w) === task.workspaceKey);
      if (!workspace) throw new Error("Workspace not found");
      const workspaceId = workspaceIdOf(workspace);
      const isScrum = workspace.type === "scrum";

      const [taskDetail, boardData, sprintList, membersRes] = await Promise.all([
        taskService.getBoardTaskDetail(workspaceId, task.key),
        boardService.getBoardByWorkspace(workspaceId).catch(() => ({ boardId: "", columns: [] })),
        isScrum
          ? sprintService.listSprints(workspaceId).catch(() => [])
          : Promise.resolve([] as Sprint[]),
        api.get(apiRoutes.WORKSPACES.MEMBERS(workspaceId)).catch(() => ({ data: [] })),
      ]);

      const members = membersRes?.data?.data ?? membersRes?.data ?? [];
      const enrichedTask = enrichTaskDetailUsers(taskDetail, members);

      setSelectedTaskDetail(enrichedTask);
      setSelectedWorkspaceMembers(members);
      setSelectedBoardColumns(boardData.columns ?? []);
      setSelectedSprints(sprintList);

      const detailUrl = `/workspaces/${task.workspaceKey}/board/key/${task.key}`;
      window.history.pushState({ ...window.history.state, as: detailUrl }, "", detailUrl);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      toast.error("Failed to load task details");
      setIsTaskModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleArchiveIssue = async (issue: any) => {
    try {
      const workspace = workspaces.find(w => workspaceRouteKeyOf(w) === selectedDashboardTask?.workspaceKey);
      const workspaceId = workspace ? workspaceIdOf(workspace) : null;
      if (!workspaceId) return;
      
      await taskService.archiveBoardTask(workspaceId, issue.id);
      toast.success("Work item archived");
      
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboardForUser(user?.id ?? "anonymous") });
      
      setIsTaskModalOpen(false);
      setSelectedDashboardTask(null);
      setSelectedTaskDetail(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not archive work item");
    }
  };

  if (dashboardQuery.isLoading) return null;

  return (
    <div className={`app-page-medium pt-6 ${className}`}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="px-2 text-2xl font-bold text-[#111111] dark:text-[#E8E8E7]">Recommended workspaces</h1>

        <Link href="/workspaces" className="text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8]">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {displayWorkspaces.length === 0 ? (
          <div className="col-span-full rounded-[8px] border border-dashed border-[#EAEAEA] bg-[#F9F9F8] p-8 text-center text-sm text-[#787774] dark:border-white/[0.06] dark:bg-[#252525] dark:text-[#9B9A97]">
            No recommended workspaces yet.
          </div>
        ) : (
          displayWorkspaces.map((workspace) => (
            <Link
              key={workspace.id}
              href={`/workspaces/${workspace.routeKey}`}
              className="workspace-panel group rounded-[8px] border border-[#EAEAEA] bg-white transition-all hover:border-[#2563EB]/20 dark:border-white/[0.06] dark:bg-[#202020] dark:hover:border-[#3B82F6]"
              style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-start gap-4">
                <WorkspaceAvatar workspace={workspace} size="lg" />

                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-[#111111] group-hover:text-[#2563EB] dark:text-[#E8E8E7] dark:group-hover:text-[#3B82F6]">
                    {workspace.name}
                  </h3>
                  <p className="mt-1 truncate text-sm text-[#787774] dark:text-[#9B9A97]">{workspace.description}</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#111111] dark:text-[#E8E8E7]">For you</h2>
          <Link href="/for-you" className="text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8]">
            View all for you items
          </Link>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-[8px] border border-[#EAEAEA] bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-[#202020]">
            <p className="text-xs text-[#787774] dark:text-[#9B9A97]">Assigned tasks</p>
            <p className="mt-1 text-xl font-semibold text-[#111111] dark:text-[#E8E8E7]">{assignedTasks.length}</p>
          </div>
          <div className="rounded-[8px] border border-[#EAEAEA] bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-[#202020]">
            <p className="text-xs text-[#787774] dark:text-[#9B9A97]">Recently completed</p>
            <p className="mt-1 text-xl font-semibold text-[#111111] dark:text-[#E8E8E7]">{completedAssignedTasks.length}</p>
          </div>
          <div className="rounded-[8px] border border-[#EAEAEA] bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-[#202020]">
            <p className="text-xs text-[#787774] dark:text-[#9B9A97]">Recommended workspaces</p>
            <p className="mt-1 text-xl font-semibold text-[#111111] dark:text-[#E8E8E7]">{workspaces.length}</p>
          </div>
        </div>

        <div className="space-y-2">
          {assignedTasks.length === 0 ? (
            <div className="rounded-[8px] border border-dashed border-[#EAEAEA] bg-[#F9F9F8] px-4 py-8 text-center text-sm text-[#787774] dark:border-white/[0.06] dark:bg-[#252525] dark:text-[#9B9A97]">
              No tasks assigned to you yet.
            </div>
          ) : (
            assignedTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleOpenTask(task)}
                className="flex cursor-pointer items-center justify-between rounded-[8px] border border-[#EAEAEA] bg-[#F9F9F8] px-4 py-3 transition hover:bg-[#F7F6F3] dark:border-white/[0.06] dark:bg-[#202020] dark:hover:bg-white/8"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[4px] bg-[#EDF3EC] dark:bg-[rgba(52,101,56,0.12)]">
                    {task.type === "worked" ? (
                      <CheckCircle2 className="h-4 w-4 text-[#346538] dark:text-[#4ADE80]" />
                    ) : (
                      <BookOpen className="h-4 w-4 text-[#346538] dark:text-[#4ADE80]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-medium text-[#111111] dark:text-[#E8E8E7]">{task.title}</p>
                    <p className="truncate text-xs text-[#787774] dark:text-[#9B9A97]">{task.meta}</p>
                  </div>
                </div>

                <span className="ml-3 rounded-[4px] bg-[#EFF6FF] px-3 py-1 text-xs font-medium text-[#1F6C9F] dark:bg-[rgba(37,99,235,0.12)] dark:text-[#93C5FD]">
                  Open
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {isTaskModalOpen && (
        modalLoading ? (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 p-4 md:p-8 animate-in fade-in duration-200">
            <div className="flex flex-col items-center justify-center bg-white dark:bg-[#202020] rounded-[10px] p-8 shadow-xl">
              <Loader2 className="h-8 w-8 animate-spin text-[#2563EB] dark:text-[#3B82F6] mb-4" />
              <p className="text-[#111111] dark:text-[#E8E8E7] font-medium">Loading task...</p>
            </div>
          </div>
        ) : selectedTaskDetail && selectedDashboardTask ? (
          (() => {
            const ws = workspaces.find(w => workspaceRouteKeyOf(w) === selectedDashboardTask.workspaceKey);
            const wsId = ws ? workspaceIdOf(ws) : "";
            return (
              <TaskDetailModal
                issue={selectedTaskDetail}
                workspaceId={wsId}
                boardColumns={selectedBoardColumns}
                sprints={selectedSprints}
                workspaceMembers={selectedWorkspaceMembers}
                workspaceTemplate={ws?.type === "scrum" ? "scrum" : "kanban"}
                onClose={() => {
                  setIsTaskModalOpen(false);
                  setSelectedDashboardTask(null);
                  setSelectedTaskDetail(null);
                  setSelectedBoardColumns([]);
                  setSelectedSprints([]);
                  setSelectedWorkspaceMembers([]);
                  window.history.pushState(null, "", "/dashboard");
                }}
                onUpdateIssue={async (updatedIssue) => {
                  if (wsId && updatedIssue.id) {
                    await taskService.updateBoardTask(wsId, updatedIssue.id, updatedIssue);
                    setSelectedTaskDetail({ ...selectedTaskDetail, ...updatedIssue });
                    await queryClient.invalidateQueries({
                      queryKey: queryKeys.admin.dashboardForUser(user?.id ?? "anonymous"),
                    });
                  }
                }}
                onArchiveIssue={handleArchiveIssue}
              />
            );
          })()
        ) : null
      )}
    </div>
  );
}
