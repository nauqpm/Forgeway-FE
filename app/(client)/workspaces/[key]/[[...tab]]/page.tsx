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

import { filterIssues } from "@/modules/client/workspaces/utils/filterIssues";
import { enrichTaskDetailUsers } from "@/modules/client/workspaces/utils/taskDetailUsers";
import {
  handleBoardDragEnd,
  handleBacklogDragEnd,
  TaskReorderSyncInput,
} from "@/modules/client/workspaces/utils/dragUtils";

import { useIssueHandlers } from "@/modules/client/workspaces/hooks/useIssueHandlers";
import { useSprintHandlers } from "@/modules/client/workspaces/hooks/useSprintHandlers";
import { useColumnHandlers } from "@/modules/client/workspaces/hooks/useColumnHandlers";
import { useSelectionHandlers } from "@/modules/client/workspaces/hooks/useSelectionHandlers";
import { useWorkspacePermission } from "@/modules/client/workspaces/hooks/useWorkspacePermission";
import { useTaskFilters } from "@/modules/client/workspaces/hooks/useTaskFilters";
import { WORKSPACE_PERMISSIONS } from "@/modules/client/workspaces/constants/workspacePermissions";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useWorkspaceSocket } from "@/hooks/useWorkspaceSocket";

import Header from "@/modules/client/workspaces/components/common/Header";
import Tabs from "@/modules/client/workspaces/components/common/Tabs";

const CreateIssueModal = dynamic(
  () => import("@/modules/client/workspaces/components/issues/CreateIssueModal"),
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
  const tabSegment = segments[2] as WorkspaceTab | undefined;
  const taskKey = tabSegment && segments[3] === "key" ? segments[4] ?? null : null;

  return { tabSegment, taskKey };
};

