import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Tabs from "./Tabs";
import { WORKSPACE_PERMISSIONS } from "../constants/workspacePermissions";

vi.mock("@/shared/hooks/useOverflowTabs", () => ({
  useOverflowTabs: (_container: unknown, _measure: unknown, itemCount: number) => itemCount,
}));

const workspace = { _id: "workspace-1", key: "ALPHA", name: "Alpha", template: "kanban" as const };
const permissions = [WORKSPACE_PERMISSIONS.STORY_READ];

describe("Workspace tabs", () => {
  const originalFlag = process.env.NEXT_PUBLIC_STORY_GOVERNANCE_NAV_ENABLED;

  afterEach(() => {
    if (originalFlag === undefined) delete process.env.NEXT_PUBLIC_STORY_GOVERNANCE_NAV_ENABLED;
    else process.env.NEXT_PUBLIC_STORY_GOVERNANCE_NAV_ENABLED = originalFlag;
  });

  it("hides Stories when the navigation flag is false", () => {
    process.env.NEXT_PUBLIC_STORY_GOVERNANCE_NAV_ENABLED = "false";

    render(<Tabs workspace={workspace} activeTab="board" setActiveTab={vi.fn()} permissions={permissions} />);

    expect(screen.queryAllByRole("button", { name: "Stories" })).toHaveLength(0);
  });

  it("keeps Stories visible when the navigation flag is true", () => {
    process.env.NEXT_PUBLIC_STORY_GOVERNANCE_NAV_ENABLED = "true";

    render(<Tabs workspace={workspace} activeTab="board" setActiveTab={vi.fn()} permissions={permissions} />);

    expect(screen.getAllByRole("button", { name: "Stories" }).length).toBeGreaterThan(0);
  });

  it("keeps Stories visible when the navigation flag is unset", () => {
    delete process.env.NEXT_PUBLIC_STORY_GOVERNANCE_NAV_ENABLED;

    render(<Tabs workspace={workspace} activeTab="board" setActiveTab={vi.fn()} permissions={permissions} />);

    expect(screen.getAllByRole("button", { name: "Stories" }).length).toBeGreaterThan(0);
  });
});
