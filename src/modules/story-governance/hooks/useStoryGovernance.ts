"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/constants/queryKeys";
import { storyGovernanceService } from "../services/storyGovernance.service";
import type { ApproveVersionInput, CreateContractInput, CreateRequirementInput, CreateVerificationInput, DecisionProposalInput, DecisionResolutionInput, RejectVersionInput, UpdateDraftInput } from "../types/storyGovernance.type";

export const useStoryGovernance = (workspaceId: string, enabled = true) => {
  const queryClient = useQueryClient();
  const requirementsKey = queryKeys.storyGovernance.requirements(workspaceId);
  const contractsKey = queryKeys.storyGovernance.contracts(workspaceId);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.storyGovernance.all(workspaceId) });

  return {
    requirements: useQuery({ queryKey: requirementsKey, queryFn: () => storyGovernanceService.listRequirements(workspaceId), enabled: Boolean(workspaceId) && enabled }),
    contracts: useQuery({ queryKey: contractsKey, queryFn: () => storyGovernanceService.listContracts(workspaceId), enabled: Boolean(workspaceId) && enabled }),
    createRequirement: useMutation({ mutationFn: (input: CreateRequirementInput) => storyGovernanceService.createRequirement(workspaceId, input), onSuccess: invalidate }),
    archiveRequirement: useMutation({ mutationFn: (id: string) => storyGovernanceService.archiveRequirement(workspaceId, id), onSuccess: invalidate }),
    createContract: useMutation({ mutationFn: (input: CreateContractInput) => storyGovernanceService.createContract(workspaceId, input), onSuccess: invalidate }),
    archiveContract: useMutation({ mutationFn: (id: string) => storyGovernanceService.archiveContract(workspaceId, id), onSuccess: invalidate }),
  };
};

export const useStoryRequirement = (workspaceId: string, requirementId: string | null, enabled = true) => useQuery({
  queryKey: queryKeys.storyGovernance.requirement(workspaceId, requirementId ?? ""),
  queryFn: () => storyGovernanceService.getRequirement(workspaceId, requirementId!),
  enabled: Boolean(workspaceId && requirementId && enabled),
});

export const useStoryDrafts = (workspaceId: string, contractId: string | null, draftId: string | null, enabled = true) => {
  const queryClient = useQueryClient();
  const ready = Boolean(workspaceId && contractId && enabled);
  const draftsKey = contractId ? queryKeys.storyGovernance.drafts(workspaceId, contractId) : ["story-governance", workspaceId, "drafts"] as const;
  const draftKey = contractId && draftId ? queryKeys.storyGovernance.draft(workspaceId, contractId, draftId) : ["story-governance", workspaceId, "draft"] as const;
  const invalidateDrafts = async (...affectedDraftIds: string[]) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: draftsKey }),
      queryClient.invalidateQueries({ queryKey: queryKeys.storyGovernance.contract(workspaceId, contractId ?? "") }),
      ...affectedDraftIds.map((id) => queryClient.invalidateQueries({ queryKey: queryKeys.storyGovernance.draft(workspaceId, contractId ?? "", id) })),
    ]);
  };
  const drafts = useQuery({ queryKey: draftsKey, queryFn: () => storyGovernanceService.listDrafts(workspaceId, contractId!), enabled: ready });
  const draft = useQuery({ queryKey: draftKey, queryFn: () => storyGovernanceService.getDraft(workspaceId, contractId!, draftId!), enabled: ready && Boolean(draftId) });
  const createDraft = useMutation({ mutationFn: () => storyGovernanceService.createDraft(workspaceId, contractId!), onSuccess: (created) => invalidateDrafts(created._id) });
  const updateDraft = useMutation({ mutationFn: (input: UpdateDraftInput) => storyGovernanceService.updateDraft(workspaceId, contractId!, draftId!, input), onSuccess: (updated) => {
    queryClient.setQueryData(queryKeys.storyGovernance.draft(workspaceId, contractId!, updated._id), updated);
    return invalidateDrafts(updated._id);
  } });
  const abandonDraft = useMutation({ mutationFn: (id: string) => storyGovernanceService.abandonDraft(workspaceId, contractId!, id) });
  const rebaseDraft = useMutation({ mutationFn: (id: string) => storyGovernanceService.rebaseDraft(workspaceId, contractId!, id) });
  const submitDraft = useMutation({ mutationFn: (operationKey: string) => storyGovernanceService.submitDraft(workspaceId, contractId!, draftId!, operationKey) });
  const refreshAuthoritative = async () => {
    await Promise.all([draft.refetch(), drafts.refetch(), queryClient.invalidateQueries({ queryKey: queryKeys.storyGovernance.versions(workspaceId, contractId ?? "") }), queryClient.invalidateQueries({ queryKey: queryKeys.storyGovernance.contract(workspaceId, contractId ?? "") })]);
  };
  const invalidateAfterSubmit = async () => {
    await Promise.all([invalidateDrafts(...(draftId ? [draftId] : [])), queryClient.invalidateQueries({ queryKey: queryKeys.storyGovernance.versions(workspaceId, contractId ?? "") }), queryClient.invalidateQueries({ queryKey: ["story-governance", workspaceId, "contracts", contractId, "criteria"] }), queryClient.invalidateQueries({ queryKey: queryKeys.storyGovernance.approvals(workspaceId, contractId ?? "") })]);
  };
  return { drafts, draft, createDraft, updateDraft, abandonDraft, rebaseDraft, submitDraft, invalidateDrafts, invalidateAfterSubmit, refreshAuthoritative };
};

