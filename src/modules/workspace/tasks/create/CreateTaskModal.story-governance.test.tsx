import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import CreateTaskModal from "./CreateTaskModal";

vi.mock("@/modules/story-governance/hooks/useStoryGovernance", () => ({
  useStoryGovernance: () => ({
    contracts: {
      data: [
        { _id: "approved", key: "ST-1", title: "Approved", status: "active", currentApprovedStoryVersionId: "v2" },
        { _id: "draft", key: "ST-2", title: "Draft only", status: "active" },
        { _id: "archived", key: "ST-3", title: "Archived", status: "archived", currentApprovedStoryVersionId: "v3" },
      ],
    },
  }),
}));
vi.mock("@/shared/components/StatusPicker", () => ({ default: () => null }));
vi.mock("@/shared/components/TypePicker", () => ({ default: () => null }));
vi.mock("@/shared/components/PriorityPicker", () => ({ default: () => null }));
vi.mock("@/shared/components/AssigneePicker", () => ({
  default: () => null,
  toAssigneePickerUsers: () => [],
}));

describe("CreateTaskModal Story pin", () => {
  afterEach(cleanup);
  it("uses the shared accessible dialog behavior", () => {
    const close = vi.fn();
    render(
      <CreateTaskModal
        showCreateIssue
        setShowCreateIssue={close}
        newIssueForm={{ title: "", status: "To Do" }}
        setNewIssueForm={vi.fn()}
        handleCreateIssue={vi.fn()}
        workspace={{ _id: "ws", key: "WS", name: "Workspace", members: [] }}
      />,
    );
    expect(screen.getByRole("dialog", { name: "Create new task" })).toHaveAttribute("aria-modal", "true");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(close).toHaveBeenCalledWith(false);
  });

  it("selects only an active approved Contract and its current immutable Version, then clears both", () => {
    let form = { title: "Task", type: "Task", priority: "Medium", status: "To Do", sprintId: null, assigneeId: "" };
    const setForm = vi.fn((next) => { form = next; });
    const { rerender } = render(
      <CreateTaskModal
        showCreateIssue
        setShowCreateIssue={vi.fn()}
        newIssueForm={form}
        setNewIssueForm={setForm}
        handleCreateIssue={vi.fn()}
        workspace={{ _id: "ws", key: "WS", name: "Workspace", members: [] }}
      />,
    );

    const selector = screen.getByLabelText("Story Contract");
    expect(screen.getByRole("option", { name: /ST-1/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /ST-2/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /ST-3/ })).not.toBeInTheDocument();

    fireEvent.change(selector, { target: { value: "approved" } });
    expect(setForm).toHaveBeenLastCalledWith(expect.objectContaining({
      storyContractId: "approved",
      storyVersionId: "v2",
    }));

    rerender(
      <CreateTaskModal
        showCreateIssue
        setShowCreateIssue={vi.fn()}
        newIssueForm={form}
        setNewIssueForm={setForm}
        handleCreateIssue={vi.fn()}
        workspace={{ _id: "ws", key: "WS", name: "Workspace", members: [] }}
      />,
    );
    expect(screen.getByText("Version v2 (current approved)")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Story Contract"), { target: { value: "" } });
    expect(setForm).toHaveBeenLastCalledWith(expect.objectContaining({
      storyContractId: undefined,
      storyVersionId: undefined,
    }));
  });
});
