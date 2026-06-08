"use client";

import { useCallback, useEffect, useState, use, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/modules/admin/components/common/components/LoadingSpinner";
import Link from "next/link";
import WorkspaceContent from "@/modules/client/workspaces/components/WorkspaceContent";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { boardService } from "@/modules/client/workspaces/services/boardService";
import { BoardColumn } from "@/modules/client/workspaces/types/board.type";
import { sprintService } from "@/modules/client/workspaces/services/sprintService";
import { DropResult } from "@hello-pangea/dnd";

import {
  getWorkspaceTemplate,
  Workspace,
  WorkspaceTab,
} from "@/modules/client/workspaces/types/workspace.type";
import { Issue } from "@/modules/client/workspaces/types/issue.type";
import { Sprint } from "@/modules/client/workspaces/types/sprint.type";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import { useAssignees } from "@/modules/client/workspaces/hooks/useAssignees";
import { taskService } from "@/modules/client/workspaces/services/taskService";
import { resolveWorkspaceFromRouteKey } from "@/modules/client/workspaces/services/resolveWorkspace";

import { filterTasks } from "@/modules/client/workspaces/utils/filterTasks";
import { enrichTaskDetailUsers } from "@/modules/client/workspaces/utils/taskDetailUsers";
import {
  handleBoardDragEnd,
  handleBacklogDragEnd,
  TaskReorderSyncInput,
} from "@/modules/client/workspaces/utils/dragUtils";

import { useTaskHandlers } from "@/modules/client/workspaces/hooks/useTaskHandlers";
import { useSprintHandlers } from "@/modules/client/workspaces/hooks/useSprintHandlers";
import { useColumnHandlers } from "@/modules/client/workspaces/hooks/useColumnHandlers";
import { useSelectionHandlers } from "@/modules/client/workspaces/hooks/useSelectionHandlers";
import { useWorkspacePermission } from "@/modules/client/workspaces/hooks/useWorkspacePermission";
import { useTaskFilters } from "@/modules/client/workspaces/hooks/useTaskFilters";
import { WORKSPACE_PERMISSIONS } from "@/modules/client/workspaces/constants/workspacePermissions";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useTaskRealtime } from "@/hooks/realtime/use-task-realtime";
import { useSprintRealtime } from "@/hooks/realtime/use-sprint-realtime";
import { sprintIdOf } from "@/hooks/realtime/sprint-realtime-cache.utils";
import { sortIssuesByRank, taskIdOf } from "@/hooks/realtime/task-realtime-cache.utils";
import { useWorkspaceSocket } from "@/hooks/useWorkspaceSocket";
import { usePageTitle } from "@/hooks/usePageTitle";

import Header from "@/modules/client/workspaces/components/common/Header";
import Tabs from "@/modules/client/workspaces/components/common/Tabs";

const CreateTaskModal = dynamic(
  () => import("@/modules/client/workspaces/components/tasks/CreateTaskModal"),
  { ssr: false },
);
const SprintModal = dynamic(
  () => import("@/modules/client/workspaces/components/SprintModal"),
  { ssr: false },
);
const StartSprintModal = dynamic(
  () => import("@/modules/client/workspaces/components/StartSprintModal"),
  { ssr: false },
);
const CompleteSprintModal = dynamic(
  () => import("@/modules/client/workspaces/components/CompleteSprintModal"),
  { ssr: false },
);
const TaskDetailDrawer = dynamic(
  () => import("@/modules/client/workspaces/components/TaskDetailDrawer"),
  { ssr: false },
);
const TaskDetailModal = dynamic(
  () => import("@/modules/client/workspaces/components/TaskDetailModal"),
  { ssr: false },
);
const TaskDetailList = dynamic(
  () => import("@/modules/client/workspaces/components/TaskDetailList"),
  { ssr: false },
);
const BulkActionBar = dynamic(
  () => import("@/modules/admin/components/common/components/BulkActionBar"),
  { ssr: false },
);

const getRouteStateFromPath = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  const rawTabSegment = segments[2];
  const tabSegment = rawTabSegment === "key" ? undefined : rawTabSegment as WorkspaceTab | undefined;
  const taskKey =
    rawTabSegment === "key"
      ? segments[3] ?? null
      : tabSegment && segments[3] === "key"
        ? segments[4] ?? null
        : null;

  return { tabSegment, taskKey };
};

