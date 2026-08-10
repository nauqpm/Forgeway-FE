import { describe, expect, it } from "vitest";

import {
  formatTaskStatus,
  getTaskStatusTransition,
} from "./notification-status.utils";

describe("notification status formatting", () => {
  it("formats known and fallback task statuses", () => {
    expect(formatTaskStatus("inprogress")).toBe("In Progress");
    expect(formatTaskStatus("in_review")).toBe("In Review");
  });

  it("formats complete transitions and ignores incomplete metadata", () => {
    expect(getTaskStatusTransition({ fromStatus: "todo", toStatus: "inprogress" })).toEqual({
      from: "To Do",
      to: "In Progress",
    });
    expect(getTaskStatusTransition({ fromStatus: "todo" })).toBeUndefined();
  });
});
