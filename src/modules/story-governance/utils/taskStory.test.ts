import { describe, expect, it } from "vitest";

import {
  getApprovedContractOptions,
  getRequirementsStateLabel,
  getTaskStoryGateCode,
  restoreTaskPositions,
  selectContractPin,
  storyContractHref,
} from "./taskStory";

const contracts = [
  { _id: "active-approved", key: "ST-1", title: "Approved", status: "active", currentApprovedStoryVersionId: "v2" },
  { _id: "active-draft", key: "ST-2", title: "Draft only", status: "active" },
  { _id: "archived", key: "ST-3", title: "Archived", status: "archived", currentApprovedStoryVersionId: "v3" },
] as never[];

describe("Task Story utilities", () => {
  it("offers only active Contracts with a current approved immutable Version", () => {
    expect(getApprovedContractOptions(contracts)).toEqual([contracts[0]]);
    expect(selectContractPin("active-approved", contracts)).toEqual({
      storyContractId: "active-approved",
      storyVersionId: "v2",
    });
    expect(selectContractPin("", contracts)).toEqual({
      storyContractId: undefined,
      storyVersionId: undefined,
    });
  });

  it("maps states and builds the canonical Contract/version deep link", () => {
    expect(getRequirementsStateLabel("CURRENT")).toBe("Current");
    expect(getRequirementsStateLabel("REVIEW_REQUIRED")).toBe("Review required");
    expect(getRequirementsStateLabel("REBASE_REQUIRED")).toBe("Rebase required");
    expect(storyContractHref("WS", "contract", "version")).toBe(
      "/workspaces/WS/stories?contract=contract&section=versions&version=version",
    );
  });

  it("recognizes only exact Story move-gate error codes", () => {
    expect(getTaskStoryGateCode({ response: { data: { code: "TASK_REQUIREMENT_REVIEW_REQUIRED" } } })).toBe(
      "TASK_REQUIREMENT_REVIEW_REQUIRED",
    );
    expect(getTaskStoryGateCode({ response: { data: { code: "TASK_REQUIREMENT_REBASE_REQUIRED" } } })).toBe(
      "TASK_REQUIREMENT_REBASE_REQUIRED",
    );
    expect(getTaskStoryGateCode({ response: { data: { code: "OTHER" } } })).toBeNull();
  });

  it("restores the prior task positions without mutating either list", () => {
    const before = [
      { id: "one", columnId: "todo", rank: "a" },
      { id: "two", columnId: "done", rank: "b" },
    ] as never[];
    const optimistic = [
      { id: "one", columnId: "done", rank: "z", optimisticOrder: 1 },
      { id: "two", columnId: "done", rank: "b", optimisticOrder: 0 },
    ] as never[];

    const restored = restoreTaskPositions(optimistic, before);
    expect(restored).toEqual(before);
    expect(restored).not.toBe(before);
    expect(optimistic[0]).toMatchObject({ columnId: "done", rank: "z" });
  });
});
