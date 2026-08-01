import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import StoryVersionWorkspace from "./StoryVersionWorkspace";
import { WORKSPACE_PERMISSIONS, type WorkspacePermission } from "@/modules/workspace/shared/constants/workspacePermissions";
import type { ApprovalHistory, StoryContract, StoryImpactAssessment, StoryVersion, StoryVersionChangeSet } from "../types/storyGovernance.type";

const service = vi.hoisted(() => ({ listVersions: vi.fn(), listApprovals: vi.fn(), compareVersions: vi.fn(), getVersionImpact: vi.fn(), linkTask: vi.fn() }));
const tasks = vi.hoisted(() => ({ getBoardTasks: vi.fn() }));

vi.mock("@/modules/story-governance/services/storyGovernance.service", () => ({ storyGovernanceService: service }));
vi.mock("@/modules/workspace/shared/services/taskQueries", () => ({ getBoardTasks: tasks.getBoardTasks }));

const contract = (overrides: Partial<StoryContract> = {}): StoryContract => ({ _id: "contract", workspaceId: "ws", key: "SC-42", title: "Export records", status: "active", latestStoryVersionNumber: 3, version: 1, currentApprovedStoryVersionId: "version-2", ...overrides });
const version = (id: string, versionNumber: number): StoryVersion => ({ _id: id, workspaceId: "ws", storyContractId: "contract", sourceDraftId: `draft-${id}`, versionNumber, contentSnapshot: { problem: "Exports fail", expectedOutcome: "Exports work", actors: ["Member"], scope: [{ id: "scope", text: "CSV export" }], outOfScope: [], businessRules: [{ id: "rule", text: "Audit every export" }], permissionRequirements: [], constraints: [], dependencies: [], risks: [] }, requirementLinkSnapshot: [{ requirementId: "req-1", relationship: "PRIMARY", evidenceNote: "Customer report" }], criteria: [{ acceptanceCriterionId: "criterion-1", acceptanceCriterionRevisionId: "revision-1", key: "AC-1", priority: "MUST" }], decisionRecordIds: ["decision-1"], contentHash: `${id}-hash` });
const approvals = (overrides: Partial<ApprovalHistory> = {}): ApprovalHistory => ({ requests: [{ _id: "request-3", workspaceId: "ws", storyContractId: "contract", storyVersionId: "version-3", state: "PENDING", requestedBy: "user" }], records: [{ _id: "record-rejected", workspaceId: "ws", storyContractId: "contract", storyVersionId: "version-rejected", approvalRequestId: "request-rejected", decision: "REJECT" }, { _id: "record-approved", workspaceId: "ws", storyContractId: "contract", storyVersionId: "version-1", approvalRequestId: "request-1", decision: "APPROVE" }], ...overrides });
const changeSet = (): StoryVersionChangeSet => ({ _id: "diff", workspaceId: "ws", storyContractId: "contract", fromStoryVersionId: "version-1", toStoryVersionId: "version-2", fromContentHash: "version-1-hash", toContentHash: "version-2-hash", scopeChanges: [{ entityId: "scope-2", changeType: "ADDED", impactLevel: "BLOCKING" }], businessRuleChanges: [{ entityId: "rule-1", changeType: "MODIFIED", impactLevel: "REVIEW_REQUIRED" }], permissionChanges: [{ entityId: "permission-1", changeType: "REMOVED", impactLevel: "INFORMATIONAL" }], requirementChanges: [{ entityId: "req-1", changeType: "MODIFIED", impactLevel: "BLOCKING" }], acceptanceCriterionChanges: [{ entityId: "criterion-1", changeType: "MODIFIED", oldRevisionId: "revision-1", newRevisionId: "revision-2", impactLevel: "REVIEW_REQUIRED" }], decisionChanges: [{ entityId: "decision-1", changeType: "ADDED", impactLevel: "INFORMATIONAL" }], dependencyChanges: [{ entityId: "dependency-1", changeType: "REMOVED", impactLevel: "INFORMATIONAL" }] });
const impact = (requirementsState: StoryImpactAssessment["requirementsState"], state: StoryImpactAssessment["state"]): StoryImpactAssessment => ({ _id: `${requirementsState}-${state}`, workspaceId: "ws", taskId: "task-1", storyContractId: "contract", fromStoryVersionId: "version-1", toStoryVersionId: "version-2", affectedCriterionIds: ["criterion-1"], requirementsState, state });

