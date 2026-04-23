"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import { Users, FolderKanban, BookOpen, Settings, BarChart3, Shield } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { currentWorkspace, setWorkspaces } = useWorkspaceStore();
  const [stats, setStats] = useState({ projects: 0, members: 0, spaces: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get(apiRoutes.WORKSPACES.BASE)
      .then((res) => {
        if (cancelled) return;
        setWorkspaces(res.data);
        const ws = currentWorkspace || (res.data.length > 0 ? res.data[0] : null);
        if (!ws) { setLoading(false); return; }
        return Promise.all([
          api.get(`${apiRoutes.PROJECTS.BASE}?workspaceId=${ws._id}`).catch(() => ({ data: [] })),
          api.get(apiRoutes.WORKSPACES.BY_ID(ws._id)).catch(() => ({ data: {} })),
          api.get(`${apiRoutes.SPACES.BASE}?workspaceId=${ws._id}`).catch(() => ({ data: [] })),
        ]);
      })
      .then((results) => {
        if (cancelled || !results) return;
        const [projRes, wsRes, spaceRes] = results;
        setStats({
          projects: Array.isArray(projRes.data) ? projRes.data.length : 0,
          members: wsRes.data?.members?.length || 0,
          spaces: Array.isArray(spaceRes.data) ? spaceRes.data.length : 0,
        });
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [setWorkspaces]);

  const adminCards = [
    { title: "Cài đặt Workspace", desc: "Quản lý tên, thành viên và cài đặt workspace", href: "/admin/workspace", icon: Settings, color: "bg-indigo-500" },
    { title: "Quản lý Người dùng", desc: "Quản lý thành viên workspace và phân quyền", href: "/admin/users", icon: Users, color: "bg-blue-500" },
    { title: "Cấu hình Quy trình", desc: "Tùy chỉnh trạng thái và luồng công việc", href: "/admin/workflows", icon: BarChart3, color: "bg-purple-500" },
    { title: "Phân quyền", desc: "Quản lý vai trò và quyền hạn", href: "/admin/permissions", icon: Shield, color: "bg-amber-500" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bảng Quản trị</h1>
        <p className="text-gray-500 text-sm">
          {currentWorkspace ? `Workspace: ${currentWorkspace.name}` : "Không có workspace được chọn"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Dự án", value: stats.projects, icon: FolderKanban, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Thành viên", value: stats.members, icon: Users, color: "text-green-600", bg: "bg-green-50" },
          { label: "Không gian", value: stats.spaces, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}><card.icon className={`w-5 h-5 ${card.color}`} /></div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{loading ? "..." : card.value}</p>
            <p className="text-sm text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adminCards.map((card) => (
          <Link key={card.href} href={card.href} className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-indigo-200 transition-all">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center flex-shrink-0`}><card.icon className="w-6 h-6 text-white" /></div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">{card.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
