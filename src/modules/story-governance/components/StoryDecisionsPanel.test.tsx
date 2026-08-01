import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import StoryDecisionsPanel from "./StoryDecisionsPanel";
import { WORKSPACE_PERMISSIONS } from "@/modules/workspace/shared/constants/workspacePermissions";

const service = vi.hoisted(() => ({
  listDecisionProposals: vi.fn(), createDecisionProposal: vi.fn(), updateDecisionProposal: vi.fn(), approveDecisionProposal: vi.fn(), listDecisions: vi.fn(), supersedeDecision: vi.fn(), listDrafts: vi.fn(), getDraft: vi.fn(), updateDraft: vi.fn(),
}));

vi.mock("../services/storyGovernance.service", () => ({ storyGovernanceService: service }));

const proposal = (overrides = {}) => ({ _id: "proposal-1", workspaceId: "ws", storyContractId: "contract", question: "Which export format?", options: [{ key: "csv", label: "CSV" }, { key: "json", label: "JSON" }], recommendation: "CSV", state: "OPEN" as const, proposedBy: { kind: "human" as const, actorId: "member-1" }, createdAt: "2026-07-30T09:00:00.000Z", updatedAt: "2026-07-30T09:00:00.000Z", ...overrides });
const decision = (overrides = {}) => ({ _id: "decision-1", workspaceId: "ws", storyContractId: "contract", sourceProposalId: "proposal-1", question: "Which export format?", selectedOption: "csv", rationale: "Supports spreadsheet users.", decidedBy: "admin-1", decidedAt: "2026-07-30T10:00:00.000Z", ...overrides });
const renderPanel = (permissions = [WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.DECISION_PROPOSE, WORKSPACE_PERMISSIONS.DECISION_APPROVE]) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><StoryDecisionsPanel workspaceId="ws" contractId="contract" permissions={permissions} /></QueryClientProvider>);

describe("StoryDecisionsPanel", () => {
  beforeEach(() => {
    service.listDecisionProposals.mockResolvedValue([proposal()]);
    service.listDecisions.mockResolvedValue([decision()]);
    service.createDecisionProposal.mockResolvedValue(proposal({ _id: "proposal-2" }));
    service.updateDecisionProposal.mockResolvedValue(proposal());
    service.approveDecisionProposal.mockResolvedValue(decision());
    service.supersedeDecision.mockResolvedValue(decision({ _id: "decision-2", supersedesDecisionRecordId: "decision-1" }));
  });
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("distinguishes loading, empty, and unavailable scoped history", async () => {
    let resolve!: (value: ReturnType<typeof proposal>[]) => void;
    service.listDecisionProposals.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    renderPanel();
    expect(screen.getByText("Loading decisions…")).toBeInTheDocument();
    resolve([]); await screen.findByText("No decision proposals yet.");
    cleanup(); service.listDecisionProposals.mockRejectedValueOnce(new Error("offline")); renderPanel();
    expect(await screen.findByRole("alert")).toHaveTextContent("Decision history is unavailable.");
  });

  it("lets members create validated OPEN proposals without attaching them to a Draft", async () => {
    renderPanel([WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.DECISION_PROPOSE]);
    fireEvent.click(await screen.findByRole("button", { name: "New proposal" }));
    fireEvent.click(screen.getByRole("button", { name: "Save proposal" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Question is required.");
    fireEvent.change(screen.getByLabelText("Question"), { target: { value: "Which export format?" } });
    fireEvent.change(screen.getByLabelText("Option key 1"), { target: { value: "csv" } });
    fireEvent.change(screen.getByLabelText("Option label 1"), { target: { value: "CSV" } });
    fireEvent.click(screen.getByRole("button", { name: "Add option" }));
    fireEvent.change(screen.getByLabelText("Option key 2"), { target: { value: "csv" } });
    fireEvent.change(screen.getByLabelText("Option label 2"), { target: { value: "CSV duplicate" } });
    fireEvent.click(screen.getByRole("button", { name: "Save proposal" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Option keys must be unique.");
    fireEvent.change(screen.getByLabelText("Option key 2"), { target: { value: "json" } });
    fireEvent.click(screen.getByRole("button", { name: "Save proposal" }));
    await waitFor(() => expect(service.createDecisionProposal).toHaveBeenCalled());
    expect(service.updateDraft).not.toHaveBeenCalled();
    expect(await screen.findByText("OPEN · PROPOSAL")).toBeInTheDocument();
    expect(screen.getByText("Not an official decision")).toBeInTheDocument();
  });

  it("keeps proposal controls away from viewers and OPEN-only edits visible to members", async () => {
    renderPanel([WORKSPACE_PERMISSIONS.STORY_READ]);
    await screen.findAllByText("Which export format?");
    expect(screen.queryByRole("button", { name: "New proposal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit proposal" })).not.toBeInTheDocument();
    cleanup(); service.listDecisionProposals.mockResolvedValueOnce([proposal({ state: "APPROVED" })]); renderPanel([WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.DECISION_PROPOSE]);
    await screen.findByText("APPROVED");
    expect(screen.queryByRole("button", { name: "Edit proposal" })).not.toBeInTheDocument();
  });

  it("requires an existing option and rationale before admin approval, then shows the immutable record", async () => {
    renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: "Approve proposal" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve decision" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Select a valid option and provide a rationale.");
    fireEvent.change(screen.getByLabelText("Selected option"), { target: { value: "csv" } });
    fireEvent.change(screen.getByLabelText("Rationale"), { target: { value: "Supports spreadsheet users." } });
    fireEvent.click(screen.getByRole("button", { name: "Approve decision" }));
    await waitFor(() => expect(service.approveDecisionProposal).toHaveBeenCalledWith("ws", "contract", "proposal-1", { selectedOption: "csv", rationale: "Supports spreadsheet users." }));
    expect(service.updateDraft).not.toHaveBeenCalled();
    expect(await screen.findByText("Decision record created.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit decision|delete decision/i })).not.toBeInTheDocument();
  });

  it("does not expose an arbitrary backend decision error", async () => {
    service.approveDecisionProposal.mockRejectedValueOnce({
      response: { data: { message: "postgres://admin:secret@internal/decisions" } },
    });
    renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: "Approve proposal" }));
    fireEvent.change(screen.getByLabelText("Selected option"), { target: { value: "csv" } });
    fireEvent.change(screen.getByLabelText("Rationale"), { target: { value: "Approved." } });
    fireEvent.click(screen.getByRole("button", { name: "Approve decision" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not complete this decision action. Try again.",
    );
    expect(screen.queryByText(/postgres:\/\/admin:secret/)).not.toBeInTheDocument();
  });

  it("renders chronological immutable records and only gives administrators the supersede confirmation", async () => {
    service.listDecisions.mockResolvedValueOnce([decision({ _id: "later", decidedAt: "2026-07-30T12:00:00.000Z", supersedesDecisionRecordId: "decision-1" }), decision()]);
    renderPanel();
    expect((await screen.findAllByRole("article", { name: "Decision record" })).map((item) => item.textContent)).toEqual([expect.stringContaining("decision-1"), expect.stringContaining("later")]);
    fireEvent.click(screen.getAllByRole("button", { name: "Supersede decision" })[0]);
    expect(screen.getByRole("dialog", { name: "Supersede decision" })).toBeInTheDocument();
    cleanup(); renderPanel([WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.DECISION_PROPOSE]);
    await screen.findAllByText("Which export format?");
    expect(screen.queryByRole("button", { name: "Supersede decision" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve proposal" })).not.toBeInTheDocument();
  });
});
