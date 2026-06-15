export type TaskStatusColumn = {
  id: string;
  name: string;
  order?: number;
  mappedStatuses?: string[];
  isDone?: boolean;
};

const FALLBACK_STATUS_COLUMNS: TaskStatusColumn[] = [
  { id: "todo", name: "To Do", order: 0, mappedStatuses: ["To Do"] },
  { id: "inprogress", name: "In Progress", order: 1, mappedStatuses: ["In Progress"] },
  { id: "done", name: "Done", order: 2, mappedStatuses: ["Done"], isDone: true },
];

const matchesColumn = (column: TaskStatusColumn, value?: string | null) => {
  if (!value) return false;
  return (
    column.id === value ||
    column.name === value ||
    column.mappedStatuses?.includes(value) ||
    column.mappedStatuses?.some((status) => status.toLowerCase() === value.toLowerCase())
  );
};

export const getTaskStatusColumns = (
  columns?: TaskStatusColumn[] | null,
): TaskStatusColumn[] => {
  const source = columns && columns.length > 0 ? columns : FALLBACK_STATUS_COLUMNS;

  return [...source].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

export const resolveTaskStatusColumn = (
  columns: TaskStatusColumn[] | undefined | null,
  issue: { columnId?: string | null; status?: string | null },
) => {
  const statusColumns = getTaskStatusColumns(columns);
  const resolved =
    statusColumns.find((column) => matchesColumn(column, issue.columnId)) ??
    statusColumns.find((column) => matchesColumn(column, issue.status));

  return {
    statusColumns,
    currentColumn: resolved,
    displayName: resolved?.name ?? issue.status ?? issue.columnId ?? "No status",
  };
};

export const buildTaskStatusSelection = (
  column: TaskStatusColumn,
  current?: { columnId?: string; status?: string }
) => {
  if (current?.columnId) return current;
  return {
    columnId: column.id,
    status: column.mappedStatuses?.[0] ?? column.name,
  };
};

