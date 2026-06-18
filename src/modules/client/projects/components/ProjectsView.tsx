"use client";

import { Plus, LayoutGrid, List, Search, Folder } from "lucide-react";
import Link from "next/link";
import type { Project } from "../types/projects.type";

interface ProjectsViewProps {
  projects: Project[];
  filtered: Project[];
  search: string;
  setSearch: (value: string) => void;
  view: "grid" | "list";
  setView: (value: "grid" | "list") => void;
}

export default function ProjectsView({
  projects,
  filtered,
  search,
  setSearch,
  view,
  setView,
}: ProjectsViewProps) {
  return (
    <div className="app-page-wide">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{projects.length} projects</p>
        </div>
        <Link
          href="/projects/create"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm"
        >
          <Plus className="w-4 h-4" /> New Project
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[13.75rem] max-w-[min(100%,28rem)]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setView("grid")}
            className={`p-2 ${view === "grid" ? "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-2 ${view === "list" ? "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <Folder className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">No projects yet</p>
          <Link
            href="/projects/create"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm"
          >
            <Plus className="w-4 h-4" /> Create First Project
          </Link>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <Link
              key={project._id}
              href={`/projects/${project._id}`}
              className="workspace-panel group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {project.key.substring(0, 2)}
                </div>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full font-medium ${project.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                >
                  {project.status}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600">
                {project.name}
              </h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">{project.key}</p>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${project.type === "kanban" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}
                >
                  {project.type}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{project.members.length} members</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full app-table-min">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Project
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Key
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Type
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((project) => (
                  <tr key={project._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">{project.name}</td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{project.key}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${project.type === "kanban" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}
                      >
                        {project.type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${project.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {project.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
