"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Database, LayoutDashboard } from "lucide-react";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import { useAuth } from "@/context/AuthContext";
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
  recentlyCompleted?: Issue[];
  recentActivity?: unknown[];
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

const toWorkspaceCard = (workspace: ForYouWorkspace, index: number) => {
  const icons = [LayoutDashboard, Database, BookOpen, CheckCircle2];
  const colors = ["bg-blue-500", "bg-green-500", "bg-indigo-500", "bg-cyan-600"];

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

const toDashboardTask = (
  issue: Issue,
  workspace: ForYouWorkspace,
  type: "assigned" | "worked",
): DashboardTask => {
  const workspaceId = workspaceIdOf(workspace);
  const workspaceKey = workspaceRouteKeyOf(workspace);

  return {
    id: `${workspaceId}-${issue.id}`,
    key: issue.key,
    title: issue.title,
    type,
    workspaceKey,
    meta: `${issue.key} - ${workspace.name} - ${issue.status}`,
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

        const assignedGroups = await Promise.all(
          nextWorkspaces.slice(0, 6).map(async (workspace) => {
            const workspaceId = workspaceIdOf(workspace);
            if (!workspaceId) return [];

            const tasks = await taskService
              .getBoardTasks(workspaceId, {
                assigneeId: user.id,
                page: 1,
                limit: 5,
                sortBy: "updatedAt",
                sortOrder: "desc",
              })
              .catch(() => []);

            return tasks.map((task) => toDashboardTask(task, workspace, "assigned"));
          }),
        );

        if (cancelled) return;

        const completedTasks = Array.isArray(nextUserStats?.recentlyCompleted)
          ? nextUserStats.recentlyCompleted
              .map((task) => {
                const workspace =
                  nextWorkspaces.find((item) => workspaceIdOf(item) === (task as any).workspaceId) ||
                  nextWorkspaces[0];
                return workspace ? toDashboardTask(task, workspace, "worked") : null;
              })
              .filter(Boolean) as DashboardTask[]
          : [];

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
  ];

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

  if (loading) return null;

  return (
    <div className={`app-page-medium ${className}`}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="px-2 text-2xl font-bold text-gray-900 dark:text-white">
          Recommended workspaces
        </h1>

        <Link
          href="/workspaces"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
              View all
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {displayWorkspaces.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
            No recommended workspaces yet.
          </div>
        ) : (
          displayWorkspaces.map((workspace) => (
            <Link
              key={workspace.id}
              href={`/workspaces/${workspace.routeKey}`}
              className="workspace-panel group rounded-xl border border-gray-200 bg-white transition-all hover:border-indigo-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-indigo-500"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${workspace.color}`}
                >
                  <workspace.icon className="h-6 w-6 text-white" />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                    {workspace.name}
                  </h3>
                  <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                    {workspace.description}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="mt-10">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">For you</h2>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">Assigned tasks</p>
            <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
              {assignedTasks.length}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">Recently completed</p>
            <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
              {workedTasks.length}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">Recommended workspaces</p>
            <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
              {workspaces.length}
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                activeTab === tab.key
                  ? "bg-indigo-100 font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                  : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">Summary</div>

        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
              {emptyMessage}
            </div>
          ) : (
            filteredTasks.map((task) => (
              <Link
                key={task.id}
                href={`/workspaces/${task.workspaceKey}/board/key/${task.key}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 transition hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-green-100 dark:bg-green-900/30">
                    {task.type === "worked" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <BookOpen className="h-4 w-4 text-green-600" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900 dark:text-white">
                      {task.title}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {task.meta}
                    </p>
                  </div>
                </div>

                <span className="ml-3 rounded bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                  Open
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
