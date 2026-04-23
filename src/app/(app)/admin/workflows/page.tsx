"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/app/common/components/LoadingSpinner";
import { BarChart3, Plus, ArrowRight, Settings } from "lucide-react";
import Link from "next/link";

interface Workflow { _id: string; name: string; projectId?: any; statuses: { id: string; name: string; color: string; category: string }[]; }

export default function AdminWorkflowsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspace?._id) return;
    const fetch = async () => {
      try {
        const res = await api.get(`${apiRoutes.PROJECTS.BASE}?workspaceId=${currentWorkspace._id}`);
        const projects = res.data;
        const wfData: Workflow[] = [];
        for (const proj of projects) {
          try {
            const wfRes = await api.get(apiRoutes.WORKFLOWS.BY_PROJECT(proj._id));
            if (wfRes.data) {
              wfData.push({ ...wfRes.data, projectId: proj });
            }
          } catch {}
        }
        setWorkflows(wfData);
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, [currentWorkspace?._id]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Workflow Configuration</h1>

      {workflows.length === 0 ? (
        <div className="flex flex-col items-center py-16 bg-white rounded-xl border border-gray-200">
          <BarChart3 className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium mb-4">No workflows configured</p>
          <p className="text-gray-400 text-sm">Workflows are created automatically when you create a project</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workflows.map((wf) => (
            <div key={wf._id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{wf.name}</h3>
                  <p className="text-sm text-gray-400">{wf.projectId?.name || "Unknown Project"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {wf.statuses.map((status, i) => (
                  <div key={status.id} className="flex items-center">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 whitespace-nowrap">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                      <span className="text-sm font-medium text-gray-700">{status.name}</span>
                    </div>
                    {i < wf.statuses.length - 1 && <ArrowRight className="w-4 h-4 text-gray-300 mx-1" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
