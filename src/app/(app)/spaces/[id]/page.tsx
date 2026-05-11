"use client";

import { useEffect, useState, use, useMemo, useRef } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import LoadingSpinner from "@/modules/app/common/components/LoadingSpinner";
import Link from "next/link";
import {
  BookOpen, Plus, ArrowRight, Search, Lock, Globe, Settings,
  FileText, Columns, Repeat, ChevronRight, ChevronDown, X, Check, SlidersHorizontal, ExternalLink, CheckCircle2, PencilLine, CalendarClock,
  LayoutGrid, PanelRight, RotateCw, ArrowDownWideNarrow
} from "lucide-react";
import IssueDetailModal from "@/modules/app/common/components/IssueDetailModal";
import TaskDetailDrawer from "@/modules/app/common/components/TaskDetailDrawer";
import PageTreeSidebar from "@/modules/app/common/components/PageTreeSidebar";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import SprintModal from "@/modules/app/common/components/SprintModal";
import FilterMenu from "@/modules/app/common/components/FilterMenu";
import BulkActionBar from "@/modules/app/common/components/BulkActionBar";
import TimelineView from "@/modules/app/common/components/TimelineView";
import DataGridListView from "@/modules/app/common/components/DataGridListView";

type DashboardMetric = {
  completed: number;
  updated: number;
  created: number;
  dueSoon: number;
};

type IssueActivity = {
  id: string;
  userName: string;
  userInitials: string;
  actionLabel: string;
  issueKey: string;
  issueTitle: string;
  status: string;
  time: string;
};

const formatRelativeTime = (isoDate: string) => {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
};

interface Space {
  _id: string;
  name: string;
  key: string;
  description?: string;
  visibility: "private" | "public";
  template: "kanban" | "scrum";
}

type ListSplitSortField = "created" | "key" | "lastViewed" | "priority" | "resolved" | "status" | "updated";

const LIST_SPLIT_SORT_OPTIONS: { id: ListSplitSortField; label: string }[] = [
  { id: "created", label: "Created" },
  { id: "key", label: "Key" },
  { id: "lastViewed", label: "Last viewed" },
  { id: "priority", label: "Priority" },
  { id: "resolved", label: "Resolved" },
  { id: "status", label: "Status" },
  { id: "updated", label: "Updated" },
];

