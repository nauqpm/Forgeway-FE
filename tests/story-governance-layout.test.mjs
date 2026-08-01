import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Stories uses a constrained canvas with independently scrolling columns", () => {
  const tab = read("src/modules/story-governance/components/StoryGovernanceTab.tsx");
  const requirements = read("src/modules/story-governance/components/RequirementPanel.tsx");
  const contracts = read("src/modules/story-governance/components/StoryContractIndex.tsx");

  assert.match(tab, /flex min-h-0 min-w-0 flex-1/);
  assert.match(requirements, /min-h-0 min-w-0 overflow-y-auto/);
  assert.match(contracts, /min-h-0 min-w-0 overflow-y-auto/);
  assert.match(tab, /data-story-mobile-panel="detail"[^>]*className="min-h-0 min-w-0 overflow-y-auto/);
});

test("Stories keeps lightweight visuals and exposes named mobile panel paths", () => {
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
  assert.match(tab, /aria-label="Story workspace panels"/);
  assert.match(tab, /data-story-mobile-panel="requirements"/);
  assert.match(tab, /data-story-mobile-panel="contracts"/);
  assert.match(tab, /data-story-mobile-panel="detail"/);
});

test("Task Story mounts once through the shared detail seam", () => {
  const detail = read("src/modules/workspace/tasks/detail/TaskDetailMainContent.tsx");

  assert.match(detail, /import TaskStoryPanel from/);
  assert.equal(detail.match(/<TaskStoryPanel\b/g)?.length, 1);
});
