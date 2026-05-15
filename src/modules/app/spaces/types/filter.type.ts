export interface Filters {
  search: string;

  // quick filters
  assigneeId: string | null;
  priority: string | null;

  // multi filters
  assignees: string[];
  types: string[];
  statuses: string[];
}