import { Issue } from "../types/issue.type";
import { Filters } from "../types/filter.type";
import { Workspace } from "../types/workspace.type";

const normalizeSearch = (value: string) => value.trim().toLowerCase();

const normalizeCompactSearch = (value: string) =>
  normalizeSearch(value).replace(/[^a-z0-9]/g, "");

const getAssigneeFilterValue = (issue: Issue) => issue.assigneeId || issue.assignee || "U";

const matchesTaskSearch = (issue: Issue, searchValue: string) => {
  const search = normalizeSearch(searchValue);
  if (!search) return true;

  const compactSearch = normalizeCompactSearch(search);
  const exactTaskKey = /^[a-z][a-z0-9]*-\d+$/i.test(search);
  const key = normalizeSearch(issue.key);
  const title = normalizeSearch(issue.title);
  const description = normalizeSearch(issue.description ?? "");

  if (exactTaskKey) return key === search;

  if (search.length === 1) {
    return (
      key.includes(search) ||
      title.includes(search) ||
      normalizeCompactSearch(issue.key).includes(compactSearch) ||
      normalizeCompactSearch(issue.title).includes(compactSearch)
    );
  }

  return (
    key.includes(search) ||
    title.includes(search) ||
    description.includes(search) ||
    normalizeCompactSearch(issue.key).includes(compactSearch) ||
    normalizeCompactSearch(issue.title).includes(compactSearch) ||
    normalizeCompactSearch(issue.description ?? "").includes(compactSearch)
  );
};

export const filterTasks = (
  issues: Issue[],
  filters: Filters,
  workspace: Workspace | null
) => {
  if (!workspace) return [];

  return issues.filter((issue) => {
    const matchSearch = matchesTaskSearch(issue, filters.search);

    // Board quick filters
    const matchAssigneeQuick = filters.assigneeId
      ? getAssigneeFilterValue(issue) === filters.assigneeId
      : true;

    const matchPriorityQuick = filters.priority
      ? issue.priority === filters.priority
      : true;

    // Backlog multi-filters
    const matchAssignees =
      filters.assignees.length > 0
        ? filters.assignees.includes(getAssigneeFilterValue(issue))
        : true;

    const matchTypes =
      filters.types.length > 0
        ? filters.types.includes(issue.type)
        : true;

    const matchStatuses =
      filters.statuses.length > 0
        ? filters.statuses.includes(issue.status)
        : true;

    const matchPriorities =
      filters.priorities.length > 0
        ? filters.priorities.includes(issue.priority)
        : true;

    return (
      matchSearch &&
      matchAssigneeQuick &&
      matchPriorityQuick &&
      matchAssignees &&
      matchTypes &&
      matchStatuses &&
      matchPriorities
    );
  });
};
