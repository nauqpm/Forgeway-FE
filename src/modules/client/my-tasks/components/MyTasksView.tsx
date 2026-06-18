"use client";

import Link from "next/link";
import {
  CheckSquare,
  Filter,
  Search,
  Calendar,
  ArrowRight,
  Plus,
  SortAsc,
} from "lucide-react";
import {
  typeConfig,
  priorityConfig,
  statusConfig,
  groupLabels,
  Task,
  GroupBy,
  SortBy,
} from "../types/myTasks.type";
import { MyTasksPageProps } from "../hooks/useMyTasksPage";

export default function MyTasksView({
  tasks,
  search,
  setSearch,
  filterStatus,
  setFilterStatus,
  filterType,
  setFilterType,
  filterPriority,
  setFilterPriority,
  sortBy,
  setSortBy,
  groupBy,
  setGroupBy,
  sorted,
  grouped,
}: MyTasksPageProps) {
  return (
    <div className="app-page-wide">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Tasks</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{tasks.length} tasks assigned to you</p>
        </div>
        <Link
          href="/workspaces"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors"
        >
          Go to Workspaces
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="workspace-panel bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[12.5rem]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              {Object.entries(statusConfig).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Types</option>
              {Object.entries(typeConfig).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Priorities</option>
              {Object.entries(priorityConfig).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <div className="h-6 w-px bg-gray-200 mx-1" />

          {/* Group By */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Group:</span>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              {(["status", "project", "priority", "none"] as GroupBy[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGroupBy(g)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize ${groupBy === g ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
                >
                  {g === "none" ? "None" : g}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SortAsc className="w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="priority">Sort: Priority</option>
              <option value="dueDate">Sort: Due Date</option>
              <option value="updated">Sort: Updated</option>
            </select>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
            <CheckSquare className="w-8 h-8 text-indigo-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No tasks assigned</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Tasks you create or are assigned to will appear here
          </p>
          <Link
            href="/workspaces"
            className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Go to Workspaces
          </Link>
        </div>
      ) : groupBy === "none" ? (
        <div className="space-y-2">
          {sorted.map((task) => (
            <TaskRow key={task._id} task={task} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([key, groupTasks]) => (
            <div
              key={key}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              <div className="flex items-center gap-3 px-5 py-3.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                {groupBy === "status" && statusConfig[key] && (
                  <span className={`w-2.5 h-2.5 rounded-full ${statusConfig[key].bg}`} />
                )}
                {groupBy === "priority" && priorityConfig[key] && (
                  <span className={`w-2.5 h-2.5 rounded-full ${priorityConfig[key].bg}`} />
                )}
                <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{groupLabels[key] || key}</h2>
                <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
                  {groupTasks.length}
                </span>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {groupTasks.map((task) => (
                  <TaskRow key={task._id} task={task} />
                ))}
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
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done" && task.status !== "completed";

  return (
    <Link
      href={`/tasks/${task._id}`}
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
    >
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
            <span className="text-[0.6875rem] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-medium">
              {task.projectId.key}
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate mt-0.5 group-hover:text-indigo-600 transition-colors">
          {task.title}
        </p>
        {task.labels.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            {task.labels.slice(0, 3).map((label) => (
              <span key={label} className="text-[0.625rem] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Story points */}
      {task.storyPoints && (
        <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-medium flex-shrink-0">
          {task.storyPoints} pts
        </span>
      )}

      {/* Due date */}
      {task.dueDate && (
        <div
          className={`flex items-center gap-1 text-xs flex-shrink-0 ${isOverdue ? "text-red-600 font-medium" : "text-gray-400"}`}
        >
          <Calendar className="w-3.5 h-3.5" />
          {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </div>
      )}

      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
    </Link>
  );
}
