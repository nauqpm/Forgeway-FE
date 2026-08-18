import * as assert from "node:assert/strict";

import {
  ALL_GLOBAL_SEARCH_TYPES,
  DEFAULT_DOCUMENT_SEARCH_TYPES,
} from "./globalSearchTypes";

assert.ok(
  ALL_GLOBAL_SEARCH_TYPES.includes("document"),
  "global search must expose document as a distinct result type",
);

assert.deepEqual(
  DEFAULT_DOCUMENT_SEARCH_TYPES,
  ["page", "document"],
  "the Docs tab must not include comments unless the user selects that filter",
);
