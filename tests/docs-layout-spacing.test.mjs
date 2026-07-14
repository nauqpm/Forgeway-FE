import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("docs tab uses compact height-controlled layout", () => {
  const workspacePage = read("src/modules/workspace/shared/components/WorkspacePage.tsx");
  const workspaceContent = read("src/modules/workspace/shared/components/WorkspaceContent.tsx");
  const docsLayout = read("src/modules/docs/components/DocsLayout.tsx");
  const docsDashboard = read("src/modules/docs/components/DocsDashboard.tsx");
  const dashboardHeader = read("src/modules/docs/components/DashboardHeader.tsx");
  const dashboardGroup = read("src/modules/docs/components/DashboardGroup.tsx");
  const dashboardRow = read("src/modules/docs/components/DashboardRow.tsx");
  const tiptapEditor = read("src/modules/docs/editor/TiptapEditor.tsx");
  const editorPageLayout = read("src/modules/docs/editor/EditorPageLayout.tsx");
  const importedViewer = read("src/modules/docs/components/ImportedDocumentViewer.tsx");

  assert.match(workspacePage, /isDocsTab \? "flex min-h-0 flex-1 overflow-hidden/);
  assert.match(workspaceContent, /activeTab === "pages"\s+\? "flex min-h-0 flex-1/);
  assert.match(docsLayout, /flex h-full min-h-0 flex-1/);
  assert.match(docsDashboard, /flex-1 min-h-0 overflow-y-auto px-4 py-3/);
  assert.match(dashboardHeader, /px-4 py-3/);
  assert.match(dashboardGroup, /className="flex h-full min-h-0 flex-col"/);
  assert.match(dashboardGroup, /px-4 py-2\.5/);
  assert.match(dashboardRow, /px-4 py-3/);
  assert.match(tiptapEditor, /flex flex-col h-full min-h-0/);
  assert.match(editorPageLayout, /flex-1 flex min-h-0 overflow-hidden/);
  assert.match(importedViewer, /h-full min-h-0 flex flex-col/);
});
