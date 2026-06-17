import * as assert from "node:assert/strict";
import { toCalendarDateKey } from "./calendarDateKey";

assert.equal(
  toCalendarDateKey(new Date(2026, 5, 3)),
  "2026-06-03",
  "calendar date keys must use the clicked local day instead of UTC ISO conversion",
);
