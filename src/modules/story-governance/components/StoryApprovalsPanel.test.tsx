import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import StoryApprovalsPanel from "./StoryApprovalsPanel";
import StoryContractDetail from "./StoryContractDetail";
import { WORKSPACE_PERMISSIONS } from "@/modules/workspace/shared/constants/workspacePermissions";
import type { ApprovalHistory, StoryContract, StoryImpactAssessment, StoryVersion } from "../types/storyGovernance.type";

const service = vi.hoisted(() => ({ listVersions: vi.fn(), listApprovals: vi.fn(), requestApproval: vi.fn(), approveVersion: vi.fn(), rejectVersion: vi.fn(), getVersionImpact: vi.fn() }));
vi.mock("../services/storyGovernance.service", () => ({ storyGovernanceService: service }));

const contract = (overrides: Partial<StoryContract> = {}): StoryContract => ({ _id: "sc", workspaceId: "ws", key: "SC-42", title: "Export records", status: "active", latestStoryVersionNumber: 3, version: 1, currentApprovedStoryVersionId: "v2", ...overrides });
const version = (id: string, versionNumber: number): StoryVersion => ({ _id: id, workspaceId: "ws", storyContractId: "sc", sourceDraftId: `draft-${id}`, versionNumber, contentSnapshot: { problem: "p", expectedOutcome: "o", actors: [], scope: [], outOfScope: [], businessRules: [], permissionRequirements: [], constraints: [], dependencies: [], risks: [] }, requirementLinkSnapshot: [], criteria: [], decisionRecordIds: [], contentHash: `${id}-hash` });
const history = (overrides: Partial<ApprovalHistory> = {}): ApprovalHistory => ({ requests: [{ _id: "ar", workspaceId: "ws", storyContractId: "sc", storyVersionId: "v3", state: "PENDING", requestedBy: "member", createdAt: "2026-07-30T09:00:00.000Z" }, { _id: "old", workspaceId: "ws", storyContractId: "sc", storyVersionId: "v1", state: "REJECTED", requestedBy: "member", resolvedAt: "2026-07-30T08:00:00.000Z" }], records: [{ _id: "reject", workspaceId: "ws", storyContractId: "sc", storyVersionId: "v1", approvalRequestId: "old", decision: "REJECT", reason: "Needs evidence", createdAt: "2026-07-30T08:00:00.000Z" }], ...overrides });
const impact = (): StoryImpactAssessment => ({ _id: "impact", workspaceId: "ws", taskId: "task-1", storyContractId: "sc", fromStoryVersionId: "v2", toStoryVersionId: "v3", affectedCriterionIds: ["ac-1"], requirementsState: "REVIEW_REQUIRED", state: "PENDING" });
const renderPanel = (permissions = [WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.STORY_SUBMIT, WORKSPACE_PERMISSIONS.STORY_APPROVE, WORKSPACE_PERMISSIONS.STORY_READ_IMPACT], overrides: Partial<React.ComponentProps<typeof StoryApprovalsPanel>> = {}) => {
  const onOpenVersion = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(<QueryClientProvider client={queryClient}><StoryApprovalsPanel workspaceId="ws" contract={contract()} versions={[version("v1", 1), version("v2", 2), version("v3", 3)]} permissions={permissions} onOpenVersion={onOpenVersion} {...overrides} /></QueryClientProvider>);
  return { onOpenVersion, queryClient };
};

