import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import RequirementPanel from "./RequirementPanel";
import { WORKSPACE_PERMISSIONS } from "@/modules/workspace/shared/constants/workspacePermissions";
import type { WorkspacePermission } from "@/modules/workspace/shared/constants/workspacePermissions";
import type { RawRequirement } from "../types/storyGovernance.type";

const service = vi.hoisted(() => ({
  listRequirements: vi.fn(),
  createRequirement: vi.fn(),
  archiveRequirement: vi.fn(),
}));

vi.mock("@/modules/story-governance/services/storyGovernance.service", () => ({
  storyGovernanceService: service,
}));

const requirement = (overrides: Partial<RawRequirement> = {}): RawRequirement => ({
  _id: "requirement-1",
  workspaceId: "workspace-id",
  key: "REQ-1",
  title: "Customer export",
  body: "Customers can export their data.",
  sourceType: "manual",
  status: "active",
  ...overrides,
});

const renderPanel = (permissions: WorkspacePermission[] = [WORKSPACE_PERMISSIONS.STORY_READ], onSelect = vi.fn()) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}
    >
      <RequirementPanel workspaceId="workspace-id" permissions={permissions} onSelect={onSelect} />
    </QueryClientProvider>
  );

describe("RequirementPanel", () => {
  beforeEach(() => {
    service.listRequirements.mockResolvedValue([]);
    service.createRequirement.mockResolvedValue(requirement());
    service.archiveRequirement.mockResolvedValue(requirement({ status: "archived" }));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("renders distinct loading, error, and empty states", async () => {
    service.listRequirements.mockReturnValue(new Promise(() => undefined));
    const loading = renderPanel();
    expect(screen.getByLabelText("Requirements loading")).toBeInTheDocument();
    loading.unmount();

    service.listRequirements.mockRejectedValueOnce({ response: { status: 500 } });
    const failed = renderPanel();
    expect(await screen.findByRole("alert")).toHaveTextContent("Requirements could not be loaded");
    failed.unmount();

    service.listRequirements.mockResolvedValueOnce([]);
    renderPanel();
    expect(await screen.findByText(/No requirements yet/)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Requirements" })).toHaveClass("bg-[var(--color-surface)]");
    expect(screen.getByRole("button", { name: "Active" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText(/Create a requirement to establish/)).not.toBeInTheDocument();
  });

  it("invites members to create the first active requirement", async () => {
    renderPanel([WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.STORY_CREATE]);
    expect(await screen.findByText(/No requirements yet/)).toBeInTheDocument();
    expect(screen.getByText(/Create a requirement to establish/)).toBeInTheDocument();
  });

  it("filters active and archived Requirements without losing historical access", async () => {
    service.listRequirements.mockResolvedValue([
      requirement(),
      requirement({ _id: "requirement-2", key: "REQ-2", title: "Archived source", status: "archived" }),
    ]);
    const onSelect = vi.fn();
    renderPanel([WORKSPACE_PERMISSIONS.STORY_READ], onSelect);

    expect(await screen.findByText("Customer export")).toBeInTheDocument();
    expect(screen.queryByText("Archived source")).not.toBeInTheDocument();
    act(() => screen.getByRole("button", { name: "Archived" }).click());
    act(() => screen.getByRole("button", { name: /REQ-2 Archived source/ }).click());
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ _id: "requirement-2", status: "archived" }));
    expect(screen.queryByRole("button", { name: /archive requirement/i })).not.toBeInTheDocument();
  });

  it("validates the required create fields before submitting", async () => {
    renderPanel([WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.STORY_CREATE]);
    fireEvent.click(await screen.findByRole("button", { name: "Create requirement" }));
    fireEvent.click(screen.getByRole("button", { name: "Save requirement" }));
    expect(screen.getByText("Key is required and must be 100 characters or fewer.")).toBeInTheDocument();
    expect(service.createRequirement).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only body, closes on Escape, and returns focus to its opener", async () => {
    renderPanel([WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.STORY_CREATE]);
    const opener = await screen.findByRole("button", { name: "Create requirement" });
    opener.focus();
    fireEvent.click(opener);
    fireEvent.change(screen.getByLabelText("Key"), { target: { value: "REQ-1" } });
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "A title" } });
    const body = screen.getByLabelText("Body");
    body.focus();
    fireEvent.change(body, { target: { value: "   " } });
    expect(body).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Save requirement" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Body is required");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(opener).toHaveFocus());
    expect(service.createRequirement).not.toHaveBeenCalled();
  });

  it("preserves form input without exposing an arbitrary backend create error", async () => {
    service.createRequirement.mockRejectedValueOnce({
      response: { data: { message: "postgres://admin:secret@internal/requirements" } },
    });
    renderPanel([WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.STORY_CREATE]);
    fireEvent.click(await screen.findByRole("button", { name: "Create requirement" }));
    fireEvent.change(screen.getByLabelText("Key"), { target: { value: "REQ-1" } });
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "A title" } });
    fireEvent.change(screen.getByLabelText("Body"), { target: { value: "A body" } });
    fireEvent.click(screen.getByRole("button", { name: "Save requirement" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not create requirement. Please try again.");
    expect(screen.queryByText(/postgres:\/\/admin:secret/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Key")).toHaveValue("REQ-1");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("keeps entered values after a JSON validation error and disables Save while pending", async () => {
    let resolveCreate: (() => void) | undefined;
    service.createRequirement.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveCreate = resolve;
        })
    );
    renderPanel([WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.STORY_CREATE]);
    fireEvent.click(await screen.findByRole("button", { name: "Create requirement" }));
    fireEvent.change(screen.getByLabelText("Key"), { target: { value: "REQ-1" } });
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "A title" } });
    fireEvent.change(screen.getByLabelText("Body"), { target: { value: "A body" } });
    fireEvent.change(screen.getByLabelText("Source metadata (JSON object)"), { target: { value: "{" } });
    fireEvent.click(screen.getByRole("button", { name: "Save requirement" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Source metadata must be a JSON object.");
    expect(screen.getByLabelText("Key")).toHaveValue("REQ-1");
    expect(screen.getByLabelText("Source metadata (JSON object)")).toHaveValue("{");

    fireEvent.change(screen.getByLabelText("Source metadata (JSON object)"), {
      target: { value: '{"source":"manual"}' },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save requirement" }));
    expect(screen.getByRole("button", { name: "Cancel" }).nextElementSibling).toBeDisabled();
    resolveCreate?.();
  });

  it("does not expose archive controls without story:archive", async () => {
    service.listRequirements.mockResolvedValue([requirement()]);
    renderPanel([WORKSPACE_PERMISSIONS.STORY_READ]);
    expect(await screen.findByText("Customer export")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /archive requirement/i })).not.toBeInTheDocument();
  });
});
