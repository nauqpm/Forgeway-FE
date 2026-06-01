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
  onColumnChange?: (taskId: string, columnId: string) => void;
  onTaskReorder?: (input: TaskReorderSyncInput) => void;
}

interface HandleBacklogDragParams {
  result: DropResult;
  issues: Issue[];
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  onSprintAssign?: (taskId: string, sprintId: string | null) => void;
  onTaskReorder?: (input: TaskReorderSyncInput) => void;
}

export interface TaskReorderSyncInput {
  taskId: string;
  columnId?: string;
  status?: string;
  sprintId?: string | null;
  beforeTaskId?: string;
  afterTaskId?: string;
}

const RANK_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const MIN_RANK_DIGIT = 0;
const MAX_RANK_DIGIT = RANK_ALPHABET.length - 1;
const DEFAULT_RANK = RANK_ALPHABET[Math.floor(RANK_ALPHABET.length / 2)];

const compareRanks = (left?: string, right?: string) => {
  if (left && !right) return -1;
  if (!left && right) return 1;
  if (!left && !right) return 0;

  const leftRank = left!;
  const rightRank = right!;
  const maxLength = Math.max(leftRank.length, rightRank.length);

  for (let index = 0; index < maxLength; index += 1) {
    const diff =
      getRankDigit(leftRank, index, MIN_RANK_DIGIT) -
      getRankDigit(rightRank, index, MIN_RANK_DIGIT);

    if (diff !== 0) return diff;
  }

  return leftRank.length - rightRank.length;
};

export const compareIssueRank = (a: Issue, b: Issue) => {
  const rankDiff = compareRanks(a.rank, b.rank);
  if (rankDiff !== 0) return rankDiff;
  return (a.createdAt ?? a.id).localeCompare(b.createdAt ?? b.id);
};

const getRankDigit = (rank: string, index: number, fallback: number) => {
  if (index >= rank.length) return fallback;

  const digit = RANK_ALPHABET.indexOf(rank[index]);
  return digit === -1 ? fallback : digit;
};

const generateOptimisticRankBetween = (beforeRank?: string, afterRank?: string) => {
  if (!beforeRank && !afterRank) return DEFAULT_RANK;

  let prefix = "";
  let index = 0;

  while (true) {
    const lowerDigit = afterRank
      ? getRankDigit(afterRank, index, MIN_RANK_DIGIT)
      : MIN_RANK_DIGIT;
    const upperDigit = beforeRank
      ? getRankDigit(beforeRank, index, MAX_RANK_DIGIT)
      : MAX_RANK_DIGIT;

    if (upperDigit - lowerDigit > 1) {
      return `${prefix}${RANK_ALPHABET[Math.floor((lowerDigit + upperDigit) / 2)]}`;
    }

    prefix += RANK_ALPHABET[lowerDigit];
    index += 1;
  }
};

const getOrderedColumnIssues = (issues: Issue[], columnId: string) =>
  issues
    .filter((issue) => issue.columnId === columnId)
    .sort(compareIssueRank);

const getOrderedSprintIssues = (issues: Issue[], droppableId: string) =>
  issues
    .filter((issue) =>
      droppableId === "backlog"
        ? issue.sprintId === null
        : issue.sprintId === droppableId.replace("sprint-", ""),
    )
    .sort(compareIssueRank);

const getTaskNeighbors = (tasks: Issue[], taskId: string): Pick<TaskReorderSyncInput, "beforeTaskId" | "afterTaskId"> => {
  const index = tasks.findIndex((task) => task.id === taskId);
  if (index === -1) return {};

  return {
    afterTaskId: tasks[index - 1]?.id,
    beforeTaskId: tasks[index + 1]?.id,
  };
};

const areSameNeighbors = (
  current: Pick<TaskReorderSyncInput, "beforeTaskId" | "afterTaskId">,
  next: Pick<TaskReorderSyncInput, "beforeTaskId" | "afterTaskId">,
) => current.beforeTaskId === next.beforeTaskId && current.afterTaskId === next.afterTaskId;