describe("StoryApprovalsPanel", () => {
  beforeEach(() => {
    service.listVersions.mockResolvedValue([version("v1", 1), version("v2", 2), version("v3", 3)]); service.listApprovals.mockResolvedValue(history()); service.requestApproval.mockResolvedValue({}); service.approveVersion.mockResolvedValue({ record: { _id: "approved", workspaceId: "ws", storyContractId: "sc", storyVersionId: "v3", approvalRequestId: "ar", decision: "APPROVE" }, approved: true }); service.rejectVersion.mockResolvedValue({}); service.getVersionImpact.mockResolvedValue([impact()]);
  });
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("renders chronological linked approval history with pending and resolved states", async () => {
    renderPanel();
    const records = await screen.findAllByRole("article", { name: "Approval history record" });
    expect(records.map((record) => record.textContent)).toEqual([expect.stringContaining("Version 1"), expect.stringContaining("Version 3")]);
    expect(screen.getByText("PENDING")).toBeInTheDocument();
    expect(screen.getByText("REJECTED")).toBeInTheDocument();
    expect(records[0]).toHaveTextContent("Needs evidence");
    cleanup(); service.listApprovals.mockResolvedValueOnce(history({ requests: [], records: [] })); renderPanel();
    expect(await screen.findByText("No approval requests yet.")).toBeInTheDocument();
  });

  it("loads immutable Versions when the detail pane opens Approvals", async () => {
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><StoryContractDetail workspaceId="ws" contract={contract()} section="approvals" permissions={[WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.STORY_APPROVE]} onSectionChange={vi.fn()} onOpenVersion={vi.fn()} /></QueryClientProvider>);
    expect(await screen.findByRole("button", { name: "Approve Version 3" })).toBeInTheDocument();
    expect(service.listVersions).toHaveBeenCalledWith("ws", "sc");
  });

  it("lets a submitter request approval once, keeps viewers read-only, and handles duplicate pending safely", async () => {
    renderPanel([WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.STORY_SUBMIT]);
    fireEvent.click(await screen.findByRole("button", { name: "Request approval for Version 3" }));
    await waitFor(() => expect(service.requestApproval).toHaveBeenCalledWith("ws", "sc", "v3"));
    cleanup(); service.requestApproval.mockRejectedValueOnce({ response: { status: 409, data: { message: "duplicate" } } }); renderPanel([WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.STORY_SUBMIT]);
    fireEvent.click(await screen.findByRole("button", { name: "Request approval for Version 3" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Approval is already pending");
    cleanup(); renderPanel([WORKSPACE_PERMISSIONS.STORY_READ]);
    await screen.findByText("Approval history");
    expect(screen.queryByRole("button", { name: /Request approval|Approve Version|Reject Version/ })).not.toBeInTheDocument();
  });

  it("sends the immutable version, current pointer, and one idempotency key for approval", async () => {
    const { onOpenVersion, queryClient } = renderPanel();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    fireEvent.click(await screen.findByRole("button", { name: "Approve Version 3" }));
    expect(screen.getByRole("dialog", { name: "Approve Version" })).toHaveTextContent("Version 3");
    expect(screen.getByRole("dialog", { name: "Approve Version" })).toHaveTextContent("Current approved: Version 2");
    fireEvent.click(screen.getByRole("button", { name: "Approve Version" }));
    await waitFor(() => expect(service.approveVersion).toHaveBeenCalledWith("ws", "sc", "v3", { approvalRequestId: "ar", expectedCurrentVersionId: "v2" }, expect.stringMatching(/^[0-9a-f-]{36}$/i)));
    expect(await screen.findByText("Version approved. 1 Task impact assessment requires review.")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Version approved.");
    expect(onOpenVersion).toHaveBeenCalledWith("v3");
    expect(invalidate.mock.calls.map(([options]) => JSON.stringify(options?.queryKey))).toContain(JSON.stringify(["tasks", "ws"]));
  });

  it("reuses the approval idempotency key after an uncertain failure", async () => {
    service.approveVersion.mockRejectedValueOnce(new Error("network"));
    renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: "Approve Version 3" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve Version" }));
    await screen.findByText("Unable to approve this Version. Refresh and try again.");
    const firstKey = service.approveVersion.mock.calls[0][4];
    fireEvent.click(screen.getByRole("button", { name: "Approve Version 3" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve Version" }));
    await waitFor(() => expect(service.approveVersion).toHaveBeenCalledTimes(2));
    expect(service.approveVersion.mock.calls[1][4]).toBe(firstKey);
  });

  it("does not append prior approval impact to a later request error", async () => {
    renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: "Approve Version 3" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve Version" }));
    await screen.findByText("Version approved. 1 Task impact assessment requires review.");
    service.requestApproval.mockRejectedValueOnce({ response: { status: 409 } });
    fireEvent.click(screen.getByRole("button", { name: "Request approval for Version 1" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Approval is already pending");
    expect(alert).not.toHaveTextContent("Task impact");
  });

  it("uses null for the first approval and keeps the request pending until the policy is satisfied", async () => {
    service.approveVersion.mockResolvedValueOnce({ record: { _id: "partial", workspaceId: "ws", storyContractId: "sc", storyVersionId: "v3", approvalRequestId: "ar", decision: "APPROVE" }, approved: false });
    renderPanel(undefined, { contract: contract({ currentApprovedStoryVersionId: null }) });
    fireEvent.click(await screen.findByRole("button", { name: "Approve Version 3" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve Version" }));
    await waitFor(() => expect(service.approveVersion).toHaveBeenCalledWith("ws", "sc", "v3", { approvalRequestId: "ar", expectedCurrentVersionId: null }, expect.any(String)));
    expect(await screen.findByText("Approval recorded. Another approval is still required.")).toBeInTheDocument();
  });

  it("disables the approval confirmation while its single operation is pending", async () => {
    service.approveVersion.mockReturnValueOnce(new Promise(() => undefined));
    renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: "Approve Version 3" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve Version" }));
    await waitFor(() => expect(service.approveVersion).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Approve Version" })).toBeDisabled();
  });

  it("stops conflict retries, refreshes authority, and keeps policy and scoped failures safe", async () => {
    service.approveVersion.mockRejectedValueOnce({ response: { status: 409, data: { code: "APPROVAL_VERSION_CONFLICT" } } });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    render(<QueryClientProvider client={queryClient}><StoryApprovalsPanel workspaceId="ws" contract={contract()} versions={[version("v1", 1), version("v2", 2), version("v3", 3)]} permissions={[WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.STORY_APPROVE]} /></QueryClientProvider>);
    fireEvent.click(await screen.findByRole("button", { name: "Approve Version 3" })); fireEvent.click(screen.getByRole("button", { name: "Approve Version" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Approval state changed. Refreshed the current record");
    expect(service.approveVersion).toHaveBeenCalledTimes(1);
    expect(invalidate.mock.calls.map(([options]) => JSON.stringify(options?.queryKey))).toEqual(expect.arrayContaining([JSON.stringify(["story-governance", "ws", "contracts", "sc"]), JSON.stringify(["story-governance", "ws", "contracts", "sc", "versions"]), JSON.stringify(["story-governance", "ws", "contracts", "sc", "approvals"]), JSON.stringify(["story-governance", "ws", "contracts", "sc", "drafts"])]));
    cleanup(); service.approveVersion.mockRejectedValueOnce({ response: { status: 409, data: { code: "APPROVAL_POLICY_NOT_SATISFIED" } } }); renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: "Approve Version 3" })); fireEvent.click(screen.getByRole("button", { name: "Approve Version" }));
    expect(await screen.findByRole("status")).toHaveTextContent("An independent approval is still required");
    cleanup(); service.rejectVersion.mockRejectedValueOnce({ response: { status: 403, data: { message: "private" } } }); renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: "Reject Version 3" })); fireEvent.click(screen.getByRole("button", { name: "Reject Version" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to reject this Version");
    expect(screen.queryByText("private")).not.toBeInTheDocument();
    cleanup(); service.rejectVersion.mockRejectedValueOnce({ response: { status: 404, data: { message: "not found" } } }); renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: "Reject Version 3" })); fireEvent.click(screen.getByRole("button", { name: "Reject Version" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to reject this Version");
    expect(screen.queryByText("not found")).not.toBeInTheDocument();
  });

  it("uses a new approval operation key after an authority conflict changes the payload", async () => {
    service.approveVersion.mockRejectedValueOnce({
      response: { status: 409, data: { code: "APPROVAL_VERSION_CONFLICT" } },
    });
    renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: "Approve Version 3" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve Version" }));
    await screen.findByText(/Approval state changed/);
    const conflictedKey = service.approveVersion.mock.calls[0][4];

    cleanup();
    renderPanel(undefined, {
      contract: contract({ currentApprovedStoryVersionId: "v4" }),
    });
    fireEvent.click(await screen.findByRole("button", { name: "Approve Version 3" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve Version" }));
    await waitFor(() => expect(service.approveVersion).toHaveBeenCalledTimes(2));
    expect(service.approveVersion.mock.calls[1][3]).toEqual({
      approvalRequestId: "ar",
      expectedCurrentVersionId: "v4",
    });
    expect(service.approveVersion.mock.calls[1][4]).not.toBe(conflictedKey);
  });

  it("refreshes every approval authority surface and rotates the key after an idempotency conflict", async () => {
    service.approveVersion.mockRejectedValueOnce({
      response: { status: 409, data: { code: "IDEMPOTENCY_CONFLICT" } },
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    render(<QueryClientProvider client={queryClient}><StoryApprovalsPanel workspaceId="ws" contract={contract()} versions={[version("v1", 1), version("v2", 2), version("v3", 3)]} permissions={[WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.STORY_APPROVE]} /></QueryClientProvider>);
    fireEvent.click(await screen.findByRole("button", { name: "Approve Version 3" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve Version" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Approval operation conflicted. Refreshed the current record");
    const conflictedKey = service.approveVersion.mock.calls[0][4];
    expect(invalidate.mock.calls.map(([options]) => JSON.stringify(options?.queryKey))).toEqual(expect.arrayContaining([
      JSON.stringify(["story-governance", "ws", "contracts", "sc"]),
      JSON.stringify(["story-governance", "ws", "contracts", "sc", "versions"]),
      JSON.stringify(["story-governance", "ws", "contracts", "sc", "approvals"]),
      JSON.stringify(["story-governance", "ws", "contracts", "sc", "drafts"]),
      JSON.stringify(["story-governance", "ws", "contracts", "sc", "versions", "v3", "impact"]),
    ]));

    fireEvent.click(await screen.findByRole("button", { name: "Approve Version 3" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve Version" }));
    await waitFor(() => expect(service.approveVersion).toHaveBeenCalledTimes(2));
    expect(service.approveVersion.mock.calls[1][4]).not.toBe(conflictedKey);
  });

  it("limits rejection reasons to 100 characters and sends no operation key", async () => {
    renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: "Reject Version 3" }));
    const reason = screen.getByLabelText("Reason");
    expect(reason).toHaveAttribute("maxlength", "100");
    fireEvent.change(reason, { target: { value: "Needs acceptance evidence." } });
    fireEvent.click(screen.getByRole("button", { name: "Reject Version" }));
    await waitFor(() => expect(service.rejectVersion).toHaveBeenCalledWith("ws", "sc", "v3", { approvalRequestId: "ar", reason: "Needs acceptance evidence." }));
  });
});
