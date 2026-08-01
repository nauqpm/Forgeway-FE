import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";

import { taskService } from "../services/taskService";
import type { Issue } from "../types/issue.type";
import { useDragHandlers } from "./useDragHandlers";

vi.mock("../services/taskService", () => ({
  taskService: {
    updateBoardTask: vi.fn(),
    moveBoardTask: vi.fn(),
  },
}));

describe("useDragHandlers", () => {
  it("persists a sprint move exactly once through the shared reorder path", () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const syncTaskReorder = vi.fn();
    const issue = {
      id: "task-1",
      key: "TEAM-1",
      columnId: "todo",
      sprintId: null,
      rank: "a",
    } as Issue;
    vi.mocked(taskService.updateBoardTask).mockResolvedValue(issue);
    const { result } = renderHook(
      () =>
        useDragHandlers({
          workspaceId: "workspace-id",
          filteredIssues: [issue],
          columns: [],
          setIssues: vi.fn(),
          setColumns: vi.fn(),
          syncTaskReorder,
          patchSelectedTaskView: vi.fn(),
          isDraggingIssueRef: { current: true },
          handleMoveColumn: vi.fn(),
          canMoveTask: true,
        }),
      { wrapper },
    );

    act(() => {
      result.current.handleBacklogDragEndWithSync({
        draggableId: "task-1",
        type: "task",
        source: { droppableId: "backlog", index: 0 },
        destination: { droppableId: "sprint-sprint-1", index: 0 },
        reason: "DROP",
        mode: "FLUID",
        combine: null,
      });
    });

    expect(syncTaskReorder).toHaveBeenCalledOnce();
    expect(taskService.updateBoardTask).not.toHaveBeenCalled();
  });
});
