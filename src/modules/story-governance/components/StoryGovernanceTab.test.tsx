import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import StoryGovernanceTab from "./StoryGovernanceTab";
import Tabs from "@/modules/workspace/shared/components/Tabs";
import WorkspaceContent from "@/modules/workspace/shared/components/WorkspaceContent";
import WorkspacePage from "@/modules/workspace/shared/components/WorkspacePage";
import { useWorkspaceTabRouter } from "@/modules/workspace/shared/hooks/useWorkspaceTabRouter";
import { WORKSPACE_PERMISSIONS } from "@/modules/workspace/shared/constants/workspacePermissions";
import type { WorkspacePermission } from "@/modules/workspace/shared/constants/workspacePermissions";
import type { RawRequirement, StoryContract } from "../types/storyGovernance.type";
import type { Workspace } from "@/modules/workspace/shared/types/workspace.type";
import {
  registerDraftNavigationPrompt,
  setDraftNavigationDirty,
} from "../utils/storyGovernance";

const service = vi.hoisted(() => ({
  listRequirements: vi.fn(),
  getRequirement: vi.fn(),
  listContracts: vi.fn(),
  createRequirement: vi.fn(),
  archiveRequirement: vi.fn(),
  createContract: vi.fn(),
  archiveContract: vi.fn(),
  listDrafts: vi.fn(),
  getDraft: vi.fn(),
  createDraft: vi.fn(),
  updateDraft: vi.fn(),
  abandonDraft: vi.fn(),
  rebaseDraft: vi.fn(),
  submitDraft: vi.fn(),
}));
const renderLazyStories = vi.hoisted(() => vi.fn());

vi.mock("@/modules/story-governance/services/storyGovernance.service", () => ({
  storyGovernanceService: service,
}));

vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<unknown>) => {
    const isStoryGovernance = loader.toString().includes("StoryGovernanceTab");
    return (props: Record<string, unknown>) => {
      if (!isStoryGovernance) return null;
      renderLazyStories(props);
      return <div data-testid="lazy-stories" />;
    };
  },
}));

vi.mock("@/shared/components/OverflowTabs", () => {
  const Root = ({ children }: { children: React.ReactNode }) => <div role="tablist">{children}</div>;
  const Item = ({ children, onSelect }: { children: React.ReactNode; onSelect: () => void }) => (
    <button type="button" onClick={onSelect}>{children}</button>
  );
  return { OverflowTabs: Object.assign(Root, { Item }) };
});

vi.mock("@/modules/workspace/shared/components/Header", () => ({ default: () => null }));
vi.mock("@/modules/workspace/shared/components/WorkspaceModals", () => ({ default: () => null }));
vi.mock("@/modules/workspace/tasks/import/ImportCsvModal", () => ({ default: () => null }));

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

const contract = (overrides: Partial<StoryContract> = {}): StoryContract => ({
  _id: "contract-1",
  workspaceId: "workspace-id",
  key: "SC-1",
  title: "Export contract",
  status: "active",
  latestStoryVersionNumber: 0,
  version: 1,
  ...overrides,
});

const renderTab = (permissions: WorkspacePermission[] = [WORKSPACE_PERMISSIONS.STORY_READ]) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
      <StoryGovernanceTab workspaceId="workspace-id" workspaceKey="ABC" currentUserId="user-id" permissions={permissions} />
    </QueryClientProvider>,
  );

