import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("document outline sidebar is restored and collapsed by default", () => {
  const tiptapEditor = read("src/modules/docs/editor/TiptapEditor.tsx");
  const editorPageLayout = read("src/modules/docs/editor/EditorPageLayout.tsx");
  const documentOutline = read("src/modules/docs/editor/DocumentOutline.tsx");

  assert.match(tiptapEditor, /import DocumentOutline from "\.\/DocumentOutline"/);
  assert.match(tiptapEditor, /sidebar=\{<DocumentOutline editor=\{activeEditor\} \/>\}/);
  assert.match(editorPageLayout, /useState\(false\)/);
  assert.match(editorPageLayout, /sidebarOpen \? "240px" : "0px"/);
  assert.match(documentOutline, /No headings found in the document\./);
  assert.match(documentOutline, /Add headings \(H1, H2, H3\) to display the outline\./);
});
