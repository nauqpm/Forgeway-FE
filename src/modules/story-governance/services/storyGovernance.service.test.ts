import { beforeEach, describe, expect, it, vi } from "vitest";

const { api } = vi.hoisted(() => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock("@/lib/axiosIns", () => ({ default: api }));

import { normalizeApiData, storyGovernanceService } from "./storyGovernance.service";

const response = (data: unknown) => ({ data: { data } });

describe("storyGovernanceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue(response("get"));
    api.post.mockResolvedValue(response("post"));
    api.patch.mockResolvedValue(response("patch"));
  });

  it("normalizes both response envelopes", () => {
    expect(normalizeApiData({ data: { data: "nested" } })).toBe("nested");
    expect(normalizeApiData({ data: "raw" })).toBe("raw");
  });

  it("preserves the Backend compare, impact, approval, decision, and verification response shapes", async () => {
    api.get
      .mockResolvedValueOnce(response({ scopeChanges: [{ impactLevel: "BLOCKING" }], businessRuleChanges: [], permissionChanges: [], requirementChanges: [], acceptanceCriterionChanges: [], decisionChanges: [], dependencyChanges: [] }))
      .mockResolvedValueOnce(response([{ fromStoryVersionId: "from", toStoryVersionId: "to", affectedCriterionIds: ["ac"], requirementsState: "REBASE_REQUIRED", state: "PENDING" }]));
    api.post
      .mockResolvedValueOnce(response({ approvalRequestId: "ar", storyVersionId: "ver", decision: "APPROVE" }))
      .mockResolvedValueOnce(response({ sourceProposalId: "proposal", selectedOption: "accept", supersedesDecisionRecordId: "old" }))
      .mockResolvedValueOnce(response({ acceptanceCriterionId: "ac", acceptanceCriterionRevisionId: "rev", storyVersionId: "ver", status: "PASSED" }));

    await expect(storyGovernanceService.compareVersions("ws", "sc", "from", "to")).resolves.toMatchObject({ scopeChanges: [{ impactLevel: "BLOCKING" }] });
    await expect(storyGovernanceService.getVersionImpact("ws", "sc", "to")).resolves.toMatchObject([{ fromStoryVersionId: "from", toStoryVersionId: "to", affectedCriterionIds: ["ac"], state: "PENDING" }]);
    await expect(storyGovernanceService.approveVersion("ws", "sc", "ver", { approvalRequestId: "ar", expectedCurrentVersionId: null }, "op")).resolves.toMatchObject({ approvalRequestId: "ar", decision: "APPROVE" });
    await expect(storyGovernanceService.approveDecisionProposal("ws", "sc", "proposal", { selectedOption: "accept", rationale: "because" })).resolves.toMatchObject({ sourceProposalId: "proposal", supersedesDecisionRecordId: "old" });
    await expect(storyGovernanceService.submitVerification("ws", "sc", "ac", "rev", { storyVersionId: "ver", status: "PASSED", evidenceType: "qa", evidenceRef: "https://evidence" })).resolves.toMatchObject({ acceptanceCriterionId: "ac", acceptanceCriterionRevisionId: "rev" });
  });

  it("uses the complete nested routes and only scopes idempotency to submit, approve, and impact resolution", async () => {
    const input = { title: "Title" } as never;
    const decision = { question: "Question", options: [] } as never;
    const approval = { approvalRequestId: "ar", expectedCurrentVersionId: null } as never;

    await storyGovernanceService.listRequirements("ws");
    await storyGovernanceService.getRequirement("ws", "req");
    await storyGovernanceService.createRequirement("ws", input);
    await storyGovernanceService.archiveRequirement("ws", "req");
    await storyGovernanceService.listContracts("ws");
    await storyGovernanceService.getContract("ws", "sc");
    await storyGovernanceService.createContract("ws", input);
    await storyGovernanceService.archiveContract("ws", "sc");
    await storyGovernanceService.listDrafts("ws", "sc");
    await storyGovernanceService.getDraft("ws", "sc", "draft");
    await storyGovernanceService.createDraft("ws", "sc");
    await storyGovernanceService.updateDraft("ws", "sc", "draft", input);
    await storyGovernanceService.abandonDraft("ws", "sc", "draft");
    await storyGovernanceService.submitDraft("ws", "sc", "draft", "op-1");
    await storyGovernanceService.rebaseDraft("ws", "sc", "draft");
    await storyGovernanceService.listVersions("ws", "sc");
    await storyGovernanceService.getVersion("ws", "sc", "ver");
    await storyGovernanceService.compareVersions("ws", "sc", "from", "to");
    await storyGovernanceService.getCriterion("ws", "sc", "ac");
    await storyGovernanceService.listCriterionRevisions("ws", "sc", "ac");
    await storyGovernanceService.listVerifications("ws", "sc", "ver", "ac", "rev");
    await storyGovernanceService.submitVerification("ws", "sc", "ac", "rev", input);
    await storyGovernanceService.listDecisionProposals("ws", "sc");
    await storyGovernanceService.createDecisionProposal("ws", "sc", decision);
    await storyGovernanceService.updateDecisionProposal("ws", "sc", "proposal", decision);
    await storyGovernanceService.approveDecisionProposal("ws", "sc", "proposal", decision);
    await storyGovernanceService.listDecisions("ws", "sc");
    await storyGovernanceService.supersedeDecision("ws", "sc", "record", decision);
    await storyGovernanceService.listApprovals("ws", "sc");
    await storyGovernanceService.requestApproval("ws", "sc", "ver");
    await storyGovernanceService.approveVersion("ws", "sc", "ver", approval, "op-approve");
    await storyGovernanceService.rejectVersion("ws", "sc", "ver", input);
    await storyGovernanceService.linkTask("ws", "sc", "ver", "task");
    await storyGovernanceService.getVersionImpact("ws", "sc", "ver");
    await storyGovernanceService.getTaskImpact("ws", "task");
    await storyGovernanceService.resolveTaskImpact("ws", "task", "assessment", "op-2");

    expect(api.get).toHaveBeenCalledWith("/workspaces/ws/requirements");
    expect(api.post).toHaveBeenCalledWith("/workspaces/ws/requirements", input);
    expect(api.post).toHaveBeenCalledWith("/workspaces/ws/requirements/req/archive", {});
    expect(api.get).toHaveBeenCalledWith("/workspaces/ws/story-contracts/sc/criteria/ac/revisions/rev/verifications?storyVersionId=ver");
    expect(api.get).toHaveBeenCalledWith("/workspaces/ws/story-contracts/sc/decision-proposals");
    expect(api.post).toHaveBeenCalledWith(
      "/workspaces/ws/story-contracts/sc/drafts/draft/submit",
      {},
      { headers: { "Idempotency-Key": "op-1" } },
    );
    expect(api.post).toHaveBeenCalledWith(
      "/workspaces/ws/story-contracts/sc/versions/ver/approve",
      approval,
      { headers: { "Idempotency-Key": "op-approve" } },
    );
    expect(api.post).toHaveBeenCalledWith(
      "/workspaces/ws/tasks/task/story-impact/assessment/resolve",
      {},
      { headers: { "Idempotency-Key": "op-2" } },
    );
    expect(api.post).toHaveBeenCalledWith("/workspaces/ws/story-contracts/sc/versions/ver/approval-requests", {});
    expect(api.post).toHaveBeenCalledWith("/workspaces/ws/story-contracts/sc/versions/ver/reject", input);
    expect(api.post).toHaveBeenCalledWith("/workspaces/ws/story-contracts/sc/versions/ver/tasks/task/link", {});
    expect(api.post.mock.calls.filter(([, , config]) => config?.headers?.["Idempotency-Key"])).toHaveLength(3);
  });

  it("returns null only for a task-impact 404", async () => {
    api.get.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(storyGovernanceService.getTaskImpact("ws", "task")).resolves.toBeNull();

    api.get.mockRejectedValueOnce({ response: { status: 500 } });
    await expect(storyGovernanceService.getTaskImpact("ws", "task")).rejects.toMatchObject({ response: { status: 500 } });
  });
});
