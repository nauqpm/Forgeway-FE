import * as assert from "node:assert/strict";
import { buildTimelineRows } from "./timelineRows";
import type { Issue } from "@/modules/workspace/shared/types/issue.type";
import type { Sprint } from "@/modules/workspace/shared/types/sprint.type";

const sprint: Sprint = {
  _id: "sprint-1",
  id: "sprint-1",
  workspaceId: "workspace-1",
  name: "SCRUM Sprint 4",
  status: "active",
  startDate: "2026-06-02",
  endDate: "2026-06-16",
};

function issue(overrides: Partial<Issue>): Issue {
  return {
    id: "task-1",
    key: "FE-1",
    title: "Scheduled task",
    columnId: "todo",
    status: "To Do",
    priority: "Medium",
    type: "Task",
    assignee: "U",
    color: "bg-[#2563EB]",
    sprintId: "sprint-1",
    storyPoints: 0,
    startDate: "2026-06-03",
    dueDate: "2026-06-04",
    ...overrides,
  };
}

const rows = buildTimelineRows({
  issues: [
    issue({ id: "task-1", title: "Scheduled sprint task" }),
    issue({
      id: "task-2",
      title: "Scheduled task using dueDate",
      dueDate: "2026-06-06",
    }),
    issue({ id: "task-3", title: "Backlog task", sprintId: null }),
    issue({ id: "task-4", title: "Unscheduled sprint task", startDate: undefined, dueDate: undefined }),
  ],
  sprints: [sprint],
  collapsed: new Set(),
  today: "2026-06-03",
});

assert.deepEqual(
  rows.map((row) => row.title),
  ["Scheduled sprint task", "Scheduled task using dueDate"],
  "timeline rows should only include scheduled tasks assigned to a sprint",
);

assert.equal(rows[0]?.sprintName, "SCRUM Sprint 4");
assert.equal(rows[0]?.sprintStartDate, "2026-06-02");
assert.equal(rows[0]?.sprintEndDate, "2026-06-16");
assert.equal(rows[1]?.endDate, "2026-06-06");

const kanbanRows = buildTimelineRows({
  issues: [
    issue({
      id: "kanban-1",
      title: "Kanban scheduled task",
      sprintId: null,
      startDate: "2026-06-10",
      dueDate: "2026-06-12",
    }),
    issue({
      id: "kanban-2",
      title: "Kanban backlog task",
      sprintId: null,
      startDate: undefined,
      dueDate: undefined,
    }),
  ],
  sprints: [],
  collapsed: new Set(),
  today: "2026-06-03",
});

assert.deepEqual(
  kanbanRows.map((row) => row.title),
  ["Kanban scheduled task"],
  "kanban timelines should show scheduled tasks even when the workspace has no sprints",
);
