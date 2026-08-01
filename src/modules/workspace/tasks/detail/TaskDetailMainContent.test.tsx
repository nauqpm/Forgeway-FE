import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { storyGovernanceService } from "@/modules/story-governance/services/storyGovernance.service";
import type { TaskDetailResponse } from "@/modules/workspace/shared/types/task-detail.type";
import TaskDetailMainContent from "./TaskDetailMainContent";

const permissionState = vi.hoisted(() => ({
  role: "viewer" as string | null,
  hasPermission: vi.fn(() => false),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ key: "TEAM-ALPHA" }),
}));
vi.mock("@/modules/workspace/shared/hooks/useWorkspacePermission", () => ({
  useWorkspacePermission: () => permissionState,
}));
vi.mock("@/modules/admin-shared/components/common/components/TaskDescription", () => ({
  default: () => null,
}));
vi.mock("@/modules/workspace/tasks/attachments/TaskAttachmentsPanel", () => ({
  default: () => null,
}));
vi.mock("@/modules/workspace/shared/components/TaskComments", () => ({
  default: () => null,
}));
vi.mock("@/modules/workspace/shared/components/TaskActivityHistory", () => ({
  default: () => null,
}));
vi.mock("@/modules/workspace/shared/components/TaskWorkLogs", () => ({
  default: () => null,
}));
vi.mock("@/modules/story-governance/services/storyGovernance.service", () => ({
  storyGovernanceService: {
    getContract: vi.fn(),
    getVersion: vi.fn(),
    getTaskImpact: vi.fn(),
    resolveTaskImpact: vi.fn(),
  },
}));

describe("TaskDetailMainContent", () => {
  beforeEach(() => {
    permissionState.role = "viewer";
    permissionState.hasPermission.mockReturnValue(false);
  });
  afterEach(cleanup);

  it("uses the real workspace route key for the Story Contract link", () => {
    vi.mocked(storyGovernanceService.getContract).mockImplementation(() => new Promise<never>(() => {}));
    vi.mocked(storyGovernanceService.getVersion).mockImplementation(() => new Promise<never>(() => {}));
    vi.mocked(storyGovernanceService.getTaskImpact).mockImplementation(() => new Promise<never>(() => {}));
    const issue = {
      id: "task-1",
      workspaceId: "workspace-id",
      key: "WRONG-1",
      title: "Task",
      description: "",
      type: "task",
      priority: "medium",
      status: "todo",
      columnId: "todo",
      rank: "a",
      storyContractId: "contract-1",
      storyVersionId: "version-1",
      requirementsState: "CURRENT",
      isArchived: false,
      isDeleted: false,
      createdAt: "",
      updatedAt: "",
    } as TaskDetailResponse;

    render(
      <QueryClientProvider client={new QueryClient()}>
        <TaskDetailMainContent
          issue={issue}
          workspaceId="workspace-id"
          canEditTask={false}
          localTitle="Task"
          setLocalTitle={vi.fn()}
          isEditingTitle={false}
          setIsEditingTitle={vi.fn()}
          activeTab="comments"
          setActiveTab={vi.fn()}
          workspaceMembers={[]}
          assigneeName=""
          onSaveTitle={vi.fn()}
          onSaveDescription={vi.fn()}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("link", { name: /open contract/i })).toHaveAttribute(
      "href",
      "/workspaces/TEAM-ALPHA/stories?contract=contract-1&section=versions&version=version-1",
    );
  });

  it("uses canonical owner/admin and member authority for Story impact", async () => {
    const issue = {
      id: "task-1",
      workspaceId: "workspace-id",
      key: "TEAM-ALPHA-1",
      title: "Task",
      description: "",
      type: "task",
      priority: "medium",
      status: "todo",
      columnId: "todo",
      rank: "a",
      assigneeId: "member-1",
      storyContractId: "contract-1",
      storyVersionId: "version-1",
      requirementsState: "REVIEW_REQUIRED",
      isArchived: false,
      isDeleted: false,
      createdAt: "",
      updatedAt: "",
    } as TaskDetailResponse;
    vi.mocked(storyGovernanceService.getContract).mockResolvedValue({ _id: "contract-1", key: "SC-1", title: "Contract" } as never);
    vi.mocked(storyGovernanceService.getVersion).mockResolvedValue({ _id: "version-1", versionNumber: 1 } as never);
    vi.mocked(storyGovernanceService.getTaskImpact).mockResolvedValue({
      _id: "impact-1",
      workspaceId: "workspace-id",
      taskId: "task-1",
      storyContractId: "contract-1",
      fromStoryVersionId: "version-0",
      toStoryVersionId: "version-1",
      affectedCriterionIds: [],
      requirementsState: "REVIEW_REQUIRED",
      state: "PENDING",
    });
    const renderContent = (user: { id: string; role?: string }) => render(
      <QueryClientProvider client={new QueryClient()}>
        <TaskDetailMainContent
          issue={issue}
          workspaceId="workspace-id"
          user={user}
          canEditTask
          localTitle="Task"
          setLocalTitle={vi.fn()}
          isEditingTitle={false}
          setIsEditingTitle={vi.fn()}
          activeTab="comments"
          setActiveTab={vi.fn()}
          workspaceMembers={[]}
          assigneeName=""
          onSaveTitle={vi.fn()}
          onSaveDescription={vi.fn()}
        />
      </QueryClientProvider>,
    );

    permissionState.role = "workspace_admin";
    permissionState.hasPermission.mockReturnValue(true);
    const ownerOrAdmin = renderContent({ id: "owner-1" });
    expect(await screen.findByRole("button", { name: "Resolve impact" })).toBeInTheDocument();
    ownerOrAdmin.unmount();

    permissionState.role = "member";
    renderContent({ id: "member-1", role: "user" });
    expect(await screen.findByRole("button", { name: "Resolve impact" })).toBeInTheDocument();
  });
});
