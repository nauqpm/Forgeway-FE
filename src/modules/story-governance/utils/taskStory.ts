import type { StoryContract, RequirementsState } from "../types/storyGovernance.type";
import type { Issue } from "@/modules/workspace/shared/types/issue.type";

export const TASK_STORY_GATE_EVENT = "task-story-gate";
export type TaskStoryGateCode =
  | "TASK_REQUIREMENT_REVIEW_REQUIRED"
  | "TASK_REQUIREMENT_REBASE_REQUIRED";

export const getApprovedContractOptions = (contracts: StoryContract[]) =>
  contracts.filter(
    (contract) => contract.status === "active" && Boolean(contract.currentApprovedStoryVersionId),
  );

export const selectContractPin = (contractId: string, contracts: StoryContract[]) => {
  const contract = contracts.find(
    (candidate) =>
      candidate._id === contractId &&
      candidate.status === "active" &&
      candidate.currentApprovedStoryVersionId,
  );
  return {
    storyContractId: contract?._id,
    storyVersionId: contract?.currentApprovedStoryVersionId ?? undefined,
  };
};

export const getRequirementsStateLabel = (state: RequirementsState) => ({
  CURRENT: "Current",
  REVIEW_REQUIRED: "Review required",
  REBASE_REQUIRED: "Rebase required",
})[state];

export const storyContractHref = (
  workspaceKey: string,
  contractId: string,
  versionId: string,
) =>
  `/workspaces/${encodeURIComponent(workspaceKey)}/stories?${new URLSearchParams({
    contract: contractId,
    section: "versions",
    version: versionId,
  })}`;

export const getTaskStoryGateCode = (error: unknown): TaskStoryGateCode | null => {
  const payload = (error as { response?: { data?: { code?: unknown; data?: { code?: unknown } } } })
    ?.response?.data;
  const code = payload?.code ?? payload?.data?.code;
  return code === "TASK_REQUIREMENT_REVIEW_REQUIRED" ||
    code === "TASK_REQUIREMENT_REBASE_REQUIRED"
    ? code
    : null;
};

export const openTaskStoryPanel = (taskId: string, code: TaskStoryGateCode) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TASK_STORY_GATE_EVENT, { detail: { taskId, code } }));
};

export const restoreTaskPositions = (current: Issue[], previous: Issue[]) => {
  const previousById = new Map(previous.map((issue) => [issue.id, issue]));
  return current.map((issue) => ({ ...(previousById.get(issue.id) ?? issue) }));
};
