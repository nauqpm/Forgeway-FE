import * as assert from "node:assert/strict";
import { getHorizontalWheelDelta } from "./timelineScroll";

assert.equal(getHorizontalWheelDelta({ shiftKey: true, deltaX: 0, deltaY: 80 }), 80);
assert.equal(getHorizontalWheelDelta({ shiftKey: true, deltaX: 24, deltaY: 80 }), 24);
assert.equal(getHorizontalWheelDelta({ shiftKey: false, deltaX: 24, deltaY: 80 }), 24);
assert.equal(getHorizontalWheelDelta({ shiftKey: false, deltaX: 0, deltaY: 80 }), 0);
