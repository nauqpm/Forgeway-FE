import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  oxc: false,
  // Vite accepts this transform setting at runtime; its bundled TS type omits it.
  esbuild: { jsx: "automatic" } as never,
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "jsdom",
    exclude: [
      ...configDefaults.exclude,
      ".agents/**",
      ".tmp/**",
      "e2e/**",
      "tests/**",
      "src/modules/notifications/utils/*.test.ts",
      "src/modules/workspace/timeline/*.test.ts",
      "src/modules/workspace/shared/hooks/{useAssignees,useCalendarHandlers}.test.ts",
      "src/modules/workspace/shared/utils/{archiveListState,calendarDateKey,taskDateKey,taskStatusColumns,workspaceAvatar}.test.ts",
    ],
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/modules/story-governance/**/*.{ts,tsx}",
        "src/modules/workspace/shared/utils/story*.ts",
      ],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
});
