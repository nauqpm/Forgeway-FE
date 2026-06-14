"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/shared/components/common/components/LoadingSpinner";
import Link from "next/link";
import { Zap, Clock, CheckCircle, Calendar, Play, ArrowRight } from "lucide-react";

interface Sprint { _id: string; name: string; goal?: string; status: string; startDate: string; endDate: string; projectId?: any; }

export default function SprintsPage() {
  usePageTitle('Sprints');
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceStore();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    router.replace("/workspaces");
  }, [router]);

  useEffect(() => {
    if (!currentWorkspace?._id) { setLoading(false); return; }
    const fetch = async () => {
      try {
        const res = await api.get(`${apiRoutes.PROJECTS.BASE}?workspaceId=${currentWorkspace._id}`);
        const all: Sprint[] = [];
        for (const proj of res.data) {
          if (proj.type === "scrum") {
            try {
              const sr = await api.get(`${apiRoutes.SPRINTS.BASE}?projectId=${proj._id}`);
              all.push(...sr.data.map((s: Sprint) => ({ ...s, projectId: proj })));
            } catch {}
          }
        }
        setSprints(all);
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, [currentWorkspace?._id]);

  if (loading) return <LoadingSpinner />;

  const config: Record<string, { color: string; bg: string; icon: any }> = {
    active: { color: "text-blue-600", bg: "bg-blue-50", icon: Play },
    planning: { color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
    completed: { color: "text-green-600", bg: "bg-green-50", icon: CheckCircle },
  };

  const render = (list: Sprint[], title: string) => list.length > 0 && (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{title} ({list.length})</h2>
      <div className="space-y-3">
        {list.map((sprint) => {
          const c = config[sprint.status] || config.planning;
          const Icon = c.icon;
          return (
            <div key={sprint._id} className="workspace-panel bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 ${c.bg} rounded-lg flex items-center justify-center flex-shrink-0`}><Icon className={`w-5 h-5 ${c.color}`} /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{sprint.name}</h3>
                    {sprint.goal && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{sprint.goal}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                      <span>{sprint.projectId?.name}</span><span>·</span>
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(sprint.startDate).toLocaleDateString("en-US")} - {new Date(sprint.endDate).toLocaleDateString("en-US")}</span>
                    </div>
                  </div>
                </div>
                <Link href={`/sprints/${sprint._id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1">
                  View <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="app-page-narrow">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sprints</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Scrum sprint management</p>
        </div>
      </div>

      {sprints.length === 0 ? (
        <div className="flex flex-col items-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <Zap className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">No sprints found</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm text-center">Sprints are available in Scrum projects.</p>
        </div>
      ) : (
        <>
          {render(sprints.filter(s => s.status === "active"), "Active")}
          {render(sprints.filter(s => s.status === "planning"), "Planning")}
          {render(sprints.filter(s => s.status === "completed"), "Completed")}
        </>
      )}
    </div>
  );
}
