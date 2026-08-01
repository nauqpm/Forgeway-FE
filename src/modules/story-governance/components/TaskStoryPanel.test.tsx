import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { storyGovernanceService } from "../services/storyGovernance.service";
import { taskService } from "@/modules/workspace/shared/services/taskService";
import TaskStoryPanel from "./TaskStoryPanel";

vi.mock("../services/storyGovernance.service", () => ({
  storyGovernanceService: {
    getContract: vi.fn(),
    getVersion: vi.fn(),
    getTaskImpact: vi.fn(),
    resolveTaskImpact: vi.fn(),
    listContracts: vi.fn(),
  },
}));
vi.mock("@/modules/workspace/shared/services/taskService", () => ({
  taskService: { updateBoardTask: vi.fn() },
}));

const service = vi.mocked(storyGovernanceService);
const tasks = vi.mocked(taskService);
const task = (overrides = {}) => ({
  id: "task-1",
  workspaceId: "ws",
  key: "WS-1",
  title: "Delivery task",
  description: "",
  type: "task",
  priority: "medium",
  status: "todo",
  columnId: "todo",
  rank: "a",
  assigneeId: "member-1",
  isArchived: false,
  isDeleted: false,
  createdAt: "",
  updatedAt: "",
  requirementsState: "CURRENT" as const,
  ...overrides,
});
const impact = (overrides = {}) => ({
  _id: "impact-1",
  workspaceId: "ws",
  taskId: "task-1",
  storyContractId: "contract-1",
  fromStoryVersionId: "version-1",
  toStoryVersionId: "version-2",
  affectedCriterionIds: ["AC-1"],
  requirementsState: "REVIEW_REQUIRED" as const,
  state: "PENDING" as const,
  ...overrides,
});
const renderPanel = (props = {}) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <TaskStoryPanel
        workspaceId="ws"
        workspaceKey="WS"
        task={task({
          storyContractId: "contract-1",
          storyVersionId: "version-1",
          requirementsState: "REVIEW_REQUIRED",
        })}
        currentUserId="member-1"
        isWorkspaceAdmin={false}
        canEditTask
        canResolveStoryImpact
        {...props}
      />
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
};

