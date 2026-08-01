import { describe, expect, it } from "vitest";

import { toCreatePayload, toIssue, toTaskDetail, toUpdatePayload } from "./taskNormalizer";

describe("Task Story Governance compatibility", () => {
  it("preserves optional Story pins and requirements state without requiring them", () => {
    const pinned = toIssue({
      id: "task-1",
      key: "PROJ-1",
      title: "Pinned task",
      storyContractId: "contract-1",
      storyVersionId: "version-2",
      requirementsState: "REVIEW_REQUIRED",
    });

    expect(pinned).toMatchObject({
      storyContractId: "contract-1",
      storyVersionId: "version-2",
      requirementsState: "REVIEW_REQUIRED",
    });

    expect(() =>
      toIssue({
        id: "task-2",
        key: "PROJ-2",
        title: "Unpinned task",
      }),
    ).not.toThrow();
    expect(toIssue({ id: "task-3", key: "PROJ-3", title: "Default state" }).requirementsState).toBe("CURRENT");
    expect(toTaskDetail({ id: "task-4", key: "PROJ-4", title: "Detail state" }).requirementsState).toBe("CURRENT");
  });

  it("sends paired Story pins in create and update payloads", () => {
    const pins = { storyContractId: "contract-1", storyVersionId: "version-2" };

    expect(toCreatePayload({
      title: "Pinned",
      type: "Task",
      priority: "Medium",
      status: "To Do",
      sprintId: null,
      ...pins,
    })).toMatchObject(pins);
    expect(toUpdatePayload(pins)).toMatchObject(pins);
    expect(toUpdatePayload({ storyContractId: null, storyVersionId: null })).toMatchObject({
      storyContractId: null,
      storyVersionId: null,
    });
  });

  it("rejects one-sided Story pins before a request can be sent", () => {
    expect(() => toCreatePayload({
      title: "Invalid",
      type: "Task",
      priority: "Medium",
      status: "To Do",
      sprintId: null,
      storyContractId: "contract-1",
    })).toThrow("Story Contract and Version must be selected together");
    expect(() => toUpdatePayload({ storyVersionId: "version-2" })).toThrow(
      "Story Contract and Version must be selected together",
    );
  });
});
