"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import {
  BookOpen,
  LayoutDashboard,
  Database,
} from "lucide-react";
import Link from "next/link";

export interface AdminDashboardProps {
  className?: string;
}

export default function AdminDashboard({ className = "" }: AdminDashboardProps) {
  const { currentWorkspace, setWorkspaces } = useWorkspaceStore();
  const [stats, setStats] = useState({ projects: 0, members: 0, spaces: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("assigned");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get(apiRoutes.WORKSPACES.BASE)
      .then((res) => {
        if (cancelled) return;
        setWorkspaces(res.data);
        const ws =
          currentWorkspace || (res.data.length > 0 ? res.data[0] : null);
        if (!ws) {
          setLoading(false);
          return;
        }
        return Promise.all([
          api
            .get(`${apiRoutes.PROJECTS.BASE}?workspaceId=${ws._id}`)
            .catch(() => ({ data: [] })),
          api
            .get(apiRoutes.WORKSPACES.BY_ID(ws._id))
            .catch(() => ({ data: {} })),
        ]);
      })
      .then((results) => {
        if (cancelled || !results) return;
        const [projRes, wsRes] = results;
        setStats({
          projects: Array.isArray(projRes.data) ? projRes.data.length : 0,
          members: wsRes.data?.members?.length || 0,
          spaces: 0,
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setWorkspaces]);

  const spaces = [
    {
      id: 1,
      name: "Frontend Team",
      description: "Quản lý task FE",
      icon: LayoutDashboard,
      color: "bg-blue-500",
    },
    {
      id: 2,
      name: "Backend Team",
      description: "API & Database",
      icon: Database,
      color: "bg-green-500",
    },
    {
      id: 3,
      name: "Backend Team",
      description: "API & Database",
      icon: Database,
      color: "bg-green-500",
    },
    {
      id: 5,
      name: "Backend Team",
      description: "API & Database",
      icon: Database,
      color: "bg-green-500",
    },
    {
      id: 9,
      name: "Backend Team",
      description: "API & Database",
      icon: Database,
      color: "bg-green-500",
    },
  ];

  const tabs = [
    { label: "Được giao cho tôi", key: "assigned" },
    { label: "Đã đóng dấu sao", key: "starred" },
    { label: "Đã làm việc trên", key: "worked" },
    { label: "Đã xem", key: "viewed" },
  ];

  const tasks = [
    {
      id: "KAN-1",
      title: "Nhiệm vụ 2",
      type: "worked",
      project: "KAN-2",
      team: "Nhóm phần mềm của tôi",
    },
    {
      id: "KAN-2",
      title: "Nhiệm vụ 2",
      type: "assigned",
      project: "KAN-2",
      team: "Nhóm phần mềm của tôi",
    },
    {
      id: "KAN-4",
      title: "Nhiệm vụ 2",
      type: "starred",
      project: "KAN-2",
      team: "Nhóm phần mềm của tôi",
    },
    {
      id: "KAN-9",
      title: "Nhiệm vụ 2",
      type: "assigned",
      project: "KAN-2",
      team: "Nhóm phần mềm của tôi",
    },
  ];

  const displaySpaces = spaces.slice(0, 4);
  const filteredTasks = tasks.filter((task) => task.type === activeTab);

  if (loading) return null;

  return (
    <div className={`max-w-5xl mx-auto ${className}`}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="px-2 text-2xl font-bold text-gray-900 dark:text-white">
          Không gian đề xuất
        </h1>

        <Link
          href="/spaces"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          Xem tất cả →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {displaySpaces.map((space) => (
          <Link
            key={space.id}
            href={`/spaces/${space.id}`}
            className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500 transition-all"
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 ${space.color} rounded-xl flex items-center justify-center flex-shrink-0`}
              >
                <space.icon className="w-6 h-6 text-white" />
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {space.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {space.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-10">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dành cho bạn</h2>
        </div>

        <div className="flex gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                activeTab === tab.key
                  ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">Tóm lại</div>

        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-green-600" />
                </div>

                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{task.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {task.type} • {task.project} • {task.team}
                  </p>
                </div>
              </div>

              <button className="text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded">
                TÓM LẠI
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
