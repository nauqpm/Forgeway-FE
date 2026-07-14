import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("document library requests a fresh list after reload", () => {
  const service = readFileSync(
    new URL("../src/modules/docs/services/documentService.ts", import.meta.url),
    "utf8",
  );

  assert.match(service, /api\.get\(apiRoutes\.DOCUMENTS\.BASE, \{ params: \{ _: Date\.now\(\) \} \}\)/);
});

test("creating a document updates the current library cache", () => {
  const createPage = readFileSync(
    new URL("../app/(client)/documents/create/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(createPage, /useQueryClient/);
  assert.match(createPage, /await queryClient\.cancelQueries\(\{ queryKey: DOCUMENTS_QUERY_KEY \}\)/);
  assert.match(createPage, /queryClient\.setQueryData<DocumentItem\[\]>\(DOCUMENTS_QUERY_KEY/);
  assert.match(createPage, /await queryClient\.invalidateQueries\(\{ queryKey: DOCUMENTS_QUERY_KEY, refetchType: "all" \}\)/);
});
