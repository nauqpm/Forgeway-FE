"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/app/common/components/LoadingSpinner";
import { FolderKanban, Plus, LayoutGrid, List, Search, Filter, ArrowRight, Folder } from "lucide-react";
import Link from "next/link";

interface Project {
  _id: string;
  name: string;
  key: string;
  type: "scrum" | "kanban";
  description?: string;
  status: string;
  leadId?: string;
  members: { userId: string; role: string }[];
  createdAt: string;
}

export default function ProjectsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!currentWorkspace?._id) return;
    const fetchProjects = async () => {
      try {
        const res = await api.get(`${apiRoutes.PROJECTS.BASE}?workspaceId=${currentWorkspace._id}`);
        setProjects(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchProjects();
  }, [currentWorkspace?._id]);

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.key.toLowerCase().includes(search.toLowerCase())
  );

  if (!currentWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FolderKanban className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Chọn Workspace</h2>
        <p className="text-gray-400 mt-2">Vui lòng chọn hoặc tạo workspace trước</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 text-sm">{projects.length} projects in {currentWorkspace.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/projects/create" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm">
            <Plus className="w-4 h-4" /> New Project
          </Link>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <Filter className="w-4 h-4" /> Filter
        </button>
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          <button onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-gray-100 text-gray-800" : "text-gray-400"}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setView("list")} className={`p-2 ${view === "list" ? "bg-gray-100 text-gray-800" : "text-gray-400"}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Project List / Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <Folder className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">No projects yet</p>
          <Link href="/projects/create" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm">
            <Plus className="w-4 h-4" /> Create First Project
          </Link>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <Link key={project._id} href={`/projects/${project._id}`} className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {project.key.substring(0, 2)}
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${project.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {project.status}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">{project.name}</h3>
              <p className="text-sm text-gray-400 mb-3">{project.key}</p>
              {project.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{project.description}</p>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className={`px-2 py-0.5 text-xs rounded-full ${project.type === "kanban" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                  {project.type === "kanban" ? "Kanban" : "Scrum"}
                </span>
                <span className="text-xs text-gray-400">{project.members.length} members</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((project) => (
                <tr key={project._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                        {project.key.substring(0, 2)}
                      </div>
                      <span className="font-medium text-gray-900">{project.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{project.key}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${project.type === "kanban" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                      {project.type}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${project.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{project.members.length}</td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/projects/${project._id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center justify-end gap-1">
                      Open <ArrowRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
