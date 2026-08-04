import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("DocumentGrid is an explicit client component with a valid import", () => {
  const source = readFileSync(new URL("./src/modules/docs/components/DocumentGrid.tsx", import.meta.url), "utf8");

  assert.match(source, /^"use client";\r?\n\r?\nimport \{/);
});
