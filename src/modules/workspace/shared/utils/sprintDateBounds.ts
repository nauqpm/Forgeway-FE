import { format, isAfter, isBefore, parseISO } from "date-fns";

export type SprintDateBounds = {
  sprintName?: string;
  sprintStartDate?: string;
  sprintEndDate?: string;
};

export function formatSprintDate(dateKey: string): string {
  return format(parseISO(dateKey), "yyyy-MM-dd");
}

export function getSprintBoundaryMessage(bounds: SprintDateBounds): string {
  const name = bounds.sprintName ? ` "${bounds.sprintName}"` : "";
  if (bounds.sprintEndDate) {
    return `Sprint${name} ends on ${formatSprintDate(bounds.sprintEndDate)}. This task cannot be moved beyond that date.`;
  }
  if (bounds.sprintStartDate) {
    return `Sprint${name} starts on ${formatSprintDate(bounds.sprintStartDate)}. This task cannot be moved outside the sprint.`;
  }
  return "This task cannot be moved outside the sprint dates.";
}

export function getSprintDateBoundViolation(
  startDate: string,
  endDate: string,
  bounds: SprintDateBounds,
): string | null {
  if (
    bounds.sprintStartDate &&
    isBefore(parseISO(startDate), parseISO(bounds.sprintStartDate))
  ) {
    return `Sprint${bounds.sprintName ? ` "${bounds.sprintName}"` : ""} starts on ${formatSprintDate(bounds.sprintStartDate)}. This task cannot be moved before that date.`;
  }

  if (
    bounds.sprintEndDate &&
    isAfter(parseISO(endDate), parseISO(bounds.sprintEndDate))
  ) {
    return getSprintBoundaryMessage(bounds);
  }

  return null;
}
