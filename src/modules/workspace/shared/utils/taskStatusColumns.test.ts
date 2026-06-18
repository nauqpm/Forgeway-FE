import * as assert from "node:assert/strict";
import { buildTaskStatusSelection, type TaskStatusColumn } from "./taskStatusColumns";

const columns: TaskStatusColumn[] = [
  { id: "todo-id", name: "To Do", order: 0, mappedStatuses: ["To Do"] },
  { id: "progress-id", name: "In Progress", order: 1, mappedStatuses: ["In Progress"] },
  { id: "done-id", name: "Done", order: 2, mappedStatuses: ["Done"], isDone: true },
];

{
  const selection = buildTaskStatusSelection(columns[1]);

  assert.deepEqual(
    selection,
    { columnId: "progress-id", status: "In Progress" },
    "clicking + on a column should seed the create form with that column status",
  );
}

{
  const seeded = buildTaskStatusSelection(columns[1]);
  const manuallyChanged = buildTaskStatusSelection(columns[2], seeded);

  assert.deepEqual(
    manuallyChanged,
    { columnId: "done-id", status: "Done" },
    "manual StatusPicker changes must override the column that opened the create form",
  );
}