"use client";

import { useCallback, useMemo, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import { useAssignees } from "@/modules/workspace/shared/hooks/useAssignees";
import { useTaskHandlers } from "@/modules/workspace/shared/hooks/useTaskHandlers";
import { useSprintHandlers } from "@/modules/workspace/shared/hooks/useSprintHandlers";
import { useColumnHandlers } from "@/modules/workspace/shared/hooks/useColumnHandlers";
import { useSelectionHandlers } from "@/modules/workspace/shared/hooks/useSelectionHandlers";
import { useWorkspacePermission } from "@/modules/workspace/shared/hooks/useWorkspacePermission";
import { useTaskFilters } from "@/modules/workspace/shared/hooks/useTaskFilters";
import { useWorkspaceData } from "@/modules/workspace/shared/hooks/useWorkspaceData";
import { useWorkspaceModals } from "@/modules/workspace/shared/hooks/useWorkspaceModals";
import { useWorkspaceTabRouter } from "@/modules/workspace/shared/hooks/useWorkspaceTabRouter";
import { useWorkspaceIssues } from "@/modules/workspace/shared/hooks/useWorkspaceIssues";
import { useWorkspaceArchive } from "@/modules/workspace/shared/hooks/useWorkspaceArchive";
import { useWorkspaceBulkActions } from "@/modules/workspace/shared/hooks/useWorkspaceBulkActions";
import { useDragHandlers } from "@/modules/workspace/shared/hooks/useDragHandlers";
import { WORKSPACE_PERMISSIONS } from "@/modules/workspace/shared/constants/workspacePermissions";
import {
  getWorkspaceTemplate,
  Workspace,
  WorkspaceTab,
} from "@/modules/workspace/shared/types/workspace.type";
import { Issue } from "@/modules/workspace/shared/types/issue.type";
import {
  isHiddenWorkspaceTab,
  normalizeRole,
  getUserObject,
  getUserId,
  getUserEmail,
  sameNonEmpty,
} from "@/modules/workspace/shared/utils/workspaceUtils";
import { toAssigneePickerUsers } from "@/shared/components/AssigneePicker";

export function useWorkspacePage(workspaceKey: string, tab: string[] | undefined) {
  const { user } = useAuth();

  // Parse initialTab and initialTaskKey inline so useWorkspaceModals gets the correct initialTaskKey
  const tabFromUrl = tab?.[0];
  const routeInitialTab = tabFromUrl === "key" ? null : (tabFromUrl as WorkspaceTab) || null;
  const initialTab = isHiddenWorkspaceTab(routeInitialTab) ? null : routeInitialTab;
  const initialTaskKey =
    tabFromUrl === "key"
      ? (tab?.[1] ?? null)
      : tabFromUrl && tab?.[1] === "key"
        ? (tab?.[2] ?? null)
        : null;

  const {
    selectedIssue, setSelectedIssue, selectedTaskKey, setSelectedTaskKey,
    listGridDrawerOpen, setListGridDrawerOpen, showCreateIssue, setShowCreateIssue,
    newIssueForm, setNewIssueForm, selectedTaskIds, setSelectedTaskIds,
    listViewMode, setListViewMode, isSprintModalOpen, setIsSprintModalOpen,
    editingSprint, setEditingSprint, showCreateColumn, setShowCreateColumn,
    newColumnName, setNewColumnName, columnsEndRef, density, setDensity,
    isFilterOpen, setIsFilterOpen,
  } = useWorkspaceModals(initialTaskKey);

  // workspaceRef lets useWorkspaceTabRouter's popstate handler always see the latest workspace
  // without triggering a re-render cycle. Tab router is called before useWorkspaceData so we
  // pass a ref that gets updated once workspace resolves.
  const workspaceRef = useRef<Workspace | null>(null);

  const tabRouter = useWorkspaceTabRouter({
    workspaceKey, tab, workspace: workspaceRef,
    onSelectIssue: setSelectedIssue, onSelectTaskKey: setSelectedTaskKey,
    onSetListGridDrawerOpen: setListGridDrawerOpen,
  });
  const { activeTab, setActiveTab, getWorkspaceTabUrl, getTaskDetailUrl, handleTabChange } = tabRouter;

  const { workspace, setWorkspace, loading, handleWorkspaceUpdated } = useWorkspaceData({
    workspaceKey, initialTab, initialTaskKey, getWorkspaceTabUrl, getTaskDetailUrl, setActiveTab,
  });

  // Keep the ref in sync with the latest resolved workspace
  useEffect(() => {
    workspaceRef.current = workspace;
  }, [workspace]);

  const workspaceId = workspace?._id;
  const workspaceTemplate = workspace ? getWorkspaceTemplate(workspace) : undefined;
  const { filters, setFilters, taskFilters } = useTaskFilters(workspaceId ?? "");

  const {
    issues, setIssues, sprints, columns, setColumns, filteredIssues,
    isTaskBoardFetching, isBoardLoading, boardData, tasksError, activeIssueDetail,
    syncTaskReorder, patchSelectedTaskView, isDraggingIssueRef,
  } = useWorkspaceIssues({
    workspaceId, workspaceType: workspaceTemplate, taskFilters, filters, workspace,
    selectedIssue, selectedTaskKey, setSelectedIssue, setSelectedTaskIds,
  });

  const {
    archivePage, archivedItems, archiveTotal, isArchivedTasksFetching,
    resetArchiveList, handleLoadMoreArchive, handleArchiveIssue, handleRestoreIssue, handleDeleteIssue,
  } = useWorkspaceArchive({
    workspaceId, activeTab, setIssues, setSelectedIssue, setSelectedTaskIds,
  });

  const { handleListBulkDelete, handleListBulkUpdate } = useWorkspaceBulkActions({
    workspaceId, workspace, setIssues, setSelectedIssue, setSelectedTaskIds, resetArchiveList,
  });

  const workspacePermissions = useWorkspacePermission(workspaceId ?? "", workspace);
  const currentWorkspaceRole = useMemo(() => {
    if (!user || !workspace) return workspacePermissions.role;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const found = (workspace.members ?? []).find((m: any) => {
      const u = getUserObject(m); const id = getUserId(u); const email = getUserEmail(u);
      return sameNonEmpty(id, user.id) || sameNonEmpty(id, user.email) || sameNonEmpty(email, user.email);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return normalizeRole((found as any)?.role) ?? workspacePermissions.role;
  }, [user, workspace, workspacePermissions.role]);
  const isWorkspaceAdmin = currentWorkspaceRole === "workspace_admin" || user?.role === "super_admin";
  const hp = workspacePermissions.hasPermission;
  const canCreateTask = hp(WORKSPACE_PERMISSIONS.TASK_CREATE);
  const canEditTask = hp(WORKSPACE_PERMISSIONS.TASK_EDIT);
  const canDeleteTask = hp(WORKSPACE_PERMISSIONS.TASK_DELETE);
  const canMoveTask = hp(WORKSPACE_PERMISSIONS.TASK_MOVE);
  const canManageSprint = hp(WORKSPACE_PERMISSIONS.SPRINT_MANAGE);
  const canUpdateWorkspace = isWorkspaceAdmin && hp(WORKSPACE_PERMISSIONS.WORKSPACE_UPDATE);
  const uniqueAssignees = useAssignees(issues, workspace);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bulkActionMembers = useMemo(() => toAssigneePickerUsers(workspace?.members as any[] | undefined), [workspace?.members]);

  const { handleCreateIssue, handleUpdateIssue, handleUpdateIssueDate, updateIssueDirectly,
    handleQuickCreateTask, handleQuickCreateCalendarTask, handleCreateTaskFromList } =
    useTaskHandlers({ workspaceId: workspaceId ?? "", setShowCreateIssue, setNewIssueForm, setSelectedIssue });

  const { handleAddColumn, handleRenameColumn, handleDeleteColumn, handleMoveColumn } =
    useColumnHandlers({ workspaceId: workspaceId ?? "", newColumnName, setNewColumnName, setShowCreateColumn, columnsEndRef });

  const { handleCreateSprint, handleSaveSprint, handleEditSprint, handleDeleteSprint,
    handleStartSprint, handleCompleteSprint, handleConfirmStartSprint, handleConfirmCompleteSprint,
    startSprintTarget, setStartSprintTarget, completeSprintTarget, setCompleteSprintTarget } =
    useSprintHandlers({
      workspaceId: workspaceId ?? "",
      enabled: workspaceTemplate === "scrum",
      editingSprint,
      setEditingSprint,
      setIsSprintModalOpen,
    });

  const { toggleTaskSelection, toggleSprintSelection } = useSelectionHandlers({
    workspaceId: workspaceId ?? "", issues, selectedTaskIds, setIssues, setSelectedTaskIds,
  });

  const { handleBoardDragEndWithSync, handleBacklogDragEndWithSync, onBoardDragStart, onBacklogDragStart } =
    useDragHandlers({ workspaceId, filteredIssues, columns, setIssues, setColumns, syncTaskReorder, patchSelectedTaskView, isDraggingIssueRef, handleMoveColumn, canMoveTask });

  const activeSprint = sprints.find((s) => s.status === "active") ?? null;

  const openTaskDetail = useCallback((issue: Issue) => {
    if (!issue.key) { toast.error("Task key not found"); return; }
    setSelectedIssue(issue);
    setSelectedTaskKey(issue.key);
    const detailUrl = getTaskDetailUrl(activeTab, issue.key);
    window.history.pushState({ ...window.history.state, as: detailUrl }, "", detailUrl);
  }, [activeTab, getTaskDetailUrl, setSelectedIssue, setSelectedTaskKey]);

  const closeTaskDetail = useCallback(() => {
    const shouldResetUrl = Boolean(selectedTaskKey);
    setSelectedIssue(null);
    setSelectedTaskKey(null);
    setListGridDrawerOpen(false);
    if (shouldResetUrl) {
      const baseUrl = getWorkspaceTabUrl(activeTab);
      window.history.pushState({ ...window.history.state, as: baseUrl }, "", baseUrl);
    }
  }, [activeTab, getWorkspaceTabUrl, selectedTaskKey, setListGridDrawerOpen, setSelectedIssue, setSelectedTaskKey]);

  const handleListTaskSelection = useCallback(
    (issue: Issue | null) => (issue ? openTaskDetail(issue) : closeTaskDetail()),
    [closeTaskDetail, openTaskDetail],
  );

  const handleOpenGlobalCreateIssue = useCallback(() => {
    if (!canCreateTask) return;
    if (activeTab === "board" && workspace?.type === "scrum" && activeSprint) {
      const firstColumn = columns[0];
      setNewIssueForm((prev) => ({ ...prev, sprintId: activeSprint._id, columnId: firstColumn?.id ?? null, status: firstColumn?.name ?? "To Do" }));
    }
    setShowCreateIssue(true);
  }, [activeTab, workspace, activeSprint, columns, canCreateTask, setNewIssueForm, setShowCreateIssue]);

  useEffect(() => {
    if (activeTab !== "list") {
      setListGridDrawerOpen(false);
      if (listViewMode === "split") setSelectedIssue(null);
    }
  }, [activeTab, listViewMode, setListGridDrawerOpen, setSelectedIssue]);

  const detailUrl = activeIssueDetail?.key ? getTaskDetailUrl(activeTab, activeIssueDetail.key) : undefined;
  const pageTitle = workspace?.name
    ? `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} - ${workspace.name}`
    : activeTab.charAt(0).toUpperCase() + activeTab.slice(1);

  return {
    workspace, setWorkspace, loading, handleWorkspaceUpdated, workspaceId,
    activeTab, setActiveTab, handleTabChange, getWorkspaceTabUrl, getTaskDetailUrl,
    filters, setFilters,
    issues, setIssues, sprints, columns, setColumns, filteredIssues,
    archivedItems, archiveTotal, archivePage,
    isArchivedTasksFetching, isTaskBoardFetching, isBoardLoading, boardData, tasksError,
    activeIssueDetail, detailUrl,
    showCreateIssue, setShowCreateIssue, newIssueForm, setNewIssueForm,
    selectedIssue, setSelectedIssue, selectedTaskKey, setSelectedTaskKey,
    selectedTaskIds, setSelectedTaskIds,
    listViewMode, setListViewMode, listGridDrawerOpen, setListGridDrawerOpen,
    isSprintModalOpen, setIsSprintModalOpen, editingSprint, setEditingSprint,
    showCreateColumn, setShowCreateColumn, newColumnName, setNewColumnName, columnsEndRef,
    density, setDensity, isFilterOpen, setIsFilterOpen,
    startSprintTarget, setStartSprintTarget, completeSprintTarget, setCompleteSprintTarget,
    handleCreateSprint, handleSaveSprint, handleEditSprint, handleDeleteSprint,
    handleStartSprint, handleCompleteSprint, handleConfirmStartSprint, handleConfirmCompleteSprint,
    handleCreateIssue, handleUpdateIssue, handleUpdateIssueDate, updateIssueDirectly,
    handleQuickCreateTask, handleQuickCreateCalendarTask, handleCreateTaskFromList,
    handleArchiveIssue, handleRestoreIssue, handleDeleteIssue,
    handleListBulkDelete, handleListBulkUpdate, resetArchiveList, handleLoadMoreArchive,
    openTaskDetail, closeTaskDetail, handleListTaskSelection, handleOpenGlobalCreateIssue,
    handleAddColumn, handleRenameColumn, handleDeleteColumn, handleMoveColumn,
    handleBoardDragEndWithSync, handleBacklogDragEndWithSync, onBoardDragStart, onBacklogDragStart,
    toggleTaskSelection, toggleSprintSelection,
    canCreateTask, canEditTask, canDeleteTask, canMoveTask, canManageSprint, canUpdateWorkspace,
    isWorkspaceAdmin, uniqueAssignees, bulkActionMembers, activeSprint, pageTitle, user,
  };
}
