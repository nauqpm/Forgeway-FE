import * as assert from "node:assert/strict";
import { removeRestoredArchiveItem } from "./archiveListState";
import type { Issue } from "../types/issue.type";

const archivedItems = [
  { id: "task-1", title: "First archived task" },
  { id: "task-2", title: "Second archived task" },
  { id: "task-3", title: "Third archived task" },
] as Issue[];

{
  const result = removeRestoredArchiveItem({
    items: archivedItems,
    total: 3,
    restoredId: "task-2",
  });

  assert.deepEqual(
    result.items.map((item) => item.id),
    ["task-1", "task-3"],
    "restoring one archived item should keep the remaining rows visible",
  );
  assert.equal(result.total, 2, "archive total should decrease by one");
}

{
  const result = removeRestoredArchiveItem({
    items: archivedItems,
    total: 3,
    restoredId: "missing-task",
  });

  assert.deepEqual(
    result.items.map((item) => item.id),
    ["task-1", "task-2", "task-3"],
    "unknown restored ids should not clear the current archive page",
  );
  assert.equal(result.total, 3, "archive total should not change when no row was removed");
}
