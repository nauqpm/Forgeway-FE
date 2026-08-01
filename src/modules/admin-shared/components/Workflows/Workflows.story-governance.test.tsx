import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }));
const auth = vi.hoisted(() => ({ user: { id: "admin-user", role: "user" } }));
const workspaceState = vi.hoisted(() => ({ currentWorkspace: null as unknown }));

vi.mock("@/lib/axiosIns", () => ({ default: api }));
vi.mock("@/modules/auth/shared/hooks/useAuth", () => ({ useAuth: () => auth }));
vi.mock("@/modules/workspace/shared/hooks/useWorkspaces", () => ({
  useCurrentWorkspace: () => ({ currentWorkspace: workspaceState.currentWorkspace, isLoading: false }),
}));
vi.mock("@/modules/workspace/shared/services/workspaceService", () => ({
  workspaceService: { listMine: vi.fn() },
}));

import AdminWorkflows from "./Workflows";

const workspace = {
  _id: "workspace-1",
  name: "Delivery",
  key: "DEL",
  ownerId: "owner-user",
  members: [{ userId: "admin-user", role: "workspace_admin" }],
};

const workflow = {
  _id: "workflow-1",
  workspaceId: "workspace-1",
  name: "Delivery workflow",
  defaultStatus: "todo",
  statuses: [
    { id: "todo", name: "To do", color: "#999", category: "todo", metadata: { rank: 1 } },
    { id: "review", name: "Quality check", color: "#f90", category: "inprogress", requirementsGate: "review" as const },
    { id: "done", name: "Released", color: "#090", category: "done" as const },
  ],
  transitions: [{ fromStatus: "todo", toStatus: "review", name: "Ship to quality" }],
};

const workflowWithReleasedGate = {
  ...workflow,
  statuses: [
    { id: "todo", name: "To do", color: "#999", category: "todo", metadata: { rank: 1 } },
    { id: "review", name: "Quality check", color: "#f90", category: "inprogress" },
    { id: "done", name: "Released", color: "#090", category: "done" as const, requirementsGate: "review" as const },
  ],
};

const renderWorkflows = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(<QueryClientProvider client={queryClient}><AdminWorkflows /></QueryClientProvider>);
};