export default function SpaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: spaceId } = use(params);
  const { currentWorkspace } = useWorkspaceStore();
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"board" | "backlog" | "timeline" | "summary" | "pages" | "list">("pages");
  const [columns, setColumns] = useState(["To Do", "In Progress", "Done"]);
  const [sprints, setSprints] = useState([
    { id: "s1", name: "Sprint 1", status: "Active", startDate: "2026-05-10", endDate: "2026-05-24", duration: "2 weeks", goal: "Hoàn thiện UI" },
    { id: "s2", name: "Sprint 2", status: "Planned", startDate: "2026-05-25", endDate: "2026-06-08", duration: "2 weeks", goal: "" }
  ]);
  const [issues, setIssues] = useState<any[]>([
    { id: "1", title: "Thiết kế lại luồng đăng nhập theo chuẩn mới", status: "To Do", priority: "High", type: "Design", assignee: "A", color: "bg-indigo-600", sprintId: "s1", storyPoints: 5, startDate: "2026-05-10", endDate: "2026-05-14", epic: "Auth Revamp", createdAt: "2026-05-05T08:00:00.000Z", updatedAt: "2026-05-10T03:00:00.000Z" },
    { id: "2", title: "Fix lỗi hiển thị sai font chữ trên Safari", status: "To Do", priority: "High", type: "Bug", assignee: "B", color: "bg-teal-500", sprintId: "s1", storyPoints: 3, startDate: "2026-05-12", endDate: "2026-05-15", epic: "Cross-browser Stability", createdAt: "2026-05-06T07:20:00.000Z", updatedAt: "2026-05-11T04:00:00.000Z" },
    { id: "3", title: "Viết test case cho module Thanh toán", status: "In Progress", priority: "Medium", type: "Task", assignee: "C", color: "bg-emerald-500", sprintId: null, storyPoints: 8, startDate: "2026-05-15", endDate: "2026-05-20", epic: "Payment Reliability", createdAt: "2026-05-07T09:00:00.000Z", updatedAt: "2026-05-11T05:15:00.000Z" },
    { id: "4", title: "Tối ưu hóa hình ảnh Landing Page", status: "Done", priority: "Low", type: "Task", assignee: "D", color: "bg-orange-500", sprintId: null, storyPoints: 2, startDate: "2026-05-18", endDate: "2026-05-22", epic: "Performance", createdAt: "2026-05-02T06:30:00.000Z", updatedAt: "2026-05-09T11:00:00.000Z" },
    { id: "5", title: "Nghiên cứu kiến trúc Micro-frontend", status: "To Do", priority: "Medium", type: "Story", assignee: "U", color: "bg-purple-500", sprintId: null, storyPoints: 13, startDate: "2026-05-20", endDate: "2026-05-28", epic: null, createdAt: "2026-05-10T02:00:00.000Z", updatedAt: "2026-05-10T02:00:00.000Z" },
  ]);
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [newIssueForm, setNewIssueForm] = useState<{ title: string, type: string, priority: string, status: string, sprintId: string | null }>({ title: "", type: "Task", priority: "Medium", status: "To Do", sprintId: null });
  const [selectedIssue, setSelectedIssue] = useState<any>(null);

  const [filters, setFilters] = useState({
    search: "",
    assigneeId: null as string | null,
    priority: null as string | null,
    assignees: [] as string[],
    types: [] as string[],
    statuses: [] as string[]
  });
  const [density, setDensity] = useState<'default' | 'compact'>('default');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<any>(null);
  const [showCreateColumn, setShowCreateColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const columnsEndRef = useRef<HTMLDivElement>(null);

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  /** List tab: full data grid vs split master-detail */
  const [listViewMode, setListViewMode] = useState<"grid" | "split">("grid");
  /** Overlay drawer chỉ mở khi user click một hàng ở Table (tránh popup khi đổi từ Split sang Table) */
  const [listGridDrawerOpen, setListGridDrawerOpen] = useState(false);
  const splitJustActivatedRef = useRef(false);
  const [listSplitSortBy, setListSplitSortBy] = useState<ListSplitSortField>("key");
  const [listSplitSortDir, setListSplitSortDir] = useState<"asc" | "desc">("asc");
  const [listSplitOrderOpen, setListSplitOrderOpen] = useState(false);
  const listSplitToolbarRef = useRef<HTMLDivElement>(null);
  const [isSummaryFilterOpen, setIsSummaryFilterOpen] = useState(false);
  const [summaryFilterSearch, setSummaryFilterSearch] = useState("");
  const [selectedSummaryFields, setSelectedSummaryFields] = useState<string[]>([]);
  const summaryFilterRef = useRef<HTMLDivElement>(null);

  const summaryFilterFields = useMemo(
    () => [
      { id: "assignee", label: "Assignee" },
      { id: "created", label: "Created" },
      { id: "dueDate", label: "Due date" },
      { id: "parent", label: "Parent" },
      { id: "priority", label: "Priority" },
      { id: "status", label: "Status" },
      { id: "updated", label: "Updated" },
      { id: "workType", label: "Work type" },
    ],
    []
  );

  const visibleSummaryFilterFields = useMemo(
    () =>
      summaryFilterFields.filter((field) =>
        field.label.toLowerCase().includes(summaryFilterSearch.toLowerCase())
      ),
    [summaryFilterFields, summaryFilterSearch]
  );

  const summaryFilteredIssues = useMemo(() => {
    if (selectedSummaryFields.length === 0) return issues;

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(now.getDate() + 7);

    return issues.filter((issue) => {
      const matchesAssignee = selectedSummaryFields.includes("assignee")
        ? issue.assignee && issue.assignee !== "U"
        : true;
      const matchesCreated = selectedSummaryFields.includes("created")
        ? issue.createdAt && new Date(issue.createdAt) >= sevenDaysAgo
        : true;
      const matchesDueDate = selectedSummaryFields.includes("dueDate")
        ? issue.endDate && new Date(issue.endDate) >= now && new Date(issue.endDate) <= sevenDaysLater
        : true;
      const matchesParent = selectedSummaryFields.includes("parent")
        ? Boolean(issue.epic)
        : true;
      const matchesPriority = selectedSummaryFields.includes("priority")
        ? Boolean(issue.priority)
        : true;
      const matchesStatus = selectedSummaryFields.includes("status")
        ? Boolean(issue.status)
        : true;
      const matchesUpdated = selectedSummaryFields.includes("updated")
        ? issue.updatedAt && new Date(issue.updatedAt) >= sevenDaysAgo
        : true;
      const matchesWorkType = selectedSummaryFields.includes("workType")
        ? Boolean(issue.type)
        : true;

      return (
        matchesAssignee &&
        matchesCreated &&
        matchesDueDate &&
        matchesParent &&
        matchesPriority &&
        matchesStatus &&
        matchesUpdated &&
        matchesWorkType
      );
    });
  }, [issues, selectedSummaryFields]);

  const filteredIssues = useMemo(() => {
    if (!space) return [];
    return issues.filter(issue => {
      const matchSearch = issue.title.toLowerCase().includes(filters.search.toLowerCase())
        || `${space.key}-${100 + parseInt(issue.id)}`.toLowerCase().includes(filters.search.toLowerCase());

      // Board quick filters
      const matchAssigneeQuick = filters.assigneeId ? issue.assignee === filters.assigneeId : true;
      const matchPriorityQuick = filters.priority ? issue.priority === filters.priority : true;

      // Backlog multi-filters
      const matchAssignees = filters.assignees.length > 0 ? filters.assignees.includes(issue.assignee) : true;
      const matchTypes = filters.types.length > 0 ? filters.types.includes(issue.type) : true;
      const matchStatuses = filters.statuses.length > 0 ? filters.statuses.includes(issue.status) : true;

      return matchSearch && matchAssigneeQuick && matchPriorityQuick && matchAssignees && matchTypes && matchStatuses;
    });
  }, [issues, filters, space]);

  const splitSortedIssues = useMemo(() => {
    if (!space) return [];
    const arr = [...filteredIssues];
    const mul = listSplitSortDir === "asc" ? 1 : -1;
    const priorityRank = (p: string | undefined) =>
      p === "High" ? 3 : p === "Medium" ? 2 : p === "Low" ? 1 : 0;
    const statusRank = (s: string | undefined) =>
      s === "To Do" ? 1 : s === "In Progress" ? 2 : s === "Done" ? 3 : 0;
    const keyNum = (issue: { id: string }) => parseInt(String(issue.id), 10) || 0;

    arr.sort((a, b) => {
      let cmp = 0;
      switch (listSplitSortBy) {
        case "created":
          cmp =
            new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
        case "key":
          cmp = keyNum(a) - keyNum(b);
          break;
        case "lastViewed":
          cmp =
            new Date(a.updatedAt || a.createdAt || 0).getTime() -
            new Date(b.updatedAt || b.createdAt || 0).getTime();
          break;
        case "priority":
          cmp = priorityRank(a.priority) - priorityRank(b.priority);
          break;
        case "resolved": {
          const doneA = a.status === "Done" ? 1 : 0;
          const doneB = b.status === "Done" ? 1 : 0;
          cmp = doneA - doneB;
          break;
        }
        case "status":
          cmp = statusRank(a.status) - statusRank(b.status);
          break;
        case "updated":
          cmp =
            new Date(a.updatedAt || a.createdAt || 0).getTime() -
            new Date(b.updatedAt || b.createdAt || 0).getTime();
          break;
        default:
          cmp = String(a.title || "").localeCompare(String(b.title || ""));
      }
      return mul * cmp;
    });
    return arr;
  }, [filteredIssues, space, listSplitSortBy, listSplitSortDir]);

  const uniqueAssignees = useMemo(() => {
    const map = new Map<string, { id: string, color: string }>();
    issues.forEach(i => {
      if (!map.has(i.assignee)) {
        map.set(i.assignee, { id: i.assignee, color: i.color });
      }
    });
    return Array.from(map.values());
  }, [issues]);

  const dashboardData = useMemo(() => {
    const now = new Date();
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(now.getDate() + 7);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const keyMetrics: DashboardMetric = {
      completed: summaryFilteredIssues.filter((issue) => issue.status === "Done").length,
      updated: summaryFilteredIssues.filter((issue) => new Date(issue.updatedAt || issue.createdAt) >= sevenDaysAgo).length,
      created: summaryFilteredIssues.filter((issue) => new Date(issue.createdAt || issue.updatedAt) >= sevenDaysAgo).length,
      dueSoon: summaryFilteredIssues.filter((issue) => {
        if (!issue.endDate || issue.status === "Done") return false;
        const due = new Date(issue.endDate);
        return due >= now && due <= sevenDaysLater;
      }).length,
    };

    const statusDistribution = [
      { name: "To Do", value: summaryFilteredIssues.filter((issue) => issue.status === "To Do").length, color: "#FB8C00" },
      { name: "In Progress", value: summaryFilteredIssues.filter((issue) => issue.status === "In Progress").length, color: "#A855F7" },
      { name: "Done", value: summaryFilteredIssues.filter((issue) => issue.status === "Done").length, color: "#7CB342" },
    ].filter((item) => item.value > 0);

    const totalWorkItems = summaryFilteredIssues.length || 1;

    const priorities = ["Highest", "High", "Medium", "Low", "Lowest", "None"].map((level) => ({
      level,
      count: summaryFilteredIssues.filter((issue) => {
        if (level === "None") return !issue.priority;
        return issue.priority === level;
      }).length,
    }));
    const maxPriorityCount = Math.max(...priorities.map((priority) => priority.count), 1);

    const typeBreakdown: { type: string; count: number; percent: number }[] = (Array.from(
      summaryFilteredIssues.reduce((acc, issue) => {
        const current = acc.get(issue.type) || 0;
        acc.set(issue.type, current + 1);
        return acc;
      }, new Map<string, number>())
    ) as [string, number][]).map(([type, count]) => ({
      type,
      count,
      percent: Math.round((count / totalWorkItems) * 100),
    }));

    const summaryAssignees: { id: string; color: string }[] = (Array.from(
      summaryFilteredIssues.reduce((acc, issue) => {
        const assigneeId = issue.assignee || "U";
        if (!acc.has(assigneeId)) {
          acc.set(assigneeId, { id: assigneeId, color: issue.color || "bg-gray-400" });
        }
        return acc;
      }, new Map<string, { id: string; color: string }>())
    ) as [string, { id: string; color: string }][]).map(([, value]) => value);

    const teamWorkload = summaryAssignees.map((user) => {
      const assignedItems = summaryFilteredIssues.filter((issue) => issue.assignee === user.id).length;
      return {
        assignee: user.id === "U" ? "Unassigned" : user.id,
        color: user.color,
        count: assignedItems,
        percent: Math.round((assignedItems / totalWorkItems) * 100),
      };
    });

    const epicStatsMap = summaryFilteredIssues.reduce((acc, issue) => {
      if (!issue.epic) return acc;
      const current = acc.get(issue.epic) || { total: 0, done: 0 };
      current.total += 1;
      if (issue.status === "Done") current.done += 1;
      acc.set(issue.epic, current);
      return acc;
    }, new Map<string, { total: number; done: number }>());

    const epicProgress: { epic: string; total: number; done: number; percent: number }[] = (Array.from(epicStatsMap.entries()) as [string, { total: number; done: number }][]).map(([epic, value]) => ({
      epic,
      total: value.total,
      done: value.done,
      percent: value.total === 0 ? 0 : Math.round((value.done / value.total) * 100),
    }));

    const activities: IssueActivity[] = [...summaryFilteredIssues]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 8)
      .map((issue) => ({
        id: issue.id,
        userName: issue.assignee === "U" ? "Unassigned" : `User ${issue.assignee || "U"}`,
        userInitials: issue.assignee || "U",
        actionLabel: issue.createdAt === issue.updatedAt ? "created issue" : "updated issue",
        issueKey: `${space?.key}-${100 + parseInt(issue.id, 10)}`,
        issueTitle: issue.title,
        status: issue.status || "To Do",
        time: formatRelativeTime(issue.updatedAt || issue.createdAt),
      }));

    return {
      keyMetrics,
      statusDistribution,
      priorities,
      maxPriorityCount,
      typeBreakdown,
      teamWorkload,
      epicProgress,
      activities,
      totalWorkItems,
      totalVisibleItems: summaryFilteredIssues.length,
    };
  }, [summaryFilteredIssues, space?.key]);

  const handleCreateIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssueForm.title.trim()) return;

    const newId = Date.now().toString();
    const issue = {
      id: newId,
      title: newIssueForm.title,
      status: newIssueForm.status,
      priority: newIssueForm.priority,
      type: newIssueForm.type,
      assignee: "U",
      color: "bg-indigo-600",
      sprintId: newIssueForm.sprintId,
      storyPoints: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      epic: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIssues([...issues, issue]);
    setShowCreateIssue(false);
    setNewIssueForm({ title: "", type: "Task", priority: "Medium", status: "To Do", sprintId: null });
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (type === "column") {
      if (source.index === destination.index) return;
      const newColumns = Array.from(columns);
      const [removed] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, removed);
      setColumns(newColumns);
      return;
    }

    if (type === "task") {
      const sourceStatus = source.droppableId;
      const destStatus = destination.droppableId;

      const draggedIssueIndex = issues.findIndex(i => i.id === draggableId);
      if (draggedIssueIndex === -1) return;

      const draggedIssue = issues[draggedIssueIndex];
      const newIssues = Array.from(issues);

      if (sourceStatus === destStatus) {
        if (source.index === destination.index) return;

        const columnIssues = newIssues.filter(i => i.status === sourceStatus);
        const targetIssue = columnIssues[destination.index];

        newIssues.splice(draggedIssueIndex, 1);
        const targetIndex = newIssues.findIndex(i => i.id === targetIssue?.id);
        newIssues.splice(targetIndex !== -1 ? targetIndex : newIssues.length, 0, draggedIssue);
      } else {
        const columnIssues = newIssues.filter(i => i.status === destStatus);
        const targetIssue = columnIssues[destination.index];

        newIssues.splice(draggedIssueIndex, 1);
        const newIssue = { ...draggedIssue, status: destStatus };
        const targetIndex = newIssues.findIndex(i => i.id === targetIssue?.id);
        newIssues.splice(targetIndex !== -1 ? targetIndex : newIssues.length, 0, newIssue);
      }

      setIssues(newIssues);
    }
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) {
      setShowCreateColumn(false);
      return;
    }
    setColumns([...columns, newColumnName.trim()]);
    setNewColumnName("");
    setShowCreateColumn(false);
    setTimeout(() => {
      columnsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
    }, 100);
  };

  const handleCreateSprint = () => {
    setEditingSprint(null);
    setIsSprintModalOpen(true);
  };

  const handleSaveSprint = (sprintData: any) => {
    if (editingSprint) {
      setSprints(sprints.map(s => s.id === editingSprint.id ? { ...s, ...sprintData } : s));
    } else {
      const newSprintId = `s${sprints.length + 1}`;
      setSprints([
        ...sprints,
        { id: newSprintId, status: "Planned", ...sprintData }
      ]);
    }
  };

  const updateIssueDirectly = (id: string, updates: any) => {
    setIssues(issues.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i));
  };

  const handleUpdateIssue = (updatedIssue: any) => {
    setIssues(issues.map(i => i.id === updatedIssue.id ? { ...updatedIssue, updatedAt: new Date().toISOString() } : i));
    setSelectedIssue(updatedIssue);
  };

  const handleUpdateIssueDate = (id: string, start: string, end: string) => {
    updateIssueDirectly(id, { startDate: start, endDate: end });
  };

  const toggleTaskSelection = (taskId: string, e?: React.ChangeEvent) => {
    if (e) e.stopPropagation();
    setSelectedTaskIds(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const toggleSprintSelection = (sprintTaskIds: string[], e?: React.ChangeEvent) => {
    if (e) e.stopPropagation();
    const isAllSelected = sprintTaskIds.length > 0 && sprintTaskIds.every(id => selectedTaskIds.includes(id));
    if (isAllSelected) {
      setSelectedTaskIds(prev => prev.filter(id => !sprintTaskIds.includes(id)));
    } else {
      setSelectedTaskIds(prev => Array.from(new Set([...prev, ...sprintTaskIds])));
    }
  };

  const handleBulkStatusChange = (newStatus: string) => {
    setIssues(issues.map(i => selectedTaskIds.includes(i.id) ? { ...i, status: newStatus } : i));
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = () => {
    if (confirm(`Bạn có chắc chắn muốn xóa ${selectedTaskIds.length} tasks đã chọn?`)) {
      setIssues(issues.filter(i => !selectedTaskIds.includes(i.id)));
      setSelectedTaskIds([]);
    }
  };

  const handleBacklogDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newIssues = Array.from(issues);
    const draggedIssueIndex = newIssues.findIndex(i => i.id === draggableId);
    if (draggedIssueIndex === -1) return;

    const draggedIssue = newIssues[draggedIssueIndex];

    // Xử lý xác định sprintId đích
    let targetSprintId: string | null = null;
    if (destination.droppableId.startsWith("sprint-")) {
      targetSprintId = destination.droppableId.replace("sprint-", "");
    }

    // Logic di chuyển
    const sourceIssues = newIssues.filter(i =>
      source.droppableId === "backlog" ? i.sprintId === null : i.sprintId === source.droppableId.replace("sprint-", "")
    );
    const destIssues = newIssues.filter(i =>
      destination.droppableId === "backlog" ? i.sprintId === null : i.sprintId === destination.droppableId.replace("sprint-", "")
    );

    if (source.droppableId === destination.droppableId) {
      // Reorder cùng một danh sách (Sprint hoặc Backlog)
      const targetIssue = sourceIssues[destination.index];
      newIssues.splice(draggedIssueIndex, 1);
      const targetIndex = newIssues.findIndex(i => i.id === targetIssue?.id);
      newIssues.splice(targetIndex !== -1 ? targetIndex : newIssues.length, 0, draggedIssue);
    } else {
      // Đổi sang danh sách khác
      const targetIssue = destIssues[destination.index];
      newIssues.splice(draggedIssueIndex, 1);
      const newIssue = { ...draggedIssue, sprintId: targetSprintId };
      const targetIndex = newIssues.findIndex(i => i.id === targetIssue?.id);
      newIssues.splice(targetIndex !== -1 ? targetIndex : newIssues.length, 0, newIssue);
    }

    setIssues(newIssues);
  };

  useEffect(() => {
    if (!spaceId) return;
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        const allSpaces = JSON.parse(localStorage.getItem("MOCK_SPACES") || "[]");
        const found = allSpaces.find((s: any) => s._id === spaceId);
        if (found) {
          setSpace(found);
          // Auto-select tab based on template
          if (found.template === "kanban") setActiveTab("board");
          else if (found.template === "scrum") setActiveTab("backlog");
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [spaceId]);

  useEffect(() => {
    if (!spaceId) return;
    try {
      const saved = localStorage.getItem(`list_view_mode_${spaceId}`);
      setListViewMode(saved === "split" ? "split" : "grid");
    } catch {
      /* ignore */
    }
  }, [spaceId]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        isSummaryFilterOpen &&
        summaryFilterRef.current &&
        !summaryFilterRef.current.contains(event.target as Node)
      ) {
        setIsSummaryFilterOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSummaryFilterOpen(false);
    };

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isSummaryFilterOpen]);

  useEffect(() => {
    const handle = (event: MouseEvent) => {
      if (
        listSplitOrderOpen &&
        listSplitToolbarRef.current &&
        !listSplitToolbarRef.current.contains(event.target as Node)
      ) {
        setListSplitOrderOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [listSplitOrderOpen]);

  useEffect(() => {
    if (activeTab !== "list") setListGridDrawerOpen(false);
  }, [activeTab]);

  /** Split: chọn item đầu khi vừa bật Split; giữ selection hợp lệ khi sort/filter đổi */
  useEffect(() => {
    if (activeTab !== "list" || listViewMode !== "split") return;
    if (splitJustActivatedRef.current) {
      splitJustActivatedRef.current = false;
      const first = splitSortedIssues[0];
      setSelectedIssue(first ?? null);
      return;
    }
    if (splitSortedIssues.length === 0) {
      setSelectedIssue(null);
      return;
    }
    if (!selectedIssue || !splitSortedIssues.some((i) => i.id === selectedIssue.id)) {
      setSelectedIssue(splitSortedIssues[0]);
    }
  }, [activeTab, listViewMode, splitSortedIssues, selectedIssue]);

  const setListViewModePersisted = (mode: "grid" | "split") => {
    if (mode === "grid") {
      setListGridDrawerOpen(false);
      setSelectedIssue(null);
    }
    setListViewMode(mode);
    if (spaceId) {
      try {
        localStorage.setItem(`list_view_mode_${spaceId}`, mode);
      } catch {
        /* ignore */
      }
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!space) return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-gray-500 mb-4">Không tìm thấy không gian (Space) này</p>
      <Link href="/spaces" className="text-indigo-600 hover:text-indigo-800">Quay lại danh sách Space</Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/spaces" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowRight className="w-5 h-5 text-gray-500 rotate-180" />
          </Link>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${space.template === 'scrum' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
            {space.template === 'scrum' ? <Repeat className="w-7 h-7 text-white" /> : <Columns className="w-7 h-7 text-white" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono font-bold">{space.key}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${space.visibility === "private" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"
                }`}>
                {space.visibility === "private" ? <><Lock className="w-3 h-3" /> Private</> : <><Globe className="w-3 h-3" /> Public</>}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              {space.name}
              <Link href={`/spaces/${spaceId}/settings`} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-700">
                <Settings className="w-5 h-5" />
              </Link>
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors shadow-sm">
            Mời thành viên
          </button>
          <button onClick={() => setShowCreateIssue(true)} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Tạo Issue
          </button>
        </div>
      </div>

      {/* Description */}
      {space.description && (
        <p className="text-gray-600 text-sm mb-6 bg-white rounded-lg px-4 py-3 border border-gray-200">{space.description}</p>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        <button onClick={() => setActiveTab("summary")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "summary" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          Summary
        </button>
        {space.template === "kanban" && (
          <button onClick={() => setActiveTab("board")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "board" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            Board
          </button>
        )}
        {space.template === "scrum" && (
          <>
            <button onClick={() => setActiveTab("backlog")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "backlog" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              Backlog
            </button>
            <button onClick={() => setActiveTab("board")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "board" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              Board
            </button>
          </>
        )}
        <button onClick={() => setActiveTab("timeline")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "timeline" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          Timeline
        </button>
        <button onClick={() => setActiveTab("list")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          List
        </button>
        <button onClick={() => setActiveTab("pages")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "pages" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          Doc
        </button>
      </div>

      {/* Content Area */}
      <div className={`rounded-2xl ${activeTab === 'pages' ? 'bg-white border border-gray-200 min-h-[500px] flex' : ''}`}>
        {activeTab === "pages" && (
          <>
            <PageTreeSidebar
              spaceId={spaceId}
              initialData={[
                {
                  id: "getting-started",
                  title: "Getting Started",
                  children: [
                    { id: "installation", title: "Installation" },
                    { id: "configuration", title: "Configuration" }
                  ]
                },
                {
                  id: "api-reference",
                  title: "API Reference",
                  children: [
                    { id: "auth", title: "Authentication" },
                    { id: "endpoints", title: "Endpoints" }
                  ]
                }
              ]}
            />
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white rounded-r-2xl">
              <BookOpen className="w-16 h-16 text-indigo-100 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tài liệu dự án</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">Quản lý tài liệu theo cấu trúc hình cây. Kéo thả để sắp xếp lại các trang. Chọn một trang bên trái để xem nội dung.</p>
              <Link href={`/spaces/${spaceId}/pages/create`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors">
                <Plus className="w-4 h-4" /> Tạo trang mới
              </Link>
            </div>
          </>
        )}

        {activeTab === "board" && (
          <div className="flex flex-col gap-4">
            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-4 px-4 pt-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm issue..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow w-64"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">Assignee:</span>
                <div className="flex -space-x-2">
                  {uniqueAssignees.map(user => (
                    <button
                      key={user.id}
                      onClick={() => setFilters(prev => ({ ...prev, assigneeId: prev.assigneeId === user.id ? null : user.id }))}
                      className={`w-8 h-8 rounded-full ${user.color} text-white flex items-center justify-center text-xs font-bold ring-2 ring-white hover:z-10 transition-transform hover:scale-110 ${filters.assigneeId === user.id ? 'ring-indigo-500 ring-offset-2 ring-offset-white' : ''} ${filters.assigneeId && filters.assigneeId !== user.id ? 'opacity-40' : ''}`}
                      title={user.id}
                    >
                      {user.id}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">Priority:</span>
                <select
                  value={filters.priority || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value || null }))}
                  className="py-2 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="">Tất cả</option>
                  <option value="High">🔴 High</option>
                  <option value="Medium">🟠 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>
              </div>
              {(filters.search || filters.assigneeId || filters.priority) && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, search: "", assigneeId: null, priority: null }))}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="board-columns" direction="horizontal" type="column">
                {(provided) => (
                  <div
                    className="flex gap-6 overflow-x-auto pb-4 min-h-[500px] p-4"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {columns.map((status, index) => (
                      <Draggable key={status} draggableId={`col-${status}`} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex-shrink-0 w-80 bg-gray-50 rounded-xl flex flex-col max-h-full border border-gray-200 shadow-sm"
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-100/50 rounded-t-xl cursor-grab active:cursor-grabbing"
                            >
                              <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide flex items-center gap-2">
                                {status}
                                <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px] font-bold">{filteredIssues.filter(i => i.status === status).length}</span>
                              </h3>
                              <button onClick={() => { setNewIssueForm({ ...newIssueForm, status }); setShowCreateIssue(true); }} className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors cursor-pointer"><Plus className="w-4 h-4" /></button>
                            </div>

                            <Droppable droppableId={status} type="task">
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`p-3 flex-1 overflow-y-auto space-y-3 min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''}`}
                                >
                                  {filteredIssues.filter(i => i.status === status).map((issue, issueIndex) => (
                                    <Draggable key={issue.id} draggableId={issue.id} index={issueIndex}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          onClick={() => setSelectedIssue(issue)}
                                          className={`bg-white p-3.5 rounded-lg shadow-sm border ${snapshot.isDragging ? 'border-indigo-500 shadow-lg rotate-2 z-50 relative' : 'border-gray-200 hover:border-indigo-400 hover:shadow-md'} transition-all cursor-grab active:cursor-grabbing group`}
                                        >
                                          <p className="text-sm font-medium text-gray-900 mb-2 leading-snug group-hover:text-indigo-600">{issue.title}</p>
                                          <div className="flex flex-wrap gap-1.5 mb-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${issue.priority === 'High' ? 'bg-red-50 text-red-600' : issue.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                                              {issue.priority}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-600`}>
                                              {issue.type}
                                            </span>
                                          </div>
                                          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                                            <span className="text-xs font-mono font-bold text-gray-400">{space.key}-{100 + parseInt(issue.id)}</span>
                                            <div className={`w-6 h-6 rounded-full ${issue.color} text-white flex items-center justify-center text-[10px] font-bold shadow-sm ring-2 ring-white`}>{issue.assignee}</div>
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                  {filteredIssues.filter(i => i.status === status).length === 0 && !snapshot.isDraggingOver && (
                                    <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-sm font-medium text-gray-400">
                                      {issues.filter(i => i.status === status).length === 0 ? "Kéo thả issue vào đây" : "Không có issue phù hợp"}
                                    </div>
                                  )}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {/* Thêm cột mới */}
                    <div className="flex-shrink-0 w-80 bg-transparent flex flex-col" ref={columnsEndRef}>
                      {showCreateColumn ? (
                        <div className="bg-white rounded-xl border border-indigo-200 p-3 shadow-sm">
                          <input
                            type="text"
                            autoFocus
                            value={newColumnName}
                            onChange={(e) => setNewColumnName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddColumn();
                              if (e.key === 'Escape') {
                                setShowCreateColumn(false);
                                setNewColumnName("");
                              }
                            }}
                            placeholder="Tên cột mới..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          />
                          <div className="flex items-center gap-2 mt-3">
                            <button onClick={handleAddColumn} className="flex-1 bg-indigo-600 text-white text-xs font-medium py-1.5 rounded hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Thêm cột
                            </button>
                            <button onClick={() => { setShowCreateColumn(false); setNewColumnName(""); }} className="flex-1 bg-gray-100 text-gray-600 text-xs font-medium py-1.5 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-1">
                              <X className="w-3.5 h-3.5" /> Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowCreateColumn(true)}
                          className="flex items-center gap-2 w-full bg-gray-50/50 hover:bg-gray-100 border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-xl p-4 text-gray-500 hover:text-gray-700 transition-all font-medium text-sm justify-center"
                        >
                          <Plus className="w-5 h-5" /> Thêm cột mới
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}

        {activeTab === "backlog" && (
          <DragDropContext onDragEnd={handleBacklogDragEnd}>
            <div className="space-y-6 w-full max-w-4xl mx-auto py-6">

              {/* Backlog Top Bar with Filter */}
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-sm font-medium text-gray-700">
                  Hiển thị {filteredIssues.length} kết quả
                </div>
                <div className="relative">
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Bộ lọc nâng cao <span className="bg-white px-1.5 py-0.5 rounded text-xs text-gray-500 shadow-sm border border-gray-200">Shift+F</span>
                  </button>
                  <FilterMenu
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                    filters={filters}
                    setFilters={setFilters}
                    density={density}
                    setDensity={setDensity}
                    assignees={uniqueAssignees}
                  />
                </div>
              </div>

              {/* Sprints Mapping */}
              {sprints.map((sprint) => {
                const sprintIssues = filteredIssues.filter(i => i.sprintId === sprint.id);
                const totalPoints = sprintIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
                const donePoints = sprintIssues.filter(i => i.status === 'Done').reduce((sum, i) => sum + (i.storyPoints || 0), 0);
                const sprintTaskIds = sprintIssues.map(i => i.id);
                const isAllSelected = sprintTaskIds.length > 0 && sprintTaskIds.every(id => selectedTaskIds.includes(id));
                const isSomeSelected = sprintTaskIds.length > 0 && sprintTaskIds.some(id => selectedTaskIds.includes(id)) && !isAllSelected;

                return (
                  <div key={sprint.id} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-sm group/sprint">
                    <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={(e) => toggleSprintSelection(sprintTaskIds, e)}
                          onClick={e => e.stopPropagation()}
                          ref={(input) => { if (input) input.indeterminate = isSomeSelected; }}
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <h3
                          className="font-bold text-gray-900 flex items-center gap-2 cursor-pointer hover:underline"
                          onClick={() => { setEditingSprint(sprint); setIsSprintModalOpen(true); }}
                        >
                          {sprint.name}
                          {sprint.status === "Active" && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full uppercase tracking-wide">Active</span>}
                        </h3>
                        <p className="text-xs text-gray-500 flex gap-2">
                          <span>{sprint.startDate ? `${sprint.startDate} - ${sprint.endDate}` : 'Chưa có ngày'}</span>
                          <span>&middot;</span>
                          <span>{sprintIssues.length} issues</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2 items-center group relative cursor-help">
                          <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center">{sprintIssues.filter(i => i.status === "To Do").length}</span>
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">{sprintIssues.filter(i => i.status === "In Progress").length}</span>
                          <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">{sprintIssues.filter(i => i.status === "Done").length}</span>

                          {/* Tooltip for Story Points */}
                          <div className="absolute top-full mt-2 right-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                            Tiến độ: {donePoints} / {totalPoints} story points
                          </div>
                        </div>
                        <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                          {sprint.status === "Active" ? "Complete Sprint" : "Start Sprint"}
                        </button>
                      </div>
                    </div>

                    <Droppable droppableId={`sprint-${sprint.id}`} type="backlog-issue">
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`p-2 space-y-1 min-h-[50px] transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/30' : ''}`}
                        >
                          {sprintIssues.map((issue, index) => (
                            <Draggable key={issue.id} draggableId={issue.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`flex items-center justify-between bg-white ${density === 'compact' ? 'p-2' : 'p-3'} rounded-lg border ${snapshot.isDragging ? 'border-indigo-400 shadow-md rotate-1 z-50 relative' : 'border-gray-100 hover:border-indigo-200'} transition-all group shadow-sm`}
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    <input
                                      type="checkbox"
                                      checked={selectedTaskIds.includes(issue.id)}
                                      onChange={(e) => toggleTaskSelection(issue.id, e)}
                                      onClick={e => e.stopPropagation()}
                                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <div className="flex items-center gap-3 flex-1" onClick={() => setSelectedIssue(issue)}>
                                      <FileText className={`w-4 h-4 ${issue.type === 'Bug' ? 'text-red-500' : issue.type === 'Story' ? 'text-emerald-500' : 'text-indigo-500'}`} />
                                      <span className="text-xs font-mono font-medium text-gray-500 w-16 hover:underline cursor-pointer">{space?.key}-{100 + parseInt(issue.id)}</span>
                                      <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 cursor-pointer">{issue.title}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {/* Editable Story Points */}
                                    <div className="relative group/pts">
                                      <input
                                        type="number"
                                        value={issue.storyPoints === 0 ? '' : issue.storyPoints}
                                        onChange={(e) => updateIssueDirectly(issue.id, { storyPoints: parseInt(e.target.value) || 0 })}
                                        placeholder="-"
                                        className="w-8 h-6 text-center text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded border border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-colors appearance-none"
                                        title="Story Points"
                                      />
                                    </div>

                                    {/* Editable Status */}
                                    <select
                                      value={issue.status}
                                      onChange={(e) => updateIssueDirectly(issue.id, { status: e.target.value })}
                                      className={`px-2 py-1 rounded text-xs font-bold cursor-pointer outline-none border-none focus:ring-2 focus:ring-indigo-500 appearance-none ${issue.status === 'Done' ? 'bg-green-50 text-green-700' : issue.status === 'In Progress' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                                    >
                                      <option value="To Do" className="bg-white text-gray-700">To Do</option>
                                      <option value="In Progress" className="bg-white text-gray-700">In Progress</option>
                                      <option value="Done" className="bg-white text-gray-700">Done</option>
                                    </select>

                                    {/* Assignee */}
                                    {issue.assignee && issue.assignee !== 'U' ? (
                                      <div className={`w-6 h-6 rounded-full ${issue.color} text-white flex items-center justify-center text-[10px] font-bold cursor-pointer ring-2 ring-transparent hover:ring-indigo-200 transition-all`}>{issue.assignee}</div>
                                    ) : (
                                      <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:text-indigo-500 text-gray-400 transition-colors">
                                        <Plus className="w-3 h-3" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {sprintIssues.length === 0 && !snapshot.isDraggingOver && (
                            <div className="p-4 text-center text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg mx-2 my-1">
                              Plan your sprint by dragging issues here
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                    <div className="px-3 pb-3">
                      <button onClick={() => { setNewIssueForm({ ...newIssueForm, sprintId: sprint.id }); setShowCreateIssue(true); }} className="text-sm text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 px-3 rounded-lg flex items-center gap-1 transition-colors">
                        <Plus className="w-4 h-4" /> Create issue
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Backlog Section */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={filteredIssues.filter(i => i.sprintId === null).length > 0 && filteredIssues.filter(i => i.sprintId === null).map(i => i.id).every(id => selectedTaskIds.includes(id))}
                      onChange={(e) => toggleSprintSelection(filteredIssues.filter(i => i.sprintId === null).map(i => i.id), e)}
                      onClick={e => e.stopPropagation()}
                      ref={(input) => {
                        if (input) {
                          const backlogIds = filteredIssues.filter(i => i.sprintId === null).map(i => i.id);
                          const isAll = backlogIds.length > 0 && backlogIds.every(id => selectedTaskIds.includes(id));
                          const isSome = backlogIds.length > 0 && backlogIds.some(id => selectedTaskIds.includes(id)) && !isAll;
                          input.indeterminate = isSome;
                        }
                      }}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      Backlog
                      <span className="text-gray-400 font-normal text-sm">({filteredIssues.filter(i => i.sprintId === null).length} issues)</span>
                    </h3>
                  </div>
                  <button onClick={handleCreateSprint} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">Create Sprint</button>
                </div>

                <Droppable droppableId="backlog" type="backlog-issue">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-2 space-y-1 min-h-[100px] transition-colors ${snapshot.isDraggingOver ? 'bg-gray-50/80' : ''}`}
                    >
                      {filteredIssues.filter(i => i.sprintId === null).map((issue, index) => (
                        <Draggable key={issue.id} draggableId={issue.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`flex items-center justify-between bg-white ${density === 'compact' ? 'p-2' : 'p-3'} rounded-lg border ${snapshot.isDragging ? 'border-indigo-400 shadow-md rotate-1 z-50 relative' : 'border-gray-100 hover:bg-gray-50'} transition-all group`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <input
                                  type="checkbox"
                                  checked={selectedTaskIds.includes(issue.id)}
                                  onChange={(e) => toggleTaskSelection(issue.id, e)}
                                  onClick={e => e.stopPropagation()}
                                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                                />
                                <div className="flex items-center gap-3 flex-1" onClick={() => setSelectedIssue(issue)}>
                                  <FileText className={`w-4 h-4 ${issue.type === 'Bug' ? 'text-red-500' : issue.type === 'Story' ? 'text-emerald-500' : 'text-gray-400'}`} />
                                  <span className="text-xs font-mono font-medium text-gray-400 w-16 hover:underline cursor-pointer">{space?.key}-{100 + parseInt(issue.id)}</span>
                                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 cursor-pointer">{issue.title}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {/* Editable Story Points */}
                                <div className="relative group/pts">
                                  <input
                                    type="number"
                                    value={issue.storyPoints === 0 ? '' : issue.storyPoints}
                                    onChange={(e) => updateIssueDirectly(issue.id, { storyPoints: parseInt(e.target.value) || 0 })}
                                    placeholder="-"
                                    className="w-8 h-6 text-center text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded border border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-colors appearance-none"
                                    title="Story Points"
                                  />
                                </div>

                                {/* Editable Status */}
                                <select
                                  value={issue.status}
                                  onChange={(e) => updateIssueDirectly(issue.id, { status: e.target.value })}
                                  className={`px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold cursor-pointer outline-none border-none focus:ring-2 focus:ring-indigo-500 appearance-none`}
                                >
                                  <option value="To Do">To Do</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Done">Done</option>
                                </select>

                                {/* Assignee */}
                                {issue.assignee && issue.assignee !== 'U' ? (
                                  <div className={`w-6 h-6 rounded-full ${issue.color} text-white flex items-center justify-center text-[10px] font-bold cursor-pointer ring-2 ring-transparent hover:ring-indigo-200 transition-all`}>{issue.assignee}</div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:text-indigo-500 hover:border-indigo-500 transition-colors cursor-pointer">
                                    <Plus className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                <div className="p-3 bg-gray-50/30 border-t border-gray-100 flex items-center gap-2 relative">
                  <input
                    type="text"
                    placeholder="Bạn cần làm gì tiếp theo?"
                    className="flex-1 py-1.5 px-3 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        const newId = Date.now().toString();
                        setIssues([...issues, {
                          id: newId, title: e.currentTarget.value, status: "To Do", priority: "Medium", type: "Task", assignee: "U", color: "bg-indigo-600", sprintId: null, storyPoints: 0
                        }]);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <button onClick={() => { setNewIssueForm({ ...newIssueForm, sprintId: null }); setShowCreateIssue(true); }} className="text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 px-3 py-1.5 rounded transition-colors whitespace-nowrap">
                    Mở modal...
                  </button>
                </div>
              </div>
            </div>
          </DragDropContext>
        )}

        {activeTab === "list" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex flex-wrap items-center justify-end gap-3 mb-4">
              <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-100">
                <button
                  type="button"
                  onClick={() => setListViewModePersisted("grid")}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${listViewMode === "grid"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                  title="Table view"
                >
                  <LayoutGrid className="w-4 h-4" /> Table
                </button>
                <button
                  type="button"
                  onClick={() => {
                    splitJustActivatedRef.current = true;
                    setListGridDrawerOpen(false);
                    setListViewModePersisted("split");
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${listViewMode === "split"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                  title="Split view"
                >
                  <PanelRight className="w-4 h-4" /> Split
                </button>
              </div>
            </div>

            {listViewMode === "grid" ? (
              <DataGridListView
                issues={filteredIssues}
                onClickTask={(issue) => {
                  setSelectedIssue(issue);
                  setListGridDrawerOpen(true);
                }}
                onUpdateIssue={(id, updates) => updateIssueDirectly(id, updates)}
              />
            ) : (
              <div className="flex flex-col lg:grid lg:grid-cols-[minmax(260px,340px)_1fr] h-[min(720px,calc(100vh-240px))] border border-gray-200 rounded-xl overflow-hidden">
                <aside className="flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50 shrink-0 max-h-[45vh] lg:max-h-none min-h-0">
                  <div
                    ref={listSplitToolbarRef}
                    className="flex items-center gap-1.5 px-2 py-2 border-b border-gray-200 bg-white shrink-0"
                  >
                    <div className="relative flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => setListSplitOrderOpen((o) => !o)}
                        title={`Order work items by: ${LIST_SPLIT_SORT_OPTIONS.find((o) => o.id === listSplitSortBy)?.label ?? listSplitSortBy} (${listSplitSortDir})`}
                        className={`flex w-full items-center justify-between gap-2 rounded-md border bg-white px-2.5 py-1.5 text-left text-sm font-medium transition-colors hover:bg-gray-50 ${listSplitOrderOpen
                          ? "border-blue-500 text-blue-700 ring-1 ring-blue-200"
                          : "border-gray-300 text-gray-800"
                          }`}
                      >
                        <span className="truncate">Custom field</span>
                        <ChevronDown className={`h-4 w-4 shrink-0 ${listSplitOrderOpen ? "text-blue-600" : "text-gray-500"}`} />
                      </button>
                      {listSplitOrderOpen && (
                        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Order work items by
                          </div>
                          {LIST_SPLIT_SORT_OPTIONS.map((opt) => (
                            <label
                              key={opt.id}
                              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                            >
                              <input
                                type="radio"
                                name="list-split-sort"
                                checked={listSplitSortBy === opt.id}
                                onChange={() => {
                                  setListSplitSortBy(opt.id);
                                  setListSplitOrderOpen(false);
                                }}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <span>{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      title={listSplitSortDir === "asc" ? "Sort ascending" : "Sort descending"}
                      onClick={() => setListSplitSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                      className="shrink-0 rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 hover:bg-gray-100"
                    >
                      <ArrowDownWideNarrow
                        className={`h-4 w-4 ${listSplitSortDir === "asc" ? "rotate-180" : ""}`}
                      />
                    </button>
                    <button
                      type="button"
                      title="Reset sort"
                      onClick={() => {
                        setListSplitSortBy("key");
                        setListSplitSortDir("asc");
                      }}
                      className="shrink-0 rounded-md border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-50"
                    >
                      <RotateCw className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    {splitSortedIssues.length === 0 ? (
                      <p className="p-4 text-sm text-gray-500">Không có issue trong bộ lọc hiện tại.</p>
                    ) : (
                      <>
                        <ul className="flex-1 space-y-1 overflow-y-auto p-2">
                          {splitSortedIssues.map((issue) => {
                            const active = selectedIssue?.id === issue.id;
                            const issueKey = `${space.key}-${100 + parseInt(String(issue.id), 10)}`;
                            return (
                              <li key={issue.id}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedIssue(issue)}
                                  className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${active
                                    ? "border-indigo-400 bg-white shadow-sm ring-1 ring-indigo-200"
                                    : "border-transparent bg-white hover:border-gray-200 hover:bg-gray-50"
                                    }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <FileText
                                      className={`h-4 w-4 shrink-0 ${issue.type === "Bug" ? "text-red-500" : issue.type === "Story" ? "text-emerald-500" : "text-blue-500"}`}
                                    />
                                    <span className="shrink-0 font-mono text-xs text-gray-500">{issueKey}</span>
                                  </div>
                                  <p className="mt-1 line-clamp-2 text-sm font-medium text-gray-900">{issue.title}</p>
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    <span
                                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${issue.status === "Done"
                                        ? "bg-green-50 text-green-700"
                                        : issue.status === "In Progress"
                                          ? "bg-blue-50 text-blue-700"
                                          : "bg-gray-100 text-gray-700"
                                        }`}
                                    >
                                      {issue.status}
                                    </span>
                                    {issue.priority && (
                                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                                        {issue.priority}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                        <div className="shrink-0 border-t border-gray-200 bg-gray-100 px-3 py-2 text-center text-xs text-gray-600">
                          {splitSortedIssues.length} of {splitSortedIssues.length}
                        </div>
                      </>
                    )}
                  </div>
                </aside>
                <section className="flex min-h-[320px] flex-col overflow-hidden bg-white lg:min-h-0">
                  {!selectedIssue ? (
                    <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-gray-500">
                      Chọn một issue ở cột trái để xem chi tiết.
                    </div>
                  ) : splitSortedIssues.some((i) => i.id === selectedIssue.id) ? (
                    <TaskDetailDrawer
                      embedded
                      isOpen={true}
                      issue={selectedIssue}
                      spaceKey={space.key}
                      onClose={() => setSelectedIssue(null)}
                      onUpdateIssue={handleUpdateIssue}
                    />
                  ) : (
                    <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-gray-500">
                      Issue đang chọn không còn trong danh sách sau khi lọc.{" "}
                      <button
                        type="button"
                        onClick={() => setSelectedIssue(null)}
                        className="ml-1 font-medium text-indigo-600 hover:underline"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="p-4">
            <TimelineView
              issues={filteredIssues}
              sprints={sprints}
              onUpdateIssueDate={handleUpdateIssueDate}
              onClickTask={(issue) => setSelectedIssue(issue)}
            />
          </div>
        )}

        {activeTab === "summary" && (
          <div className="w-full space-y-5">
            <div className="flex items-center justify-between relative" ref={summaryFilterRef}>
              <button
                onClick={() => setIsSummaryFilterOpen((prev) => !prev)}
                className={`inline-flex items-center gap-2 border px-3 py-2 rounded-md text-sm font-medium transition-colors ${isSummaryFilterOpen
                  ? "border-blue-600 text-blue-700 bg-blue-50"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filter
                {selectedSummaryFields.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-[11px]">
                    {selectedSummaryFields.length}
                  </span>
                )}
              </button>

              {isSummaryFilterOpen && (
                <div className="absolute top-12 left-0 w-[360px] md:w-[460px] bg-white border border-gray-300 rounded-lg shadow-xl z-30 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <input
                      autoFocus
                      value={summaryFilterSearch}
                      onChange={(e) => setSummaryFilterSearch(e.target.value)}
                      placeholder="Search more filters"
                      className="w-full px-3 py-2 rounded-md border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    />
                  </div>
                  <div className="max-h-80 overflow-y-auto py-1">
                    {visibleSummaryFilterFields.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-500">No filters found</p>
                    ) : (
                      visibleSummaryFilterFields.map((field) => {
                        const checked = selectedSummaryFields.includes(field.id);
                        return (
                          <label
                            key={field.id}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer border-l-2 ${checked
                              ? "bg-gray-100 border-blue-600 text-gray-900"
                              : "border-transparent hover:bg-gray-50 text-gray-800"
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setSelectedSummaryFields((prev) =>
                                  prev.includes(field.id)
                                    ? prev.filter((id) => id !== field.id)
                                    : [...prev, field.id]
                                )
                              }
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{field.label}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                  <div className="px-4 py-3 border-t border-gray-200 text-right text-sm text-gray-500 font-medium">
                    {visibleSummaryFilterFields.length} of {summaryFilterFields.length}
                  </div>
                </div>
              )}
            </div>

            {selectedSummaryFields.length > 0 && (
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold">{dashboardData.totalVisibleItems}</span> work items after applying{" "}
                <span className="font-semibold">{selectedSummaryFields.length}</span> filter field(s).
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "completed", value: dashboardData.keyMetrics.completed, subtitle: "in the last 7 days", icon: CheckCircle2, iconTone: "text-emerald-600" },
                { label: "updated", value: dashboardData.keyMetrics.updated, subtitle: "in the last 7 days", icon: PencilLine, iconTone: "text-gray-600" },
                { label: "created", value: dashboardData.keyMetrics.created, subtitle: "in the last 7 days", icon: FileText, iconTone: "text-gray-600" },
                { label: "due soon", value: dashboardData.keyMetrics.dueSoon, subtitle: "in the next 7 days", icon: CalendarClock, iconTone: "text-amber-600" },
              ].map((item) => (
                <div key={item.label} className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center">
                    <item.icon className={`w-5 h-5 ${item.iconTone}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 leading-none">{item.value}</p>
                    <p className="text-base text-gray-900 font-semibold leading-tight capitalize">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Status overview</h3>
                  <p className="text-sm text-gray-600">
                    Get a snapshot of the status of your work items.{" "}
                    <button className="text-blue-700 hover:underline font-medium">View all work items</button>
                  </p>
                </div>
              </div>
              {dashboardData.statusDistribution.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                  <div className="flex justify-center">
                    <div
                      className="w-72 h-72 rounded-full relative"
                      style={{
                        background: `conic-gradient(${dashboardData.statusDistribution
                          .map((status, index) => {
                            const previous = dashboardData.statusDistribution
                              .slice(0, index)
                              .reduce((sum, item) => sum + item.value, 0);
                            const start = Math.round((previous / dashboardData.totalWorkItems) * 360);
                            const end = Math.round(((previous + status.value) / dashboardData.totalWorkItems) * 360);
                            return `${status.color} ${start}deg ${end}deg`;
                          })
                          .join(", ")})`,
                      }}
                    >
                      <div className="absolute inset-6 bg-white rounded-full flex flex-col items-center justify-center text-center">
                        <p className="text-4xl font-bold text-gray-900 leading-none">{dashboardData.totalVisibleItems}</p>
                        <p className="text-sm font-semibold text-gray-700 mt-2">Total work items</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {dashboardData.statusDistribution.map((status) => (
                      <div key={status.name} className="flex items-center gap-3 text-sm">
                        <span className="w-4 h-4 rounded-sm" style={{ backgroundColor: status.color }} />
                        <span className="text-gray-700">{status.name}: {status.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No status data available.</p>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Recent activity</h3>
                  <p className="text-sm text-gray-600">Stay up to date with what's happening across the space.</p>
                </div>
                <button className="w-9 h-9 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto pr-2 space-y-4">
                {dashboardData.activities.length === 0 ? (
                  <p className="text-sm text-gray-500">No activity yet.</p>
                ) : (
                  dashboardData.activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                        {activity.userInitials}
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-700 leading-6">
                          <span className="font-semibold text-blue-700">{activity.userName}</span>{" "}
                          {activity.actionLabel} on{" "}
                          <span className="text-blue-700 hover:underline cursor-pointer">
                            {activity.issueKey}: {activity.issueTitle}
                          </span>{" "}
                          <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                            {activity.status.toUpperCase()}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-xl font-semibold text-gray-900">Priority breakdown</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get a holistic view of how work is being prioritized.{" "}
                  <button className="text-blue-700 hover:underline font-medium">How to manage priorities for spaces</button>
                </p>
                <div className="h-60 border-l border-b border-gray-300 px-3 pb-2">
                  <div className="h-full flex items-end justify-between gap-1.5">
                    {dashboardData.priorities.map((priority) => (
                      <div key={priority.level} className="flex-1 flex flex-col items-center justify-end gap-2">
                        <div
                          className="w-full max-w-12 bg-gray-400 rounded-sm"
                          style={{ height: `${Math.max(Math.round((priority.count / dashboardData.maxPriorityCount) * 100), priority.count > 0 ? 12 : 0)}%` }}
                        />
                        <span className="text-[11px] text-gray-500 truncate max-w-full">{priority.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-xl font-semibold text-gray-900">Types of work</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get a breakdown of work items by their types.{" "}
                  <button className="text-blue-700 hover:underline font-medium">View all items</button>
                </p>
                <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
                  {dashboardData.typeBreakdown.map((item) => (
                    <div key={item.type} className="grid grid-cols-[1fr_2fr] items-center gap-4">
                      <span className="text-sm text-gray-700">{item.type}</span>
                      <div className="h-7 rounded bg-gray-200 overflow-hidden">
                        <div className="h-full bg-gray-500 text-white text-sm font-semibold px-3 flex items-center" style={{ width: `${item.percent}%` }}>
                          {item.percent > 10 ? `${item.percent}%` : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-xl font-semibold text-gray-900">Team workload</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Monitor the capacity of your team.{" "}
                  <button className="text-blue-700 hover:underline font-medium">Reassign work items to get the right balance</button>
                </p>
                <div className="space-y-3">
                  {dashboardData.teamWorkload.map((item) => (
                    <div key={item.assignee} className="grid grid-cols-[1fr_2fr] items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span className={`w-7 h-7 rounded-full ${item.color} text-white text-[10px] font-bold flex items-center justify-center`}>
                          {item.assignee === "Unassigned" ? "U" : item.assignee}
                        </span>
                        {item.assignee}
                      </div>
                      <div className="h-7 rounded bg-gray-200 overflow-hidden">
                        <div className="h-full bg-gray-500 text-white text-sm font-semibold px-3 flex items-center" style={{ width: `${item.percent}%` }}>
                          {item.percent > 10 ? `${item.percent}%` : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-xl font-semibold text-gray-900">Epic progress</h3>
                <p className="text-sm text-gray-600 mb-4">
                  See how your epics are progressing at a glance.{" "}
                  <button className="text-blue-700 hover:underline font-medium">View all epics</button>
                </p>
                <div className="flex items-center gap-5 text-sm text-gray-600 mb-4">
                  <span className="inline-flex items-center gap-2"><span className="w-3 h-3 bg-green-600 rounded-sm" />Done</span>
                  <span className="inline-flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-sm" />In progress</span>
                  <span className="inline-flex items-center gap-2"><span className="w-3 h-3 bg-gray-500 rounded-sm" />To do</span>
                </div>
                {dashboardData.epicProgress.length === 0 ? (
                  <div className="rounded-md border border-dashed border-gray-300 p-5 text-sm text-gray-500">
                    No epics yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboardData.epicProgress.map((epic) => (
                      <div key={epic.epic}>
                        <p className="text-sm font-medium text-gray-700 mb-2">{epic.epic}</p>
                        <div className="h-7 rounded bg-gray-200 overflow-hidden">
                          <div className="h-full bg-gray-500 text-white text-sm font-semibold px-3 flex items-center" style={{ width: `${epic.percent}%` }}>
                            {epic.percent}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tạo Issue */}
      {showCreateIssue && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Tạo Issue mới
              </h3>
              <button onClick={() => setShowCreateIssue(false)} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateIssue} className="p-6 space-y-5 bg-gray-50/30">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tiêu đề công việc <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newIssueForm.title}
                  onChange={(e) => setNewIssueForm({ ...newIssueForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm transition-all"
                  placeholder="Vd: Sửa lỗi hiển thị trên màn hình Mobile..."
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại Issue</label>
                  <select
                    value={newIssueForm.type}
                    onChange={(e) => setNewIssueForm({ ...newIssueForm, type: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm"
                  >
                    <option value="Task">📌 Task (Nhiệm vụ)</option>
                    <option value="Bug">🐛 Bug (Lỗi)</option>
                    <option value="Story">📖 Story (Tính năng)</option>
                    <option value="Design">🎨 Design (Thiết kế)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mức độ ưu tiên</label>
                  <select
                    value={newIssueForm.priority}
                    onChange={(e) => setNewIssueForm({ ...newIssueForm, priority: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm"
                  >
                    <option value="High">🔴 High (Cao)</option>
                    <option value="Medium">🟠 Medium (Trung bình)</option>
                    <option value="Low">🟢 Low (Thấp)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái ban đầu</label>
                <select
                  value={newIssueForm.status}
                  onChange={(e) => setNewIssueForm({ ...newIssueForm, status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm bg-white"
                >
                  <option value="To Do">⭕ To Do (Chưa làm)</option>
                  <option value="In Progress">⏳ In Progress (Đang làm)</option>
                  <option value="Done">✅ Done (Hoàn thành)</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateIssue(false)} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors">
                  Hủy bỏ
                </button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                  Tạo mới ngay
                </button>
              </div>
            </form>
          </div>
        </div>
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
