"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, GitBranch, RefreshCw } from "lucide-react";
import { queryKeys } from "@/shared/constants/queryKeys";
import { taskService } from "@/modules/workspace/shared/services/taskService";
import type { Issue } from "@/modules/workspace/shared/types/issue.type";
import type { TaskDetailResponse } from "@/modules/workspace/shared/types/task-detail.type";
import { storyGovernanceService } from "../services/storyGovernance.service";
import { clearOperationKey, getOperationKey } from "../utils/storyGovernance";
import {
  getApprovedContractOptions,
  getRequirementsStateLabel,
  selectContractPin,
  storyContractHref,
  TASK_STORY_GATE_EVENT,
} from "../utils/taskStory";

export type TaskStoryPanelProps = {
  workspaceId: string;
  workspaceKey: string;
  task: TaskDetailResponse;
  currentUserId?: string;
  isWorkspaceAdmin: boolean;
  canEditTask: boolean;
  canResolveStoryImpact: boolean;
  onUpdateTask?: (task: TaskDetailResponse) => void;
};

const errorCode = (error: unknown) =>
  (error as { response?: { data?: { code?: string; data?: { code?: string } } } })
    ?.response?.data?.code ??
  (error as { response?: { data?: { data?: { code?: string } } } })
    ?.response?.data?.data?.code;

