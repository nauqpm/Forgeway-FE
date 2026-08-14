import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("keeps the existing 2xl content-page rule scoped to opted-in pages", () => {
  const styles = read("src/styles/globals.css");

  assert.match(styles, /@media \(min-width: 120rem\)[\s\S]*\.app-page-fluid-2xl\s*\{\s*max-width: none;/);
  assert.match(styles, /--app-content-max:\s*100%/);

  [
    "app/(client)/settings/page.tsx",
    "src/modules/admin-shared/components/Users/Users.tsx",
    "src/modules/admin-shared/components/Permissions/Permissions.tsx",
    "src/modules/client/my-tasks/components/MyTasksView.tsx",
    "src/modules/client/projects/components/ProjectsView.tsx",
    "src/modules/client/tasks/components/TaskDetailView.tsx",
    "app/(client)/search/page.tsx",
    "app/(client)/sprints/page.tsx",
    "app/(client)/workspaces/page.tsx",
  ].forEach((path) => assert.match(read(path), /app-page-fluid-2xl/));
});

test("lets dashboard, for-you, and profile use the workspace canvas from desktop width", () => {
  const styles = read("src/styles/globals.css");

  assert.match(styles, /@media \(min-width: 80rem\)[\s\S]*\.app-page-fluid-xl\s*\{\s*max-width: none;/);

  [
    "src/modules/admin-shared/components/Dashboard/Dashboard.tsx",
    "src/modules/for-you/components/ForYouPage.tsx",
    "src/modules/profile/components/ProfilePage.tsx",
  ].forEach((path) => assert.match(read(path), /app-page-fluid-xl/));

  assert.match(read("src/modules/profile/components/ProfilePage.tsx"), /min-\[1280px\]:max-w-\[60rem\]/);

  [
    "src/modules/admin-shared/components/Dashboard/DashboardWorkspaceGrid.tsx",
    "src/modules/for-you/components/ForYouWorkspaceGrid.tsx",
  ].forEach((path) =>
    assert.match(read(path), /app-card-grid-fluid-xl/),
  );
});
