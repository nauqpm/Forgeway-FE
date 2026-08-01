import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import StoryDraftEditor from "./StoryDraftEditor";
import StoryContractDetail from "./StoryContractDetail";
import { WORKSPACE_PERMISSIONS } from "@/modules/workspace/shared/constants/workspacePermissions";
import type { RawRequirement, StoryContent, StoryContract, StoryDraft } from "../types/storyGovernance.type";

const service = vi.hoisted(() => ({
  listRequirements: vi.fn(), listDrafts: vi.fn(), getDraft: vi.fn(), createDraft: vi.fn(), updateDraft: vi.fn(), abandonDraft: vi.fn(), rebaseDraft: vi.fn(), submitDraft: vi.fn(), getContract: vi.fn(), listVersions: vi.fn(), listDecisionProposals: vi.fn(), listDecisions: vi.fn(),
}));

vi.mock("@/modules/story-governance/services/storyGovernance.service", () => ({ storyGovernanceService: service }));

const content = (): StoryContent => ({
  problem: "Current export is manual", expectedOutcome: "Customers export safely", actors: ["Admin"],
  scope: [{ id: "scope-1", text: "Export CSV" }], outOfScope: [], businessRules: [], permissionRequirements: [], constraints: [], dependencies: [], risks: [],
});
const contract = (): StoryContract => ({ _id: "sc", workspaceId: "ws", key: "SC-1", title: "Exports", status: "active", latestStoryVersionNumber: 1, version: 1 });
const draft = (overrides: Partial<StoryDraft> = {}): StoryDraft => ({
  _id: "draft", workspaceId: "ws", storyContractId: "sc", draftRevision: 4, status: "active", content: content(),
  requirementLinks: [{ requirementId: "req", role: "PRIMARY", evidenceNote: "source" }],
  criterionInputs: [{ key: "AC-1", priority: "MUST", statement: "Exports are available", given: "Given an admin", when: "When they export", then: "Then CSV downloads", verificationMethod: "QA" }], decisionProposalIds: [], ...overrides,
});
const requirement = (overrides: Partial<RawRequirement> = {}): RawRequirement => ({ _id: "req", workspaceId: "ws", key: "REQ-1", title: "Export data", body: "", sourceType: "manual", status: "active", ...overrides });

const permissions = [WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.STORY_CREATE_DRAFT, WORKSPACE_PERMISSIONS.STORY_EDIT_DRAFT, WORKSPACE_PERMISSIONS.STORY_SUBMIT];
const renderEditor = (options: { draftId?: string; onOpenVersion?: (versionId: string) => void; queryClient?: QueryClient } = {}) => {
  const queryClient = options.queryClient ?? new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const onOpenVersion = options.onOpenVersion ?? vi.fn();
  return {
    ...render(<QueryClientProvider client={queryClient}><StoryDraftEditor workspaceId="ws" contract={contract()} draftId={options.draftId ?? "draft"} permissions={permissions} onOpenVersion={onOpenVersion} /></QueryClientProvider>),
    queryClient,
    onOpenVersion,
  };
};

