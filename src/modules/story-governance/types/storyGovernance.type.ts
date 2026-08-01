export type RequirementsState = "CURRENT" | "REVIEW_REQUIRED" | "REBASE_REQUIRED";
export type CriterionPriority = "MUST" | "SHOULD" | "COULD";
export type StoryDraftStatus = "active" | "submitted" | "abandoned" | "stale";
export type StoryContractStatus = "active" | "archived";
export type VerificationStatus = "PASSED" | "FAILED" | "INCONCLUSIVE";
export type ChangeImpact = "BLOCKING" | "REVIEW_REQUIRED" | "INFORMATIONAL";

export type StoryDraftRequirementLinkInput = {
  requirementId: string;
  role: "PRIMARY" | "SUPPORTING" | "CONSTRAINT" | "CONFLICT";
  evidenceNote?: string;
};

export type StoryContentEntry = { id: string; text: string };
export type StoryContent = {
  problem: string;
  expectedOutcome: string;
  actors: string[];
  scope: StoryContentEntry[];
  outOfScope: StoryContentEntry[];
  businessRules: StoryContentEntry[];
  permissionRequirements: StoryContentEntry[];
  constraints: StoryContentEntry[];
  dependencies: StoryContentEntry[];
  risks: StoryContentEntry[];
};
export type StoryDraftRebaseConflict = {
  category: string;
  entityId: string;
  impactLevel: ChangeImpact;
  resolution: "UNRESOLVED" | "RESOLVED";
  changeType?: "ADDED" | "REMOVED" | "MODIFIED";
  fromStoryVersionId?: string;
  toStoryVersionId?: string;
};

type Entity = { _id: string; id?: string; workspaceId: string; createdAt?: string; updatedAt?: string };

export type RawRequirement = Entity & {
  key: string;
  title: string;
  body: string;
  sourceType: "manual" | "jira";
  sourceRef?: string;
  sourceMetadata?: Record<string, unknown>;
  status?: "active" | "archived";
};
export type CreateRequirementInput = Pick<RawRequirement, "key" | "title" | "body" | "sourceType" | "sourceRef" | "sourceMetadata">;

export type StoryContract = Entity & {
  key: string;
  title: string;
  status: StoryContractStatus;
  currentApprovedStoryVersionId?: string | null;
  latestStoryVersionNumber: number;
  version: number;
};
export type CreateContractInput = { title: string; primaryRequirementId: string };

export type AcceptanceCriterionInput = {
  key: string;
  priority: CriterionPriority;
  statement: string;
  given?: string;
  when?: string;
  then?: string;
  verificationMethod: string;
};
export type AcceptanceCriterion = Entity & { storyContractId: string; key: string; lifecycle: "ACTIVE" | "RETIRED"; retiredAt?: string };
export type AcceptanceCriterionRevision = Entity & AcceptanceCriterionInput & { acceptanceCriterionId: string; storyContractId: string; revisionNumber: number; contentHash: string };

export type StoryDraft = Entity & {
  storyContractId: string;
  baseStoryVersionId?: string | null;
  draftRevision: number;
  status: StoryDraftStatus;
  content: StoryContent;
  requirementLinks: StoryDraftRequirementLinkInput[];
  criterionInputs: AcceptanceCriterionInput[];
  decisionProposalIds: string[];
  submittedStoryVersionId?: string;
  rebasedFromDraftId?: string;
  rebaseConflicts?: StoryDraftRebaseConflict[];
};
export type UpdateDraftInput = {
  expectedDraftRevision: number;
  content?: StoryContent;
  requirementLinks?: StoryDraftRequirementLinkInput[];
  criterionInputs?: AcceptanceCriterionInput[];
  decisionProposalIds?: string[];
};

export type StoryVersion = Entity & {
  storyContractId: string;
  sourceDraftId: string;
  versionNumber: number;
  baseStoryVersionId?: string | null;
  contentSnapshot: StoryContent;
  requirementLinkSnapshot: Array<Omit<StoryDraftRequirementLinkInput, "role"> & { relationship: StoryDraftRequirementLinkInput["role"] }>;
  criteria: Array<{ acceptanceCriterionId: string; acceptanceCriterionRevisionId: string; key: string; priority: CriterionPriority }>;
  decisionRecordIds: string[];
  contentHash: string;
};
export type StoryVersionChange = { changeType: "ADDED" | "REMOVED" | "MODIFIED"; entityId: string; oldRevisionId?: string; newRevisionId?: string; impactLevel: ChangeImpact };
export type StoryVersionChangeSet = Entity & { storyContractId: string; fromStoryVersionId: string; toStoryVersionId: string; fromContentHash: string; toContentHash: string; scopeChanges: StoryVersionChange[]; businessRuleChanges: StoryVersionChange[]; permissionChanges: StoryVersionChange[]; requirementChanges: StoryVersionChange[]; acceptanceCriterionChanges: StoryVersionChange[]; decisionChanges: StoryVersionChange[]; dependencyChanges: StoryVersionChange[] };

export type CreateVerificationInput = { storyVersionId: string; status: VerificationStatus; evidenceType: string; evidenceRef: string; taskId?: string; pullRequestRef?: string; qaRunRef?: string };
export type CriterionVerification = Entity & CreateVerificationInput & { storyContractId: string; acceptanceCriterionId: string; acceptanceCriterionRevisionId: string; submittedBy: string; submittedAt: string };

export type DecisionOption = { key: string; label: string };
export type DecisionProposalInput = { question: string; options: DecisionOption[]; recommendation?: string };
export type DecisionResolutionInput = { selectedOption: string; rationale: string };
export type DecisionProposal = Entity & DecisionProposalInput & { storyContractId: string; state: "OPEN" | "APPROVED" | "REJECTED" | "WITHDRAWN"; proposedBy: { kind: "human" | "agent"; actorId: string }; resolvedBy?: string; resolvedAt?: string };
export type DecisionRecord = Entity & DecisionResolutionInput & { storyContractId: string; sourceProposalId: string; question: string; supersedesDecisionRecordId?: string; decidedBy: string; decidedAt: string };

export type ApprovalRequest = Entity & { storyContractId: string; storyVersionId: string; state: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"; requestedBy: string; resolvedAt?: string };
export type ApprovalRecord = Entity & { storyContractId: string; storyVersionId: string; approvalRequestId: string; decision: "APPROVE" | "REJECT"; reason?: string };
export type ApprovalHistory = { requests: ApprovalRequest[]; records: ApprovalRecord[] };
export type ApproveVersionInput = { approvalRequestId: string; expectedCurrentVersionId: string | null };
export type RejectVersionInput = { approvalRequestId: string; reason?: string };
export type StoryApprovalResult = { record: ApprovalRecord; approved: boolean };

export type StoryImpactAssessment = Entity & { taskId: string; storyContractId: string; fromStoryVersionId: string; toStoryVersionId: string; affectedCriterionIds: string[]; requirementsState: RequirementsState; state: "PENDING" | "RESOLVED"; resolvedAt?: string | null; resolvedBy?: string | null };
export type TaskStoryPin = { storyContractId?: string | null; storyVersionId?: string | null; requirementsState?: RequirementsState };
