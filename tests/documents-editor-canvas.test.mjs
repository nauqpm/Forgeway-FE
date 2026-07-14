import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("documents editor uses the shared page canvas layout", () => {
  const onlineEditor = read("src/modules/docs/components/OnlineDocumentEditorModal.tsx");
  const createPage = read("app/(client)/documents/create/page.tsx");

  assert.match(onlineEditor, /import PageCanvas from "\.\.\/editor\/PageCanvas"/);
  assert.match(createPage, /import PageCanvas from "@\/modules\/docs\/editor\/PageCanvas"/);

  for (const source of [onlineEditor, createPage]) {
    assert.doesNotMatch(source, />\s*Document Title\s*</i);
    assert.doesNotMatch(source, />\s*Document Content\s*</i);
  }
});
