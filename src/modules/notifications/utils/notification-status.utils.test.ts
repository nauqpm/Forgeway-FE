import * as assert from "node:assert/strict";

import {
  formatTaskStatus,
  getTaskStatusTransition,
} from "./notification-status.utils";

assert.equal(formatTaskStatus("inprogress"), "In Progress");
assert.equal(formatTaskStatus("in_review"), "In Review");
assert.deepEqual(
  getTaskStatusTransition({ fromStatus: "todo", toStatus: "inprogress" }),
  { from: "To Do", to: "In Progress" },
);
assert.equal(getTaskStatusTransition({ fromStatus: "todo" }), undefined);