const getDefaultWorkspaceTab = (workspace: Workspace): WorkspaceTab =>
  getWorkspaceTemplate(workspace) === "scrum" ? "backlog" : "board";

const isHiddenWorkspaceTab = (tabName: WorkspaceTab | null | undefined) =>
  tabName === "summary";

export default function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ key: string; tab?: string[] }>;
}) {
  const { key: workspaceKey, tab } = use(params);
  const queryClient = useQueryClient();
  const tabFromUrl = tab?.[0];
  const routeInitialTab = tabFromUrl === "key" ? null : (tabFromUrl as WorkspaceTab) || null;
  const initialTab = isHiddenWorkspaceTab(routeInitialTab) ? null : routeInitialTab;
  const initialTaskKey =
    tabFromUrl === "key" ? tab?.[1] ?? null : tabFromUrl && tab?.[1] === "key" ? tab?.[2] ?? null : null;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const workspaceApiId = workspace?._id;
  const { setCurrentWorkspace } = useWorkspaceStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab || "board");

  const pageTitle = workspace?.name
    ? `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} - ${workspace.name}`
    : activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
  usePageTitle(pageTitle);

  const getWorkspaceTabUrl = useCallback(
    (tabName: WorkspaceTab) => `/workspaces/${workspaceKey}/${tabName}`,
    [workspaceKey],
  );

  const getTaskDetailUrl = useCallback(
    (tabName: WorkspaceTab, taskKey: string) => `${getWorkspaceTabUrl(tabName)}/key/${taskKey}`,
    [getWorkspaceTabUrl],
  );

  const handleTabChange = (newTab: WorkspaceTab) => {
    setActiveTab(newTab);
    setSelectedIssue(null);
    setSelectedTaskKey(null);
    setListGridDrawerOpen(false);
    window.history.pushState(null, "", getWorkspaceTabUrl(newTab));
  };

  useEffect(() => {
    const handlePopState = () => {
      const { tabSegment, taskKey } = getRouteStateFromPath(window.location.pathname);
      if (isHiddenWorkspaceTab(tabSegment)) {
        const defaultTab = workspace ? getDefaultWorkspaceTab(workspace) : "board";
        setActiveTab(defaultTab);
        window.history.replaceState(null, "", getWorkspaceTabUrl(defaultTab));
      } else if (tabSegment) {
        setActiveTab(tabSegment as WorkspaceTab);
      } else if (workspace) {
        setActiveTab(getDefaultWorkspaceTab(workspace));
      }
      setSelectedTaskKey(taskKey);
      if (!taskKey) {
        setSelectedIssue(null);
        setListGridDrawerOpen(false);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [getWorkspaceTabUrl, workspace]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const isDraggingIssueRef = useRef(false);
  const reorderInFlightRef = useRef(new Set<string>());
  const pendingReorderRef = useRef(new Map<string, TaskReorderSyncInput>());

  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [newIssueForm, setNewIssueForm] = useState<{
    title: string;
    type: string;
    priority: string;
    status: string;
    sprintId: string | null;
    assigneeId: string;
    columnId?: string | null;
  }>({
    title: "",
    type: "Task",
    priority: "Medium",
    status: "To Do",
    sprintId: null,
    assigneeId: "",
    columnId: null,
  });
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedTaskKey, setSelectedTaskKey] = useState<string | null>(initialTaskKey);

  const { filters, setFilters, taskFilters } = useTaskFilters(workspaceApiId ?? "");
  const fallbackTaskFilters = useMemo(() => ({
    ...taskFilters,
    search: undefined,
  }), [taskFilters]);
  const [density, setDensity] = useState<"default" | "compact">("default");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [showCreateColumn, setShowCreateColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const columnsEndRef = useRef<HTMLDivElement>(null);

  const { data: boardData, isLoading: isBoardLoading } = useQuery({
    queryKey: ["board", workspaceApiId],
    queryFn: () => boardService.getBoardByWorkspace(workspaceApiId!),
    enabled: !!workspaceApiId,
    staleTime: 30_000,
  });

  const { data: sprintsData } = useQuery({
    queryKey: ["sprints", workspaceApiId],
    queryFn: () => sprintService.listSprints(workspaceApiId!),
    enabled: !!workspaceApiId && workspace?.type === "scrum",
    staleTime: 30_000,
  });

  const {
    data: tasksData,
    error: tasksError,
    isFetching: isTasksFetching,
  } = useQuery({
    queryKey: ["tasks", workspaceApiId, taskFilters],
    queryFn: () => taskService.getBoardTasks(workspaceApiId!, taskFilters),
    enabled: !!workspaceApiId,
    staleTime: 30_000,
  });
  const shouldUseFallbackTaskSearch =
    !!workspaceApiId &&
    Boolean(filters.search.trim()) &&
    !isTasksFetching &&
    Array.isArray(tasksData) &&
    tasksData.length === 0;
  const { data: fallbackTasksData, isFetching: isFallbackTasksFetching } = useQuery({
    queryKey: ["tasks-fallback-search", workspaceApiId, fallbackTaskFilters],
    queryFn: () => taskService.getBoardTasks(workspaceApiId!, fallbackTaskFilters),
    enabled: shouldUseFallbackTaskSearch,
    staleTime: 30_000,
  });
  const isTaskBoardFetching = isTasksFetching || isFallbackTasksFetching;

  const [archivePage, setArchivePage] = useState(1);
  const [archivedItems, setArchivedItems] = useState<Issue[]>([]);
  const [archiveTotal, setArchiveTotal] = useState(0);

  const { data: archivePageData, isFetching: isArchivedTasksFetching } = useQuery({
    queryKey: ["archivedTasks", workspaceApiId, archivePage],
    queryFn: () =>
      taskService.getArchivedTasks(workspaceApiId!, {
        page: archivePage,
        limit: 20,
        sortBy: "archivedAt",
        sortOrder: "desc",
      }),
    enabled: !!workspaceApiId && activeTab === "archive",
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!archivePageData) return;
    setArchiveTotal(archivePageData.total);
    setArchivedItems((prev) =>
      archivePage === 1
        ? archivePageData.tasks
        : [...prev, ...archivePageData.tasks],
    );
  }, [archivePageData, archivePage]);

  const resetArchiveList = useCallback(() => {
    setArchivePage(1);
    setArchivedItems([]);
    setArchiveTotal(0);
  }, []);

  const handleLoadMoreArchive = useCallback(() => {
    setArchivePage((p) => p + 1);
  }, []);

  const {
    data: selectedTaskDetail,
  } = useQuery({
    queryKey: ["taskDetail", workspaceApiId, selectedTaskKey],
    queryFn: () => taskService.getBoardTaskDetail(workspaceApiId!, selectedTaskKey!),
    enabled: !!workspaceApiId && !!selectedTaskKey,
    staleTime: 30_000,
  });

  const activeIssueDetail = useMemo(() => {
    if (selectedTaskDetail && workspace) {
      return enrichTaskDetailUsers(selectedTaskDetail, workspace.members);
    }

    return selectedTaskDetail ?? selectedIssue;
  }, [selectedIssue, selectedTaskDetail, workspace]);

  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const handleRealtimeTaskUpserted = useCallback((issue: Issue) => {
    const nextIssueId = taskIdOf(issue);

    setIssues((current) => {
      const next = current.some((item) => taskIdOf(item) === nextIssueId)
        ? current.map((item) =>
            taskIdOf(item) === nextIssueId ? { ...item, ...issue } : item,
          )
        : [...current, issue];

      return sortIssuesByRank(next);
    });
    setSelectedIssue((current) =>
      current && taskIdOf(current) === nextIssueId
        ? { ...current, ...issue }
        : current,
    );
  }, []);

  const handleRealtimeTaskRemoved = useCallback((taskId: string) => {
    setIssues((current) =>
      current.filter((issue) => issue.id !== taskId && issue._id !== taskId),
    );
    setSelectedIssue((current) =>
      current && (current.id === taskId || current._id === taskId) ? null : current,
    );
    setSelectedTaskIds((current) => current.filter((id) => id !== taskId));
  }, []);

  const handleRealtimeSprintCreated = useCallback((sprint: Sprint) => {
    const nextSprintId = sprintIdOf(sprint);

    setSprints((current) => {
      const exists = current.some((item) => sprintIdOf(item) === nextSprintId);

      if (exists) {
        return current.map((item) =>
          sprintIdOf(item) === nextSprintId ? { ...item, ...sprint } : item,
        );
      }

      return [...current, sprint];
    });
  }, []);

  useWorkspaceSocket(workspaceApiId);
  useTaskRealtime(workspaceApiId, {
    onTaskRemoved: handleRealtimeTaskRemoved,
    onTaskUpserted: handleRealtimeTaskUpserted,
  });
  useSprintRealtime(workspaceApiId, {
    onSprintCreated: handleRealtimeSprintCreated,
  });

  useEffect(() => {
    if (boardData?.columns) {
      setColumns(boardData.columns);
    }
  }, [boardData]);

  useEffect(() => {
    if (sprintsData) setSprints(sprintsData);
  }, [sprintsData]);

  useEffect(() => {
    const nextTasksData = shouldUseFallbackTaskSearch && fallbackTasksData
      ? fallbackTasksData
      : tasksData;

    if (!nextTasksData) return;
    if (isDraggingIssueRef.current) return;

    setIssues(nextTasksData);
    if (selectedTaskKey && !selectedIssue) {
      const matchingIssue = nextTasksData.find((issue) => issue.key === selectedTaskKey);
      if (matchingIssue) setSelectedIssue(matchingIssue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallbackTasksData, selectedTaskKey, shouldUseFallbackTaskSearch, tasksData]); // isDraggingIssue intentionally omitted: firing on drag-end would overwrite optimistic state with stale server data

  const [listViewMode, setListViewMode] = useState<"grid" | "split">("grid");
  const [listGridDrawerOpen, setListGridDrawerOpen] = useState(false);

  const filteredIssues = useMemo(() => {
    return filterTasks(issues, filters, workspace);
  }, [issues, filters, workspace]);

  const uniqueAssignees = useAssignees(issues);
  const workspacePermissions = useWorkspacePermission(workspaceApiId ?? "", workspace);
  const canCreateTask = workspacePermissions.hasPermission(WORKSPACE_PERMISSIONS.TASK_CREATE);
  const canEditTask = workspacePermissions.hasPermission(WORKSPACE_PERMISSIONS.TASK_EDIT);
  const canDeleteTask = workspacePermissions.hasPermission(WORKSPACE_PERMISSIONS.TASK_DELETE);
  const canMoveTask = workspacePermissions.hasPermission(WORKSPACE_PERMISSIONS.TASK_MOVE);
  const canManageSprint = workspacePermissions.hasPermission(WORKSPACE_PERMISSIONS.SPRINT_MANAGE);
  const canUpdateWorkspace = workspacePermissions.hasPermission(
    WORKSPACE_PERMISSIONS.WORKSPACE_UPDATE,
  );

  const {
    handleCreateIssue,
    handleUpdateIssue,
    handleUpdateIssueDate,
    updateIssueDirectly,
    handleQuickCreateTask,
    handleQuickCreateCalendarTask,
    handleCreateTaskFromList,
  } = useTaskHandlers({
    workspaceId: workspaceApiId ?? "",
    issues,
    setIssues,
    setShowCreateIssue,
    setNewIssueForm,
    setSelectedIssue,
  });

  const openTaskDetail = useCallback((issue: Issue) => {
    if (!issue.key) {
      toast.error("Task key not found");
      return;
    }

    setSelectedIssue(issue);
    setSelectedTaskKey(issue.key);

    const detailUrl = getTaskDetailUrl(activeTab, issue.key);
    window.history.pushState({ ...window.history.state, as: detailUrl }, "", detailUrl);
  }, [activeTab, getTaskDetailUrl]);

  const closeTaskDetail = useCallback(() => {
    const shouldResetUrl = Boolean(selectedTaskKey);

    setSelectedIssue(null);
    setSelectedTaskKey(null);
    setListGridDrawerOpen(false);

    if (shouldResetUrl) {
      const baseUrl = getWorkspaceTabUrl(activeTab);
      window.history.pushState({ ...window.history.state, as: baseUrl }, "", baseUrl);
    }
  }, [activeTab, getWorkspaceTabUrl, selectedTaskKey]);

  const detailUrl = activeIssueDetail?.key
    ? getTaskDetailUrl(activeTab, activeIssueDetail.key)
    : undefined;

  const handleListTaskSelection = useCallback((issue: Issue | null) => {
    if (issue) {
      openTaskDetail(issue);
      return;
    }

    closeTaskDetail();
  }, [closeTaskDetail, openTaskDetail]);

  const isNoopReorderError = (error: any) => {
    const message = error?.response?.data?.message;
    return (
      error?.response?.status === 400 &&
      typeof message === "string" &&
      message.includes("Reorder did not change task position")
    );
  };

  const syncTaskReorder = useCallback(
    (input: TaskReorderSyncInput) => {
      if (!workspaceApiId) return;
      const { taskId, columnId, status, sprintId, rankScope, beforeTaskId, afterTaskId } = input;

      if (reorderInFlightRef.current.has(taskId)) {
        pendingReorderRef.current.set(taskId, input);
        return;
      }

      reorderInFlightRef.current.add(taskId);

      taskService
        .reorderBoardTask(workspaceApiId, taskId, {
          columnId,
          status,
          sprintId,
          rankScope,
          beforeTaskId,
          afterTaskId,
        })
        .then((updatedTask) => {
          const hasQueuedReorder = pendingReorderRef.current.has(taskId);

          if (!hasQueuedReorder) {
            setIssues((current) =>
              current.map((issue) =>
                issue.id === updatedTask.id ? updatedTask : issue,
              ),
            );
            queryClient.setQueriesData<Issue[]>(
              { queryKey: ["tasks", workspaceApiId] },
              (current) =>
                Array.isArray(current)
                  ? current.map((issue) =>
                      issue.id === updatedTask.id ? updatedTask : issue,
                    )
                  : current,
            );
          }

          queryClient.invalidateQueries({
            queryKey: ["taskActivities", workspaceApiId, taskId],
          });
        })
        .catch((error) => {
          if (isNoopReorderError(error)) return;

          queryClient.invalidateQueries({ queryKey: ["tasks", workspaceApiId] });
          toast.error(error?.response?.data?.message || "Could not update task position");
        })
        .finally(() => {
          reorderInFlightRef.current.delete(taskId);
          const queuedReorder = pendingReorderRef.current.get(taskId);

          if (queuedReorder) {
            pendingReorderRef.current.delete(taskId);
            window.setTimeout(() => syncTaskReorder(queuedReorder), 0);
          }
        });
    },
    [queryClient, workspaceApiId],
  );

  const activeSprint = sprints.find(s => s.status === "active") ?? null;

  const handleOpenGlobalCreateIssue = useCallback(() => {
    if (activeTab === "board" && workspace?.type === "scrum" && activeSprint) {
      const firstColumn = columns[0];
      setNewIssueForm(prev => ({
        ...prev,
        sprintId: activeSprint._id,
        columnId: firstColumn?.id ?? null,
        status: firstColumn?.name ?? "To Do",
      }));
    }
    setShowCreateIssue(true);
  }, [activeTab, workspace, activeSprint, columns]);

  const {
    handleAddColumn,
    handleRenameColumn,
    handleDeleteColumn,
    handleMoveColumn,
  } = useColumnHandlers({
    workspaceId: workspaceApiId ?? "",
    columns,
    newColumnName,
    setColumns,
    setNewColumnName,
    setShowCreateColumn,
    columnsEndRef,
  });

  const {
    handleCreateSprint,
    handleSaveSprint,
    handleEditSprint,
    handleDeleteSprint,
    handleStartSprint,
    handleCompleteSprint,
    handleConfirmStartSprint,
    handleConfirmCompleteSprint,
    startSprintTarget,
    setStartSprintTarget,
    completeSprintTarget,
    setCompleteSprintTarget,
  } = useSprintHandlers({
    workspaceId: workspaceApiId ?? "",
    sprints,
    editingSprint,
    setSprints,
    setEditingSprint,
    setIsSprintModalOpen,
    setIssues,
  });

  const handleBacklogDragEndWithSync = (result: DropResult) => {
    handleBacklogDragEnd({
      result,
      issues: filteredIssues,
      setIssues,
      onTaskReorder: syncTaskReorder,
      onSprintAssign: (taskId, sprintId) => {
        if (workspaceApiId) {
          taskService.updateBoardTask(workspaceApiId, taskId, { sprintId: sprintId ?? undefined })
            .then(() => {
              queryClient.invalidateQueries({ queryKey: ["taskActivities", workspaceApiId, taskId] });
            })
            .catch((error) => {
              queryClient.invalidateQueries({ queryKey: ["tasks", workspaceApiId] });
              toast.error(error?.response?.data?.message || "Could not update task sprint");
            });
        }
      },
    });
    isDraggingIssueRef.current = false;
  };

  const handleArchiveIssue = async (issue: Issue) => {
    if (!workspaceApiId || !issue.id) {
      toast.error("Task ID not found");
      return;
    }

    try {
      await taskService.archiveBoardTask(workspaceApiId, issue.id);
      setIssues((current) => current.filter((item) => item.id !== issue.id));
      setSelectedIssue(null);
      resetArchiveList();
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceApiId] });
      toast.success("Work item archived");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not archive work item");
    }
  };

  const handleRestoreIssue = async (issue: Issue) => {
    if (!workspaceApiId || !issue.id) {
      toast.error("Task ID not found");
      return;
    }

    try {
      const restoredIssue = await taskService.restoreBoardTask(workspaceApiId, issue.id);
      setIssues((current) =>
        current.some((item) => item.id === restoredIssue.id)
          ? current.map((item) => item.id === restoredIssue.id ? restoredIssue : item)
          : [...current, restoredIssue],
      );
      resetArchiveList();
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceApiId] });
      toast.success("Work item restored");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not restore work item");
    }
  };

  const handleDeleteIssue = async (issue: Issue) => {
    if (!workspaceApiId || !issue.id) {
      toast.error("Task ID not found");
      return;
    }

    try {
      await taskService.deleteBoardTask(workspaceApiId, issue.id);
      setIssues((current) => current.filter((item) => item.id !== issue.id));
      setSelectedTaskIds((current) => current.filter((id) => id !== issue.id));
      setSelectedIssue((current) => current?.id === issue.id ? null : current);
      resetArchiveList();
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceApiId] });
      toast.success("Work item deleted");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not delete work item");
    }
  };

  const {
    toggleTaskSelection,
    toggleSprintSelection,
    handleBulkStatusChange,
    handleBulkMoveSprint,
    handleBulkDelete,
  } = useSelectionHandlers({
    workspaceId: workspaceApiId ?? "",
    issues,
    selectedTaskIds,
    setIssues,
    setSelectedTaskIds,
  });

  useEffect(() => {
    if (activeTab !== "list") {
      setListGridDrawerOpen(false);
      if (listViewMode === "split") setSelectedIssue(null);
    }
  }, [activeTab, listViewMode]);

  useEffect(() => {
    if (!workspaceKey) return;

    let isActive = true;
    setLoading(true);

    resolveWorkspaceFromRouteKey(workspaceKey)
      .then(async (nextWorkspace) => {
        let workspaceMembers = nextWorkspace.members ?? [];

        try {
          const membersResponse = await api.get(apiRoutes.WORKSPACES.MEMBERS(nextWorkspace._id));
          workspaceMembers = membersResponse.data?.data ?? membersResponse.data ?? workspaceMembers;
        } catch {
          workspaceMembers = nextWorkspace.members ?? [];
        }

        const workspaceWithMembers = {
          ...nextWorkspace,
          members: workspaceMembers,
        };
        if (!isActive) return;

        setWorkspace(workspaceWithMembers);
        setCurrentWorkspace(workspaceWithMembers as any);
        if (!initialTab) {
          const defaultTab = getDefaultWorkspaceTab(nextWorkspace);
          setActiveTab(defaultTab);
          const nextUrl = initialTaskKey
            ? getTaskDetailUrl(defaultTab, initialTaskKey)
            : getWorkspaceTabUrl(defaultTab);
          window.history.replaceState(null, "", nextUrl);
        }
      })
      .catch(() => { })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [getTaskDetailUrl, getWorkspaceTabUrl, initialTab, initialTaskKey, setCurrentWorkspace, workspaceKey]);

  if (loading || isBoardLoading) return <LoadingSpinner />;

  if (tasksError) {
    const errorData = (tasksError as any).response?.data;
    const status = (tasksError as any).response?.status;
    let errorMessage = "An error occurred while loading board data";
    if (status === 401) errorMessage = "Your session has expired. Please sign in again.";
    if (status === 403) errorMessage = "You do not have permission to access this workspace.";
    if (status === 404) errorMessage = "Workspace does not exist.";
    if (status === 400) errorMessage = "Invalid filters.";
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-500 mb-4">{errorMessage}</p>
        <button onClick={() => window.location.reload()} className="text-indigo-600 hover:text-indigo-800">Reload page</button>
      </div>
    );
  }

  if (!workspace)
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500 mb-4">
          Workspace not found
        </p>
        <Link href="/workspaces" className="text-indigo-600 hover:text-indigo-800">
          Back to workspace list
        </Link>
      </div>
    );

  return (
    <div className="workspace-surface pb-12">
      {/* Header */}
      <Header
        workspace={workspace}
        workspaceId={workspaceKey}
        setShowCreateIssue={handleOpenGlobalCreateIssue}
        canCreateTask={canCreateTask}
        canUpdateWorkspace={canUpdateWorkspace}
      />



      {/* Tabs */}
      <Tabs workspace={workspace} activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Content Area */}
      <WorkspaceContent
        activeTab={activeTab}
        workspace={workspace}
        workspaceId={workspace._id}
        boardProps={{
          data: {
            columns,
            issues,
            filteredIssues,
            uniqueAssignees,
            workspace,
            activeSprint,
          },
          ui: {
            filters,
            newIssueForm,
            showCreateColumn,
            newColumnName,
            isFetching: isTaskBoardFetching,
          },
          actions: {
            setFilters,
            setColumns,
            setIssues,
            setSelectedIssue: openTaskDetail,
            updateIssueDirectly,
            setNewIssueForm,
            setShowCreateIssue,
            setShowCreateColumn,
            setNewColumnName,
            handleBoardDragStart: () => { isDraggingIssueRef.current = true; },
            handleBoardDragEnd: (result: any) => {
              if (!canMoveTask) return;
              handleBoardDragEnd({
                result,
                columns,
                issues: filteredIssues,
                setColumns,
                setIssues,
                handleMoveColumn,
                onTaskReorder: syncTaskReorder,
                onColumnChange: (taskId, columnId) => {
                  if (workspaceApiId) {
                    taskService.moveBoardTask(workspaceApiId, taskId, { columnId })
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ["taskActivities", workspaceApiId, taskId] });
                      })
                      .catch((error) => {
                        if (isNoopReorderError(error)) return;
                        queryClient.invalidateQueries({ queryKey: ["tasks", workspaceApiId] });
                        toast.error(error?.response?.data?.message || "Could not update task position");
                      });
                  }
                },
              });
              isDraggingIssueRef.current = false;
            },
            handleAddColumn,
            handleRenameColumn,
            handleDeleteColumn,
            handleMoveColumn,
            onArchiveIssue: canDeleteTask ? handleArchiveIssue : undefined,
            onDeleteIssue: canDeleteTask ? handleDeleteIssue : undefined,
          },
          refs: {
            columnsEndRef,
          },
          permissions: {
            canCreateTask,
            canEditTask,
            canMoveTask,
            canUpdateWorkspace,
            canArchiveTask: canDeleteTask,
          },
        }}
        backlogProps={{
          data: {
            issues,
            filteredIssues,
            sprints,
            uniqueAssignees,
            selectedTaskIds,
            workspace,
          },
          ui: {
            density,
            filters,
            isFilterOpen,
            newIssueForm,
          },
          actions: {
            handleBacklogDragStart: () => { isDraggingIssueRef.current = true; },
            handleBacklogDragEnd: handleBacklogDragEndWithSync,
            setIssues,
            setDensity,
            setFilters,
            setIsFilterOpen,
            toggleTaskSelection,
            toggleSprintSelection,
            updateIssueDirectly,
            setSelectedIssue: openTaskDetail,
            setNewIssueForm,
            setShowCreateIssue,
            handleCreateSprint,
            setEditingSprint,
            setIsSprintModalOpen,
            handleStartSprint,
            handleCompleteSprint,
            handleEditSprint,
            handleDeleteSprint,
            handleQuickCreateTask,
          },
          permissions: {
            canCreateTask,
            canEditTask,
            canMoveTask,
            canManageSprint,
          },
        }}
        timelineProps={{
          filteredIssues,
          sprints,
          handleUpdateIssueDate,
          setSelectedIssue: openTaskDetail,
          canMoveTask,
        }}
        listProps={{
          filteredIssues,
          selectedIssue: activeTab === "list" ? (activeIssueDetail as Issue | null) : selectedIssue,
          workspaceKey: workspace.key,
          workspaceId: workspace._id,
          sprints,
          workspaceTemplate: getWorkspaceTemplate(workspace),
          listViewMode,
          listGridDrawerOpen,
          filters,
          setFilters,
          uniqueAssignees,
          members: workspace.members,
          boardColumns: columns,
          setSelectedIssue: handleListTaskSelection,
          setListViewMode,
          setListGridDrawerOpen,
          updateIssueDirectly,
          handleUpdateIssue,
          onBulkDeleteIds: (ids: string[]) => setIssues(prev => prev.filter(i => !ids.includes(i.id))),
          onCreateTask: canCreateTask ? handleCreateTaskFromList : undefined,
        }}
        summaryProps={{
          issues,
          workspaceId: workspace._id,
          workspaceMongoId: workspace?._id,
        }}
        calendarProps={{
          issues,
          sprints,
          handleUpdateIssueDate,
          setSelectedIssue: openTaskDetail,
          onQuickCreateTask: canCreateTask ? handleQuickCreateCalendarTask : undefined,
        }}
        archiveProps={{
          issues: archivedItems,
          isLoading: isArchivedTasksFetching && archivePage === 1 && archivedItems.length === 0,
          onRestore: handleRestoreIssue,
          total: archiveTotal,
          onLoadMore: handleLoadMoreArchive,
          isLoadingMore: isArchivedTasksFetching && archivePage > 1,
        }}
      />

      {/* Create Issue Modal */}
      {showCreateIssue && (
        <CreateTaskModal
          showCreateIssue={showCreateIssue}
          setShowCreateIssue={setShowCreateIssue}
          newIssueForm={newIssueForm}
          setNewIssueForm={setNewIssueForm}
          handleCreateIssue={handleCreateIssue}
          workspace={workspace}
        />
      )}

      {/* Sprint Modal */}
      <SprintModal
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        onSave={handleSaveSprint}
        initialData={editingSprint}
        sprintCount={sprints.length}
      />

      {/* Start Sprint Modal */}
      {startSprintTarget && (
        <StartSprintModal
          isOpen={!!startSprintTarget}
          onClose={() => setStartSprintTarget(null)}
          onConfirm={handleConfirmStartSprint}
          sprint={startSprintTarget}
        />
      )}

      {/* Complete Sprint Modal */}
      {completeSprintTarget && (
        <CompleteSprintModal
          isOpen={!!completeSprintTarget}
          onClose={() => setCompleteSprintTarget(null)}
          onConfirm={handleConfirmCompleteSprint}
          sprint={completeSprintTarget}
          sprints={sprints}
          workspaceId={workspace._id}
        />
      )}

      {/* Issue detail modal/drawer */}
      {activeIssueDetail && (activeTab === "timeline" || activeTab === "calendar") ? (
        <TaskDetailDrawer
          isOpen={!!activeIssueDetail}
          issue={activeIssueDetail}
          workspaceId={workspace._id}
          workspaceMembers={workspace.members}
          sprints={sprints}
          boardColumns={columns}
          workspaceTemplate={getWorkspaceTemplate(workspace)}
          onClose={closeTaskDetail}
          onUpdateIssue={handleUpdateIssue}
          onArchiveIssue={canDeleteTask ? handleArchiveIssue : undefined}
          detailUrl={detailUrl}
        />
      ) : activeIssueDetail && activeTab !== "list" ? (
        <TaskDetailModal
          issue={activeIssueDetail}
          workspaceId={workspace._id}
          workspaceMembers={workspace.members}
          sprints={sprints}
          boardColumns={columns}
          workspaceTemplate={getWorkspaceTemplate(workspace)}
          onClose={closeTaskDetail}
          onUpdateIssue={handleUpdateIssue}
          onArchiveIssue={canDeleteTask ? handleArchiveIssue : undefined}
          detailUrl={detailUrl}
        />
      ) : null}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedTaskIds.length}
        onClear={() => setSelectedTaskIds([])}
        onChangeStatus={handleBulkStatusChange}
        onDelete={handleBulkDelete}
        sprints={sprints}
        onMoveSprint={handleBulkMoveSprint}
        canEditTask={canEditTask}
        canDeleteTask={canDeleteTask}
        canMoveTask={canMoveTask}
      />
    </div>
  );
}