describe("TaskStoryPanel", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    service.getContract.mockResolvedValue({
      _id: "contract-1", workspaceId: "ws", key: "ST-1", title: "Checkout rules", status: "active",
      currentApprovedStoryVersionId: "version-2", latestStoryVersionNumber: 2, version: 1,
    });
    service.getVersion.mockResolvedValue({
      _id: "version-1", workspaceId: "ws", storyContractId: "contract-1", sourceDraftId: "draft",
      versionNumber: 1, contentSnapshot: {}, requirementLinkSnapshot: [], criteria: [], decisionRecordIds: [], contentHash: "hash",
    } as never);
    service.getTaskImpact.mockResolvedValue(impact());
    service.listContracts.mockResolvedValue([
      {
        _id: "contract-1", workspaceId: "ws", key: "ST-1", title: "Checkout rules", status: "active",
        currentApprovedStoryVersionId: "version-2", latestStoryVersionNumber: 2, version: 1,
      },
      {
        _id: "draft-only", workspaceId: "ws", key: "ST-2", title: "Draft only", status: "active",
        latestStoryVersionNumber: 0, version: 1,
      },
      {
        _id: "archived", workspaceId: "ws", key: "ST-3", title: "Archived", status: "archived",
        currentApprovedStoryVersionId: "version-3", latestStoryVersionNumber: 3, version: 1,
      },
    ]);
    tasks.updateBoardTask.mockImplementation(async (_workspaceId: string, _taskId: string, updates: Record<string, unknown>) => task({ ...updates }));
    service.resolveTaskImpact.mockResolvedValue(impact({
      state: "RESOLVED",
      requirementsState: "CURRENT",
      toStoryVersionId: "version-2",
    }));
  });

  it("renders an unlinked read-only empty state", () => {
    renderPanel({ task: task(), canEditTask: false, currentUserId: "viewer" });
    expect(screen.getByText("No Story linked")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /resolve/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Story Contract" })).not.toBeInTheDocument();
  });

  it("lets an editor update and clear paired pins with only eligible Contracts", async () => {
    const onUpdateTask = vi.fn();
    const { queryClient } = renderPanel({ task: task(), onUpdateTask });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const selector = await screen.findByRole("combobox", { name: "Story Contract" });
    expect(await screen.findByRole("option", { name: "ST-1 · Checkout rules" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Draft only|Archived/ })).not.toBeInTheDocument();

    fireEvent.change(selector, { target: { value: "contract-1" } });
    await waitFor(() => expect(tasks.updateBoardTask).toHaveBeenCalledWith("ws", "task-1", {
      storyContractId: "contract-1",
      storyVersionId: "version-2",
    }));
    expect(await screen.findByText("Story pin updated.")).toBeInTheDocument();
    expect(onUpdateTask).toHaveBeenCalledWith(expect.objectContaining({
      storyContractId: "contract-1",
      storyVersionId: "version-2",
    }));

    fireEvent.change(screen.getByRole("combobox", { name: "Story Contract" }), { target: { value: "" } });
    await waitFor(() => expect(tasks.updateBoardTask).toHaveBeenLastCalledWith("ws", "task-1", {
      storyContractId: null,
      storyVersionId: null,
    }));
    expect(await screen.findByText("Story pin cleared.")).toBeInTheDocument();
    expect(screen.getByText("No Story linked")).toBeInTheDocument();
    expect(invalidate.mock.calls.map(([options]) => JSON.stringify(options?.queryKey))).toEqual(expect.arrayContaining([
      JSON.stringify(["tasks", "ws"]),
      JSON.stringify(["tasks", "detail", "ws", "WS-1"]),
      JSON.stringify(["tasks", "detail-by-id", "task-1"]),
      JSON.stringify(["story-governance", "ws", "tasks", "task-1", "impact"]),
    ]));
  });

  it("shows the pinned Contract, exact Version, state, deep link, and pending impact", async () => {
    renderPanel();
    expect(await screen.findByText("ST-1")).toBeInTheDocument();
    expect(screen.getByText("Checkout rules")).toBeInTheDocument();
    expect(screen.getByText("Version 1")).toBeInTheDocument();
    expect(screen.getByText("Review required")).toBeInTheDocument();
    expect(screen.getByText("Pending impact")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open contract/i })).toHaveAttribute(
      "href",
      "/workspaces/WS/stories?contract=contract-1&section=versions&version=version-1",
    );
  });

  it("treats a missing assessment as no impact and hides resolve for a non-assignee member", async () => {
    service.getTaskImpact.mockResolvedValueOnce(null);
    renderPanel({ currentUserId: "member-2" });
    expect(await screen.findByText("No pending impact")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /resolve/i })).not.toBeInTheDocument();
  });

  it("lets an assignee or admin resolve once, disables pending, and refreshes authoritative caches", async () => {
    let finish!: (value: ReturnType<typeof impact>) => void;
    service.resolveTaskImpact.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const { queryClient } = renderPanel();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const button = await screen.findByRole("button", { name: "Resolve impact" });

    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(service.resolveTaskImpact).toHaveBeenCalledTimes(1));
    expect(button).toBeDisabled();
    finish(impact({ state: "RESOLVED", requirementsState: "CURRENT", toStoryVersionId: "version-2" }));

    await waitFor(() => expect(invalidate).toHaveBeenCalled());
    expect(service.resolveTaskImpact.mock.calls[0][3]).toMatch(/^[0-9a-f-]{36}$/i);
    expect(screen.getByRole("link", { name: /open contract/i })).toHaveAttribute(
      "href",
      "/workspaces/WS/stories?contract=contract-1&section=versions&version=version-2",
    );
    expect(screen.getByText("Current")).toBeInTheDocument();
  });

  it("shows resolve for an admin even when the admin is not the assignee", async () => {
    renderPanel({ currentUserId: "admin", isWorkspaceAdmin: true });
    expect(await screen.findByRole("button", { name: "Resolve impact" })).toBeInTheDocument();
  });

  it("does not resolve impact without the dedicated Story permission", async () => {
    renderPanel({ canResolveStoryImpact: false });
    await screen.findByText("Pending impact");
    expect(screen.queryByRole("button", { name: "Resolve impact" })).not.toBeInTheDocument();
  });

  it("reuses the same operation key for a retry of the same unresolved intent", async () => {
    service.resolveTaskImpact
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(impact({ state: "RESOLVED", requirementsState: "CURRENT" }));
    renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: "Resolve impact" }));
    expect(await screen.findByText("Could not resolve impact. Retry uses the same operation.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Resolve impact" }));
    await waitFor(() => expect(service.resolveTaskImpact).toHaveBeenCalledTimes(2));
    expect(service.resolveTaskImpact.mock.calls[1][3]).toBe(service.resolveTaskImpact.mock.calls[0][3]);
  });

  it("refetches authoritative Story and Task state on an idempotency conflict", async () => {
    service.resolveTaskImpact.mockRejectedValueOnce({
      response: { data: { code: "IDEMPOTENCY_CONFLICT" } },
    });
    renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: "Resolve impact" }));
    expect(await screen.findByText("Resolution state changed. Refreshed the current task.")).toBeInTheDocument();
    expect(service.getTaskImpact).toHaveBeenCalledTimes(2);
    expect(service.getContract).toHaveBeenCalledTimes(2);
    expect(service.getVersion).toHaveBeenCalledTimes(2);
  });
});
