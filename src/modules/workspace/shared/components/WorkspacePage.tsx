"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import LoadingSpinner from "@/modules/admin-shared/components/common/components/LoadingSpinner";
import WorkspaceContent from "./WorkspaceContent";
import Header from "@/modules/workspace/shared/components/Header";
import Tabs from "@/modules/workspace/shared/components/Tabs";
import WorkspaceModals from "./WorkspaceModals";
import { getWorkspaceTemplate } from "@/modules/workspace/shared/types/workspace.type";
import { Issue } from "@/modules/workspace/shared/types/issue.type";
import { TaskDetailResponse } from "@/modules/workspace/shared/types/task-detail.type";
import type { useWorkspacePage } from "@/modules/workspace/shared/hooks/useWorkspacePage";

const BulkActionBar = dynamic(
  () => import("@/modules/admin-shared/components/common/components/BulkActionBar"),
  { ssr: false },
);

type WorkspacePageProps = ReturnType<typeof useWorkspacePage>;

export default function WorkspacePage(props: WorkspacePageProps) {
  const {
    workspace,
    loading,
    handleWorkspaceUpdated,
    activeTab,
    handleTabChange,
    filters,
    setFilters,
    issues,
    setIssues,
    sprints,
    columns,
    setColumns,
    filteredIssues,
    archivedItems,
    archiveTotal,
    archivePage,
    isArchivedTasksFetching,
    isTaskBoardFetching,
    isBoardLoading,
    tasksError,
    activeIssueDetail,
    detailUrl,
    showCreateIssue,
    setShowCreateIssue,
    newIssueForm,
    setNewIssueForm,
    selectedIssue,
    selectedTaskIds,
    setSelectedTaskIds,
    listViewMode,
    setListViewMode,
    listGridDrawerOpen,
    setListGridDrawerOpen,
    isSprintModalOpen,
    setIsSprintModalOpen,
    editingSprint,
    setEditingSprint,
    showCreateColumn,
    setShowCreateColumn,
    newColumnName,
    setNewColumnName,
    columnsEndRef,
    density,
    setDensity,
    isFilterOpen,
    setIsFilterOpen,
    startSprintTarget,
    setStartSprintTarget,
    completeSprintTarget,
    setCompleteSprintTarget,
    handleCreateSprint,
    handleSaveSprint,
    handleEditSprint,
    handleDeleteSprint,
    handleStartSprint,
    handleCompleteSprint,
    handleConfirmStartSprint,
    handleConfirmCompleteSprint,
    handleCreateIssue,
    handleUpdateIssue,
    handleUpdateIssueDate,
    updateIssueDirectly,
    handleQuickCreateTask,
    handleQuickCreateCalendarTask,
    handleCreateTaskFromList,
    handleArchiveIssue,
    handleRestoreIssue,
    handleDeleteIssue,
    handleListBulkDelete,
    handleListBulkUpdate,
    handleLoadMoreArchive,
    openTaskDetail,
    closeTaskDetail,
    handleListTaskSelection,
    handleOpenGlobalCreateIssue,
    handleAddColumn,
    handleRenameColumn,
    handleDeleteColumn,
    handleMoveColumn,
    handleBoardDragEndWithSync,
    handleBacklogDragEndWithSync,
    onBoardDragStart,
    onBacklogDragStart,
    toggleTaskSelection,
    toggleSprintSelection,
    canCreateTask,
    canEditTask,
    canDeleteTask,
    canMoveTask,
    canManageSprint,
    canUpdateWorkspace,
    isWorkspaceAdmin,
    uniqueAssignees,
    bulkActionMembers,
    activeSprint,
    user,
  } = props;

  if (loading || isBoardLoading) return <LoadingSpinner />;

  if (tasksError) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = (tasksError as any).response?.status;
    let errorMessage = "An error occurred while loading board data";
    if (status === 401) errorMessage = "Your session has expired. Please sign in again.";
    if (status === 403) errorMessage = "You do not have permission to access this workspace.";
    if (status === 404) errorMessage = "Workspace does not exist.";
    if (status === 400) errorMessage = "Invalid filters.";
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-500 mb-4">{errorMessage}</p>
        <button onClick={() => window.location.reload()} className="text-indigo-600 hover:text-indigo-800">
          Reload page
        </button>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500 mb-4">Workspace not found</p>
        <Link href="/workspaces" className="text-indigo-600 hover:text-indigo-800">
          Back to workspace list
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-[var(--workspace-surface-pad)]">
      <div className="workspace-surface pb-12">
        <Header
          workspace={workspace}
          workspaceId={workspace.key}
          setShowCreateIssue={handleOpenGlobalCreateIssue}
          canCreateTask={canCreateTask}
          canUpdateWorkspace={canUpdateWorkspace}
          onWorkspaceUpdated={handleWorkspaceUpdated}
        />

        <Tabs workspace={workspace} activeTab={activeTab} setActiveTab={handleTabChange} />

        <WorkspaceContent
          activeTab={activeTab}
          workspace={workspace}
          workspaceId={workspace._id}
          boardProps={{
            data: { columns, issues, filteredIssues, uniqueAssignees, workspace, activeSprint },
            ui: { filters, newIssueForm, showCreateColumn, newColumnName, isFetching: isTaskBoardFetching },
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
              handleBoardDragStart: onBoardDragStart,
              handleBoardDragEnd: handleBoardDragEndWithSync,
              handleAddColumn,
              handleRenameColumn,
              handleDeleteColumn,
              handleMoveColumn,
              onArchiveIssue: canDeleteTask ? handleArchiveIssue : undefined,
              onDeleteIssue: canDeleteTask ? handleDeleteIssue : undefined,
            },
            refs: { columnsEndRef },
            permissions: {
              canCreateTask,
              canEditTask,
              canMoveTask,
              canUpdateWorkspace,
              canArchiveTask: canDeleteTask,
            },
          }}
          backlogProps={{
            data: { issues, filteredIssues, columns, sprints, uniqueAssignees, selectedTaskIds, workspace },
            ui: { density, filters, isFilterOpen, newIssueForm },
            actions: {
              handleBacklogDragStart: onBacklogDragStart,
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
            permissions: { canCreateTask, canEditTask, canMoveTask, canManageSprint },
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
            onBulkUpdateIds: handleListBulkUpdate,
            onBulkDeleteIds: handleListBulkDelete,
            onCreateTask: canCreateTask ? handleCreateTaskFromList : undefined,
            canEditTask,
            canDeleteTask,
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
            boardColumns: columns,
            isLoading: isArchivedTasksFetching && archivePage === 1 && archivedItems.length === 0,
            onRestore: handleRestoreIssue,
            total: archiveTotal,
            onLoadMore: handleLoadMoreArchive,
            isLoadingMore: isArchivedTasksFetching && archivePage > 1,
          }}
          membersProps={{
            workspaceId: workspace._id,
            currentUserId: user?.id,
            isAdmin: isWorkspaceAdmin,
          }}
          reportsProps={{
            workspaceId: workspace._id,
            workspaceKey: workspace.key,
            onSelectTask: (task) => openTaskDetail(task as unknown as Issue),
            currentUserId: user?.id,
            workspaceType: workspace.type || "",
          }}
        />

        <WorkspaceModals
          workspace={workspace}
          columns={columns}
          sprints={sprints}
          activeTab={activeTab}
          showCreateIssue={showCreateIssue}
          setShowCreateIssue={setShowCreateIssue}
          newIssueForm={newIssueForm}
          setNewIssueForm={setNewIssueForm}
          handleCreateIssue={handleCreateIssue}
          isSprintModalOpen={isSprintModalOpen}
          setIsSprintModalOpen={setIsSprintModalOpen}
          handleSaveSprint={handleSaveSprint}
          editingSprint={editingSprint}
          startSprintTarget={startSprintTarget}
          setStartSprintTarget={setStartSprintTarget}
          handleConfirmStartSprint={handleConfirmStartSprint}
          completeSprintTarget={completeSprintTarget}
          setCompleteSprintTarget={setCompleteSprintTarget}
          handleConfirmCompleteSprint={handleConfirmCompleteSprint}
          activeIssueDetail={activeIssueDetail}
          closeTaskDetail={closeTaskDetail}
          handleUpdateIssue={handleUpdateIssue}
          updateIssueDirectly={updateIssueDirectly}
          handleArchiveIssue={handleArchiveIssue}
          handleRestoreIssue={handleRestoreIssue ? (i: TaskDetailResponse) => handleRestoreIssue(i as unknown as Issue) : undefined}
          detailUrl={detailUrl}
          canEditTask={canEditTask}
          canDeleteTask={canDeleteTask}
        />

        <BulkActionBar
          selectedCount={selectedTaskIds.length}
          onClear={() => setSelectedTaskIds([])}
          onBulkUpdate={(updates) => handleListBulkUpdate(selectedTaskIds, updates)}
          onDelete={() => handleListBulkDelete(selectedTaskIds)}
          members={bulkActionMembers}
          sprints={sprints}
          onMoveSprint={(sprintId) => handleListBulkUpdate(selectedTaskIds, { sprintId })}
          canEditTask={canEditTask}
          canDeleteTask={canDeleteTask}
          canMoveTask={canMoveTask}
        />
      </div>
    </div>
  );
}
