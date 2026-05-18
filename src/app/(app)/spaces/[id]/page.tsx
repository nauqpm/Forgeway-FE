"use client";

import { useEffect, useState, use, useMemo, useRef } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import LoadingSpinner from "@/modules/app/common/components/LoadingSpinner";
import Link from "next/link";
import IssueDetailModal from "@/modules/app/spaces/components/IssueDetailModal";
import TaskDetailDrawer from "@/modules/app/spaces/components/TaskDetailDrawer";
import SpaceContent from "@/modules/app/spaces/components/SpaceContent";
import SprintModal from "@/modules/app/spaces/components/SprintModal";
import BulkActionBar from "@/modules/app/common/components/BulkActionBar";

import { Space } from "@/modules/app/spaces/types/space.type";
import { Issue } from "@/modules/app/spaces/types/issue.type";
import { Sprint } from "@/modules/app/spaces/types/sprint.type";
import { Filters } from "@/modules/app/spaces/types/filter.type";

import { useAssignees } from "@/modules/app/spaces/hooks/useAssignees";

import { filterIssues } from "@/modules/app/spaces/utils/filterIssues";
import {
  handleBoardDragEnd,
  handleBacklogDragEnd,
} from "@/modules/app/spaces/utils/dragUtils";

import { useIssueHandlers } from "@/modules/app/spaces/hooks/useIssueHandlers";
import { useSprintHandlers } from "@/modules/app/spaces/hooks/useSprintHandlers";
import { useColumnHandlers } from "@/modules/app/spaces/hooks/useColumnHandlers";
import { useSelectionHandlers } from "@/modules/app/spaces/hooks/useSelectionHandlers";

import Header from "@/modules/app/spaces/components/common/Header";
import Tabs from "@/modules/app/spaces/components/common/Tabs";

import CreateIssueModal from "@/modules/app/spaces/components/issues/CreateIssueModal";

import { MOCK_ISSUES } from "@/modules/app/spaces/constants/mockIssues";
import { MOCK_SPRINTS } from "@/modules/app/spaces/constants/mockSprints";

export default function SpaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: spaceId } = use(params);
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "board" | "backlog" | "timeline" | "summary" | "pages" | "list" | "calendar"
  >("pages");
  const [columns, setColumns] = useState(["To Do", "In Progress", "Done"]);
  const [sprints, setSprints] = useState<Sprint[]>(MOCK_SPRINTS);
  const [issues, setIssues] = useState<Issue[]>(MOCK_ISSUES);

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
    return filterIssues(issues, filters, space);
  }, [issues, filters, space]);

  const uniqueAssignees = useAssignees(issues);

  const {
    handleCreateIssue,
    handleUpdateIssue,
    handleUpdateIssueDate,
    updateIssueDirectly,
  } = useIssueHandlers({
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
  }, [activeTab]);

  useEffect(() => {
    if (!spaceId) return;
    const fetchData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const allSpaces = JSON.parse(
          localStorage.getItem("MOCK_SPACES") || "[]",
        );
        const found = allSpaces.find((s: any) => s._id === spaceId);
        if (found) {
          setSpace(found);
          // Auto-select tab based on template
          if (found.template === "kanban") setActiveTab("board");
          else if (found.template === "scrum") setActiveTab("backlog");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [spaceId]);

  if (loading) return <LoadingSpinner />;
  if (!space)
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500 mb-4">
          Không tìm thấy không gian (Space) này
        </p>
        <Link href="/spaces" className="text-indigo-600 hover:text-indigo-800">
          Quay lại danh sách Space
        </Link>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <Header
        space={space}
        spaceId={spaceId}
        setShowCreateIssue={setShowCreateIssue}
      />

      {/* Description */}
      {space.description && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 bg-white dark:bg-gray-900 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-800">
          {space.description}
        </p>
      )}

      {/* Tabs */}
      <Tabs space={space} activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Content Area */}
      <SpaceContent
        activeTab={activeTab}
        space={space}
        spaceId={spaceId}
        boardProps={{
          data: {
            columns,
            issues,
            filteredIssues,
            uniqueAssignees,
            space,
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
            space,
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
          spaceKey: space.key,
          spaceId,
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
          spaceKey: space.key,
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
          spaceKey={space.key}
          onClose={() => {
            setSelectedIssue(null);
            setListGridDrawerOpen(false);
          }}
          onUpdateIssue={handleUpdateIssue}
        />
      ) : selectedIssue && !(activeTab === "list" && listViewMode === "split") ? (
        <IssueDetailModal
          issue={selectedIssue}
          spaceKey={space.key}
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
