"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/app/common/components/LoadingSpinner";
import { BarChart3, ArrowRight } from "lucide-react";

interface Workflow { _id: string; name: string; projectId?: any; statuses: { id: string; name: string; color: string }[]; }

export default function AdminWorkflowsPage() {
  const { currentWorkspace, setWorkspaces } = useWorkspaceStore();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
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
        return api.get(`${apiRoutes.PROJECTS.BASE}?workspaceId=${ws._id}`);
      })
      .then((res) => {
        if (cancelled || !res) return;
        const projects = Array.isArray(res.data) ? res.data : [];
        if (projects.length === 0) { setLoading(false); return; }
        return Promise.all(projects.map((p: any) =>
          api.get(apiRoutes.WORKFLOWS.BY_PROJECT(p._id)).catch(() => null)
        ));
      })
      .then((results) => {
        if (cancelled || !results) return;
        const wfs: Workflow[] = [];
        results.forEach((wfRes: any) => {
          if (wfRes?.data) wfs.push(wfRes.data);
        });
        setWorkflows(wfs);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [setWorkspaces]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cấu hình Quy trình</h1>
      {workflows.length === 0 ? (
        <div className="flex flex-col items-center py-16 bg-white rounded-xl border border-gray-200">
          <BarChart3 className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Chưa có quy trình nào được cấu hình</p>
          <p className="text-gray-400 text-sm">Quy trình sẽ được tạo khi bạn tạo một dự án</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workflows.map((wf) => (
            <div key={wf._id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div><h3 className="font-semibold text-gray-900">{wf.name}</h3><p className="text-sm text-gray-400">{wf.projectId?.name}</p></div>
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
