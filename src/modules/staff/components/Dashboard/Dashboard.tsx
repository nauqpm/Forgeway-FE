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

const SHOW_STARRED_DASHBOARD_TAB = false;

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
      description: "Manage frontend tasks",
      icon: LayoutDashboard,
      color: "bg-[#2563EB]",
    },
    {
      id: 2,
      name: "Backend Team",
      description: "API & Database",
      icon: Database,
      color: "bg-[#346538]",
    },
    {
      id: 3,
      name: "Backend Team",
      description: "API & Database",
      icon: Database,
      color: "bg-[#346538]",
    },
    {
      id: 5,
      name: "Backend Team",
      description: "API & Database",
      icon: Database,
      color: "bg-[#346538]",
    },
    {
      id: 9,
      name: "Backend Team",
      description: "API & Database",
      icon: Database,
      color: "bg-[#346538]",
    },
  ];

  const tabs = [
    { label: "Assigned to me", key: "assigned" },
    { label: "Starred", key: "starred" },
    { label: "Worked on", key: "worked" },
    { label: "Viewed", key: "viewed" },
  ].filter((tab) => SHOW_STARRED_DASHBOARD_TAB || tab.key !== "starred");

  const tasks = [
    {
      id: "KAN-1",
      title: "Task 2",
      type: "worked",
      project: "KAN-2",
      team: "My software team",
    },
    {
      id: "KAN-2",
      title: "Task 2",
      type: "assigned",
      project: "KAN-2",
      team: "My software team",
    },
    {
      id: "KAN-4",
      title: "Task 2",
      type: "starred",
      project: "KAN-2",
      team: "My software team",
    },
    {
      id: "KAN-9",
      title: "Task 2",
      type: "assigned",
      project: "KAN-2",
      team: "My software team",
    },
  ];

  const displaySpaces = spaces.slice(0, 4);
  const filteredTasks = tasks.filter((task) => task.type === activeTab);

  if (loading) return null;

  return (
    <div className={`max-w-5xl mx-auto ${className}`}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="px-2 text-2xl font-bold text-[#111111] dark:text-[#E8E8E7]">
          Recommended workspaces
        </h1>

        <Link
          href="/spaces"
          className="text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8]"
        >
          View all
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {displaySpaces.map((space) => (
          <Link
            key={space.id}
            href={`/spaces/${space.id}`}
            className="group bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/8 p-6 hover:border-[#2563EB]/20 dark:hover:border-[#3B82F6] transition-all"
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 ${space.color} rounded-[8px] flex items-center justify-center flex-shrink-0`}
              >
                <space.icon className="w-6 h-6 text-white" />
              </div>

              <div>
                <h3 className="font-semibold text-[#111111] dark:text-[#E8E8E7] group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6]">
                  {space.name}
                </h3>
                <p className="text-sm text-[#787774] dark:text-[#9B9A97] mt-1">
                  {space.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-10">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[#111111] dark:text-[#E8E8E7]">For you</h2>
        </div>

        <div className="flex gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-sm rounded-[6px] transition ${
                activeTab === tab.key
                  ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#1F6C9F] dark:text-[#93C5FD] font-medium"
                  : "text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/8"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mb-2 text-sm text-[#787774] dark:text-[#9B9A97]">Summary</div>

        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between bg-[#F9F9F8] dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/8 rounded-[8px] px-4 py-3 hover:bg-[#F7F6F3] dark:hover:bg-white/8 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[4px] bg-[#EDF3EC] dark:bg-[rgba(52,101,56,0.12)] flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-[#346538] dark:text-[#4ADE80]" />
                </div>

                <div>
                  <p className="font-medium text-[#111111] dark:text-[#E8E8E7]">{task.title}</p>
                  <p className="text-xs text-[#787774] dark:text-[#9B9A97]">
                    {task.type} • {task.project} • {task.team}
                  </p>
                </div>
              </div>

              <button className="text-xs font-medium bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#1F6C9F] dark:text-[#93C5FD] px-3 py-1 rounded-[4px]">
                SUMMARY
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
