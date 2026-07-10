import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("document actions do not open their parent row", () => {
  const grid = read("src/modules/docs/components/DocumentGrid.tsx");
  const listStart = grid.indexOf('if (viewMode === "list")');
  const list = grid.slice(listStart, grid.indexOf("\n  return (", listStart));
  for (const action of ["onView(doc)", "onEdit(doc)", "onRename(doc)", "onDelete(doc)"]) {
    assert.match(list, new RegExp(`e\\.stopPropagation\\(\\);\\s+${action.replace(/[()]/g, "\\$&")}`));
  }
});

test("deleting a page removes its detail caches", () => {
  const docs = read("src/modules/docs/hooks/useWorkspaceDocs.ts");
  assert.match(docs, /queryClient\.removeQueries\(\{ queryKey: queryKeys\.docs\.byId\(workspaceId, document\.id\) \}\)/);
  assert.match(docs, /queryClient\.removeQueries\(\{ queryKey: queryKeys\.docs\.bySlug\(workspaceId, document\.slug\) \}\)/);
});
