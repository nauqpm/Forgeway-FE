"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/app/common/components/LoadingSpinner";
import { Users, FolderKanban, BookOpen, Settings, BarChart3, Shield } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const [stats, setStats] = useState({ projects: 0, members: 0, spaces: 0 });

  useEffect(() => {
    if (!currentWorkspace?._id) return;
    const fetch = async () => {
      try {
        const [projRes, wsRes, spaceRes] = await Promise.all([
          api.get(`${apiRoutes.PROJECTS.BASE}?workspaceId=${currentWorkspace._id}`),
          api.get(apiRoutes.WORKSPACES.BY_ID(currentWorkspace._id)),
          api.get(`${apiRoutes.SPACES.BASE}?workspaceId=${currentWorkspace._id}`),
        ]);
        setStats({
          projects: projRes.data.length,
          members: wsRes.data.members?.length || 0,
          spaces: spaceRes.data.length,
        });
      } catch {}
    };
    fetch();
  }, [currentWorkspace?._id]);

  const adminCards = [
    { title: "Workspace Settings", desc: "Manage workspace name, members, and settings", href: "/admin/workspace", icon: Settings, color: "bg-indigo-500" },
    { title: "User Management", desc: "Manage workspace members and roles", href: "/admin/users", icon: Users, color: "bg-blue-500" },
    { title: "Workflow Configuration", desc: "Customize workflow statuses and transitions", href: "/admin/workflows", icon: BarChart3, color: "bg-purple-500" },
    { title: "Permissions", desc: "Manage roles and permissions", href: "/admin/permissions", icon: Shield, color: "bg-amber-500" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 text-sm">Manage your workspace settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Projects", value: stats.projects, icon: FolderKanban, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Members", value: stats.members, icon: Users, color: "text-green-600", bg: "bg-green-50" },
          { label: "Spaces", value: stats.spaces, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adminCards.map((card) => (
          <Link key={card.href} href={card.href} className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-indigo-200 transition-all">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{card.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