export const handleBoardDragEnd = ({
  result,
  columns,
  issues,
  setColumns,
  setIssues,
  handleMoveColumn,
  onColumnChange,
  onTaskReorder,
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

    const sourceColumnIssues = getOrderedColumnIssues(issues, sourceStatus);
    const sourceIssueIndex = sourceColumnIssues.findIndex(
      (issue) => issue.id === draggableId,
    );

    if (sourceStatus === destStatus && sourceIssueIndex === destination.index) return;

    const currentNeighbors = getTaskNeighbors(sourceColumnIssues, draggableId);

    const draggedIssue = issues.find((issue) => issue.id === draggableId);

    if (!draggedIssue) return;

    const destinationIssuesWithoutDragged =
      (sourceStatus === destStatus
        ? sourceColumnIssues
        : getOrderedColumnIssues(issues, destStatus)
      ).filter((issue) => issue.id !== draggableId);
    const insertIndex = Math.min(destination.index, destinationIssuesWithoutDragged.length);
    const movedIssue: Issue = {
      ...draggedIssue,
      columnId: destStatus,
      status: destStatus,
    };
    const destinationIssues = [...destinationIssuesWithoutDragged];
    destinationIssues.splice(insertIndex, 0, movedIssue);
    const neighbors = getTaskNeighbors(destinationIssues, draggableId);

    if (sourceStatus === destStatus && areSameNeighbors(currentNeighbors, neighbors)) return;

    const beforeIssue = destinationIssues.find((issue) => issue.id === neighbors.beforeTaskId);
    const afterIssue = destinationIssues.find((issue) => issue.id === neighbors.afterTaskId);
    const optimisticMovedIssue = {
      ...movedIssue,
      rank: generateOptimisticRankBetween(beforeIssue?.rank, afterIssue?.rank),
    };

    setIssues((current) =>
      current.map((issue) =>
        issue.id === draggableId ? optimisticMovedIssue : issue,
      ),
    );

    if (onTaskReorder) {
      onTaskReorder({
        taskId: draggableId,
        columnId: destStatus,
        status: destStatus,
        sprintId: movedIssue.sprintId ?? null,
        ...neighbors,
      });
      return;
    }

    if (onColumnChange && sourceStatus !== destStatus) {
      onColumnChange(draggableId, destStatus);
    }
  }
};

export const handleBacklogDragEnd = ({
  result,
  issues,
  setIssues,
  onSprintAssign,
  onTaskReorder,
}: HandleBacklogDragParams) => {
  const { destination, source, draggableId } = result;

  if (!destination) return;

  const sourceIssues = getOrderedSprintIssues(issues, source.droppableId);
  const sourceIssueIndex = sourceIssues.findIndex(
    (issue) => issue.id === draggableId,
  );
  const currentNeighbors = getTaskNeighbors(sourceIssues, draggableId);

  if (
    source.droppableId === destination.droppableId &&
    sourceIssueIndex === destination.index
  ) {
    return;
  }

  const draggedIssue = issues.find((issue) => issue.id === draggableId);

  if (!draggedIssue) return;
  const previousSprintId = draggedIssue.sprintId ?? null;

  let targetSprintId: string | null = null;

  if (destination.droppableId.startsWith("sprint-")) {
    targetSprintId = destination.droppableId.replace(
      "sprint-",
      ""
    );
  }

  const destinationIssuesWithoutDragged =
    (source.droppableId === destination.droppableId
      ? sourceIssues
      : getOrderedSprintIssues(issues, destination.droppableId)
    ).filter((issue) => issue.id !== draggableId);
  const insertIndex = Math.min(destination.index, destinationIssuesWithoutDragged.length);
  const movedTask: Issue = {
    ...draggedIssue,
    sprintId: targetSprintId,
  };
  const destinationIssues = [...destinationIssuesWithoutDragged];
  destinationIssues.splice(insertIndex, 0, movedTask);
  const neighbors = getTaskNeighbors(destinationIssues, draggableId);

  if (
    source.droppableId === destination.droppableId &&
    areSameNeighbors(currentNeighbors, neighbors)
  ) {
    return;
  }
  const beforeIssue = destinationIssues.find((issue) => issue.id === neighbors.beforeTaskId);
  const afterIssue = destinationIssues.find((issue) => issue.id === neighbors.afterTaskId);
  const optimisticMovedTask = {
    ...movedTask,
    rank: generateOptimisticRankBetween(beforeIssue?.rank, afterIssue?.rank),
  };

  setIssues((current) =>
    current.map((issue) =>
      issue.id === draggableId ? optimisticMovedTask : issue,
    ),
  );

  if (onTaskReorder) {
    onTaskReorder({
      taskId: optimisticMovedTask.id,
      columnId: optimisticMovedTask.columnId,
      status: optimisticMovedTask.columnId,
      sprintId: optimisticMovedTask.sprintId ?? null,
      ...neighbors,
    });
    return;
  }

  if (onSprintAssign && optimisticMovedTask.sprintId !== previousSprintId) {
    onSprintAssign(optimisticMovedTask.id, optimisticMovedTask.sprintId ?? null);
  }
};
