import { addDays, format } from "date-fns";
import type { Issue } from "@/modules/workspace/shared/types/issue.type";
import type { Sprint } from "@/modules/workspace/shared/types/sprint.type";
import { normalizeDate } from "@/modules/workspace/shared/utils/dateUtils";

export type TimelineRowKind = "sprint" | "epic" | "task" | "section";

export interface TimelineRow {
  id: string;
  kind: TimelineRowKind;
  originalId: string;
  title: string;
  startDate: string;
  endDate: string;
  barColor: string;
  canInteract: boolean;
  indent: number;
  meta: Issue | Sprint | null;
  sprintName?: string;
  sprintStartDate?: string;
  sprintEndDate?: string;
}

export interface BuildTimelineRowsInput {
  issues: Issue[];
  sprints: Sprint[];
  collapsed: Set<string>;
  today?: string;
  canMoveTask?: boolean;
}

const DATE_FORMAT = "yyyy-MM-dd";


function addDateDays(dateKey: string, days: number): string {
  return format(addDays(new Date(`${dateKey}T00:00:00`), days), DATE_FORMAT);
}

function fallbackEnd(start: string): string {
  return addDateDays(start, 3);
}

function getIssueId(issue: Issue): string {
  return issue.id || issue._id || "";
}

function getEpicId(issue: Issue): string | undefined {
  return (issue as Issue & { epicId?: string }).epicId ?? issue.epic ?? undefined;
}

function getIssueEndDate(issue: Issue): string | undefined {
  return normalizeDate(issue.dueDate);
}

function getSprintId(issue: Issue): string | undefined {
  return issue.sprintId ?? undefined;
}

function getScheduledDates(issue: Issue, sprint?: Sprint): { startDate: string; endDate: string } | null {
  const sprintStart = normalizeDate(sprint?.startDate);
  const sprintEnd = normalizeDate(sprint?.endDate);
  const issueStart = normalizeDate(issue.startDate);
  const issueEnd = getIssueEndDate(issue);
  if (!issueStart && !issueEnd) return null;

  const startDate = issueStart ?? sprintStart ?? issueEnd;
  const endDate = issueEnd ?? sprintEnd ?? (startDate ? fallbackEnd(startDate) : undefined);

  if (!startDate || !endDate) return null;
  return { startDate, endDate };
}

function barColor(kind: TimelineRowKind, issue?: Issue): string {
  if (kind === "sprint") return "#4338ca";
  if (kind === "epic") return "#7c3aed";
  if (kind === "section") return "#9ca3af";
  const status = issue?.status?.toLowerCase() ?? "";
  const type = issue?.type?.toLowerCase() ?? "";
  if (status.includes("done")) return "#10b981";
  if (type === "bug") return "#ef4444";
  if (type === "story") return "#f97316";
  return "#6366f1";
}

function taskRow(
  issue: Issue,
  startDate: string,
  endDate: string,
  indent: number,
  canMoveTask: boolean,
  sprint?: Sprint,
): TimelineRow {
  const id = getIssueId(issue);
  return {
    id: `task-${id}`,
    kind: "task",
    originalId: id,
    title: issue.title,
    startDate,
    endDate,
    barColor: barColor("task", issue),
    canInteract: canMoveTask && !issue.isArchived,
    indent,
    meta: issue,
    sprintName: sprint?.name,
    sprintStartDate: normalizeDate(sprint?.startDate),
    sprintEndDate: normalizeDate(sprint?.endDate),
  };
}

function isScheduledSprintTask(issue: Issue, sprintById: Map<string, Sprint>): boolean {
  const sprintId = getSprintId(issue);
  if (!sprintId) return false;
  return Boolean(getScheduledDates(issue, sprintById.get(sprintId)));
}

function isScheduledKanbanTask(issue: Issue): boolean {
  return !getSprintId(issue) && Boolean(getScheduledDates(issue));
}

