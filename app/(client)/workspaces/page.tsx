"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/admin/components/common/components/LoadingSpinner";
import Link from "next/link";
import { BookOpen, Plus, Globe, Lock, ChevronRight, Columns, Repeat } from "lucide-react";

interface Workspace {
  _id: string; 
  name: string; 
  key: string; 
  description?: string; 
  visibility: string;
  template: "kanban" | "scrum";
  ownerId?: any; 
  members?: any[]; 
  _count?: { pages: number; issues: number };
}

export default function WorkspacesPage() {
  const { currentWorkspace, workspacesLoaded } = useWorkspaceStore();
  const [workspaces, setWorkspacesList] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspacesLoaded) return;
    if (!currentWorkspace) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get(apiRoutes.WORKSPACES.BASE)
      .then((res) => setWorkspacesList(res.data))
      .catch(() => setWorkspacesList([]))
      .finally(() => setLoading(false));
  }, [currentWorkspace, workspacesLoaded]);

  if (loading) return <LoadingSpinner />;

  if (!currentWorkspace) return <div className="app-main text-center text-gray-500 dark:text-gray-400">Select a workspace first</div>;

  return (
    <div className="app-page-wide">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Workspaces</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Showing {workspaces.length} Workspaces in {currentWorkspace.name}</p>
        </div>
        <Link href="/workspaces/create" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-all shadow-sm">
          <Plus className="w-4 h-4" /> Create New Workspace
        </Link>
      </div>

      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 border-dashed">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No workspaces yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm text-center">Create a new workspace to start organizing work, storing documents, and managing projects for your team.</p>
          <Link href="/workspaces/create" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 font-medium text-sm shadow-sm">
            <Plus className="w-4 h-4" /> Create your first workspace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workspaces.map((workspace) => (
            <Link key={workspace._id} href={`/workspaces/${workspace.key}`} className="workspace-panel group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-500 transition-all flex flex-col h-full cursor-pointer">
              
              {/* Header Card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-3 items-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${workspace.template === 'scrum' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
                    {workspace.template === 'scrum' ? <Repeat className="w-6 h-6 text-white" /> : <Columns className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {workspace.visibility === "public" ? (
                        <Globe className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-[10px] font-mono font-bold tracking-wider">{workspace.key}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">{workspace.name}</h3>
                  </div>
                </div>
              </div>


              {/* Footer Metrics */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Template</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">{workspace.template || "Kanban"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Issues</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{workspace._count?.issues || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Pages</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{workspace._count?.pages || 0}</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                </div>
              </div>

            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