export default function TaskStoryPanel({
  workspaceId,
  workspaceKey,
  task,
  currentUserId,
  isWorkspaceAdmin,
  canEditTask,
  canResolveStoryImpact,
  onUpdateTask,
}: TaskStoryPanelProps) {
  const queryClient = useQueryClient();
  const panelRef = useRef<HTMLElement>(null);
  const resolvePendingRef = useRef(false);
  const [message, setMessage] = useState("");
  const [pinError, setPinError] = useState("");
  const [displayedContractId, setDisplayedContractId] = useState(task.storyContractId);
  const [displayedVersionId, setDisplayedVersionId] = useState(task.storyVersionId);
  const [displayedState, setDisplayedState] = useState(task.requirementsState);
  const linked = Boolean(displayedContractId && displayedVersionId);

  useEffect(() => {
    setDisplayedContractId(task.storyContractId);
    setDisplayedVersionId(task.storyVersionId);
    setDisplayedState(task.requirementsState);
  }, [task.requirementsState, task.storyContractId, task.storyVersionId]);

  useEffect(() => {
    const focusPanel = (event: Event) => {
      const detail = (event as CustomEvent<{ taskId?: string }>).detail;
      if (detail?.taskId === task.id) panelRef.current?.focus();
    };
    window.addEventListener(TASK_STORY_GATE_EVENT, focusPanel);
    return () => window.removeEventListener(TASK_STORY_GATE_EVENT, focusPanel);
  }, [task.id]);

  const contracts = useQuery({
    queryKey: queryKeys.storyGovernance.contracts(workspaceId),
    queryFn: () => storyGovernanceService.listContracts(workspaceId),
    enabled: canEditTask,
  });
  const contract = useQuery({
    queryKey: queryKeys.storyGovernance.contract(workspaceId, displayedContractId ?? ""),
    queryFn: () => storyGovernanceService.getContract(workspaceId, displayedContractId!),
    enabled: linked,
  });
  const version = useQuery({
    queryKey: queryKeys.storyGovernance.version(
      workspaceId,
      displayedContractId ?? "",
      displayedVersionId ?? "",
    ),
    queryFn: () =>
      storyGovernanceService.getVersion(workspaceId, displayedContractId!, displayedVersionId!),
    enabled: linked,
  });
  const assessment = useQuery({
    queryKey: queryKeys.storyGovernance.taskImpact(workspaceId, task.id),
    queryFn: () => storyGovernanceService.getTaskImpact(workspaceId, task.id),
    enabled: linked,
  });
  const canResolve =
    Boolean(assessment.data?.state === "PENDING") &&
    canResolveStoryImpact &&
    canEditTask &&
    (isWorkspaceAdmin || currentUserId === task.assigneeId);
  const operation = assessment.data
    ? `resolve-impact:${workspaceId}:${task.id}:${assessment.data._id}`
    : "";

  const resolveImpact = useMutation({
    mutationFn: () =>
      storyGovernanceService.resolveTaskImpact(
        workspaceId,
        task.id,
        assessment.data!._id,
        getOperationKey(operation),
      ),
    onSuccess: async (resolved) => {
      clearOperationKey(operation);
      setDisplayedVersionId(resolved.toStoryVersionId);
      setDisplayedState(resolved.requirementsState);
      queryClient.setQueryData(queryKeys.storyGovernance.taskImpact(workspaceId, task.id), resolved);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byWorkspace(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(workspaceId, task.key) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detailById(task.id) }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.storyGovernance.taskImpact(workspaceId, task.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.storyGovernance.versionImpact(
            workspaceId,
            resolved.storyContractId,
            resolved.toStoryVersionId,
          ),
        }),
      ]);
      setMessage("Impact resolved.");
    },
    onError: async (error) => {
      if (errorCode(error) === "IDEMPOTENCY_CONFLICT") {
        clearOperationKey(operation);
        await Promise.all([
          assessment.refetch(),
          contract.refetch(),
          version.refetch(),
          queryClient.refetchQueries({ queryKey: queryKeys.tasks.detail(workspaceId, task.key) }),
          queryClient.refetchQueries({ queryKey: queryKeys.tasks.byWorkspace(workspaceId) }),
        ]);
        setMessage("Resolution state changed. Refreshed the current task.");
        return;
      }
      setMessage("Could not resolve impact. Retry uses the same operation.");
    },
    onSettled: () => {
      resolvePendingRef.current = false;
    },
  });
  const updatePin = useMutation<Issue, unknown, string>({
    mutationFn: (contractId: string) => {
      const pin = selectContractPin(contractId, getApprovedContractOptions(contracts.data ?? []));
      return taskService.updateBoardTask(workspaceId, task.id, {
        storyContractId: pin.storyContractId ?? null,
        storyVersionId: pin.storyVersionId ?? null,
      });
    },
    onSuccess: async (updated) => {
      setPinError("");
      setDisplayedContractId(updated.storyContractId);
      setDisplayedVersionId(updated.storyVersionId);
      setDisplayedState(updated.requirementsState ?? "CURRENT");
      setMessage(updated.storyContractId ? "Story pin updated." : "Story pin cleared.");
      onUpdateTask?.({
        ...task,
        storyContractId: updated.storyContractId,
        storyVersionId: updated.storyVersionId,
        requirementsState: updated.requirementsState ?? "CURRENT",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byWorkspace(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(workspaceId, task.key) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detailById(task.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.storyGovernance.taskImpact(workspaceId, task.id) }),
      ]);
    },
    onError: () => setPinError("Could not update the Story pin. Refresh and try again."),
  });
  const approvedContracts = getApprovedContractOptions(contracts.data ?? []);
  const pinEditor = canEditTask && (
    <div className="mt-3 border-t border-[#EAEAEA] pt-3 dark:border-white/[0.06]">
      <label htmlFor={`task-story-contract-${task.id}`} className="text-[0.6875rem] font-medium text-[#787774] dark:text-[#9B9A97]">Story Contract</label>
      <select
        id={`task-story-contract-${task.id}`}
        value={displayedContractId ?? ""}
        disabled={contracts.isLoading || updatePin.isPending}
        onChange={(event) => {
          setPinError("");
          updatePin.mutate(event.target.value);
        }}
        className="mt-1 w-full rounded-[6px] border border-[#EAEAEA] bg-white px-2 py-1.5 text-[0.75rem] dark:border-white/[0.08] dark:bg-[#252525]"
      >
        <option value="">No linked Story</option>
        {approvedContracts.map((item) => <option key={item._id} value={item._id}>{item.key} · {item.title}</option>)}
      </select>
      {contracts.isError && <p role="alert" className="mt-1 text-[0.6875rem] text-[#9F2F2D]">Story Contracts are unavailable. <button type="button" onClick={() => void contracts.refetch()} className="underline">Retry</button></p>}
      {pinError && <p role="alert" className="mt-1 text-[0.6875rem] text-[#9F2F2D]">{pinError}</p>}
    </div>
  );
  const startResolution = () => {
    if (resolvePendingRef.current) return;
    resolvePendingRef.current = true;
    resolveImpact.mutate();
  };

  if (!linked) {
    return (
      <section
        ref={panelRef}
        tabIndex={-1}
        aria-label="Task Story"
        className="rounded-[8px] border border-[#EAEAEA] bg-[#F9F9F8] p-4 outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] dark:border-white/[0.06] dark:bg-[#252525]"
      >
        <h2 className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
          Task Story
        </h2>
        <p className="mt-1 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
          No Story linked
        </p>
        {pinEditor}
        {message && <p role="status" className="mt-2 text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">{message}</p>}
      </section>
    );
  }

  const state = displayedState ?? "CURRENT";
  const stateTone = state === "CURRENT"
    ? "bg-[#EDF3EC] text-[#346538]"
    : state === "REVIEW_REQUIRED"
      ? "bg-[#FBF3DB] text-[#956400]"
      : "bg-[#FDEBEC] text-[#9F2F2D]";

  return (
    <section
      ref={panelRef}
      tabIndex={-1}
      aria-label="Task Story"
      className="rounded-[8px] border border-[#EAEAEA] bg-white p-4 outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] dark:border-white/[0.06] dark:bg-[#202020]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <GitBranch aria-hidden className="h-4 w-4 text-[#2563EB]" />
            <h2 className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
              Task Story
            </h2>
            <span className={`rounded-[4px] px-2 py-0.5 text-[0.625rem] font-semibold ${stateTone}`}>
              {getRequirementsStateLabel(state)}
            </span>
          </div>
          {contract.isLoading || version.isLoading ? (
            <p className="mt-2 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">Loading Story pin…</p>
          ) : contract.isError || version.isError ? (
            <p role="alert" className="mt-2 text-[0.8125rem] text-[#9F2F2D]">
              Could not load the linked Story. Refresh and try again.
            </p>
          ) : (
            <div className="mt-2">
              <p className="truncate text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7]">
                <span className="mr-2 font-mono text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">
                  {contract.data?.key}
                </span>
                {contract.data?.title}
              </p>
              <p className="mt-1 text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">
                Version {version.data?.versionNumber ?? displayedVersionId}
              </p>
            </div>
          )}
        </div>
        <Link
          href={storyContractHref(workspaceKey, displayedContractId!, displayedVersionId!)}
          className="inline-flex items-center gap-1 rounded-[6px] px-2 py-1 text-[0.6875rem] font-medium text-[#2563EB] hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
        >
          Open Contract
          <ExternalLink aria-hidden className="h-3.5 w-3.5" />
        </Link>
      </div>
      {pinEditor}

      <div className="mt-3 border-t border-[#EAEAEA] pt-3 dark:border-white/[0.06]">
        {assessment.isLoading ? (
          <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">Loading impact…</p>
        ) : assessment.isError ? (
          <p role="alert" className="text-[0.8125rem] text-[#9F2F2D]">
            Could not load task impact.
          </p>
        ) : assessment.data ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7]">
                {assessment.data.state === "PENDING" ? "Pending impact" : "Resolved impact"}
              </p>
              <p className="mt-0.5 text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">
                {assessment.data.affectedCriterionIds.length} affected{" "}
                {assessment.data.affectedCriterionIds.length === 1 ? "criterion" : "criteria"}
              </p>
            </div>
            {canResolve && (
              <button
                type="button"
                disabled={resolveImpact.isPending}
                onClick={startResolution}
                className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#2563EB] px-3 py-1.5 text-[0.75rem] font-medium text-white hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw aria-hidden className="h-3.5 w-3.5" />
                Resolve impact
              </button>
            )}
          </div>
        ) : (
          <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
            No pending impact
          </p>
        )}
        {message && <p role="status" className="mt-2 text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">{message}</p>}
      </div>
    </section>
  );
}
