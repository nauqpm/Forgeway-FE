import * as assert from "node:assert/strict";
import { buildAssigneeFilters } from "./useAssignees";
import type { Issue } from "../types/issue.type";
import type { Workspace } from "../types/workspace.type";

const issue = (overrides: Partial<Issue>): Issue => ({
  id: "task-1",
  key: "FE-1",
  title: "Task",
  columnId: "todo",
  status: "To Do",
  priority: "Medium",
  type: "Task",
  assignee: "user-1",
  color: "bg-[#2563EB]",
  sprintId: null,
  storyPoints: 0,
  ...overrides,
});

const workspace: Workspace = {
  _id: "workspace-1",
  name: "Frontend",
  key: "FE",
  access: "private",
  members: [
    {
      userId: {
        _id: "user-1",
        fullName: "Quan Pham",
        email: "quan@example.com",
        avatar: "avatar.png",
      },
      role: "member",
    },
  ],
};

assert.deepEqual(
  buildAssigneeFilters([issue({ assignee: "user-1" })], workspace),
  [
    {
      id: "user-1",
      color: "bg-[#2563EB]",
      name: "Quan Pham",
      email: "quan@example.com",
      avatar: "avatar.png",
      initials: "QP",
    },
  ],
  "assignee filters should enrich raw user ids from workspace members",
);

assert.equal(
  buildAssigneeFilters([
    issue({
      assignee: "user-2",
      assigneeDisplayName: "Linh Tran",
    }),
  ])[0]?.name,
  "Linh Tran",
  "task assigneeDisplayName should be used when the member list is unavailable",
);
