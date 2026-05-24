import { DropResult } from "@hello-pangea/dnd";
import { Issue } from "../types/issue.type";
import { BoardColumn } from "../types/board.type";

interface HandleBoardDragParams {
  result: DropResult;
  columns: BoardColumn[];
  issues: Issue[];
  setColumns: React.Dispatch<React.SetStateAction<BoardColumn[]>>;
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  handleMoveColumn?: (columnId: string, newOrder: number) => void;
}

interface HandleBacklogDragParams {
  result: DropResult;
  issues: Issue[];
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  onSprintAssign?: (taskId: string, sprintId: string | null) => void;
}

export const handleBoardDragEnd = ({
  result,
  columns,
  issues,
  setColumns,
  setIssues,
  handleMoveColumn,
}: HandleBoardDragParams) => {
  const { destination, source, draggableId, type } = result;

  if (!destination) return;

  // Drag column
  if (type === "column") {
    if (source.index === destination.index) return;

    const newColumns = Array.from(columns);
    const [removed] = newColumns.splice(source.index, 1);
    newColumns.splice(destination.index, 0, removed);

    // Re-assign order based on new position
    const reorderedColumns = newColumns.map((col, idx) => ({
      ...col,
      order: idx,
    }));

    setColumns(reorderedColumns);

    if (handleMoveColumn) {
      handleMoveColumn(draggableId.replace("col-", ""), destination.index);
    }

    return;
  }

  // Drag task
  if (type === "task") {
    const sourceStatus = source.droppableId;
    const destStatus = destination.droppableId;

    const draggedIssueIndex = issues.findIndex(
      (i) => i.id === draggableId
    );

    if (draggedIssueIndex === -1) return;

    const draggedIssue = issues[draggedIssueIndex];

    const newIssues = Array.from(issues);

    // Reorder same column
    if (sourceStatus === destStatus) {
      if (source.index === destination.index) return;

      const columnIssues = newIssues.filter(
        (i) => i.status === sourceStatus
      );

      const targetIssue = columnIssues[destination.index];

      newIssues.splice(draggedIssueIndex, 1);

      const targetIndex = newIssues.findIndex(
        (i) => i.id === targetIssue?.id
      );

      newIssues.splice(
        targetIndex !== -1 ? targetIndex : newIssues.length,
        0,
        draggedIssue
      );
    } else {
      // Move different column
      const columnIssues = newIssues.filter(
        (i) => i.status === destStatus
      );

      const targetIssue = columnIssues[destination.index];

      newIssues.splice(draggedIssueIndex, 1);

      const newIssue = {
        ...draggedIssue,
        status: destStatus,
      };

      const targetIndex = newIssues.findIndex(
        (i) => i.id === targetIssue?.id
      );

      newIssues.splice(
        targetIndex !== -1 ? targetIndex : newIssues.length,
        0,
        newIssue
      );
    }

    setIssues(newIssues);
  }
};

export const handleBacklogDragEnd = ({
  result,
  issues,
  setIssues,
  onSprintAssign,
}: HandleBacklogDragParams) => {
  const { destination, source, draggableId } = result;

  if (!destination) return;

  if (
    source.droppableId === destination.droppableId &&
    source.index === destination.index
  ) {
    return;
  }

  const newIssues = Array.from(issues);

  const draggedIssueIndex = newIssues.findIndex(
    (i) => i.id === draggableId
  );

  if (draggedIssueIndex === -1) return;

  const draggedIssue = newIssues[draggedIssueIndex];
  const previousSprintId = draggedIssue.sprintId ?? null;

  let targetSprintId: string | null = null;

  if (destination.droppableId.startsWith("sprint-")) {
    targetSprintId = destination.droppableId.replace(
      "sprint-",
      ""
    );
  }

  const sourceIssues = newIssues.filter((i) =>
    source.droppableId === "backlog"
      ? i.sprintId === null
      : i.sprintId ===
        source.droppableId.replace("sprint-", "")
  );

  const destIssues = newIssues.filter((i) =>
    destination.droppableId === "backlog"
      ? i.sprintId === null
      : i.sprintId ===
        destination.droppableId.replace("sprint-", "")
  );

  let movedTask: Issue | null = null;

  // Same list reorder
  if (source.droppableId === destination.droppableId) {
    const targetIssue = sourceIssues[destination.index];

    newIssues.splice(draggedIssueIndex, 1);

    const targetIndex = newIssues.findIndex(
      (i) => i.id === targetIssue?.id
    );

    newIssues.splice(
      targetIndex !== -1 ? targetIndex : newIssues.length,
      0,
      draggedIssue
    );
  } else {
    // Move other sprint
    const targetIssue = destIssues[destination.index];

    newIssues.splice(draggedIssueIndex, 1);

    const newIssue = {
      ...draggedIssue,
      sprintId: targetSprintId,
    };

    movedTask = newIssue;

    const targetIndex = newIssues.findIndex(
      (i) => i.id === targetIssue?.id
    );

    newIssues.splice(
      targetIndex !== -1 ? targetIndex : newIssues.length,
      0,
      newIssue
    );
  }

  setIssues(newIssues);

  if (onSprintAssign && movedTask && movedTask.sprintId !== previousSprintId) {
    onSprintAssign(movedTask.id, movedTask.sprintId ?? null);
  }
};