const renderWorkspace = (permissions: WorkspacePermission[] = [WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.STORY_COMPARE_VERSIONS, WORKSPACE_PERMISSIONS.STORY_READ_IMPACT, WORKSPACE_PERMISSIONS.STORY_RESOLVE_IMPACT]) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><StoryVersionWorkspace workspaceId="ws" workspaceKey="WS" contract={contract()} permissions={permissions} /></QueryClientProvider>);

describe("StoryVersionWorkspace", () => {
  beforeEach(() => {
    service.listVersions.mockResolvedValue([version("version-rejected", 0), version("version-1", 1), version("version-2", 2), version("version-3", 3)]);
    service.listApprovals.mockResolvedValue(approvals()); service.compareVersions.mockResolvedValue(changeSet()); service.getVersionImpact.mockResolvedValue([impact("REVIEW_REQUIRED", "PENDING"), impact("REBASE_REQUIRED", "RESOLVED")]); service.linkTask.mockResolvedValue({}); tasks.getBoardTasks.mockResolvedValue([{ id: "task-1", key: "WS-12", title: "Ship exports" }]);
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });
  afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); });

  it("renders newest-first immutable snapshots, derived state, approved pointer, and copyable hash", async () => {
    renderWorkspace();
    await screen.findAllByText("Version 3");
    const rows = screen.getAllByRole("button").filter((button) => button.hasAttribute("aria-pressed"));
    expect(rows.map((row) => row.textContent)).toEqual([expect.stringContaining("Version 3"), expect.stringContaining("Version 2"), expect.stringContaining("Version 1"), expect.stringContaining("Version 0")]);
    expect(screen.getByText("APPROVED")).toBeInTheDocument();
    expect(screen.getByText("PENDING APPROVAL")).toBeInTheDocument();
    expect(screen.getByText("REJECTED")).toBeInTheDocument();
    expect(screen.getAllByText("SUPERSEDED")).not.toHaveLength(0);
    expect(screen.getByText("Current approved: Version 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Copy content hash" }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("version-3-hash");
    expect(screen.queryByRole("button", { name: /edit version|delete version/i })).not.toBeInTheDocument();
  });

  it("shows a read-only snapshot and an empty first-version state", async () => {
    renderWorkspace();
    expect(await screen.findByText("Exports fail")).toBeInTheDocument();
    expect(screen.getByText("PRIMARY")).toBeInTheDocument();
    expect(screen.getByText(/AC-1/)).toBeInTheDocument();
    service.listVersions.mockResolvedValueOnce([]);
    cleanup(); renderWorkspace();
    expect(await screen.findByText("No immutable versions yet.")).toBeInTheDocument();
  });

  it("renders every backend semantic change group without calculating a content diff", async () => {
    renderWorkspace();
    await screen.findByRole("button", { name: /Version 3/ });
    fireEvent.change(screen.getByLabelText("Compare from version"), { target: { value: "version-1" } });
    fireEvent.change(screen.getByLabelText("Compare to version"), { target: { value: "version-2" } });
    expect(await screen.findByText("BLOCKING (2)")).toBeInTheDocument();
    expect(screen.getByText("REVIEW REQUIRED (2)")).toBeInTheDocument();
    expect(screen.getByText("INFORMATIONAL (3)")).toBeInTheDocument();
    expect(screen.getAllByText(/criterion-1/)).not.toHaveLength(0);
    expect(screen.getByText("revision-1 → revision-2")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Semantic version diff" })).toHaveClass("overflow-x-auto");
    expect(service.compareVersions).toHaveBeenCalledWith("ws", "contract", "version-1", "version-2");
  });

  it("shows grouped Task impacts with their resolution and criterion references", async () => {
    renderWorkspace();
    expect(await screen.findByText("REVIEW REQUIRED (1)")).toBeInTheDocument();
    expect(screen.getByText("REBASE REQUIRED (1)")).toBeInTheDocument();
    expect(screen.getByText("REVIEW REQUIRED · PENDING")).toBeInTheDocument();
    expect(screen.getByText("REBASE REQUIRED · RESOLVED")).toBeInTheDocument();
    expect(screen.getAllByText(/criterion-1/)).not.toHaveLength(0);
    expect(screen.getAllByRole("link", { name: "WS-12" })[0]).toHaveAttribute("href", "/workspaces/WS/board/key/WS-12");
  });

  it("links only the current approved version after a named confirmation and refreshes affected caches", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    render(<QueryClientProvider client={queryClient}><StoryVersionWorkspace workspaceId="ws" workspaceKey="WS" contract={contract()} permissions={[WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.STORY_RESOLVE_IMPACT]} /></QueryClientProvider>);
    fireEvent.click(await screen.findByRole("button", { name: "Link current approved Version to Task" }));
    fireEvent.change(screen.getByLabelText("Task"), { target: { value: "task-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue to confirmation" }));
    expect(screen.getAllByRole("dialog", { name: "Link Task to approved Version" })).toHaveLength(1);
    expect(screen.getByRole("dialog", { name: "Link Task to approved Version" })).toHaveTextContent("SC-42");
    expect(screen.getByRole("dialog", { name: "Link Task to approved Version" })).toHaveTextContent("Version 2");
    fireEvent.click(screen.getByRole("button", { name: "Link Task" }));
    await waitFor(() => expect(service.linkTask).toHaveBeenCalledWith("ws", "contract", "version-2", "task-1"));
    const keys = invalidate.mock.calls.map(([options]) => JSON.stringify(options?.queryKey));
    expect(keys).toEqual(expect.arrayContaining([JSON.stringify(["tasks", "ws"]), JSON.stringify(["tasks", "detail", "ws", "WS-12"]), JSON.stringify(["story-governance", "ws", "tasks", "task-1", "impact"]), JSON.stringify(["story-governance", "ws", "contracts", "contract", "versions", "version-2", "impact"])]));
  });

  it("does not offer task linking to viewers and keeps scoped failures private", async () => {
    service.linkTask.mockRejectedValueOnce({ response: { status: 404, data: { message: "other workspace task" } } });
    renderWorkspace([WORKSPACE_PERMISSIONS.STORY_READ]);
    await screen.findByRole("button", { name: /Version 3/ });
    expect(screen.queryByRole("button", { name: "Link current approved Version to Task" })).not.toBeInTheDocument();
    expect(service.getVersionImpact).not.toHaveBeenCalled();
    expect(tasks.getBoardTasks).not.toHaveBeenCalled();
    cleanup(); renderWorkspace([WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.TASK_EDIT]);
    await screen.findByRole("button", { name: /Version 3/ });
    expect(screen.queryByRole("button", { name: "Link current approved Version to Task" })).not.toBeInTheDocument();
  });

  it("keeps unavailable immutable history distinct from an empty first-version state", async () => {
    service.listVersions.mockRejectedValueOnce(new Error("network"));
    renderWorkspace();
    expect(await screen.findByRole("alert")).toHaveTextContent("Version history is unavailable.");
    expect(screen.queryByText("No immutable versions yet.")).not.toBeInTheDocument();
  });

  it("retries either failed Version or approval history query", async () => {
    service.listApprovals.mockRejectedValueOnce(new Error("network"));
    renderWorkspace();
    fireEvent.click(await screen.findByRole("button", { name: "Retry" }));
    await waitFor(() => expect(service.listApprovals).toHaveBeenCalledTimes(2));
  });

  it("keeps Task-link failures private in the confirmation", async () => {
    service.linkTask.mockRejectedValueOnce({ response: { status: 404, data: { message: "other workspace task" } } });
    renderWorkspace();
    fireEvent.click(await screen.findByRole("button", { name: "Link current approved Version to Task" }));
    fireEvent.change(screen.getByLabelText("Task"), { target: { value: "task-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue to confirmation" }));
    fireEvent.click(screen.getByRole("button", { name: "Link Task" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to link this Task");
    expect(screen.queryByText("other workspace task")).not.toBeInTheDocument();
  });
});
