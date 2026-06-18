export interface Filters {
  search: string;
  assigneeId: string | null;
  reporterId: string | null;
  taskKey?: string | null;
  workspaceKey?: string | null;
  workspaceKeys?: string[];
  lastUpdated?: string | null;
  priority: string | null;
  type: string | null;
  assignees: string[];
  types: string[];
  statuses: string[];
  priorities: string[];
  backlog?: boolean;
  archived?: boolean;
}

export interface TaskFilters {
  status?: string[];
  columnId?: string;
  sprintId?: string;
  assigneeId?: string | string[];
  reporterId?: string | string[];
  type?: string | string[];
  priority?: string | string[];
  labelIds?: string | string[];
  taskKey?: string;
  search?: string;
  backlog?: boolean;
  archived?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type BoardTaskFilters = TaskFilters;
