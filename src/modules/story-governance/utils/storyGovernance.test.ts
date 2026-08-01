import { describe, expect, it } from "vitest";

import {
  createOperationKey,
  clearOperationKey,
  deriveVersionState,
  getOperationKey,
  groupChanges,
  isSafeEvidenceHref,
  validateDraftForm,
  validateRequirementLinks,
} from "./storyGovernance";
import type { StoryContent } from "../types/storyGovernance.type";

describe("story governance utilities", () => {
  it("creates UUID operation keys", () => {
    expect(createOperationKey()).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("reuses an operation key until the operation completes or is cancelled", () => {
    const operation = "submit:ws:sc:draft";
    const first = getOperationKey(operation);
    expect(getOperationKey(operation)).toBe(first);
    expect(getOperationKey("submit:ws:sc:other-draft")).not.toBe(first);
    clearOperationKey(operation);
    expect(getOperationKey(operation)).not.toBe(first);
  });

  it("derives the effective version state", () => {
    expect(deriveVersionState({ _id: "approved-before" }, { currentApprovedStoryVersionId: "new" }, {
      requests: [],
      records: [{ storyVersionId: "approved-before", decision: "APPROVE", createdAt: "2026-07-01T00:00:00.000Z" } as never],
    })).toBe("SUPERSEDED");
    expect(deriveVersionState({ _id: "never-approved" }, { currentApprovedStoryVersionId: "new" }, { requests: [], records: [] })).toBe("SNAPSHOT");
    expect(deriveVersionState({ _id: "approved" }, { currentApprovedStoryVersionId: "approved" }, { requests: [], records: [] })).toBe("APPROVED");
    expect(deriveVersionState({ _id: "rejected" }, { currentApprovedStoryVersionId: null }, {
      requests: [],
      records: [{ storyVersionId: "rejected", decision: "REJECT", createdAt: "2026-07-01T00:00:00.000Z" } as never],
    })).toBe("REJECTED");
    expect(deriveVersionState({ _id: "pending" }, { currentApprovedStoryVersionId: null }, {
      requests: [{ storyVersionId: "pending", state: "PENDING" } as never],
      records: [],
    })).toBe("PENDING_APPROVAL");
    expect(deriveVersionState({ _id: "retried" }, { currentApprovedStoryVersionId: null }, {
      requests: [
        { _id: "old-request", storyVersionId: "retried", state: "REJECTED", createdAt: "2026-07-01T00:00:00.000Z" },
        { _id: "new-request", storyVersionId: "retried", state: "PENDING", createdAt: "2026-07-02T00:00:00.000Z" },
      ] as never,
      records: [{
        approvalRequestId: "old-request",
        storyVersionId: "retried",
        decision: "REJECT",
        createdAt: "2026-07-01T00:01:00.000Z",
      }] as never,
    })).toBe("PENDING_APPROVAL");
    expect(deriveVersionState({ _id: "snapshot" }, { currentApprovedStoryVersionId: null }, { requests: [], records: [] })).toBe("SNAPSHOT");
  });

  it("groups diffs by severity", () => {
    expect(groupChanges({
      scopeChanges: [{ changeType: "MODIFIED", entityId: "scope:one", impactLevel: "BLOCKING" }, { changeType: "MODIFIED", entityId: "scope:two", impactLevel: "BLOCKING" }],
      businessRuleChanges: [],
      permissionChanges: [],
      requirementChanges: [],
      acceptanceCriterionChanges: [],
      decisionChanges: [],
      dependencyChanges: [],
    }).BLOCKING).toHaveLength(2);
  });

  it("validates exactly one primary requirement", () => {
    const links = [{ requirementId: "req", role: "PRIMARY" as const }];
    expect(validateRequirementLinks(links)).toEqual([]);
    expect(validateRequirementLinks([{ requirementId: "req", role: "SUPPORTING" as const }])).toContain(
      "Keep exactly one primary requirement.",
    );
  });

  it("rejects duplicate Requirement relationship pairs while retaining a single primary", () => {
    expect(validateRequirementLinks([
      { requirementId: "req-primary", role: "PRIMARY" },
      { requirementId: "req-supporting", role: "SUPPORTING" },
      { requirementId: "req-supporting", role: "SUPPORTING" },
    ])).toContain("Each Requirement relationship may be selected only once.");
  });

  it("matches the backend link contract by rejecting a Requirement reused under another role", () => {
    expect(validateRequirementLinks([
      { requirementId: "req", role: "PRIMARY" },
      { requirementId: "req", role: "CONSTRAINT" },
    ])).toContain("Each Requirement may be linked only once.");
  });

  it("validates structured content, decision references, criterion bounds, and blank rows", () => {
    const content: StoryContent = {
      problem: "Problem",
      expectedOutcome: "Outcome",
      actors: ["Admin"],
      scope: [{ id: "scope", text: " " }],
      outOfScope: [],
      businessRules: [],
      permissionRequirements: [],
      constraints: [],
      dependencies: [],
      risks: [],
    };
    const errors = validateDraftForm({
      content,
      requirementLinks: [{ requirementId: "req", role: "PRIMARY" }],
      criterionInputs: [{
        key: "A".repeat(101),
        priority: "MUST",
        statement: "Statement",
        given: "",
        when: "",
        then: "",
        verificationMethod: "QA",
      }],
      decisionProposalIds: ["not-a-mongo-id"],
    }, new Set(["req"]), new Set());
    expect(errors).toEqual(expect.arrayContaining([
      "Remove or complete blank content rows.",
      "Complete every acceptance criterion within its field limits.",
      "Decision proposal IDs must be valid and unique.",
    ]));
  });

  it("accepts safe evidence URLs only", () => {
    expect(isSafeEvidenceHref("https://github.com/org/repo/pull/4")).toBe(true);
    expect(isSafeEvidenceHref("javascript:alert(1)")).toBe(false);
  });
});
