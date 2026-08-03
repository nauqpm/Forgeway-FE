import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Story production components use the shared color tokens", () => {
  const componentDirectory = new URL("../src/modules/story-governance/components/", import.meta.url);
  const productionComponents = readdirSync(componentDirectory).filter((file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx"));

  for (const file of productionComponents) {
    assert.doesNotMatch(readFileSync(new URL(file, componentDirectory), "utf8"), /slate-/, `${file} still uses a Story-only slate token`);
  }
});

test("Stories uses a master-detail workspace canvas", () => {
  const tab = read("src/modules/story-governance/components/StoryGovernanceTab.tsx");
  const requirements = read("src/modules/story-governance/components/RequirementPanel.tsx");
  const contracts = read("src/modules/story-governance/components/StoryContractIndex.tsx");

  assert.match(tab, /flex min-h-0 min-w-0 flex-1/);
  assert.match(tab, /data-story-layout="master-detail"/);
  assert.doesNotMatch(tab, /grid-cols-\[minmax\(16rem,0\.85fr\)_minmax\(17rem,1fr\)_minmax\(20rem,1\.25fr\)\]/);
  assert.doesNotMatch(tab, /dark:bg-slate-950/);
  assert.match(requirements, /min-h-0 min-w-0 overflow-y-auto/);
  assert.match(contracts, /min-h-0 min-w-0 overflow-y-auto/);
  assert.match(tab, /data-story-mobile-panel="detail"/);
});

test("Stories keeps lightweight visuals and workspace controls", () => {
  const tab = read("src/modules/story-governance/components/StoryGovernanceTab.tsx");
  const source = [
    tab,
    read("src/modules/story-governance/components/RequirementPanel.tsx"),
    read("src/modules/story-governance/components/StoryContractIndex.tsx"),
    read("src/modules/story-governance/components/StoryContractDetail.tsx"),
    read("src/modules/story-governance/components/StoryVersionWorkspace.tsx"),
  ].join("\n");

  assert.doesNotMatch(source, /\bbg-gradient-/);
  assert.doesNotMatch(source, /\bshadow-(?:lg|xl|2xl)\b/);
  assert.match(tab, /data-story-mobile-panel="contracts"/);
  assert.match(tab, /data-story-mobile-panel="detail"/);
});

test("dark mode tokens outrank light defaults and style native controls", () => {
  const globals = read("src/styles/globals.css");

  assert.match(globals, /:root\.dark\s*\{/);
  assert.match(globals, /:root\.dark\s*\{[^}]*color-scheme:\s*dark/s);
  assert.match(globals, /:root\s*\{[^}]*color-scheme:\s*light/s);
});

test("Task Story mounts once through the shared detail seam", () => {
  const detail = read("src/modules/workspace/tasks/detail/TaskDetailMainContent.tsx");

  assert.match(detail, /import TaskStoryPanel from/);
  assert.equal(detail.match(/<TaskStoryPanel\b/g)?.length, 1);
});
