import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const components = [
  "StoryDecisionsPanel.tsx",
  "StoryCriteriaPanel.tsx",
  "TaskStoryPanel.tsx",
];

describe("Story dark-mode secondary text", () => {
  it.each(components)("%s pairs normal secondary text with the established dark token", (file) => {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    const affectedClasses = source.match(/className="[^"]*text-\[#787774\][^"]*"/g) ?? [];
    expect(affectedClasses.length).toBeGreaterThan(0);
    expect(affectedClasses.every((className) => className.includes("dark:text-[#9B9A97]"))).toBe(true);
  });
});
