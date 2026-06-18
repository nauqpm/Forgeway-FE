"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Loader2 } from "lucide-react";

import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { queryKeys } from "@/shared/constants/queryKeys";
import type { TaskLabel } from "../types/label.type";
import { labelService } from "../services/labelService";
import { taskService, TaskActivity } from "../services/taskService";
import { normalizeDate } from "../utils/dateUtils";

type BoardColumn = { id: string; name: string };

type TaskActivityHistoryProps = {
  workspaceId: string;
  taskId: string;
  taskKey?: string;
  workspaceMembers?: WorkspaceMember[];
  assigneeId?: string | null;
  assigneeName?: string | null;
  assignee?: unknown;
  labels?: TaskLabel[];
  boardColumns?: BoardColumn[];
};

const FIELD_LABELS: Record<string, string> = {
  assigneeId: "Assignee",
  columnId: "Column",
  dueDate: "Due date",
  priority: "Priority",
  sprintId: "Sprint",
  status: "Status",
  storyPoints: "Story points",
  labelIds: "Labels",
  labels: "Labels",
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
  LABELS_CHANGED: "changed the Labels",
  LABEL_CHANGED: "changed the Labels",
  RANK_CHANGED: "changed the Rank",
  TASK_ARCHIVED: "archived the work item",
  TASK_RESTORED: "restored the work item",
  TASK_PERMANENTLY_DELETED: "permanently deleted the work item",
};

const PAGE_LIMIT = 20;

type WorkspaceMember = {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  user?:
    | string
    | {
        _id?: string;
        id?: string;
        fullName?: string;
        name?: string;
        email?: string;
        avatar?: string;
        avatarUrl?: string;
        image?: string;
      };
  userId?:
    | string
    | {
        _id?: string;
        id?: string;
        fullName?: string;
        name?: string;
        email?: string;
        avatar?: string;
        avatarUrl?: string;
        image?: string;
      };
};

type LabelLike = {
  _id?: string;
  id?: string;
  name?: string;
  labelId?: string;
  label?: string | LabelLike;
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "None";
  return String(value);
};

const isAssigneeActivity = (activity: TaskActivity) =>
  activity.type === "ASSIGNEE_CHANGED" ||
  activity.metadata?.field === "assigneeId" ||
  activity.metadata?.field === "assignee";

const isLabelActivity = (activity: TaskActivity) =>
  activity.type === "LABELS_CHANGED" ||
  activity.type === "LABEL_CHANGED" ||
  activity.metadata?.field === "labelIds" ||
  activity.metadata?.field === "labels" ||
  activity.metadata?.field === "label";

const isColumnActivity = (activity: TaskActivity) =>
  activity.type === "COLUMN_CHANGED" ||
  activity.type === "STATUS_CHANGED" ||
  activity.metadata?.field === "columnId" ||
  activity.metadata?.field === "status";

const isDueDateActivity = (activity: TaskActivity) =>
  activity.type === "DUE_DATE_CHANGED" ||
  activity.metadata?.field === "dueDate";

const isRankActivity = (activity: TaskActivity) =>
  activity.type === "RANK_CHANGED" ||
  activity.metadata?.field === "rank";

const getUserLikeDisplayName = (value: unknown) => {
  if (!value || typeof value !== "object") return null;
  const user = value as {
    fullName?: string;
    name?: string;
    email?: string;
  };

  return user.fullName || user.name || user.email || null;
};

const getUserLikeIds = (value: unknown) => {
  if (!value || typeof value !== "object") return [];
  const user = value as {
    _id?: string;
    id?: string;
    userId?: string | { _id?: string; id?: string };
    user?: string | { _id?: string; id?: string };
  };

  const ids = [user._id, user.id].filter(Boolean) as string[];

  [user.userId, user.user].forEach((nestedUser) => {
    if (!nestedUser) return;
    if (typeof nestedUser === "string") {
      ids.push(nestedUser);
      return;
    }
    if (nestedUser._id) ids.push(nestedUser._id);
    if (nestedUser.id) ids.push(nestedUser.id);
  });

  return ids;
};

const getMemberDisplayName = (member: WorkspaceMember) => {
  return getUserLikeDisplayName(member.userId) || getUserLikeDisplayName(member.user) || getUserLikeDisplayName(member);
};

const getMemberIds = (member: WorkspaceMember) => {
  const memberIds = [member._id, member.id, ...getUserLikeIds(member)].filter(Boolean) as string[];

  const userIds = !member.userId
    ? []
    : typeof member.userId === "string"
      ? [member.userId]
      : getUserLikeIds(member.userId);

  const nestedUserIds = !member.user
    ? []
    : typeof member.user === "string"
      ? [member.user]
      : getUserLikeIds(member.user);

  return [...memberIds, ...userIds, ...nestedUserIds];
};

