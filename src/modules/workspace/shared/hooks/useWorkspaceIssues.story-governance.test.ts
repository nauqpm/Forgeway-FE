import { describe, expect, it } from "vitest";

import { getReorderFailure } from "./useWorkspaceIssues";

const before = [
  { id: "one", columnId: "todo", rank: "a" },
  { id: "two", columnId: "done", rank: "b" },
] as never[];
const optimistic = [
  { id: "one", columnId: "done", rank: "z", optimisticOrder: 1, optimisticScope: "board:done:none" },
  { id: "two", columnId: "done", rank: "b", optimisticOrder: 0, optimisticScope: "board:done:none" },
] as never[];

describe("shared reorder Story gate rollback", () => {
  it("restores the prior position and selects the Story panel for exact gate codes", () => {
    expect(getReorderFailure(
      optimistic,
      before,
      { response: { data: { code: "TASK_REQUIREMENT_REBASE_REQUIRED" } } },
    )).toEqual({
      issues: before,
      gateCode: "TASK_REQUIREMENT_REBASE_REQUIRED",
    });
  });

  it("keeps existing unrelated-error behavior", () => {
    expect(getReorderFailure(optimistic, before, { response: { data: { code: "OTHER" } } })).toEqual({
      issues: [
        { id: "one", columnId: "done", rank: "z" },
        { id: "two", columnId: "done", rank: "b" },
      ],
      gateCode: null,
    });
  });
});
