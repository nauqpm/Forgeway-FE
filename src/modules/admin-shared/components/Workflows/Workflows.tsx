"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, ArrowRight } from "lucide-react";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { queryKeys } from "@/shared/constants/queryKeys";
import LoadingSpinner from "@/modules/admin-shared/components/common/components/LoadingSpinner";
import type { Workspace } from "@/stores/workspaceStore";
import { useCurrentWorkspace } from "@/modules/workspace/shared/hooks/useWorkspaces";
import { workspaceService } from "@/modules/workspace/shared/services/workspaceService";

interface Workflow {
  _id: string;
  name: string;
  projectId?: { _id?: string; name?: string } | null;
  statuses: { id: string; name: string; color: string }[];
}

export interface AdminWorkflowsProps {
  className?: string;
}

export default function AdminWorkflows({ className = "" }: AdminWorkflowsProps) {
  const { currentWorkspace } = useCurrentWorkspace();

  const workspacesQuery = useQuery<Workspace[]>({
    queryKey: queryKeys.workspaces.list(),
    queryFn: workspaceService.listMine,
  });

  const activeWorkspace = currentWorkspace ?? workspacesQuery.data?.[0] ?? null;

  const workflowsQuery = useQuery<Workflow[]>({
    queryKey: activeWorkspace ? [...queryKeys.admin.workflows(), activeWorkspace._id] : [...queryKeys.admin.workflows(), "none"],
    queryFn: async () => {
      const projectsRes = await api.get(`${apiRoutes.PROJECTS.BASE}?workspaceId=${activeWorkspace!._id}`);
      const projects = Array.isArray(projectsRes.data) ? projectsRes.data : [];
      if (projects.length === 0) return [];

      const results = await Promise.all(
        projects.map((project: { _id: string }) =>
          api.get(apiRoutes.WORKFLOWS.BY_PROJECT(project._id)).catch(() => null),
        ),
      );

      return results
        .map((result) => result?.data)
        .filter(Boolean);
    },
    enabled: !!activeWorkspace?._id,
  });

  if (workspacesQuery.isLoading || workflowsQuery.isLoading) {
    return <LoadingSpinner />;
  }

  const workflows = workflowsQuery.data ?? [];

  return (
    <div className={`app-page-narrow ${className}`}>
      <h1 className="text-2xl font-bold text-[#111111] dark:text-[#E8E8E7] mb-6">Workflow Configuration</h1>
      {workflows.length === 0 ? (
        <div className="flex flex-col items-center py-16 bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/8">
          <BarChart3 className="w-12 h-12 text-[#ABABAB] dark:text-[#6B6B6B] mb-3" />
          <p className="text-[#787774] dark:text-[#9B9A97] font-medium">No workflows have been configured</p>
          <p className="text-[#ABABAB] dark:text-[#6B6B6B] text-sm">
            Workflows will be created when you create a project
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <div
              key={workflow._id}
              className="workspace-panel bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/8"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-[#111111] dark:text-[#E8E8E7]">{workflow.name}</h3>
                  <p className="text-sm text-[#ABABAB] dark:text-[#6B6B6B]">{workflow.projectId?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {workflow.statuses.map((status, index) => (
                  <div key={status.id} className="flex items-center">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#F9F9F8] dark:bg-[#252525] whitespace-nowrap">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                      <span className="text-sm font-medium text-[#787774] dark:text-[#9B9A97]">{status.name}</span>
                    </div>
                    {index < workflow.statuses.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B] mx-1" />
                    )}
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