describe("AdminWorkflows requirements review gate", () => {
  beforeEach(() => {
    workspaceState.currentWorkspace = workspace;
    auth.user = { id: "admin-user", role: "user" };
    api.get.mockResolvedValue({ data: workflow });
    api.put.mockResolvedValue({ data: workflow });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("loads its workspace workflow directly and preserves the complete workflow when moving the gate", async () => {
    renderWorkflows();

    expect(await screen.findByText("Delivery workflow")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/workflows/workspace/workspace-1");
    expect(screen.getByRole("img", { name: "Requirements review gate" })).toBeInTheDocument();
    expect(screen.getByText("Requirements review gate")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Use Released as the requirements review gate" }));
    expect(screen.getByRole("radio", { name: "Use Released as the requirements review gate" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Use Quality check as the requirements review gate" })).not.toBeChecked();
    expect(screen.getAllByText("Quality check")[0].parentElement).not.toHaveTextContent("Requirements review gate");
    expect(screen.getAllByText("Released")[0].parentElement).toHaveTextContent("Requirements review gate");
    fireEvent.click(screen.getByRole("button", { name: "Save review gate" }));

    await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1));
    expect(api.put).toHaveBeenCalledWith(
      "/workflows/workflow-1",
      {
        name: "Delivery workflow",
        defaultStatus: "todo",
        statuses: [
          { id: "todo", name: "To do", color: "#999", category: "todo", metadata: { rank: 1 }, requirementsGate: undefined },
          { id: "review", name: "Quality check", color: "#f90", category: "inprogress", requirementsGate: undefined },
          { id: "done", name: "Released", color: "#090", category: "done", requirementsGate: "review" },
        ],
        transitions: [{ fromStatus: "todo", toStatus: "review", name: "Ship to quality" }],
      },
      { params: { workspaceId: "workspace-1" } },
    );
  });

  it("renders a load error with an explicit retry instead of the empty state", async () => {
    api.get.mockRejectedValueOnce(new Error("offline"));
    renderWorkflows();

    expect(await screen.findByRole("alert")).toHaveTextContent("Workflow configuration could not be loaded.");
    expect(screen.queryByText("No workflows have been configured")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry workflow configuration" }));
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Delivery workflow")).toBeInTheDocument();
  });

  it("allows an administrator to remove the early gate and explains done status completion", async () => {
    renderWorkflows();
    await screen.findByText("Delivery workflow");

    expect(screen.getByText("Completion remains blocked until requirements are satisfied, even without an early review gate.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "No early review gate" }));
    fireEvent.click(screen.getByRole("button", { name: "Save review gate" }));

    await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1));
    expect(api.put.mock.calls[0][1].statuses.every((status: { requirementsGate?: string }) => status.requirementsGate === undefined)).toBe(true);
  });

  it("persists a saved gate as the steady state", async () => {
    api.put.mockResolvedValueOnce({ data: workflowWithReleasedGate });
    renderWorkflows();
    await screen.findByText("Delivery workflow");

    fireEvent.click(screen.getByRole("radio", { name: "Use Released as the requirements review gate" }));
    fireEvent.click(screen.getByRole("button", { name: "Save review gate" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Save review gate" })).toBeDisabled());
    expect(screen.getByRole("radio", { name: "Use Released as the requirements review gate" })).toBeChecked();
    expect(screen.getAllByText("Released")[0].parentElement).toHaveTextContent("Requirements review gate");
    fireEvent.click(screen.getByRole("button", { name: "Save review gate" }));
    expect(api.put).toHaveBeenCalledTimes(1);
  });

  it.each(["member", "viewer"])("keeps %s access read-only", async (role) => {
    auth.user = { id: "member-user", role: "user" };
    workspaceState.currentWorkspace = { ...workspace, members: [{ userId: "member-user", role }] };
    renderWorkflows();

    expect(await screen.findByText("Requirements review gate")).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save review gate" })).not.toBeInTheDocument();
  });

  it("does not treat an unauthenticated workspace with no owner value as editable", async () => {
    auth.user = null as never;
    workspaceState.currentWorkspace = { ...workspace, ownerId: undefined, members: [] };
    renderWorkflows();

    await screen.findByText("Requirements review gate");
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save review gate" })).not.toBeInTheDocument();
  });

  it("allows an object-shaped workspace owner to edit", async () => {
    workspaceState.currentWorkspace = { ...workspace, ownerId: { _id: "admin-user" }, members: [] };
    renderWorkflows();

    await screen.findByText("Requirements review gate");
    expect(screen.getByRole("radio", { name: "No early review gate" })).toBeInTheDocument();
  });

  it("restores the server gate and renders duplicate validation inline after a failed save", async () => {
    api.put.mockRejectedValueOnce({ response: { status: 409, data: { message: "Only one workflow status may be the requirements review gate" } } });
    renderWorkflows();
    await screen.findByText("Delivery workflow");

    fireEvent.click(screen.getByRole("radio", { name: "Use Released as the requirements review gate" }));
    fireEvent.click(screen.getByRole("button", { name: "Save review gate" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Only one workflow status can be the review gate.");
    expect(screen.getByRole("radio", { name: "Use Quality check as the requirements review gate" })).toBeChecked();
  });

  it("does not expose arbitrary backend text after a failed save", async () => {
    api.put.mockRejectedValueOnce({
      response: { status: 500, data: { message: "postgres://admin:secret@internal/workflows" } },
    });
    renderWorkflows();
    await screen.findByText("Delivery workflow");

    fireEvent.click(screen.getByRole("radio", { name: "Use Released as the requirements review gate" }));
    fireEvent.click(screen.getByRole("button", { name: "Save review gate" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to save the review gate. Try again.");
    expect(screen.queryByText("postgres://admin:secret@internal/workflows")).not.toBeInTheDocument();
  });
});
