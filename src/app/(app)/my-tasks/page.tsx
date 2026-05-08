"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/app/common/components/LoadingSpinner";
import Link from "next/link";
import {
  CheckSquare, Filter, ArrowUpDown, Calendar, AlertCircle, Search,
  ChevronDown, User, FolderKanban, LayoutGrid, List, ArrowRight,
  Plus, SortAsc, Clock
} from "lucide-react";

interface Task {
  _id: string;
  key: string;
  title: string;
  type: "task" | "bug" | "story" | "epic";
  priority: "highest" | "high" | "medium" | "low" | "lowest";
  status: string;
  dueDate?: string;
  projectId?: { _id: string; name: string; key: string };
  assigneeId?: string;
  reporterId?: string;
  storyPoints?: number;
  labels: string[];
  description?: string;
}

const typeConfig: Record<string, { color: string; bg: string; label: string }> = {
  task: { color: "text-slate-600", bg: "bg-slate-400", label: "Task" },
  bug: { color: "text-red-600", bg: "bg-red-500", label: "Bug" },
  story: { color: "text-green-700", bg: "bg-green-500", label: "Story" },
  epic: { color: "text-purple-600", bg: "bg-purple-500", label: "Epic" },
};

const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
  highest: { color: "text-red-600", bg: "bg-red-500", label: "Highest" },
  high: { color: "text-orange-600", bg: "bg-orange-500", label: "High" },
  medium: { color: "text-yellow-600", bg: "bg-yellow-500", label: "Medium" },
  low: { color: "text-blue-600", bg: "bg-blue-400", label: "Low" },
  lowest: { color: "text-slate-400", bg: "bg-slate-300", label: "Lowest" },
};

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  todo: { color: "text-slate-600", bg: "bg-slate-100", label: "To Do" },
  inprogress: { color: "text-blue-700", bg: "bg-blue-100", label: "In Progress" },
  review: { color: "text-purple-700", bg: "bg-purple-100", label: "In Review" },
  done: { color: "text-green-700", bg: "bg-green-100", label: "Done" },
  completed: { color: "text-green-700", bg: "bg-green-100", label: "Completed" },
};

type GroupBy = "status" | "project" | "priority" | "none";

export default function MyTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("status");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"priority" | "dueDate" | "updated">("priority");

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    const fetchTasks = async () => {
      try {
        const res = await api.get(apiRoutes.TASKS.ASSIGNEE(user.id));
        setTasks(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchTasks();
  }, [user?.id]);

  const priorityOrder: Record<string, number> = { highest: 0, high: 1, medium: 2, low: 3, lowest: 4 };

  let filtered = tasks.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.key.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchType = filterType === "all" || t.type === filterType;
    const matchPriority = filterPriority === "all" || t.priority === filterPriority;
    return matchSearch && matchStatus && matchType && matchPriority;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "priority") return (priorityOrder[a.priority] ?? 5) - (priorityOrder[b.priority] ?? 5);
    if (sortBy === "dueDate") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return 0;
  });

  const grouped = sorted.reduce((acc, task) => {
    let key: string;
    if (groupBy === "status") key = task.status || "todo";
    else if (groupBy === "project") key = task.projectId?.name || "No Project";
    else if (groupBy === "priority") key = task.priority || "medium";
    else key = "all";
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const groupLabels: Record<string, string> = {
    todo: "To Do", inprogress: "In Progress", review: "In Review", done: "Done", completed: "Completed",
    highest: "Highest Priority", high: "High Priority", medium: "Medium Priority", low: "Low Priority", lowest: "Lowest Priority",
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-500 text-sm mt-0.5">{tasks.length} tasks assigned to you</p>
        </div>
        <Link href="/projects" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors">
          <Plus className="w-4 h-4" /> Create Task
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>

          {/* Filter dropdowns */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="all">All Status</option>
              {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="all">All Types</option>
              {Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="all">All Priorities</option>
              {Object.entries(priorityConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          <div className="h-6 w-px bg-gray-200 mx-1" />

          {/* Group By */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Group:</span>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {(["status", "project", "priority", "none"] as GroupBy[]).map((g) => (
                <button key={g} onClick={() => setGroupBy(g)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize ${groupBy === g ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {g === "none" ? "None" : g}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SortAsc className="w-4 h-4 text-gray-400" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="priority">Sort: Priority</option>
              <option value="dueDate">Sort: Due Date</option>
              <option value="updated">Sort: Updated</option>
            </select>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
            <CheckSquare className="w-8 h-8 text-indigo-400" />
          </div>
          <p className="text-gray-500 font-medium text-lg">No tasks assigned</p>
          <p className="text-gray-400 text-sm mt-1">Tasks you create or are assigned to will appear here</p>
          <Link href="/projects" className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Go to Projects
          </Link>
        </div>
      ) : groupBy === "none" ? (
        <div className="space-y-2">
          {sorted.map((task) => <TaskRow key={task._id} task={task} />)}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([key, groupTasks]) => (
            <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3.5 bg-gray-50 border-b border-gray-100">
                {groupBy === "status" && statusConfig[key] && (
                  <span className={`w-2.5 h-2.5 rounded-full ${statusConfig[key].bg}`} />
                )}
                {groupBy === "priority" && priorityConfig[key] && (
                  <span className={`w-2.5 h-2.5 rounded-full ${priorityConfig[key].bg}`} />
                )}
                <h2 className="font-semibold text-gray-800 text-sm">
                  {groupLabels[key] || key}
                </h2>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">{groupTasks.length}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {groupTasks.map((task) => <TaskRow key={task._id} task={task} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const type = typeConfig[task.type] || typeConfig.task;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done" && task.status !== "completed";

  return (
    <Link href={`/tasks/${task._id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
      {/* Priority dot */}
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priority.bg}`} title={priority.label} />

      {/* Type indicator */}
      <span className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${type.bg}`} title={type.label}>
        <CheckSquare className="w-3.5 h-3.5 text-white" />
      </span>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400">{task.key}</span>
          {task.projectId && (
            <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{task.projectId.key}</span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-800 truncate mt-0.5 group-hover:text-indigo-600 transition-colors">{task.title}</p>
        {task.labels.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            {task.labels.slice(0, 3).map((label) => (
              <span key={label} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">{label}</span>
            ))}
          </div>
        )}
      </div>

      {/* Story points */}
      {task.storyPoints && (
        <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-medium flex-shrink-0">{task.storyPoints} pts</span>
      )}

      {/* Due date */}
      {task.dueDate && (
        <div className={`flex items-center gap-1 text-xs flex-shrink-0 ${isOverdue ? "text-red-600 font-medium" : "text-gray-400"}`}>
          <Calendar className="w-3.5 h-3.5" />
          {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </div>
      )}

      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
    </Link>
  );
}
