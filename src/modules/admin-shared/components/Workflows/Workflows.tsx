"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, BarChart3 } from "lucide-react";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import { useCurrentWorkspace } from "@/modules/workspace/shared/hooks/useWorkspaces";
import LoadingSpinner from "@/modules/admin-shared/components/common/components/LoadingSpinner";
import { queryKeys } from "@/shared/constants/queryKeys";

type WorkflowStatus = {
  id: string;
  name: string;
  color?: string;
  category?: "todo" | "inprogress" | "done";
  requirementsGate?: "review";
  [key: string]: unknown;
};

type WorkflowTransition = {
  fromStatus: string;
  toStatus: string;
  name?: string;
  [key: string]: unknown;
};

type WorkspaceWorkflow = {
  _id: string;
  workspaceId: string;
  name: string;
  defaultStatus: string;
  statuses: WorkflowStatus[];
  transitions: WorkflowTransition[];
};

export interface AdminWorkflowsProps {
  className?: string;
}

const getMemberUserId = (userId: unknown) =>
  typeof userId === "string"
    ? userId
    : (userId as { _id?: string; id?: string } | undefined)?._id ??
      (userId as { id?: string } | undefined)?.id;

const getRequirementsGateId = (statuses: WorkflowStatus[]) =>
  statuses.find((status) => status.requirementsGate === "review")?.id ?? null;

const getSaveError = (error: unknown) => {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return message === "Only one workflow status may be the requirements review gate"
    ? "Only one workflow status can be the review gate."
    : "Unable to save the review gate. Try again.";
};