export const useStoryVersions = (
  workspaceId: string,
  contractId: string,
  fromId?: string,
  toId?: string,
  enabled = true,
  includeApprovals = true,
) => {
  const queryClient = useQueryClient();
  const ready = Boolean(workspaceId && contractId && enabled);
  const versions = useQuery({
    queryKey: queryKeys.storyGovernance.versions(workspaceId, contractId),
    queryFn: () => storyGovernanceService.listVersions(workspaceId, contractId),
    enabled: ready,
  });
  const approvals = useQuery({
    queryKey: queryKeys.storyGovernance.approvals(workspaceId, contractId),
    queryFn: () => storyGovernanceService.listApprovals(workspaceId, contractId),
    enabled: ready && includeApprovals,
  });
  const comparison = useQuery({
    queryKey: queryKeys.storyGovernance.diff(workspaceId, contractId, fromId ?? "", toId ?? ""),
    queryFn: () => storyGovernanceService.compareVersions(workspaceId, contractId, fromId!, toId!),
    enabled: ready && Boolean(fromId && toId && fromId !== toId),
  });
  const linkTask = useMutation({
    mutationFn: (variables: { versionId: string; taskId: string; taskKey: string }) => storyGovernanceService.linkTask(workspaceId, contractId, variables.versionId, variables.taskId),
    onSuccess: async (_result, { versionId, taskId, taskKey }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byWorkspace(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(workspaceId, taskKey) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.storyGovernance.taskImpact(workspaceId, taskId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.storyGovernance.versionImpact(workspaceId, contractId, versionId) }),
      ]);
    },
  });

  return { versions, approvals, comparison, linkTask };
};

export const useStoryApprovals = (workspaceId: string, contractId: string, enabled = true) => {
  const queryClient = useQueryClient();
  const ready = Boolean(workspaceId && contractId && enabled);
  const approvalsKey = queryKeys.storyGovernance.approvals(workspaceId, contractId);
  const refreshApprovalAuthority = useCallback((versionId?: string) => Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.storyGovernance.contracts(workspaceId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.storyGovernance.contract(workspaceId, contractId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.storyGovernance.versions(workspaceId, contractId) }),
    queryClient.invalidateQueries({ queryKey: approvalsKey }),
    queryClient.invalidateQueries({ queryKey: queryKeys.storyGovernance.drafts(workspaceId, contractId) }),
    ...(versionId ? [queryClient.invalidateQueries({ queryKey: queryKeys.storyGovernance.versionImpact(workspaceId, contractId, versionId) })] : []),
  ]), [approvalsKey, contractId, queryClient, workspaceId]);
  const approvals = useQuery({ queryKey: approvalsKey, queryFn: () => storyGovernanceService.listApprovals(workspaceId, contractId), enabled: ready });
  return {
    approvals,
    refreshApprovalAuthority,
    requestApproval: useMutation({ mutationFn: (versionId: string) => storyGovernanceService.requestApproval(workspaceId, contractId, versionId), onSuccess: () => refreshApprovalAuthority() }),
    approveVersion: useMutation({ mutationFn: ({ versionId, input, operationKey }: { versionId: string; input: ApproveVersionInput; operationKey: string }) => storyGovernanceService.approveVersion(workspaceId, contractId, versionId, input, operationKey), onSuccess: () => Promise.all([
      refreshApprovalAuthority(),
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byWorkspace(workspaceId) }),
    ]) }),
    rejectVersion: useMutation({ mutationFn: ({ versionId, input }: { versionId: string; input: RejectVersionInput }) => storyGovernanceService.rejectVersion(workspaceId, contractId, versionId, input), onSuccess: () => refreshApprovalAuthority() }),
  };
};