describe("StoryGovernanceTab", () => {
  beforeEach(() => {
    service.listRequirements.mockResolvedValue([]);
    service.getRequirement.mockImplementation((_workspaceId: string, requirementId: string) => Promise.resolve(requirement({ _id: requirementId })));
    service.listContracts.mockResolvedValue([]);
    service.createRequirement.mockResolvedValue(requirement());
    service.archiveRequirement.mockResolvedValue(requirement({ status: "archived" }));
    service.createContract.mockResolvedValue({ contract: contract(), draft: { _id: "draft-1" } });
    service.archiveContract.mockResolvedValue(contract({ status: "archived" }));
    service.listDrafts.mockResolvedValue([]);
    service.getDraft.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    window.history.replaceState(null, "", "/");
    setDraftNavigationDirty(false);
  });

  it("shows a local forbidden state without starting protected queries", () => {
    renderTab([]);
    expect(screen.getByText("You do not have access to Stories in this workspace.")).toBeInTheDocument();
    expect(service.listRequirements).not.toHaveBeenCalled();
    expect(service.listContracts).not.toHaveBeenCalled();
  });

  it("uses a master-detail workspace shell without mobile panel navigation", () => {
    renderTab();

    expect(screen.getByTestId("story-workspace")).toHaveAttribute(
      "data-story-layout",
      "master-detail",
    );
    expect(screen.queryByRole("navigation", { name: "Story workspace panels" })).not.toBeInTheDocument();
  });

  it("opens Requirements in a dialog from the workspace toolbar", async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(screen.getByRole("button", { name: "Requirements" }));
    const dialog = screen.getByRole("dialog", { name: "Requirements" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getAllByRole("heading", { name: "Requirements" })[0]).toBeInTheDocument();
  });

  it("filters Contracts from the toolbar and opens creation in a dialog", async () => {
    const user = userEvent.setup();
    service.listRequirements.mockResolvedValue([requirement()]);
    service.listContracts.mockResolvedValue([
      contract({ _id: "contract-checkout", key: "SC-1", title: "Checkout contract" }),
      contract({ _id: "contract-profile", key: "SC-2", title: "Profile contract" }),
    ]);
    renderTab([WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.STORY_CREATE]);

    await user.type(await screen.findByRole("searchbox", { name: "Search story contracts" }), "checkout");
    const contractsPanel = (await screen.findByRole("heading", { name: "Story contracts" })).closest("section");
    expect(contractsPanel).not.toBeNull();
    expect(within(contractsPanel!).getByText("Checkout contract")).toBeInTheDocument();
    expect(within(contractsPanel!).queryByText("Profile contract")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New contract" }));
    expect(screen.getByRole("dialog", { name: "Create story contract" })).toBeInTheDocument();
  });

  it("disables New contract while Contracts are loading or unavailable", async () => {
    const user = userEvent.setup();
    service.listRequirements.mockResolvedValue([requirement()]);
    service.listContracts.mockReturnValue(new Promise(() => undefined));
    const loading = renderTab([WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.STORY_CREATE]);

    const loadingButton = screen.getByRole("button", { name: "New contract" });
    expect(loadingButton).toBeDisabled();
    await user.click(loadingButton);
    expect(screen.queryByRole("dialog", { name: "Create story contract" })).not.toBeInTheDocument();
    loading.unmount();

    service.listContracts.mockRejectedValueOnce({ response: { status: 500 } });
    renderTab([WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.STORY_CREATE]);
    await screen.findByText("Story contracts could not be loaded. Refresh the page to try again.");
    const unavailableButton = screen.getByRole("button", { name: "New contract" });
    expect(unavailableButton).toBeDisabled();
    await user.click(unavailableButton);
    expect(screen.queryByRole("dialog", { name: "Create story contract" })).not.toBeInTheDocument();
  });

  it("keeps New contract unavailable without an active Requirement and offers Requirements instead", async () => {
    const user = userEvent.setup();
    renderTab([WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.STORY_CREATE]);

    await screen.findByText(/No story contracts yet/);
    const create = screen.getByRole("button", { name: "New contract" });
    expect(create).toBeDisabled();
    await user.click(create);
    expect(screen.queryByRole("dialog", { name: "Create story contract" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open requirements" })).toBeInTheDocument();
  });

  it("offers Requirements from the empty Contract state when no active Requirement exists", async () => {
    renderTab([WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.STORY_CREATE]);

    expect(await screen.findByRole("button", { name: "Open requirements" })).toBeInTheDocument();
    expect(screen.queryByText("Create an active requirement before creating a story contract.")).not.toBeInTheDocument();
  });

  it("returns to the Contract index without changing the selected Contract URL", async () => {
    const user = userEvent.setup();
    service.listRequirements.mockResolvedValue([requirement()]);
    service.listContracts.mockResolvedValue([contract()]);
    renderTab();

    await user.click(await screen.findByRole("button", { name: /SC-1 Export contract/ }));
    await screen.findByRole("button", { name: "Back to contracts" });
    const selectedUrl = window.location.search;

    await user.click(screen.getByRole("button", { name: "Back to contracts" }));
    expect(screen.queryByRole("button", { name: "Back to contracts" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Story contracts" })).toBeInTheDocument();
    expect(window.location.search).toBe(selectedUrl);
  });

  it("keeps the Contract index visible while a URL-selected Contract is loading", () => {
    window.history.replaceState(null, "", "/workspaces/ABC/stories?contract=contract-1");
    service.listContracts.mockReturnValue(new Promise(() => undefined));
    renderTab();

    const loading = screen.getByLabelText("Story contracts loading");
    const contractPanel = loading.closest("[data-story-mobile-panel='contracts']");
    expect(contractPanel).not.toHaveClass("hidden");
    expect(screen.getByRole("button", { name: "Contract list" })).toBeInTheDocument();
  });

  it("keeps the Contract index visible when a URL-selected Contract cannot load", async () => {
    window.history.replaceState(null, "", "/workspaces/ABC/stories?contract=contract-1");
    service.listContracts.mockRejectedValueOnce({ response: { status: 500 } });
    renderTab();

    const error = await screen.findByText("Story contracts could not be loaded. Refresh the page to try again.");
    const contractPanel = error.closest("[data-story-mobile-panel='contracts']");
    expect(contractPanel).not.toHaveClass("hidden");
    expect(screen.getByRole("button", { name: "Contract list" })).toBeInTheDocument();
  });

  it("keeps the Contract index visible when a URL-selected Contract no longer exists", async () => {
    window.history.replaceState(null, "", "/workspaces/ABC/stories?contract=deleted-contract");
    service.listContracts.mockResolvedValue([contract()]);
    renderTab();

    await screen.findByRole("button", { name: /SC-1 Export contract/ });
    expect(screen.queryByRole("button", { name: "Back to contracts" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Story contracts" })).toBeInTheDocument();
  });

  it("renders status-specific loading, error, and empty states", async () => {
    service.listRequirements.mockReturnValue(new Promise(() => undefined));
    const first = renderTab();
    fireEvent.click(screen.getByRole("button", { name: "Requirements" }));
    expect(screen.getByLabelText("Requirements loading")).toBeInTheDocument();
    expect(screen.getByLabelText("Story contracts loading")).toBeInTheDocument();
    first.unmount();

    service.listRequirements.mockResolvedValue([]);
    service.listContracts.mockRejectedValueOnce({ response: { status: 500 } });
    const failed = renderTab();
    fireEvent.click(screen.getByRole("button", { name: "Requirements" }));
    expect(await screen.findByRole("alert", { name: "" })).toHaveTextContent("Story contracts could not be loaded");
    expect(screen.getByText(/No requirements yet/)).toBeInTheDocument();
    failed.unmount();

    service.listContracts.mockResolvedValueOnce([]);
    renderTab();
    expect(await screen.findByText(/No story contracts yet/)).toBeInTheDocument();
  });

  it("keeps the selected Contract while viewing its Requirement detail", async () => {
    service.listRequirements.mockResolvedValue([requirement()]);
    service.listContracts.mockResolvedValue([contract()]);
    renderTab();

    const contractDetail = await screen.findByLabelText("Selected story contract");
    fireEvent.click(screen.getByRole("button", { name: "Requirements" }));
    const requirementButton = await screen.findByRole("button", { name: /REQ-1 Customer export/ });
    act(() => requirementButton.click());
    const detail = screen.getByLabelText("Selected requirement");
    expect(await within(detail).findByText("Customers can export their data.")).toBeInTheDocument();
    expect(within(screen.getByLabelText("Selected story contract")).getByRole("heading", { name: "Export contract" })).toBeInTheDocument();
    expect(contractDetail).toBeInTheDocument();
  });

  it("replaces an incomplete list item with the production Requirement detail", async () => {
    service.listRequirements.mockResolvedValue([
      requirement({ title: "List title", body: "" }),
    ]);
    service.getRequirement.mockResolvedValue(
      requirement({ title: "Authoritative title", body: "Authoritative requirement body." }),
    );
    renderTab();

    fireEvent.click(screen.getByRole("button", { name: "Requirements" }));
    fireEvent.click(await screen.findByRole("button", { name: /REQ-1 List title/ }));
    const detail = await screen.findByLabelText("Selected requirement");
    expect(await within(detail).findByRole("heading", { name: "Authoritative title" })).toBeInTheDocument();
    expect(within(detail).getByText("Authoritative requirement body.")).toBeInTheDocument();
    expect(service.getRequirement).toHaveBeenCalledWith("workspace-id", "requirement-1");
  });

  it("uses an archived-specific empty state without active creation guidance", async () => {
    service.listRequirements.mockResolvedValue([requirement()]);
    service.listContracts.mockResolvedValue([contract()]);
    renderTab();
    const contractsPanel = (await screen.findByRole("heading", { name: "Story contracts" })).closest("section");
    expect(contractsPanel).not.toBeNull();
    fireEvent.click(within(contractsPanel!).getByRole("button", { name: "Archived" }));
    expect(screen.getByText("No archived story contracts.")).toBeInTheDocument();
    expect(screen.queryByText(/Create one from an active primary requirement/)).not.toBeInTheDocument();
  });

  it("keeps archived Contracts visually distinct and readable", async () => {
    service.listContracts.mockResolvedValue([
      contract({ _id: "contract-archived", key: "SC-2", title: "Archived contract", status: "archived" }),
    ]);
    renderTab();

    const contractsPanel = (await screen.findByRole("heading", { name: "Story contracts" })).closest("section");
    expect(contractsPanel).not.toBeNull();
    fireEvent.click(within(contractsPanel!).getByRole("button", { name: "Archived" }));
    const row = (await within(contractsPanel!).findByRole("button", { name: /SC-2 Archived contract/ })).parentElement;
    expect(row).toHaveClass("border-dashed");
  });

  it("routes a pending-approval archive error for a non-selected Contract to that exact Contract", async () => {
    service.listContracts.mockResolvedValue([
      contract(),
      contract({ _id: "contract-2", key: "SC-2", title: "Billing contract" }),
    ]);
    service.archiveContract.mockRejectedValueOnce({
      response: {
        data: {
          code: "STORY_PENDING_APPROVAL_EXISTS",
          message: "postgres://admin:secret@internal/contracts",
        },
      },
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderTab([WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.STORY_ARCHIVE]);

    const archiveButton = await screen.findByRole("button", { name: "Archive contract SC-2" });
    act(() => archiveButton.click());
    const approvals = await screen.findByRole("button", { name: "Open Approvals" });
    expect(screen.getByRole("alert")).toHaveTextContent("This contract cannot be archived while approvals are pending.");
    expect(screen.queryByText(/postgres:\/\/admin:secret/)).not.toBeInTheDocument();
    act(() => approvals.click());

    await waitFor(() => expect(window.location.search).toBe("?contract=contract-2&section=approvals"));
    expect(within(screen.getByLabelText("Selected story contract")).getByRole("heading", { name: "Billing contract" })).toBeInTheDocument();
  });

  it("clears pending-approval recovery after a later archive succeeds", async () => {
    service.listContracts.mockResolvedValue([contract()]);
    service.archiveContract
      .mockRejectedValueOnce({ response: { data: { code: "STORY_PENDING_APPROVAL_EXISTS" } } })
      .mockResolvedValueOnce(contract({ status: "archived" }));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderTab([WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.STORY_ARCHIVE]);

    const archiveButton = await screen.findByRole("button", { name: "Archive contract SC-1" });
    fireEvent.click(archiveButton);
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Archive contract SC-1" }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("restores Contract ID and section from URL state without exposing content", async () => {
    service.listContracts.mockResolvedValue([
      contract(),
      contract({ _id: "contract-2", key: "SC-2", title: "Private title" }),
    ]);
    window.history.replaceState(null, "", "/workspaces/ABC/stories?contract=contract-2&section=versions");
    renderTab();

    expect(await screen.findByRole("heading", { name: "Private title" })).toBeInTheDocument();
    expect(window.location.search).toBe("?contract=contract-2&section=versions");
    expect(window.location.href).not.toContain("Private%20title");
  });

  it("keeps unsaved Draft edits when section navigation is cancelled", async () => {
    const activeDraft = {
      _id: "draft-1",
      workspaceId: "workspace-id",
      storyContractId: "contract-1",
      draftRevision: 1,
      status: "active",
      content: {},
      requirementLinks: [],
      criterionInputs: [],
      decisionProposalIds: [],
    };
    service.listRequirements.mockResolvedValue([requirement()]);
    service.listContracts.mockResolvedValue([contract()]);
    service.listDrafts.mockResolvedValue([activeDraft]);
    service.getDraft.mockResolvedValue(activeDraft);
    window.history.replaceState(null, "", "/workspaces/ABC/stories?contract=contract-1&section=drafts");
    renderTab([WORKSPACE_PERMISSIONS.STORY_READ, WORKSPACE_PERMISSIONS.STORY_EDIT_DRAFT]);

    fireEvent.change(await screen.findByLabelText("Problem"), { target: { value: "Unsaved problem" } });
    fireEvent.click(screen.getByRole("button", { name: "Versions" }));
    expect(screen.getByRole("dialog", { name: "Discard Story draft edits" })).toBeInTheDocument();
    expect(window.location.search).toBe("?contract=contract-1&section=drafts");

    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByLabelText("Problem")).toHaveValue("Unsaved problem");
    fireEvent.click(screen.getByRole("button", { name: "Versions" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard edits" }));
    await waitFor(() => expect(window.location.search).toBe("?contract=contract-1&section=versions"));
  });
});

describe("Workspace Stories integration", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/");
    setDraftNavigationDirty(false);
  });

  const workspace: Workspace = {
    _id: "workspace-id",
    key: "ABC",
    name: "Workspace",
    template: "kanban",
  };

  it("shows the Stories tab only with story:read", () => {
    const setActiveTab = vi.fn();
    const reader = render(
      <Tabs
        workspace={workspace}
        activeTab="board"
        setActiveTab={setActiveTab}
        permissions={[WORKSPACE_PERMISSIONS.STORY_READ]}
      />,
    );
    act(() => screen.getByRole("button", { name: "Stories" }).click());
    expect(setActiveTab).toHaveBeenCalledWith("stories");
    reader.unmount();

    render(<Tabs workspace={workspace} activeTab="board" setActiveTab={setActiveTab} permissions={[]} />);
    expect(screen.queryByRole("button", { name: "Stories" })).not.toBeInTheDocument();
  });

  it("lazy mounts Stories with the resolved workspace, route, user, and permissions props", () => {
    const storyGovernanceProps = {
      workspaceId: "workspace-id",
      workspaceKey: "ABC",
      currentUserId: "user-id",
      permissions: [WORKSPACE_PERMISSIONS.STORY_READ],
    };
    render(
      <WorkspaceContent
        activeTab="stories"
        workspace={workspace}
        workspaceId="workspace-id"
        boardProps={{}}
        backlogProps={{}}
        timelineProps={{}}
        listProps={{}}
        summaryProps={{}}
        calendarProps={{}}
        archiveProps={{}}
        membersProps={{ workspaceId: "workspace-id", isAdmin: false }}
        reportsProps={{
          workspaceId: "workspace-id",
          workspaceKey: "ABC",
          onSelectTask: vi.fn(),
          workspaceType: "kanban",
        }}
        storyGovernanceProps={storyGovernanceProps}
      />,
    );

    expect(screen.getByTestId("lazy-stories")).toBeInTheDocument();
    expect(renderLazyStories).toHaveBeenCalledWith(storyGovernanceProps);
  });

  it("resolves the Story Governance props from WorkspacePage", () => {
    const permissions = [WORKSPACE_PERMISSIONS.STORY_READ];
    render(
      <QueryClientProvider client={new QueryClient()}>
        <WorkspacePage
          {...({
            workspace,
            loading: false,
            isBoardLoading: false,
            isTaskBoardFetching: false,
            tasksError: null,
            activeTab: "stories",
            handleTabChange: vi.fn(),
            handleWorkspaceUpdated: vi.fn(),
            workspacePermissions: { permissions },
            user: { id: "user-id" },
            filters: {},
            setFilters: vi.fn(),
            issues: [],
            setIssues: vi.fn(),
            sprints: [],
            columns: [],
            setColumns: vi.fn(),
            filteredIssues: [],
            archivedItems: [],
            selectedTaskIds: [],
            setSelectedTaskIds: vi.fn(),
            uniqueAssignees: [],
            bulkActionMembers: [],
            showCreateIssue: false,
            isSprintModalOpen: false,
            showCreateColumn: false,
            listGridDrawerOpen: false,
            isFilterOpen: false,
            canCreateTask: false,
            canEditTask: false,
            canDeleteTask: false,
            canMoveTask: false,
            canManageSprint: false,
            canUpdateWorkspace: false,
            isWorkspaceAdmin: false,
          } as unknown as React.ComponentProps<typeof WorkspacePage>)}
        />
      </QueryClientProvider>,
    );

    expect(renderLazyStories).toHaveBeenCalledWith({
      workspaceId: "workspace-id",
      workspaceKey: "ABC",
      currentUserId: "user-id",
      permissions,
    });
  });

  it("keeps Stories active through browser popstate and writes its route on selection", () => {
    const workspaceRef = { current: workspace };
    const onSelectIssue = vi.fn();
    const onSelectTaskKey = vi.fn();
    const onSetListGridDrawerOpen = vi.fn();
    const { result } = renderHook(() =>
      useWorkspaceTabRouter({
        workspaceKey: "ABC",
        tab: ["board"],
        workspace: workspaceRef,
        onSelectIssue,
        onSelectTaskKey,
        onSetListGridDrawerOpen,
      }),
    );

    act(() => result.current.handleTabChange("stories"));
    expect(result.current.activeTab).toBe("stories");
    expect(window.location.pathname).toBe("/workspaces/ABC/stories");

    act(() => {
      window.history.replaceState(null, "", "/workspaces/ABC/board");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current.activeTab).toBe("board");

    act(() => {
      window.history.replaceState(null, "", "/workspaces/ABC/stories");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current.activeTab).toBe("stories");
  });

  it("guards workspace tab changes and preserves blocked popstate history while a Story Draft is dirty", async () => {
    let continueNavigation: (() => void) | null = null;
    const unregister = registerDraftNavigationPrompt((next) => { continueNavigation = next; });
    window.history.replaceState(null, "", "/workspaces/ABC/stories?contract=contract-1&section=drafts");
    const workspaceRef = { current: workspace };
    const { result } = renderHook(() =>
      useWorkspaceTabRouter({
        workspaceKey: "ABC",
        tab: ["stories"],
        workspace: workspaceRef,
        onSelectIssue: vi.fn(),
        onSelectTaskKey: vi.fn(),
        onSetListGridDrawerOpen: vi.fn(),
      }),
    );

    act(() => setDraftNavigationDirty(true));
    act(() => result.current.handleTabChange("board"));
    expect(result.current.activeTab).toBe("stories");
    expect(window.location.pathname).toBe("/workspaces/ABC/stories");
    act(() => { setDraftNavigationDirty(false); continueNavigation?.(); });
    expect(result.current.activeTab).toBe("board");

    act(() => result.current.handleTabChange("stories"));
    act(() => setDraftNavigationDirty(true));
    const pushState = vi.spyOn(window.history, "pushState");
    act(() => {
      window.history.replaceState(null, "", "/workspaces/ABC/board");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current.activeTab).toBe("stories");
    expect(window.location.pathname).toBe("/workspaces/ABC/stories");
    expect(pushState).toHaveBeenCalledWith(
      null,
      "",
      "/workspaces/ABC/stories",
    );

    act(() => {
      setDraftNavigationDirty(false);
      window.history.back();
    });
    await waitFor(() => {
      expect(result.current.activeTab).toBe("board");
      expect(window.location.pathname).toBe("/workspaces/ABC/board");
    });
    unregister();
  });
});
