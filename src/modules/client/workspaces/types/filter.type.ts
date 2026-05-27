export interface Filters {
  search: string;
  assigneeId: string | null;
  reporterId: string | null;
  priority: string | null;
  type: string | null;
  assignees: string[];
  types: string[];
  statuses: string[];
  priorities: string[];
  backlog?: boolean;
  archived?: boolean;
}

export interface BoardTaskFilters {
  status?: string[];
  columnId?: string;
  sprintId?: string;
  assigneeId?: string | string[];
  reporterId?: string | string[];
  type?: string | string[];
  priority?: string | string[];
  search?: string;
  backlog?: boolean;
  archived?: boolean;
  page?: number;
  limit?: number;
}