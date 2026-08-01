import type {
  AcceptanceCriterionInput,
  ApprovalHistory,
  ChangeImpact,
  StoryContent,
  StoryContract,
  StoryDraftRequirementLinkInput,
  StoryVersion,
  StoryVersionChange,
  StoryVersionChangeSet,
} from "../types/storyGovernance.type";

export const createOperationKey = () => crypto.randomUUID();

const operationKeys = new Map<string, string>();
let draftNavigationDirty = false;
let protectedDraftUrl = "";
let draftNavigationPrompt: ((continueNavigation: () => void) => void) | null = null;

export const getOperationKey = (operation: string) => {
  const existing = operationKeys.get(operation);
  if (existing) return existing;
  const key = createOperationKey();
  operationKeys.set(operation, key);
  return key;
};

export const clearOperationKey = (operation: string) => operationKeys.delete(operation);

export const setDraftNavigationDirty = (dirty: boolean) => {
  draftNavigationDirty = dirty;
  if (dirty && typeof window !== "undefined") {
    protectedDraftUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  }
};

export const getProtectedDraftUrl = () => protectedDraftUrl;

export const registerDraftNavigationPrompt = (
  prompt: (continueNavigation: () => void) => void,
) => {
  draftNavigationPrompt = prompt;
  return () => {
    if (draftNavigationPrompt === prompt) draftNavigationPrompt = null;
  };
};

export const requestDraftNavigation = (continueNavigation: () => void) => {
  if (!draftNavigationDirty) {
    continueNavigation();
    return true;
  }
  draftNavigationPrompt?.(continueNavigation);
  return false;
};

export const deriveVersionState = (
  version: Pick<StoryVersion, "_id">,
  contract: Pick<StoryContract, "currentApprovedStoryVersionId">,
  approvals: Pick<ApprovalHistory, "requests" | "records">,
) => {
  if (contract.currentApprovedStoryVersionId === version._id) return "APPROVED";
  if (approvals.requests.some((request) => request.storyVersionId === version._id && request.state === "PENDING")) return "PENDING_APPROVAL";
  const latestRecord = approvals.records
    .filter((record) => record.storyVersionId === version._id)
    .reduce<(typeof approvals.records)[number] | undefined>(
      (latest, record) => !latest || Date.parse(record.createdAt ?? "") >= Date.parse(latest.createdAt ?? "") ? record : latest,
      undefined,
    );
  if (latestRecord?.decision === "REJECT") return "REJECTED";
  if (latestRecord?.decision === "APPROVE") return "SUPERSEDED";
  return "SNAPSHOT";
};

export const groupChanges = (changeSet: Pick<StoryVersionChangeSet, "scopeChanges" | "businessRuleChanges" | "permissionChanges" | "requirementChanges" | "acceptanceCriterionChanges" | "decisionChanges" | "dependencyChanges">): Record<ChangeImpact, StoryVersionChange[]> =>
  [changeSet.scopeChanges, changeSet.businessRuleChanges, changeSet.permissionChanges, changeSet.requirementChanges, changeSet.acceptanceCriterionChanges, changeSet.decisionChanges, changeSet.dependencyChanges].flat().reduce<Record<ChangeImpact, StoryVersionChange[]>>(
    (groups, change) => {
      groups[change.impactLevel].push(change);
      return groups;
    },
    { BLOCKING: [], REVIEW_REQUIRED: [], INFORMATIONAL: [] },
  );

export const validateRequirementLinks = (links: StoryDraftRequirementLinkInput[]) => {
  const primaryCount = links.filter((link) => link.role === "PRIMARY").length;
  const duplicatePair = links.some((link, index) => links.findIndex((candidate) => candidate.requirementId === link.requirementId && candidate.role === link.role) !== index);
  const duplicateRequirement = !duplicatePair && links.some((link, index) => links.findIndex((candidate) => candidate.requirementId === link.requirementId) !== index);
  return [
    ...(primaryCount === 1 ? [] : ["Keep exactly one primary requirement."]),
    ...(duplicatePair ? ["Each Requirement relationship may be selected only once."] : []),
    ...(duplicateRequirement ? ["Each Requirement may be linked only once."] : []),
  ];
};

export type DraftFormState = {
  content: StoryContent;
  requirementLinks: StoryDraftRequirementLinkInput[];
  criterionInputs: AcceptanceCriterionInput[];
  decisionProposalIds: string[];
};

export const validateDraftForm = (form: DraftFormState, selectableRequirementIds: Set<string>, existingRequirementIds: Set<string>) => {
  const errors = validateRequirementLinks(form.requirementLinks);
  if (form.requirementLinks.some((link) => !link.requirementId || (!selectableRequirementIds.has(link.requirementId) && !existingRequirementIds.has(link.requirementId)))) errors.push("Select Requirements from this workspace.");
  if (form.requirementLinks.some((link) => (link.evidenceNote?.length ?? 0) > 2000)) errors.push("Requirement evidence notes must be 2,000 characters or fewer.");
  const entries = Object.values(form.content).flatMap((value) => Array.isArray(value) ? value.map((entry) => typeof entry === "string" ? entry : entry.text) : [value]);
  if (entries.some((entry) => !entry.trim())) errors.push("Remove or complete blank content rows.");
  if (JSON.stringify(form.content).length > 100000) errors.push("Story content must be 100,000 characters or fewer.");
  const duplicateKeys = new Set(form.criterionInputs.map((criterion) => criterion.key.trim()).filter((key, index, keys) => key && keys.indexOf(key) !== index));
  if (duplicateKeys.size) errors.push("Acceptance criterion keys must be unique.");
  if (form.criterionInputs.some((criterion) => !criterion.key.trim() || criterion.key.length > 100 || !["MUST", "SHOULD", "COULD"].includes(criterion.priority) || !criterion.statement.trim() || criterion.statement.length > 10000 || !criterion.verificationMethod.trim() || criterion.verificationMethod.length > 255 || [criterion.given, criterion.when, criterion.then].some((part) => (part?.length ?? 0) > 10000))) errors.push("Complete every acceptance criterion within its field limits.");
  const proposalIds = form.decisionProposalIds.map((id) => id.trim());
  if (proposalIds.some((id) => !/^[0-9a-f]{24}$/i.test(id)) || new Set(proposalIds).size !== proposalIds.length) errors.push("Decision proposal IDs must be valid and unique.");
  return errors;
};

export const isSafeEvidenceHref = (href: string) => {
  try {
    return new URL(href).protocol === "https:";
  } catch {
    return false;
  }
};