export const useStoryDecisions = (workspaceId: string, contractId: string, enabled = true) => {
  const queryClient = useQueryClient();
  const ready = Boolean(workspaceId && contractId && enabled);
  const proposalsKey = queryKeys.storyGovernance.decisionProposals(workspaceId, contractId);
  const decisionsKey = queryKeys.storyGovernance.decisions(workspaceId, contractId);
  const proposals = useQuery({ queryKey: proposalsKey, queryFn: () => storyGovernanceService.listDecisionProposals(workspaceId, contractId), enabled: ready });
  const decisions = useQuery({ queryKey: decisionsKey, queryFn: () => storyGovernanceService.listDecisions(workspaceId, contractId), enabled: ready });
  const refresh = useCallback(async () => {
    await Promise.all([
      proposals.refetch(),
      decisions.refetch(),
      queryClient.refetchQueries({ queryKey: queryKeys.storyGovernance.drafts(workspaceId, contractId), type: "active" }),
    ]);
  }, [contractId, decisions, proposals, queryClient, workspaceId]);
  const invalidate = useCallback((includeVersions = false) => Promise.all([
    queryClient.invalidateQueries({ queryKey: proposalsKey }),
    queryClient.invalidateQueries({ queryKey: decisionsKey }),
    queryClient.invalidateQueries({ queryKey: queryKeys.storyGovernance.drafts(workspaceId, contractId) }),
    ...(includeVersions ? [queryClient.invalidateQueries({ queryKey: queryKeys.storyGovernance.versions(workspaceId, contractId) })] : []),
  ]), [contractId, decisionsKey, proposalsKey, queryClient, workspaceId]);
  return {
    proposals,
    decisions,
    createProposal: useMutation({ mutationFn: (input: DecisionProposalInput) => storyGovernanceService.createDecisionProposal(workspaceId, contractId, input), onSuccess: () => invalidate() }),
    updateProposal: useMutation({ mutationFn: ({ proposalId, input }: { proposalId: string; input: DecisionProposalInput }) => storyGovernanceService.updateDecisionProposal(workspaceId, contractId, proposalId, input), onSuccess: () => invalidate() }),
    approveProposal: useMutation({ mutationFn: ({ proposalId, input }: { proposalId: string; input: DecisionResolutionInput }) => storyGovernanceService.approveDecisionProposal(workspaceId, contractId, proposalId, input), onSuccess: () => invalidate() }),
    supersedeDecision: useMutation({ mutationFn: ({ decisionId, input }: { decisionId: string; input: DecisionResolutionInput }) => storyGovernanceService.supersedeDecision(workspaceId, contractId, decisionId, input), onSuccess: () => invalidate(true) }),
    refresh,
  };
};

export const useStoryVersionImpact = (workspaceId: string, contractId: string, versionId?: string, enabled = true) => useQuery({
  queryKey: queryKeys.storyGovernance.versionImpact(workspaceId, contractId, versionId ?? ""),
  queryFn: () => storyGovernanceService.getVersionImpact(workspaceId, contractId, versionId!),
  enabled: Boolean(workspaceId && contractId && versionId && enabled),
});

export const useStoryCriteria = (
  workspaceId: string,
  contractId: string,
  versionId: string,
  criterionId: string,
  revisionId: string,
  enabled = true,
) => {
  const queryClient = useQueryClient();
  const ready = Boolean(workspaceId && contractId && criterionId && enabled);
  const verificationsKey = queryKeys.storyGovernance.verifications(workspaceId, contractId, versionId, criterionId, revisionId);
  const criterion = useQuery({ queryKey: queryKeys.storyGovernance.criterion(workspaceId, contractId, criterionId), queryFn: () => storyGovernanceService.getCriterion(workspaceId, contractId, criterionId), enabled: ready });
  const revisions = useQuery({ queryKey: queryKeys.storyGovernance.criterionRevisions(workspaceId, contractId, criterionId), queryFn: () => storyGovernanceService.listCriterionRevisions(workspaceId, contractId, criterionId), enabled: ready });
  const verifications = useQuery({ queryKey: verificationsKey, queryFn: () => storyGovernanceService.listVerifications(workspaceId, contractId, versionId, criterionId, revisionId), enabled: ready && Boolean(versionId && revisionId) });
  const submitVerification = useMutation({
    mutationFn: (input: CreateVerificationInput) => storyGovernanceService.submitVerification(workspaceId, contractId, criterionId, revisionId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: verificationsKey }),
  });
  return { criterion, revisions, verifications, submitVerification };
};
