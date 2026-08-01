import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WORKSPACE_PERMISSIONS, type WorkspacePermission } from "@/modules/workspace/shared/constants/workspacePermissions";
import StoryCriteriaPanel from "./StoryCriteriaPanel";
import type { AcceptanceCriterion, AcceptanceCriterionRevision, CriterionVerification, StoryVersion } from "../types/storyGovernance.type";

const service = vi.hoisted(() => ({
  getCriterion: vi.fn(),
  listCriterionRevisions: vi.fn(),
  listVerifications: vi.fn(),
  submitVerification: vi.fn(),
}));

vi.mock("@/modules/story-governance/services/storyGovernance.service", () => ({
  storyGovernanceService: service,
}));

const criterion = (overrides: Partial<AcceptanceCriterion> = {}): AcceptanceCriterion => ({
  _id: "criterion-1",
  workspaceId: "workspace-1",
  storyContractId: "contract-1",
  key: "AC-LOGIN",
  lifecycle: "ACTIVE",
  ...overrides,
});

const revision = (overrides: Partial<AcceptanceCriterionRevision> = {}): AcceptanceCriterionRevision => ({
  _id: "revision-1",
  workspaceId: "workspace-1",
  storyContractId: "contract-1",
  acceptanceCriterionId: "criterion-1",
  key: "AC-LOGIN",
  priority: "MUST",
  statement: "A member can sign in.",
  given: "Given a registered member",
  when: "When they submit valid credentials",
  then: "Then they reach their workspace",
  verificationMethod: "QA regression",
  revisionNumber: 1,
  contentHash: "criterion-hash-1",
  ...overrides,
});

const version = (overrides: Partial<StoryVersion> = {}): StoryVersion => ({
  _id: "version-1",
  workspaceId: "workspace-1",
  storyContractId: "contract-1",
  sourceDraftId: "draft-1",
  versionNumber: 7,
  contentSnapshot: { problem: "", expectedOutcome: "", actors: [], scope: [], outOfScope: [], businessRules: [], permissionRequirements: [], constraints: [], dependencies: [], risks: [] },
  requirementLinkSnapshot: [],
  criteria: [{ acceptanceCriterionId: "criterion-1", acceptanceCriterionRevisionId: "revision-1", key: "AC-LOGIN", priority: "MUST" }],
  decisionRecordIds: [],
  contentHash: "version-hash",
  ...overrides,
});

const verification = (overrides: Partial<CriterionVerification> = {}): CriterionVerification => ({
  _id: "verification-1",
  workspaceId: "workspace-1",
  storyContractId: "contract-1",
  storyVersionId: "version-1",
  acceptanceCriterionId: "criterion-1",
  acceptanceCriterionRevisionId: "revision-1",
  status: "PASSED",
  evidenceType: "QA run",
  evidenceRef: "https://qa.example/runs/1",
  taskId: "507f1f77bcf86cd799439011",
  pullRequestRef: "https://github.com/acme/app/pull/9",
  qaRunRef: "QA-123",
  submittedBy: "member-1",
  submittedAt: "2026-07-30T10:00:00.000Z",
  ...overrides,
});

const renderPanel = (
  permissions: WorkspacePermission[] = [WORKSPACE_PERMISSIONS.STORY_READ],
  selectedVersion = version(),
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }),
) => render(
  <QueryClientProvider client={queryClient}>
    <StoryCriteriaPanel workspaceId="workspace-1" contractId="contract-1" selectedVersion={selectedVersion} permissions={permissions} />
  </QueryClientProvider>,
);

