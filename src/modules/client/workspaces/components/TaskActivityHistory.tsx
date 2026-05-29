"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Loader2 } from "lucide-react";

import { taskService, TaskActivity } from "../services/taskService";

type TaskActivityHistoryProps = {
  workspaceId: string;
  taskId: string;
  taskKey?: string;
};

const FIELD_LABELS: Record<string, string> = {
  assigneeId: "Assignee",
  columnId: "Column",
  dueDate: "Due date",
  priority: "Priority",
  sprintId: "Sprint",
  status: "Status",
  storyPoints: "Story points",
  title: "Title",
  type: "Type",
};

const TYPE_MESSAGES: Record<string, string> = {
  TASK_CREATED: "created the work item",
  TITLE_CHANGED: "changed the Title",
  DESCRIPTION_CHANGED: "updated the Description",
  STATUS_CHANGED: "changed the Status",
  COLUMN_CHANGED: "changed the Column",
  SPRINT_CHANGED: "changed the Sprint",
  ASSIGNEE_CHANGED: "changed the Assignee",
  PRIORITY_CHANGED: "changed the Priority",
  TYPE_CHANGED: "changed the Type",
  STORY_POINTS_CHANGED: "changed the Story points",
  DUE_DATE_CHANGED: "changed the Due date",
  RANK_CHANGED: "changed the Rank",
  TASK_ARCHIVED: "archived the work item",
  TASK_RESTORED: "restored the work item",
  TASK_PERMANENTLY_DELETED: "permanently deleted the work item",
};

const PAGE_LIMIT = 20;

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "None";
  return String(value);
};

const formatDateTime = (value?: string) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const getActorName = (activity: TaskActivity) =>
  activity.actor?.fullName || activity.actor?.email || activity.actorId || "Someone";

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

const getActivityMessage = (activity: TaskActivity) => {
  const fallbackField = activity.metadata?.field as string | undefined;
  if (fallbackField && !TYPE_MESSAGES[activity.type]) {
    return `changed ${FIELD_LABELS[fallbackField] ?? fallbackField}`;
  }
  return TYPE_MESSAGES[activity.type] ?? activity.type.replace(/_/g, " ").toLowerCase();
};

export default function TaskActivityHistory({
  workspaceId,
  taskId,
  taskKey,
}: TaskActivityHistoryProps) {
  const [page, setPage] = useState(1);
  const [allActivities, setAllActivities] = useState<TaskActivity[]>([]);
  const [total, setTotal] = useState(0);

  // Reset when task changes
  useEffect(() => {
    setPage(1);
    setAllActivities([]);
    setTotal(0);
  }, [workspaceId, taskId]);

  const { data, isFetching, error } = useQuery({
    queryKey: ["taskActivities", workspaceId, taskId, taskKey, page],
    queryFn: async () => {
      try {
        return await taskService.getTaskActivities(workspaceId, taskId, page, PAGE_LIMIT);
      } catch (err: unknown) {
        const axiosErr = err as { response?: { status?: number } };
        if (axiosErr?.response?.status === 400 && taskKey && taskKey !== taskId) {
          return taskService.getTaskActivities(workspaceId, taskKey, page, PAGE_LIMIT);
        }
        return { activities: [] as TaskActivity[], total: 0, page, limit: PAGE_LIMIT };
      }
    },
    enabled: Boolean(workspaceId && taskId),
    staleTime: 30_000,
  });

  // Accumulate pages — replace on page 1 (initial or task change), append on subsequent pages
  useEffect(() => {
    if (!data) return;
    setTotal(data.total);
    setAllActivities((prev) =>
      page === 1 ? data.activities : [...prev, ...data.activities],
    );
  }, [data, page]);

  const handleLoadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const hasMore = allActivities.length < total;

  if (isFetching && page === 1 && allActivities.length === 0) {
    return (
      <div className="flex items-center gap-2 pt-2 text-sm text-gray-500 dark:text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading history...
      </div>
    );
  }

  if (error && allActivities.length === 0) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
        Could not load task history.
      </div>
    );
  }

  if (allActivities.length === 0 && !isFetching) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        <Clock className="h-4 w-4" />
        No history recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {allActivities.map((activity) => {
        const actorName = getActorName(activity);
        const hasChange =
          Object.prototype.hasOwnProperty.call(activity.metadata ?? {}, "from") ||
          Object.prototype.hasOwnProperty.call(activity.metadata ?? {}, "to");

        return (
          <div key={activity.id} className="flex gap-4">
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-indigo-600 text-xs font-bold text-white">
              {activity.actor?.avatar ? (
                <img
                  src={activity.actor.avatar}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center">
                  {getInitials(actorName)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {actorName}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {getActivityMessage(activity)}
                </span>
                {activity.createdAt && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDateTime(activity.createdAt)}
                  </span>
                )}
              </div>
              {hasChange && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded bg-gray-100 px-2 py-1 font-mono text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {formatValue(activity.metadata?.from)}
                  </span>
                  <span className="text-gray-400">-&gt;</span>
                  <span className="rounded bg-indigo-50 px-2 py-1 font-mono font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                    {formatValue(activity.metadata?.to)}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {hasMore && (
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isFetching}
            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-60 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
            {isFetching
              ? "Loading..."
              : `Load more (${total - allActivities.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}
