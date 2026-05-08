"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/app/common/components/LoadingSpinner";
import {
  FolderKanban, CheckSquare, AlertTriangle, TrendingUp, Clock,
  Plus, ArrowRight, Users, Calendar, ChevronRight, Zap, ListTodo,
  FileText, BarChart3, Activity, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import Link from "next/link";

interface Task { _id: string; key: string; title: string; type: string; priority: string; status: string; dueDate?: string; projectId?: { name: string; key: string }; }
interface Project { _id: string; name: string; key: string; taskCount?: number; completedCount?: number; }
interface Member { _id: string; fullName?: string; email: string; avatar?: string; role: string; }

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspaceStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ activeProjects: 0, completedTasks: 0, overdue: 0, velocity: 0 });

  useEffect(() => {
    if (!currentWorkspace?._id) { setLoading(false); return; }
    const fetchData = async () => {
      try {
        const [tasksRes, projectsRes, wsRes] = await Promise.all([
          user?.id ? api.get(apiRoutes.TASKS.ASSIGNEE(user.id)) : Promise.resolve({ data: [] }),
          api.get(`${apiRoutes.PROJECTS.BASE}?workspaceId=${currentWorkspace._id}`),
          api.get(apiRoutes.WORKSPACES.BY_ID(currentWorkspace._id)),
        ]);
        setTasks(tasksRes.data);
        setProjects(projectsRes.data);
        setMembers(wsRes.data.members || []);
        const allTasks = tasksRes.data;
        setStats({
          activeProjects: projectsRes.data.length,
          completedTasks: allTasks.filter((t: Task) => t.status === "done" || t.status === "completed").length,
          overdue: allTasks.filter((t: Task) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length,
          velocity: Math.round((allTasks.filter((t: Task) => t.status === "done").length / Math.max(allTasks.length, 1)) * 100),
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [currentWorkspace?._id, user?.id]);

  if (!currentWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Chào mừng đến với AL-TASK</h2>
          <p className="text-gray-500 mb-6">Tạo workspace đầu tiên để bắt đầu quản lý dự án</p>
          <Link href="/projects/create" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium">
            <Plus className="w-5 h-5" /> Bắt đầu ngay
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  const priorityOrder: Record<string, number> = { highest: 0, high: 1, medium: 2, low: 3, lowest: 4 };
  const sortedTasks = [...tasks].sort((a, b) => (priorityOrder[a.priority] ?? 5) - (priorityOrder[b.priority] ?? 5));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  const statCards = [
    { label: "Dự án đang hoạt động", value: stats.activeProjects, icon: FolderKanban, color: "indigo", trend: "+2", trendUp: true },
    { label: "Công việc đã hoàn thành", value: stats.completedTasks, icon: CheckSquare, color: "green", trend: "+5", trendUp: true },
    { label: "Quá hạn", value: stats.overdue, icon: AlertTriangle, color: "red", trend: stats.overdue > 0 ? "Cần chú ý" : "—", trendUp: false },
    { label: "Tốc độ đội nhóm", value: `${stats.velocity}%`, icon: TrendingUp, color: "blue", trend: "+3%", trendUp: true },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {user?.fullName || "Bạn"}</h1>
          <p className="text-gray-500 text-sm mt-0.5">Workspace {currentWorkspace.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/projects/create" className="inline-flex items-center gap-2 border border-indigo-600 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 font-medium text-sm transition-colors">
            <FolderKanban className="w-4 h-4" /> Dự án mới
          </Link>
          <Link href="/my-tasks" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors">
            <Plus className="w-4 h-4" /> Tạo Công việc
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                card.color === "indigo" ? "bg-indigo-50" :
                card.color === "green" ? "bg-green-50" :
                card.color === "red" ? "bg-red-50" : "bg-blue-50"
              }`}>
                <card.icon className={`w-5 h-5 ${
                  card.color === "indigo" ? "text-indigo-600" :
                  card.color === "green" ? "text-green-600" :
                  card.color === "red" ? "text-red-600" : "text-blue-600"
                }`} />
              </div>
              {card.trendUp && card.trend !== "—" ? (
                <span className="flex items-center text-xs text-green-600 font-medium"><ArrowUpRight className="w-3 h-3 mr-0.5" />{card.trend}</span>
              ) : card.trend !== "—" ? (
                <span className="text-xs text-gray-400">{card.trend}</span>
              ) : null}
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Công việc của tôi */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-gray-900">Công việc của tôi</h2>
                <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">{tasks.length}</span>
              </div>
              <Link href="/my-tasks" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium">
                Xem tất cả <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {sortedTasks.slice(0, 6).map((task) => (
                <Link key={task._id} href={`/tasks/${task._id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.priority === "highest" || task.priority === "high" ? "bg-red-500" :
                    task.priority === "medium" ? "bg-yellow-500" :
                    "bg-blue-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400">{task.key}</span>
                      {task.projectId && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{task.projectId.key}</span>}
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate mt-0.5">{task.title}</p>
                  </div>
                  {task.dueDate && (
                    <span className={`text-xs flex items-center gap-1 ${new Date(task.dueDate) < new Date() && task.status !== "done" ? "text-red-600 font-medium" : "text-gray-400"}`}>
                      <Calendar className="w-3 h-3" />
                      {new Date(task.dueDate).toLocaleDateString("vi-VN", { day: "numeric", month: "short" })}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                </Link>
              ))}
              {tasks.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">Không có công việc nào được giao cho bạn</div>
              )}
            </div>
          </div>

          {/* Tiến độ dự án */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-gray-900">Tiến độ Dự án</h2>
              </div>
              <Link href="/projects" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium">
                Tất cả dự án <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-5 space-y-4">
              {projects.slice(0, 5).map((project) => {
                const total = project.taskCount || 10;
                const done = project.completedCount || 0;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <div key={project._id} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 cursor-pointer">{project.name}</span>
                      <span className="text-xs text-gray-400">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-indigo-500" : "bg-blue-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{done} trong {total} công việc đã hoàn thành</p>
                  </div>
                );
              })}
              {projects.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-4">Chưa có dự án nào. <Link href="/projects/create" className="text-indigo-600">Tạo ngay</Link></div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Sprint hiện tại */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <h2 className="font-semibold text-gray-900">Sprint Hiện tại</h2>
              </div>
              <Link href="/sprints" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Quản lý</Link>
            </div>
            <div className="p-5 text-center">
              <p className="text-sm font-medium text-gray-700">Không có sprint đang hoạt động</p>
              <p className="text-xs text-gray-400 mt-1">Tạo sprint để theo dõi tiến độ đội nhóm</p>
              <Link href="/sprints" className="inline-flex items-center gap-1 text-xs text-indigo-600 mt-2 font-medium hover:text-indigo-800">
                Đến Sprint <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Thao tác nhanh */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-600" />Thao tác Nhanh</h2>
            </div>
            <div className="p-2">
              {[
                { icon: ListTodo, label: "Công việc của tôi", href: "/my-tasks", color: "text-blue-600", bg: "hover:bg-blue-50" },
                { icon: CheckSquare, label: "Tạo Công việc", href: "/projects", color: "text-green-600", bg: "hover:bg-green-50" },
                { icon: FolderKanban, label: "Tất cả Dự án", href: "/projects", color: "text-purple-600", bg: "hover:bg-purple-50" },
                { icon: FileText, label: "Cơ sở Tri thức", href: "/spaces", color: "text-amber-600", bg: "hover:bg-amber-50" },
              ].map((item) => (
                <Link key={item.href + item.label} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${item.bg} transition-colors`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  <ArrowRight className="w-4 h-4 text-gray-300 ml-auto" />
                </Link>
              ))}
            </div>
          </div>

          {/* Thành viên đội nhóm */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-600" />Thành viên Đội nhóm</h2>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{members.length}</span>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-3">
                {members.slice(0, 8).map((member) => (
                  <div key={member._id} className="relative group" title={`${member.fullName || member.email}`}>
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold ring-2 ring-white">
                      {member.avatar ? <img src={member.avatar} className="w-full h-full rounded-full object-cover" alt="" /> : (member.fullName || member.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white" />
                  </div>
                ))}
                {members.length > 8 && (
                  <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">+{members.length - 8}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