const normalizeMembersPayload = (payload: unknown): WorkspaceMember[] => {
  if (Array.isArray(payload)) return payload as WorkspaceMember[];
  if (!payload || typeof payload !== "object") return [];

  const value = payload as {
    members?: WorkspaceMember[];
    users?: WorkspaceMember[];
    data?: WorkspaceMember[] | { members?: WorkspaceMember[] };
  };

  if (Array.isArray(value.members)) return value.members;
  if (Array.isArray(value.users)) return value.users;
  if (Array.isArray(value.data)) return value.data;
  if (value.data && !Array.isArray(value.data) && Array.isArray(value.data.members)) {
    return value.data.members;
  }

  return [];
};

const buildMemberNameMap = (
  members: WorkspaceMember[] = [],
  knownUsers: Array<{ id?: string | null; name?: string | null; user?: unknown }> = []
) => {
  const map = new Map<string, string>();

  members.forEach((member) => {
    const displayName = getMemberDisplayName(member);
    if (!displayName) return;

    getMemberIds(member).forEach((id) => {
      map.set(id, displayName);
    });
  });

  knownUsers.forEach((knownUser) => {
    const displayName = knownUser.name || getUserLikeDisplayName(knownUser.user);
    if (!displayName || displayName === "Unassigned") return;

    const ids = [knownUser.id, ...getUserLikeIds(knownUser.user)].filter(Boolean) as string[];

    ids.forEach((id) => {
      map.set(id, displayName);
    });
  });

  return map;
};

const getLabelDisplayName = (value: unknown) => {
  if (!value || typeof value !== "object") return null;
  const label = value as LabelLike;
  if (label.name) return label.name;
  if (label.label && typeof label.label === "object") {
    return getLabelDisplayName(label.label);
  }
  return null;
};

const getLabelIds = (value: unknown): string[] => {
  if (!value || typeof value !== "object") return [];
  const label = value as LabelLike;

  const ids = [label._id, label.id, label.labelId].filter(Boolean) as string[];
  if (label.label) {
    ids.push(...(typeof label.label === "string" ? [label.label] : getLabelIds(label.label)));
  }

  return ids;
};

const buildColumnNameMap = (columns: BoardColumn[] = []) => {
  const map = new Map<string, string>();
  columns.forEach((col) => {
    if (col.id && col.name) map.set(col.id, col.name);
  });
  return map;
};

const buildLabelNameMap = (workspaceLabels: TaskLabel[] = [], taskLabels: TaskLabel[] = []) => {
  const map = new Map<string, string>();

  [...workspaceLabels, ...taskLabels].forEach((label) => {
    if (!label.name) return;
    [label.id, label._id].filter(Boolean).forEach((id) => {
      map.set(id as string, label.name);
    });
  });

  return map;
};

const formatLabelActivityValue = (value: unknown, labelNameMap: Map<string, string>): string => {
  if (Array.isArray(value)) {
    const labelNames = value
      .map((item) => formatLabelActivityValue(item, labelNameMap))
      .filter((item) => item !== "None");
    return labelNames.length > 0 ? labelNames.join(", ") : "None";
  }

  const directDisplayName = getLabelDisplayName(value);
  if (directDisplayName) return directDisplayName;

  const matchedId = getLabelIds(value).find((id) => labelNameMap.has(id));
  if (matchedId) return labelNameMap.get(matchedId) ?? formatValue(value);

  const fallback = formatValue(value);
  if (fallback === "None") return fallback;

  return labelNameMap.get(fallback) ?? fallback;
};

const formatDueDateActivityValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "None";

  if (value instanceof Date) {
    return normalizeDate(value.toISOString()) ?? formatValue(value);
  }

  if (typeof value === "string") {
    return normalizeDate(value) ?? formatValue(value);
  }

  return formatValue(value);
};

const formatActivityValue = (
  activity: TaskActivity,
  value: unknown,
  memberNameMap: Map<string, string>,
  labelNameMap: Map<string, string>,
  columnNameMap: Map<string, string>,
) => {
  if (isDueDateActivity(activity)) return formatDueDateActivityValue(value);

  if (isLabelActivity(activity)) return formatLabelActivityValue(value, labelNameMap);

  if (isColumnActivity(activity)) {
    const fallback = formatValue(value);
    if (fallback === "None") return fallback;
    return columnNameMap.get(fallback) ?? fallback;
  }

  if (!isAssigneeActivity(activity)) return formatValue(value);

  const directDisplayName = getUserLikeDisplayName(value);
  if (directDisplayName) return directDisplayName;

  const fallback = formatValue(value);
  if (fallback === "None") return fallback;

  const matchedId = getUserLikeIds(value).find((id) => memberNameMap.has(id));
  if (matchedId) return memberNameMap.get(matchedId) ?? fallback;

  return memberNameMap.get(String(value)) ?? fallback;
};

