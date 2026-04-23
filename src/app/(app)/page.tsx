"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/app/common/components/LoadingSpinner";
import {
  FolderKanban, CheckSquare, AlertCircle, TrendingUp, Clock,
  ArrowRight, Plus, ChevronRight
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  totalProjects: number;
  totalTasks: number;
  tasksByStatus: { _id: string; count: number }[];
  tasksByType: { _id: string; count: number }[];
  recentTasks: any[];
  myTasks: any[];
  activeSprints: number;
}

export default function DashboardPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspace?._id) return;
    const fetchDashboard = async () => {
      try {
        const res = await api.get(apiRoutes.DASHBOARD.WORKSPACE(currentWorkspace._id));
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [currentWorkspace?._id]);

  if (!currentWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Chào mừng đến AL-TASK</h2>
          <p className="text-gray-500 mb-6">Tạo workspace đầu tiên để bắt đầu quản lý dự án của bạn</p>
          <Link href="/workspaces/create" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium">
            <Plus className="w-5 h-5" /> Tạo Workspace
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  const getStatusCount = (status: string) => data?.tasksByStatus.find((s) => s._id === status)?.count || 0;
  const totalDone = getStatusCount("done") + getStatusCount("completed");
  const completionRate = data?.totalTasks ? Math.round((totalDone / data.totalTasks) * 100) : 0;

  const statCards = [
    { label: "Projects", value: data?.totalProjects || 0, icon: FolderKanban, color: "bg-blue-500", textColor: "text-blue-600", bgColor: "bg-blue-50" },
    { label: "Total Tasks", value: data?.totalTasks || 0, icon: CheckSquare, color: "bg-indigo-500", textColor: "text-indigo-600", bgColor: "bg-indigo-50" },
    { label: "Active Sprints", value: data?.activeSprints || 0, icon: Clock, color: "bg-amber-500", textColor: "text-amber-600", bgColor: "bg-amber-50" },
    { label: "Completion", value: `${completionRate}%`, icon: TrendingUp, color: "bg-green-500", textColor: "text-green-600", bgColor: "bg-green-50" },
  ];

  const priorityColors: Record<string, string> = {
    highest: "bg-red-500", high: "bg-orange-500", medium: "bg-yellow-500",
    low: "bg-blue-400", lowest: "bg-gray-400"
  };

  const typeColors: Record<string, string> = {
    task: "bg-gray-500", bug: "bg-red-500", story: "bg-green-500", epic: "bg-purple-500"
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">{currentWorkspace.name} overview</p>
        </div>
        <div className="flex gap-3">
          <Link href="/projects/create" className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium text-sm">
            <Plus className="w-4 h-4" /> New Project
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.textColor}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Tasks</h2>
            <Link href="/my-tasks" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data?.recentTasks?.slice(0, 5).map((task) => (
              <Link key={task._id} href={`/tasks/${task._id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${typeColors[task.type] || "bg-gray-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  <p className="text-xs text-gray-400">{task.key}</p>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  task.status === "done" ? "bg-green-100 text-green-700" :
                  task.status === "inprogress" ? "bg-blue-100 text-blue-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {task.status}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </Link>
            ))}
            {(!data?.recentTasks || data.recentTasks.length === 0) && (
              <div className="p-8 text-center text-gray-400 text-sm">No recent tasks</div>
            )}
          </div>
        </div>

        {/* My Tasks */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">My Tasks</h2>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">{data?.myTasks?.length || 0}</span>
          </div>
          <div className="p-4 space-y-3">
            {data?.myTasks?.slice(0, 5).map((task) => (
              <Link key={task._id} href={`/tasks/${task._id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-2 h-2 rounded-full ${typeColors[task.type] || "bg-gray-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                  <p className="text-xs text-gray-400">{task.key}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority] || "bg-gray-400"}`} />
              </Link>
            ))}
            {(!data?.myTasks || data.myTasks.length === 0) && (
              <div className="text-center text-gray-400 text-sm py-4">No assigned tasks</div>
            )}
          </div>
        </div>
      </div>

      {/* Tasks by Status & Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Tasks by Status</h2>
          <div className="space-y-3">
            {data?.tasksByStatus.map((s) => (
              <div key={s._id} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24">{s._id}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${data.totalTasks ? (s.count / data.totalTasks) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Tasks by Type</h2>
          <div className="space-y-3">
            {data?.tasksByType.map((t) => (
              <div key={t._id} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded ${typeColors[t._id] || "bg-gray-400"}`} />
                <span className="text-sm text-gray-600 w-16 capitalize">{t._id}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${data.totalTasks ? (t.count / data.totalTasks) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