export default function AdminWorkflows({ className = "" }: AdminWorkflowsProps) {
  const { currentWorkspace, isLoading: isLoadingWorkspace } = useCurrentWorkspace();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedGateIds, setSelectedGateIds] = useState<Record<string, string | null>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const workflowsQuery = useQuery<WorkspaceWorkflow | null>({
    queryKey: queryKeys.admin.workflow(currentWorkspace?._id ?? "none"),
    queryFn: async () => (await api.get(apiRoutes.WORKFLOWS.BY_WORKSPACE(currentWorkspace!._id))).data,
    enabled: Boolean(currentWorkspace?._id),
  });

  if (isLoadingWorkspace || workflowsQuery.isLoading) return <LoadingSpinner />;
  if (workflowsQuery.isError) {
    return (
      <div className={`app-page-narrow ${className}`}>
        <h1 className="mb-6 text-2xl font-bold text-[#111111] dark:text-[#E8E8E7]">Workflow Configuration</h1>
        <div role="alert" className="rounded-[8px] border border-[#F5C6C7] bg-[#FDEBEC] p-4 text-sm text-[#9F2F2D]">
          Workflow configuration could not be loaded.
          <button type="button" onClick={() => void workflowsQuery.refetch()} className="ml-3 underline">Retry workflow configuration</button>
        </div>
      </div>
    );
  }

  const workflow = workflowsQuery.data;
  const currentUserId = user?.id;
  const currentMember = currentWorkspace?.members?.find(
    (member) => String(getMemberUserId(member.userId)) === String(currentUserId),
  );
  const isWorkspaceAdmin =
    user?.role === "super_admin" ||
    (Boolean(currentUserId) && getMemberUserId(currentWorkspace?.ownerId) === currentUserId) ||
    currentMember?.role === "workspace_admin" ||
    currentMember?.role === "space_admin";

  if (!workflow) {
    return (
      <div className={`app-page-narrow ${className}`}>
        <h1 className="mb-6 text-2xl font-bold text-[#111111] dark:text-[#E8E8E7]">Workflow Configuration</h1>
        <div className="flex flex-col items-center rounded-[8px] border border-[#EAEAEA] bg-white py-16 dark:border-white/[0.06] dark:bg-[#202020]">
          <BarChart3 className="mb-3 h-12 w-12 text-[#ABABAB] dark:text-[#6B6B6B]" />
          <p className="font-medium text-[#787774] dark:text-[#9B9A97]">No workflows have been configured</p>
        </div>
      </div>
    );
  }

  const serverGateId = getRequirementsGateId(workflow.statuses);
  const selectedGateId = Object.hasOwn(selectedGateIds, workflow._id)
    ? selectedGateIds[workflow._id]
    : serverGateId;
  const hasUnsavedChange = selectedGateId !== serverGateId;

  const saveGate = async () => {
    if (!isWorkspaceAdmin || !hasUnsavedChange || !currentWorkspace) return;

    setSaveError(null);
    const statuses = workflow.statuses.map((status) => ({
      ...status,
      requirementsGate: status.id === selectedGateId ? ("review" as const) : undefined,
    }));

    try {
      const { data: updatedWorkflow } = await api.put<WorkspaceWorkflow>(
        apiRoutes.WORKFLOWS.BY_ID(workflow._id),
        {
          name: workflow.name,
          defaultStatus: workflow.defaultStatus,
          statuses,
          transitions: workflow.transitions,
        },
        { params: { workspaceId: currentWorkspace._id } },
      );
      queryClient.setQueryData(queryKeys.admin.workflow(currentWorkspace._id), updatedWorkflow);
    } catch (error) {
      setSelectedGateIds((current) => ({ ...current, [workflow._id]: serverGateId }));
      setSaveError(getSaveError(error));
    }
  };

  return (
    <div className={`app-page-narrow ${className}`}>
      <h1 className="mb-6 text-2xl font-bold text-[#111111] dark:text-[#E8E8E7]">Workflow Configuration</h1>
      <div className="workspace-panel rounded-[8px] border border-[#EAEAEA] bg-white dark:border-white/[0.06] dark:bg-[#202020]">
        <h3 className="font-semibold text-[#111111] dark:text-[#E8E8E7]">{workflow.name}</h3>
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
          {workflow.statuses.map((status, index) => (
            <div key={status.id} className="flex items-center">
              <div className="flex items-center gap-2 whitespace-nowrap rounded-[6px] bg-[#F9F9F8] px-3 py-1.5 dark:bg-[#252525]">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                <span className="text-sm font-medium text-[#787774] dark:text-[#9B9A97]">{status.name}</span>
                {status.id === selectedGateId && (
                  <span className="flex items-center gap-1 text-xs text-[#346538] dark:text-[#86EFAC]">
                    <BadgeCheck aria-label="Requirements review gate" role="img" className="h-3.5 w-3.5" />
                    Requirements review gate
                  </span>
                )}
              </div>
              {index < workflow.statuses.length - 1 && <ArrowRight className="mx-1 h-4 w-4 text-[#ABABAB] dark:text-[#6B6B6B]" />}
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-[#EAEAEA] pt-4 dark:border-white/[0.06]">
          <p className="text-sm font-medium text-[#111111] dark:text-[#E8E8E7]">Early requirements review gate</p>
          <p className="mt-1 text-sm text-[#787774] dark:text-[#9B9A97]">
            Completion remains blocked until requirements are satisfied, even without an early review gate.
          </p>
          {isWorkspaceAdmin ? (
            <fieldset className="mt-3 flex flex-wrap gap-x-4 gap-y-2" aria-label="Early requirements review gate">
              <label className="flex items-center gap-2 text-sm text-[#787774] dark:text-[#9B9A97]">
                <input
                  type="radio"
                  name={`requirements-review-gate-${workflow._id}`}
                  checked={selectedGateId === null}
                  onChange={() => setSelectedGateIds((current) => ({ ...current, [workflow._id]: null }))}
                  aria-label="No early review gate"
                />
                No early review gate
              </label>
              {workflow.statuses.map((status) => (
                <label key={status.id} className="flex items-center gap-2 text-sm text-[#787774] dark:text-[#9B9A97]">
                  <input
                    type="radio"
                    name={`requirements-review-gate-${workflow._id}`}
                    checked={selectedGateId === status.id}
                    onChange={() => setSelectedGateIds((current) => ({ ...current, [workflow._id]: status.id }))}
                    aria-label={`Use ${status.name} as the requirements review gate`}
                  />
                  {status.name}
                </label>
              ))}
            </fieldset>
          ) : (
            <p className="mt-3 text-sm text-[#787774] dark:text-[#9B9A97]">Only workspace administrators can change this setting.</p>
          )}
          {saveError && <p role="alert" className="mt-3 text-sm text-[#B42318] dark:text-[#FDA29B]">{saveError}</p>}
          {isWorkspaceAdmin && (
            <button
              type="button"
              className="mt-4 rounded-[6px] bg-[#346538] px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              onClick={saveGate}
              disabled={!hasUnsavedChange}
            >
              Save review gate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
