"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/admin/components/common/components/LoadingSpinner";
import { BarChart3, ArrowRight } from "lucide-react";

interface Workflow {
  _id: string;
  name: string;
  projectId?: any;
  statuses: { id: string; name: string; color: string }[];
}

export interface AdminWorkflowsProps {
  className?: string;
}

export default function AdminWorkflows({ className = "" }: AdminWorkflowsProps) {
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
    <div className={`max-w-4xl mx-auto ${className}`}>
      <h1 className="text-2xl font-bold text-[#111111] dark:text-[#E8E8E7] mb-6">Workflow Configuration</h1>
      {workflows.length === 0 ? (
        <div className="flex flex-col items-center py-16 bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/8">
          <BarChart3 className="w-12 h-12 text-[#ABABAB] dark:text-[#6B6B6B] mb-3" />
          <p className="text-[#787774] dark:text-[#9B9A97] font-medium">No workflows have been configured</p>
          <p className="text-[#ABABAB] dark:text-[#6B6B6B] text-sm">Workflows will be created when you create a project</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workflows.map((wf) => (
            <div key={wf._id} className="bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/8 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-[#111111] dark:text-[#E8E8E7]">{wf.name}</h3>
                  <p className="text-sm text-[#ABABAB] dark:text-[#6B6B6B]">{wf.projectId?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {wf.statuses.map((status, i) => (
                  <div key={status.id} className="flex items-center">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#F9F9F8] dark:bg-[#252525] whitespace-nowrap">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                      <span className="text-sm font-medium text-[#787774] dark:text-[#9B9A97]">{status.name}</span>
                    </div>
                    {i < wf.statuses.length - 1 && <ArrowRight className="w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B] mx-1" />}
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
