import * as assert from "node:assert/strict";
import { getWeeklyBoundaryOffsets } from "./timelineDateMath";

assert.deepEqual(
  getWeeklyBoundaryOffsets({
    timelineStart: "2026-05-29",
    totalDays: 18,
    pixelsPerDay: 40,
  }),
  [
    { dateKey: "2026-06-01", left: 120 },
    { dateKey: "2026-06-08", left: 400 },
    { dateKey: "2026-06-15", left: 680 },
  ],
  "weekly grid should draw only week-start boundaries aligned to the timeline date scale",
);

assert.equal(
  getWeeklyBoundaryOffsets({
    timelineStart: "2026-06-01",
    totalDays: 7,
    pixelsPerDay: 40,
  }).length,
  1,
  "a single week should not produce one boundary per day",
);
