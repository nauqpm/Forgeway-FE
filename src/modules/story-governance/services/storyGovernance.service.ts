import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";

import type {
  AcceptanceCriterion,
  AcceptanceCriterionRevision,
  ApprovalHistory,
  ApprovalRecord,
  ApprovalRequest,
  ApproveVersionInput,
  CreateContractInput,
  CreateRequirementInput,
  CreateVerificationInput,
  CriterionVerification,
  DecisionProposal,
  DecisionProposalInput,
  DecisionRecord,
  DecisionResolutionInput,
  RawRequirement,
  RejectVersionInput,
  StoryApprovalResult,
  StoryContract,
  StoryDraft,
  StoryImpactAssessment,
  StoryVersion,
  StoryVersionChangeSet,
  UpdateDraftInput,
} from "../types/storyGovernance.type";

type ApiResponse<T> = { data: T | { data?: T } };

export const normalizeApiData = <T>(response: ApiResponse<T>): T => {
  const payload = response.data;
  return (typeof payload === "object" && payload !== null && "data" in payload ? payload.data : payload) as T;
};

const request = async <T>(promise: Promise<ApiResponse<T>>) => normalizeApiData(await promise);
const routes = apiRoutes.STORY_GOVERNANCE;

export const storyGovernanceService = {
  listRequirements: (workspaceId: string) => request<RawRequirement[]>(api.get(routes.REQUIREMENTS(workspaceId))),
  getRequirement: (workspaceId: string, requirementId: string) => request<RawRequirement>(api.get(routes.REQUIREMENT(workspaceId, requirementId))),
  createRequirement: (workspaceId: string, input: CreateRequirementInput) => request<RawRequirement>(api.post(routes.REQUIREMENTS(workspaceId), input)),
  archiveRequirement: (workspaceId: string, requirementId: string) => request<RawRequirement>(api.post(routes.REQUIREMENT_ARCHIVE(workspaceId, requirementId), {})),
  listContracts: (workspaceId: string) => request<StoryContract[]>(api.get(routes.CONTRACTS(workspaceId))),
  getContract: (workspaceId: string, contractId: string) => request<StoryContract>(api.get(routes.CONTRACT(workspaceId, contractId))),
  createContract: (workspaceId: string, input: CreateContractInput) => request<{ contract: StoryContract; draft: StoryDraft }>(api.post(routes.CONTRACTS(workspaceId), input)),
  archiveContract: (workspaceId: string, contractId: string) => request<StoryContract>(api.post(routes.CONTRACT_ARCHIVE(workspaceId, contractId), {})),
  listDrafts: (workspaceId: string, contractId: string) => request<StoryDraft[]>(api.get(routes.DRAFTS(workspaceId, contractId))),
  getDraft: (workspaceId: string, contractId: string, draftId: string) => request<StoryDraft>(api.get(routes.DRAFT(workspaceId, contractId, draftId))),
  createDraft: (workspaceId: string, contractId: string) => request<StoryDraft>(api.post(routes.DRAFTS(workspaceId, contractId), {})),
  updateDraft: (workspaceId: string, contractId: string, draftId: string, input: UpdateDraftInput) => request<StoryDraft>(api.patch(routes.DRAFT(workspaceId, contractId, draftId), input)),
  abandonDraft: (workspaceId: string, contractId: string, draftId: string) => request<StoryDraft>(api.post(routes.DRAFT_ACTION(workspaceId, contractId, draftId, "abandon"), {})),
  submitDraft: (workspaceId: string, contractId: string, draftId: string, operationKey: string) => request<StoryVersion>(api.post(routes.DRAFT_ACTION(workspaceId, contractId, draftId, "submit"), {}, { headers: { "Idempotency-Key": operationKey } })),
  rebaseDraft: (workspaceId: string, contractId: string, draftId: string) => request<StoryDraft>(api.post(routes.DRAFT_ACTION(workspaceId, contractId, draftId, "rebase"), {})),
  listVersions: (workspaceId: string, contractId: string) => request<StoryVersion[]>(api.get(routes.VERSIONS(workspaceId, contractId))),
  getVersion: (workspaceId: string, contractId: string, versionId: string) => request<StoryVersion>(api.get(routes.VERSION(workspaceId, contractId, versionId))),
  compareVersions: (workspaceId: string, contractId: string, fromId: string, toId: string) => request<StoryVersionChangeSet>(api.get(routes.VERSION_DIFF(workspaceId, contractId, fromId, toId))),
  getCriterion: (workspaceId: string, contractId: string, criterionId: string) => request<AcceptanceCriterion>(api.get(routes.CRITERION(workspaceId, contractId, criterionId))),
  listCriterionRevisions: (workspaceId: string, contractId: string, criterionId: string) => request<AcceptanceCriterionRevision[]>(api.get(routes.CRITERION_REVISIONS(workspaceId, contractId, criterionId))),
  listVerifications: (workspaceId: string, contractId: string, versionId: string, criterionId: string, revisionId: string) => request<CriterionVerification[]>(api.get(`${routes.VERIFICATIONS(workspaceId, contractId, criterionId, revisionId)}?storyVersionId=${versionId}`)),
  submitVerification: (workspaceId: string, contractId: string, criterionId: string, revisionId: string, input: CreateVerificationInput) => request<CriterionVerification>(api.post(routes.VERIFICATIONS(workspaceId, contractId, criterionId, revisionId), input)),
  listDecisionProposals: (workspaceId: string, contractId: string) => request<DecisionProposal[]>(api.get(routes.DECISION_PROPOSALS(workspaceId, contractId))),
  createDecisionProposal: (workspaceId: string, contractId: string, input: DecisionProposalInput) => request<DecisionProposal>(api.post(routes.DECISION_PROPOSALS(workspaceId, contractId), input)),
  updateDecisionProposal: (workspaceId: string, contractId: string, proposalId: string, input: DecisionProposalInput) => request<DecisionProposal>(api.patch(routes.DECISION_PROPOSAL(workspaceId, contractId, proposalId), input)),
  approveDecisionProposal: (workspaceId: string, contractId: string, proposalId: string, input: DecisionResolutionInput) => request<DecisionRecord>(api.post(routes.DECISION_PROPOSAL_APPROVE(workspaceId, contractId, proposalId), input)),
  listDecisions: (workspaceId: string, contractId: string) => request<DecisionRecord[]>(api.get(routes.DECISIONS(workspaceId, contractId))),
  supersedeDecision: (workspaceId: string, contractId: string, decisionId: string, input: DecisionResolutionInput) => request<DecisionRecord>(api.post(routes.DECISION_SUPERSEDE(workspaceId, contractId, decisionId), input)),
  listApprovals: (workspaceId: string, contractId: string) => request<ApprovalHistory>(api.get(routes.APPROVALS(workspaceId, contractId))),
  requestApproval: (workspaceId: string, contractId: string, versionId: string) => request<ApprovalRequest>(api.post(routes.VERSION_APPROVAL_REQUEST(workspaceId, contractId, versionId), {})),
  approveVersion: (workspaceId: string, contractId: string, versionId: string, input: ApproveVersionInput, operationKey: string) => request<StoryApprovalResult>(api.post(routes.VERSION_APPROVE(workspaceId, contractId, versionId), input, { headers: { "Idempotency-Key": operationKey } })),
  rejectVersion: (workspaceId: string, contractId: string, versionId: string, input: RejectVersionInput) => request<ApprovalRecord>(api.post(routes.VERSION_REJECT(workspaceId, contractId, versionId), input)),
  linkTask: (workspaceId: string, contractId: string, versionId: string, taskId: string) => request<unknown>(api.post(routes.LINK_TASK(workspaceId, contractId, versionId, taskId), {})),
  getVersionImpact: (workspaceId: string, contractId: string, versionId: string) => request<StoryImpactAssessment[]>(api.get(routes.VERSION_IMPACT(workspaceId, contractId, versionId))),
  async getTaskImpact(workspaceId: string, taskId: string): Promise<StoryImpactAssessment | null> {
    try {
      return await request<StoryImpactAssessment>(api.get(routes.TASK_IMPACT(workspaceId, taskId)));
    } catch (error) {
      if ((error as { response?: { status?: number } }).response?.status === 404) return null;
      throw error;
    }
  },
  resolveTaskImpact: (workspaceId: string, taskId: string, assessmentId: string, operationKey: string) => request<StoryImpactAssessment>(api.post(routes.RESOLVE_TASK_IMPACT(workspaceId, taskId, assessmentId), {}, { headers: { "Idempotency-Key": operationKey } })),
};
