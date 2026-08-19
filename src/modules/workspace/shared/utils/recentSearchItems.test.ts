import * as assert from "node:assert/strict";

import type { GlobalSearchItem } from "../services/globalSearch.service";
import { addRecentSearchItem, readRecentSearchItems } from "./recentSearchItems";

const values = new Map<string, string>();
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => {
    values.set(key, value);
  },
};

const item = (id: string, type: GlobalSearchItem["type"] = "document"): GlobalSearchItem => ({
  id,
  type,
  title: `Document ${id}`,
  url: `/documents/${id}`,
  createdAt: "2026-08-18T00:00:00.000Z",
  updatedAt: "2026-08-18T00:00:00.000Z",
});

assert.deepEqual(readRecentSearchItems("user-a", storage), []);

addRecentSearchItem("user-a", item("first"), storage);
addRecentSearchItem("user-a", item("second"), storage);
assert.deepEqual(
  readRecentSearchItems("user-a", storage).map((recentItem) => recentItem.id),
  ["second", "first"],
  "newly viewed documents must be displayed first",
);

addRecentSearchItem("user-a", item("first"), storage);
assert.deepEqual(
  readRecentSearchItems("user-a", storage).map((recentItem) => recentItem.id),
  ["first", "second"],
  "viewing a document again must move it to the front without duplicating it",
);

assert.deepEqual(
  readRecentSearchItems("user-b", storage),
  [],
  "recently viewed documents must be isolated per user",
);

const failingStorage = {
  getItem: storage.getItem,
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
};

assert.deepEqual(
  addRecentSearchItem("user-a", item("available-in-memory"), failingStorage).map(
    (recentItem) => recentItem.id,
  ),
  ["available-in-memory", "first", "second"],
  "a storage write failure must still return the next in-memory recent items",
);
