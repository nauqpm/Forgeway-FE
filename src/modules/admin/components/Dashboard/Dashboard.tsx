"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Database, LayoutDashboard, Loader2 } from "lucide-react";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import TaskDetailModal from "@/modules/client/workspaces/components/TaskDetailModal";
import { boardService } from "@/modules/client/workspaces/services/boardService";
import { taskService } from "@/modules/client/workspaces/services/taskService";
import type { Issue } from "@/modules/client/workspaces/types/issue.type";
import { useWorkspaceStore } from "@/stores/workspaceStore";

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
};

type UserDashboardStats = {
  tasksAssigned?: number;
  tasksByStatus?: Record<string, number>;
  tasksByPriority?: Record<string, number>;
  recentlyCompleted?: any[];
  recentActivity?: any[];
};

type DashboardTask = {
  id: string;
  key: string;
  title: string;
  type: "assigned" | "worked";
  workspaceKey: string;
  meta: string;
};

const normalizePayload = <T,>(payload: any): T => payload?.data?.data ?? payload?.data ?? payload;

const workspaceIdOf = (workspace: ForYouWorkspace) => workspace.id || workspace._id || "";

const workspaceRouteKeyOf = (workspace: ForYouWorkspace) =>
  workspace.key || workspace.slug || workspaceIdOf(workspace);

const SHOW_STARRED_DASHBOARD_TAB = false;

const toWorkspaceCard = (workspace: ForYouWorkspace, index: number) => {
  const icons = [LayoutDashboard, Database, BookOpen, CheckCircle2];
  const colors = ["bg-[#2563EB]", "bg-[#346538]", "bg-[#1F6C9F]", "bg-[#3B82F6]"];

  return {
    ...workspace,
    id: workspaceIdOf(workspace),
    routeKey: workspaceRouteKeyOf(workspace),
    description:
      workspace.ownershipLabel ||
      workspace.relationship ||
      workspace.role ||
      workspace.type ||
      "Workspace",
    icon: icons[index % icons.length],
    color: colors[index % colors.length],
  };
};

const isIdLike = (s?: string) =>
  /^[0-9a-f]{24}$/i.test(s ?? "") ||
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s ?? "");

const resolveStatusLabel = (issue: Issue, columnMap: Record<string, string> = {}): string => {
  if (issue.status && columnMap[issue.status]) return columnMap[issue.status];
  if (issue.columnId && columnMap[issue.columnId]) return columnMap[issue.columnId];
  if (issue.status && !isIdLike(issue.status)) return issue.status;
  if (issue.columnId && !isIdLike(issue.columnId)) return issue.columnId;
  return "No status";
};

