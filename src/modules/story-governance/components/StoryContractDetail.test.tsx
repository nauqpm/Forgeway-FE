import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WORKSPACE_PERMISSIONS } from "@/modules/workspace/shared/constants/workspacePermissions";
import StoryContractDetail from "./StoryContractDetail";
import type { StoryContract, StoryVersion } from "../types/storyGovernance.type";

const state = vi.hoisted(() => ({
  versions: { data: [] as StoryVersion[], isLoading: false, isError: false, refetch: vi.fn() },
}));

vi.mock("../hooks/useStoryGovernance", () => ({
  useStoryVersions: () => ({ versions: state.versions }),
}));
vi.mock("./StoryCriteriaPanel", () => ({
  default: ({ selectedVersion, permissions }: { selectedVersion: StoryVersion; permissions: string[] }) => <>
    <p>Criteria for Version {selectedVersion.versionNumber}</p>
    {permissions.includes(WORKSPACE_PERMISSIONS.CRITERION_SUBMIT_VERIFICATION) && <button>Add verification evidence</button>}
  </>,
}));
vi.mock("./StoryDecisionsPanel", () => ({
  default: ({ permissions }: { permissions: string[] }) => <>
    <p>Decisions</p>
    {permissions.includes(WORKSPACE_PERMISSIONS.DECISION_PROPOSE) && <><button>New proposal</button><button>Edit proposal</button></>}
    {permissions.includes(WORKSPACE_PERMISSIONS.DECISION_APPROVE) && <><button>Approve proposal</button><button>Supersede decision</button></>}
  </>,
}));
vi.mock("./StoryDraftEditor", () => ({ default: () => <p>Drafts</p> }));
vi.mock("./StoryApprovalsPanel", () => ({ default: () => <p>Approvals</p> }));
vi.mock("./StoryVersionWorkspace", () => ({ default: () => <p>Versions</p> }));

const contract = (overrides: Partial<StoryContract> = {}): StoryContract => ({
  _id: "contract-1", workspaceId: "workspace-1", key: "STORY-1", title: "Login", status: "active", latestStoryVersionNumber: 1, version: 1, ...overrides,
});
const version = (): StoryVersion => ({
  _id: "version-1", workspaceId: "workspace-1", storyContractId: "contract-1", sourceDraftId: "draft-1", versionNumber: 1,
  contentSnapshot: { problem: "", expectedOutcome: "", actors: [], scope: [], outOfScope: [], businessRules: [], permissionRequirements: [], constraints: [], dependencies: [], risks: [] }, requirementLinkSnapshot: [], criteria: [], decisionRecordIds: [], contentHash: "hash",
});
const renderCriteria = () => render(<StoryContractDetail workspaceId="workspace-1" contract={contract()} section="criteria" permissions={[WORKSPACE_PERMISSIONS.STORY_READ]} onSectionChange={vi.fn()} onOpenVersion={vi.fn()} />);

describe("StoryContractDetail criteria section", () => {
  beforeEach(() => {
    state.versions.data = [];
    state.versions.isLoading = false;
    state.versions.isError = false;
    state.versions.refetch.mockReset();
  });
  afterEach(cleanup);

  it("keeps loading, retryable failure, and genuine empty Version states distinct", () => {
    state.versions.isLoading = true;
    const loading = renderCriteria();
    expect(screen.getByText("Loading Versions…")).toBeInTheDocument();
    loading.unmount();

    state.versions.isLoading = false;
    state.versions.isError = true;
    const failed = renderCriteria();
    expect(screen.getByRole("alert")).toHaveTextContent("Criteria cannot be loaded because Version history is unavailable.");
    fireEvent.click(screen.getByRole("button", { name: "Retry Versions" }));
    expect(state.versions.refetch).toHaveBeenCalledTimes(1);
    failed.unmount();

    state.versions.isError = false;
    const empty = renderCriteria();
    expect(screen.getByText("No immutable Versions are available for criteria evidence.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    empty.unmount();

    state.versions.data = [version()];
    renderCriteria();
    expect(screen.getByText("Criteria for Version 1")).toBeInTheDocument();
  });

  it("strips every Decision and evidence mutation from archived Contracts", () => {
    const permissions = [
      WORKSPACE_PERMISSIONS.DECISION_PROPOSE,
      WORKSPACE_PERMISSIONS.DECISION_APPROVE,
      WORKSPACE_PERMISSIONS.CRITERION_SUBMIT_VERIFICATION,
    ];
    const decisions = render(<StoryContractDetail workspaceId="workspace-1" contract={contract({ status: "archived" })} section="decisions" permissions={permissions} onSectionChange={vi.fn()} onOpenVersion={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "New proposal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit proposal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve proposal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Supersede decision" })).not.toBeInTheDocument();
    decisions.unmount();

    state.versions.data = [version()];
    render(<StoryContractDetail workspaceId="workspace-1" contract={contract({ status: "archived" })} section="criteria" permissions={permissions} onSectionChange={vi.fn()} onOpenVersion={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Add verification evidence" })).not.toBeInTheDocument();
  });
});