describe("StoryDraftEditor", () => {
  beforeEach(() => {
    service.listRequirements.mockResolvedValue([requirement()]); service.listDrafts.mockResolvedValue([draft()]); service.getDraft.mockResolvedValue(draft()); service.createDraft.mockResolvedValue(draft({ _id: "new-draft" })); service.updateDraft.mockResolvedValue(draft({ draftRevision: 5 })); service.abandonDraft.mockResolvedValue(draft({ status: "abandoned" })); service.rebaseDraft.mockResolvedValue(draft({ _id: "rebased", draftRevision: 1 })); service.submitDraft.mockResolvedValue({ _id: "version", workspaceId: "ws", storyContractId: "sc" }); service.getContract.mockResolvedValue(contract()); service.listVersions.mockResolvedValue([]);
    service.listDecisionProposals.mockResolvedValue([
      { _id: "open-proposal", workspaceId: "ws", storyContractId: "sc", question: "Open question", options: [], state: "OPEN" },
      { _id: "approved-proposal", workspaceId: "ws", storyContractId: "sc", question: "Approved question", options: [], state: "APPROVED" },
    ]);
    service.listDecisions.mockResolvedValue([
      { _id: "decision", workspaceId: "ws", storyContractId: "sc", sourceProposalId: "approved-proposal", question: "Approved question", selectedOption: "yes", rationale: "Approved", decidedBy: "admin", decidedAt: "2026-07-30T10:00:00.000Z" },
    ]);
  });
  afterEach(() => { cleanup(); vi.clearAllMocks(); vi.restoreAllMocks(); });

  it("saves the complete draft form with its optimistic revision", async () => {
    renderEditor();
    fireEvent.click(await screen.findByRole("button", { name: "Save draft" }));
    await waitFor(() => expect(service.updateDraft).toHaveBeenCalledWith("ws", "sc", "draft", {
      expectedDraftRevision: 4, content: content(), requirementLinks: [{ requirementId: "req", role: "PRIMARY", evidenceNote: "source" }], criterionInputs: [expect.objectContaining({ key: "AC-1", priority: "MUST" })],
    }));
    expect(await screen.findByText("Saved revision 5.")).toBeInTheDocument();
  });

  it("PATCHes only an APPROVED proposal with a Decision Record after explicit selection", async () => {
    let resolveUpdate!: (value: StoryDraft) => void;
    service.updateDraft.mockReturnValueOnce(new Promise((resolve) => { resolveUpdate = resolve; }));
    service.listDecisionProposals.mockResolvedValue([
      { _id: "open-proposal", workspaceId: "ws", storyContractId: "sc", question: "Open question", options: [], state: "OPEN" },
      { _id: "approved-proposal", workspaceId: "ws", storyContractId: "sc", question: "Approved question", options: [], state: "APPROVED" },
      { _id: "orphan-approved-proposal", workspaceId: "ws", storyContractId: "sc", question: "Approved without record", options: [], state: "APPROVED" },
    ]);
    renderEditor();

    expect(await screen.findByText("OPEN · PROPOSAL")).toBeInTheDocument();
    expect(screen.getByText("Not an official decision — approval required")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Open question" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Approved without record" })).toBeDisabled();
    expect(service.updateDraft).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("checkbox", { name: "Approved question" }));

    expect(screen.getByRole("checkbox", { name: "Approved question" })).toBeChecked();
    await waitFor(() => expect(service.updateDraft).toHaveBeenCalledWith("ws", "sc", "draft", expect.objectContaining({
      expectedDraftRevision: 4,
      decisionProposalIds: ["approved-proposal"],
    })));
    resolveUpdate(draft({ draftRevision: 5, decisionProposalIds: ["approved-proposal"] }));
  });

  it("saves unrelated Draft edits without rewriting an ineligible decision attachment", async () => {
    service.listDrafts.mockResolvedValueOnce([draft({ decisionProposalIds: ["legacy-attachment"] })]);
    service.getDraft.mockResolvedValueOnce(draft({ decisionProposalIds: ["legacy-attachment"] }));
    renderEditor();

    fireEvent.change(await screen.findByLabelText("Problem"), { target: { value: "Updated problem" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => expect(service.updateDraft).toHaveBeenCalledWith("ws", "sc", "draft", expect.not.objectContaining({
      decisionProposalIds: expect.anything(),
    })));
  });

  it("distinguishes unavailable decision data from an ineligible attachment and offers retry", async () => {
    service.getDraft.mockResolvedValueOnce(draft({ decisionProposalIds: ["approved-proposal"] }));
    service.listDecisionProposals.mockRejectedValueOnce(new Error("offline"));
    service.listDecisions.mockRejectedValueOnce(new Error("offline"));
    renderEditor();

    expect(await screen.findByRole("alert")).toHaveTextContent("Decision data is unavailable");
    expect(screen.queryByText("This Draft contains an ineligible decision attachment")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit draft" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Retry decision data" }));
    await waitFor(() => expect(service.listDecisionProposals).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(service.listDecisions).toHaveBeenCalledTimes(2));
  });

  it("keeps local edits and offers server recovery after an optimistic conflict", async () => {
    service.updateDraft.mockRejectedValueOnce({ response: { data: { code: "DRAFT_REVISION_CONFLICT" } } });
    service.getDraft.mockResolvedValueOnce(draft()).mockResolvedValueOnce(draft({ draftRevision: 7, content: { ...content(), problem: "Server problem" } }));
    renderEditor();
    fireEvent.change(await screen.findByLabelText("Problem"), { target: { value: "My unsaved problem" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("This draft changed elsewhere");
    expect(screen.getByLabelText("Problem")).toHaveValue("My unsaved problem");
    expect(screen.getByRole("button", { name: "Reload server draft" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy my changes" })).toBeInTheDocument();
    expect(screen.getByText("Server revision 7 is available.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit draft" })).toBeDisabled();
  });

  it("does not expose an arbitrary backend message when saving a draft", async () => {
    service.updateDraft.mockRejectedValueOnce({
      response: { data: { message: "postgres://admin:secret@internal/drafts" } },
    });
    renderEditor();
    fireEvent.click(await screen.findByRole("button", { name: "Save draft" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not complete this draft action. Try again.",
    );
    expect(screen.queryByText(/postgres:\/\/admin:secret/)).not.toBeInTheDocument();
  });

  it("selects multiple drafts and keeps unsaved edits when navigation is cancelled", async () => {
    service.listDrafts.mockResolvedValue([draft(), draft({ _id: "second", draftRevision: 2 })]);
    service.getDraft.mockImplementation((_workspaceId: string, _contractId: string, id: string) => Promise.resolve(draft({ _id: id, draftRevision: id === "second" ? 2 : 4 })));
    renderEditor();
    fireEvent.change(await screen.findByLabelText("Problem"), { target: { value: "Keep this edit" } });
    const selector = screen.getByLabelText("Select draft");
    selector.focus();
    fireEvent.change(selector, { target: { value: "second" } });

    expect(screen.getByRole("dialog", { name: "Discard draft edits" })).toHaveAttribute("aria-modal", "true");
    await waitFor(() => expect(screen.getByRole("button", { name: "Keep editing" })).toHaveFocus());
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Discard draft edits" })).not.toBeInTheDocument();
    await waitFor(() => expect(selector).toHaveFocus());

    fireEvent.change(selector, { target: { value: "second" } });
    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByLabelText("Problem")).toHaveValue("Keep this edit");

    fireEvent.change(screen.getByLabelText("Select draft"), { target: { value: "second" } });
    fireEvent.click(screen.getByRole("button", { name: "Discard edits" }));
    await waitFor(() => expect(service.getDraft).toHaveBeenCalledWith("ws", "sc", "second"));
  });

  it("contains submission confirmation focus and restores it after Escape", async () => {
    renderEditor();
    const submit = await screen.findByRole("button", { name: "Submit draft" });
    submit.focus();
    fireEvent.click(submit);

    expect(screen.getByRole("dialog", { name: "Confirm draft submission" })).toHaveAttribute("aria-modal", "true");
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel submit" })).toHaveFocus());
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Confirm draft submission" })).not.toBeInTheDocument();
    await waitFor(() => expect(submit).toHaveFocus());
  });

  it("warns before browser navigation while edits are unsaved", async () => {
    renderEditor();
    fireEvent.change(await screen.findByLabelText("Problem"), { target: { value: "Unsaved" } });
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it("creates a draft from the contract's current approved version and safely initializes empty server content", async () => {
    const created = draft({ _id: "new-draft", baseStoryVersionId: "approved", draftRevision: 1, content: {} as StoryContent });
    service.listDrafts.mockResolvedValue([]);
    service.createDraft.mockResolvedValue(created);
    service.getDraft.mockImplementation((_workspaceId: string, _contractId: string, id: string) => Promise.resolve(id === "new-draft" ? created : draft()));
    renderEditor({ draftId: "" });

    fireEvent.click(await screen.findByRole("button", { name: "Create draft" }));
    await waitFor(() => expect(service.createDraft).toHaveBeenCalledWith("ws", "sc"));
    expect(await screen.findByText("Based on approved version approved")).toBeInTheDocument();
    expect(screen.getByLabelText("Problem")).toHaveValue("");
  });

  it.each(["submitted", "abandoned", "stale"] as const)("keeps %s drafts read-only", async (status) => {
    service.listDrafts.mockResolvedValue([draft({ status })]);
    service.getDraft.mockResolvedValue(draft({ status }));
    renderEditor();
    expect(await screen.findByLabelText("Problem")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save draft" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit draft" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Abandon draft" })).not.toBeInTheDocument();
    if (status === "stale") expect(screen.getByRole("button", { name: "Rebase draft" })).toBeInTheDocument();
  });

  it("requires one primary Requirement and prevents duplicate criteria before saving", async () => {
    renderEditor();
    await screen.findByLabelText("Problem");
    fireEvent.click(screen.getByRole("button", { name: "Remove requirement link 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Keep exactly one primary requirement");
    expect(service.updateDraft).not.toHaveBeenCalled();
  });

  it("rebases a stale draft into the returned active draft", async () => {
    service.listDrafts.mockResolvedValue([draft({ _id: "stale", status: "stale" })]); service.getDraft.mockResolvedValue(draft({ _id: "stale", status: "stale" }));
    service.rebaseDraft.mockResolvedValue(draft({ _id: "rebased", draftRevision: 1, rebaseConflicts: [{ category: "scope", entityId: "scope:one", impactLevel: "BLOCKING", resolution: "UNRESOLVED" }] }));
    service.getDraft.mockImplementation((_workspaceId: string, _contractId: string, id: string) => Promise.resolve(id === "rebased" ? draft({ _id: "rebased", draftRevision: 1, rebaseConflicts: [{ category: "scope", entityId: "scope:one", impactLevel: "BLOCKING", resolution: "UNRESOLVED" }] }) : draft({ _id: "stale", status: "stale" })));
    renderEditor();
    fireEvent.click(await screen.findByRole("button", { name: "Rebase draft" }));
    await waitFor(() => expect(service.rebaseDraft).toHaveBeenCalledWith("ws", "sc", "stale"));
    expect(await screen.findByText("Draft rebased. Review any reported conflicts before saving.")).toBeInTheDocument();
    expect(await screen.findByText("1 unresolved rebase conflict")).toBeInTheDocument();
  });

  it("abandons only the active selected draft after destructive confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderEditor();
    fireEvent.click(await screen.findByRole("button", { name: "Abandon draft" }));
    await waitFor(() => expect(service.abandonDraft).toHaveBeenCalledWith("ws", "sc", "draft"));
    expect(await screen.findByText("No Draft selected.")).toBeInTheDocument();
  });

  it("reuses a submit operation key while pending and clears it after success", async () => {
    let resolveSubmit!: (value: { _id: string; workspaceId: string; storyContractId: string }) => void;
    service.submitDraft.mockReturnValueOnce(new Promise((resolve) => { resolveSubmit = resolve; }));
    renderEditor();
    const submit = await screen.findByRole("button", { name: "Submit draft" });
    fireEvent.click(submit);
    expect(screen.getByLabelText("Select draft")).toBeDisabled();
    expect(screen.getByRole("button", { name: "New draft" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Abandon draft" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm submit" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm submit" }));
    await waitFor(() => expect(service.submitDraft).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText("Select draft")).toBeDisabled();
    expect(screen.getByRole("button", { name: "New draft" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Abandon draft" })).toBeDisabled();
    const key = service.submitDraft.mock.calls[0][3];
    act(() => resolveSubmit({ _id: "version", workspaceId: "ws", storyContractId: "sc" }));
    await waitFor(() => expect(screen.getByText("Draft submitted.")).toBeInTheDocument());
    service.submitDraft.mockResolvedValueOnce({ _id: "version-2", workspaceId: "ws", storyContractId: "sc" });
    fireEvent.click(screen.getByRole("button", { name: "Submit draft" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm submit" }));
    await waitFor(() => expect(service.submitDraft.mock.calls[1][3]).not.toBe(key));
  });

  it("does not submit unsaved local edits into a stale immutable version", async () => {
    renderEditor();
    fireEvent.change(await screen.findByLabelText("Problem"), { target: { value: "Unsaved problem" } });
    expect(screen.getByText("Save changes before submitting.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit draft" })).toBeDisabled();
    expect(service.submitDraft).not.toHaveBeenCalled();
  });

  it("reuses the same operation key for a network retry and clears it when submit is cancelled", async () => {
    service.submitDraft
      .mockRejectedValueOnce(new Error("network"))
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ _id: "version", workspaceId: "ws", storyContractId: "sc" });
    renderEditor();
    fireEvent.click(await screen.findByRole("button", { name: "Submit draft" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm submit" }));
    await screen.findByRole("alert");
    const firstKey = service.submitDraft.mock.calls[0][3];

    fireEvent.click(screen.getByRole("button", { name: "Submit draft" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm submit" }));
    await waitFor(() => expect(service.submitDraft.mock.calls[1][3]).toBe(firstKey));
    await screen.findByRole("alert");

    fireEvent.click(screen.getByRole("button", { name: "Submit draft" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel submit" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit draft" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm submit" }));
    await waitFor(() => expect(service.submitDraft.mock.calls[2][3]).not.toBe(firstKey));
  });

  it("submits the selected version and invalidates every affected Story cache", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const onOpenVersion = vi.fn();
    renderEditor({ queryClient, onOpenVersion });
    fireEvent.click(await screen.findByRole("button", { name: "Submit draft" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm submit" }));
    await waitFor(() => expect(onOpenVersion).toHaveBeenCalledWith("version"));
    const keys = invalidate.mock.calls.map(([options]) => JSON.stringify(options?.queryKey));
    expect(keys).toEqual(expect.arrayContaining([
      JSON.stringify(["story-governance", "ws", "contracts", "sc", "drafts"]),
      JSON.stringify(["story-governance", "ws", "contracts", "sc", "versions"]),
      JSON.stringify(["story-governance", "ws", "contracts", "sc"]),
      JSON.stringify(["story-governance", "ws", "contracts", "sc", "criteria"]),
      JSON.stringify(["story-governance", "ws", "contracts", "sc", "approvals"]),
    ]));
  });

  it("retains stable row IDs through edit and keyboard reorder without rendering raw HTML", async () => {
    service.getDraft.mockResolvedValue(draft({ content: { ...content(), scope: [{ id: "one", text: "<img src=x>" }, { id: "two", text: "Second" }] } }));
    renderEditor();
    expect(await screen.findByLabelText("Scope 1")).toHaveValue("<img src=x>");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Scope 2"), { target: { value: "Updated second" } });
    fireEvent.click(screen.getByRole("button", { name: "Move Scope 2 up" }));
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() => expect(service.updateDraft.mock.calls.at(-1)?.[3].content.scope).toEqual([
      { id: "two", text: "Updated second" },
      { id: "one", text: "<img src=x>" },
    ]));
  });

  it("flags both duplicate criterion keys and removes criteria without issuing delete calls", async () => {
    renderEditor();
    await screen.findByLabelText("Problem");
    fireEvent.click(screen.getByRole("button", { name: "Add criterion" }));
    fireEvent.change(screen.getByLabelText("Criterion key 2"), { target: { value: "AC-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Acceptance criterion keys must be unique");
    expect(screen.getByLabelText("Criterion key 1")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Criterion key 2")).toHaveAttribute("aria-invalid", "true");
    fireEvent.click(screen.getByRole("button", { name: "Remove criterion 2" }));
    expect(service.updateDraft).not.toHaveBeenCalled();
  });

  it("keeps archived historical requirements but excludes them from new links and retains role evidence", async () => {
    service.listRequirements.mockResolvedValue([
      requirement(),
      requirement({ _id: "active-2", key: "REQ-2" }),
      requirement({ _id: "archived", key: "REQ-OLD", status: "archived" }),
    ]);
    service.listDrafts.mockResolvedValue([draft({ requirementLinks: [{ requirementId: "archived", role: "PRIMARY", evidenceNote: "historical" }] })]);
    service.getDraft.mockResolvedValue(draft({ requirementLinks: [{ requirementId: "archived", role: "PRIMARY", evidenceNote: "historical" }] }));
    renderEditor();
    expect(await screen.findByRole("option", { name: /REQ-OLD.*archived/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add requirement link" }));
    const newRequirement = screen.getByLabelText("Requirement 2");
    expect(within(newRequirement).queryByRole("option", { name: /REQ-OLD/ })).not.toBeInTheDocument();
    fireEvent.change(newRequirement, { target: { value: "active-2" } });
    fireEvent.change(screen.getByLabelText("Relationship 2"), { target: { value: "CONSTRAINT" } });
    fireEvent.change(screen.getByLabelText("Evidence note 2"), { target: { value: "constraint source" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() => expect(service.updateDraft.mock.calls.at(-1)?.[3].requirementLinks[1]).toEqual({
      requirementId: "active-2",
      role: "CONSTRAINT",
      evidenceNote: "constraint source",
    }));
  });

  it("integrates the draft editor into the responsive contract detail pane", async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
        <StoryContractDetail workspaceId="ws" contract={contract()} section="drafts" permissions={permissions} onSectionChange={vi.fn()} onOpenVersion={vi.fn()} />
      </QueryClientProvider>,
    );
    expect(await screen.findByRole("region", { name: "Story draft editor" })).toHaveClass("min-w-0");
    expect(screen.getByRole("navigation", { name: "Story contract sections" })).toBeInTheDocument();
  });

  it("resets draft selection when the detail pane switches contracts", async () => {
    const secondContract = { ...contract(), _id: "sc-2", key: "SC-2", title: "Billing" };
    service.listDrafts.mockImplementation((_workspaceId: string, contractId: string) => Promise.resolve([
      draft({ _id: contractId === "sc-2" ? "draft-2" : "draft", storyContractId: contractId }),
    ]));
    service.getDraft.mockImplementation((_workspaceId: string, contractId: string, id: string) => Promise.resolve(
      draft({ _id: id, storyContractId: contractId }),
    ));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const view = render(
      <QueryClientProvider client={queryClient}>
        <StoryContractDetail workspaceId="ws" contract={contract()} section="drafts" permissions={permissions} onSectionChange={vi.fn()} onOpenVersion={vi.fn()} />
      </QueryClientProvider>,
    );
    await screen.findByLabelText("Problem");
    view.rerender(
      <QueryClientProvider client={queryClient}>
        <StoryContractDetail workspaceId="ws" contract={secondContract} section="drafts" permissions={permissions} onSectionChange={vi.fn()} onOpenVersion={vi.fn()} />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(service.getDraft).toHaveBeenCalledWith("ws", "sc-2", "draft-2"));
  });
});