function isScheduledTimelineIssue(
  issue: Issue,
  sprintById: Map<string, Sprint>,
  hasSprintPlanning: boolean,
): boolean {
  return hasSprintPlanning
    ? isScheduledSprintTask(issue, sprintById)
    : isScheduledKanbanTask(issue);
}

export function buildTimelineRows({
  issues,
  sprints,
  collapsed,
  today = format(new Date(), DATE_FORMAT),
  canMoveTask = true,
}: BuildTimelineRowsInput): TimelineRow[] {
  const rows: TimelineRow[] = [];
  const sprintById = new Map(
    sprints
      .map((sprint) => [sprint.id ?? sprint._id, sprint] as const)
      .filter(([id]) => Boolean(id)),
  );
  const seen = new Set<string>();
  const uniqueIssues = issues.filter((issue) => {
    const id = getIssueId(issue);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  const hasSprintPlanning = sprintById.size > 0;
  const scheduledIssues = uniqueIssues.filter((issue) =>
    isScheduledTimelineIssue(issue, sprintById, hasSprintPlanning),
  );

  const epics = uniqueIssues.filter((issue) => issue.type?.toLowerCase() === "epic");
  const epicSet = new Set(epics.map(getIssueId));
  const epicChildren = new Map<string, Issue[]>(epics.map((epic) => [getIssueId(epic), []]));
  const standalones: Issue[] = [];

  for (const issue of scheduledIssues) {
    if (issue.type?.toLowerCase() === "epic") continue;
    const epicId = getEpicId(issue);
    if (epicId && epicSet.has(epicId)) {
      epicChildren.get(epicId)?.push(issue);
    } else {
      standalones.push(issue);
    }
  }

  for (const sprint of sprints) {
    const sprintId = sprint.id ?? sprint._id;
    if (!sprintId) continue;
    const sprintTasks = standalones.filter((issue) => getSprintId(issue) === sprintId);
    for (const issue of sprintTasks) {
      const dates = getScheduledDates(issue, sprint);
      if (!dates) continue;
      const { startDate, endDate } = dates;
      rows.push(taskRow(issue, startDate, endDate, 0, canMoveTask, sprint));
    }
  }

  if (!hasSprintPlanning) {
    for (const issue of standalones) {
      const dates = getScheduledDates(issue);
      if (!dates) continue;
      rows.push(taskRow(issue, dates.startDate, dates.endDate, 0, canMoveTask));
    }
  }

  for (const epic of epics) {
    const epicId = getIssueId(epic);
    const children = epicChildren.get(epicId) ?? [];
    const epicSprintId = getSprintId(epic);
    const epicSprint = epicSprintId ? sprintById.get(epicSprintId) : undefined;
    const hasScheduledEpicDates = isScheduledTimelineIssue(epic, sprintById, hasSprintPlanning);
    if (!children.length && !hasScheduledEpicDates) continue;
    const starts = children.map((child) => normalizeDate(child.startDate)).filter(Boolean).sort() as string[];
    const ends = children.map((child) => getIssueEndDate(child)).filter(Boolean).sort().reverse() as string[];
    const epicDates = getScheduledDates(epic, epicSprint);
    const startDate = epicDates?.startDate ?? starts[0] ?? today;
    const endDate = epicDates?.endDate ?? ends[0] ?? startDate;
    const rowId = `epic-${epicId}`;

    rows.push({
      id: rowId,
      kind: "epic",
      originalId: epicId,
      title: epic.title,
      startDate,
      endDate,
      barColor: barColor("epic"),
      canInteract: canMoveTask && !epic.isArchived,
      indent: 0,
      meta: epic,
    });

    if (!collapsed.has(rowId)) {
      for (const issue of children) {
        const sprintId = getSprintId(issue);
        const sprint = sprintId ? sprintById.get(sprintId) : undefined;
        const childDates = getScheduledDates(issue, sprint);
        if (!childDates) continue;
        rows.push(taskRow(issue, childDates.startDate, childDates.endDate, 1, canMoveTask, sprint));
      }
    }
  }

  return rows;
}