const formatDateTime = (value?: string) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
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
  workspaceMembers,
  assigneeId,
  assigneeName,
  assignee,
  labels = [],
  boardColumns: providedBoardColumns,
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
    queryKey: queryKeys.tasks.activitiesPage(workspaceId, taskId, taskKey ?? "", page),
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

  const { data: members = [] } = useQuery({
    queryKey: queryKeys.workspaces.members(workspaceId),
    queryFn: async () => {
      const response = await api.get(apiRoutes.WORKSPACES.MEMBERS(workspaceId));
      return normalizeMembersPayload(response.data?.data ?? response.data);
    },
    enabled: Boolean(workspaceId) && !workspaceMembers,
    staleTime: 60_000,
  });

  const { data: workspaceLabels = [] } = useQuery({
    queryKey: queryKeys.workspaces.labels(workspaceId),
    queryFn: () => labelService.listLabels(workspaceId),
    enabled: Boolean(workspaceId),
    staleTime: 60_000,
  });

  const { data: fetchedBoardColumns = [] } = useQuery<BoardColumn[]>({
    queryKey: queryKeys.board.byWorkspace(workspaceId),
    queryFn: async () => {
      const response = await api.get(apiRoutes.WORKSPACES.BOARD(workspaceId));
      const raw = response.data?.data ?? response.data;
      const board = Array.isArray(raw) ? raw[0] : raw;
      return (board?.columns ?? []).map((col: { _id?: string; id?: string; name: string }) => ({
        id: col._id ?? col.id ?? "",
        name: col.name,
      }));
    },
    enabled: Boolean(workspaceId) && !providedBoardColumns?.length,
    staleTime: 60_000,
  });

  const memberNameMap = buildMemberNameMap(workspaceMembers ?? members, [
    { id: assigneeId, name: assigneeName, user: assignee },
  ]);
  const labelNameMap = buildLabelNameMap(workspaceLabels, labels);
  const columnNameMap = buildColumnNameMap(providedBoardColumns?.length ? providedBoardColumns : fetchedBoardColumns);

  // Accumulate pages — replace on page 1 (initial or task change), append on subsequent pages
  useEffect(() => {
    if (!data) return;
    setTotal(data.total);
    setAllActivities((prev) => (page === 1 ? data.activities : [...prev, ...data.activities]));
  }, [data, page]);

  const handleLoadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const visibleActivities = allActivities.filter((activity) => !isRankActivity(activity));
  const hasMore = allActivities.length < total;

  if (isFetching && page === 1 && allActivities.length === 0) {
    return (
      <div className="flex items-center gap-2 pt-2 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading history...
      </div>
    );
  }

  if (error && allActivities.length === 0) {
    return (
      <div className="rounded-[6px] border border-[#F5C6C7] dark:border-[rgba(159,47,45,0.2)] bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)] px-4 py-3 text-[0.8125rem] text-[#9F2F2D] dark:text-[#F87171]">
        Could not load task history.
      </div>
    );
  }

  if (visibleActivities.length === 0 && !isFetching) {
    return (
      <div className="flex items-center gap-2 rounded-[6px] border border-dashed border-[#EAEAEA] dark:border-white/[0.06] px-4 py-5 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
        <Clock className="h-4 w-4" />
        No history recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {visibleActivities.map((activity) => {
        const actorName = getActorName(activity);
        const hasChange =
          Object.prototype.hasOwnProperty.call(activity.metadata ?? {}, "from") ||
          Object.prototype.hasOwnProperty.call(activity.metadata ?? {}, "to");

        return (
          <div key={activity.id} className="flex gap-4">
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-[0.6875rem] font-bold text-white">
              {activity.actor?.avatar ? (
                <img src={activity.actor.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center">{getInitials(actorName)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[#111111] dark:text-[#E8E8E7]">{actorName}</span>
                <span className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                  {getActivityMessage(activity)}
                </span>
                {activity.createdAt && (
                  <span className="text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B]">
                    {formatDateTime(activity.createdAt)}
                  </span>
                )}
              </div>
              {hasChange && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-[4px] bg-[#F7F6F3] dark:bg-[#252525] px-2 py-1 font-mono text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">
                    {formatActivityValue(activity, activity.metadata?.from, memberNameMap, labelNameMap, columnNameMap)}
                  </span>
                  <span className="text-[#ABABAB] dark:text-[#6B6B6B]">→</span>
                  <span className="rounded-[4px] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] px-2 py-1 font-mono font-semibold text-[0.6875rem] text-[#1F6C9F] dark:text-[#93C5FD]">
                    {formatActivityValue(activity, activity.metadata?.to, memberNameMap, labelNameMap, columnNameMap)}
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
            className="flex items-center gap-2 text-[0.8125rem] font-medium text-[#2563EB] dark:text-[#3B82F6] disabled:opacity-60 transition-colors"
          >
            {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
            {isFetching ? "Loading..." : `Load more (${total - allActivities.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}
