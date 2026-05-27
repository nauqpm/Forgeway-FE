"use client";

import { useEffect, useState, use, useMemo, useRef } from "react";
import LoadingSpinner from "@/modules/admin/components/common/components/LoadingSpinner";
import Link from "next/link";
import IssueDetailModal from "@/modules/client/workspaces/components/IssueDetailModal";
import TaskDetailDrawer from "@/modules/client/workspaces/components/TaskDetailDrawer";
import WorkspaceContent from "@/modules/client/workspaces/components/WorkspaceContent";
import SprintModal from "@/modules/client/workspaces/components/SprintModal";
import BulkActionBar from "@/modules/admin/components/common/components/BulkActionBar";
import { useQuery } from "@tanstack/react-query";
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

import { filterIssues } from "@/modules/client/workspaces/utils/filterIssues";
import {
  handleBoardDragEnd,
  handleBacklogDragEnd,
} from "@/modules/client/workspaces/utils/dragUtils";

import { useIssueHandlers } from "@/modules/client/workspaces/hooks/useIssueHandlers";
import { useSprintHandlers } from "@/modules/client/workspaces/hooks/useSprintHandlers";
import { useColumnHandlers } from "@/modules/client/workspaces/hooks/useColumnHandlers";
import { useSelectionHandlers } from "@/modules/client/workspaces/hooks/useSelectionHandlers";
import { useWorkspacePermission } from "@/modules/client/workspaces/hooks/useWorkspacePermission";
import { useTaskFilters } from "@/modules/client/workspaces/hooks/useTaskFilters";
import { WORKSPACE_PERMISSIONS } from "@/modules/client/workspaces/constants/workspacePermissions";
import { useWorkspaceStore } from "@/stores/workspaceStore";

import Header from "@/modules/client/workspaces/components/common/Header";
import Tabs from "@/modules/client/workspaces/components/common/Tabs";

import CreateIssueModal from "@/modules/client/workspaces/components/issues/CreateIssueModal";

export default function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ key: string; tab?: string[] }>;
}) {
  const { key: workspaceKey, tab } = use(params);
  const tabFromUrl = tab?.[0];
  const initialTab = (tabFromUrl as WorkspaceTab) || null;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const workspaceApiId = workspace?._id;
  const { setCurrentWorkspace } = useWorkspaceStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab || "board");

  const handleTabChange = (newTab: WorkspaceTab) => {
    setActiveTab(newTab);
    window.history.pushState(null, "", `/workspaces/${workspaceKey}/${newTab}`);
  };

  useEffect(() => {
    const handlePopState = () => {
      const segments = window.location.pathname.split('/');
      const tabSegment = segments[3];
      if (tabSegment) {
        setActiveTab(tabSegment as WorkspaceTab);
      } else if (workspace) {
        const template = getWorkspaceTemplate(workspace);
        setActiveTab(template === "scrum" ? "backlog" : "board");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [workspace, workspaceKey]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);

  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [newIssueForm, setNewIssueForm] = useState<{
    title: string;
    type: string;
    priority: string;
    status: string;
    sprintId: string | null;
  }>({
    title: "",
    type: "Task",
    priority: "Medium",
    status: "To Do",
    sprintId: null,
  });
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const { filters, setFilters, taskFilters } = useTaskFilters(workspaceKey);
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

  const [columns, setColumns] = useState<BoardColumn[]>([]);

  useEffect(() => {
    if (boardData?.columns) {
      setColumns(boardData.columns);
    }
  }, [boardData]);

  useEffect(() => {
    if (sprintsData) setSprints(sprintsData);
  }, [sprintsData]);

  useEffect(() => {
    if (tasksData) setIssues(tasksData);
  }, [tasksData]);

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const [listViewMode, setListViewMode] = useState<"grid" | "split">("grid");
  const [listGridDrawerOpen, setListGridDrawerOpen] = useState(false);

  const filteredIssues = useMemo(() => {
    return filterIssues(issues, filters, workspace);
  }, [issues, filters, workspace]);

  const uniqueAssignees = useAssignees(issues);
  const workspacePermissions = useWorkspacePermission(workspaceKey, workspace);
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
      issues,
      setIssues,
      onSprintAssign: (taskId, sprintId) => {
        if (workspaceApiId) {
          taskService.updateBoardTask(workspaceApiId, taskId, { sprintId: sprintId ?? undefined });
        }
      },
    });
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
    api.get(apiRoutes.WORKSPACES.BY_KEY(workspaceKey))
      .then(async (workspaceResponse) => {
        const nextWorkspace = (
          workspaceResponse.data?.data ?? workspaceResponse.data
        ) as Workspace;
        const template = getWorkspaceTemplate(nextWorkspace);

        setWorkspace(nextWorkspace);
        setCurrentWorkspace(nextWorkspace as any);
        if (!initialTab) {
          if (template === "scrum") handleTabChange("backlog");
          else handleTabChange("board");
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [workspaceKey]);

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

      {/* Description */}
      {workspace.description && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 bg-white dark:bg-gray-900 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-800">
          {workspace.description}
        </p>
      )}

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
            setSelectedIssue,
            setNewIssueForm,
            setShowCreateIssue,
            setShowCreateColumn,
            setNewColumnName,
            handleBoardDragEnd: (result : any) =>
              canMoveTask
                ? handleBoardDragEnd({
                    result,
                    columns,
                    issues,
                    setColumns,
                    setIssues,
                    handleMoveColumn,
                    onColumnChange: (taskId, columnId) => {
                      if (workspaceApiId) {
                        taskService.updateBoardTask(workspaceApiId, taskId, { columnId });
                      }
                    },
                })
              : undefined,
            handleAddColumn,
            handleRenameColumn,
            handleDeleteColumn,
            handleMoveColumn,
          },
          refs: {
            columnsEndRef,
          },
          permissions: {
            canCreateTask,
            canMoveTask,
            canUpdateWorkspace,
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
            handleBacklogDragEnd: handleBacklogDragEndWithSync,
            setIssues,
            setDensity,
            setFilters,
            setIsFilterOpen,
            toggleTaskSelection,
            toggleSprintSelection,
            updateIssueDirectly,
            setSelectedIssue,
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
          setSelectedIssue,
        }}
        listProps={{
          filteredIssues,
          selectedIssue,
          workspaceKey: workspace.key,
          workspaceId: workspace._id,
          listViewMode,
          listGridDrawerOpen,
          setSelectedIssue,
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
          setSelectedIssue,
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

      {/* 4. MODAL/DRAWER: CHI TIẾT ISSUE */}
      {selectedIssue &&
        (activeTab === "timeline" ||
          activeTab === "calendar" ||
          (activeTab === "list" && listViewMode === "grid" && listGridDrawerOpen)) ? (
        <TaskDetailDrawer
          isOpen={!!selectedIssue}
          issue={selectedIssue}
          workspaceKey={workspace.key}
          onClose={() => {
            setSelectedIssue(null);
            setListGridDrawerOpen(false);
          }}
          onUpdateIssue={handleUpdateIssue}
        />
      ) : selectedIssue && !(activeTab === "list" && listViewMode === "split") ? (
        <IssueDetailModal
          issue={selectedIssue}
          workspaceKey={workspace.key}
          onClose={() => setSelectedIssue(null)}
          onUpdateIssue={handleUpdateIssue}
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