export default function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ key: string; tab?: string[] }>;
}) {
  const { key: workspaceKey, tab } = use(params);
  const queryClient = useQueryClient();
  const tabFromUrl = tab?.[0];
  const initialTab = (tabFromUrl as WorkspaceTab) || null;
  const initialTaskKey = tabFromUrl && tab?.[1] === "key" ? tab?.[2] ?? null : null;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const workspaceApiId = workspace?._id;
  const { setCurrentWorkspace } = useWorkspaceStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab || "board");

  const handleTabChange = (newTab: WorkspaceTab) => {
    setActiveTab(newTab);
    setSelectedIssue(null);
    setSelectedTaskKey(null);
    setListGridDrawerOpen(false);
    window.history.pushState(null, "", `/workspaces/${workspaceKey}/${newTab}`);
  };

  useEffect(() => {
    const handlePopState = () => {
      const { tabSegment, taskKey } = getRouteStateFromPath(window.location.pathname);
      if (tabSegment) {
        setActiveTab(tabSegment as WorkspaceTab);
      } else if (workspace) {
        const template = getWorkspaceTemplate(workspace);
        setActiveTab(template === "scrum" ? "backlog" : "board");
      }
      setSelectedTaskKey(taskKey);
      if (!taskKey) {
        setSelectedIssue(null);
        setListGridDrawerOpen(false);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [workspace, workspaceKey]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isDraggingIssue, setIsDraggingIssue] = useState(false);
  const reorderInFlightRef = useRef(new Set<string>());

  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [newIssueForm, setNewIssueForm] = useState<{
    title: string;
    type: string;
    priority: string;
    status: string;
    sprintId: string | null;
    assigneeId: string;
  }>({
    title: "",
    type: "Task",
    priority: "Medium",
    status: "To Do",
    sprintId: null,
    assigneeId: "",
  });
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedTaskKey, setSelectedTaskKey] = useState<string | null>(initialTaskKey);

  const { filters, setFilters, taskFilters } = useTaskFilters(workspaceApiId ?? "");
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

  useWorkspaceSocket(workspaceApiId);

  useEffect(() => {
    if (boardData?.columns) {
      setColumns(boardData.columns);
    }
  }, [boardData]);

  useEffect(() => {
    if (sprintsData) setSprints(sprintsData);
  }, [sprintsData]);

  useEffect(() => {
    if (!tasksData) return;
    if (isDraggingIssue) return;

    setIssues(tasksData);
    if (selectedTaskKey && !selectedIssue) {
      const matchingIssue = tasksData.find((issue) => issue.key === selectedTaskKey);
      if (matchingIssue) setSelectedIssue(matchingIssue);
    }
  }, [isDraggingIssue, selectedIssue, selectedTaskKey, tasksData]);

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const [listViewMode, setListViewMode] = useState<"grid" | "split">("grid");
  const [listGridDrawerOpen, setListGridDrawerOpen] = useState(false);

  const filteredIssues = useMemo(() => {
    return filterIssues(issues, filters, workspace);
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
  } = useIssueHandlers({
    workspaceId: workspaceApiId ?? "",
    issues,
    setIssues,
    setShowCreateIssue,
    setNewIssueForm,
    setSelectedIssue,
  });

  const openTaskDetail = useCallback((issue: Issue) => {
    if (!issue.key) {
      toast.error("Khong tim thay task key");
      return;
    }

    setSelectedIssue(issue);
    setSelectedTaskKey(issue.key);

    const detailUrl = `/workspaces/${workspaceKey}/${activeTab}/key/${issue.key}`;
    window.history.pushState({ ...window.history.state, as: detailUrl }, "", detailUrl);
  }, [activeTab, workspaceKey]);

  const closeTaskDetail = useCallback(() => {
    const shouldResetUrl = Boolean(selectedTaskKey);

    setSelectedIssue(null);
    setSelectedTaskKey(null);
    setListGridDrawerOpen(false);

    if (shouldResetUrl) {
      const baseUrl = `/workspaces/${workspaceKey}/${activeTab}`;
      window.history.pushState({ ...window.history.state, as: baseUrl }, "", baseUrl);
    }
  }, [activeTab, selectedTaskKey, workspaceKey]);

  const detailUrl = activeIssueDetail?.key
    ? `/workspaces/${workspaceKey}/${activeTab}/key/${activeIssueDetail.key}`
    : undefined;

  const isNoopReorderError = (error: any) => {
    const message = error?.response?.data?.message;
    return (
      error?.response?.status === 400 &&
      typeof message === "string" &&
      message.includes("Reorder did not change task position")
    );
  };

  const syncTaskReorder = useCallback(
    ({ taskId, columnId, status, sprintId, beforeTaskId, afterTaskId }: TaskReorderSyncInput) => {
      if (!workspaceApiId) return;
      if (reorderInFlightRef.current.has(taskId)) return;

      reorderInFlightRef.current.add(taskId);

      taskService
        .reorderBoardTask(workspaceApiId, taskId, {
          columnId,
          status,
          sprintId,
          beforeTaskId,
          afterTaskId,
        })
        .then((updatedTask) => {
          setIssues((current) =>
            current.map((issue) =>
              issue.id === updatedTask.id ? updatedTask : issue,
            ),
          );
          queryClient.invalidateQueries({
            queryKey: ["taskActivities", workspaceApiId, taskId],
          });
        })
        .catch((error) => {
          if (isNoopReorderError(error)) return;

          queryClient.invalidateQueries({ queryKey: ["tasks", workspaceApiId] });
          toast.error(error?.response?.data?.message || "Khong cap nhat duoc vi tri task");
        })
        .finally(() => {
          reorderInFlightRef.current.delete(taskId);
        });
    },
    [queryClient, workspaceApiId],
  );

  const activeSprint = sprints.find(s => s.status === "active") ?? null;

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
    setIsDraggingIssue(false);
    handleBacklogDragEnd({
      result,
      issues,
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
              toast.error(error?.response?.data?.message || "Khong cap nhat duoc sprint cua task");
            });
        }
      },
    });
  };

  const handleArchiveIssue = async (issue: Issue) => {
    if (!workspaceApiId || !issue.id) {
      toast.error("Khong tim thay task id");
      return;
    }

    try {
      await taskService.archiveBoardTask(workspaceApiId, issue.id);
      setIssues((current) => current.filter((item) => item.id !== issue.id));
      setSelectedIssue(null);
      resetArchiveList();
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceApiId] });
      toast.success("Đã archive work item");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Khong archive duoc work item");
    }
  };

  const handleRestoreIssue = async (issue: Issue) => {
    if (!workspaceApiId || !issue.id) {
      toast.error("Khong tim thay task id");
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
      toast.success("Đã restore work item");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Khong restore duoc work item");
    }
  };

  const handleDeleteIssue = async (issue: Issue) => {
    if (!workspaceApiId || !issue.id) {
      toast.error("Khong tim thay task id");
      return;
    }

    try {
      await taskService.deleteBoardTask(workspaceApiId, issue.id);
      setIssues((current) => current.filter((item) => item.id !== issue.id));
      setSelectedTaskIds((current) => current.filter((id) => id !== issue.id));
      setSelectedIssue((current) => current?.id === issue.id ? null : current);
      resetArchiveList();
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceApiId] });
      toast.success("Đã delete work item");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Khong delete duoc work item");
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
        const template = getWorkspaceTemplate(nextWorkspace);

        if (!isActive) return;

        setWorkspace(workspaceWithMembers);
        setCurrentWorkspace(workspaceWithMembers as any);
        if (!initialTab) {
          const defaultTab = template === "scrum" ? "backlog" : "board";
          setActiveTab(defaultTab);
          window.history.replaceState(null, "", `/workspaces/${workspaceKey}/${defaultTab}`);
        }
      })
      .catch(() => { })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [initialTab, setCurrentWorkspace, workspaceKey]);

  if (loading || isBoardLoading) return <LoadingSpinner />;

  if (tasksError) {
    const errorData = (tasksError as any).response?.data;
    const status = (tasksError as any).response?.status;
    let errorMessage = "Đã xảy ra lỗi khi tải dữ liệu board";
    if (status === 401) errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (status === 403) errorMessage = "Bạn không có quyền truy cập workspace này.";
    if (status === 404) errorMessage = "Workspace không tồn tại.";
    if (status === 400) errorMessage = "Bộ lọc không hợp lệ.";
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-500 mb-4">{errorMessage}</p>
        <button onClick={() => window.location.reload()} className="text-indigo-600 hover:text-indigo-800">Tải lại trang</button>
      </div>
    );
  }

  if (!workspace)
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500 mb-4">
          Không tìm thấy không gian (Workspace) này
        </p>
        <Link href="/workspaces" className="text-indigo-600 hover:text-indigo-800">
          Quay lại danh sách Workspace
        </Link>
      </div>
    );

  return (
    <div className="workspace-surface pb-12">
      {/* Header */}
      <Header
        workspace={workspace}
        workspaceId={workspaceKey}
        setShowCreateIssue={setShowCreateIssue}
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
            isFetching: isTasksFetching,
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
            handleBoardDragStart: () => setIsDraggingIssue(true),
            handleBoardDragEnd: (result: any) => {
              setIsDraggingIssue(false);
              return canMoveTask
                ? handleBoardDragEnd({
                  result,
                  columns,
                  issues,
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

                          toast.error(error?.response?.data?.message || "Khong cap nhat duoc vi tri task");

                        });
                    }
                  },
                })
                : undefined;
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
            handleBacklogDragStart: () => setIsDraggingIssue(true),
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
        }}
        listProps={{
          filteredIssues,
          selectedIssue,
          workspaceKey: workspace.key,
          workspaceId: workspace._id,
          listViewMode,
          listGridDrawerOpen,
          setSelectedIssue,
          onOpenIssue: openTaskDetail,
          setListViewMode,
          setListGridDrawerOpen,
          updateIssueDirectly,
          handleUpdateIssue,
          onBulkDeleteIds: (ids: string[]) => setIssues(prev => prev.filter(i => !ids.includes(i.id))),
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

      {/* Modal Tạo Issue */}
      {showCreateIssue && (
        <CreateIssueModal
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

      {/* 4. MODAL/DRAWER: CHI TIẾT ISSUE */}
      {activeIssueDetail && (activeTab === "timeline" || activeTab === "calendar") ? (
        <TaskDetailDrawer
          isOpen={!!activeIssueDetail}
          issue={activeIssueDetail}
          workspaceId={workspace._id}
          onClose={closeTaskDetail}
          onUpdateIssue={handleUpdateIssue}
          onArchiveIssue={canDeleteTask ? handleArchiveIssue : undefined}
          detailUrl={detailUrl}
        />
      ) : activeIssueDetail && activeTab !== "list" ? (
        <TaskDetailModal
          issue={activeIssueDetail}
          workspaceId={workspace._id}
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
