"use client";

import { useEffect, useState, use, useMemo, useRef } from "react";
import LoadingSpinner from "@/modules/admin/components/common/components/LoadingSpinner";
import Link from "next/link";
import IssueDetailModal from "@/modules/client/workspaces/components/IssueDetailModal";
import TaskDetailDrawer from "@/modules/client/workspaces/components/TaskDetailDrawer";
import WorkspaceContent from "@/modules/client/workspaces/components/WorkspaceContent";
import SprintModal from "@/modules/client/workspaces/components/SprintModal";
import BulkActionBar from "@/modules/admin/components/common/components/BulkActionBar";

import {
  getWorkspaceTemplate,
  Workspace,
  WorkspaceTab,
} from "@/modules/client/workspaces/types/workspace.type";
import { Issue } from "@/modules/client/workspaces/types/issue.type";
import { Sprint } from "@/modules/client/workspaces/types/sprint.type";
import { Filters } from "@/modules/client/workspaces/types/filter.type";

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

import Header from "@/modules/client/workspaces/components/common/Header";
import Tabs from "@/modules/client/workspaces/components/common/Tabs";

import CreateIssueModal from "@/modules/client/workspaces/components/issues/CreateIssueModal";

export default function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: workspaceId } = use(params);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("pages");
  const [columns, setColumns] = useState(["To Do", "In Progress", "Done"]);
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

  const [filters, setFilters] = useState<Filters>({
    search: "",
    assigneeId: null,
    priority: null,
    assignees: [],
    types: [],
    statuses: [],
  });
  const [density, setDensity] = useState<"default" | "compact">("default");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [showCreateColumn, setShowCreateColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const columnsEndRef = useRef<HTMLDivElement>(null);

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const [listViewMode, setListViewMode] = useState<"grid" | "split">("grid");
  const [listGridDrawerOpen, setListGridDrawerOpen] = useState(false);

  const filteredIssues = useMemo(() => {
    return filterIssues(issues, filters, workspace);
  }, [issues, filters, workspace]);

  const uniqueAssignees = useAssignees(issues);

  const {
    handleCreateIssue,
    handleUpdateIssue,
    handleUpdateIssueDate,
    updateIssueDirectly,
  } = useIssueHandlers({
    workspaceKey: workspaceId,
    issues,
    setIssues,
    setShowCreateIssue,
    setNewIssueForm,
    setSelectedIssue,
  });

  const { handleAddColumn } = useColumnHandlers({
    columns,
    newColumnName,
    setColumns,
    setNewColumnName,
    setShowCreateColumn,
    columnsEndRef,
  });

  const { handleCreateSprint, handleSaveSprint } = useSprintHandlers({
    sprints,
    editingSprint,
    setSprints,
    setEditingSprint,
    setIsSprintModalOpen,
  });

  const {
    toggleTaskSelection,
    toggleSprintSelection,
    handleBulkStatusChange,
    handleBulkDelete,
  } = useSelectionHandlers({
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
    if (!workspaceId) return;
    api.get(apiRoutes.WORKSPACES.BY_KEY(workspaceId))
      .then(async (workspaceResponse) => {
        const nextWorkspace = (
          workspaceResponse.data?.data ?? workspaceResponse.data
        ) as Workspace;
        const template = getWorkspaceTemplate(nextWorkspace);

        setWorkspace(nextWorkspace);
        if (template === "scrum") setActiveTab("backlog");
        else setActiveTab("board");

        const nextIssues = await taskService.listBoardTasks(workspaceId);
        setIssues(nextIssues);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceId]);

  if (loading) return <LoadingSpinner />;
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
        workspaceId={workspaceId}
        setShowCreateIssue={setShowCreateIssue}
      />

      {/* Description */}
      {workspace.description && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 bg-white dark:bg-gray-900 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-800">
          {workspace.description}
        </p>
      )}

      {/* Tabs */}
      <Tabs workspace={workspace} activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Content Area */}
      <WorkspaceContent
        activeTab={activeTab}
        workspace={workspace}
        workspaceId={workspaceId}
        boardProps={{
          data: {
            columns,
            issues,
            filteredIssues,
            uniqueAssignees,
            workspace,
          },
          ui: {
            filters,
            newIssueForm,
            showCreateColumn,
            newColumnName,
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
            handleBoardDragEnd,
            handleAddColumn,
          },
          refs: {
            columnsEndRef,
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
            handleBacklogDragEnd,
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
          workspaceId,
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
          workspaceId,
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
      />
    </div>
  );
}