const toDashboardTask = (
  issue: Issue,
  workspace: ForYouWorkspace,
  type: "assigned" | "worked",
  columnMap: Record<string, string> = {},
): DashboardTask => {
  const workspaceId = workspaceIdOf(workspace);
  const workspaceKey = workspaceRouteKeyOf(workspace);
  const wsName = (workspace as any).name ?? (workspace as any).title ?? (workspace as any).label ?? "Workspace";
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
  const { setWorkspaces } = useWorkspaceStore();
  const { user } = useAuth();
  const [workspaces, setDashboardWorkspaces] = useState<ForYouWorkspace[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<DashboardTask[]>([]);
  const [workedTasks, setWorkedTasks] = useState<DashboardTask[]>([]);
  const [userStats, setUserStats] = useState<UserDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("assigned");

  const [selectedDashboardTask, setSelectedDashboardTask] = useState<DashboardTask | null>(null);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<any>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);

      try {
        const [forYouResponse, userDashboardResponse] = await Promise.all([
          api.get(apiRoutes.FOR_YOU).catch(() => ({ data: { workspaces: [] } })),
          api.get(apiRoutes.DASHBOARD.USER).catch(() => ({ data: {} })),
        ]);

        if (cancelled) return;

        const forYouPayload = normalizePayload<any>(forYouResponse);
        const nextWorkspaces: ForYouWorkspace[] = Array.isArray(forYouPayload)
          ? forYouPayload
          : forYouPayload?.workspaces ?? [];
        const nextUserStats = normalizePayload<UserDashboardStats>(userDashboardResponse) ?? null;

        setDashboardWorkspaces(nextWorkspaces);
        setWorkspaces(nextWorkspaces as any);
        setUserStats(nextUserStats);

        if (!user?.id || nextWorkspaces.length === 0) {
          setAssignedTasks([]);
          setWorkedTasks([]);
          return;
        }

        const workspaceDataList = await Promise.all(
          nextWorkspaces.slice(0, 6).map(async (workspace) => {
            const workspaceId = workspaceIdOf(workspace);
            if (!workspaceId) return { tasks: [] as Issue[], columnMap: {} as Record<string, string>, workspace };

            const [tasks, boardData] = await Promise.all([
              taskService
                .getBoardTasks(workspaceId, {
                  assigneeId: user.id,
                  page: 1,
                  limit: 5,
                  sortBy: "updatedAt",
                  sortOrder: "desc",
                })
                .catch(() => [] as Issue[]),
              boardService.getBoardByWorkspace(workspaceId).catch(() => ({ columns: [] })),
            ]);

            const columnMap: Record<string, string> = {};
            for (const col of boardData.columns ?? []) {
              if (col.id) columnMap[col.id] = col.name;
              if ((col as any)._id) columnMap[(col as any)._id] = col.name;
            }

            return { tasks, columnMap, workspace };
          }),
        );

        if (cancelled) return;

        const globalColumnMap: Record<string, string> = {};
        for (const { columnMap } of workspaceDataList) {
          Object.assign(globalColumnMap, columnMap);
        }

        const assignedGroups = workspaceDataList.map(({ tasks, workspace }) =>
          (tasks as Issue[]).map((task) => toDashboardTask(task, workspace, "assigned", globalColumnMap)),
        );

        const rawWorked: any[] = Array.isArray(nextUserStats?.recentActivity)
          ? nextUserStats.recentActivity
          : Array.isArray(nextUserStats?.recentlyCompleted)
            ? nextUserStats.recentlyCompleted
            : [];

        const completedTasks = rawWorked
          .map((activity) => {
            const rawWsId =
              typeof activity.workspaceId === "string"
                ? activity.workspaceId
                : activity.workspaceId?._id ?? activity.workspaceId?.id ?? "";
            const workspace =
              nextWorkspaces.find((item) => workspaceIdOf(item) === rawWsId) ||
              nextWorkspaces[0];
            if (!workspace) return null;
            const proxy = {
              id: activity._id ?? activity.id ?? "",
              key: activity.key ?? "",
              title: activity.title ?? "",
              columnId: activity.columnId ?? "",
              status: activity.status ?? "",
            } as Issue;
            return toDashboardTask(proxy, workspace, "worked", globalColumnMap);
          })
          .filter(Boolean) as DashboardTask[];

        setAssignedTasks(assignedGroups.flat().slice(0, 10));
        setWorkedTasks(completedTasks.slice(0, 10));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [setWorkspaces, user?.id]);

  const tabs = [
    { label: "Assigned to me", key: "assigned" },
    { label: "Starred", key: "starred" },
    { label: "Worked on", key: "worked" },
    { label: "Viewed", key: "viewed" },
  ].filter((tab) => SHOW_STARRED_DASHBOARD_TAB || tab.key !== "starred");

  const displayWorkspaces = useMemo(
    () => workspaces.slice(0, 4).map(toWorkspaceCard),
    [workspaces],
  );
  const filteredTasks =
    activeTab === "assigned" ? assignedTasks : activeTab === "worked" ? workedTasks : [];
  const emptyMessage =
    activeTab === "starred"
      ? "The backend does not have an API for starred items yet."
      : activeTab === "viewed"
        ? "The backend records task view audit events but does not have a viewed-items API yet."
        : "No matching tasks.";

  const handleOpenTask = async (task: DashboardTask) => {
    setSelectedDashboardTask(task);
    setIsTaskModalOpen(true);
    setModalLoading(true);

    try {
      const workspace = workspaces.find(w => workspaceRouteKeyOf(w) === task.workspaceKey);
      if (!workspace) throw new Error("Workspace not found");
      const workspaceId = workspaceIdOf(workspace);
      
      const taskDetail = await taskService.getBoardTaskDetail(workspaceId, task.key);
      setSelectedTaskDetail(taskDetail);

      const detailUrl = `/workspaces/${task.workspaceKey}/board/key/${task.key}`;
      window.history.pushState({ ...window.history.state, as: detailUrl }, "", detailUrl);
    } catch (err) {
      toast.error("Failed to load task details");
      setIsTaskModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleArchiveIssue = async (issue: any) => {
    try {
      const workspace = workspaces.find(w => workspaceRouteKeyOf(w) === selectedDashboardTask?.workspaceKey);
      const workspaceId = workspace ? workspaceIdOf(workspace) : null;
      if (!workspaceId) return;
      
      await taskService.archiveBoardTask(workspaceId, issue.id);
      toast.success("Work item archived");
      
      setAssignedTasks(prev => prev.filter(t => t.id !== selectedDashboardTask?.id));
      setWorkedTasks(prev => prev.filter(t => t.id !== selectedDashboardTask?.id));
      
      setIsTaskModalOpen(false);
      setSelectedDashboardTask(null);
      setSelectedTaskDetail(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not archive work item");
    }
  };

  if (loading) return null;

  return (
    <div className={`app-page-medium ${className}`}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="px-2 text-2xl font-bold text-[#111111] dark:text-[#E8E8E7]">
          Recommended workspaces
        </h1>

        <Link
          href="/workspaces"
          className="text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8]"
        >
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
                <div
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[8px] ${workspace.color}`}
                >
                  <workspace.icon className="h-6 w-6 text-white" />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-[#111111] group-hover:text-[#2563EB] dark:text-[#E8E8E7] dark:group-hover:text-[#3B82F6]">
                    {workspace.name}
                  </h3>
                  <p className="mt-1 truncate text-sm text-[#787774] dark:text-[#9B9A97]">
                    {workspace.description}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#111111] dark:text-[#E8E8E7]">For you</h2>
          <Link
            href="/for-you"
            className="text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8]"
          >
            View all for you items
          </Link>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-[8px] border border-[#EAEAEA] bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-[#202020]">
            <p className="text-xs text-[#787774] dark:text-[#9B9A97]">Assigned tasks</p>
            <p className="mt-1 text-xl font-semibold text-[#111111] dark:text-[#E8E8E7]">
              {assignedTasks.length}
            </p>
          </div>
          <div className="rounded-[8px] border border-[#EAEAEA] bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-[#202020]">
            <p className="text-xs text-[#787774] dark:text-[#9B9A97]">Recently completed</p>
            <p className="mt-1 text-xl font-semibold text-[#111111] dark:text-[#E8E8E7]">
              {workedTasks.length}
            </p>
          </div>
          <div className="rounded-[8px] border border-[#EAEAEA] bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-[#202020]">
            <p className="text-xs text-[#787774] dark:text-[#9B9A97]">Recommended workspaces</p>
            <p className="mt-1 text-xl font-semibold text-[#111111] dark:text-[#E8E8E7]">
              {workspaces.length}
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-[6px] px-3 py-1.5 text-sm transition ${
                activeTab === tab.key
                  ? "bg-[#EFF6FF] font-medium text-[#1F6C9F] dark:bg-[rgba(37,99,235,0.12)] dark:text-[#93C5FD]"
                  : "text-[#787774] hover:bg-[#F7F6F3] dark:text-[#9B9A97] dark:hover:bg-white/[0.05]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mb-2 text-sm text-[#787774] dark:text-[#9B9A97]">Summary</div>

        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="rounded-[8px] border border-dashed border-[#EAEAEA] bg-[#F9F9F8] px-4 py-8 text-center text-sm text-[#787774] dark:border-white/[0.06] dark:bg-[#252525] dark:text-[#9B9A97]">
              {emptyMessage}
            </div>
          ) : (
            filteredTasks.map((task) => (
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
                    <p className="truncate font-medium text-[#111111] dark:text-[#E8E8E7]">
                      {task.title}
                    </p>
                    <p className="truncate text-xs text-[#787774] dark:text-[#9B9A97]">
                      {task.meta}
                    </p>
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
          <TaskDetailModal
            issue={selectedTaskDetail}
            workspaceId={workspaces.find(w => workspaceRouteKeyOf(w) === selectedDashboardTask.workspaceKey) ? workspaceIdOf(workspaces.find(w => workspaceRouteKeyOf(w) === selectedDashboardTask.workspaceKey)!) : ""}
            onClose={() => {
              setIsTaskModalOpen(false);
              setSelectedDashboardTask(null);
              setSelectedTaskDetail(null);
              window.history.pushState(null, "", "/dashboard");
            }}
            onUpdateIssue={async (updatedIssue) => {
              const workspace = workspaces.find(w => workspaceRouteKeyOf(w) === selectedDashboardTask.workspaceKey);
              const workspaceId = workspace ? workspaceIdOf(workspace) : null;
              if (workspaceId && updatedIssue.id) {
                await taskService.updateBoardTask(workspaceId, updatedIssue.id, updatedIssue);
                setSelectedTaskDetail({ ...selectedTaskDetail, ...updatedIssue });
              }
            }}
            onArchiveIssue={handleArchiveIssue}
          />
        ) : null
      )}
    </div>
  );
}
