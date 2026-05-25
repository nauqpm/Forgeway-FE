import { Issue } from "../types/issue.type";
import { Filters } from "../types/filter.type";
import { Workspace } from "../types/workspace.type";

export const filterIssues = (
  issues: Issue[],
  filters: Filters,
  workspace: Workspace | null
) => {
  if (!workspace) return [];

  return issues.filter((issue) => {
    const search = filters.search.toLowerCase();

    const matchSearch =
      issue.title.toLowerCase().includes(search) ||
      issue.key.toLowerCase().includes(search);

    // Board quick filters
    const matchAssigneeQuick = filters.assigneeId
      ? issue.assignee === filters.assigneeId
      : true;

    const matchPriorityQuick = filters.priority
      ? issue.priority === filters.priority
      : true;

    // Backlog multi-filters
    const matchAssignees =
      filters.assignees.length > 0
        ? filters.assignees.includes(issue.assignee)
        : true;

    const matchTypes =
      filters.types.length > 0
        ? filters.types.includes(issue.type)
        : true;

    const matchStatuses =
      filters.statuses.length > 0
        ? filters.statuses.includes(issue.status)
        : true;

    return (
      matchSearch &&
      matchAssigneeQuick &&
      matchPriorityQuick &&
      matchAssignees &&
      matchTypes &&
      matchStatuses
    );
  });
};
