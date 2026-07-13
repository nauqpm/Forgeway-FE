import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("documents library view and edit use document id routes", () => {
  const routes = read("src/modules/docs/utils/documentRoutes.ts");
  const libraryPage = read("src/modules/docs/components/DocumentsLibraryContent.tsx");
  const viewPage = read("app/(client)/documents/[documentId]/page.tsx");
  const editPage = read("app/(client)/documents/[documentId]/edit/page.tsx");
  const modals = read("src/modules/docs/components/DocumentModals.tsx");
  const importedViewer = read("src/modules/docs/components/ImportedDocumentViewer.tsx");

  assert.match(routes, /buildDocumentHref/);
  assert.match(routes, /\$\{DOCUMENTS_LIBRARY_HREF\}\/\$\{encodeURIComponent\(documentId\)\}/);
  assert.match(libraryPage, /router\.push\(buildDocumentHref\(doc\._id\)\)/);
  assert.match(libraryPage, /router\.push\(buildDocumentHref\(doc\._id, "edit"\)\)/);
  assert.match(libraryPage, /router\.push\(DOCUMENTS_LIBRARY_HREF\)/);
  assert.match(viewPage, /documentMode="view"/);
  assert.match(editPage, /documentMode="edit"/);
  assert.match(modals, /onEditViewingDoc/);
  assert.match(importedViewer, /onEdit\?: \(\) => void/);
  assert.doesNotMatch(libraryPage, /router\.push\("\/documents"\)/);
});
