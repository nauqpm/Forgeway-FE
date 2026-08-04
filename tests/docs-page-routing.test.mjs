import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("docs page open and edit actions use detail routes", () => {
  const routeUtils = read("src/modules/docs/utils/pageRoutes.ts");
  const dashboard = read("src/modules/docs/components/DocsDashboard.tsx");
  const sidebar = read("src/modules/docs/components/DocsSidebar.tsx");
  const treeItem = read("src/modules/docs/components/DocsTreeItem.tsx");
  const recentDocs = read("src/modules/docs/components/RecentDocs.tsx");
  const editor = read("src/modules/docs/editor/TiptapEditor.tsx");
  const pageEdit = read("app/(client)/workspaces/[key]/pages/[slug]/edit/page.tsx");

  assert.match(routeUtils, /buildWorkspacePageHref/);
  assert.match(routeUtils, /const slugOrId = buildWorkspacePageSlugParam\(doc\)/);
  assert.match(dashboard, /window\.history\.pushState\(null, "", buildWorkspacePageHref\({ workspaceKey, doc: target }\)\)/);
  assert.match(sidebar, /router\.push\(buildWorkspacePageHref\({ workspaceKey, doc: target }\)\)/);
  assert.match(sidebar, /router\.push\(buildWorkspacePagesHref\(workspaceKey\)\)/);
  assert.match(treeItem, /router\.push\(buildWorkspacePageHref\({ workspaceKey, doc }\)\)/);
  assert.match(recentDocs, /router\.push\(buildWorkspacePageHref\({ workspaceKey, doc }\)\)/);
  assert.match(editor, /window\.history\.replaceState\(null, "", buildWorkspacePageHref\({ workspaceKey, doc: document, mode: "view" }\)\)/);
  assert.match(editor, /window\.history\.replaceState\(null, "", buildWorkspacePageHref\({ workspaceKey, doc: savedDoc, mode: "edit" }\)\)/);
  assert.match(pageEdit, /useWorkspacePage\(workspaceKey, \["pages"\]\)/);
  assert.match(editor, /if \(initialMode !== "edit"\) \{\s+didApplyInitialMode\.current = false;/);
  assert.doesNotMatch(`${dashboard}\n${sidebar}\n${treeItem}\n${recentDocs}\n${editor}`, /\?edit=true/);
});
