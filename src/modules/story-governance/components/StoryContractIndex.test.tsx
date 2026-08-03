import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import StoryContractIndex from "./StoryContractIndex";
import { WORKSPACE_PERMISSIONS } from "@/modules/workspace/shared/constants/workspacePermissions";

const service = vi.hoisted(() => ({
  listRequirements: vi.fn(),
  listContracts: vi.fn(),
  createRequirement: vi.fn(),
  archiveRequirement: vi.fn(),
  createContract: vi.fn(),
  archiveContract: vi.fn(),
}));

vi.mock("@/modules/story-governance/services/storyGovernance.service", () => ({
  storyGovernanceService: service,
}));

describe("StoryContractIndex", () => {
  beforeEach(() => {
    service.listRequirements.mockResolvedValue([]);
    service.listContracts.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("visually marks only the selected contract status filter", async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <StoryContractIndex
          workspaceId="workspace-id"
          permissions={[WORKSPACE_PERMISSIONS.STORY_READ]}
          requirements={[]}
          selectedId={null}
          search=""
          onSearchChange={vi.fn()}
          createOpen={false}
          onCreateOpenChange={vi.fn()}
          onOpenRequirements={vi.fn()}
          onSelect={vi.fn()}
          onCreated={vi.fn()}
          onOpenApprovals={vi.fn()}
        />
      </QueryClientProvider>,
    );

    const active = await screen.findByRole("button", { name: "Active" });
    const archived = screen.getByRole("button", { name: "Archived" });
    expect(active).toHaveAttribute("aria-pressed", "true");
    expect(active).toHaveClass("bg-[#2563EB]");
    expect(archived).toHaveAttribute("aria-pressed", "false");
    expect(archived).toHaveClass("bg-[#F9F9F8]");

    fireEvent.click(archived);

    expect(active).toHaveAttribute("aria-pressed", "false");
    expect(active).toHaveClass("bg-[#F9F9F8]");
    expect(archived).toHaveAttribute("aria-pressed", "true");
    expect(archived).toHaveClass("bg-[#2563EB]");
  });
});