describe("StoryCriteriaPanel", () => {
  beforeEach(() => {
    service.getCriterion.mockResolvedValue(criterion());
    service.listCriterionRevisions.mockResolvedValue([revision({ _id: "revision-2", revisionNumber: 2, contentHash: "criterion-hash-2", statement: "New wording" }), revision()]);
    service.listVerifications.mockResolvedValue([]);
    service.submitVerification.mockResolvedValue(verification());
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("uses the selected Version criterion reference and keeps its stable identity and retired history visible", async () => {
    service.getCriterion.mockResolvedValue(criterion({ lifecycle: "RETIRED", retiredAt: "2026-07-30T09:00:00.000Z" }));
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: /AC-LOGIN.*MUST/i }));
    expect(await screen.findByText("RETIRED")).toBeInTheDocument();
    expect(screen.getByText("Version 7 uses revision 1")).toBeInTheDocument();
    expect(screen.getByText("Given a registered member")).toBeInTheDocument();
    expect(screen.getByText("When they submit valid credentials")).toBeInTheDocument();
    expect(screen.getByText("Then they reach their workspace")).toBeInTheDocument();
    expect(screen.getByText("QA regression")).toBeInTheDocument();
    expect(screen.getByText("criterion-hash-1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revision 2" })).toBeInTheDocument();
  });

  it("uses the exact version, criterion, and revision tuple and never carries evidence between revisions", async () => {
    service.listVerifications.mockImplementation((_workspaceId: string, _contractId: string, _versionId: string, _criterionId: string, revisionId: string) => Promise.resolve(
      revisionId === "revision-1" ? [verification({ evidenceRef: "https://qa.example/revision-1" })] : [verification({ _id: "verification-2", acceptanceCriterionRevisionId: "revision-2", evidenceRef: "https://qa.example/revision-2" })],
    ));
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: /AC-LOGIN.*MUST/i }));
    expect(await screen.findByRole("link", { name: "https://qa.example/revision-1" })).toBeInTheDocument();
    expect(service.listVerifications).toHaveBeenCalledWith("workspace-1", "contract-1", "version-1", "criterion-1", "revision-1");

    fireEvent.click(screen.getByRole("button", { name: "Revision 2" }));
    expect(await screen.findByRole("link", { name: "https://qa.example/revision-2" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "https://qa.example/revision-1" })).not.toBeInTheDocument();
    expect(service.listVerifications).toHaveBeenCalledWith("workspace-1", "contract-1", "version-1", "criterion-1", "revision-2");
  });

  it("renders every verification status, references, actor, timestamp, and a useful empty state", async () => {
    service.listVerifications.mockResolvedValue([
      verification({ status: "PASSED" }),
      verification({ _id: "verification-2", status: "FAILED", evidenceRef: "https://qa.example/failed", submittedBy: "member-2" }),
      verification({ _id: "verification-3", status: "INCONCLUSIVE", evidenceRef: "https://qa.example/inconclusive", submittedBy: "member-3" }),
    ]);
    renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: /AC-LOGIN.*MUST/i }));
    expect(await screen.findByText("PASSED")).toBeInTheDocument();
    expect(screen.getByText("FAILED")).toBeInTheDocument();
    expect(screen.getByText("INCONCLUSIVE")).toBeInTheDocument();
    expect(screen.getAllByText("507f1f77bcf86cd799439011")).toHaveLength(3);
    expect(screen.getAllByRole("link", { name: "https://github.com/acme/app/pull/9" })).toHaveLength(3);
    expect(screen.getAllByText("QA-123")).toHaveLength(3);
    expect(screen.getByText(/member-1/)).toBeInTheDocument();

    cleanup();
    service.listVerifications.mockResolvedValue([]);
    renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: /AC-LOGIN.*MUST/i }));
    expect(await screen.findByText("No verification evidence has been submitted for this revision.")).toBeInTheDocument();
  });

  it("keeps nested 404s safe and does not render a submission form for Viewers", async () => {
    service.getCriterion.mockRejectedValueOnce({ response: { status: 404 } });
    renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: /AC-LOGIN.*MUST/i }));
    expect(await screen.findByText("This criterion is no longer available in this contract.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add verification evidence" })).not.toBeInTheDocument();
  });

  it("retries transient criterion history failures in place", async () => {
    service.getCriterion.mockRejectedValueOnce({ response: { status: 500 } });
    renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: /AC-LOGIN.*MUST/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Criterion history is unavailable.");
    fireEvent.click(screen.getByRole("button", { name: "Retry criterion history" }));
    await waitFor(() => expect(service.getCriterion).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Given a registered member")).toBeInTheDocument();
  });

  it("retries transient verification fetch failures in place", async () => {
    service.listVerifications.mockRejectedValueOnce({ response: { status: 500 } });
    renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: /AC-LOGIN.*MUST/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Verification evidence is unavailable.");
    fireEvent.click(screen.getByRole("button", { name: "Retry verification evidence" }));
    await waitFor(() => expect(service.listVerifications).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("No verification evidence has been submitted for this revision.")).toBeInTheDocument();
  });

  it("validates required evidence fields and all client-side bounds before append-only submission", async () => {
    renderPanel([WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.CRITERION_SUBMIT_VERIFICATION]);
    fireEvent.click(await screen.findByRole("button", { name: /AC-LOGIN.*MUST/i }));
    fireEvent.click(await screen.findByRole("button", { name: "Add verification evidence" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit verification" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Status, evidence type, and evidence reference are required.");

    fireEvent.change(screen.getByLabelText("Evidence type"), { target: { value: "x".repeat(501) } });
    fireEvent.change(screen.getByLabelText("Evidence reference"), { target: { value: "x".repeat(2001) } });
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "PASSED" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit verification" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Evidence type must be 500 characters or fewer.");

    fireEvent.change(screen.getByLabelText("Evidence type"), { target: { value: "QA run" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit verification" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Evidence reference must be 2,000 characters or fewer.");
    expect(screen.getByLabelText("Task ID")).toHaveAttribute("maxlength", "24");
    expect(screen.getByLabelText("Pull request reference")).toHaveAttribute("maxlength", "500");
    expect(screen.getByLabelText("QA run reference")).toHaveAttribute("maxlength", "500");
    expect(service.submitVerification).not.toHaveBeenCalled();
  });

  it("submits only a valid tuple, retains unsafe references as plain text, and invalidates that exact evidence query", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    service.listVerifications.mockResolvedValue([verification({ evidenceRef: "javascript:alert(1)" })]);
    renderPanel([WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.CRITERION_SUBMIT_VERIFICATION], version(), queryClient);
    fireEvent.click(await screen.findByRole("button", { name: /AC-LOGIN.*MUST/i }));
    expect(await screen.findByText("javascript:alert(1)")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "javascript:alert(1)" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add verification evidence" }));
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "PASSED" } });
    fireEvent.change(screen.getByLabelText("Evidence type"), { target: { value: "QA run" } });
    fireEvent.change(screen.getByLabelText("Evidence reference"), { target: { value: "https://qa.example/new" } });
    fireEvent.change(screen.getByLabelText("Task ID"), { target: { value: "invalid" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit verification" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Task ID must be a Mongo ObjectId.");

    fireEvent.change(screen.getByLabelText("Task ID"), { target: { value: "507f1f77bcf86cd799439011" } });
    fireEvent.change(screen.getByLabelText("Pull request reference"), { target: { value: "PR-17" } });
    fireEvent.change(screen.getByLabelText("QA run reference"), { target: { value: "QA-17" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit verification" }));
    await waitFor(() => expect(service.submitVerification).toHaveBeenCalledWith("workspace-1", "contract-1", "criterion-1", "revision-1", {
      storyVersionId: "version-1", status: "PASSED", evidenceType: "QA run", evidenceRef: "https://qa.example/new", taskId: "507f1f77bcf86cd799439011", pullRequestRef: "PR-17", qaRunRef: "QA-17",
    }));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["story-governance", "workspace-1", "contracts", "contract-1", "versions", "version-1", "criteria", "criterion-1", "revisions", "revision-1", "verifications"] });
    expect(screen.queryByRole("button", { name: /edit|delete/i })).not.toBeInTheDocument();
  });
});
