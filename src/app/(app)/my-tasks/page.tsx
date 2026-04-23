"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/app/common/components/LoadingSpinner";
import Link from "next/link";
import { CheckSquare, ArrowRight, AlertCircle } from "lucide-react";

interface Task {
  _id: string; key: string; title: string; type: string; priority: string;
  status: string; projectId?: any; dueDate?: string; labels: string[];
}

const priorityColors: Record<string, string> = {
  highest: "bg-red-500", high: "bg-orange-400", medium: "bg-yellow-400",
  low: "bg-blue-400", lowest: "bg-gray-300"
};
const typeColors: Record<string, string> = {
  task: "bg-gray-400", bug: "bg-red-400", story: "bg-green-400", epic: "bg-purple-500"
};

export default function MyTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const fetchTasks = async () => {
      try {
        const res = await api.get(apiRoutes.TASKS.ASSIGNEE(user.id));
        setTasks(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchTasks();
  }, [user?.id]);

  if (loading) return <LoadingSpinner />;

  const grouped = tasks.reduce((acc, task) => {
    const status = task.status || "todo";
    if (!acc[status]) acc[status] = [];
    acc[status].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-500 text-sm">{tasks.length} tasks assigned to you</p>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center py-16 bg-white rounded-xl border border-gray-200">
          <CheckSquare className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No tasks assigned to you</p>
          <p className="text-gray-400 text-sm mt-1">Tasks will appear here when assigned</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([status, statusTasks]) => (
            <div key={status} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800 capitalize">{status}</h2>
                <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs">{statusTasks.length}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {statusTasks.map((task) => (
                  <Link key={task._id} href={`/tasks/${task._id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
                    <div className={`w-2.5 h-2.5 rounded-full ${typeColors[task.type] || "bg-gray-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{task.key}</span>
                        {task.projectId?.name && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-xs text-gray-400">{task.projectId.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {task.dueDate && (
                      <div className={`flex items-center gap-1 text-xs ${new Date(task.dueDate) < new Date() ? "text-red-600" : "text-gray-400"}`}>
                        <AlertCircle className="w-3 h-3" />
                        {new Date(task.dueDate).toLocaleDateString("vi-VN")}
                      </div>
                    )}
                    <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority] || "bg-gray-300"}`} />
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
