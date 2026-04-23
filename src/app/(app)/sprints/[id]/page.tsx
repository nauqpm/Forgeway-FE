"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/app/common/components/LoadingSpinner";
import { ArrowLeft, Calendar, Target, Clock, CheckCircle, Play, RotateCcw, Users, Zap } from "lucide-react";

interface Sprint {
  _id: string;
  name: string;
  goal?: string;
  status: string;
  startDate: string;
  endDate: string;
  completedDate?: string;
  projectId?: { _id: string; name: string };
}

interface Task {
  _id: string;
  title: string;
  key: string;
  status: { name: string; color: string };
  assignee?: { fullName?: string };
  priority: string;
}

export default function SprintDetailPage() {
  const params = useParams();
  const { currentWorkspace } = useWorkspaceStore();
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchSprint = async () => {
      if (!params.id) return;
      try {
        const sprintRes = await api.get(apiRoutes.SPRINTS.BY_ID(params.id as string));
        setSprint(sprintRes.data);
        if (sprintRes.data._id) {
          const taskRes = await api.get(apiRoutes.TASKS.BY_SPRINT(sprintRes.data._id));
          setTasks(taskRes.data);
        }
      } catch {} finally { setLoading(false); }
    };
    fetchSprint();
  }, [params.id]);

  const handleStartSprint = async () => {
    if (!sprint?._id) return;
    setActionLoading(true);
    try {
      const res = await api.post(apiRoutes.SPRINTS.START(sprint._id));
      setSprint(res.data);
    } catch {} finally { setActionLoading(false); }
  };

  const handleCompleteSprint = async () => {
    if (!sprint?._id) return;
    setActionLoading(true);
    try {
      const res = await api.post(apiRoutes.SPRINTS.COMPLETE(sprint._id));
      setSprint(res.data);
    } catch {} finally { setActionLoading(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!sprint) return (
    <div className="flex flex-col items-center justify-center py-16">
      <p className="text-gray-500 mb-4">Sprint not found</p>
      <a href="/sprints" className="text-indigo-600 hover:text-indigo-800 font-medium">Back to Sprints</a>
    </div>
  );

  const statusConfig: Record<string, { color: string; bg: string; icon: any; label: string }> = {
    planning: { color: "text-amber-600", bg: "bg-amber-50", icon: Clock, label: "Planning" },
    active: { color: "text-blue-600", bg: "bg-blue-50", icon: Play, label: "Active" },
    completed: { color: "text-green-600", bg: "bg-green-50", icon: CheckCircle, label: "Completed" },
  };

  const config = statusConfig[sprint.status] || statusConfig.planning;
  const StatusIcon = config.icon;

  const daysRemaining = () => {
    if (sprint.status !== "active") return null;
    const end = new Date(sprint.endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const taskByStatus = tasks.reduce((acc, task) => {
    const statusName = task.status?.name || "Unknown";
    if (!acc[statusName]) acc[statusName] = [];
    acc[statusName].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="max-w-5xl mx-auto">
      <a href="/sprints" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Sprints
      </a>

      {/* Sprint Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 ${config.bg} rounded-xl flex items-center justify-center`}>
              <StatusIcon className={`w-6 h-6 ${config.color}`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{sprint.name}</h1>
              <p className="text-gray-500 text-sm mt-1">{sprint.projectId?.name || "Unknown Project"}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.color}`}>
            {config.label}
          </span>
        </div>

        {sprint.goal && (
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg mb-4">
            <Target className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Sprint Goal</p>
              <p className="text-sm text-gray-600">{sprint.goal}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Start Date</p>
              <p className="text-sm font-medium text-gray-900">{new Date(sprint.startDate).toLocaleDateString("vi-VN")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">End Date</p>
              <p className="text-sm font-medium text-gray-900">{new Date(sprint.endDate).toLocaleDateString("vi-VN")}</p>
            </div>
          </div>
          {sprint.status === "active" && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Zap className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-blue-600">Days Remaining</p>
                <p className="text-lg font-bold text-blue-600">{daysRemaining()}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {sprint.status === "planning" && (
            <button
              onClick={handleStartSprint}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2"
            >
              <Play className="w-4 h-4" /> Start Sprint
            </button>
          )}
          {sprint.status === "active" && (
            <button
              onClick={handleCompleteSprint}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Complete Sprint
            </button>
          )}
        </div>
      </div>

      {/* Sprint Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
          <p className="text-sm text-gray-500">Total Tasks</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-blue-600">{taskByStatus["In Progress"]?.length || 0}</p>
          <p className="text-sm text-gray-500">In Progress</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-amber-600">{taskByStatus["To Do"]?.length || 0}</p>
          <p className="text-sm text-gray-500">To Do</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-green-600">{taskByStatus["Done"]?.length || 0}</p>
          <p className="text-sm text-gray-500">Done</p>
        </div>
      </div>

      {/* Tasks by Status */}
      <div className="space-y-4">
        {Object.entries(taskByStatus).map(([status, statusTasks]) => (
          <div key={status} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusTasks[0]?.status?.color || "#gray" }} />
                <h3 className="font-medium text-gray-900">{status}</h3>
              </div>
              <span className="text-sm text-gray-500">{statusTasks.length} tasks</span>
            </div>
            <div className="divide-y divide-gray-100">
              {statusTasks.map((task) => (
                <a key={task._id} href={`/projects/${sprint.projectId?._id}/tasks/${task._id}`} className="block px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-gray-400">{task.key}</span>
                      <span className="text-sm text-gray-900">{task.title}</span>
                    </div>
                    {task.assignee && (
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                        {task.assignee.fullName?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
