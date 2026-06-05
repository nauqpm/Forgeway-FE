import * as assert from "node:assert/strict";
import {
  calculateDragResult,
  calculateResizeResult,
  getTimelineBarGeometry,
  type TimelineDragSession,
} from "./timelineDrag";
import type { TimelineRow } from "./timelineRows";

const taskRow: TimelineRow = {
  id: "task-1",
  kind: "task",
  originalId: "task-1",
  title: "Build timeline",
  startDate: "2026-06-10",
  endDate: "2026-06-13",
  barColor: "#6366f1",
  canInteract: true,
  indent: 0,
  meta: null,
};

const sprintTaskRow: TimelineRow = {
  ...taskRow,
  sprintName: "Sprint 1",
  sprintStartDate: "2026-06-09",
  sprintEndDate: "2026-06-14",
};

const session: TimelineDragSession = {
  row: taskRow,
  startX: 400,
  minMovePixels: 10,
};

assert.deepEqual(
  calculateDragResult(session, 405, 40),
  { type: "noop" },
  "mouse tremor during long press must not update task dates",
);

assert.deepEqual(
  calculateDragResult(session, 440, 40),
  {
    type: "move",
    taskId: "task-1",
    startDate: "2026-06-11",
    endDate: "2026-06-14",
  },
  "dragging one day should move start/end by one day",
);

assert.deepEqual(
  calculateDragResult(
    {
      row: sprintTaskRow,
      startX: 400,
      minMovePixels: 10,
    },
    480,
    40,
  ),
  {
    type: "blocked",
    message: 'Sprint "Sprint 1" ends on 2026-06-14. This task cannot be moved beyond that date.',
  },
  "dragging a sprint task beyond sprint end should be blocked",
);

assert.deepEqual(
  calculateDragResult(session, 320, 40),
  {
    type: "move",
    taskId: "task-1",
    startDate: "2026-06-08",
    endDate: "2026-06-11",
  },
  "dragging left two days should preserve task duration",
);

assert.deepEqual(
  calculateResizeResult({
    row: taskRow,
    timelineStart: "2026-06-01",
    x: 360,
    width: 200,
    pixelsPerDay: 40,
  }),
  {
    type: "resize",
    taskId: "task-1",
    startDate: "2026-06-10",
    endDate: "2026-06-15",
  },
  "right resize should extend end date",
);

assert.deepEqual(
  calculateResizeResult({
    row: sprintTaskRow,
    timelineStart: "2026-06-01",
    x: 360,
    width: 240,
    pixelsPerDay: 40,
  }),
  {
    type: "blocked",
    message: 'Sprint "Sprint 1" ends on 2026-06-14. This task cannot be moved beyond that date.',
  },
  "resizing a sprint task beyond sprint end should be blocked",
);

assert.deepEqual(
  calculateResizeResult({
    row: taskRow,
    timelineStart: "2026-06-01",
    x: 320,
    width: 160,
    pixelsPerDay: 40,
  }),
  {
    type: "resize",
    taskId: "task-1",
    startDate: "2026-06-09",
    endDate: "2026-06-13",
  },
  "left resize should change start and keep computed end",
);

assert.deepEqual(
  calculateResizeResult({
    row: taskRow,
    timelineStart: "2026-06-01",
    x: 360,
    width: 4,
    pixelsPerDay: 40,
  }),
  {
    type: "resize",
    taskId: "task-1",
    startDate: "2026-06-10",
    endDate: "2026-06-11",
  },
  "resize should clamp to at least one day",
);

assert.deepEqual(
  getTimelineBarGeometry({
    startDate: "2026-06-10",
    endDate: "2026-06-13",
    timelineStart: "2026-06-01",
    pixelsPerDay: 40,
  }),
  { left: 360, width: 120 },
  "geometry should map date span to stable pixel bounds",
);
