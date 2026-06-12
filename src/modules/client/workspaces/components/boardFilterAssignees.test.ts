import * as assert from "node:assert/strict";
import {
  filterBoardAssignees,
  getBoardFilterAssigneeLabel,
} from "./boardFilterAssignees";

const assignees = [
  {
    id: "685027ce6213c32f55dbe901",
    name: "Quan Pham",
    email: "quan@example.com",
  },
  {
    id: "685027ce6213c32f55dbe902",
    email: "linh@example.com",
  },
];

assert.equal(
  getBoardFilterAssigneeLabel(assignees[0]),
  "Quan Pham",
  "assignee filter should prefer the user display name over the raw id",
);

assert.equal(
  getBoardFilterAssigneeLabel(assignees[1]),
  "linh@example.com",
  "assignee filter should fall back to email before the raw id",
);

assert.equal(
  getBoardFilterAssigneeLabel({ id: "U" }),
  "Unassigned",
  "assignee filter should label unassigned tasks clearly",
);

assert.deepEqual(
  filterBoardAssignees(assignees, "quan").map((user) => user.id),
  ["685027ce6213c32f55dbe901"],
  "assignee search should match display names, not only ids",
);
