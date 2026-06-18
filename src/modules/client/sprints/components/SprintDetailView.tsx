"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckSquare,
  Target,
  TrendingUp,
  Calendar,
  Play,
  BarChart3,
} from "lucide-react";
import type { Sprint, SprintStats } from "../types/sprintDetail.type";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const statusConfig: Record<string, { color: string; bg: string; icon: any }> = {
  planning: { color: "text-slate-700", bg: "bg-slate-100", icon: Target },
  active: { color: "text-green-700", bg: "bg-green-100", icon: Play },
  completed: { color: "text-blue-700", bg: "bg-blue-100", icon: CheckSquare },
};

interface SprintDetailViewProps {
  sprint: Sprint | null;
  stats: SprintStats | null;
  actionLoading: boolean;
  handleStartSprint: () => Promise<void>;
  handleCompleteSprint: () => Promise<void>;
}

export default function SprintDetailView({
  sprint,
  stats,
  actionLoading,
  handleStartSprint,
  handleCompleteSprint,
}: SprintDetailViewProps) {
  if (!sprint) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500 mb-4">Sprint not found</p>
        <Link href="/sprints" className="text-indigo-600 hover:text-indigo-800">
          Back to Sprints
        </Link>
      </div>
    );
  }

  const status = statusConfig[sprint.status] || statusConfig.planning;
  const pct = stats ? (stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0) : 0;
  const pointsPct = stats
    ? stats.totalPoints > 0
      ? Math.round((stats.completedPoints / stats.totalPoints) * 100)
      : 0
    : 0;
  const daysLeft = sprint.endDate
    ? Math.max(0, Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="app-page-narrow py-8 pb-12 px-4">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/sprints"
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{sprint.name}</h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${status.bg} ${status.color}`}
              >
                <status.icon className="w-3.5 h-3.5" />
                {sprint.status.charAt(0).toUpperCase() + sprint.status.slice(1)}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {sprint.projectId.key} &middot; {sprint.projectId.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {sprint.status === "planning" && (
              <button
                onClick={handleStartSprint}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium text-sm transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" /> Start Sprint
              </button>
            )}
            {sprint.status === "active" && (
              <button
                onClick={handleCompleteSprint}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors disabled:opacity-50"
              >
                <CheckSquare className="w-4 h-4" /> Complete Sprint
              </button>
            )}
          </div>
        </div>

        {sprint.goal && (
          <div className="workspace-panel bg-indigo-50 border border-indigo-100 rounded-xl mb-6">
            <p className="text-sm font-medium text-indigo-800 mb-1">Sprint Goal</p>
            <p className="text-sm text-indigo-700">{sprint.goal}</p>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Tasks Completed",
              value: `${stats?.completedTasks || 0}/${stats?.totalTasks || 0}`,
              icon: CheckSquare,
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              label: "Story Points",
              value: `${stats?.completedPoints || 0}/${stats?.totalPoints || 0}`,
              icon: Target,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            { label: "Progress", value: `${pct}%`, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
            {
              label: "Days Left",
              value: daysLeft !== null ? `${daysLeft} days` : "—",
              icon: Calendar,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="workspace-panel bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
            >
              <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Progress Bars */}
        <div className="workspace-panel bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" /> Sprint Progress
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-600 dark:text-gray-400">Task Completion</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{pct}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-indigo-500" : "bg-blue-400"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-600 dark:text-gray-400">Story Points Velocity</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{pointsPct}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${pointsPct >= 80 ? "bg-green-500" : pointsPct >= 50 ? "bg-amber-500" : "bg-amber-400"}`}
                  style={{ width: `${pointsPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="workspace-panel bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" /> Sprint Timeline
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">
                Start Date
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">
                {sprint.startDate
                  ? new Date(sprint.startDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Not set"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">
                End Date
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">
                {sprint.endDate
                  ? new Date(sprint.endDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Not set"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
