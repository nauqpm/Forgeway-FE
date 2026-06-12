import * as assert from "node:assert/strict";
import { handleEventReceive } from "./useCalendarHandlers";
import type { Issue } from "../types/issue.type";
import type { Sprint } from "../types/sprint.type";

function createSprint(overrides: Partial<Sprint> = {}): Sprint {
  return {
    _id: "sprint-1",
    id: "sprint-1",
    workspaceId: "workspace-1",
    name: "Sprint 1",
    status: "active",
    startDate: "2026-06-10",
    endDate: "2026-06-12",
    ...overrides,
  };
}

function createIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: "task-1",
    _id: "task-1",
    title: "Schedule me",
    status: "todo",
    priority: "medium",
    type: "task",
    sprintId: "sprint-1",
    ...overrides,
  } as Issue;
}

{
  const calls: string[] = [];
  const event = {
    id: "task-1",
    start: new Date(2026, 5, 9),
    extendedProps: { rawData: createIssue() as Issue | undefined },
    remove: () => {
      calls.push("remove");
      event.extendedProps.rawData = undefined;
    },
  };

  handleEventReceive({
    arg: {
      event,
    },
    issues: [],
    sprints: [createSprint()],
    onUpdateIssueDate: () => calls.push("update"),
    onBlocked: () => calls.push("blocked"),
  });

  assert.deepEqual(
    calls,
    ["remove", "blocked"],
    "invalid external drops should only remove the phantom calendar event and keep the task unscheduled",
  );
}

{
  const calls: string[] = [];

  handleEventReceive({
    arg: {
      event: {
        id: "task-1",
        start: new Date(2026, 5, 10),
        extendedProps: { rawData: createIssue() },
        remove: () => calls.push("remove"),
      },
    },
    issues: [],
    sprints: [createSprint()],
    onUpdateIssueDate: () => calls.push("update"),
    onBlocked: () => calls.push("blocked"),
  });

  assert.deepEqual(
    calls,
    ["remove", "update"],
    "valid external drops should remove the phantom event before scheduling the real task",
  );
}
