import * as assert from "node:assert/strict";
import { toTaskDateKey } from "./taskDateKey";

assert.equal(toTaskDateKey("2026-06-03"), "2026-06-03");
assert.equal(
  toTaskDateKey("2026-06-02T17:00:00.000Z"),
  "2026-06-03",
  "UTC timestamps that represent local GMT+7 midnight must render on the local calendar day",
);
